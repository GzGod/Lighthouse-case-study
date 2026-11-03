/**
 * GET /api/projects/:slug/enrichment
 * Returns enrichment data for a project: token market data, campaign metrics,
 * social volume, campaign time series, before/after metrics.
 */
'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../auth');

module.exports = function mount(pool) {
  // POST /api/enrichment/run — manual trigger for the enrichment worker
  router.post('/run', authMiddleware, async (req, res) => {
    try {
      const { runEnrichment, resolveAnonymousCampaigns } = require('../enrichment-worker');
      res.json({ ok: true, message: 'Enrichment and anon resolution started in background' });
      runEnrichment(pool).catch(e => console.error('[enrichment] manual run error:', e.message));
      resolveAnonymousCampaigns(pool).catch(e => console.error('[enrichment] anon resolve error:', e.message));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/enrichment/debug-anon — probe anonymous campaigns in source DB
  // GET /api/enrichment/debug-pending — check pending_campaign_names table state
  router.get('/debug-pending', authMiddleware, async (req, res) => {
    try {
      const { rows: tableCheck } = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema='public' AND table_name='pending_campaign_names'
        ) as exists
      `);
      const tableExists = tableCheck[0]?.exists;
      if (!tableExists) return res.json({ tableExists: false });
      const { rows: counts } = await pool.query(
        `SELECT resolved_by, COUNT(*) FROM pending_campaign_names GROUP BY resolved_by`);
      const { rows: total } = await pool.query(`SELECT COUNT(*) FROM pending_campaign_names`);
      const { rows: sample } = await pool.query(`SELECT * FROM pending_campaign_names LIMIT 5`);
      res.json({ tableExists: true, total: total[0]?.count, byStatus: counts, sample });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/enrichment/debug-anon-run — directly run anon resolution and INSERT into pending_campaign_names
  router.post('/debug-anon-run', authMiddleware, async (req, res) => {
    try {
      const { resolveAnonymousCampaigns } = require('../enrichment-worker');
      // Run inline (not background) so we can see errors
      await resolveAnonymousCampaigns(pool);
      // Then check what landed
      const { rows: total } = await pool.query(`SELECT COUNT(*) FROM pending_campaign_names`);
      const { rows: byStatus } = await pool.query(`SELECT resolved_by, COUNT(*) FROM pending_campaign_names GROUP BY resolved_by`);
      res.json({ ok: true, total: total[0]?.count, byStatus });
    } catch (e) { res.status(500).json({ error: e.message, stack: e.stack?.slice(0, 800) }); }
  });


  router.get('/debug-anon', authMiddleware, async (req, res) => {
    try {
      const { Pool } = require('pg');
      const cs = process.env.LIGHTHOUSE_SOURCE_DATABASE_URL || process.env.SOURCE_DATABASE_URL || '';
      if (!cs) return res.json({ error: 'no source DB URL', sourceConnected: false });
      const normalized = cs.replace(/([?&])sslmode=[^&]+&?/i, '$1').replace(/[?&]$/, '');
      const srcPool = new Pool({ connectionString: normalized, ssl: { rejectUnauthorized: false }, max: 1 });

      // Check columns on both tables
      const { rows: ucCols } = await srcPool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='unified_campaigns' ORDER BY column_name`);
      const { rows: ucpCols } = await srcPool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='unified_campaign_participants' ORDER BY column_name`);

      const uc = ucCols.map(r => r.column_name);
      const ucp = ucpCols.map(r => r.column_name);

      // Sample 3 anonymous campaigns with their signals
      const { rows: sample } = await srcPool.query(`
        SELECT id, "projectName", "tweetAuthorHandle", "requiredHashtags", "requiredMentions", "targetUsername",
               "consumedBudget", "totalBudget", status
        FROM unified_campaigns
        WHERE status = 'ENDED'
          AND ("projectName" IS NULL OR "projectName" = '')
          AND COALESCE("consumedBudget"::numeric, 0) > 0
        LIMIT 5
      `);

      // Count status values
      const { rows: statusRows } = await srcPool.query(
        `SELECT status, COUNT(*) FROM unified_campaigns GROUP BY status ORDER BY count DESC LIMIT 8`);

      await srcPool.end();
      res.json({ uc_cols: uc, ucp_cols: ucp, statusValues: statusRows, anonSample: sample });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/projects/:slug/enrichment', async (req, res) => {
    const slug = req.params.slug;
    try {
      const { rows } = await pool.query(
        `SELECT * FROM project_enrichment WHERE slug = $1`,
        [slug]
      );
      if (!rows.length) return res.json({ available: false });
      const r = rows[0];

      // Compute derived insights
      const hasToken = !!r.has_token || !!r.token_price_usd || !!r.gate_price || !!r.dex_price;
      const insights = {
        // ROI proxy: budget → impressions/engagement
        cpm: r.during_views > 0 && r.consumed_budget > 0
          ? +(r.consumed_budget / r.during_views * 1000).toFixed(2)
          : null,
        cpe: r.during_engagement > 0 && r.consumed_budget > 0
          ? +(r.consumed_budget / r.during_engagement).toFixed(2)
          : null,
        er: r.during_views > 0
          ? +(r.during_engagement / r.during_views * 100).toFixed(2)
          : null,
      };

      res.json({
        available: true,
        slug: r.slug,
        project_name: r.project_name,
        twitter_handle: r.twitter_handle,
        has_token: hasToken,
        token_symbol: r.token_symbol,

        token: hasToken ? {
          price_usd: r.token_price_usd || r.gate_price || r.dex_price,
          market_cap: r.token_market_cap,
          volume_24h: r.token_volume_24h || r.gate_volume_24h || r.dex_volume_24h,
          ath: r.token_ath,
          ath_date: r.token_ath_date,
          gate_change_pct: r.gate_change_pct,
          dex_chain: r.dex_chain,
          price_history: r.token_price_history || [],
          volume_history: r.token_volume_history || [],
        } : null,

        campaign: {
          start: r.campaign_start,
          end: r.campaign_end,
          count: r.campaign_count,
          total_budget: r.total_budget,
          consumed_budget: r.consumed_budget,
          during_views: r.during_views,
          during_engagement: r.during_engagement,
          peak_views: r.peak_views,
          time_series: r.campaign_time_series || [],
          insights,
        },

        social: {
          author_count: r.social_author_count,
          viewer_count: r.social_viewer_count,
          window_start: r.social_window_start,
          history: r.social_history || [],
        },

        enriched_at: r.enriched_at,
        errors: r.enrichment_errors || {},
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Aggregate stats across all projects for overview
  router.get('/overview', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE has_token) as projects_with_token,
          COUNT(*) FILTER (WHERE campaign_count > 0) as projects_with_campaigns,
          COUNT(*) FILTER (WHERE social_author_count > 0) as projects_with_social,
          SUM(consumed_budget) as total_consumed,
          SUM(during_views) as total_views,
          SUM(during_engagement) as total_engagement,
          SUM(campaign_count) as total_campaigns
        FROM project_enrichment
      `);
      res.json(rows[0] || {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ROI estimator: given a budget, return expected impressions/engagement
  router.get('/roi-estimate', async (req, res) => {
    const budget = parseFloat(req.query.budget);
    if (!budget || budget <= 0) return res.status(400).json({ error: 'budget required' });

    try {
      // Try enrichment table first (populated when source DB is connected)
      const { rows: enrichRows } = await pool.query(`
        SELECT
          AVG(CASE WHEN during_views > 0 AND consumed_budget > 0
            THEN consumed_budget / during_views * 1000 ELSE NULL END) as avg_cpm,
          AVG(CASE WHEN during_engagement > 0 AND consumed_budget > 0
            THEN consumed_budget / during_engagement ELSE NULL END) as avg_cpe,
          AVG(CASE WHEN during_views > 0 AND during_engagement > 0
            THEN during_engagement::numeric / during_views * 100 ELSE NULL END) as avg_er,
          COUNT(*) FILTER (WHERE campaign_count > 0) as projects_count,
          SUM(campaign_count) as total_campaigns,
          SUM(consumed_budget) as total_consumed
        FROM project_enrichment
        WHERE campaign_count > 0 AND consumed_budget > 0
      `).catch(() => ({ rows: [{}] }));

      // Fall back to case_study_snapshots (always available)
      const { rows: snapshotRows } = await pool.query(`
        SELECT payload FROM case_study_snapshots
        WHERE snapshot_key = 'public-v1' AND status = 'ready'
        ORDER BY generated_at DESC LIMIT 1
      `).catch(() => ({ rows: [] }));

      const enrichData = enrichRows[0] || {};
      const snapshot = snapshotRows[0]?.payload;
      const snapMetrics = snapshot?.metrics?.bySource?.campaign || snapshot?.metrics || {};

      // Use best available data: enrichment > snapshot > hardcoded
      const cpm = parseFloat(enrichData.avg_cpm) || parseFloat(snapMetrics.cpm) || 7.37;
      const cpe = parseFloat(enrichData.avg_cpe) || 15.0;
      const er  = parseFloat(enrichData.avg_er)  || parseFloat(snapMetrics.er) || 0.74;

      const est_impressions = Math.round(budget / cpm * 1000);
      const est_engagement  = Math.round(budget / Math.max(0.01, cpe));
      const est_tweets      = Math.round(budget / 120);

      const industry_cpm = 50;
      const industry_er  = 0.4;

      const dataSource = parseInt(enrichData.projects_count) > 0
        ? `${enrichData.projects_count} projects · ${enrichData.total_campaigns} campaigns`
        : (snapshot ? `${snapshot.meta?.counts?.cases || 0} public cases · Lighthouse data` : 'Lighthouse platform benchmarks');

      res.json({
        budget,
        lighthouse: {
          est_impressions,
          est_engagement,
          est_tweets: Math.max(1, est_tweets),
          cpm: +cpm.toFixed(2),
          cpe: +cpe.toFixed(2),
          er:  +er.toFixed(2),
        },
        industry: {
          est_impressions: Math.round(budget / industry_cpm * 1000),
          est_engagement:  Math.round(budget / industry_cpm * 1000 * industry_er / 100),
          cpm: industry_cpm,
          er:  industry_er,
        },
        lighthouse_advantage: {
          impressions_multiplier: +(budget / cpm * 1000 / (budget / industry_cpm * 1000)).toFixed(1),
          er_multiplier: +(er / industry_er).toFixed(1),
        },
        data_from: dataSource,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

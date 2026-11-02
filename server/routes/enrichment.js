/**
 * GET /api/projects/:slug/enrichment
 * Returns enrichment data for a project: token market data, campaign metrics,
 * social volume, campaign time series, before/after metrics.
 */
'use strict';

const express = require('express');
const router = express.Router();

module.exports = function mount(pool) {
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
  router.get('/enrichment/overview', async (req, res) => {
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

  return router;
};

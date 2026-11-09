'use strict';

const express = require('express');
const { authMiddleware } = require('../auth');

module.exports = function adminRoutes(pool) {
  const router = express.Router();
  router.use(authMiddleware);

  // ─── GET /api/admin/pending-campaigns ───────────────────────────────────
  // Returns all campaigns that couldn't be auto-resolved + already-resolved ones
  router.get('/pending-campaigns', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT
          id, campaign_id, total_budget, consumed_budget,
          total_views, total_engagement, participant_count,
          created_at_source, signals,
          resolved_slug, resolved_name, resolved_by, resolved_at,
          updated_at
        FROM pending_campaign_names
        WHERE resolved_by = 'pending'
        ORDER BY total_views DESC
        LIMIT 200
      `);
      const { rows: resolvedRows } = await pool.query(`
        SELECT
          id, campaign_id, total_budget, consumed_budget,
          total_views, total_engagement, participant_count,
          created_at_source, signals,
          resolved_slug, resolved_name, resolved_by, resolved_at,
          updated_at
        FROM pending_campaign_names
        WHERE resolved_by NOT IN ('pending', 'hidden')
        ORDER BY resolved_at DESC NULLS LAST
        LIMIT 200
      `);
      const { rows: hidden } = await pool.query(`
        SELECT id, campaign_id, total_budget, total_views, signals, resolved_at
        FROM pending_campaign_names
        WHERE resolved_by = 'hidden'
        ORDER BY resolved_at DESC NULLS LAST
      `);
      const pending  = rows;
      const resolved = resolvedRows;
      res.json({ pending, resolved, hidden });
    } catch (e) {
      console.error('[admin] pending-campaigns GET error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── GET /api/admin/pending-campaigns/known-slugs ───────────────────────
  // Returns slug → name map so the admin UI can show a dropdown
  router.get('/pending-campaigns/known-slugs', async (req, res) => {
    try {
      // Project names come from the latest public snapshot, so labels use the
      // same names the case library shows.
      const { rows } = await pool.query(`
        SELECT payload FROM case_study_snapshots
        WHERE snapshot_key = 'public-v1' AND status = 'ready'
        ORDER BY generated_at DESC LIMIT 1
      `);
      const projects = rows[0]?.payload?.projects || [];
      const map = {};
      for (const project of projects) {
        if (!String(project.slug || '').startsWith('public-campaign-')) map[project.slug] = project.name;
      }
      res.json(map);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── POST /api/admin/pending-campaigns/:id/resolve ──────────────────────
  // Body: { slug, name }  — admin manually assigns a project to a campaign
  router.post('/pending-campaigns/:id/resolve', async (req, res) => {
    const { id } = req.params;
    const { slug, name } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    try {
      // Fetch the pending row
      const { rows } = await pool.query(
        'SELECT * FROM pending_campaign_names WHERE id = $1', [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      const row = rows[0];

      // Resolve the name: use provided or look up from projects / enrichment
      let resolvedName = name || null;
      if (!resolvedName) {
        const nr = await pool.query(
          `SELECT COALESCE(p.name, pe.project_name, $1) AS name
           FROM (SELECT $1::text AS s) x
           LEFT JOIN projects p ON p.slug = $1
           LEFT JOIN project_enrichment pe ON pe.slug = $1
           LIMIT 1`,
          [slug]
        );
        resolvedName = nr.rows[0]?.name || slug;
      }

      // Mark resolved
      await pool.query(`
        UPDATE pending_campaign_names SET
          resolved_slug = $2,
          resolved_name = $3,
          resolved_by   = 'manual',
          resolved_at   = NOW(),
          updated_at    = NOW()
        WHERE id = $1
      `, [id, slug, resolvedName]);

      // Rebuild the public snapshot so the label shows up in the case library.
      const { syncCaseStudy } = require('../case-study-sync');
      syncCaseStudy(pool).catch(e => console.warn('[admin] resync after label failed:', e.message));

      res.json({ ok: true, slug, name: resolvedName });
    } catch (e) {
      console.error('[admin] resolve error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── POST /api/admin/pools/:campaignId/hide | /unhide ────────────────
  // Hide a reward pool from the public case study (e.g. a KOL praising a
  // KOL, or Lighthouse's own internal pools). Works for any pool, named or
  // not; unhide puts it back on the next sync.
  const resync = () => {
    const { syncCaseStudy } = require('../case-study-sync');
    syncCaseStudy(pool).catch(e => console.warn('[admin] resync failed:', e.message));
  };

  router.post('/pools/:campaignId/hide', async (req, res) => {
    const { campaignId } = req.params;
    const { title = '', name = '' } = req.body || {};
    try {
      await pool.query(`
        INSERT INTO pending_campaign_names (campaign_id, signals, resolved_name, resolved_by, resolved_at, updated_at)
        VALUES ($1, $2, $3, 'hidden', NOW(), NOW())
        ON CONFLICT (campaign_id) DO UPDATE SET
          resolved_by = 'hidden', resolved_at = NOW(), updated_at = NOW(),
          signals = CASE WHEN EXCLUDED.signals->>'title' = '' THEN pending_campaign_names.signals ELSE EXCLUDED.signals END,
          resolved_name = COALESCE(NULLIF(EXCLUDED.resolved_name, ''), pending_campaign_names.resolved_name)
      `, [campaignId, JSON.stringify({ title }), name]);
      resync();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/pools/:campaignId/unhide', async (req, res) => {
    try {
      await pool.query(`DELETE FROM pending_campaign_names WHERE campaign_id = $1 AND resolved_by = 'hidden'`, [req.params.campaignId]);
      resync();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

'use strict';

const express = require('express');

module.exports = function adminRoutes(pool) {
  const router = express.Router();

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
        WHERE resolved_by IS DISTINCT FROM 'pending'
        ORDER BY resolved_at DESC NULLS LAST
        LIMIT 200
      `);
      const pending  = rows;
      const resolved = resolvedRows;
      res.json({ pending, resolved });
    } catch (e) {
      console.error('[admin] pending-campaigns GET error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── GET /api/admin/pending-campaigns/known-slugs ───────────────────────
  // Returns slug → name map so the admin UI can show a dropdown
  router.get('/pending-campaigns/known-slugs', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT slug, name FROM projects WHERE is_visible = true ORDER BY name
      `);
      // Also pull from project_enrichment for any enrichment-only slugs
      const { rows: enrichRows } = await pool.query(`
        SELECT slug, COALESCE(project_name, slug) AS name
        FROM project_enrichment
        ORDER BY project_name
      `);
      const map = {};
      for (const r of [...enrichRows, ...rows]) map[r.slug] = r.name;
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

      // Merge the campaign's metrics into project_enrichment
      await pool.query(`
        INSERT INTO project_enrichment (slug, project_name, campaign_count, total_budget, consumed_budget, during_views, during_engagement, enriched_at)
        VALUES ($1, $2, 1, $3, $4, $5, $6, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          campaign_count    = project_enrichment.campaign_count + 1,
          total_budget      = project_enrichment.total_budget   + EXCLUDED.total_budget,
          consumed_budget   = project_enrichment.consumed_budget + EXCLUDED.consumed_budget,
          during_views      = project_enrichment.during_views   + EXCLUDED.during_views,
          during_engagement = project_enrichment.during_engagement + EXCLUDED.during_engagement,
          enriched_at       = NOW()
      `, [slug, resolvedName, row.total_budget || 0, row.consumed_budget || 0,
          row.total_views || 0, row.total_engagement || 0]);

      res.json({ ok: true, slug, name: resolvedName });
    } catch (e) {
      console.error('[admin] resolve error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ─── DELETE /api/admin/pending-campaigns/:id ────────────────────────────
  // Discard a row (e.g. spam/test campaign)
  router.delete('/pending-campaigns/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM pending_campaign_names WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

const PROJECT_SLUG_RE = /^[a-z0-9-]+$/;
const PROJECT_SLUG_EXISTS_ERROR = 'Project slug already exists';
const NUMERIC_DEFAULTS = {
  budget: 0,
  impressions: 0,
  cpm: 0,
  er: 0,
  cpe: 0,
  is_baseline: 1,
  is_visible: 1,
  tweets: 0,
  sort_order: 0,
};

function parseFiniteNumber(field, value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { error: `Project ${field} must be a finite number` };
  }
  return { value: number };
}

function normalizeProjectPayload(input, { partial = false } = {}) {
  const payload = {};

  if (!partial || input.name !== undefined) {
    const name = String(input.name ?? '').trim();
    if (!name) return { error: 'Project name is required' };
    payload.name = name;
  }

  if (!partial || input.slug !== undefined) {
    const slug = String(input.slug ?? '').trim();
    if (!slug) return { error: 'Project slug is required' };
    if (!PROJECT_SLUG_RE.test(slug)) {
      return { error: 'Project slug must use lowercase letters, numbers, and hyphens only' };
    }
    payload.slug = slug;
  }

  for (const field of ['logo', 'tag']) {
    if (!partial || input[field] !== undefined) {
      payload[field] = String(input[field] ?? '').trim();
    }
  }

  for (const [field, defaultValue] of Object.entries(NUMERIC_DEFAULTS)) {
    if (!partial || input[field] !== undefined) {
      const parsed = parseFiniteNumber(field, input[field] === undefined ? defaultValue : input[field]);
      if (parsed.error) return parsed;
      if (['is_baseline', 'is_visible'].includes(field) && ![0, 1].includes(parsed.value)) {
        return { error: `Project ${field} must be 0 or 1` };
      }
      payload[field] = parsed.value;
    }
  }

  return { value: payload };
}

function isProjectSlugUniqueViolation(error) {
  return error?.code === '23505' && (
    error?.constraint === 'projects_slug_unique_nonempty'
    || /\(slug\)/i.test(error?.detail || '')
  );
}

function normalizeCasePagePayload(input) {
  const pageData = input?.page_data ?? input?.pageData ?? {};
  if (!pageData || Array.isArray(pageData) || typeof pageData !== 'object') {
    return { error: 'Project case page data must be an object' };
  }
  return { value: pageData };
}

async function projectSlugExists(pool, slug, excludeId) {
  if (excludeId === undefined) {
    const { rows } = await pool.query('SELECT 1 FROM projects WHERE slug = $1 LIMIT 1', [slug]);
    return rows.length > 0;
  }
  const { rows } = await pool.query('SELECT 1 FROM projects WHERE slug = $1 AND id <> $2 LIMIT 1', [slug, excludeId]);
  return rows.length > 0;
}

module.exports = function(pool) {
  router.get('/', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM projects WHERE is_visible <> 0 ORDER BY sort_order');
    res.json(rows);
  });

  router.get('/all', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order');
    res.json(rows);
  });

  router.get('/id/:id/case-page', authMiddleware, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT p.*, COALESCE(cp.page_data, '{}'::jsonb) AS case_page
       FROM projects p
       LEFT JOIN project_case_pages cp ON cp.project_id = p.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  });

  router.get('/:slug/case-page', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT p.*, COALESCE(cp.page_data, '{}'::jsonb) AS case_page
       FROM projects p
       LEFT JOIN project_case_pages cp ON cp.project_id = p.id
       WHERE p.slug = $1 AND p.is_visible <> 0`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  });

  router.post('/', authMiddleware, async (req, res) => {
    const normalized = normalizeProjectPayload(req.body || {});
    if (normalized.error) return res.status(400).json({ error: normalized.error });

    const payload = normalized.value;
    if (await projectSlugExists(pool, payload.slug)) {
      return res.status(400).json({ error: PROJECT_SLUG_EXISTS_ERROR });
    }
    let normalizedCasePage = null;
    if (req.body?.case_page || req.body?.page_data || req.body?.pageData) {
      normalizedCasePage = normalizeCasePagePayload(req.body.case_page ? { page_data: req.body.case_page } : req.body);
      if (normalizedCasePage.error) return res.status(400).json({ error: normalizedCasePage.error });
    }

    try {
      const { rows: mx } = await pool.query('SELECT COALESCE(MAX(sort_order),0) as m FROM projects');
      const { rows } = await pool.query(
        'INSERT INTO projects (name,logo,budget,impressions,cpm,er,cpe,tag,is_baseline,is_visible,sort_order,tweets,slug) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id',
        [payload.name, payload.logo, payload.budget, payload.impressions, payload.cpm, payload.er, payload.cpe, payload.tag, payload.is_baseline, payload.is_visible, mx[0].m + 1, payload.tweets, payload.slug]
      );
      if (normalizedCasePage) {
        await pool.query(
          `INSERT INTO project_case_pages (project_id, page_data, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (project_id) DO UPDATE SET page_data = $2::jsonb, updated_at = NOW()`,
          [rows[0].id, JSON.stringify(normalizedCasePage.value)]
        );
      }
      res.json({ id: rows[0].id });
    } catch (error) {
      if (isProjectSlugUniqueViolation(error)) {
        return res.status(400).json({ error: PROJECT_SLUG_EXISTS_ERROR });
      }
      throw error;
    }
  });

  router.put('/:id', authMiddleware, async (req, res) => {
    const normalized = normalizeProjectPayload(req.body || {}, { partial: true });
    if (normalized.error) return res.status(400).json({ error: normalized.error });

    const payload = normalized.value;
    const entries = Object.entries(payload);
    if (!entries.length) return res.status(400).json({ error: 'No fields' });
    if (payload.slug !== undefined && await projectSlugExists(pool, payload.slug, req.params.id)) {
      return res.status(400).json({ error: PROJECT_SLUG_EXISTS_ERROR });
    }

    const sets = [];
    const vals = [];
    let idx = 1;
    for (const [field, value] of entries) {
      sets.push(`${field} = $${idx}`);
      vals.push(value);
      idx++;
    }
    vals.push(req.params.id);
    try {
      await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
      res.json({ ok: true });
    } catch (error) {
      if (isProjectSlugUniqueViolation(error)) {
        return res.status(400).json({ error: PROJECT_SLUG_EXISTS_ERROR });
      }
      throw error;
    }
  });

  router.put('/:id/case-page', authMiddleware, async (req, res) => {
    const normalized = normalizeCasePagePayload(req.body || {});
    if (normalized.error) return res.status(400).json({ error: normalized.error });
    const { rows: projectRows } = await pool.query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });
    await pool.query(
      `INSERT INTO project_case_pages (project_id, page_data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (project_id) DO UPDATE SET page_data = $2::jsonb, updated_at = NOW()`,
      [req.params.id, JSON.stringify(normalized.value)]
    );
    res.json({ ok: true });
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  router.put('/reorder/batch', authMiddleware, async (req, res) => {
    const { order } = req.body;
    for (const o of order) await pool.query('UPDATE projects SET sort_order = $1 WHERE id = $2', [o.sort_order, o.id]);
    res.json({ ok: true });
  });

  return router;
};

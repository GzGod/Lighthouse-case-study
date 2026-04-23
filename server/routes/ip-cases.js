const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

module.exports = function(pool) {
  router.get('/', async (req, res) => {
    const { rows: cases } = await pool.query("SELECT * FROM ip_cases WHERE status = 'published' ORDER BY sort_order");
    const result = [];
    for (const c of cases) {
      const { rows } = await pool.query('SELECT lang, key, value FROM ip_case_i18n WHERE case_id = $1', [c.id]);
      const texts = {};
      for (const r of rows) { if (!texts[r.lang]) texts[r.lang] = {}; texts[r.lang][r.key] = r.value; }
      result.push({ ...c, texts });
    }
    res.json(result);
  });

  router.get('/all', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM ip_cases ORDER BY sort_order');
    res.json(rows);
  });

  router.get('/:id', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM ip_cases WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows: i18nRows } = await pool.query('SELECT lang, key, value FROM ip_case_i18n WHERE case_id = $1', [rows[0].id]);
    const texts = {};
    for (const r of i18nRows) { if (!texts[r.lang]) texts[r.lang] = {}; texts[r.lang][r.key] = r.value; }
    res.json({ ...rows[0], texts });
  });

  router.post('/', authMiddleware, async (req, res) => {
    const { slug, status } = req.body;
    const { rows: mx } = await pool.query('SELECT COALESCE(MAX(sort_order),0) as m FROM ip_cases');
    const { rows } = await pool.query('INSERT INTO ip_cases (slug, sort_order, status) VALUES ($1,$2,$3) RETURNING id', [slug, mx[0].m+1, status||'draft']);
    res.json({ id: rows[0].id });
  });

  router.put('/:id', authMiddleware, async (req, res) => {
    const { slug, sort_order, status } = req.body;
    const sets = []; const vals = []; let idx = 1;
    if (slug !== undefined) { sets.push(`slug = $${idx}`); vals.push(slug); idx++; }
    if (sort_order !== undefined) { sets.push(`sort_order = $${idx}`); vals.push(sort_order); idx++; }
    if (status !== undefined) { sets.push(`status = $${idx}`); vals.push(status); idx++; }
    if (sets.length) {
      sets.push(`updated_at = NOW()`);
      vals.push(req.params.id);
      await pool.query(`UPDATE ip_cases SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
    }
    res.json({ ok: true });
  });

  router.put('/:id/i18n', authMiddleware, async (req, res) => {
    const { texts } = req.body;
    const caseId = req.params.id;
    for (const [lang, entries] of Object.entries(texts)) {
      for (const [key, value] of Object.entries(entries)) {
        await pool.query(
          'INSERT INTO ip_case_i18n (case_id, lang, key, value) VALUES ($1,$2,$3,$4) ON CONFLICT (case_id, lang, key) DO UPDATE SET value = $4',
          [caseId, lang, key, String(value)]
        );
      }
    }
    await pool.query("UPDATE ip_cases SET updated_at = NOW() WHERE id = $1", [caseId]);
    res.json({ ok: true });
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    await pool.query('DELETE FROM ip_cases WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  return router;
};

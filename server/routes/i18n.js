const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

module.exports = function(pool) {
  // Public: get all i18n for frontend
  router.get('/', async (req, res) => {
    const { rows } = await pool.query('SELECT lang, key, value FROM i18n ORDER BY lang, key');
    const dict = {};
    for (const r of rows) {
      if (!dict[r.lang]) dict[r.lang] = {};
      try { const p = JSON.parse(r.value); if (Array.isArray(p)) { dict[r.lang][r.key] = p; continue; } } catch {}
      dict[r.lang][r.key] = r.value;
    }
    res.json(dict);
  });

  // Admin: get all editable copy rows
  router.get('/all', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM i18n ORDER BY section, key, lang');
    res.json(rows);
  });

  // Admin: get by section
  router.get('/section/:section', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM i18n WHERE section = $1 ORDER BY key, lang', [req.params.section]);
    res.json(rows);
  });

  // Admin: get all sections
  router.get('/sections', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT DISTINCT section FROM i18n ORDER BY section');
    res.json(rows.map(r => r.section));
  });

  // Admin: update single key
  router.put('/:lang/:key', authMiddleware, async (req, res) => {
    const { value } = req.body;
    const strVal = Array.isArray(value) ? JSON.stringify(value) : String(value);
    const sec = req.body.section || req.params.key.split('.')[0] || 'misc';
    await pool.query(
      'INSERT INTO i18n (lang, key, value, section) VALUES ($1,$2,$3,$4) ON CONFLICT (lang, key) DO UPDATE SET value = $3, section = $4, updated_at = NOW()',
      [req.params.lang, req.params.key, strVal, sec]
    );
    res.json({ ok: true });
  });

  // Admin: batch update
  router.put('/', authMiddleware, async (req, res) => {
    const { updates } = req.body;
    for (const u of updates) {
      const strVal = Array.isArray(u.value) ? JSON.stringify(u.value) : String(u.value);
      const sec = u.section || u.key.split('.')[0] || 'misc';
      await pool.query(
        'INSERT INTO i18n (lang, key, value, section) VALUES ($1,$2,$3,$4) ON CONFLICT (lang, key) DO UPDATE SET value = $3, section = $4, updated_at = NOW()',
        [u.lang, u.key, strVal, sec]
      );
    }
    res.json({ ok: true, count: updates.length });
  });

  // Admin: add new key
  router.post('/', authMiddleware, async (req, res) => {
    const { lang, key, value, section } = req.body;
    const strVal = Array.isArray(value) ? JSON.stringify(value) : String(value);
    const sec = section || key.split('.')[0] || 'misc';
    await pool.query('INSERT INTO i18n (lang, key, value, section) VALUES ($1,$2,$3,$4) ON CONFLICT (lang, key) DO UPDATE SET value = $3, section = $4', [lang, key, strVal, sec]);
    res.json({ ok: true });
  });

  return router;
};

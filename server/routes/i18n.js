const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

module.exports = function(db) {
  // Public: get all i18n for frontend
  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT lang, key, value FROM i18n ORDER BY lang, key').all();
    const dict = {};
    for (const r of rows) {
      if (!dict[r.lang]) dict[r.lang] = {};
      // Parse JSON arrays back
      try {
        const parsed = JSON.parse(r.value);
        if (Array.isArray(parsed)) { dict[r.lang][r.key] = parsed; continue; }
      } catch {}
      dict[r.lang][r.key] = r.value;
    }
    res.json(dict);
  });

  // Admin: get by section (grouped zh/en side by side)
  router.get('/section/:section', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM i18n WHERE section = ? ORDER BY key, lang').all(req.params.section);
    res.json(rows);
  });

  // Admin: get all sections list
  router.get('/sections', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT DISTINCT section FROM i18n ORDER BY section').all();
    res.json(rows.map(r => r.section));
  });

  // Admin: update single key
  router.put('/:lang/:key', authMiddleware, (req, res) => {
    const { value } = req.body;
    const { lang, key } = req.params;
    const strVal = Array.isArray(value) ? JSON.stringify(value) : String(value);
    db.prepare("UPDATE i18n SET value = ?, updated_at = datetime('now') WHERE lang = ? AND key = ?").run(strVal, lang, key);
    res.json({ ok: true });
  });

  // Admin: batch update
  router.put('/', authMiddleware, (req, res) => {
    const { updates } = req.body; // [{lang, key, value}]
    const stmt = db.prepare("UPDATE i18n SET value = ?, updated_at = datetime('now') WHERE lang = ? AND key = ?");
    const tx = db.transaction(() => {
      for (const u of updates) {
        const strVal = Array.isArray(u.value) ? JSON.stringify(u.value) : String(u.value);
        stmt.run(strVal, u.lang, u.key);
      }
    });
    tx();
    res.json({ ok: true, count: updates.length });
  });

  // Admin: add new key
  router.post('/', authMiddleware, (req, res) => {
    const { lang, key, value, section } = req.body;
    const strVal = Array.isArray(value) ? JSON.stringify(value) : String(value);
    const sec = section || key.split('.')[0] || 'misc';
    db.prepare('INSERT OR REPLACE INTO i18n (lang, key, value, section) VALUES (?, ?, ?, ?)').run(lang, key, strVal, sec);
    res.json({ ok: true });
  });

  return router;
};

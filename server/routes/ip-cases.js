const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

module.exports = function(db) {
  // Public: list published cases with their i18n
  router.get('/', (req, res) => {
    const cases = db.prepare("SELECT * FROM ip_cases WHERE status = 'published' ORDER BY sort_order").all();
    const i18nStmt = db.prepare('SELECT lang, key, value FROM ip_case_i18n WHERE case_id = ?');
    const result = cases.map(c => {
      const rows = i18nStmt.all(c.id);
      const texts = {};
      for (const r of rows) {
        if (!texts[r.lang]) texts[r.lang] = {};
        texts[r.lang][r.key] = r.value;
      }
      return { ...c, texts };
    });
    res.json(result);
  });

  // Admin: list all cases
  router.get('/all', authMiddleware, (req, res) => {
    const cases = db.prepare('SELECT * FROM ip_cases ORDER BY sort_order').all();
    res.json(cases);
  });

  // Admin: get single case with i18n
  router.get('/:id', authMiddleware, (req, res) => {
    const c = db.prepare('SELECT * FROM ip_cases WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    const rows = db.prepare('SELECT lang, key, value FROM ip_case_i18n WHERE case_id = ?').all(c.id);
    const texts = {};
    for (const r of rows) {
      if (!texts[r.lang]) texts[r.lang] = {};
      texts[r.lang][r.key] = r.value;
    }
    res.json({ ...c, texts });
  });

  // Admin: create case
  router.post('/', authMiddleware, (req, res) => {
    const { slug, status } = req.body;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM ip_cases').get().m || 0;
    const result = db.prepare('INSERT INTO ip_cases (slug, sort_order, status) VALUES (?, ?, ?)')
      .run(slug, maxOrder + 1, status || 'draft');
    res.json({ id: result.lastInsertRowid });
  });

  // Admin: update case meta
  router.put('/:id', authMiddleware, (req, res) => {
    const { slug, sort_order, status } = req.body;
    const sets = [];
    const vals = [];
    if (slug !== undefined) { sets.push('slug = ?'); vals.push(slug); }
    if (sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(sort_order); }
    if (status !== undefined) { sets.push('status = ?'); vals.push(status); }
    if (sets.length) {
      sets.push("updated_at = datetime('now')");
      vals.push(req.params.id);
      db.prepare(`UPDATE ip_cases SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    }
    res.json({ ok: true });
  });

  // Admin: update case i18n (batch)
  router.put('/:id/i18n', authMiddleware, (req, res) => {
    const { texts } = req.body; // {zh: {key: val}, en: {key: val}}
    const caseId = req.params.id;
    const stmt = db.prepare('INSERT OR REPLACE INTO ip_case_i18n (case_id, lang, key, value) VALUES (?, ?, ?, ?)');
    const tx = db.transaction(() => {
      for (const [lang, entries] of Object.entries(texts)) {
        for (const [key, value] of Object.entries(entries)) {
          stmt.run(caseId, lang, key, String(value));
        }
      }
    });
    tx();
    db.prepare("UPDATE ip_cases SET updated_at = datetime('now') WHERE id = ?").run(caseId);
    res.json({ ok: true });
  });

  // Admin: delete case
  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM ip_cases WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};

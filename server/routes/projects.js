const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

module.exports = function(db) {
  // Public
  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order').all();
    res.json(rows);
  });

  // Admin: create
  router.post('/', authMiddleware, (req, res) => {
    const { name, logo, budget, impressions, cpm, er, cpe, tag, is_baseline } = req.body;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM projects').get().m || 0;
    const result = db.prepare(
      'INSERT INTO projects (name, logo, budget, impressions, cpm, er, cpe, tag, is_baseline, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(name, logo || '', budget || 0, impressions || 0, cpm || 0, er || 0, cpe || 0, tag || '', is_baseline ?? 1, maxOrder + 1);
    res.json({ id: result.lastInsertRowid });
  });

  // Admin: update
  router.put('/:id', authMiddleware, (req, res) => {
    const fields = ['name', 'logo', 'budget', 'impressions', 'cpm', 'er', 'cpe', 'tag', 'is_baseline', 'sort_order'];
    const sets = [];
    const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields' });
    vals.push(req.params.id);
    db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    res.json({ ok: true });
  });

  // Admin: delete
  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // Admin: reorder
  router.put('/reorder/batch', authMiddleware, (req, res) => {
    const { order } = req.body; // [{id, sort_order}]
    const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
    const tx = db.transaction(() => { for (const o of order) stmt.run(o.sort_order, o.id); });
    tx();
    res.json({ ok: true });
  });

  return router;
};

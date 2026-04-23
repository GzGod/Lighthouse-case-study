const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

module.exports = function(pool) {
  router.get('/', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order');
    res.json(rows);
  });

  router.post('/', authMiddleware, async (req, res) => {
    const { name, logo, budget, impressions, cpm, er, cpe, tag, is_baseline } = req.body;
    const { rows: mx } = await pool.query('SELECT COALESCE(MAX(sort_order),0) as m FROM projects');
    const { rows } = await pool.query(
      'INSERT INTO projects (name,logo,budget,impressions,cpm,er,cpe,tag,is_baseline,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
      [name, logo||'', budget||0, impressions||0, cpm||0, er||0, cpe||0, tag||'', is_baseline??1, mx[0].m+1]
    );
    res.json({ id: rows[0].id });
  });

  router.put('/:id', authMiddleware, async (req, res) => {
    const fields = ['name','logo','budget','impressions','cpm','er','cpe','tag','is_baseline','sort_order'];
    const sets = []; const vals = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${idx}`); vals.push(req.body[f]); idx++; }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields' });
    vals.push(req.params.id);
    await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
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

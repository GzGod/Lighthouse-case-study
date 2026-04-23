const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken } = require('../auth');
const router = express.Router();

module.exports = function(pool) {
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, username: user.username });
  });

  router.get('/me', require('../auth').authMiddleware, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username });
  });

  router.put('/password', require('../auth').authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(oldPassword, rows[0].password_hash)) {
      return res.status(400).json({ error: 'Wrong current password' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  });

  return router;
};

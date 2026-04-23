const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken } = require('../auth');
const router = express.Router();

module.exports = function(db) {
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, username: user.username });
  });

  router.get('/me', require('../auth').authMiddleware, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username });
  });

  router.put('/password', require('../auth').authMiddleware, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Wrong current password' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ ok: true });
  });

  return router;
};

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../auth');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function safeFilename(file) {
  const ext = path.extname(file.originalname || '');
  const base = path.basename(file.originalname || 'image', ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'image';
  return `${base}-${Date.now()}${ext}`;
}

module.exports = function(pool) {
  router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const filename = safeFilename(req.file);
    const mime = req.file.mimetype || 'application/octet-stream';
    const dataUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    await pool.query('INSERT INTO images (filename, original_name, path) VALUES ($1,$2,$3)', [filename, req.file.originalname, dataUrl]);
    res.json({ path: dataUrl, filename });
  });

  router.get('/', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM images ORDER BY uploaded_at DESC');
    res.json(rows);
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    await pool.query('DELETE FROM images WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  return router;
};

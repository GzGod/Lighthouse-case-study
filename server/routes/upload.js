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

function publicImagePath(row) {
  return `/api/upload/${row.id}/raw`;
}

function displayImagePath(row) {
  return publicImagePath(row);
}

function toClientImage(row) {
  const publicPath = publicImagePath(row);
  return {
    id: row.id,
    filename: row.filename,
    original_name: row.original_name,
    uploaded_at: row.uploaded_at,
    path: publicPath,
    public_path: publicPath,
    display_path: displayImagePath(row),
  };
}

module.exports = function(pool) {
  router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const filename = safeFilename(req.file);
    const mime = req.file.mimetype || 'application/octet-stream';
    const dataUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    const { rows } = await pool.query(
      'INSERT INTO images (filename, original_name, path) VALUES ($1,$2,$3) RETURNING *',
      [filename, req.file.originalname, dataUrl]
    );
    const image = toClientImage(rows[0]);
    const publicPath = image.public_path;
    res.json({ ...image, path: publicPath });
  });

  router.get('/', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM images ORDER BY uploaded_at DESC');
    res.json(rows.map(toClientImage));
  });

  router.get('/:id/raw', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM images WHERE id = $1', [req.params.id]);
    const image = rows[0];
    if (!image) return res.status(404).send('Image not found');
    const value = String(image.path || '');
    const dataUrl = value.match(/^data:([^;]+);base64,(.*)$/);
    if (dataUrl) {
      res.setHeader('Content-Type', dataUrl[1]);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(Buffer.from(dataUrl[2], 'base64'));
    }
    if (/^https?:\/\//i.test(value)) return res.redirect(value);
    return res.redirect(value.startsWith('/') ? value : `/${value}`);
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    await pool.query('DELETE FROM images WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  return router;
};

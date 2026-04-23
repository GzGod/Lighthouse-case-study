const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../auth');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'assets', 'uploads');

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = function(db) {
  router.post('/', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const relPath = `assets/uploads/${req.file.filename}`;
    db.prepare('INSERT INTO images (filename, original_name, path) VALUES (?, ?, ?)')
      .run(req.file.filename, req.file.originalname, relPath);
    res.json({ path: relPath, filename: req.file.filename });
  });

  router.get('/', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM images ORDER BY uploaded_at DESC').all();
    res.json(rows);
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};

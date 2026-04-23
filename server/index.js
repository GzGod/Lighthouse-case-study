const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB, seedProjects, seedI18n, seedIPCases } = require('./db');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize database
const db = initDB();
seedProjects(db);
seedIPCases(db);

// Seed i18n from existing DICT if empty — use a dedicated parser
const i18nCount = db.prepare('SELECT COUNT(*) as c FROM i18n').get().c;
if (i18nCount === 0) {
  try {
    const i18nPath = path.join(__dirname, '..', 'i18n.jsx');
    const src = fs.readFileSync(i18nPath, 'utf-8');
    // Extract zh and en blocks separately
    const extractBlock = (lang) => {
      const re = new RegExp(`${lang}:\\s*\\{([\\s\\S]*?)\\n  \\}`, 'm');
      const m = src.match(re);
      if (!m) return {};
      const block = m[1];
      const entries = {};
      // Match "key": "value" pairs
      const lineRe = new RegExp('"([^"]+)":\\s*"((?:[^"\\\\]|\\\\.)*)"', 'g');
      let match;
      while ((match = lineRe.exec(block)) !== null) {
        entries[match[1]] = match[2].replace(/\\"/g, '"');
      }
      // Match "key": [...] array values
      const arrRe = new RegExp('"([^"]+)":\\s*\\[([\\s\\S]*?)\\]', 'g');
      while ((match = arrRe.exec(block)) !== null) {
        try {
          const arrStr = '[' + match[2] + ']';
          entries[match[1]] = arrStr;
        } catch {}
      }
      return entries;
    };
    const dict = { zh: extractBlock('zh'), en: extractBlock('en') };
    seedI18n(db, dict);
    console.log(`Seeded i18n: zh=${Object.keys(dict.zh).length}, en=${Object.keys(dict.en).length}`);
  } catch (e) {
    console.error('Failed to seed i18n:', e.message);
  }
}

// Seed Astra IP case i18n from the same parsed data
const astraI18nCount = db.prepare('SELECT COUNT(*) as c FROM ip_case_i18n').get().c;
if (astraI18nCount === 0) {
  try {
    const astraCase = db.prepare("SELECT id FROM ip_cases WHERE slug = 'astra'").get();
    if (astraCase) {
      const allI18n = db.prepare("SELECT lang, key, value FROM i18n WHERE key LIKE 'astra.%'").all();
      const stmt = db.prepare('INSERT OR REPLACE INTO ip_case_i18n (case_id, lang, key, value) VALUES (?, ?, ?, ?)');
      const tx = db.transaction(() => {
        for (const r of allI18n) stmt.run(astraCase.id, r.lang, r.key, r.value);
      });
      tx();
      console.log(`Seeded Astra IP case i18n: ${allI18n.length} entries`);
    }
  } catch (e) {
    console.error('Failed to seed Astra i18n:', e.message);
  }
}

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'assets', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// API routes
app.use('/api/auth', require('./routes/auth')(db));
app.use('/api/i18n', require('./routes/i18n')(db));
app.use('/api/projects', require('./routes/projects')(db));
app.use('/api/ip-cases', require('./routes/ip-cases')(db));
app.use('/api/upload', require('./routes/upload')(db));

// Serve static files (the case study site)
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot));

// Root → main case study page
app.get('/', (req, res) => {
  res.sendFile(path.join(staticRoot, 'Lighthouse Case Study.html'));
});

// Admin SPA
app.get('/admin', (req, res) => {
  res.sendFile(path.join(staticRoot, 'admin', 'index.html'));
});
app.get('/admin/{*path}', (req, res) => {
  res.sendFile(path.join(staticRoot, 'admin', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lighthouse CMS running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Default login: admin / lighthouse2026`);
});

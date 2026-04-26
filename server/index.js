const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { pool, initDB, seedProjects, seedI18n, seedIPCases, refreshAttentionMarketI18n } = require('./db');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

async function start() {
  // Initialize database tables
  await initDB();
  await seedProjects();
  await seedIPCases();

  // Seed i18n from existing DICT if empty, then migrate curated copy defaults once.
  try {
    const i18nPath = path.join(__dirname, '..', 'i18n.jsx');
    const src = fs.readFileSync(i18nPath, 'utf-8');
    const extractBlock = (lang) => {
      const re = new RegExp(`${lang}:\\s*\\{([\\s\\S]*?)\\n  \\}`, 'm');
      const m = src.match(re);
      if (!m) return {};
      const block = m[1];
      const entries = {};
      const lineRe = new RegExp('"([^"]+)":\\s*"((?:[^"\\\\]|\\\\.)*)"', 'g');
      let match;
      while ((match = lineRe.exec(block)) !== null) {
        entries[match[1]] = match[2].replace(/\\"/g, '"');
      }
      const arrRe = new RegExp('"([^"]+)":\\s*\\[([\\s\\S]*?)\\]', 'g');
      while ((match = arrRe.exec(block)) !== null) {
        try { entries[match[1]] = '[' + match[2] + ']'; } catch {}
      }
      return entries;
    };
    const dict = { zh: extractBlock('zh'), en: extractBlock('en') };
    const { rows: i18nCount } = await pool.query('SELECT COUNT(*) as c FROM i18n');
    if (parseInt(i18nCount[0].c) === 0) {
      await seedI18n(dict);
      console.log(`Seeded i18n: zh=${Object.keys(dict.zh).length}, en=${Object.keys(dict.en).length}`);
    }
    await refreshAttentionMarketI18n(dict);
  } catch (e) {
    console.error('Failed to seed or refresh i18n:', e.message);
  }

  // Seed Astra IP case i18n
  const { rows: caseI18nCount } = await pool.query('SELECT COUNT(*) as c FROM ip_case_i18n');
  if (parseInt(caseI18nCount[0].c) === 0) {
    try {
      const { rows: astraRows } = await pool.query("SELECT id FROM ip_cases WHERE slug = 'astra'");
      if (astraRows[0]) {
        const { rows: allI18n } = await pool.query("SELECT lang, key, value FROM i18n WHERE key LIKE 'astra.%'");
        for (const r of allI18n) {
          await pool.query(
            'INSERT INTO ip_case_i18n (case_id, lang, key, value) VALUES ($1,$2,$3,$4) ON CONFLICT (case_id, lang, key) DO NOTHING',
            [astraRows[0].id, r.lang, r.key, r.value]
          );
        }
        console.log(`Seeded Astra IP case i18n: ${allI18n.length} entries`);
      }
    } catch (e) {
      console.error('Failed to seed Astra i18n:', e.message);
    }
  }

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '..', 'assets', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // API routes — pass pool instead of db
  app.use('/api/auth', require('./routes/auth')(pool));
  app.use('/api/i18n', require('./routes/i18n')(pool));
  app.use('/api/projects', require('./routes/projects')(pool));
  app.use('/api/ip-cases', require('./routes/ip-cases')(pool));
  app.use('/api/upload', require('./routes/upload')(pool));

  // Serve static files
  const staticRoot = path.join(__dirname, '..');
  app.get('/', (req, res) => {
    res.sendFile(path.join(staticRoot, 'Lighthouse Case Study.html'));
  });
  app.get('/case-study', (req, res) => {
    res.sendFile(path.join(staticRoot, 'Lighthouse Case Study.html'));
  });
  app.get('/personal-ip', (req, res) => {
    res.sendFile(path.join(staticRoot, 'Personal IP.html'));
  });
  app.use((req, res, next) => {
    const pathname = decodeURIComponent(req.path);
    if (pathname === '/Lighthouse Case Study.html') return res.redirect(301, '/');
    if (pathname === '/Personal IP.html') return res.redirect(301, '/personal-ip');
    next();
  });
  app.use(express.static(staticRoot));

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(staticRoot, 'admin', 'index.html'));
  });
  app.get('/admin/{*path}', (req, res) => {
    res.sendFile(path.join(staticRoot, 'admin', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Lighthouse CMS running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });

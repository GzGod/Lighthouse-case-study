const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { pool, initDB, seedProjects, seedI18n, seedIPCases, refreshAttentionMarketI18n } = require('./db');
const { seedProjectCasePages, seedIPCaseContent } = require('./project-case-defaults');
const { syncCaseStudy, seedFallbackSnapshot, latestSnapshot } = require('./case-study-sync');
const { startEnrichmentSchedule } = require('./enrichment-worker');

const app = express();
const PORT = process.env.PORT || 3456;
app.locals.cmsPool = pool;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

async function start() {
  // Initialize database tables
  await initDB();
  try {
    const seededFallback = await seedFallbackSnapshot(pool);
    if (seededFallback) console.log('Seeded public case fallback snapshot');
  } catch (error) {
    console.error(`Public case fallback snapshot skipped: ${error.message}`);
  }
  await seedProjects();
  await seedProjectCasePages(pool);
  await seedIPCases();

  // Keep every default DICT key editable without overwriting CMS edits.
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
    await seedI18n(dict);
    console.log(`Ensured i18n defaults: zh=${Object.keys(dict.zh).length}, en=${Object.keys(dict.en).length}`);
    await refreshAttentionMarketI18n(dict);
  } catch (e) {
    console.error('Failed to seed or refresh i18n:', e.message);
  }

  // Seed Astra IP case i18n — always run our enriched content (idempotent upsert)
  try {
    await seedIPCaseContent(pool);
    console.log('Seeded Astra IP case content');
  } catch (e) {
    console.error('Failed to seed Astra IP content:', e.message);
  }

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '..', 'assets', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // API routes — pass pool instead of db
  app.use('/api/auth', require('./routes/auth')(pool));
  app.use('/api/i18n', require('./routes/i18n')(pool));
  app.use('/api/projects', require('./routes/projects')(pool));
  app.use('/api/ip-cases', require('./routes/ip-cases')(pool));
  app.use('/api/case-study', require('./routes/case-study'));
  app.use('/api/enrichment', require('./routes/enrichment')(pool));
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
    res.redirect(301, '/cases');
  });
  app.get('/cases', (req, res) => {
    res.sendFile(path.join(staticRoot, 'Case Library.html'));
  });
  app.get('/cases/:slug', (req, res) => {
    res.sendFile(path.join(staticRoot, 'Project Case.html'));
  });
  app.get('/projects/:slug', (req, res) => {
    res.sendFile(path.join(staticRoot, 'Project Case.html'));
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
    const refreshLogos = () => latestSnapshot(pool).catch(error => console.warn(`Automatic project logo refresh skipped: ${error.message}`));
    if (process.env.LIGHTHOUSE_SOURCE_DATABASE_URL || process.env.SOURCE_DATABASE_URL) {
      syncCaseStudy(pool)
        .then(payload => { console.log(`Initial public case snapshot synced: ${payload.meta.counts.cases} cases`); return refreshLogos(); })
        .catch(error => console.error(`Initial public case snapshot skipped: ${error.message}`));
      // Start enrichment worker (before/after metrics, token data)
      startEnrichmentSchedule(pool);
    }
    setTimeout(refreshLogos, 5000).unref();
    setInterval(refreshLogos, 24 * 60 * 60 * 1000).unref();
  });
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });

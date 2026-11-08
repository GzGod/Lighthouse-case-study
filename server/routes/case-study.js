const express = require('express');
const { authMiddleware } = require('../auth');
const { latestSnapshot, syncCaseStudy, syncStatus } = require('../case-study-sync');
const { safeLogoPath } = require('../project-logo-service');

const router = express.Router();

router.get('/logo-admin', authMiddleware, async (req, res, next) => {
  try {
    const snapshot = await latestSnapshot(req.app.locals.cmsPool);
    if (!snapshot) return res.status(503).json({ error: 'Snapshot unavailable' });
    const { rows } = await req.app.locals.cmsPool.query('SELECT slug, manual_logo, auto_provider, auto_checked_at, auto_logo IS NOT NULL AS has_auto FROM case_project_logos');
    const records = new Map(rows.map(row => [row.slug, row]));
    res.json(snapshot.payload.projects.map(project => ({
      slug: project.slug, name: project.name, logo: project.logo, logoProvider: project.logoProvider,
      manualLogo: records.get(project.slug)?.manual_logo || '',
      autoProvider: records.get(project.slug)?.auto_provider || '',
      autoCheckedAt: records.get(project.slug)?.auto_checked_at || null,
    })));
  } catch (error) { next(error); }
});

router.get('/logos/:slug', async (req, res, next) => {
  try {
    const { rows } = await req.app.locals.cmsPool.query('SELECT auto_logo, auto_mime FROM case_project_logos WHERE slug = $1', [req.params.slug]);
    if (!rows[0]?.auto_logo) return res.status(404).send('Logo not found');
    res.setHeader('Content-Type', rows[0].auto_mime || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(rows[0].auto_logo);
  } catch (error) { next(error); }
});

router.put('/logos/:slug', authMiddleware, async (req, res, next) => {
  try {
    const logo = String(req.body?.logo || '').trim();
    if (logo && !safeLogoPath(logo)) return res.status(400).json({ error: 'Use an uploaded image or a valid HTTPS image URL' });
    if (!/^[a-z0-9-]+$/.test(req.params.slug)) return res.status(400).json({ error: 'Invalid project slug' });
    const uploadId = logo.match(/^\/api\/upload\/(\d+)\/raw$/)?.[1];
    if (uploadId) {
      const { rows: imageRows } = await req.app.locals.cmsPool.query('SELECT 1 FROM images WHERE id = $1', [uploadId]);
      if (!imageRows[0]) return res.status(400).json({ error: 'Uploaded image not found' });
    }
    const snapshot = await latestSnapshot(req.app.locals.cmsPool);
    if (!snapshot?.payload?.projects?.some(project => project.slug === req.params.slug)) return res.status(404).json({ error: 'Project not found' });
    await req.app.locals.cmsPool.query(`INSERT INTO case_project_logos (slug, manual_logo, updated_at)
      VALUES ($1,$2,NOW()) ON CONFLICT (slug) DO UPDATE SET manual_logo=$2, updated_at=NOW()`, [req.params.slug, logo]);
    res.json({ ok: true, logo });
  } catch (error) { next(error); }
});

function payloadFrom(snapshot) {
  if (!snapshot) return null;
  return typeof snapshot.payload === 'string' ? JSON.parse(snapshot.payload) : snapshot.payload;
}

function publicMeta(snapshot, payload) {
  return {
    ...(payload?.meta || {}),
    generatedAt: snapshot.generated_at || payload?.meta?.generatedAt || null,
    sourceUpdatedAt: snapshot.source_updated_at || payload?.meta?.sourceUpdatedAt || null,
    rowCount: snapshot.row_count || payload?.meta?.counts?.cases || 0,
  };
}

router.get('/summary', async (req, res, next) => {
  try {
    const snapshot = await latestSnapshot(req.app.locals.cmsPool);
    if (!snapshot) return res.status(503).json({ error: 'Case study data has not been synced yet' });
    const payload = payloadFrom(snapshot);
    res.json({ meta: publicMeta(snapshot, payload), metrics: payload.metrics, projects: payload.projects });
  } catch (error) { next(error); }
});

router.get('/cases', async (req, res, next) => {
  try {
    const snapshot = await latestSnapshot(req.app.locals.cmsPool);
    if (!snapshot) return res.status(503).json({ error: 'Case study data has not been synced yet' });
    const payload = payloadFrom(snapshot);
    const source = ['campaign', 'legacy'].includes(req.query.source) ? req.query.source : '';
    const project = String(req.query.project || '').trim().toLowerCase();
    const sort = ['impressions', 'engagements', 'cpm', 'cpe', 'createdAt'].includes(req.query.sort) ? req.query.sort : 'impressions';
    const direction = req.query.direction === 'asc' ? 1 : -1;
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 24, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const search = String(req.query.search || '').trim().toLowerCase();
    let items = payload.cases.filter(item => {
      if (source && item.source !== source) return false;
      if (project && item.projectSlug !== project) return false;
      if (search && !`${item.projectName} ${item.label}`.toLowerCase().includes(search)) return false;
      return true;
    });
    items.sort((a, b) => {
      const av = sort === 'createdAt' ? new Date(a.createdAt || 0).getTime() : Number(a[sort] || 0);
      const bv = sort === 'createdAt' ? new Date(b.createdAt || 0).getTime() : Number(b[sort] || 0);
      return (av - bv) * direction;
    });
    const total = items.length;
    const start = (page - 1) * pageSize;
    res.json({
      meta: publicMeta(snapshot, payload),
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      items: items.slice(start, start + pageSize).map(({ topTweets: _topTweets, ...item }) => item),
    });
  } catch (error) { next(error); }
});

router.get('/projects/:slug', async (req, res, next) => {
  try {
    const snapshot = await latestSnapshot(req.app.locals.cmsPool);
    if (!snapshot) return res.status(503).json({ error: 'Case study data has not been synced yet' });
    const payload = payloadFrom(snapshot);
    const project = payload.projects.find(item => item.slug === req.params.slug);
    if (!project) return res.status(404).json({ error: 'Case study project not found' });
    res.json({ meta: publicMeta(snapshot, payload), project, cases: payload.cases.filter(item => item.projectSlug === project.slug) });
  } catch (error) { next(error); }
});

router.get('/sync-status', authMiddleware, async (req, res, next) => {
  try { res.json(await syncStatus(req.app.locals.cmsPool)); } catch (error) { next(error); }
});

router.post('/sync', authMiddleware, async (req, res, next) => {
  try {
    const payload = await syncCaseStudy(req.app.locals.cmsPool);
    res.json({ ok: true, meta: payload.meta, metrics: payload.metrics });
  } catch (error) {
    res.status(502).json({ error: `Source sync failed: ${error.message}` });
  }
});

module.exports = router;

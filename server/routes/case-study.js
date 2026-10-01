const express = require('express');
const { authMiddleware } = require('../auth');
const { latestSnapshot, syncCaseStudy, syncStatus } = require('../case-study-sync');

const router = express.Router();

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
      items: items.slice(start, start + pageSize),
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

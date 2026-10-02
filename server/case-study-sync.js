const crypto = require('crypto');
const { Pool } = require('pg');

const SNAPSHOT_KEY = 'public-v1';
let sourcePool = null;
let syncPromise = null;

function sourceConnectionString() {
  return process.env.LIGHTHOUSE_SOURCE_DATABASE_URL || process.env.SOURCE_DATABASE_URL || '';
}

function getSourcePool() {
  const connectionString = sourceConnectionString();
  if (!connectionString) return null;
  if (!sourcePool) {
    const normalized = connectionString.replace(/([?&])sslmode=[^&]+&?/i, '$1').replace(/[?&]$/, '');
    sourcePool = new Pool({ connectionString: normalized, ssl: { rejectUnauthorized: false }, max: 2 });
  }
  return sourcePool;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function slugify(value, fallback) {
  const slug = String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  return slug || fallback;
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function metricSum(row) {
  return number(row.likes ?? row.totalLikes) + number(row.replies ?? row.totalReplies) + number(row.retweets ?? row.totalRetweets) + number(row.quotes ?? row.totalQuotes);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(number(value) * factor) / factor;
}

function publicCase(row, index, project) {
  const source = row.source === 'campaign' ? 'campaign' : 'legacy';
  const name = project.name;
  const views = number(row.totalViews);
  const engagements = metricSum(row);
  return {
    id: `case-${hash(`${source}:${row.id}`)}`,
    label: source === 'legacy' ? `Legacy case ${String(index + 1).padStart(3, '0')}` : name,
    projectSlug: project.slug,
    projectName: name,
    source,
    campaignType: row.campaignType || (source === 'campaign' ? 'TWEET' : 'LEGACY'),
    budget: number(row.totalBudget),
    impressions: views,
    likes: number(row.totalLikes),
    replies: number(row.totalReplies),
    retweets: number(row.totalRetweets),
    quotes: number(row.totalQuotes),
    engagements,
    cpm: views > 0 ? round(number(row.totalBudget) * 1000 / views) : 0,
    cpe: engagements > 0 ? round(number(row.totalBudget) / engagements) : 0,
    participants: number(row.kolsParticipate),
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || row.lastXSyncedAt || null,
    dataQuality: views > 0 && engagements > 0 ? 'complete' : 'partial',
  };
}

async function readSourceRows() {
  const pool = getSourcePool();
  if (!pool) throw new Error('LIGHTHOUSE_SOURCE_DATABASE_URL is not configured');
  const { rows } = await pool.query(`
    SELECT
      ca.id,
      ca.source,
      ca."campaignId",
      ca."campaignType",
      ca."totalBudget",
      ca."totalViews",
      ca."totalLikes",
      ca."totalReplies",
      ca."totalRetweets",
      ca."totalQuotes",
      ca."kolsParticipate",
      ca."createdAt",
      ca."updatedAt",
      ca."lastXSyncedAt",
      uc."projectName"
    FROM public.cases ca
    LEFT JOIN public.unified_campaigns uc ON uc.id = ca."campaignId"
    WHERE ca."isShow" = TRUE
    ORDER BY ca."createdAt" DESC NULLS LAST, ca.id ASC
  `);
  return rows;
}

function buildSnapshot(rows) {
  const projectMap = new Map();
  const orderedRows = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const projectFor = (row) => {
    const rawName = String(row.projectName || '').trim();
    const source = row.source === 'campaign' ? 'campaign' : 'legacy';
    const fallbackKey = source === 'campaign'
      ? `campaign:${row.campaignId || row.id}`
      : 'legacy:public-cases';
    const name = rawName || (source === 'campaign'
      ? `Public campaign ${hash(row.campaignId || row.id)}`
      : 'Legacy public cases');
    const key = rawName ? `${source}:${name.toLowerCase()}` : fallbackKey;
    if (!projectMap.has(key)) {
      const base = slugify(name, `${source}-${hash(key)}`);
      projectMap.set(key, {
        key,
        slug: source === 'legacy' ? 'legacy-public-cases' : base,
        name,
        source,
        cases: 0,
        budget: 0,
        impressions: 0,
        likes: 0,
        replies: 0,
        retweets: 0,
        quotes: 0,
        engagements: 0,
        participants: 0,
        startDate: null,
        endDate: null,
      });
    }
    return projectMap.get(key);
  };

  const cases = orderedRows.map((row, index) => {
    const project = projectFor(row);
    const item = publicCase(row, index, project);
    project.cases += 1;
    project.budget += item.budget;
    project.impressions += item.impressions;
    project.likes += item.likes;
    project.replies += item.replies;
    project.retweets += item.retweets;
    project.quotes += item.quotes;
    project.engagements += item.engagements;
    project.participants += item.participants;
    if (item.createdAt) {
      if (!project.startDate || new Date(item.createdAt) < new Date(project.startDate)) project.startDate = item.createdAt;
      if (!project.endDate || new Date(item.createdAt) > new Date(project.endDate)) project.endDate = item.createdAt;
    }
    return item;
  });

  const projects = [...projectMap.values()].map(project => ({
    ...project,
    budget: round(project.budget),
    cpm: project.impressions > 0 ? round(project.budget * 1000 / project.impressions) : 0,
    cpe: project.engagements > 0 ? round(project.budget / project.engagements) : 0,
    er: project.impressions > 0 ? round(project.engagements / project.impressions * 100) : 0,
  })).sort((a, b) => b.impressions - a.impressions);

  const metrics = cases.reduce((sum, item) => {
    sum.budget += item.budget;
    sum.impressions += item.impressions;
    sum.likes += item.likes;
    sum.replies += item.replies;
    sum.retweets += item.retweets;
    sum.quotes += item.quotes;
    sum.engagements += item.engagements;
    return sum;
  }, { budget: 0, impressions: 0, likes: 0, replies: 0, retweets: 0, quotes: 0, engagements: 0 });

  const bySource = ['campaign', 'legacy'].reduce((result, source) => {
    const sourceCases = cases.filter(item => item.source === source);
    const aggregate = sourceCases.reduce((sum, item) => {
      sum.budget += item.budget;
      sum.impressions += item.impressions;
      sum.likes += item.likes;
      sum.replies += item.replies;
      sum.retweets += item.retweets;
      sum.quotes += item.quotes;
      sum.engagements += item.engagements;
      return sum;
    }, { budget: 0, impressions: 0, likes: 0, replies: 0, retweets: 0, quotes: 0, engagements: 0 });
    result[source] = {
      ...aggregate,
      budget: round(aggregate.budget),
      cpm: aggregate.impressions > 0 ? round(aggregate.budget * 1000 / aggregate.impressions) : 0,
      cpe: aggregate.engagements > 0 ? round(aggregate.budget / aggregate.engagements) : 0,
      er: aggregate.impressions > 0 ? round(aggregate.engagements / aggregate.impressions * 100) : 0,
      cases: sourceCases.length,
    };
    return result;
  }, {});

  const sourceUpdatedAt = cases.reduce((latest, item) => {
    const current = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    return current > latest ? current : latest;
  }, 0);
  const createdDates = cases.map(item => item.createdAt).filter(Boolean).map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime()));
  const dateRange = createdDates.length ? {
    start: new Date(Math.min(...createdDates.map(date => date.getTime()))).toISOString(),
    end: new Date(Math.max(...createdDates.map(date => date.getTime()))).toISOString(),
  } : { start: null, end: null };
  return {
    version: 1,
    meta: {
      snapshotKey: SNAPSHOT_KEY,
      generatedAt: new Date().toISOString(),
      sourceUpdatedAt: sourceUpdatedAt ? new Date(sourceUpdatedAt).toISOString() : null,
      dateRange,
      counts: {
        cases: cases.length,
        campaignCases: cases.filter(item => item.source === 'campaign').length,
        legacyCases: cases.filter(item => item.source === 'legacy').length,
        projects: projects.length,
      },
      privacy: 'Aggregated public metrics only; author identities and post URLs are intentionally omitted.',
    },
    metrics: {
      ...metrics,
      budget: round(metrics.budget),
      cpm: metrics.impressions > 0 ? round(metrics.budget * 1000 / metrics.impressions) : 0,
      cpe: metrics.engagements > 0 ? round(metrics.budget / metrics.engagements) : 0,
      er: metrics.impressions > 0 ? round(metrics.engagements / metrics.impressions * 100) : 0,
      bySource,
    },
    projects,
    cases,
  };
}

async function syncCaseStudy(cmsPool) {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    const rows = await readSourceRows();
    const payload = buildSnapshot(rows);
    const client = await cmsPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO case_study_snapshots
          (snapshot_key, status, payload, source_updated_at, generated_at, row_count, error)
         VALUES ($1, 'ready', $2::jsonb, $3, NOW(), $4, NULL)`,
        [SNAPSHOT_KEY, JSON.stringify(payload), payload.meta.sourceUpdatedAt, payload.meta.counts.cases]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    return payload;
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

async function latestSnapshot(cmsPool) {
  const { rows } = await cmsPool.query(
    `SELECT payload, generated_at, source_updated_at, row_count, error
     FROM case_study_snapshots
     WHERE snapshot_key = $1 AND status = 'ready'
     ORDER BY generated_at DESC LIMIT 1`,
    [SNAPSHOT_KEY]
  );
  return rows[0] || null;
}

async function syncStatus(cmsPool) {
  const { rows } = await cmsPool.query(
    `SELECT status, generated_at, source_updated_at, row_count, error
     FROM case_study_snapshots
     WHERE snapshot_key = $1
     ORDER BY generated_at DESC LIMIT 1`,
    [SNAPSHOT_KEY]
  );
  return {
    configured: Boolean(sourceConnectionString()),
    latest: rows[0] || null,
  };
}

module.exports = { SNAPSHOT_KEY, syncCaseStudy, latestSnapshot, syncStatus, buildSnapshot, readSourceRows };

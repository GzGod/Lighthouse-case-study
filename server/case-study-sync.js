const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { enrichProjectLogos, withLocalProjectLogos } = require('./project-avatar');
const { applyProjectLogos, refreshProjectLogos } = require('./project-logo-service');

const SNAPSHOT_KEY = 'public-v1';
const FALLBACK_SNAPSHOT_PATH = path.join(__dirname, 'public-case-study-snapshot.json');
const FALLBACK_TOP_TWEETS_PATH = path.join(__dirname, 'public-top-tweets.json');
let sourcePool = null;
let syncPromise = null;
let fallbackTopTweets = null;

function withFallbackTopTweets(payload) {
  if (!payload?.cases) return payload;
  if (!fallbackTopTweets) {
    try { fallbackTopTweets = JSON.parse(fs.readFileSync(FALLBACK_TOP_TWEETS_PATH, 'utf8')); }
    catch { fallbackTopTweets = {}; }
  }
  return {
    ...payload,
    meta: {
      ...payload.meta,
      privacy: 'Project metrics are aggregated; only the three highest-reach public X posts for each placement are linked on project detail pages.',
    },
    cases: payload.cases.map(item => {
      if (item.topTweets?.length) return item;
      const fallback = (fallbackTopTweets[item.id] || [])
        // Only drop entries with no usable URL — the X embed widget loads
        // views/text itself, so zero-metric entries with a valid URL are fine.
        .filter(t => t.url && t.id);
      return { ...item, topTweets: fallback };
    }),
  };
}

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

function isIdentityBearingName(value) {
  const text = String(value || '').trim();
  return /https?:\/\//i.test(text) || /(?:^|[\s/])(?:x\.com|twitter\.com|t\.co)\b/i.test(text) || /\/status\/\d+/i.test(text) || /@[a-z0-9_]{2,}/i.test(text);
}

function cleanProjectName(value) {
  let text = String(value || '').trim();
  if (!text) return '';
  text = text
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/(?:^|\s)@[a-z0-9_]{2,}/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[（(]\s*[）)]/g, '')
    .trim();
  return isIdentityBearingName(text) ? '' : text;
}

function fallbackProjectName(row) {
  return `Public campaign ${hash(row.campaignId || row.id)}`;
}

function officialWebsite(value, projectName) {
  const name = String(projectName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (name.length < 3) return '';
  for (const raw of String(value || '').match(/https?:\/\/[^\s，,]+/gi) || []) {
    try {
      const url = new URL(raw.replace(/[.)。]+$/, ''));
      const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9]/g, '');
      if (url.protocol === 'https:' && host.includes(name) && !/(xcom|twittercom|tme|githubcom|onelinkme)$/.test(host)) return url.origin;
    } catch {}
  }
  return '';
}

function publicTopTweets(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map(tweet => {
      const match = String(tweet?.tweetUrl || '').match(/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([a-zA-Z0-9_]+)\/status\/(\d+)/i);
      if (!match || seen.has(match[2])) return null;
      seen.add(match[2]);
      return {
        id: match[2],
        url: `https://x.com/${match[1]}/status/${match[2]}`,
        username: match[1],
        text: String(tweet.text || '').trim().slice(0, 320),
        views: number(tweet.views),
        likes: number(tweet.likes),
        replies: number(tweet.replies),
        retweets: number(tweet.retweets),
      };
    })
    .filter(t => t !== null)
    // Keep entries with a valid tweet URL — the X embed widget loads
    // views/text itself, so zero-metric entries are still renderable.
    .filter(t => t.url && t.id)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);
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
    logo: project.logo || '',
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
    topTweets: source === 'campaign' ? publicTopTweets(row.tweetsData) : [],
  };
}

function sanitizeSnapshot(payload) {
  if (!payload || !Array.isArray(payload.projects) || !Array.isArray(payload.cases)) return payload;
  const hiddenLegacySlug = 'legacy-public-cases';
  const visibleProjects = payload.projects.filter(project => project.slug !== hiddenLegacySlug && project.name !== 'Legacy public cases');
  const visibleCases = payload.cases.filter(item => item.projectSlug !== hiddenLegacySlug && item.projectName !== 'Legacy public cases');
  const projectMap = new Map();
  let projects = visibleProjects.map(project => {
    const originalKey = project.key || project.slug || project.name;
    const cleanName = cleanProjectName(project.name) || (project.source === 'legacy' ? 'Legacy public cases' : '');
    const unsafe = !cleanName || isIdentityBearingName(project.name);
    const name = cleanName || `Public campaign ${hash(originalKey)}`;
    const slug = unsafe && project.source !== 'legacy' ? `public-campaign-${hash(originalKey)}` : project.slug;
    projectMap.set(project.slug, { name, slug, logo: project.logo || '' });
    const { key: _privateKey, ...publicProject } = project;
    const placements = Math.max(0, number(project.placements ?? project.cases));
    return { ...publicProject, name, slug, placements, cases: placements };
  });
  const placementBySlug = new Map(projects.map(project => [project.slug, project.placements]));
  let cases = visibleCases.map(item => {
    const mapped = projectMap.get(item.projectSlug);
    const projectName = mapped?.name || (item.source === 'legacy' ? 'Legacy public cases' : cleanProjectName(item.projectName) || `Public campaign ${hash(item.projectSlug || item.id)}`);
    return {
      ...item,
      projectSlug: mapped?.slug || item.projectSlug,
      projectName,
      logo: mapped?.logo || item.logo || '',
      label: item.source === 'legacy' ? item.label : projectName,
      placements: Math.max(0, number(item.placements ?? placementBySlug.get(mapped?.slug || item.projectSlug) ?? 1)),
    };
  });

  // Older snapshots were grouped by source. Consolidate those persisted rows
  // too, so deploying this version immediately fixes existing snapshots.
  const merged = new Map();
  const canonicalSlugBySlug = new Map();
  for (const project of projects) {
    const key = `project:${String(project.name || '').trim().toLowerCase()}`;
    let target = merged.get(key);
    if (!target) {
      target = {
        ...project,
        sourceSet: new Set(),
        placements: 0,
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
      };
      merged.set(key, target);
    }
    canonicalSlugBySlug.set(project.slug, target.slug);
    if (project.source) target.sourceSet.add(project.source);
    if (!target.logo && project.logo) target.logo = project.logo;
  }
  cases = cases.map(item => {
    const projectSlug = canonicalSlugBySlug.get(item.projectSlug) || item.projectSlug;
    const project = [...merged.values()].find(candidate => candidate.slug === projectSlug);
    return {
      ...item,
      projectSlug,
      projectName: project?.name || item.projectName,
      logo: project?.logo || item.logo || '',
      label: item.source === 'legacy' ? item.label : (project?.name || item.projectName),
    };
  });
  for (const item of cases) {
    const project = [...merged.values()].find(candidate => candidate.slug === item.projectSlug);
    if (!project) continue;
    project.sourceSet.add(item.source);
    project.placements += 1;
    project.cases += 1;
    project.budget += number(item.budget);
    project.impressions += number(item.impressions);
    project.likes += number(item.likes);
    project.replies += number(item.replies);
    project.retweets += number(item.retweets);
    project.quotes += number(item.quotes);
    project.engagements += number(item.engagements);
    project.participants += number(item.participants);
    if (item.createdAt) {
      if (!project.startDate || new Date(item.createdAt) < new Date(project.startDate)) project.startDate = item.createdAt;
      if (!project.endDate || new Date(item.createdAt) > new Date(project.endDate)) project.endDate = item.createdAt;
    }
  }
  projects = [...merged.values()].map(project => {
    const { sourceSet, key: _privateKey, ...publicProject } = project;
    return {
      ...publicProject,
      source: sourceSet.size === 1 ? [...sourceSet][0] : 'mixed',
      placements: project.placements,
      cases: project.cases,
      budget: round(project.budget),
      cpm: project.impressions > 0 ? round(project.budget * 1000 / project.impressions) : 0,
      cpe: project.engagements > 0 ? round(project.budget / project.engagements) : 0,
      er: project.impressions > 0 ? round(project.engagements / project.impressions * 100) : 0,
    };
  });
  const mergedPlacementBySlug = new Map(projects.map(project => [project.slug, project.placements]));
  cases = cases.map(item => ({ ...item, placements: mergedPlacementBySlug.get(item.projectSlug) || 1 }));
  const aggregate = cases.reduce((sum, item) => {
    sum.budget += number(item.budget);
    sum.impressions += number(item.impressions);
    sum.likes += number(item.likes);
    sum.replies += number(item.replies);
    sum.retweets += number(item.retweets);
    sum.quotes += number(item.quotes);
    sum.engagements += number(item.engagements);
    return sum;
  }, { budget: 0, impressions: 0, likes: 0, replies: 0, retweets: 0, quotes: 0, engagements: 0 });
  const bySource = ['campaign', 'legacy'].reduce((result, source) => {
    const sourceCases = cases.filter(item => item.source === source);
    const sourceAggregate = sourceCases.reduce((sum, item) => {
      sum.budget += number(item.budget);
      sum.impressions += number(item.impressions);
      sum.likes += number(item.likes);
      sum.replies += number(item.replies);
      sum.retweets += number(item.retweets);
      sum.quotes += number(item.quotes);
      sum.engagements += number(item.engagements);
      return sum;
    }, { budget: 0, impressions: 0, likes: 0, replies: 0, retweets: 0, quotes: 0, engagements: 0 });
    result[source] = {
      ...sourceAggregate,
      placements: sourceCases.length,
      budget: round(sourceAggregate.budget),
      cpm: sourceAggregate.impressions > 0 ? round(sourceAggregate.budget * 1000 / sourceAggregate.impressions) : 0,
      cpe: sourceAggregate.engagements > 0 ? round(sourceAggregate.budget / sourceAggregate.engagements) : 0,
      er: sourceAggregate.impressions > 0 ? round(sourceAggregate.engagements / sourceAggregate.impressions * 100) : 0,
      cases: sourceCases.length,
    };
    return result;
  }, {});
  const dates = cases.map(item => item.createdAt).filter(Boolean).map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime()));
  const dateRange = dates.length ? {
    start: new Date(Math.min(...dates.map(date => date.getTime()))).toISOString(),
    end: new Date(Math.max(...dates.map(date => date.getTime()))).toISOString(),
  } : { start: null, end: null };
  return {
    ...payload,
    meta: {
      ...(payload.meta || {}),
      counts: {
        ...(payload.meta?.counts || {}),
        cases: cases.length,
        placements: cases.length,
        campaignCases: cases.filter(item => item.source === 'campaign').length,
        legacyCases: cases.filter(item => item.source === 'legacy').length,
        projects: projects.length,
      },
      dateRange,
    },
    metrics: {
      ...aggregate,
      placements: cases.length,
      budget: round(aggregate.budget),
      cpm: aggregate.impressions > 0 ? round(aggregate.budget * 1000 / aggregate.impressions) : 0,
      cpe: aggregate.engagements > 0 ? round(aggregate.budget / aggregate.engagements) : 0,
      er: aggregate.impressions > 0 ? round(aggregate.engagements / aggregate.impressions * 100) : 0,
      bySource,
    },
    projects,
    cases,
  };
}

// Case study scope: every TWEET-type reward pool on the platform except
// direct invites (mode = INVITE). Drafts, pools awaiting review and pools
// that were taken down never ran, so they are left out.
const EXCLUDED_POOL_STATUSES = ['DRAFT', 'AWAITING_REVIEW_START', 'TAKEN_DOWN'];

function hasValidTweets(value) {
  return Array.isArray(value) && value.some(t => /\/status\/\d+/.test(String(t?.tweetUrl || '')));
}

async function readSourceRows() {
  const pool = getSourcePool();
  if (!pool) throw new Error('LIGHTHOUSE_SOURCE_DATABASE_URL is not configured');
  const { rows: pools } = await pool.query(`
    SELECT
      c.id AS "campaignId",
      c."projectName",
      c.title,
      c."requiredMentions",
      c.brief,
      c.description,
      c."projectLogo",
      c."requiredLinkUrl",
      c."consumedBudget",
      c."createdAt" AS "campaignCreatedAt",
      c."updatedAt" AS "campaignUpdatedAt",
      ca.id AS "caseId",
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
      ca."tweetsData"
    FROM public.unified_campaigns c
    LEFT JOIN LATERAL (
      SELECT * FROM public.cases x
      WHERE x."campaignId" = c.id
      ORDER BY x."isShow" DESC, x."updatedAt" DESC NULLS LAST
      LIMIT 1
    ) ca ON TRUE
    WHERE c.type = 'TWEET'
      AND c.mode <> 'INVITE'
      AND c.status::text <> ALL($1::text[])
    ORDER BY c."createdAt" DESC NULLS LAST, c.id ASC
  `, [EXCLUDED_POOL_STATUSES]);
  if (!pools.length) return [];

  // Pools without a cases record get their metrics and top posts from the
  // participant submissions (withdrawn and declined submissions excluded).
  const ids = pools.map(row => row.campaignId);
  const participantFilter = `p."campaignId" = ANY($1::text[]) AND p.status::text <> 'WITHDRAWN' AND p."reviewStatus"::text IS DISTINCT FROM 'DECLINE'`;
  const [{ rows: totals }, { rows: topRows }] = await Promise.all([
    pool.query(`
      SELECT p."campaignId", COUNT(*) AS participants,
        SUM(COALESCE(p.views, 0)) AS views, SUM(COALESCE(p.likes, 0)) AS likes,
        SUM(COALESCE(p.replies, 0)) AS replies, SUM(COALESCE(p.retweets, 0)) AS retweets
      FROM public.unified_campaign_participants p
      WHERE ${participantFilter}
      GROUP BY p."campaignId"
    `, [ids]),
    pool.query(`
      SELECT * FROM (
        SELECT p."campaignId", p.submission->>'tweetUrl' AS "tweetUrl",
          p.views, p.likes, p.replies, p.retweets,
          ROW_NUMBER() OVER (PARTITION BY p."campaignId" ORDER BY COALESCE(p.views, 0) DESC) AS rank
        FROM public.unified_campaign_participants p
        WHERE ${participantFilter} AND p.submission->>'tweetUrl' IS NOT NULL
      ) ranked
      WHERE rank <= 3
    `, [ids]),
  ]);
  const totalsById = new Map(totals.map(row => [row.campaignId, row]));
  const unnamedIds = pools.filter(row => !cleanProjectName(row.projectName)).map(row => row.campaignId);
  const { rows: textRows } = unnamedIds.length ? await pool.query(`
    SELECT p."campaignId", string_agg(LEFT(COALESCE(p.submission->>'text', p."workingDraftText", ''), 600), ' ') AS text
    FROM public.unified_campaign_participants p
    WHERE p."campaignId" = ANY($1::text[])
    GROUP BY p."campaignId"
  `, [unnamedIds]) : { rows: [] };
  const submittedTextById = new Map(textRows.map(row => [row.campaignId, row.text || '']));
  const topById = new Map();
  for (const row of topRows) {
    if (!topById.has(row.campaignId)) topById.set(row.campaignId, []);
    topById.get(row.campaignId).push({ tweetUrl: row.tweetUrl, text: '', views: row.views, likes: row.likes, replies: row.replies, retweets: row.retweets });
  }

  return pools.map(row => {
    const useCase = row.caseId && number(row.totalViews) > 0;
    const agg = totalsById.get(row.campaignId) || {};
    return {
      id: row.caseId || row.campaignId,
      source: 'campaign',
      campaignId: row.campaignId,
      campaignType: 'TWEET',
      projectName: row.projectName,
      title: row.title,
      requiredMentions: row.requiredMentions,
      brief: row.brief,
      description: row.description,
      projectLogo: row.projectLogo,
      requiredLinkUrl: row.requiredLinkUrl,
      totalBudget: row.caseId ? row.totalBudget : row.consumedBudget,
      totalViews: useCase ? row.totalViews : agg.views,
      totalLikes: useCase ? row.totalLikes : agg.likes,
      totalReplies: useCase ? row.totalReplies : agg.replies,
      totalRetweets: useCase ? row.totalRetweets : agg.retweets,
      totalQuotes: useCase ? row.totalQuotes : 0,
      kolsParticipate: useCase ? row.kolsParticipate : agg.participants,
      createdAt: row.createdAt || row.campaignCreatedAt,
      updatedAt: row.updatedAt || row.campaignUpdatedAt,
      lastXSyncedAt: row.lastXSyncedAt,
      tweetsData: hasValidTweets(row.tweetsData) ? row.tweetsData : (topById.get(row.campaignId) || []),
      submittedText: submittedTextById.get(row.campaignId) || '',
    };
  });
}

// ─── Project name resolution for pools without a projectName ────────────────
// Signals, in order: an admin label, requiredMentions / title matched against
// projects that do have a name, the first required mention, then the brand
// word a title starts with. Names are then grouped by a normalized key so
// "ForegateCN", "Fore_Gate" and "ForeGate" land in one project.
const NAME_SUFFIXES = /(com|fi|io|ai|xyz|app|network|global|labs|protocol|finance|official|hq|cn|zh)$/;

function nameKey(value) {
  let key = String(value || '').toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '');
  for (let next = key.replace(NAME_SUFFIXES, ''); next !== key && next.length >= 3; next = key.replace(NAME_SUFFIXES, '')) key = next;
  return key;
}

function mentionHandles(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(/[\s,，]+/);
  return list
    .flatMap(item => String(item || '').match(/@?[A-Za-z0-9_]{2,}/g) || [])
    .map(handle => handle.replace(/^@/, '').replace(/_+$/, ''))
    .filter(Boolean);
}

function titleBrand(title) {
  const match = String(title || '').match(/^\s*@?([A-Za-z][A-Za-z0-9.]{1,30})/);
  return match ? match[1] : '';
}

// "defillama数据分析" → "defillama": a lowercase/latin word fused to CJK text.
function fusedBrand(title) {
  const match = String(title || '').match(/^\s*([A-Za-z][A-Za-z0-9]{3,30})(?=[一-鿿])/);
  return match ? match[1] : '';
}

// Last resort for unnamed pools: read the brief, description and the posts
// creators submitted, and take the brand they mention most. @handles and
// $tickers count double; known project names are matched first. Lighthouse's
// own account and the big media/news handles never count as the client.
const NOT_A_CLIENT = new Set([
  'lighthouse', 'lighthousetw', 'kol', 'mod', 'bd', 'web3', 'crypto', 'tradfi', 'qdii', 'cd', 'ai', 'agent', 'meme',
  'cointelegraph', 'coindesk', 'theblock', 'wublockchain', 'binance', 'okx',
  'btc', 'eth', 'usdt', 'usdc', 'sol', 'bnb', 'bitcoin', 'ethereum',
  'x', 'twitter', 'google', 'docs', 'forms', 'gmail', 'youtube', 'telegram', 'discord',
]);

// "https://www.gate.com/zh/proof-of-reserves" → Gate (only when it matches a
// project that already has a name, so generic hosts like docs.google.com never count).
function linkBrand(text, matchKnown) {
  for (const [, host] of String(text || '').matchAll(/https?:\/\/(?:www\.)?([a-z0-9-]+)\.[a-z.]+/gi)) {
    const known = matchKnown(nameKey(host));
    if (known) return known;
  }
  return '';
}

function contentBrand(row, matchKnown) {
  const text = [row.brief, row.description, row.submittedText].map(value => String(value || '')).join(' ');
  if (!text.trim()) return '';

  const scores = new Map();
  const add = (word, weight) => {
    const key = nameKey(word);
    if (key.length < 3 || NOT_A_CLIENT.has(key)) return;
    const entry = scores.get(key) || { word, score: 0 };
    entry.score += weight;
    scores.set(key, entry);
  };
  for (const [, handle] of text.matchAll(/@([A-Za-z0-9_]{3,30})/g)) add(handle.replace(/_+$/, ''), 2);
  for (const [, ticker] of text.matchAll(/\$([A-Za-z][A-Za-z0-9]{1,10})\b/g)) add(ticker, 2);
  for (const [, phrase] of text.matchAll(/\b([A-Z][A-Za-z0-9]+(?:\s(?:Network|Protocol|Labs|Finance|Exchange|AI|Chain))?)\b/g)) add(phrase, 1);
  // Count every mention of each candidate across the whole text (plain words
  // too) and take the most mentioned, using the known spelling if it has one.
  const lower = text.toLowerCase();
  for (const [key, entry] of scores) {
    const plain = (lower.match(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    entry.score = Math.max(entry.score, plain);
    entry.known = matchKnown(key);
  }
  const ranked = [...scores.values()].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  // One mention is enough for a project we already know; an unknown word has
  // to come up at least three times before it is treated as the client.
  if (!top || top.score < (top.known ? 1 : 3)) return '';
  return top.known || top.word;
}

function resolveProjectNames(rows, manualNames) {
  const known = new Map(); // nameKey → display name of a pool that has a projectName
  for (const row of rows) {
    const name = cleanProjectName(row.projectName);
    if (name && !known.has(nameKey(name))) known.set(nameKey(name), name);
  }
  const knownKeys = [...known.keys()].filter(key => key.length >= 3);
  const firstWords = new Map([...known].map(([key, name]) => [nameKey(name.split(/\s+/)[0]), name]));
  const matchKnown = (key) => key.length >= 3 && (known.get(key) || known.get(knownKeys.find(k => key.startsWith(k) || k.startsWith(key))));

  const brandCounts = new Map();
  for (const row of rows) {
    if (cleanProjectName(row.projectName)) continue;
    const key = nameKey(titleBrand(row.title));
    if (key) brandCounts.set(key, (brandCounts.get(key) || 0) + 1);
  }

  const unresolved = [];
  const learn = (name) => { const key = nameKey(name); if (key && !known.has(key)) { known.set(key, name); knownKeys.push(key); } };
  for (const row of rows) {
    if (cleanProjectName(row.projectName)) continue;
    let name = manualNames.get(String(row.campaignId)) || '';
    const handles = mentionHandles(row.requiredMentions);
    if (!name) for (const handle of handles) { name = matchKnown(nameKey(handle)); if (name) break; }
    if (!name) {
      const title = nameKey(row.title);
      const hit = knownKeys.filter(key => key.length >= 4 && title.includes(key)).sort((a, b) => b.length - a.length)[0];
      if (hit) name = known.get(hit);
    }
    if (!name && handles.length) name = handles[0];
    if (!name) {
      // A title's leading Latin word counts when it matches a known project,
      // repeats across several unnamed pools ("Gate 24h 净流入", "Gate VIP …"),
      // or is styled like a brand (CamelCase / all caps). One-off generic
      // words such as "Test" are left for manual labelling.
      const brand = titleBrand(row.title);
      if (brand) {
        name = firstWords.get(nameKey(brand)) || matchKnown(nameKey(brand))
          || ((brandCounts.get(nameKey(brand)) || 0) >= 2 || /^[A-Z0-9]{2,}$|[a-z][A-Z]/.test(brand) || fusedBrand(row.title) || /\s(Report|Research|Labs|Protocol|Network|Finance)\b/.test(row.title) ? brand : '');
      }
    }
    if (name) { row.projectName = name; learn(name); }
    else unresolved.push(row);
  }

  // Second pass over what is left: links and post content, now that names
  // from titles (e.g. the Gate pools) are known too.
  for (const row of unresolved.splice(0)) {
    // "选项1 … 选项2 …" briefs cover several projects at once and each creator
    // picks one, so the pool can't be credited to a single project.
    const multiProject = /选项\s*[2二]/.test(`${row.brief || ''} ${row.description || ''}`);
    // Free text only counts exact name matches; prefix matching would turn "ALL IN" into AllScale.
    const matchExact = (key) => key.length >= 3 && known.get(key);
    const name = multiProject ? '' : linkBrand(row.requiredLinkUrl, matchKnown) || linkBrand(row.description, matchKnown) || contentBrand(row, matchExact);
    if (name) row.projectName = name;
    else unresolved.push(row);
  }

  // One display name per normalized key; names from projectName win.
  const display = new Map();
  for (const [key, name] of known) display.set(key, name);
  for (const row of rows) {
    const name = cleanProjectName(row.projectName);
    if (!name) continue;
    const key = nameKey(name);
    if (!display.has(key)) display.set(key, name);
    row.projectName = display.get(key);
  }
  return unresolved;
}

function buildSnapshot(rows) {
  const projectMap = new Map();
  const usedSlugs = new Map();
  const orderedRows = [...rows]
    .filter(row => row.source === 'campaign' || cleanProjectName(row.projectName))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const projectFor = (row) => {
    const rawName = cleanProjectName(row.projectName);
    const source = row.source === 'campaign' ? 'campaign' : 'legacy';
    const fallbackKey = source === 'campaign'
      ? `campaign:${row.campaignId || row.id}`
      : 'legacy:public-cases';
    const name = rawName || (source === 'campaign' ? fallbackProjectName(row) : 'Legacy public cases');
    // Named records represent the same project regardless of whether they came
    // from the campaign or legacy source. Anonymous campaigns stay isolated by
    // campaign id so unrelated records are never merged accidentally.
    const key = rawName ? `project:${name.toLowerCase()}` : fallbackKey;
    if (!projectMap.has(key)) {
      const base = slugify(name, `${source}-${hash(key)}`);
      const previousKey = usedSlugs.get(base);
      const slug = previousKey && previousKey !== key ? `${base}-${hash(key)}` : base;
      usedSlugs.set(slug, key);
      projectMap.set(key, {
        key,
        slug: rawName ? slug : (source === 'legacy' ? 'legacy-public-cases' : base),
        name,
        logo: /^https:\/\/[^\s]+$/i.test(String(row.projectLogo || '')) ? row.projectLogo : '',
        website: officialWebsite(row.requiredLinkUrl, name),
        sources: new Set(),
        placements: 0,
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
    if (!project.logo && /^https:\/\/[^\s]+$/i.test(String(row.projectLogo || ''))) project.logo = row.projectLogo;
    if (!project.website) project.website = officialWebsite(row.requiredLinkUrl, project.name);
    const item = publicCase(row, index, project);
    project.sources.add(item.source);
    project.placements += 1;
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
    source: project.sources.size === 1 ? [...project.sources][0] : 'mixed',
    placements: project.placements,
    cases: project.cases,
    budget: round(project.budget),
    cpm: project.impressions > 0 ? round(project.budget * 1000 / project.impressions) : 0,
    cpe: project.engagements > 0 ? round(project.budget / project.engagements) : 0,
    er: project.impressions > 0 ? round(project.engagements / project.impressions * 100) : 0,
  })).map(project => {
    const { key: _privateKey, sources: _sources, ...publicProject } = project;
    return publicProject;
  }).sort((a, b) => b.impressions - a.impressions);

  const placementBySlug = new Map(projects.map(project => [project.slug, project.placements]));
  cases.forEach(item => { item.placements = placementBySlug.get(item.projectSlug) || 1; });

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
      placements: sourceCases.length,
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
  return sanitizeSnapshot({
    version: 1,
    meta: {
      snapshotKey: SNAPSHOT_KEY,
      generatedAt: new Date().toISOString(),
      sourceUpdatedAt: sourceUpdatedAt ? new Date(sourceUpdatedAt).toISOString() : null,
      dateRange,
      counts: {
        cases: cases.length,
        placements: cases.length,
        campaignCases: cases.filter(item => item.source === 'campaign').length,
        legacyCases: cases.filter(item => item.source === 'legacy').length,
        projects: projects.length,
      },
      privacy: 'Project metrics are aggregated; only the three highest-reach public X posts for each placement are linked on project detail pages.',
    },
    metrics: {
      ...metrics,
      placements: cases.length,
      budget: round(metrics.budget),
      cpm: metrics.impressions > 0 ? round(metrics.budget * 1000 / metrics.impressions) : 0,
      cpe: metrics.engagements > 0 ? round(metrics.budget / metrics.engagements) : 0,
      er: metrics.impressions > 0 ? round(metrics.engagements / metrics.impressions * 100) : 0,
      bySource,
    },
    projects,
    cases,
  });
}

function readFallbackSnapshot() {
  try {
    const payload = JSON.parse(fs.readFileSync(FALLBACK_SNAPSHOT_PATH, 'utf8'));
    return withLocalProjectLogos(sanitizeSnapshot(payload));
  } catch (error) {
    console.error(`Public case fallback snapshot unavailable: ${error.message}`);
    return null;
  }
}

async function seedFallbackSnapshot(cmsPool) {
  if (sourceConnectionString()) return false;
  const existing = await latestSnapshot(cmsPool);
  if (existing) return false;
  const payload = readFallbackSnapshot();
  if (!payload?.meta?.counts?.cases) return false;
  await cmsPool.query(
    `INSERT INTO case_study_snapshots
      (snapshot_key, status, payload, source_updated_at, generated_at, row_count, error)
     VALUES ($1, 'ready', $2::jsonb, $3, COALESCE($4::timestamptz, NOW()), $5, NULL)`,
    [SNAPSHOT_KEY, JSON.stringify(payload), payload.meta.sourceUpdatedAt || null, payload.meta.generatedAt || null, payload.meta.counts.cases]
  );
  return true;
}

// Keep the admin "匿名活动认领" queue equal to the pools that still have no
// name. Admin labels and hidden pools are never removed.
async function queueUnresolvedPools(cmsPool, unresolved) {
  try {
    const ids = unresolved.map(row => String(row.campaignId));
    await cmsPool.query(
      `DELETE FROM pending_campaign_names WHERE resolved_by NOT IN ('manual', 'hidden') AND NOT (campaign_id = ANY($1::text[]))`,
      [ids]);
    for (const row of unresolved) {
      await cmsPool.query(`
        INSERT INTO pending_campaign_names
          (campaign_id, total_budget, consumed_budget, total_views, total_engagement,
           participant_count, created_at_source, signals, resolved_by, updated_at)
        VALUES ($1, $2, $2, $3, $4, $5, $6, $7, 'pending', NOW())
        ON CONFLICT (campaign_id) DO UPDATE SET
          total_budget = EXCLUDED.total_budget, consumed_budget = EXCLUDED.consumed_budget,
          total_views = EXCLUDED.total_views, total_engagement = EXCLUDED.total_engagement,
          participant_count = EXCLUDED.participant_count, signals = EXCLUDED.signals, updated_at = NOW()
      `, [
        String(row.campaignId), number(row.totalBudget), number(row.totalViews), metricSum(row),
        number(row.kolsParticipate), row.createdAt || null,
        JSON.stringify({ title: row.title || '', reqMentions: mentionHandles(row.requiredMentions), link: row.requiredLinkUrl || '' }),
      ]);
    }
  } catch (error) {
    console.warn(`[sync] pending queue update skipped: ${error.message}`);
  }
}

async function syncCaseStudy(cmsPool) {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    const rows = await readSourceRows();

    // Admin decisions from the "匿名活动认领" page: labels take priority over
    // automatic names, and hidden pools are left out of the case study.
    const manualNames = new Map();
    const hiddenIds = new Set();
    try {
      const { rows: decided } = await cmsPool.query(
        `SELECT campaign_id, resolved_name, resolved_by FROM pending_campaign_names
         WHERE resolved_by IN ('manual', 'hidden')`);
      for (const row of decided) {
        if (row.resolved_by === 'hidden') hiddenIds.add(String(row.campaign_id));
        else if (row.resolved_name) manualNames.set(String(row.campaign_id), row.resolved_name);
      }
    } catch (error) {
      console.warn(`[sync] admin decisions skipped: ${error.message}`);
    }
    const visibleRows = rows.filter(row => !hiddenIds.has(String(row.campaignId)));
    const unresolved = resolveProjectNames(visibleRows, manualNames);
    await queueUnresolvedPools(cmsPool, unresolved);

    const payload = await enrichProjectLogos(buildSnapshot(visibleRows));
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
  if (!rows[0]) return null;
  const basePayload = await enrichProjectLogos(withFallbackTopTweets(sanitizeSnapshot(typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload)));
  const payload = await applyProjectLogos(cmsPool, basePayload);
  refreshProjectLogos(cmsPool, basePayload).catch(error => console.warn(`Project logo refresh skipped: ${error.message}`));
  return { ...rows[0], payload };
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

module.exports = { SNAPSHOT_KEY, syncCaseStudy, latestSnapshot, syncStatus, buildSnapshot, readSourceRows, resolveProjectNames, seedFallbackSnapshot, sanitizeSnapshot };

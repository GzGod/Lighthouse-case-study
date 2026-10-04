const net = require('net');
const dns = require('dns').promises;
const { isGeneratedProject, normalizedName, rootDataLogo, withLocalProjectLogos } = require('./project-avatar');

const CACHE_DAYS = 30;
let refreshPromise = null;
let llamaPromise = null;
let coingeckoPromise = null;

function publicHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !host || host === 'localhost' || host.endsWith('.local') || net.isIP(host)) return '';
    if (url.username || url.password) return '';
    return url.href;
  } catch { return ''; }
}

function safeLogoPath(value) {
  const path = String(value || '').trim();
  return /^\/api\/upload\/\d+\/raw$/.test(path) || /^\/?assets\/logos\/[a-zA-Z0-9_.-]+$/.test(path) || Boolean(publicHttpsUrl(path));
}

function publicAddress(address) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168));
  }
  if (net.isIP(address) === 6) return !/^(::1|::|fc|fd|fe80)/i.test(address);
  return false;
}

async function safeFetch(url, options = {}) {
  let current = publicHttpsUrl(url);
  if (!current) return null;
  for (let i = 0; i < 3; i++) {
    const addresses = await dns.lookup(new URL(current).hostname, { all: true });
    if (!addresses.length || addresses.some(item => !publicAddress(item.address))) return null;
    const response = await fetch(current, { ...options, redirect: 'manual', signal: AbortSignal.timeout(7000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response.ok ? response : null;
    current = publicHttpsUrl(new URL(response.headers.get('location') || '', current).href);
    await response.body?.cancel();
    if (!current) return null;
  }
  return null;
}

async function imageBytes(url) {
  try {
    const response = await safeFetch(url, { headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*' } });
    if (!response) return null;
    const declaredMime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
    if (Number(response.headers.get('content-length') || 0) > 2_000_000) return null;
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 2_000_000) { await reader.cancel(); return null; }
      chunks.push(Buffer.from(value));
    }
    if (!length) return null;
    const bytes = Buffer.concat(chunks);
    let mime = '';
    if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) mime = 'image/jpeg';
    else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) mime = 'image/png';
    else if (bytes.subarray(0, 3).toString() === 'GIF') mime = 'image/gif';
    else if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') mime = 'image/webp';
    else if (bytes.subarray(4, 12).toString().includes('ftypavif')) mime = 'image/avif';
    else if (bytes.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))) mime = 'image/x-icon';
    if (!mime || (declaredMime.startsWith('image/') && declaredMime !== mime && declaredMime !== 'image/vnd.microsoft.icon')) return null;
    return { bytes, mime };
  } catch { return null; }
}

function htmlAsset(html, pageUrl) {
  const tags = String(html || '').match(/<(?:meta|link)\b[^>]*>/gi) || [];
  const candidates = [];
  for (const tag of tags) {
    const attr = key => (tag.match(new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1] || '';
    const rel = attr('rel').toLowerCase();
    const property = (attr('property') || attr('name')).toLowerCase();
    const value = attr('content') || attr('href');
    let priority = 99;
    if (rel.includes('apple-touch-icon')) priority = 0;
    else if (property === 'og:image' || property === 'twitter:image') priority = 1;
    else if (rel.includes('icon')) priority = 2;
    if (priority < 99 && value) {
      try { candidates.push({ url: new URL(value.replace(/&amp;/g, '&'), pageUrl).href, priority }); } catch {}
    }
  }
  for (const match of String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const visit = value => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!value || typeof value !== 'object') return;
        if (value.logo) {
          const logo = typeof value.logo === 'string' ? value.logo : value.logo.url;
          if (logo) candidates.push({ url: new URL(logo, pageUrl).href, priority: 1 });
        }
        if (value['@graph']) visit(value['@graph']);
      };
      visit(JSON.parse(match[1]));
    } catch {}
  }
  return candidates.sort((a, b) => a.priority - b.priority).map(item => item.url);
}

async function websiteCandidates(website, name) {
  if (!publicHttpsUrl(website)) return [];
  try {
    const response = await safeFetch(website, { headers: { Accept: 'text/html' } });
    if (!response || !(response.headers.get('content-type') || '').includes('text/html')) return [];
    const html = (await response.text()).slice(0, 500_000);
    const candidates = htmlAsset(html, website);
    const key = normalizedName(name);
    if (key.length >= 5) {
      for (const match of html.matchAll(/href=["'](https:\/\/(?:www\.)?(?:github\.com|x\.com|twitter\.com)\/([a-zA-Z0-9_-]+)\/?)["']/gi)) {
        const handle = match[2];
        const normalized = normalizedName(handle);
        if (!normalized.includes(key) && !key.includes(normalized)) continue;
        if (/github\.com/i.test(match[1])) candidates.push(`https://github.com/${handle}.png?size=200`);
        else candidates.push(`https://unavatar.io/twitter/${handle}`);
      }
    }
    return [...candidates, new URL('/favicon.ico', website).href];
  } catch { return []; }
}

async function llamaLogo(name) {
  try {
    if (!llamaPromise) llamaPromise = safeFetch('https://api.llama.fi/protocols').then(r => r?.json()).catch(() => []);
    const rows = await llamaPromise;
    const key = normalizedName(name);
    if (key.length < 5) return '';
    const row = Array.isArray(rows) ? rows.find(item => normalizedName(item.name) === key && item.logo) : null;
    if (!row) return '';
    return publicHttpsUrl(row.logo) || publicHttpsUrl(`https://icons.llama.fi/${row.logo}`);
  } catch { return ''; }
}

async function coingeckoLogo(name) {
  try {
    const key = normalizedName(name);
    if (key.length < 5) return '';
    if (!coingeckoPromise) coingeckoPromise = safeFetch('https://api.coingecko.com/api/v3/coins/list?include_platform=false').then(r => r?.json()).catch(() => []);
    const rows = await coingeckoPromise;
    const matches = Array.isArray(rows) ? rows.filter(item => normalizedName(item.name) === key) : [];
    if (matches.length !== 1) return '';
    const response = await safeFetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(matches[0].id)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`);
    const body = await response?.json();
    return publicHttpsUrl(body?.image?.large || body?.image?.small);
  } catch { return ''; }
}

async function discoverAndDownload(project) {
  const tryCandidate = async (url, provider) => {
    const image = await imageBytes(url);
    return image ? { ...image, provider, sourceUrl: url } : null;
  };
  if (publicHttpsUrl(project.logo) && project.logoProvider === 'source') {
    const source = await tryCandidate(project.logo, 'source');
    if (source) return source;
  }
  for (const url of await websiteCandidates(project.website, project.name)) {
    const provider = url.includes('github.com/') ? 'github' : url.includes('unavatar.io/twitter/') ? 'x' : 'website';
    const website = await tryCandidate(url, provider);
    if (website) return website;
  }
  if (!isGeneratedProject(project)) {
    const rootdata = await rootDataLogo(project.name);
    if (rootdata) { const image = await tryCandidate(rootdata, 'rootdata'); if (image) return image; }
    const llama = await llamaLogo(project.name);
    if (llama) { const image = await tryCandidate(llama, 'defillama'); if (image) return image; }
    const coingecko = await coingeckoLogo(project.name);
    if (coingecko) { const image = await tryCandidate(coingecko, 'coingecko'); if (image) return image; }
  }
  if (project.website && publicHttpsUrl(project.website)) {
    const host = new URL(project.website).hostname;
    const favicon = await tryCandidate(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`, 'favicon');
    if (favicon) return favicon;
  }
  return null;
}

async function applyProjectLogos(pool, payload) {
  const base = withLocalProjectLogos(payload);
  if (!base?.projects?.length) return base;
  const { rows } = await pool.query('SELECT slug, manual_logo, auto_provider, auto_source_url, auto_checked_at, auto_logo IS NOT NULL AS has_auto FROM case_project_logos');
  const records = new Map(rows.map(row => [row.slug, row]));
  const { rows: cmsRows } = await pool.query("SELECT slug, logo FROM projects WHERE logo LIKE '/api/upload/%'");
  const cmsManual = new Map(cmsRows.map(row => [row.slug, row.logo]));
  const projects = base.projects.map(project => {
    const row = records.get(project.slug);
    const currentSource = project.logoProvider === 'source' ? project.logo : '';
    const manual = row?.manual_logo || cmsManual.get(project.slug);
    if (manual) return { ...project, logo: manual, logoProvider: 'manual', logoCheckedAt: row?.auto_checked_at || null };
    // A newly synced source-library logo outranks any older automatic
    // discovery result. Only reuse a cached automatic image when it was
    // itself downloaded from the same source-library URL.
    const cacheMatchesSource = currentSource
      ? row?.auto_provider === 'source' && row.auto_source_url === currentSource
      : true;
    if (row?.has_auto && project.logoProvider !== 'local' && cacheMatchesSource) {
      return { ...project, logo: `/api/case-study/logos/${encodeURIComponent(project.slug)}`, logoProvider: row.auto_provider || 'auto', logoCheckedAt: row.auto_checked_at || null };
    }
    return project;
  });
  const logos = new Map(projects.map(project => [project.slug, project.logo || '']));
  return { ...base, projects, cases: base.cases?.map(item => ({ ...item, logo: logos.get(item.projectSlug) || '' })) || [] };
}

async function refreshProjectLogos(pool, payload, { force = false } = {}) {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const projects = withLocalProjectLogos(payload)?.projects || [];
    if (!projects.length) return { checked: 0, updated: 0 };
    const { rows } = await pool.query('SELECT slug, manual_logo, auto_source_url, auto_checked_at, auto_logo IS NOT NULL AS has_auto FROM case_project_logos');
    const records = new Map(rows.map(row => [row.slug, row]));
    let checked = 0;
    let updated = 0;
    let cursor = 0;
    const workers = Array.from({ length: 3 }, async () => {
      while (cursor < projects.length) {
        const project = projects[cursor++];
        const row = records.get(project.slug);
        if (row?.manual_logo || isGeneratedProject(project) || project.logoProvider === 'local') continue;
        const source = project.logoProvider === 'source' ? project.logo : '';
        const fresh = row?.auto_checked_at && Date.now() - new Date(row.auto_checked_at).getTime() < CACHE_DAYS * 86400_000;
        if (!force && fresh && row.has_auto && (!source || row.auto_source_url === source)) continue;
        if (!force && fresh && !row.has_auto) continue;
        checked++;
        const result = await discoverAndDownload(project);
        await pool.query(`INSERT INTO case_project_logos (slug, auto_logo, auto_mime, auto_provider, auto_source_url, auto_checked_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
          ON CONFLICT (slug) DO UPDATE SET auto_logo = COALESCE(EXCLUDED.auto_logo, case_project_logos.auto_logo),
            auto_mime = COALESCE(EXCLUDED.auto_mime, case_project_logos.auto_mime),
            auto_provider = COALESCE(EXCLUDED.auto_provider, case_project_logos.auto_provider),
            auto_source_url = COALESCE(EXCLUDED.auto_source_url, case_project_logos.auto_source_url),
            auto_checked_at = NOW(), updated_at = NOW()`,
        [project.slug, result?.bytes || null, result?.mime || null, result?.provider || null, result?.sourceUrl || null]);
        if (result) updated++;
      }
    });
    await Promise.all(workers);
    return { checked, updated };
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

module.exports = { applyProjectLogos, refreshProjectLogos, publicHttpsUrl, safeLogoPath, imageBytes, htmlAsset };

const LOCAL_PROJECT_LOGOS = {
  'hashkey-exchange': 'assets/logos/hashkey.jpg',
  portals: 'assets/logos/portals.jpg',
  zkverify: 'assets/logos/zkverify.jpg',
  sonicsvm: 'assets/logos/sonicsvm.jpg',
  puffpaw: 'assets/logos/puffpaw.jpg',
  allora: 'assets/logos/allora.jpg',
  maiga: 'assets/logos/maiga.jpg',
  'yei-finance': 'assets/logos/yei.jpg',
  kamino: 'assets/logos/kamino.jpg',
  'fight-id': 'assets/logos/fightid.png',
  sentient: 'assets/logos/sentient.jpg',
  ff: 'assets/logos/ff.jpg',
  'lit-protocol': 'assets/logos/litprotocol.jpg',
  heyelsa: 'assets/logos/heyelsa.jpg',
  zetachain: 'assets/logos/zetachain.jpg',
  kaio: 'assets/logos/kaio.png',
  surf: 'assets/logos/surf.svg',
};

const rootDataLogoCache = new Map();
const BUNDLED_LOGOS = require('./public-project-logos.json');

function normalizedName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isUsableLogo(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function localProjectLogo(project) {
  return LOCAL_PROJECT_LOGOS[String(project?.slug || '').toLowerCase()] || '';
}

function isGeneratedProject(project) {
  return !project?.name || /^public campaign [a-f0-9]{12}$/i.test(String(project.name)) || project.slug === 'legacy-public-cases';
}

async function rootDataLogo(name) {
  const apiKey = String(process.env.ROOTDATA_API_KEY || '').trim();
  const key = normalizedName(name);
  if (!apiKey || !key || key.length < 3 || isGeneratedProject({ name })) return '';
  if (rootDataLogoCache.has(key)) return rootDataLogoCache.get(key);

  const pending = (async () => {
    try {
      const response = await fetch('https://api.rootdata.com/open/ser_inv', {
        method: 'POST',
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: String(name).trim() }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return '';
      const body = await response.json();
      const rows = Array.isArray(body?.data) ? body.data : [];
      const exact = rows.find(item => normalizedName(item?.name) === key && isUsableLogo(item?.logo));
      return exact?.logo?.trim() || '';
    } catch (error) {
      console.warn(`RootData logo lookup skipped for ${name}: ${error.message}`);
      return '';
    }
  })();
  rootDataLogoCache.set(key, pending);
  return pending;
}

function withLocalProjectLogos(payload) {
  if (!payload?.projects) return payload;
  const projects = payload.projects.map(project => {
    const bundled = BUNDLED_LOGOS[project.slug] || {};
    const logo = project.logo || bundled.logo || localProjectLogo(project);
    const logoProvider = project.logo ? (project.logoProvider || 'source') : bundled.logo ? 'source' : logo ? 'local' : 'fallback';
    return { ...project, website: project.website || bundled.website || '', logo, logoProvider };
  });
  const logos = new Map(projects.map(project => [project.slug, project.logo || '']));
  return {
    ...payload,
    projects,
    cases: Array.isArray(payload.cases)
      ? payload.cases.map(item => ({ ...item, logo: item.logo || logos.get(item.projectSlug) || '' }))
      : payload.cases,
  };
}

async function enrichProjectLogos(payload) {
  return withLocalProjectLogos(payload);
}

module.exports = { LOCAL_PROJECT_LOGOS, enrichProjectLogos, isGeneratedProject, localProjectLogo, normalizedName, rootDataLogo, withLocalProjectLogos };

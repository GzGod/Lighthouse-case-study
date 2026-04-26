const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const appPart2 = read('app-part2.jsx');
const app = read('app.jsx');
const personalIp = read('personal-ip.jsx');
const admin = read('admin/admin.jsx');
const i18n = read('i18n.jsx');
const appPart3 = read('app-part3.jsx');
const projectsRoute = read('server/routes/projects.js');
const ipCasesRoute = read('server/routes/ip-cases.js');
const db = read('server/db.js');
const caseStudyHtml = read('Lighthouse Case Study.html');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

test('Project routes should validate trimmed name, slug format, and finite numeric fields', () => {
  assert.ok(/const name = String\(input\.name \?\? ''\)\.trim\(\);/.test(projectsRoute), 'missing trimmed name validation in project routes');
  assert.ok(/const slug = String\(input\.slug \?\? ''\)\.trim\(\);/.test(projectsRoute), 'missing trimmed slug validation in project routes');
  assert.ok(/const PROJECT_SLUG_RE = \^?\/\^\[a-z0-9-\]\+\$\//.test(projectsRoute) || /const PROJECT_SLUG_RE = \/\^\[a-z0-9-\]\+\$\//.test(projectsRoute), 'missing slug format validation regex in project routes');
  assert.ok(/Number\.isFinite/.test(projectsRoute), 'missing finite number validation in project routes');
});

test('Project routes should reject duplicate slugs on create and update with a clear 400 error', () => {
  assert.ok(/Project slug already exists/.test(projectsRoute), 'missing duplicate slug error message in project routes');
  assert.ok(/SELECT 1 FROM projects WHERE slug = \$1 LIMIT 1/.test(projectsRoute), 'missing duplicate slug lookup before project create');
  assert.ok(/SELECT 1 FROM projects WHERE slug = \$1 AND id <> \$2 LIMIT 1/.test(projectsRoute), 'missing duplicate slug lookup excluding current project on update');
  assert.ok(/23505/.test(projectsRoute), 'missing postgres unique violation handling for project slug');
  assert.ok(/projects_slug_unique_nonempty/.test(projectsRoute), 'missing project slug unique index conflict mapping');
});

test('Admin should not inject a blank new project draft into preview', () => {
  assert.ok(/function hasProjectDraftIdentity/.test(admin), 'missing new-project preview identity gate helper');
  assert.ok(/if \(currentEditing === 'new' && hasProjectDraftIdentity\(currentForm\)\)/.test(admin), 'blank new project draft is still pushed into preview');
});

test('Admin project save should validate required fields before calling the API', () => {
  assert.ok(/function validateProjectForm/.test(admin), 'missing front-end project form validation helper');
  assert.ok(/const error = validateProjectForm\(form\);\s*if \(error\) \{\s*toast\(error\);\s*return;\s*\}/.test(admin), 'project save still lacks front-end validation before API call');
});

test('Admin project save should surface API errors as toast messages', () => {
  assert.ok(/try\s*\{[\s\S]*await api\('\/projects'[\s\S]*await api\(`\/projects\/\$\{editing\}`[\s\S]*\}\s*catch\s*\(err\)\s*\{[\s\S]*toast\(`保存失败：\$\{err\.message\}`\)/.test(admin), 'project save API errors are not caught and shown via toast');
});

test('Curated stars should filter out missing projects instead of rendering zero-value fallbacks', () => {
  assert.ok(/CURATED_STARS\.map\(\(cs, i\) => \{[\s\S]*if \(!p\) return null;[\s\S]*\}\)\.filter\(Boolean\)/.test(appPart2), 'missing curated-star filter for deleted projects');
  assert.ok(!/const budget = p\?\.budget \|\| 0;/.test(appPart2), 'still falls back to zero-value curated-star stats');
});

test('Stars should not depend on missing cs.name for display data', () => {
  assert.ok(!/name:\s*cs\.name/.test(appPart2), 'found name: cs.name in app-part2.jsx');
});

test('StarCard React key should not use possibly empty s.name', () => {
  assert.ok(!/StarCard key=\{s\.name\}/.test(appPart2), 'found StarCard key={s.name} in app-part2.jsx');
});

test('Hero and footer stats should use baseline wording, not ambiguous total sample wording', () => {
  assert.ok(!/"hero\.foot":\s*"\{totalCount\}/.test(i18n), 'hero.foot still starts with totalCount');
  assert.ok(!/"footer\.stats":\s*"\{totalCount\}.*\{totalTweets\}/.test(i18n), 'footer.stats still mixes totalCount and totalTweets');
});

test('Live i18n should not let stale persisted copy overwrite dynamic stat placeholders', () => {
  assert.ok(/LIVE_I18N_PLACEHOLDER_REQUIREMENTS/.test(i18n), 'missing dynamic i18n placeholder guard list');
  assert.ok(/shouldUseLiveI18nValue/.test(i18n), 'missing dynamic i18n live-value guard');
  assert.ok(/shouldUseLiveI18nValue\(key, value\)/.test(i18n), 'live i18n merge does not use placeholder guard');
  for (const key of [
    'hero.stat2.u',
    'hero.stat3.u',
    'hero.foot',
    'footer.stats',
    'kpi.p',
    'kpi.k2n',
    'kpi.k5n',
    'kpi.k6n',
    'kpi.sub1.who',
    'kpi.sub2.who',
    'matrix.table.title',
  ]) {
    assert.ok(i18n.includes(`"${key}"`), `missing guarded dynamic i18n key ${key}`);
  }
});

test('Matrix reference labels should be dynamic values, not stale hardcoded copy', () => {
  assert.ok(/ReferenceLine x=\{ds\.avgCpm\}/.test(appPart3), 'missing dynamic avg CPM reference line');
  assert.ok(/ReferenceLine y=\{ds\.avgEr\}/.test(appPart3), 'missing dynamic avg ER reference line');
  assert.ok(/\$\{tr\("matrix\.col\.cpm"\)\}\s*\$\{ds\.avgCpm\.toFixed\(2\)\}/.test(appPart3), 'CPM reference label is not dynamic');
  assert.ok(/\$\{tr\("matrix\.col\.er"\)\}\s*\$\{ds\.avgEr\.toFixed\(2\)\}%/.test(appPart3), 'ER reference label is not dynamic');
});

test('Why section should use the corrected why.wN key pattern', () => {
  assert.ok(/why\.w1\.t/.test(i18n), 'missing why.w1.t');
  assert.ok(/why\.w3\.t/.test(i18n), 'missing why.w3.t');
  assert.ok(/why\.w4\.t/.test(i18n), 'missing why.w4.t');
  assert.ok(/why\.w5\.t/.test(i18n), 'missing why.w5.t');
  assert.ok(/why\.w6\.t/.test(i18n), 'missing why.w6.t');
});

test('Matrix table title should not split baseline and flagship counts', () => {
  assert.ok(!/"matrix\.table\.title":\s*".*\{nonBaselineCount\}.*旗舰样本/.test(i18n), 'zh Matrix title still splits baseline and flagship counts');
  assert.ok(!/"matrix\.table\.title":\s*".*\{nonBaselineCount\}.*flagship samples/.test(i18n), 'en Matrix title still splits baseline and flagship counts');
});

test('Database init should enforce a non-empty unique slug index for projects', () => {
  assert.ok(/CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_nonempty ON projects\(slug\) WHERE slug IS NOT NULL AND slug <> ''/.test(read('server/db.js')), 'missing partial unique index for non-empty project slugs');
  assert.ok(/GROUP BY slug HAVING COUNT\(\*\) > 1/.test(read('server/db.js')), 'missing duplicate slug detection before creating project slug index');
});

test('Database init should keep KAIO in the baseline sample on existing databases', () => {
  assert.ok(/UPDATE projects SET is_baseline = 1 WHERE \(slug = 'kaio' OR name = 'KAIO'\)/.test(read('server/db.js')), 'missing KAIO baseline backfill for existing databases');
});

test('Database init should backfill stale dynamic i18n copies without overwriting placeholder templates', () => {
  const db = read('server/db.js');
  assert.ok(/dynamicI18nTemplates/.test(db), 'missing dynamic i18n template backfill list');
  assert.ok(/ON CONFLICT \(lang, key\) DO NOTHING/.test(db), 'dynamic i18n backfill should insert missing keys without overwriting existing rows');
  assert.ok(/value NOT LIKE/.test(db), 'dynamic i18n backfill should only update rows missing required placeholders');
  for (const key of ['hero.stat2.u', 'kpi.k2n', 'footer.stats']) {
    assert.ok(db.includes(key), `missing DB backfill for ${key}`);
  }
});

test('Matrix table title i18n entries should be comma-separated from following keys', () => {
  const separatedTitleEntries = i18n.match(/"matrix\.table\.title":\s*"[^"]*",\s*\n\s*"matrix\.table\.sub":/g) || [];
  assert.strictEqual(separatedTitleEntries.length, 2, 'both zh and en matrix.table.title entries must end with a comma before matrix.table.sub');
});

test('Database schema should include visibility flags for projects and IP cases', () => {
  assert.ok(/is_visible INTEGER DEFAULT 1/.test(db), 'missing is_visible default column in table definitions');
  assert.ok(/ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_visible INTEGER DEFAULT 1/.test(db), 'missing projects is_visible migration');
  assert.ok(/ALTER TABLE ip_cases ADD COLUMN IF NOT EXISTS is_visible INTEGER DEFAULT 1/.test(db), 'missing ip_cases is_visible migration');
});

test('Project APIs should filter public rows while keeping an authenticated all endpoint', () => {
  assert.ok(/router\.get\('\/all', authMiddleware[\s\S]*SELECT \* FROM projects ORDER BY sort_order/.test(projectsRoute), 'missing authenticated full project list endpoint');
  assert.ok(/router\.get\('\/'[\s\S]*WHERE is_visible <> 0[\s\S]*ORDER BY sort_order/.test(projectsRoute), 'public project endpoint does not filter hidden projects');
  assert.ok(/is_visible:\s*1/.test(projectsRoute), 'project payload defaults do not include is_visible');
  assert.ok(/\['is_baseline', 'is_visible'\]\.includes\(field\)/.test(projectsRoute), 'project route does not validate boolean-ish flags');
});

test('IP case APIs should filter public rows by published and visible while persisting visibility', () => {
  assert.ok(/WHERE status = 'published' AND is_visible <> 0 ORDER BY sort_order/.test(ipCasesRoute), 'public IP cases endpoint does not filter hidden published cases');
  assert.ok(/const \{ slug, status, is_visible \} = req\.body;/.test(ipCasesRoute), 'IP case create does not accept is_visible');
  assert.ok(/if \(is_visible !== undefined\)/.test(ipCasesRoute), 'IP case update does not persist is_visible');
});

test('Frontend project data should carry and filter visibility', () => {
  assert.ok(/is_visible:p\.is_visible \?\? 1/.test(app), 'API project mapper does not carry is_visible');
  assert.ok(/Array\.isArray\(data\)/.test(app), 'empty public project API responses should replace stale fallback data');
  assert.ok(/function visibleProjects/.test(app), 'missing visibleProjects helper');
  assert.ok(/projects\.length \? Math\.max/.test(app), 'deriveStats should not produce -Infinity when all projects are hidden');
  assert.ok(/base\.length \? Math\.min/.test(app), 'deriveStats should not produce Infinity when no visible baseline projects remain');
  assert.ok(/visibleProjects\(e\.data\.projects\)/.test(app), 'project preview drafts are not filtered by visibility');
  assert.ok(/"is_visible":1/.test(caseStudyHtml), 'static project fallback is missing is_visible defaults');
});

test('Personal IP preview and render list should respect visibility', () => {
  assert.ok(/isVisibleCase\(c\)/.test(personalIp), 'published IP render list does not filter hidden cases');
  assert.ok(/setPreviewVisible\(e\.data\.is_visible !== 0\)/.test(personalIp), 'IP preview message does not track visible flag');
  assert.ok(/c\.slug !== previewSlug/.test(personalIp), 'hidden preview case is not removed from the persisted published render list');
  assert.ok(/previewVisible && previewSlug/.test(personalIp), 'hidden IP preview slug can still be rendered');
});

test('Admin project and IP editors should expose and transmit visibility', () => {
  assert.ok(/api\('\/projects\/all'\)/.test(admin), 'project admin should load full project list');
  assert.ok(/is_visible:1/.test(admin), 'new project form does not default to visible');
  assert.ok(/is_visible: proj\.is_visible \?\? 1/.test(admin), 'project preview draft does not include is_visible');
  assert.ok(/value=\{form\.is_visible\?\?1\}/.test(admin), 'project form lacks visibility select');
  assert.ok(/is_visible: 1, slug: defaultSlug/.test(admin), 'new IP case data does not default to visible');
  assert.ok(/action: 'ip-draft'[\s\S]*is_visible: caseData\?\.is_visible/.test(admin), 'IP preview draft does not transmit is_visible');
  assert.ok(/value=\{caseData\.is_visible\?\?1\}/.test(admin), 'IP editor lacks visibility select');
});

if (process.exitCode) process.exit(process.exitCode);

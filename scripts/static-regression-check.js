const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const appPart2 = read('app-part2.jsx');
const admin = read('admin/admin.jsx');
const i18n = read('i18n.jsx');
const appPart3 = read('app-part3.jsx');
const projectsRoute = read('server/routes/projects.js');

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

test('Matrix table title i18n entries should be comma-separated from following keys', () => {
  const separatedTitleEntries = i18n.match(/"matrix\.table\.title":\s*"[^"]*",\s*\n\s*"matrix\.table\.sub":/g) || [];
  assert.strictEqual(separatedTitleEntries.length, 2, 'both zh and en matrix.table.title entries must end with a comma before matrix.table.sub');
});

if (process.exitCode) process.exit(process.exitCode);

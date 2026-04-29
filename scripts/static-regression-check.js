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
const i18nRoute = read('server/routes/i18n.js');
const uploadRoute = read('server/routes/upload.js');
const db = read('server/db.js');
const serverIndex = read('server/index.js');
const caseStudyHtml = read('Lighthouse Case Study.html');
const projectCaseHtml = read('Project Case.html');
const projectCase = read('project-case.jsx');

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

test('Admin i18n editor should expose every copy key in an all-items view', () => {
  assert.ok(/router\.get\('\/all', authMiddleware/.test(i18nRoute), 'missing authenticated all-i18n endpoint');
  assert.ok(/SELECT \* FROM i18n ORDER BY section, key, lang/.test(i18nRoute), 'all-i18n endpoint should return rows grouped by section and key');
  assert.ok(/const ALL_I18N_SECTION = '__all';/.test(admin), 'missing all-i18n section sentinel in admin');
  assert.ok(/\[ALL_I18N_SECTION, \.\.\.list\.filter\(s => s !== ALL_I18N_SECTION\)\]/.test(admin), 'all tab is not prepended to i18n sections');
  assert.ok(/active === ALL_I18N_SECTION \? api\('\/i18n\/all'\) : api\(`\/i18n\/section\/\$\{active\}`\)/.test(admin), 'admin does not load all i18n rows for the all tab');
  assert.ok(/\{s === ALL_I18N_SECTION \? '全部' : s\}/.test(admin), 'all tab should be labeled clearly');
});

test('I18n batch save should upsert missing language rows from the editor', () => {
  assert.ok(/const sec = u\.section \|\| u\.key\.split\('\.'\)\[0\] \|\| 'misc';/.test(i18nRoute), 'batch i18n save should derive section for upserts');
  assert.ok(/INSERT INTO i18n \(lang, key, value, section\) VALUES \(\$1,\$2,\$3,\$4\) ON CONFLICT \(lang, key\) DO UPDATE SET value = \$3, section = \$4, updated_at = NOW\(\)/.test(i18nRoute), 'batch i18n save should upsert instead of update-only');
});

test('I18n editor should auto-translate English from Chinese instead of requiring manual English edits', () => {
  assert.ok(/async function translateZhToEnglish/.test(i18nRoute), 'missing server-side zh-to-en translation helper');
  assert.ok(/OPENAI_API_KEY/.test(i18nRoute), 'auto translation should support configured OpenAI-compatible translation');
  assert.ok(/translate\.googleapis\.com/.test(i18nRoute), 'auto translation should have a no-extra-dependency fallback provider');
  assert.ok(/await autoTranslateEnglish\(pool, \{ \.\.\.u, section: sec \}\)/.test(i18nRoute), 'batch i18n save does not auto-translate zh edits');
  assert.ok(/if \(e\.lang !== 'zh'\) continue;/.test(admin), 'draft preview should only be driven by editable Chinese rows');
  assert.ok(/English · 自动翻译/.test(admin), 'admin should label the English column as auto-translated');
  assert.ok(/data-i18n-field=\{`en:\$\{k\}`\} value=\{grouped\[k\]\?\.en \?\? ''\} readOnly/.test(admin), 'English i18n field should be read-only');
});

test('Live i18n should reject corrupted persisted values that embed other i18n keys', () => {
  assert.ok(/function looksLikeEmbeddedI18nValue/.test(i18n), 'client live i18n merge lacks corrupt-value detection');
  assert.ok(/looksLikeEmbeddedI18nValue\(value\)/.test(i18n), 'client live i18n merge does not reject corrupt values');
  assert.ok(/if \(r\.lang === 'en' && looksLikeEmbeddedI18nValue\(r\.value\)\) continue;/.test(i18nRoute), 'public i18n API should not expose corrupted English rows');
  assert.ok(/sanitizeRowsForAdmin/.test(i18nRoute), 'admin i18n rows should hide corrupted English values until regenerated');
});

test('Visual preview clicks should jump to the matching i18n editor field', () => {
  assert.ok(/function installPreviewEditBridge/.test(i18n), 'missing preview click bridge installer');
  assert.ok(/lh-preview-copy-click/.test(i18n), 'preview click bridge does not notify the admin editor');
  assert.ok(/data-i18n-key="hero\.h1_a"/.test(app), 'hero.h1_a is not marked as an editable preview target');
  assert.ok(/data-i18n-key="hero\.h1_b"/.test(app), 'hero.h1_b is not marked as an editable preview target');
  assert.ok(/data-i18n-key="hero\.h1_c"/.test(app), 'hero.h1_c is not marked as an editable preview target');
  assert.ok(/function findMatchingI18nRow/.test(admin), 'admin cannot match clicked preview text to an i18n row');
  assert.ok(/type !== 'lh-preview-copy-click'/.test(admin), 'admin does not listen for preview copy click messages');
  assert.ok(/data-i18n-field=\{`zh:\$\{k\}`\}/.test(admin), 'zh textarea lacks a stable i18n field marker');
  assert.ok(/data-i18n-field=\{`en:\$\{k\}`\}/.test(admin), 'en textarea lacks a stable i18n field marker');
});

test('Admin i18n editor should clearly separate draft preview from saved homepage copy', () => {
  assert.ok(/保存到主页/.test(admin), 'i18n save button should say changes are saved to the homepage');
  assert.ok(/草稿预览/.test(admin), 'i18n preview label should identify unsaved draft preview state');
  assert.ok(/保存后主页生效/.test(admin), 'i18n editor should explain that the homepage changes after saving');
});

test('Star samples should be selected dynamically from live metrics without duplicate projects', () => {
  assert.ok(/function selectUniqueStarProjects/.test(appPart2), 'missing dynamic star sample selector');
  assert.ok(/const usedStarProjectIds = new Set\(\);/.test(appPart2), 'star selector should track used projects');
  assert.ok(/pickStarProject\(base, usedStarProjectIds, 's2'/.test(appPart2), 'largest-reach slot should be picked from live data');
  assert.ok(/pickStarProject\(base, usedStarProjectIds, 's3'/.test(appPart2), 'discussion-depth slot should be picked from live data');
  assert.ok(/pickStarProject\(base, usedStarProjectIds, 's4'/.test(appPart2), 'low-budget reach slot should be picked from live data');
  assert.ok(/buildStarSlugSet\(P3\)/.test(appPart3), 'Matrix highlights should follow the dynamic star samples');
  assert.ok(!/const CURATED_STARS = \[/.test(appPart2), 'star samples are still bound to a fixed slug list');
  assert.ok(!/P\.find\(proj => \(proj\.slug \|\| ''\) === cs\.slug\)/.test(appPart2), 'stars still find projects by fixed curated slug');
  assert.ok(!/const budget = p\?\.budget \|\| 0;/.test(appPart2), 'still falls back to zero-value curated-star stats');
});

test('Matrix and admin tags should be synced to the unique star sample slots', () => {
  assert.ok(/function buildStarTagMap/.test(appPart2), 'missing shared star-slot tag map');
  assert.ok(/buildStarTagMap\(P3, MATRIX_TAGS\)/.test(appPart3), 'Matrix tags should use the same unique star-slot selection as Stars');
  assert.ok(/buildAdminProjectTagMap\(projects\)[\s\S]*selectAdminStarProjects\(projects\)/.test(admin), 'admin tags should use the same unique star-slot selection');
  assert.ok(/tag\.cpm_king",?\s*:\s*"低预算曝光"/.test(i18n), 'zh tag label should match low-budget reach sample');
  assert.ok(/tag\.value_king",?\s*:\s*"综合效率"/.test(i18n), 'zh tag label should match efficiency sample');
  assert.ok(/tag\.eng_king",?\s*:\s*"讨论深度"/.test(i18n), 'zh tag label should match discussion-depth sample');
  assert.ok(/staleLabelReplacements[\s\S]*低预算曝光[\s\S]*综合效率[\s\S]*讨论深度/.test(db), 'server should migrate stale persisted tag labels');
  assert.ok(!/addExtrema\('imp', MATRIX_TAGS\.reach/.test(appPart3), 'Matrix tags still assign independent reach extrema');
  assert.ok(!/addExtrema\('cpm', MATRIX_TAGS\.cpm/.test(appPart3), 'Matrix tags still assign independent CPM extrema');
  assert.ok(!/if \(erLeaders\[0\]\) addTag\(erLeaders\[0\]\.project/.test(appPart3), 'Matrix tags still assign independent ER extrema');
  assert.ok(!/addExtrema\('imp', 'reach'/.test(admin), 'admin tags still assign independent reach extrema');
  assert.ok(!/addExtrema\('cpm', 'cpm'/.test(admin), 'admin tags still assign independent CPM extrema');
});

test('Server startup should refresh dynamic star sample story placeholders', () => {
  assert.ok(/'stars\.s1\.story'[\s\S]*'starName'[\s\S]*'starCpe'/.test(db), 'missing dynamic i18n refresh for overall-efficiency star story');
  assert.ok(/'stars\.s2\.story'[\s\S]*'starName'[\s\S]*'starImp'/.test(db), 'missing dynamic i18n refresh for largest-reach star story');
  assert.ok(/'stars\.s3\.story'[\s\S]*'starName'[\s\S]*'starEr'/.test(db), 'missing dynamic i18n refresh for discussion-depth star story');
  assert.ok(/'stars\.s4\.story'[\s\S]*'starName'[\s\S]*'starBudget'[\s\S]*'starCpm'[\s\S]*'starImp'/.test(db), 'missing dynamic i18n refresh for low-budget reach star story');
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

test('KPI notes with dynamic placeholders should be rendered through tpl variables', () => {
  assert.ok(/note:tp\("kpi\.k2n"\)/.test(appPart2), 'kpi.k2n still renders raw {baselineTweets}');
});

test('CountUp should animate again when API data replaces the fallback snapshot', () => {
  assert.ok(/const \[visible, setVisible\] = useState\(false\);/.test(app), 'CountUp should track element visibility separately from the target value');
  assert.ok(/valueRef\.current/.test(app), 'CountUp should keep the current displayed value for re-animation');
  assert.ok(/const target = Number\(to\) \|\| 0;/.test(app), 'CountUp should animate toward the latest numeric target');
  assert.ok(!/startedRef/.test(app), 'CountUp still permanently blocks later target updates');
});

test('Top navigation should include the Lighthouse app entry next to the CTA button', () => {
  assert.ok(/"nav\.app_btn":\s*"前往灯塔 →"/.test(i18n), 'missing zh Lighthouse app nav label');
  assert.ok(/"nav\.app_btn":\s*"Go to Lighthouse →"/.test(i18n), 'missing en Lighthouse app nav label');
  assert.ok(/href="https:\/\/app\.lhdao\.top\/"[\s\S]*\{t\("nav\.app_btn"\)\}/.test(app), 'missing Lighthouse app link in top navigation');
});

test('Top navigation labels should stay on one line in English', () => {
  assert.ok(/gap-4 xl:gap-6/.test(app), 'desktop nav should tighten spacing before labels wrap');
  assert.ok(/tracking-\[0\.16em\] xl:tracking-\[0\.22em\]/.test(app), 'desktop nav should reduce letter spacing at narrower desktop widths');
  assert.ok((app.match(/className="whitespace-nowrap hover:text/g) || []).length >= 7, 'nav links should use whitespace-nowrap to prevent vertical word wrapping');
  assert.ok(/hidden md:inline-block whitespace-nowrap[\s\S]*\{t\("nav\.cta_btn"\)\}/.test(app), 'CTA nav button should not wrap');
});

test('Public page links should use canonical extensionless routes', () => {
  assert.ok(/app\.get\('\/case-study'[\s\S]*Lighthouse Case Study\.html/.test(serverIndex), 'missing extensionless case-study route');
  assert.ok(/app\.get\('\/personal-ip'[\s\S]*Personal IP\.html/.test(serverIndex), 'missing extensionless personal-ip route');
  assert.ok(/app\.get\('\/projects\/:slug'[\s\S]*Project Case\.html/.test(serverIndex), 'missing project case detail route');
  assert.ok(/decodeURIComponent\(req\.path\)/.test(serverIndex), 'legacy html redirect must handle encoded spaces in URLs');
  assert.ok(/pathname === '\/Lighthouse Case Study\.html'[\s\S]*res\.redirect\(301, '\/'\)/.test(serverIndex), 'missing redirect from case-study html URL');
  assert.ok(/pathname === '\/Personal IP\.html'[\s\S]*res\.redirect\(301, '\/personal-ip'\)/.test(serverIndex), 'missing redirect from personal IP html URL');
  assert.ok(!/href="Personal IP\.html"/.test(app), 'main nav still links to Personal IP.html');
  assert.ok(!/Lighthouse Case Study\.html/.test(personalIp), 'personal IP page still links back to .html URLs');
});

test('Project case detail page should be reusable and project-linked', () => {
  assert.ok(/id="project-case-root"/.test(projectCaseHtml), 'project case HTML should mount a dedicated React app');
  assert.ok(/src="\/project-case\.jsx"/.test(projectCaseHtml), 'project case HTML should load the single-file React component');
  assert.ok(/const mockData/.test(projectCase), 'project case page should be mockData-driven for future CMS mapping');
  assert.ok(/function slugFromPath/.test(projectCase) && /\/api\/projects\/\$\{encodeURIComponent\(slug\)\}\/case-page/.test(projectCase), 'project case page should resolve CMS content from the project slug');
  assert.ok(/function pageField/.test(projectCase), 'project case page should map editable CMS fields onto the template');
  assert.ok(/action !== 'project-case-draft'/.test(projectCase), 'project case page should accept admin draft preview messages');
  assert.ok(/Twitter \/ X 推文嵌入/.test(projectCase), 'project case page should reserve a Twitter/X embed area');
  assert.ok(/projectCasePath\(p\)/.test(admin), 'admin project table should link each project to its case detail page');
});

test('Project case pages should be editable in the admin and linked from homepage projects', () => {
  assert.ok(/CREATE TABLE IF NOT EXISTS project_case_pages/.test(db), 'missing project case page table');
  assert.ok(/page_data JSONB NOT NULL DEFAULT '\{\}'::jsonb/.test(db), 'project case page content should be stored as JSONB');
  assert.ok(/router\.get\('\/:slug\/case-page'/.test(projectsRoute), 'missing public project case page API by slug');
  assert.ok(/router\.get\('\/id\/:id\/case-page', authMiddleware/.test(projectsRoute), 'missing authenticated project case page API by id');
  assert.ok(/router\.put\('\/:id\/case-page', authMiddleware/.test(projectsRoute), 'missing authenticated project case page save API');
  assert.ok(/DEFAULT_PROJECT_CASE_PAGE/.test(admin), 'admin lacks project case page default editable fields');
  assert.ok(/api\(`\/projects\/id\/\$\{p\.id\}\/case-page`\)/.test(admin), 'admin project editor does not load case page content');
  assert.ok(/api\(`\/projects\/\$\{editing\}\/case-page`/.test(admin), 'admin project editor does not save case page content');
  assert.ok(/className="case-page-editor"/.test(admin), 'admin project form lacks the case page editor UI');
  assert.ok(/action: 'project-case-draft'/.test(admin), 'admin project editor does not send live case page draft previews');
  assert.ok(/projectPreviewSrc/.test(admin), 'admin preview should switch to the project case page while editing a project');
  assert.ok(/href=\{s\.href\}/.test(appPart2), 'Star sample cards should link to project case pages');
  assert.ok(/projectCaseHref\(r\)/.test(appPart3), 'Matrix table project rows should link to project case pages');
});

test('Homepage copy should position Lighthouse as a safe Web3 attention marketplace', () => {
  assert.ok(/Web3 注意力市场/.test(i18n), 'missing zh attention-market positioning');
  assert.ok(/Web3 attention marketplace/.test(i18n), 'missing en attention-market positioning');
  assert.ok(/支持喜欢的 KOL/.test(i18n), 'missing creator-support use case');
  assert.ok(/声量对冲/.test(i18n), 'missing safe share-of-voice framing');
  assert.ok(/聊聊你的流量需求/.test(i18n), 'CTA should broaden from project-only to traffic needs');
  assert.ok(!/黑稿|雇佣兵|控评|刷火箭/.test(i18n), 'homepage copy contains unsafe grey-market wording');
});

test('About facts should keep the sampled baseline note short enough for one desktop line', () => {
  const zhAboutF2 = i18n.match(/"about\.f2":\s*"([^"]+)"/)?.[1] || '';
  const rendered = zhAboutF2.replace('{totalCount}', '15').replace('{baselineCount}', '15');
  assert.ok(/取样 \{totalCount\} · 基准 \{baselineCount\}/.test(zhAboutF2), 'about.f2 should use compact sample/baseline wording');
  assert.ok(!/本报告|进入基准/.test(zhAboutF2), 'about.f2 still contains long desktop-breaking wording');
  assert.ok(rendered.length <= 32, 'about.f2 rendered zh copy is too long for the three-column fact row');
});

test('Homepage dense sections should use mobile-first responsive layouts', () => {
  assert.ok(/min-h-\[100svh\]/.test(app), 'hero should use small-viewport height for mobile browser chrome');
  assert.ok(/pt-32 sm:pt-36 md:pt-0/.test(app), 'hero should reserve top breathing room on small screens');
  assert.ok(/grid grid-cols-1 lg:grid-cols-3/.test(app), 'hero stats should stay stacked until there is enough width for three large numbers');
  assert.ok(/basis-full sm:basis-auto/.test(app), 'hero footnote should wrap below CTA buttons on small screens');
  assert.ok(/grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/.test(appPart2), 'KPI grid should be one column on narrow screens');
  assert.ok(/grid grid-cols-2 sm:grid-cols-4/.test(appPart2), 'Star metric grid should not force four columns on narrow screens');
  assert.ok(/grid grid-cols-1 sm:grid-cols-3/.test(appPart3), 'CTA metric grid should stack before becoming three columns');
  assert.ok(/flex flex-wrap items-center gap-x-5 gap-y-2/.test(appPart3), 'Matrix legends should wrap instead of overflowing on narrow screens');
});

test('Large metric numbers should use card-safe type scales', () => {
  assert.ok(/fontSize:"clamp\(42px, 7vw, 72px\)"/.test(app), 'hero metric numbers are still too large for narrow stat columns');
  assert.ok(/fontSize:"clamp\(38px, 6\.5vw, 64px\)"/.test(appPart2), 'KPI metric numbers are still too large for narrow cards');
  assert.ok(!/fontSize:"clamp\(34px, 12vw, 78px\)"/.test(app), 'hero still has the old oversized metric clamp');
  assert.ok(!/fontSize:"clamp\(34px, 11vw, 80px\)"/.test(appPart2), 'KPI still has the old oversized metric clamp');
});

test('Matrix reference labels should be dynamic values, not stale hardcoded copy', () => {
  assert.ok(/ReferenceLine x=\{ds\.avgCpm\}/.test(appPart3), 'missing dynamic avg CPM reference line');
  assert.ok(/ReferenceLine y=\{ds\.avgEr\}/.test(appPart3), 'missing dynamic avg ER reference line');
  assert.ok(/\$\{tr\("matrix\.col\.cpm"\)\}\s*\$\{ds\.avgCpm\.toFixed\(2\)\}/.test(appPart3), 'CPM reference label is not dynamic');
  assert.ok(/\$\{tr\("matrix\.col\.er"\)\}\s*\$\{ds\.avgEr\.toFixed\(2\)\}%/.test(appPart3), 'ER reference label is not dynamic');
});

test('Matrix table tags should be derived from live project metrics', () => {
  assert.ok(/function projectTagKey/.test(appPart3), 'missing stable project key helper for computed tags');
  assert.ok(/function buildMatrixTagMap/.test(appPart3), 'missing computed matrix tag map');
  assert.ok(/cpm:\s*"tag\.cpm_king"/.test(appPart3), 'computed tags should include low-budget/CPM slot');
  assert.ok(/value:\s*"tag\.value_king"/.test(appPart3), 'computed tags should include efficiency slot');
  assert.ok(/reach:\s*"tag\.reach_king"/.test(appPart3), 'computed tags should include top reach slot');
  assert.ok(/eng:\s*"tag\.eng_king"/.test(appPart3), 'computed tags should include discussion depth slot');
  assert.ok(/tagMap\.get\(projectTagKey\(r\)\)/.test(appPart3), 'table rows should read tags from the computed tag map');
  assert.ok(!/const tagLabel = r\.tag/.test(appPart3), 'matrix table still uses manually stored project tag');
});

test('Admin project table tags should be derived from live metrics, not stale DB tag text', () => {
  assert.ok(/function buildAdminProjectTagMap/.test(admin), 'missing admin computed project tag map');
  assert.ok(/ADMIN_PROJECT_TAG_LABELS/.test(admin), 'missing admin project tag labels');
  assert.ok(/const projectTagMap = buildAdminProjectTagMap\(projects\);/.test(admin), 'project admin table does not build computed tags from current rows');
  assert.ok(/projectTagMap\.get\(adminProjectTagKey\(p\)\)/.test(admin), 'project admin table does not read computed tags per row');
  assert.ok(!/<td>\{p\.tag\}<\/td>/.test(admin), 'project admin table still renders stale p.tag directly');
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

test('Surf logo should have a durable bundled fallback instead of an ephemeral upload path', () => {
  assert.ok(/assets\/logos\/surf\.svg/.test(caseStudyHtml), 'static fallback should use the bundled Surf logo');
  assert.ok(/"name":"Surf"[\s\S]*"logo":"assets\/logos\/surf\.svg"/.test(caseStudyHtml), 'static fallback should include Surf with its durable logo');
  assert.ok(/UPDATE projects SET logo = 'assets\/logos\/surf\.svg'[\s\S]*logo LIKE 'assets\/uploads\/%'/.test(db), 'database init should repair the old broken Surf upload logo path');
  assert.ok(/UPDATE images SET path = 'assets\/logos\/surf\.svg'/.test(db), 'database init should repair the old Surf image-library row');
});

test('Image uploads should persist through deploys by storing data URLs in the database', () => {
  assert.ok(/multer\.memoryStorage\(\)/.test(uploadRoute), 'upload route should not depend on Railway local disk storage');
  assert.ok(/req\.file\.buffer\.toString\('base64'\)/.test(uploadRoute), 'upload route should encode image bytes into the stored path');
  assert.ok(/`data:\$\{mime\};base64,\$\{/.test(uploadRoute), 'upload route should store a data URL in the database');
  assert.ok(/function publicImagePath/.test(uploadRoute), 'upload route should expose a short public image path');
  assert.ok(/router\.get\('\/:id\/raw'/.test(uploadRoute), 'upload route should serve stored DB images through a short raw URL');
  assert.ok(/path: publicPath/.test(uploadRoute), 'upload response should return the short public path instead of the full data URL');
  assert.ok(!/assets\/uploads\/\$\{req\.file\.filename\}/.test(uploadRoute), 'upload route still returns ephemeral assets/uploads paths');
  assert.ok(/function imageSrc/.test(admin), 'admin should resolve data URL image paths without prefixing a slash');
});

test('Admin image library should show short paths and allow image deletion', () => {
  assert.ok(/function imageDisplayPath/.test(admin), 'admin image library should have a short display-path helper');
  assert.ok(/const path = imagePublicPath\(img\);/.test(admin), 'admin image cards should use a short public image path');
  assert.ok(/copyPath\(path\)/.test(admin), 'admin image cards should copy the short public path');
  assert.ok(/api\(`\/upload\/\$\{img\.id\}`,\s*\{ method:'DELETE' \}\)/.test(admin), 'admin image library should call delete image API');
  assert.ok(/删除图片/.test(admin), 'admin image library should expose a delete image action');
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

test('Server startup should migrate existing DB i18n rows to the attention-market copy once', () => {
  assert.ok(/refreshAttentionMarketI18n/.test(db), 'missing attention-market i18n refresh function');
  assert.ok(/copy\.attention_market\.v1/.test(db), 'missing one-time attention-market copy migration marker');
  assert.ok(/ATTENTION_MARKET_COPY_KEYS/.test(db), 'missing explicit homepage copy key allowlist');
  assert.ok(/'brand\.tagline'/.test(db), 'attention-market refresh should include brand.tagline');
  assert.ok(/'hero\.eyebrow'/.test(db), 'attention-market refresh should include hero.eyebrow');
  assert.ok(/'hero\.cta2'/.test(db), 'attention-market refresh should include hero.cta2');
  assert.ok(/'about\.f2'/.test(db), 'attention-market refresh should include the shortened about.f2');
  assert.ok(/refreshAttentionMarketI18n\(dict\)/.test(serverIndex), 'server startup does not refresh existing DB i18n from parsed DICT');
});

test('Server startup should ensure every default i18n key remains editable after partial DB seeds', () => {
  const seedI18nBody = db.match(/async function seedI18n\(dict\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.ok(seedI18nBody, 'missing seedI18n implementation');
  assert.ok(!/SELECT COUNT\(\*\) as c FROM i18n/.test(seedI18nBody), 'seedI18n still counts existing i18n rows before syncing defaults');
  assert.ok(!/if \(parseInt\(rows\[0\]\.c\) > 0\) return;/.test(seedI18nBody), 'seedI18n still exits when the i18n table already has rows');
  assert.ok(!/if \(parseInt\(i18nCount\[0\]\.c\) === 0\)[\s\S]*await seedI18n\(dict\)/.test(serverIndex), 'server startup still gates default i18n sync behind an empty-table check');
  assert.ok(/await seedI18n\(dict\);[\s\S]*await refreshAttentionMarketI18n\(dict\);/.test(serverIndex), 'server should ensure missing defaults before refreshing curated copy');
  assert.ok(/ON CONFLICT \(lang, key\) DO NOTHING/.test(db), 'default i18n sync should preserve edited DB rows');
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

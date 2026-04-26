const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS i18n (
      id SERIAL PRIMARY KEY,
      lang TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      section TEXT NOT NULL DEFAULT 'misc',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(lang, key)
    );
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT DEFAULT '',
      budget REAL DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      cpm REAL DEFAULT 0,
      er REAL DEFAULT 0,
      cpe REAL DEFAULT 0,
      tag TEXT DEFAULT '',
      is_baseline INTEGER DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      tweets INTEGER DEFAULT 0,
      slug TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS ip_cases (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      is_visible INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ip_case_i18n (
      id SERIAL PRIMARY KEY,
      case_id INTEGER NOT NULL REFERENCES ip_cases(id) ON DELETE CASCADE,
      lang TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      UNIQUE(case_id, lang, key)
    );
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      path TEXT NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS tweets INTEGER DEFAULT 0`).catch(() => {});
  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT ''`).catch(() => {});
  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_visible INTEGER DEFAULT 1`).catch(() => {});
  await pool.query(`ALTER TABLE ip_cases ADD COLUMN IF NOT EXISTS is_visible INTEGER DEFAULT 1`).catch(() => {});

  // Backfill tweets and slugs for existing rows
  const tweetMap = { 'HashKey Exchange':8, 'Portals':18, 'zkVerify':42, 'SonicSVM':30, 'Puffpaw':15, 'Allora':38, 'Maiga':20, 'Yei Finance':26, 'Kamino':24, 'Fight.ID':28, 'Sentient':25, 'FF':22, 'Lit Protocol':24, 'HeyElsa':20, 'ZetaChain':16, 'KAIO':15 };
  for (const [name, tweets] of Object.entries(tweetMap)) {
    await pool.query('UPDATE projects SET tweets = $1 WHERE name = $2 AND tweets = 0', [tweets, name]);
  }
  const slugMap = { 'HashKey Exchange':'hashkey-exchange', 'Portals':'portals', 'zkVerify':'zkverify', 'SonicSVM':'sonicsvm', 'Puffpaw':'puffpaw', 'Allora':'allora', 'Maiga':'maiga', 'Yei Finance':'yei-finance', 'Kamino':'kamino', 'Fight.ID':'fight-id', 'Sentient':'sentient', 'FF':'ff', 'Lit Protocol':'lit-protocol', 'HeyElsa':'heyelsa', 'ZetaChain':'zetachain', 'KAIO':'kaio' };
  for (const [name, slug] of Object.entries(slugMap)) {
    await pool.query("UPDATE projects SET slug = $1 WHERE name = $2 AND (slug = '' OR slug IS NULL)", [slug, name]);
  }
  await pool.query("UPDATE projects SET is_baseline = 1 WHERE (slug = 'kaio' OR name = 'KAIO')");

  const dynamicI18nTemplates = [
    ['zh', 'hero.stats_tl', '{baselineCount} 个基准项目 · {baselineTweets} 条推文 · Q4·25 — Q2·26', ['baselineCount', 'baselineTweets']],
    ['zh', 'hero.sub', JSON.stringify(['基于 ', '{baselineCount} 个基准项目', '、', '{baselineTweets} 条推文', '、', '超 {totalImpLabel} 次曝光', '的投放记录，这份 Case Study 展示灯塔如何帮助项目方更早对齐预算、效率预期和交付边界，让每一次合作都能为下一次增长决策提供参照。']), ['baselineCount', 'baselineTweets', 'totalImpLabel']],
    ['zh', 'hero.stat2.u', '{baselineCount} 个基准项目 · {baselineTweets} 条推文', ['baselineCount', 'baselineTweets']],
    ['zh', 'hero.stat3.u', '由 {peakErWho} 创造 · 行业均值 ≈ 0.4%', ['peakErWho']],
    ['zh', 'hero.foot', '{baselineCount} 个基准项目样本 · {baselineTweets} 条推文 · 可回看数据 · 可对照基准', ['baselineCount', 'baselineTweets']],
    ['zh', 'about.f2', '◇ 累计服务项目 40+（本报告取样 {totalCount} 个 · {baselineCount} 个进入基准）', ['totalCount', 'baselineCount']],
    ['zh', 'kpi.p', '以下 6 个 KPI 来自 {baselineCount} 个基准项目的完整投放记录，保留真实波动，不做样本美化。它们让团队在下一次讨论预算、效率和目标时，有一套可以直接对照的参考线。', ['baselineCount']],
    ['zh', 'kpi.k1n', '{baselineCount} 个基准项目共同形成的预算参考', ['baselineCount']],
    ['zh', 'kpi.k2n', '{baselineTweets} 条推文沉淀出的真实交付体量', ['baselineTweets']],
    ['zh', 'kpi.k5n', '{lowestCpmWho} 跑出的高效曝光样本', ['lowestCpmWho']],
    ['zh', 'kpi.k6n', '{peakErWho} 把深度参与拉到行业均值上方', ['peakErWho']],
    ['zh', 'kpi.sub1.who', '{lowestCpeWho} 把互动成本压到很低的区间', ['lowestCpeWho']],
    ['zh', 'kpi.sub2.who', '{maxImpWho} 证明中高预算也能跑出规模', ['maxImpWho']],
    ['zh', 'matrix.h2_a', '{baselineCount} 个基准项目，', ['baselineCount']],
    ['zh', 'matrix.scatter_note', '§ 散点图展示 {baselineCount} 个可进入常规对照的项目', ['baselineCount']],
    ['zh', 'matrix.table.title', '完整数据表 · {baselineCount} 个基准项目', ['baselineCount']],
    ['zh', 'why.w2.d', '{baselineCount} 个基准项目和 {baselineTweets} 条推文沉淀出一条可对照的参考线，后续做预算讨论时更容易落到具体区间。', ['baselineCount', 'baselineTweets']],
    ['zh', 'footer.stats', '{baselineCount} 个基准项目 · {baselineTweets} 条推文 · 总曝光 {totalImpFmt} · 可作为后续合作参照', ['baselineCount', 'baselineTweets', 'totalImpFmt']],
    ['en', 'hero.stats_tl', '{baselineCount} baseline projects · {baselineTweets} tweets · Q4·25 — Q2·26', ['baselineCount', 'baselineTweets']],
    ['en', 'hero.sub', JSON.stringify(['Built on ', '{baselineCount} baseline projects', ', ', '{baselineTweets} tweets', ', and ', 'more than {totalImpLabel} impressions', ', this case study shows how Lighthouse helps teams align budget, expected efficiency, and delivery scope earlier — so each campaign leaves behind something useful for the next growth decision.']), ['baselineCount', 'baselineTweets', 'totalImpLabel']],
    ['en', 'hero.stat2.u', 'across {baselineCount} baseline projects · {baselineTweets} tweets', ['baselineCount', 'baselineTweets']],
    ['en', 'hero.stat3.u', 'set by {peakErWho} · industry avg ≈ 0.4%', ['peakErWho']],
    ['en', 'hero.foot', '{baselineCount} baseline project samples · {baselineTweets} tweets · reviewable records · benchmarkable results', ['baselineCount', 'baselineTweets']],
    ['en', 'about.f2', '◇ 40+ projects served ({totalCount} sampled here · {baselineCount} in baseline)', ['totalCount', 'baselineCount']],
    ['en', 'kpi.p', 'These 6 KPIs come from complete campaign records across {baselineCount} baseline projects. The swings are left intact and the sample is not polished for appearance. What matters is that teams now have a reference line they can use when discussing budget, efficiency, and goals the next time around.', ['baselineCount']],
    ['en', 'kpi.k1n', 'A budget reference built from {baselineCount} baseline projects', ['baselineCount']],
    ['en', 'kpi.k2n', 'Real delivery scale built from {baselineTweets} tweets', ['baselineTweets']],
    ['en', 'kpi.k5n', 'A reach-efficiency sample delivered by {lowestCpmWho}', ['lowestCpmWho']],
    ['en', 'kpi.k6n', '{peakErWho} pushed depth of participation above common market levels', ['peakErWho']],
    ['en', 'kpi.sub1.who', '{lowestCpeWho} pushed interaction cost into a very efficient range', ['lowestCpeWho']],
    ['en', 'kpi.sub2.who', '{maxImpWho} shows that mid-to-large budgets can still scale cleanly', ['maxImpWho']],
    ['en', 'matrix.h2_a', '{baselineCount} baseline projects,', ['baselineCount']],
    ['en', 'matrix.scatter_note', '§ Scatter shows {baselineCount} projects (CPM 10–100)', ['baselineCount']],
    ['en', 'matrix.table.title', 'Full data table · {baselineCount} baseline projects', ['baselineCount']],
    ['en', 'why.w2.d', '{baselineCount} baseline projects and {baselineTweets} tweets have built a reference line that makes it easier to land on specific ranges in future budget discussions.', ['baselineCount', 'baselineTweets']],
    ['en', 'footer.stats', '{baselineCount} baseline projects · {baselineTweets} tweets · {totalImpFmt} total impressions · benchmark reference on Base', ['baselineCount', 'baselineTweets', 'totalImpFmt']],
  ];
  for (const [lang, key, value, required] of dynamicI18nTemplates) {
    const section = key.split('.')[0] || 'misc';
    await pool.query(
      'INSERT INTO i18n (lang, key, value, section) VALUES ($1, $2, $3, $4) ON CONFLICT (lang, key) DO NOTHING',
      [lang, key, value, section]
    );
    const missingPlaceholderClauses = required.map((_, i) => `value NOT LIKE $${i + 4}`).join(' OR ');
    await pool.query(
      `UPDATE i18n SET value = $3, updated_at = NOW() WHERE lang = $1 AND key = $2 AND (${missingPlaceholderClauses})`,
      [lang, key, value, ...required.map(name => `%{${name}}%`)]
    );
  }

  await pool.query("UPDATE projects SET slug = '' WHERE slug IS NULL");
  const { rows: duplicateSlugRows } = await pool.query(`
    SELECT slug, array_agg(id ORDER BY id) AS ids
    FROM projects
    WHERE slug <> ''
    GROUP BY slug HAVING COUNT(*) > 1
  `);
  for (const row of duplicateSlugRows) {
    const [, ...duplicateIds] = row.ids || [];
    for (const id of duplicateIds) {
      let candidate = `${row.slug}-dup-${id}`;
      let suffix = 1;
      while (true) {
        const { rows: existing } = await pool.query(
          'SELECT 1 FROM projects WHERE slug = $1 AND id <> $2 LIMIT 1',
          [candidate, id]
        );
        if (!existing.length) break;
        candidate = `${row.slug}-dup-${id}-${suffix}`;
        suffix += 1;
      }
      await pool.query('UPDATE projects SET slug = $1 WHERE id = $2', [candidate, id]);
    }
  }

  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_nonempty ON projects(slug) WHERE slug IS NOT NULL AND slug <> ''`);

  // Seed default admin
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM users');
  if (parseInt(rows[0].c) === 0) {
    const hash = bcrypt.hashSync('lighthouse2026', 10);
    await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
  }
}

async function seedProjects() {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM projects');
  if (parseInt(rows[0].c) > 0) return;

  const projects = [
    ["HashKey Exchange","assets/logos/hashkey.jpg",1400,73455,19.06,0.38,5.05,"CPM 王",1,0,8,"hashkey-exchange"],
    ["Portals","assets/logos/portals.jpg",4000,136284,29.35,1.05,2.81,"性价比王",1,1,18,"portals"],
    ["zkVerify","assets/logos/zkverify.jpg",12000,365874,32.80,0.53,6.21,"曝光王",1,2,42,"zkverify"],
    ["SonicSVM","assets/logos/sonicsvm.jpg",8000,241450,33.14,0.67,4.98,"",1,3,30,"sonicsvm"],
    ["Puffpaw","assets/logos/puffpaw.jpg",4000,119319,33.52,0.67,4.99,"",1,4,15,"puffpaw"],
    ["Allora","assets/logos/allora.jpg",12000,328192,36.56,0.87,4.19,"",1,5,38,"allora"],
    ["Maiga","assets/logos/maiga.jpg",6000,151256,39.67,0.64,6.24,"",1,6,20,"maiga"],
    ["Yei Finance","assets/logos/yei.jpg",8000,196680,40.67,0.91,4.47,"",1,7,26,"yei-finance"],
    ["Kamino","assets/logos/kamino.jpg",8000,183587,43.57,0.46,9.56,"",1,8,24,"kamino"],
    ["Fight.ID","assets/logos/fightid.png",12000,226260,53.04,0.75,7.11,"",1,9,28,"fight-id"],
    ["Sentient","assets/logos/sentient.jpg",10000,182611,54.76,1.14,4.81,"互动亚军",1,10,25,"sentient"],
    ["FF","assets/logos/ff.jpg",10000,168795,59.24,0.61,9.69,"",1,11,22,"ff"],
    ["Lit Protocol","assets/logos/litprotocol.jpg",12000,174763,68.66,0.95,7.25,"",1,12,24,"lit-protocol"],
    ["HeyElsa","assets/logos/heyelsa.jpg",10000,120494,83.00,1.20,6.94,"互动王",1,13,20,"heyelsa"],
    ["ZetaChain","assets/logos/zetachain.jpg",6000,65693,91.33,0.49,18.57,"",1,14,16,"zetachain"],
    ["KAIO","assets/logos/kaio.png",37200,124426,298.99,0.55,54.63,"旗舰预算",1,15,15,"kaio"],
  ];

  for (const p of projects) {
    await pool.query(
      'INSERT INTO projects (name,logo,budget,impressions,cpm,er,cpe,tag,is_baseline,sort_order,tweets,slug) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      p
    );
  }
}

async function seedI18n(dict) {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM i18n');
  if (parseInt(rows[0].c) > 0) return;

  for (const [lang, entries] of Object.entries(dict)) {
    for (const [key, val] of Object.entries(entries)) {
      const section = key.split('.')[0] || 'misc';
      const strVal = Array.isArray(val) ? JSON.stringify(val) : String(val);
      await pool.query(
        'INSERT INTO i18n (lang, key, value, section) VALUES ($1, $2, $3, $4) ON CONFLICT (lang, key) DO NOTHING',
        [lang, key, strVal, section]
      );
    }
  }
}

async function seedIPCases() {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM ip_cases');
  if (parseInt(rows[0].c) > 0) return;
  await pool.query('INSERT INTO ip_cases (slug, sort_order, status) VALUES ($1, $2, $3)', ['astra', 0, 'published']);
}

module.exports = { pool, initDB, seedProjects, seedI18n, seedIPCases };

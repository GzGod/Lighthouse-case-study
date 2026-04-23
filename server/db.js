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
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS ip_cases (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
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
    ["HashKey Exchange","assets/logos/hashkey.jpg",1400,73455,19.06,0.38,5.05,"CPM 王",1,0],
    ["Portals","assets/logos/portals.jpg",4000,136284,29.35,1.05,2.81,"性价比王",1,1],
    ["zkVerify","assets/logos/zkverify.jpg",12000,365874,32.80,0.53,6.21,"曝光王",1,2],
    ["SonicSVM","assets/logos/sonicsvm.jpg",8000,241450,33.14,0.67,4.98,"",1,3],
    ["Puffpaw","assets/logos/puffpaw.jpg",4000,119319,33.52,0.67,4.99,"",1,4],
    ["Allora","assets/logos/allora.jpg",12000,328192,36.56,0.87,4.19,"",1,5],
    ["Maiga","assets/logos/maiga.jpg",6000,151256,39.67,0.64,6.24,"",1,6],
    ["Yei Finance","assets/logos/yei.jpg",8000,196680,40.67,0.91,4.47,"",1,7],
    ["Kamino","assets/logos/kamino.jpg",8000,183587,43.57,0.46,9.56,"",1,8],
    ["Fight.ID","assets/logos/fightid.png",12000,226260,53.04,0.75,7.11,"",1,9],
    ["Sentient","assets/logos/sentient.jpg",10000,182611,54.76,1.14,4.81,"互动亚军",1,10],
    ["FF","assets/logos/ff.jpg",10000,168795,59.24,0.61,9.69,"",1,11],
    ["Lit Protocol","assets/logos/litprotocol.jpg",12000,174763,68.66,0.95,7.25,"",1,12],
    ["HeyElsa","assets/logos/heyelsa.jpg",10000,120494,83.00,1.20,6.94,"互动王",1,13],
    ["ZetaChain","assets/logos/zetachain.jpg",6000,65693,91.33,0.49,18.57,"",1,14],
    ["KAIO","assets/logos/kaio.png",37200,124426,298.99,0.55,54.63,"旗舰预算",0,15],
  ];

  for (const p of projects) {
    await pool.query(
      'INSERT INTO projects (name,logo,budget,impressions,cpm,er,cpe,tag,is_baseline,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
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

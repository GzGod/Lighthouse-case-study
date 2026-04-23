const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data.db');

function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS i18n (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lang TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      section TEXT NOT NULL DEFAULT 'misc',
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(lang, key)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ip_case_i18n (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      lang TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      UNIQUE(case_id, lang, key),
      FOREIGN KEY (case_id) REFERENCES ip_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      path TEXT NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default admin if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('lighthouse2026', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  return db;
}

function seedProjects(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
  if (count > 0) return;

  const projects = [
    { name: "HashKey Exchange", logo: "assets/logos/hashkey.jpg", budget: 1400, imp: 73455, cpm: 19.06, er: 0.38, cpe: 5.05, tag: "CPM 王" },
    { name: "Portals", logo: "assets/logos/portals.jpg", budget: 4000, imp: 136284, cpm: 29.35, er: 1.05, cpe: 2.81, tag: "性价比王" },
    { name: "zkVerify", logo: "assets/logos/zkverify.jpg", budget: 12000, imp: 365874, cpm: 32.80, er: 0.53, cpe: 6.21, tag: "曝光王" },
    { name: "SonicSVM", logo: "assets/logos/sonicsvm.jpg", budget: 8000, imp: 241450, cpm: 33.14, er: 0.67, cpe: 4.98, tag: "" },
    { name: "Puffpaw", logo: "assets/logos/puffpaw.jpg", budget: 4000, imp: 119319, cpm: 33.52, er: 0.67, cpe: 4.99, tag: "" },
    { name: "Allora", logo: "assets/logos/allora.jpg", budget: 12000, imp: 328192, cpm: 36.56, er: 0.87, cpe: 4.19, tag: "" },
    { name: "Maiga", logo: "assets/logos/maiga.jpg", budget: 6000, imp: 151256, cpm: 39.67, er: 0.64, cpe: 6.24, tag: "" },
    { name: "Yei Finance", logo: "assets/logos/yei.jpg", budget: 8000, imp: 196680, cpm: 40.67, er: 0.91, cpe: 4.47, tag: "" },
    { name: "Kamino", logo: "assets/logos/kamino.jpg", budget: 8000, imp: 183587, cpm: 43.57, er: 0.46, cpe: 9.56, tag: "" },
    { name: "Fight.ID", logo: "assets/logos/fightid.png", budget: 12000, imp: 226260, cpm: 53.04, er: 0.75, cpe: 7.11, tag: "" },
    { name: "Sentient", logo: "assets/logos/sentient.jpg", budget: 10000, imp: 182611, cpm: 54.76, er: 1.14, cpe: 4.81, tag: "互动亚军" },
    { name: "FF", logo: "assets/logos/ff.jpg", budget: 10000, imp: 168795, cpm: 59.24, er: 0.61, cpe: 9.69, tag: "" },
    { name: "Lit Protocol", logo: "assets/logos/litprotocol.jpg", budget: 12000, imp: 174763, cpm: 68.66, er: 0.95, cpe: 7.25, tag: "" },
    { name: "HeyElsa", logo: "assets/logos/heyelsa.jpg", budget: 10000, imp: 120494, cpm: 83.00, er: 1.20, cpe: 6.94, tag: "互动王" },
    { name: "ZetaChain", logo: "assets/logos/zetachain.jpg", budget: 6000, imp: 65693, cpm: 91.33, er: 0.49, cpe: 18.57, tag: "" },
    { name: "KAIO", logo: "assets/logos/kaio.png", budget: 37200, imp: 124426, cpm: 298.99, er: 0.55, cpe: 54.63, tag: "旗舰预算", is_baseline: 0 },
  ];

  const stmt = db.prepare('INSERT INTO projects (name, logo, budget, impressions, cpm, er, cpe, tag, is_baseline, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const tx = db.transaction(() => {
    projects.forEach((p, i) => {
      stmt.run(p.name, p.logo, p.budget, p.imp, p.cpm, p.er, p.cpe, p.tag, p.is_baseline ?? 1, i);
    });
  });
  tx();
}

function seedI18n(db, dict) {
  const count = db.prepare('SELECT COUNT(*) as c FROM i18n').get().c;
  if (count > 0) return;

  const stmt = db.prepare('INSERT INTO i18n (lang, key, value, section) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    for (const [lang, entries] of Object.entries(dict)) {
      for (const [key, val] of Object.entries(entries)) {
        const section = key.split('.')[0] || 'misc';
        const strVal = Array.isArray(val) ? JSON.stringify(val) : String(val);
        stmt.run(lang, key, strVal, section);
      }
    }
  });
  tx();
}

function seedIPCases(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM ip_cases').get().c;
  if (count > 0) return;
  db.prepare('INSERT INTO ip_cases (slug, sort_order, status) VALUES (?, ?, ?)').run('astra', 0, 'published');
}

module.exports = { initDB, seedProjects, seedI18n, seedIPCases, DB_PATH };

const express = require('express');
const { authMiddleware } = require('../auth');
const router = express.Router();

const TRANSLATE_TIMEOUT_MS = 10000;
const AUTO_TRANSLATE_PROVIDER = process.env.I18N_TRANSLATE_PROVIDER || 'auto';

function parseStoredValue(value) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join('');
  } catch {}
  return String(value ?? '');
}

function looksLikeEmbeddedI18nValue(value) {
  const text = parseStoredValue(value);
  return /"[\w.-]+\.[\w.-]+"\s*:/.test(text) || /why\.w\d+\.d/.test(text);
}

function sanitizeRowsForAdmin(rows) {
  return rows.map(r => (
    r.lang === 'en' && looksLikeEmbeddedI18nValue(r.value)
      ? { ...r, value: '' }
      : r
  ));
}

function maskPlaceholders(text) {
  const placeholders = [];
  const masked = text.replace(/\{(\w+)\}/g, (match) => {
    const token = `LHPLACEHOLDER${placeholders.length}`;
    placeholders.push([token, match]);
    return token;
  });
  return { masked, placeholders };
}

function restorePlaceholders(text, placeholders) {
  let restored = text;
  for (const [token, value] of placeholders) {
    restored = restored.replace(new RegExp(token, 'g'), value);
  }
  return restored;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = TRANSLATE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function translateWithOpenAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.I18N_TRANSLATE_MODEL || 'gpt-4o-mini';
  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Translate Simplified Chinese website copy into natural, concise English. Preserve placeholders such as LHPLACEHOLDER0 exactly. Return only the translation.',
        },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI translate failed (${res.status})`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

async function translateWithGoogle(text) {
  const url = 'https://translate.googleapis.com/translate_a/single'
    + `?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Google translate failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data?.[0]) ? data[0].map(part => part?.[0] || '').join('').trim() : null;
}

async function translateZhToEnglish(value) {
  const source = parseStoredValue(value).trim();
  if (!source) return '';
  if (!/[\u3400-\u9fff]/.test(source)) return source;
  const { masked, placeholders } = maskPlaceholders(source);
  let translated = null;
  if (AUTO_TRANSLATE_PROVIDER !== 'google') {
    translated = await translateWithOpenAI(masked);
  }
  if (!translated && AUTO_TRANSLATE_PROVIDER !== 'openai') {
    translated = await translateWithGoogle(masked);
  }
  if (!translated) throw new Error('No translation provider available');
  return restorePlaceholders(translated, placeholders);
}

async function upsertI18n(pool, lang, key, value, section) {
  const strVal = Array.isArray(value) ? JSON.stringify(value) : String(value);
  await pool.query(
    'INSERT INTO i18n (lang, key, value, section) VALUES ($1,$2,$3,$4) ON CONFLICT (lang, key) DO UPDATE SET value = $3, section = $4, updated_at = NOW()',
    [lang, key, strVal, section]
  );
}

async function autoTranslateEnglish(pool, update) {
  if (update.lang !== 'zh') return null;
  const section = update.section || update.key.split('.')[0] || 'misc';
  const translated = await translateZhToEnglish(update.value);
  await upsertI18n(pool, 'en', update.key, translated, section);
  return translated;
}

module.exports = function(pool) {
  // Public: get all i18n for frontend
  router.get('/', async (req, res) => {
    const { rows } = await pool.query('SELECT lang, key, value FROM i18n ORDER BY lang, key');
    const dict = {};
    for (const r of rows) {
      if (r.lang === 'en' && looksLikeEmbeddedI18nValue(r.value)) continue;
      if (!dict[r.lang]) dict[r.lang] = {};
      try { const p = JSON.parse(r.value); if (Array.isArray(p)) { dict[r.lang][r.key] = p; continue; } } catch {}
      dict[r.lang][r.key] = r.value;
    }
    res.json(dict);
  });

  // Admin: get all editable copy rows
  router.get('/all', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM i18n ORDER BY section, key, lang');
    res.json(sanitizeRowsForAdmin(rows));
  });

  // Admin: get by section
  router.get('/section/:section', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM i18n WHERE section = $1 ORDER BY key, lang', [req.params.section]);
    res.json(sanitizeRowsForAdmin(rows));
  });

  // Admin: get all sections
  router.get('/sections', authMiddleware, async (req, res) => {
    const { rows } = await pool.query('SELECT DISTINCT section FROM i18n ORDER BY section');
    res.json(rows.map(r => r.section));
  });

  // Admin: update single key
  router.put('/:lang/:key', authMiddleware, async (req, res) => {
    const { value } = req.body;
    const sec = req.body.section || req.params.key.split('.')[0] || 'misc';
    await upsertI18n(pool, req.params.lang, req.params.key, value, sec);
    const translation_errors = [];
    try {
      await autoTranslateEnglish(pool, { lang: req.params.lang, key: req.params.key, value, section: sec });
    } catch (error) {
      translation_errors.push({ key: req.params.key, error: error.message });
    }
    res.json({ ok: true, translation_errors });
  });

  // Admin: batch update
  router.put('/', authMiddleware, async (req, res) => {
    const { updates } = req.body;
    const translation_errors = [];
    for (const u of updates) {
      const sec = u.section || u.key.split('.')[0] || 'misc';
      await upsertI18n(pool, u.lang, u.key, u.value, sec);
      try {
        await autoTranslateEnglish(pool, { ...u, section: sec });
      } catch (error) {
        translation_errors.push({ key: u.key, error: error.message });
      }
    }
    res.json({ ok: true, count: updates.length, translation_errors });
  });

  // Admin: add new key
  router.post('/', authMiddleware, async (req, res) => {
    const { lang, key, value, section } = req.body;
    const sec = section || key.split('.')[0] || 'misc';
    await upsertI18n(pool, lang, key, value, sec);
    const translation_errors = [];
    try {
      await autoTranslateEnglish(pool, { lang, key, value, section: sec });
    } catch (error) {
      translation_errors.push({ key, error: error.message });
    }
    res.json({ ok: true, translation_errors });
  });

  return router;
};

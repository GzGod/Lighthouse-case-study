/**
 * Enrichment Worker
 * Fetches before/after metrics for each case study project:
 *   - Social volume from sa_timeline_counts (internal source DB)
 *   - Campaign time series from tweet_data_snapshots (internal source DB)
 *   - Token price/volume from CoinGecko + Gate.io (no key needed for free tier)
 *   - Funding data from RootData (scraped)
 *
 * Runs on startup and every 6 hours via setInterval.
 * Results are stored in project_enrichment table on the case study DB.
 */

'use strict';

const https = require('https');
const http = require('http');
const { Pool } = require('pg');

// ─── Source DB (production Lighthouse) ──────────────────────────────────────
function getSourcePool() {
  const cs = process.env.LIGHTHOUSE_SOURCE_DATABASE_URL || process.env.SOURCE_DATABASE_URL || '';
  if (!cs) return null;
  const normalized = cs.replace(/([?&])sslmode=[^&]+&?/i, '$1').replace(/[?&]$/, '');
  return new Pool({ connectionString: normalized, ssl: { rejectUnauthorized: false }, max: 2 });
}

// ─── HTTP fetch helper ───────────────────────────────────────────────────────
function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'LighthouseCaseStudy/1.0',
        'Accept': 'application/json',
        ...(opts.headers || {}),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// All CoinGecko IDs and symbols verified via CoinGecko search API + DexScreener
// "coingecko: null" = not listed on CoinGecko; dex-only or no TGE
const SLUG_TO_NAME = {
  'surf': 'Surf', 'zetachain': 'ZetaChain', 'kaio': 'KAIO',
  'hashkey-exchange': 'HashKey Exchange', 'portals': 'Portals',
  'zkverify': 'zkVerify', 'sonicsvm': 'SonicSVM', 'puffpaw': 'Puffpaw',
  'allora': 'Allora', 'maiga': 'Maiga', 'yei-finance': 'Yei Finance',
  'kamino': 'Kamino', 'fight-id': 'Fight.ID', 'sentient': 'Sentient',
  'ff': 'FF', 'lit-protocol': 'Lit Protocol', 'heyelsa': 'HeyElsa',
  'dappos': 'DAPPOS',
};

const PROJECT_META = {
  'surf':             { handle: 'surfaihq',        coingecko: null,              symbol: null,      chain: null },
  'zetachain':        { handle: 'zetachain',        coingecko: 'zetachain',       symbol: 'ZETA',    chain: 'zeta' },
  'kaio':             { handle: null,               coingecko: null,              symbol: 'KAIO',    chain: 'ethereum', dex_search: 'KAIO' },
  'hashkey-exchange': { handle: 'hashkeyexchange',  coingecko: 'hashkey-ecopoints', symbol: 'HSK',  chain: 'ethereum' },
  'portals':          { handle: 'portals',          coingecko: null,              symbol: 'PORTALS', chain: 'solana', dex_search: 'PORTALS' },
  'zkverify':         { handle: 'zkverify',         coingecko: null,              symbol: 'VFY',     chain: 'base', dex_search: 'VFY' },
  'sonicsvm':         { handle: 'soniclabs',        coingecko: 'sonic-svm',       symbol: 'SONIC',   chain: 'sonic' },
  'puffpaw':          { handle: 'puffpaw',          coingecko: null,              symbol: null,      chain: null },
  'allora':           { handle: 'AlloraNetwork',    coingecko: 'allora',          symbol: 'ALLO',    chain: 'ethereum' },
  'maiga':            { handle: null,               coingecko: null,              symbol: 'MAIGA',   chain: 'bsc', dex_search: 'MAIGA' },
  'yei-finance':      { handle: 'YeiFinance',       coingecko: 'yei-finance',     symbol: 'CLO',     chain: 'sei' },
  'kamino':           { handle: 'KaminoFinance',    coingecko: 'kamino',          symbol: 'KMNO',    chain: 'solana' },
  'fight-id':         { handle: 'joinfightid',      coingecko: null,              symbol: null,      chain: null },
  'sentient':         { handle: 'sentient_agi',     coingecko: 'sentient',        symbol: 'SENT',    chain: 'base' },
  'ff':               { handle: null,               coingecko: null,              symbol: 'FF',      chain: 'bsc', dex_search: 'FF' },
  'lit-protocol':     { handle: 'LitProtocol',      coingecko: 'lit-protocol',    symbol: 'LITKEY',  chain: 'base' },
  'heyelsa':          { handle: 'heyelsaai',        coingecko: null,              symbol: null,      chain: null },
  'dappos':           { handle: 'dappos_com',       coingecko: null,              symbol: 'DOS',     chain: null },
};

// ─── CoinGecko: current price + 30d history ─────────────────────────────────
async function fetchCoinGeckoData(coingeckoId) {
  if (!coingeckoId) return null;
  try {
    const [info, history] = await Promise.all([
      fetchJson(`https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`),
      fetchJson(`https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=365&interval=daily`),
    ]);
    const md = info.market_data || {};
    return {
      current_price: md.current_price?.usd || null,
      market_cap: md.market_cap?.usd || null,
      volume_24h: md.total_volume?.usd || null,
      ath: md.ath?.usd || null,
      ath_date: md.ath_date?.usd || null,
      price_history: (history.prices || []).map(([ts, price]) => ({
        date: new Date(ts).toISOString().slice(0, 10),
        price,
      })),
      volume_history: (history.total_volumes || []).map(([ts, vol]) => ({
        date: new Date(ts).toISOString().slice(0, 10),
        volume: vol,
      })),
    };
  } catch (e) {
    console.warn(`[enrichment] CoinGecko ${coingeckoId}: ${e.message}`);
    return null;
  }
}

// ─── Gate.io: current ticker ─────────────────────────────────────────────────
async function fetchGateData(symbol) {
  if (!symbol) return null;
  try {
    const data = await fetchJson(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol}_USDT`);
    if (!Array.isArray(data) || !data[0]) return null;
    const t = data[0];
    return {
      last_price: parseFloat(t.last) || null,
      volume_24h_usdt: parseFloat(t.quote_volume) || null,
      high_24h: parseFloat(t.high_24h) || null,
      low_24h: parseFloat(t.low_24h) || null,
      change_pct: parseFloat(t.change_percentage) || null,
    };
  } catch (e) {
    console.warn(`[enrichment] Gate.io ${symbol}: ${e.message}`);
    return null;
  }
}

// ─── DexScreener: DEX pairs for chain tokens ────────────────────────────────
async function fetchDexData(symbol) {
  if (!symbol) return null;
  try {
    const data = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${symbol}`);
    const pairs = (data.pairs || [])
      .filter(p => p.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase())
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
    if (!pairs.length) return null;
    const top = pairs[0];
    return {
      dex: top.dexId,
      chain: top.chainId,
      price_usd: parseFloat(top.priceUsd) || null,
      volume_24h: top.volume?.h24 || null,
      liquidity_usd: top.liquidity?.usd || null,
      price_change_24h: top.priceChange?.h24 || null,
      pair_address: top.pairAddress,
    };
  } catch (e) {
    console.warn(`[enrichment] DexScreener ${symbol}: ${e.message}`);
    return null;
  }
}

// ─── Source DB: campaign time series for a project ───────────────────────────
async function fetchCampaignTimeSeries(sourcePool, projectName) {
  if (!sourcePool || !projectName) return null;
  try {
    const { rows } = await sourcePool.query(`
      SELECT
        DATE_TRUNC('day', tds."capturedAt") as day,
        SUM(tds.views) as views,
        SUM(tds.likes + tds.retweets + tds.replies) as engagement,
        COUNT(*) as snapshots
      FROM tweet_data_snapshots tds
      INNER JOIN unified_campaigns c ON tds."campaignId" = c.id
      WHERE c."projectName" = $1
      GROUP BY day
      ORDER BY day
    `, [projectName]);
    return rows.map(r => ({
      date: new Date(r.day).toISOString().slice(0, 10),
      views: parseInt(r.views) || 0,
      engagement: parseInt(r.engagement) || 0,
      snapshots: parseInt(r.snapshots) || 0,
    }));
  } catch (e) {
    console.warn(`[enrichment] campaign timeseries ${projectName}: ${e.message}`);
    return null;
  }
}

// ─── Source DB: social volume for a handle ───────────────────────────────────
async function fetchSocialVolume(sourcePool, handle) {
  if (!sourcePool || !handle) return null;
  try {
    const { rows } = await sourcePool.query(`
      SELECT subject_handle, window_start, window_end, author_count, viewer_count, computed_at
      FROM sa_timeline_counts
      WHERE subject_handle = $1
      ORDER BY window_start DESC
      LIMIT 20
    `, [handle.toLowerCase()]);
    return rows;
  } catch (e) {
    console.warn(`[enrichment] social volume ${handle}: ${e.message}`);
    return null;
  }
}

// ─── Source DB: before/after stats around campaign period ────────────────────
async function fetchBeforeAfterMetrics(sourcePool, projectName) {
  if (!sourcePool || !projectName) return null;
  try {
    // Get campaign date range
    const { rows: rangeRows } = await sourcePool.query(`
      SELECT
        MIN("createdAt") as first_campaign,
        MAX("createdAt") as last_campaign,
        COUNT(*) as campaign_count,
        SUM("totalBudget") as total_budget,
        SUM("consumedBudget") as consumed_budget
      FROM unified_campaigns
      WHERE "projectName" = $1 AND status = 'ENDED'
    `, [projectName]);
    if (!rangeRows[0]?.first_campaign) return null;
    const firstCampaign = new Date(rangeRows[0].first_campaign);
    const lastCampaign = new Date(rangeRows[0].last_campaign);
    // 30 days before first campaign
    const beforeStart = new Date(firstCampaign);
    beforeStart.setDate(beforeStart.getDate() - 30);
    // 30 days after last campaign
    const afterEnd = new Date(lastCampaign);
    afterEnd.setDate(afterEnd.getDate() + 30);

    // Metrics during campaign window (from tweet_data_snapshots)
    const { rows: duringRows } = await sourcePool.query(`
      SELECT
        SUM(tds.views) as total_views,
        SUM(tds.likes + tds.retweets + tds.replies) as total_engagement,
        COUNT(DISTINCT tds."campaignId") as campaign_count,
        MAX(tds.views) as peak_views
      FROM tweet_data_snapshots tds
      INNER JOIN unified_campaigns c ON tds."campaignId" = c.id
      WHERE c."projectName" = $1
        AND tds."capturedAt" BETWEEN $2 AND $3
    `, [projectName, firstCampaign, lastCampaign]);

    return {
      campaign_period: {
        start: firstCampaign.toISOString(),
        end: lastCampaign.toISOString(),
        count: parseInt(rangeRows[0].campaign_count) || 0,
        total_budget: parseFloat(rangeRows[0].total_budget) || 0,
        consumed_budget: parseFloat(rangeRows[0].consumed_budget) || 0,
      },
      during_campaign: {
        total_views: parseInt(duringRows[0]?.total_views) || 0,
        total_engagement: parseInt(duringRows[0]?.total_engagement) || 0,
        peak_views: parseInt(duringRows[0]?.peak_views) || 0,
        campaign_count: parseInt(duringRows[0]?.campaign_count) || 0,
      },
    };
  } catch (e) {
    console.warn(`[enrichment] before/after ${projectName}: ${e.message}`);
    return null;
  }
}

// ─── Main enrichment job ─────────────────────────────────────────────────────
async function runEnrichment(cmsPool) {
  const sourcePool = getSourcePool();
  console.log('[enrichment] Starting enrichment run...');

  // Ensure table exists
  await cmsPool.query(`
    CREATE TABLE IF NOT EXISTS project_enrichment (
      slug TEXT PRIMARY KEY,
      project_name TEXT,
      twitter_handle TEXT,
      coingecko_id TEXT,
      token_symbol TEXT,
      has_token BOOLEAN DEFAULT false,

      -- Token market data
      token_price_usd NUMERIC,
      token_market_cap NUMERIC,
      token_volume_24h NUMERIC,
      token_ath NUMERIC,
      token_ath_date TEXT,
      token_price_history JSONB DEFAULT '[]',
      token_volume_history JSONB DEFAULT '[]',
      gate_price NUMERIC,
      gate_volume_24h NUMERIC,
      gate_change_pct NUMERIC,
      dex_price NUMERIC,
      dex_volume_24h NUMERIC,
      dex_chain TEXT,

      -- Campaign metrics (from source DB)
      campaign_start TEXT,
      campaign_end TEXT,
      campaign_count INTEGER DEFAULT 0,
      total_budget NUMERIC DEFAULT 0,
      consumed_budget NUMERIC DEFAULT 0,
      during_views BIGINT DEFAULT 0,
      during_engagement BIGINT DEFAULT 0,
      peak_views INTEGER DEFAULT 0,
      campaign_time_series JSONB DEFAULT '[]',

      -- Social volume (from sa_timeline_counts)
      social_author_count INTEGER DEFAULT 0,
      social_viewer_count INTEGER DEFAULT 0,
      social_window_start TEXT,
      social_history JSONB DEFAULT '[]',

      enriched_at TIMESTAMPTZ DEFAULT NOW(),
      enrichment_errors JSONB DEFAULT '{}'
    )
  `);

  const slugs = Object.keys(PROJECT_META);
  // Map slug → project name as stored in unified_campaigns — defined at module scope

  for (const slug of slugs) {
    const meta = PROJECT_META[slug];
    const projectName = SLUG_TO_NAME[slug];
    const errors = {};
    console.log(`[enrichment] Processing ${slug}...`);

    // Parallel fetches: token data (only if has TGE) + campaign data
    // Token logic: CoinGecko first (has coingecko id), else DexScreener (has dex_search),
    // else Gate.io for exchange-listed symbols
    const dexQuery = meta.dex_search || (meta.symbol && !meta.coingecko ? meta.symbol : null);
    const [cgData, gateData, dexData, campaignTS, beforeAfter, socialVol] = await Promise.all([
      meta.coingecko ? fetchCoinGeckoData(meta.coingecko).catch(e => { errors.coingecko = e.message; return null; }) : Promise.resolve(null),
      meta.symbol && meta.coingecko ? fetchGateData(meta.symbol).catch(e => { errors.gate = e.message; return null; }) : Promise.resolve(null),
      dexQuery ? fetchDexData(dexQuery).catch(e => { errors.dex = e.message; return null; }) : Promise.resolve(null),
      sourcePool ? fetchCampaignTimeSeries(sourcePool, projectName).catch(e => { errors.campaign_ts = e.message; return null; }) : Promise.resolve(null),
      sourcePool ? fetchBeforeAfterMetrics(sourcePool, projectName).catch(e => { errors.before_after = e.message; return null; }) : Promise.resolve(null),
      sourcePool && meta.handle ? fetchSocialVolume(sourcePool, meta.handle).catch(e => { errors.social = e.message; return null; }) : Promise.resolve(null),
    ]);

    // Upsert into project_enrichment
    await cmsPool.query(`
      INSERT INTO project_enrichment (
        slug, project_name, twitter_handle, coingecko_id, token_symbol, has_token,
        token_price_usd, token_market_cap, token_volume_24h, token_ath, token_ath_date,
        token_price_history, token_volume_history,
        gate_price, gate_volume_24h, gate_change_pct,
        dex_price, dex_volume_24h, dex_chain,
        campaign_start, campaign_end, campaign_count, total_budget, consumed_budget,
        during_views, during_engagement, peak_views, campaign_time_series,
        social_author_count, social_viewer_count, social_window_start, social_history,
        enriched_at, enrichment_errors
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13,
        $14, $15, $16,
        $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, $28,
        $29, $30, $31, $32,
        NOW(), $33
      )
      ON CONFLICT (slug) DO UPDATE SET
        token_price_usd = EXCLUDED.token_price_usd,
        token_market_cap = EXCLUDED.token_market_cap,
        token_volume_24h = EXCLUDED.token_volume_24h,
        token_ath = EXCLUDED.token_ath,
        token_ath_date = EXCLUDED.token_ath_date,
        token_price_history = EXCLUDED.token_price_history,
        token_volume_history = EXCLUDED.token_volume_history,
        gate_price = EXCLUDED.gate_price,
        gate_volume_24h = EXCLUDED.gate_volume_24h,
        gate_change_pct = EXCLUDED.gate_change_pct,
        dex_price = EXCLUDED.dex_price,
        dex_volume_24h = EXCLUDED.dex_volume_24h,
        dex_chain = EXCLUDED.dex_chain,
        campaign_start = EXCLUDED.campaign_start,
        campaign_end = EXCLUDED.campaign_end,
        campaign_count = EXCLUDED.campaign_count,
        total_budget = EXCLUDED.total_budget,
        consumed_budget = EXCLUDED.consumed_budget,
        during_views = EXCLUDED.during_views,
        during_engagement = EXCLUDED.during_engagement,
        peak_views = EXCLUDED.peak_views,
        campaign_time_series = EXCLUDED.campaign_time_series,
        social_author_count = EXCLUDED.social_author_count,
        social_viewer_count = EXCLUDED.social_viewer_count,
        social_window_start = EXCLUDED.social_window_start,
        social_history = EXCLUDED.social_history,
        enriched_at = NOW(),
        enrichment_errors = EXCLUDED.enrichment_errors
    `, [
      slug, projectName, meta.handle, meta.coingecko, meta.symbol, !!meta.coingecko,
      cgData?.current_price, cgData?.market_cap, cgData?.volume_24h, cgData?.ath, cgData?.ath_date,
      JSON.stringify(cgData?.price_history || []), JSON.stringify(cgData?.volume_history || []),
      gateData?.last_price, gateData?.volume_24h_usdt, gateData?.change_pct,
      dexData?.price_usd, dexData?.volume_24h, dexData?.chain,
      beforeAfter?.campaign_period?.start, beforeAfter?.campaign_period?.end,
      beforeAfter?.campaign_period?.count, beforeAfter?.campaign_period?.total_budget,
      beforeAfter?.campaign_period?.consumed_budget,
      beforeAfter?.during_campaign?.total_views, beforeAfter?.during_campaign?.total_engagement,
      beforeAfter?.during_campaign?.peak_views,
      JSON.stringify(campaignTS || []),
      socialVol?.[0]?.author_count || 0, socialVol?.[0]?.viewer_count || 0,
      socialVol?.[0]?.window_start ? new Date(socialVol[0].window_start).toISOString().slice(0, 10) : null,
      JSON.stringify(socialVol || []),
      JSON.stringify(errors),
    ]);

    console.log(`[enrichment] ✓ ${slug}: token=${!!cgData}, campaigns=${beforeAfter?.campaign_period?.count || 0}, social_authors=${socialVol?.[0]?.author_count || 0}`);
    // Rate-limit CoinGecko (50 req/min free tier)
    if (meta.coingecko) await new Promise(r => setTimeout(r, 1300));
  }

  console.log('[enrichment] Main slug loop complete.');
}

// ─── Schedule ────────────────────────────────────────────────────────────────
function startEnrichmentSchedule(cmsPool) {
  // Run immediately on startup (non-blocking)
  runEnrichment(cmsPool).catch(e => console.error('[enrichment] Error:', e.message));
  // Re-run every 6 hours
  setInterval(() => {
    runEnrichment(cmsPool).catch(e => console.error('[enrichment] Error:', e.message));
  }, 6 * 60 * 60 * 1000);
}

module.exports = { startEnrichmentSchedule, runEnrichment };

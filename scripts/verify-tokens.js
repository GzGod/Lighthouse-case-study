/**
 * Verify each project's token status via CoinGecko search (by name, not ticker)
 * and DexScreener fallback. Outputs the verified mapping.
 */
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'LighthouseCaseStudy/1.0', 'Accept': 'application/json' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('parse')); } });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Search CoinGecko by project name, return best match with market data
async function searchCoinGeckoByName(name) {
  if (!name) return null;
  try {
    const q = encodeURIComponent(name);
    const d = await fetchJson(`https://api.coingecko.com/api/v3/search?query=${q}`);
    const coins = (d.coins || [])
      .filter(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()))
      .slice(0, 3);
    const results = [];
    for (const c of coins) {
      await sleep(1200);
      try {
        const info = await fetchJson(`https://api.coingecko.com/api/v3/coins/${c.id}?localization=false&tickers=false&community_data=false&developer_data=false`);
        const md = info.market_data || {};
        results.push({
          id: c.id,
          symbol: info.symbol?.toUpperCase(),
          name: info.name,
          price_usd: md.current_price?.usd,
          market_cap: md.market_cap?.usd,
          volume_24h: md.total_volume?.usd,
        });
      } catch {}
    }
    return results;
  } catch { return null; }
}

// Search DexScreener by name — finds on-chain pairs
async function searchDexByName(name) {
  if (!name) return null;
  try {
    const d = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(name)}`);
    const pairs = (d.pairs || [])
      .filter(p => p.baseToken?.name?.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.baseToken?.name?.toLowerCase() || ''))
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 3);
    return pairs.map(p => ({
      symbol: p.baseToken?.symbol,
      name: p.baseToken?.name,
      chain: p.chainId,
      dex: p.dexId,
      price_usd: p.priceUsd ? parseFloat(p.priceUsd) : null,
      volume_24h: p.volume?.h24 || 0,
      liquidity_usd: p.liquidity?.usd || 0,
    }));
  } catch { return null; }
}

const PROJECTS = [
  'Surf', 'ZetaChain', 'KAIO', 'HashKey Exchange', 'Portals', 'zkVerify',
  'SonicSVM', 'Puffpaw', 'Allora', 'Maiga', 'Yei Finance', 'Kamino',
  'Fight.ID', 'Sentient', 'FF', 'Lit Protocol', 'HeyElsa',
];

(async () => {
  console.log('=== Token Verification by Project Name ===\n');
  for (const name of PROJECTS) {
    console.log(`--- ${name} ---`);
    const cg = await searchCoinGeckoByName(name);
    if (cg && cg.length) {
      for (const m of cg) {
        console.log(`  CoinGecko: id=${m.id} sym=${m.symbol} price=$${m.price_usd} mcap=$${m.market_cap} vol24h=$${m.volume_24h}`);
      }
    } else {
      console.log('  CoinGecko: NOT FOUND');
    }
    const dex = await searchDexByName(name);
    if (dex && dex.length) {
      for (const m of dex) {
        console.log(`  DexScreener: sym=${m.symbol} chain=${m.chain} price=$${m.price_usd} vol24h=$${m.volume_24h} liq=$${m.liquidity_usd}`);
      }
    } else {
      console.log('  DexScreener: NOT FOUND');
    }
    console.log('');
    await sleep(1300);
  }
})();

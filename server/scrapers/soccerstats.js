const fetch = require('node-fetch');
const cheerio = require('cheerio');

const LEAGUE_MAPPING = {
  'PL': 'england',
  'BL': 'germany',
  'LL': 'spain',
  'SA': 'italy',
  'FR': 'france'
};

const BASE_URL = 'https://www.soccerstats.com/table.asp';

const delay = ms => new Promise(res => setTimeout(res, ms));

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'max-age=0',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

/**
 * Scrapea los datos de SoccerStats para una liga específica.
 * @param {string} ligaId - El ID de la liga ('PL', 'BL', 'LL', 'SA', 'FR')
 * @returns {Promise<{summary: Object, teams: Array, url: string}>} Datos extraídos
 */
async function scrapeLeague(ligaId) {
  const leagueName = LEAGUE_MAPPING[ligaId];
  if (!leagueName) {
    throw new Error(`Liga no soportada para scraping: ${ligaId}`);
  }

  const teamsMap = new Map(); // Key: Raw Team Name, Value: Stats Object

  // 1. Fetch Goals & BTTS stats (tid=c)
  console.log(`[SoccerStats] Fetching Goals & BTTS stats (tid=c) for ${ligaId}...`);
  const goalsUrl = `${BASE_URL}?league=${leagueName}&tid=c`;
  const goalsHtml = await fetchPage(goalsUrl);
  parseGoalsTable(goalsHtml, teamsMap);

  await delay(3000); // Respetar el sitio

  // 2. Fetch Corner stats (tid=cr)
  console.log(`[SoccerStats] Fetching Corner stats (tid=cr) for ${ligaId}...`);
  const cornersUrl = `${BASE_URL}?league=${leagueName}&tid=cr`;
  const cornersHtml = await fetchPage(cornersUrl);
  parseCornersTable(cornersHtml, teamsMap);

  const teams = Array.from(teamsMap.values());
  const summary = {
    season: '2024/25',
    scraped_at: new Date()
  };

  return { summary, teams, url: goalsUrl };
}

async function fetchPage(url) {
  const timeout = parseInt(process.env.SOCCERSTATS_TIMEOUT_MS, 10) || 15000;
  
  const response = await fetch(url, { 
    headers,
    timeout: timeout 
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al acceder a ${url}`);
  }
  return await response.text();
}

/**
 * Parsea la tabla de Goles y BTTS (tid=c)
 */
function parseGoalsTable(html, teamsMap) {
  const $ = cheerio.load(html);
  
  // REGLA: Usar solo la Tabla 0 (Season Totals)
  const statsTable = $('table#btable').first();
  const rows = statsTable.find('tr.odd, tr.even');

  const BIG_5 = ['Arsenal', 'Liverpool', 'Manchester City', 'Manchester Utd', 'Tottenham'];

  rows.each((i, el) => {
    const td = $(el).find('td');
    
    // VALIDACIÓN ESTRUCTURAL:
    // 1. Ignorar filas con menos de 10 columnas
    if (td.length < 10) return;

    // 2. Ignorar filas donde GP (index 1) no sea numérico
    const gpText = td.eq(1).text().trim();
    if (!/^\d+$/.test(gpText)) return;

    // 3. Ignorar filas sin nombre de equipo
    let teamNameRaw = td.eq(0).find('a').text().trim() || td.eq(0).text().trim();
    teamNameRaw = teamNameRaw.replace(/\s+/g, ' ').trim();
    if (!teamNameRaw) return;

    // LOG VERBOSO PARA BIG 5 (Requerimiento de validación)
    const isBig5 = BIG_5.find(t => teamNameRaw.includes(t));
    if (isBig5) {
        console.log(`\n[Validation Phase 2.1] Detected ${teamNameRaw}:`);
        console.log(`  Raw columns: [${td.map((i, c) => $(c).text().trim()).get().join(' | ')}]`);
    }

    const stats = teamsMap.get(teamNameRaw) || { team_name_raw: teamNameRaw };
    
    // REGLA: ÍNDICES CONFIRMADOS EN RUNTIME
    // Index 4: 1.5, 5: 2.5, 6: 3.5, 9: BTS
    const o15raw = td.eq(4).text().trim();
    const o25raw = td.eq(5).text().trim();
    const o35raw = td.eq(6).text().trim();
    const btsRaw = td.eq(9).text().trim();

    // VALIDACIÓN: Solo parsear si termina en '%'
    if (o15raw.endsWith('%')) stats.over15_pct = parsePct(o15raw);
    if (o25raw.endsWith('%')) stats.over25_pct = parsePct(o25raw);
    if (o35raw.endsWith('%')) stats.over35_pct = parsePct(o35raw);
    if (btsRaw.endsWith('%')) stats.btts_pct = parsePct(btsRaw);
    
    if (isBig5) {
        console.log(`  Parsed: O25=${stats.over25_pct}%, BTS=${stats.btts_pct}%`);
    }

    teamsMap.set(teamNameRaw, stats);
  });
}

/**
 * Parsea la tabla de Córners (tid=cr)
 */
function parseCornersTable(html, teamsMap) {
  const $ = cheerio.load(html);
  
  // REGLA: Usar solo la Tabla 0 (Season Totals)
  const statsTable = $('table#btable').first();
  const rows = statsTable.find('tr.odd, tr.even');

  const BIG_5 = ['Arsenal', 'Liverpool', 'Manchester City', 'Manchester Utd', 'Tottenham'];

  rows.each((i, el) => {
    const td = $(el).find('td');
    
    // VALIDACIÓN ESTRUCTURAL
    if (td.length < 5) return;
    const gpText = td.eq(1).text().trim();
    if (!/^\d+$/.test(gpText)) return;

    let teamNameRaw = td.eq(0).find('a').text().trim() || td.eq(0).text().trim();
    teamNameRaw = teamNameRaw.replace(/\s+/g, ' ').trim();
    if (!teamNameRaw) return;

    const isBig5 = BIG_5.find(t => teamNameRaw.includes(t));
    if (isBig5) {
        console.log(`\n[Validation Phase 2.1] Detected ${teamNameRaw} (Corners):`);
        console.log(`  Raw columns: [${td.map((i, c) => $(c).text().trim()).get().join(' | ')}]`);
    }

    const stats = teamsMap.get(teamNameRaw) || { team_name_raw: teamNameRaw };
    
    // REGLA: ÍNDICE CONFIRMADO 5
    const cornersRaw = td.eq(5).text().trim();
    
    // VALIDACIÓN: Solo si es decimal válido
    if (/^\d+(\.\d+)?$/.test(cornersRaw)) {
        stats.avg_corners_total = parseFloat(cornersRaw);
    }
    
    if (isBig5) {
        console.log(`  Parsed: CornersTotal=${stats.avg_corners_total}`);
    }

    teamsMap.set(teamNameRaw, stats);
  });
}

/**
 * Helper para limpiar % y convertir a número
 */
function parsePct(str) {
  if (!str) return null;
  const val = parseFloat(str.replace('%', ''));
  return isNaN(val) ? null : val;
}

module.exports = { scrapeLeague };

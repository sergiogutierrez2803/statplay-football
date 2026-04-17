/**
 * StatPlay — teammap.js
 * Mapeo canónico entre API-Football IDs y Football-Data.org IDs
 * Soporta: PL, BL, La Liga (LL), Serie A (SA)
 */

// Premier League
const PL_MAP = {
  40:  2,    // Liverpool
  42:  57,   // Arsenal
  50:  65,   // Manchester City
  49:  61,   // Chelsea
  34:  67,   // Newcastle United
  66:  58,   // Aston Villa
  65:  351,  // Nottingham Forest
  51:  397,  // Brighton
  35:  1044, // Bournemouth
  55:  402,  // Brentford
  36:  63,   // Fulham
  52:  354,  // Crystal Palace
  45:  62,   // Everton
  48:  563,  // West Ham
  33:  66,   // Manchester United
  39:  76,   // Wolverhampton
  47:  73,   // Tottenham
  46:  338,  // Leicester
  57:  349,  // Ipswich
  41:  340,  // Southampton
};

// Bundesliga
const BL_MAP = {
  157: 5,   // Bayern Munich
  168: 3,   // Bayer Leverkusen
  169: 19,  // Eintracht Frankfurt
  165: 4,   // Borussia Dortmund
  160: 17,  // SC Freiburg
  164: 15,  // FSV Mainz 05
  173: 721, // RB Leipzig
  162: 12,  // Werder Bremen
  172: 10,  // VfB Stuttgart
  163: 18,  // Borussia Mönchengladbach
  161: 11,  // VfL Wolfsburg
  170: 16,  // FC Augsburg
  182: 28,  // Union Berlin
  186: 1,   // FC St. Pauli
  167: 13,  // 1899 Hoffenheim
  180: 2,   // 1. FC Heidenheim
  191: 9,   // Holstein Kiel
  176: 6,   // VfL Bochum
};

// La Liga (API-Football id → FD id) — IDs verificados contra FD /competitions/PD/standings
// TODO: Para verificar IDs marcados con (*), ejecutar en Railway Shell:
//   node -e "require('dotenv').config(); const fd=require('./footballdata'); fd.getFDTeams('LL').then(t=>t.forEach(e=>console.log(e.id,e.nombre)))"
const LL_MAP = {
  529: 81,   // FC Barcelona            ✓ verificado
  541: 86,   // Real Madrid CF          ✓ verificado
  533: 94,   // Villarreal CF           ✓ verificado
  530: 78,   // Club Atlético de Madrid ✓ verificado
  543: 90,   // Real Betis Balompié     ✓ verificado
  538: 558,  // RC Celta de Vigo        ✓ verificado
  548: 92,   // Real Sociedad           ✓ verificado
  546: 82,   // Getafe CF               ✓ verificado
  534: 93,   // Athletic Club           ✓ verificado
  536: 559,  // Sevilla FC              ✓ verificado
  540: 80,   // RCD Espanyol            ✓ verificado
  542: 263,  // Deportivo Alavés        ✓ verificado
  547: 298,  // Girona FC               ✓ verificado
  727: 79,   // CA Osasuna              ✓ verificado
  728: 87,   // Rayo Vallecano          ✓ verificado
  532: 95,   // Valencia CF             ✓ verificado
  798: 89,   // RCD Mallorca            ✓ verificado
  537: 745,  // CD Leganés              ✓ verificado
  720: 250,  // Real Valladolid         (*) verificar: GET /v4/competitions/PD/teams
  715: 275,  // UD Las Palmas           (*) verificar: GET /v4/competitions/PD/teams
};

// Serie A (API-Football id → FD id)
// Auditado: 2026-04-15
// CORRECCIONES:
//   - Napoli (492) y Lazio (487) estaban INTERCAMBIADOS → corregido
//   - Fiorentina (502) y Bologna (500) estaban INTERCAMBIADOS → corregido
//   - Valores 0 = equipos sin ID FD confirmado (promovidos recientemente)
// Fuente de verdad para logos: teamLogoMap.js (usa el id correcto en la URL)
const SA_MAP = {
  505: 108,   // Inter Milan
  502: 113,   // SSC Napoli
  489: 98,    // AC Milan
  496: 109,   // Juventus FC
  895: 7397,  // Como 1907
  100: 100,   // AS Roma
  499: 102,   // Atalanta BC
  500: 103,   // Bologna FC 1909
  471: 471,   // US Sassuolo Calcio
  492: 110,   // SS Lazio
  115: 115,   // Udinese Calcio
  503: 586,   // Torino FC
  497: 107,   // Genoa CFC
  495: 112,   // Parma Calcio 1913
  487: 99,    // ACF Fiorentina
  490: 104,   // Cagliari Calcio
  457: 457,   // US Cremonese
  867: 5890,  // US Lecce
  504: 450,   // Hellas Verona FC
  1579: 0,   // AC Monza            — sin ID FD confirmado
  801: 487, // Pisa
};

// Mapa inverso: fd_id → apif_id
// IMPORTANTE: Solo incluye entradas con fd_id > 0 (fd_id=0 = sin confirmación en FD).
const FD_TO_APIF = {};
for (const [apif, fd] of Object.entries({ ...PL_MAP, ...BL_MAP, ...LL_MAP, ...SA_MAP })) {
  if (fd) FD_TO_APIF[fd] = parseInt(apif); // omitir entradas sin fd_id confirmado
}

function fdToApif(fdId) { return FD_TO_APIF[fdId] || null; }

function apifToFd(apifId) {
  return PL_MAP[apifId] || BL_MAP[apifId] || LL_MAP[apifId] || SA_MAP[apifId] || null;
}

/**
 * Fuzzy match por nombre cuando no hay mapeo directo
 * Retorna el apif_id más probable
 */
function matchByName(fdName, apifTeams) {
  if (!fdName || !apifTeams?.length) return null;
  const norm = s => s.toLowerCase()
    .replace(/fc |cf |afc |sc |vfl |vfb |fsv |rb |1\. /g, '')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a')
    .trim();
  const target = norm(fdName);
  let best = null, bestScore = 0;
  for (const t of apifTeams) {
    const candidate = norm(t.nombre || t.name || '');
    if (candidate === target) return t.id;
    // Partial match
    const score = candidate.includes(target) || target.includes(candidate) ? 0.8 : 0;
    if (score > bestScore) { bestScore = score; best = t.id; }
  }
  return bestScore >= 0.8 ? best : null;
}

module.exports = { PL_MAP, BL_MAP, LL_MAP, SA_MAP, FD_TO_APIF, fdToApif, apifToFd, matchByName };

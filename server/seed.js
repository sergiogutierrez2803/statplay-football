/**
 * StatPlay — seed.js (seed estructural mínimo)
 *
 * REGLA: este archivo solo inserta estructura base.
 * Los datos deportivos reales (posiciones, puntos, goles, estadísticas)
 * deben venir exclusivamente desde sync.js → Football-Data.org + API-Football.
 *
 * Uso: node seed.js
 * Después: node -e "require('./sync').syncAllData()"  (o GET /api/admin/sync)
 */

const pool = require('./db');

/* ── Ligas ── */
const LEAGUES = [
  { id: 'PL', nombre: 'Premier League', pais: 'Inglaterra', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', api_id: 39,  fd_id: 2021, sdb_id: '4328', accent_color: '#3d195b', logo_url: 'https://media.api-sports.io/football/leagues/39.png'  },
  { id: 'BL', nombre: 'Bundesliga',     pais: 'Alemania',   emoji: '🇩🇪',          api_id: 78,  fd_id: 2002, sdb_id: '4331', accent_color: '#d3010c', logo_url: 'https://media.api-sports.io/football/leagues/78.png'  },
  { id: 'LL', nombre: 'La Liga',        pais: 'España',     emoji: '🇪🇸',          api_id: 140, fd_id: 2014, sdb_id: '4335', accent_color: '#ee8707', logo_url: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 'SA', nombre: 'Serie A',        pais: 'Italia',     emoji: '🇮🇹',          api_id: 135, fd_id: 2019, sdb_id: '4332', accent_color: '#024494', logo_url: 'https://media.api-sports.io/football/leagues/135.png' },
];

/* ── Equipos base — IDs de API-Football (canónicos) ──
   Stats en cero: el sync los rellenará con datos reales.
   Solo se incluyen los equipos necesarios para que FK constraints no fallen.
*/
const TEAMS = [
  // Premier League (api_id=39)
  { id: 42,  nombre: 'Arsenal',           short_name: 'ARS', emoji: '🔴', liga_id: 'PL' },
  { id: 50,  nombre: 'Manchester City',   short_name: 'MCI', emoji: '🔵', liga_id: 'PL' },
  { id: 33,  nombre: 'Manchester United', short_name: 'MUN', emoji: '🔴', liga_id: 'PL' },
  { id: 66,  nombre: 'Aston Villa',       short_name: 'AVL', emoji: '🟣', liga_id: 'PL' },
  { id: 40,  nombre: 'Liverpool',         short_name: 'LIV', emoji: '🔴', liga_id: 'PL' },
  { id: 49,  nombre: 'Chelsea',           short_name: 'CHE', emoji: '💙', liga_id: 'PL' },
  { id: 55,  nombre: 'Brentford',         short_name: 'BRE', emoji: '🐝', liga_id: 'PL' },
  { id: 45,  nombre: 'Everton',           short_name: 'EVE', emoji: '🔵', liga_id: 'PL' },
  { id: 36,  nombre: 'Fulham',            short_name: 'FUL', emoji: '⚫', liga_id: 'PL' },
  { id: 51,  nombre: 'Brighton',          short_name: 'BHA', emoji: '🔵', liga_id: 'PL' },
  { id: 41,  nombre: 'Southampton',       short_name: 'SOU', emoji: '🔴', liga_id: 'PL' },
  { id: 34,  nombre: 'Newcastle',         short_name: 'NEW', emoji: '⚫', liga_id: 'PL' },
  { id: 35,  nombre: 'Bournemouth',       short_name: 'BOU', emoji: '🍒', liga_id: 'PL' },
  { id: 52,  nombre: 'Crystal Palace',    short_name: 'CRY', emoji: '🦅', liga_id: 'PL' },
  { id: 63,  nombre: 'Leeds United',      short_name: 'LEE', emoji: '⚪', liga_id: 'PL' },
  { id: 65,  nombre: 'Nottm Forest',      short_name: 'NFO', emoji: '🌲', liga_id: 'PL' },
  { id: 47,  nombre: 'Tottenham',         short_name: 'TOT', emoji: '⚪', liga_id: 'PL' },
  { id: 48,  nombre: 'West Ham',          short_name: 'WHU', emoji: '🔨', liga_id: 'PL' },
  { id: 44,  nombre: 'Burnley',           short_name: 'BUR', emoji: '🟤', liga_id: 'PL' },
  { id: 39,  nombre: 'Wolves',            short_name: 'WOL', emoji: '🐺', liga_id: 'PL' },

  // Bundesliga (api_id=78)
  { id: 157, nombre: 'Bayern Munich',       short_name: 'BAY', emoji: '🔴', liga_id: 'BL' },
  { id: 168, nombre: 'Bayer Leverkusen',    short_name: 'B04', emoji: '🔴', liga_id: 'BL' },
  { id: 165, nombre: 'Borussia Dortmund',   short_name: 'BVB', emoji: '🟡', liga_id: 'BL' },
  { id: 173, nombre: 'RB Leipzig',          short_name: 'RBL', emoji: '⚪', liga_id: 'BL' },
  { id: 169, nombre: 'Eintracht Frankfurt', short_name: 'SGE', emoji: '🦅', liga_id: 'BL' },
  { id: 172, nombre: 'Stuttgart',           short_name: 'VFB', emoji: '⚪', liga_id: 'BL' },
  { id: 161, nombre: 'Freiburg',            short_name: 'SCF', emoji: '🔴', liga_id: 'BL' },
  { id: 163, nombre: 'Borussia M\'gladbach', short_name: 'BMG', emoji: '⚪', liga_id: 'BL' },
  { id: 167, nombre: 'Hoffenheim',          short_name: 'TSG', emoji: '🔵', liga_id: 'BL' },
  { id: 162, nombre: 'Werder Bremen',       short_name: 'SVW', emoji: '🟢', liga_id: 'BL' },
  { id: 176, nombre: 'Mainz',               short_name: 'M05', emoji: '🔴', liga_id: 'BL' },
  { id: 164, nombre: 'Augsburg',            short_name: 'FCA', emoji: '🔴', liga_id: 'BL' },
  { id: 170, nombre: 'FC Köln',             short_name: 'KOE', emoji: '🐐', liga_id: 'BL' },
  { id: 174, nombre: 'Wolfsburg',           short_name: 'WOB', emoji: '🐺', liga_id: 'BL' },
  { id: 180, nombre: 'FC Heidenheim',       short_name: 'FCH', emoji: '⚪', liga_id: 'BL' },
  { id: 182, nombre: 'Darmstadt',           short_name: 'D98', emoji: '🔵', liga_id: 'BL' },
  { id: 159, nombre: 'Hertha Berlin',       short_name: 'BSC', emoji: '🔵', liga_id: 'BL' },
  { id: 160, nombre: 'Union Berlin',        short_name: 'FCU', emoji: '🔴', liga_id: 'BL' },

  // La Liga (api_id=140)
  { id: 529, nombre: 'Barcelona',       short_name: 'BAR', emoji: '🔵', liga_id: 'LL' },
  { id: 541, nombre: 'Real Madrid',     short_name: 'RMA', emoji: '⚪', liga_id: 'LL' },
  { id: 530, nombre: 'Atletico Madrid', short_name: 'ATM', emoji: '🔴', liga_id: 'LL' },
  { id: 548, nombre: 'Real Sociedad',   short_name: 'RSO', emoji: '🔵', liga_id: 'LL' },
  { id: 533, nombre: 'Villarreal',      short_name: 'VIL', emoji: '🟡', liga_id: 'LL' },
  { id: 536, nombre: 'Sevilla',         short_name: 'SEV', emoji: '⚪', liga_id: 'LL' },
  { id: 543, nombre: 'Real Betis',      short_name: 'BET', emoji: '🟢', liga_id: 'LL' },
  { id: 534, nombre: 'Athletic Bilbao', short_name: 'ATH', emoji: '🔴', liga_id: 'LL' },
  { id: 532, nombre: 'Valencia',        short_name: 'VAL', emoji: '🦇', liga_id: 'LL' },
  { id: 538, nombre: 'Celta Vigo',      short_name: 'CEL', emoji: '🔵', liga_id: 'LL' },
  { id: 540, nombre: 'Espanyol',        short_name: 'ESP', emoji: '🔵', liga_id: 'LL' },
  { id: 546, nombre: 'Getafe',          short_name: 'GET', emoji: '🔵', liga_id: 'LL' },
  { id: 547, nombre: 'Girona',          short_name: 'GIR', emoji: '🔴', liga_id: 'LL' },
  { id: 723, nombre: 'Almeria',         short_name: 'ALM', emoji: '🔴', liga_id: 'LL' },
  { id: 727, nombre: 'Cadiz',           short_name: 'CAD', emoji: '🟡', liga_id: 'LL' },
  { id: 531, nombre: 'Granada',         short_name: 'GRA', emoji: '🔴', liga_id: 'LL' },
  { id: 798, nombre: 'Las Palmas',      short_name: 'LPA', emoji: '🟡', liga_id: 'LL' },
  { id: 545, nombre: 'Mallorca',        short_name: 'MAL', emoji: '🔴', liga_id: 'LL' },
  { id: 542, nombre: 'Osasuna',         short_name: 'OSA', emoji: '🔴', liga_id: 'LL' },
  { id: 539, nombre: 'Rayo Vallecano',  short_name: 'RAY', emoji: '🔴', liga_id: 'LL' },

  // Serie A (api_id=135)
  { id: 489, nombre: 'Inter Milan',  short_name: 'INT', emoji: '⚫', liga_id: 'SA' },
  { id: 496, nombre: 'Juventus',     short_name: 'JUV', emoji: '⚫', liga_id: 'SA' },
  { id: 488, nombre: 'AC Milan',     short_name: 'MIL', emoji: '🔴', liga_id: 'SA' },
  { id: 487, nombre: 'Napoli',       short_name: 'NAP', emoji: '🔵', liga_id: 'SA' },
  { id: 497, nombre: 'AS Roma',      short_name: 'ROM', emoji: '🟡', liga_id: 'SA' },
  { id: 492, nombre: 'Lazio',        short_name: 'LAZ', emoji: '🔵', liga_id: 'SA' },
  { id: 499, nombre: 'Atalanta',     short_name: 'ATA', emoji: '🔵', liga_id: 'SA' },
  { id: 500, nombre: 'Fiorentina',   short_name: 'FIO', emoji: '🟣', liga_id: 'SA' },
  { id: 494, nombre: 'Bologna',      short_name: 'BOL', emoji: '🔴', liga_id: 'SA' },
  { id: 502, nombre: 'Torino',       short_name: 'TOR', emoji: '🟤', liga_id: 'SA' },
  { id: 503, nombre: 'Udinese',      short_name: 'UDI', emoji: '⚫', liga_id: 'SA' },
  { id: 504, nombre: 'Sassuolo',     short_name: 'SAS', emoji: '🟢', liga_id: 'SA' },
  { id: 505, nombre: 'Cagliari',     short_name: 'CAG', emoji: '🔴', liga_id: 'SA' },
  { id: 506, nombre: 'Salernitana',  short_name: 'SAL', emoji: '🟤', liga_id: 'SA' },
  { id: 507, nombre: 'Verona',       short_name: 'VER', emoji: '🔵', liga_id: 'SA' },
  { id: 508, nombre: 'Frosinone',    short_name: 'FRO', emoji: '🟡', liga_id: 'SA' },
  { id: 511, nombre: 'Empoli',       short_name: 'EMP', emoji: '🔵', liga_id: 'SA' },
  { id: 512, nombre: 'Lecce',        short_name: 'LEC', emoji: '🔴', liga_id: 'SA' },
  { id: 514, nombre: 'Genoa',        short_name: 'GEN', emoji: '🔴', liga_id: 'SA' },
  { id: 715, nombre: 'Monza',        short_name: 'MON', emoji: '🔴', liga_id: 'SA' },
];

async function seed() {
  try {
    console.log('\n--- Seed estructural mínimo ---\n');

    // Limpiar en orden correcto (FK constraints)
    await pool.query('DELETE FROM predicciones');
    await pool.query('DELETE FROM partidos');
    await pool.query('DELETE FROM estadisticas');
    await pool.query('DELETE FROM equipos');
    await pool.query('DELETE FROM ligas');
    console.log('✅ Tablas limpiadas');

    // Insertar ligas
    for (const l of LEAGUES) {
      await pool.query(`
        INSERT INTO ligas (id, nombre, pais, emoji, api_id, fd_id, sdb_id, accent_color, logo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [l.id, l.nombre, l.pais, l.emoji, l.api_id, l.fd_id, l.sdb_id, l.accent_color, l.logo_url]);
    }
    console.log(`✅ ${LEAGUES.length} ligas insertadas`);

    // Insertar equipos con stats en cero
    for (const t of TEAMS) {
      await pool.query(`
        INSERT INTO equipos (id, nombre, short_name, emoji, liga_id,
          pos, puntos, jugados, ganados, empatados, perdidos, gf, ga, gd)
        VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0)
      `, [t.id, t.nombre, t.short_name, t.emoji, t.liga_id]);

      // Estadísticas inicializadas en cero — sync las rellenará con datos reales
      await pool.query(`
        INSERT INTO estadisticas (equipo_id, forma,
          h_win_rate, h_draw_rate, a_win_rate, a_draw_rate,
          h_gf, h_ga, a_gf, a_ga, avg_corners, h1_scoring_ratio, fuente)
        VALUES (?, '', 0, 0, 0, 0, 0, 0, 0, 0, 5.0, 0.42, 'seed')
      `, [t.id]);
    }
    console.log(`✅ ${TEAMS.length} equipos insertados (stats en cero)`);

    console.log('\n--- Seed completado ---');
    console.log('⚠️  Ejecuta sync para poblar datos reales:');
    console.log('   node -e "require(\'dotenv\').config(); require(\'./sync\').syncAllData().then(() => process.exit())"');
    console.log('   o GET /api/admin/sync\n');

    process.exit(0);
  } catch (e) {
    console.error('Error en seed:', e.message);
    process.exit(1);
  }
}

seed();

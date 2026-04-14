/**
 * StatPlay — sync.js  (Arquitectura Híbrida)
 *
 * Fuente A: Football-Data.org  → standings, fixtures, equipos ACTUALES
 * Fuente B: API-Football       → estadísticas históricas, H2H, predicciones
 *
 * Reglas:
 *  - Si FD falla → usar datos de DB existentes (no romper app)
 *  - Si APIF falla → usar estadísticas de DB existentes
 *  - Cache en memoria para evitar llamadas duplicadas
 *  - Todos los IDs canónicos son de API-Football (tabla equipos.id)
 *  - fd_id se guarda en equipos.fd_id para el mapeo
 */

const axios  = require('axios');
const pool   = require('./db');
const { getFDStandings, getFDFixtures, getFDTeams } = require('./footballdata');
const { fdToApif, apifToFd, matchByName }           = require('./teammap');
require('dotenv').config();

const API_KEY  = process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const SEASON   = 2024;

// Cache en memoria con TTL (sesión)
const _apifCache = {};
const APIF_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

/* ─────────────────────────────────────────
   Helper: llamada a API-Football con cache
───────────────────────────────────────── */
async function apifGet(endpoint, params = {}) {
  const key = endpoint + JSON.stringify(params);
  const cached = _apifCache[key];
  if (cached && (Date.now() - cached.ts) < APIF_CACHE_TTL) return cached.data;
  try {
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      params,
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    const data = res.data;
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.warn(`[APIF Warning] ${endpoint}:`, JSON.stringify(data.errors));
      return null;
    }
    if (!data.response || data.response.length === 0) {
      console.warn(`[APIF Empty] ${endpoint}`, params);
      return null;
    }
    _apifCache[key] = { data: data.response, ts: Date.now() };
    return data.response;
  } catch (e) {
    console.error(`[APIF Error] ${endpoint}:`, e.message);
    return null;
  }
}

/* ───────────────────────────────────────────
   Limpiar entradas expiradas del cache en memoria
   Llamar desde cleanup.js en la limpieza semanal.
─────────────────────────────────────────── */
function cleanExpiredApifCache() {
  const now = Date.now();
  let removed = 0;
  for (const key of Object.keys(_apifCache)) {
    if ((now - _apifCache[key].ts) > APIF_CACHE_TTL) {
      delete _apifCache[key];
      removed++;
    }
  }
  if (removed > 0) console.log(`[APIF Cache] Limpieza: ${removed} entradas expiradas eliminadas.`);
  return removed;
}

/* ─────────────────────────────────────────
   A. Sync desde Football-Data.org
   Actualiza: standings, equipos (fd_id, logo, nombre_fd)
───────────────────────────────────────── */
async function syncFromFD(ligaId) {
  console.log(`[FD] Sync ${ligaId}...`);
  const standings = await getFDStandings(ligaId);
  if (!standings) {
    console.warn(`[FD] Sin standings para ${ligaId} — datos existentes se mantienen`);
    return { ok: false, source: 'fd', reason: 'empty' };
  }

  // Obtener equipos actuales de DB para el mapeo por nombre
  const [dbTeams] = await pool.query('SELECT id, nombre FROM equipos WHERE liga_id = ?', [ligaId]);

  for (const row of standings) {
    // Resolver apif_id desde el mapa o por nombre
    let apifId = fdToApif(row.fd_id);
    if (!apifId) apifId = matchByName(row.name, dbTeams);
    if (!apifId) {
      console.warn(`[FD] Sin mapeo para ${row.name} (fd_id=${row.fd_id})`);
      continue;
    }

    // Actualizar standings y guardar fd_id + logo de FD
    // IMPORTANTE: FD tiene datos actuales (2025/26), sobreescribir pos/puntos siempre
    // También actualizar nombre con el de FD (más oficial)
    await pool.query(`
      UPDATE equipos SET
        fd_id      = ?,
        nombre_fd  = ?,
        nombre     = ?,
        pos        = ?,
        puntos     = ?,
        jugados    = ?,
        ganados    = ?,
        empatados  = ?,
        perdidos   = ?,
        gf         = ?,
        ga         = ?,
        gd         = ?,
        logo_url   = COALESCE(logo_url, ?),
        fuente     = 'fd'
      WHERE id = ?
    `, [
      row.fd_id, row.name, row.name,
      row.position, row.points, row.played,
      row.won, row.drawn, row.lost,
      row.gf, row.ga, row.gd,
      row.crest,
      apifId
    ]);

    // Actualizar forma si viene de FD
    if (row.form && row.form.length > 0) {
      const formaStr = row.form.slice(-5).join('-');
      await pool.query(
        'UPDATE estadisticas SET forma = ? WHERE equipo_id = ?',
        [formaStr, apifId]
      );
    }
  }

  // Sync fixtures desde FD — solo insertar si ambos equipos existen en DB
  const fixtures = await getFDFixtures(ligaId);
  if (fixtures) {
    // Obtener IDs válidos en DB para esta liga
    const [validIds] = await pool.query('SELECT id FROM equipos WHERE liga_id = ?', [ligaId]);
    const validSet = new Set(validIds.map(r => r.id));

    for (const f of fixtures) {
      if (!f.fecha) continue;
      const homeApif = fdToApif(f.homeTeam.fd_id) || matchByName(f.homeTeam.name, dbTeams);
      const awayApif = fdToApif(f.awayTeam.fd_id) || matchByName(f.awayTeam.name, dbTeams);
      // Solo insertar si ambos equipos existen en la DB (evita FK errors)
      if (!homeApif || !awayApif || !validSet.has(homeApif) || !validSet.has(awayApif)) continue;

      await pool.query(`
        INSERT INTO partidos (fd_fixture_id, home_team_id, away_team_id, jornada, fecha, liga_id, estado, fuente)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'fd')
        ON DUPLICATE KEY UPDATE
          fd_fixture_id = VALUES(fd_fixture_id),
          fecha         = VALUES(fecha),
          estado        = VALUES(estado)
      `, [f.fd_id, homeApif, awayApif, f.jornada, f.fecha, ligaId, f.estado || 'SCHEDULED']);
    }
    console.log(`[FD] ${fixtures.length} fixtures procesados para ${ligaId}`);
  }

  console.log(`[FD] ${standings.length} equipos actualizados para ${ligaId}`);
  return { ok: true, source: 'fd', teams: standings.length };
}

/* ─────────────────────────────────────────
   B. Sync desde API-Football
   Actualiza: estadísticas históricas, logos oficiales
───────────────────────────────────────── */
async function syncFromAPIFootball(ligaId, apiLeagueId) {
  console.log(`[APIF] Sync ${ligaId} season=${SEASON}...`);

  // Logo de liga
  try {
    const leagueData = await apifGet('/leagues', { id: apiLeagueId, season: SEASON });
    if (leagueData?.[0]?.league?.logo) {
      await pool.query('UPDATE ligas SET logo_url = ? WHERE id = ?',
        [leagueData[0].league.logo, ligaId]);
    }
  } catch (e) { console.warn('[APIF] Logo liga error:', e.message); }

  // Standings con estadísticas home/away
  const standingsData = await apifGet('/standings', { league: apiLeagueId, season: SEASON });
  if (!standingsData) {
    console.warn(`[APIF] Sin standings para ${ligaId}`);
    return { ok: false, source: 'apif', reason: 'empty' };
  }

  const standings = standingsData[0]?.league?.standings?.[0];
  if (!standings) return { ok: false, source: 'apif', reason: 'empty' };

  for (const s of standings) {
    const team = s.team;
    const all  = s.all;
    const home = s.home;
    const away = s.away;

    // Upsert equipo con datos de APIF (si no existe ya desde FD)
    await pool.query(`
      INSERT INTO equipos (id, nombre, short_name, emoji, liga_id, pos, puntos,
        jugados, ganados, empatados, perdidos, gf, ga, gd, logo_url, fuente)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'apif')
      ON DUPLICATE KEY UPDATE
        logo_url = COALESCE(logo_url, VALUES(logo_url)),
        pos      = COALESCE(pos, VALUES(pos)),
        puntos   = COALESCE(puntos, VALUES(puntos))
    `, [
      team.id, team.name,
      team.code || team.name.substring(0, 3).toUpperCase(),
      '⚽', ligaId,
      s.rank, s.points, all.played, all.win, all.draw, all.lose,
      all.goals.for, all.goals.against, s.goalsDiff,
      team.logo || null
    ]);

    // Estadísticas históricas reales
    const hP = home?.played || 1;
    const aP = away?.played || 1;
    const formaRaw = (s.form || '').split('').join('-');

    /**
     * avg_corners y h1_scoring_ratio: aproximación por posición en tabla.
     * Las APIs gratuitas no proveen estos datos directamente.
     * Equipos top (pos 1-5): más corners, más goles en 1er tiempo.
     * Equipos medios (pos 6-12): valores intermedios.
     * Equipos bajos (pos 13+): menor producción ofensiva.
     * TODO: reemplazar con datos reales cuando se disponga de API premium.
     */
    const rank = s.rank || 10;
    const totalTeams = standings.length || 20;
    const rankRatio  = (rank - 1) / (totalTeams - 1); // 0=primero, 1=último
    const avgCorners      = +(6.8 - rankRatio * 2.2).toFixed(1);  // 6.8 (top) → 4.6 (bottom)
    const h1ScoringRatio  = +(0.46 - rankRatio * 0.08).toFixed(2); // 0.46 (top) → 0.38 (bottom)

    console.log(`[Rank Sync] ${team.name} (pos:${rank}) -> avgCorners:${avgCorners}`);

    const [writeResult] = await pool.query(`
      INSERT INTO estadisticas
        (equipo_id, forma, h_win_rate, h_draw_rate, a_win_rate, a_draw_rate,
         h_gf, h_ga, a_gf, a_ga, avg_corners, h1_scoring_ratio, fuente)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'apif')
      ON DUPLICATE KEY UPDATE
        forma       = VALUES(forma),
        h_win_rate  = VALUES(h_win_rate),
        h_draw_rate = VALUES(h_draw_rate),
        a_win_rate  = VALUES(a_win_rate),
        a_draw_rate = VALUES(a_draw_rate),
        h_gf        = VALUES(h_gf),
        h_ga        = VALUES(h_ga),
        a_gf        = VALUES(a_gf),
        a_ga        = VALUES(a_ga),
        avg_corners = VALUES(avg_corners),
        h1_scoring_ratio = VALUES(h1_scoring_ratio),
        fuente      = 'apif'
    `, [
      team.id, formaRaw,
      +((home?.win  || 0) / hP).toFixed(2),
      +((home?.draw || 0) / hP).toFixed(2),
      +((away?.win  || 0) / aP).toFixed(2),
      +((away?.draw || 0) / aP).toFixed(2),
      +((home?.goals?.for     || 0) / hP).toFixed(2),
      +((home?.goals?.against || 0) / hP).toFixed(2),
      +((away?.goals?.for     || 0) / aP).toFixed(2),
      +((away?.goals?.against || 0) / aP).toFixed(2),
      avgCorners, h1ScoringRatio
    ]);

    // AUDITORÍA DE ESCRITURA
    process.stdout.write(`[DB-WRITE] ${team.name}: OK (affected:${writeResult.affectedRows}, changed:${writeResult.changedRows})\n`);

    // VERIFICACIÓN DE LECTURA (Limitada a los 2 primeros equipos para no saturar)
    if (rank <= 2) {
      const [readRows] = await pool.query('SELECT avg_corners, h1_scoring_ratio FROM estadisticas WHERE equipo_id = ?', [team.id]);
      const dbVal = readRows[0]?.avg_corners;
      console.log(`[AUDIT-READ] ${team.name} en DB -> avg_corners: ${dbVal} (Calculado: ${avgCorners}) ${dbVal == avgCorners ? '✅ coinciden' : '❌ DISCREPANCIA'}`);
    }
  }

  console.log(`[APIF] ${standings.length} equipos con estadísticas para ${ligaId}`);
  return { ok: true, source: 'apif', teams: standings.length };
}

/* ─────────────────────────────────────────
   C. H2H desde API-Football con cache en DB
───────────────────────────────────────── */
async function getH2H(team1Id, team2Id) {
  // 1. Buscar en cache DB — en ambas direcciones
  try {
    const [cached] = await pool.query(
      `SELECT * FROM h2h_cache
       WHERE (team1_id = ? AND team2_id = ?) OR (team1_id = ? AND team2_id = ?)
       LIMIT 1`,
      [team1Id, team2Id, team2Id, team1Id]
    );
    if (cached.length > 0) {
      const c = cached[0];
      const ageHours = (Date.now() - new Date(c.updated_at).getTime()) / 3600000;
      if (ageHours < 48) {
        console.log(`[H2H Cache DB] HIT ${team1Id}-${team2Id} (${ageHours.toFixed(1)}h)`);
        // Si el cache está invertido, invertir los resultados
        const inverted = c.team1_id === team2Id;
        return {
          hw:     inverted ? c.aw : c.hw,
          d:      c.d,
          aw:     inverted ? c.hw : c.aw,
          goals:  inverted ? [+c.avg_goals_a, +c.avg_goals_h] : [+c.avg_goals_h, +c.avg_goals_a],
          source: 'db_cache'
        };
      }
    }
  } catch (e) { /* tabla puede no existir aún */ }

  // 2. Llamar a API-Football
  const data = await apifGet('/fixtures/headtohead', {
    h2h: `${team1Id}-${team2Id}`,
    season: SEASON,
    last: 10
  });

  if (!data) return _h2hFallback(team1Id, team2Id);

  console.log(`[H2H API] Obtenido desde API-Football: ${team1Id}-${team2Id}`);

  let hw = 0, d = 0, aw = 0, totalH = 0, totalA = 0, count = 0;
  for (const f of data) {
    const hG = f.goals?.home ?? 0;
    const aG = f.goals?.away ?? 0;
    if (f.teams.home.id === team1Id) {
      if (hG > aG) hw++; else if (hG === aG) d++; else aw++;
      totalH += hG; totalA += aG;
    } else {
      if (aG > hG) hw++; else if (aG === hG) d++; else aw++;
      totalH += aG; totalA += hG;
    }
    count++;
  }
  if (count === 0) return _h2hFallback(team1Id, team2Id);

  const result = {
    hw, d, aw,
    goals: [+(totalH / count).toFixed(1), +(totalA / count).toFixed(1)]
  };

  // Guardar en cache DB
  try {
    await pool.query(`
      INSERT INTO h2h_cache (team1_id, team2_id, hw, d, aw, avg_goals_h, avg_goals_a, partidos_analizados)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        hw = VALUES(hw), d = VALUES(d), aw = VALUES(aw),
        avg_goals_h = VALUES(avg_goals_h), avg_goals_a = VALUES(avg_goals_a),
        partidos_analizados = VALUES(partidos_analizados)
    `, [team1Id, team2Id, hw, d, aw, result.goals[0], result.goals[1], count]);
  } catch (e) { /* ignorar si tabla no existe */ }

  return result;
}

function _h2hFallback(t1, t2) {
  return { hw: 2, d: 1, aw: 2, goals: [1.3, 1.1] };
}

/* ─────────────────────────────────────────
   D. Logo de liga
───────────────────────────────────────── */
async function syncLeagueLogo(ligaId, apiLeagueId) {
  try {
    const data = await apifGet('/leagues', { id: apiLeagueId, season: SEASON });
    if (data?.[0]?.league?.logo) {
      await pool.query('UPDATE ligas SET logo_url = ? WHERE id = ?',
        [data[0].league.logo, ligaId]);
      console.log(`[APIF] Logo ${ligaId}: ${data[0].league.logo}`);
    }
  } catch (e) { console.error('[APIF] syncLeagueLogo:', e.message); }
}

/* ─────────────────────────────────────────
   Punto de entrada principal
───────────────────────────────────────── */
async function syncAllData() {
  const results = { success: true, timestamp: new Date(), leagues: [] };
  try {
    const [leagues] = await pool.query('SELECT * FROM ligas');
    console.log(`\n═══ Sync Híbrido (${leagues.length} ligas) ═══`);

    for (const l of leagues) {
      console.log(`\n── ${l.id} ──`);
      const lr = { id: l.id, fd: null, apif: null, errors: [] };

      // A. Football-Data.org (datos actuales temporada 2025/26)
      try { lr.fd = await syncFromFD(l.id); }
      catch (e) { lr.errors.push(`fd: ${e.message}`); console.error('[FD]', e.message); }

      // Pausa entre ligas para respetar rate limit de FD (10 req/min)
      await new Promise(r => setTimeout(r, 7000));

      // B. API-Football (estadísticas históricas season=2024)
      try { lr.apif = await syncFromAPIFootball(l.id, l.api_id); }
      catch (e) { lr.errors.push(`apif: ${e.message}`); console.error('[APIF]', e.message); }

      results.leagues.push(lr);
    }

    console.log('\n═══ Sync Finalizado ═══\n');
    return results;
  } catch (e) {
    console.error('[Critical] syncAllData:', e.message);
    return { success: false, error: e.message, timestamp: new Date() };
  }
}

module.exports = {
  syncAllData,
  syncFromFD,
  syncFromAPIFootball,
  syncLeagueLogo,
  getH2H,
};

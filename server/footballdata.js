/**
 * StatPlay — footballdata.js
 * Cliente para Football-Data.org (fuente principal: datos actuales)
 *
 * Plan gratuito — Competiciones disponibles:
 *  Premier League  → 2021 (PL)
 *  Bundesliga      → 2002 (BL)
 *  La Liga         → 2014 (LL)  — código FD: PD
 *  Serie A         → 2019 (SA)
 */

const fetch = require('node-fetch');
require('dotenv').config();

const FD_BASE = 'https://api.football-data.org/v4';
const FD_KEY  = process.env.FOOTBALL_DATA_KEY || '';

// liga_id → Football-Data competition id
const FD_COMPETITION = {
  PL: 2021,  // Premier League
  BL: 2002,  // Bundesliga
  LL: 2014,  // La Liga (PD en FD)
  SA: 2019,  // Serie A
};

// Cache en memoria (TTL 10 min para no superar 10 req/min)
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

function _cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data;
}
function _cacheSet(key, data) { _cache.set(key, { data, ts: Date.now() }); }

// Estado de rate-limiting — evita bloquear el event loop con await de 60s
let _fdRateLimitUntil = 0;

async function fdGet(path) {
  // Verificar rate-limit activo: no llamar a FD hasta que expire
  if (Date.now() < _fdRateLimitUntil) {
    const secsLeft = Math.ceil((_fdRateLimitUntil - Date.now()) / 1000);
    console.warn(`[FD] Rate limit activo — ${secsLeft}s restantes. Usando datos de DB.`);
    return null; // el caller usará DB como fallback
  }

  const cached = _cacheGet(path);
  if (cached) { console.log(`[FD Cache] HIT ${path}`); return cached; }

  const headers = { 'X-Auth-Token': FD_KEY };
  try {
    const res = await fetch(`${FD_BASE}${path}`, { headers, timeout: 10000 });
    if (res.status === 429) {
      // Registrar rate limit — próximas llamadas usarán DB por 65s
      _fdRateLimitUntil = Date.now() + 65000;
      console.warn(`[FD] Rate limit (429) — FD bloqueado por 65s. Usando datos de DB.`);
      return null; // no reintentar: retornar null para usar fallback
    }
    if (!res.ok) {
      console.warn(`[FD] HTTP ${res.status} para ${path}`);
      return null;
    }
    const data = await res.json();
    _cacheSet(path, data);
    return data;
  } catch (e) {
    console.error(`[FD Error] ${path}:`, e.message);
    return null;
  }
}

/* ─────────────────────────────────────────
   Standings actuales — temporada en curso (2025/26)
   El plan gratuito de FD devuelve la temporada actual por defecto.
   NO pasar ?season= porque el plan free no lo soporta en este endpoint.
───────────────────────────────────────── */
async function getFDStandings(ligaId) {
  const compId = FD_COMPETITION[ligaId];
  if (!compId) return null;
  // Sin ?season= → FD devuelve la temporada activa actual (2025/26)
  const data = await fdGet(`/competitions/${compId}/standings`);
  if (!data?.standings) return null;

  const total = data.standings.find(s => s.type === 'TOTAL');
  if (!total) return null;

  return total.table
    .filter(row => row.team && row.team.id) // T3.3: Validar que el equipo exista
    .map(row => ({
      position:  row.position,
      fd_id:     row.team.id,
      name:      row.team.name,
      shortName: row.team.shortName || row.team.tla,
      crest:     row.team.crest,
      played:    row.playedGames,
      won:       row.won,
      drawn:     row.draw,
      lost:      row.lost,
      gf:        row.goalsFor,
      ga:        row.goalsAgainst,
      gd:        row.goalDifference,
      points:    row.points,
      form:      row.form ? row.form.split(',').map(r => r.trim()) : []
    }));
}

/* ─────────────────────────────────────────
   Próximos partidos
───────────────────────────────────────── */
async function getFDFixtures(ligaId, matchday = null) {
  const compId = FD_COMPETITION[ligaId];
  if (!compId) return null;

  const path = matchday
    ? `/competitions/${compId}/matches?matchday=${matchday}`
    : `/competitions/${compId}/matches?status=SCHEDULED`;

  const data = await fdGet(path);
  if (!data?.matches) return null;

  return data.matches.slice(0, 20).map(m => ({
    fd_id:     m.id,
    jornada:   `Jornada ${m.matchday}`,
    fecha:     m.utcDate ? m.utcDate.split('T')[0] : null,
    hora:      m.utcDate ? m.utcDate.split('T')[1]?.substring(0, 5) : null,
    utcDate:   m.utcDate || null,
    estado:    m.status,
    homeTeam: {
      fd_id:     m.homeTeam.id,
      name:      m.homeTeam.name,
      shortName: m.homeTeam.shortName || m.homeTeam.tla,
      crest:     m.homeTeam.crest
    },
    awayTeam: {
      fd_id:     m.awayTeam.id,
      name:      m.awayTeam.name,
      shortName: m.awayTeam.shortName || m.awayTeam.tla,
      crest:     m.awayTeam.crest
    },
    score: m.score?.fullTime || null
  }));
}

/* ─────────────────────────────────────────
   Equipos de la competición
───────────────────────────────────────── */
async function getFDTeams(ligaId) {
  const compId = FD_COMPETITION[ligaId];
  if (!compId) return null;
  const data = await fdGet(`/competitions/${compId}/teams`);
  if (!data?.teams) return null;

  return data.teams.map(t => ({
    fd_id:     t.id,
    name:      t.name,
    shortName: t.shortName || t.tla,
    crest:     t.crest,
    founded:   t.founded,
    venue:     t.venue
  }));
}

/* ─────────────────────────────────────────
   Info de un equipo específico
───────────────────────────────────────── */
async function getFDTeam(fdTeamId) {
  const data = await fdGet(`/teams/${fdTeamId}`);
  if (!data) return null;
  return {
    fd_id:     data.id,
    name:      data.name,
    shortName: data.shortName || data.tla,
    crest:     data.crest,
    venue:     data.venue,
    founded:   data.founded
  };
}

/* ─────────────────────────────────────────
   Cache DB para forma reciente (TTL 6 horas)
   Evita llamadas repetidas a FD por el mismo equipo
───────────────────────────────────────── */
const pool = require('./db');
const FORM_CACHE_TTL_HOURS = 6;

async function _getFormFromCache(fdTeamId, venue = 'all') {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM recent_form_cache WHERE fd_team_id = ? AND venue = ?',
      [fdTeamId, venue]
    );
    if (!rows.length) return null;
    const row = rows[0];
    const ageHours = (Date.now() - new Date(row.updated_at).getTime()) / 3600000;
    if (ageHours > FORM_CACHE_TTL_HOURS) {
      console.log(`[Recent Form] Cache expired fd_id=${fdTeamId} venue=${venue} (${ageHours.toFixed(1)}h > ${FORM_CACHE_TTL_HOURS}h)`);
      return null;
    }
    console.log(`[Recent Form] Loaded from cache fd_id=${fdTeamId} venue=${venue} (${ageHours.toFixed(1)}h old) form=${row.form_str}`);
    return {
      matches:         row.matches,
      wins:            row.wins,
      draws:           row.draws,
      losses:          row.losses,
      goalsFor:        row.goals_for,
      goalsAgainst:    row.goals_against,
      avgGoalsFor:     parseFloat(row.avg_gf),
      avgGoalsAgainst: parseFloat(row.avg_ga),
      form:            row.form_str ? row.form_str.split('-') : [],
      winRate:         parseFloat(row.win_rate),
      drawRate:        parseFloat(row.draw_rate),
      lossRate:        parseFloat(row.loss_rate),
      source:          'db_cache',
      venue,
    };
  } catch (e) {
    console.warn(`[Recent Form] Cache read error fd_id=${fdTeamId}: ${e.message}`);
    return null;
  }
}

async function _saveFormToCache(fdTeamId, venue, data) {
  try {
    await pool.query(`
      INSERT INTO recent_form_cache
        (fd_team_id, venue, matches, wins, draws, losses, goals_for, goals_against,
         avg_gf, avg_ga, form_str, win_rate, draw_rate, loss_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        matches=VALUES(matches), wins=VALUES(wins), draws=VALUES(draws),
        losses=VALUES(losses), goals_for=VALUES(goals_for),
        goals_against=VALUES(goals_against), avg_gf=VALUES(avg_gf),
        avg_ga=VALUES(avg_ga), form_str=VALUES(form_str),
        win_rate=VALUES(win_rate), draw_rate=VALUES(draw_rate),
        loss_rate=VALUES(loss_rate), updated_at=CURRENT_TIMESTAMP
    `, [
      fdTeamId, venue, data.matches, data.wins, data.draws, data.losses,
      data.goalsFor, data.goalsAgainst, data.avgGoalsFor, data.avgGoalsAgainst,
      data.form.join('-'), data.winRate, data.drawRate, data.lossRate
    ]);
    console.log(`[Recent Form] Cache updated fd_id=${fdTeamId} venue=${venue} form=${data.form.join('-')}`);
  } catch (e) {
    console.warn(`[Recent Form] Cache write error fd_id=${fdTeamId}: ${e.message}`);
  }
}

/* ─────────────────────────────────────────
   Últimos N partidos de un equipo (FINISHED)
   Prioridad: 1. Cache DB (6h TTL)  2. FD API
───────────────────────────────────────── */
async function getTeamRecentForm(fdTeamId, limit = 5) {
  if (!fdTeamId) return null;

  // 1. Cache DB primero
  const cached = await _getFormFromCache(fdTeamId, 'all');
  if (cached) return cached;

  // 2. API fallback
  console.log(`[Recent Form] API fallback used fd_id=${fdTeamId} venue=all`);
  const path = `/teams/${fdTeamId}/matches?status=FINISHED&limit=${limit}`;
  const data = await fdGet(path);

  if (!data?.matches || data.matches.length === 0) {
    console.warn(`[Recent Form] No matches found fd_id=${fdTeamId}`);
    return null;
  }

  const matches = [...data.matches]
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, limit);

  let wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0;
  const formArray = [];

  for (const m of matches) {
    const isHome = m.homeTeam.id === fdTeamId;
    const scored   = isHome ? (m.score?.fullTime?.home ?? 0) : (m.score?.fullTime?.away ?? 0);
    const conceded = isHome ? (m.score?.fullTime?.away ?? 0) : (m.score?.fullTime?.home ?? 0);

    goalsFor     += scored;
    goalsAgainst += conceded;

    if (scored > conceded)        { wins++;   formArray.push('W'); }
    else if (scored === conceded)  { draws++;  formArray.push('D'); }
    else                           { losses++; formArray.push('L'); }
  }

  const n = matches.length;
  const result = {
    matches: n, wins, draws, losses, goalsFor, goalsAgainst,
    avgGoalsFor:     +(goalsFor     / n).toFixed(2),
    avgGoalsAgainst: +(goalsAgainst / n).toFixed(2),
    form:            formArray,
    winRate:         +(wins   / n).toFixed(2),
    drawRate:        +(draws  / n).toFixed(2),
    lossRate:        +(losses / n).toFixed(2),
    source:          'football-data.org',
  };

  // 3. Guardar en cache DB
  await _saveFormToCache(fdTeamId, 'all', result);

  return result;
}

/* ─────────────────────────────────────────
   Forma reciente por condición (casa o fuera)
   Filtra los últimos N partidos del equipo jugando como local o visitante.
   venue: 'home' | 'away'
───────────────────────────────────────── */
async function getTeamFormByVenue(fdTeamId, venue = 'home', limit = 5) {
  if (!fdTeamId) return null;

  // 1. Cache DB primero
  const cached = await _getFormFromCache(fdTeamId, venue);
  if (cached) return cached;

  // 2. API fallback — traer más partidos para filtrar por venue
  console.log(`[Recent Form] API fallback used fd_id=${fdTeamId} venue=${venue}`);
  const path = `/teams/${fdTeamId}/matches?status=FINISHED&limit=20`;
  const data = await fdGet(path);

  if (!data?.matches || data.matches.length === 0) {
    console.warn(`[Recent Form] No matches found fd_id=${fdTeamId} venue=${venue}`);
    return null;
  }

  const filtered = [...data.matches]
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .filter(m => venue === 'home' ? m.homeTeam.id === fdTeamId : m.awayTeam.id === fdTeamId)
    .slice(0, limit);

  if (filtered.length < 2) {
    console.warn(`[Recent Form] Insufficient ${venue} matches fd_id=${fdTeamId} (${filtered.length})`);
    return null;
  }

  let wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0;
  const formArray = [];

  for (const m of filtered) {
    const scored   = venue === 'home' ? (m.score?.fullTime?.home ?? 0) : (m.score?.fullTime?.away ?? 0);
    const conceded = venue === 'home' ? (m.score?.fullTime?.away ?? 0) : (m.score?.fullTime?.home ?? 0);

    goalsFor     += scored;
    goalsAgainst += conceded;

    if (scored > conceded)        { wins++;   formArray.push('W'); }
    else if (scored === conceded)  { draws++;  formArray.push('D'); }
    else                           { losses++; formArray.push('L'); }
  }

  const n = filtered.length;
  const result = {
    venue, matches: n, wins, draws, losses, goalsFor, goalsAgainst,
    avgGoalsFor:     +(goalsFor     / n).toFixed(2),
    avgGoalsAgainst: +(goalsAgainst / n).toFixed(2),
    form:            formArray,
    winRate:         +(wins   / n).toFixed(2),
    drawRate:        +(draws  / n).toFixed(2),
    lossRate:        +(losses / n).toFixed(2),
    source:          'football-data.org',
  };

  // 3. Guardar en cache DB
  await _saveFormToCache(fdTeamId, venue, result);

  return result;
}

module.exports = {
  getFDStandings,
  getFDFixtures,
  getFDTeams,
  getFDTeam,
  getTeamRecentForm,
  getTeamFormByVenue,
  FD_COMPETITION
};

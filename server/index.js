/**
 * StatPlay Football — server/index.js
 * Arquitectura híbrida: Football-Data.org + API-Football
 */

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const pool      = require('./db');
const fetch     = require('node-fetch');
const { initCron }                                          = require('./cron');
const { syncAllData, syncLeagueLogo, getH2H }               = require('./sync');
const { analyze, savePrediction, advancedMetrics, calculatePower } = require('./predictor');
const { getLogo: getLogoFromMap, getEmoji: getEmojiFromMap } = require('./teamLogoMap');
const { getFDFixtures }                                     = require('./footballdata');
const { fdToApif }                                          = require('./teammap');
const Logger                                                = require('./logger');
require('dotenv').config();

/* ── Middleware: autenticación de endpoints admin ── */
function adminAuth(req, res, next) {
  const key = process.env.ADMIN_KEY;
  // Si no hay ADMIN_KEY configurada, solo permitir en desarrollo
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'ADMIN_KEY no configurada en producción' });
    }
    return next(); // dev sin key → permitir
  }
  if (req.headers['x-admin-key'] !== key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/* ── Helper: validar que un parámetro sea entero positivo ── */
function parseId(val) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const app  = express();

// CORS: soporta múltiples orígenes separados por coma en ALLOWED_ORIGINS.
// También acepta *.vercel.app en staging para preview deployments.
// En desarrollo acepta cualquier origen.
const _allowedOrigins = (() => {
  const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:8080,http://127.0.0.1:8080';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
})();

const corsOptions = {
  origin: (origin, callback) => {
    // Sin origen (Postman, curl, server-to-server) → permitir siempre
    if (!origin) return callback(null, true);
    // Dev: permitir todo
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // Producción: verificar contra lista de orígenes permitidos
    if (_allowedOrigins.includes(origin)) return callback(null, true);
    // Staging: permitir preview deployments de Vercel (*.vercel.app y *.vercel.dev)
    if (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.dev')) return callback(null, true);
    
    console.error(`[CORS REJECTED]: ${origin}. Si este es tu dominio, añádelo a ALLOWED_ORIGINS.`);
    callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Ruta de bienvenida (Root) — Evita el mensaje "Cannot GET /" en Railway
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>StatPlay Football — API</h1>
      <p style="color: #666;">El servidor backend está funcionando correctamente.</p>
      <hr style="max-width: 400px; margin: 20px auto; border: 0; border-top: 1px solid #eee;">
      <p>Accede a la aplicación principal a través de tu dominio de <strong>Vercel</strong>.</p>
      <code style="background: #f4f4f4; padding: 5px 10px; border-radius: 4px;">Status: ONLINE</code>
    </div>
  `);
});

/* ── Rate limiting — protege contra abuso y agotamiento de APIs externas ── */
// General: 120 req/min por IP para todos los endpoints
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo en un minuto.' },
  skip: () => process.env.NODE_ENV !== 'production', // solo activo en producción
});

app.use(generalLimiter);

// Rate Limits específicos
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  message: { success: false, message: 'Demasiados intentos, espera 15 minutos.' } 
});
const predictLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 10, message: { error: 'Límite de predicciones alcanzado.' } });
const upcomingLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 20, message: { error: 'Límite excedido.' } });

app.use('/api/predict', predictLimiter);
app.use('/api/upcoming', upcomingLimiter);
app.use('/api/sync', authLimiter); // Sync requiere auth admin

const PORT = process.env.PORT || 3000;

/* ── Ligas válidas — whitelist para validar el parámetro ?liga= ── */
const VALID_LEAGUES = ['PL', 'BL', 'LL', 'SA'];

/* ── Health check (Railway lo usa para verificar que el servidor está vivo) ── */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

/* ── Logger de errores frontend ── */
app.post('/api/log', (req, res) => {
  console.error('[Frontend Error]:', req.body);
  res.sendStatus(200);
});

/* ══════════════════════════════════════════
   LIGAS
══════════════════════════════════════════ */
app.get('/api/leagues', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ligas');
    res.json(rows.map(l => ({
      ...l,
      name:        l.nombre,
      accentColor: l.accent_color,
      logoUrl:     l.logo_url || _fallbackLogo(l.id),
      sdbId:       l.sdb_id
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ══════════════════════════════════════════
   EQUIPOS
══════════════════════════════════════════ */

// Info de un equipo — DEBE ir ANTES de /teams/:ligaId
app.get('/api/teams/info/:teamId', async (req, res) => {
  const teamId = parseId(req.params.teamId);
  if (!teamId) return res.status(400).json({ error: 'teamId inválido' });
  try {
    const [rows] = await pool.query(`
      SELECT e.*, es.forma, es.h_win_rate, es.h_draw_rate,
             es.a_win_rate, es.a_draw_rate,
             es.h_gf, es.h_ga, es.a_gf, es.a_ga,
             es.avg_corners, es.h1_scoring_ratio
      FROM equipos e
      LEFT JOIN estadisticas es ON e.id = es.equipo_id
      WHERE e.id = ?`, [req.params.teamId]);

    if (!rows.length) return res.status(404).json({ error: 'Equipo no encontrado' });
    const t = rows[0];
    res.json({
      id: t.id, name: t.nombre, shortName: t.short_name,
      emoji: t.emoji, logoUrl: t.logo_url, pos: t.pos, points: t.puntos,
      fd_id: t.fd_id
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Equipos por liga
app.get('/api/teams/:ligaId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM equipos WHERE liga_id = ? AND pos IS NOT NULL ORDER BY COALESCE(pos, 99) ASC',
      [req.params.ligaId]
    );
    res.json(rows.map(t => ({
      id: t.id, name: t.nombre, shortName: t.short_name,
      emoji: t.emoji, logoUrl: t.logo_url, pos: t.pos, points: t.puntos
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ══════════════════════════════════════════
   STANDINGS — desde Football-Data.org en tiempo real
   Códigos FD: PL=PL, BL=BL1, LL=PD, SA=SA
══════════════════════════════════════════ */

// Mapa liga_id → código de competición en Football-Data.org
const FD_CODE = { PL: 'PL', BL: 'BL1', LL: 'PD', SA: 'SA' };

app.get('/api/standings/:ligaId', async (req, res) => {
  const { ligaId } = req.params;
  const fdCode = FD_CODE[ligaId];

  // 1. Intentar Football-Data.org (datos en tiempo real, temporada actual)
  if (fdCode && process.env.FOOTBALL_DATA_KEY) {
    try {
      const fdRes = await fetch(
        `https://api.football-data.org/v4/competitions/${fdCode}/standings`,
        { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY }, timeout: 8000 }
      );

      if (fdRes.ok) {
        const fdData = await fdRes.json();
        const total = fdData.standings?.find(s => s.type === 'TOTAL');

        if (total?.table?.length > 0) {
          // Una sola query para todos los equipos de la liga — evita N+1
          const fdIds = total.table.map(r => r.team.id);
          const [dbTeams] = await pool.query(
            `SELECT id, fd_id, logo_url, short_name, emoji FROM equipos WHERE fd_id IN (?) AND liga_id = ?`,
            [fdIds, ligaId]
          );
          const dbMap = {};
          for (const t of dbTeams) dbMap[t.fd_id] = t;

          const standings = total.table.map(row => {
            const db = dbMap[row.team.id];
            const resolvedLogo  = getLogoFromMap(row.team.name, db?.logo_url, row.team.crest);
            const resolvedEmoji = db?.emoji || getEmojiFromMap(row.team.name);
            return {
              position: row.position,
              team: {
                id:        db?.id || row.team.id,
                name:      row.team.name,
                shortName: row.team.shortName || row.team.tla || db?.short_name || row.team.name.substring(0,3).toUpperCase(),
                emoji:     resolvedEmoji,
                logoUrl:   resolvedLogo,
                crest:     row.team.crest
              },
              played: row.playedGames,
              won:    row.won,
              drawn:  row.draw,
              lost:   row.lost,
              gf:     row.goalsFor,
              ga:     row.goalsAgainst,
              gd:     row.goalDifference,
              points: row.points,
              form:   row.form ? row.form.split(',').map(f => f.trim()).filter(Boolean) : [],
              source: 'football-data.org'
            };
          });

          // Actualizar DB en background con los datos frescos
          setImmediate(async () => {
            try {
              for (const s of standings) {
                await pool.query(`
                  UPDATE equipos SET
                    pos=?, puntos=?, jugados=?, ganados=?, empatados=?, perdidos=?,
                    gf=?, ga=?, gd=?
                  WHERE fd_id=? AND liga_id=?
                `, [s.position, s.points, s.played, s.won, s.drawn, s.lost,
                    s.gf, s.ga, s.gd, total.table.find(r=>r.position===s.position)?.team.id, ligaId]);
              }
            } catch (e) { /* background update — ignorar errores */ }
          });

          return res.json(standings);
        }
      } else {
        // Loguear el motivo técnico si FD falla
        const errData = await fdRes.json().catch(() => ({}));
        console.warn(`[Standings FD] HTTP ${fdRes.status} para ${ligaId} (${fdCode}):`, errData.message || '');
      }
    } catch (e) {
      console.warn(`[Standings FD] Error para ${ligaId}:`, e.message);
    }
  }

  // 2. Fallback: DB local
  try {
    const [rows] = await pool.query(
      'SELECT * FROM equipos WHERE liga_id = ? AND pos IS NOT NULL AND puntos IS NOT NULL ORDER BY puntos DESC, gd DESC, gf DESC',
      [ligaId]
    );
    return res.json(rows.map((t, i) => ({
      position: i + 1,
      team: { id: t.id, name: t.nombre, shortName: t.short_name, emoji: t.emoji, logoUrl: t.logo_url },
      played: t.jugados, won: t.ganados, drawn: t.empatados, lost: t.perdidos,
      gf: t.gf, ga: t.ga, gd: t.gd, points: t.puntos,
      source: 'db'
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
/* ══════════════════════════════════════════
   ESTADÍSTICAS
══════════════════════════════════════════ */
app.get('/api/stats/:teamId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM estadisticas WHERE equipo_id = ?', [req.params.teamId]);
    if (!rows[0]) return res.status(404).json({ error: 'Estadísticas no encontradas' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ══════════════════════════════════════════
   UPCOMING FIXTURES — desde Football-Data.org en tiempo real
══════════════════════════════════════════ */
app.get('/api/upcoming/:ligaId', async (req, res) => {
  const { ligaId } = req.params;
  try {
    // 1. Intentar Football-Data.org (datos en tiempo real)
    const fdMatches = await getFDFixtures(ligaId);

    if (fdMatches && fdMatches.length > 0) {
      // Recopilar todos los fd_ids de una vez — evita N+1
      const allFdIds = [...new Set(
        fdMatches.flatMap(m => [m.homeTeam.fd_id, m.awayTeam.fd_id]).filter(Boolean)
      )];
      const [dbLogos] = allFdIds.length
        ? await pool.query('SELECT fd_id, logo_url FROM equipos WHERE fd_id IN (?)', [allFdIds])
        : [[]];
      const logoByFdId = {};
      for (const r of dbLogos) logoByFdId[r.fd_id] = r.logo_url;

      const enriched = fdMatches.map(m => {
        const homeApifId = fdToApif(m.homeTeam.fd_id);
        const awayApifId = fdToApif(m.awayTeam.fd_id);

        const homeLogo = getLogoFromMap(m.homeTeam.name, logoByFdId[m.homeTeam.fd_id] || m.homeTeam.crest, m.homeTeam.crest);
        const awayLogo = getLogoFromMap(m.awayTeam.name, logoByFdId[m.awayTeam.fd_id] || m.awayTeam.crest, m.awayTeam.crest);

        return {
          id:      m.fd_id,
          jornada: m.jornada,
          fecha:   m.fecha,
          hora:    m.hora || null,
          estado:  m.estado,
          fuente:  'football-data.org',
          homeTeam: { fd_id: m.homeTeam.fd_id, apif_id: homeApifId, name: m.homeTeam.name, shortName: m.homeTeam.shortName, logoUrl: homeLogo },
          awayTeam: { fd_id: m.awayTeam.fd_id, apif_id: awayApifId, name: m.awayTeam.name, shortName: m.awayTeam.shortName, logoUrl: awayLogo }
        };
      });

      return res.json({ ok: true, source: 'football-data.org', matches: enriched });
    }

    // 2. Fallback: tabla partidos de DB
    const [rows] = await pool.query(`
      SELECT p.*,
             h.nombre as homeName, h.short_name as homeShort, h.logo_url as homeLogo, h.emoji as homeEmoji,
             a.nombre as awayName, a.short_name as awayShort, a.logo_url as awayLogo, a.emoji as awayEmoji
      FROM partidos p
      JOIN equipos h ON p.home_team_id = h.id
      JOIN equipos a ON p.away_team_id = a.id
      WHERE p.liga_id = ? AND (p.estado = 'SCHEDULED' OR p.estado IS NULL)
      ORDER BY p.fecha ASC LIMIT 20
    `, [ligaId]);

    if (rows.length > 0) {
      return res.json({
        ok: true, source: 'db',
        matches: rows.map(m => ({
          id: m.id, jornada: m.jornada, fecha: m.fecha, hora: null, estado: m.estado,
          fuente: 'db',
          homeTeam: { name: m.homeName, shortName: m.homeShort, logoUrl: m.homeLogo, emoji: m.homeEmoji },
          awayTeam: { name: m.awayName, shortName: m.awayShort, logoUrl: m.awayLogo, emoji: m.awayEmoji }
        }))
      });
    }

    // 3. Sin datos — explicación técnica
    res.json({
      ok: false,
      source: 'none',
      matches: [],
      reason: 'Sin partidos programados disponibles. Football-Data.org devolvió lista vacía para esta liga — posiblemente entre temporadas o sin fixtures publicados aún.',
      technical: {
        fd_endpoint: `/v4/competitions/${FD_CODE[ligaId] || ligaId}/matches?status=SCHEDULED`,
        fd_status: 'empty_response',
        db_partidos: 0
      }
    });

  } catch (e) {
    console.error('[Upcoming]', e.message);
    res.status(500).json({ ok: false, error: e.message, matches: [] });
  }
});


/* ══════════════════════════════════════════
   FIXTURES (DB)
══════════════════════════════════════════ */
app.get('/api/fixtures/:ligaId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*,
             h.nombre as homeName, h.short_name as homeShort,
             h.logo_url as homeLogo, h.emoji as homeEmoji,
             a.nombre as awayName, a.short_name as awayShort,
             a.logo_url as awayLogo, a.emoji as awayEmoji
      FROM partidos p
      JOIN equipos h ON p.home_team_id = h.id
      JOIN equipos a ON p.away_team_id = a.id
      WHERE p.liga_id = ?
      ORDER BY p.fecha ASC
    `, [req.params.ligaId]);

    res.json(rows.map(m => ({
      id: m.id, jornada: m.jornada, fecha: m.fecha, estado: m.estado,
      homeTeam: { id: m.home_team_id, name: m.homeName, shortName: m.homeShort, logoUrl: m.homeLogo, emoji: m.homeEmoji },
      awayTeam: { id: m.away_team_id, name: m.awayName, shortName: m.awayShort, logoUrl: m.awayLogo, emoji: m.awayEmoji }
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ══════════════════════════════════════════
   ANÁLISIS / PREDICCIÓN HÍBRIDA
══════════════════════════════════════════ */

// Predicción guardada en DB
app.get('/api/analysis/:homeId/:awayId', async (req, res) => {
  try {
    const { homeId, awayId } = req.params;
    const [preds] = await pool.query(
      'SELECT * FROM predicciones WHERE home_team_id = ? AND away_team_id = ? ORDER BY id DESC LIMIT 1',
      [homeId, awayId]
    );
    if (preds.length === 0) return res.status(404).json({ message: 'Predicción no encontrada' });

    const pred = preds[0];
    const [home, away] = await Promise.all([loadTeamData(homeId), loadTeamData(awayId)]);

    if (!home || !away) return res.json(pred); // fallback si no hay datos de equipo

    // Reconstruir objeto compatible con el resto de la app
    const goals = { 
      home: parseFloat(pred.xg_h1_local) + parseFloat(pred.xg_h2_local), 
      away: parseFloat(pred.xg_h1_visitante) + parseFloat(pred.xg_h2_visitante) 
    };

    res.json({
      ...pred,
      probs: { home: pred.prob_local, draw: pred.prob_empate, away: pred.prob_visitante },
      goals,
      advanced: calculatePower(home, away, goals, home.ligaId || 'PL'),
      homeTeam: home,
      awayTeam: away
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Generar predicción híbrida en tiempo real
app.get('/api/predict/:homeId/:awayId', async (req, res) => {
  const homeId = parseId(req.params.homeId);
  const awayId = parseId(req.params.awayId);
  if (!homeId || !awayId) return res.status(400).json({ error: 'IDs de equipo inválidos' });
  if (homeId === awayId)  return res.status(400).json({ error: 'Los equipos deben ser diferentes' });
  try {
    const ligaId = req.query.liga || 'PL';
    if (!VALID_LEAGUES.includes(ligaId)) {
      return res.status(400).json({ error: `Liga inválida: '${ligaId}'. Válidas: ${VALID_LEAGUES.join(', ')}` });
    }
    const lang = req.query.lang === 'en' ? 'en' : 'es';

    const result = await analyze(homeId, awayId, ligaId, lang);

    // Guardar en DB para reutilización
    await savePrediction(result);

    res.json({
      homeTeam: {
        id: result.homeTeam.id, name: result.homeTeam.name,
        shortName: result.homeTeam.shortName, logoUrl: result.homeTeam.logoUrl,
        emoji: result.homeTeam.emoji, form: result.homeTeam.form || [],
        pos: result.homeTeam.pos, points: result.homeTeam.points,
        recentForm:  result.homeTeam.recentForm  || null,
        venueForm:   result.homeTeam.venueForm   || null,
      },
      awayTeam: {
        id: result.awayTeam.id, name: result.awayTeam.name,
        shortName: result.awayTeam.shortName, logoUrl: result.awayTeam.logoUrl,
        emoji: result.awayTeam.emoji, form: result.awayTeam.form || [],
        pos: result.awayTeam.pos, points: result.awayTeam.points,
        recentForm:  result.awayTeam.recentForm  || null,
        venueForm:   result.awayTeam.venueForm   || null,
      },
      probs:         result.probs,
      goals:         result.goals,
      halfTime:      result.halfTime,
      over25:        result.over25,
      btts:          result.btts,
      corners:       result.corners,
      risk:          result.risk,
      confidence:    result.confidence,
      insight:       result.insight,
      h2h:           result.h2h,
      advanced:      result.advanced,
      fuentesUsadas: result.fuentesUsadas,
    });
  } catch (e) {
    console.error('[Predict]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ══════════════════════════════════════════
   MÉTRICAS AVANZADAS — Over/Under, BTTS, Tarjetas
══════════════════════════════════════════ */
app.get('/api/advanced/:homeId/:awayId', async (req, res) => {
  const homeId = parseId(req.params.homeId);
  const awayId = parseId(req.params.awayId);
  if (!homeId || !awayId) return res.status(400).json({ error: 'IDs de equipo inválidos' });
  try {
    const ligaId  = req.query.liga || 'PL';
    if (!VALID_LEAGUES.includes(ligaId)) {
      return res.status(400).json({ error: `Liga inválida: '${ligaId}'. Válidas: ${VALID_LEAGUES.join(', ')}` });
    }
    const xGTotal = parseFloat(req.query.xg) || 2.5;
    const btts    = parseInt(req.query.btts, 10) || 55;

    const result = await advancedMetrics(homeId, awayId, ligaId, xGTotal, btts);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ══════════════════════════════════════════
   H2H
══════════════════════════════════════════ */
app.get('/api/h2h/:team1/:team2', async (req, res) => {
  const team1 = parseId(req.params.team1);
  const team2 = parseId(req.params.team2);
  if (!team1 || !team2) return res.status(400).json({ error: 'IDs de equipo inválidos' });
  try {
    const result = await getH2H(team1, team2);
    if (!result) return res.status(404).json({ message: 'Sin datos H2H' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ══════════════════════════════════════════
   ADMIN / SYNC
══════════════════════════════════════════ */
app.get('/api/admin/sync', adminAuth, async (req, res) => {
  try {
    const result = await syncAllData();
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/sync-logos', adminAuth, async (req, res) => {
  try {
    const [leagues] = await pool.query('SELECT * FROM ligas');
    for (const l of leagues) await syncLeagueLogo(l.id, l.api_id);
    const [updated] = await pool.query('SELECT * FROM ligas');
    res.json({ success: true, leagues: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/status', adminAuth, async (req, res) => {
  try {
    const [[{ equipos }]] = await pool.query('SELECT COUNT(*) as equipos FROM equipos');
    const [[{ stats }]]   = await pool.query('SELECT COUNT(*) as stats FROM estadisticas');
    const [[{ partidos }]] = await pool.query('SELECT COUNT(*) as partidos FROM partidos');
    const [[{ preds }]]   = await pool.query('SELECT COUNT(*) as preds FROM predicciones');
    const [[{ h2h }]]     = await pool.query('SELECT COUNT(*) as h2h FROM h2h_cache');
    const [ligas]         = await pool.query('SELECT id, nombre, logo_url FROM ligas');

    res.json({
      db: { equipos, stats, partidos, predicciones: preds, h2h_cache: h2h },
      ligas: ligas.map(l => ({ id: l.id, nombre: l.nombre, logo: !!l.logo_url })),
      apis: {
        footballData: !!process.env.FOOTBALL_DATA_KEY,
        apiFootball:  !!process.env.FOOTBALL_API_KEY
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Helper: logos fallback ── */
function _fallbackLogo(ligaId) {
  return {
    PL: 'https://media.api-sports.io/football/leagues/39.png',
    BL: 'https://media.api-sports.io/football/leagues/78.png',
    LL: 'https://media.api-sports.io/football/leagues/140.png',
    SA: 'https://media.api-sports.io/football/leagues/135.png',
  }[ligaId] || null;
}

/* ══════════════════════════════════════════
   AUTH — Sistema de acceso simple
   No modifica ningún endpoint existente.
══════════════════════════════════════════ */

// Crear tabla users al arrancar si no existe (evita error en primer uso)
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        email        VARCHAR(255) UNIQUE,
        is_premium   BOOLEAN DEFAULT false,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      )
    `);
    console.log('[Auth] Tabla users lista.');
  } catch (e) {
    console.error('[Auth] No se pudo crear tabla users:', e.message);
  }
})();

// authLimiter ya definido al inicio

/**
 * POST /api/auth/login
 * Input:  { email: string }
 * Output: { success, user: { id, email, is_premium, isNew }, sessionToken }
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    // Validar body
    const rawEmail = req.body?.email;
    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
      return res.status(400).json({ success: false, message: 'Email requerido.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'El correo no tiene un formato válido.' });
    }

    // Generar session token criptográfico
    const sessionToken = require('crypto').randomBytes(32).toString('hex');

    // Buscar usuario existente
    const [existing] = await pool.query(
      'SELECT id, email, is_premium, created_at FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existing.length > 0) {
      const u = existing[0];
      // Actualizar el session_token con el nuevo (invalida sesiones anteriores)
      await pool.query('UPDATE users SET session_token = ? WHERE id = ?', [sessionToken, u.id]);
      return res.json({
        success: true,
        sessionToken,
        user: { id: u.id, email: u.email, is_premium: !!u.is_premium, isNew: false },
      });
    }

    // Usuario nuevo → crear con session_token
    const [result] = await pool.query(
      'INSERT INTO users (email, is_premium, session_token) VALUES (?, false, ?)',
      [cleanEmail, sessionToken]
    );
    return res.status(201).json({
      success: true,
      sessionToken,
      user: { id: result.insertId, email: cleanEmail, is_premium: false, isNew: true },
    });

  } catch (e) {
    console.error('[Auth] login error:', e.message);
    res.status(500).json({ success: false, message: 'Error interno. Intenta de nuevo.' });
  }
});

/**
 * POST /api/auth/guest
 * Output: { success, user: { id, email: null, is_premium: false, isGuest: true } }
 */
app.post('/api/auth/guest', authLimiter, (req, res) => {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.json({
    success: true,
    user: { id: guestId, email: null, is_premium: false, isGuest: true },
  });
});

/**
 * GET /api/auth/me?email=xxx  o  GET /api/auth/me?id=xxx
 */
app.get('/api/auth/me', authLimiter, async (req, res) => {
  try {
    const { email, id } = req.query;
    if (!email && !id) {
      return res.status(400).json({ success: false, message: 'email o id requerido' });
    }

    let rows;
    if (email) {
      [rows] = await pool.query(
        'SELECT id, email, is_premium, created_at FROM users WHERE email = ?',
        [email.trim().toLowerCase()]
      );
    } else {
      const numId = parseInt(id, 10);
      if (!numId) return res.status(400).json({ success: false, message: 'id inválido' });
      [rows] = await pool.query(
        'SELECT id, email, is_premium, created_at FROM users WHERE id = ?',
        [numId]
      );
    }

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (e) {
    console.error('[Auth] me error:', e.message);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

const server = app.listen(PORT, () => {
    Logger.info(`StatPlay Backend arrancado en puerto ${PORT}`, {
        node_env: process.env.NODE_ENV || 'development',
        port: PORT,
        allowed_origins: _allowedOrigins
    });
    initCron();
});


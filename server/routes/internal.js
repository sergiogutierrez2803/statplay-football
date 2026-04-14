const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/internal/leagues
 * Lista de ligas soportadas con métricas de cobertura y frescura.
 * Resiliente: Funciona aunque ss_league_summary esté vacío.
 */
router.get('/leagues', async (req, res) => {
  try {
    const supportedLigas = ['PL', 'BL', 'LL', 'SA'];
    
    // Query para obtener métricas agregadas por liga
    const [stats] = await pool.query(`
      SELECT 
        liga_id,
        COUNT(*) as total_teams_found,
        COUNT(equipo_id) as mapped_teams_count
      FROM ss_team_stats
      WHERE liga_id IN (?)
      GROUP BY liga_id
    `, [supportedLigas]);

    // Query para obtener el resumen (season, avg goals, etc.)
    const [summaries] = await pool.query(`
      SELECT liga_id, season, avg_goals_per_match, scraped_at
      FROM ss_league_summary
      WHERE liga_id IN (?)
    `, [supportedLigas]);

    const summaryMap = {};
    summaries.forEach(s => { summaryMap[s.liga_id] = s; });
    const statsMap = {};
    stats.forEach(s => { statsMap[s.liga_id] = s; });

    const data = supportedLigas.map(id => {
      const s = summaryMap[id] || {};
      const st = statsMap[id] || { total_teams_found: 0, mapped_teams_count: 0 };
      const coverage = st.total_teams_found > 0 
        ? ((st.mapped_teams_count / st.total_teams_found) * 100).toFixed(1) + '%'
        : '0%';

      return {
        liga_id: id,
        season: s.season || 'N/A',
        scraped_at: s.scraped_at || null,
        total_teams: st.total_teams_found,
        mapped_teams: st.mapped_teams_count,
        coverage: coverage,
        avg_goals: s.avg_goals_per_match || null
      };
    });

    res.json({ ok: true, source: 'soccerstats', count: data.length, data });
  } catch (error) {
    console.error('[InternalRoute] Error en /leagues:', error.message);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/internal/leagues/:leagueId/teams
 * Lista de equipos con sus stats para una liga específica.
 */
router.get('/leagues/:leagueId/teams', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT team_name_raw, equipo_id, over25_pct, btts_pct, avg_corners_total, scraped_at FROM ss_team_stats WHERE liga_id = ? ORDER BY team_name_raw ASC',
      [leagueId.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.json({ ok: false, reason: 'no_data', message: `No hay datos de equipos para la liga ${leagueId}` });
    }

    res.json({ ok: true, ligaId: leagueId.toUpperCase(), count: rows.length, data: rows });
  } catch (error) {
    console.error(`[InternalRoute] Error en /leagues/${leagueId}/teams:`, error.message);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/internal/teams/:teamId/stats
 * Stats completas de un equipo por su ID interno (equipo_id).
 */
router.get('/teams/:teamId/stats', async (req, res) => {
  const { teamId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ss_team_stats WHERE equipo_id = ? ORDER BY scraped_at DESC LIMIT 1',
      [teamId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, reason: 'team_not_found', message: `No se encontraron estadísticas para el equipo ID ${teamId}` });
    }

    res.json({ ok: true, source: 'soccerstats', data: rows[0] });
  } catch (error) {
    console.error(`[InternalRoute] Error en /teams/${teamId}/stats:`, error.message);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/internal/teams/:teamId/corners
 * Solo corners y metadatos mínimos para el predictor.
 */
router.get('/teams/:teamId/corners', async (req, res) => {
  const { teamId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT team_name_raw, avg_corners_home, avg_corners_away, avg_corners_total, scraped_at FROM ss_team_stats WHERE equipo_id = ? ORDER BY scraped_at DESC LIMIT 1',
      [teamId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, reason: 'team_not_found', message: `No se encontraron datos de corners para el equipo ID ${teamId}` });
    }

    res.json({ 
      ok: true, 
      source: 'soccerstats', 
      data: {
        teamName: rows[0].team_name_raw,
        avg_corners_total: rows[0].avg_corners_total,
        avg_corners_home: rows[0].avg_corners_home,
        avg_corners_away: rows[0].avg_corners_away,
        scraped_at: rows[0].scraped_at
      }
    });
  } catch (error) {
    console.error(`[InternalRoute] Error en /teams/${teamId}/corners:`, error.message);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

module.exports = router;

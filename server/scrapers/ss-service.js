const pool = require('../db');

/**
 * Obtiene el contexto de SoccerStats para un par de equipos.
 * @param {Object} params - { homeId, awayId, leagueId }
 * @returns {Promise<Object>} Contexto evaluado
 */
async function getSoccerStatsContext({ homeId, awayId, leagueId }) {
  const result = {
    usable: false,
    reason: 'initializing',
    freshnessDays: null,
    leagueSupported: ['PL', 'BL', 'LL', 'SA'].includes(leagueId),
    home: null,
    away: null
  };

  if (!result.leagueSupported) {
    result.reason = 'league_not_supported';
    return result;
  }

  try {
    const [rows] = await pool.query(
      'SELECT equipo_id, team_name_raw, avg_corners_total, btts_pct, over25_pct, scraped_at ' +
      'FROM ss_team_stats WHERE equipo_id IN (?, ?)',
      [homeId, awayId]
    );

    if (rows.length === 0) {
      result.reason = 'no_data_found';
      return result;
    }

    const homeData = rows.find(r => r.equipo_id === homeId);
    const awayData = rows.find(r => r.equipo_id === awayId);

    if (!homeData || !awayData) {
      result.reason = !homeData ? 'home_team_missing' : 'away_team_missing';
      return result;
    }

    // Calcular frescura (basada en el dato más viejo de los dos)
    const now = new Date();
    const homeAge = (now - new Date(homeData.scraped_at)) / (1000 * 60 * 60 * 24);
    const awayAge = (now - new Date(awayData.scraped_at)) / (1000 * 60 * 60 * 24);
    const maxAge = Math.max(homeAge, awayAge);

    result.freshnessDays = parseFloat(maxAge.toFixed(1));
    result.home = homeData;
    result.away = awayData;

    // Validación final: MAX_AGE 10 días
    if (maxAge > 10) {
      result.usable = false;
      result.reason = 'stale_data';
    } else {
      result.usable = true;
      result.reason = 'ok';
    }

    return result;

  } catch (error) {
    console.error('[SS-Service] Error:', error.message);
    return { ...result, usable: false, reason: 'internal_error' };
  }
}

module.exports = { getSoccerStatsContext };

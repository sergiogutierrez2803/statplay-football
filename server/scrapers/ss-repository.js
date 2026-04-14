const pool = require('../db');

/**
 * Inserta o actualiza estadísticas del equipo para una liga y temporada especificadas.
 */
async function upsertTeamStats(ligaId, teamData) {
  const {
    equipo_id,
    team_name_raw,
    season = '2024/25',
    avg_corners_home = null,
    avg_corners_away = null,
    avg_corners_total = null,
    btts_pct = null,
    over15_pct = null,
    over25_pct = null,
    over35_pct = null,
    avg_goals_scored = null,
    avg_goals_conceded = null,
    form_last5 = null,
    form_last10 = null,
    source_url = null
  } = teamData;

  const query = `
    INSERT INTO ss_team_stats (
      equipo_id, liga_id, team_name_raw, season,
      avg_corners_home, avg_corners_away, avg_corners_total,
      btts_pct, over15_pct, over25_pct, over35_pct,
      avg_goals_scored, avg_goals_conceded,
      form_last5, form_last10, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      equipo_id = VALUES(equipo_id),
      avg_corners_home = VALUES(avg_corners_home),
      avg_corners_away = VALUES(avg_corners_away),
      avg_corners_total = VALUES(avg_corners_total),
      btts_pct = VALUES(btts_pct),
      over15_pct = VALUES(over15_pct),
      over25_pct = VALUES(over25_pct),
      over35_pct = VALUES(over35_pct),
      avg_goals_scored = VALUES(avg_goals_scored),
      avg_goals_conceded = VALUES(avg_goals_conceded),
      form_last5 = VALUES(form_last5),
      form_last10 = VALUES(form_last10),
      source_url = VALUES(source_url),
      scraped_at = CURRENT_TIMESTAMP
  `;

  await pool.query(query, [
    equipo_id, ligaId, team_name_raw, season,
    avg_corners_home, avg_corners_away, avg_corners_total,
    btts_pct, over15_pct, over25_pct, over35_pct,
    avg_goals_scored, avg_goals_conceded,
    form_last5, form_last10, source_url
  ]);
}

/**
 * Inserta o actualiza un resumen general de la liga.
 */
async function upsertLeagueSummary(ligaId, summaryData) {
  const {
    season = '2024/25',
    avg_goals_per_match = null,
    btts_pct_league = null,
    over25_pct_league = null,
    avg_corners_per_match = null,
    avg_cards_per_match = null,
    total_matches_scraped = 0,
    source_url = null
  } = summaryData;

  const query = `
    INSERT INTO ss_league_summary (
      liga_id, season, avg_goals_per_match, btts_pct_league,
      over25_pct_league, avg_corners_per_match, avg_cards_per_match,
      total_matches_scraped, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      avg_goals_per_match = VALUES(avg_goals_per_match),
      btts_pct_league = VALUES(btts_pct_league),
      over25_pct_league = VALUES(over25_pct_league),
      avg_corners_per_match = VALUES(avg_corners_per_match),
      avg_cards_per_match = VALUES(avg_cards_per_match),
      total_matches_scraped = VALUES(total_matches_scraped),
      source_url = VALUES(source_url),
      scraped_at = CURRENT_TIMESTAMP
  `;

  await pool.query(query, [
    ligaId, season, avg_goals_per_match, btts_pct_league,
    over25_pct_league, avg_corners_per_match, avg_cards_per_match,
    total_matches_scraped, source_url
  ]);
}

module.exports = {
  upsertTeamStats,
  upsertLeagueSummary
};

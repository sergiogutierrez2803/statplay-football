const { matchByName } = require('../teammap');
const pool = require('../db');

/**
 * Intenta resolver un equipo extraído de SoccerStats (ssName) 
 * hacia el apif_id canónico del sistema.
 * 
 * @param {string} ssName Nombre crudo de SoccerStats
 * @param {string} ligaId 'PL', 'LL', 'BL', 'SA'
 * @param {Array} dbTeams [{id: apif_id, nombre: '...'}, ...] extraídos de DB
 * @returns {number|null} El apif_id o null si no hay match
 */
async function resolveTeamId(ssName, ligaId, dbTeams) {
  // 1. Buscar en la tabla de mapeo ss_team_name_map
  const [rows] = await pool.query(
    'SELECT equipo_id FROM ss_team_name_map WHERE ss_name = ? AND liga_id = ?',
    [ssName, ligaId]
  );

  if (rows && rows.length > 0) {
    return rows[0].equipo_id;
  }

  // 2. Fallback al fuzzy match global
  const matchedId = matchByName(ssName, dbTeams);

  if (matchedId) {
    // Registrar autodiscovery con confianza 'fuzzy'
    try {
      await pool.query(
        `INSERT IGNORE INTO ss_team_name_map 
         (ss_name, equipo_id, liga_id, confidence) 
         VALUES (?, ?, ?, 'fuzzy')`,
        [ssName, matchedId, ligaId]
      );
    } catch (e) {
      console.warn(`[Normalizer] Fallo al insertar mapeo fuzzy: ${e.message}`);
    }
    return matchedId;
  }

  return null; // El equipo no pudo ser mapeado. Los datos se guardan con equipo_id=NULL.
}

module.exports = { resolveTeamId };

/**
 * StatPlay — cleanup.js
 * Limpieza de datos obsoletos para evitar crecimiento indefinido de tablas.
 *
 * Uso manual: node cleanup.js
 * Uso automático: llamado desde cron.js cada domingo a las 4:00 AM
 */

const pool = require('./db');
const { cleanExpiredApifCache } = require('./sync');

/**
 * Elimina predicciones con más de 30 días de antigüedad.
 * Mantiene siempre las últimas 500 predicciones como mínimo.
 */
async function cleanOldPredictions(daysOld = 30) {
  try {
    const [result] = await pool.query(`
      DELETE FROM predicciones
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND id NOT IN (
          SELECT id FROM (
            SELECT id FROM predicciones ORDER BY id DESC LIMIT 500
          ) AS keep
        )
    `, [daysOld]);
    console.log(`[Cleanup] Predicciones eliminadas: ${result.affectedRows} (>${daysOld} días)`);
    return result.affectedRows;
  } catch (e) {
    console.error('[Cleanup] Error limpiando predicciones:', e.message);
    return 0;
  }
}

/**
 * Elimina entradas de recent_form_cache con más de 24 horas
 * (el TTL activo es 6h, pero las expiradas se acumulan sin borrar).
 */
async function cleanExpiredFormCache(hoursOld = 24) {
  try {
    const [result] = await pool.query(`
      DELETE FROM recent_form_cache
      WHERE updated_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
    `, [hoursOld]);
    console.log(`[Cleanup] Form cache expirado eliminado: ${result.affectedRows} entradas`);
    return result.affectedRows;
  } catch (e) {
    console.error('[Cleanup] Error limpiando form cache:', e.message);
    return 0;
  }
}

/**
 * Punto de entrada — ejecuta todas las limpiezas
 */
async function runCleanup() {
  console.log(`\n[Cleanup] Iniciando limpieza — ${new Date().toISOString()}`);
  const pred = await cleanOldPredictions(30);
  const form = await cleanExpiredFormCache(24);
  const apif = cleanExpiredApifCache(); // Limpieza en memoria
  console.log(`[Cleanup] Completado — predicciones: ${pred} | form cache: ${form} | apif cache: ${apif}\n`);
  return { predictions: pred, formCache: form, apifCache: apif };
}

// Si se ejecuta directamente: node cleanup.js
if (require.main === module) {
  runCleanup().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runCleanup, cleanOldPredictions, cleanExpiredFormCache };

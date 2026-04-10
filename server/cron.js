/**
 * StatPlay — cron.js
 * Tareas programadas del servidor.
 */

const cron = require('node-cron');
const pool = require('./db');
const { syncAllData }  = require('./sync');
const { runCleanup }   = require('./cleanup');
const { runBackup }    = require('./backup');

/* ─────────────────────────────────────────
   Health check interno — verifica DB y estado de caches
───────────────────────────────────────── */
async function runHealthCheck() {
  const ts = new Date().toISOString();
  try {
    // Ping a MySQL
    await pool.query('SELECT 1');

    // Estado de caches
    const [[{ h2h }]]  = await pool.query('SELECT COUNT(*) as h2h FROM h2h_cache');
    const [[{ form }]] = await pool.query('SELECT COUNT(*) as form FROM recent_form_cache');

    // Entradas de forma reciente con menos de 6h (activas)
    const [[{ formActive }]] = await pool.query(`
      SELECT COUNT(*) as formActive FROM recent_form_cache
      WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 6 HOUR)
    `);

    // Última predicción generada
    const [[lastPred]] = await pool.query(
      'SELECT created_at FROM predicciones ORDER BY id DESC LIMIT 1'
    );

    console.log(`[Health] ${ts} | DB: OK | h2h_cache: ${h2h} | form_cache: ${form} (${formActive} activas) | última predicción: ${lastPred?.created_at || 'ninguna'}`);
  } catch (e) {
    console.error(`[Health] ${ts} | ERROR: ${e.message}`);
  }
}

/* ─────────────────────────────────────────
   Inicializar tareas programadas
───────────────────────────────────────── */
function initCron() {
  console.log('[Cron] Configurando tareas programadas...');

  // Sync diario a las 3:00 AM — actualiza standings, fixtures y estadísticas
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Iniciando sync diario (03:00 AM)');
    await syncAllData();
  }, { timezone: 'America/Bogota' });

  // Limpieza semanal domingos a las 4:00 AM — borra predicciones y cache expirado
  cron.schedule('0 4 * * 0', async () => {
    console.log('[Cron] Iniciando limpieza semanal (domingo 04:00 AM)');
    await runCleanup();
  }, { timezone: 'America/Bogota' });

  // Health check cada 12 horas — verifica DB y estado de caches
  cron.schedule('0 */12 * * *', async () => {
    await runHealthCheck();
  }, { timezone: 'America/Bogota' });

  // Backup diario a las 5:00 AM — exporta la DB a SQL
  cron.schedule('0 5 * * *', async () => {
    console.log('[Cron] Iniciando backup diario (05:00 AM)');
    await runBackup();
  }, { timezone: 'America/Bogota' });

  // Health check al arrancar (después de 10s para dar tiempo a la DB)
  setTimeout(runHealthCheck, 10000);

  console.log('[Cron] Tareas: sync 03h | cleanup dom 04h | backup 05h | health check 12h');
}

module.exports = { initCron, runHealthCheck };

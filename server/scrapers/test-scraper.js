/**
 * Test SoccerStats Scraper
 * Uso: node server/scrapers/test-scraper.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const { runScraping } = require('./ss-orchestrator');
const pool = require('../db');

async function test() {
  console.log('--- TEST SOCCERSTATS SCRAPER (PL) ---');
  
  try {
    const results = await runScraping('PL');
    console.log('\n--- RESULTADOS FINALES ---');
    console.log(results);
    
    // Pequeña validación manual post-ejecución
    const [rows] = await pool.query(`
      SELECT team_name_raw, equipo_id, btts_pct, over25_pct, avg_corners_total 
      FROM ss_team_stats 
      WHERE liga_id = 'PL' 
      LIMIT 5
    `);
    
    console.log('\n--- MUESTRA DE LA DB (TOP 5) ---');
    console.table(rows);

  } catch (err) {
    console.error('Error en el test:', err.message);
  } finally {
    await pool.end();
  }
}

test();

require('dotenv').config();
const pool = require('../db');

async function run() {
  console.log('Iniciando mapeo manual...');
  try {
    const query = `
      INSERT INTO ss_team_name_map (ss_name, equipo_id, liga_id, confidence) 
      VALUES 
      ('Manchester Utd', 33, 'PL', 'manual'),
      ('West Ham Utd', 48, 'PL', 'manual'),
      ('Newcastle Utd', 34, 'PL', 'manual'),
      ('Nottm Forest', 65, 'PL', 'manual')
      ON DUPLICATE KEY UPDATE equipo_id = VALUES(equipo_id), confidence = VALUES(confidence)
    `;
    await pool.query(query);
    console.log('✅ Mapeos insertados con éxito.');
  } catch (err) {
    console.error('❌ Error en el mapeo:', err.message);
  } finally {
    await pool.end();
  }
}

run();

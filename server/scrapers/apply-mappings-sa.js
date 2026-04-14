require('dotenv').config();
const pool = require('../db');

async function run() {
  console.log('Iniciando mapeo manual SA...');
  try {
    const query = `
      INSERT INTO ss_team_name_map (ss_name, equipo_id, liga_id, confidence) 
      VALUES 
      ('Inter Milan', 505, 'SA', 'manual')
      ON DUPLICATE KEY UPDATE equipo_id = VALUES(equipo_id), confidence = VALUES(confidence)
    `;
    await pool.query(query);
    console.log('✅ Mapeo Inter Milan insertado con éxito.');
  } catch (err) {
    console.error('❌ Error en el mapeo SA:', err.message);
  } finally {
    await pool.end();
  }
}

run();

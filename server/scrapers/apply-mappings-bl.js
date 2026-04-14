require('dotenv').config();
const pool = require('../db');

async function run() {
  console.log('Iniciando mapeo manual BL...');
  try {
    const query = `
      INSERT INTO ss_team_name_map (ss_name, equipo_id, liga_id, confidence) 
      VALUES 
      ('Bayern Munich', 157, 'BL', 'manual'),
      ('E. Frankfurt', 169, 'BL', 'manual'),
      ('Sankt Pauli', 186, 'BL', 'manual')
      ON DUPLICATE KEY UPDATE equipo_id = VALUES(equipo_id), confidence = VALUES(confidence)
    `;
    await pool.query(query);
    console.log('✅ Mapeos BL insertados con éxito.');
  } catch (err) {
    console.error('❌ Error en el mapeo BL:', err.message);
  } finally {
    await pool.end();
  }
}

run();

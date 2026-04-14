require('dotenv').config();
const pool = require('../db');

async function run() {
  console.log('Iniciando mapeo manual LL...');
  try {
    const query = `
      INSERT INTO ss_team_name_map (ss_name, equipo_id, liga_id, confidence) 
      VALUES 
      ('Atletico Madrid', 530, 'LL', 'manual'),
      ('Athletic Bilbao', 531, 'LL', 'manual'),
      ('Celta Vigo', 538, 'LL', 'manual'),
      ('Alaves', 542, 'LL', 'manual')
      ON DUPLICATE KEY UPDATE equipo_id = VALUES(equipo_id), confidence = VALUES(confidence)
    `;
    await pool.query(query);
    console.log('✅ Mapeos LL insertados con éxito.');
  } catch (err) {
    console.error('❌ Error en el mapeo LL:', err.message);
  } finally {
    await pool.end();
  }
}

run();

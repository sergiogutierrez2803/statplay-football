const pool = require('./db');

async function mockStats() {
  try {
    const [teams] = await pool.query('SELECT id, nombre FROM equipos');
    for (const t of teams) {
      const w = 0.4 + Math.random() * 0.3;     // 40% to 70% win rate
      const d = 0.2 + Math.random() * 0.1;     // 20% to 30% draw rate
      const h_gf = 1.0 + Math.random() * 1.5;  // 1.0 to 2.5 goals for
      const h_ga = 0.5 + Math.random() * 1.0;  // 0.5 to 1.5 goals against

      // Form can be random WL draws
      const form = ['W','W','D','L','W'].sort(() => 0.5 - Math.random()).join('-');

      await pool.query(`
        INSERT INTO estadisticas (
          equipo_id, forma,
          h_win_rate, h_draw_rate, a_win_rate, a_draw_rate,
          h_gf, h_ga, a_gf, a_ga, 
          avg_corners, h1_scoring_ratio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          forma = VALUES(forma),
          h_win_rate = VALUES(h_win_rate)
      `, [
        t.id, form,
        w, d, w - 0.1, d,
        h_gf, h_ga, h_gf - 0.3, h_ga + 0.2,
        4.5 + Math.random() * 3, 0.45
      ]);
    }
    console.log(`✅ Estadísticas base generadas para ${teams.length} equipos.`);
    process.exit(0);
  } catch (e) {
    console.error('Error generando estadisticas:', e);
    process.exit(1);
  }
}

mockStats();

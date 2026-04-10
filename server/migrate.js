/**
 * StatPlay — migrate.js
 * Aplica migraciones incrementales a la DB existente.
 * Seguro de ejecutar múltiples veces.
 *
 * Uso: node migrate.js
 */

require('dotenv').config();
const pool = require('./db');

const migrations = [
  {
    name: 'add_recent_form_cache',
    sql: `
      CREATE TABLE IF NOT EXISTS recent_form_cache (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        fd_team_id      INT NOT NULL,
        venue           VARCHAR(10) NOT NULL DEFAULT 'all',
        matches         INT DEFAULT 0,
        wins            INT DEFAULT 0,
        draws           INT DEFAULT 0,
        losses          INT DEFAULT 0,
        goals_for       INT DEFAULT 0,
        goals_against   INT DEFAULT 0,
        avg_gf          DECIMAL(4,2) DEFAULT 0.00,
        avg_ga          DECIMAL(4,2) DEFAULT 0.00,
        form_str        VARCHAR(20),
        win_rate        DECIMAL(4,2) DEFAULT 0.00,
        draw_rate       DECIMAL(4,2) DEFAULT 0.00,
        loss_rate       DECIMAL(4,2) DEFAULT 0.00,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_form_cache (fd_team_id, venue)
      )
    `
  },
  {
    name: 'add_h2h_cache',
    sql: `
      CREATE TABLE IF NOT EXISTS h2h_cache (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        team1_id     INT NOT NULL,
        team2_id     INT NOT NULL,
        hw           INT DEFAULT 0,
        d            INT DEFAULT 0,
        aw           INT DEFAULT 0,
        avg_goals_h  DECIMAL(4,2),
        avg_goals_a  DECIMAL(4,2),
        partidos_analizados INT DEFAULT 0,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_h2h (team1_id, team2_id)
      )
    `
  },
  {
    // ADD COLUMN IF NOT EXISTS no existe en MySQL < 8 — usar INFORMATION_SCHEMA
    name: 'add_fd_fixture_id_to_partidos',
    run: async () => {
      const [cols] = await pool.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'partidos'
          AND COLUMN_NAME  = 'fd_fixture_id'
      `);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE partidos ADD COLUMN fd_fixture_id INT AFTER id`);
      }
    }
  },
  {
    name: 'add_index_predicciones_teams',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'predicciones'
          AND INDEX_NAME   = 'idx_pred_teams'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE predicciones ADD INDEX idx_pred_teams (home_team_id, away_team_id)`);
      }
    }
  },
  {
    name: 'add_index_recent_form_updated',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'recent_form_cache'
          AND INDEX_NAME   = 'idx_form_updated'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE recent_form_cache ADD INDEX idx_form_updated (updated_at)`);
      }
    }
  },
  {
    // equipos.fd_id — usado en joins de standings y upcoming (N+1 fix)
    name: 'add_index_equipos_fd_id',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'equipos'
          AND INDEX_NAME   = 'idx_equipos_fd_id'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE equipos ADD INDEX idx_equipos_fd_id (fd_id)`);
      }
    }
  },
  {
    // equipos.liga_id — usado en queries de equipos por liga
    name: 'add_index_equipos_liga',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'equipos'
          AND INDEX_NAME   = 'idx_equipos_liga'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE equipos ADD INDEX idx_equipos_liga (liga_id)`);
      }
    }
  },
  {
    // partidos.fecha — usado en upcoming matches ORDER BY fecha
    name: 'add_index_partidos_fecha',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'partidos'
          AND INDEX_NAME   = 'idx_partidos_fecha'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE partidos ADD INDEX idx_partidos_fecha (fecha)`);
      }
    }
  },
  {
    // partidos.(liga_id, estado) — usado en upcoming matches WHERE liga_id + estado
    name: 'add_index_partidos_liga_estado',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'partidos'
          AND INDEX_NAME   = 'idx_partidos_liga_estado'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE partidos ADD INDEX idx_partidos_liga_estado (liga_id, estado)`);
      }
    }
  },
  {
    // predicciones.created_at — usado en cleanup (DELETE WHERE created_at < ?)
    name: 'add_index_predicciones_created',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'predicciones'
          AND INDEX_NAME   = 'idx_pred_created'
      `);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE predicciones ADD INDEX idx_pred_created (created_at)`);
      }
    }
  },
  {
    // Tabla users — sistema de acceso simple + session_token para auth
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        email         VARCHAR(255) UNIQUE,
        is_premium    BOOLEAN DEFAULT false,
        session_token VARCHAR(64) NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_session (session_token)
      )
    `
  },
  {
    // Añadir session_token a tabla users existente (si ya existe sin la columna)
    name: 'add_session_token_to_users',
    run: async () => {
      const [cols] = await pool.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'users'
          AND COLUMN_NAME  = 'session_token'
      `);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN session_token VARCHAR(64) NULL`);
        await pool.query(`ALTER TABLE users ADD INDEX idx_users_session (session_token)`);
      }
    }
  },
  {
    // Índice compuesto para búsqueda de predicciones recientes por equipos
    name: 'add_index_predicciones_lookup',
    run: async () => {
      const [idx] = await pool.query(`
        SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'predicciones'
          AND INDEX_NAME   = 'idx_pred_lookup'
      `);
      if (idx.length === 0) {
        await pool.query(`
          ALTER TABLE predicciones 
          ADD INDEX idx_pred_lookup (home_team_id, away_team_id, created_at)
        `);
      }
    }
  }
];

async function runMigrations() {
  console.log('\n[Migrate] Iniciando migraciones...\n');
  
  // Validar conexión antes de empezar
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error(`[Migrate] ❌ Error de conexión inicial: ${err.message}`);
    console.error('Asegúrate de que las variables de entorno de la base de datos son correctas.');
    process.exit(1);
  }

  let ok = 0;
  for (const m of migrations) {
    try {
      if (typeof m.run === 'function') {
        await m.run();
      } else {
        await pool.query(m.sql);
      }
      console.log(`  ✅ ${m.name}`);
      ok++;
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log(`  ⏭️  ${m.name} — ya existe, omitido`);
        ok++;
      } else {
        console.error(`  ❌ ${m.name}: ${e.message}`);
      }
    }
  }
  console.log(`\n[Migrate] ${ok}/${migrations.length} migraciones aplicadas.\n`);
  await pool.end();
}

runMigrations().catch(e => {
  console.error('[Migrate] Error fatal:', e.message);
  process.exit(1);
});

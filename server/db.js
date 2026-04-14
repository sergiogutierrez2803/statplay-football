/**
 * StatPlay — db.js
 * Pool de conexiones MySQL con SSL condicional para Railway.
 *
 * SSL se activa cuando:
 *   NODE_ENV=production  O  DB_SSL=true
 *
 * En desarrollo local no se requiere SSL.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const useSSL =
  process.env.NODE_ENV === 'production' ||
  process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port:     process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  user:     process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASS,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',

  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// DEBUG REAL PARA AUDITORÍA
console.log('[DB-AUDIT] Configuración cargada:', {
  env_host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  env_user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  env_db:   process.env.MYSQLDATABASE || process.env.DB_NAME,
  env_port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  source:   process.env.MYSQLHOST ? 'RAILWAY' : (process.env.DB_HOST ? '.ENV' : 'DEFAULT')
});

module.exports = pool;
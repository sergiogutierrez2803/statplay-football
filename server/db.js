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
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',

  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// DEBUG REAL
console.log('[DB CONFIG]', {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_NAME,
});

module.exports = pool;

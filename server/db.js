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
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Resolución inteligente de identidad (Railway Underscore -> Railway Legacy -> StatPlay)
const resolverAuth = () => {
  const user = process.env.MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root';
  // Si el usuario es root, usamos prioritariamente la variable ROOT_PASSWORD de Railway
  const pass = (user === 'root')
    ? (process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASS || '')
    : (process.env.MYSQL_PASSWORD || process.env.MYSQL__PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASS || '');
  return { user, pass };
};

const auth = resolverAuth();

const dbConfig = {
  host:     process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port:     process.env.MYSQL_PORT || process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  user:     auth.user,
  password: auth.pass,
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
};

const useSSL = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' || !!process.env.MYSQLHOST || !!process.env.MYSQL_HOST;

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Log de configuración al arrancar (muestra los valores resueltos)
console.log(`[DB] Pool creado → ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} | SSL: ${useSSL ? 'ON' : 'OFF'}`);

module.exports = pool;

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
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const useSSL = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  // SSL para Railway — rejectUnauthorized:false porque Railway usa cert autofirmado
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Log de configuración al arrancar
console.log(`[DB] Pool creado → ${process.env.DB_HOST}/${process.env.DB_NAME} | SSL: ${useSSL ? 'ON' : 'OFF'}`);

module.exports = pool;

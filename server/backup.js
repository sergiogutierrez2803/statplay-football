/**
 * StatPlay — backup.js
 * Sistema de respaldo diario de la base de datos MySQL.
 * Genera un archivo .sql en el directorio /backups.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Logger = require('./logger');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, 'backups');

/**
 * Ejecuta el respaldo de la base de datos usando mysqldump.
 * Requiere que mysqldump esté disponible en el PATH del sistema.
 */
async function runBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = `statplay_backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  const host = process.env.MYSQLHOST;
  const user = process.env.MYSQLUSER;
  const pass = process.env.MYSQL_ROOT_PASSWORD;
  const db   = process.env.MYSQLDATABASE;

  if (!host || !user || !db) {
    Logger.error('[Backup] Faltan variables de entorno para el respaldo (MYSQLHOST, MYSQLUSER, MYSQLDATABASE)');
    return null;
  }

  // Construcción del comando mysqldump
  // --no-tablespaces para evitar errores de permisos en algunos hostings
  const cmd = `mysqldump -h ${host} -u ${user} -p${pass} --no-tablespaces ${db} > "${filePath}"`;

  Logger.info(`[Backup] Iniciando respaldo de ${db}...`);

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        Logger.error(`[Backup] Error ejecutando mysqldump: ${error.message}`);
        // Si falla mysqldump (ej. no instalado), intentamos borrar el archivo vacío creado
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return reject(error);
      }
      
      const stats = fs.statSync(filePath);
      Logger.info(`[Backup] Respaldo completado: ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
      
      // Limpieza: mantener solo los últimos 7 días
      cleanOldBackups();
      
      resolve(filePath);
    });
  });
}

/**
 * Mantiene el directorio limpio eliminando archivos de más de 7 días.
 */
function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const weekInMs = 7 * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > weekInMs) {
      fs.unlinkSync(filePath);
      Logger.info(`[Backup] Archivo antiguo eliminado: ${file}`);
    }
  });
}

// Permitir ejecución manual
if (require.main === module) {
  runBackup().catch(() => process.exit(1));
}

module.exports = { runBackup };

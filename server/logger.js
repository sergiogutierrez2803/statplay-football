/**
 * StatPlay — logger.js
 * Utilidad simple de logging estructurado para producción.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

const Logger = {
  _log: (level, msg, data = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: msg,
      ...data
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
      console.log(`${color}[${level}]\x1b[0m ${msg}`, Object.keys(data).length ? data : '');
    }
  },
  info: (msg, data) => Logger._log('INFO', msg, data),
  warn: (msg, data) => Logger._log('WARN', msg, data),
  error: (msg, data) => Logger._log('ERROR', msg, data),
  debug: (msg, data) => {
    if (process.env.NODE_ENV !== 'production') Logger._log('DEBUG', msg, data);
  }
};

module.exports = Logger;

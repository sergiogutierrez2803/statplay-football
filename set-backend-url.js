/**
 * set-backend-url.js
 * Actualiza la URL del backend en index.html para producción.
 *
 * Uso:
 *   node set-backend-url.js https://tu-api.railway.app/api
 *
 * O con variable de entorno:
 *   BACKEND_URL=https://tu-api.railway.app/api node set-backend-url.js
 */

const fs   = require('fs');
const path = require('path');

const url = process.argv[2] || process.env.BACKEND_URL;

if (!url) {
  console.error('❌ Uso: node set-backend-url.js <URL_BACKEND>');
  console.error('   Ejemplo: node set-backend-url.js https://statplay-api.railway.app/api');
  process.exit(1);
}

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Reemplazar la URL del backend
const updated = html.replace(
  /window\.__BACKEND_URL__\s*=\s*['"][^'"]*['"]/,
  `window.__BACKEND_URL__ = '${url}'`
);

if (updated === html) {
  console.error('❌ No se encontró window.__BACKEND_URL__ en index.html');
  process.exit(1);
}

fs.writeFileSync(htmlPath, updated, 'utf8');
console.log(`✅ Backend URL actualizada a: ${url}`);

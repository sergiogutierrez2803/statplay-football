/**
 * StatPlay — server/teamLogoMap.js
 * Versión Node.js del mapa centralizado de logos.
 * Importa el archivo del frontend y lo re-exporta para uso en el backend.
 */

// Reutilizar la misma lógica del frontend
const path = require('path');
const frontendMap = require(path.join(__dirname, '../js/teamLogoMap.js'));

module.exports = frontendMap;

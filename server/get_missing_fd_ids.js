/**
 * Script temporal para identificar fd_id faltantes.
 * Ejecución: node server/get_missing_fd_ids.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { getFDTeams } = require('./footballdata');

const TARGETS = ['Ipswich', 'Leicester', 'Southampton'];

async function run() {
  console.log("⚽ Consultando equipos oficiales guardados en Football-Data (Liga: PL)...");
  
  try {
    const urlBase = 'https://api.football-data.org/v4/competitions';
    const headers = { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY };

    // Buscamos en Premier League (2021) y Championship (2016) por si son recién ascendidos
    const [resPL, resELC] = await Promise.all([
      fetch(`${urlBase}/2021/teams`, { headers }).then(r => r.ok ? r.json() : {}),
      fetch(`${urlBase}/2016/teams`, { headers }).then(r => r.ok ? r.json() : {})
    ]);

    const plTeams = resPL.teams || [];
    const elcTeams = resELC.teams || [];
    const teams = [...plTeams, ...elcTeams];
    
    if (teams.length === 0) {
      console.error("❌ No se obtuvieron datos de la API. Verifica la KEY.");
      return;
    }
    
    // Filtrado agnóstico por nombre o shortName
    const found = teams.filter(t => 
      TARGETS.some(target => 
        (t.name && t.name.includes(target)) || 
        (t.shortName && t.shortName.includes(target))
      )
    );

    if (found.length === 0) {
      console.log("\n⚠️ Los equipos solicitados NO vinieron en el endpoint /teams de la PL o ELC.");
      console.log("Nota técnica: El plan free de FD puede estar retornando el array de la temporada pasada u otra, donde quizás estaban en Championship.");
    } else {
      console.log("\n✅ Equipos Encontrados:");
      found.forEach(t => {
        console.log(`- ${t.name} (Short: ${t.shortName}) -> fd_id: ${t.fd_id}`);
      });
      
      console.log("\n=== CÓMO ACTUALIZAR TU BASE DE DATOS ===");
      console.log("Abre tu gestor de Base de Datos (ej. Railway MySQL) y ejecuta:");
      found.forEach(t => {
        console.log(`UPDATE equipos SET fd_id = ${t.fd_id} WHERE nombre LIKE '%${t.name.split(' ')[0]}%';`);
      });
      console.log("=========================================\n");
    }

  } catch (err) {
    console.error("Error de conexión:", err.message);
  }
}

run();

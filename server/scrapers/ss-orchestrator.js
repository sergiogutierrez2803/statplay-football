const { scrapeLeague } = require('./soccerstats');
const { resolveTeamId } = require('./ss-normalizer');
const { upsertTeamStats, upsertLeagueSummary } = require('./ss-repository');
const pool = require('../db');

// Retardo helper (pausa entre peticiones)
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Orquestador principal de scraping.
 * @param {string|null} ligaId Liga específica a scrapear, o null para todas.
 */
async function runScraping(ligaId = null) {
  const logPrefix = `[SoccerStats Cycle]`;
  
  // 0. Verificar si el scraping está habilitado
  if (process.env.SOCCERSTATS_ENABLED !== 'true') {
    console.log(`${logPrefix} Scraping saltado (SOCCERSTATS_ENABLED=false).`);
    return { ok: true, skipped: true };
  }

  console.log(`${logPrefix} === INICIO DE CICLO === (target=${ligaId || 'ALL'})`);
  const startTime = Date.now();

  const results = {
    ligasProcessed: 0,
    teamsFound: 0,
    teamsWithMapping: 0,
    teamsWithoutMapping: 0,
    errors: []
  };

  try {
    const ligasTarget = ligaId ? [ligaId] : ['PL', 'BL', 'LL', 'SA'];
    const delayMs = parseInt(process.env.SOCCERSTATS_DELAY_MS, 10) || 4000;

    for (const liga of ligasTarget) {
      console.log(`${logPrefix} Procesando liga: ${liga}...`);
      try {
        const { summary, teams, url } = await scrapeLeague(liga);
        
        if (summary && Object.keys(summary).length > 2) {
           await upsertLeagueSummary(liga, summary);
        }

        const [dbTeamsForLeague] = await pool.query('SELECT id, nombre FROM equipos WHERE liga_id = ?', [liga]);
        let ligaMapped = 0;

        for (const team of teams) {
          results.teamsFound++;
          const apifId = await resolveTeamId(team.team_name_raw, liga, dbTeamsForLeague);
          
          if (apifId) {
            results.teamsWithMapping++;
            ligaMapped++;
          } else {
            results.teamsWithoutMapping++;
          }

          const finalTeamData = {
            ...team,
            equipo_id: apifId || null,
            liga_id: liga,
            source_url: url
          };

          await upsertTeamStats(liga, finalTeamData);
        }

        results.ligasProcessed++;
        console.log(`${logPrefix} Liga ${liga} COMPLETADA: ${teams.length} equipos, ${ligaMapped} mapeados.`);

        // Delay entre ligas para evitar bloqueos
        if (ligasTarget.indexOf(liga) < ligasTarget.length - 1) {
          console.log(`${logPrefix} Pausa de ${delayMs}ms antes de la siguiente liga...`);
          await delay(delayMs);
        }

      } catch (err) {
        console.error(`${logPrefix} ERROR en liga ${liga}:`, err.message);
        results.errors.push(`${liga}: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`${logPrefix} === FIN DE CICLO === Duration: ${duration}s`);
    console.log(`${logPrefix} Resumen: Ligas=${results.ligasProcessed}, Equipos=${results.teamsFound}, Mapeados=${results.teamsWithMapping}, Errores=${results.errors.length}`);
    
    return { ok: true, timestamp: new Date(), ...results };

  } catch (globalErr) {
    console.error(`${logPrefix} ERROR CRÍTICO GLOBAL:`, globalErr.message);
    return { ok: false, error: globalErr.message };
  }
}

module.exports = { runScraping };

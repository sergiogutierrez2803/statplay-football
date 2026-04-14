require('dotenv').config();
const { analyze } = require('../predictor');

async function testPrediction(homeId, awayId, ligaId) {
    console.log(`\n>>> TEST: ${ligaId} | ${homeId} vs ${awayId}`);
    try {
        const result = await analyze(homeId, awayId, ligaId);
        
        console.log(`Context Usable: ${result.soccerStatsContext.usable}`);
        console.log(`Reason: ${result.soccerStatsContext.reason}`);
        
        if (result.soccerStatsContext.usable) {
            console.log(`Freshness: ${result.soccerStatsContext.freshnessDays} days`);
            console.log(`SoccerStats Home Over25: ${result.soccerStatsContext.home.over25_pct}%`);
        }

        // Validación de no-cambio (Heurística actual)
        console.log(`Predictor Corners: ${result.corners}`);
        console.log(`Predictor Over25: ${result.over25}%`);
        
        return result;
    } catch (err) {
        console.error(`Error:`, err.message);
    }
}

async function run() {
    console.log('=== VALIDACIÓN PREDICTOR: Corners (FASE 6.2a) ===');

    // 1. Caso Real (Arsenal vs Liverpool) - Flag TRUE
    console.log('\n[TEST 1] SOCCERSTATS_USE_CORNERS = true');
    process.env.SOCCERSTATS_USE_CORNERS = 'true';
    let res1 = await testPrediction(42, 40, 'PL');
    if (res1) {
        console.log(`=> Corners final: ${res1.corners} (Source: ${res1.cornersSource})`);
    }

    // 2. Caso Fallback Voluntario - Flag FALSE
    console.log('\n[TEST 2] SOCCERSTATS_USE_CORNERS = false (Fallback artificial)');
    process.env.SOCCERSTATS_USE_CORNERS = 'false';
    let res2 = await testPrediction(42, 40, 'PL');
    if (res2) {
        console.log(`=> Corners final: ${res2.corners} (Source: ${res2.cornersSource})`);
    }

    // 3. Caso Fallback Obligatorio - Liga no soportada
    console.log('\n[TEST 3] Liga no soportada con flag TRUE (Fallback obligatorio)');
    process.env.SOCCERSTATS_USE_CORNERS = 'true';
    let res3 = await testPrediction(42, 40, 'FR');
    if (res3) {
        console.log(`=> Corners final: ${res3.corners} (Source: ${res3.cornersSource})`);
    }

    console.log('\n=== VALIDACIÓN COMPLETA ===');
    process.exit(0);
}


run();

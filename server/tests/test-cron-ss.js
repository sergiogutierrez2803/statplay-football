require('dotenv').config();
const { runScraping } = require('../scrapers/ss-orchestrator');

async function testScenario(name, overrides, target = null) {
    console.log(`\n>>> TEST: ${name}`);
    const originalEnv = { ...process.env };
    
    // Aplicar overrides temporales
    Object.assign(process.env, overrides);
    
    try {
        const result = await runScraping(target);
        console.log(`Result:`, JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(`Uncaught Error:`, err.message);
    } finally {
        // Restaurar env
        process.env = originalEnv;
    }
}

async function run() {
    console.log('=== VALIDACIÓN OPERACIONAL SOCCERSTATS (FASE 5) ===');

    // Escenario 1: Flag desactivada
    await testScenario('Flag Desactivada', { SOCCERSTATS_ENABLED: 'false' });

    // Escenario 2: Flag activada (una sola liga para brevedad)
    await testScenario('Ejecución Manual (PL)', { SOCCERSTATS_ENABLED: 'true' }, 'PL');

    // Escenario 3: Simulación de fallo (liga inválida) sin romper ciclo
    // El orquestador debe capturar el error y seguir (si hubiera más ligas)
    // Probaremos inyectando una liga que no existe en el mapping.
    await testScenario('Aislamiento de Errores (Liga Inválida)', { SOCCERSTATS_ENABLED: 'true' }, 'INVALID_CODE');

    console.log('\n=== VALIDACIÓN COMPLETA ===');
    process.exit(0);
}

run();

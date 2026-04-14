require('dotenv').config();
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api`;
const ADMIN_KEY = process.env.ADMIN_KEY;

async function testEndpoint(name, path, headers = {}) {
  console.log(`\n[TEST] ${name} -> ${path}`);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    const data = await res.json();
    if (res.ok) {
        console.log(`✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
        return data;
    } else {
        console.error(`❌ Failed (${res.status}):`, data);
        return null;
    }
  } catch (err) {
    console.error(`❌ Error:`, err.message);
    return null;
  }
}

async function run() {
  console.log('=== VALIDACIÓN API SOCCERSTATS (FASE 4) ===');

  // 1. Leagues
  await testEndpoint('Leagues List', '/internal/leagues');

  // 2. Teams by League (PL)
  await testEndpoint('PL Teams', '/internal/leagues/PL/teams');

  // 3. Real IDs (Arsenal=42, Bayern=157, RealMadrid=541, Juventus=496)
  const teamsToTest = [
    { name: 'Arsenal (PL)', id: 42 },
    { name: 'Bayern (BL)', id: 157 },
    { name: 'Real Madrid (LL)', id: 541 },
    { name: 'Juventus (SA)', id: 496 }
  ];

  for (const team of teamsToTest) {
    await testEndpoint(`Team Stats: ${team.name}`, `/internal/teams/${team.id}/stats`);
    await testEndpoint(`Team Corners: ${team.name}`, `/internal/teams/${team.id}/corners`);
  }

  // 4. Error Case
  await testEndpoint('Non-existent Team (99999)', '/internal/teams/99999/stats');

  // 5. Admin Status
  await testEndpoint('Admin Status (Auth)', '/admin/scrape/status', { 'x-admin-key': ADMIN_KEY });
  await testEndpoint('Admin Status (No Auth)', '/admin/scrape/status');

  console.log('\n=== VALIDACIÓN COMPLETA ===');
}

run();

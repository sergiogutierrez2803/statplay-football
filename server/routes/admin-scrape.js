const express = require('express');
const router = express.Router();
const pool = require('../db');
const { runScraping } = require('../scrapers/ss-orchestrator');

// Middleware para validar el admin-key (se espera que sea el mismo que en index.js)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === process.env.ADMIN_KEY) {
    return next();
  }
  return res.status(401).json({ ok: false, error: 'No autorizado' });
};

// Rutas protegidas
router.use(adminAuth);

/**
 * POST /api/admin/scrape/soccerstats
 * Dispara el scraping de TODAS las ligas
 */
router.post('/soccerstats', async (req, res) => {
  try {
    const result = await runScraping(null);
    res.json(result);
  } catch (err) {
    console.error('[AdminRoute] Error en scrape all:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/admin/scrape/soccerstats/:leagueId
 * Dispara el scraping de UNA sola liga
 */
router.post('/soccerstats/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const result = await runScraping(leagueId.toUpperCase());
    res.json(result);
  } catch (err) {
    console.error(`[AdminRoute] Error en scrape ${leagueId}:`, err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/admin/scrape/status
 * Estado general del sistema: frescura y cobertura de mapeo.
 */
router.get('/status', async (req, res) => {
  try {
    // Obtener cobertura real desde ss_team_stats
    const [coverageRows] = await pool.query(`
      SELECT 
        liga_id,
        COUNT(*) as total,
        COUNT(equipo_id) as mapped
      FROM ss_team_stats
      GROUP BY liga_id
    `);

    // Obtener frescura desde ss_league_summary
    const [summaryRows] = await pool.query(`
      SELECT liga_id, scraped_at, season
      FROM ss_league_summary
    `);

    const summaryMap = {};
    summaryRows.forEach(s => { summaryMap[s.liga_id] = s; });

    const status = coverageRows.map(c => {
      const s = summaryMap[c.liga_id] || {};
      const coveragePct = c.total > 0 ? ((c.mapped / c.total) * 100).toFixed(1) : 0;
      return {
        liga_id: c.liga_id,
        season: s.season || 'N/A',
        scraped_at: s.scraped_at || null,
        teams: {
          total: c.total,
          mapped: c.mapped,
          coverage: `${coveragePct}%`
        }
      };
    });

    res.json({ ok: true, timestamp: new Date(), status });
  } catch (err) {
    console.error('[AdminRoute] Error leyendo status:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

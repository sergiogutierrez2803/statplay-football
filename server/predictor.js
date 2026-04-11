/**
 * StatPlay — predictor.js v3.1
 * Motor de predicción optimizado — ponderación inteligente:
 *   60% forma reciente (últimos 5 partidos)
 *   25% histórico (rendimiento local/visitante + posición tabla)
 *   15% head-to-head
 *
 * v3.1 — Mejoras de precisión estadística:
 *   [M1] Opponent strength factor en recent form
 *   [M2] H2H weight decay por antigüedad (>24 meses → 50%)
 *   [M3] Draw boost realista basado en xG
 *   [M4] BTTS correction usando avgGoalsFor real
 *   [M5] Confidence penalty por divergencia Poisson vs Weighted
 *
 * Soporta: PL, BL, LL (La Liga), SA (Serie A)
 */

const pool   = require('./db');
const { getH2H } = require('./sync');
const { getTeamRecentForm, getTeamFormByVenue } = require('./footballdata');
const Logger = require('./logger');

/* ── Promedios de goles por liga (temporada actual) ── */
const LEAGUE_AVGS = {
  PL: { homeAvg: 1.55, awayAvg: 1.10, totalTeams: 20 },
  BL: { homeAvg: 1.75, awayAvg: 1.25, totalTeams: 18 },
  LL: { homeAvg: 1.50, awayAvg: 1.05, totalTeams: 20 },
  SA: { homeAvg: 1.45, awayAvg: 1.00, totalTeams: 20 },
};

/* ── Base rates históricos por liga ── */
const BASE_RATES = {
  PL: { home: 0.46, draw: 0.26, away: 0.28 },
  BL: { home: 0.48, draw: 0.24, away: 0.28 },
  LL: { home: 0.47, draw: 0.27, away: 0.26 },
  SA: { home: 0.46, draw: 0.29, away: 0.25 },
};

/* ─────────────────────────────────────────
   Cargar datos de equipo desde DB
───────────────────────────────────────── */
async function loadTeamData(teamId) {
  const [rows] = await pool.query(`
    SELECT e.id, e.nombre, e.short_name, e.emoji, e.logo_url, e.pos, e.puntos, e.liga_id,
           e.jugados, e.ganados, e.empatados, e.perdidos, e.gf, e.ga, e.gd,
           es.forma, es.h_win_rate, es.h_draw_rate, es.a_win_rate, es.a_draw_rate,
           es.h_gf, es.h_ga, es.a_gf, es.a_ga, es.avg_corners, es.h1_scoring_ratio
    FROM equipos e
    LEFT JOIN estadisticas es ON e.id = es.equipo_id
    WHERE e.id = ?
  `, [teamId]);

  if (!rows.length) return null;
  const t = rows[0];

  // Normalizar forma
  let form = [];
  if (t.forma) {
    form = t.forma.includes('-') ? t.forma.split('-') : t.forma.split('');
  }

  return {
    id:               t.id,
    name:             t.nombre,
    shortName:        t.short_name,
    emoji:            t.emoji,
    logoUrl:          t.logo_url,
    pos:              t.pos || 10,
    points:           t.puntos || 0,
    played:           t.jugados || 0,
    won:              t.ganados || 0,
    drawn:            t.empatados || 0,
    lost:             t.perdidos || 0,
    gf:               t.gf || 0,
    ga:               t.ga || 0,
    gd:               t.gd || 0,
    form,
    homeGoalsFor:     parseFloat(t.h_gf)            || 1.3,
    homeGoalsAgainst: parseFloat(t.h_ga)            || 1.0,
    homeWinRate:      parseFloat(t.h_win_rate)      || 0.45,
    homeDrawRate:     parseFloat(t.h_draw_rate)     || 0.25,
    awayGoalsFor:     parseFloat(t.a_gf)            || 1.1,
    awayGoalsAgainst: parseFloat(t.a_ga)            || 1.2,
    awayWinRate:      parseFloat(t.a_win_rate)      || 0.35,
    awayDrawRate:     parseFloat(t.a_draw_rate)     || 0.25,
    avgCorners:       parseFloat(t.avg_corners)     || 5.0,
    h1ScoringRatio:   parseFloat(t.h1_scoring_ratio) || 0.42,
    ligaId:           t.liga_id || 'PL',
  };
}

/* ─────────────────────────────────────────
   Poisson
───────────────────────────────────────── */
const FACT = [1,1,2,6,24,120,720,5040,40320];
function poisson(lambda, k) {
  return Math.exp(-lambda) * Math.pow(lambda, k) / (FACT[k] ?? 40320);
}

function poissonProbs(xGH, xGA) {
  let home = 0, draw = 0, away = 0;
  for (let h = 0; h <= 8; h++) {
    const ph = poisson(xGH, h);
    for (let a = 0; a <= 8; a++) {
      const p = ph * poisson(xGA, a);
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
    }
  }
  return { home, draw, away };
}

/* ─────────────────────────────────────────
   xG Dixon-Coles
───────────────────────────────────────── */
/* ── Multiplicadores de ajuste por liga (T3.2) ── */
const LEAGUE_MODIFIERS = {
  SA: 0.94, // Serie A: ajuste a la baja por tendencia defensiva histórica
};

function expectedGoals(home, away, h2h, ligaId) {
  const avgs = LEAGUE_AVGS[ligaId] || LEAGUE_AVGS.PL;

  // T3.1: Salvaguarda contra promedios en 0 (evitar NaN/Infinity)
  const safeHomeAvg = avgs.homeAvg || 1.5;
  const safeAwayAvg = avgs.awayAvg || 1.1;

  const homeAtk = home.homeGoalsFor      / safeHomeAvg;
  const awayDef = away.awayGoalsAgainst  / safeAwayAvg;
  let xGH = homeAtk * awayDef * safeHomeAvg;

  const awayAtk = away.awayGoalsFor      / safeAwayAvg;
  const homeDef = home.homeGoalsAgainst  / safeHomeAvg;
  let xGA = awayAtk * homeDef * safeAwayAvg;

  // T3.2: Aplicar modificador de liga si existe
  const modifier = LEAGUE_MODIFIERS[ligaId] || 1.0;
  if (modifier !== 1.0) {
    xGH *= modifier;
    xGA *= modifier;
  }

  // [FASE 2] H2H desactivado en xG para preservar modelo Dixon-Coles puro
  /*
  if (h2h?.goals?.length === 2) {
    xGH = xGH * 0.80 + h2h.goals[0] * 0.20;
    xGA = xGA * 0.80 + h2h.goals[1] * 0.20;
  }
  */

  // [FASE 2.1] Regresión conservadora a la media para evitar expansión excesiva del xG por multiplicación de señales recientes
  const REGRESSION = 0.15;
  xGH = (xGH * (1 - REGRESSION)) + (safeHomeAvg * REGRESSION);
  xGA = (xGA * (1 - REGRESSION)) + (safeAwayAvg * REGRESSION);

  xGH = Math.max(0.35, Math.min(3.5, xGH));
  xGA = Math.max(0.35, Math.min(3.5, xGA));
  return { home: +xGH.toFixed(2), away: +xGA.toFixed(2), total: +(xGH + xGA).toFixed(2) };
}

/* ─────────────────────────────────────────
   Weighted score model — ponderación 60/25/15
   60% forma reciente
   25% histórico (rendimiento local/visitante + posición)
   15% H2H
───────────────────────────────────────── */
function formScore(form = []) {
  // Pesos decrecientes: partido más reciente tiene más peso
  const w = [0.35, 0.25, 0.20, 0.12, 0.08];
  const pts = { W: 1, D: 0.4, L: 0 };
  return form.reduce((acc, r, i) => acc + (pts[r] ?? 0) * (w[i] ?? 0.08), 0);
}

function weightedProbs(home, away, h2h, ligaId) {
  const avgs = LEAGUE_AVGS[ligaId] || LEAGUE_AVGS.PL;
  const totalTeams = avgs.totalTeams;

  /* ── 60%: Forma reciente ── */
  const hForm = formScore(home.form);
  const aForm = formScore(away.form);
  const formTotal = hForm + aForm + 0.001;
  const formH = hForm / formTotal;
  const formA = aForm / formTotal;

  /* ── 25%: Histórico (rendimiento + posición) ── */
  const hHistorico = home.homeWinRate * 0.6 + (1 - (home.pos - 1) / (totalTeams - 1)) * 0.4;
  const aHistorico = away.awayWinRate * 0.6 + (1 - (away.pos - 1) / (totalTeams - 1)) * 0.4;
  const histTotal  = hHistorico + aHistorico + 0.001;
  const histH = hHistorico / histTotal;
  const histA = aHistorico / histTotal;

  /* ── [M2] H2H con weight decay ultra conservador (FASE 2) ── */
  const h2hIsStale = h2h?.source === 'fallback' || (!h2h?.source && (h2h?.hw === 2 && h2h?.d === 1 && h2h?.aw === 2));
  const h2hTotalMatches = h2h ? ((h2h.hw || 0) + (h2h.d || 0) + (h2h.aw || 0)) : 0;
  
  let H2H_WEIGHT = 0;
  if (!h2hIsStale) {
      if (h2hTotalMatches >= 3) H2H_WEIGHT = 0.06;
      else if (h2hTotalMatches > 0) H2H_WEIGHT = 0.02;
  }
  
  // Redistribución explícita
  const HIST_WEIGHT = 0.25;
  const FORM_WEIGHT = 1 - HIST_WEIGHT - H2H_WEIGHT; 

  if (H2H_WEIGHT === 0) {
    console.log(`[Predictor] [M2] H2H descartado (fallback o muestra nula). Form asume total: ${FORM_WEIGHT}`);
  }

  const h2hT = h2hTotalMatches + 0.001;
  const h2hH = (h2h?.hw || 0) / h2hT;
  const h2hA = (h2h?.aw || 0) / h2hT;
  const h2hD = (h2h?.d  || 0) / h2hT;

  /* ── Combinar con pesos ajustados ── */
  const hScore = formH * FORM_WEIGHT + histH * HIST_WEIGHT + h2hH * H2H_WEIGHT;
  const aScore = formA * FORM_WEIGHT + histA * HIST_WEIGHT + h2hA * H2H_WEIGHT;

  const balance = 1 - Math.abs(hScore - aScore);
  const dScore  = balance * 0.35 * FORM_WEIGHT
    + (1 - Math.abs(histH - histA)) * 0.35 * HIST_WEIGHT
    + h2hD * H2H_WEIGHT;

  const sum = hScore + aScore + dScore;
  return { home: hScore / sum, draw: dScore / sum, away: aScore / sum };
}

/* ─────────────────────────────────────────
   Blend + regresión a base rates
   [M3] Draw boost realista cuando xG están muy equilibrados
───────────────────────────────────────── */
function blendProbs(poissonP, weighted, ligaId, xGH = null, xGA = null, home = null, away = null) {
  const base = BASE_RATES[ligaId] || BASE_RATES.PL;
  const R = 0.15;
  const blend = {
    home: poissonP.home * 0.65 + weighted.home * 0.35,
    draw: poissonP.draw * 0.65 + weighted.draw * 0.35,
    away: poissonP.away * 0.65 + weighted.away * 0.35,
  };
  const reg = {
    home: blend.home * (1 - R) + base.home * R,
    draw: blend.draw * (1 - R) + base.draw * R,
    away: blend.away * (1 - R) + base.away * R,
  };

  /* [M3] Draw boost fluid y prudente (FASE 2)
     Sustituye heurísticas binarias por matemática de curva continua. */
  if (xGH !== null && xGA !== null && home && away) {
    const xgDiff = Math.abs(xGH - xGA);
    const xgTotal = xGH + xGA;
    
    // Penaliza fuertemente diferencias > 0.25 xG (se desploma la asintota)
    const closenessFactor = 1 / (1 + Math.pow(xgDiff * 3.0, 2)); 
    // Rango más modesto: 0 a ~0.45 si pronostican under 2.5 general
    const scarcityFactor = Math.max(0, (2.6 - xgTotal) * 0.25); 
    
    // Escalado de impacto pequeño: boost teórico máximo raramente cruzará 0.035 (~3.5%)
    const drawBoost = closenessFactor * scarcityFactor * 0.08; 
    
    // Solo aplicar si es perceptible y tiene sentido iterar
    if (drawBoost > 0.005) {
      reg.draw += drawBoost;
      reg.home -= drawBoost / 2;
      reg.away -= drawBoost / 2;
      console.log(`[Predictor] [M3] Fluid Draw boost=${(drawBoost * 100).toFixed(1)}% (xgDiff=${xgDiff.toFixed(2)}, xgTotal=${xgTotal.toFixed(2)})`);
    }
  }

  const sum = reg.home + reg.draw + reg.away;
  return {
    home: Math.round(reg.home / sum * 100),
    draw: Math.round(reg.draw / sum * 100),
    away: Math.round(reg.away / sum * 100),
  };
}

/* ─────────────────────────────────────────
   Desglose H1/H2
───────────────────────────────────────── */
function halfTimeBreakdown(goals, home, away) {
  const h1H = home.h1ScoringRatio || 0.42;
  const h1A = away.h1ScoringRatio || 0.42;
  const hH1 = +(goals.home * h1H).toFixed(2);
  const hH2 = +(goals.home * (1 - h1H)).toFixed(2);
  const aH1 = +(goals.away * h1A).toFixed(2);
  const aH2 = +(goals.away * (1 - h1A)).toFixed(2);
  return {
    firstHalf:  { home: hH1, away: aH1, total: +(hH1 + aH1).toFixed(2) },
    secondHalf: { home: hH2, away: aH2, total: +(hH2 + aH2).toFixed(2) },
  };
}

/* ─────────────────────────────────────────
   Confianza
───────────────────────────────────────── */
function formConsistency(form = []) {
  const pts = form.map(r => r === 'W' ? 1 : r === 'D' ? 0.5 : 0);
  const avg = pts.reduce((a, b) => a + b, 0) / (pts.length || 1);
  const variance = pts.reduce((a, b) => a + (b - avg) ** 2, 0) / (pts.length || 1);
  return 1 - Math.min(1, variance * 2);
}

function confidence(probs, home, away, h2h, fuentesUsadas, ligaId, poissonP = null, weightedP = null) {
  const avgs = LEAGUE_AVGS[ligaId] || LEAGUE_AVGS.PL;
  const maxP    = Math.max(probs.home, probs.draw, probs.away) / 100;
  const hCons   = formConsistency(home.form);
  const aCons   = formConsistency(away.form);
  const sample  = Math.min(1, ((h2h?.hw || 0) + (h2h?.d || 0) + (h2h?.aw || 0)) / 5);
  const posDiff = Math.abs(home.pos - away.pos) / (avgs.totalTeams - 1);

  const sourceBonus = fuentesUsadas === 'fd+apif' ? 0.06 : fuentesUsadas === 'fd' || fuentesUsadas === 'apif' ? 0.03 : 0;
  const formPenalty = (home.form.length < 3 || away.form.length < 3) ? -0.05 : 0;

  /* [M5] Confidence penalty por divergencia entre modelos.
     Si Poisson y Weighted difieren más de 12 puntos en el resultado más probable,
     los modelos están en desacuerdo → reducir confianza proporcionalmente.
     Fórmula: penalty = divergence * 0.5 (en puntos porcentuales)
     Mínimo final: 45% */
  let divergencePenalty = 0;
  if (poissonP && weightedP) {
    const pMaxHome = Math.round(poissonP.home  * 100);
    const pMaxDraw = Math.round(poissonP.draw  * 100);
    const pMaxAway = Math.round(poissonP.away  * 100);
    const wMaxHome = Math.round(weightedP.home * 100);
    const wMaxDraw = Math.round(weightedP.draw * 100);
    const wMaxAway = Math.round(weightedP.away * 100);
    const divergence = Math.max(
      Math.abs(pMaxHome - wMaxHome),
      Math.abs(pMaxDraw - wMaxDraw),
      Math.abs(pMaxAway - wMaxAway)
    );
    if (divergence > 12) {
      divergencePenalty = -(divergence * 0.005); // 0.5% por punto de divergencia
      console.log(`[Predictor] [M5] Model divergence=${divergence}pts → confidence penalty=${(divergencePenalty * 100).toFixed(1)}%`);
    }
  }

  const raw = maxP * 0.40 + ((hCons + aCons) / 2) * 0.25 + sample * 0.20 + posDiff * 0.10 + sourceBonus + formPenalty + divergencePenalty;
  const pct = Math.round(Math.max(45, Math.min(92, raw * 100))); // mínimo 45% [M5]
  const margin = Math.round(Math.max(4, Math.min(18, 28 - pct * 0.22)));
  const level = pct >= 72 ? 'high' : pct >= 55 ? 'medium' : 'low';
  return { pct, level, margin };
}

/* ─────────────────────────────────────────
   [M1] FASE 3A: Schedule Strength Crítico Inmediato
   Saneamiento del "rich-get-richer proxy". Hasta la Fase 3B, esta función 
   retornará incondicionalmente un 1.00 honesto, neutralizando
   el over-fitting sin romper la estructura actual del promise/callback.
───────────────────────────────────────── */
async function _calculateScheduleStrength(ligaId) {
  // En Fase 3B conectaremos a la DB cruzada para re-introducir
  // opponentsAvgPos. Por ahora, sanidad matemática.
  return (recentOpponentsAvgPos = null) => {
    return 1.00; // Neutro puro
  };
}

/**
 * [Fase 5] Calcula métricas de poder (0-100) para visualizaciones.
 * Ataque: basado en capacidad goleadora vs promedio de liga.
 * Defensa: basado en solidez defensiva (inverso de goles recibidos).
 */
function calculatePower(home, away, goals, ligaId) {
  const avgs = LEAGUE_AVGS[ligaId] || LEAGUE_AVGS.PL;
  
  // 1. Factores de ataque: Goles (45%) + Win Rate (40%) + Posición (15%)
  const hAtkBase = (home.homeGoalsFor / avgs.homeAvg) * 45;
  const aAtkBase = (away.awayGoalsFor / avgs.awayAvg) * 45;
  const hAtkWin  = (home.homeWinRate || 0.4) * 40;
  const aAtkWin  = (away.awayWinRate || 0.3) * 40;
  const hAtkPos  = (1 - (home.pos / avgs.totalTeams)) * 15;
  const aAtkPos  = (1 - (away.pos / avgs.totalTeams)) * 15;

  let hAtk = hAtkBase + hAtkWin + hAtkPos + 25; // Base 25 para evitar barras vacías
  let aAtk = aAtkBase + aAtkWin + aAtkPos + 25;

  // 2. Factores de defensa: Goles Recibidos (Inverso) (50%) + Puntos (50%)
  const hDefBase = (avgs.awayAvg / Math.max(0.5, home.homeGoalsAgainst)) * 50;
  const aDefBase = (avgs.homeAvg / Math.max(0.5, away.awayGoalsAgainst)) * 50;
  const hDefPts  = (home.points / (avgs.totalTeams * 2.5)) * 50; 
  const aDefPts  = (away.points / (avgs.totalTeams * 2.5)) * 50;

  let hDef = hDefBase + hDefPts + 20;
  let aDef = aDefBase + aDefPts + 20;

  // 3. Tie-breaker por posición en tabla para evitar 50-50 exactos
  if (Math.abs(hAtk - aAtk) < 0.5) {
    if (home.pos < away.pos) hAtk += 1.5; else aAtk += 1.5;
  }
  if (Math.abs(hDef - aDef) < 0.5) {
    if (home.pos < away.pos) hDef += 1.5; else aDef += 1.5;
  }

  // Capado final 
  const cap = (v) => Math.min(98, Math.max(25, Math.round(v)));

  return {
    homePower: { attack: cap(hAtk), defense: cap(hDef) },
    awayPower: { attack: cap(aAtk), defense: cap(aDef) }
  };
}

/* ─────────────────────────────────────────
   Enriquecer datos de equipo con forma reciente real de FD
   Ponderación: 60% forma reciente FD + 40% histórico DB
   role: 'home' | 'away' — determina qué stats de venue usar
   opponentFactor: función (rivalPos) → multiplicador [M1]
───────────────────────────────────────── */
async function enrichWithRecentForm(teamData, fdTeamId, role = 'home', scheduleFactor = null) {
  if (!fdTeamId) {
    console.log(`[Recent Form] No fd_id for ${teamData.name} — using DB history only`);
    return teamData;
  }

  try {
    const recent = await getTeamRecentForm(fdTeamId, 5);
    if (!recent || recent.matches < 3) {
      console.warn(`[Recent Form] Insufficient data for ${teamData.name} (${recent?.matches ?? 0} matches) — using DB history`);
      return teamData;
    }

    const src = recent.source === 'db_cache' ? 'cache' : 'API';

    /* [M1] Fase 3A: Integración del scheduleStrength validado
       Neutralizamos proxies agresivos. El factor será 1.00 exacto. */
    const factor = scheduleFactor ? scheduleFactor(null) : 1.00;
    const adjustedWinRate = Math.min(1, Math.max(0, recent.winRate * factor));
    if (factor !== 1.00) {
      console.log(`[Recent Form] [M1] S.Factor=${factor.toFixed(2)} → winRate ${recent.winRate.toFixed(2)} → ${adjustedWinRate.toFixed(2)} for ${teamData.name}`);
    }

    console.log(`[Recent Form] Applied to ${teamData.name} (${role}) from ${src}: form=${recent.form.join('-')} GF=${recent.avgGoalsFor} GA=${recent.avgGoalsAgainst}`);

    // [FASE 3A] Multiplicador Base Prudente de Forma Reciente
    const baseFormWeight = 0.40; // Estrictamente rebajado de 0.60
    const W_RECENT = Math.max(0.30, Math.min(0.50, baseFormWeight * factor)); 
    const W_HIST   = +(1 - W_RECENT).toFixed(2);

    if (role === 'home') {
      return {
        ...teamData,
        form:       recent.form,
        recentForm: recent,
        homeGoalsFor:     +(recent.avgGoalsFor     * W_RECENT + teamData.homeGoalsFor     * W_HIST).toFixed(2),
        homeGoalsAgainst: +(recent.avgGoalsAgainst * W_RECENT + teamData.homeGoalsAgainst * W_HIST).toFixed(2),
        awayGoalsFor:     teamData.awayGoalsFor,
        awayGoalsAgainst: teamData.awayGoalsAgainst,
        // [M1] winRate ajustado por calidad de rivales enfrentados
        homeWinRate:  +(adjustedWinRate  * W_RECENT + teamData.homeWinRate  * W_HIST).toFixed(2),
        homeDrawRate: +(recent.drawRate  * W_RECENT + teamData.homeDrawRate * W_HIST).toFixed(2),
        awayWinRate:  teamData.awayWinRate,
        awayDrawRate: teamData.awayDrawRate,
      };
    } else {
      return {
        ...teamData,
        form:       recent.form,
        recentForm: recent,
        homeGoalsFor:     teamData.homeGoalsFor,
        homeGoalsAgainst: teamData.homeGoalsAgainst,
        awayGoalsFor:     +(recent.avgGoalsFor     * W_RECENT + teamData.awayGoalsFor     * W_HIST).toFixed(2),
        awayGoalsAgainst: +(recent.avgGoalsAgainst * W_RECENT + teamData.awayGoalsAgainst * W_HIST).toFixed(2),
        homeWinRate:  teamData.homeWinRate,
        homeDrawRate: teamData.homeDrawRate,
        // [M1] winRate ajustado por calidad de rivales enfrentados
        awayWinRate:  +(adjustedWinRate  * W_RECENT + teamData.awayWinRate  * W_HIST).toFixed(2),
        awayDrawRate: +(recent.drawRate  * W_RECENT + teamData.awayDrawRate * W_HIST).toFixed(2),
      };
    }
  } catch (e) {
    console.error(`[Recent Form] Error enriching ${teamData.name}:`, e.message);
    return teamData;
  }
}

/* ─────────────────────────────────────────
   Ajuste por condición (casa/fuera) — capa adicional
   No reemplaza la lógica existente, solo ajusta ligeramente los xG
   y win rates basándose en rendimiento real por venue.
───────────────────────────────────────── */
async function applyVenueAdjustment(homeData, awayData, homeFdId, awayFdId) {
  // Cargar en paralelo: local en casa + visitante fuera
  const [homeVenue, awayVenue] = await Promise.all([
    homeFdId ? getTeamFormByVenue(homeFdId, 'home', 5) : Promise.resolve(null),
    awayFdId ? getTeamFormByVenue(awayFdId, 'away', 5) : Promise.resolve(null),
  ]);

  // Clonar para no mutar los originales
  let home = { ...homeData, venueForm: homeVenue };
  let away = { ...awayData, venueForm: awayVenue };

  // [FASE 3A] Escudo Anti-Ruido de Localía (cap 10%, min 3 matches)
  if (homeVenue && homeVenue.matches >= 3) {
    const V = 0.10;
    home = {
      ...home,
      homeGoalsFor:     +(home.homeGoalsFor     * (1 - V) + homeVenue.avgGoalsFor     * V).toFixed(2),
      homeGoalsAgainst: +(home.homeGoalsAgainst * (1 - V) + homeVenue.avgGoalsAgainst * V).toFixed(2),
      homeWinRate:      +(home.homeWinRate      * (1 - V) + homeVenue.winRate          * V).toFixed(2),
      venueForm:        homeVenue,
    };
    console.log(`[Predictor] ${homeData.name} ajuste casa: xGF=${home.homeGoalsFor} xGA=${home.homeGoalsAgainst} winRate=${home.homeWinRate}`);
  }

  if (awayVenue && awayVenue.matches >= 3) {
    const V = 0.10;
    away = {
      ...away,
      awayGoalsFor:     +(away.awayGoalsFor     * (1 - V) + awayVenue.avgGoalsFor     * V).toFixed(2),
      awayGoalsAgainst: +(away.awayGoalsAgainst * (1 - V) + awayVenue.avgGoalsAgainst * V).toFixed(2),
      awayWinRate:      +(away.awayWinRate      * (1 - V) + awayVenue.winRate          * V).toFixed(2),
      venueForm:        awayVenue,
    };
    console.log(`[Predictor] ${awayData.name} ajuste fuera: xGF=${away.awayGoalsFor} xGA=${away.awayGoalsAgainst} winRate=${away.awayWinRate}`);
  }

  return { home, away };
}

/* ─────────────────────────────────────────
   Motor principal: analyze(homeId, awayId, ligaId)
───────────────────────────────────────── */
async function analyze(homeId, awayId, ligaId = 'PL', lang = 'es') {
  console.log(`\n[Prediction] ── Iniciando análisis ${homeId} vs ${awayId} (${ligaId}) ──`);

  // 1. Cargar datos base desde MySQL local
  const [homeData, awayData] = await Promise.all([
    loadTeamData(homeId),
    loadTeamData(awayId)
  ]);

  if (!homeData || !awayData) {
    throw new Error(`Datos insuficientes para equipos ${homeId} vs ${awayId}`);
  }
  console.log(`[Prediction] Source: MySQL local → ${homeData.name} | ${awayData.name}`);

  // 2. Determinar fuentes disponibles en DB — 2 queries en lugar de 4
  const [allStats] = await pool.query(
    'SELECT equipo_id, fuente FROM estadisticas WHERE equipo_id IN (?, ?)', [homeId, awayId]);
  const [allEqs] = await pool.query(
    'SELECT id, fuente, fd_id FROM equipos WHERE id IN (?, ?)', [homeId, awayId]);

  const homeStats = allStats.find(r => r.equipo_id === homeId);
  const awayStats = allStats.find(r => r.equipo_id === awayId);
  const homeEq    = allEqs.find(r => r.id === homeId);
  const awayEq    = allEqs.find(r => r.id === awayId);

  const hasAPIF = homeStats?.fuente === 'apif' || awayStats?.fuente === 'apif';
  console.log(`[Prediction] Stats source: ${homeStats?.fuente || 'none'} / ${awayStats?.fuente || 'none'} | fd_ids: ${homeEq?.fd_id}/${awayEq?.fd_id}`);


  // 3. Enriquecer con forma reciente (cache DB → FD API como fallback)
  // [M1] Calcular schedule strength
  console.log(`[Prediction] Recent form: consultando cache DB primero...`);
  const scheduleFactor = await _calculateScheduleStrength(ligaId);
  const [homeEnriched, awayEnriched] = await Promise.all([
    enrichWithRecentForm(homeData, homeEq?.fd_id, 'home', scheduleFactor),
    enrichWithRecentForm(awayData, awayEq?.fd_id, 'away', scheduleFactor),
  ]);

  // 4. Ajuste por venue (cache DB → FD API como fallback)
  console.log(`[Prediction] Venue form: consultando cache DB primero...`);
  const { home: homeFinal, away: awayFinal } = await applyVenueAdjustment(
    homeEnriched, awayEnriched,
    homeEq?.fd_id, awayEq?.fd_id
  );

  // Determinar fuentes usadas (incluyendo FD reciente si se obtuvo)
  const hasRecentFD = homeFinal.recentForm || awayFinal.recentForm;
  const hasVenueFD  = homeFinal.venueForm  || awayFinal.venueForm;
  const fuentesUsadas = (hasRecentFD || hasVenueFD) && hasAPIF ? 'fd+apif'
    : (hasRecentFD || hasVenueFD) ? 'fd'
    : hasAPIF ? 'apif'
    : 'local';

  // 5. H2H — primero cache DB (24h), luego API-Football
  console.log(`[Prediction] H2H: consultando cache DB...`);
  const h2h = await getH2H(homeId, awayId);
  console.log(`[Prediction] H2H source: ${h2h.source || 'api'} | ${h2h.hw}W-${h2h.d}D-${h2h.aw}L`);

  // Cálculos con datos finales (enriquecidos + ajuste venue)
  const goals     = expectedGoals(homeFinal, awayFinal, h2h, ligaId);
  const poissonP  = poissonProbs(goals.home, goals.away);
  const weightedP = weightedProbs(homeFinal, awayFinal, h2h, ligaId);
  // [M3] Pasar xG y datos de equipos para activar draw boost si aplica
  const probs     = blendProbs(poissonP, weightedP, ligaId, goals.home, goals.away, homeFinal, awayFinal);
  const halfTime  = halfTimeBreakdown(goals, homeFinal, awayFinal);

  const over25 = Math.round((1 - poisson(goals.total, 0) - poisson(goals.total, 1) - poisson(goals.total, 2)) * 100);
  const btts   = Math.round((1 - poisson(goals.home, 0)) * (1 - poisson(goals.away, 0)) * 100);
  const corners = +((homeFinal.avgCorners + awayFinal.avgCorners) / 2).toFixed(1);

  const maxP = Math.max(probs.home, probs.draw, probs.away);
  const risk = maxP >= 56 ? 'low' : maxP >= 45 ? 'medium' : 'high';

  // [M5] Pasar modelos crudos para detectar divergencia
  const conf = confidence(probs, homeFinal, awayFinal, h2h, fuentesUsadas, ligaId, poissonP, weightedP);
  // El insight se construye en el frontend con I18n.buildInsight() usando los datos crudos.
  // El backend no genera texto para evitar duplicación de traducciones.

  console.log(`[Prediction] ✅ Completado | Fuentes: ${fuentesUsadas} | Probs: ${probs.home}/${probs.draw}/${probs.away} | xG: ${goals.home}-${goals.away}`);

  return {
    homeTeam:      homeFinal,
    awayTeam:      awayFinal,
    h2h,
    probs,
    goals,
    halfTime,
    over25,
    btts,
    corners,
    risk,
    confidence:    conf,
    insight:       null, // generado en frontend por I18n.buildInsight()
    advanced:      calculatePower(homeFinal, awayFinal, goals, ligaId),
    fuentesUsadas,
  };
}

/* ─────────────────────────────────────────
   Guardar predicción en DB
───────────────────────────────────────── */
async function savePrediction(result, matchId = null) {
  try {
    const { homeTeam, awayTeam, probs, goals, halfTime, confidence, fuentesUsadas } = result;
    await pool.query(`
      INSERT INTO predicciones
        (match_id, home_team_id, away_team_id,
         prob_local, prob_empate, prob_visitante,
         xg_h1_local, xg_h1_visitante, xg_h2_local, xg_h2_visitante,
         nivel_confianza, insight, fuentes_usadas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        prob_local = VALUES(prob_local), prob_empate = VALUES(prob_empate),
        prob_visitante = VALUES(prob_visitante),
        xg_h1_local = VALUES(xg_h1_local), xg_h1_visitante = VALUES(xg_h1_visitante),
        xg_h2_local = VALUES(xg_h2_local), xg_h2_visitante = VALUES(xg_h2_visitante),
        nivel_confianza = VALUES(nivel_confianza), insight = VALUES(insight),
        fuentes_usadas = VALUES(fuentes_usadas)
    `, [
      matchId, homeTeam.id, awayTeam.id,
      probs.home, probs.draw, probs.away,
      halfTime.firstHalf.home, halfTime.firstHalf.away,
      halfTime.secondHalf.home, halfTime.secondHalf.away,
      confidence.pct, null, fuentesUsadas
    ]);
  } catch (e) {
    console.error('[Predictor] savePrediction error:', e.message);
  }
}

/* ─────────────────────────────────────────
   Métricas avanzadas: Over/Under, BTTS, Tarjetas
   Calculadas a partir de datos ya disponibles en DB
───────────────────────────────────────── */

/**
 * Over/Under 2.5 — basado en xG y promedios de goles
 */
function calcOverUnder(xGTotal, homeData, awayData) {
  // Promedio de goles reales de ambos equipos (local + visitante)
  const homeAvgGoals = (homeData.homeGoalsFor + homeData.awayGoalsFor) / 2;
  const awayAvgGoals = (awayData.homeGoalsFor + awayData.awayGoalsFor) / 2;
  const avgTotal = homeAvgGoals + awayAvgGoals;

  // Combinar xG con promedio real (70% xG, 30% promedio histórico)
  const combined = xGTotal * 0.70 + avgTotal * 0.30;

  let level, pct;
  if (combined > 2.6) {
    level = 'high';
    pct   = Math.min(85, Math.round(50 + (combined - 2.6) * 35));
  } else if (combined >= 2.2) {
    level = 'medium';
    pct   = Math.round(45 + (combined - 2.2) * 12.5);
  } else {
    level = 'low';
    pct   = Math.max(20, Math.round(45 - (2.2 - combined) * 30));
  }

  return {
    over: { pct, level },
    under: { pct: 100 - pct, level: level === 'high' ? 'low' : level === 'low' ? 'high' : 'medium' },
    avgGoals: +combined.toFixed(2)
  };
}

/**
 * BTTS avanzado — [M4] usa avgGoalsFor real en lugar de W/D/L como proxy.
 * Penaliza si algún equipo promedia < 0.8 goles/partido.
 * Aumenta si ambos promedian > 1.2 goles/partido.
 * Resultado siempre entre 5% y 95%.
 */
function calcBTTS(homeData, awayData, bttsPoisson) {
  // [M4] Promedio real de goles por partido (combinando home y away stats)
  const homeAvgGF = (homeData.homeGoalsFor + homeData.awayGoalsFor) / 2;
  const awayAvgGF = (awayData.homeGoalsFor + awayData.awayGoalsFor) / 2;

  // Base: Poisson es la fuente más fiable
  let combined = bttsPoisson;

  // [M4] Corrección por capacidad ofensiva real
  if (homeAvgGF < 0.8 || awayAvgGF < 0.8) {
    // Equipo con muy baja producción ofensiva → penalizar BTTS
    const weakerTeam = Math.min(homeAvgGF, awayAvgGF);
    const penalty = Math.round((0.8 - weakerTeam) * 25); // hasta -20pts
    combined = combined - penalty;
    console.log(`[Predictor] [M4] BTTS penalty=${penalty} (weakest avgGF=${weakerTeam.toFixed(2)})`);
  } else if (homeAvgGF > 1.2 && awayAvgGF > 1.2) {
    // Ambos equipos con buena producción ofensiva → aumentar BTTS
    const bonus = Math.round(((homeAvgGF + awayAvgGF) / 2 - 1.2) * 10); // hasta +8pts
    combined = combined + Math.min(8, bonus);
    console.log(`[Predictor] [M4] BTTS bonus=${Math.min(8, bonus)} (homeAvgGF=${homeAvgGF.toFixed(2)}, awayAvgGF=${awayAvgGF.toFixed(2)})`);
  }

  // Clamp entre 5% y 95%
  combined = Math.max(5, Math.min(95, Math.round(combined)));

  let level;
  if (combined >= 65) level = 'high';
  else if (combined >= 45) level = 'medium';
  else level = 'low';

  return { pct: combined, level, bothScore: homeAvgGF > 1.0 && awayAvgGF > 1.0 };
}

/**
 * Tarjetas — basado en datos de la DB (faltas y tarjetas promedio)
 * Si no hay datos de API, usa promedios de liga
 */
function calcCards(homeData, awayData, ligaId) {
  // Promedios de tarjetas por liga (datos históricos)
  const LEAGUE_CARDS = {
    PL: { avg: 3.2, fouls: 22 },
    BL: { avg: 3.8, fouls: 24 },
    LL: { avg: 4.5, fouls: 28 },
    SA: { avg: 4.2, fouls: 26 },
  };
  const leagueAvg = LEAGUE_CARDS[ligaId] || LEAGUE_CARDS.PL;

  // Estimar intensidad basada en diferencia de posición y forma
  const posDiff = Math.abs((homeData.pos || 10) - (awayData.pos || 10));
  const formDiff = Math.abs(
    homeData.form.filter(r => r === 'W').length -
    awayData.form.filter(r => r === 'W').length
  );

  // Partidos entre equipos de nivel similar tienden a ser más intensos
  const intensityFactor = posDiff <= 5 ? 1.2 : posDiff <= 10 ? 1.0 : 0.85;
  const formFactor = formDiff <= 1 ? 1.1 : 0.95;

  const expectedCards = +(leagueAvg.avg * intensityFactor * formFactor).toFixed(1);

  let intensity;
  if (expectedCards >= 4.5) intensity = 'high';
  else if (expectedCards >= 3.0) intensity = 'medium';
  else intensity = 'low';

  // Equipo con más probabilidad de tarjetas: el que tiene peor forma reciente
  const homeLosses = homeData.form.filter(r => r === 'L').length;
  const awayLosses = awayData.form.filter(r => r === 'L').length;
  const moreCards = homeLosses >= awayLosses ? homeData : awayData;

  return {
    expected: expectedCards,
    intensity,
    moreCardsTeam: moreCards.name,
    source: 'calculated'
  };
}

/**
 * Punto de entrada: calcular todas las métricas avanzadas
 */
async function advancedMetrics(homeId, awayId, ligaId, xGTotal, bttsPoisson) {
  try {
    const [homeData, awayData] = await Promise.all([
      loadTeamData(homeId),
      loadTeamData(awayId)
    ]);

    if (!homeData || !awayData) {
      return { error: 'insufficient_data', message: 'Datos insuficientes para métricas avanzadas' };
    }

    const overUnder = calcOverUnder(xGTotal, homeData, awayData);
    const btts      = calcBTTS(homeData, awayData, bttsPoisson);
    const cards     = calcCards(homeData, awayData, ligaId);

    return { overUnder, btts, cards, source: 'calculated' };
  } catch (e) {
    console.error('[AdvancedMetrics]', e.message);
    return { error: 'calculation_error', message: e.message };
  }
}

module.exports = { analyze, savePrediction, loadTeamData, advancedMetrics, expectedGoals, weightedProbs, blendProbs, calculatePower };

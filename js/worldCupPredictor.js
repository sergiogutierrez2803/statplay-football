/**
 * StatPlay — worldCupPredictor.js
 * Motor predictivo exclusivo para FIFA World Cup 2026.
 * REGLA: Solo se activa cuando competition_code === 'WORLD_CUP'
 * No modifica ni toca el predictor de ligas (engine.js).
 *
 * Pesos: 40% forma reciente | 20% ranking FIFA | 15% ofensiva
 *        10% defensiva | 10% calidad rivales | 5% continental
 */

/* ══════════════════════════════════════════════════════════════
   RANKING FIFA APROXIMADO (Abril 2026)
   Fuente: ranking FIFA oficial. Se actualiza manualmente.
   Escala: 1 = mejor, 200 = peor. Usado como modulador, no dominante.
══════════════════════════════════════════════════════════════ */
const WC_FIFA_RANKINGS = {
  'Argentina':              1,
  'France':                 2,
  'Spain':                  3,
  'England':                4,
  'Brazil':                 5,
  'Portugal':               6,
  'Netherlands':            7,
  'Belgium':                8,
  'Germany':                9,
  'Colombia':              10,
  'Uruguay':               11,
  'Morocco':               12,
  'Japan':                 13,
  'United States':         14,
  'Mexico':                15,
  'Croatia':               16,
  'Switzerland':           17,
  'Senegal':               18,
  'Denmark':               19,
  'Austria':               20,
  'Turkey':                21,
  'Ecuador':               22,
  'Korea Republic':        23,
  'Canada':                24,
  'Australia':             25,
  'Serbia':                26,
  'Iran':                  27,
  'Norway':                28,
  'Czech Republic':        29,
  'Algeria':               30,
  'Saudi Arabia':          31,
  'Egypt':                 32,
  'Paraguay':              33,
  'Ivory Coast':           34,
  'Sweden':                35,
  'Tunisia':               36,
  'Ghana':                 37,
  'South Africa':          38,
  'Bolivia':               39,
  'Scotland':              40,
  'Ukraine':               42,
  'Italy':                 43,
  'Georgia':               44,
  'New Zealand':           45,
  'Qatar':                 46,
  'Panama':                47,
  'DR Congo':              48,
  'Uzbekistan':            50,
  'Jordan':                55,
  'Iraq':                  58,
  'Cape Verde':            60,
  'Haiti':                 65,
  'Bosnia and Herzegovina':35,
  'Curacao':               80,
};

/* ══════════════════════════════════════════════════════════════
   PERFIL ESTADISTICO BASE POR SELECCION
   Datos reales aproximados de ultimos 2 anos (2024-2026).
   Estructura: { gf, ga, corners, h1Ratio, cleanSheets, matchesPlayed }
   gf/ga = promedio por partido | corners = promedio por partido
   h1Ratio = goles primer tiempo / total goles
   cleanSheets = porcentaje de partidos sin goles recibidos
══════════════════════════════════════════════════════════════ */
const WC_TEAM_PROFILES = {
  'Argentina':    { gf: 2.1, ga: 0.7, corners: 6.2, h1Ratio: 0.40, cleanSheets: 0.52, matchesPlayed: 18 },
  'France':       { gf: 1.9, ga: 0.8, corners: 5.8, h1Ratio: 0.42, cleanSheets: 0.48, matchesPlayed: 16 },
  'Spain':        { gf: 2.0, ga: 0.6, corners: 6.5, h1Ratio: 0.44, cleanSheets: 0.55, matchesPlayed: 17 },
  'England':      { gf: 1.8, ga: 0.7, corners: 5.9, h1Ratio: 0.43, cleanSheets: 0.50, matchesPlayed: 16 },
  'Brazil':       { gf: 2.2, ga: 0.8, corners: 6.8, h1Ratio: 0.45, cleanSheets: 0.47, matchesPlayed: 18 },
  'Portugal':     { gf: 2.1, ga: 0.9, corners: 6.0, h1Ratio: 0.43, cleanSheets: 0.44, matchesPlayed: 16 },
  'Netherlands':  { gf: 1.9, ga: 0.8, corners: 5.7, h1Ratio: 0.42, cleanSheets: 0.46, matchesPlayed: 15 },
  'Belgium':      { gf: 1.7, ga: 0.9, corners: 5.5, h1Ratio: 0.41, cleanSheets: 0.43, matchesPlayed: 14 },
  'Germany':      { gf: 2.0, ga: 1.0, corners: 6.2, h1Ratio: 0.43, cleanSheets: 0.40, matchesPlayed: 16 },
  'Colombia':     { gf: 1.8, ga: 0.8, corners: 5.5, h1Ratio: 0.43, cleanSheets: 0.48, matchesPlayed: 16 },
  'Uruguay':      { gf: 1.6, ga: 0.9, corners: 5.2, h1Ratio: 0.42, cleanSheets: 0.44, matchesPlayed: 15 },
  'Morocco':      { gf: 1.5, ga: 0.7, corners: 5.0, h1Ratio: 0.40, cleanSheets: 0.55, matchesPlayed: 14 },
  'Japan':        { gf: 1.8, ga: 0.8, corners: 5.5, h1Ratio: 0.43, cleanSheets: 0.47, matchesPlayed: 15 },
  'United States':{ gf: 1.6, ga: 0.9, corners: 5.2, h1Ratio: 0.41, cleanSheets: 0.44, matchesPlayed: 16 },
  'Mexico':       { gf: 1.5, ga: 1.0, corners: 5.0, h1Ratio: 0.43, cleanSheets: 0.40, matchesPlayed: 15 },
  'Croatia':      { gf: 1.5, ga: 0.9, corners: 5.0, h1Ratio: 0.42, cleanSheets: 0.44, matchesPlayed: 14 },
  'Switzerland':  { gf: 1.6, ga: 0.8, corners: 5.2, h1Ratio: 0.42, cleanSheets: 0.48, matchesPlayed: 14 },
  'Senegal':      { gf: 1.5, ga: 0.9, corners: 4.8, h1Ratio: 0.40, cleanSheets: 0.43, matchesPlayed: 13 },
  'Denmark':      { gf: 1.5, ga: 0.9, corners: 5.0, h1Ratio: 0.42, cleanSheets: 0.44, matchesPlayed: 13 },
  'Austria':      { gf: 1.6, ga: 0.9, corners: 5.2, h1Ratio: 0.42, cleanSheets: 0.43, matchesPlayed: 13 },
  'Turkey':       { gf: 1.5, ga: 1.0, corners: 5.0, h1Ratio: 0.42, cleanSheets: 0.40, matchesPlayed: 13 },
  'Ecuador':      { gf: 1.4, ga: 1.0, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.38, matchesPlayed: 13 },
  'Korea Republic':{ gf: 1.6, ga: 0.9, corners: 5.2, h1Ratio: 0.42, cleanSheets: 0.43, matchesPlayed: 14 },
  'Canada':       { gf: 1.4, ga: 1.0, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.38, matchesPlayed: 13 },
  'Australia':    { gf: 1.4, ga: 1.1, corners: 4.9, h1Ratio: 0.42, cleanSheets: 0.36, matchesPlayed: 13 },
  'Iran':         { gf: 1.4, ga: 0.9, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.44, matchesPlayed: 12 },
  'Norway':       { gf: 1.6, ga: 1.0, corners: 5.2, h1Ratio: 0.42, cleanSheets: 0.40, matchesPlayed: 13 },
  'Czech Republic':{ gf: 1.4, ga: 1.0, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.38, matchesPlayed: 12 },
  'Algeria':      { gf: 1.4, ga: 0.9, corners: 4.8, h1Ratio: 0.40, cleanSheets: 0.42, matchesPlayed: 12 },
  'Saudi Arabia': { gf: 1.3, ga: 1.1, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.35, matchesPlayed: 12 },
  'Egypt':        { gf: 1.3, ga: 0.9, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.42, matchesPlayed: 12 },
  'Paraguay':     { gf: 1.3, ga: 1.0, corners: 4.7, h1Ratio: 0.41, cleanSheets: 0.38, matchesPlayed: 12 },
  'Ivory Coast':  { gf: 1.4, ga: 1.0, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.38, matchesPlayed: 12 },
  'Sweden':       { gf: 1.5, ga: 1.0, corners: 5.0, h1Ratio: 0.42, cleanSheets: 0.40, matchesPlayed: 12 },
  'Tunisia':      { gf: 1.2, ga: 1.0, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.38, matchesPlayed: 11 },
  'Ghana':        { gf: 1.3, ga: 1.1, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.35, matchesPlayed: 11 },
  'South Africa': { gf: 1.2, ga: 1.0, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.38, matchesPlayed: 11 },
  'Scotland':     { gf: 1.3, ga: 1.1, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.36, matchesPlayed: 11 },
  'Ukraine':      { gf: 1.4, ga: 1.0, corners: 4.8, h1Ratio: 0.41, cleanSheets: 0.38, matchesPlayed: 11 },
  'Italy':        { gf: 1.5, ga: 0.9, corners: 5.2, h1Ratio: 0.42, cleanSheets: 0.44, matchesPlayed: 13 },
  'Georgia':      { gf: 1.2, ga: 1.2, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.33, matchesPlayed: 11 },
  'New Zealand':  { gf: 1.0, ga: 1.3, corners: 4.2, h1Ratio: 0.40, cleanSheets: 0.30, matchesPlayed: 10 },
  'Qatar':        { gf: 1.2, ga: 1.2, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.33, matchesPlayed: 10 },
  'Panama':       { gf: 1.2, ga: 1.1, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.35, matchesPlayed: 10 },
  'DR Congo':     { gf: 1.3, ga: 1.0, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.38, matchesPlayed: 10 },
  'Uzbekistan':   { gf: 1.3, ga: 1.1, corners: 4.5, h1Ratio: 0.40, cleanSheets: 0.35, matchesPlayed: 10 },
  'Jordan':       { gf: 1.1, ga: 1.2, corners: 4.2, h1Ratio: 0.40, cleanSheets: 0.30, matchesPlayed: 10 },
  'Iraq':         { gf: 1.2, ga: 1.1, corners: 4.3, h1Ratio: 0.40, cleanSheets: 0.33, matchesPlayed: 10 },
  'Cape Verde':   { gf: 1.1, ga: 1.1, corners: 4.2, h1Ratio: 0.40, cleanSheets: 0.35, matchesPlayed: 10 },
  'Haiti':        { gf: 1.0, ga: 1.3, corners: 4.0, h1Ratio: 0.40, cleanSheets: 0.28, matchesPlayed: 9  },
  'Bosnia and Herzegovina': { gf: 1.3, ga: 1.1, corners: 4.7, h1Ratio: 0.41, cleanSheets: 0.35, matchesPlayed: 11 },
  'Curacao':      { gf: 1.0, ga: 1.3, corners: 4.0, h1Ratio: 0.40, cleanSheets: 0.28, matchesPlayed: 9  },
};

/* ══════════════════════════════════════════════════════════════
   VENTAJA CONTINENTAL
   Selecciones de CONCACAF tienen ligera ventaja en torneos
   celebrados en USA/Canada/Mexico.
══════════════════════════════════════════════════════════════ */
const WC_CONTINENTAL_BONUS = {
  'United States': 0.04,
  'Mexico':        0.04,
  'Canada':        0.04,
  'Panama':        0.02,
  'Honduras':      0.02,
};

/* ══════════════════════════════════════════════════════════════
   MULTIPLICADORES POR TIPO DE PARTIDO
══════════════════════════════════════════════════════════════ */
const MATCH_TYPE_WEIGHT = {
  'friendly':      0.35,
  'official':      1.00,
  'qualifier':     1.20,
  'world_cup':     1.50,
};


/* ══════════════════════════════════════════════════════════════
   MOTOR PRINCIPAL — WorldCupPredictionEngine
   Interfaz identica a PredictionEngine para compatibilidad.
   Solo se activa cuando AppState.currentLeague === 'WORLD_CUP'
══════════════════════════════════════════════════════════════ */
const WorldCupPredictionEngine = {

  /* ── Factorial para Poisson ── */
  _fact: [1,1,2,6,24,120,720,5040,40320],

  _poisson(lambda, k) {
    const l = Math.max(0.01, lambda);
    return Math.exp(-l) * Math.pow(l, k) / (this._fact[k] ?? 40320);
  },

  /* ── Normalizar nombre antes de cualquier calculo ── */
  _norm(name) {
    if (!name) return '';
    if (typeof WorldCupGroups !== 'undefined') {
      return WorldCupGroups.normalizeNationalTeamName(String(name));
    }
    return String(name);
  },

  /* ── Obtener perfil estadistico real de una seleccion ── */
  _getProfile(name) {
    const normalized = this._norm(name);
    const profile = WC_TEAM_PROFILES[normalized];
    if (!profile) {
      console.warn('[WC Predictor] Sin perfil para:', normalized, '— usando fallback');
      return { gf: 1.2, ga: 1.1, corners: 4.5, h1Ratio: 0.41, cleanSheets: 0.35, matchesPlayed: 8 };
    }
    return profile;
  },

  /* ── Obtener ranking FIFA (normalizado 0-1, 1=mejor) ── */
  _getRankingScore(name) {
    const normalized = this._norm(name);
    const rank = WC_FIFA_RANKINGS[normalized] || 100;
    // Normalizar: rank 1 = score 1.0, rank 200 = score 0.0
    return Math.max(0, 1 - (rank - 1) / 80);
  },

  /* ── Score de forma reciente ponderado por tipo de partido ──
     form = array de resultados ['W','D','L',...] mas reciente primero
     Pesos decrecientes: partido mas reciente tiene mas peso.
  ── */
  _formScore(form = []) {
    if (!form || form.length === 0) return 0.40; // neutro
    const weights = [0.28, 0.22, 0.18, 0.12, 0.08, 0.05, 0.04, 0.03];
    const pts = { W: 1.0, D: 0.35, L: 0.0 };
    let score = 0, totalW = 0;
    form.slice(0, 8).forEach((r, i) => {
      const w = weights[i] || 0.02;
      score  += (pts[r] ?? 0) * w;
      totalW += w;
    });
    return totalW > 0 ? score / totalW : 0.40;
  },

  /* ── Consistencia de forma (varianza baja = mas consistente) ── */
  _formConsistency(form = []) {
    if (!form || form.length < 2) return 0.5;
    const pts = form.slice(0, 8).map(r => r === 'W' ? 1 : r === 'D' ? 0.5 : 0);
    const avg = pts.reduce((a, b) => a + b, 0) / pts.length;
    const variance = pts.reduce((a, b) => a + (b - avg) ** 2, 0) / pts.length;
    return Math.max(0, 1 - variance * 2);
  },

  /* ── Calidad de rivales recientes (opponent strength factor) ──
     Basado en ranking FIFA de los rivales en la forma reciente.
     Si no hay datos, retorna factor neutro 1.0.
  ── */
  _opponentStrengthFactor(teamName) {
    // Sin datos de rivales especificos, usar ranking propio como proxy
    const rank = WC_FIFA_RANKINGS[this._norm(teamName)] || 50;
    // Equipos top (rank < 10) suelen jugar contra rivales mas fuertes
    if (rank <= 10) return 1.12;
    if (rank <= 20) return 1.05;
    if (rank <= 35) return 1.00;
    return 0.92;
  },

  /* ── xG esperados usando Dixon-Coles adaptado para selecciones ── */
  _expectedGoals(homeProfile, awayProfile, homeRank, awayRank) {
    // Promedio mundial de goles en fase de grupos: ~2.5/partido
    const WC_AVG = 1.25;

    const homeAtk = homeProfile.gf / WC_AVG;
    const awayDef = awayProfile.ga / WC_AVG;
    let xGH = homeAtk * awayDef * WC_AVG;

    const awayAtk = awayProfile.gf / WC_AVG;
    const homeDef = homeProfile.ga / WC_AVG;
    let xGA = awayAtk * homeDef * WC_AVG;

    // Ajuste por ranking FIFA (modulador suave, no dominante)
    const rankDiff = (awayRank - homeRank) / 80; // positivo = home mejor
    xGH = xGH * (1 + rankDiff * 0.08);
    xGA = xGA * (1 - rankDiff * 0.08);

    // Sin ventaja de localidad en Mundial (sede neutral)
    xGH = Math.max(0.40, Math.min(3.20, xGH));
    xGA = Math.max(0.40, Math.min(3.20, xGA));

    return {
      home:  +xGH.toFixed(2),
      away:  +xGA.toFixed(2),
      total: +(xGH + xGA).toFixed(2),
    };
  },

  /* ── Probabilidades Poisson ── */
  _poissonProbs(xGH, xGA) {
    let home = 0, draw = 0, away = 0;
    for (let h = 0; h <= 8; h++) {
      const ph = this._poisson(xGH, h);
      for (let a = 0; a <= 8; a++) {
        const p = ph * this._poisson(xGA, a);
        if (h > a) home += p;
        else if (h === a) draw += p;
        else away += p;
      }
    }
    return { home, draw, away };
  },

  /* ── Modelo ponderado WC: 40/20/15/10/10/5 ── */
  _weightedProbs(homeTeam, awayTeam, homeProfile, awayProfile) {
    const hFormRaw  = this._formScore(homeTeam.form);
    const aFormRaw  = this._formScore(awayTeam.form);
    const hOppFact  = this._opponentStrengthFactor(homeTeam.name);
    const aOppFact  = this._opponentStrengthFactor(awayTeam.name);

    // 40% forma reciente (ajustada por calidad de rivales)
    const hForm = hFormRaw * hOppFact;
    const aForm = aFormRaw * aOppFact;

    // 20% ranking FIFA
    const hRank = this._getRankingScore(homeTeam.name);
    const aRank = this._getRankingScore(awayTeam.name);

    // 15% fuerza ofensiva (goles anotados normalizados)
    const maxGF = 2.5;
    const hOff  = Math.min(1, homeProfile.gf / maxGF);
    const aOff  = Math.min(1, awayProfile.gf / maxGF);

    // 10% fuerza defensiva (clean sheets)
    const hDef = homeProfile.cleanSheets;
    const aDef = awayProfile.cleanSheets;

    // 10% calidad de rivales (ya incluido en forma ajustada, aqui como bonus)
    const hRival = hOppFact > 1.0 ? 0.55 : 0.45;
    const aRival = aOppFact > 1.0 ? 0.55 : 0.45;

    // 5% ventaja continental
    const hCont = WC_CONTINENTAL_BONUS[this._norm(homeTeam.name)] || 0;
    const aCont = WC_CONTINENTAL_BONUS[this._norm(awayTeam.name)] || 0;

    // Score compuesto
    const hScore = hForm  * 0.40
                 + hRank  * 0.20
                 + hOff   * 0.15
                 + hDef   * 0.10
                 + hRival * 0.10
                 + hCont  * 0.05;

    const aScore = aForm  * 0.40
                 + aRank  * 0.20
                 + aOff   * 0.15
                 + aDef   * 0.10
                 + aRival * 0.10
                 + aCont  * 0.05;

    // Empate: equilibrio entre equipos + tendencia historica mundiales
    const balance = 1 - Math.abs(hScore - aScore);
    const dScore  = balance * 0.30 + 0.05; // base draw rate mundial ~30%

    const total = hScore + aScore + dScore;
    return {
      home: hScore / total,
      draw: dScore / total,
      away: aScore / total,
    };
  },

  /* ── Blend Poisson + weighted + regresion a base rates mundiales ── */
  _blendAndRegress(poissonP, weightedP) {
    // Base rates historicos mundiales (fase de grupos)
    const BASE = { home: 0.40, draw: 0.30, away: 0.30 };
    const R = 0.12; // regresion suave

    const blend = {
      home: poissonP.home * 0.60 + weightedP.home * 0.40,
      draw: poissonP.draw * 0.60 + weightedP.draw * 0.40,
      away: poissonP.away * 0.60 + weightedP.away * 0.40,
    };
    const reg = {
      home: blend.home * (1 - R) + BASE.home * R,
      draw: blend.draw * (1 - R) + BASE.draw * R,
      away: blend.away * (1 - R) + BASE.away * R,
    };
    const sum = reg.home + reg.draw + reg.away;
    return {
      home: Math.round(reg.home / sum * 100),
      draw: Math.round(reg.draw / sum * 100),
      away: Math.round(reg.away / sum * 100),
    };
  },

  /* ── Desglose H1/H2 usando h1Ratio real del perfil ── */
  _halfTimeBreakdown(goals, homeProfile, awayProfile) {
    const h1H = homeProfile.h1Ratio || 0.42;
    const h1A = awayProfile.h1Ratio || 0.42;
    const hH1 = +(goals.home * h1H).toFixed(2);
    const hH2 = +(goals.home * (1 - h1H)).toFixed(2);
    const aH1 = +(goals.away * h1A).toFixed(2);
    const aH2 = +(goals.away * (1 - h1A)).toFixed(2);
    return {
      firstHalf:  { home: hH1, away: aH1, total: +(hH1 + aH1).toFixed(2) },
      secondHalf: { home: hH2, away: aH2, total: +(hH2 + aH2).toFixed(2) },
    };
  },

  /* ── Corners esperados usando datos reales del perfil ── */
  _expectedCorners(homeProfile, awayProfile) {
    return +((homeProfile.corners + awayProfile.corners) / 2).toFixed(1);
  },

  /* ── Over 2.5 ── */
  _over25(total) {
    const p0 = this._poisson(total, 0);
    const p1 = this._poisson(total, 1);
    const p2 = this._poisson(total, 2);
    return Math.max(5, Math.min(95, Math.round((1 - p0 - p1 - p2) * 100)));
  },

  /* ── BTTS usando goles reales del perfil ── */
  _btts(homeProfile, awayProfile, goals) {
    const pHome = 1 - this._poisson(goals.home, 0);
    const pAway = 1 - this._poisson(goals.away, 0);
    // Ajuste por clean sheets reales
    const csAdj = (1 - homeProfile.cleanSheets) * (1 - awayProfile.cleanSheets);
    const combined = pHome * pAway * 0.65 + csAdj * 0.35;
    return Math.max(5, Math.min(95, Math.round(combined * 100)));
  },

  /* ── Nivel de riesgo ── */
  _riskLevel(probs) {
    const max = Math.max(probs.home, probs.draw, probs.away);
    if (max >= 56) return 'low';
    if (max >= 45) return 'medium';
    return 'high';
  },

  /* ── Confianza del analisis ── */
  _confidence(probs, homeTeam, awayTeam, homeProfile, awayProfile) {
    const maxP    = Math.max(probs.home, probs.draw, probs.away) / 100;
    const hCons   = this._formConsistency(homeTeam.form);
    const aCons   = this._formConsistency(awayTeam.form);
    const hRank   = this._getRankingScore(homeTeam.name);
    const aRank   = this._getRankingScore(awayTeam.name);
    const rankDiff = Math.abs(hRank - aRank);
    // Mas datos = mas confianza
    const dataPts = Math.min(1, (homeProfile.matchesPlayed + awayProfile.matchesPlayed) / 30);

    const raw = maxP * 0.35
              + ((hCons + aCons) / 2) * 0.25
              + rankDiff * 0.20
              + dataPts  * 0.20;

    const pct    = Math.round(Math.max(42, Math.min(88, raw * 100)));
    const margin = Math.round(Math.max(5, Math.min(18, 28 - pct * 0.22)));
    const level  = pct >= 70 ? 'high' : pct >= 54 ? 'medium' : 'low';
    return { pct, level, margin };
  },

  /* ── Insight natural en ES/EN ── */
  _generateInsight(homeTeam, awayTeam, probs, goals, homeProfile, awayProfile, lang) {
    const l = lang || (typeof I18n !== 'undefined' ? I18n.getLang() : 'es');
    const parts = [];
    const hName = homeTeam.name;
    const aName = awayTeam.name;
    const hRank = WC_FIFA_RANKINGS[this._norm(hName)] || 50;
    const aRank = WC_FIFA_RANKINGS[this._norm(aName)] || 50;
    const diff  = probs.home - probs.away;

    // 1. Apertura
    if (Math.abs(diff) <= 6) {
      parts.push(l === 'en'
        ? `Statistical analysis shows a very balanced World Cup match between ${hName} and ${aName}.`
        : `El analisis estadistico refleja un partido del Mundial muy equilibrado entre ${hName} y ${aName}.`);
    } else {
      const lead = diff > 0 ? hName : aName;
      const pct  = Math.max(probs.home, probs.away);
      parts.push(l === 'en'
        ? `The model gives ${lead} a statistical advantage (${pct}%) in this World Cup group match.`
        : `El modelo otorga ventaja estadistica a ${lead} (${pct}%) en este partido de grupos del Mundial.`);
    }

    // 2. Forma reciente
    const hFS = this._formScore(homeTeam.form);
    const aFS = this._formScore(awayTeam.form);
    if (hFS - aFS > 0.20) {
      parts.push(l === 'en'
        ? `${hName} arrives with better recent form, which is a key factor in short tournaments like the World Cup.`
        : `${hName} llega con mejor forma reciente, factor clave en torneos cortos como el Mundial.`);
    } else if (aFS - hFS > 0.20) {
      parts.push(l === 'en'
        ? `${aName} shows stronger recent form, which could offset any positional disadvantage.`
        : `${aName} muestra mejor forma reciente, lo que podria compensar cualquier desventaja posicional.`);
    }

    // 3. Ranking FIFA
    if (Math.abs(hRank - aRank) >= 15) {
      const better = hRank < aRank ? hName : aName;
      const worse  = hRank < aRank ? aName : hName;
      parts.push(l === 'en'
        ? `${better} holds a significant FIFA ranking advantage over ${worse}, though upsets are common at the World Cup.`
        : `${better} tiene una ventaja significativa en el ranking FIFA sobre ${worse}, aunque las sorpresas son frecuentes en el Mundial.`);
    }

    // 4. Ofensiva
    if (homeProfile.gf >= 1.8 && awayProfile.gf >= 1.8) {
      parts.push(l === 'en'
        ? `Both teams show strong offensive output (${homeProfile.gf} and ${awayProfile.gf} goals/game), suggesting a high-scoring match.`
        : `Ambas selecciones muestran alto poder ofensivo (${homeProfile.gf} y ${awayProfile.gf} goles/partido), lo que sugiere un partido con goles.`);
    } else if (homeProfile.cleanSheets >= 0.50 && awayProfile.cleanSheets >= 0.50) {
      parts.push(l === 'en'
        ? `Both teams have strong defensive records (${Math.round(homeProfile.cleanSheets*100)}% and ${Math.round(awayProfile.cleanSheets*100)}% clean sheets), pointing to a tight match.`
        : `Ambas selecciones tienen solidas defensas (${Math.round(homeProfile.cleanSheets*100)}% y ${Math.round(awayProfile.cleanSheets*100)}% de porterias a cero), apuntando a un partido cerrado.`);
    }

    // 5. Ventaja continental
    const hCont = WC_CONTINENTAL_BONUS[this._norm(hName)];
    const aCont = WC_CONTINENTAL_BONUS[this._norm(aName)];
    if (hCont) {
      parts.push(l === 'en'
        ? `${hName} benefits from home-continent advantage playing in North America.`
        : `${hName} se beneficia de la ventaja continental jugando en Norteamerica.`);
    } else if (aCont) {
      parts.push(l === 'en'
        ? `${aName} benefits from home-continent advantage playing in North America.`
        : `${aName} se beneficia de la ventaja continental jugando en Norteamerica.`);
    }

    return parts.join(' ');
  },

  /* ══════════════════════════════════════════════════════════════
     CAPA CONTEXTUAL — Ajuste por jornada y presión competitiva
     Se aplica ENCIMA del resultado base. No reemplaza el motor.
     Detecta matchday desde WC_FIXTURES y tabla del grupo.
  ══════════════════════════════════════════════════════════════ */

  /**
   * Detectar jornada (1, 2 o 3) del partido en el grupo.
   * Busca en WC_FIXTURES por nombres de equipo normalizados.
   * @returns {number} 1 | 2 | 3 — fallback: 1
   */
  _detectMatchday(homeName, awayName) {
    if (typeof WC_FIXTURES === 'undefined') return 1;
    const h = homeName.toLowerCase();
    const a = awayName.toLowerCase();
    const fixture = WC_FIXTURES.find(f =>
      f.home.toLowerCase() === h && f.away.toLowerCase() === a
    );
    if (!fixture || !fixture.round) return 1;
    // round format: "Grupo X - J1" | "Grupo X - J2" | "Grupo X - J3"
    const m = fixture.round.match(/J(\d)/);
    return m ? parseInt(m[1]) : 1;
  },

  /**
   * Obtener tabla actual del grupo para un equipo.
   * Usa WC_GROUPS de data.js (puntos, gd, gf actualizados en tiempo real
   * o los valores base si el torneo no ha comenzado).
   * @returns {{ pts, gd, gf, pos, played }} o null
   */
  _getGroupStanding(teamName) {
    if (typeof WC_GROUPS === 'undefined') return null;
    for (const [, teams] of Object.entries(WC_GROUPS)) {
      const t = teams.find(t => t.name === teamName || t.id === teamName);
      if (t) {
        return {
          pts:    t.points || 0,
          gd:     t.gd     || 0,
          gf:     t.gf     || 0,
          pos:    t.pos    || 1,
          played: t.played || 0,
          group:  t.group,
        };
      }
    }
    return null;
  },

  /**
   * Calcular necesidad de resultado para un equipo en jornada 3.
   * Analiza la tabla del grupo y determina qué resultado necesita.
   * @returns {'must_win'|'draw_ok'|'qualified'|'unknown'}
   */
  _calcNeed(standing, matchday) {
    if (!standing || matchday < 3) return 'unknown';
    const { pts, pos } = standing;
    // Con 6+ puntos en 2 partidos: ya clasificado
    if (pts >= 6) return 'qualified';
    // Con 4 puntos: empate puede clasificar (depende de otros)
    if (pts >= 4) return 'draw_ok';
    // Con 3 puntos: necesita ganar o esperar
    if (pts >= 3) return 'draw_ok';
    // Con 0-2 puntos: necesita ganar
    return 'must_win';
  },

  /**
   * Aplicar ajuste contextual por jornada y presión.
   * Modifica probs y goals de forma suave y proporcional.
   * Nunca produce NaN. Siempre renormaliza a 100%.
   *
   * @param {object} base   - resultado base del motor { probs, goals, over25, btts }
   * @param {number} matchday - 1 | 2 | 3
   * @param {object} homeStanding - tabla del equipo local
   * @param {object} awayStanding - tabla del equipo visitante
   * @param {string} homeName
   * @param {string} awayName
   * @param {string} lang
   * @returns {{ probs, goals, over25, btts, matchdayContext }}
   */
  _applyContextualAdjustment(base, matchday, homeStanding, awayStanding, homeName, awayName, lang) {
    const l = lang || 'es';
    let { probs, goals, over25, btts } = base;

    // Clonar para no mutar el original
    let p = { home: probs.home, draw: probs.draw, away: probs.away };
    let g = { home: goals.home, away: goals.away, total: goals.total };
    let o25 = over25;
    let bts = btts;
    const contextNotes = [];

    /* ── JORNADA 1: prudencia táctica ──
       Equipos más cautelosos, menos goles, más empates.
       Ajuste suave: +2 draw, -1 home, -1 away, xG -5% */
    if (matchday === 1) {
      p.draw += 2;
      p.home  = Math.max(5, p.home - 1);
      p.away  = Math.max(5, p.away - 1);
      g.home  = +(g.home * 0.95).toFixed(2);
      g.away  = +(g.away * 0.95).toFixed(2);
      g.total = +(g.home + g.away).toFixed(2);
      o25     = Math.max(5, o25 - 4);
      contextNotes.push(l === 'en'
        ? 'Matchday 1: teams tend to be tactically cautious, favouring draws.'
        : 'Jornada 1: los equipos suelen ser mas cautelosos tacticamente, favoreciendo el empate.');
    }

    /* ── JORNADA 2: presión parcial ──
       Equipo que perdió J1: más agresivo (+xG, +home/away según quien perdió).
       Equipo que ganó J1: ligera prudencia defensiva. */
    if (matchday === 2) {
      const hPlayed = homeStanding?.played || 0;
      const aPlayed = awayStanding?.played || 0;
      const hPts    = homeStanding?.pts    || 0;
      const aPts    = awayStanding?.pts    || 0;

      if (hPlayed >= 1 && hPts === 0) {
        // Local perdió J1 → más agresivo
        p.home  = Math.min(90, p.home + 4);
        p.draw  = Math.max(5,  p.draw - 2);
        g.home  = +(g.home * 1.08).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.min(95, o25 + 5);
        contextNotes.push(l === 'en'
          ? `${homeName} lost matchday 1 and needs points — expect higher offensive intensity.`
          : `${homeName} perdio la jornada 1 y necesita puntos — mayor intensidad ofensiva esperada.`);
      } else if (hPlayed >= 1 && hPts === 3) {
        // Local ganó J1 → ligera prudencia
        p.draw  = Math.min(50, p.draw + 1);
        p.home  = Math.max(5,  p.home - 1);
        g.home  = +(g.home * 0.97).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
      }

      if (aPlayed >= 1 && aPts === 0) {
        // Visitante perdió J1 → más agresivo
        p.away  = Math.min(90, p.away + 4);
        p.draw  = Math.max(5,  p.draw - 2);
        g.away  = +(g.away * 1.08).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.min(95, o25 + 5);
        contextNotes.push(l === 'en'
          ? `${awayName} lost matchday 1 and needs points — expect higher offensive intensity.`
          : `${awayName} perdio la jornada 1 y necesita puntos — mayor intensidad ofensiva esperada.`);
      } else if (aPlayed >= 1 && aPts === 3) {
        p.draw  = Math.min(50, p.draw + 1);
        p.away  = Math.max(5,  p.away - 1);
        g.away  = +(g.away * 0.97).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
      }
    }

    /* ── JORNADA 3: contexto crítico ──
       Analizar tabla y necesidad real de cada equipo. */
    if (matchday === 3) {
      const hNeed = this._calcNeed(homeStanding, 3);
      const aNeed = this._calcNeed(awayStanding, 3);

      // Ambos necesitan ganar → partido muy abierto
      if (hNeed === 'must_win' && aNeed === 'must_win') {
        g.home  = +(g.home * 1.12).toFixed(2);
        g.away  = +(g.away * 1.12).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.min(95, o25 + 10);
        bts     = Math.min(95, bts + 8);
        p.draw  = Math.max(5, p.draw - 5);
        contextNotes.push(l === 'en'
          ? 'Matchday 3: both teams must win to advance — expect an open, high-intensity match.'
          : 'Jornada 3: ambos equipos necesitan ganar para clasificar — partido abierto y de alta intensidad.');
      }

      // Empate clasifica a ambos → partido cerrado, posible acuerdo tactico
      else if (hNeed === 'draw_ok' && aNeed === 'draw_ok') {
        p.draw  = Math.min(55, p.draw + 8);
        p.home  = Math.max(5,  p.home - 4);
        p.away  = Math.max(5,  p.away - 4);
        g.home  = +(g.home * 0.88).toFixed(2);
        g.away  = +(g.away * 0.88).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.max(5, o25 - 8);
        contextNotes.push(l === 'en'
          ? 'Matchday 3: a draw is enough for both teams to qualify — expect a cautious, low-scoring match.'
          : 'Jornada 3: el empate clasifica a ambos equipos — partido cauteloso con pocos goles esperados.');
      }

      // Un equipo ya clasificado, el otro necesita ganar
      else if (hNeed === 'qualified' && aNeed === 'must_win') {
        p.away  = Math.min(90, p.away + 5);
        p.home  = Math.max(5,  p.home - 3);
        g.away  = +(g.away * 1.10).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.min(95, o25 + 6);
        contextNotes.push(l === 'en'
          ? `${homeName} is already qualified and may rotate; ${awayName} needs a win to advance.`
          : `${homeName} ya esta clasificado y puede rotar; ${awayName} necesita ganar para avanzar.`);
      }
      else if (hNeed === 'must_win' && aNeed === 'qualified') {
        p.home  = Math.min(90, p.home + 5);
        p.away  = Math.max(5,  p.away - 3);
        g.home  = +(g.home * 1.10).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.min(95, o25 + 6);
        contextNotes.push(l === 'en'
          ? `${homeName} needs a win to advance; ${awayName} is already qualified and may rotate.`
          : `${homeName} necesita ganar para avanzar; ${awayName} ya esta clasificado y puede rotar.`);
      }

      // Diferencia de gol importa (ambos con mismos puntos)
      const hGD = homeStanding?.gd || 0;
      const aGD = awayStanding?.gd || 0;
      if (homeStanding?.pts === awayStanding?.pts && Math.abs(hGD - aGD) <= 2) {
        g.home  = +(g.home * 1.05).toFixed(2);
        g.away  = +(g.away * 1.05).toFixed(2);
        g.total = +(g.home + g.away).toFixed(2);
        o25     = Math.min(95, o25 + 4);
        contextNotes.push(l === 'en'
          ? 'Goal difference could be decisive — both teams may push for more goals.'
          : 'La diferencia de gol puede ser decisiva — ambos equipos pueden buscar mas goles.');
      }
    }

    // Renormalizar probabilidades a 100%
    const sum = p.home + p.draw + p.away;
    if (sum > 0) {
      p.home = Math.round(p.home / sum * 100);
      p.draw = Math.round(p.draw / sum * 100);
      p.away = 100 - p.home - p.draw; // evitar redondeo que no sume 100
    }

    // Clamp final
    p.home = Math.max(5, Math.min(90, p.home));
    p.draw = Math.max(5, Math.min(60, p.draw));
    p.away = Math.max(5, Math.min(90, p.away));
    o25    = Math.max(5, Math.min(95, o25));
    bts    = Math.max(5, Math.min(95, bts));

    return {
      probs:  p,
      goals:  g,
      over25: o25,
      btts:   bts,
      matchdayContext: {
        matchday,
        homeNeed: this._calcNeed(homeStanding, matchday),
        awayNeed: this._calcNeed(awayStanding, matchday),
        notes:    contextNotes,
        // Texto de contexto para el insight
        summary: contextNotes.length > 0 ? contextNotes[0] : null,
      },
    };
  },

  /* ══════════════════════════════════════════════════════════════
     CAPA DE CONFEDERACIÓN — Ajuste por nivel global
     Se aplica DESPUÉS del ajuste contextual, ANTES del return.
     Máximo impacto: ±8% sobre probabilidades finales.
     Nunca afecta ligas.
  ══════════════════════════════════════════════════════════════ */

  /**
   * Coeficientes de fuerza por confederación.
   * UEFA = referencia base 1.00.
   * Basado en rendimiento histórico en mundiales y ranking FIFA promedio.
   */
  _CONFED_STRENGTH: {
    'UEFA':     1.00,
    'CONMEBOL': 0.98,
    'CONCACAF': 0.92,
    'CAF':      0.90,
    'AFC':      0.88,
    'OFC':      0.82,
  },

  /**
   * Mapa de selección → confederación.
   * Usa nombre normalizado (inglés interno).
   */
  _CONFED_MAP: {
    // UEFA
    'France':                  'UEFA',
    'Spain':                   'UEFA',
    'England':                 'UEFA',
    'Germany':                 'UEFA',
    'Portugal':                'UEFA',
    'Netherlands':             'UEFA',
    'Belgium':                 'UEFA',
    'Croatia':                 'UEFA',
    'Switzerland':             'UEFA',
    'Denmark':                 'UEFA',
    'Austria':                 'UEFA',
    'Turkey':                  'UEFA',
    'Serbia':                  'UEFA',
    'Scotland':                'UEFA',
    'Ukraine':                 'UEFA',
    'Italy':                   'UEFA',
    'Georgia':                 'UEFA',
    'Czech Republic':          'UEFA',
    'Sweden':                  'UEFA',
    'Norway':                  'UEFA',
    'Bosnia and Herzegovina':  'UEFA',
    'Slovakia':                'UEFA',
    'Poland':                  'UEFA',
    'Romania':                 'UEFA',
    'Albania':                 'UEFA',
    'Kosovo':                  'UEFA',
    'North Macedonia':         'UEFA',
    'Wales':                   'UEFA',
    'Northern Ireland':        'UEFA',
    'Republic of Ireland':     'UEFA',
    // CONMEBOL
    'Argentina':               'CONMEBOL',
    'Brazil':                  'CONMEBOL',
    'Colombia':                'CONMEBOL',
    'Uruguay':                 'CONMEBOL',
    'Ecuador':                 'CONMEBOL',
    'Chile':                   'CONMEBOL',
    'Peru':                    'CONMEBOL',
    'Paraguay':                'CONMEBOL',
    'Bolivia':                 'CONMEBOL',
    'Venezuela':               'CONMEBOL',
    // CONCACAF
    'United States':           'CONCACAF',
    'Mexico':                  'CONCACAF',
    'Canada':                  'CONCACAF',
    'Panama':                  'CONCACAF',
    'Honduras':                'CONCACAF',
    'Costa Rica':              'CONCACAF',
    'Jamaica':                 'CONCACAF',
    'Haiti':                   'CONCACAF',
    'Curacao':                 'CONCACAF',
    'Trinidad and Tobago':     'CONCACAF',
    // CAF
    'Morocco':                 'CAF',
    'Senegal':                 'CAF',
    'Egypt':                   'CAF',
    'Ivory Coast':             'CAF',
    'Ghana':                   'CAF',
    'Nigeria':                 'CAF',
    'South Africa':            'CAF',
    'Algeria':                 'CAF',
    'Tunisia':                 'CAF',
    'Cameroon':                'CAF',
    'DR Congo':                'CAF',
    'Cape Verde':              'CAF',
    // AFC
    'Japan':                   'AFC',
    'Korea Republic':          'AFC',
    'Iran':                    'AFC',
    'Saudi Arabia':            'AFC',
    'Australia':               'AFC',
    'Qatar':                   'AFC',
    'Iraq':                    'AFC',
    'Jordan':                  'AFC',
    'Uzbekistan':              'AFC',
    'Indonesia':               'AFC',
    // OFC
    'New Zealand':             'OFC',
  },

  /**
   * Obtener confederación de una selección.
   * Normaliza el nombre antes de buscar.
   * @param {string} name
   * @returns {string} confederación o 'UEFA' como fallback
   */
  getConfederation(name) {
    const normalized = this._norm(name);
    return this._CONFED_MAP[normalized] || 'UEFA';
  },

  /**
   * Aplicar ajuste por confederación a las probabilidades finales.
   * Se ejecuta DESPUÉS del ajuste contextual.
   * Máximo impacto: ±8% sobre cada probabilidad.
   *
   * Lógica:
   *   1. Obtener coeficiente de cada confederación
   *   2. Calcular diferencia relativa
   *   3. Aplicar ajuste proporcional suave
   *   4. Renormalizar a 100%
   *
   * @param {object} probs  - { home, draw, away } ya ajustadas por contexto
   * @param {string} homeName
   * @param {string} awayName
   * @param {string} lang
   * @returns {{ probs: object, confederationNote: string|null }}
   */
  _applyConfederationAdjustment(probs, homeName, awayName, lang) {
    const l = lang || 'es';

    const hConfed = this.getConfederation(homeName);
    const aConfed = this.getConfederation(awayName);
    const hStr    = this._CONFED_STRENGTH[hConfed] || 1.00;
    const aStr    = this._CONFED_STRENGTH[aConfed] || 1.00;

    // Si misma confederación: sin ajuste
    if (hConfed === aConfed) {
      return { probs: { ...probs }, confederationNote: null };
    }

    // Diferencia de coeficiente: positivo = home más fuerte
    const diff = hStr - aStr; // rango aprox: -0.18 a +0.18

    // Escalar a impacto máximo ±8 puntos porcentuales
    // diff=0.18 → ajuste=8pts | diff=0.10 → ajuste=4.4pts
    const MAX_IMPACT = 8;
    const adjustment = Math.round((diff / 0.18) * MAX_IMPACT);

    // Aplicar: home gana/pierde puntos, away lo contrario
    let p = {
      home: probs.home + adjustment,
      draw: probs.draw,               // draw no cambia directamente
      away: probs.away - adjustment,
    };

    // Clamp individual
    p.home = Math.max(5, Math.min(90, p.home));
    p.away = Math.max(5, Math.min(90, p.away));
    p.draw = Math.max(5, Math.min(55, p.draw));

    // Renormalizar a 100%
    const sum = p.home + p.draw + p.away;
    p.home = Math.round(p.home / sum * 100);
    p.draw = Math.round(p.draw / sum * 100);
    p.away = 100 - p.home - p.draw;

    // Nota para el insight (solo si el ajuste es significativo)
    let confederationNote = null;
    if (Math.abs(adjustment) >= 3) {
      const stronger = hStr >= aStr ? homeName : awayName;
      const weaker   = hStr >= aStr ? awayName : homeName;
      const sConfed  = hStr >= aStr ? hConfed  : aConfed;
      const wConfed  = hStr >= aStr ? aConfed  : hConfed;
      confederationNote = l === 'en'
        ? `${stronger} (${sConfed}) holds a confederation-level advantage over ${weaker} (${wConfed}), influencing the prediction.`
        : `${stronger} (${sConfed}) tiene ventaja de nivel de confederacion sobre ${weaker} (${wConfed}), lo que influye en la prediccion.`;
    }

    return { probs: p, confederationNote };
  },

  /* ══════════════════════════════════════════════════════════════
     SISTEMA ELO — Rating global de selecciones
     Fuente: basado en World Football Elo Ratings (eloratings.net)
     y ranking FIFA ponderado. Actualizado a Abril 2026.
     Default para equipos sin rating: 1600.
     Escala: ~1400 (débil) → ~2000 (élite mundial).
  ══════════════════════════════════════════════════════════════ */
  ELO_RATINGS: {
    'Argentina':              1985,
    'France':                 1970,
    'Spain':                  1960,
    'England':                1950,
    'Brazil':                 1965,
    'Portugal':               1930,
    'Netherlands':            1920,
    'Belgium':                1910,
    'Germany':                1900,
    'Colombia':               1870,
    'Uruguay':                1860,
    'Morocco':                1840,
    'Japan':                  1830,
    'United States':          1810,
    'Mexico':                 1800,
    'Croatia':                1820,
    'Switzerland':            1815,
    'Senegal':                1790,
    'Denmark':                1800,
    'Austria':                1790,
    'Turkey':                 1780,
    'Ecuador':                1760,
    'Korea Republic':         1770,
    'Canada':                 1750,
    'Australia':              1740,
    'Iran':                   1730,
    'Norway':                 1760,
    'Czech Republic':         1740,
    'Algeria':                1720,
    'Saudi Arabia':           1700,
    'Egypt':                  1710,
    'Paraguay':               1700,
    'Ivory Coast':            1710,
    'Sweden':                 1730,
    'Tunisia':                1680,
    'Ghana':                  1680,
    'South Africa':           1660,
    'Scotland':               1720,
    'Ukraine':                1730,
    'Italy':                  1850,
    'Georgia':                1680,
    'New Zealand':            1580,
    'Qatar':                  1620,
    'Panama':                 1640,
    'DR Congo':               1650,
    'Uzbekistan':             1640,
    'Jordan':                 1600,
    'Iraq':                   1610,
    'Cape Verde':             1590,
    'Haiti':                  1540,
    'Bosnia and Herzegovina': 1700,
    'Curacao':                1530,
    'Bolivia':                1640,
    'Venezuela':              1660,
    'Indonesia':              1520,
  },

  /**
   * Obtener ELO de una selección (normaliza nombre antes).
   * @param {string} name
   * @returns {number} rating ELO o 1600 por defecto
   */
  _getElo(name) {
    const normalized = this._norm(name);
    return this.ELO_RATINGS[normalized] || 1600;
  },

  /**
   * Convertir diferencia ELO a probabilidad logística.
   * Fórmula estándar: 1 / (1 + 10^(-diff/400))
   * @param {number} eloDiff - homeElo - awayElo
   * @returns {number} probabilidad de victoria local (0-1)
   */
  _eloToProb(eloDiff) {
    return 1 / (1 + Math.pow(10, -eloDiff / 400));
  },

  /**
   * Aplicar ajuste ELO sobre probabilidades post-confederación.
   * Orden: Poisson+weighted → contexto → confederación → ELO → final
   *
   * Reglas:
   *  - Si |eloDiff| < 50: sin ajuste (equipos muy similares)
   *  - Máximo impacto: ±10 puntos porcentuales
   *  - Nota en insight solo si impacto ≥ 3 puntos
   *  - Siempre renormaliza a 100%, clamp 5-95%
   *
   * @param {object} probs    - { home, draw, away } post-confederación
   * @param {string} homeName
   * @param {string} awayName
   * @param {string} lang
   * @returns {{ probs: object, eloNote: string|null, eloDiff: number }}
   */
  _applyEloAdjustment(probs, homeName, awayName, lang) {
    const l = lang || 'es';

    const homeElo = this._getElo(homeName);
    const awayElo = this._getElo(awayName);
    const eloDiff = homeElo - awayElo;

    // Caso especial: diferencia < 50 → sin ajuste
    if (Math.abs(eloDiff) < 50) {
      return { probs: { ...probs }, eloNote: null, eloDiff };
    }

    // Probabilidad logística ELO de victoria local
    const eloHomeProb = this._eloToProb(eloDiff);
    // Centrada en 0.5: cuánto se desvía del equilibrio
    const eloDeviation = eloHomeProb - 0.5; // rango: -0.5 a +0.5

    // Escalar a máximo ±10 puntos porcentuales
    // eloDeviation=0.5 (diff=∞) → 10pts | eloDeviation=0.1 (diff≈133) → 2pts
    const MAX_IMPACT = 10;
    const rawAdjustment = eloDeviation * MAX_IMPACT * 2; // *2 porque rango es ±0.5
    const adjustment = Math.max(-MAX_IMPACT, Math.min(MAX_IMPACT, rawAdjustment));
    const adjRounded = Math.round(adjustment);

    // Aplicar: home gana/pierde puntos, away lo contrario
    // Draw se reduce ligeramente cuando hay diferencia clara
    const drawReduction = Math.round(Math.abs(adjRounded) * 0.15);
    let p = {
      home: probs.home + adjRounded,
      draw: probs.draw - drawReduction,
      away: probs.away - adjRounded,
    };

    // Clamp individual
    p.home = Math.max(5, Math.min(90, p.home));
    p.draw = Math.max(5, Math.min(55, p.draw));
    p.away = Math.max(5, Math.min(90, p.away));

    // Renormalizar a 100%
    const sum = p.home + p.draw + p.away;
    p.home = Math.round(p.home / sum * 100);
    p.draw = Math.round(p.draw / sum * 100);
    p.away = 100 - p.home - p.draw;

    // Nota para el insight (solo si impacto ≥ 3 puntos)
    let eloNote = null;
    if (Math.abs(adjRounded) >= 3) {
      const stronger = eloDiff > 0 ? homeName : awayName;
      const hElo     = eloDiff > 0 ? homeElo  : awayElo;
      const aElo     = eloDiff > 0 ? awayElo  : homeElo;
      eloNote = l === 'en'
        ? `Global ELO rating difference (${hElo} vs ${aElo}) favours ${stronger}, influencing the final prediction.`
        : `La diferencia de rating ELO global (${hElo} vs ${aElo}) favorece a ${stronger}, influyendo en la prediccion final.`;
    }

    return { probs: p, eloNote, eloDiff };
  },

  /* ══════════════════════════════════════════════════════════════
     CALIBRACIÓN DE PROBABILIDADES
     Última capa del pipeline. Reduce sobreconfianza en favoritos.
     Basada en análisis histórico de mundiales: los modelos tienden
     a sobreestimar a favoritos claros en torneos cortos.
     Solo aplica en World Cup. Nunca en ligas.
  ══════════════════════════════════════════════════════════════ */

  /**
   * Tabla de calibración por rango de probabilidad.
   * factor < 1.00 → reduce sobreconfianza
   * factor = 1.00 → sin ajuste (zona equilibrada)
   */
  CALIBRATION_MAP: [
    { min:  0, max: 45, factor: 0.95 }, // prob baja: ligero boost (underdog)
    { min: 45, max: 55, factor: 1.00 }, // zona equilibrada: sin ajuste
    { min: 55, max: 65, factor: 0.97 }, // favorito leve: reducción mínima
    { min: 65, max: 75, factor: 0.94 }, // favorito claro: reducción moderada
    { min: 75, max: 100, factor: 0.90 }, // favorito fuerte: reducción mayor
  ],

  /**
   * Obtener factor de calibración para una probabilidad dada.
   * @param {number} prob - probabilidad en puntos (0-100)
   * @returns {number} factor de calibración
   */
  _getCalibrationFactor(prob) {
    for (const entry of this.CALIBRATION_MAP) {
      if (prob >= entry.min && prob < entry.max) return entry.factor;
    }
    return 0.90; // fallback para prob = 100
  },

  /**
   * Aplicar calibración a las probabilidades finales.
   * Última capa: Poisson → contexto → confederación → ELO → calibración → return
   *
   * @param {object} probs - { home, draw, away } post-ELO
   * @param {string} lang
   * @returns {{ probs: object, calibrationNote: string|null, adjusted: boolean }}
   */
  _applyCalibration(probs, lang) {
    const l = lang || 'es';

    // Guardar probs originales para calcular delta
    const original = { ...probs };

    // Aplicar factor a cada probabilidad
    const raw = {
      home: probs.home * this._getCalibrationFactor(probs.home),
      draw: probs.draw * this._getCalibrationFactor(probs.draw),
      away: probs.away * this._getCalibrationFactor(probs.away),
    };

    // Renormalizar a 100%
    const sum = raw.home + raw.draw + raw.away;
    if (sum <= 0) return { probs: { ...probs }, calibrationNote: null, adjusted: false };

    let p = {
      home: Math.round(raw.home / sum * 100),
      draw: Math.round(raw.draw / sum * 100),
      away: 0,
    };
    p.away = 100 - p.home - p.draw; // evitar error de redondeo

    // Clamp final
    p.home = Math.max(5, Math.min(90, p.home));
    p.draw = Math.max(5, Math.min(55, p.draw));
    p.away = Math.max(5, Math.min(90, p.away));

    // Renormalizar de nuevo tras clamp
    const sum2 = p.home + p.draw + p.away;
    p.home = Math.round(p.home / sum2 * 100);
    p.draw = Math.round(p.draw / sum2 * 100);
    p.away = 100 - p.home - p.draw;

    // Calcular delta máximo para decidir si mostrar nota
    const maxDelta = Math.max(
      Math.abs(p.home - original.home),
      Math.abs(p.draw - original.draw),
      Math.abs(p.away - original.away)
    );
    const adjusted = maxDelta >= 1;

    // Nota en insight solo si ajuste ≥ 3 puntos
    let calibrationNote = null;
    if (maxDelta >= 3) {
      calibrationNote = l === 'en'
        ? 'Probabilities calibrated to avoid overestimation of strong favourites in short tournaments.'
        : 'Probabilidades calibradas para evitar sobreestimacion de favoritos en torneos cortos.';
    }

    return { probs: p, calibrationNote, adjusted, maxDelta };
  },

  /* ══════════════════════════════════════════════════════════════
     PUNTO DE ENTRADA PRINCIPAL
     Interfaz compatible con PredictionEngine.analyze()
  ══════════════════════════════════════════════════════════════ */
  async analyze(homeTeam, awayTeam) {
    // Validar: solo para World Cup
    if (AppState.currentLeague !== 'WORLD_CUP') {
      console.error('[WC Predictor] Llamado fuera de contexto WORLD_CUP');
      return PredictionEngine.analyze(homeTeam, awayTeam);
    }

    // Normalizar nombres antes de cualquier calculo
    const homeName = this._norm(homeTeam.name || homeTeam.id);
    const awayName = this._norm(awayTeam.name || awayTeam.id);

    // Obtener perfiles estadisticos reales
    const homeProfile = this._getProfile(homeName);
    const awayProfile = this._getProfile(awayName);

    // Rankings FIFA
    const hRank = WC_FIFA_RANKINGS[homeName] || 50;
    const aRank = WC_FIFA_RANKINGS[awayName] || 50;
    const lang  = typeof I18n !== 'undefined' ? I18n.getLang() : 'es';

    // Calculos base
    const goals    = this._expectedGoals(homeProfile, awayProfile, hRank, aRank);
    const poissonP = this._poissonProbs(goals.home, goals.away);
    const weightedP = this._weightedProbs(homeTeam, awayTeam, homeProfile, awayProfile);
    const probs    = this._blendAndRegress(poissonP, weightedP);
    const halfTime = this._halfTimeBreakdown(goals, homeProfile, awayProfile);
    const over25   = this._over25(goals.total);
    const btts     = this._btts(homeProfile, awayProfile, goals);
    const corners  = this._expectedCorners(homeProfile, awayProfile);

    // ── Capa contextual: ajuste por jornada y presión competitiva ──
    const matchday      = this._detectMatchday(homeName, awayName);
    const homeStanding  = this._getGroupStanding(homeName);
    const awayStanding  = this._getGroupStanding(awayName);
    const ctx = this._applyContextualAdjustment(
      { probs, goals, over25, btts },
      matchday, homeStanding, awayStanding,
      homeName, awayName, lang
    );

    // Usar valores ajustados por contexto
    const finalProbs  = ctx.probs;
    const finalGoals  = ctx.goals;
    const finalOver25 = ctx.over25;
    const finalBtts   = ctx.btts;
    const finalHT = this._halfTimeBreakdown(finalGoals, homeProfile, awayProfile);

    const conf = this._confidence(finalProbs, homeTeam, awayTeam, homeProfile, awayProfile);

    // Insight base + nota contextual
    let insight = this._generateInsight(homeTeam, awayTeam, finalProbs, finalGoals, homeProfile, awayProfile, lang);
    if (ctx.matchdayContext.summary) {
      insight = `${insight} ${ctx.matchdayContext.summary}`;
    }

    // ── Capa de confederación: ajuste por nivel global ──
    // Se aplica DESPUÉS del ajuste contextual, ANTES del return.
    const confResult = this._applyConfederationAdjustment(finalProbs, homeName, awayName, lang);
    const finalProbsWithConfed = confResult.probs;
    if (confResult.confederationNote) {
      insight = `${insight} ${confResult.confederationNote}`;
    }

    // ── Capa ELO: ajuste por rating global ──
    // Se aplica DESPUÉS de confederación. Orden: Poisson → contexto → confederación → ELO → final
    const eloResult = this._applyEloAdjustment(finalProbsWithConfed, homeName, awayName, lang);
    const finalProbsWithElo = eloResult.probs;
    if (eloResult.eloNote) {
      insight = `${insight} ${eloResult.eloNote}`;
    }

    // Recalcular risk con probs finales (post-ELO)
    const finalRisk = this._riskLevel(finalProbsWithElo);

    // ── Calibración: última capa del pipeline ──
    // Orden: Poisson → contexto → confederación → ELO → calibración → return
    const calResult = this._applyCalibration(finalProbsWithElo, lang);
    const finalProbsCalibrated = calResult.probs;
    if (calResult.calibrationNote) {
      insight = `${insight} ${calResult.calibrationNote}`;
    }

    // Risk final con probs calibradas
    const riskFinal = this._riskLevel(finalProbsCalibrated);

    // H2H: usar fallback WC (no llamar backend con IDs string)
    const h2h = typeof ApiService !== 'undefined'
      ? await ApiService.getH2H(homeTeam.id, awayTeam.id)
      : { hw: 2, d: 1, aw: 2, goals: [1.2, 1.1], source: 'fallback' };

    return {
      homeTeam, awayTeam, h2h,
      probs:      finalProbsCalibrated,
      goals:      finalGoals,
      halfTime:   finalHT,
      over25:     finalOver25,
      btts:       finalBtts,
      corners,
      risk:       riskFinal,
      confidence: conf,
      insight,
      fuentesUsadas: 'local_wc',
      wcProfiles:    { home: homeProfile, away: awayProfile },
      matchdayContext: ctx.matchdayContext,
      confederations: {
        home: { name: homeName, confed: this.getConfederation(homeName), strength: this._CONFED_STRENGTH[this.getConfederation(homeName)] },
        away: { name: awayName, confed: this.getConfederation(awayName), strength: this._CONFED_STRENGTH[this.getConfederation(awayName)] },
      },
      eloRatings: {
        home:    this._getElo(homeName),
        away:    this._getElo(awayName),
        diff:    eloResult.eloDiff,
        applied: Math.abs(eloResult.eloDiff) >= 50,
      },
      calibration: {
        applied:  calResult.adjusted,
        maxDelta: calResult.maxDelta || 0,
      },
    };
  },
};

// Exportar para Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorldCupPredictionEngine };
}

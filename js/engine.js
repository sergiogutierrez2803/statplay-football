/**
 * StatPlay Football — engine.js v2.0
 * Motor predictivo mejorado:
 *  - Probabilidades Poisson (más estables)
 *  - Modelo Dixon-Coles de fuerza ataque/defensa
 *  - Desglose goles por tiempo H1/H2
 *  - Margen de error estimado
 *  - IA coherente y prudente
 */

const LEAGUE = {
  homeAvg: 1.30,  // promedio goles local PL 2025-26
  awayAvg: 0.95,  // promedio goles visitante PL 2025-26
  base: { home: 0.46, draw: 0.26, away: 0.28 }, // base rates PL histórico
};

// Promedios por liga para cálculo Dixon-Coles más preciso
const LEAGUE_AVGS = {
  PL: { homeAvg: 1.30, awayAvg: 0.95, base: { home: 0.46, draw: 0.26, away: 0.28 } },
  BL: { homeAvg: 1.55, awayAvg: 1.10, base: { home: 0.48, draw: 0.24, away: 0.28 } },
  LL: { homeAvg: 1.45, awayAvg: 1.05, base: { home: 0.47, draw: 0.27, away: 0.26 } },
  SA: { homeAvg: 1.40, awayAvg: 1.00, base: { home: 0.46, draw: 0.29, away: 0.25 } },
  // [FASE 7] World Cup: promedios internacionales, sin ventaja local real
  // Promedio histórico mundiales: ~2.5 goles/partido, tendencia al empate más alta que PL
  WORLD_CUP: { homeAvg: 1.20, awayAvg: 1.20, base: { home: 0.38, draw: 0.32, away: 0.30 } },
};

const PredictionEngine = {

  async analyze(homeTeam, awayTeam, wcOptions = {}) {
    const h2h = await ApiService.getH2H(homeTeam.id, awayTeam.id);

    // Seleccionar promedios de liga correctos según la liga activa
    const leagueKey = AppState.currentLeague || 'PL';
    const leagueAvg = LEAGUE_AVGS[leagueKey] || LEAGUE_AVGS.PL;
    LEAGUE.homeAvg = leagueAvg.homeAvg;
    LEAGUE.awayAvg = leagueAvg.awayAvg;
    LEAGUE.base    = leagueAvg.base;

    // [FASE 7] World Cup: sin ventaja local, H2H reducido
    if (wcOptions.noHomeAdvantage) {
      // Igualar promedios home/away para eliminar ventaja de localía
      const avg = (LEAGUE.homeAvg + LEAGUE.awayAvg) / 2;
      LEAGUE.homeAvg = avg;
      LEAGUE.awayAvg = avg;
    }

    const goals      = this._expectedGoals(homeTeam, awayTeam, h2h, wcOptions);
    const poissonP   = this._poissonMatchProb(goals.home, goals.away);
    const weightedP  = this._weightedProbs(homeTeam, awayTeam, h2h, wcOptions);
    const probs      = this._blendAndRegress(poissonP, weightedP);
    const halfTime   = this._halfTimeBreakdown(goals, homeTeam, awayTeam);
    const over25     = this._over25Prob(goals.total);
    const btts       = this._bttsProbability(homeTeam, awayTeam, goals);
    const corners    = this._expectedCorners(homeTeam, awayTeam);
    const risk       = this._riskLevel(probs);
    const confidence = this._confidence(probs, homeTeam, awayTeam, h2h);
    const insight    = this._generateInsight(homeTeam, awayTeam, probs, goals, h2h, risk, halfTime);

    return { homeTeam, awayTeam, h2h, probs, goals, halfTime, over25, btts, corners, risk, confidence, insight };
  },

  /* ── Dixon-Coles xG ── */
  _expectedGoals(home, away, h2h, wcOptions = {}) {
    const homeAtk  = home.homeGoalsFor      / LEAGUE.homeAvg;
    const awayDef  = away.awayGoalsAgainst  / LEAGUE.awayAvg;
    let xGHome     = homeAtk * awayDef * LEAGUE.homeAvg;

    const awayAtk  = away.awayGoalsFor      / LEAGUE.awayAvg;
    const homeDef  = home.homeGoalsAgainst  / LEAGUE.homeAvg;
    let xGAway     = awayAtk * homeDef * LEAGUE.awayAvg;

    // [FASE 7] H2H reducido 30% para World Cup
    const h2hBlend = wcOptions.h2hWeight ?? 1.0;
    if (h2h.goals?.length === 2) {
      xGHome = xGHome * (1 - 0.20 * h2hBlend) + h2h.goals[0] * (0.20 * h2hBlend);
      xGAway = xGAway * (1 - 0.20 * h2hBlend) + h2h.goals[1] * (0.20 * h2hBlend);
    }

    xGHome = Math.max(0.35, Math.min(3.20, xGHome));
    xGAway = Math.max(0.35, Math.min(3.20, xGAway));

    return { home: +xGHome.toFixed(2), away: +xGAway.toFixed(2), total: +(xGHome + xGAway).toFixed(2) };
  },

  /* ── Poisson helpers ── */
  _factorial: [1, 1, 2, 6, 24, 120, 720, 5040, 40320],
  _poisson(lambda, k) {
    return Math.exp(-lambda) * Math.pow(lambda, k) / (this._factorial[k] ?? 40320);
  },

  _poissonMatchProb(xGH, xGA) {
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

  /* ── Weighted score model ── */
  _weightedProbs(home, away, h2h, wcOptions = {}) {
    const hForm = this._formScore(home.form);
    const aForm = this._formScore(away.form);
    // [FASE 7] H2H reducido para World Cup (menos partidos históricos relevantes)
    const h2hMult  = (leagueKey === 'WORLD_CUP') ? 0.30 : (wcOptions.h2hWeight ?? 1.0);
    const h2hTotal = h2h.hw + h2h.d + h2h.aw + 0.001;

    // pos puede ser undefined si viene de DB sin ese campo — usar 10 como fallback neutro
    const homePos = home.pos || 10;
    const awayPos = away.pos || 10;
    const leagueKey = AppState.currentLeague || 'PL';
    const totalTeams = leagueKey === 'BL' ? 18 : leagueKey === 'WORLD_CUP' ? 32 : 20;

    const hScore =
      hForm               * 0.35 +
      home.homeWinRate    * 0.25 +
      (h2h.hw / h2hTotal) * (0.20 * h2hMult) +
      ((1 - (homePos - 1) / totalTeams)) * 0.20;

    const aScore =
      aForm              * 0.35 +
      away.awayWinRate   * 0.25 +
      (h2h.aw / h2hTotal)* (0.20 * h2hMult) +
      ((1 - (awayPos - 1) / totalTeams)) * 0.20;

    const dScore = (h2h.d / h2hTotal) * 0.4 + (1 - Math.abs(hScore - aScore)) * 0.35 * 0.4;
    const total  = hScore + aScore + dScore;
    return { home: hScore / total, draw: dScore / total, away: aScore / total };
  },

  /* ── Blend Poisson + weighted, regress to base rates ── */
  _blendAndRegress(poisson, weighted) {
    const R = 0.15;
    const blend = {
      home: poisson.home * 0.65 + weighted.home * 0.35,
      draw: poisson.draw * 0.65 + weighted.draw * 0.35,
      away: poisson.away * 0.65 + weighted.away * 0.35,
    };
    const reg = {
      home: blend.home * (1 - R) + LEAGUE.base.home * R,
      draw: blend.draw * (1 - R) + LEAGUE.base.draw * R,
      away: blend.away * (1 - R) + LEAGUE.base.away * R,
    };
    const sum = reg.home + reg.draw + reg.away;
    return {
      home: Math.round(reg.home / sum * 100),
      draw: Math.round(reg.draw / sum * 100),
      away: Math.round(reg.away / sum * 100),
    };
  },

  /* ── Halftime breakdown ── */
  _halfTimeBreakdown(goals, home, away) {
    const h1H = home.h1ScoringRatio ?? 0.42;
    const h1A = away.h1ScoringRatio ?? 0.42;

    const hH1 = +(goals.home * h1H).toFixed(2);
    const hH2 = +(goals.home * (1 - h1H)).toFixed(2);
    const aH1 = +(goals.away * h1A).toFixed(2);
    const aH2 = +(goals.away * (1 - h1A)).toFixed(2);

    return {
      firstHalf:  { home: hH1, away: aH1, total: +(hH1 + aH1).toFixed(2) },
      secondHalf: { home: hH2, away: aH2, total: +(hH2 + aH2).toFixed(2) },
    };
  },

  /* ── Secondary stats ── */
  _over25Prob(total) {
    const p0 = this._poisson(total, 0);
    const p1 = this._poisson(total, 1);
    const p2 = this._poisson(total, 2);
    return Math.round((1 - p0 - p1 - p2) * 100);
  },

  _bttsProbability(home, away, goals) {
    const pHome = 1 - this._poisson(goals.home, 0);
    const pAway = 1 - this._poisson(goals.away, 0);
    return Math.round(pHome * pAway * 100);
  },

  _expectedCorners(home, away) {
    return +((home.avgCorners + away.avgCorners) / 2).toFixed(1);
  },

  /* ── Risk ── */
  _riskLevel(probs) {
    const max = Math.max(probs.home, probs.draw, probs.away);
    if (max >= 56) return 'low';
    if (max >= 45) return 'medium';
    return 'high';
  },

  /* ── Confidence + Margin of Error ── */
  _confidence(probs, home, away, h2h) {
    const maxP    = Math.max(probs.home, probs.draw, probs.away) / 100;
    const hCons   = this._formConsistency(home.form);
    const aCons   = this._formConsistency(away.form);
    const sample  = Math.min(1, (h2h.hw + h2h.d + h2h.aw) / 5);
    // pos puede ser undefined si viene de DB — usar 10 como fallback neutro
    const homePos = home.pos || 10;
    const awayPos = away.pos || 10;
    const leagueKey2 = AppState.currentLeague || 'PL';
    const totalTeams = leagueKey2 === 'BL' ? 18 : leagueKey2 === 'WORLD_CUP' ? 32 : 20;
    const posDiff = Math.abs(homePos - awayPos) / (totalTeams - 1);

    const raw = maxP * 0.45 + ((hCons + aCons) / 2) * 0.25 + sample * 0.20 + posDiff * 0.10;
    const pct = Math.round(Math.max(42, Math.min(92, raw * 100)));
    const margin = Math.round(Math.max(5, Math.min(18, 28 - pct * 0.22)));

    let level = 'low';
    if (pct >= 72) level = 'high';
    else if (pct >= 55) level = 'medium';

    return { pct, level, margin };
  },

  /* ── Form helpers ── */
  _formScore(form = []) {
    const weights = [0.30, 0.25, 0.20, 0.15, 0.10];
    const pts = { W: 3, D: 1, L: 0 };
    const score = form.reduce((acc, r, i) => acc + (pts[r] ?? 0) * (weights[i] ?? 0.10), 0);
    return score / 3;
  },

  _formConsistency(form = []) {
    const pts = form.map(r => r === 'W' ? 1 : r === 'D' ? 0.5 : 0);
    const avg = pts.reduce((a, b) => a + b, 0) / (pts.length || 1);
    const variance = pts.reduce((a, b) => a + (b - avg) ** 2, 0) / (pts.length || 1);
    return 1 - Math.min(1, variance * 2);
  },

  /* ── AI Insight — usa I18n para ES/EN ── */
  _generateInsight(home, away, probs, goals, h2h, risk, ht) {
    // Delegar al sistema centralizado de i18n
    // I18n.buildInsight aplica el idioma activo automáticamente
    return I18n.buildInsight(home, away, probs, ht, h2h, risk);
  },
};

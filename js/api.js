/**
 * StatPlay Football — api.js
 * Capa de datos híbrida:
 *  - Fuente principal: backend (Football-Data.org + API-Football)
 *  - Fallback: datos locales de data.js
 *
 * URL del backend:
 *  - Local:      http://localhost:3000/api
 *  - Producción: definida en window.__BACKEND_URL__ (inyectada por index.html)
 */

const API_CONFIG = {
  // Prioridad: variable global inyectada → variable de entorno → localhost
  baseUrl: (typeof window !== 'undefined' && window.__BACKEND_URL__)
    ? window.__BACKEND_URL__
    : 'http://localhost:3000/api',
};

const ApiService = {

  /* ── Ligas desde DB ── */
  async getLeagues() {
    let leagues = [];
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/leagues`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) leagues = data;
      }
    } catch (e) {
      console.error('[ApiService] Leagues Fetch Error:', { url: `${API_CONFIG.baseUrl}/leagues`, error: e.message });
      console.warn('Leagues fetch failed, using local data:', e.message);
    }

    // Si el backend no devolvió nada, usar datos locales
    if (!leagues.length) {
      leagues = Object.values(LEAGUES).map(l => ({
        id: l.id, nombre: l.name, name: l.name, pais: l.country,
        emoji: l.emoji, accentColor: l.accentColor, accent_color: l.accentColor,
        logoUrl: l.logoUrl, sdbId: l.sdbId
      }));
    }

    // Siempre añadir WORLD_CUP si no viene del backend
    const hasWC = leagues.some(l => l.id === 'WORLD_CUP');
    if (!hasWC) {
      const wc = LEAGUES['WORLD_CUP'];
      leagues.push({
        id: wc.id, nombre: wc.name, name: wc.name, pais: wc.country,
        emoji: wc.emoji, accentColor: wc.accentColor, accent_color: wc.accentColor,
        logoUrl: wc.logoUrl, logoFallback: wc.logoFallback, sdbId: null,
        isWorldCup: true,
      });
    }

    return leagues;
  },

  /* ── League Logo from TheSportsDB (lookup) ── */
  async fetchLeagueLogo(sdbId) {
    if (!sdbId) return null;
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=${sdbId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.leagues?.[0]?.strBadge || null;
    } catch {
      return null;
    }
  },

  /* ── Teams ── */
  async getTeams() {
    const leagueId = AppState.currentLeague || 'PL';
    // [FASE 8] World Cup: devolver selecciones con nombres normalizados
    if (leagueId === 'WORLD_CUP') return this.getWCTeams();
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/teams/${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Teams fetch failed, using local data:', e.message);
    }
    // Fallback a datos locales de data.js
    const localTeams = leagueId === 'BL' ? BL_TEAMS : leagueId === 'LL' ? LL_TEAMS : leagueId === 'SA' ? SA_TEAMS : PL_TEAMS;
    return localTeams.map(t => ({
      id: t.id, name: t.name, shortName: t.shortName,
      emoji: t.emoji, logoUrl: null, pos: t.pos, points: t.points
    }));
  },

  /* ── Standings ── */
  async getStandings() {
    const leagueId = AppState.currentLeague || 'PL';
    // [FASE 3] World Cup: standings agrupados (devuelve array de grupos)
    if (leagueId === 'WORLD_CUP') return this.getWCGroupedStandings();
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/standings/${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Standings fetch failed, using local data:', e.message);
    }
    // Fallback a datos locales
    return this._mockStandings();
  },

  /* ── Team Stats ── */
  async getTeamStats(teamId) {
    try {
      const statsRes = await fetch(`${API_CONFIG.baseUrl}/stats/${teamId}`);
      const infoRes  = await fetch(`${API_CONFIG.baseUrl}/teams/info/${teamId}`);

      if (statsRes.ok && infoRes.ok) {
        const stats = await statsRes.json();
        const team  = await infoRes.json();

        if (stats && team) {
          // La forma puede venir como "W-W-D-L-W" (seedStats) o "WWDLW" (sync API)
          let formArray = [];
          if (stats.forma) {
            formArray = stats.forma.includes('-') ? stats.forma.split('-') : stats.forma.split('');
          }

          return {
            ...team,
            homeGoalsFor:     parseFloat(stats.h_gf)            || 1.3,
            homeGoalsAgainst: parseFloat(stats.h_ga)            || 1.0,
            homeWinRate:      parseFloat(stats.h_win_rate)      || 0.45,
            homeDrawRate:     parseFloat(stats.h_draw_rate)     || 0.25,
            awayGoalsFor:     parseFloat(stats.a_gf)            || 1.1,
            awayGoalsAgainst: parseFloat(stats.a_ga)            || 1.2,
            awayWinRate:      parseFloat(stats.a_win_rate)      || 0.35,
            awayDrawRate:     parseFloat(stats.a_draw_rate)     || 0.25,
            avgCorners:       parseFloat(stats.avg_corners)     || 5.0,
            h1ScoringRatio:   parseFloat(stats.h1_scoring_ratio) || 0.42,
            form: formArray
          };
        }
      }
    } catch (e) {
      console.error('[ApiService] TeamStats Fetch Error:', { teamId, error: e.message });
      console.warn('TeamStats fetch failed, using local data:', e.message);
    }

    // Fallback a datos locales de data.js
    const leagueId = AppState.currentLeague || 'PL';
    const localTeams = leagueId === 'BL' ? BL_TEAMS : PL_TEAMS;
    const localTeam = localTeams.find(t => t.id === teamId);
    if (localTeam) return { ...localTeam, shortName: localTeam.shortName };
    return null;
  },

  /* ── H2H ── */
  async getH2H(homeId, awayId) {
    // [FASE 9] World Cup: IDs son strings, no llamar al backend
    if (AppState.currentLeague === 'WORLD_CUP' || isNaN(homeId) || isNaN(awayId)) {
      return this._generateWCH2H(homeId, awayId);
    }

    // 1. Intentar desde el backend (que llama a API-Football)
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/h2h/${homeId}/${awayId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.hw !== undefined)) return data;
      }
    } catch (e) {
      // servidor no disponible, usar datos locales
    }

    // 2. Buscar en H2H_DATA local
    const key1 = `${homeId}_${awayId}`;
    const key2 = `${awayId}_${homeId}`;
    if (H2H_DATA[key1]) return H2H_DATA[key1];
    if (H2H_DATA[key2]) {
      const d = H2H_DATA[key2];
      return { hw: d.aw, d: d.d, aw: d.hw, goals: [d.goals[1], d.goals[0]] };
    }

    // 3. Fallback genérico
    return this._generateH2H(homeId, awayId);
  },

  /* ── Advanced Metrics — Over/Under, BTTS, Tarjetas ── */
  async getAdvancedMetrics(homeId, awayId, xGTotal, btts) {
    const ligaId = AppState.currentLeague || 'PL';
    try {
      const res = await fetch(
        `${API_CONFIG.baseUrl}/advanced/${homeId}/${awayId}?liga=${ligaId}&xg=${xGTotal}&btts=${btts}`
      );
      if (res.ok) {
        const data = await res.json();
        if (!data.error) return data;
      }
    } catch (e) {
      console.warn('Advanced metrics failed:', e.message);
    }
    return null;
  },

  /* ── Upcoming Matches — desde Football-Data.org en tiempo real ── */
  async getUpcomingMatches() {
    const leagueId = AppState.currentLeague || 'PL';

    // [FASE 6] World Cup: usar fixtures locales
    if (leagueId === 'WORLD_CUP') {
      const matches = this.getWCFixtures();
      return { ok: true, source: 'local_wc', matches };
    }

    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/upcoming/${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.error('[ApiService] Upcoming Fetch Error:', { leagueId, error: e.message });
      console.warn('Upcoming fetch failed:', e.message);
    }
    return { ok: false, source: 'error', matches: [], reason: 'No se pudo conectar con el servidor.' };
  },

  /* ── Featured Matches (Fixtures) ── */
  async getFeaturedMatches() {
    const leagueId = AppState.currentLeague || 'PL';
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/fixtures/${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return data.map(m => ({
            id: m.id,
            home: m.homeTeam.id,
            away: m.awayTeam.id,
            round: m.jornada,
            date: typeof m.fecha === 'string' ? m.fecha.split('T')[0] : m.fecha,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam
          }));
        }
      }
    } catch (e) {
      console.warn('Fixtures fetch failed, using local data:', e.message);
    }

    // Fallback a datos locales de data.js
    const featuredList = leagueId === 'BL' ? BL_FEATURED_MATCHES
      : leagueId === 'LL' ? LL_FEATURED_MATCHES
      : leagueId === 'SA' ? SA_FEATURED_MATCHES
      : FEATURED_MATCHES;
    const teams = leagueId === 'BL' ? BL_TEAMS : leagueId === 'LL' ? LL_TEAMS : leagueId === 'SA' ? SA_TEAMS : PL_TEAMS;
    return featuredList.map(m => {
      const homeTeam = teams.find(t => t.id === m.home);
      const awayTeam = teams.find(t => t.id === m.away);
      return { id: `${m.home}_${m.away}`, home: m.home, away: m.away, round: m.round, date: m.date, homeTeam, awayTeam };
    }).filter(m => m.homeTeam && m.awayTeam);
  },

  /* ── Predicción Directa desde DB ── */
  async getStoredPrediction(homeId, awayId) {
    const ligaId = AppState.currentLeague || 'PL';
    try {
      // 1. Intentar motor híbrido en tiempo real (genera + guarda en DB)
      const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'es';
      const res = await fetch(`${API_CONFIG.baseUrl}/predict/${homeId}/${awayId}?liga=${ligaId}&lang=${lang}`);
      if (res.ok) {
        const p = await res.json();
        if (p && p.probs) return p; // ya viene con todos los campos
      }
    } catch (e) {
      console.warn('Predict endpoint failed:', e.message);
    }

    // 2. Fallback: predicción guardada en DB
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/analysis/${homeId}/${awayId}`);
      if (!res.ok) return null;
      const p = await res.json();
      if (!p || !p.prob_local) return null;

      const hasHalfTime = p.xg_h1_local != null && p.xg_h1_visitante != null;
      const probs = { home: p.prob_local || 0, draw: p.prob_empate || 0, away: p.prob_visitante || 0 };
      const xGHome = (p.xg_h1_local || 0) + (p.xg_h2_local || 0);
      const xGAway = (p.xg_h1_visitante || 0) + (p.xg_h2_visitante || 0);
      const total  = +(xGHome + xGAway).toFixed(2);
      const maxP   = Math.max(probs.home, probs.draw, probs.away);

      return {
        probs,
        goals: { home: +xGHome.toFixed(2), away: +xGAway.toFixed(2), total },
        halfTime: hasHalfTime ? {
          firstHalf:  { home: p.xg_h1_local, away: p.xg_h1_visitante, total: +(p.xg_h1_local + p.xg_h1_visitante).toFixed(2) },
          secondHalf: { home: p.xg_h2_local, away: p.xg_h2_visitante, total: +(p.xg_h2_local + p.xg_h2_visitante).toFixed(2) }
        } : null,
        over25: Math.round((1 - Math.exp(-total) * (1 + total + total**2/2)) * 100),
        btts: Math.round((1 - Math.exp(-xGHome)) * (1 - Math.exp(-xGAway)) * 100),
        corners: 5.5,
        risk: maxP >= 56 ? 'low' : maxP >= 45 ? 'medium' : 'high',
        confidence: { pct: p.nivel_confianza || 60, level: (p.nivel_confianza || 60) >= 72 ? 'high' : (p.nivel_confianza || 60) >= 55 ? 'medium' : 'low', margin: 10 },
        insight: p.insight || '',
        fuentesUsadas: p.fuentes_usadas || 'local'
      };
    } catch (e) {
      return null;
    }
  },

  /* ── Private helpers ── */
  _mockStandings() {
    const leagueId = AppState.currentLeague;
    const teamsData = leagueId === 'BL' ? BL_TEAMS
      : leagueId === 'LL' ? LL_TEAMS
      : leagueId === 'SA' ? SA_TEAMS
      : PL_TEAMS;
    return [...teamsData]
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
      .map((t, i) => ({
        position: i + 1,
        team: t,
        played: t.played,
        won:    t.won,
        drawn:  t.drawn,
        lost:   t.lost,
        gf:     t.gf,
        ga:     t.ga,
        gd:     t.gd,
        points: t.points,
        form:   t.form,
      }));
  },

  _generateH2H(homeId, awayId) {
    const leagueId = AppState.currentLeague;
    const teams = leagueId === 'BL' ? BL_TEAMS
      : leagueId === 'LL' ? LL_TEAMS
      : leagueId === 'SA' ? SA_TEAMS
      : PL_TEAMS;
    const home = teams.find(t => t.id === homeId);
    const away = teams.find(t => t.id === awayId);
    if (!home || !away) return { hw: 2, d: 1, aw: 2, goals: [1.5, 1.5] };
    const homeStrength = home.homeWinRate;
    const awayStrength = away.awayWinRate;
    const total = homeStrength + awayStrength + 0.25;
    return {
      hw: Math.round((homeStrength / total) * 5),
      d:  1,
      aw: Math.round((awayStrength / total) * 5),
      goals: [
        +((home.homeGoalsFor + away.awayGoalsAgainst) / 2).toFixed(1),
        +((away.awayGoalsFor + home.homeGoalsAgainst) / 2).toFixed(1),
      ],
    };
  },

  // [FASE 9] H2H para selecciones nacionales — basado en fuerza relativa
  _generateWCH2H(homeId, awayId) {
    const home = WC_TEAMS.find(t => String(t.id) === String(homeId));
    const away = WC_TEAMS.find(t => String(t.id) === String(awayId));
    if (!home || !away) return { hw: 2, d: 1, aw: 2, goals: [1.3, 1.1], source: 'fallback' };
    const hStr = home.homeWinRate;
    const aStr = away.awayWinRate;
    const total = hStr + aStr + 0.25;
    return {
      hw:    Math.round((hStr / total) * 5),
      d:     1,
      aw:    Math.round((aStr / total) * 5),
      goals: [
        +((home.homeGoalsFor + away.awayGoalsAgainst) / 2).toFixed(1),
        +((away.awayGoalsFor + home.homeGoalsAgainst) / 2).toFixed(1),
      ],
      source: 'fallback',
    };
  },

  /* ══════════════════════════════════════════
     WORLD CUP — métodos específicos
     Encapsulados aquí, no modifican los métodos de ligas.
  ══════════════════════════════════════════ */

  /** Lista plana de 48 selecciones para el buscador.
   *  Fuente maestra: WorldCupGroups (worldCupGroups.js) */
  getWCTeams() {
    if (typeof WorldCupGroups !== 'undefined') {
      return WorldCupGroups.getAllTeams().map(t => ({
        id:        t.id,
        name:      t.name,
        shortName: t.shortName,
        emoji:     t.emoji,
        group:     t.group,
        // FlagsMap como fuente única — w320 para mejor calidad
        logoUrl:   (typeof FlagsMap !== 'undefined')
          ? FlagsMap.getFlag(t.name)
          : (t.flagUrl || null),
        pos: 0, points: 0,
      }));
    }
    return WC_TEAMS.map(t => ({
      id: t.id, name: t.name, shortName: t.shortName,
      emoji: t.emoji, group: t.group,
      logoUrl: (typeof FlagsMap !== 'undefined') ? FlagsMap.getFlag(t.name) : null,
      pos: 0, points: 0,
    }));
  },

  /** Standings agrupados por grupo.
   *  Fuente maestra: WorldCupGroups + FlagsMap para banderas */
  getWCGroupedStandings() {
    // worldCupGroups contiene arrays de strings (nombres de equipos).
    // getGroupTeams() los convierte en objetos completos con name, shortName, emoji, flagUrl.
    const buildStandings = (groupLetters) => groupLetters.map(([g]) => ({
      group: g,
      teams: (typeof WorldCupGroups !== 'undefined'
        ? WorldCupGroups.getGroupTeams(g)
        : (WC_GROUPS?.[g] || []).map((name, i) => ({ id: name, name, shortName: name.substring(0,3).toUpperCase(), emoji: '🌍', flagUrl: null, pos: i+1, points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, form: [] }))
      ).map((t, i) => ({
        position: i + 1,
        team: {
          id:        t.id || t.name,
          name:      t.name,
          shortName: t.shortName,
          emoji:     t.emoji,
          logoUrl:   (typeof FlagsMap !== 'undefined')
            ? FlagsMap.getFlag(t.name)
            : (t.flagUrl || null),
        },
        played: t.played || 0, won: t.won || 0, drawn: t.drawn || 0, lost: t.lost || 0,
        gf: t.gf || 0, ga: t.ga || 0, gd: t.gd || 0, points: t.points || 0,
        form: t.form || [],
      })),
    }));

    if (typeof WorldCupGroups !== 'undefined') {
      // Usar las letras de grupo del objeto worldCupGroups
      return buildStandings(Object.entries(WorldCupGroups.groups));
    }
    return buildStandings(Object.entries(WC_GROUPS || {}));
  },

  /** Próximos partidos del Mundial.
   *  Fuente maestra: WorldCupGroups para nombres y banderas */
  getWCFixtures() {
    const resolveTeam = (name) => {
      if (typeof WorldCupGroups !== 'undefined') {
        // Normalizar y buscar en fuente maestra
        const normalized = WorldCupGroups.normalizeNationalTeamName(String(name));
        const all = WorldCupGroups.getAllTeams();
        return all.find(t => t.name === normalized || t.name === name) || null;
      }
      return WC_TEAMS.find(t => t.name === name || t.id === name || t.shortName === name) || null;
    };

    return WC_FIXTURES.map(f => {
      const home = resolveTeam(f.home);
      const away = resolveTeam(f.away);
      if (!home || !away) {
        console.warn(`[WC Fixtures] Equipo no encontrado: "${f.home}" o "${f.away}"`);
        return null;
      }
      const homeFlag = home.flagUrl || (typeof FlagsMap !== 'undefined' ? FlagsMap.getFlag(home.name) : (typeof WorldCupGroups !== 'undefined' ? WorldCupGroups.getFlag(home.name) : null));
      const awayFlag = away.flagUrl || (typeof FlagsMap !== 'undefined' ? FlagsMap.getFlag(away.name) : (typeof WorldCupGroups !== 'undefined' ? WorldCupGroups.getFlag(away.name) : null));
      return {
        id:      `${f.home.replace(/\s+/g,'_')}_${f.away.replace(/\s+/g,'_')}`,
        jornada: f.round,
        fecha:   f.date,
        hora:    f.hora || null,
        venue:   f.venue || null,
        estado:  'SCHEDULED',
        fuente:  'local',
        homeTeam: { fd_id: null, apif_id: home.id, name: home.name, shortName: home.shortName, logoUrl: homeFlag, emoji: home.emoji },
        awayTeam: { fd_id: null, apif_id: away.id, name: away.name, shortName: away.shortName, logoUrl: awayFlag, emoji: away.emoji },
      };
    }).filter(Boolean);
  },

  /** Stats de una selección para el predictor.
   *  Normaliza con WorldCupGroups, stats base desde WorldCupGroups.getGroupTeams() */
  getWCTeamStats(teamId) {
    let official = null;
    let officialGroup = null;

    if (typeof WorldCupGroups !== 'undefined') {
      // Normalizar nombre bruto de API
      const normalized = WorldCupGroups.normalizeNationalTeamName(String(teamId));
      officialGroup = WorldCupGroups.getGroup(normalized);
      const all = WorldCupGroups.getAllTeams();
      official = all.find(t => t.name === normalized || t.id === teamId || t.shortName === teamId);
    }

    // Stats base del equipo (de WorldCupGroups o fallback neutro)
    const base = official || {
      form: ['W','D','L','D','W'],
      homeGoalsFor: 1.3, homeGoalsAgainst: 1.1,
      homeWinRate: 0.40, homeDrawRate: 0.28,
      awayGoalsFor: 1.2, awayGoalsAgainst: 1.2,
      awayWinRate: 0.35, awayDrawRate: 0.28,
      avgCorners: 5.0, h1ScoringRatio: 0.42,
      pos: 16, points: 0,
    };

    if (!official) {
      console.warn(`[WC] Selección no encontrada: "${teamId}" — usando fallback`);
    }

    const name  = official?.name  || String(teamId);
    const emoji = official?.emoji || '🌍';
    const flag  = official?.flagUrl
      || (typeof FlagsMap !== 'undefined' ? FlagsMap.getFlag(name) : 'https://flagcdn.com/w320/un.png');

    return {
      ...base,
      id:        official?.id        || String(teamId),
      name,
      shortName: official?.shortName || String(teamId).substring(0, 3).toUpperCase(),
      emoji,
      logoUrl:   flag,
      group:     officialGroup       || official?.group || '?',
    };
  },
};

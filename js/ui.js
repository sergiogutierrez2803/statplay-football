/**
 * StatPlay Football — ui.js
 * All render functions for each page/component
 */

const UI = {

  /* ════════════════════════════════════════
     LEAGUE SELECTOR — Página inicial rediseñada
  ════════════════════════════════════════ */
  renderLeagueSelector(leagues = []) {
    const enriched = leagues.map(l => {
      const local = LEAGUES[l.id];
      return {
        ...l,
        logoUrl:      l.logoUrl || l.logo_url || local?.logoUrl || null,
        logoFallback: local?.logoFallback || null,
        accentColor:  l.accentColor || l.accent_color || local?.accentColor || '#3d195b'
      };
    });

    return `
      <div class="splash-home page-enter">

        <!-- Branding -->
        <div class="splash-home-brand">
          <div class="splash-home-icon">
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="url(#sg)" stroke-width="2.5"/>
              <path d="M32 10 L37 22 L50 22 L40 30 L44 43 L32 35 L20 43 L24 30 L14 22 L27 22 Z" fill="url(#sg)"/>
              <defs>
                <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00D4AA"/>
                  <stop offset="100%" stop-color="#5B6AF0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="splash-home-titles">
            <h1 class="splash-home-name">StatPlay</h1>
            <span class="splash-home-sub">FOOTBALL ANALYTICS</span>
          </div>
        </div>

        <!-- Tagline -->
        <p class="splash-home-tagline">${I18n.t('splash_tagline')}</p>

        <!-- Liga buttons -->
        <p class="splash-home-prompt">${AppState.currentLeague ? I18n.t('splash_prompt_change') : I18n.t('splash_prompt')}</p>

        <div class="splash-league-grid">
          ${enriched.map(league => `
            <button class="splash-league-btn${AppState.currentLeague === league.id ? ' active' : ''}" data-league="${league.id}"
                    style="--accent: ${league.accentColor}">
              <div class="slb-glow"></div>
              <div class="slb-logo-wrap">
                ${league.logoUrl
                  ? `<img src="${league.logoUrl}" alt="${league.nombre || league.name}"
                         class="slb-logo"
                         onerror="this.onerror=null;this.src='${league.logoFallback || (typeof FlagsMap !== 'undefined' ? FlagsMap.WORLD_CUP_LOGO_FALLBACK : '')}';this.onerror=null;">`
                  : `<span class="slb-emoji">${league.emoji}</span>`
                }
              </div>
              <div class="slb-info">
                <span class="slb-name">${league.nombre || league.name}</span>
                <span class="slb-country">${league.pais || ''}</span>
              </div>
              ${AppState.currentLeague === league.id
                ? `<span class="slb-active-badge">${I18n.t('splash_active')}</span>`
                : `<svg class="slb-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`
              }
            </button>
          `).join('')}
        </div>

        <!-- Coming soon -->
        <div class="splash-coming-soon">
          <span class="scs-dot"></span>
          <span>${I18n.t('splash_coming')}</span>
        </div>

      </div>
    `;
  },

  /* ════════════════════════════════════════
     HOME PAGE — Próximas jornadas + botón cambiar liga
  ════════════════════════════════════════ */
  async renderHome() {
    this._updateMeta('StatPlay Football');
    const league   = LEAGUES[AppState.currentLeague || 'PL'];
    // Sincronizar logoUrl desde AppState.leagues si es necesario
    if (!league.logoUrl && AppState.leagues.length) {
      const dbLeague = AppState.leagues.find(l => l.id === league.id);
      if (dbLeague) league.logoUrl = dbLeague.logoUrl || dbLeague.logo_url || null;
    }

    // Cargar equipos y fixtures en paralelo
    const [teams, upcomingData] = await Promise.all([
      ApiService.getTeams(),
      ApiService.getUpcomingMatches()
    ]);

    const now  = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? I18n.t('greeting_morning') : hour < 19 ? I18n.t('greeting_afternoon') : I18n.t('greeting_evening');

    return `
      <!-- Hero compacto -->
      <div class="hero-banner page-enter">
        <div class="hero-header-row">
          <div class="hero-branding">
            <p class="hero-greeting">${greeting} ⚡</p>
            <h1 class="hero-title">${league.name} <span class="text-gradient">${league.isWorldCup ? '2026' : '2025/26'}</span></h1>
          </div>
          <div class="league-logo-badge">
            ${league.logoUrl
              ? `<img src="${league.logoUrl}" alt="${league.isWorldCup ? 'Copa Mundial 2026' : league.name}" class="league-logo-img"
                     onerror="this.onerror=null;this.src='${league.logoFallback || ''}';this.onerror=null;">`
              : `<span style="font-size:2rem">${league.emoji}</span>`}
          </div>
        </div>
        <div class="hero-meta-row">
          <p class="hero-subtitle">${I18n.t('home_subtitle')}</p>
          <button class="change-league-btn" id="btn-change-league">
            <span>${league.emoji}</span> ${I18n.t('home_change_league')}
          </button>
        </div>
      </div>

      <!-- Selector rápido de partido -->
      <div class="page-section anim-fade-up anim-stagger-1">
        <p class="section-title">${I18n.t('home_analyze')}</p>
      </div>
      <div class="match-selector anim-fade-up anim-stagger-2" style="padding-top:0;">
        <div class="selector-vs" id="selector-vs">
          <div class="selector-team" id="btn-pick-home" data-role="home">
            <div class="selector-team-badge" id="home-badge">⚽</div>
            <div class="selector-team-role">${league?.isWorldCup ? I18n.t('wc_home_local') : I18n.t('home_local')}</div>
            <div class="selector-team-name" id="home-name">${I18n.t('home_select')}</div>
          </div>
          <div class="vs-badge">
            <div class="vs-line"></div>
            <span class="vs-text">VS</span>
            <div class="vs-line"></div>
          </div>
          <div class="selector-team" id="btn-pick-away" data-role="away">
            <div class="selector-team-badge" id="away-badge">⚽</div>
            <div class="selector-team-role">${league?.isWorldCup ? I18n.t('wc_home_visitor') : I18n.t('home_visitor')}</div>
            <div class="selector-team-name" id="away-name">${I18n.t('home_select')}</div>
          </div>
        </div>
        <button class="cta-btn" id="btn-analyze" disabled>
          ${I18n.t('home_analyze_btn')}
        </button>
      </div>

      <!-- Próximas jornadas -->
      <div class="page-section anim-fade-up anim-stagger-3">
        <p class="section-title">${league?.isWorldCup ? I18n.t('wc_upcoming') : I18n.t('home_upcoming')}</p>
        ${upcomingData.source !== 'none' && upcomingData.source !== 'error'
          ? `<span class="source-badge">${upcomingData.source === 'football-data.org' ? I18n.t('home_live') : I18n.t('home_db')}</span>`
          : ''}
      </div>

      <div class="upcoming-list anim-fade-up anim-stagger-4">
        ${this._renderUpcomingMatches(upcomingData)}
      </div>

      <!-- Legal -->
      <div class="legal-card anim-fade-up anim-stagger-5" style="margin-bottom: var(--sp-8);">
        <span class="legal-icon">⚠️</span>
        <p class="legal-text">${I18n.t('home_legal')}</p>
      </div>

      <!-- Team Picker Modal -->
      ${this._teamPickerModal(teams)}
    `;
  },

  /* ── Render upcoming matches ── */
  _renderUpcomingMatches(data) {
    if (!data.ok || !data.matches || data.matches.length === 0) {
      const reason = data.reason || I18n.t('upcoming_empty_default');
      const tech   = data.technical;
      return `
        <div class="upcoming-empty">
          <div class="upcoming-empty-icon">📅</div>
          <p class="upcoming-empty-title">${I18n.t('upcoming_empty_title')}</p>
          <p class="upcoming-empty-desc">${reason}</p>
          ${tech ? `
            <div class="upcoming-tech-info">
              <p class="uti-label">${I18n.t('upcoming_tech_label')}</p>
              <p class="uti-row">Endpoint: <code>${tech.fd_endpoint}</code></p>
              <p class="uti-row">${I18n.t('upcoming_tech_status')}: <code>${tech.fd_status}</code></p>
              <p class="uti-row">${I18n.t('upcoming_tech_db')}: <code>${tech.db_partidos}</code></p>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Agrupar por jornada
    const byJornada = {};
    data.matches.forEach(m => {
      const key = m.jornada || 'Próximos partidos';
      if (!byJornada[key]) byJornada[key] = [];
      byJornada[key].push(m);
    });

    return Object.entries(byJornada).map(([jornada, matches], gi) => `
      <div class="upcoming-group anim-fade-up anim-stagger-${gi + 4}">
        <div class="upcoming-group-header">
          <span class="upcoming-jornada">${jornada}</span>
        </div>
        ${matches.map(m => this._upcomingMatchCard(m)).join('')}
      </div>
    `).join('');
  },

  /* ── Tarjeta de partido próximo ── */
  _upcomingMatchCard(m) {
    const h = m.homeTeam;
    const a = m.awayTeam;

    // Formatear fecha y hora
    let fechaStr = '';
    let horaStr  = '';
    if (m.fecha) {
      const d = new Date(m.fecha + 'T12:00:00');
      fechaStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      fechaStr = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
    }
    if (m.hora) {
      // Convertir UTC a hora local
      try {
        const utc = new Date(`${m.fecha}T${m.hora}:00Z`);
        horaStr = utc.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      } catch { horaStr = m.hora; }
    }

    const isWC = AppState.currentLeague === 'WORLD_CUP';

    // WC: usar NationalFlagMap. Ligas: usar TeamLogoMap.
    // Si logoUrl ya viene con bandera (desde getWCFixtures), respetarlo.
    let homeLogo, awayLogo;
    if (isWC) {
      homeLogo = (typeof FlagsMap !== 'undefined')
        ? FlagsMap.getFlag(h.name)
        : (typeof NationalFlagMap !== 'undefined' ? NationalFlagMap.getFlag(h.name) : (h.logoUrl || null));
      awayLogo = (typeof FlagsMap !== 'undefined')
        ? FlagsMap.getFlag(a.name)
        : (typeof NationalFlagMap !== 'undefined' ? NationalFlagMap.getFlag(a.name) : (a.logoUrl || null));
    } else {
      homeLogo = (typeof TeamLogoMap !== 'undefined')
        ? TeamLogoMap.getLogo(h.name, h.logoUrl, h.crest)
        : (h.logoUrl || h.crest);
      awayLogo = (typeof TeamLogoMap !== 'undefined')
        ? TeamLogoMap.getLogo(a.name, a.logoUrl, a.crest)
        : (a.logoUrl || a.crest);
    }

    const fallbackEmoji = isWC ? '🌍' : '⚽';
    const homeImgHtml = homeLogo
      ? `<img src="${homeLogo}" alt="${h.shortName || h.name}" class="umc-crest${isWC ? ' umc-flag' : ''}"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='block';">
         <span class="umc-emoji" style="display:none">${fallbackEmoji}</span>`
      : `<span class="umc-emoji">${h.emoji || fallbackEmoji}</span>`;

    const awayImgHtml = awayLogo
      ? `<img src="${awayLogo}" alt="${a.shortName || a.name}" class="umc-crest${isWC ? ' umc-flag' : ''}"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='block';">
         <span class="umc-emoji" style="display:none">${a.emoji || fallbackEmoji}</span>`
      : `<span class="umc-emoji">${a.emoji || fallbackEmoji}</span>`;

    // Si tenemos apif_id, el partido es clickeable para análisis
    const homeId = h.apif_id || h.id;
    const awayId = a.apif_id || a.id;
    const clickable = homeId && awayId;

    return `
      <div class="upcoming-match-card ${clickable ? 'clickable' : ''}"
           ${clickable ? `data-home="${homeId}" data-away="${awayId}"` : ''}>
        <div class="umc-teams">
          <div class="umc-team">
            <div class="umc-crest-wrap">${homeImgHtml}</div>
            <span class="umc-name">${h.shortName || h.name}</span>
          </div>
          <div class="umc-center">
            <span class="umc-vs">VS</span>
            <div class="umc-time">
              ${fechaStr ? `<span class="umc-date">${fechaStr}</span>` : ''}
              ${horaStr  ? `<span class="umc-hour">${horaStr}</span>` : ''}
            </div>
          </div>
          <div class="umc-team">
            <div class="umc-crest-wrap">${awayImgHtml}</div>
            <span class="umc-name">${a.shortName || a.name}</span>
          </div>
        </div>
        ${clickable ? `<div class="umc-analyze-hint">${I18n.t('home_analyze_hint')}</div>` : ''}
      </div>
    `;
  },

  /* ── League badge helper: logo + nombre ── */
  _leagueBadge() {
    const league = LEAGUES[AppState.currentLeague || 'PL'];
    const altText = league.isWorldCup ? 'Copa Mundial 2026' : league.name;
    const logo = league.logoUrl
      ? `<img src="${league.logoUrl}" alt="${altText}"
             style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;"
             onerror="this.onerror=null;this.src='${league.logoFallback || ''}';this.onerror=null;">`
      : `<span style="margin-right:3px;">${league.emoji}</span>`;
    return `${logo}${league.name}`;
  },

  /* ── Logo helper: prioridad DB → mapa interno → crest FD → emoji ── */
  _logo(team, size = 44) {
    if (!team) return `<div class="team-logo-wrap" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.45)}px;">⚽</div>`;

    const pad = Math.max(3, Math.round(size * 0.08));

    // Prioridad: 1. DB logo  2. mapa interno  3. crest FD  4. emoji
    const resolvedLogo = (typeof TeamLogoMap !== 'undefined')
      ? TeamLogoMap.getLogo(team.name || team.nombre, team.logoUrl, team.crest)
      : (team.logoUrl || team.crest || null);

    const fallbackEmoji = (typeof TeamLogoMap !== 'undefined')
      ? (team.emoji || TeamLogoMap.getEmoji(team.name || team.nombre))
      : (team.emoji || '⚽');

    if (resolvedLogo) {
      // Fallback en cadena: si la imagen falla, intentar el mapa, luego emoji
      const mapLogo = (typeof TeamLogoMap !== 'undefined')
        ? TeamLogoMap.findByName(team.name || team.nombre)?.logo
        : null;
      const fallbackSrc = mapLogo && mapLogo !== resolvedLogo ? mapLogo : '';
      const onError = fallbackSrc
        ? `this.onerror=null;this.src='${fallbackSrc}';this.onerror=function(){this.onerror=null;this.closest('.team-logo-wrap').innerHTML='<span style=\\'font-size:${Math.round(size*0.45)}px;\\'>${fallbackEmoji}</span>';};`
        : `this.onerror=null;this.closest('.team-logo-wrap').innerHTML='<span style=\\'font-size:${Math.round(size*0.45)}px;\\'>${fallbackEmoji}</span>';`;

      return `<div class="team-logo-wrap" style="width:${size}px;height:${size}px;padding:${pad}px;">
        <img src="${resolvedLogo}" alt="${team.shortName || team.name || ''}"
             style="width:100%;height:100%;object-fit:contain;"
             onerror="${onError}">
      </div>`;
    }

    return `<div class="team-logo-wrap" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.45)}px;">${fallbackEmoji}</div>`;
  },

  /* ── Flag helper: para selecciones nacionales (World Cup) ──
     Usa FlagsMap como fuente única de verdad.
     Nunca mezcla con TeamLogoMap de clubes.
  ── */
  _flag(team, size = 44) {
    if (!team) return `<div class="team-logo-wrap" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.55)}px;">🌍</div>`;

    const name    = team.name || team.nombre || '';
    const emoji   = team.emoji || '🌍';

    // FlagsMap es la fuente única — NationalFlagMap como fallback secundario
    let flagUrl = null;
    if (typeof FlagsMap !== 'undefined') {
      flagUrl = FlagsMap.getFlag(name);
      if (flagUrl === FlagsMap.DEFAULT_FLAG && team.logoUrl && team.logoUrl !== FlagsMap.DEFAULT_FLAG) {
        flagUrl = team.logoUrl; // respetar logoUrl si ya viene con bandera válida
      }
    } else if (typeof NationalFlagMap !== 'undefined') {
      flagUrl = NationalFlagMap.getFlag(name);
    } else {
      flagUrl = team.logoUrl || null;
    }

    const fallbackEmoji = emoji;
    const fallbackSrc   = (typeof FlagsMap !== 'undefined') ? FlagsMap.DEFAULT_FLAG : 'https://flagcdn.com/w320/un.png';

    if (flagUrl) {
      return `<div class="team-logo-wrap wc-flag-wrap" style="width:${size}px;height:${Math.round(size*0.67)}px;border-radius:4px;overflow:hidden;padding:0;">
        <img src="${flagUrl}" alt="${name}"
             style="width:100%;height:100%;object-fit:cover;"
             onerror="this.onerror=null;this.src='${fallbackSrc}';this.onerror=function(){this.onerror=null;this.closest('.wc-flag-wrap').innerHTML='<span style=\\'font-size:${Math.round(size*0.55)}px;\\'>${fallbackEmoji}</span>';};">
      </div>`;
    }

    return `<div class="team-logo-wrap" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.55)}px;">${emoji}</div>`;
  },

  /* ── Selector de helper visual según tipo de competición ── */
  _teamVisual(team, size = 44) {
    if (AppState.currentLeague === 'WORLD_CUP') return this._flag(team, size);
    return this._logo(team, size);
  },

  _quickMatchCard(match) {
    const h = match.homeTeam;
    const a = match.awayTeam;
    if (!h || !a) return '';
    const pred = h.homeWinRate > a.awayWinRate ? `${h.shortName} favorito` :
                 a.awayWinRate > h.homeWinRate + 0.1 ? `${a.shortName} sorpresa` : 'Equilibrado';
    return `
      <div class="quick-match-card" data-home="${h.id}" data-away="${a.id}" id="qm-${h.id}-${a.id}">
        <div class="qm-teams">
          <div class="qm-team">${this._logo(h, 28)}<span>${h.shortName}</span></div>
          <span class="qm-vs">vs</span>
          <div class="qm-team">${this._logo(a, 28)}<span>${a.shortName}</span></div>
        </div>
        <div class="qm-meta">
          <span class="qm-prediction">${pred}</span>
          <span class="qm-chevron">›</span>
        </div>
      </div>
    `;
  },

  _teamPickerModal(teams) {
    const isWC = AppState.currentLeague === 'WORLD_CUP';
    const options = teams.map(t => `
      <div class="team-option" data-team-id="${t.id}" id="opt-${t.id}">
        <div class="team-option-badge">${isWC ? this._flag(t, 36) : this._logo(t, 36)}</div>
        <div class="team-option-info">
          <div class="team-option-name">${t.name}</div>
          <div class="team-option-meta">${t.group ? `Grupo ${t.group}` : `Pos. ${t.pos} · ${t.points} pts`}</div>
        </div>
        <svg class="team-option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    `).join('');

    return `
      <div class="modal-overlay" id="team-modal">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <h2 class="modal-title" id="modal-title">${I18n.t('modal_title_home')}</h2>
          <input class="modal-search" type="text" id="modal-search" placeholder="${I18n.t('modal_search')}" autocomplete="off"/>
          <div class="modal-list" id="modal-list">
            ${options}
          </div>
        </div>
      </div>
    `;
  },

  /* ── SEO Helper: Actualiza título y meta tags dinámicamente ── */
  _updateMeta(title, desc = null) {
    document.title = `${title} | StatPlay Football`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && desc) metaDesc.setAttribute('content', desc);
    
    // OG Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
  },

  /* ════════════════════════════════════════
     ANALYSIS PAGE
  ════════════════════════════════════════ */
  renderAnalysisLoading(home, away) {
    return `
      <button class="back-btn page-enter" id="btn-back">
        ${I18n.t('back_btn')}
      </button>
      <div class="analysis-header">
        <div class="match-card">
          <div class="match-team-col">
            <div class="match-team-badge-lg skeleton" style="border-radius:50%"></div>
            <div class="skeleton" style="height:14px; width:60px; margin-top:8px;"></div>
          </div>
          <div class="match-vs-col">
            <div class="match-vs">VS</div>
            <div class="match-league-badge skeleton" style="width:40px; height:12px;"></div>
          </div>
          <div class="match-team-col">
            <div class="match-team-badge-lg skeleton" style="border-radius:50%"></div>
            <div class="skeleton" style="height:14px; width:60px; margin-top:8px;"></div>
          </div>
        </div>
      </div>
      <!-- Skeletons dinámicos -->
      <div style="padding: 0 20px; max-width:480px; margin:0 auto;">
        <div class="skeleton" style="height:140px; margin-bottom:24px; border-radius:var(--r-xl);"></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px;">
          <div class="skeleton" style="height:110px; border-radius:var(--r-xl);"></div>
          <div class="skeleton" style="height:110px; border-radius:var(--r-xl);"></div>
          <div class="skeleton" style="height:110px; border-radius:var(--r-xl);"></div>
          <div class="skeleton" style="height:110px; border-radius:var(--r-xl);"></div>
        </div>
        <div class="skeleton" style="height:160px; border-radius:var(--r-xl);"></div>
      </div>
    `;
  },

  renderAnalysis(result) {
    const { homeTeam: h, awayTeam: a, probs, goals, over25, btts, corners, risk, confidence, insight, h2h } = result;

    // Siempre regenerar el insight con I18n para respetar el idioma activo.
    const safeHalfTime = result.halfTime || {
      firstHalf:  { home: 0, away: 0, total: 0 },
      secondHalf: { home: 0, away: 0, total: 0 }
    };
    // Pasar métricas avanzadas al insight para enriquecer el análisis textual
    const finalInsight = I18n.buildInsight(h, a, probs, safeHalfTime, h2h, risk, result.advanced || null);

    const riskLabels = {
      low:    I18n.t('risk_low'),
      medium: I18n.t('risk_medium'),
      high:   I18n.t('risk_high'),
    };
    const riskDots = [1,2,3].map(i => {
      const active = (risk === 'low' && i <= 1) || (risk === 'medium' && i <= 2) || risk === 'high';
      return `<div class="risk-dot ${active ? `active ${risk}` : ''}"></div>`;
    }).join('');

    const formDots = (form) => (form || []).map(r =>
      `<div class="form-dot ${r === 'W' ? 'w' : r === 'D' ? 'd' : 'l'}" title="${r}"></div>`
    ).join('');

    const h2hTotal = (h2h?.hw || 0) + (h2h?.d || 0) + (h2h?.aw || 0);

    // SEO: Actualizar título dinámico
    this._updateMeta(`${h.shortName || h.name} vs ${a.shortName || a.name}`);

    return `
      <button class="back-btn page-enter" id="btn-back">
        ${I18n.t('back_home_btn')}
      </button>

      <!-- Match Header -->
      <div class="analysis-header anim-fade-up">
        <div class="match-card">
          <div class="match-team-col">
            <div class="match-team-badge-lg anim-bounce-in">${this._teamVisual(h, 64)}</div>
            <div class="match-team-name">${h.name}</div>
            <div class="match-team-form">${formDots(h.form)}</div>
          </div>
          <div class="match-vs-col">
            <div class="match-vs">VS</div>
            <div class="match-league-badge">${this._leagueBadge()}</div>
          </div>
          <div class="match-team-col">
            <div class="match-team-badge-lg anim-bounce-in anim-stagger-1">${this._teamVisual(a, 64)}</div>
            <div class="match-team-name">${a.name}</div>
            <div class="match-team-form">${formDots(a.form)}</div>
          </div>
        </div>
      </div>

      <!-- 🆕 Oportunidad Detectada -->
      ${this._renderOpportunity(probs, confidence, over25, btts, h, a, result.advanced)}

      <!-- Probability Bars -->
      <div class="prob-section anim-fade-up anim-stagger-1">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--sp-4);">
          <p class="prob-title" style="margin-bottom:0">${I18n.t('prob_title')}</p>
          ${this._renderTooltip('tt_poisson')}
        </div>
        <div class="prob-bars">
          <div class="prob-bar-row">
            <span class="prob-bar-label">${I18n.t('prob_home_wins', h.shortName)}</span>
            <div class="prob-bar-track">
              <div class="prob-bar-fill local" data-target="${probs.home}" style="width:0%"></div>
            </div>
            <span class="prob-bar-pct local" data-count="${probs.home}">0%</span>
          </div>
          <div class="prob-bar-row">
            <span class="prob-bar-label">${I18n.t('prob_draw')}</span>
            <div class="prob-bar-track">
              <div class="prob-bar-fill draw" data-target="${probs.draw}" style="width:0%"></div>
            </div>
            <span class="prob-bar-pct draw" data-count="${probs.draw}">0%</span>
          </div>
          <div class="prob-bar-row">
            <span class="prob-bar-label">${I18n.t('prob_away_wins', a.shortName)}</span>
            <div class="prob-bar-track">
              <div class="prob-bar-fill away" data-target="${probs.away}" style="width:0%"></div>
            </div>
            <span class="prob-bar-pct away" data-count="${probs.away}">0%</span>
          </div>
        </div>
      </div>


      <!-- Stats Grid -->
      <div class="page-section anim-fade-up anim-stagger-2" style="margin-bottom:12px;">
        <p class="section-title">${I18n.t('stats_title')}</p>
      </div>
      <div class="stats-grid anim-fade-up anim-stagger-2">
        <div class="stat-card green">
          ${this._renderTooltip('tt_xg', true)}
          <div class="stat-card-label">${I18n.t('over25_label')}</div>
          <div class="stat-card-value">${over25}%</div>
          <div class="stat-card-sub">${I18n.t('over25_sub', goals.total)}</div>
        </div>
        <div class="stat-card blue">
          ${this._renderTooltip('tt_btts', true)}
          <div class="stat-card-label">${I18n.t('btts_label')}</div>
          <div class="stat-card-value">${btts}%</div>
          <div class="stat-card-sub">${I18n.t('btts_sub')}</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-card-icon">📐</div>
          <div class="stat-card-label">${I18n.t('corners_label')}</div>
          <div class="stat-card-value">${corners}</div>
          <div class="stat-card-sub">${I18n.t('corners_sub')}</div>
        </div>
        <div class="stat-card ${risk === 'low' ? 'green' : risk === 'medium' ? 'orange' : 'red'}">
          <div class="stat-card-icon">🧮</div>
          <div class="stat-card-label">${I18n.t('xg_label')}</div>
          <div class="stat-card-value">${goals.home}-${goals.away}</div>
          <div class="stat-card-sub">${I18n.t('xg_sub')}</div>
        </div>
      </div>

      <!-- 🆕 Fortaleza Ofensiva -->
      ${this._renderOffensiveStrength(goals, h, a)}

      <!-- 🆕 Top 3 Mercados -->
      ${this._renderTop3Markets(probs, over25, btts, h, a, result.advanced)}

      <!-- Halftime Breakdown -->
      ${this._renderHalfTime(result)}

      <!-- Risk -->
      <div class="risk-row anim-fade-up anim-stagger-3">
        <span class="risk-icon">🛡️</span>
        <div class="risk-info">
          <div class="risk-label">${I18n.t('risk_label')}</div>
          <div class="risk-value ${risk}">${riskLabels[risk]}</div>
        </div>
        <div class="risk-dots">${riskDots}</div>
      </div>

      <!-- H2H Mini -->
      <div class="page-section anim-fade-up anim-stagger-3" style="margin-bottom:12px;">
        <p class="section-title">${I18n.t('h2h_title', h2hTotal)}</p>
      </div>
      <div style="padding: 0 20px 20px; max-width:480px; margin:0 auto;">
        <div style="background:var(--clr-surface2); border:1px solid var(--clr-border2); border-radius:var(--r-xl); padding:var(--sp-4); display:flex; align-items:center; gap:var(--sp-4);">
          <div style="flex:1; text-align:center;">
            <div style="font-family:var(--font-display); font-size:1.8rem; font-weight:700; color:var(--clr-success);">${h2h?.hw ?? 0}</div>
            <div style="font-size:0.65rem; color:var(--clr-text3); font-weight:600; text-transform:uppercase; letter-spacing:.08em; margin-top:4px;">${I18n.t('h2h_wins', h.shortName)}</div>
          </div>
          <div style="flex:1; text-align:center;">
            <div style="font-family:var(--font-display); font-size:1.8rem; font-weight:700; color:var(--clr-warning);">${h2h?.d ?? 0}</div>
            <div style="font-size:0.65rem; color:var(--clr-text3); font-weight:600; text-transform:uppercase; letter-spacing:.08em; margin-top:4px;">${I18n.t('h2h_draws')}</div>
          </div>
          <div style="flex:1; text-align:center;">
            <div style="font-family:var(--font-display); font-size:1.8rem; font-weight:700; color:var(--clr-danger);">${h2h?.aw ?? 0}</div>
            <div style="font-size:0.65rem; color:var(--clr-text3); font-weight:600; text-transform:uppercase; letter-spacing:.08em; margin-top:4px;">${I18n.t('h2h_wins', a.shortName)}</div>
          </div>
        </div>
      </div>

      <!-- Métricas Avanzadas -->
      ${this._renderAdvancedMetrics(result.advanced)}

      <!-- 🆕 Rendimiento por Venue -->
      ${this._renderVenuePerformance(result.homeTeam, result.awayTeam)}

      <!-- 🆕 Resumen Rápido -->
      ${this._renderQuickSummary(probs, over25, btts, risk, h, a)}

      <!-- AI Insight -->
      <div class="ai-section anim-fade-up anim-stagger-4">
        <div class="ai-card">
          <div class="ai-header">
            <div class="ai-icon">🤖</div>
            <div>
              <div class="ai-title">${I18n.t('ai_title')}</div>
              <div class="ai-badge">${I18n.t('ai_badge')}</div>
            </div>
          </div>
          <p class="ai-text">"${finalInsight}"</p>
        </div>
      </div>

      <!-- Confidence + Margin of Error -->
      <div class="confidence-section anim-fade-up anim-stagger-5">
        <div class="confidence-card">
          <div class="confidence-header">
            <span class="confidence-label">${I18n.t('confidence_label')}</span>
            <span class="confidence-badge ${confidence.level}">${I18n.t('confidence_' + confidence.level)}</span>
          </div>
          <div class="confidence-meter">
            <div class="confidence-fill ${confidence.level}" data-target="${confidence.pct}" style="width:0%"></div>
          </div>
          <div style="display:flex; align-items:baseline; gap:6px;">
            <span class="confidence-pct ${confidence.level}" data-count="${confidence.pct}">0%</span>
            <span class="confidence-desc">${I18n.t('confidence_desc')}</span>
          </div>
          <div class="margin-error-row">
            <span class="margin-error-icon">📏</span>
            <span class="margin-error-label">${I18n.t('margin_label')}</span>
            <span class="margin-error-value">±${confidence.margin}%</span>
          </div>
        </div>
      </div>

      <!-- Legal bottom -->
      <div class="legal-card" style="margin-bottom: var(--sp-8);">
        <span class="legal-icon">⚠️</span>
        <p class="legal-text">${I18n.t('legal_text')}</p>
      </div>
    `;
  },

  /* ════════════════════════════════════════
     STANDINGS PAGE
  ════════════════════════════════════════ */
  async renderStandings() {
    const standings = await ApiService.getStandings();
    const league = LEAGUES[AppState.currentLeague || 'PL'];
    // Sincronizar logoUrl desde AppState.leagues si es necesario
    if (!league.logoUrl && AppState.leagues.length) {
      const dbLeague = AppState.leagues.find(l => l.id === league.id);
      if (dbLeague) league.logoUrl = dbLeague.logoUrl || dbLeague.logo_url || null;
    }

    const formMini = (form = []) => form.slice(-5).map(r =>
      `<div class="form-dot ${r === 'W' ? 'w' : r === 'D' ? 'd' : 'l'}" style="width:6px;height:6px;"></div>`
    ).join('');

    const rows = standings.map((s, i) => {
      const cls = s.position <= 4 ? 'champions' : s.position <= 6 ? 'europa' : s.position >= 18 ? 'relegation' : '';
      const posClass = s.position <= 3 ? 'top3' : '';
      const delay = `anim-stagger-${Math.min(i + 1, 8)}`;
      return `
        <div class="standings-row ${cls} anim-fade-up ${delay}" id="standing-row-${s.team.id}">
          <div class="standings-pos ${posClass}">${s.position}</div>
          <div class="standings-team-col">
            ${this._logo(s.team, 24)}
            <span class="standings-name">${s.team.shortName || s.team.name}</span>
          </div>
          <div class="standings-cell">${s.played}</div>
          <div class="standings-cell">${s.gf}</div>
          <div class="standings-cell">${s.ga}</div>
          <div class="standings-cell" style="color:${s.gd >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'}">${s.gd >= 0 ? '+' : ''}${s.gd}</div>
          <div class="standings-pts">${s.points}</div>
        </div>`;
    }).join('');

    return `
      <!-- Hero -->
      <div class="hero-banner page-enter">
        <p class="hero-greeting">${I18n.t('standings_greeting')}</p>
        <h2 class="hero-title">${I18n.t('standings_title')}</h2>
        <p class="hero-subtitle">${league.name} 2025/26</p>
      </div>

      <!-- Legend -->
      <div style="padding: 12px 20px; max-width:480px; margin:0 auto; display:flex; gap:16px; flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:6px; font-size:.65rem; color:var(--clr-text3); font-weight:600;">
          <div style="width:10px;height:10px;border-radius:2px;background:var(--clr-primary);"></div> ${I18n.t('standings_champions')}
        </div>
        <div style="display:flex;align-items:center;gap:6px; font-size:.65rem; color:var(--clr-text3); font-weight:600;">
          <div style="width:10px;height:10px;border-radius:2px;background:var(--clr-accent);"></div> ${I18n.t('standings_europa')}
        </div>
        <div style="display:flex;align-items:center;gap:6px; font-size:.65rem; color:var(--clr-text3); font-weight:600;">
          <div style="width:10px;height:10px;border-radius:2px;background:var(--clr-danger);"></div> ${I18n.t('standings_relegation')}
        </div>
      </div>

      <!-- Table -->
      <div class="standings-container">
        <div class="standings-header-row">
          <div>#</div><div>${I18n.t('standings_team')}</div>
          <div title="${I18n.t('standings_pj_title')}">${I18n.t('standings_pj')}</div>
          <div title="${I18n.t('standings_gf_title')}">${I18n.t('standings_gf')}</div>
          <div title="${I18n.t('standings_gc_title')}">${I18n.t('standings_gc')}</div>
          <div title="${I18n.t('standings_dg_title')}">${I18n.t('standings_dg')}</div>
          <div title="${I18n.t('standings_pts')}">${I18n.t('standings_pts')}</div>
        </div>
        ${rows}
      </div>
    `;
  },

  /* ════════════════════════════════════════
     MATCHES PAGE (quick selector)
  ════════════════════════════════════════ */
  async renderMatches() {
    const teams = await ApiService.getTeams();
    return `
      <div class="hero-banner page-enter">
        <p class="hero-greeting">${I18n.t('matches_greeting')}</p>
        <h2 class="hero-title">${I18n.t('matches_title')}</h2>
        <p class="hero-subtitle">${I18n.t('matches_subtitle')}</p>
      </div>
      <div class="match-selector anim-fade-up anim-stagger-1">
        <p class="selector-label">${I18n.t('matches_home_label')}</p>
        <div class="selector-vs">
          <div class="selector-team" id="btn-pick-home" data-role="home">
            <div class="selector-team-badge" id="home-badge">⚽</div>
            <div class="selector-team-role">${I18n.t('home_local')}</div>
            <div class="selector-team-name" id="home-name">${I18n.t('home_select')}</div>
          </div>
          <div class="vs-badge">
            <div class="vs-line"></div>
            <span class="vs-text">VS</span>
            <div class="vs-line"></div>
          </div>
          <div class="selector-team" id="btn-pick-away" data-role="away">
            <div class="selector-team-badge" id="away-badge">⚽</div>
            <div class="selector-team-role">${I18n.t('home_visitor')}</div>
            <div class="selector-team-name" id="away-name">${I18n.t('home_select')}</div>
          </div>
        </div>
        <button class="cta-btn" id="btn-analyze" disabled>
          ${I18n.t('home_analyze_btn')}
        </button>
      </div>
      ${this._teamPickerModal(teams)}
    `;
  },

  /* ════════════════════════════════════════
     ABOUT PAGE
  ════════════════════════════════════════ */
  renderAbout() {
    return `
      <div class="about-section page-enter">
        <div class="about-logo-row">
          <div class="about-logo-icon">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="white" stroke-width="3"/>
              <path d="M32 8 L38 20 L52 20 L42 29 L46 43 L32 34 L18 43 L22 29 L12 20 L26 20 Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="about-app-name">StatPlay Football</div>
            <div class="about-version">${I18n.t('about_version')}</div>
          </div>
        </div>

        <div class="feature-list anim-fade-up">
          <div class="feature-item anim-stagger-1">
            <div class="feature-icon">🤖</div>
            <div>
              <div class="feature-name">${I18n.t('about_engine')}</div>
              <div class="feature-desc">${I18n.t('about_engine_desc')}</div>
            </div>
          </div>
          <div class="feature-item anim-stagger-2">
            <div class="feature-icon">🌍</div>
            <div>
              <div class="feature-name">${I18n.t('about_multilang')}</div>
              <div class="feature-desc">${I18n.t('about_multilang_desc')}</div>
            </div>
          </div>
          <div class="feature-item anim-stagger-3">
            <div class="feature-icon">🎯</div>
            <div>
              <div class="feature-name">${I18n.t('about_predictions')}</div>
              <div class="feature-desc">${I18n.t('about_predictions_desc')}</div>
            </div>
          </div>
          <div class="feature-item anim-stagger-4">
            <div class="feature-icon">🔌</div>
            <div>
              <div class="feature-name">${I18n.t('about_api')}</div>
              <div class="feature-desc">${I18n.t('about_api_desc')}</div>
            </div>
          </div>
        </div>

        <div style="background:var(--clr-surface2);border:1px solid var(--clr-border2);border-radius:var(--r-xl);padding:var(--sp-5);margin-bottom:var(--sp-5);" class="anim-fade-up anim-stagger-5">
          <p style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--clr-text3);margin-bottom:var(--sp-4);">${I18n.t('about_method')}</p>
          ${[
            [I18n.t('about_form'),     '40%', I18n.t('about_form_desc')],
            [I18n.t('about_home_adv'), '25%', I18n.t('about_home_adv_desc')],
            [I18n.t('about_h2h'),      '20%', I18n.t('about_h2h_desc')],
            [I18n.t('about_goals'),    '15%', I18n.t('about_goals_desc')],
          ].map(([label, pct, desc]) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="flex:1;">
                <div style="font-size:.8rem;font-weight:600;">${label}</div>
                <div style="font-size:.7rem;color:var(--clr-text3);margin-top:2px;">${desc}</div>
              </div>
              <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;" class="text-gradient">${pct}</div>
            </div>
          `).join('')}
        </div>

        <div style="background:var(--clr-surface2);border:1px solid var(--clr-border2);border-radius:var(--r-xl);padding:var(--sp-5);margin-bottom:var(--sp-5);" class="anim-fade-up anim-stagger-6">
          <p style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--clr-gold);margin-bottom:var(--sp-3);">${I18n.t('about_premium')}</p>
          <ul style="display:flex;flex-direction:column;gap:8px;">
            ${[I18n.t('about_premium_1'), I18n.t('about_premium_2'), I18n.t('about_premium_3'), I18n.t('about_premium_4')].map(f =>
              `<li style="font-size:.8rem;color:var(--clr-text2);display:flex;align-items:center;gap:8px;">${f}</li>`
            ).join('')}
          </ul>
        </div>
      </div>

      <div class="legal-card" style="margin-bottom:var(--sp-8);">
        <span class="legal-icon">⚠️</span>
        <p class="legal-text">${I18n.t('about_legal')}</p>
      </div>
    `;
  },

  /* ════════════════════════════════════════
     OPORTUNIDAD DETECTADA
  ════════════════════════════════════════ */
  _renderOpportunity(probs, confidence, over25, btts, h, a, advanced) {
    const conf   = confidence?.pct   ?? 60;
    const margin = confidence?.margin ?? 12;

    // Semáforo
    let oppLevel, oppColor, oppEmoji;
    if (conf > 70 && margin < 12) {
      oppLevel = I18n.t('opp_high');   oppColor = 'green'; oppEmoji = '🟢';
    } else if (conf >= 55) {
      oppLevel = I18n.t('opp_medium'); oppColor = 'orange'; oppEmoji = '🟡';
    } else {
      oppLevel = I18n.t('opp_risk');   oppColor = 'red';    oppEmoji = '🔴';
    }

    // Mercado sugerido — el de mayor probabilidad
    const markets = [
      { label: I18n.t('opp_winner_home', h.shortName || h.name), pct: probs.home },
      { label: I18n.t('opp_winner_away', a.shortName || a.name), pct: probs.away },
      { label: I18n.t('opp_over25'),  pct: over25 ?? 0 },
      { label: I18n.t('opp_btts'),    pct: btts   ?? 0 },
    ];
    if (advanced?.cards?.intensity === 'high') {
      markets.push({ label: I18n.t('opp_cards'), pct: 72 });
    }
    const best = markets.reduce((a, b) => b.pct > a.pct ? b : a);

    return `
      <div class="opp-card anim-fade-up ${oppColor}">
        <div class="opp-header">
          <span class="opp-title">${I18n.t('opp_title')}</span>
          <span class="opp-badge ${oppColor}">${oppEmoji} ${oppLevel}</span>
        </div>
        <div class="opp-market">
          <span class="opp-market-label">${I18n.t('opp_market')}:</span>
          <span class="opp-market-value">${best.label}</span>
          <span class="opp-market-pct ${oppColor}">${best.pct}%</span>
        </div>
        <div class="opp-conf-row">
          <div class="opp-conf-bar-track">
            <div class="opp-conf-bar-fill ${oppColor}" style="width:${conf}%"></div>
          </div>
          <span class="opp-conf-text">${conf}% ${I18n.t('confidence_label').toLowerCase()}</span>
        </div>
      </div>
    `;
  },

  /* ════════════════════════════════════════
     TOP 3 MERCADOS
  ════════════════════════════════════════ */
  _renderTop3Markets(probs, over25, btts, h, a, advanced) {
    const markets = [
      { label: I18n.t('opp_winner_home', h.shortName || h.name), pct: probs.home,  icon: '🏠' },
      { label: I18n.t('opp_winner_away', a.shortName || a.name), pct: probs.away,  icon: '✈️' },
      { label: I18n.t('prob_draw'),                               pct: probs.draw,  icon: '🤝' },
      { label: I18n.t('opp_over25'),                              pct: over25 ?? 0, icon: '⚽' },
      { label: I18n.t('opp_btts'),                                pct: btts   ?? 0, icon: '🎯' },
    ];
    if (advanced?.cards?.intensity === 'high') {
      markets.push({ label: I18n.t('opp_cards'), pct: 72, icon: '🟨' });
    }

    const top3 = [...markets].sort((a, b) => b.pct - a.pct).slice(0, 3);

    const rows = top3.map((m, i) => {
      const barW = Math.min(100, m.pct);
      const color = m.pct >= 65 ? 'green' : m.pct >= 50 ? 'orange' : 'red';
      return `
        <div class="top3-row">
          <span class="top3-rank">${i + 1}</span>
          <span class="top3-icon">${m.icon}</span>
          <div class="top3-body">
            <span class="top3-label">${m.label}</span>
            <div class="top3-bar-track">
              <div class="top3-bar-fill ${color}" style="width:${barW}%"></div>
            </div>
          </div>
          <span class="top3-pct ${color}">${m.pct}%</span>
        </div>
      `;
    }).join('');

    return `
      <div class="top3-card anim-fade-up anim-stagger-2">
        <p class="top3-title">${I18n.t('top3_title')}</p>
        ${rows}
      </div>
    `;
  },

  /* ════════════════════════════════════════
     FORTALEZA OFENSIVA
  ════════════════════════════════════════ */
  _renderOffensiveStrength(goals, h, a) {
    const xgH = goals?.home ?? 0;
    const xgA = goals?.away ?? 0;
    const maxXG = Math.max(xgH, xgA, 0.5);
    const pctH = Math.round((xgH / maxXG) * 100);
    const pctA = Math.round((xgA / maxXG) * 100);
    const colorH = xgH >= 1.8 ? 'green' : xgH >= 1.2 ? 'orange' : 'red';
    const colorA = xgA >= 1.8 ? 'green' : xgA >= 1.2 ? 'orange' : 'red';

    return `
      <div class="offense-card anim-fade-up anim-stagger-2">
        <p class="offense-title">${I18n.t('offense_title')}</p>
        <div class="offense-row">
          <span class="offense-team">${this._logo(h, 20)} <span>${h.shortName || h.name}</span></span>
          <div class="offense-bar-track">
            <div class="offense-bar-fill ${colorH}" style="width:${pctH}%"></div>
          </div>
          <span class="offense-xg ${colorH}">${xgH} xG</span>
        </div>
        <div class="offense-row">
          <span class="offense-team">${this._logo(a, 20)} <span>${a.shortName || a.name}</span></span>
          <div class="offense-bar-track">
            <div class="offense-bar-fill ${colorA}" style="width:${pctA}%"></div>
          </div>
          <span class="offense-xg ${colorA}">${xgA} xG</span>
        </div>
      </div>
    `;
  },

  /* ════════════════════════════════════════
     RESUMEN RÁPIDO
  ════════════════════════════════════════ */
  _renderQuickSummary(probs, over25, btts, risk, h, a) {
    const maxP   = Math.max(probs.home, probs.draw, probs.away);
    const favTeam = probs.home >= probs.away ? (h.shortName || h.name) : (a.shortName || a.name);
    const favPct  = maxP;

    const overYes  = (over25 ?? 0) >= 55;
    const bttsYes  = (btts   ?? 0) >= 55;
    const riskKey  = risk === 'low' ? 'summary_risk_low' : risk === 'medium' ? 'summary_risk_medium' : 'summary_risk_high';
    const riskColor = risk === 'low' ? 'green' : risk === 'medium' ? 'orange' : 'red';

    const items = [
      { icon: '⭐', label: I18n.t('summary_fav'),    value: `${favTeam} (${favPct}%)`, color: 'primary' },
      { icon: overYes ? '✅' : '❌', label: overYes ? I18n.t('summary_over')    : I18n.t('summary_no_over'),  value: `${over25 ?? '—'}%`, color: overYes ? 'green' : 'red' },
      { icon: bttsYes ? '✅' : '❌', label: bttsYes ? I18n.t('summary_btts_yes') : I18n.t('summary_btts_no'), value: `${btts ?? '—'}%`,   color: bttsYes ? 'green' : 'red' },
      { icon: risk === 'low' ? '🟢' : risk === 'medium' ? '🟡' : '🔴', label: I18n.t(riskKey), value: '', color: riskColor },
    ];

    return `
      <div class="summary-card anim-fade-up anim-stagger-4">
        <p class="summary-title">${I18n.t('summary_title')}</p>
        <div class="summary-list">
          ${items.map(item => `
            <div class="summary-item">
              <span class="summary-icon">${item.icon}</span>
              <span class="summary-label">${item.label}</span>
              ${item.value ? `<span class="summary-value ${item.color}">${item.value}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /* ════════════════════════════════════════
     RENDIMIENTO POR VENUE (casa/fuera)
  ════════════════════════════════════════ */
  _renderVenuePerformance(homeTeam, awayTeam) {
    const hv = homeTeam?.venueForm;
    const av = awayTeam?.venueForm;

    // Solo mostrar si al menos uno tiene datos de venue
    if (!hv && !av) return '';

    const fmtForm = (form = []) => form.slice(0, 5).map(r =>
      `<span class="venue-dot ${r === 'W' ? 'w' : r === 'D' ? 'd' : 'l'}">${r}</span>`
    ).join('');

    const fmtRecord = (v) => v
      ? `${v.wins}V · ${v.draws}E · ${v.losses}D`
      : '—';

    const homeLabel = I18n.t('venue_home');
    const awayLabel = I18n.t('venue_away');
    const title     = I18n.t('venue_title');

    const homeColor = hv ? (hv.winRate >= 0.6 ? 'green' : hv.winRate >= 0.4 ? 'orange' : 'red') : '';
    const awayColor = av ? (av.winRate >= 0.6 ? 'green' : av.winRate >= 0.4 ? 'orange' : 'red') : '';

    return `
      <div class="venue-card anim-fade-up anim-stagger-3">
        <p class="venue-title">${title}</p>
        <div class="venue-rows">

          ${hv ? `
          <div class="venue-row">
            <div class="venue-team-info">
              ${this._logo(homeTeam, 20)}
              <span class="venue-team-name">${homeTeam.shortName || homeTeam.name}</span>
              <span class="venue-badge">${homeLabel}</span>
            </div>
            <div class="venue-stats">
              <span class="venue-record ${homeColor}">${fmtRecord(hv)}</span>
              <div class="venue-form-dots">${fmtForm(hv.form)}</div>
            </div>
            <div class="venue-xg">
              <span class="venue-xg-val">${hv.avgGoalsFor}⚽</span>
              <span class="venue-xg-sub">${hv.avgGoalsAgainst}🥅</span>
            </div>
          </div>` : ''}

          ${av ? `
          <div class="venue-row">
            <div class="venue-team-info">
              ${this._logo(awayTeam, 20)}
              <span class="venue-team-name">${awayTeam.shortName || awayTeam.name}</span>
              <span class="venue-badge away">${awayLabel}</span>
            </div>
            <div class="venue-stats">
              <span class="venue-record ${awayColor}">${fmtRecord(av)}</span>
              <div class="venue-form-dots">${fmtForm(av.form)}</div>
            </div>
            <div class="venue-xg">
              <span class="venue-xg-val">${av.avgGoalsFor}⚽</span>
              <span class="venue-xg-sub">${av.avgGoalsAgainst}🥅</span>
            </div>
          </div>` : ''}

        </div>
      </div>
    `;
  },

  /* ════════════════════════════════════════
     ADVANCED METRICS SECTION
  ════════════════════════════════════════ */
  _renderAdvancedMetrics(adv) {
    if (!adv || adv.error) {
      return ''; // sin datos — no mostrar sección
    }

    const { overUnder, btts, cards } = adv;

    /* ── Over/Under ── */
    const ouPct   = overUnder?.over?.pct ?? 0;
    const ouLevel = overUnder?.over?.level ?? 'medium';
    const ouLabel = ouLevel === 'high'
      ? I18n.t('adv_ou_over_high')
      : ouLevel === 'low'
        ? I18n.t('adv_ou_under_high')
        : I18n.t('adv_ou_over_medium');
    const ouColor = ouLevel === 'high' ? 'green' : ouLevel === 'low' ? 'red' : 'orange';

    /* ── BTTS ── */
    const bttsPct   = btts?.pct ?? 0;
    const bttsLevel = btts?.level ?? 'medium';
    const bttsLabel = bttsLevel === 'high'
      ? I18n.t('adv_btts_high')
      : bttsLevel === 'low'
        ? I18n.t('adv_btts_low')
        : I18n.t('adv_btts_medium');
    const bttsColor = bttsLevel === 'high' ? 'green' : bttsLevel === 'low' ? 'red' : 'orange';

    /* ── Tarjetas ── */
    const cardIntensity = cards?.intensity ?? 'medium';
    const cardLabel = cardIntensity === 'high'
      ? I18n.t('adv_cards_high')
      : cardIntensity === 'low'
        ? I18n.t('adv_cards_low')
        : I18n.t('adv_cards_medium');
    const cardColor = cardIntensity === 'high' ? 'red' : cardIntensity === 'low' ? 'green' : 'orange';

    return `
      <div class="page-section anim-fade-up anim-stagger-3" style="margin-bottom:12px;">
        <p class="section-title">${I18n.t('adv_title')}</p>
      </div>
      <div class="adv-metrics-grid anim-fade-up anim-stagger-3">

        <!-- Over/Under 2.5 -->
        <div class="adv-card ${ouColor}">
          <div class="adv-card-icon">⚽</div>
          <div class="adv-card-body">
            <div class="adv-card-label">${I18n.t('adv_ou_label')}</div>
            <div class="adv-card-value">${ouLabel}</div>
            <div class="adv-card-sub">${I18n.t('adv_ou_avg', overUnder?.avgGoals ?? '—')}</div>
          </div>
          <div class="adv-card-pct ${ouColor}">${ouPct}%</div>
        </div>

        <!-- BTTS -->
        <div class="adv-card ${bttsColor}">
          <div class="adv-card-icon">🎯</div>
          <div class="adv-card-body">
            <div class="adv-card-label">${I18n.t('adv_btts_label')}</div>
            <div class="adv-card-value">${bttsLabel}</div>
            <div class="adv-card-sub">BTTS ${bttsPct}%</div>
          </div>
          <div class="adv-card-pct ${bttsColor}">${bttsPct}%</div>
        </div>

        <!-- Tarjetas -->
        <div class="adv-card ${cardColor}" style="grid-column: 1 / -1;">
          <div class="adv-card-icon">🟨</div>
          <div class="adv-card-body">
            <div class="adv-card-label">${I18n.t('adv_cards_label')}</div>
            <div class="adv-card-value">${cardLabel}</div>
            <div class="adv-card-sub">${I18n.t('adv_cards_expected', cards?.expected ?? '—')}${cards?.moreCardsTeam ? ' · ' + I18n.t('adv_cards_team', cards.moreCardsTeam) : ''}</div>
          </div>
          <div class="adv-card-intensity ${cardColor}">
            ${'●'.repeat(cardIntensity === 'high' ? 3 : cardIntensity === 'medium' ? 2 : 1)}${'○'.repeat(cardIntensity === 'high' ? 0 : cardIntensity === 'medium' ? 1 : 2)}
          </div>
        </div>

      </div>
    `;
  },

  /* ════════════════════════════════════════
     HALFTIME BREAKDOWN SECTION
  ════════════════════════════════════════ */
  _renderHalfTime({ homeTeam: h, awayTeam: a, halfTime: ht }) {
    // Scale bars relative to max xG value across all 4 slots
    const max = Math.max(ht.firstHalf.home, ht.firstHalf.away, ht.secondHalf.home, ht.secondHalf.away, 0.01);
    const pct = (v) => Math.min(100, Math.round((v / max) * 100));

    const halfRow = (label, cls, val) => `
      <div class="half-team-row">
        <div class="half-team-header">
          <span class="half-team-name">${label}</span>
          <span class="half-team-xg ${cls}">${val} xG</span>
        </div>
        <div class="half-mini-bar-track">
          <div class="half-mini-bar-fill ${cls}" data-target="${pct(val)}" style="width:0%"></div>
        </div>
      </div>`;

    return `
      <div class="halftime-section anim-fade-up anim-stagger-2">
        <div class="halftime-card">
          <p class="halftime-title">${I18n.t('halftime_title')}</p>
          <div class="halftime-grid">
            <div class="half-col">
              <div class="half-col-header">
                <span class="half-col-icon">1️⃣</span>
                <span class="half-col-label">${I18n.t('half1_label')}</span>
              </div>
              ${halfRow(h.shortName, 'home', ht.firstHalf.home)}
              ${halfRow(a.shortName, 'away', ht.firstHalf.away)}
            </div>
            <div class="half-col">
              <div class="half-col-header">
                <span class="half-col-icon">2️⃣</span>
                <span class="half-col-label">${I18n.t('half2_label')}</span>
              </div>
              ${halfRow(h.shortName, 'home', ht.secondHalf.home)}
              ${halfRow(a.shortName, 'away', ht.secondHalf.away)}
            </div>
          </div>
          <div class="half-total-row">
            <span class="half-total-label">${I18n.t('halftime_total')}</span>
            <span class="half-total-first">${I18n.t('half1_short')}: ${ht.firstHalf.total}</span>
            <span class="half-total-second">${I18n.t('half2_short')}: ${ht.secondHalf.total}</span>
          </div>
        </div>
      </div>`;
  },

  /* ════════════════════════════════════════
     POST-RENDER ANIMATIONS
  ════════════════════════════════════════ */

  triggerBarAnimations() {
    requestAnimationFrame(() => {
      // Probability bars
      document.querySelectorAll('.prob-bar-fill').forEach(bar => {
        const target = parseInt(bar.dataset.target || 0);
        setTimeout(() => { bar.style.width = target + '%'; }, 100);
      });

      // Confidence bar
      const confFill = document.querySelector('.confidence-fill');
      if (confFill) {
        const target = parseInt(confFill.dataset.target || 0);
        setTimeout(() => { confFill.style.width = target + '%'; }, 200);
      }

      // Halftime mini bars
      document.querySelectorAll('.half-mini-bar-fill').forEach(bar => {
        const target = parseFloat(bar.dataset.target || 0);
        setTimeout(() => { bar.style.width = target + '%'; }, 300);
      });

      // Comparison bars (T5.4)
      document.querySelectorAll('.comp-bar').forEach(bar => {
        const target = bar.style.width; // ya está en el style inline del HTML
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = target; }, 400);
      });

      // Animated counters
      document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        this._animateCount(el, 0, target, 1200);
      });
    });
  },

  _animateCount(el, from, to, duration) {
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * eased) + '%';
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  /* ════════════════════════════════════════
     [FASE 2 & 3] WORLD CUP — Standings por grupos
     Renderiza grupos A-H con tabla compacta por grupo.
     No modifica renderStandings() de ligas.
  ════════════════════════════════════════ */
  renderWCStandings() {
    const groups = ApiService.getWCGroupedStandings();
    const league = LEAGUES['WORLD_CUP'];

    // Guard: si no hay grupos, mostrar estado de carga
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return `
        <div class="hero-banner page-enter">
          <p class="hero-greeting">🌍 FIFA World Cup 2026</p>
          <h2 class="hero-title">Fase de <span class="text-gradient">${I18n.t('wc_phase_groups')}</span></h2>
        </div>
        <div style="padding:40px 20px;text-align:center;color:var(--clr-text3);">
          <div style="font-size:2rem;margin-bottom:12px;">⏳</div>
          <p>Cargando grupos...</p>
        </div>
      `;
    }

    const groupHtml = groups.map((g, gi) => {
      const rows = g.teams.map((s, i) => {
        const t = s.team;
        const visual = this._flag(t, 22);  // bandera, no logo de club
        const cls = s.position <= 2 ? 'wc-qualify' : '';
        return `
          <div class="standings-row ${cls} anim-fade-up anim-stagger-${Math.min(i+1,5)}">
            <div class="standings-pos ${s.position <= 2 ? 'top3' : ''}">${s.position}</div>
            <div class="standings-team-col">${visual}<span class="standings-name">${t.shortName || t.name}</span></div>
            <div class="standings-cell">${s.played}</div>
            <div class="standings-cell">${s.gf}</div>
            <div class="standings-cell">${s.ga}</div>
            <div class="standings-cell" style="color:${s.gd >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'}">${s.gd >= 0 ? '+' : ''}${s.gd}</div>
            <div class="standings-pts">${s.points}</div>
          </div>`;
      }).join('');

      return `
        <div class="wc-group-block anim-fade-up anim-stagger-${gi + 1}" style="margin-bottom:20px;">
          <div class="wc-group-header">
            <span class="wc-group-label">Grupo ${g.group}</span>
            <span class="wc-qualify-hint">${I18n.t('wc_group_qualifies')}</span>
          </div>
          <div class="standings-header-row" style="padding:0 14px;">
            <div class="standings-pos">#</div>
            <div class="standings-team-col" style="flex:1">${I18n.t('standings_team')}</div>
            <div class="standings-cell" title="${I18n.t('standings_pj_title')}">${I18n.t('standings_pj')}</div>
            <div class="standings-cell" title="${I18n.t('standings_gf_title')}">${I18n.t('standings_gf')}</div>
            <div class="standings-cell" title="${I18n.t('standings_gc_title')}">${I18n.t('standings_gc')}</div>
            <div class="standings-cell" title="${I18n.t('standings_dg_title')}">${I18n.t('standings_dg')}</div>
            <div class="standings-pts">${I18n.t('standings_pts')}</div>
          </div>
          ${rows}
        </div>`;
    }).join('');

    return `
      <div class="hero-banner page-enter">
        <p class="hero-greeting">🌍 FIFA World Cup 2026</p>
        <h2 class="hero-title">Fase de <span class="text-gradient">${I18n.t('wc_phase_groups')}</span></h2>
        <p class="hero-subtitle">USA · Canada · Mexico</p>
      </div>
      <div style="padding:0 16px 32px; max-width:480px; margin:0 auto;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 12px;background:var(--clr-surface2);border-radius:12px;font-size:.7rem;color:var(--clr-text3);">
          <div style="width:10px;height:10px;border-radius:2px;background:#C8A84B;flex-shrink:0;"></div>
          <span>${I18n.t('wc_group_qualifies')} — ${I18n.t('wc_phase_groups')}</span>
        </div>
        ${groupHtml}
      </div>
    `;
  },

  /* ════════════════════════════════════════
     [FASE 6] WORLD CUP — Próximos partidos
     Mismo formato visual que _renderUpcomingMatches de ligas.
  ════════════════════════════════════════ */
  renderWCUpcoming() {
    const fixtures = ApiService.getWCFixtures();
    if (!fixtures.length) {
      return `<div class="upcoming-empty">
        <div class="upcoming-empty-icon">📅</div>
        <p class="upcoming-empty-title">Sin partidos programados</p>
      </div>`;
    }

    const byGroup = {};
    fixtures.forEach(f => {
      const key = f.jornada || 'Próximos partidos';
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(f);
    });

    return Object.entries(byGroup).map(([jornada, matches], gi) => `
      <div class="upcoming-group anim-fade-up anim-stagger-${gi + 4}">
        <div class="upcoming-group-header">
          <span class="upcoming-jornada">${jornada}</span>
        </div>
        ${matches.map(m => this._upcomingMatchCard(m)).join('')}
      </div>
    `).join('');
  },

  /* ── Tooltip Helper (T5.3) ── */
  _renderTooltip(key, floating = false) {
    return `
      <div class="tooltip-wrap" ${floating ? 'style="position:absolute; top:12px; right:12px;"' : ''}>
        <div class="tooltip-icon">i</div>
        <div class="tooltip-box">${I18n.t(key)}</div>
      </div>`;
  },

};

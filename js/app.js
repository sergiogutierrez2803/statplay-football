/**
 * StatPlay Football — app.js
 * SPA Router + global state + event delegation
 */

/* ─── App State ─── */
const AppState = {
  currentPage: 'home',
  selectedHome: null,
  selectedAway: null,
  currentLeague: localStorage.getItem('statplay_league') || null,
  activeTeams: [],
  pickingRole: null,
  analysisResult: null,
  allTeams: [],
  leagues: [],
};

/* ─── Error Tracking (T6.4) ─── */
window.onerror = function(msg, url, line, col, error) {
  console.error('[StatPlay Error]', { msg, url, line, col, stack: error?.stack });
  // Opcional: Enviar a un endpoint de logs en el futuro
  return false;
};

/* ─── Connectivity (T6.2) ─── */
window.addEventListener('online',  () => {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.style.display = 'none';
});
window.addEventListener('offline', () => {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.style.display = 'flex';
});

/* ─── Router ─── */
const Router = {
  async navigate(page, params = {}) {
    AppState.currentPage = page;
    this._updateNav(page);

    const content = document.getElementById('page-content');
    content.innerHTML = '';   // clear

    switch (page) {
      case 'league-selector':
        if (!AppState.leagues.length) {
          AppState.leagues = await ApiService.getLeagues();
        }
        content.innerHTML = UI.renderLeagueSelector(AppState.leagues);
        this._bindLeagueSelector();
        break;

      case 'home':
        if (!AppState.currentLeague) { Router.navigate('league-selector'); return; }
        // World Cup usa sus propios datos locales
        if (AppState.currentLeague === 'WORLD_CUP') {
          AppState.allTeams = ApiService.getWCTeams();
        } else {
          AppState.allTeams = await ApiService.getTeams();
        }
        content.innerHTML = await UI.renderHome();
        this._bindHome();
        break;

      case 'matches':
        if (!AppState.currentLeague) { Router.navigate('league-selector'); return; }
        if (AppState.currentLeague === 'WORLD_CUP') {
          AppState.allTeams = ApiService.getWCTeams();
        } else {
          AppState.allTeams = await ApiService.getTeams();
        }
        content.innerHTML = await UI.renderMatches();
        this._bindSelectorPage();
        break;

      case 'analysis-loading':
        content.innerHTML = UI.renderAnalysisLoading(params.home, params.away);
        this._bindBack();

        try {
          const ligaId = AppState.currentLeague || 'PL';
          const isWC   = ligaId === 'WORLD_CUP';

          let result;

          if (isWC) {
            // [FASE 7] World Cup: usar WorldCupPredictionEngine exclusivo
            const homeStats = ApiService.getWCTeamStats(params.home.id);
            const awayStats = ApiService.getWCTeamStats(params.away.id);
            if (!homeStats || !awayStats) throw new Error('Sin datos para estas selecciones.');

            // Usar motor WC si está disponible, sino fallback a engine.js con ajustes
            const wcEngine = (typeof WorldCupPredictionEngine !== 'undefined' && WorldCupPredictionEngine)
              ? WorldCupPredictionEngine
              : PredictionEngine;

            const wcOptions = wcEngine === PredictionEngine
              ? { noHomeAdvantage: true, h2hWeight: 0.70 }
              : {};

            result = await wcEngine.analyze(homeStats, awayStats, wcOptions);
            // Preservar logoUrl (bandera) y datos visuales
            result.homeTeam = { ...homeStats, ...(result.homeTeam || {}), logoUrl: homeStats.logoUrl, emoji: homeStats.emoji };
            result.awayTeam = { ...awayStats, ...(result.awayTeam || {}), logoUrl: awayStats.logoUrl, emoji: awayStats.emoji };
            result.fuentesUsadas = 'local_wc';
          } else {
            result = await ApiService.getStoredPrediction(params.home.id, params.away.id);
          }

          if (result && result.probs) {
            if (!result.homeTeam) {
              result.homeTeam = params.home;
              result.awayTeam = params.away;
            }
            if (!result.h2h) {
              result.h2h = await ApiService.getH2H(params.home.id, params.away.id);
            }
            if (!result.homeTeam.form) result.homeTeam.form = [];
            if (!result.awayTeam.form) result.awayTeam.form = [];

            // [FASE 7] WC: métricas avanzadas locales (no llamar backend con IDs string)
            if (isWC) {
              result.advanced = null; // métricas avanzadas no disponibles para WC en esta fase
            } else {
              result.advanced = await ApiService.getAdvancedMetrics(
                params.home.id, params.away.id,
                result.goals?.total || 2.5,
                result.btts || 55
              );
            }

            // [FASE 1] Pasar por el adaptador (Early Return Pattern)
            AppState.analysisResult = await PredictionEngine.analyze(result.homeTeam, result.awayTeam, {}, result);

          } else {
            // Fallback: calcular con engine.js local usando datos de la DB
            const homeStats = await ApiService.getTeamStats(params.home.id);
            const awayStats = await ApiService.getTeamStats(params.away.id);

            if (!homeStats || !awayStats) throw new Error("Sin datos estadísticos para estos equipos.");

            const engineResult = await PredictionEngine.analyze(homeStats, awayStats);
            // Cargar métricas avanzadas también para el fallback
            engineResult.advanced = await ApiService.getAdvancedMetrics(
              params.home.id, params.away.id,
              engineResult.goals?.total || 2.5,
              engineResult.btts || 55
            );
            AppState.analysisResult = engineResult;
          }

          await Router.navigate('analysis');
        } catch (e) {
          console.error('Error Analizando:', e);
          content.innerHTML = `<div class="empty-state">
            <div class="empty-icon">❌</div>
            <div class="empty-title">Error en el análisis</div>
            <div class="empty-desc">${e.message || 'No se pudo generar el análisis. Intenta de nuevo.'}</div>
          </div>`;
        }
        break;

      case 'analysis':
        if (!AppState.analysisResult) { Router.navigate('home'); return; }
        content.innerHTML = UI.renderAnalysis(AppState.analysisResult);
        this._bindBack();
        // Trigger animations after paint
        requestAnimationFrame(() => {
          setTimeout(() => UI.triggerBarAnimations(), 80);
        });
        break;

      case 'standings':
        if (AppState.currentLeague === 'WORLD_CUP') {
          // [FASE 2 & 3] World Cup: standings por grupos
          content.innerHTML = UI.renderWCStandings();
        } else {
          content.innerHTML = await UI.renderStandings();
        }
        break;

      case 'about':
        content.innerHTML = UI.renderAbout();
        break;

      default:
        console.warn('[Router] 404 - Página no encontrada:', page);
        Router.navigate('home');
        break;
    }

    // Scroll top on every navigation
    content.scrollTop = 0;
  },

  _updateNav(page) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page ||
        (page === 'analysis' && btn.dataset.page === 'matches') ||
        (page === 'analysis-loading' && btn.dataset.page === 'matches'));
    });
  },

  /* ── Event Binders ── */

  _bindBack() {
    const btn = document.getElementById('btn-back');
    if (btn) btn.addEventListener('click', () => Router.navigate('home'));
  },

  _bindHome() {
    // Reset state
    AppState.selectedHome = null;
    AppState.selectedAway = null;

    // Botón cambiar liga — actúa como selector global
    document.getElementById('btn-change-league')?.addEventListener('click', () => {
      Router.navigate('league-selector');
    });

    // Team picker buttons
    document.getElementById('btn-pick-home')?.addEventListener('click', () => {
      Modal.open('home');
    });
    document.getElementById('btn-pick-away')?.addEventListener('click', () => {
      Modal.open('away');
    });

    // Analyze button
    document.getElementById('btn-analyze')?.addEventListener('click', () => {
      if (AppState.selectedHome && AppState.selectedAway) {
        Router.navigate('analysis-loading', {
          home: AppState.selectedHome,
          away: AppState.selectedAway,
        });
      }
    });

    // Tarjetas de partido próximo — click para analizar directamente
    document.querySelectorAll('.upcoming-match-card.clickable').forEach(card => {
      card.addEventListener('click', () => {
        const rawHome = card.dataset.home;
        const rawAway = card.dataset.away;
        const homeId  = isNaN(rawHome) ? rawHome : parseInt(rawHome);
        const awayId  = isNaN(rawAway) ? rawAway : parseInt(rawAway);
        const home    = AppState.allTeams.find(t => String(t.id) === String(homeId));
        const away    = AppState.allTeams.find(t => String(t.id) === String(awayId));
        if (home && away) {
          Router.navigate('analysis-loading', { home, away });
        }
      });
    });

    Modal.bind();
  },

  _bindSelectorPage() {
    AppState.selectedHome = null;
    AppState.selectedAway = null;

    document.getElementById('btn-pick-home')?.addEventListener('click', () => Modal.open('home'));
    document.getElementById('btn-pick-away')?.addEventListener('click', () => Modal.open('away'));
    document.getElementById('btn-analyze')?.addEventListener('click', () => {
      if (AppState.selectedHome && AppState.selectedAway) {
        Router.navigate('analysis-loading', {
          home: AppState.selectedHome,
          away: AppState.selectedAway,
        });
      }
    });
    Modal.bind();
  },

  _bindLeagueSelector() {
    // Soporta tanto .league-card (viejo) como .splash-league-btn (nuevo diseño)
    document.querySelectorAll('[data-league]').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.dataset.league;
        AppState.currentLeague = id;
        localStorage.setItem('statplay_league', id);

        AppState.selectedHome = null;
        AppState.selectedAway = null;

        await this._loadLeagueLogos();
        this.updateAppBranding();
        Router.navigate('home');
      });
    });
  },

updateAppBranding() {
    const league = AppState.leagues.find(l => l.id === (AppState.currentLeague || 'PL'));
    if (!league) return;

    // Header
    const headerName = document.getElementById('header-league-name');
    if (headerName) headerName.textContent = league.nombre || league.name;

    // Browser title
    const title = document.getElementById('app-title');
    const leagueName = league.nombre || league.name;
    if (title) title.textContent = `StatPlay — ${leagueName} Analytics`;
    else document.title = `StatPlay — ${leagueName} Analytics`;
  },

  async _loadLeagueLogos() {
    if (!AppState.leagues.length) {
      AppState.leagues = await ApiService.getLeagues();
    }

    const league = AppState.leagues.find(l => l.id === (AppState.currentLeague || 'PL'));
    if (!league) return;

    // World Cup: logo ya está definido localmente, no buscar en TheSportsDB
    if (league.isWorldCup || league.id === 'WORLD_CUP') {
      if (typeof LEAGUES !== 'undefined' && LEAGUES['WORLD_CUP']) {
        league.logoUrl = league.logoUrl || LEAGUES['WORLD_CUP'].logoUrl;
      }
      return;
    }

    try {
      const currentLogoUrl = league.logoUrl || league.logo_url;
      if (!currentLogoUrl) {
        const fetched = await ApiService.fetchLeagueLogo(league.sdbId || league.sdb_id);
        if (fetched) league.logoUrl = fetched;
      }
      if (typeof LEAGUES !== 'undefined' && LEAGUES[league.id]) {
        LEAGUES[league.id].logoUrl = league.logoUrl || currentLogoUrl;
      }
    } catch (e) {
      console.warn('Logos error:', e);
    }
  },
};

/* ─── Modal Controller ─── */
const Modal = {
  open(role) {
    AppState.pickingRole = role;
    const modal = document.getElementById('team-modal');
    const title = document.getElementById('modal-title');
    const isWC  = AppState.currentLeague === 'WORLD_CUP';
    if (title) {
      if (isWC) {
        title.textContent = role === 'home' ? I18n.t('wc_modal_home') : I18n.t('wc_modal_away');
      } else {
        title.textContent = role === 'home' ? I18n.t('modal_title_home') : I18n.t('modal_title_away');
      }
    }
    if (modal) modal.classList.add('open');

    // Reset search
    const search = document.getElementById('modal-search');
    if (search) { search.value = ''; this._filterList(''); search.focus(); }

    // Mark current selection
    const current = role === 'home' ? AppState.selectedHome : AppState.selectedAway;
    document.querySelectorAll('.team-option').forEach(opt => {
      opt.classList.toggle('chosen', current && String(opt.dataset.teamId) === String(current.id));
    });
  },

  close() {
    const modal = document.getElementById('team-modal');
    if (modal) modal.classList.remove('open');
    AppState.pickingRole = null;
  },

  bind() {
    const modal = document.getElementById('team-modal');
    if (!modal) return;

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Search filter
    const search = document.getElementById('modal-search');
    if (search) {
      search.addEventListener('input', (e) => this._filterList(e.target.value));
    }

    // Team selection
    const list = document.getElementById('modal-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const option = e.target.closest('.team-option');
        if (!option) return;

        // Soporta IDs numéricos (ligas) y string (World Cup)
        const rawId  = option.dataset.teamId;
        const teamId = isNaN(rawId) ? rawId : parseInt(rawId);
        const team   = AppState.allTeams.find(t => String(t.id) === String(teamId));
        if (!team) return;

        this._selectTeam(team);
      });
    }
  },

  _selectTeam(team) {
    const role = AppState.pickingRole;

    // Prevent same team on both sides
    if (role === 'home' && String(AppState.selectedAway?.id) === String(team.id)) { this._shake(); return; }
    if (role === 'away' && String(AppState.selectedHome?.id) === String(team.id)) { this._shake(); return; }

    const logoHtml = team.logoUrl
      ? `<img src="${team.logoUrl}" alt="${team.shortName}"
           style="width:38px;height:38px;object-fit:contain;"
           onerror="this.onerror=null;this.replaceWith(document.createTextNode('${team.emoji}'))">`
      : team.emoji;

    if (role === 'home') {
      AppState.selectedHome = team;
      const badge = document.getElementById('home-badge');
      const name  = document.getElementById('home-name');
      if (badge) badge.innerHTML = logoHtml;
      if (name)  name.textContent = team.name;
      document.getElementById('btn-pick-home')?.classList.add('selected');
    } else {
      AppState.selectedAway = team;
      const badge = document.getElementById('away-badge');
      const name  = document.getElementById('away-name');
      if (badge) badge.innerHTML = logoHtml;
      if (name)  name.textContent = team.name;
      document.getElementById('btn-pick-away')?.classList.add('selected');
    }

    const btn = document.getElementById('btn-analyze');
    if (btn) btn.disabled = !(AppState.selectedHome && AppState.selectedAway);
    this.close();
  },

  _filterList(query) {
    const q = query.toLowerCase().trim();
    // [FASE 8] Para World Cup, normalizar el query también (ej: "USA" → "United States")
    const qNorm = (typeof TeamLogoMap !== 'undefined' && TeamLogoMap.normalizeNationalTeamName)
      ? TeamLogoMap.normalizeNationalTeamName(q).toLowerCase()
      : q;

    document.querySelectorAll('.team-option').forEach(opt => {
      const name     = opt.querySelector('.team-option-name')?.textContent?.toLowerCase() || '';
      const nameNorm = (typeof TeamLogoMap !== 'undefined' && TeamLogoMap.normalizeNationalTeamName)
        ? TeamLogoMap.normalizeNationalTeamName(name).toLowerCase()
        : name;
      // Buscar en nombre original Y en nombre normalizado Y en el query normalizado
      const matches = name.includes(q) || nameNorm.includes(q) || name.includes(qNorm) || nameNorm.includes(qNorm);
      opt.style.display = matches ? '' : 'none';
    });
  },

  _shake() {
    const modalSheet = document.querySelector('.modal-sheet');
    if (!modalSheet) return;
    modalSheet.style.animation = 'none';
    modalSheet.offsetHeight; // reflow
    modalSheet.style.animation = 'shake 0.3s ease';
    setTimeout(() => modalSheet.style.animation = '', 400);
  },
};

/* ─── Header Logo ─── */
function bindHeaderLogo() {
  document.getElementById('btn-logo')?.addEventListener('click', () => {
    Router.navigate('home');
  });
}

/* ─── Botón de logout ─── */
function bindLogoutBtn() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;

  // Mostrar solo si hay sesión activa
  const session = Auth.getSession();
  btn.style.display = session ? 'flex' : 'none';

  btn.addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) {
      Auth.logout();
    }
  });
}

/* ─── Botón de idioma ─── */
function bindLangBtn() {
  const btn = document.getElementById('btn-lang');
  if (!btn) return;

  // Render inicial del botón
  I18n.updateBtn();

  // Usar un flag para evitar listeners duplicados
  if (btn._langBound) return;
  btn._langBound = true;

  btn.addEventListener('click', () => {
    const next = I18n.getLang() === 'es' ? 'en' : 'es';
    I18n.setLang(next); // dispara LANG_CHANGED automáticamente
  });
}

/* ─── Escuchar LANG_CHANGED globalmente ─── */
document.addEventListener('LANG_CHANGED', (e) => {
  const page = AppState.currentPage;

  // Actualizar botón de idioma en login si está visible
  _updateLoginLang();

  // Re-renderizar la página actual
  if (page === 'analysis' && AppState.analysisResult) {
    const content = document.getElementById('page-content');
    content.innerHTML = UI.renderAnalysis(AppState.analysisResult);
    Router._bindBack();
    requestAnimationFrame(() => setTimeout(() => UI.triggerBarAnimations(), 80));
  } else if (page === 'home') {
    Router.navigate('home');
  } else if (page === 'matches') {
    Router.navigate('matches');
  } else if (page === 'standings') {
    Router.navigate('standings');
  } else if (page === 'about') {
    Router.navigate('about');
  } else if (page === 'league-selector') {
    Router.navigate('league-selector');
  }
});

/* ─── Actualizar textos del login cuando cambia idioma ─── */
function _updateLoginLang() {
  const authScreen = document.getElementById('auth-screen');
  if (!authScreen || authScreen.style.display === 'none') return;

  const subtitle   = authScreen.querySelector('.auth-subtitle');
  const emailInput = authScreen.querySelector('#auth-email-input');
  const loginBtn   = authScreen.querySelector('#auth-btn-login');
  const guestBtn   = authScreen.querySelector('#auth-btn-guest');
  const legal      = authScreen.querySelector('.auth-legal');
  const langToggle = authScreen.querySelector('#auth-lang-toggle');

  if (subtitle)   subtitle.innerHTML = I18n.t('auth_subtitle');
  if (emailInput) emailInput.placeholder = I18n.t('auth_email_placeholder');
  if (loginBtn && !loginBtn.disabled) loginBtn.textContent = I18n.t('auth_btn_login');
  if (guestBtn)   guestBtn.textContent = I18n.t('auth_btn_guest');
  if (legal)      legal.textContent = I18n.t('auth_legal');
  if (langToggle) {
    const isEs = I18n.getLang() === 'es';
    langToggle.querySelector('[data-lang="es"]')?.classList.toggle('active', isEs);
    langToggle.querySelector('[data-lang="en"]')?.classList.toggle('active', !isEs);
  }
}

/* ─── Bottom Nav ─── */
function bindBottomNav() {
  document.getElementById('bottom-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    const page = btn.dataset.page;
    if (page && page !== AppState.currentPage) {
      Router.navigate(page);
    }
  });
}

/* ─── Splash Inteligente (T6.6) ─── */
function initSplash() {
  return new Promise(resolve => {
    const minTime = new Promise(res => setTimeout(res, 1800)); // Tiempo mínimo para branding
    const loadData = async () => {
        try { 
            // Cargar datos esenciales antes de quitar el splash
            if (!AppState.leagues.length) AppState.leagues = await ApiService.getLeagues();
        } catch(e) { console.warn('Pre-load error:', e); }
    };

    Promise.all([minTime, loadData()]).then(() => {
      const splash = document.getElementById('splash-screen');
      splash?.classList.add('fade-out');
      setTimeout(() => {
        splash?.remove();
        document.getElementById('app')?.classList.remove('hidden');
        resolve();
      }, 500);
    });
  });
}

/* ─── Boot ─── */
async function bootApp() {
  try {
    // ── FASE 4: Verificar sesión antes de cargar la app ──
    if (!Auth.isLoggedIn()) {
      _showAuthScreen();
      return; // No continuar hasta que el usuario se autentique
    }

    await _bootMain();
  } catch (e) {
    console.error('Boot error:', e);
    document.getElementById('splash-screen')?.remove();
    document.getElementById('app')?.classList.remove('hidden');
    await Router.navigate('league-selector');
    bindHeaderLogo();
    bindBottomNav();
    bindLangBtn();
    bindLogoutBtn();
  }
}

/* ── Mostrar pantalla de login ── */
function _showAuthScreen() {
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';

  const authScreen = document.getElementById('auth-screen');
  if (!authScreen) return;
  authScreen.style.display = 'flex';

  // Aplicar idioma actual al login
  _updateLoginLang();

  // Evitar listeners duplicados con flag
  if (authScreen._eventsBound) return;
  authScreen._eventsBound = true;

  const emailInput = document.getElementById('auth-email-input');
  const loginBtn   = document.getElementById('auth-btn-login');
  const guestBtn   = document.getElementById('auth-btn-guest');
  const errorMsg   = document.getElementById('auth-error-msg');

  function _setError(msg) {
    if (errorMsg) errorMsg.textContent = msg || '';
    if (msg) emailInput?.classList.add('error');
    else emailInput?.classList.remove('error');
  }

  function _setLoading(loading) {
    if (!loginBtn) return;
    loginBtn.disabled = loading;
    loginBtn.innerHTML = loading
      ? `<span class="auth-spinner"></span>${I18n.t('auth_loading')}`
      : I18n.t('auth_btn_login');
  }

  emailInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn?.click();
  });

  emailInput?.addEventListener('input', () => _setError(''));

  loginBtn?.addEventListener('click', async () => {
    const email = emailInput?.value?.trim() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      _setError(I18n.t('auth_err_empty'));
      emailInput?.focus();
      return;
    }
    if (!emailRegex.test(email)) {
      _setError(I18n.t('auth_err_invalid'));
      emailInput?.focus();
      return;
    }

    _setLoading(true);
    _setError('');

    try {
      await Auth.loginWithEmail(email);
      _hideAuthAndBoot();
    } catch (e) {
      _setError(e.message || I18n.t('auth_err_network'));
      _setLoading(false);
    }
  });

  guestBtn?.addEventListener('click', () => {
    Auth.loginAsGuest();
    _hideAuthAndBoot();
  });

  // Selector de idioma en login
  const langToggle = document.getElementById('auth-lang-toggle');
  if (langToggle && !langToggle._bound) {
    langToggle._bound = true;
    langToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const lang = btn.dataset.lang;
      if (lang && lang !== I18n.getLang()) {
        I18n.setLang(lang); // dispara LANG_CHANGED → _updateLoginLang()
      }
    });
  }
}

/* ── Ocultar login y arrancar la app ── */
async function _hideAuthAndBoot() {
  const authScreen = document.getElementById('auth-screen');
  if (authScreen) {
    authScreen.style.opacity = '0';
    authScreen.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { authScreen.style.display = 'none'; }, 300);
  }
  await _bootMain();
}

/* ── Arranque principal de la app (después de autenticación) ── */
async function _bootMain() {
  try {
    await initSplash();

    if (!AppState.leagues.length) {
      AppState.leagues = await ApiService.getLeagues();
    }

    // Validar que la liga guardada en localStorage existe en la lista actual
    if (AppState.currentLeague) {
      const valid = AppState.leagues.some(l => l.id === AppState.currentLeague)
        || AppState.currentLeague === 'WORLD_CUP';
      if (!valid) {
        AppState.currentLeague = null;
        localStorage.removeItem('statplay_league');
      }
    }

    await Router.navigate('league-selector');

    bindHeaderLogo();
    bindBottomNav();
    bindLangBtn();
    bindLogoutBtn();
  } catch (e) {
    console.error('Boot main error:', e);
    document.getElementById('splash-screen')?.remove();
    document.getElementById('app')?.classList.remove('hidden');
    await Router.navigate('league-selector');
    bindHeaderLogo();
    bindBottomNav();
    bindLangBtn();
    bindLogoutBtn();
  }
}

document.addEventListener('DOMContentLoaded', bootApp);

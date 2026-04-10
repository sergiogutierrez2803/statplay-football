/**
 * StatPlay — auth.js
 * Sistema de acceso simple: email o invitado.
 * No modifica ninguna lógica de predicción, APIs ni motor.
 *
 * Sesión guardada en localStorage:
 *   statplay_user_id      → id del usuario (número o string guest_xxx)
 *   statplay_user_email   → email (null para invitados)
 *   statplay_is_guest     → 'true' si es invitado
 *   statplay_is_premium   → 'true' si tiene acceso premium
 *   statplay_session_token → token criptográfico de sesión (solo usuarios registrados)
 */

const Auth = (() => {

  const KEYS = {
    userId:       'statplay_user_id',
    email:        'statplay_user_email',
    isGuest:      'statplay_is_guest',
    isPremium:    'statplay_is_premium',
    sessionToken: 'statplay_session_token',
  };

  /* ── Leer sesión actual ── */
  function getSession() {
    const userId = localStorage.getItem(KEYS.userId);
    if (!userId) return null;
    return {
      id:           userId,
      email:        localStorage.getItem(KEYS.email) || null,
      isGuest:      localStorage.getItem(KEYS.isGuest) === 'true',
      isPremium:    localStorage.getItem(KEYS.isPremium) === 'true',
      sessionToken: localStorage.getItem(KEYS.sessionToken) || null,
    };
  }

  /* ── Leer solo el token (para incluir en headers de API) ── */
  function getSessionToken() {
    return localStorage.getItem(KEYS.sessionToken) || null;
  }

  /* ── Guardar sesión ── */
  function _saveSession(user, sessionToken) {
    localStorage.setItem(KEYS.userId,    String(user.id));
    localStorage.setItem(KEYS.email,     user.email || '');
    localStorage.setItem(KEYS.isGuest,   user.isGuest   ? 'true' : 'false');
    localStorage.setItem(KEYS.isPremium, user.is_premium ? 'true' : 'false');
    if (sessionToken) {
      localStorage.setItem(KEYS.sessionToken, sessionToken);
    } else {
      localStorage.removeItem(KEYS.sessionToken);
    }
  }

  /* ── Cerrar sesión — limpia localStorage y muestra pantalla de login ── */
  function logout() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));

    // Ocultar la app y mostrar la pantalla de login
    const authScreen = document.getElementById('auth-screen');
    const appEl      = document.getElementById('app');
    const splash     = document.getElementById('splash-screen');

    if (appEl)   appEl.classList.add('hidden');
    if (splash)  splash.style.display = 'none';

    if (authScreen) {
      // Limpiar estado del formulario
      const emailInput = document.getElementById('auth-email-input');
      const errorMsg   = document.getElementById('auth-error-msg');
      const loginBtn   = document.getElementById('auth-btn-login');
      if (emailInput) emailInput.value = '';
      if (errorMsg)   errorMsg.textContent = '';
      // Usar I18n si está disponible, texto raw como fallback
      if (loginBtn) {
        loginBtn.innerHTML = (typeof I18n !== 'undefined') ? I18n.t('auth_btn_login') : 'Entrar';
        loginBtn.disabled = false;
      }

      // Mostrar con animación
      authScreen.style.opacity    = '0';
      authScreen.style.display    = 'flex';
      authScreen.style.transition = 'opacity 0.3s ease';
      requestAnimationFrame(() => {
        authScreen.style.opacity = '1';
      });
    }

    // Ocultar botón de logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.style.display = 'none';

    // Re-vincular eventos del login (definido en app.js como global)
    if (typeof _showAuthScreen === 'function') {
      _showAuthScreen();
    }
  }

  /* ── Login con email ── */
  async function loginWithEmail(email) {
    const baseUrl = (typeof window !== 'undefined' && window.__BACKEND_URL__)
      ? window.__BACKEND_URL__
      : 'http://localhost:3000/api';

    let res;
    try {
      res = await fetch(`${baseUrl}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch (networkErr) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Respuesta inválida del servidor.');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Error al iniciar sesión.');
    }

    // Guardar sesión con session_token del backend
    _saveSession({ ...data.user, isGuest: false }, data.sessionToken || null);
    return data.user;
  }

  /* ── Entrar como invitado (sin backend) ── */
  function loginAsGuest() {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const user = { id: guestId, email: null, is_premium: false, isGuest: true };
    _saveSession(user, null); // invitados no tienen session_token
    return user;
  }

  /* ── Verificar si hay sesión activa ── */
  function isLoggedIn() {
    return !!localStorage.getItem(KEYS.userId);
  }

  return { getSession, getSessionToken, loginWithEmail, loginAsGuest, logout, isLoggedIn };

})();

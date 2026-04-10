/**
 * StatPlay — nationalFlagMap.js
 * Sistema de banderas para selecciones nacionales (World Cup).
 *
 * REGLA: Este archivo es EXCLUSIVO para World Cup.
 *        TeamLogoMap sigue siendo exclusivo para clubes de ligas.
 *        Nunca mezclar ambos sistemas.
 *
 * Fuente de banderas: flagcdn.com (CDN gratuito, sin auth, alta disponibilidad)
 * Formato: https://flagcdn.com/w80/{código-iso2}.png
 *
 * Uso:
 *   NationalFlagMap.getFlag('Argentina')  → URL de bandera
 *   NationalFlagMap.getFlag('ARG')        → URL de bandera (alias)
 *   NationalFlagMap.getEmoji('France')    → '🇫🇷'
 */

const NationalFlagMap = (() => {

  /* ── Mapa: nombre normalizado → { flag, emoji, iso2 } ── */
  const _FLAGS = {
    // Grupo A
    'united states': { flag: 'https://flagcdn.com/w80/us.png', emoji: '🇺🇸', iso2: 'us' },
    'canada':        { flag: 'https://flagcdn.com/w80/ca.png', emoji: '🇨🇦', iso2: 'ca' },
    'mexico':        { flag: 'https://flagcdn.com/w80/mx.png', emoji: '🇲🇽', iso2: 'mx' },
    'new zealand':   { flag: 'https://flagcdn.com/w80/nz.png', emoji: '🇳🇿', iso2: 'nz' },
    // Grupo B
    'argentina':     { flag: 'https://flagcdn.com/w80/ar.png', emoji: '🇦🇷', iso2: 'ar' },
    'chile':         { flag: 'https://flagcdn.com/w80/cl.png', emoji: '🇨🇱', iso2: 'cl' },
    'peru':          { flag: 'https://flagcdn.com/w80/pe.png', emoji: '🇵🇪', iso2: 'pe' },
    'australia':     { flag: 'https://flagcdn.com/w80/au.png', emoji: '🇦🇺', iso2: 'au' },
    // Grupo C
    'france':        { flag: 'https://flagcdn.com/w80/fr.png', emoji: '🇫🇷', iso2: 'fr' },
    'belgium':       { flag: 'https://flagcdn.com/w80/be.png', emoji: '🇧🇪', iso2: 'be' },
    'morocco':       { flag: 'https://flagcdn.com/w80/ma.png', emoji: '🇲🇦', iso2: 'ma' },
    'croatia':       { flag: 'https://flagcdn.com/w80/hr.png', emoji: '🇭🇷', iso2: 'hr' },
    // Grupo D
    'brazil':        { flag: 'https://flagcdn.com/w80/br.png', emoji: '🇧🇷', iso2: 'br' },
    'colombia':      { flag: 'https://flagcdn.com/w80/co.png', emoji: '🇨🇴', iso2: 'co' },
    'uruguay':       { flag: 'https://flagcdn.com/w80/uy.png', emoji: '🇺🇾', iso2: 'uy' },
    'ecuador':       { flag: 'https://flagcdn.com/w80/ec.png', emoji: '🇪🇨', iso2: 'ec' },
    // Grupo E
    'spain':         { flag: 'https://flagcdn.com/w80/es.png', emoji: '🇪🇸', iso2: 'es' },
    'portugal':      { flag: 'https://flagcdn.com/w80/pt.png', emoji: '🇵🇹', iso2: 'pt' },
    'turkey':        { flag: 'https://flagcdn.com/w80/tr.png', emoji: '🇹🇷', iso2: 'tr' },
    'georgia':       { flag: 'https://flagcdn.com/w80/ge.png', emoji: '🇬🇪', iso2: 'ge' },
    // Grupo F
    'germany':       { flag: 'https://flagcdn.com/w80/de.png', emoji: '🇩🇪', iso2: 'de' },
    'netherlands':   { flag: 'https://flagcdn.com/w80/nl.png', emoji: '🇳🇱', iso2: 'nl' },
    'austria':       { flag: 'https://flagcdn.com/w80/at.png', emoji: '🇦🇹', iso2: 'at' },
    'scotland':      { flag: 'https://flagcdn.com/w80/gb-sct.png', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', iso2: 'gb-sct' },
    // Grupo G
    'england':       { flag: 'https://flagcdn.com/w80/gb-eng.png', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', iso2: 'gb-eng' },
    'switzerland':   { flag: 'https://flagcdn.com/w80/ch.png', emoji: '🇨🇭', iso2: 'ch' },
    'denmark':       { flag: 'https://flagcdn.com/w80/dk.png', emoji: '🇩🇰', iso2: 'dk' },
    'serbia':        { flag: 'https://flagcdn.com/w80/rs.png', emoji: '🇷🇸', iso2: 'rs' },
    // Grupo H
    'japan':         { flag: 'https://flagcdn.com/w80/jp.png', emoji: '🇯🇵', iso2: 'jp' },
    'korea republic':{ flag: 'https://flagcdn.com/w80/kr.png', emoji: '🇰🇷', iso2: 'kr' },
    'iran':          { flag: 'https://flagcdn.com/w80/ir.png', emoji: '🇮🇷', iso2: 'ir' },
    'saudi arabia':  { flag: 'https://flagcdn.com/w80/sa.png', emoji: '🇸🇦', iso2: 'sa' },
  };

  /* ── Aliases: código ISO3 / variantes → nombre canónico ── */
  const _ALIASES = {
    'usa': 'united states', 'us': 'united states',
    'arg': 'argentina',
    'fra': 'france',
    'bra': 'brazil',
    'ger': 'germany', 'deu': 'germany',
    'esp': 'spain',
    'eng': 'england',
    'por': 'portugal',
    'ned': 'netherlands', 'hol': 'netherlands', 'holland': 'netherlands',
    'bel': 'belgium',
    'jpn': 'japan',
    'kor': 'korea republic', 'south korea': 'korea republic', 'korea rep': 'korea republic',
    'mex': 'mexico',
    'can': 'canada',
    'uru': 'uruguay',
    'col': 'colombia',
    'chi': 'chile',
    'per': 'peru',
    'aus': 'australia',
    'nzl': 'new zealand',
    'mar': 'morocco',
    'cro': 'croatia',
    'tur': 'turkey',
    'geo': 'georgia',
    'aut': 'austria',
    'sco': 'scotland',
    'sui': 'switzerland',
    'den': 'denmark',
    'srb': 'serbia',
    'irn': 'iran',
    'sau': 'saudi arabia',
    'ecu': 'ecuador',
    'brasil': 'brazil',
    'deutschland': 'germany',
    'espana': 'spain',
    'argentina national football team': 'argentina',
    'france national football team': 'france',
    'brazil national football team': 'brazil',
    'germany national football team': 'germany',
    'spain national football team': 'spain',
    'england national football team': 'england',
  };

  /* ── Normalizar nombre antes de buscar ── */
  function _normalize(name) {
    if (!name) return '';
    const lower = name.toLowerCase().trim();
    return _ALIASES[lower] || lower;
  }

  /* ── API pública ── */
  return {
    /**
     * Obtener URL de bandera.
     * @param {string} name - Nombre o código de la selección
     * @returns {string|null} URL de bandera o null si no se encuentra
     */
    getFlag(name) {
      const key = _normalize(name);
      const entry = _FLAGS[key];
      if (entry) return entry.flag;
      console.warn(`[NationalFlagMap] Bandera no encontrada: "${name}" (normalizado: "${key}")`);
      // Fallback: placeholder de bandera neutral
      return 'https://flagcdn.com/w80/un.png'; // bandera ONU como neutral
    },

    /**
     * Obtener emoji de bandera.
     * @param {string} name
     * @returns {string} emoji de bandera o '🌍' como fallback
     */
    getEmoji(name) {
      const key = _normalize(name);
      return _FLAGS[key]?.emoji || '🌍';
    },

    /**
     * Obtener entrada completa { flag, emoji, iso2 }.
     * @param {string} name
     * @returns {object|null}
     */
    get(name) {
      const key = _normalize(name);
      return _FLAGS[key] || null;
    },

    /**
     * Verificar si existe bandera para una selección.
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
      return !!_FLAGS[_normalize(name)];
    },

    /** Normalizar nombre de selección (expuesto para uso externo) */
    normalize: _normalize,
  };

})();

// Exportar para Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NationalFlagMap;
}

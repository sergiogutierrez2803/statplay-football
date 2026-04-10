/**
 * StatPlay — flagsMap.js
 * FUENTE ÚNICA DE VERDAD para banderas de selecciones nacionales.
 *
 * REGLAS:
 *  - Solo para World Cup. Ligas siguen usando TeamLogoMap (escudos de clubes).
 *  - Siempre normalizar nombre antes de buscar bandera.
 *  - Nunca dejar imagen rota — DEFAULT_FLAG como fallback obligatorio.
 *  - Resolución w320 para mejor calidad visual.
 *
 * USO:
 *   FlagsMap.getFlag('Argentina')          → URL bandera
 *   FlagsMap.getFlag('USA')                → URL bandera (alias normalizado)
 *   FlagsMap.getFlag('Korea Rep.')         → URL bandera
 *   FlagsMap.normalize('EE. UU.')          → 'United States'
 *   FlagsMap.getWorldCupLogo()             → URL logo FIFA WC 2026
 */

/* ══════════════════════════════════════════════════════════════
   CONSTANTES GLOBALES
══════════════════════════════════════════════════════════════ */

/** Bandera neutral — ONU. Nunca dejar imagen rota. */
const DEFAULT_FLAG = 'https://flagcdn.com/w320/un.png';

/** Logo oficial FIFA World Cup 2026
 *  Fuente primaria: archivo local /assets/images/worldcup2026_logo.svg
 *  Fallback 1: Wikipedia (SVG oficial FIFA)
 *  Fallback 2: API-Football CDN
 */
const WORLD_CUP_LOGO = '/assets/images/worldcup2026_logo.svg';
const WORLD_CUP_LOGO_REMOTE = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/FIFA_World_Cup_2026_logo.svg/512px-FIFA_World_Cup_2026_logo.svg.png';

/** Fallback logo si el oficial falla */
const WORLD_CUP_LOGO_FALLBACK = 'https://media.api-sports.io/football/leagues/1.png';

/* ══════════════════════════════════════════════════════════════
   MAPA CENTRAL DE BANDERAS
   Clave: nombre oficial en inglés (exactamente como en worldCupGroups.js)
   Valor: URL flagcdn.com w320 (alta resolución)
══════════════════════════════════════════════════════════════ */
const FLAGS = {
  // Grupo A
  'Mexico':                  'https://flagcdn.com/w320/mx.png',
  'South Africa':            'https://flagcdn.com/w320/za.png',
  'Korea Republic':          'https://flagcdn.com/w320/kr.png',
  'Czech Republic':          'https://flagcdn.com/w320/cz.png',
  // Grupo B
  'Canada':                  'https://flagcdn.com/w320/ca.png',
  'Bosnia and Herzegovina':  'https://flagcdn.com/w320/ba.png',
  'Qatar':                   'https://flagcdn.com/w320/qa.png',
  'Switzerland':             'https://flagcdn.com/w320/ch.png',
  // Grupo C
  'Brazil':                  'https://flagcdn.com/w320/br.png',
  'Morocco':                 'https://flagcdn.com/w320/ma.png',
  'Haiti':                   'https://flagcdn.com/w320/ht.png',
  'Scotland':                'https://flagcdn.com/w320/gb-sct.png',
  // Grupo D
  'United States':           'https://flagcdn.com/w320/us.png',
  'Paraguay':                'https://flagcdn.com/w320/py.png',
  'Australia':               'https://flagcdn.com/w320/au.png',
  'Turkey':                  'https://flagcdn.com/w320/tr.png',
  // Grupo E
  'Germany':                 'https://flagcdn.com/w320/de.png',
  'Curacao':                 'https://flagcdn.com/w320/cw.png',
  'Ivory Coast':             'https://flagcdn.com/w320/ci.png',
  'Ecuador':                 'https://flagcdn.com/w320/ec.png',
  // Grupo F
  'Netherlands':             'https://flagcdn.com/w320/nl.png',
  'Japan':                   'https://flagcdn.com/w320/jp.png',
  'Sweden':                  'https://flagcdn.com/w320/se.png',
  'Tunisia':                 'https://flagcdn.com/w320/tn.png',
  // Grupo G
  'Belgium':                 'https://flagcdn.com/w320/be.png',
  'Egypt':                   'https://flagcdn.com/w320/eg.png',
  'Iran':                    'https://flagcdn.com/w320/ir.png',
  'New Zealand':             'https://flagcdn.com/w320/nz.png',
  // Grupo H
  'Spain':                   'https://flagcdn.com/w320/es.png',
  'Cape Verde':              'https://flagcdn.com/w320/cv.png',
  'Saudi Arabia':            'https://flagcdn.com/w320/sa.png',
  'Uruguay':                 'https://flagcdn.com/w320/uy.png',
  // Grupo I
  'France':                  'https://flagcdn.com/w320/fr.png',
  'Senegal':                 'https://flagcdn.com/w320/sn.png',
  'Iraq':                    'https://flagcdn.com/w320/iq.png',
  'Norway':                  'https://flagcdn.com/w320/no.png',
  // Grupo J
  'Argentina':               'https://flagcdn.com/w320/ar.png',
  'Algeria':                 'https://flagcdn.com/w320/dz.png',
  'Austria':                 'https://flagcdn.com/w320/at.png',
  'Jordan':                  'https://flagcdn.com/w320/jo.png',
  // Grupo K
  'Portugal':                'https://flagcdn.com/w320/pt.png',
  'DR Congo':                'https://flagcdn.com/w320/cd.png',
  'Uzbekistan':              'https://flagcdn.com/w320/uz.png',
  'Colombia':                'https://flagcdn.com/w320/co.png',
  // Grupo L
  'England':                 'https://flagcdn.com/w320/gb-eng.png',
  'Croatia':                 'https://flagcdn.com/w320/hr.png',
  'Ghana':                   'https://flagcdn.com/w320/gh.png',
  'Panama':                  'https://flagcdn.com/w320/pa.png',
  // Equipos adicionales (playoffs / reserva)
  'Italy':                   'https://flagcdn.com/w320/it.png',
  'Ukraine':                 'https://flagcdn.com/w320/ua.png',
  'Denmark':                 'https://flagcdn.com/w320/dk.png',
  'Serbia':                  'https://flagcdn.com/w320/rs.png',
  'Georgia':                 'https://flagcdn.com/w320/ge.png',
  'Chile':                   'https://flagcdn.com/w320/cl.png',
  'Peru':                    'https://flagcdn.com/w320/pe.png',
  'Bolivia':                 'https://flagcdn.com/w320/bo.png',
  'Venezuela':               'https://flagcdn.com/w320/ve.png',
  'Indonesia':               'https://flagcdn.com/w320/id.png',
  'Honduras':                'https://flagcdn.com/w320/hn.png',
  'Costa Rica':              'https://flagcdn.com/w320/cr.png',
  'Jamaica':                 'https://flagcdn.com/w320/jm.png',
  'Nigeria':                 'https://flagcdn.com/w320/ng.png',
  'Cameroon':                'https://flagcdn.com/w320/cm.png',
  'Wales':                   'https://flagcdn.com/w320/gb-wls.png',
  'Northern Ireland':        'https://flagcdn.com/w320/gb-nir.png',
  'Republic of Ireland':     'https://flagcdn.com/w320/ie.png',
  'Poland':                  'https://flagcdn.com/w320/pl.png',
  'Romania':                 'https://flagcdn.com/w320/ro.png',
  'Albania':                 'https://flagcdn.com/w320/al.png',
  'Slovakia':                'https://flagcdn.com/w320/sk.png',
  'Kosovo':                  'https://flagcdn.com/w320/xk.png',
  'North Macedonia':         'https://flagcdn.com/w320/mk.png',
  'Trinidad and Tobago':     'https://flagcdn.com/w320/tt.png',
};

/* ══════════════════════════════════════════════════════════════
   TABLA DE NORMALIZACIÓN COMPLETA
   Convierte cualquier variante de nombre → nombre oficial en inglés.
   Cubre: códigos ISO, variantes en español, variantes API, nombres largos.
══════════════════════════════════════════════════════════════ */
const NAME_ALIASES = {
  // ── Inglés: códigos ISO 3 letras ──
  'usa':   'United States', 'us':    'United States',
  'arg':   'Argentina',     'fra':   'France',
  'bra':   'Brazil',        'ger':   'Germany',
  'esp':   'Spain',         'eng':   'England',
  'por':   'Portugal',      'ned':   'Netherlands',
  'bel':   'Belgium',       'jpn':   'Japan',
  'kor':   'Korea Republic','mex':   'Mexico',
  'can':   'Canada',        'uru':   'Uruguay',
  'col':   'Colombia',      'ecu':   'Ecuador',
  'aus':   'Australia',     'mar':   'Morocco',
  'cro':   'Croatia',       'tur':   'Turkey',
  'geo':   'Georgia',       'aut':   'Austria',
  'sco':   'Scotland',      'sui':   'Switzerland',
  'den':   'Denmark',       'srb':   'Serbia',
  'irn':   'Iran',          'sau':   'Saudi Arabia',
  'sen':   'Senegal',       'nga':   'Nigeria',
  'gha':   'Ghana',         'pan':   'Panama',
  'nor':   'Norway',        'swe':   'Sweden',
  'alg':   'Algeria',       'uzb':   'Uzbekistan',
  'qat':   'Qatar',         'irq':   'Iraq',
  'jor':   'Jordan',        'tun':   'Tunisia',
  'par':   'Paraguay',      'bol':   'Bolivia',
  'per':   'Peru',          'chi':   'Chile',
  'nzl':   'New Zealand',   'hai':   'Haiti',
  'rsa':   'South Africa',  'cze':   'Czech Republic',
  'bih':   'Bosnia and Herzegovina',
  'civ':   'Ivory Coast',   'cod':   'DR Congo',
  'cpv':   'Cape Verde',    'cmr':   'Cameroon',
  'ita':   'Italy',         'ukr':   'Ukraine',
  'ven':   'Venezuela',     'idn':   'Indonesia',
  'hon':   'Honduras',      'crc':   'Costa Rica',
  'jam':   'Jamaica',       'tri':   'Trinidad and Tobago',
  'pol':   'Poland',        'rou':   'Romania',
  'alb':   'Albania',       'svk':   'Slovakia',
  'mkd':   'North Macedonia',

  // ── Variantes API largas ──
  'argentina national football team':  'Argentina',
  'france national football team':     'France',
  'brazil national football team':     'Brazil',
  'germany national football team':    'Germany',
  'spain national football team':      'Spain',
  'england national football team':    'England',
  'portugal national football team':   'Portugal',
  'netherlands national football team':'Netherlands',
  'belgium national football team':    'Belgium',
  'japan national football team':      'Japan',
  'united states national football team': 'United States',
  'mexico national football team':     'Mexico',

  // ── Variantes comunes en inglés ──
  'south korea':             'Korea Republic',
  'korea rep':               'Korea Republic',
  'korea rep.':              'Korea Republic',
  'republic of korea':       'Korea Republic',
  'united states of america':'United States',
  'holland':                 'Netherlands',
  'deutschland':             'Germany',
  'brasil':                  'Brazil',
  'ivory coast':             'Ivory Coast',
  "cote d'ivoire":           'Ivory Coast',
  'cote divoire':            'Ivory Coast',
  'dr congo':                'DR Congo',
  'democratic republic of congo': 'DR Congo',
  'congo dr':                'DR Congo',
  'drc':                     'DR Congo',
  'cape verde':              'Cape Verde',
  'cabo verde':              'Cape Verde',
  'bosnia':                  'Bosnia and Herzegovina',
  'ir iran':                 'Iran',
  'turkiye':                 'Turkey',

  // ── Variantes en español ──
  'estados unidos':          'United States',
  'ee. uu.':                 'United States',
  'ee.uu.':                  'United States',
  'países bajos':            'Netherlands',
  'paises bajos':            'Netherlands',
  'holanda':                 'Netherlands',
  'alemania':                'Germany',
  'francia':                 'France',
  'brasil':                  'Brazil',
  'españa':                  'Spain',
  'espana':                  'Spain',
  'inglaterra':              'England',
  'corea del sur':           'Korea Republic',
  'república de corea':      'Korea Republic',
  'republica de corea':      'Korea Republic',
  'corea rep.':              'Korea Republic',
  'irán':                    'Iran',
  'ri de irán':              'Iran',
  'ri de iran':              'Iran',
  'rd congo':                'DR Congo',
  'república democrática del congo': 'DR Congo',
  'republica democratica del congo': 'DR Congo',
  'chequia':                 'Czech Republic',
  'república checa':         'Czech Republic',
  'republica checa':         'Czech Republic',
  'méxico':                  'Mexico',
  'bélgica':                 'Belgium',
  'belgica':                 'Belgium',
  'suiza':                   'Switzerland',
  'suecia':                  'Sweden',
  'noruega':                 'Norway',
  'dinamarca':               'Denmark',
  'croacia':                 'Croatia',
  'turquía':                 'Turkey',
  'turquia':                 'Turkey',
  'austria':                 'Austria',
  'escocia':                 'Scotland',
  'costa de marfil':         'Ivory Coast',
  'argelia':                 'Algeria',
  'jordania':                'Jordan',
  'uzbekistán':              'Uzbekistan',
  'uzbekistan':              'Uzbekistan',
  'túnez':                   'Tunisia',
  'tunez':                   'Tunisia',
  'haití':                   'Haiti',
  'panamá':                  'Panama',
  'nueva zelanda':           'New Zealand',
  'nueva zelandia':          'New Zealand',
  'arabia saudita':          'Saudi Arabia',
  'arabia saudi':            'Saudi Arabia',
  'cabo verde':              'Cape Verde',
  'bosnia y herzegovina':    'Bosnia and Herzegovina',
  'senegal':                 'Senegal',
  'irak':                    'Iraq',
  'ghana':                   'Ghana',
  'nigeria':                 'Nigeria',
  'camerún':                 'Cameroon',
  'camerun':                 'Cameroon',
  'venezuela':               'Venezuela',
  'indonesia':               'Indonesia',
  'trinidad y tobago':       'Trinidad and Tobago',
  'polonia':                 'Poland',
  'rumania':                 'Romania',
  'rumanía':                 'Romania',
  'albania':                 'Albania',
  'eslovaquia':              'Slovakia',
  'macedonia del norte':     'North Macedonia',
  'irlanda del norte':       'Northern Ireland',
  'república de irlanda':    'Republic of Ireland',
  'gales':                   'Wales',
  'ucrania':                 'Ukraine',
  'italia':                  'Italy',
  'portugal':                'Portugal',
  'colombia':                'Colombia',
  'ecuador':                 'Ecuador',
  'paraguay':                'Paraguay',
  'bolivia':                 'Bolivia',
  'perú':                    'Peru',
  'peru':                    'Peru',
  'chile':                   'Chile',
  'uruguay':                 'Uruguay',
  'marruecos':               'Morocco',
  'egipto':                  'Egypt',
  'sudáfrica':               'South Africa',
  'sudafrica':               'South Africa',
  'japón':                   'Japan',
  'japon':                   'Japan',
  'australia':               'Australia',
  'canadá':                  'Canada',
  'canada':                  'Canada',
  'catar':                   'Qatar',
  'curaçao':                 'Curacao',
  'curazao':                 'Curacao',
};

/* ══════════════════════════════════════════════════════════════
   API PÚBLICA — FlagsMap
══════════════════════════════════════════════════════════════ */
const FlagsMap = (() => {

  /**
   * Normalizar nombre de selección a nombre oficial en inglés.
   * Elimina sufijos API, convierte variantes en español/inglés.
   * @param {string} name - nombre bruto (cualquier variante)
   * @returns {string} nombre oficial en inglés
   */
  function normalizeNationalTeamName(name) {
    if (!name) return '';
    const lower = String(name).toLowerCase().trim()
      // Quitar sufijos API comunes
      .replace(/\s+national\s+football\s+team$/i, '')
      .replace(/\s+national\s+team$/i, '')
      .replace(/\s+football\s+team$/i, '')
      .replace(/\s+fc$/i, '')
      .trim();

    // Buscar en alias (cubre códigos, variantes español, variantes API)
    if (NAME_ALIASES[lower]) return NAME_ALIASES[lower];

    // Si no hay alias, capitalizar primera letra de cada palabra
    // (para nombres que ya están en inglés pero en minúsculas)
    const inFlags = Object.keys(FLAGS).find(k => k.toLowerCase() === lower);
    if (inFlags) return inFlags;

    // Devolver con primera letra mayúscula como fallback
    return name.trim();
  }

  /**
   * Obtener URL de bandera oficial.
   * Normaliza el nombre antes de buscar.
   * Nunca devuelve null — usa DEFAULT_FLAG como fallback.
   * @param {string} name - nombre en cualquier variante
   * @returns {string} URL de bandera
   */
  function getFlag(name) {
    if (!name) return DEFAULT_FLAG;
    const normalized = normalizeNationalTeamName(name);
    const flag = FLAGS[normalized];
    if (!flag) {
      console.warn(`[FlagsMap] Bandera no encontrada: "${name}" → "${normalized}" — usando fallback`);
      return DEFAULT_FLAG;
    }
    return flag;
  }

  /**
   * Obtener logo oficial del Mundial 2026 con fallback.
   * @returns {{ src: string, fallback: string }}
   */
  function getWorldCupLogo() {
    return {
      src:      WORLD_CUP_LOGO,
      fallback: WORLD_CUP_LOGO_FALLBACK,
    };
  }

  /**
   * Generar HTML de imagen de bandera con fallback automático.
   * Listo para insertar en el DOM.
   * @param {string} name  - nombre de la selección
   * @param {string} alt   - texto alternativo
   * @param {string} style - estilos CSS adicionales
   * @returns {string} HTML string
   */
  function flagImg(name, alt, style = '') {
    const src = getFlag(name);
    const altText = alt || normalizeNationalTeamName(name);
    return `<img src="${src}" alt="${altText}" style="${style}" `
         + `onerror="this.onerror=null;this.src='${DEFAULT_FLAG}';">`;
  }

  /**
   * Generar HTML del logo del Mundial con fallback.
   * @param {string} style - estilos CSS adicionales
   * @returns {string} HTML string
   */
  function worldCupLogoImg(style = '') {
    // Cadena de fallbacks: local → Wikipedia → API-Football CDN
    return `<img src="${WORLD_CUP_LOGO}" alt="Copa Mundial 2026" style="${style}" `
         + `onerror="this.onerror=null;this.src='${WORLD_CUP_LOGO_REMOTE}';`
         + `this.onerror=function(){this.onerror=null;this.src='${WORLD_CUP_LOGO_FALLBACK}';};">`;
  }

  /**
   * Verificar si existe bandera para una selección.
   * @param {string} name
   * @returns {boolean}
   */
  function hasFlag(name) {
    const normalized = normalizeNationalTeamName(name);
    return !!FLAGS[normalized];
  }

  /**
   * Validar cobertura: devuelve equipos sin bandera.
   * @param {string[]} teamNames
   * @returns {string[]} nombres sin bandera
   */
  function validateCoverage(teamNames) {
    return teamNames.filter(n => !hasFlag(n));
  }

  return {
    normalizeNationalTeamName,
    getFlag,
    getWorldCupLogo,
    flagImg,
    worldCupLogoImg,
    hasFlag,
    validateCoverage,
    FLAGS,
    DEFAULT_FLAG,
    WORLD_CUP_LOGO,
    WORLD_CUP_LOGO_FALLBACK,
  };

})();

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FlagsMap, FLAGS, DEFAULT_FLAG, WORLD_CUP_LOGO };
}

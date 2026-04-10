/**
 * StatPlay — worldCupTeams.js
 * Fuente maestra oficial: 48 equipos clasificados FIFA World Cup 2026
 * Sede: USA · Canada · Mexico  |  Junio-Julio 2026
 *
 * REGLA: Este archivo es la fuente de verdad para nombres y grupos.
 *        La API solo se usa para fixtures y stats en tiempo real.
 *        Siempre normalizar nombres de API antes de comparar con este archivo.
 *
 * Estructura por equipo:
 *   name          → nombre oficial para mostrar en UI
 *   normalizedName→ nombre en minúsculas para comparación (sin acentos)
 *   group         → grupo A-L (12 grupos × 4 equipos = 48)
 *   flagCode      → código ISO 3166-1 alpha-2 para flagcdn.com
 *   shortName     → código 3 letras FIFA
 *   emoji         → emoji de bandera
 *   confederation → CONMEBOL | UEFA | CONCACAF | CAF | AFC | OFC
 *
 * Aliases de API conocidos (para normalización):
 *   "Argentina national football team" → "Argentina"
 *   "United States"                    → "United States"
 *   "Korea Republic"                   → "Korea Republic"
 *   "South Korea"                      → "Korea Republic"
 *   "USA"                              → "United States"
 */

const WC2026_TEAMS = [

  /* ══════════════════════════════════════
     GRUPO A
  ══════════════════════════════════════ */
  {
    name: 'United States',    normalizedName: 'united states',
    group: 'A', flagCode: 'us', shortName: 'USA', emoji: '🇺🇸',
    confederation: 'CONCACAF',
    apiAliases: ['usa', 'united states of america', 'us'],
  },
  {
    name: 'Panama',           normalizedName: 'panama',
    group: 'A', flagCode: 'pa', shortName: 'PAN', emoji: '🇵🇦',
    confederation: 'CONCACAF',
    apiAliases: ['panama'],
  },
  {
    name: 'Honduras',         normalizedName: 'honduras',
    group: 'A', flagCode: 'hn', shortName: 'HON', emoji: '🇭🇳',
    confederation: 'CONCACAF',
    apiAliases: ['honduras'],
  },
  {
    name: 'Morocco',          normalizedName: 'morocco',
    group: 'A', flagCode: 'ma', shortName: 'MAR', emoji: '🇲🇦',
    confederation: 'CAF',
    apiAliases: ['morocco', 'mar'],
  },

  /* ══════════════════════════════════════
     GRUPO B
  ══════════════════════════════════════ */
  {
    name: 'Argentina',        normalizedName: 'argentina',
    group: 'B', flagCode: 'ar', shortName: 'ARG', emoji: '🇦🇷',
    confederation: 'CONMEBOL',
    apiAliases: ['argentina', 'arg', 'argentina national football team'],
  },
  {
    name: 'Chile',            normalizedName: 'chile',
    group: 'B', flagCode: 'cl', shortName: 'CHI', emoji: '🇨🇱',
    confederation: 'CONMEBOL',
    apiAliases: ['chile', 'chi'],
  },
  {
    name: 'Peru',             normalizedName: 'peru',
    group: 'B', flagCode: 'pe', shortName: 'PER', emoji: '🇵🇪',
    confederation: 'CONMEBOL',
    apiAliases: ['peru', 'per'],
  },
  {
    name: 'Australia',        normalizedName: 'australia',
    group: 'B', flagCode: 'au', shortName: 'AUS', emoji: '🇦🇺',
    confederation: 'AFC',
    apiAliases: ['australia', 'aus'],
  },

  /* ══════════════════════════════════════
     GRUPO C
  ══════════════════════════════════════ */
  {
    name: 'France',           normalizedName: 'france',
    group: 'C', flagCode: 'fr', shortName: 'FRA', emoji: '🇫🇷',
    confederation: 'UEFA',
    apiAliases: ['france', 'fra', 'france national football team'],
  },
  {
    name: 'Belgium',          normalizedName: 'belgium',
    group: 'C', flagCode: 'be', shortName: 'BEL', emoji: '🇧🇪',
    confederation: 'UEFA',
    apiAliases: ['belgium', 'bel'],
  },
  {
    name: 'Croatia',          normalizedName: 'croatia',
    group: 'C', flagCode: 'hr', shortName: 'CRO', emoji: '🇭🇷',
    confederation: 'UEFA',
    apiAliases: ['croatia', 'cro'],
  },
  {
    name: 'Senegal',          normalizedName: 'senegal',
    group: 'C', flagCode: 'sn', shortName: 'SEN', emoji: '🇸🇳',
    confederation: 'CAF',
    apiAliases: ['senegal', 'sen'],
  },

  /* ══════════════════════════════════════
     GRUPO D
  ══════════════════════════════════════ */
  {
    name: 'Brazil',           normalizedName: 'brazil',
    group: 'D', flagCode: 'br', shortName: 'BRA', emoji: '🇧🇷',
    confederation: 'CONMEBOL',
    apiAliases: ['brazil', 'bra', 'brasil', 'brazil national football team'],
  },
  {
    name: 'Colombia',         normalizedName: 'colombia',
    group: 'D', flagCode: 'co', shortName: 'COL', emoji: '🇨🇴',
    confederation: 'CONMEBOL',
    apiAliases: ['colombia', 'col'],
  },
  {
    name: 'Paraguay',         normalizedName: 'paraguay',
    group: 'D', flagCode: 'py', shortName: 'PAR', emoji: '🇵🇾',
    confederation: 'CONMEBOL',
    apiAliases: ['paraguay', 'par'],
  },
  {
    name: 'Nigeria',          normalizedName: 'nigeria',
    group: 'D', flagCode: 'ng', shortName: 'NGA', emoji: '🇳🇬',
    confederation: 'CAF',
    apiAliases: ['nigeria', 'nga'],
  },

  /* ══════════════════════════════════════
     GRUPO E
  ══════════════════════════════════════ */
  {
    name: 'Spain',            normalizedName: 'spain',
    group: 'E', flagCode: 'es', shortName: 'ESP', emoji: '🇪🇸',
    confederation: 'UEFA',
    apiAliases: ['spain', 'esp', 'espana', 'spain national football team'],
  },
  {
    name: 'Portugal',         normalizedName: 'portugal',
    group: 'E', flagCode: 'pt', shortName: 'POR', emoji: '🇵🇹',
    confederation: 'UEFA',
    apiAliases: ['portugal', 'por'],
  },
  {
    name: 'Turkey',           normalizedName: 'turkey',
    group: 'E', flagCode: 'tr', shortName: 'TUR', emoji: '🇹🇷',
    confederation: 'UEFA',
    apiAliases: ['turkey', 'tur', 'turkiye'],
  },
  {
    name: 'Cameroon',         normalizedName: 'cameroon',
    group: 'E', flagCode: 'cm', shortName: 'CMR', emoji: '🇨🇲',
    confederation: 'CAF',
    apiAliases: ['cameroon', 'cmr'],
  },

  /* ══════════════════════════════════════
     GRUPO F
  ══════════════════════════════════════ */
  {
    name: 'Germany',          normalizedName: 'germany',
    group: 'F', flagCode: 'de', shortName: 'GER', emoji: '🇩🇪',
    confederation: 'UEFA',
    apiAliases: ['germany', 'ger', 'deutschland', 'germany national football team'],
  },
  {
    name: 'Netherlands',      normalizedName: 'netherlands',
    group: 'F', flagCode: 'nl', shortName: 'NED', emoji: '🇳🇱',
    confederation: 'UEFA',
    apiAliases: ['netherlands', 'ned', 'holland'],
  },
  {
    name: 'Austria',          normalizedName: 'austria',
    group: 'F', flagCode: 'at', shortName: 'AUT', emoji: '🇦🇹',
    confederation: 'UEFA',
    apiAliases: ['austria', 'aut'],
  },
  {
    name: 'Egypt',            normalizedName: 'egypt',
    group: 'F', flagCode: 'eg', shortName: 'EGY', emoji: '🇪🇬',
    confederation: 'CAF',
    apiAliases: ['egypt', 'egy'],
  },

  /* ══════════════════════════════════════
     GRUPO G
  ══════════════════════════════════════ */
  {
    name: 'England',          normalizedName: 'england',
    group: 'G', flagCode: 'gb-eng', shortName: 'ENG', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    confederation: 'UEFA',
    apiAliases: ['england', 'eng', 'england national football team'],
  },
  {
    name: 'Switzerland',      normalizedName: 'switzerland',
    group: 'G', flagCode: 'ch', shortName: 'SUI', emoji: '🇨🇭',
    confederation: 'UEFA',
    apiAliases: ['switzerland', 'sui'],
  },
  {
    name: 'Denmark',          normalizedName: 'denmark',
    group: 'G', flagCode: 'dk', shortName: 'DEN', emoji: '🇩🇰',
    confederation: 'UEFA',
    apiAliases: ['denmark', 'den'],
  },
  {
    name: 'South Africa',     normalizedName: 'south africa',
    group: 'G', flagCode: 'za', shortName: 'RSA', emoji: '🇿🇦',
    confederation: 'CAF',
    apiAliases: ['south africa', 'rsa'],
  },

  /* ══════════════════════════════════════
     GRUPO H
  ══════════════════════════════════════ */
  {
    name: 'Japan',            normalizedName: 'japan',
    group: 'H', flagCode: 'jp', shortName: 'JPN', emoji: '🇯🇵',
    confederation: 'AFC',
    apiAliases: ['japan', 'jpn'],
  },
  {
    name: 'Korea Republic',   normalizedName: 'korea republic',
    group: 'H', flagCode: 'kr', shortName: 'KOR', emoji: '🇰🇷',
    confederation: 'AFC',
    apiAliases: ['korea republic', 'kor', 'south korea', 'korea rep'],
  },
  {
    name: 'Iran',             normalizedName: 'iran',
    group: 'H', flagCode: 'ir', shortName: 'IRN', emoji: '🇮🇷',
    confederation: 'AFC',
    apiAliases: ['iran', 'irn'],
  },
  {
    name: 'Saudi Arabia',     normalizedName: 'saudi arabia',
    group: 'H', flagCode: 'sa', shortName: 'SAU', emoji: '🇸🇦',
    confederation: 'AFC',
    apiAliases: ['saudi arabia', 'sau'],
  },

  /* ══════════════════════════════════════
     GRUPO I
  ══════════════════════════════════════ */
  {
    name: 'Mexico',           normalizedName: 'mexico',
    group: 'I', flagCode: 'mx', shortName: 'MEX', emoji: '🇲🇽',
    confederation: 'CONCACAF',
    apiAliases: ['mexico', 'mex'],
  },
  {
    name: 'Canada',           normalizedName: 'canada',
    group: 'I', flagCode: 'ca', shortName: 'CAN', emoji: '🇨🇦',
    confederation: 'CONCACAF',
    apiAliases: ['canada', 'can'],
  },
  {
    name: 'Ecuador',          normalizedName: 'ecuador',
    group: 'I', flagCode: 'ec', shortName: 'ECU', emoji: '🇪🇨',
    confederation: 'CONMEBOL',
    apiAliases: ['ecuador', 'ecu'],
  },
  {
    name: 'New Zealand',      normalizedName: 'new zealand',
    group: 'I', flagCode: 'nz', shortName: 'NZL', emoji: '🇳🇿',
    confederation: 'OFC',
    apiAliases: ['new zealand', 'nzl'],
  },

  /* ══════════════════════════════════════
     GRUPO J
  ══════════════════════════════════════ */
  {
    name: 'Uruguay',          normalizedName: 'uruguay',
    group: 'J', flagCode: 'uy', shortName: 'URU', emoji: '🇺🇾',
    confederation: 'CONMEBOL',
    apiAliases: ['uruguay', 'uru'],
  },
  {
    name: 'Bolivia',          normalizedName: 'bolivia',
    group: 'J', flagCode: 'bo', shortName: 'BOL', emoji: '🇧🇴',
    confederation: 'CONMEBOL',
    apiAliases: ['bolivia', 'bol'],
  },
  {
    name: 'Serbia',           normalizedName: 'serbia',
    group: 'J', flagCode: 'rs', shortName: 'SRB', emoji: '🇷🇸',
    confederation: 'UEFA',
    apiAliases: ['serbia', 'srb'],
  },
  {
    name: 'Ivory Coast',      normalizedName: 'ivory coast',
    group: 'J', flagCode: 'ci', shortName: 'CIV', emoji: '🇨🇮',
    confederation: 'CAF',
    apiAliases: ['ivory coast', 'civ', "cote d'ivoire", 'cote divoire'],
  },

  /* ══════════════════════════════════════
     GRUPO K
  ══════════════════════════════════════ */
  {
    name: 'Italy',            normalizedName: 'italy',
    group: 'K', flagCode: 'it', shortName: 'ITA', emoji: '🇮🇹',
    confederation: 'UEFA',
    apiAliases: ['italy', 'ita'],
  },
  {
    name: 'Scotland',         normalizedName: 'scotland',
    group: 'K', flagCode: 'gb-sct', shortName: 'SCO', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    confederation: 'UEFA',
    apiAliases: ['scotland', 'sco'],
  },
  {
    name: 'Ukraine',          normalizedName: 'ukraine',
    group: 'K', flagCode: 'ua', shortName: 'UKR', emoji: '🇺🇦',
    confederation: 'UEFA',
    apiAliases: ['ukraine', 'ukr'],
  },
  {
    name: 'Algeria',          normalizedName: 'algeria',
    group: 'K', flagCode: 'dz', shortName: 'ALG', emoji: '🇩🇿',
    confederation: 'CAF',
    apiAliases: ['algeria', 'alg'],
  },

  /* ══════════════════════════════════════
     GRUPO L
  ══════════════════════════════════════ */
  {
    name: 'Georgia',          normalizedName: 'georgia',
    group: 'L', flagCode: 'ge', shortName: 'GEO', emoji: '🇬🇪',
    confederation: 'UEFA',
    apiAliases: ['georgia', 'geo'],
  },
  {
    name: 'Czech Republic',   normalizedName: 'czech republic',
    group: 'L', flagCode: 'cz', shortName: 'CZE', emoji: '🇨🇿',
    confederation: 'UEFA',
    apiAliases: ['czech republic', 'cze', 'czechia'],
  },
  {
    name: 'Venezuela',        normalizedName: 'venezuela',
    group: 'L', flagCode: 've', shortName: 'VEN', emoji: '🇻🇪',
    confederation: 'CONMEBOL',
    apiAliases: ['venezuela', 'ven'],
  },
  {
    name: 'Indonesia',        normalizedName: 'indonesia',
    group: 'L', flagCode: 'id', shortName: 'IDN', emoji: '🇮🇩',
    confederation: 'AFC',
    apiAliases: ['indonesia', 'idn'],
  },

];

/* ══════════════════════════════════════════════════════════════
   HELPERS — Fuente maestra para búsqueda y normalización
══════════════════════════════════════════════════════════════ */

const WorldCupTeams = (() => {

  // Índice por normalizedName para búsqueda O(1)
  const _byNorm = {};
  // Índice por shortName (código FIFA)
  const _byCode = {};
  // Índice por alias de API
  const _byAlias = {};

  WC2026_TEAMS.forEach(t => {
    _byNorm[t.normalizedName] = t;
    _byCode[t.shortName.toLowerCase()] = t;
    (t.apiAliases || []).forEach(a => { _byAlias[a.toLowerCase()] = t; });
  });

  /**
   * Normalizar nombre bruto de API → nombre oficial.
   * Ejemplo: "Argentina national football team" → "Argentina"
   * @param {string} rawName
   * @returns {string} nombre oficial o el original si no se encuentra
   */
  function normalize(rawName) {
    if (!rawName) return rawName;
    const lower = rawName.toLowerCase().trim()
      // Quitar sufijos comunes de API
      .replace(/\s+national\s+football\s+team$/i, '')
      .replace(/\s+national\s+team$/i, '')
      .replace(/\s+football\s+team$/i, '')
      .trim();

    // Buscar por alias exacto
    if (_byAlias[lower]) return _byAlias[lower].name;
    // Buscar por nombre normalizado
    if (_byNorm[lower]) return _byNorm[lower].name;
    // Buscar por código FIFA
    if (_byCode[lower]) return _byCode[lower].name;

    return rawName; // devolver original si no se encuentra
  }

  /**
   * Buscar equipo por cualquier variante de nombre.
   * @param {string} name - nombre bruto, alias o código
   * @returns {object|null} equipo oficial o null
   */
  function find(name) {
    if (!name) return null;
    const lower = normalize(name).toLowerCase();
    return _byNorm[lower] || _byAlias[lower] || _byCode[lower] || null;
  }

  /**
   * Obtener URL de bandera oficial.
   * @param {string} name
   * @returns {string} URL de flagcdn.com
   */
  function getFlag(name) {
    const team = find(name);
    if (!team) {
      console.warn(`[WorldCupTeams] Bandera no encontrada: "${name}"`);
      return 'https://flagcdn.com/w80/un.png'; // ONU como fallback
    }
    return `https://flagcdn.com/w80/${team.flagCode}.png`;
  }

  /**
   * Obtener emoji de bandera.
   * @param {string} name
   * @returns {string}
   */
  function getEmoji(name) {
    return find(name)?.emoji || '🌍';
  }

  /**
   * Obtener todos los equipos de un grupo.
   * @param {string} group - 'A' a 'L'
   * @returns {object[]}
   */
  function getGroup(group) {
    return WC2026_TEAMS.filter(t => t.group === group.toUpperCase());
  }

  /**
   * Obtener todos los grupos como objeto { A: [...], B: [...], ... }
   * @returns {object}
   */
  function getAllGroups() {
    const groups = {};
    WC2026_TEAMS.forEach(t => {
      if (!groups[t.group]) groups[t.group] = [];
      groups[t.group].push(t);
    });
    return groups;
  }

  /**
   * Validar integridad: 48 equipos, 12 grupos de 4, sin duplicados.
   * @returns {{ ok: boolean, errors: string[] }}
   */
  function validate() {
    const errors = [];
    const groups = getAllGroups();
    const names  = new Set();

    if (WC2026_TEAMS.length !== 48) {
      errors.push(`Total equipos: ${WC2026_TEAMS.length} (esperado 48)`);
    }

    Object.entries(groups).forEach(([g, teams]) => {
      if (teams.length !== 4) {
        errors.push(`Grupo ${g}: ${teams.length} equipos (esperado 4)`);
      }
    });

    WC2026_TEAMS.forEach(t => {
      if (names.has(t.normalizedName)) {
        errors.push(`Duplicado: ${t.name}`);
      }
      names.add(t.normalizedName);
    });

    return { ok: errors.length === 0, errors };
  }

  return { normalize, find, getFlag, getEmoji, getGroup, getAllGroups, validate, all: WC2026_TEAMS };

})();

// Exportar para Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WC2026_TEAMS, WorldCupTeams };
}

/**
 * StatPlay — worldCupGroups.js
 * Fuente maestra oficial de grupos FIFA World Cup 2026.
 *
 * REGLAS:
 *  - Nombres en inglés interno (compatibilidad API)
 *  - Nombres en español solo en frontend via i18n
 *  - Todos los nombres pasan por normalizeNationalTeamName() antes de comparar
 *  - No modificar ligas. Solo World Cup usa este archivo.
 *
 * Normalizaciones aplicadas:
 *  México              → Mexico
 *  República de Corea  → Korea Republic
 *  Chequia             → Czech Republic
 *  EE. UU.             → United States
 *  Países Bajos        → Netherlands
 *  RI de Irán          → Iran
 *  RD Congo            → DR Congo
 *  Inglaterra          → England
 */

const worldCupGroups = {
  A: ['Mexico',        'South Africa',           'Korea Republic',  'Czech Republic'],
  B: ['Canada',        'Bosnia and Herzegovina', 'Qatar',           'Switzerland'],
  C: ['Brazil',        'Morocco',                'Haiti',           'Scotland'],
  D: ['United States', 'Paraguay',               'Australia',       'Turkey'],
  E: ['Germany',       'Curacao',                'Ivory Coast',     'Ecuador'],
  F: ['Netherlands',   'Japan',                  'Sweden',          'Tunisia'],
  G: ['Belgium',       'Egypt',                  'Iran',            'New Zealand'],
  H: ['Spain',         'Cape Verde',             'Saudi Arabia',    'Uruguay'],
  I: ['France',        'Senegal',                'Iraq',            'Norway'],
  J: ['Argentina',     'Algeria',                'Austria',         'Jordan'],
  K: ['Portugal',      'DR Congo',               'Uzbekistan',      'Colombia'],
  L: ['England',       'Croatia',                'Ghana',           'Panama'],
};

/* ══════════════════════════════════════════════════════════════
   MAPA DE BANDERAS — flagCode ISO 3166-1 alpha-2
   Fuente: flagcdn.com/w80/{code}.png
══════════════════════════════════════════════════════════════ */
const WC_FLAG_CODES = {
  'Mexico':                  'mx',
  'South Africa':            'za',
  'Korea Republic':          'kr',
  'Czech Republic':          'cz',
  'Canada':                  'ca',
  'Bosnia and Herzegovina':  'ba',
  'Qatar':                   'qa',
  'Switzerland':             'ch',
  'Brazil':                  'br',
  'Morocco':                 'ma',
  'Haiti':                   'ht',
  'Scotland':                'gb-sct',
  'United States':           'us',
  'Paraguay':                'py',
  'Australia':               'au',
  'Turkey':                  'tr',
  'Germany':                 'de',
  'Curacao':                 'cw',
  'Ivory Coast':             'ci',
  'Ecuador':                 'ec',
  'Netherlands':             'nl',
  'Japan':                   'jp',
  'Sweden':                  'se',
  'Tunisia':                 'tn',
  'Belgium':                 'be',
  'Egypt':                   'eg',
  'Iran':                    'ir',
  'New Zealand':             'nz',
  'Spain':                   'es',
  'Cape Verde':              'cv',
  'Saudi Arabia':            'sa',
  'Uruguay':                 'uy',
  'France':                  'fr',
  'Senegal':                 'sn',
  'Iraq':                    'iq',
  'Norway':                  'no',
  'Argentina':               'ar',
  'Algeria':                 'dz',
  'Austria':                 'at',
  'Jordan':                  'jo',
  'Portugal':                'pt',
  'DR Congo':                'cd',
  'Uzbekistan':              'uz',
  'Colombia':                'co',
  'England':                 'gb-eng',
  'Croatia':                 'hr',
  'Ghana':                   'gh',
  'Panama':                  'pa',
};

/* ══════════════════════════════════════════════════════════════
   EMOJIS DE BANDERA
══════════════════════════════════════════════════════════════ */
const WC_EMOJIS = {
  'Mexico':                  '🇲🇽',
  'South Africa':            '🇿🇦',
  'Korea Republic':          '🇰🇷',
  'Czech Republic':          '🇨🇿',
  'Canada':                  '🇨🇦',
  'Bosnia and Herzegovina':  '🇧🇦',
  'Qatar':                   '🇶🇦',
  'Switzerland':             '🇨🇭',
  'Brazil':                  '🇧🇷',
  'Morocco':                 '🇲🇦',
  'Haiti':                   '🇭🇹',
  'Scotland':                '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'United States':           '🇺🇸',
  'Paraguay':                '🇵🇾',
  'Australia':               '🇦🇺',
  'Turkey':                  '🇹🇷',
  'Germany':                 '🇩🇪',
  'Curacao':                 '🇨🇼',
  'Ivory Coast':             '🇨🇮',
  'Ecuador':                 '🇪🇨',
  'Netherlands':             '🇳🇱',
  'Japan':                   '🇯🇵',
  'Sweden':                  '🇸🇪',
  'Tunisia':                 '🇹🇳',
  'Belgium':                 '🇧🇪',
  'Egypt':                   '🇪🇬',
  'Iran':                    '🇮🇷',
  'New Zealand':             '🇳🇿',
  'Spain':                   '🇪🇸',
  'Cape Verde':              '🇨🇻',
  'Saudi Arabia':            '🇸🇦',
  'Uruguay':                 '🇺🇾',
  'France':                  '🇫🇷',
  'Senegal':                 '🇸🇳',
  'Iraq':                    '🇮🇶',
  'Norway':                  '🇳🇴',
  'Argentina':               '🇦🇷',
  'Algeria':                 '🇩🇿',
  'Austria':                 '🇦🇹',
  'Jordan':                  '🇯🇴',
  'Portugal':                '🇵🇹',
  'DR Congo':                '🇨🇩',
  'Uzbekistan':              '🇺🇿',
  'Colombia':                '🇨🇴',
  'England':                 '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croatia':                 '🇭🇷',
  'Ghana':                   '🇬🇭',
  'Panama':                  '🇵🇦',
};

/* ══════════════════════════════════════════════════════════════
   NORMALIZACIONES — nombres API → nombre oficial interno
   Usar antes de cualquier comparación con worldCupGroups
══════════════════════════════════════════════════════════════ */
const WC_NAME_ALIASES = {
  // Variantes en español (frontend/usuario)
  'méxico':                          'Mexico',
  'ee. uu.':                         'United States',
  'estados unidos':                  'United States',
  'países bajos':                    'Netherlands',
  'paises bajos':                    'Netherlands',
  'ri de irán':                      'Iran',
  'ri de iran':                      'Iran',
  'rd congo':                        'DR Congo',
  'república democrática del congo': 'DR Congo',
  'republica democratica del congo': 'DR Congo',
  'inglaterra':                      'England',
  'chequia':                         'Czech Republic',
  'república checa':                 'Czech Republic',
  'republica checa':                 'Czech Republic',
  'costa de marfil':                 'Ivory Coast',
  'bosnia y herzegovina':            'Bosnia and Herzegovina',
  'cabo verde':                      'Cape Verde',
  'noruega':                         'Norway',
  'suecia':                          'Sweden',
  'suiza':                           'Switzerland',
  'bélgica':                         'Belgium',
  'belgica':                         'Belgium',
  'argelia':                         'Algeria',
  'jordania':                        'Jordan',
  'uzbekistán':                      'Uzbekistan',
  'uzbekistan':                      'Uzbekistan',
  'túnez':                           'Tunisia',
  'tunez':                           'Tunisia',
  'haití':                           'Haiti',
  'haiti':                           'Haiti',
  'panamá':                          'Panama',
  'ghana':                           'Ghana',
  'senegal':                         'Senegal',
  'irak':                            'Iraq',
  'arabia saudita':                  'Saudi Arabia',
  'arabia saudi':                    'Saudi Arabia',
  'nueva zelanda':                   'New Zealand',
  'nueva zelandia':                  'New Zealand',
  'corea del sur':                   'Korea Republic',
  'república de corea':              'Korea Republic',
  'republica de corea':              'Korea Republic',
  // Variantes API comunes
  'mexico':                          'Mexico',
  'mex':                             'Mexico',
  'south korea':                     'Korea Republic',
  'korea rep':                       'Korea Republic',
  'republic of korea':               'Korea Republic',
  'kor':                             'Korea Republic',
  'czech republic':                  'Czech Republic',
  'czechia':                         'Czech Republic',
  'cze':                             'Czech Republic',
  'united states':                   'United States',
  'usa':                             'United States',
  'us':                              'United States',
  'united states of america':        'United States',
  'netherlands':                     'Netherlands',
  'holland':                         'Netherlands',
  'ned':                             'Netherlands',
  'iran':                            'Iran',
  'ir iran':                         'Iran',
  'irn':                             'Iran',
  'dr congo':                        'DR Congo',
  'democratic republic of congo':    'DR Congo',
  'congo dr':                        'DR Congo',
  'cod':                             'DR Congo',
  'england':                         'England',
  'eng':                             'England',
  'ivory coast':                     'Ivory Coast',
  "cote d'ivoire":                   'Ivory Coast',
  'cote divoire':                    'Ivory Coast',
  'civ':                             'Ivory Coast',
  'bosnia':                          'Bosnia and Herzegovina',
  'bih':                             'Bosnia and Herzegovina',
  'cape verde':                      'Cape Verde',
  'cabo verde':                      'Cape Verde',
  'cpv':                             'Cape Verde',
  // Sufijos API que se deben quitar
  'argentina national football team':'Argentina',
  'france national football team':   'France',
  'brazil national football team':   'Brazil',
  'germany national football team':  'Germany',
  'spain national football team':    'Spain',
  'england national football team':  'England',
  // Códigos FIFA de 3 letras
  'arg': 'Argentina', 'fra': 'France',  'bra': 'Brazil',
  'ger': 'Germany',   'esp': 'Spain',   'por': 'Portugal',
  'bel': 'Belgium',   'jpn': 'Japan',   'can': 'Canada',
  'uru': 'Uruguay',   'col': 'Colombia','ecu': 'Ecuador',
  'aus': 'Australia', 'mar': 'Morocco', 'cro': 'Croatia',
  'tur': 'Turkey',    'geo': 'Georgia', 'aut': 'Austria',
  'sco': 'Scotland',  'sui': 'Switzerland', 'den': 'Denmark',
  'srb': 'Serbia',    'sau': 'Saudi Arabia', 'sen': 'Senegal',
  'nga': 'Nigeria',   'gha': 'Ghana',   'pan': 'Panama',
  'nor': 'Norway',    'swe': 'Sweden',  'alg': 'Algeria',
  'uzb': 'Uzbekistan','qat': 'Qatar',   'irq': 'Iraq',
  'jor': 'Jordan',    'tun': 'Tunisia', 'par': 'Paraguay',
  'bol': 'Bolivia',   'per': 'Peru',    'chi': 'Chile',
  'nzl': 'New Zealand', 'hai': 'Haiti',
};

/* ══════════════════════════════════════════════════════════════
   API PÚBLICA — WorldCupGroups
══════════════════════════════════════════════════════════════ */
const WorldCupGroups = (() => {

  // Índice inverso: nombre → grupo
  const _teamToGroup = {};
  Object.entries(worldCupGroups).forEach(([group, teams]) => {
    teams.forEach(name => { _teamToGroup[name.toLowerCase()] = group; });
  });

  /**
   * Normalizar nombre bruto de API → nombre oficial interno.
   * Ejemplo: "Argentina national football team" → "Argentina"
   * @param {string} raw
   * @returns {string}
   */
  function normalizeNationalTeamName(raw) {
    if (!raw) return raw;
    const lower = raw.toLowerCase().trim()
      .replace(/\s+national\s+football\s+team$/i, '')
      .replace(/\s+national\s+team$/i, '')
      .replace(/\s+football\s+team$/i, '')
      .trim();
    return WC_NAME_ALIASES[lower] || raw;
  }

  /**
   * Obtener grupo de una selección (normalizando el nombre).
   * @param {string} name
   * @returns {string|null} 'A'-'L' o null
   */
  function getGroup(name) {
    const normalized = normalizeNationalTeamName(name);
    return _teamToGroup[normalized.toLowerCase()] || null;
  }

  /**
   * Obtener URL de bandera oficial.
   * @param {string} name
   * @returns {string} URL flagcdn.com
   */
  function getFlag(name) {
    const normalized = normalizeNationalTeamName(name);
    const code = WC_FLAG_CODES[normalized];
    if (!code) {
      console.warn(`[WorldCupGroups] Bandera no encontrada: "${name}" → "${normalized}"`);
      return 'https://flagcdn.com/w80/un.png';
    }
    return `https://flagcdn.com/w80/${code}.png`;
  }

  /**
   * Obtener emoji de bandera.
   * @param {string} name
   * @returns {string}
   */
  function getEmoji(name) {
    const normalized = normalizeNationalTeamName(name);
    return WC_EMOJIS[normalized] || '🌍';
  }

  /**
   * Obtener todos los equipos de un grupo con datos completos.
   * @param {string} group 'A'-'L'
   * @returns {object[]}
   */
  function getGroupTeams(group) {
    const teams = worldCupGroups[group.toUpperCase()] || [];
    return teams.map((name, i) => ({
      id:        name.replace(/\s+/g, '_').toUpperCase(),
      name,
      shortName: WC_NAME_ALIASES[name.toLowerCase()]
        ? WC_NAME_ALIASES[name.toLowerCase()].substring(0, 3).toUpperCase()
        : name.substring(0, 3).toUpperCase(),
      group:     group.toUpperCase(),
      emoji:     WC_EMOJIS[name] || '🌍',
      flagCode:  WC_FLAG_CODES[name] || 'un',
      flagUrl:   getFlag(name),
      pos: i + 1, points: 0, played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0,
      form: [],
      // Stats base para predictor
      homeGoalsFor: 1.4, homeGoalsAgainst: 1.1,
      homeWinRate: 0.45, homeDrawRate: 0.27,
      awayGoalsFor: 1.2, awayGoalsAgainst: 1.2,
      awayWinRate: 0.35, awayDrawRate: 0.28,
      avgCorners: 5.0, h1ScoringRatio: 0.42,
    }));
  }

  /**
   * Obtener todos los grupos con datos completos para standings.
   * @returns {object[]} [{ group: 'A', teams: [...] }, ...]
   */
  function getAllGroupsForStandings() {
    return Object.keys(worldCupGroups).map(group => ({
      group,
      teams: getGroupTeams(group).map((t, i) => ({
        position: i + 1,
        team: {
          id:        t.id,
          name:      t.name,
          shortName: t.shortName,
          emoji:     t.emoji,
          logoUrl:   t.flagUrl,
        },
        played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, points: 0,
        form: [],
      })),
    }));
  }

  /**
   * Lista plana de los 48 equipos para el buscador.
   * @returns {object[]}
   */
  function getAllTeams() {
    return Object.keys(worldCupGroups).flatMap(group => getGroupTeams(group));
  }

  /**
   * Validar integridad: 12 grupos × 4 = 48 equipos, sin duplicados.
   * @returns {{ ok: boolean, total: number, errors: string[] }}
   */
  function validate() {
    const errors = [];
    const seen = new Set();
    let total = 0;

    Object.entries(worldCupGroups).forEach(([group, teams]) => {
      if (teams.length !== 4) errors.push(`Grupo ${group}: ${teams.length} equipos (esperado 4)`);
      teams.forEach(name => {
        if (seen.has(name)) errors.push(`Duplicado: ${name} (Grupo ${group})`);
        seen.add(name);
        if (!WC_FLAG_CODES[name]) errors.push(`Sin bandera: ${name}`);
        total++;
      });
    });

    if (total !== 48) errors.push(`Total: ${total} (esperado 48)`);
    return { ok: errors.length === 0, total, errors };
  }

  return {
    normalizeNationalTeamName,
    getGroup,
    getFlag,
    getEmoji,
    getGroupTeams,
    getAllGroupsForStandings,
    getAllTeams,
    validate,
    groups: worldCupGroups,
  };

})();

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { worldCupGroups, WorldCupGroups };
}

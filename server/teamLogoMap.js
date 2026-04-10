/**
 * StatPlay — server/teamLogoMap.js
 * Versión Node.js del mapa centralizado de logos.
 * Importa el archivo del frontend y lo re-exporta para uso en el backend.
 */

// Reutilizar la misma lógica del frontend
/**
 * StatPlay Football — teamLogoMap.js
 * Sistema centralizado de logos de equipos.
 *
 * Estructura:
 *   TEAM_LOGO_MAP[nombreNormalizado] = { logo, aliases, liga, emoji }
 *
 * Prioridad de carga (en _logo() de ui.js):
 *   1. logo_url de DB (más actualizado, viene de API-Football CDN)
 *   2. logo de este mapa (fallback estático confiable)
 *   3. crest de Football-Data.org (si disponible en el objeto)
 *   4. placeholder visual (emoji del equipo)
 *
 * Para añadir una liga nueva: solo añadir entradas aquí.
 * Normalización automática: quita FC/CF/AC/AS/SS/US/CD/RC/UD/SD/RCD,
 *   espacios dobles, y convierte a minúsculas.
 */

/* ── Función de normalización ── */

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(fc|cf|ac|as|ss|us|cd|rc|ud|sd|rcd|afc|sc|vfl|vfb|fsv|rb|1\.\s*)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Mapa principal: clave = nombre normalizado ── */
const _MAP = {};

/* ─────────────────────────────────────────
   [FASE 4] normalizeNationalTeamName()
   Corrige variantes de nombres de selecciones que devuelven las APIs.
   Ejemplos:
     "Argentina national football team" → "Argentina"
     "ARG" → "Argentina"
     "South Korea" → "Korea Republic"
     "USA" → "United States"
───────────────────────────────────────── */
const _NATIONAL_ALIASES = {
  // Variantes largas de API
  'argentina national football team': 'Argentina',
  'france national football team':    'France',
  'brazil national football team':    'Brazil',
  'germany national football team':   'Germany',
  'spain national football team':     'Spain',
  'england national football team':   'England',
  'portugal national football team':  'Portugal',
  'netherlands national football team': 'Netherlands',
  'belgium national football team':   'Belgium',
  'japan national football team':     'Japan',
  // Códigos ISO → nombre oficial
  'arg': 'Argentina', 'fra': 'France',  'bra': 'Brazil',
  'ger': 'Germany',   'esp': 'Spain',   'eng': 'England',
  'por': 'Portugal',  'ned': 'Netherlands', 'bel': 'Belgium',
  'jpn': 'Japan',     'kor': 'Korea Republic', 'usa': 'United States',
  'mex': 'Mexico',    'can': 'Canada',  'uru': 'Uruguay',
  'col': 'Colombia',  'chi': 'Chile',   'per': 'Peru',
  'aus': 'Australia', 'nzl': 'New Zealand', 'mar': 'Morocco',
  'cro': 'Croatia',   'tur': 'Turkey',  'geo': 'Georgia',
  'aut': 'Austria',   'sco': 'Scotland', 'sui': 'Switzerland',
  'den': 'Denmark',   'srb': 'Serbia',  'irn': 'Iran',
  'sau': 'Saudi Arabia', 'ecu': 'Ecuador',
  // Variantes comunes
  'south korea':    'Korea Republic',
  'korea rep':      'Korea Republic',
  'republic of korea': 'Korea Republic',
  'united states':  'United States',
  'united states of america': 'United States',
  'holland':        'Netherlands',
  'deutschland':    'Germany',
  'brasil':         'Brazil',
  'espana':         'Spain',
  'england':        'England',
};

function normalizeNationalTeamName(name) {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  return _NATIONAL_ALIASES[lower] || name;
}

/**
 * Registrar un equipo con sus aliases.
 * @param {string[]} names  - Nombre oficial + aliases posibles
 * @param {object}   data   - { logo, liga, emoji }
 */
function register(names, data) {
  names.forEach(n => {
    const key = normalizeName(n);
    if (key) _MAP[key] = { ...data, canonical: names[0] };
  });
}

/* ══════════════════════════════════════════
   PREMIER LEAGUE
══════════════════════════════════════════ */
register(['Arsenal', 'Arsenal FC'],
  { logo: 'https://media.api-sports.io/football/teams/42.png',  liga: 'PL', emoji: '🔴' });
register(['Liverpool', 'Liverpool FC'],
  { logo: 'https://media.api-sports.io/football/teams/40.png',  liga: 'PL', emoji: '🔴' });
register(['Manchester City', 'Man City', 'Manchester City FC'],
  { logo: 'https://media.api-sports.io/football/teams/50.png',  liga: 'PL', emoji: '🔵' });
register(['Chelsea', 'Chelsea FC'],
  { logo: 'https://media.api-sports.io/football/teams/49.png',  liga: 'PL', emoji: '💙' });
register(['Manchester United', 'Man United', 'Manchester United FC', 'Man Utd'],
  { logo: 'https://media.api-sports.io/football/teams/33.png',  liga: 'PL', emoji: '🔴' });
register(['Aston Villa', 'Aston Villa FC'],
  { logo: 'https://media.api-sports.io/football/teams/66.png',  liga: 'PL', emoji: '🟣' });
register(['Newcastle', 'Newcastle United', 'Newcastle United FC'],
  { logo: 'https://media.api-sports.io/football/teams/34.png',  liga: 'PL', emoji: '⚫' });
register(['Tottenham', 'Tottenham Hotspur', 'Spurs', 'Tottenham Hotspur FC'],
  { logo: 'https://media.api-sports.io/football/teams/47.png',  liga: 'PL', emoji: '⚪' });
register(['Brighton', 'Brighton & Hove Albion', 'Brighton and Hove Albion'],
  { logo: 'https://media.api-sports.io/football/teams/51.png',  liga: 'PL', emoji: '🔵' });
register(['Brentford', 'Brentford FC'],
  { logo: 'https://media.api-sports.io/football/teams/55.png',  liga: 'PL', emoji: '🐝' });
register(['Fulham', 'Fulham FC'],
  { logo: 'https://media.api-sports.io/football/teams/36.png',  liga: 'PL', emoji: '⚫' });
register(['Crystal Palace', 'Crystal Palace FC'],
  { logo: 'https://media.api-sports.io/football/teams/52.png',  liga: 'PL', emoji: '🦅' });
register(['Everton', 'Everton FC'],
  { logo: 'https://media.api-sports.io/football/teams/45.png',  liga: 'PL', emoji: '🔵' });
register(['West Ham', 'West Ham United', 'West Ham United FC'],
  { logo: 'https://media.api-sports.io/football/teams/48.png',  liga: 'PL', emoji: '🔨' });
register(['Wolves', 'Wolverhampton', 'Wolverhampton Wanderers', 'Wolverhampton Wanderers FC'],
  { logo: 'https://media.api-sports.io/football/teams/39.png',  liga: 'PL', emoji: '🐺' });
register(['Leicester', 'Leicester City', 'Leicester City FC'],
  { logo: 'https://media.api-sports.io/football/teams/46.png',  liga: 'PL', emoji: '🦊' });
register(['Ipswich', 'Ipswich Town', 'Ipswich Town FC'],
  { logo: 'https://media.api-sports.io/football/teams/57.png',  liga: 'PL', emoji: '🔵' });
register(['Southampton', 'Southampton FC'],
  { logo: 'https://media.api-sports.io/football/teams/41.png',  liga: 'PL', emoji: '🔴' });
register(['Nottingham Forest', 'Nottm Forest', 'Nottingham Forest FC'],
  { logo: 'https://media.api-sports.io/football/teams/65.png',  liga: 'PL', emoji: '🌲' });
register(['Bournemouth', 'AFC Bournemouth'],
  { logo: 'https://media.api-sports.io/football/teams/35.png',  liga: 'PL', emoji: '🍒' });

/* ══════════════════════════════════════════
   BUNDESLIGA
══════════════════════════════════════════ */
register(['Bayern Munich', 'Bayern München', 'FC Bayern München', 'Bayern'],
  { logo: 'https://media.api-sports.io/football/teams/157.png', liga: 'BL', emoji: '🔴' });
register(['Borussia Dortmund', 'BVB', 'Dortmund'],
  { logo: 'https://media.api-sports.io/football/teams/165.png', liga: 'BL', emoji: '🟡' });
register(['Bayer Leverkusen', 'Leverkusen', 'Bayer 04 Leverkusen'],
  { logo: 'https://media.api-sports.io/football/teams/168.png', liga: 'BL', emoji: '🔴' });
register(['RB Leipzig', 'Leipzig', 'Rasenballsport Leipzig'],
  { logo: 'https://media.api-sports.io/football/teams/173.png', liga: 'BL', emoji: '⚪' });
register(['Eintracht Frankfurt', 'Frankfurt', 'SGE'],
  { logo: 'https://media.api-sports.io/football/teams/169.png', liga: 'BL', emoji: '🦅' });
register(['VfB Stuttgart', 'Stuttgart'],
  { logo: 'https://media.api-sports.io/football/teams/172.png', liga: 'BL', emoji: '⚪' });
register(['SC Freiburg', 'Freiburg'],
  { logo: 'https://media.api-sports.io/football/teams/160.png', liga: 'BL', emoji: '🔴' });
register(['FSV Mainz 05', 'Mainz', 'Mainz 05'],
  { logo: 'https://media.api-sports.io/football/teams/164.png', liga: 'BL', emoji: '🔴' });
register(['Werder Bremen', 'Bremen'],
  { logo: 'https://media.api-sports.io/football/teams/162.png', liga: 'BL', emoji: '🟢' });
register(['Borussia Mönchengladbach', 'Gladbach', 'Monchengladbach', 'Borussia Monchengladbach'],
  { logo: 'https://media.api-sports.io/football/teams/163.png', liga: 'BL', emoji: '⚪' });
register(['VfL Wolfsburg', 'Wolfsburg'],
  { logo: 'https://media.api-sports.io/football/teams/161.png', liga: 'BL', emoji: '🟢' });
register(['FC Augsburg', 'Augsburg'],
  { logo: 'https://media.api-sports.io/football/teams/170.png', liga: 'BL', emoji: '🔴' });
register(['Union Berlin', '1. FC Union Berlin'],
  { logo: 'https://media.api-sports.io/football/teams/182.png', liga: 'BL', emoji: '🔴' });
register(['FC St. Pauli', 'St. Pauli', 'St Pauli'],
  { logo: 'https://media.api-sports.io/football/teams/186.png', liga: 'BL', emoji: '💀' });
register(['1899 Hoffenheim', 'Hoffenheim', 'TSG Hoffenheim', 'TSG 1899 Hoffenheim'],
  { logo: 'https://media.api-sports.io/football/teams/167.png', liga: 'BL', emoji: '🔵' });
register(['1. FC Heidenheim', 'Heidenheim', 'FC Heidenheim'],
  { logo: 'https://media.api-sports.io/football/teams/180.png', liga: 'BL', emoji: '🔴' });
register(['Holstein Kiel', 'Kiel'],
  { logo: 'https://media.api-sports.io/football/teams/191.png', liga: 'BL', emoji: '🔵' });
register(['VfL Bochum', 'Bochum'],
  { logo: 'https://media.api-sports.io/football/teams/176.png', liga: 'BL', emoji: '🔵' });

/* ══════════════════════════════════════════
   LA LIGA
══════════════════════════════════════════ */
register(['Barcelona', 'FC Barcelona', 'Barça', 'Barca'],
  { logo: 'https://media.api-sports.io/football/teams/529.png', liga: 'LL', emoji: '🔵' });
register(['Real Madrid', 'Real Madrid CF'],
  { logo: 'https://media.api-sports.io/football/teams/541.png', liga: 'LL', emoji: '⚪' });
register(['Atletico Madrid', 'Atlético Madrid', 'Atletico de Madrid', 'Club Atlético de Madrid', 'Atleti'],
  { logo: 'https://media.api-sports.io/football/teams/530.png', liga: 'LL', emoji: '🔴' });
register(['Villarreal', 'Villarreal CF'],
  { logo: 'https://media.api-sports.io/football/teams/533.png', liga: 'LL', emoji: '🟡' });
register(['Real Betis', 'Real Betis Balompié', 'Betis'],
  { logo: 'https://media.api-sports.io/football/teams/543.png', liga: 'LL', emoji: '🟢' });
register(['Celta Vigo', 'RC Celta de Vigo', 'Celta'],
  { logo: 'https://media.api-sports.io/football/teams/538.png', liga: 'LL', emoji: '🔵' });
register(['Real Sociedad', 'Real Sociedad de Fútbol'],
  { logo: 'https://media.api-sports.io/football/teams/548.png', liga: 'LL', emoji: '🔵' });
register(['Getafe', 'Getafe CF'],
  { logo: 'https://media.api-sports.io/football/teams/546.png', liga: 'LL', emoji: '⚪' });
register(['Athletic Club', 'Athletic Bilbao', 'Athletic Club de Bilbao'],
  { logo: 'https://media.api-sports.io/football/teams/534.png', liga: 'LL', emoji: '🔴' });
register(['Sevilla', 'Sevilla FC'],
  { logo: 'https://media.api-sports.io/football/teams/536.png', liga: 'LL', emoji: '⚪' });
register(['Espanyol', 'RCD Espanyol', 'RCD Espanyol de Barcelona', 'Espanyol de Barcelona'],
  { logo: 'https://media.api-sports.io/football/teams/540.png', liga: 'LL', emoji: '🔵' });
register(['Alaves', 'Deportivo Alavés', 'Deportivo Alaves'],
  { logo: 'https://media.api-sports.io/football/teams/542.png', liga: 'LL', emoji: '🔵' });
register(['Girona', 'Girona FC'],
  { logo: 'https://media.api-sports.io/football/teams/547.png', liga: 'LL', emoji: '🔴' });
register(['Osasuna', 'CA Osasuna'],
  { logo: 'https://media.api-sports.io/football/teams/727.png', liga: 'LL', emoji: '🔴' });
register(['Rayo Vallecano', 'Rayo Vallecano de Madrid'],
  { logo: 'https://media.api-sports.io/football/teams/728.png', liga: 'LL', emoji: '🔴' });
register(['Valencia', 'Valencia CF'],
  { logo: 'https://media.api-sports.io/football/teams/532.png', liga: 'LL', emoji: '🦇' });
register(['Mallorca', 'RCD Mallorca'],
  { logo: 'https://media.api-sports.io/football/teams/798.png', liga: 'LL', emoji: '🔴' });
register(['Leganes', 'CD Leganés', 'CD Leganes'],
  { logo: 'https://media.api-sports.io/football/teams/537.png', liga: 'LL', emoji: '⚪' });
register(['Valladolid', 'Real Valladolid'],
  { logo: 'https://media.api-sports.io/football/teams/720.png', liga: 'LL', emoji: '🟣' });
register(['Las Palmas', 'UD Las Palmas'],
  { logo: 'https://media.api-sports.io/football/teams/715.png', liga: 'LL', emoji: '🟡' });

/* ══════════════════════════════════════════
   SERIE A
══════════════════════════════════════════ */
register(['Inter', 'Inter Milan', 'Internazionale', 'FC Internazionale', 'FC Internazionale Milano', 'Inter FC'],
  { logo: 'https://media.api-sports.io/football/teams/505.png', liga: 'SA', emoji: '⚫' });
register(['AC Milan', 'Milan', 'AC Milan FC'],
  { logo: 'https://media.api-sports.io/football/teams/489.png', liga: 'SA', emoji: '🔴' });
register(['Juventus', 'Juventus FC', 'Juve'],
  { logo: 'https://media.api-sports.io/football/teams/496.png', liga: 'SA', emoji: '⚫' });
register(['Napoli', 'SSC Napoli', 'Napoli FC'],
  { logo: 'https://media.api-sports.io/football/teams/492.png', liga: 'SA', emoji: '🔵' });
register(['AS Roma', 'Roma', 'AS Roma FC'],
  { logo: 'https://media.api-sports.io/football/teams/497.png', liga: 'SA', emoji: '🟡' });
register(['Lazio', 'SS Lazio', 'Lazio FC'],
  { logo: 'https://media.api-sports.io/football/teams/487.png', liga: 'SA', emoji: '🔵' });
register(['Atalanta', 'Atalanta BC', 'Atalanta FC'],
  { logo: 'https://media.api-sports.io/football/teams/499.png', liga: 'SA', emoji: '🔵' });
register(['Fiorentina', 'ACF Fiorentina', 'Fiorentina FC'],
  { logo: 'https://media.api-sports.io/football/teams/502.png', liga: 'SA', emoji: '🟣' });
register(['Bologna', 'Bologna FC', 'Bologna FC 1909'],
  { logo: 'https://media.api-sports.io/football/teams/500.png', liga: 'SA', emoji: '🔴' });
register(['Torino', 'Torino FC'],
  { logo: 'https://media.api-sports.io/football/teams/503.png', liga: 'SA', emoji: '🟤' });
register(['Udinese', 'Udinese Calcio'],
  { logo: 'https://media.api-sports.io/football/teams/494.png', liga: 'SA', emoji: '⚫' });
register(['Genoa', 'Genoa CFC'],
  { logo: 'https://media.api-sports.io/football/teams/495.png', liga: 'SA', emoji: '🔴' });
register(['Venezia', 'Venezia FC'],
  { logo: 'https://media.api-sports.io/football/teams/517.png', liga: 'SA', emoji: '🟠' });
register(['Parma', 'Parma Calcio', 'Parma Calcio 1913'],
  { logo: 'https://media.api-sports.io/football/teams/523.png', liga: 'SA', emoji: '🟡' });
register(['Empoli', 'Empoli FC'],
  { logo: 'https://media.api-sports.io/football/teams/511.png', liga: 'SA', emoji: '🔵' });
register(['Cagliari', 'Cagliari Calcio'],
  { logo: 'https://media.api-sports.io/football/teams/490.png', liga: 'SA', emoji: '🔴' });
register(['Lecce', 'US Lecce'],
  { logo: 'https://media.api-sports.io/football/teams/867.png', liga: 'SA', emoji: '🟡' });
register(['Verona', 'Hellas Verona', 'Hellas Verona FC'],
  { logo: 'https://media.api-sports.io/football/teams/504.png', liga: 'SA', emoji: '🔵' });
register(['Como', 'Como 1907'],
  { logo: 'https://media.api-sports.io/football/teams/895.png', liga: 'SA', emoji: '🔵' });
register(['Monza', 'AC Monza'],
  { logo: 'https://media.api-sports.io/football/teams/1579.png', liga: 'SA', emoji: '⚪' });

/* ══════════════════════════════════════════
   API PÚBLICA
══════════════════════════════════════════ */

/**
 * Buscar logo por nombre de equipo.
 * Normaliza el nombre antes de buscar.
 * @param {string} name
 * @returns {{ logo: string|null, emoji: string, canonical: string }|null}
 */
function findByName(name) {
  if (!name) return null;
  const key = normalizeName(name);
  if (_MAP[key]) return _MAP[key];

  // Búsqueda parcial: si el nombre normalizado contiene alguna clave
  for (const [k, v] of Object.entries(_MAP)) {
    if (key.includes(k) || k.includes(key)) {
      if (typeof console !== 'undefined') {
        console.log(`[TeamLogoMap] Alias encontrado: "${name}" → "${v.canonical}"`);
      }
      return v;
    }
  }

  if (typeof console !== 'undefined') {
    console.warn(`[TeamLogoMap] Logo no encontrado para: "${name}" (normalizado: "${key}")`);
  }
  return null;
}

/**
 * Obtener logo con prioridad completa:
 *   1. logo_url de DB (parámetro dbLogo)
 *   2. logo del mapa interno (por nombre)
 *   3. crest de FD (parámetro crest)
 *   4. null (el caller mostrará emoji)
 */
function getLogo(name, dbLogo, crest) {
  if (dbLogo)  return dbLogo;
  const entry = findByName(name);
  if (entry?.logo) return entry.logo;
  if (crest)   return crest;
  return null;
}

/**
 * Obtener emoji de fallback por nombre.
 */
function getEmoji(name) {
  const entry = findByName(name);
  return entry?.emoji || '⚽';
}

/* ─────────────────────────────────────────
   [FASE 5] Logos de selecciones nacionales — World Cup 2026
   Fuente: API-Football CDN (media.api-sports.io/football/teams/)
───────────────────────────────────────── */
[
  { names: ['Argentina', 'ARG'],       logo: 'https://media.api-sports.io/football/teams/26.png',   emoji: '🇦🇷' },
  { names: ['France', 'FRA'],          logo: 'https://media.api-sports.io/football/teams/2.png',    emoji: '🇫🇷' },
  { names: ['Brazil', 'BRA'],          logo: 'https://media.api-sports.io/football/teams/6.png',    emoji: '🇧🇷' },
  { names: ['Germany', 'GER'],         logo: 'https://media.api-sports.io/football/teams/25.png',   emoji: '🇩🇪' },
  { names: ['Spain', 'ESP'],           logo: 'https://media.api-sports.io/football/teams/9.png',    emoji: '🇪🇸' },
  { names: ['England', 'ENG'],         logo: 'https://media.api-sports.io/football/teams/10.png',   emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { names: ['Portugal', 'POR'],        logo: 'https://media.api-sports.io/football/teams/27.png',   emoji: '🇵🇹' },
  { names: ['Netherlands', 'NED'],     logo: 'https://media.api-sports.io/football/teams/1118.png', emoji: '🇳🇱' },
  { names: ['Belgium', 'BEL'],         logo: 'https://media.api-sports.io/football/teams/1.png',    emoji: '🇧🇪' },
  { names: ['Japan', 'JPN'],           logo: 'https://media.api-sports.io/football/teams/21.png',   emoji: '🇯🇵' },
  { names: ['Korea Republic', 'KOR'],  logo: 'https://media.api-sports.io/football/teams/17.png',   emoji: '🇰🇷' },
  { names: ['United States', 'USA'],   logo: 'https://media.api-sports.io/football/teams/6667.png', emoji: '🇺🇸' },
  { names: ['Mexico', 'MEX'],          logo: 'https://media.api-sports.io/football/teams/16.png',   emoji: '🇲🇽' },
  { names: ['Canada', 'CAN'],          logo: 'https://media.api-sports.io/football/teams/101.png',  emoji: '🇨🇦' },
  { names: ['Uruguay', 'URU'],         logo: 'https://media.api-sports.io/football/teams/31.png',   emoji: '🇺🇾' },
  { names: ['Colombia', 'COL'],        logo: 'https://media.api-sports.io/football/teams/30.png',   emoji: '🇨🇴' },
  { names: ['Chile', 'CHI'],           logo: 'https://media.api-sports.io/football/teams/29.png',   emoji: '🇨🇱' },
  { names: ['Peru', 'PER'],            logo: 'https://media.api-sports.io/football/teams/32.png',   emoji: '🇵🇪' },
  { names: ['Ecuador', 'ECU'],         logo: 'https://media.api-sports.io/football/teams/33.png',   emoji: '🇪🇨' },
  { names: ['Australia', 'AUS'],       logo: 'https://media.api-sports.io/football/teams/24.png',   emoji: '🇦🇺' },
  { names: ['New Zealand', 'NZL'],     logo: 'https://media.api-sports.io/football/teams/73.png',   emoji: '🇳🇿' },
  { names: ['Morocco', 'MAR'],         logo: 'https://media.api-sports.io/football/teams/45.png',   emoji: '🇲🇦' },
  { names: ['Croatia', 'CRO'],         logo: 'https://media.api-sports.io/football/teams/3.png',    emoji: '🇭🇷' },
  { names: ['Turkey', 'TUR'],          logo: 'https://media.api-sports.io/football/teams/18.png',   emoji: '🇹🇷' },
  { names: ['Georgia', 'GEO'],         logo: 'https://media.api-sports.io/football/teams/1104.png', emoji: '🇬🇪' },
  { names: ['Austria', 'AUT'],         logo: 'https://media.api-sports.io/football/teams/775.png',  emoji: '🇦🇹' },
  { names: ['Scotland', 'SCO'],        logo: 'https://media.api-sports.io/football/teams/1108.png', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { names: ['Switzerland', 'SUI'],     logo: 'https://media.api-sports.io/football/teams/15.png',   emoji: '🇨🇭' },
  { names: ['Denmark', 'DEN'],         logo: 'https://media.api-sports.io/football/teams/21.png',   emoji: '🇩🇰' },
  { names: ['Serbia', 'SRB'],          logo: 'https://media.api-sports.io/football/teams/14.png',   emoji: '🇷🇸' },
  { names: ['Iran', 'IRN'],            logo: 'https://media.api-sports.io/football/teams/44.png',   emoji: '🇮🇷' },
  { names: ['Saudi Arabia', 'SAU'],    logo: 'https://media.api-sports.io/football/teams/36.png',   emoji: '🇸🇦' },
].forEach(entry => {
  entry.names.forEach(n => {
    const key = normalizeName(n);
    if (key) _MAP[key] = { logo: entry.logo, emoji: entry.emoji, liga: 'WORLD_CUP' };
  });
});

// Exportar para Node.js (server) y browser (window)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findByName, getLogo, getEmoji, normalizeName, normalizeNationalTeamName };
} else if (typeof window !== 'undefined') {
  window.TeamLogoMap = { findByName, getLogo, getEmoji, normalizeName, normalizeNationalTeamName };
};
module.exports = {
  findByName,
  getLogo,
  getEmoji,
  normalizeName,
  normalizeNationalTeamName
};
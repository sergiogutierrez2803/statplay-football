/**
 * StatPlay Football — i18n.js
 * Sistema centralizado de internacionalización (ES / EN)
 *
 * USO:
 *   I18n.t('key')                  → string en idioma activo
 *   I18n.t('key', {name: 'X'})     → string con interpolación
 *   I18n.setLang('en')             → cambiar idioma
 *   I18n.getLang()                 → idioma activo ('es' | 'en')
 *
 * REGLA: nombres de equipos, ligas, números y porcentajes NUNCA se traducen.
 */

const I18n = (() => {

  /* ── Estado ── */
  let _lang = localStorage.getItem('statplay_lang') || 'es';

  // Sincronizar window.currentLang al cargar
  if (typeof window !== 'undefined') window.currentLang = _lang;

  /* ── Diccionario ── */
  const _dict = {

    /* ─── Insight: apertura ─── */
    insight_balanced: {
      es: (h, a) => `El análisis estadístico refleja un partido muy equilibrado entre ${h} y ${a}; las probabilidades de ambos equipos se mantienen muy cercanas.`,
      en: (h, a) => `The statistical analysis reflects a very balanced match between ${h} and ${a}; both teams' probabilities remain very close.`,
    },
    insight_advantage_notable: {
      es: (team, pct) => `El modelo identifica una notable ventaja estadística para ${team} (${pct}%), aunque la competición muestra que las diferencias entre equipos son reducidas.`,
      en: (team, pct) => `The model identifies a notable statistical advantage for ${team} (${pct}%), although the competition shows that differences between teams are small.`,
    },
    insight_advantage_slight: {
      es: (team, pct) => `El modelo identifica una ligera ventaja estadística para ${team} (${pct}%), aunque la competición muestra que las diferencias entre equipos son reducidas.`,
      en: (team, pct) => `The model identifies a slight statistical advantage for ${team} (${pct}%), although the competition shows that differences between teams are small.`,
    },

    /* ─── Insight: forma ─── */
    insight_form_home_better: {
      es: (team, form) => `${team} presenta mejor rendimiento reciente como local (${form}), lo que históricamente favorece resultados positivos en casa.`,
      en: (team, form) => `${team} shows better recent home form (${form}), which historically favours positive results at home.`,
    },
    insight_form_away_better: {
      es: (team, form) => `${team} llega con mayor regularidad en los últimos encuentros (${form}), factor que podría contrarrestar la localía.`,
      en: (team, form) => `${team} arrives with greater consistency in recent matches (${form}), a factor that could offset home advantage.`,
    },
    insight_form_equal: {
      es: () => `Ambos equipos muestran una dinámica de resultados similar en los últimos cinco partidos, sin que ninguno presente una ventaja clara en forma.`,
      en: () => `Both teams show a similar results pattern over the last five matches, with neither holding a clear form advantage.`,
    },

    /* ─── Insight: goles por tiempo ─── */
    insight_goals_second_half: {
      es: (h2, h1) => `El modelo proyecta mayor actividad goleadora en el segundo tiempo (${h2} xG vs ${h1} xG), patrón consistente con el estilo de ambos equipos esta temporada.`,
      en: (h2, h1) => `The model projects higher scoring activity in the second half (${h2} xG vs ${h1} xG), a pattern consistent with both teams' style this season.`,
    },
    insight_goals_even: {
      es: (h1, h2) => `La distribución de goles esperados es relativamente pareja entre tiempos (PT: ${h1} / ST: ${h2} xG), sin una tendencia clara sobre cuándo se decidirá el partido.`,
      en: (h1, h2) => `The expected goals distribution is relatively even between halves (1H: ${h1} / 2H: ${h2} xG), with no clear trend on when the match will be decided.`,
    },

    /* ─── Insight: H2H ─── */
    insight_h2h_dominant: {
      es: (team) => `En el historial directo, ${team} ha mostrado mayor consistencia en los enfrentamientos entre estas escuadras, aunque este dato tiene un peso moderado en el análisis.`,
      en: (team) => `In the head-to-head record, ${team} has shown greater consistency in clashes between these sides, although this carries moderate weight in the analysis.`,
    },
    insight_h2h_even: {
      es: () => `El historial directo no muestra un dominador claro, lo que refuerza la imprevisibilidad de este cruce.`,
      en: () => `The head-to-head record shows no clear dominant side, reinforcing the unpredictability of this fixture.`,
    },

    /* ─── Insight: riesgo ─── */
    insight_risk_high: {
      es: () => `⚠️ Nivel de riesgo ALTO: las probabilidades están muy equilibradas y cualquier resultado es estadísticamente plausible.`,
      en: () => `⚠️ HIGH risk level: probabilities are very balanced and any result is statistically plausible.`,
    },
    insight_risk_medium: {
      es: () => `Se recomienda considerar el margen de error del análisis, ya que la diferencia entre equipos no es suficiente para conclusiones definitivas.`,
      en: () => `It is advisable to consider the analysis margin of error, as the gap between teams is not sufficient for definitive conclusions.`,
    },

    /* ─── UI general ─── */
    'lang_label':        { es: 'ES', en: 'EN' },
    'lang_prefix':       { es: 'Idioma', en: 'Language' },
    'confidence_high':   { es: 'Alta',  en: 'High'   },
    'confidence_medium': { es: 'Media', en: 'Medium'  },
    'confidence_low':    { es: 'Baja',  en: 'Low'     },
    'risk_low':          { es: '🟢 Bajo',   en: '🟢 Low'    },
    'risk_medium':       { es: '🟡 Medio',  en: '🟡 Medium' },
    'risk_high':         { es: '🔴 Alto',   en: '🔴 High'   },
    'ai_title':          { es: 'Análisis con Inteligencia Artificial', en: 'Artificial Intelligence Analysis' },
    'ai_badge':          { es: 'StatPlay AI Engine v1.0', en: 'StatPlay AI Engine v1.0' },
    'confidence_label':  { es: 'Nivel de confianza del análisis', en: 'Analysis confidence level' },
    'confidence_desc':   { es: 'basado en forma, localía, historial y balance goles', en: 'based on form, home advantage, history and goal balance' },
    'margin_label':      { es: 'Margen de error estimado del análisis', en: 'Estimated analysis margin of error' },
    'prob_title':        { es: '📊 Probabilidades de resultado', en: '📊 Result probabilities' },
    'prob_home_wins':    { es: (t) => `${t} gana`, en: (t) => `${t} wins` },
    'prob_draw':         { es: 'Empate', en: 'Draw' },
    'prob_away_wins':    { es: (t) => `${t} gana`, en: (t) => `${t} wins` },

    /* ─── Tooltips (T5.3) ─── */
    'tt_xg': {
      es: 'Goles Esperados (xG): mide la calidad de las ocasiones creadas. Un valor más alto indica mayor peligro ofensivo.',
      en: 'Expected Goals (xG): measures the quality of chances created. A higher value indicates reaching better scoring positions.'
    },
    'tt_poisson': {
      es: 'Modelo Poisson: distribución estadística que calcula la probabilidad de goles basada en promedios históricos.',
      en: 'Poisson Model: statistical distribution that calculates goal probabilities based on historical averages.'
    },
    'tt_confidence': {
      es: 'Confianza: precisión estimada del análisis. Se basa en la calidad de los datos y la regularidad de los equipos.',
      en: 'Confidence: estimated analysis accuracy. Based on data quality and teams consistency.'
    },
    'tt_btts': {
      es: 'Ambos Marcan (BTTS): probabilidad de que ambos equipos anoten al menos un gol durante el partido.',
      en: 'Both Teams to Score (BTTS): probability that both teams score at least one goal during the match.'
    },
    'stats_title':       { es: '🎯 Indicadores estadísticos', en: '🎯 Statistical indicators' },
    'over25_label':      { es: 'Más de 2.5 goles', en: 'Over 2.5 goals' },
    'over25_sub':        { es: (n) => `${n} goles esperados`, en: (n) => `${n} expected goals` },
    'btts_label':        { es: 'Ambos marcan', en: 'Both teams score' },
    'btts_sub':          { es: 'Prob. BTTS', en: 'BTTS prob.' },
    'corners_label':     { es: 'Corners esperados', en: 'Expected corners' },
    'corners_sub':       { es: 'Promedio combinado', en: 'Combined average' },
    'xg_label':          { es: 'Goles esperados', en: 'Expected goals' },
    'xg_sub':            { es: 'Local · Visitante', en: 'Home · Away' },
    'halftime_title':    { es: '⏱️ Desglose de goles esperados por tiempo', en: '⏱️ Expected goals breakdown by half' },
    'half1_label':       { es: '1er Tiempo', en: '1st Half' },
    'half2_label':       { es: '2do Tiempo', en: '2nd Half' },
    'halftime_total':    { es: 'xG total por tiempo', en: 'Total xG by half' },
    'half1_short':       { es: 'PT', en: '1H' },
    'half2_short':       { es: 'ST', en: '2H' },
    'risk_label':        { es: 'Nivel de riesgo estadístico', en: 'Statistical risk level' },
    'h2h_title':         { es: (n) => `⚔️ Historial directo (últimos ${n} enfrentamientos)`, en: (n) => `⚔️ Head-to-head (last ${n} matches)` },
    'h2h_wins':          { es: (t) => `${t} gana`, en: (t) => `${t} wins` },
    'h2h_draws':         { es: 'Empates', en: 'Draws' },
    'legal_text':        {
      es: 'Esta aplicación ofrece <strong>análisis estadístico deportivo</strong> y no garantiza resultados. No está afiliada a ninguna entidad de apuestas.',
      en: 'This application provides <strong>sports statistical analysis</strong> and does not guarantee results. It is not affiliated with any betting entity.',
    },

    /* ─── Pantalla inicial ─── */
    'splash_tagline':    { es: 'Predicciones inteligentes basadas en datos reales', en: 'Intelligent predictions based on real data' },
    'splash_prompt':     { es: 'Selecciona una liga para comenzar', en: 'Select a league to get started' },
    'splash_prompt_change': { es: 'Selecciona una liga', en: 'Select a league' },
    'splash_active':     { es: 'Activa', en: 'Active' },
    'splash_coming':     { es: 'Champions League · Más ligas — Próximamente', en: 'Champions League · More leagues — Coming soon' },

    /* ─── Home ─── */
    'greeting_morning':  { es: 'Buenos días', en: 'Good morning' },
    'greeting_afternoon':{ es: 'Buenas tardes', en: 'Good afternoon' },
    'greeting_evening':  { es: 'Buenas noches', en: 'Good evening' },
    'home_subtitle':     { es: 'Próximas jornadas · Datos en tiempo real', en: 'Upcoming fixtures · Live data' },
    'home_change_league':{ es: 'Cambiar liga', en: 'Change league' },
    'home_analyze':      { es: '⚡ Analizar partido', en: '⚡ Analyze match' },
    'home_upcoming':     { es: '🗓️ Próximas jornadas', en: '🗓️ Upcoming fixtures' },
    'home_live':         { es: '🟢 En vivo', en: '🟢 Live' },
    'home_db':           { es: '🟡 DB', en: '🟡 DB' },
    'home_select':       { es: 'Seleccionar', en: 'Select' },
    'home_local':        { es: 'Local', en: 'Home' },
    'home_visitor':      { es: 'Visitante', en: 'Away' },
    'home_analyze_btn':  { es: '🔍 &nbsp; Analizar partido', en: '🔍 &nbsp; Analyze match' },
    'home_legal':        {
      es: '<strong>Aviso legal:</strong> Esta aplicación ofrece análisis estadístico deportivo y <strong>no garantiza resultados</strong>. No está afiliada a ninguna entidad de apuestas.',
      en: '<strong>Legal notice:</strong> This application provides sports statistical analysis and <strong>does not guarantee results</strong>. It is not affiliated with any betting entity.',
    },
    'home_analyze_hint': { es: 'Toca para analizar →', en: 'Tap to analyze →' },

    /* ─── Upcoming empty ─── */
    'upcoming_empty_title': { es: 'Sin partidos programados', en: 'No scheduled matches' },
    'upcoming_empty_default': { es: 'No hay partidos programados disponibles.', en: 'No scheduled matches available.' },
    'upcoming_tech_label':  { es: 'Diagnóstico técnico', en: 'Technical diagnosis' },
    'upcoming_tech_status': { es: 'Estado FD', en: 'FD status' },
    'upcoming_tech_db':     { es: 'Partidos en DB', en: 'Matches in DB' },

    /* ─── Modal ─── */
    'modal_title_home':  { es: 'Seleccionar equipo local', en: 'Select home team' },
    'modal_title_away':  { es: 'Seleccionar equipo visitante', en: 'Select away team' },
    'modal_search':      { es: 'Buscar equipo...', en: 'Search team...' },
    'modal_pos':         { es: (pos, pts) => `Pos. ${pos} · ${pts} pts`, en: (pos, pts) => `Pos. ${pos} · ${pts} pts` },

    /* ─── Standings ─── */
    'standings_greeting':{ es: 'Clasificación', en: 'Standings' },
    'standings_title':   { es: 'Tabla de <span class="text-gradient">Posiciones</span>', en: 'League <span class="text-gradient">Table</span>' },
    'standings_champions': { es: 'Champions', en: 'Champions' },
    'standings_europa':  { es: 'Europa', en: 'Europe' },
    'standings_relegation': { es: 'Descenso', en: 'Relegation' },
    'standings_team':    { es: 'Equipo', en: 'Team' },
    'standings_pj':      { es: 'PJ', en: 'MP' },
    'standings_gf':      { es: 'GF', en: 'GF' },
    'standings_gc':      { es: 'GC', en: 'GA' },
    'standings_dg':      { es: 'DG', en: 'GD' },
    'standings_pts':     { es: 'Pts', en: 'Pts' },
    'standings_pj_title':{ es: 'Partidos jugados', en: 'Matches played' },
    'standings_gf_title':{ es: 'Goles a favor', en: 'Goals for' },
    'standings_gc_title':{ es: 'Goles en contra', en: 'Goals against' },
    'standings_dg_title':{ es: 'Diferencia de goles', en: 'Goal difference' },

    /* ─── Matches page ─── */
    'matches_greeting':  { es: 'Herramienta de análisis', en: 'Analysis tool' },
    'matches_title':     { es: 'Seleccionar <span class="text-gradient">Partido</span>', en: 'Select <span class="text-gradient">Match</span>' },
    'matches_subtitle':  { es: 'Elige dos equipos para generar el análisis completo', en: 'Choose two teams to generate the full analysis' },
    'matches_home_label':{ es: 'Equipo local', en: 'Home team' },

    /* ─── Analysis loading ─── */
    'back_btn':          { es: '‹ &nbsp;Volver', en: '‹ &nbsp;Back' },
    'back_home_btn':     { es: '‹ &nbsp;Volver al inicio', en: '‹ &nbsp;Back to home' },

    /* ─── About ─── */
    'about_version':     { es: 'Versión 1.1.0 Multi-League · Premier & Bundesliga', en: 'Version 1.1.0 Multi-League · Premier & Bundesliga' },
    'about_engine':      { es: 'Motor de IA Estadístico', en: 'Statistical AI Engine' },
    'about_engine_desc': { es: 'Análisis ponderado con 4 factores clave', en: 'Weighted analysis with 4 key factors' },
    'about_multilang':   { es: 'Soporte Multi-Liga', en: 'Multi-League Support' },
    'about_multilang_desc': { es: 'Premier League & Bundesliga habilitadas', en: 'Premier League & Bundesliga enabled' },
    'about_predictions': { es: 'Predicciones Avanzadas', en: 'Advanced Predictions' },
    'about_predictions_desc': { es: 'Goles esperados, BTTS, Over 2.5, Corners', en: 'Expected goals, BTTS, Over 2.5, Corners' },
    'about_api':         { es: 'Preparado para API Real', en: 'Ready for Real API' },
    'about_api_desc':    { es: 'Listo para API-Football & SportMonks', en: 'Ready for API-Football & SportMonks' },
    'about_method':      { es: 'Metodología · Pesos del motor predictivo', en: 'Methodology · Predictive engine weights' },
    'about_form':        { es: '🔥 Forma reciente', en: '🔥 Recent form' },
    'about_form_desc':   { es: 'Últimos 5 partidos ponderados', en: 'Last 5 matches weighted' },
    'about_home_adv':    { es: '🏟️ Localía', en: '🏟️ Home advantage' },
    'about_home_adv_desc': { es: 'Rendimiento en casa / visitante', en: 'Home / away performance' },
    'about_h2h':         { es: '⚔️ Historial H2H', en: '⚔️ H2H history' },
    'about_h2h_desc':    { es: 'Enfrentamientos directos previos', en: 'Previous head-to-head matches' },
    'about_goals':       { es: '⚖️ Balance goles', en: '⚖️ Goal balance' },
    'about_goals_desc':  { es: 'Promedio ofensivo y defensivo', en: 'Offensive and defensive average' },
    'about_premium':     { es: '🚀 Próximamente — Premium', en: '🚀 Coming soon — Premium' },
    'about_premium_1':   { es: '🔔 Alertas inteligentes de partidos', en: '🔔 Smart match alerts' },
    'about_premium_2':   { es: '📁 Historial de análisis guardados', en: '📁 Saved analysis history' },
    'about_premium_3':   { es: '⭐ Partidos favoritos', en: '⭐ Favourite matches' },
    'about_premium_4':   { es: '🌍 Ligas adicionales (La Liga, Champions)', en: '🌍 Additional leagues (La Liga, Champions)' },
    'about_legal':       {
      es: '<strong>Aviso legal:</strong> StatPlay Football ofrece exclusivamente análisis estadístico deportivo con fines informativos. <strong>No garantiza resultados</strong> y no está afiliada a ninguna plataforma de apuestas, casas de apuestas ni organizaciones de juego. El uso de esta aplicación es bajo la exclusiva responsabilidad del usuario.',
      en: '<strong>Legal notice:</strong> StatPlay Football provides exclusively sports statistical analysis for informational purposes. <strong>It does not guarantee results</strong> and is not affiliated with any betting platform, bookmaker or gambling organisation. Use of this application is at the user\'s sole responsibility.',
    },

    /* ─── Métricas avanzadas ─── */
    'adv_title':           { es: '📈 Métricas avanzadas', en: '📈 Advanced metrics' },
    'adv_ou_label':        { es: 'Over/Under 2.5', en: 'Over/Under 2.5' },
    'adv_ou_over_high':    { es: 'Alta probabilidad Over 2.5', en: 'High probability Over 2.5' },
    'adv_ou_over_medium':  { es: 'Probabilidad media Over 2.5', en: 'Medium probability Over 2.5' },
    'adv_ou_under_high':   { es: 'Alta probabilidad Under 2.5', en: 'High probability Under 2.5' },
    'adv_ou_avg':          { es: (n) => `Promedio esperado: ${n} goles`, en: (n) => `Expected average: ${n} goals` },
    'adv_btts_label':      { es: 'Ambos equipos marcan (BTTS)', en: 'Both teams to score (BTTS)' },
    'adv_btts_high':       { es: 'Sí — Alta probabilidad', en: 'Yes — High probability' },
    'adv_btts_medium':     { es: 'Probable — Probabilidad media', en: 'Likely — Medium probability' },
    'adv_btts_low':        { es: 'No — Baja probabilidad', en: 'No — Low probability' },
    'adv_cards_label':     { es: '🟨 Predicción de tarjetas', en: '🟨 Cards prediction' },
    'adv_cards_high':      { es: 'Partido de alta intensidad', en: 'High intensity match' },
    'adv_cards_medium':    { es: 'Partido de intensidad media', en: 'Medium intensity match' },
    'adv_cards_low':       { es: 'Partido de baja intensidad', en: 'Low intensity match' },
    'adv_cards_expected':  { es: (n) => `~${n} tarjetas esperadas`, en: (n) => `~${n} expected cards` },
    'adv_cards_team':      { es: (t) => `Mayor riesgo: ${t}`, en: (t) => `Higher risk: ${t}` },
    'adv_no_data':         { es: 'Datos insuficientes para esta métrica', en: 'Insufficient data for this metric' },

    /* ─── Insight avanzado ─── */
    'insight_over_high':   { es: (n) => `El partido tiene alta probabilidad de superar los 2.5 goles (promedio esperado: ${n}).`, en: (n) => `The match has a high probability of exceeding 2.5 goals (expected average: ${n}).` },
    'insight_over_medium': { es: (n) => `Se espera un partido con goles moderados (promedio esperado: ${n}).`, en: (n) => `A moderately high-scoring match is expected (expected average: ${n}).` },
    'insight_under_high':  { es: (n) => `El partido tiene alta probabilidad de quedarse bajo los 2.5 goles (promedio esperado: ${n}).`, en: (n) => `The match has a high probability of staying under 2.5 goals (expected average: ${n}).` },
    'insight_btts_yes':    { es: () => `Ambos equipos tienen alta probabilidad de marcar.`, en: () => `Both teams have a high probability of scoring.` },
    'insight_btts_no':     { es: () => `Es probable que uno de los equipos no marque.`, en: () => `One of the teams is likely to fail to score.` },
    'insight_cards_high':  { es: () => `Se espera un encuentro intenso con varias tarjetas.`, en: () => `An intense match with several cards is expected.` },
    'insight_cards_medium':{ es: () => `Se espera un partido de intensidad normal.`, en: () => `A normally intense match is expected.` },

    /* ─── Venue (casa/fuera) ─── */
    'insight_venue_home_strong': { es: (t,w,n) => `${t} presenta fortaleza reciente jugando en casa (${w} victorias en ${n} partidos como local).`,                                                                                                                     en: (t,w,n) => `${t} shows recent home strength (${w} wins in ${n} home matches).` },
    'insight_venue_away_weak':   { es: (t,l,n,ga) => `${t} muestra debilidad fuera de casa, recibiendo ${ga} goles por partido en sus últimos ${n} encuentros como visitante.`,                                                                                         en: (t,l,n,ga) => `${t} shows weakness away from home, conceding ${ga} goals per game in their last ${n} away matches.` },
    'insight_venue_away_strong': { es: (t,w,n) => `${t} llega con solidez como visitante (${w} victorias en ${n} partidos fuera), lo que podría neutralizar la ventaja local.`,                                                                                         en: (t,w,n) => `${t} arrives with away solidity (${w} wins in ${n} away matches), which could neutralise the home advantage.` },
    'insight_venue_home_weak':   { es: (t,ga,n) => `${t} ha recibido ${ga} goles por partido en sus últimos ${n} encuentros en casa, lo que favorece al equipo visitante.`,                                                                                             en: (t,ga,n) => `${t} has conceded ${ga} goals per game in their last ${n} home matches, which favours the away side.` },

    /* ─── Tarjeta Oportunidad Detectada ─── */
    'opp_title':           { es: '🎯 Oportunidad detectada', en: '🎯 Detected opportunity' },
    'opp_high':            { es: 'Alta oportunidad', en: 'High opportunity' },
    'opp_medium':          { es: 'Oportunidad moderada', en: 'Moderate opportunity' },
    'opp_risk':            { es: 'Riesgo alto', en: 'High risk' },
    'opp_market':          { es: 'Mercado sugerido', en: 'Suggested market' },
    'opp_winner_home':     { es: (t) => `${t} gana`, en: (t) => `${t} wins` },
    'opp_winner_away':     { es: (t) => `${t} gana`, en: (t) => `${t} wins` },
    'opp_over25':          { es: 'Over 2.5 goles', en: 'Over 2.5 goals' },
    'opp_btts':            { es: 'Ambos marcan (BTTS)', en: 'Both teams score (BTTS)' },
    'opp_cards':           { es: 'Partido intenso (tarjetas)', en: 'Intense match (cards)' },

    /* ─── Rendimiento por Venue ─── */
    'venue_title':         { es: '🏟️ Rendimiento reciente por condición', en: '🏟️ Recent venue performance' },
    'venue_home':          { es: 'En Casa', en: 'At Home' },
    'venue_away':          { es: 'Fuera', en: 'Away' },

    /* ─── Top 3 mercados ─── */
    'top3_title':          { es: '📊 Top 3 mercados recomendados', en: '📊 Top 3 recommended markets' },

    /* ─── Fortaleza ofensiva ─── */
    'offense_title':       { es: '⚡ Fortaleza ofensiva', en: '⚡ Offensive strength' },
    'offense_home':        { es: 'Local', en: 'Home' },
    'offense_away':        { es: 'Visitante', en: 'Away' },
    'attack_short':        { es: 'ATA', en: 'ATT' },
    'defense_short':       { es: 'DEF', en: 'DEF' },

    /* ─── Resumen rápido ─── */
    'summary_title':       { es: '📋 Resumen del análisis', en: '📋 Analysis summary' },
    'summary_fav':         { es: 'Favorito', en: 'Favourite' },
    'summary_over':        { es: 'Over 2.5 probable', en: 'Over 2.5 likely' },
    'summary_no_over':     { es: 'Under 2.5 probable', en: 'Under 2.5 likely' },
    'summary_btts_yes':    { es: 'BTTS probable', en: 'BTTS likely' },
    'summary_btts_no':     { es: 'BTTS improbable', en: 'BTTS unlikely' },
    'summary_risk_low':    { es: 'Riesgo bajo', en: 'Low risk' },
    'summary_risk_medium': { es: 'Riesgo medio', en: 'Medium risk' },
    'summary_risk_high':   { es: 'Riesgo alto', en: 'High risk' },

    /* ─── Login screen ─── */
    'auth_title':          { es: 'StatPlay', en: 'StatPlay' },
    'auth_subtitle':       { es: 'Análisis predictivo de fútbol.<br>Ingresa para continuar.', en: 'Football predictive analytics.<br>Sign in to continue.' },
    'auth_email_placeholder': { es: 'Ingresa tu correo', en: 'Enter your email' },
    'auth_btn_login':      { es: 'Entrar', en: 'Sign in' },
    'auth_btn_guest':      { es: 'Entrar como invitado', en: 'Continue as guest' },
    'auth_legal':          { es: 'Al continuar aceptas el uso de datos para análisis estadístico.', en: 'By continuing you accept the use of data for statistical analysis.' },
    'auth_loading':        { es: 'Entrando...', en: 'Signing in...' },
    'auth_err_empty':      { es: 'Por favor ingresa tu correo.', en: 'Please enter your email.' },
    'auth_err_invalid':    { es: 'El correo no tiene un formato válido.', en: 'Please enter a valid email address.' },
    'auth_err_network':    { es: 'No se pudo conectar. Intenta de nuevo.', en: 'Could not connect. Please try again.' },
    'auth_lang_label':     { es: 'ES', en: 'EN' },

    /* ─── World Cup ─── */
    'wc_group_qualifies':  { es: 'Top 2 clasifican', en: 'Top 2 qualify' },
    'wc_phase_groups':     { es: 'Fase de Grupos', en: 'Group Stage' },
    'wc_home_local':       { es: 'Selección local', en: 'Home nation' },
    'wc_home_visitor':     { es: 'Selección visitante', en: 'Away nation' },
    'wc_modal_home':       { es: 'Seleccionar selección local', en: 'Select home nation' },
    'wc_modal_away':       { es: 'Seleccionar selección visitante', en: 'Select away nation' },
    'wc_upcoming':         { es: '🌍 Próximos partidos del Mundial', en: '🌍 Upcoming World Cup matches' },
  };

  /* ── API pública ── */
  return {
    getLang() { return _lang; },

    setLang(lang) {
      if (lang !== 'es' && lang !== 'en') return;
      _lang = lang;
      localStorage.setItem('statplay_lang', lang);
      document.documentElement.lang = lang;
      // Sincronizar estado global
      if (typeof window !== 'undefined') window.currentLang = lang;
      // Actualizar el selector en el header
      _updateLangBtn();
      // Disparar evento global para que todos los módulos re-rendericen
      document.dispatchEvent(new CustomEvent('LANG_CHANGED', { detail: { lang } }));
    },

    /** Actualizar visualmente el botón de idioma */
    updateBtn() { _updateLangBtn(); },

    /**
     * Obtener traducción.
     * Si el valor es una función, se llama con los args proporcionados.
     * Si es string, se devuelve directamente.
     */
    t(key, ...args) {
      const entry = _dict[key];
      if (!entry) return key; // fallback: devolver la clave
      const val = entry[_lang] ?? entry['es'];
      return typeof val === 'function' ? val(...args) : val;
    },

    /**
     * Generar insight completo en el idioma activo.
     * Acepta métricas avanzadas opcionales para enriquecer el análisis.
     */
    buildInsight(home, away, probs, ht, h2h, risk, advanced = null) {
      const parts = [];
      const diff = probs.home - probs.away;
      const maxP = Math.max(probs.home, probs.away);

      // 1. Apertura
      if (Math.abs(diff) <= 7) {
        parts.push(this.t('insight_balanced', home.name, away.name));
      } else {
        const lead = diff > 0 ? home : away;
        if (maxP >= 55) {
          parts.push(this.t('insight_advantage_notable', lead.name, maxP));
        } else {
          parts.push(this.t('insight_advantage_slight', lead.name, maxP));
        }
      }

      // 2. Forma
      const hFS = _formScore(home.form);
      const aFS = _formScore(away.form);
      if (hFS - aFS > 0.22) {
        parts.push(this.t('insight_form_home_better', home.name, home.form.join('-')));
      } else if (aFS - hFS > 0.22) {
        parts.push(this.t('insight_form_away_better', away.name, away.form.join('-')));
      } else {
        parts.push(this.t('insight_form_equal'));
      }

      // 3. Goles por tiempo
      if (ht.secondHalf.total > ht.firstHalf.total * 1.25) {
        parts.push(this.t('insight_goals_second_half', ht.secondHalf.total, ht.firstHalf.total));
      } else {
        parts.push(this.t('insight_goals_even', ht.firstHalf.total, ht.secondHalf.total));
      }

      // 4. H2H
      const h2hT = (h2h?.hw || 0) + (h2h?.d || 0) + (h2h?.aw || 0);
      if (h2hT >= 3) {
        const dom = h2h.hw > h2h.aw ? home.name : (h2h.aw > h2h.hw ? away.name : null);
        parts.push(dom
          ? this.t('insight_h2h_dominant', dom)
          : this.t('insight_h2h_even')
        );
      }

      // 5. Métricas avanzadas (si disponibles)
      if (advanced && !advanced.error) {
        // Over/Under
        if (advanced.overUnder) {
          const ou = advanced.overUnder;
          if (ou.over.level === 'high') parts.push(this.t('insight_over_high', ou.avgGoals));
          else if (ou.over.level === 'medium') parts.push(this.t('insight_over_medium', ou.avgGoals));
          else parts.push(this.t('insight_under_high', ou.avgGoals));
        }
        // BTTS
        if (advanced.btts) {
          if (advanced.btts.level === 'high') parts.push(this.t('insight_btts_yes'));
          else if (advanced.btts.level === 'low') parts.push(this.t('insight_btts_no'));
        }
        // Tarjetas
        if (advanced.cards) {
          if (advanced.cards.intensity === 'high') parts.push(this.t('insight_cards_high'));
          else if (advanced.cards.intensity === 'medium') parts.push(this.t('insight_cards_medium'));
        }
      }

      // 5.5 Venue (casa/fuera) — si disponible en el resultado
      const hVenue = home.venueForm;
      const aVenue = away.venueForm;
      if (hVenue && hVenue.matches >= 2) {
        if (hVenue.wins >= 3)              parts.push(this.t('insight_venue_home_strong', home.name, hVenue.wins, hVenue.matches));
        else if (hVenue.avgGoalsAgainst >= 1.8) parts.push(this.t('insight_venue_home_weak', home.name, hVenue.avgGoalsAgainst, hVenue.matches));
      }
      if (aVenue && aVenue.matches >= 2) {
        if (aVenue.wins >= 3)              parts.push(this.t('insight_venue_away_strong', away.name, aVenue.wins, aVenue.matches));
        else if (aVenue.avgGoalsAgainst >= 1.8) parts.push(this.t('insight_venue_away_weak', away.name, aVenue.losses, aVenue.matches, aVenue.avgGoalsAgainst));
      }

      // 6. Riesgo
      if (risk === 'high')   parts.push(this.t('insight_risk_high'));
      else if (risk === 'medium') parts.push(this.t('insight_risk_medium'));

      return parts.join(' ');
    },
  };

  /* helpers internos (no expuestos) */
  function _formScore(form = []) {
    const w = [0.30, 0.25, 0.20, 0.15, 0.10];
    const pts = { W: 3, D: 1, L: 0 };
    return form.reduce((acc, r, i) => acc + (pts[r] ?? 0) * (w[i] ?? 0.10), 0) / 3;
  }

  function _updateLangBtn() {
    const btn = document.getElementById('btn-lang');
    if (!btn) return;
    // Etiqueta en el idioma activo + código del idioma al que cambiará
    const prefix = _lang === 'es' ? 'Idioma' : 'Language';
    const next   = _lang === 'es' ? 'EN' : 'ES';
    // Muestra: "Idioma: EN" (activo=ES, cambia a EN) o "Language: ES" (activo=EN, cambia a ES)
    btn.innerHTML = `<span class="lang-prefix">${prefix}:</span>&nbsp;${next}`;
  }

})();

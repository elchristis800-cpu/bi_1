/* Datos simulados compartidos: preguntas de BI y calendario de Liga Pro 2026. */
(() => {
  'use strict';

  /** Banco de preguntas: cada entrada tiene cuatro opciones y un índice correcto. */
  window.QUIZ_QUESTIONS = [
    { question: '¿Qué transformación convierte un dato aislado en información útil?', options: ['Eliminar todos los datos históricos', 'Agregar contexto y compararlo con una referencia', 'Cambiar el nombre de la columna', 'Duplicar el registro para confirmar'], answer: 1, explanation: 'El contexto (periodo, segmento o referencia) permite interpretar un dato y convertirlo en información.' },
    { question: '¿Cuál es el orden correcto del ciclo para decidir con datos?', options: ['Decisión → dato → información → conocimiento', 'Información → conocimiento → dato → decisión', 'Dato → información → conocimiento → decisión', 'Dato → decisión → conocimiento → información'], answer: 2, explanation: 'El dato se organiza como información, se interpreta como conocimiento y orienta una decisión.' },
    { question: '¿Qué actividad pertenece a la fase Extract de ETL?', options: ['Leer ventas desde el sistema ERP', 'Unificar formatos de fecha', 'Eliminar registros duplicados', 'Publicar una tabla en el almacén'], answer: 0, explanation: 'Extract recopila los datos desde sus fuentes, como un ERP, archivo, API o sensor.' },
    { question: 'Unificar nombres de equipos y corregir fechas duplicadas corresponde a:', options: ['Extraer', 'Transformar', 'Cargar', 'Visualizar'], answer: 1, explanation: 'Transform limpia y estandariza datos para hacerlos consistentes antes de cargarlos.' },
    { question: '¿Qué describe mejor la fase Load?', options: ['Definir una pregunta de negocio', 'Recolectar datos de una API', 'Guardar datos preparados en su destino analítico', 'Crear una predicción'], answer: 2, explanation: 'Load almacena los datos transformados en un destino preparado para consultas o análisis.' },
    { question: '¿Cuál es un ejemplo de decisión operativa?', options: ['Abrir operaciones en otro país', 'Reasignar hoy personal ante una fila extensa', 'Rediseñar el plan a cinco años', 'Pronosticar ventas del próximo año'], answer: 1, explanation: 'La decisión operativa resuelve situaciones inmediatas del trabajo cotidiano.' },
    { question: '¿Qué aporta principalmente un dashboard de BI?', options: ['Reemplaza la calidad de los datos', 'Muestra métricas para monitorear y comparar resultados', 'Garantiza que una estrategia funcione', 'Elimina la necesidad de hacer preguntas'], answer: 1, explanation: 'Un dashboard facilita monitorear indicadores y detectar patrones; las decisiones aún requieren contexto.' },
    { question: '¿Qué práctica ayuda a evitar errores en un proceso ETL?', options: ['Cargar sin revisar para ahorrar tiempo', 'Ignorar unidades distintas', 'Validar calidad y totales en cada etapa', 'Borrar la fuente tras extraer'], answer: 2, explanation: 'Las validaciones por etapa detectan nulos, duplicados o diferencias antes de que afecten el análisis.' }
  ];

  /** Equipos ficticios con atributos para generar partidos reproducibles y plausibles. */
  const teams = [
    { id: 'quito', name: 'Quito Capital', short: 'QCA', crest: '🔴', attack: 1.34, defense: 0.79, possession: 56, strength: 9 },
    { id: 'guayaquil', name: 'Guayaquil FC', short: 'GFC', crest: '🔵', attack: 1.28, defense: 0.86, possession: 54, strength: 8 },
    { id: 'cuenca', name: 'Deportivo Cuenca', short: 'DCU', crest: '⚫', attack: 1.18, defense: 0.91, possession: 51, strength: 7 },
    { id: 'ambato', name: 'Ambato Unido', short: 'AUN', crest: '🟢', attack: 1.14, defense: 0.93, possession: 50, strength: 7 },
    { id: 'manta', name: 'Manta Sporting', short: 'MAS', crest: '🟡', attack: 1.12, defense: 0.98, possession: 49, strength: 6 },
    { id: 'loja', name: 'Loja Atlético', short: 'LAT', crest: '🟠', attack: 1.08, defense: 0.97, possession: 48, strength: 6 },
    { id: 'machala', name: 'Machala Norte', short: 'MAN', crest: '🟣', attack: 1.03, defense: 1.02, possession: 47, strength: 5 },
    { id: 'ibarra', name: 'Ibarra del Valle', short: 'IDV', crest: '🟤', attack: 1.00, defense: 1.06, possession: 46, strength: 5 },
    { id: 'riobamba', name: 'Riobamba SC', short: 'RSC', crest: '⚪', attack: 0.96, defense: 1.08, possession: 45, strength: 4 },
    { id: 'esmeraldas', name: 'Esmeraldas Unido', short: 'ESU', crest: '🔷', attack: 0.91, defense: 1.12, possession: 44, strength: 3 }
  ];

  /** Construye un calendario de todos contra todos y simula marcadores estables. */
  const buildMatches = () => {
    const rotation = teams.map((team) => team.id);
    const fixtures = [];
    for (let round = 1; round <= 15; round += 1) {
      const cycleRound = ((round - 1) % 9) + 1;
      const isReturnLeg = round > 9;
      const arranged = [...rotation];
      for (let pair = 0; pair < 5; pair += 1) {
        let homeId = arranged[pair];
        let awayId = arranged[9 - pair];
        if ((cycleRound + pair) % 2 === 0) [homeId, awayId] = [awayId, homeId];
        if (isReturnLeg) [homeId, awayId] = [awayId, homeId];
        const home = teams.find((team) => team.id === homeId);
        const away = teams.find((team) => team.id === awayId);
        const homeSeed = (round * 7 + pair * 3 + home.strength) % 11;
        const awaySeed = (round * 5 + pair * 4 + away.strength) % 12;
        const homeGoals = Math.min(4, Math.max(0, Math.floor(home.attack + (home.strength - away.strength) * 0.13 + (homeSeed > 7 ? 1 : 0) + (homeSeed === 0 ? -1 : 0))));
        const awayGoals = Math.min(4, Math.max(0, Math.floor(away.attack + (away.strength - home.strength) * 0.1 + (awaySeed > 8 ? 1 : 0) + (awaySeed === 0 ? -1 : 0))));
        fixtures.push({ id: `J${round}-${pair + 1}`, round, homeId, awayId, homeGoals, awayGoals, yellowHome: 1 + ((round + pair) % 3), yellowAway: 1 + ((round + pair + 1) % 3), redHome: (round + pair * 2) % 13 === 0 ? 1 : 0, redAway: (round * 2 + pair) % 17 === 0 ? 1 : 0 });
      }
      const last = rotation.pop();
      rotation.splice(1, 0, last);
    }
    return fixtures;
  };

  window.LEAGUE_DATA = { season: 2026, teams, matches: buildMatches(), totalRounds: 15 };
})();
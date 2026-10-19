/* Calcula métricas de Liga Pro y actualiza KPIs, gráficas y tabla ante cada filtro. */
(() => {
  'use strict';

  const league = window.LEAGUE_DATA;
  if (!league || !window.Chart) return;

  const teamFilter = document.querySelector('#team-filter');
  const roundFilter = document.querySelector('#round-filter');
  const roundOutput = document.querySelector('#round-output');
  const status = document.querySelector('#dashboard-status');
  const exportButton = document.querySelector('#export-report');
  const charts = {};
  const colors = { lime: '#7ed957', green: '#57a938', navy: '#0b1f3a', blue: '#69acc0', amber: '#e5b34c', coral: '#e8795b', muted: '#dce4dc' };

  /** Devuelve un acumulado estadístico de equipo para partidos incluidos. */
  const calculateStandings = (matches) => {
    const rows = new Map(league.teams.map((team) => [team.id, { ...team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, yellow: 0, red: 0 }]));
    matches.forEach((match) => {
      const home = rows.get(match.homeId);
      const away = rows.get(match.awayId);
      home.played += 1; away.played += 1;
      home.goalsFor += match.homeGoals; home.goalsAgainst += match.awayGoals;
      away.goalsFor += match.awayGoals; away.goalsAgainst += match.homeGoals;
      home.yellow += match.yellowHome; away.yellow += match.yellowAway;
      home.red += match.redHome; away.red += match.redAway;
      if (match.homeGoals > match.awayGoals) { home.wins += 1; home.points += 3; away.losses += 1; }
      else if (match.homeGoals < match.awayGoals) { away.wins += 1; away.points += 3; home.losses += 1; }
      else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
    });
    return [...rows.values()].map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst })).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name, 'es'));
  };

  /** Cuenta las tres clases de resultado para la liga o el equipo elegido. */
  const countResults = (matches, teamId) => {
    const results = [0, 0, 0];
    matches.forEach((match) => {
      if (teamId !== 'all' && match.homeId !== teamId && match.awayId !== teamId) return;
      if (match.homeGoals > match.awayGoals) results[0] += 1;
      else if (match.homeGoals === match.awayGoals) results[1] += 1;
      else results[2] += 1;
    });
    return results;
  };

  /** Mantiene la misma instancia de Chart.js y reemplaza datos/opciones. */
  const updateChart = (key, canvasId, config) => {
    if (charts[key]) {
      charts[key].data = config.data;
      charts[key].options = config.options;
      charts[key].update('none');
    } else {
      charts[key] = new Chart(document.querySelector(`#${canvasId}`), config);
    }
  };

  /** Renderiza tarjetas de indicadores con conteo animado accesible. */
  const animateValue = (element, target, decimals = 0) => {
    const startValue = Number(element.dataset.value || 0);
    const startTime = performance.now();
    const duration = 420;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - ((1 - progress) ** 3);
      const current = startValue + (target - startValue) * eased;
      element.textContent = current.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(tick);
      else element.dataset.value = String(target);
    };
    requestAnimationFrame(tick);
  };

  /** Construye las filas ordenadas de la tabla de posiciones. */
  const renderStandings = (rows, selectedTeam, round) => {
    document.querySelector('#standings-round').textContent = `JORNADA ${round}`;
    document.querySelector('#standings-body').innerHTML = rows.map((team, index) => {
      const position = index + 1;
      const classes = [position <= 3 ? 'top-row' : '', position >= 4 && position <= 6 ? 'runner-row' : '', team.id === selectedTeam ? 'selected-row' : ''].filter(Boolean).join(' ');
      return `<tr class="${classes}"><td class="position-cell">${String(position).padStart(2, '0')}</td><td class="team-cell"><span class="team-crest" aria-hidden="true">${team.crest}</span>${team.name}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference > 0 ? '+' : ''}${team.goalDifference}</td><td class="points-cell">${team.points}</td></tr>`;
    }).join('');
  };

  /** Actualiza los cuatro gráficos de la vista con el equipo y jornada actuales. */
  const renderCharts = (matches, rows, selectedTeam) => {
    const darkTheme = document.documentElement.dataset.theme === 'dark';
    const chartInk = darkTheme ? '#c2d0d2' : '#728087';
    const chartGrid = darkTheme ? '#35474c' : '#edf0ec';
    const sortedByGoals = [...rows].sort((a, b) => b.goalsFor - a.goalsFor);
    const selectedRow = rows.find((team) => team.id === selectedTeam);
    const focusColor = (team) => team.id === selectedTeam ? colors.lime : colors.blue;
    updateChart('goals', 'goals-chart', {
      type: 'bar', data: { labels: sortedByGoals.map((team) => team.short), datasets: [{ label: 'Goles', data: sortedByGoals.map((team) => team.goalsFor), backgroundColor: sortedByGoals.map(focusColor), borderRadius: 4, maxBarThickness: 32 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => rows.find((team) => team.short === items[0].label)?.name || items[0].label } } }, scales: { x: { grid: { display: false }, ticks: { color: chartInk, font: { family: 'DM Sans', size: 10 } } }, y: { beginAtZero: true, ticks: { precision: 0, color: chartInk, font: { family: 'DM Sans', size: 10 } }, grid: { color: chartGrid } } } }
    });

    const resultCounts = countResults(matches, selectedTeam);
    const resultNames = ['Victoria local', 'Empate', 'Victoria visitante'];
    const resultColors = [colors.green, colors.amber, colors.blue];
    document.querySelector('#results-scope').textContent = selectedTeam === 'all' ? 'LIGA' : 'EQUIPO';
    document.querySelector('#results-legend').innerHTML = resultNames.map((name, index) => `<span class="legend-item"><i class="legend-swatch" style="background:${resultColors[index]}"></i>${name}</span>`).join('');
    updateChart('results', 'results-chart', {
      type: 'doughnut', data: { labels: resultNames, datasets: [{ data: resultCounts, backgroundColor: resultColors, borderColor: '#fff', borderWidth: 4, hoverOffset: 5 }] },
      options: { maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => `${item.label}: ${item.raw}` } } } }
    });

    const maxRound = matches.reduce((max, match) => Math.max(max, match.round), 1);
    const rounds = Array.from({ length: maxRound }, (_, index) => index + 1);
    const goalsByRound = rounds.map((round) => {
      const roundMatches = matches.filter((match) => match.round === round);
      if (selectedTeam === 'all') return roundMatches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);
      return roundMatches.reduce((sum, match) => sum + (match.homeId === selectedTeam ? match.homeGoals : match.awayId === selectedTeam ? match.awayGoals : 0), 0);
    });
    updateChart('rounds', 'round-chart', {
      type: 'line', data: { labels: rounds.map((round) => `J${round}`), datasets: [{ label: selectedRow ? `Goles · ${selectedRow.short}` : 'Goles liga', data: goalsByRound, borderColor: selectedTeam === 'all' ? colors.navy : colors.green, backgroundColor: 'rgba(126,217,87,.16)', fill: true, tension: .34, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: selectedTeam === 'all' ? colors.navy : colors.green, borderWidth: 2 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: chartInk, font: { family: 'DM Sans', size: 9 }, maxRotation: 0 } }, y: { beginAtZero: true, ticks: { precision: 0, color: chartInk, font: { family: 'DM Sans', size: 9 } }, grid: { color: chartGrid } } } }
    });

    const sortedCards = [...rows].sort((a, b) => b.yellow + b.red - (a.yellow + a.red));
    updateChart('cards', 'cards-chart', {
      type: 'bar', data: { labels: sortedCards.map((team) => team.short), datasets: [{ label: 'Amarillas', data: sortedCards.map((team) => team.yellow), backgroundColor: sortedCards.map((team) => team.id === selectedTeam ? colors.amber : '#e8c66d'), borderRadius: 3, barThickness: 9 }, { label: 'Rojas', data: sortedCards.map((team) => team.red), backgroundColor: sortedCards.map((team) => team.id === selectedTeam ? colors.coral : '#e9a18d'), borderRadius: 3, barThickness: 9 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, color: chartInk, font: { family: 'DM Sans', size: 9 } } }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { beginAtZero: true, stacked: false, ticks: { precision: 0, color: chartInk, font: { family: 'DM Sans', size: 9 } }, grid: { color: chartGrid } }, y: { grid: { display: false }, ticks: { color: chartInk, font: { family: 'DM Sans', size: 9 } } } } }
    });
  };

  /** Aplica filtros a KPIs, gráficas, tabla y textos auxiliares. */
  const updateDashboard = () => {
    const maxRound = Number(roundFilter.value);
    const selectedTeam = teamFilter.value;
    const matches = league.matches.filter((match) => match.round <= maxRound);
    const rows = calculateStandings(matches);
    const goals = matches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);
    const reds = matches.reduce((sum, match) => sum + match.redHome + match.redAway, 0);
    const games = matches.length;
    const leader = rows[0];
    roundOutput.value = `${maxRound} de ${league.totalRounds}`;
    roundOutput.textContent = `${maxRound} de ${league.totalRounds}`;
    status.textContent = selectedTeam === 'all' ? `Mostrando datos de ${games} partidos hasta la jornada ${maxRound}` : `Mostrando ${league.teams.find((team) => team.id === selectedTeam).name} y datos de ${games} partidos hasta la jornada ${maxRound}`;
    document.querySelector('#kpi-goals-note').textContent = `Acumulado hasta jornada ${maxRound}`;
    document.querySelector('#kpi-leader').textContent = `${leader.crest} ${leader.short}`;
    document.querySelector('#kpi-leader-note').textContent = `${leader.points} puntos · ${leader.played} PJ · ${leader.name}`;
    document.querySelector('#kpi-reds-note').textContent = `Acumuladas hasta jornada ${maxRound}`;
    animateValue(document.querySelector('#kpi-goals'), goals);
    animateValue(document.querySelector('#kpi-average'), games ? goals / games : 0, 2);
    animateValue(document.querySelector('#kpi-reds'), reds);
    renderCharts(matches, rows, selectedTeam);
    renderStandings(rows, selectedTeam, maxRound);
  };

  /** Descarga un Excel con resumen, posiciones y partidos del periodo filtrado. */
  const exportReport = () => {
    const maxRound = Number(roundFilter.value);
    const selectedTeam = teamFilter.value;
    const teamName = selectedTeam === 'all' ? 'Todos los equipos' : league.teams.find((team) => team.id === selectedTeam).name;
    const leagueMatches = league.matches.filter((match) => match.round <= maxRound);
    const filteredMatches = leagueMatches.filter((match) => selectedTeam === 'all' || match.homeId === selectedTeam || match.awayId === selectedTeam);
    const standings = calculateStandings(leagueMatches);
    const goals = standings.reduce((sum, team) => sum + team.goalsFor, 0);
    const redCards = standings.reduce((sum, team) => sum + team.red, 0);
    const generatedAt = new Date().toLocaleString('es-EC');
    const positionRows = standings.map((team, index) => [index + 1, team.name, team.played, team.wins, team.draws, team.losses, team.goalsFor, team.goalsAgainst, team.goalDifference, team.points]);
    const matchRows = filteredMatches.map((match) => {
      const home = league.teams.find((team) => team.id === match.homeId);
      const away = league.teams.find((team) => team.id === match.awayId);
      return [match.round, home.name, match.homeGoals, match.awayGoals, away.name, match.yellowHome + match.yellowAway, match.redHome + match.redAway];
    });
    const filename = `liga-pro-2026-jornada-${maxRound}`;

    if (window.XLSX) {
      const workbook = window.XLSX.utils.book_new();
      const summary = [
        ['INFORME LIGA PRO 2026', ''], ['Generado', generatedAt], ['Jornada máxima', maxRound], ['Equipo destacado', teamName],
        ['Partidos incluidos', filteredMatches.length], ['Goles acumulados de la liga', goals],
        ['Promedio de goles por partido', Number((goals / Math.max(1, leagueMatches.length)).toFixed(2))], ['Tarjetas rojas acumuladas', redCards]
      ];
      const summarySheet = window.XLSX.utils.aoa_to_sheet(summary);
      summarySheet['!cols'] = [{ wch: 32 }, { wch: 28 }];
      const standingsSheet = window.XLSX.utils.aoa_to_sheet([['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS'], ...positionRows]);
      standingsSheet['!cols'] = [{ wch: 8 }, { wch: 24 }, ...Array.from({ length: 8 }, () => ({ wch: 9 }))];
      const matchesSheet = window.XLSX.utils.aoa_to_sheet([['Jornada', 'Local', 'Goles local', 'Goles visitante', 'Visitante', 'Amarillas', 'Rojas'], ...matchRows]);
      matchesSheet['!cols'] = [{ wch: 11 }, { wch: 24 }, { wch: 14 }, { wch: 17 }, { wch: 24 }, { wch: 13 }, { wch: 10 }];
      window.XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
      window.XLSX.utils.book_append_sheet(workbook, standingsSheet, 'Posiciones');
      window.XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Partidos');
      window.XLSX.writeFile(workbook, `${filename}.xlsx`);
      status.textContent = `Informe Excel descargado: ${filename}.xlsx`;
      return;
    }

    const csvRows = [['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS'], ...positionRows];
    const csv = `\uFEFF${csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `${filename}-posiciones.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    status.textContent = 'No se pudo cargar la biblioteca Excel. Se descargó la tabla en CSV, compatible con Excel.';
  };

  /** Rellena el selector con los clubes definidos en data.js. */
  league.teams.forEach((team) => {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = `${team.crest} ${team.name}`;
    teamFilter.append(option);
  });
  teamFilter.addEventListener('change', updateDashboard);
  roundFilter.addEventListener('input', updateDashboard);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    teamFilter.value = 'all';
    roundFilter.value = String(league.totalRounds);
    updateDashboard();
    teamFilter.focus();
  });
  exportButton.addEventListener('click', exportReport);
  window.addEventListener('bi:themechange', updateDashboard);
  updateDashboard();
})();
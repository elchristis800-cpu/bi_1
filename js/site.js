/* Gestiona el tema persistente y el recorrido guiado de ambas páginas. */
(() => {
  'use strict';

  const root = document.documentElement;
  try {
    root.dataset.theme = localStorage.getItem('bi-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    root.dataset.theme = 'light';
  }

  const guides = {
    fundamentals: [
      { selector: '[data-tour="intro"]', title: 'Empieza aquí', text: 'Una introducción al propósito de Business Intelligence: convertir datos en mejores decisiones.' },
      { selector: '[data-tour="decision"]', title: 'Del dato a la decisión', text: 'Recorre el ciclo de análisis y conoce decisiones operativas, tácticas, estratégicas y predictivas.' },
      { selector: '[data-tour="etl"]', title: 'Sigue la ruta ETL', text: 'Aprende cómo se extraen, transforman y cargan los datos, cuidando su calidad en cada paso.' },
      { selector: '[data-tour="quiz"]', title: 'Pon a prueba lo aprendido', text: 'Responde el cuestionario, recibe feedback al instante y gana una insignia según tu resultado.' }
    ],
    dashboard: [
      { selector: '[data-tour="filters"]', title: 'Elige el contexto', text: 'Destaca un equipo y limita el análisis hasta una jornada. Restablece los filtros cuando quieras.' },
      { selector: '[data-tour="kpis"]', title: 'Lee los indicadores', text: 'Sigue goles, líder, promedio por partido y tarjetas rojas acumuladas en el periodo.' },
      { selector: '[data-tour="charts"]', title: 'Explora el rendimiento', text: 'Compara goles, resultados, evolución por jornada y disciplina; el equipo elegido queda resaltado.' },
      { selector: '[data-tour="standings"]', title: 'Consulta y exporta', text: 'Revisa las posiciones y descarga un informe para abrirlo en Excel.' }
    ]
  };

  /** Aplica el tema visual, lo guarda y lo comunica a los gráficos. */
  const applyTheme = (theme, button) => {
    root.dataset.theme = theme;
    try { localStorage.setItem('bi-theme', theme); } catch { /* El tema queda activo durante esta visita. */ }
    if (button) {
      const dark = theme === 'dark';
      button.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      button.title = dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
      button.innerHTML = `<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}" aria-hidden="true"></i>`;
    }
    window.dispatchEvent(new CustomEvent('bi:themechange', { detail: { theme } }));
  };

  /** Muestra un tour con navegación por botones, teclado y Escape. */
  const startTour = (steps, opener) => {
    let current = 0;
    let highlighted = null;
    const backdrop = document.createElement('div');
    backdrop.className = 'tour-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    const dialog = document.createElement('section');
    dialog.className = 'tour-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'tour-title');
    dialog.setAttribute('aria-describedby', 'tour-description');
    dialog.innerHTML = '<div class="tour-dialog-top"><span class="tour-count" id="tour-count"></span><button class="tour-close" type="button" aria-label="Cerrar tour"><i class="bi bi-x-lg" aria-hidden="true"></i></button></div><h2 id="tour-title"></h2><p id="tour-description"></p><div class="tour-dialog-actions"><button class="tour-prev" type="button">Anterior</button><button class="tour-next" type="button"></button></div>';
    document.body.append(backdrop, dialog);
    const count = dialog.querySelector('#tour-count');
    const title = dialog.querySelector('#tour-title');
    const description = dialog.querySelector('#tour-description');
    const previous = dialog.querySelector('.tour-prev');
    const next = dialog.querySelector('.tour-next');

    const close = () => {
      highlighted?.classList.remove('tour-highlight');
      backdrop.remove();
      dialog.remove();
      document.removeEventListener('keydown', onKeydown);
      opener?.focus();
    };
    const render = () => {
      highlighted?.classList.remove('tour-highlight');
      const step = steps[current];
      highlighted = document.querySelector(step.selector);
      highlighted?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlighted?.classList.add('tour-highlight');
      count.textContent = `PASO ${current + 1} DE ${steps.length}`;
      title.textContent = step.title;
      description.textContent = step.text;
      previous.disabled = current === 0;
      next.innerHTML = current === steps.length - 1 ? 'Terminar <i class="bi bi-check2" aria-hidden="true"></i>' : 'Siguiente <i class="bi bi-arrow-right" aria-hidden="true"></i>';
    };
    const onKeydown = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight' && current < steps.length - 1) { current += 1; render(); }
      if (event.key === 'ArrowLeft' && current > 0) { current -= 1; render(); }
    };

    dialog.querySelector('.tour-close').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    previous.addEventListener('click', () => { if (current > 0) { current -= 1; render(); } });
    next.addEventListener('click', () => { if (current < steps.length - 1) { current += 1; render(); } else close(); });
    document.addEventListener('keydown', onKeydown);
    render();
    dialog.querySelector('.tour-close').focus();
  };

  window.addEventListener('DOMContentLoaded', () => {
    const themeButton = document.querySelector('#theme-toggle');
    applyTheme(root.dataset.theme, themeButton);
    themeButton?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', themeButton));
    const page = document.body.classList.contains('dashboard-page') ? 'dashboard' : 'fundamentals';
    document.querySelectorAll('[data-tour-start]').forEach((button) => button.addEventListener('click', () => startTour(guides[page], button)));
  });
})();
/* Controla el cuestionario, puntaje, progreso, insignias, tiempo y sonido opcional. */
(() => {
  'use strict';

  const questions = window.QUIZ_QUESTIONS || [];
  const panel = document.querySelector('#quiz-panel');
  if (!panel || questions.length === 0) return;

  const content = document.querySelector('#question-content');
  const counter = document.querySelector('#question-counter');
  const scoreValue = document.querySelector('#score-value');
  const progress = document.querySelector('.progress-track');
  const progressFill = document.querySelector('#progress-fill');
  const nextButton = document.querySelector('#next-button');
  const result = document.querySelector('#quiz-result');
  const soundToggle = document.querySelector('#sound-toggle');
  let currentIndex = 0;
  let score = 0;
  let startedAt = 0;
  let answered = false;

  /** Reproduce un tono corto cuando el usuario habilita sonido. */
  const playTone = (correct) => {
    if (!soundToggle.checked) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = correct ? 660 : 220;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.16);
    oscillator.onended = () => audio.close();
  };

  /** Dibuja la pregunta actual y actualiza el indicador de progreso. */
  const renderQuestion = () => {
    const item = questions[currentIndex];
    answered = false;
    counter.textContent = `PREGUNTA ${String(currentIndex + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`;
    progress.setAttribute('aria-valuenow', String(currentIndex));
    progressFill.style.width = `${(currentIndex / questions.length) * 100}%`;
    scoreValue.textContent = String(score);
    nextButton.disabled = true;
    nextButton.innerHTML = currentIndex === questions.length - 1 ? 'Ver resultado <i class="bi bi-arrow-right" aria-hidden="true"></i>' : 'Siguiente <i class="bi bi-arrow-right" aria-hidden="true"></i>';
    content.innerHTML = `<h3 class="question-title">${item.question}</h3><div class="answer-list" role="group" aria-label="Opciones de respuesta">${item.options.map((option, index) => `<button class="answer-option" type="button" data-option="${index}"><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span></button>`).join('')}</div><p class="feedback" id="answer-feedback" aria-live="polite"></p>`;
    content.querySelectorAll('.answer-option').forEach((button) => button.addEventListener('click', () => chooseAnswer(Number(button.dataset.option))));
  };

  /** Evalúa la opción elegida, bloquea el resto y explica la respuesta. */
  const chooseAnswer = (selected) => {
    if (answered) return;
    answered = true;
    const item = questions[currentIndex];
    const correct = selected === item.answer;
    if (correct) score += 10;
    content.querySelectorAll('.answer-option').forEach((button, index) => {
      button.disabled = true;
      if (index === item.answer) button.classList.add('is-correct');
      if (index === selected && !correct) button.classList.add('is-incorrect');
    });
    const feedback = content.querySelector('#answer-feedback');
    feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
    feedback.textContent = `${correct ? 'Correcto. +10 puntos. ' : 'Incorrecto. '} ${item.explanation}`;
    scoreValue.textContent = String(score);
    nextButton.disabled = false;
    playTone(correct);
  };

  /** Elige la insignia correspondiente al porcentaje de aciertos. */
  const getBadge = (percentage) => {
    if (percentage === 100) return { icon: '🏆', name: 'Data Master' };
    if (percentage >= 80) return { icon: '🥇', name: 'Experto en BI' };
    if (percentage >= 50) return { icon: '🥈', name: 'Analista Junior' };
    return { icon: '🥉', name: 'Aprendiz de Datos' };
  };

  /** Presenta el resumen final y el tiempo transcurrido. */
  const showResult = () => {
    const correctCount = score / 10;
    const percentage = Math.round((correctCount / questions.length) * 100);
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const badge = getBadge(percentage);
    panel.hidden = true;
    result.hidden = false;
    progress.setAttribute('aria-valuenow', String(questions.length));
    progressFill.style.width = '100%';
    result.innerHTML = `<div class="result-badge" aria-hidden="true">${badge.icon}</div><p class="eyebrow eyebrow-dark">RETO COMPLETADO</p><h3>${badge.name}</h3><p class="result-score">${score} <span style="font-size:16px">/ ${questions.length * 10} PTS</span></p><p class="result-detail">${percentage}% de respuestas correctas</p><div class="result-stats"><div><strong>${correctCount}/${questions.length}</strong><span>ACIERTOS</span></div><div><strong>${minutes}:${String(seconds).padStart(2, '0')}</strong><span>TIEMPO</span></div></div><button class="button button-lime" id="retry-button" type="button">Reintentar <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i></button>`;
    result.querySelector('#retry-button').addEventListener('click', restart);
  };

  /** Reinicia todas las variables y comienza un nuevo intento. */
  const restart = () => {
    currentIndex = 0;
    score = 0;
    startedAt = Date.now();
    panel.hidden = false;
    result.hidden = true;
    renderQuestion();
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  nextButton.addEventListener('click', () => {
    if (!answered) return;
    if (currentIndex === questions.length - 1) return showResult();
    currentIndex += 1;
    renderQuestion();
  });

  restart();
})();
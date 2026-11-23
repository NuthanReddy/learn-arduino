import './style.css';
import { lessons, components, simulate } from './lessons.js';
import { createLab } from './scene.js';

const icons = {
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><path d="M10 10h4v4h-4z"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zm0 0v14"/>',
  box: '<path d="m12 3 9 5v9l-9 5-9-5V8zm0 9v10M3 8l9 4 9-4M7 5l10 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 7M4 4v7h7"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.chip}</svg>`;
const state = { running: false, interval: 700, pressed: false, knob: 50, angle: 90, light: 65, threshold: 400 };
let lesson = lessons[0];
let completed = new Set();
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem('learn-lab-progress') || '[]');
  if (Array.isArray(saved)) completed = new Set(saved.filter(id => lessons.some(item => item.id === id)));
} catch (error) {
  storageAvailable = false;
  console.warn('Learning progress could not be restored.', error);
}
let started = 0;
let tried = false;
let quizPassed = false;
let activeTab = 'guide';
let selectedPart = 'board';
let lab;
let lastMonitor = 0;
let flowEnabled = false;
let copiedTimer;

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#lesson-title">Skip to lesson</a>
  <aside class="sidebar">
    <a class="brand" href="#board" aria-label="Learn Arduino home"><span class="brand-mark">${icon('chip')}</span><span>learn<span class="brand-light">arduino</span><small>A LITTLE ELECTRONICS LAB</small></span></a>
    <div class="path-label">YOUR LEARNING PATH <span>01 — 06</span></div>
    <nav aria-label="Lessons" id="lesson-nav"></nav>
    <div class="sidebar-bottom">
      <div class="progress-top"><span>Your progress</span><strong id="progress-count">0 / 6</strong></div>
      <progress id="progress" max="6" value="0" aria-label="Completed lessons"></progress>
      <p id="progress-note">Small steps. Real possibilities.</p>
      <div class="sidebar-note">${icon('bolt')}<span>No kit? No problem.<br><strong>Your browser is your workbench.</strong></span></div>
      <a class="repo-link" href="https://github.com/NuthanReddy/learn-arduino" target="_blank" rel="noreferrer">${icon('code')} Explore the source <span>↗</span></a>
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar"><div><span class="eyebrow">LEARN BY MAKING</span><span class="topbar-divider">/</span><span id="breadcrumb">Your first circuit</span></div><span class="beginner-badge"><span></span> Beginner friendly</span></header>
    <main>
      <div class="lesson-heading"><div><div class="lesson-meta"><span id="lesson-category"></span><span class="meta-dot">·</span><span id="lesson-duration"></span></div><h1 id="lesson-title" tabindex="-1"></h1><p id="lesson-subtitle"></p></div><span class="lesson-counter" id="lesson-counter"></span></div>
      <div class="lab-layout">
        <section class="scene-card" aria-label="Circuit workbench">
          <div class="scene-header"><span class="scene-tag">${icon('box')} INTERACTIVE WORKBENCH</span><span class="power-status" id="power-status"><span></span> Power off</span></div>
          <div id="scene"></div>
          <div id="scene-error" role="alert" hidden></div>
          <div class="component-popover" id="component-popover"><span class="eyebrow">EXPLORE A COMPONENT</span><strong id="component-name"></strong><p id="component-description"></p></div>
          <div class="scene-footer"><span class="gesture-hint">Drag to orbit · Scroll to zoom</span><div class="view-tools" role="group" aria-label="3D view controls"><button id="rotate-left" aria-label="Rotate view left">↶</button><button id="rotate-right" aria-label="Rotate view right">↷</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="reset-view" aria-label="Reset view">${icon('reset')}</button></div></div>
          <div class="scene-caption"><span class="caption-dot"></span><span>Original, simplified geometry · Not to scale</span><button id="flow-toggle" aria-pressed="false">${icon('bolt')} Current flow</button></div>
        </section>
        <section class="lesson-card" aria-label="Lesson details">
          <div class="tabs" role="tablist" aria-label="Lesson information"><button role="tab" id="tab-guide" aria-controls="detail-panel" aria-selected="true" tabindex="0" data-tab="guide">The idea</button><button role="tab" id="tab-wiring" aria-controls="detail-panel" aria-selected="false" tabindex="-1" data-tab="wiring">Connections</button><button role="tab" id="tab-parts" aria-controls="detail-panel" aria-selected="false" tabindex="-1" data-tab="parts">Parts</button></div>
          <div id="detail-panel" role="tabpanel" aria-labelledby="tab-guide"></div>
          <div class="experiment"><div class="section-label">${icon('play')} TRY IT OUT</div><div id="experiment-controls"></div><button id="run" class="primary-button">${icon('play')} Power the board</button><p class="simulation-note">Guided simulation, not a code compiler.</p></div>
        </section>
      </div>
      <div class="bottom-layout">
        <section class="code-card" aria-label="Arduino example sketch"><div class="card-header"><div>${icon('code')}<h2>The sketch</h2><span class="file-tag">example.ino</span></div><button id="copy-code" aria-label="Copy sketch">${icon('copy')} Copy</button></div><pre tabindex="0" aria-label="Example Arduino code"><code id="sketch"></code></pre><div class="code-footnote">Controls update this example. Upload it using the Arduino IDE and the listed wiring.</div></section>
        <div class="right-bottom">
          <section class="monitor-card" aria-label="Live simulation monitor"><div class="card-header"><div><span class="monitor-dot"></span><h2>Live monitor</h2></div><span id="monitor-state">IDLE</span></div><div class="monitor-values" id="monitor-values"></div><p id="monitor-log" role="status">Ready when you are. Start the experiment above.</p></section>
          <section class="challenge-card" aria-label="Knowledge check"><span class="eyebrow">ONE QUICK CHECK</span><h2 id="question"></h2><div id="answers"></div><p id="quiz-feedback" role="status"></p><button id="complete" class="next-button" disabled>Complete lesson ${icon('arrow')}</button></section>
        </div>
      </div>
      <footer><span>Made for curious minds, one circuit at a time.</span><span>Independent learning project · Not affiliated with Arduino</span></footer>
    </main>
    <div id="toast" role="status"></div>
  </div>`;

const $ = selector => document.querySelector(selector);
function renderNavigation() {
  $('#lesson-nav').innerHTML = lessons.map((item, index) => `<a href="#${item.id}" class="lesson-link ${item.id === lesson.id ? 'active' : ''}" ${item.id === lesson.id ? 'aria-current="step"' : ''}><span class="lesson-number ${completed.has(item.id) ? 'done' : ''}">${completed.has(item.id) ? icon('check') : String(index + 1).padStart(2, '0')}</span><span><strong>${item.title}</strong><small>${item.category.toLowerCase()} · ${item.duration}</small></span>${item.id === lesson.id ? '<span class="active-dot"></span>' : ''}</a>`).join('');
  $('#progress-count').textContent = `${completed.size} / ${lessons.length}`;
  $('#progress').value = completed.size;
  $('#progress-note').textContent = !storageAvailable ? 'Progress is kept for this visit only.' : completed.size === 6 ? 'Every lesson complete. Keep making!' : 'Small steps. Real possibilities.';
  const nav = $('#lesson-nav');
  const active = nav.querySelector('.active');
  if (nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = active.offsetLeft - nav.offsetLeft;
  }
}
function selectPart(id) {
  if (!components[id]) return;
  selectedPart = id;
  $('#component-name').textContent = components[id].name;
  $('#component-description').textContent = components[id].description;
  document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part === id)));
}
function renderDetails() {
  const panel = $('#detail-panel');
  if (activeTab === 'guide') {
    panel.innerHTML = `<h2>A little understanding goes a long way.</h2><p>${lesson.description}</p><div class="concepts">${lesson.concepts.map(([name, desc]) => `<div><strong>${name}</strong><p>${desc}</p></div>`).join('')}</div>`;
  } else if (activeTab === 'wiring') {
    panel.innerHTML = `<h2>Make the right connections.</h2><p>${lesson.wiring}</p><div class="wiring-note">${icon('bolt')}<p><strong>Before you build</strong>Disconnect power while wiring. Never short 5V to GND. This virtual model illustrates connections; use the written pin instructions for real hardware.</p></div>`;
  } else {
    panel.innerHTML = `<h2>Get to know your ingredients.</h2><p>Select a part to explore what it does.</p><div class="parts-list">${lesson.parts.map(id => `<button data-part="${id}" aria-pressed="${id === selectedPart}">${icon(id === 'board' ? 'chip' : 'box')} ${components[id].short} ${icon('arrow')}</button>`).join('')}</div>`;
    panel.querySelectorAll('[data-part]').forEach(button => button.addEventListener('click', () => selectPart(button.dataset.part)));
  }
}
const range = (id, label, min, max, value, unit, step = 1) => `<label class="range-label" for="${id}"><span>${label}</span><output id="${id}-value" for="${id}">${value}${unit}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><div class="range-extremes"><span>${min}${unit}</span><span>${max}${unit}</span></div>`;
function renderControls() {
  let html;
  if (lesson.id === 'board') html = `<p>${lesson.goal}</p>`;
  if (lesson.id === 'blink') html = range('interval', 'Blink interval', 100, 2000, state.interval, ' ms', 100);
  if (lesson.id === 'button') html = `<p>INPUT_PULLUP: pressed = LOW.</p><button class="physical-button" id="press-button" aria-pressed="${state.pressed}">${icon('bolt')} <span>${state.pressed ? 'Release button' : 'Press button'}</span></button>`;
  if (lesson.id === 'dimmer') html = range('knob', 'Knob position', 0, 100, state.knob, '%');
  if (lesson.id === 'servo') html = range('angle', 'Target angle', 0, 180, state.angle, '°');
  if (lesson.id === 'light') html = range('light', 'Ambient light', 0, 100, state.light, '%') + range('threshold', 'Night-light threshold', 0, 1023, state.threshold, '');
  $('#experiment-controls').innerHTML = (lesson.id === 'board' ? '' : `<p>${lesson.goal}</p>`) + html;
  $('#experiment-controls').querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
    state[input.id] = Number(input.value);
    const unit = { interval: ' ms', knob: '%', angle: '°', light: '%', threshold: '' }[input.id];
    $(`#${input.id}-value`).textContent = `${input.value}${unit}`;
    renderCode();
    updateMonitor(performance.now(), true);
  }));
  $('#press-button')?.addEventListener('click', () => {
    state.pressed = !state.pressed;
    $('#press-button').setAttribute('aria-pressed', String(state.pressed));
    $('#press-button span').textContent = state.pressed ? 'Release button' : 'Press button';
    updateMonitor(performance.now(), true);
  });
}
function renderCode() { $('#sketch').textContent = lesson.code(state); }
function renderQuiz() {
  $('#question').textContent = lesson.question;
  $('#answers').innerHTML = lesson.answers.map((answer, index) => `<button class="answer" data-answer="${index}"><span>${String.fromCharCode(65 + index)}</span>${answer}</button>`).join('');
  $('#quiz-feedback').textContent = '';
  $('#answers').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    const correct = Number(button.dataset.answer) === lesson.correct;
    quizPassed = correct;
    document.querySelectorAll('.answer').forEach(item => item.classList.remove('correct', 'incorrect'));
    button.classList.add(correct ? 'correct' : 'incorrect');
    $('#quiz-feedback').textContent = correct ? lesson.explanation : 'Not quite. Look back at the idea or connections, then try again.';
    $('#quiz-feedback').className = correct ? 'success-text' : 'error-text';
    updateCompletion();
  }));
}
function updateCompletion() {
  $('#complete').disabled = !(tried && quizPassed);
  $('#complete').innerHTML = `${completed.has(lesson.id) ? 'Continue' : 'Complete lesson'} ${icon('arrow')}`;
  $('#complete').title = !tried ? 'Run the experiment first, then answer the check.' : !quizPassed ? 'Answer the check correctly to continue.' : '';
}
function setRunning(running) {
  state.running = running;
  if (running) {
    started = performance.now();
    tried = true;
  }
  $('#run').innerHTML = `${icon(running ? 'pause' : 'play')} ${running ? 'Stop experiment' : lesson.id === 'board' ? 'Power the board' : 'Run experiment'}`;
  $('#run').classList.toggle('running', running);
  $('#power-status').innerHTML = `<span></span> ${running ? 'Power on' : 'Power off'}`;
  $('#power-status').classList.toggle('on', running);
  $('#monitor-state').textContent = running ? 'RUNNING' : 'IDLE';
  $('.monitor-dot').classList.toggle('on', running);
  updateCompletion();
  updateMonitor(performance.now(), true);
}
function updateMonitor(now, force = false) {
  const output = simulate(lesson.id, state, now - started);
  lab?.update(output, state);
  if (!force && now - lastMonitor < 120) return;
  lastMonitor = now;
  let values = [['SUPPLY', state.running ? '5.0 V' : '0.0 V'], ['LED', output.led > 0 ? 'ON' : 'OFF']];
  if (lesson.id === 'button') values = [['D2 INPUT', state.running ? output.digital : '—'], ['D9 OUTPUT', output.led ? 'HIGH' : 'LOW']];
  if (lesson.id === 'dimmer') values = [['A0 READING', state.running ? output.analog : '—'], ['D9 PWM', output.pwm]];
  if (lesson.id === 'servo') values = [['TARGET', `${state.angle}°`], ['SHAFT', `${output.angle}°`]];
  if (lesson.id === 'light') values = [['A0 LIGHT', state.running ? output.light : '—'], ['NIGHT LIGHT', output.led ? 'ON' : 'OFF']];
  if (lesson.id === 'blink') values = [['D9 OUTPUT', output.led ? 'HIGH' : 'LOW'], ['CYCLE', `${state.interval * 2} ms`]];
  $('#monitor-values').innerHTML = values.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
  let log = 'Experiment stopped. Outputs are off.';
  if (state.running) {
    const logs = {
      board: 'Board powered. The onboard indicator is lit.',
      blink: `D9 ${output.led ? 'HIGH → light on' : 'LOW → light off'}. Next change after ${state.interval} ms.`,
      button: `Button ${state.pressed ? 'closed' : 'open'} → D2 ${output.digital} → LED ${output.led ? 'on' : 'off'}.`,
      dimmer: `A0 ${output.analog} → PWM ${output.pwm}/255 → ${Math.round(output.led * 100)}% brightness.`,
      servo: `Servo signal on D9. Requested position: ${state.angle}°.`,
      light: `${output.light} ${output.light < state.threshold ? '<' : '≥'} ${state.threshold} → night light ${output.led ? 'on' : 'off'}.`,
    };
    log = logs[lesson.id];
  }
  if ($('#monitor-log').textContent !== log) $('#monitor-log').textContent = log;
}
function navigate() {
  const id = location.hash.slice(1);
  lesson = lessons.find(item => item.id === id) || lessons[0];
  if (id && id !== lesson.id) history.replaceState(null, '', `#${lesson.id}`);
  state.running = false;
  state.pressed = false;
  tried = false;
  quizPassed = false;
  $('#lesson-title').textContent = lesson.title;
  $('#lesson-subtitle').textContent = lesson.subtitle;
  $('#lesson-category').textContent = lesson.category;
  $('#lesson-duration').textContent = `${lesson.duration} experiment`;
  $('#breadcrumb').textContent = lesson.title;
  $('#lesson-counter').textContent = `${String(lessons.indexOf(lesson) + 1).padStart(2, '0')} / 06`;
  renderNavigation();
  renderDetails();
  renderControls();
  renderCode();
  renderQuiz();
  selectPart('board');
  lab?.setLesson(lesson.id);
  setRunning(false);
}
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
$('#run').addEventListener('click', () => setRunning(!state.running));
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('#lesson-title').focus();
});
$('#complete').addEventListener('click', () => {
  if (!(tried && quizPassed)) return;
  completed.add(lesson.id);
  try {
    localStorage.setItem('learn-lab-progress', JSON.stringify([...completed]));
  } catch (error) {
    storageAvailable = false;
    console.warn('Learning progress could not be saved.', error);
    toast('Lesson complete. Your browser could not save progress; it will last for this visit only.');
  }
  renderNavigation();
  const next = lessons[lessons.indexOf(lesson) + 1];
  if (next) {
    location.hash = next.id;
    requestAnimationFrame(() => $('#lesson-title').focus());
  } else {
    toast('All six experiments complete. You are ready to build something of your own!');
    $('#complete').innerHTML = `Path complete ${icon('check')}`;
    $('#complete').disabled = true;
  }
});
$('#copy-code').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#sketch').textContent);
    toast('Sketch copied. Paste it into the Arduino IDE.');
  } catch (error) {
    console.warn('Clipboard copy failed.', error);
    toast('Could not access the clipboard. Select the sketch and copy it manually.');
  }
});
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    $('#detail-panel').setAttribute('aria-labelledby', button.id);
    renderDetails();
  });
  button.addEventListener('keydown', event => {
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const index = tabs.indexOf(button);
    let target;
    if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') target = tabs[0];
    if (event.key === 'End') target = tabs.at(-1);
    if (target) { event.preventDefault(); target.click(); target.focus(); }
  });
});
$('#reset-view').addEventListener('click', () => lab?.reset());
$('#rotate-left').addEventListener('click', () => lab?.rotate(-1));
$('#rotate-right').addEventListener('click', () => lab?.rotate(1));
$('#zoom-in').addEventListener('click', () => lab?.zoom(0.85));
$('#zoom-out').addEventListener('click', () => lab?.zoom(1.15));
$('#flow-toggle').addEventListener('click', () => {
  flowEnabled = !flowEnabled;
  $('#flow-toggle').setAttribute('aria-pressed', String(flowEnabled));
  lab?.flow(flowEnabled);
});
const showLabError = message => {
  $('#scene-error').hidden = false;
  $('#scene-error').textContent = message;
};
$('#scene').addEventListener('lab-error', event => showLabError(event.detail));
try {
  lab = createLab($('#scene'), selectPart);
} catch (error) {
  console.error('Unable to initialize the 3D workbench.', error);
  showLabError('3D graphics are unavailable in this browser. Enable WebGL or try a current browser. You can still use every lesson, control, and live monitor below.');
  document.querySelectorAll('.view-tools button, #flow-toggle').forEach(button => { button.disabled = true; });
}
window.addEventListener('hashchange', navigate);
navigate();
function tick(now) {
  updateMonitor(now);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

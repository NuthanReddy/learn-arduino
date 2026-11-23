import './style.css';
import './home-automation.css';
import { lessons, components, simulate } from './lessons.js';
import { createLab } from './scene.js';
import { connections, pinGroups, diagramMarkup, connectionSignals } from './circuits.js';
import { mountHomeAutomation } from './home-automation.js';

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
const state = {
  running: false, interval: 700, pressed: false, knob: 50, angle: 90, servoPosition: 90, light: 65, threshold: 400,
  red: 180, green: 80, blue: 30, distance: 80, noEcho: false, frequency: 440, note: -1, motorSpeed: 50,
  temperature: 25, steps: 1024, stepPosition: 0, moisture: 50, moistureThreshold: 30, force: 25,
  stopDistance: 20, cautionDistance: 60,
};
let lesson = lessons[0];
let completed = new Set();
let storageAvailable = true;
let lastLesson = 'board';
try {
  const saved = JSON.parse(localStorage.getItem('learn-lab-progress') || '[]');
  if (!Array.isArray(saved)) throw new Error('Saved lesson progress must be a list.');
  if (Array.isArray(saved)) completed = new Set(saved.filter(id => lessons.some(item => item.id === id)));
  const savedLesson = localStorage.getItem('learn-lab-last-lesson');
  if (lessons.some(item => item.id === savedLesson)) lastLesson = savedLesson;
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
let lastFrame = performance.now();
let lastValues = '';
let soundEnabled = false;
let audioContext;
let oscillator;
let gain;
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let trace = [];
let lastTrace = '';
let lastTraceTime = 0;
let diagramEnabled = false;
let compactDiagram = innerWidth <= 700;
let focusRequested = false;
let homeActive = false;

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#lesson-title">Skip to lesson</a>
  <aside class="sidebar">
    <a class="brand" href="#board" aria-label="Learn Arduino home"><span class="brand-mark">${icon('chip')}</span><span>learn<span class="brand-light">arduino</span><small>A LITTLE ELECTRONICS LAB</small></span></a>
    <a class="collection-link" href="#home-automation" id="home-collection-link">${icon('box')}<span><strong>Home automation</strong><small>Explore the component library</small></span>${icon('arrow')}</a>
    <div class="path-label">YOUR LEARNING PATH <span>01 — ${lessons.length}</span></div>
    <nav aria-label="Lessons" id="lesson-nav"></nav>
    <div class="sidebar-bottom">
      <div class="progress-top"><span>Your progress</span><strong id="progress-count">0 / ${lessons.length}</strong></div>
      <progress id="progress" max="${lessons.length}" value="0" aria-label="Completed lessons"></progress>
      <p id="progress-note">Small steps. Real possibilities.</p>
      <div class="sidebar-note">${icon('bolt')}<span>No kit? No problem.<br><strong>Your browser is your workbench.</strong></span></div>
      <a class="repo-link" href="https://github.com/NuthanReddy/learn-arduino" target="_blank" rel="noreferrer">${icon('code')} Explore the source <span>↗</span></a>
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar"><div><span class="eyebrow">LEARN BY MAKING</span><span class="topbar-divider">/</span><span id="breadcrumb">Your first circuit</span></div><div class="lab-settings"><button id="focus-toggle" aria-pressed="false">Focus workbench</button><button id="sound-toggle" aria-pressed="false">Sound off</button><button id="motion-toggle" aria-pressed="${reducedMotion}">Reduced motion</button></div></header>
    <main>
      <section id="home-automation-library" aria-labelledby="automation-title" hidden></section>
      <div id="learning-content">
      <div class="lesson-heading"><div><div class="lesson-meta"><span id="lesson-category"></span><span class="meta-dot">·</span><span id="lesson-duration"></span></div><h1 id="lesson-title" tabindex="-1"></h1><p id="lesson-subtitle"></p></div><span class="lesson-counter" id="lesson-counter"></span></div>
      <nav class="lesson-pagination" aria-label="Lesson navigation"><a id="previous-lesson">Previous lesson</a><span id="lesson-position"></span><a id="next-lesson">Next lesson</a></nav>
      <div class="lab-layout">
        <section class="scene-card" aria-label="Circuit workbench">
          <div class="scene-header"><span class="scene-tag">${icon('box')} INTERACTIVE WORKBENCH</span><span class="power-status" id="power-status"><span></span> Power off</span></div>
          <div id="scene"></div>
          <div id="schematic" hidden><div id="schematic-drawing"></div><p id="schematic-live"></p><p class="diagram-note">Connection map, not a physical placement guide. Select a connection to inspect its component.</p></div>
          <div id="scene-error" role="alert" hidden></div>
          <div class="component-popover" id="component-popover"><span class="eyebrow">EXPLORE A COMPONENT</span><strong id="component-name"></strong><p id="component-description"></p></div>
          <div class="scene-footer"><span class="gesture-hint">Drag to pan · Right-drag or Q/E to rotate · Pinch/scroll to zoom · Focus view: WASD pan, 0 reset</span><div class="view-tools" role="group" aria-label="3D view controls"><button id="rotate-left" aria-label="Rotate view left">↶</button><button id="rotate-right" aria-label="Rotate view right">↷</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="reset-view" aria-label="Reset view">${icon('reset')}</button></div></div>
          <div class="scene-caption"><span class="caption-dot"></span><span>Original, simplified geometry · Not to scale</span><button id="diagram-toggle" aria-pressed="false">${icon('box')} Wiring diagram</button><button id="flow-toggle" aria-pressed="false">${icon('bolt')} Current flow</button></div>
        </section>
        <section class="lesson-card" aria-label="Lesson details">
          <div class="tabs" role="tablist" aria-label="Lesson information"><button role="tab" id="tab-guide" aria-controls="detail-panel" aria-selected="true" tabindex="0" data-tab="guide">The idea</button><button role="tab" id="tab-wiring" aria-controls="detail-panel" aria-selected="false" tabindex="-1" data-tab="wiring">Connections</button><button role="tab" id="tab-parts" aria-controls="detail-panel" aria-selected="false" tabindex="-1" data-tab="parts">Parts</button><button role="tab" id="tab-pinout" aria-controls="detail-panel" aria-selected="false" tabindex="-1" data-tab="pinout">Pinout</button><button role="tab" id="tab-specs" aria-controls="detail-panel" aria-selected="false" tabindex="-1" data-tab="specs">Specs</button></div>
          <div id="detail-panel" role="tabpanel" aria-labelledby="tab-guide"></div>
          <div class="experiment"><div class="section-label">${icon('play')} TRY IT OUT</div><div id="experiment-controls"></div><button id="run" class="primary-button">${icon('play')} Power the board</button><p class="simulation-note">Guided simulation, not a code compiler.</p></div>
        </section>
      </div>
      <div class="bottom-layout">
        <section class="code-card" aria-label="Arduino example sketch"><div class="card-header"><div>${icon('code')}<h2>The sketch</h2><span class="file-tag">example.ino</span></div><div class="sketch-tools"><button id="expand-code" aria-label="Expand sketch">Expand</button><button id="download-code" aria-label="Download Arduino sketch">Save .ino</button><button id="copy-code" aria-label="Copy sketch">${icon('copy')} Copy</button></div></div><pre tabindex="0" aria-label="Example Arduino code"><code id="sketch"></code></pre><div class="code-footnote">Controls update this example. Upload it using the Arduino IDE and the listed wiring.</div><div class="focus-run-slot"></div></section>
        <div class="right-bottom">
          <section class="monitor-card" aria-label="Live simulation monitor"><div class="card-header"><div><span class="monitor-dot"></span><h2>Live monitor</h2></div><span id="monitor-state">IDLE</span></div><div class="monitor-values" id="monitor-values"></div><p id="monitor-log" role="status">Ready when you are. Start the experiment above.</p><details class="serial-history"><summary>Serial history <span id="trace-count">0 samples</span></summary><ol id="serial-trace" aria-label="Recent simulation samples"></ol><button id="clear-trace">Clear history</button></details></section>
          <section class="challenge-card" aria-label="Knowledge check"><span class="eyebrow">ONE QUICK CHECK</span><h2 id="question"></h2><div id="answers"></div><p id="quiz-feedback" role="status"></p><p id="completion-hint"></p><button id="complete" class="next-button" disabled aria-describedby="completion-hint">Complete lesson ${icon('arrow')}</button></section>
        </div>
      </div>
      </div>
      <footer><span>Made for curious minds, one circuit at a time.</span><span>Independent learning project · Not affiliated with Arduino</span></footer>
    </main>
    <div id="toast" role="status"></div>
    <dialog id="sketch-dialog" aria-labelledby="sketch-dialog-title"><div class="card-header"><h2 id="sketch-dialog-title">Arduino example sketch</h2><button id="close-sketch">Close</button></div><pre tabindex="0"><code id="expanded-sketch"></code></pre></dialog>
  </div>`;

const $ = selector => document.querySelector(selector);
const homeAutomation = mountHomeAutomation($('#home-automation-library'));
function renderNavigation() {
  $('#lesson-nav').innerHTML = lessons.map((item, index) => {
    const active = !homeActive && item.id === lesson.id;
    return `<a href="#${item.id}" class="lesson-link ${active ? 'active' : ''}" ${active ? 'aria-current="step"' : ''}><span class="lesson-number ${completed.has(item.id) ? 'done' : ''}">${completed.has(item.id) ? icon('check') : String(index + 1).padStart(2, '0')}</span><span><strong>${item.title}</strong><small>${item.category.toLowerCase()} · ${item.duration}</small></span>${active ? '<span class="active-dot"></span>' : ''}</a>`;
  }).join('');
  $('#progress-count').textContent = `${completed.size} / ${lessons.length}`;
  $('#progress').value = completed.size;
  $('#progress-note').textContent = !storageAvailable ? 'Progress is kept for this visit only.' : completed.size === lessons.length ? 'Every lesson complete. Keep making!' : 'Small steps. Real possibilities.';
  const nav = $('#lesson-nav');
  const active = nav.querySelector('.active');
  if (active && nav.scrollWidth > nav.clientWidth) {
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
  } else if (activeTab === 'parts') {
    panel.innerHTML = `<h2>Get to know your ingredients.</h2><p>Select a part to explore what it does.</p><div class="parts-list">${lesson.parts.map(id => `<button data-part="${id}" aria-pressed="${id === selectedPart}">${icon(id === 'board' ? 'chip' : 'box')} ${components[id].short} ${icon('arrow')}</button>`).join('')}</div>`;
    panel.querySelectorAll('[data-part]').forEach(button => button.addEventListener('click', () => selectPart(button.dataset.part)));
  } else if (activeTab === 'pinout') {
    panel.innerHTML = `<h2>Know the Uno’s connections.</h2><p>Used in this lesson:</p><ul class="lesson-pins">${connections[lesson.id].map(([pin, target]) => `<li><strong>${pin}</strong><span>${target}</span></li>`).join('')}</ul><details class="pin-reference"><summary>Full Uno R3 pin reference</summary>${pinGroups.map(([pins, role, explanation]) => `<div><strong>${pins} · ${role}</strong><p>${explanation}</p></div>`).join('')}</details>`;
  } else {
    panel.innerHTML = `<h2>Uno R3 at a glance.</h2><dl class="specifications"><div><dt>Processor</dt><dd>ATmega328P · 16 MHz</dd></div><div><dt>Logic voltage</dt><dd>5 V</dd></div><div><dt>Digital I/O</dt><dd>14 pins · 6 PWM channels</dd></div><div><dt>Analog input</dt><dd>6 channels · 10-bit ADC</dd></div><div><dt>Program / working memory</dt><dd>32 KB flash / 2 KB SRAM</dd></div><div><dt>I/O design current</dt><dd>20 mA per pin; also respect combined port and chip limits</dd></div></dl><p>Use the documentation for your exact board and component variants. This lab does not model current limits or component damage.</p>`;
  }
}
function renderDiagram() {
  $('#schematic-drawing').innerHTML = diagramMarkup(lesson.id, compactDiagram);
  $('#schematic-drawing').querySelectorAll('[data-part]').forEach(connection => {
    connection.addEventListener('click', () => selectPart(connection.dataset.part));
    connection.addEventListener('keydown', event => {
      if (['Enter', ' '].includes(event.key)) { event.preventDefault(); selectPart(connection.dataset.part); }
    });
  });
  updateDiagramSignals(simulate(lesson.id, state, performance.now() - started));
}
function updateDiagramSignals(output) {
  const signals = connectionSignals(lesson.id, output, state);
  $('#schematic-drawing').querySelectorAll('[data-signal]').forEach(label => {
    const value = signals[Number(label.dataset.signal)];
    if (label.textContent !== value) label.textContent = value;
  });
}
function applyWorkbenchLayout() {
  const focused = focusRequested && innerWidth >= 1100;
  document.querySelector('.workspace').classList.toggle('focus-layout', focused);
  $('#focus-toggle').setAttribute('aria-pressed', String(focused));
  $('#focus-toggle').textContent = focused ? 'Guided layout' : 'Focus workbench';
  const sketch = $('.code-card');
  const run = $('#run');
  if (focused && sketch.parentElement !== $('.lab-layout')) {
    $('.lab-layout').insertBefore(sketch, $('.lesson-card'));
    $('.focus-run-slot').append(run);
  } else if (!focused && sketch.parentElement !== $('.bottom-layout')) {
    $('.bottom-layout').prepend(sketch);
    $('.experiment').insertBefore(run, $('.simulation-note'));
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
  if (lesson.controls) html = lesson.controls.map(([id, label, min, max, unit, step]) => range(id, label, min, max, state[id], unit, step)).join('');
  if (lesson.id === 'piano') html = `<div class="piano-controls" role="group" aria-label="Piano notes">${['C4', 'D4', 'E4', 'F4'].map((note, index) => `<button data-note="${index}" aria-pressed="${state.note === index}">${note}<small>${[262, 294, 330, 349][index]} Hz</small></button>`).join('')}</div>`;
  if (['distance', 'parking'].includes(lesson.id)) html += `<label class="check-control"><input id="noEcho" type="checkbox" ${state.noEcho ? 'checked' : ''}> Simulate missing echo</label>`;
  $('#experiment-controls').innerHTML = (lesson.id === 'board' ? '' : `<p>${lesson.goal}</p>`) + html;
  $('#experiment-controls').querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
    state[input.id] = input.type === 'checkbox' ? input.checked : Number(input.value);
    if (lesson.id === 'parking' && state.stopDistance >= state.cautionDistance) {
      if (input.id === 'stopDistance') state.cautionDistance = state.stopDistance + 1;
      else state.stopDistance = state.cautionDistance - 1;
      toast('Thresholds adjusted to keep stop distance below caution distance.');
      for (const id of ['stopDistance', 'cautionDistance']) $(`#${id}`).value = state[id];
    }
    $('#experiment-controls').querySelectorAll('input[type="range"]').forEach(slider => {
      const units = { interval: ' ms', knob: '%', angle: '°', light: '%', threshold: '' };
      const unit = units[slider.id] ?? lesson.controls?.find(control => control[0] === slider.id)?.[4] ?? '';
      $(`#${slider.id}-value`).textContent = `${state[slider.id]}${unit}`;
    });
    renderCode();
    updateMonitor(performance.now(), true);
  }));
  $('#experiment-controls').querySelectorAll('[data-note]').forEach(button => button.addEventListener('click', () => {
    const note = Number(button.dataset.note);
    state.note = state.note === note ? -1 : note;
    $('#experiment-controls').querySelectorAll('[data-note]').forEach(key => key.setAttribute('aria-pressed', String(Number(key.dataset.note) === state.note)));
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
  const done = completed.has(lesson.id);
  $('#complete').disabled = !done && !(tried && quizPassed);
  $('#complete').innerHTML = `${completed.has(lesson.id) ? 'Continue' : 'Complete lesson'} ${icon('arrow')}`;
  $('#completion-hint').textContent = done ? 'Already completed. Explore again or continue without retaking the check.' : !tried ? 'Run the experiment and answer the check to complete this lesson.' : !quizPassed ? 'Experiment tried. Answer the check correctly to continue.' : 'Ready to complete. Your progress will be saved in this browser.';
}
function setRunning(running) {
  state.running = running;
  if (running) {
    started = performance.now();
    tried = true;
    lastTrace = '';
  }
  $('#run').innerHTML = `${icon(running ? 'pause' : 'play')} ${running ? 'Stop experiment' : lesson.id === 'board' ? 'Power the board' : 'Run experiment'}`;
  $('#run').classList.toggle('running', running);
  $('#power-status').innerHTML = `<span></span> ${running ? 'Power on' : 'Power off'}`;
  $('#power-status').classList.toggle('on', running);
  $('#monitor-state').textContent = running ? 'RUNNING' : 'IDLE';
  $('.monitor-dot').classList.toggle('on', running);
  updateCompletion();
  updateMonitor(performance.now(), true);
  if (!running) updateSound(0);
}
function updateSound(frequency) {
  if (!gain || !audioContext) return;
  const audible = soundEnabled && state.running && frequency > 0 && document.visibilityState === 'visible';
  if (frequency > 0) oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.01);
  gain.gain.setTargetAtTime(audible ? 0.025 : 0, audioContext.currentTime, 0.01);
}
function clearTrace() {
  trace = [];
  lastTrace = '';
  $('#serial-trace').replaceChildren();
  $('#trace-count').textContent = '0 samples';
}
function addTrace(now, log) {
  if (!state.running || (log === lastTrace && now - lastTraceTime < 1000)) return;
  lastTrace = log;
  lastTraceTime = now;
  trace.push({ time: ((now - started) / 1000).toFixed(1), log });
  if (trace.length > 16) trace.shift();
  $('#serial-trace').replaceChildren(...trace.map(sample => {
    const item = document.createElement('li');
    item.textContent = `${sample.time}s · ${sample.log}`;
    return item;
  }));
  $('#trace-count').textContent = `${trace.length} samples`;
}
function updateMonitor(now, force = false) {
  const output = simulate(lesson.id, state, now - started);
  lab?.update(output, state);
  updateSound(output.frequency);
  if (!force && now - lastMonitor < 120) return;
  lastMonitor = now;
  let values = [['SUPPLY', state.running ? '5.0 V' : '0.0 V'], ['LED', output.led > 0 ? 'ON' : 'OFF']];
  if (lesson.id === 'button') values = [['D2 INPUT', state.running ? output.digital : '—'], ['D9 OUTPUT', output.led ? 'HIGH' : 'LOW']];
  if (lesson.id === 'dimmer') values = [['A0 READING', state.running ? output.analog : '—'], ['D9 PWM', output.pwm]];
  if (lesson.id === 'servo') values = [['TARGET', `${state.angle}°`], ['SHAFT', `${Math.round(output.angle)}°`]];
  if (lesson.id === 'light') values = [['A0 LIGHT', state.running ? output.light : '—'], ['NIGHT LIGHT', output.led ? 'ON' : 'OFF']];
  if (lesson.id === 'blink') values = [['D9 OUTPUT', output.led ? 'HIGH' : 'LOW'], ['CYCLE', `${state.interval * 2} ms`]];
  if (lesson.id === 'rgb') values = [['RGB PWM', output.rgb.join(' / ')], ['COLOR', state.running ? `#${output.rgb.map(value => value.toString(16).padStart(2, '0')).join('')}` : 'OFF']];
  if (['distance', 'parking'].includes(lesson.id)) values = [['DISTANCE', state.running && !state.noEcho ? `${output.measuredDistance.toFixed(1)} cm` : '—'], [lesson.id === 'parking' ? 'ZONE' : 'ECHO', state.running && !state.noEcho ? lesson.id === 'parking' ? output.zone : `${output.echo} µs` : 'NO SIGNAL']];
  if (['buzzer', 'piano'].includes(lesson.id)) values = [['FREQUENCY', `${output.frequency || 0} Hz`], ['AUDIO', soundEnabled && output.frequency ? 'ON' : 'MUTED']];
  if (lesson.id === 'motor') values = [['D9 PWM', output.motorPwm], ['DRIVE', state.running ? `${state.motorSpeed}%` : 'OFF']];
  if (lesson.id === 'temperature') values = [['ADC / VOLTS', state.running ? `${output.temperatureReading} / ${output.temperatureVoltage.toFixed(2)} V` : '—'], ['ESTIMATE', state.running ? `${output.celsius.toFixed(1)}°C` : '—']];
  if (lesson.id === 'stepper') values = [['POSITION', `${Math.round(output.steps)} steps`], ['ANGLE', `${(output.steps * 360 / 2048).toFixed(1)}°`]];
  if (lesson.id === 'soil') values = [['ADC / MOISTURE', state.running ? `${output.soilReading} / ${output.moisture}%` : '—'], ['REMINDER', output.led ? 'WATER' : 'OFF']];
  if (lesson.id === 'force') values = [['A0 READING', state.running ? output.forceReading : '—'], ['D9 PWM', output.pwm]];
  const renderedValues = values.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
  if (renderedValues !== lastValues) {
    $('#monitor-values').innerHTML = renderedValues;
    lastValues = renderedValues;
  }
  let log = 'Experiment stopped. Outputs are off.';
  if (state.running) {
    const logs = {
      board: 'Board powered. The onboard indicator is lit.',
      blink: `D9 ${output.led ? 'HIGH → light on' : 'LOW → light off'}. Next change after ${state.interval} ms.`,
      button: `Button ${state.pressed ? 'closed' : 'open'} → D2 ${output.digital} → LED ${output.led ? 'on' : 'off'}.`,
      dimmer: `A0 ${output.analog} → PWM ${output.pwm}/255 → ${Math.round(output.led * 100)}% brightness.`,
      servo: `Servo signal on D9. Requested position: ${state.angle}°.`,
      light: `${output.light} ${output.light < state.threshold ? '<' : '≥'} ${state.threshold} → night light ${output.led ? 'on' : 'off'}.`,
      rgb: `Red ${state.red}, green ${state.green}, blue ${state.blue} → mixed LED color.`,
      distance: state.noEcho ? 'Measurement failed: no echo. Distance unavailable.' : `Echo ${output.echo} µs → ${output.measuredDistance.toFixed(1)} cm.`,
      buzzer: `${output.frequency ? `Tone ${output.frequency} Hz` : 'Tone paused'} · ${soundEnabled ? 'sound enabled' : 'audio muted'}.`,
      piano: output.frequency ? `${['C4', 'D4', 'E4', 'F4'][state.note]} → ${output.frequency} Hz.` : 'No key selected → noTone().',
      motor: `D9 PWM ${output.motorPwm}/255 → ${state.motorSpeed}% relative motor drive.`,
      temperature: `A0 ${output.temperatureReading} → ${output.celsius.toFixed(1)}°C (input ${state.temperature}°C).`,
      stepper: `Command ${state.steps} steps → position ${Math.round(output.steps)} steps. Open-loop model.`,
      soil: `A0 ${output.soilReading} → ${output.moisture}% moisture → reminder ${output.led ? 'on' : 'off'}.`,
      force: `Press ${state.force}% → A0 ${output.forceReading} → PWM ${output.pwm}/255.`,
      parking: state.noEcho ? 'Measurement failed: no echo. Indicators and warning tone off.' : `${output.measuredDistance.toFixed(1)} cm → ${output.zone} (stop ≤ ${state.stopDistance}, caution ≤ ${state.cautionDistance} cm).`,
    };
    log = logs[lesson.id];
  }
  if ($('#monitor-log').textContent !== log) $('#monitor-log').textContent = log;
  if ($('#schematic-live').textContent !== log) $('#schematic-live').textContent = log;
  updateDiagramSignals(output);
  $('#schematic').classList.toggle('powered', state.running);
  addTrace(now, log);
}
function navigate() {
  const id = location.hash.slice(1) || lastLesson;
  const [collection, item] = id.split('/');
  homeActive = collection === 'home-automation';
  $('#home-automation-library').hidden = !homeActive;
  $('#learning-content').hidden = homeActive;
  $('#focus-toggle').hidden = homeActive;
  if (homeActive) {
    setRunning(false);
    $('#breadcrumb').textContent = 'Home automation library';
    $('#home-collection-link').setAttribute('aria-current', 'page');
    renderNavigation();
    homeAutomation.show(item);
    if (!item) $('#automation-title').focus();
    return;
  }
  homeAutomation.stop();
  $('#home-collection-link').removeAttribute('aria-current');
  lesson = lessons.find(item => item.id === id) || lessons[0];
  if (location.hash.slice(1) !== lesson.id) history.replaceState(null, '', `#${lesson.id}`);
  lastLesson = lesson.id;
  if (storageAvailable) {
    try {
      localStorage.setItem('learn-lab-last-lesson', lesson.id);
    } catch (error) {
      storageAvailable = false;
      console.warn('The last visited lesson could not be saved.', error);
    }
  }
  state.running = false;
  state.pressed = false;
  state.note = -1;
  clearTrace();
  tried = false;
  quizPassed = false;
  $('#lesson-title').textContent = lesson.title;
  $('#lesson-subtitle').textContent = lesson.subtitle;
  $('#lesson-category').textContent = lesson.category;
  $('#lesson-duration').textContent = `${lesson.duration} experiment`;
  $('#breadcrumb').textContent = lesson.title;
  $('#lesson-counter').textContent = `${String(lessons.indexOf(lesson) + 1).padStart(2, '0')} / ${lessons.length}`;
  const index = lessons.indexOf(lesson);
  for (const [selector, item] of [['#previous-lesson', lessons[index - 1]], ['#next-lesson', lessons[index + 1]]]) {
    const link = $(selector);
    link.hidden = !item;
    if (item) link.href = `#${item.id}`;
    else link.removeAttribute('href');
  }
  $('#lesson-position').textContent = `Lesson ${index + 1} of ${lessons.length} · Explore in any order`;
  renderNavigation();
  renderDetails();
  renderControls();
  renderCode();
  renderDiagram();
  renderQuiz();
  lab?.setLesson(lesson.id);
  selectPart('board');
  setRunning(false);
  if (document.activeElement?.classList.contains('lesson-link')) $('#lesson-title').focus();
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
  $(homeActive ? '#automation-title' : '#lesson-title').focus();
});
$('#complete').addEventListener('click', () => {
  if (!completed.has(lesson.id) && !(tried && quizPassed)) return;
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
    const allDone = completed.size === lessons.length;
    toast(allDone ? 'All experiments complete. You are ready to build something of your own!' : `Lesson complete. ${lessons.length - completed.size} lessons remain in your learning path.`);
    $('#complete').innerHTML = `${allDone ? 'Path complete' : 'Lesson complete'} ${icon('check')}`;
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
$('#expand-code').addEventListener('click', () => {
  $('#expanded-sketch').textContent = $('#sketch').textContent;
  $('#sketch-dialog-title').textContent = `${lesson.title} · example.ino`;
  $('#sketch-dialog').showModal();
});
$('#close-sketch').addEventListener('click', () => $('#sketch-dialog').close());
$('#download-code').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([$('#sketch').textContent], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${lesson.id}.ino`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
$('#diagram-toggle').addEventListener('click', () => {
  diagramEnabled = !diagramEnabled;
  $('#diagram-toggle').setAttribute('aria-pressed', String(diagramEnabled));
  $('#scene').hidden = diagramEnabled;
  $('#schematic').hidden = !diagramEnabled;
  $('.component-popover').classList.toggle('diagram-popover', diagramEnabled);
  $('.gesture-hint').textContent = diagramEnabled ? 'Select a labeled connection to inspect it' : 'Drag to pan · Right-drag or Q/E to rotate · Pinch/scroll to zoom · Focus view: WASD pan, 0 reset';
  $('.view-tools').hidden = diagramEnabled;
});
$('#focus-toggle').addEventListener('click', () => {
  focusRequested = !focusRequested;
  applyWorkbenchLayout();
});
$('#clear-trace').addEventListener('click', clearTrace);
$('#sound-toggle').addEventListener('click', async () => {
  if (soundEnabled) {
    soundEnabled = false;
    updateSound(0);
  } else {
    try {
      if (!audioContext) {
        audioContext = new AudioContext();
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        gain = audioContext.createGain();
        gain.gain.value = 0;
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
      }
      await audioContext.resume();
      soundEnabled = true;
    } catch (error) {
      console.warn('Browser sound could not be enabled.', error);
      toast('Sound could not be enabled. Visual note and frequency feedback still work.');
      soundEnabled = false;
    }
  }
  $('#sound-toggle').textContent = soundEnabled ? 'Sound on' : 'Sound off';
  $('#sound-toggle').setAttribute('aria-pressed', String(soundEnabled));
  updateMonitor(performance.now(), true);
});
$('#motion-toggle').addEventListener('click', () => {
  reducedMotion = !reducedMotion;
  $('#motion-toggle').setAttribute('aria-pressed', String(reducedMotion));
  document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  lab?.motion(reducedMotion);
});
document.addEventListener('visibilitychange', () => updateSound(0));
const showLabError = message => {
  $('#scene-error').hidden = false;
  $('#scene-error').textContent = message;
};
$('#scene').addEventListener('lab-error', event => showLabError(event.detail));
try {
  lab = createLab($('#scene'), selectPart);
  lab.motion(reducedMotion);
} catch (error) {
  console.error('Unable to initialize the 3D workbench.', error);
  showLabError('3D graphics are unavailable in this browser. Enable WebGL or try a current browser. You can still use every lesson, control, and live monitor below.');
  document.querySelectorAll('.view-tools button, #flow-toggle').forEach(button => { button.disabled = true; });
}
window.addEventListener('hashchange', navigate);
window.addEventListener('resize', () => {
  applyWorkbenchLayout();
  const compact = innerWidth <= 700;
  if (compact !== compactDiagram) {
    compactDiagram = compact;
    renderDiagram();
    selectPart(selectedPart);
  }
});
navigate();
function tick(now) {
  const delta = Math.min(now - lastFrame, 100) / 1000;
  lastFrame = now;
  if (state.running && lesson.id === 'servo') {
    const difference = state.angle - state.servoPosition;
    state.servoPosition += Math.sign(difference) * Math.min(Math.abs(difference), delta * 180);
  }
  if (state.running && lesson.id === 'stepper') {
    const difference = state.steps - state.stepPosition;
    state.stepPosition += Math.sign(difference) * Math.min(Math.abs(difference), delta * 1024);
  }
  if (!homeActive) updateMonitor(now);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

import { components, temperatureMeasurement } from './lessons.js';

export const homeItems = [
  {
    id: 'motion', name: 'PIR motion sensor', kind: 'DIGITAL INPUT', symbol: '◉', example: 'Motion → low-voltage light',
    description: 'Detects changes in infrared radiation from a moving warm body. It indicates motion, not whether a room is occupied.',
    signal: 'Illustrative digital OUT: HIGH when motion is detected, LOW when clear.',
    wiring: 'Power the PIR module from its rated DC supply; join GND to the Uno and connect OUT to D2. D9 drives a compatible relay-module input, never a bare relay coil.',
    note: 'Real PIR modules need warm-up and may hold their output HIGH after motion. This starter model changes immediately.',
    related: ['button', 'Digital inputs'],
  },
  {
    id: 'contact', name: 'Door / window contact', kind: 'DIGITAL INPUT', symbol: '⊓', example: 'Open contact → indicator light',
    description: 'A magnetic reed contact changes state as its magnet moves away. This example uses a contact closed by a nearby magnet.',
    signal: 'D2 uses INPUT_PULLUP: closed reads LOW; open reads HIGH.',
    wiring: 'Connect the dry contact between D2 and GND. D9 controls the low-voltage indicator through a rated module. No external voltage is needed on the contact.',
    note: 'Real contacts can bounce; add debouncing where needed. This is a learning indicator, not a security or access-control system.',
    related: ['button', 'Pull-up button lesson'],
  },
  {
    id: 'leak', name: 'Water leak sensor', kind: 'DIGITAL INPUT', symbol: '≈', example: 'Water detected → warning light',
    description: 'A low-voltage leak module detects water at its probe. Use its digital output as an input to an indicator circuit.',
    signal: 'This example assumes module DO is HIGH when wet; actual modules may use the opposite polarity.',
    wiring: 'Use the sensor module’s rated DC supply and common GND. Connect its compatible digital output to D2 and the indicator-module input to D9.',
    note: 'Probe corrosion, water conductivity, and threshold adjustment affect detection. Never rely on this demo for flood protection or automatic shutoff.',
    related: ['soil', 'Moisture sensor lesson'],
  },
  {
    id: 'temperature', name: 'TMP36 temperature sensor', kind: 'ANALOG INPUT', symbol: '°', example: 'Warm room → low-voltage fan',
    description: components.temperature.description,
    signal: 'A0 reads 0–1023. Estimated °C = (ADC × 5 / 1023 − 0.5) × 100.',
    wiring: 'TMP36 supply → 5V, output → A0, GND → GND, after checking the exact package pinout. D9 goes to the fan’s properly rated motor-driver input.',
    note: 'The fan follows the ADC-derived estimate, not the slider directly. Supply-reference accuracy, sensor tolerance, and ADC quantization affect real results.',
    related: ['temperature', 'Full temperature lesson'],
  },
  {
    id: 'lamp', name: 'Low-voltage lamp + relay module', kind: 'SWITCHED OUTPUT', symbol: '☼', example: 'Motion → switched DC lamp',
    description: 'A ready-made relay module uses a logic input to switch a separate low-voltage DC lamp circuit. Its driver handles the coil current.',
    signal: 'Illustrative active-HIGH module: D9 HIGH energizes the relay; LOW releases it. Use COM and normally-open contacts for the lamp.',
    wiring: 'Use a 5V-logic-compatible module with its rated DC supply and common logic GND. A separate, appropriately protected low-voltage lamp supply is switched by its contacts. Never connect a relay coil directly to an I/O pin.',
    note: 'This collection is low-voltage DC only: no mains wiring. Module polarity, isolation, default state, contact ratings, and startup behavior vary.',
    related: ['blink', 'Output and LED fundamentals'],
  },
  {
    id: 'fan', name: 'Low-voltage DC fan + driver', kind: 'MOTOR OUTPUT', symbol: '✣', example: 'Temperature → fan on / off',
    description: 'A motor driver switches a separately powered small DC fan. The Arduino provides a control signal, not the motor current.',
    signal: 'D9 HIGH requests fan on at or above the chosen temperature; LOW requests off. No RPM or current is simulated.',
    wiring: 'Use a driver and external DC supply rated for the fan, with common GND and the protection specified by the fan/driver manufacturer. Never power a fan from D9.',
    note: 'This on/off example does not model RPM, startup current, or supply limits. Real temperature controllers also need noise filtering and hysteresis to avoid rapid switching near the threshold.',
    related: ['motor', 'Motor driver lesson'],
  },
];

export function automationOutput(itemId, state) {
  const temperature = temperatureMeasurement(state.temperature);
  const thermal = ['temperature', 'fan'].includes(itemId);
  let detected;
  if (thermal) detected = temperature.celsius >= state.threshold;
  else if (itemId === 'contact') detected = state.open;
  else if (itemId === 'leak') detected = state.wet;
  else detected = state.motion;
  return {
    ...temperature,
    thermal,
    on: state.running && detected,
    input: !state.running ? 'Not sampled' : thermal ? `A0 ${temperature.temperatureReading} · ${temperature.celsius.toFixed(1)}°C` : detected ? 'D2 HIGH' : 'D2 LOW',
    output: state.running && detected ? 'D9 HIGH' : 'D9 LOW',
  };
}

function sketch(itemId, state) {
  if (['temperature', 'fan'].includes(itemId)) {
    return `// TMP36 + rated low-voltage fan driver\nconst int fanDriver = 9;\nconst float turnOnAt = ${state.threshold}.0;\n\nvoid setup() {\n  digitalWrite(fanDriver, LOW);\n  pinMode(fanDriver, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int reading = analogRead(A0);\n  float volts = reading * 5.0 / 1023.0;\n  float celsius = (volts - 0.5) * 100.0;\n  digitalWrite(fanDriver,\n    celsius >= turnOnAt ? HIGH : LOW);\n  Serial.println(celsius);\n  delay(250);\n}`;
  }
  const contact = itemId === 'contact';
  return `// ${contact ? 'Dry contact: open = HIGH with INPUT_PULLUP' : itemId === 'leak' ? 'Example leak module: wet = HIGH' : 'Example PIR module: motion = HIGH'}\n// D9: compatible active-HIGH module, low-voltage load only\nconst int sensor = 2;\nconst int moduleInput = 9;\n\nvoid setup() {\n  digitalWrite(moduleInput, LOW);\n  pinMode(moduleInput, OUTPUT);\n  pinMode(sensor, ${contact ? 'INPUT_PULLUP' : 'INPUT'});\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  bool detected = digitalRead(sensor) == HIGH;\n  digitalWrite(moduleInput, detected ? HIGH : LOW);\n  Serial.println(detected ? "Detected" : "Clear");\n  delay(50);\n}`;
}

export function mountHomeAutomation(host) {
  const state = { running: false, motion: false, open: false, wet: false, temperature: 22, threshold: 28 };
  let item = homeItems[0];
  host.innerHTML = `
    <div class="automation-heading"><span class="eyebrow">COMPONENT LIBRARY / STARTER COLLECTION</span><h1 id="automation-title" tabindex="-1">A little smarter at home.</h1><p>Six practical inputs and outputs. Try the connection between sensing something and making something happen.</p><div class="automation-badges"><span>Simulated only</span><span>Low-voltage DC only</span><span>Outside your 16-lesson path</span></div></div>
    <div class="automation-safety"><strong>A safe place to explore.</strong> No real devices, network connections, or mains electricity. These teaching examples are not security, flood-protection, or safety systems.</div>
    <nav class="automation-catalog" aria-label="Home automation components">${homeItems.map(entry => `<a href="#home-automation/${entry.id}" data-home-item="${entry.id}"><span class="automation-symbol" aria-hidden="true">${entry.symbol}</span><span class="eyebrow">${entry.kind}</span><h2>${entry.name}</h2><p>${entry.description}</p><span class="automation-example-link">Try: ${entry.example} →</span></a>`).join('')}</nav>
    <section class="automation-demo" aria-labelledby="automation-demo-title">
      <div class="automation-demo-heading"><div><span class="eyebrow">SEE IT IN USE</span><h2 id="automation-demo-title" tabindex="-1"></h2></div><span id="automation-run-state">STOPPED</span></div>
      <div class="automation-demo-grid">
        <div class="automation-room">
          <svg viewBox="0 0 540 330" role="img" aria-labelledby="automation-room-title automation-room-description">
            <title id="automation-room-title">Simulated room</title><desc id="automation-room-description"></desc>
            <path d="M75 282V112L270 30l195 82v170z" fill="#e2ecda" stroke="#b8cdb0" stroke-width="2"/>
            <path d="M75 112l195 82 195-82M270 194v120M75 282l195 32 195-32" fill="none" stroke="#c3d6b7" stroke-width="2"/>
            <path d="M112 140v118l68 13V165z" fill="#9db9a2"/><path id="automation-door" d="M119 151v100l51 10v-90z" fill="#f3f4db" stroke="#849f85" stroke-width="2"/>
            <circle cx="158" cy="213" r="3" fill="#6f8b70"/>
            <g id="automation-lamp-visual"><path d="M268 80v38" stroke="#79987b" stroke-width="3"/><path d="M239 151l13-32h33l17 32z" fill="#e9b957" stroke="#af8d40" stroke-width="2"/><ellipse cx="271" cy="153" rx="33" ry="7" fill="#dcc990"/><path class="lamp-glow" d="M245 155l-45 100h145l-48-100z" fill="#ffe5a0" opacity="0"/></g>
            <g id="automation-fan-visual" transform="translate(386 204)"><circle r="49" fill="#f3f8ed" stroke="#a8c39b" stroke-width="3"/><g id="automation-fan-blades" fill="#619b85"><path d="M0 0C-50-8-28-55-8-30L4-3z"/><path d="M0 0C30-40 60 0 29 9L0 5z"/><path d="M0 0C16 48-36 47-28 15L-5 0z"/></g><circle r="8" fill="#3c7263"/><path d="M0 50v20m-23 0h46" stroke="#91af87" stroke-width="5"/></g>
            <g id="automation-sensor-visual"><rect x="205" y="215" width="56" height="42" rx="8" fill="#f6faf1" stroke="#8bac82" stroke-width="2"/><circle cx="233" cy="236" r="12" fill="#a3bf96"/></g>
            <path id="automation-water" d="M113 288q18-17 36 0t36 0t36 0" fill="none" stroke="#66aabd" stroke-width="7" opacity="0"/>
          </svg>
          <div class="automation-signal-path"><div><span>SENSOR INPUT</span><strong id="automation-input"></strong></div><span aria-hidden="true">→</span><div><span>OUTPUT COMMAND</span><strong id="automation-output"></strong></div></div>
          <p id="automation-feedback" role="status"></p>
        </div>
        <div class="automation-controls"><h3>Try a different condition</h3><div id="automation-inputs"></div><button id="automation-run" class="primary-button">Start example</button><button id="automation-reset">Reset inputs</button><div class="automation-readout"><strong>Reads / drives</strong><p id="automation-signal-description"></p></div><a id="automation-related" class="automation-related"></a></div>
      </div>
      <div class="automation-reference"><div><h3>Low-voltage connections</h3><p id="automation-wiring"></p><h3>What the model leaves out</h3><p id="automation-model-note"></p></div><div><h3>Example Arduino sketch</h3><pre tabindex="0" aria-label="Home automation Arduino sketch"><code id="automation-sketch"></code></pre></div></div>
    </section>
    <div class="automation-guide-link"><p>The collection reuses the lab’s input, temperature, LED, and motor-driver fundamentals. It does not add required lessons or change completion.</p><a id="automation-guide" href="${import.meta.env.BASE_URL}home-automation-guide.md" download>Download the component guide (.md) ↓</a><a href="#board">Back to the learning path →</a></div>`;
  const $ = selector => host.querySelector(selector);
  function render() {
    const output = automationOutput(item.id, state);
    const detectedName = output.thermal ? 'Fan' : item.id === 'leak' ? 'Warning light' : 'Low-voltage light';
    $('#automation-input').textContent = output.input;
    $('#automation-output').textContent = `${output.output} · ${detectedName.toLowerCase()} ${output.on ? 'on' : 'off'}`;
    $('#automation-run-state').textContent = state.running ? 'RUNNING' : 'STOPPED';
    $('#automation-run').textContent = state.running ? 'Stop example' : 'Start example';
    $('#automation-run').classList.toggle('running', state.running);
    let feedback = 'Example stopped. Output command is LOW; sensor inputs are not sampled.';
    if (state.running && output.thermal) feedback = `${output.celsius.toFixed(1)}°C ${output.celsius >= state.threshold ? '≥' : '<'} ${state.threshold}°C → fan ${output.on ? 'on' : 'off'}. The estimate includes ADC rounding.`;
    else if (state.running) feedback = `${item.id === 'contact' ? state.open ? 'Contact open' : 'Contact closed' : item.id === 'leak' ? state.wet ? 'Water detected' : 'Probe dry' : state.motion ? 'Motion detected' : 'No motion'} → ${detectedName.toLowerCase()} ${output.on ? 'on' : 'off'}.`;
    $('#automation-feedback').textContent = feedback;
    $('#automation-room-description').textContent = feedback;
    $('.automation-room').classList.toggle('lamp-on', output.on && !output.thermal);
    $('.automation-room').classList.toggle('fan-on', output.on && output.thermal);
    $('#automation-fan-visual').style.opacity = output.thermal ? '1' : '0.25';
    $('#automation-lamp-visual').style.opacity = output.thermal ? '0.25' : '1';
    $('#automation-water').setAttribute('opacity', item.id === 'leak' && state.wet ? '1' : '0');
    $('#automation-door').classList.toggle('door-open', item.id === 'contact' && state.open);
    for (const input of host.querySelectorAll('#automation-inputs input')) {
      if (input.type === 'checkbox') input.checked = state[input.dataset.homeControl];
      else {
        input.value = state[input.dataset.homeControl];
        $(`#automation-${input.dataset.homeControl}-value`).textContent = `${input.value}°C`;
      }
    }
    $('#automation-sketch').textContent = sketch(item.id, state);
  }
  function renderInputs() {
    const thermal = ['temperature', 'fan'].includes(item.id);
    const key = item.id === 'contact' ? 'open' : item.id === 'leak' ? 'wet' : 'motion';
    $('#automation-inputs').innerHTML = thermal
      ? [['temperature', 'Room temperature', -10, 50], ['threshold', 'Turn fan on at or above', 10, 40]].map(([id, label, min, max]) => `<label class="range-label" for="automation-${id}"><span>${label}</span><output id="automation-${id}-value"></output></label><input id="automation-${id}" data-home-control="${id}" type="range" min="${min}" max="${max}" value="${state[id]}"><div class="range-extremes"><span>${min}°C</span><span>${max}°C</span></div>`).join('')
      : `<label class="automation-switch"><input id="automation-${key}" type="checkbox" data-home-control="${key}"><span>${key === 'open' ? 'Open the door / window' : key === 'wet' ? 'Water at the probe' : 'Motion in the room'}</span></label><p class="automation-input-hint">Toggle the input before or during a run. The output only responds while the example is running.</p>`;
    host.querySelectorAll('[data-home-control]').forEach(input => input.addEventListener('input', () => {
      state[input.dataset.homeControl] = input.type === 'checkbox' ? input.checked : Number(input.value);
      render();
    }));
  }
  $('#automation-run').addEventListener('click', () => { state.running = !state.running; render(); });
  $('#automation-reset').addEventListener('click', () => {
    Object.assign(state, { running: false, motion: false, open: false, wet: false, temperature: 22, threshold: 28 });
    render();
  });
  return {
    show(id) {
      item = homeItems.find(entry => entry.id === id) || homeItems[0];
      state.running = false;
      $('#automation-demo-title').textContent = `${item.name}: ${item.example}`;
      $('#automation-signal-description').textContent = item.signal;
      $('#automation-wiring').textContent = item.wiring;
      $('#automation-model-note').textContent = item.note;
      $('#automation-related').href = `#${item.related[0]}`;
      $('#automation-related').textContent = `Explore the existing lesson: ${item.related[1]} →`;
      host.querySelectorAll('[data-home-item]').forEach(link => {
        if (link.dataset.homeItem === item.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      renderInputs();
      render();
      if (id) $('#automation-demo-title').focus();
    },
    stop() { state.running = false; render(); },
  };
}

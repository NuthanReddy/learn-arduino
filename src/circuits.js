export const connections = {
  board: [['USB', 'Board power + upload', 'usb'], ['D13 (built-in)', 'Onboard indicator', 'board']],
  blink: [['D9 → 220 Ω', 'LED anode (+)', 'led'], ['LED cathode (−)', 'GND', 'led']],
  button: [['D2 / INPUT_PULLUP', 'Button → GND', 'button'], ['D9 → 220 Ω', 'LED → GND', 'led']],
  dimmer: [['5V + GND', 'Knob outer terminals', 'knob'], ['A0', 'Knob middle wiper', 'knob'], ['D9 → 220 Ω', 'LED → GND', 'led']],
  servo: [['D9', 'Servo signal', 'servo'], ['External rated 5V', 'Servo power', 'servo'], ['Board + supply GND', 'Servo GND', 'servo']],
  light: [['5V', 'Photoresistor → A0 junction', 'sensor'], ['A0 junction → 10 kΩ', 'GND', 'sensor'], ['D9 → 220 Ω', 'LED → GND', 'led']],
  rgb: [['D3 → 220 Ω', 'Red anode', 'rgb'], ['D5 → 220 Ω', 'Green anode', 'rgb'], ['D6 → 220 Ω', 'Blue anode', 'rgb'], ['RGB common cathode', 'GND', 'rgb']],
  distance: [['5V + GND', 'HC-SR04 VCC + GND', 'ultrasonic'], ['D7', 'TRIG', 'ultrasonic'], ['D8', 'ECHO (5V)', 'ultrasonic']],
  buzzer: [['D8', 'Passive piezo +', 'buzzer'], ['Piezo −', 'GND', 'buzzer']],
  piano: [['D2 / D3 / D4 / D5', 'Four buttons → GND', 'piano'], ['D8', 'Piezo +; − to GND', 'buzzer']],
  motor: [['D9 → gate resistor', 'N-MOSFET gate + pull-down', 'driver'], ['Supply +', 'Motor +; flyback cathode', 'motor'], ['Motor − / diode anode', 'MOSFET drain', 'driver'], ['MOSFET source', 'Board + supply GND', 'driver']],
  temperature: [['Rated supply + GND', 'TMP36 supply + GND', 'temperature'], ['A0', 'TMP36 output', 'temperature']],
  stepper: [['D8 / D9 / D10 / D11', 'ULN2003 IN1 / IN2 / IN3 / IN4', 'driver'], ['Rated external 5V + GND', 'Driver power; common GND', 'driver'], ['Driver coil outputs', '28BYJ-48 motor connector', 'stepper']],
  soil: [['Rated supply + GND', 'Capacitive probe power', 'soil'], ['A0', 'Probe analog output', 'soil'], ['D9 → 220 Ω', 'Reminder LED → GND', 'led']],
  force: [['5V', 'FSR → A0 junction', 'force'], ['A0 junction → 10 kΩ', 'GND', 'force'], ['D9 → 220 Ω', 'LED → GND', 'led']],
  parking: [['5V + GND', 'HC-SR04 power', 'ultrasonic'], ['D7 / D8', 'TRIG / ECHO', 'ultrasonic'], ['D3 / D5 / D6', 'Red / amber / green', 'traffic'], ['Each LED via 220 Ω', 'Cathode to GND', 'traffic'], ['D10', 'Piezo +; − to GND', 'buzzer']],
};

export const pinGroups = [
  ['D0 / D1', 'RX / TX serial', 'USB serial shares these pins. Avoid attaching lesson components here while using Serial.'],
  ['D2 / D3', 'Digital; external interrupts', 'This lab uses D2 for a pull-up button. D3 also supports PWM.'],
  ['D3 / D5 / D6 / D9 / D10 / D11', 'PWM output (~)', 'analogWrite() selects duty cycle from 0 to 255.'],
  ['D4 / D7 / D8 / D12 / D13', 'Other digital I/O', 'Use pinMode() to choose input or output. D13 connects to the built-in LED.'],
  ['A0–A5', 'Analog inputs', 'Uno analogRead() returns 0–1023. Do not apply voltages below GND or above the reference/supply.'],
  ['A4 / A5', 'SDA / SCL (I²C)', 'These analog pins also support I²C devices. Uno R3 exposes duplicate SDA/SCL header pins.'],
  ['5V / 3.3V', 'Regulated supply rails', 'These are power pins, not programmable outputs. Respect the board and regulator current limits.'],
  ['GND', 'Common reference', 'Join grounds when a sensor or motor driver uses an external supply.'],
  ['VIN / barrel jack', 'Unregulated supply input', 'Follow your board documentation. Uno R3 recommends 7–12V input; never apply that voltage to an I/O pin.'],
  ['AREF', 'ADC voltage reference', 'Only use an external reference with the appropriate analogReference() configuration.'],
];

export function diagramMarkup(id, compact = false) {
  const rows = connections[id];
  const height = rows.length * (compact ? 115 : 70) + 70;
  return `<svg viewBox="0 0 ${compact ? 320 : 640} ${height}" role="img" aria-label="Interactive wiring diagram. Select a component connection to inspect it.">
    <defs><marker id="wire-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5b8c78"/></marker></defs>
    <text x="24" y="25" class="diagram-title">${compact ? 'PIN / SUPPLY → COMPONENT' : 'PIN / SUPPLY'}</text>${compact ? '' : '<text x="355" y="25" class="diagram-title">COMPONENT CONNECTION</text>'}
    ${rows.map(([from, to, part], index) => {
      const y = index * (compact ? 115 : 70) + 45;
      return `<g data-part="${part}" class="diagram-connection" role="button" tabindex="0" aria-label="Inspect connection: ${from} to ${to}">
        <rect x="20" y="${y}" width="${compact ? 280 : 246}" height="44" rx="8"/><rect x="${compact ? 20 : 352}" y="${compact ? y + 58 : y}" width="${compact ? 280 : 266}" height="44" rx="8"/>
        <path d="${compact ? `M160 ${y + 44}v12` : `M266 ${y + 22}h83`}" class="diagram-wire" marker-end="url(#wire-arrow)"/>
        <text x="32" y="${y + 27}">${from}</text><text x="${compact ? 32 : 364}" y="${compact ? y + 85 : y + 27}">${to}</text>
      </g>`;
    }).join('')}</svg>`;
}

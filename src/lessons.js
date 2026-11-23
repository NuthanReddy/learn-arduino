import { moreLessons } from './more-lessons.js';

export const lessons = [
  {
    id: 'board',
    title: 'Your first circuit',
    category: 'START HERE',
    duration: '5 min',
    subtitle: 'Small board. A world of possibilities.',
    description: 'Meet the tiny computer at the heart of your projects. A sketch tells the board what to do; its pins connect that code to the physical world.',
    goal: 'Power the board, then inspect the processor, USB connection, and pin headers. Select a part in the 3D view or from the component list.',
    parts: ['board', 'usb', 'chip', 'pins'],
    wiring: 'This first experiment uses only the onboard indicator. On real hardware, a USB cable supplies power and carries your sketch from the computer.',
    concepts: [['setup()', 'Runs once when the board starts. Use it to configure your pins.'], ['loop()', 'Repeats while the board is powered. This is where your project comes alive.']],
    question: 'Which function repeats while a sketch runs?',
    answers: ['setup()', 'loop()', 'pinMode()'],
    correct: 1,
    explanation: 'Exactly. setup() prepares the board once; loop() keeps repeating.',
    code: () => `void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n  digitalWrite(LED_BUILTIN, HIGH);\n}\n\nvoid loop() {\n  // The onboard light stays on.\n}`,
  },
  {
    id: 'blink',
    title: 'A little light show',
    category: 'DIGITAL OUTPUT',
    duration: '7 min',
    subtitle: 'Write your first hello, world in light.',
    description: 'An output pin can switch between HIGH and LOW. Put a pause between those changes and a simple light becomes a signal you can see.',
    goal: 'Run the experiment and change the blink interval. Watch the external LED alternate, then compare the timing with the sketch.',
    parts: ['board', 'led', 'resistor', 'pins'],
    wiring: 'D9 → 220 Ω resistor → LED anode (+). LED cathode (short leg) → GND. The resistor limits current. Disconnect USB before building a real circuit.',
    concepts: [['digitalWrite()', 'HIGH sets a digital output to about 5 V on an Uno. LOW brings it to ground.'], ['delay()', 'Pauses your sketch for a number of milliseconds. 1,000 ms is one second.']],
    question: 'Why does this LED need a series resistor?',
    answers: ['To store the sketch', 'To reverse the LED', 'To limit the current'],
    correct: 2,
    explanation: 'Yes. A resistor keeps current through the LED within a safe range.',
    code: ({ interval }) => `const int led = 9;\n\nvoid setup() {\n  pinMode(led, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(led, HIGH);\n  delay(${interval});\n  digitalWrite(led, LOW);\n  delay(${interval});\n}`,
  },
  {
    id: 'button',
    title: 'Make the connection',
    category: 'DIGITAL INPUT',
    duration: '8 min',
    subtitle: 'Give your circuit a say.',
    description: 'Your program can listen as well as act. A push button changes the voltage on an input pin, letting your sketch respond to a person.',
    goal: 'Start the simulation, then toggle the virtual button. With INPUT_PULLUP, a pressed button reads LOW and switches the LED on.',
    parts: ['board', 'button', 'led', 'resistor'],
    wiring: 'Connect opposite switched sides of the button between D2 and GND. INPUT_PULLUP supplies an internal pull-up. Keep the LED circuit on D9 with its 220 Ω resistor.',
    concepts: [['INPUT_PULLUP', 'An internal resistor holds the input HIGH when the button is open.'], ['Active LOW', 'Pressing the button connects the input to GND. LOW means pressed, not broken.']],
    question: 'What does D2 read when this button is pressed?',
    answers: ['LOW', 'HIGH', 'It is always HIGH'],
    correct: 0,
    explanation: 'Right. The button connects D2 to ground, so digitalRead() returns LOW.',
    code: () => `void setup() {\n  pinMode(2, INPUT_PULLUP);\n  pinMode(9, OUTPUT);\n}\n\nvoid loop() {\n  bool pressed = digitalRead(2) == LOW;\n  digitalWrite(9, pressed ? HIGH : LOW);\n}`,
  },
  {
    id: 'dimmer',
    title: 'Find your brightness',
    category: 'ANALOG INPUT + PWM',
    duration: '9 min',
    subtitle: 'Go beyond just on and off.',
    description: 'A potentiometer is an adjustable voltage divider. Read its position and turn that measurement into a brightness level for your LED.',
    goal: 'Run the circuit, then turn the virtual knob. Compare the 0–1023 input reading with the 0–255 PWM output in the live monitor.',
    parts: ['board', 'knob', 'led', 'resistor'],
    wiring: 'Potentiometer outer pins → 5V and GND; middle wiper → A0. D9 → 220 Ω resistor → LED → GND. PWM is pulsed digital output, not a true variable-voltage output.',
    concepts: [['analogRead()', 'An Uno converts the input voltage into a 10-bit value from 0 to 1023.'], ['analogWrite()', 'On a PWM pin such as D9, values from 0 to 255 change the duty cycle.']],
    question: 'What is the largest analogRead() value on an Uno?',
    answers: ['5', '255', '1023'],
    correct: 2,
    explanation: 'Correct. A 10-bit reading has 1,024 possible values: 0 through 1023.',
    code: () => `void setup() {\n  pinMode(9, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int reading = analogRead(A0);\n  int brightness = map(reading, 0, 1023, 0, 255);\n  analogWrite(9, brightness);\n  Serial.println(reading);\n  delay(50);\n}`,
  },
  {
    id: 'servo',
    title: 'A move in the right direction',
    category: 'MOTION',
    duration: '8 min',
    subtitle: 'Turn an idea into movement.',
    description: 'A hobby servo moves to a requested angle. Inside, a small controller adjusts a motor until its shaft reaches the target position.',
    goal: 'Start the experiment and choose an angle. Follow the servo arm as it moves from 0° to 180° and inspect its signal connection.',
    parts: ['board', 'servo', 'pins'],
    wiring: 'Servo signal → D9. Use a suitable regulated external 5 V supply for servo power and join its GND to board GND. Do not power a loaded motor from an I/O pin.',
    concepts: [['Servo library', 'The Arduino Servo library creates the timed control pulses for a hobby servo.'], ['Common ground', 'Signal voltages need the same reference, even when the motor has a separate power supply.']],
    question: 'How should a loaded servo be powered?',
    answers: ['Directly from D9', 'From a suitable external supply with common GND', 'From A0'],
    correct: 1,
    explanation: 'Exactly. Use an appropriately rated external supply and connect its ground to the board.',
    code: ({ angle }) => `#include <Servo.h>\nServo arm;\n\nvoid setup() {\n  arm.attach(9);\n}\n\nvoid loop() {\n  arm.write(${angle});\n  delay(20);\n}`,
  },
  {
    id: 'light',
    title: 'Light that listens',
    category: 'YOUR FIRST PROJECT',
    duration: '10 min',
    subtitle: 'Build a tiny automatic night light.',
    description: 'Combine a sensor, a decision, and an output. This little night light watches the room and switches on when the measured light level falls below a threshold.',
    goal: 'Run the project and lower the ambient light. Then adjust the threshold to decide when the LED should turn on.',
    parts: ['board', 'sensor', 'led', 'resistor'],
    wiring: '5V → photoresistor → A0 junction → 10 kΩ resistor → GND. In this divider, darker light produces a lower reading. Keep the LED and its separate 220 Ω resistor on D9.',
    concepts: [['Voltage divider', 'Two resistances divide the supply voltage. The changing sensor resistance changes the A0 voltage.'], ['Threshold', 'An if statement turns a continuous measurement into a yes-or-no decision.']],
    question: 'The reading is 200 and the threshold is 400. What happens?',
    answers: ['The LED turns on', 'The LED turns off', 'The board stops'],
    correct: 0,
    explanation: 'You got it. 200 is below 400, so the sketch turns the night light on.',
    code: ({ threshold }) => `void setup() {\n  pinMode(9, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int light = analogRead(A0);\n  bool isDark = light < ${threshold};\n  digitalWrite(9, isDark ? HIGH : LOW);\n  Serial.println(light);\n  delay(100);\n}`,
  },
  ...moreLessons,
];

export const components = {
  board: { name: 'Microcontroller board', short: 'UNO-style board', description: 'A simplified 3D model of a 5 V Uno-style learning board. It runs your sketch and connects inputs to outputs.' },
  usb: { name: 'USB connection', short: 'USB power', description: 'On real hardware, USB supplies power and uploads your sketch. The virtual lab does not connect to a physical board.' },
  chip: { name: 'Microcontroller', short: 'Processor', description: 'The processor executes instructions, reads the input pins, and updates outputs. An Uno R3 uses an ATmega328P.' },
  pins: { name: 'Pin headers', short: 'I/O pins', description: 'D0–D13 are digital pins. A0–A5 can read analog signals. PWM pins on an Uno are 3, 5, 6, 9, 10, and 11.' },
  led: { name: 'LED', short: 'LED', description: 'A light-emitting diode only conducts in one direction. Connect the anode toward the output and the cathode toward GND, with a series resistor.' },
  resistor: { name: 'Resistor', short: '220 Ω resistor', description: 'The 220 Ω resistor limits LED current. With an approximate 2 V red LED and a 5 V supply, current is (5 − 2) / 220 ≈ 14 mA.' },
  button: { name: 'Push button', short: 'Push button', description: 'This normally open switch closes a connection while pressed. INPUT_PULLUP keeps the input stable when the switch is open.' },
  knob: { name: 'Potentiometer', short: '10 kΩ knob', description: 'A three-terminal adjustable resistor. Its middle wiper picks a voltage between the two outer connections.' },
  servo: { name: 'Hobby servo', short: 'Servo motor', description: 'A geared motor with position feedback. The signal selects an angle; a separate, suitably rated supply handles motor current.' },
  sensor: { name: 'Photoresistor', short: 'Light sensor', description: 'Its resistance rises as light decreases. A 10 kΩ resistor completes the voltage divider that lets A0 measure the change.' },
  rgb: { name: 'Common-cathode RGB LED', short: 'RGB LED', description: 'Three LEDs share a ground connection. Red, green, and blue each need their own resistor and PWM pin.' },
  ultrasonic: { name: 'Ultrasonic ranging sensor', short: 'HC-SR04 sensor', description: 'TRIG starts a sound burst and ECHO reports round-trip travel time. This model assumes 343 m/s sound speed.' },
  buzzer: { name: 'Passive piezo', short: 'Piezo buzzer', description: 'An alternating signal makes the piezo vibrate. A passive piezo needs tone(); an active buzzer contains its own oscillator.' },
  piano: { name: 'Four-note keyboard', short: 'Piano keys', description: 'Four active-low buttons choose C4, D4, E4, and F4. The sketch gives the first pressed key priority.' },
  motor: { name: 'DC motor', short: 'DC motor', description: 'The virtual wheel shows relative PWM drive, not calibrated RPM. Real speed depends on load, voltage, motor, and driver.' },
  driver: { name: 'Motor driver and supply', short: 'Rated driver', description: 'A driver switches an external supply. DC motors need flyback protection; the geared stepper uses a ULN2003 coil driver. All signal grounds must be joined.' },
  temperature: { name: 'TMP36 temperature sensor', short: 'TMP36', description: 'The ideal output is 0.5 V + temperature × 0.01 V/°C. ADC quantization and reference accuracy affect the estimate.' },
  stepper: { name: 'Geared stepper motor', short: '28BYJ-48 + driver', description: 'This model assumes 2,048 full steps per nominal revolution. Real gear ratios vary; commanded steps are not measured position.' },
  soil: { name: 'Capacitive moisture sensor', short: 'Moisture probe', description: 'The example uses dry ADC 800 and wet ADC 300. Calibrate your sensor in its actual soil before relying on percentages.' },
  force: { name: 'Force-sensitive resistor', short: 'FSR pressure pad', description: 'A voltage divider translates resistance into an ADC reading. The simulated press percentage is not a measurement in newtons.' },
  traffic: { name: 'Three-zone indicator', short: 'Traffic lights', description: 'Red means at or inside the stop threshold; amber extends to the caution threshold; green is beyond it. Each LED has a separate resistor.' },
};

export function temperatureMeasurement(temperature) {
  const temperatureVoltage = 0.5 + temperature * 0.01;
  const temperatureReading = Math.round(temperatureVoltage * 1023 / 5);
  const celsius = (temperatureReading * 5 / 1023 - 0.5) * 100;
  return { temperatureVoltage, temperatureReading, celsius };
}

export function simulate(lesson, state, elapsed) {
  const analog = Math.round(state.knob * 1023 / 100);
  const light = Math.round(state.light * 1023 / 100);
  const forceReading = Math.round(state.force * 1023 / 100);
  const soilReading = Math.round(800 - state.moisture * 5);
  const moisture = Math.trunc((800 - soilReading) * 100 / 500);
  const { temperatureVoltage, temperatureReading, celsius } = temperatureMeasurement(state.temperature);
  const echo = Math.round(state.distance * 2 / 0.0343);
  const measuredDistance = Number((echo * 0.0343 / 2).toFixed(1));
  const zone = measuredDistance <= state.stopDistance ? 'STOP' : measuredDistance <= state.cautionDistance ? 'CAUTION' : 'CLEAR';
  const note = [262, 294, 330, 349][state.note] || 0;
  let frequency = 0;
  let led = 0;
  if (state.running) {
    if (lesson === 'board') led = 1;
    if (lesson === 'blink') led = Math.floor(elapsed / state.interval) % 2 === 0 ? 1 : 0;
    if (lesson === 'button') led = Number(state.pressed);
    if (lesson === 'dimmer') led = Math.trunc(analog * 255 / 1023) / 255;
    if (lesson === 'light') led = Number(light < state.threshold);
    if (lesson === 'rgb') led = Math.max(state.red, state.green, state.blue) / 255;
    if (lesson === 'soil') led = Number(moisture < state.moistureThreshold);
    if (lesson === 'force') led = Math.trunc(forceReading * 255 / 1023) / 255;
    if (lesson === 'buzzer' && Math.floor(elapsed / 500) % 2 === 0) frequency = state.frequency;
    if (lesson === 'piano') frequency = note;
    if (lesson === 'parking' && !state.noEcho && zone === 'STOP') frequency = 880;
  }
  return {
    led, analog, pwm: Math.round(led * 255), light, digital: state.pressed ? 'LOW' : 'HIGH', angle: state.servoPosition ?? 90,
    frequency, echo, measuredDistance, zone, temperatureReading, celsius, temperatureVoltage, soilReading, moisture, forceReading,
    motorPwm: state.running ? Math.trunc(state.motorSpeed * 255 / 100) : 0,
    steps: state.stepPosition ?? 0,
    rgb: state.running ? [state.red, state.green, state.blue] : [0, 0, 0],
  };
}

import { test, expect } from '@playwright/test';
import { lessons, simulate } from '../src/lessons.js';

test('simulation handles blink timing, pull-up input, PWM endpoints and light thresholds', () => {
  const state = { running: true, interval: 500, pressed: false, knob: 0, light: 0, threshold: 400, angle: 180, servoPosition: 180 };
  expect(simulate('blink', state, 499).led).toBe(1);
  expect(simulate('blink', state, 500).led).toBe(0);
  expect(simulate('blink', state, 1000).led).toBe(1);
  expect(simulate('button', state, 0)).toMatchObject({ led: 0, digital: 'HIGH' });
  expect(simulate('button', { ...state, pressed: true }, 0)).toMatchObject({ led: 1, digital: 'LOW' });
  expect(simulate('dimmer', state, 0)).toMatchObject({ analog: 0, pwm: 0 });
  expect(simulate('dimmer', { ...state, knob: 100 }, 0)).toMatchObject({ analog: 1023, pwm: 255 });
  expect(simulate('dimmer', { ...state, knob: 50 }, 0)).toMatchObject({ analog: 512, pwm: 127 });
  expect(simulate('light', state, 0).led).toBe(1);
  expect(simulate('light', { ...state, light: 100 }, 0).led).toBe(0);
  expect(simulate('light', { ...state, threshold: 0 }, 0).led).toBe(0);
  expect(simulate('servo', state, 0).angle).toBe(180);
  expect(simulate('servo', { ...state, running: false }, 0).angle).toBe(180);
  for (const id of ['board', 'blink', 'button', 'dimmer', 'servo', 'light']) {
    expect(simulate(id, { ...state, running: false }, 0).led).toBe(0);
  }
});

test('sensor conversion, sound timing and capstone boundary calculations match the sketches', () => {
  const state = { running: true, red: 255, green: 0, blue: 0, distance: 20, stopDistance: 20, cautionDistance: 60, noEcho: false, frequency: 880, note: 2, temperature: 25, force: 50, moisture: 0, moistureThreshold: 30, motorSpeed: 50, stepPosition: 1024 };
  expect(simulate('rgb', state, 0).rgb).toEqual([255, 0, 0]);
  expect(simulate('buzzer', state, 0).frequency).toBe(880);
  expect(simulate('buzzer', state, 500).frequency).toBe(0);
  expect(simulate('piano', state, 0).frequency).toBe(330);
  expect(simulate('motor', state, 0).motorPwm).toBe(127);
  expect(simulate('temperature', state, 0).temperatureReading).toBe(153);
  expect(simulate('temperature', state, 0).celsius).toBeCloseTo((153 * 5 / 1023 - 0.5) * 100);
  expect(simulate('soil', state, 0)).toMatchObject({ soilReading: 800, moisture: 0, led: 1 });
  expect(simulate('soil', { ...state, moisture: 100 }, 0)).toMatchObject({ soilReading: 300, moisture: 100, led: 0 });
  expect(simulate('force', state, 0)).toMatchObject({ forceReading: 512, pwm: 127 });
  expect(simulate('parking', state, 0)).toMatchObject({ zone: 'STOP', frequency: 880 });
  expect(simulate('parking', { ...state, distance: 60 }, 0).zone).toBe('CAUTION');
  expect(simulate('parking', { ...state, distance: 61 }, 0).zone).toBe('CLEAR');
  expect(simulate('parking', { ...state, noEcho: true }, 0).frequency).toBe(0);
  expect(simulate('stepper', { ...state, running: false }, 0).steps).toBe(1024);
});

test('board renders, components are accessible, completion persists and view controls work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('');
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#scene-error')).toBeHidden();
  const boardImage = await page.locator('#scene canvas').screenshot();
  const boardWidth = await page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let left = image.width;
    let right = 0;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      if (pixels[i] < 100 && pixels[i + 1] > pixels[i] + 20 && Math.abs(pixels[i + 1] - pixels[i + 2]) < 50) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    return (right - left) / image.width;
  }, boardImage.toString('base64'));
  expect(boardWidth).toBeGreaterThan(0.45);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('tab', { name: 'Parts', exact: true }).click();
  await page.getByRole('button', { name: 'Processor', exact: true }).click();
  await expect(page.locator('#component-name')).toHaveText('Microcontroller');
  const before = await page.locator('#scene canvas').screenshot();
  await page.getByRole('button', { name: 'Rotate view right', exact: true }).click();
  await page.waitForTimeout(250);
  const after = await page.locator('#scene canvas').screenshot();
  expect(before.equals(after)).toBe(false);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Power the board', exact: true }).click();
  await expect(page.locator('#monitor-log')).toContainText('onboard indicator is lit');
  await expect(page.locator('#complete')).toBeDisabled();
  await page.locator('[data-answer="0"]').click();
  await expect(page.locator('#quiz-feedback')).toContainText('Not quite');
  await page.locator('[data-answer="1"]').click();
  await expect(page.locator('#complete')).toBeEnabled();
  await page.locator('#complete').click();
  await expect(page).toHaveURL(/#blink$/);
  await expect(page.locator('#progress-count')).toHaveText('1 / 16');
  await page.reload();
  await expect(page.locator('#progress-count')).toHaveText('1 / 16');
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#lesson-title')).toHaveText('A little light show');
  await expect(page.locator('#lesson-title')).toBeFocused();
  expect(errors).toEqual([]);
});

test('every guided circuit responds to controls and navigation stops outputs', async ({ page }) => {
  await page.goto('#blink');
  await page.locator('#interval').fill('1000');
  await expect(page.locator('#sketch')).toContainText('delay(1000)');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-values')).toContainText('2000 ms');
  await page.locator('#flow-toggle').click();
  await expect(page.locator('#flow-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#lesson-nav a[href="#button"]').click();
  await expect(page.locator('#monitor-state')).toHaveText('IDLE');
  await page.locator('#run').click();
  await page.locator('#press-button').click();
  await expect(page.locator('#monitor-log')).toContainText('D2 LOW → LED on');
  await page.locator('#press-button').click();
  await expect(page.locator('#monitor-log')).toContainText('D2 HIGH → LED off');
  await page.locator('#lesson-nav a[href="#dimmer"]').click();
  await page.locator('#run').click();
  await page.locator('#knob').fill('100');
  await expect(page.locator('#monitor-log')).toContainText('PWM 255/255');
  await page.locator('#knob').fill('0');
  await expect(page.locator('#monitor-log')).toContainText('0% brightness');
  await page.locator('#lesson-nav a[href="#servo"]').click();
  await page.locator('#run').click();
  await page.locator('#angle').fill('180');
  await expect(page.locator('#monitor-log')).toContainText('180°');
  await expect(page.locator('#sketch')).toContainText('arm.write(180)');
  await expect(page.locator('#monitor-values')).toContainText('180°');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-values')).toContainText('180°');
  await page.locator('#lesson-nav a[href="#light"]').click();
  await page.locator('#run').click();
  await page.locator('#light').fill('0');
  await expect(page.locator('#monitor-log')).toContainText('night light on');
  await page.locator('#threshold').fill('0');
  await expect(page.locator('#monitor-log')).toContainText('night light off');
  await page.getByRole('tab', { name: 'Connections', exact: true }).click();
  await expect(page.locator('#detail-panel')).toContainText('10 kΩ');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-log')).toContainText('Outputs are off');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('keyboard tabs and unsupported WebGL retain usable lessons', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply(target, self, args) {
        if (String(args[0]).startsWith('webgl')) return null;
        return Reflect.apply(target, self, args);
      },
    });
  });
  await page.goto('');
  await expect(page.locator('#scene-error')).toContainText('3D graphics are unavailable');
  await page.getByRole('tab', { name: 'The idea', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Connections', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-log')).toContainText('Board powered');
});

test('all sixteen lessons complete and copy failure gives manual instructions', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => { throw new Error('Clipboard permission denied'); } },
    });
  });
  await page.goto('');
  await page.locator('#copy-code').click();
  await expect(page.locator('#toast')).toContainText('copy it manually');
  for (const { id, correct: answer } of lessons) {
    await expect(page.locator(`a[href="#${id}"].lesson-link`)).toHaveAttribute('aria-current', 'step');
    await page.locator('#run').click();
    await page.locator(`[data-answer="${answer}"]`).click();
    await page.locator('#complete').click();
  }
  await expect(page.locator('#progress-count')).toHaveText('16 / 16');
  await expect(page.locator('#complete')).toHaveText('Path complete');
  await page.reload();
  await expect(page.locator('#progress-count')).toHaveText('16 / 16');
});

test('legacy completion resumes without retaking and the last topic does not falsely finish the path', async ({ page }) => {
  await page.goto('');
  await page.evaluate(() => {
    localStorage.setItem('learn-lab-progress', JSON.stringify(['board', 'blink', 'button', 'dimmer', 'servo', 'light']));
    localStorage.setItem('learn-lab-last-lesson', 'dimmer');
  });
  await page.goto('');
  await expect(page).toHaveURL(/#dimmer$/);
  await expect(page.locator('#progress-count')).toHaveText('6 / 16');
  await expect(page.locator('#complete')).toBeEnabled();
  await page.locator('#complete').click();
  await expect(page).toHaveURL(/#servo$/);
  await page.locator('#lesson-nav a[href="#parking"]').click();
  await page.locator('#run').click();
  await page.locator('[data-answer="1"]').click();
  await page.locator('#complete').click();
  await expect(page.locator('#toast')).toContainText('9 lessons remain');
});

test('ten added topics have working inputs, outputs, sketches and diagrams', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('#rgb');
  await page.locator('#run').click();
  await page.locator('#red').fill('255');
  await page.locator('#green').fill('0');
  await page.locator('#blue').fill('0');
  await expect(page.locator('#monitor-values')).toContainText('#ff0000');
  await expect(page.locator('#sketch')).toContainText('analogWrite(3, 255)');
  await page.locator('#lesson-nav a[href="#distance"]').click();
  await page.locator('#run').click();
  await page.locator('#distance').fill('100');
  await expect(page.locator('#monitor-values')).toContainText('100.0 cm');
  await page.locator('#noEcho').check();
  await expect(page.locator('#monitor-log')).toContainText('Measurement failed');
  await page.locator('#noEcho').uncheck();
  await page.locator('#lesson-nav a[href="#buzzer"]').click();
  await page.locator('#frequency').fill('880');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-log')).toContainText('880 Hz');
  await expect(page.locator('#sketch')).toContainText('tone(8, 880)');
  await page.locator('#lesson-nav a[href="#piano"]').click();
  await page.locator('#run').click();
  await page.locator('[data-note="2"]').click();
  await expect(page.locator('#monitor-log')).toContainText('E4 → 330 Hz');
  await page.locator('[data-note="2"]').click();
  await expect(page.locator('#monitor-log')).toContainText('noTone()');
  await page.locator('#lesson-nav a[href="#motor"]').click();
  await page.locator('#run').click();
  await page.locator('#motorSpeed').fill('100');
  await expect(page.locator('#monitor-log')).toContainText('PWM 255/255');
  await page.locator('#motorSpeed').fill('0');
  await expect(page.locator('#monitor-log')).toContainText('PWM 0/255');
  await page.locator('#lesson-nav a[href="#temperature"]').click();
  await page.locator('#run').click();
  await page.locator('#temperature').fill('50');
  await expect(page.locator('#monitor-log')).toContainText('input 50°C');
  await page.locator('#lesson-nav a[href="#stepper"]').click();
  await page.locator('#steps').fill('2048');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-values')).toContainText('2048 steps', { timeout: 5000 });
  await page.locator('#lesson-nav a[href="#soil"]').click();
  await page.locator('#run').click();
  await page.locator('#moisture').fill('0');
  await expect(page.locator('#monitor-log')).toContainText('reminder on');
  await page.locator('#moisture').fill('100');
  await expect(page.locator('#monitor-log')).toContainText('reminder off');
  await page.locator('#lesson-nav a[href="#force"]').click();
  await page.locator('#run').click();
  await page.locator('#force').fill('100');
  await expect(page.locator('#monitor-log')).toContainText('PWM 255/255');
  await page.locator('#lesson-nav a[href="#parking"]').click();
  await page.locator('#run').click();
  for (const [distance, zone] of [[20, 'STOP'], [21, 'CAUTION'], [60, 'CAUTION'], [61, 'CLEAR']]) {
    await page.locator('#distance').fill(String(distance));
    await expect(page.locator('#monitor-log')).toContainText(zone);
  }
  await page.locator('#stopDistance').fill('80');
  await expect(page.locator('#cautionDistance-value')).toHaveText('81 cm');
  await page.locator('#cautionDistance').fill('10');
  await expect(page.locator('#stopDistance-value')).toHaveText('9 cm');
  await expect(page.locator('#sketch')).toContainText('const int stopAt = 9;');
  await page.locator('#noEcho').check();
  await expect(page.locator('#monitor-log')).toContainText('Indicators and warning tone off');
  await page.locator('#diagram-toggle').click();
  await expect(page.locator('#schematic-live')).toContainText('Measurement failed');
  await page.locator('#schematic [data-part="ultrasonic"]').first().click();
  await expect(page.locator('#component-name')).toHaveText('Ultrasonic ranging sensor');
  await page.getByRole('tab', { name: 'Pinout', exact: true }).click();
  await expect(page.locator('#detail-panel')).toContainText('D7 / D8');
  await page.getByRole('tab', { name: 'Specs', exact: true }).click();
  await expect(page.locator('#detail-panel')).toContainText('10-bit ADC');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('keyboard camera, retained serial trace, sound mute and sketch export work', async ({ page }) => {
  await page.addInitScript(() => {
    window.audioGain = 0;
    window.AudioContext = class {
      currentTime = 0;
      destination = {};
      async resume() {}
      createOscillator() { return { type: '', frequency: { setTargetAtTime() {} }, connect(node) { return node; }, start() {} }; }
      createGain() { return { gain: { value: 0, setTargetAtTime(value) { window.audioGain = value; } }, connect() {} }; }
    };
  });
  await page.goto('#piano');
  await page.locator('#run').click();
  await page.locator('[data-note="0"]').click();
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => window.audioGain)).toBeGreaterThan(0);
  await page.locator('#run').click();
  await expect.poll(() => page.evaluate(() => window.audioGain)).toBe(0);
  await page.locator('.serial-history summary').click();
  await expect(page.locator('#serial-trace li').first()).toBeVisible();
  await page.locator('#clear-trace').click();
  await expect(page.locator('#serial-trace li')).toHaveCount(0);
  await page.locator('#motion-toggle').click();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'true');
  const before = await page.locator('#scene canvas').screenshot();
  await page.locator('#scene canvas').focus();
  await page.keyboard.press('d');
  await page.keyboard.press('e');
  const after = await page.locator('#scene canvas').screenshot();
  expect(before.equals(after)).toBe(false);
  await page.locator('#expand-code').click();
  await expect(page.locator('#sketch-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#sketch-dialog')).toBeHidden();
  const download = page.waitForEvent('download');
  await page.locator('#download-code').click();
  expect((await download).suggestedFilename()).toBe('piano.ino');
});

test('switching from a large diagram does not permanently enlarge the 3D workbench', async ({ page }) => {
  await page.goto('#board');
  const initial = await page.locator('.scene-card').boundingBox();
  await page.locator('#lesson-nav a[href="#parking"]').click();
  await page.locator('#diagram-toggle').click();
  await page.locator('#diagram-toggle').click();
  await page.locator('#lesson-nav a[href="#board"]').click();
  await expect.poll(async () => (await page.locator('.scene-card').boundingBox()).height).toBeLessThan(initial.height * 1.15);
  await expect(page.locator('#scene canvas')).toBeVisible();
});

test('individual wiring connections follow input, PWM, parking and stopped states', async ({ page }) => {
  await page.goto('#button');
  await page.locator('#diagram-toggle').click();
  await expect(page.locator('[data-signal="0"]')).toHaveText('Not sampled');
  await page.locator('#run').click();
  await expect(page.locator('[data-signal="0"]')).toContainText('HIGH');
  await page.locator('#press-button').click();
  await expect(page.locator('[data-signal="0"]')).toContainText('LOW · pressed');
  await expect(page.locator('[data-signal="1"]')).toContainText('HIGH · LED on');
  await page.locator('#run').click();
  await expect(page.locator('[data-signal="0"]')).toHaveText('Not sampled');
  await expect(page.locator('[data-signal="1"]')).toHaveText('LOW · LED off');
  await page.locator('#lesson-nav a[href="#dimmer"]').click();
  await page.locator('#run').click();
  await expect(page.locator('[data-signal="1"]')).toHaveText('ADC 512/1023');
  await expect(page.locator('[data-signal="2"]')).toHaveText('PWM 127/255');
  await page.locator('#knob').fill('100');
  await expect(page.locator('[data-signal="2"]')).toHaveText('PWM 255/255');
  await page.locator('#run').click();
  await expect(page.locator('[data-signal="2"]')).toHaveText('PWM off');
  await page.locator('#lesson-nav a[href="#servo"]').click();
  await page.locator('#run').click();
  await page.locator('#angle').fill('180');
  await expect(page.locator('[data-signal="0"]')).toContainText('Command 180° · shaft 180°');
  await page.locator('#run').click();
  await expect(page.locator('[data-signal="0"]')).toContainText('Signal off · last shaft 180°');
  await page.locator('#lesson-nav a[href="#parking"]').click();
  await page.locator('#run').click();
  for (const [distance, expected] of [[15, 'R HIGH · A LOW · G LOW'], [40, 'R LOW · A HIGH · G LOW'], [100, 'R LOW · A LOW · G HIGH']]) {
    await page.locator('#distance').fill(String(distance));
    await expect(page.locator('[data-signal="1"]')).toContainText(`${distance.toFixed(1)} cm`);
    await expect(page.locator('[data-signal="2"]')).toHaveText(expected);
  }
  await page.locator('#noEcho').check();
  await expect(page.locator('[data-signal="1"]')).toHaveText('UNKNOWN · no echo');
  await expect(page.locator('[data-signal="2"]')).toHaveText('R LOW · A LOW · G LOW');
  await expect(page.locator('[data-signal="3"]')).toHaveText('All LEDs off');
  await expect(page.locator('[data-signal="4"]')).toHaveText('Tone off');
  await page.locator('#run').click();
  await expect(page.locator('[data-signal="1"]')).toHaveText('Not sampled');
  await expect(page.locator('[data-signal="3"]')).toHaveText('All LEDs off');
});

test('primary drag pans without selecting and desktop focus reuses live controls', async ({ page }, testInfo) => {
  await page.goto('#dimmer');
  await page.getByRole('tab', { name: 'Parts', exact: true }).click();
  await page.locator('#detail-panel [data-part="knob"]').click();
  await expect(page.locator('#component-name')).toHaveText('Potentiometer');
  const canvas = page.locator('#scene canvas');
  const bounds = await canvas.boundingBox();
  const before = await canvas.screenshot();
  const x = bounds.x + bounds.width * 0.65;
  const y = bounds.y + bounds.height * 0.7;
  if (testInfo.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y: y - 25 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 70, y - 30, { steps: 8 });
    await page.mouse.up();
  }
  await page.waitForTimeout(300);
  const after = await canvas.screenshot();
  expect(before.equals(after)).toBe(false);
  await expect(page.locator('#component-name')).toHaveText('Potentiometer');
  await page.locator('#reset-view').click();
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('#focus-toggle')).toBeHidden();
    return;
  }
  await page.locator('#run').click();
  await page.locator('#knob').fill('80');
  await page.locator('#focus-toggle').click();
  await expect(page.locator('.workspace')).toHaveClass(/focus-layout/);
  await expect(page.locator('.lab-layout > .code-card')).toHaveCount(1);
  await expect(page.locator('#run')).toHaveCount(1);
  await expect(page.locator('.focus-run-slot #run')).toHaveText('Stop experiment');
  const circuit = await page.locator('.scene-card').boundingBox();
  const sketch = await page.locator('.code-card').boundingBox();
  expect(Math.abs(circuit.y - sketch.y)).toBeLessThan(3);
  expect(sketch.x).toBeGreaterThan(circuit.x + circuit.width - 1);
  await expect(page.locator('#monitor-log')).toContainText('80% brightness');
  await page.locator('#run').click();
  await expect(page.locator('#monitor-state')).toHaveText('IDLE');
  await page.locator('#next-lesson').click();
  await expect(page.locator('#sketch')).toContainText('Servo');
  await page.locator('#focus-toggle').click();
  await expect(page.locator('.bottom-layout > .code-card')).toHaveCount(1);
  await expect(page.locator('.experiment #run')).toHaveCount(1);
  await page.locator('#focus-toggle').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.workspace')).not.toHaveClass(/focus-layout/);
  await expect(page.locator('.bottom-layout > .code-card')).toHaveCount(1);
  await expect(page.locator('.experiment #run')).toHaveCount(1);
});

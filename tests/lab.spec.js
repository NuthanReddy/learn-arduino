import { test, expect } from '@playwright/test';
import { simulate } from '../src/lessons.js';

test('simulation handles blink timing, pull-up input, PWM endpoints and light thresholds', () => {
  const state = { running: true, interval: 500, pressed: false, knob: 0, light: 0, threshold: 400, angle: 180 };
  expect(simulate('blink', state, 499).led).toBe(1);
  expect(simulate('blink', state, 500).led).toBe(0);
  expect(simulate('blink', state, 1000).led).toBe(1);
  expect(simulate('button', state, 0)).toMatchObject({ led: 0, digital: 'HIGH' });
  expect(simulate('button', { ...state, pressed: true }, 0)).toMatchObject({ led: 1, digital: 'LOW' });
  expect(simulate('dimmer', state, 0)).toMatchObject({ analog: 0, pwm: 0 });
  expect(simulate('dimmer', { ...state, knob: 100 }, 0)).toMatchObject({ analog: 1023, pwm: 255 });
  expect(simulate('light', state, 0).led).toBe(1);
  expect(simulate('light', { ...state, light: 100 }, 0).led).toBe(0);
  expect(simulate('light', { ...state, threshold: 0 }, 0).led).toBe(0);
  expect(simulate('servo', state, 0).angle).toBe(180);
  for (const id of ['board', 'blink', 'button', 'dimmer', 'servo', 'light']) {
    expect(simulate(id, { ...state, running: false }, 0).led).toBe(0);
  }
});

test('board renders, components are accessible, completion persists and view controls work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('');
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#scene-error')).toBeHidden();
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
  await expect(page.locator('#progress-count')).toHaveText('1 / 6');
  await page.reload();
  await expect(page.locator('#progress-count')).toHaveText('1 / 6');
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
  await page.locator('a[href="#button"]').click();
  await expect(page.locator('#monitor-state')).toHaveText('IDLE');
  await page.locator('#run').click();
  await page.locator('#press-button').click();
  await expect(page.locator('#monitor-log')).toContainText('D2 LOW → LED on');
  await page.locator('#press-button').click();
  await expect(page.locator('#monitor-log')).toContainText('D2 HIGH → LED off');
  await page.locator('a[href="#dimmer"]').click();
  await page.locator('#run').click();
  await page.locator('#knob').fill('100');
  await expect(page.locator('#monitor-log')).toContainText('PWM 255/255');
  await page.locator('#knob').fill('0');
  await expect(page.locator('#monitor-log')).toContainText('0% brightness');
  await page.locator('a[href="#servo"]').click();
  await page.locator('#run').click();
  await page.locator('#angle').fill('180');
  await expect(page.locator('#monitor-log')).toContainText('180°');
  await expect(page.locator('#sketch')).toContainText('arm.write(180)');
  await page.locator('a[href="#light"]').click();
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

test('all six lessons complete and copy failure gives manual instructions', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => { throw new Error('Clipboard permission denied'); } },
    });
  });
  await page.goto('');
  await page.locator('#copy-code').click();
  await expect(page.locator('#toast')).toContainText('copy it manually');
  for (const [id, answer] of [['board', 1], ['blink', 2], ['button', 0], ['dimmer', 2], ['servo', 1], ['light', 0]]) {
    await expect(page.locator(`a[href="#${id}"].lesson-link`)).toHaveAttribute('aria-current', 'step');
    await page.locator('#run').click();
    await page.locator(`[data-answer="${answer}"]`).click();
    await page.locator('#complete').click();
  }
  await expect(page.locator('#progress-count')).toHaveText('6 / 6');
  await expect(page.locator('#complete')).toHaveText('Path complete');
  await page.reload();
  await expect(page.locator('#progress-count')).toHaveText('6 / 6');
});

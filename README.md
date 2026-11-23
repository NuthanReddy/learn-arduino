# Learn Arduino

An original, browser-based electronics learning lab with a real WebGL 3D board and six hands-on experiments.

**Live site:** https://nuthanreddy.github.io/learn-arduino/

Explore board components, blink an LED, read a button, adjust PWM brightness, position a servo, and build a sensor-driven night light. Each lesson includes written wiring instructions, a responsive live monitor, an Arduino example sketch, and a knowledge check. Progress is saved locally in your browser.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Visit the URL printed by Vite under `/learn-arduino/`. Build with `npm run build`; serve the production build with `npm run preview`.

## Verify

```sh
npm run build
npm test
```

Browser tests use an installed Microsoft Edge and cover desktop/mobile layouts, 3D controls, all six experiments, progress persistence, keyboard tabs, and the WebGL-unavailable fallback. Tests are local; the deployment workflow builds and publishes the site.

## Publish

GitHub Pages must use **GitHub Actions** as its source. Push to `main` to run `.github/workflows/pages.yml`. Vite uses the `/learn-arduino/` base path, so all bundled assets work on project Pages. No backend, credentials, or paid services are required.

## Scope and safety

This is an educational **guided simulation**, not an Arduino compiler or electrical circuit solver. Controls drive the illustrated behavior and update the example sketch; they do not upload to real hardware. The original procedural geometry is simplified and not to scale. Follow the written wiring instructions rather than treating the model as a construction diagram. Disconnect power while wiring; LEDs need current-limiting resistors and motors need suitable power supplies.

Code, geometry, design, and lesson prose were created independently. The project is inspired by the general idea of interactive electronics education, not a reproduction of the reference website's source or assets. Arduino is a trademark of its respective owner; this project is not affiliated with or endorsed by Arduino.

Built with Vite and Three.js. Typography uses Google Fonts with system-font fallbacks.

# Learn Arduino

An original, browser-based electronics learning lab with a real WebGL 3D board and sixteen hands-on experiments.

**Live site:** https://nuthanreddy.github.io/learn-arduino/

Explore board components, blink an LED, read a button, adjust PWM brightness, position a servo, and build a sensor-driven night light. Continue with RGB mixing, ultrasonic ranging, a piezo buzzer, a four-key piano, a driven DC motor, temperature sensing, a geared stepper, soil moisture, force-sensitive input, and a three-zone parking guide.

Each lesson has original wiring instructions, an interactive connection diagram, an Arduino sketch, adjustable inputs, visible 3D outputs, and a knowledge check. The live monitor retains its last sixteen samples when stopped. The pinout and specifications tabs explain the Uno R3's connections and limitations. Copy, expand, or download sketches as `.ino` files.

Existing six-lesson completion data is preserved. Completed lessons can be continued without retaking their checks, the last visited lesson resumes on return, and previous/next navigation allows exploration in any order. Progress stays in your browser; it is not account-synchronized.

The 3D camera fits the current circuit on navigation, reset, and resize. Primary mouse/touch drag pans; right-drag or the rotate buttons orbit; pinch or scroll zooms. Focus the view and use **WASD** to pan, **Q/E** to rotate, **+/−** to zoom, and **0** to reset. Select a stage label, click a component without dragging, or select a diagram connection to inspect it. Each diagram connection shows its own sampled input, commanded output, or explicit inactive/unknown state from the same model as the monitor.

On desktop widths of at least 1,100 pixels, **Focus workbench** puts the existing circuit and sketch side by side and moves the same run/stop button next to the sketch. Lesson navigation stays reachable. Returning to the guided layout or a narrow screen restores the original responsive order without restarting the experiment or duplicating state.

Browser sound is muted until explicitly enabled, stops with the experiment, and is silenced while the page is hidden. Reduced motion honors the operating system preference and can also be toggled.

## Home automation library

Open **Home automation** in the sidebar or visit the [collection directly](https://nuthanreddy.github.io/learn-arduino/#home-automation). Six entries cover PIR motion, magnetic door/window contacts, leak sensing, the existing TMP36, a low-voltage lamp/relay module, and a driven DC fan. Working motion-to-light, contact-to-indicator, leak-to-warning, and temperature-to-fan examples show sampled inputs, output commands, and original Arduino sketches.

The collection reuses the existing temperature conversion and links back to input, LED, moisture, and motor lessons. It does not add required lessons or change saved progress. All examples are simulated and low-voltage DC only, with no mains wiring or real device access.

The downloadable [component guide](public/home-automation-guide.md) lists the actual entries, public deep links, connection assumptions, and limitations. Vite publishes the same file at `/learn-arduino/home-automation-guide.md`.

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

Browser tests use an installed Microsoft Edge and cover desktop/mobile layouts, all sixteen lessons, legacy progress, PWM integer mapping, held servo position, capstone thresholds and missing echoes, interactive diagrams, keyboard camera controls, trace retention, deliberate audio activation/muting, sketch export, and the WebGL-unavailable fallback. Tests are local; the deployment workflow builds and publishes the site.

## Publish

GitHub Pages must use **GitHub Actions** as its source. Push to `main` to run `.github/workflows/pages.yml`. Vite uses the `/learn-arduino/` base path, so all bundled assets work on project Pages. No backend, credentials, or paid services are required.

## Scope and safety

This is an educational **guided simulation**, not an Arduino compiler or electrical circuit solver. Controls drive the illustrated behavior and update the example sketch; they do not upload to real hardware. The original procedural geometry is simplified and not to scale. Follow the written wiring instructions and component datasheets rather than treating the model as a construction diagram. Disconnect power while wiring; LEDs need current-limiting resistors and motors need suitably rated drivers and power supplies.

Motor speed is relative drive, not calibrated RPM. Stepper position is a commanded open-loop estimate. Soil and force inputs are illustrative, not calibrated physical measurements. The parking lesson is not a vehicle safety system. The lab is English-only and does not claim localization parity with another website.

Code, geometry, design, and lesson prose were created independently. The project is inspired by the general idea of interactive electronics education, not a reproduction of the reference website's source or assets. Arduino is a trademark of its respective owner; this project is not affiliated with or endorsed by Arduino.

Built with Vite and Three.js. Typography uses Google Fonts with system-font fallbacks.

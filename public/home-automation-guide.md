# Home automation component guide

Open the [Home automation library](https://nuthanreddy.github.io/learn-arduino/#home-automation) in the Learn Arduino lab.

This original starter collection connects six practical sensors and outputs to four interactive examples. Everything runs in the browser: no real devices, network services, accounts, or household wiring are accessed. The collection is separate from the existing 16-lesson path and does not change saved completion.

## Components and examples

| Library item | What it reads or drives | See it in use | Related existing lesson |
|---|---|---|---|
| PIR motion sensor | Illustrative digital motion output: HIGH when motion is detected | [Motion turns on a low-voltage light](https://nuthanreddy.github.io/learn-arduino/#home-automation/motion) | [Digital inputs](https://nuthanreddy.github.io/learn-arduino/#button) |
| Magnetic door/window contact | A dry contact with INPUT_PULLUP: closed is LOW, open is HIGH | [Opening a contact lights an indicator](https://nuthanreddy.github.io/learn-arduino/#home-automation/contact) | [Pull-up button](https://nuthanreddy.github.io/learn-arduino/#button) |
| Water leak sensor module | Illustrative digital wet/dry output, assuming HIGH means wet | [Water detection lights a warning indicator](https://nuthanreddy.github.io/learn-arduino/#home-automation/leak) | [Moisture sensing](https://nuthanreddy.github.io/learn-arduino/#soil) |
| TMP36 temperature sensor | Analog voltage converted to a quantized ADC reading and estimated degrees Celsius | [Warm air triggers a fan](https://nuthanreddy.github.io/learn-arduino/#home-automation/temperature) | [Full temperature lesson](https://nuthanreddy.github.io/learn-arduino/#temperature) |
| Low-voltage DC lamp and relay module | A compatible active-HIGH module input switches a separate DC lamp supply | [Motion switches the lamp](https://nuthanreddy.github.io/learn-arduino/#home-automation/lamp) | [Digital output fundamentals](https://nuthanreddy.github.io/learn-arduino/#blink) |
| Low-voltage DC fan and motor driver | A driver switches a separately powered small fan; an I/O pin supplies only the command | [Temperature controls the fan](https://nuthanreddy.github.io/learn-arduino/#home-automation/fan) | [Motor driver lesson](https://nuthanreddy.github.io/learn-arduino/#motor) |

## Try the input-to-output examples

1. Select an item and press **Start example**.
2. Change its input: toggle motion, open the contact, wet the virtual probe, or adjust room temperature.
3. Compare the input and D9 output command with the illustrated room and example Arduino sketch.
4. Press **Stop example**. D9 goes LOW, the output turns off, and the input is marked **Not sampled**. **Reset inputs** also stops the example and restores the default conditions.

The motion, contact, and leak examples assume an active-HIGH output module: detected input drives D9 HIGH. The relay example uses a ready-made module with a suitable coil driver, not a bare coil driven from an I/O pin.

The fan example defaults to a 28°C turn-on threshold. It turns on when the **ADC-derived estimated temperature** is at or above the chosen threshold, and turns off below it. The same TMP36 conversion is shared with the existing temperature lesson:

```text
volts = ADC × 5 / 1023
estimated °C = (volts − 0.5) × 100
```

The estimated value can differ slightly from the slider because the ADC has discrete steps. The starter example has no hysteresis; a practical controller should account for noise and prevent rapid switching around its threshold.

## Low-voltage connection reference

- **PIR:** module OUT to D2, compatible rated DC supply, common GND. Real modules require warm-up and can hold their output after motion.
- **Magnetic contact:** dry contact between D2 and GND; configure INPUT_PULLUP. Real contacts may need debouncing.
- **Leak module:** compatible digital output to D2, rated DC supply, common GND. Check actual wet/dry polarity and calibrate the module's threshold.
- **TMP36:** rated supply and GND, output to A0. Check the exact package datasheet before connecting it.
- **Lamp/relay module:** D9 to a compatible active-HIGH logic input; use rated module power and a separate, appropriately protected low-voltage DC lamp supply. The example uses COM and normally-open contacts. Never drive a bare relay coil from an Arduino pin.
- **Fan:** D9 to a suitably rated driver input; external low-voltage fan supply and common signal ground. Follow the fan and driver manufacturer's protection requirements. Never power a fan from an I/O pin.

## Boundaries and safety

Use **low-voltage DC only**. This guide deliberately excludes mains wiring and real device control.

The examples are guided logical simulations, not electrical circuit solvers or compiled Arduino programs. They do not model current, component heating, supply limits, relay isolation, motor RPM, sensor failures, PIR timing, contact bounce, or water conductivity. Verify module polarity, voltage compatibility, load ratings, protection, and startup behavior using the exact component documentation.

Do not use the examples as security, flood-protection, life-safety, or automatic shutoff systems. Disconnect power before changing real low-voltage wiring.

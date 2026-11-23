import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { lessons, components } from './lessons.js';

export function createLab(host, onSelect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eef2ec');
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D circuit. Drag to orbit, pinch or scroll to zoom. Use the view buttons or component list for keyboard access.');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.tabIndex = 0;
  host.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minDistance = 7;
  controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0.7, 0, 0);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x718876, 2.7);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 4);
  sun.position.set(-4, 10, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
  const teal = material('#147f79');
  const black = material('#252e32');
  const metal = material('#b5c1c5', { metalness: 0.75, roughness: 0.3 });
  const gold = material('#c1ab64', { metalness: 0.5 });
  const ivory = material('#e8e7dc');
  const objects = new THREE.Group();
  scene.add(objects);
  const board = new THREE.Group();
  objects.add(board);
  const pickables = [];
  function mesh(geometry, mat, x, y, z, part, parent = board) {
    const obj = new THREE.Mesh(geometry, mat);
    obj.position.set(x, y, z);
    obj.castShadow = true;
    obj.receiveShadow = true;
    parent.add(obj);
    if (part) {
      obj.userData.part = part;
      pickables.push(obj);
    }
    return obj;
  }
  function box(w, h, d, mat, x, y, z, part, parent) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, part, parent);
  }
  function cylinder(r, h, mat, x, y, z, part, parent) {
    return mesh(new THREE.CylinderGeometry(r, r, h, 32), mat, x, y, z, part, parent);
  }
  function label(text, x, y, z, size = 0.38, parent = board) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#e2f4ee';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size * 4, size), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, y, z);
    parent.add(plane);
    return plane;
  }
  const floor = box(200, 0.1, 200, material('#eef2ec'), 0, -0.25, 0, undefined, objects);
  floor.castShadow = false;
  const grid = new THREE.GridHelper(40, 80, '#d5dfd4', '#dfe6dd');
  grid.position.y = -0.19;
  scene.add(grid);
  box(5.8, 0.18, 4.2, teal, -1.5, 0.08, 0, 'board');
  for (const [x, z] of [[-4.12, -1.8], [1.1, -1.8], [-4.12, 1.8], [1.1, 1.8]]) {
    cylinder(0.14, 0.025, metal, x, 0.19, z, 'board');
    cylinder(0.075, 0.032, black, x, 0.205, z, 'board');
  }
  box(1.08, 0.7, 0.95, metal, -4.1, 0.46, -0.65, 'usb');
  box(0.035, 0.44, 0.65, black, -4.66, 0.47, -0.65, 'usb');
  box(0.75, 0.65, 0.7, black, -4.0, 0.43, 0.85, 'usb');
  cylinder(0.23, 0.08, metal, -4, 0.79, 0.85, 'usb');
  box(2.35, 0.3, 0.62, black, -1.25, 0.34, 0.6, 'chip');
  for (let i = 0; i < 14; i++) {
    for (const z of [0.19, 1.01]) box(0.07, 0.12, 0.22, metal, -2.31 + i * 0.164, 0.28, z, 'chip');
  }
  label('ATmega328P', -1.25, 0.5, 0.6, 0.18);
  for (const z of [-1.74, 1.74]) {
    box(4.45, 0.38, 0.32, black, -1.18, 0.37, z, 'pins');
    for (let i = 0; i < 14; i++) {
      box(0.13, 0.015, 0.14, gold, -3.24 + i * 0.316, 0.568, z, 'pins');
      box(0.075, 0.019, 0.08, black, -3.24 + i * 0.316, 0.58, z, 'pins');
    }
  }
  label('DIGITAL  13 ... 0', -1.1, 0.19, -1.38, 0.19);
  label('5V  GND      ANALOG IN', -1.1, 0.19, 1.35, 0.19);
  label('LEARN / LAB', -1.4, 0.2, -0.35, 0.46);
  label('UNO-STYLE · 5V', -1.4, 0.2, -0.87, 0.2);
  for (const x of [-3.4, -2.9]) {
    cylinder(0.15, 0.37, metal, x, 0.35, 0.65, 'board');
    cylinder(0.15, 0.03, black, x, 0.55, 0.65, 'board');
  }
  box(0.4, 0.18, 0.4, metal, -3.3, 0.27, -0.1, 'board');
  box(0.23, 0.12, 0.23, material('#f3b677'), -3.3, 0.42, -0.1, 'board');
  const powerMat = material('#637652', { emissive: '#8cdd7d', emissiveIntensity: 0 });
  box(0.16, 0.08, 0.2, powerMat, 0.62, 0.23, 0.65, 'board');
  const builtinMat = material('#d0a459', { emissive: '#ffc14a', emissiveIntensity: 0 });
  box(0.16, 0.08, 0.2, builtinMat, 0.62, 0.23, 0.22, 'board');
  label('ON   L', 0.58, 0.19, 0.97, 0.12);
  const circuit = new THREE.Group();
  objects.add(circuit);
  const breadboard = new THREE.Group();
  circuit.add(breadboard);
  box(3.8, 0.24, 4.2, ivory, 4, 0.14, 0, undefined, breadboard);
  box(0.07, 0.018, 3.5, material('#d66656'), 2.38, 0.27, 0, undefined, breadboard);
  box(0.07, 0.018, 3.5, material('#689dbc'), 5.62, 0.27, 0, undefined, breadboard);
  box(0.12, 0.022, 3.5, material('#c9c9be'), 4, 0.27, 0, undefined, breadboard);
  const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.037, 0.037, 0.015, 8), black, 240);
  const dummy = new THREE.Object3D();
  let hole = 0;
  for (let r = 0; r < 24; r++) {
    for (let c = 0; c < 10; c++) {
      dummy.position.set(2.65 + c * 0.27 + (c >= 5 ? 0.27 : 0), 0.273, -1.67 + r * 0.145);
      dummy.updateMatrix();
      holes.setMatrixAt(hole++, dummy.matrix);
    }
  }
  breadboard.add(holes);
  const ledGroup = new THREE.Group();
  circuit.add(ledGroup);
  for (const x of [4.75, 5.0]) cylinder(0.025, 0.58, metal, x, 0.54, -0.65, 'led', ledGroup);
  const ledMat = material('#ae342e', { emissive: '#ff3928', emissiveIntensity: 0, transparent: true, opacity: 0.92, roughness: 0.25 });
  cylinder(0.24, 0.4, ledMat, 4.87, 0.9, -0.65, 'led', ledGroup);
  const dome = mesh(new THREE.SphereGeometry(0.24, 24, 16), ledMat, 4.87, 1.1, -0.65, 'led', ledGroup);
  dome.scale.y = 0.75;
  const ledLight = new THREE.PointLight('#ff4930', 0, 3);
  ledLight.position.set(4.87, 1.3, -0.65);
  ledGroup.add(ledLight);
  const resistorGroup = new THREE.Group();
  circuit.add(resistorGroup);
  const resistor = cylinder(0.12, 0.68, material('#c9b88a'), 3.45, 0.52, -0.65, 'resistor', resistorGroup);
  resistor.rotation.z = Math.PI / 2;
  for (const [x, color] of [[3.22, '#ae4b37'], [3.36, '#ae4b37'], [3.51, '#684c32'], [3.7, '#b9a257']]) {
    const band = cylinder(0.124, 0.045, material(color), x, 0.52, -0.65, 'resistor', resistorGroup);
    band.rotation.z = Math.PI / 2;
  }
  for (const x of [2.95, 3.95]) cylinder(0.018, 0.4, metal, x, 0.4, -0.65, 'resistor', resistorGroup);
  const inputGroup = new THREE.Group();
  circuit.add(inputGroup);
  const buttonGroup = new THREE.Group();
  inputGroup.add(buttonGroup);
  box(0.9, 0.22, 0.9, black, 3.7, 0.43, 0.95, 'button', buttonGroup);
  box(0.78, 0.045, 0.78, metal, 3.7, 0.565, 0.95, 'button', buttonGroup);
  const buttonCap = cylinder(0.25, 0.25, material('#ecac64'), 3.7, 0.71, 0.95, 'button', buttonGroup);
  const knobGroup = new THREE.Group();
  inputGroup.add(knobGroup);
  cylinder(0.5, 0.25, metal, 3.5, 0.48, 0.9, 'knob', knobGroup);
  const knobCap = cylinder(0.35, 0.5, teal, 3.5, 0.85, 0.9, 'knob', knobGroup);
  const marker = box(0.06, 0.025, 0.25, ivory, 0, 0.26, 0.13, 'knob', knobCap);
  const sensorGroup = new THREE.Group();
  inputGroup.add(sensorGroup);
  cylinder(0.36, 0.15, material('#d9a56d'), 3.5, 0.62, 0.9, 'sensor', sensorGroup);
  for (let i = 0; i < 5; i++) box(0.43, 0.01, 0.025, material('#876347'), 3.5, 0.703, 0.65 + i * 0.12, 'sensor', sensorGroup);
  const dividerResistor = cylinder(0.11, 0.55, material('#c9b88a'), 4.75, 0.48, 1.03, 'sensor', sensorGroup);
  dividerResistor.rotation.z = Math.PI / 2;
  const servoGroup = new THREE.Group();
  circuit.add(servoGroup);
  box(1.65, 1.1, 0.9, material('#588eae', { transparent: true, opacity: 0.88 }), 4, 0.85, 0, 'servo', servoGroup);
  box(2.03, 0.12, 0.8, material('#3c6780'), 4, 0.67, 0, 'servo', servoGroup);
  cylinder(0.3, 0.21, metal, 4.43, 1.47, 0, 'servo', servoGroup);
  const arm = new THREE.Group();
  arm.position.set(4.43, 1.62, 0);
  servoGroup.add(arm);
  box(1.8, 0.12, 0.21, ivory, 0.6, 0, 0, 'servo', arm);
  cylinder(0.17, 0.13, ivory, 0, 0, 0, 'servo', arm);
  const extras = {};
  function extra(id) {
    const group = new THREE.Group();
    circuit.add(group);
    extras[id] = group;
    return group;
  }
  const rgbGroup = extra('rgb');
  const rgbMat = material('#a9a9a9', { emissive: '#000000', emissiveIntensity: 1.5 });
  cylinder(0.35, 0.65, rgbMat, 4.8, 0.83, -0.5, 'rgb', rgbGroup);
  mesh(new THREE.SphereGeometry(0.35, 24, 12), rgbMat, 4.8, 1.15, -0.5, 'rgb', rgbGroup).scale.y = 0.6;
  for (let i = 0; i < 3; i++) {
    cylinder(0.025, 0.4, metal, 4.5 + i * 0.2, 0.44, -0.5, 'rgb', rgbGroup);
    const r = cylinder(0.1, 0.55, material('#c9b88a'), 3.1, 0.5, -1 + i * 0.45, 'resistor', rgbGroup);
    r.rotation.z = Math.PI / 2;
  }
  const ultrasonic = extra('ultrasonic');
  box(2.4, 0.12, 1.2, teal, 3.8, 0.5, -0.8, 'ultrasonic', ultrasonic);
  for (const x of [3.15, 4.45]) {
    cylinder(0.43, 0.56, metal, x, 0.83, -0.8, 'ultrasonic', ultrasonic);
    cylinder(0.33, 0.03, black, x, 1.13, -0.8, 'ultrasonic', ultrasonic);
  }
  const obstacle = box(0.3, 1.2, 2.1, material('#d6b075'), 6, 0.65, -0.8, undefined, ultrasonic);
  const buzzer = extra('buzzer');
  cylinder(0.42, 0.55, black, 4.7, 0.58, 1.05, 'buzzer', buzzer);
  cylinder(0.1, 0.02, metal, 4.7, 0.87, 1.05, 'buzzer', buzzer);
  const piano = extra('piano');
  const keys = [];
  for (let i = 0; i < 4; i++) {
    const key = box(0.45, 0.32, 1.15, ivory, 2.8 + i * 0.55, 0.45, -0.7, 'piano', piano);
    keys.push(key);
  }
  const driver = extra('driver');
  box(0.8, 0.25, 0.85, teal, 5.2, 0.4, 1.15, 'driver', driver);
  box(0.45, 0.48, 0.28, black, 5.2, 0.76, 1.15, 'driver', driver);
  const supply = extra('supply');
  box(1.45, 0.7, 0.8, material('#526567'), 3.1, 0.45, 1.65, 'driver', supply);
  label('EXT 5V', 3.1, 0.82, 1.65, 0.18, supply);
  const motor = extra('motor');
  const motorBody = cylinder(0.6, 1.3, metal, 3.4, 0.85, -0.6, 'motor', motor);
  motorBody.rotation.z = Math.PI / 2;
  const wheel = new THREE.Group();
  wheel.position.set(4.2, 0.85, -0.6);
  motor.add(wheel);
  const rim = cylinder(0.8, 0.14, black, 0, 0, 0, 'motor', wheel);
  rim.rotation.z = Math.PI / 2;
  box(0.16, 1.25, 0.13, ivory, 0.09, 0, 0, 'motor', wheel);
  const stepper = extra('stepper');
  cylinder(0.7, 0.6, material('#5a9db0'), 3.4, 0.65, -0.7, 'stepper', stepper);
  const stepArm = new THREE.Group();
  stepArm.position.set(3.4, 1.04, -0.7);
  stepper.add(stepArm);
  cylinder(0.85, 0.08, ivory, 0, 0, 0, 'stepper', stepArm);
  box(0.07, 0.025, 0.7, teal, 0, 0.05, 0.32, 'stepper', stepArm);
  const temp = extra('temperature');
  box(0.52, 0.6, 0.28, black, 3.6, 0.9, 0.3, 'temperature', temp);
  for (let i = 0; i < 3; i++) cylinder(0.025, 0.65, metal, 3.42 + i * 0.18, 0.47, 0.3, 'temperature', temp);
  const soil = extra('soil');
  box(1.2, 0.1, 2.4, teal, 3.25, 0.5, 0, 'soil', soil);
  for (const x of [2.9, 3.25, 3.6]) box(0.16, 0.01, 1.25, gold, x, 0.56, 0.45, 'soil', soil);
  const force = extra('force');
  cylinder(0.67, 0.1, material('#555862'), 3.3, 0.42, 0.55, 'force', force);
  box(0.33, 0.06, 1.5, material('#a17850'), 3.3, 0.39, -0.5, 'force', force);
  const traffic = extra('traffic');
  const trafficMats = [];
  for (const [i, color] of ['#e64e45', '#e8b542', '#5baf6b'].entries()) {
    const mat = material(color, { emissive: color, emissiveIntensity: 0 });
    trafficMats.push(mat);
    cylinder(0.22, 0.45, mat, 2.9 + i * 0.8, 0.75, 0.65, 'traffic', traffic);
    const r = cylinder(0.1, 0.4, material('#c9b88a'), 2.9 + i * 0.8, 0.45, 1.3, 'resistor', traffic);
    r.rotation.z = Math.PI / 2;
  }
  const wires = new THREE.Group();
  circuit.add(wires);
  const flow = [];
  function wire(points, color) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(curve, 40, 0.035, 8, false), material(color), 0, 0, 0, undefined, wires);
    const dot = mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: '#d6ff96' }), 0, 0, 0, undefined, wires);
    flow.push({ curve, dot });
  }
  const disposeGroup = group => {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    group.clear();
  };
  let current = 'board';
  let showFlow = false;
  let lastOutput = { led: 0, angle: 90 };
  let reduceMotion = false;
  let previousTime = 0;
  const markers = [];
  const markerPositions = {
    board: [-1.7, 0.3, -0.2], usb: [-4.1, 0.9, -0.65], chip: [-1.25, 0.7, 0.6], pins: [-1, 0.8, -1.74],
    led: [4.87, 1.6, -0.65], resistor: [3.45, 0.8, -0.65], button: [3.7, 1.1, 0.95],
    knob: [3.5, 1.5, 0.9], sensor: [3.5, 1, 0.9], servo: [4.3, 2.1, 0], rgb: [4.8, 1.7, -0.5],
    ultrasonic: [3.8, 1.6, -0.8], buzzer: [4.7, 1.2, 1.05], piano: [3.6, 1, -0.7],
    driver: [5.2, 1.4, 1.15], motor: [3.4, 1.9, -0.6], stepper: [3.4, 1.4, -0.7],
    temperature: [3.6, 1.5, 0.3], soil: [3.25, 0.9, 0], force: [3.3, 0.9, 0.55], traffic: [3.7, 1.3, 0.65],
  };
  function setLesson(id) {
    current = id;
    circuit.visible = id !== 'board';
    const parts = lessons.find(item => item.id === id).parts;
    breadboard.visible = !['servo', 'motor', 'stepper'].includes(id);
    ledGroup.visible = parts.includes('led');
    resistorGroup.visible = ledGroup.visible;
    buttonGroup.visible = id === 'button';
    knobGroup.visible = id === 'dimmer';
    sensorGroup.visible = id === 'light';
    servoGroup.visible = id === 'servo';
    Object.entries(extras).forEach(([part, group]) => { group.visible = parts.includes(part); });
    supply.visible = ['servo', 'motor', 'stepper'].includes(id);
    disposeGroup(wires);
    flow.length = 0;
    if (['servo', 'motor', 'stepper'].includes(id)) {
      wire([[-1, 0.6, -1.74], [1.6, 1.4, -1.4], [3.7, 0.55, 0.2]], '#e4ad57');
      wire([[-2.6, 0.6, 1.74], [1.3, 0.6, 2], [3.8, 0.55, 0.3]], '#384a4f');
      wire([[3.1, 0.8, 1.65], [4, 1.2, 1.7], [4.3, 0.6, 0.4]], '#d67465');
    } else if (parts.includes('led')) {
      wire([[-1, 0.6, -1.74], [1.5, 1.25, -1.45], [2.95, 0.45, -0.65]], '#e6a35b');
      wire([[3.95, 0.45, -0.65], [4.3, 0.65, -0.65], [4.75, 0.45, -0.65]], '#e6a35b');
      wire([[5, 0.43, -0.65], [5.5, 0.55, 1.75], [1, 0.9, 2.5], [-2.6, 0.6, 1.74]], '#384a4f');
      if (['button', 'dimmer', 'light', 'soil', 'force'].includes(id)) {
        wire([[id === 'button' ? 0.6 : -0.4, 0.6, id === 'button' ? -1.74 : 1.74], [1.6, 0.9, 1], [3.4, 0.43, 1.2]], '#5c9fbd');
        wire([[-2.6, 0.6, 1.74], [1.1, 0.6, 2.2], [3.9, 0.43, 1.3]], '#384a4f');
        if (id !== 'button') wire([[-3.24, 0.6, 1.74], [1, 1, 1.7], [3.15, 0.43, 0.8]], '#d67465');
      }
    } else if (id !== 'board') {
      wire([[-1, 0.6, -1.74], [1.4, 1.1, -1.2], [3.2, 0.55, -0.6]], '#e4ad57');
      wire([[-2.6, 0.6, 1.74], [1.3, 0.65, 1.7], [4.3, 0.4, 0.4]], '#384a4f');
      if (parts.includes('ultrasonic') || id === 'temperature') wire([[-3.24, 0.6, 1.74], [1, 1, 1.7], [3.15, 0.55, -0.3]], '#d67465');
    }
    markers.forEach(marker => marker.element.remove());
    markers.length = 0;
    for (const part of parts) {
      const button = document.createElement('button');
      button.className = 'scene-label';
      button.dataset.part = part;
      button.textContent = components[part].short;
      button.setAttribute('aria-label', `Inspect ${components[part].name}`);
      button.addEventListener('click', () => onSelect(part));
      host.append(button);
      markers.push({ element: button, position: new THREE.Vector3(...markerPositions[part]) });
    }
    reset();
  }
  function reset() {
    const bounds = new THREE.Box3().setFromObject(board);
    objects.updateMatrixWorld(true);
    if (circuit.visible) {
      circuit.traverseVisible(obj => {
        if (!obj.geometry) return;
        obj.geometry.computeBoundingBox();
        bounds.union(obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld));
      });
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const direction = new THREE.Vector3(10.5, 12, 13.5).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const corner = new THREE.Vector3(x, y, z).sub(center);
      const depth = corner.dot(direction);
      distance = Math.max(distance, depth + Math.abs(corner.dot(right)) / (tan * camera.aspect), depth + Math.abs(corner.dot(up)) / tan);
    }
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(direction, Math.max(controls.minDistance, distance * 1.13));
    controls.update();
  }
  reset();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down;
  renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables).filter(hit => {
      let obj = hit.object;
      while (obj) {
        if (!obj.visible) return false;
        obj = obj.parent;
      }
      return true;
    });
    if (hits[0]) onSelect(hits[0].object.userData.part);
  });
  const observer = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    reset();
  });
  observer.observe(host);
  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    host.dispatchEvent(new CustomEvent('lab-error', { detail: 'The 3D graphics context was lost. Reload the page to restore the view. Lesson controls still work.' }));
  });
  renderer.setAnimationLoop(time => {
    const delta = Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    if (!host.clientWidth || !host.clientHeight) return;
    controls.update();
    flow.forEach(({ curve, dot }, i) => {
      dot.visible = showFlow && lastOutput.running;
      dot.position.copy(curve.getPoint(((reduceMotion ? 0 : time / 1800) + i / 3) % 1));
    });
    if (!reduceMotion) wheel.rotation.x += delta * (lastOutput.motorPwm || 0) / 255 * 8;
    const occupied = [];
    markers.forEach(marker => {
      const position = marker.position.clone().project(camera);
      marker.element.hidden = position.z > 1 || Math.abs(position.x) > 0.95 || Math.abs(position.y) > 0.95;
      if (marker.element.hidden) return;
      const width = marker.element.offsetWidth;
      const height = marker.element.offsetHeight;
      const x = THREE.MathUtils.clamp((position.x + 1) / 2 * host.clientWidth, width / 2 + 8, host.clientWidth - width / 2 - 8);
      const anchor = (1 - position.y) / 2 * host.clientHeight;
      let top = anchor;
      for (const rect of occupied) {
        if (x + width / 2 > rect.left && x - width / 2 < rect.right && top > rect.top - 5 && top - height < rect.bottom + 5) {
          top = rect.top - 6;
        }
      }
      top = Math.max(height + 55, top);
      occupied.push({ left: x - width / 2, right: x + width / 2, top: top - height, bottom: top });
      marker.element.style.left = `${x}px`;
      marker.element.style.top = `${top}px`;
      marker.element.style.setProperty('--stem-height', `${Math.max(12, anchor - top + 12)}px`);
    });
    renderer.render(scene, camera);
  });
  function pan(x, z) {
    const offset = new THREE.Vector3(x, 0, z).multiplyScalar(0.45);
    const target = controls.target.clone().add(offset);
    target.x = THREE.MathUtils.clamp(target.x, -6, 6);
    target.z = THREE.MathUtils.clamp(target.z, -6, 6);
    camera.position.add(target.clone().sub(controls.target));
    controls.target.copy(target);
    controls.update();
  }
  function rotate(direction) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 8);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    offset.multiplyScalar(factor);
    offset.setLength(THREE.MathUtils.clamp(offset.length(), controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  renderer.domElement.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    const actions = {
      w: () => pan(0, -1), a: () => pan(-1, 0), s: () => pan(0, 1), d: () => pan(1, 0),
      q: () => rotate(-1), e: () => rotate(1), '+': () => zoom(0.85), '=': () => zoom(0.85),
      '-': () => zoom(1.15), '0': reset,
    };
    if (actions[key]) { event.preventDefault(); actions[key](); }
  });
  return {
    setLesson,
    update(output, state) {
      lastOutput = { ...output, running: state.running };
      powerMat.emissiveIntensity = state.running ? 1.8 : 0;
      builtinMat.emissiveIntensity = current === 'board' ? output.led * 2 : 0;
      ledMat.emissiveIntensity = output.led * 2.8;
      ledLight.intensity = output.led * 2;
      buttonCap.position.y = state.pressed ? 0.63 : 0.71;
      knobCap.rotation.y = -(state.knob / 100) * Math.PI * 1.5;
      arm.rotation.y = -THREE.MathUtils.degToRad(output.angle - 90);
      rgbMat.color.setRGB(...output.rgb.map(value => value / 255), THREE.SRGBColorSpace);
      rgbMat.emissive.copy(rgbMat.color);
      obstacle.position.x = 5.4 + state.distance / 200 * 1.8;
      keys.forEach((key, index) => {
        key.position.y = state.note === index ? 0.34 : 0.45;
        key.material = state.note === index ? teal : ivory;
      });
      stepArm.rotation.y = -output.steps * Math.PI * 2 / 2048;
      trafficMats.forEach((mat, index) => { mat.emissiveIntensity = state.running && !state.noEcho && output.zone === ['STOP', 'CAUTION', 'CLEAR'][index] ? 2.8 : 0; });
      buzzer.scale.y = output.frequency && !reduceMotion ? 1 + Math.sin(performance.now() / 50) * 0.05 : 1;
    },
    flow(value) { showFlow = value; },
    reset,
    rotate,
    zoom,
    motion(value) {
      reduceMotion = value;
      controls.enableDamping = !value;
    },
  };
}

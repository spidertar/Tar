'use strict';

// ---------- DOM helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const ui = {
  container: $('#globe-container'),
  drawer: $('#drawer'),
  drawerToggle: $('#drawer-toggle'),
  drawerClose: $('#drawer-close'),
  search: $('#search'),
  showCivil: $('#show-civil'),
  showMil: $('#show-mil'),
  showUav: $('#show-uav'),
  interval: $('#interval'),
  intervalLabel: $('#interval-label'),
  cockpitFollow: $('#cockpit-follow'),
  selectedDetails: $('#selected-details'),
  focusBtn: $('#focus-btn'),
  clearBtn: $('#clear-btn'),
  tooltip: $('#tooltip'),
  snackbar: $('#snackbar')
};

// ---------- Three.js / Globe ----------
let renderer, camera, scene, controls, globe;
let animationFrameId = null;
let raycaster = new THREE.Raycaster();
let mouseNdc = new THREE.Vector2();
let lastPointerEvent = null;

const CAMERA_DEFAULT_POS = new THREE.Vector3(0, 0, 380);
const CAMERA_MIN_DIST = 120;
const CAMERA_MAX_DIST = 1200;

const STATE = {
  flights: [],
  filteredFlights: [],
  selected: null,
  updateTimer: null,
  updateSeconds: 20,
  followCockpit: false
};

init();
start();

function init() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.copy(CAMERA_DEFAULT_POS);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  ui.container.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = CAMERA_MIN_DIST;
  controls.maxDistance = CAMERA_MAX_DIST;

  // Lights
  const ambLight = new THREE.AmbientLight(0xffffff, 0.45);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(-2, 1, 1);
  scene.add(ambLight, dirLight);

  // Globe
  globe = new ThreeGlobe()
    .globeImageUrl('https://unpkg.com/three-globe@2.33.7/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe@2.33.7/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe@2.33.7/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereAltitude(0.25)
    .atmosphereColor('#43d9c0')
    .pointsData([])
    .pointAltitude(f => altitudeToGlobeRadius(f))
    .pointColor(f => flightColor(f))
    .pointRadius(0.45)
    .pointsMerge(false); // keep separate meshes for picking

  scene.add(globe);

  // Use built-in hover/click
  globe.onPointHover((p) => {
    if (!lastPointerEvent) return;
    if (p) {
      ui.tooltip.classList.remove('hidden');
      ui.tooltip.style.left = `${lastPointerEvent.clientX}px`;
      ui.tooltip.style.top = `${lastPointerEvent.clientY}px`;
      ui.tooltip.innerHTML = tooltipHtml(p);
    } else {
      ui.tooltip.classList.add('hidden');
    }
  });
  globe.onPointClick((p, ev) => {
    if (p) selectFlight(p);
  });

  // Events
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  // click handled by globe.onPointClick

  // Drawer UI
  ui.drawerToggle.addEventListener('click', () => ui.drawer.classList.toggle('closed'));
  ui.drawerClose.addEventListener('click', () => ui.drawer.classList.add('closed'));

  ui.interval.addEventListener('input', () => {
    STATE.updateSeconds = Number(ui.interval.value);
    ui.intervalLabel.textContent = `${STATE.updateSeconds}s`;
    scheduleAutoUpdate();
  });
  ui.search.addEventListener('input', applyFiltersAndRender);
  ui.showCivil.addEventListener('change', applyFiltersAndRender);
  ui.showMil.addEventListener('change', applyFiltersAndRender);
  ui.showUav.addEventListener('change', applyFiltersAndRender);
  ui.cockpitFollow.addEventListener('change', () => {
    STATE.followCockpit = ui.cockpitFollow.checked;
    if (!STATE.followCockpit) resetCameraTarget();
  });

  ui.focusBtn.addEventListener('click', focusOnSelected);
  ui.clearBtn.addEventListener('click', clearSelection);
}

function start() {
  animate();
  scheduleAutoUpdate();
  void updateFlights();
}

function animate(time) {
  animationFrameId = requestAnimationFrame(animate);
  TWEEN.update(time);

  if (STATE.followCockpit && STATE.selected) {
    updateCockpitView(STATE.selected);
  }

  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---------- Data ----------
async function updateFlights() {
  try {
    const url = 'https://opensky-network.org/api/states/all';
    const headers = getOpenSkyHeaders();
    const res = await fetchWithTimeout(url, { timeoutMs: 8000, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const now = Date.now();

    const flights = (data.states || []).map(row => toFlight(row, data.time, now)).filter(f => Number.isFinite(f.lat) && Number.isFinite(f.lng));
    STATE.flights = flights;
    applyFiltersAndRender();
  } catch (err) {
    console.warn('OpenSky error:', err);
    showSnack('نمی‌توانم به OpenSky وصل شوم. حالت دمو فعال شد.');
    if (STATE.flights.length === 0) {
      STATE.flights = demoFlights();
      applyFiltersAndRender();
    }
  }
}

function toFlight(row, serverTimeSec, nowMs) {
  const [icao24, callsign, originCountry, timePosition, lastContact, longitude, latitude, baroAltitude, onGround, velocity, heading, verticalRate, sensors, geoAltitude, squawk, spi, positionSource, category] = row;
  const id = icao24 || `${latitude},${longitude},${lastContact}`;
  const call = (callsign || '').trim();
  return {
    id,
    icao24: icao24 || '',
    callsign: call,
    originCountry: originCountry || '',
    lastContact: lastContact || serverTimeSec || Math.round(nowMs / 1000),
    lat: Number(latitude),
    lng: Number(longitude),
    baroAltitude: baroAltitude ?? null,
    geoAltitude: geoAltitude ?? null,
    onGround: !!onGround,
    velocity: velocity ?? null,
    heading: heading ?? null,
    verticalRate: verticalRate ?? null,
    squawk: squawk ?? null,
    category: category ?? null,
    kind: classifyFlight(call, icao24, originCountry, category)
  };
}

function classifyFlight(callsign, icao24, originCountry, category) {
  const call = (callsign || '').toUpperCase();
  const isMilByCall = /\b(AM[W]\d|RCH|QID|LAGR|SHELL|NOBLE|PAT|KNIGHT|REACH|KING|AE\d|NATO|HOMER|SNAKE|BALE|ETHYL|TEXACO|MAMBO|GNAW)\b/.test(call);
  const isUavByCall = /(UAV|DRONE|RQ-|MQ-|U-\d)/.test(call);
  const isMilByCat = category === 6 || category === 7; // OpenSky categories (heuristic)
  const isUavByCat = category === 4; // light/ultralight/UAV bucket (very rough)

  if (isUavByCall || isUavByCat) return 'uav';
  if (isMilByCall || isMilByCat) return 'mil';
  return 'civil';
}

function altitudeToGlobeRadius(f) {
  const altMeters = (f.geoAltitude ?? f.baroAltitude ?? 0) || 0;
  const clamped = Math.max(0, Math.min(12000, altMeters));
  return 0.02 + (clamped / 12000) * 0.12; // 0.02..0.14 globe-relative
}

function flightColor(f) {
  if (f.kind === 'mil') return '#f59e0b'; // amber
  if (f.kind === 'uav') return '#ef4444'; // red
  return '#2dd4bf'; // teal
}

function applyFiltersAndRender() {
  const q = ui.search.value.trim().toLowerCase();
  const showCivil = ui.showCivil.checked;
  const showMil = ui.showMil.checked;
  const showUav = ui.showUav.checked;

  let arr = STATE.flights;
  if (q) {
    arr = arr.filter(f => (f.callsign || '').toLowerCase().includes(q) || (f.icao24 || '').toLowerCase().includes(q));
  }
  arr = arr.filter(f => (f.kind === 'civil' && showCivil) || (f.kind === 'mil' && showMil) || (f.kind === 'uav' && showUav));

  STATE.filteredFlights = arr;
  globe.pointsData(arr);

  // if selection is filtered out, clear it
  if (STATE.selected && !arr.some(f => f.id === STATE.selected.id)) {
    clearSelection();
  }
}

function scheduleAutoUpdate() {
  if (STATE.updateTimer) clearInterval(STATE.updateTimer);
  STATE.updateTimer = setInterval(() => void updateFlights(), STATE.updateSeconds * 1000);
}

// ---------- Interaction / picking ----------
function onPointerMove(ev) {
  lastPointerEvent = ev;
  // position is used by globe.onPointHover
}

function tooltipHtml(f) {
  return `<b>${escapeHtml(f.callsign || f.icao24 || 'ناشناس')}</b><br/>`
       + `${escapeHtml(f.originCountry || '')}<br/>`
       + `سرعت: ${fmt(f.velocity, 'm/s')} | ارتفاع: ${fmt(f.geoAltitude ?? f.baroAltitude, 'm')}<br/>`
       + `<span style="color:${flightColor(f)}">${labelKind(f.kind)}</span>`;
}

function labelKind(kind) {
  if (kind === 'mil') return 'نظامی (تخمینی)';
  if (kind === 'uav') return 'UAV (محدود)';
  return 'غیرنظامی';
}

function selectFlight(f) {
  STATE.selected = f;
  ui.selectedDetails.textContent = formatDetails(f);
  ui.focusBtn.disabled = false;
  ui.clearBtn.disabled = false;
  if (ui.cockpitFollow.checked) STATE.followCockpit = true;
}

function focusOnSelected() {
  if (!STATE.selected) return;
  flyToLatLng(STATE.selected.lat, STATE.selected.lng, 280);
}

function clearSelection() {
  STATE.selected = null;
  ui.selectedDetails.textContent = 'هیچ پروازی انتخاب نشده است.';
  ui.focusBtn.disabled = true;
  ui.clearBtn.disabled = true;
  STATE.followCockpit = false;
  ui.cockpitFollow.checked = false;
  resetCameraTarget();
}

function resetCameraTarget() {
  new TWEEN.Tween(controls.target).to({ x: 0, y: 0, z: 0 }, 600).easing(TWEEN.Easing.Cubic.Out).start();
}

function flyToLatLng(lat, lng, distance = 300) {
  const { x, y, z } = coordsOnGlobe(lat, lng, 1.35); // slightly above surface
  const target = new THREE.Vector3(x, y, z);
  const dir = target.clone().normalize().multiplyScalar(distance);

  new TWEEN.Tween(controls.target)
    .to({ x: target.x, y: target.y, z: target.z }, 900)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();

  new TWEEN.Tween(camera.position)
    .to({ x: dir.x, y: dir.y, z: dir.z }, 900)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
}

function updateCockpitView(f) {
  // Camera positioned slightly behind the aircraft, looking forward along heading
  const radius = 1.35; // just above surface
  const coords = coordsOnGlobe(f.lat, f.lng, radius);
  const posVec = new THREE.Vector3(coords.x, coords.y, coords.z);

  // derive forward vector from heading on tangent plane
  const headingRad = (Number(f.heading) || 0) * Math.PI / 180;
  const up = posVec.clone().normalize();
  // Tangent basis
  const east = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), up).normalize();
  const north = new THREE.Vector3().crossVectors(up, east).normalize();
  const forward = new THREE.Vector3()
    .addScaledVector(north, Math.cos(headingRad))
    .addScaledVector(east, Math.sin(headingRad))
    .normalize();

  const camTarget = posVec.clone();
  const camPos = posVec.clone().addScaledVector(forward, -4).addScaledVector(up, 1.2).multiplyScalar(210);

  controls.target.copy(camTarget);
  camera.position.lerp(camPos, 0.25);
}

function coordsOnGlobe(lat, lng, altitude = 1) {
  if (typeof globe.getCoords === 'function') {
    return globe.getCoords(lat, lng, altitude);
  }
  const radius = (typeof globe.getGlobeRadius === 'function' ? globe.getGlobeRadius() : 100) * altitude;
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (180 - lng) * Math.PI / 180;
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

// ---------- Utils ----------
async function fetchWithTimeout(resource, options = {}) {
  const { timeoutMs = 10000, headers, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...rest, headers, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function demoFlights() {
  return [
    { id: 'demo1', icao24: 'abcd12', callsign: 'UAE123', originCountry: 'United Arab Emirates', lastContact: Date.now()/1000, lat: 25.1972, lng: 55.2744, geoAltitude: 9000, baroAltitude: 8800, onGround: false, velocity: 240, heading: 310, verticalRate: 0, squawk: '7000', category: 3, kind: 'civil' },
    { id: 'demo2', icao24: 'mil001', callsign: 'RCH221', originCountry: 'United States', lastContact: Date.now()/1000, lat: 52.3086, lng: 4.7639, geoAltitude: 7000, baroAltitude: 6900, onGround: false, velocity: 210, heading: 180, verticalRate: 0, squawk: null, category: 6, kind: 'mil' },
    { id: 'demo3', icao24: 'uav01', callsign: 'RQ-4', originCountry: 'United States', lastContact: Date.now()/1000, lat: 35.214, lng: -106.653, geoAltitude: 15000, baroAltitude: 14900, onGround: false, velocity: 190, heading: 95, verticalRate: 0, squawk: null, category: 4, kind: 'uav' }
  ];
}

function formatDetails(f) {
  const lines = [
    `شناسه: ${f.icao24 || '—'} (${f.callsign || '—'})`,
    `کشور: ${f.originCountry || '—'}`,
    `ارتفاع: ${fmt(f.geoAltitude ?? f.baroAltitude, 'm')}`,
    `سرعت: ${fmt(f.velocity, 'm/s')} | نرخ عمودی: ${fmt(f.verticalRate, 'm/s')}`,
    `heading: ${fmt(f.heading, '°')} | squawk: ${f.squawk || '—'}`,
    `نوع: ${labelKind(f.kind)}`
  ];
  return lines.join('\n');
}

function fmt(val, unit) { return (val == null || Number.isNaN(val)) ? '—' : `${Math.round(val)} ${unit}`; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

function getOpenSkyHeaders() {
  try {
    if (window.OPEN_SKY_AUTH && window.OPEN_SKY_AUTH.username && window.OPEN_SKY_AUTH.password) {
      const { username, password } = window.OPEN_SKY_AUTH;
      const token = btoa(`${username}:${password}`);
      return { Authorization: `Basic ${token}` };
    }
  } catch (_) {}
  return undefined;
}

function showSnack(msg) {
  ui.snackbar.textContent = msg;
  ui.snackbar.classList.remove('hidden');
  setTimeout(() => ui.snackbar.classList.add('hidden'), 3500);
}
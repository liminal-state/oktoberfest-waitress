import * as THREE from 'three';
import { CONFIG } from './config';
import { buildTent } from './world/tent';
import { buildTables } from './world/tables';
import { Waitress } from './player/waitress';
import { InputManager, PlayerController } from './player/controller';
import { Tray } from './player/tray';
import { GuestSystem } from './guests/behaviors';
import { OrderSystem } from './game/orders';
import { Round } from './game/round';
import { HUD } from './ui/hud';
import { Effects } from './effects';
import { AudioSys } from './audio';

// --- renderer / scene ---
const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
// menu establishing shot from a corner; gameplay camera lerps in from here
camera.position.set(14, 5.5, 20.5);
camera.lookAt(0, 1.5, 0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- world ---
const world = buildTent(scene);
const tables = buildTables(scene, world.colliders);

// --- actors & systems ---
const waitress = new Waitress();
scene.add(waitress.group);
const tray = new Tray();
waitress.trayAnchor.add(tray.group);

const input = new InputManager();
const controller = new PlayerController();
const guests = new GuestSystem(scene, world, world.colliders, tables);
const orders = new OrderSystem(tables);
const round = new Round();
const hud = new HUD(tables);
const effects = new Effects(scene);
const audio = new AudioSys();

let state: 'menu' | 'playing' | 'results' = 'menu';

guests.onBumpLine = (line) => {
  if (state === 'playing') hud.toast(line, 'neutral');
};

tray.onSpill = () => {
  round.stats.spills++;
  // the waitress pays for the beer she wastes
  round.addMoney(-CONFIG.orders.spillCost);
  round.stats.spillLosses += CONFIG.orders.spillCost;
  const pos = controller.pos.clone();
  pos.x += Math.sin(controller.heading) * 0.5;
  pos.z += Math.cos(controller.heading) * 0.5;
  pos.y = 1.0;
  effects.spawnSplash(pos);
  audio.splash();
  hud.toast(`Spilled a Maß! −€${CONFIG.orders.spillCost.toFixed(2)}`, 'bad');
  if (round.money < 0) hud.toast("You're in DEBT to the tent!", 'bad');
};

// --- pointer lock ---
const canvas = renderer.domElement;
function grabMouse() {
  if (state === 'playing' && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
}
document.addEventListener('click', grabMouse);
document.addEventListener('pointerlockchange', () => {
  hud.showClickToResume(state === 'playing' && document.pointerLockElement !== canvas);
});

// --- game state ---
function startRound() {
  round.start();
  orders.newOrder(0);
  tray.setMugs(0);
  controller.pos.set(2.5, 0, 14);
  controller.heading = 0;
  state = 'playing';
  hud.setVisible(true);
  audio.start();
  grabMouse();
  hud.toast(`Order up: Table ${orders.current!.tableId}`, 'neutral');
}

function endRound() {
  state = 'results';
  hud.setVisible(false);
  hud.showClickToResume(false);
  if (document.pointerLockElement) document.exitPointerLock();
  hud.showResults(round.stats, startRound);
}

hud.showMenu(startRound);

// --- delivery handling ---
function handleDelivery() {
  const res = orders.tryDeliver(controller.pos, tray.mugs);
  if (res.type === 'delivered') {
    round.addMoney(res.pay + res.tip);
    round.stats.deliveries++;
    round.stats.bestTip = Math.max(round.stats.bestTip, res.tip);
    hud.toast(`Table ${res.tableId}: +€${res.pay.toFixed(2)}`, 'good');
    if (res.tip > 0.05) hud.toast(`TIP +€${res.tip.toFixed(2)}!`, 'good');
    else hud.toast('No tip. Too slow!', 'neutral');
    audio.cash(res.tip > 5);
    tray.setMugs(0);
    orders.newOrder(round.difficulty01);
    hud.toast(`New order: Table ${orders.current!.tableId}`, 'neutral');
  } else if (res.type === 'rejected') {
    round.stats.rejections++;
    hud.toast(`Table ${res.tableId} refuses! Not enough beer!`, 'bad');
    audio.reject();
    tray.setMugs(0); // they dump your sad half-order
  }
}

// --- main loop ---
const clock = new THREE.Clock();

// debug/testing handle (harmless in prod, used by automated verification)
Object.assign(window as unknown as Record<string, unknown>, {
  __game: { controller, tray, round, orders, guests, world, startRound, step },
});

function inZone(p: THREE.Vector3, z: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  return p.x > z.minX && p.x < z.maxX && p.z > z.minZ && p.z < z.maxZ;
}

function tick() {
  requestAnimationFrame(tick);
  step(Math.min(clock.getDelta(), 0.05));
}

function step(dt: number) {
  const mouse = input.consumeMouse();

  if (state === 'playing') {
    const guestRes = guests.update(dt, controller.pos);
    if (guestRes.toastJustStarted) audio.cheer();

    controller.update(dt, input, world.colliders, world.bounds, tray.mugs, guestRes.slowFactor);

    if (guestRes.bumped && tray.mugs > 0) tray.bump(CONFIG.tray.bumpImpulse * (0.7 + Math.random() * 0.6));

    // balance input works locked or unlocked; pointer lock just avoids the
    // cursor hitting the screen edge, so we still request it on click
    tray.update(dt, {
      speed01: controller.speed01,
      turnRate: controller.turnRate,
      accel: controller.accelMag,
      mouseDx: mouse.dx,
      mouseDy: mouse.dy,
      jostle: guestRes.jostle,
      driftMult: round.driftMult,
    });

    orders.update(dt);

    // bar: load mugs
    const atBar = inZone(controller.pos, world.barZone);
    const n = input.consumeNumber();
    if (atBar && n !== null && n >= 1 && n <= CONFIG.tray.maxMugs) {
      tray.setMugs(n);
      audio.clink();
    }

    handleDelivery();

    hud.showClickToResume(document.pointerLockElement !== canvas);

    // difficulty ramp: more wanderers late in the shift
    const wantWanderers =
      CONFIG.guests.wanderers + Math.floor(round.difficulty01 * CONFIG.difficulty.wanderersRampExtra);
    while (guests.wandererCount < wantWanderers) guests.spawnWanderer();

    // sync visuals
    waitress.group.position.copy(controller.pos);
    waitress.group.rotation.y = controller.heading;
    waitress.update(dt, controller.speed01);
    controller.updateCamera(camera, dt);

    hud.update(
      {
        money: round.money,
        timeLeft: round.timeLeft,
        order: orders.current,
        tipFraction: orders.tipFraction(),
        mugs: tray.mugs,
        danger01: tray.danger01(),
        tiltX: Math.max(-1, Math.min(1, tray.tilt.x)),
        tiltY: Math.max(-1, Math.min(1, tray.tilt.y)),
        inBarZone: atBar,
        toastActive: guestRes.toastActive,
      },
      controller.pos.x,
      controller.pos.z,
      controller.heading,
    );

    if (round.update(dt)) endRound();
  }

  effects.update(dt);
  renderer.render(scene, camera);
}

tick();

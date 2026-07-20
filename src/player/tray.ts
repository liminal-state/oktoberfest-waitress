import * as THREE from 'three';
import { CONFIG } from '../config';

export interface TrayFrameInput {
  speed01: number;
  turnRate: number;   // rad/s
  accel: number;      // m/s^2 magnitude
  mouseDx: number;    // pixels this frame
  mouseDy: number;
  jostle: number;     // extra drift/s from crowd (0 when calm)
  driftMult: number;  // difficulty ramp
  mouseGainMult: number; // difficulty-level mouse responsiveness
}

// Mug offsets on the tray disc for counts 1..8
const MUG_LAYOUT: THREE.Vector2[] = [
  new THREE.Vector2(0, 0),
  new THREE.Vector2(0.2, 0.12),
  new THREE.Vector2(-0.2, 0.12),
  new THREE.Vector2(0, -0.23),
  new THREE.Vector2(0.31, -0.14),
  new THREE.Vector2(-0.31, -0.14),
  new THREE.Vector2(0.15, 0.31),
  new THREE.Vector2(-0.15, 0.31),
];

export class Tray {
  group = new THREE.Group();
  tilt = new THREE.Vector2(); // magnitude 1.0 = spill
  mugs = 0;
  onSpill: ((remaining: number) => void) | null = null;

  private disc: THREE.Mesh;
  private mugMeshes: THREE.Group[] = [];
  private noisePhase = Math.random() * 100;
  private driftAngle = Math.random() * Math.PI * 2;
  private grace = 0;
  private glassMat = new THREE.MeshLambertMaterial({ color: 0xffc860, transparent: true, opacity: 0.55 });
  private beerMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0x7a4200 });
  private foamMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0, emissive: 0x555044 });
  private handleMat = new THREE.MeshLambertMaterial({ color: 0xe8e8f0 });

  constructor() {
    this.disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.04, 16),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a }),
    );
    this.group.add(this.disc);
    this.group.visible = false;
  }

  setMugs(n: number) {
    this.mugs = Math.max(0, Math.min(CONFIG.tray.maxMugs, n));
    for (const m of this.mugMeshes) this.group.remove(m);
    this.mugMeshes = [];
    for (let i = 0; i < this.mugs; i++) {
      const g = new THREE.Group();
      // solid amber beer body — reads as beer from any distance
      const beer = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.082, 0.26, 10), this.beerMat);
      beer.position.y = 0.15;
      g.add(beer);
      // glass shell slightly wider, amber-tinted
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.094, 0.3, 10), this.glassMat);
      glass.position.y = 0.17;
      g.add(glass);
      // fat foam head overhanging the rim
      const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.096, 0.08, 10), this.foamMat);
      foam.position.y = 0.34;
      g.add(foam);
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), this.foamMat);
      blob.position.set(0.06, 0.37, 0.04);
      g.add(blob);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 5, 10), this.handleMat);
      handle.position.set(0.115, 0.17, 0);
      handle.rotation.y = Math.PI / 2;
      g.add(handle);
      const off = MUG_LAYOUT[i];
      g.position.set(off.x, 0.02, off.y);
      this.group.add(g);
      this.mugMeshes.push(g);
    }
    this.tilt.set(0, 0);
    this.grace = 0;
    this.group.visible = this.mugs > 0;
  }

  update(dt: number, f: TrayFrameInput) {
    const cfg = CONFIG.tray;
    if (this.mugs === 0) {
      this.tilt.multiplyScalar(Math.max(0, 1 - 8 * dt));
      this.applyVisual();
      return;
    }
    this.grace = Math.max(0, this.grace - dt);

    const mugFactor = 1 + (this.mugs - 1) * (cfg.driftPerMug / cfg.driftBase) * 0.35;

    // Steady drift in a slowly wandering direction — accumulates until you
    // steer the bubble back; worse with more mugs / speed / jostle.
    // Damping below gives light loads a safe equilibrium.
    this.noisePhase += dt;
    this.driftAngle +=
      (Math.sin(this.noisePhase * 0.31) + Math.sin(this.noisePhase * 0.17 + 2)) * 0.5 * dt;
    const driftAmp =
      (cfg.driftBase * mugFactor + cfg.driftSpeedFactor * f.speed01 + f.jostle) * f.driftMult;
    this.tilt.x += Math.cos(this.driftAngle) * driftAmp * dt;
    this.tilt.y += Math.sin(this.driftAngle) * driftAmp * dt;

    // Turning sloshes sideways, accel sloshes back
    this.tilt.x += f.turnRate * cfg.turnImpulse * (0.6 + this.mugs * 0.08) * dt;
    this.tilt.y -= f.accel * cfg.accelImpulse * (0.6 + this.mugs * 0.08) * dt;

    // Mouse steers the bubble: move the mouse toward the bullseye and the
    // bubble follows in that direction
    this.tilt.x += f.mouseDx * cfg.mouseGain * f.mouseGainMult;
    this.tilt.y += f.mouseDy * cfg.mouseGain * f.mouseGainMult;

    // Weak passive damping
    const damp = Math.max(0, 1 - cfg.damping * dt);
    this.tilt.multiplyScalar(damp);

    if (this.tilt.length() > cfg.spillThreshold && this.grace <= 0) {
      this.spillOne();
    }
    this.applyVisual();
  }

  bump(strength: number) {
    const a = Math.random() * Math.PI * 2;
    this.tilt.x += Math.cos(a) * strength;
    this.tilt.y += Math.sin(a) * strength;
  }

  private spillOne() {
    this.mugs--;
    const mesh = this.mugMeshes.pop();
    if (mesh) this.group.remove(mesh);
    if (this.tilt.length() > 0.001) this.tilt.setLength(CONFIG.tray.spillResetTo);
    this.grace = CONFIG.tray.graceAfterSpillSec;
    this.group.visible = this.mugs > 0;
    this.onSpill?.(this.mugs);
  }

  danger01(): number {
    return Math.min(1, this.tilt.length() / CONFIG.tray.spillThreshold);
  }

  private applyVisual() {
    const maxAngle = 0.45;
    this.group.rotation.z = -this.tilt.x * maxAngle;
    this.group.rotation.x = this.tilt.y * maxAngle;
    // mugs slide toward the low edge
    for (let i = 0; i < this.mugMeshes.length; i++) {
      const off = MUG_LAYOUT[i];
      this.mugMeshes[i].position.x = off.x + this.tilt.x * 0.08;
      this.mugMeshes[i].position.z = off.y + this.tilt.y * 0.08;
    }
  }
}

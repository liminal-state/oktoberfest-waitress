import * as THREE from 'three';
import { CONFIG } from '../config';
import { buildGuest, type GuestModel } from './guests';
import type { AABB, WorldInfo } from '../world/tent';
import type { TableInfo } from '../world/tables';

interface Wanderer {
  model: GuestModel;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  stagger: number;      // phase for drunk wobble
  bumpCooldown: number;
  speedMult: number;
}

interface Dancer {
  model: GuestModel;
  phase: number;
  base: THREE.Vector3;
}

export interface GuestFrameResult {
  bumped: boolean;      // player got body-checked this frame
  jostle: number;       // extra tray drift per second
  slowFactor: number;   // player speed multiplier
  toastActive: boolean;
  toastJustStarted: boolean;
}

const BUMP_LINES = ['Oida!', 'Obacht!', 'Heyy!', 'Zefix!', 'Ups!', 'Prost?!'];

export class GuestSystem {
  private seated: GuestModel[] = [];
  private wanderers: Wanderer[] = [];
  private dancers: Dancer[] = [];
  private toastTimer: number;
  private toastActive = 0;
  onBumpLine: ((line: string) => void) | null = null;

  constructor(
    private scene: THREE.Scene,
    private world: WorldInfo,
    private colliders: AABB[],
    tables: TableInfo[],
  ) {
    const cfg = CONFIG.guests;
    // seated guests fill some bench slots
    for (const t of tables) {
      for (const slot of t.seatSlots) {
        if (Math.random() < cfg.seatedPerTable / 6) {
          const g = buildGuest();
          g.group.position.copy(slot);
          // face the table
          g.group.rotation.y = slot.z < t.position.z ? 0 : Math.PI;
          this.scene.add(g.group);
          this.seated.push(g);
        }
      }
    }
    for (let i = 0; i < cfg.wanderers; i++) this.spawnWanderer();
    // dancers near the stage
    for (let i = 0; i < 6; i++) {
      const g = buildGuest(true);
      const a = (i / 6) * Math.PI * 2;
      const base = new THREE.Vector3(
        this.world.stagePos.x + Math.cos(a) * (1.5 + Math.random() * 2),
        0,
        this.world.stagePos.z + 1.5 + Math.abs(Math.sin(a)) * 2,
      );
      g.group.position.copy(base);
      g.group.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(g.group);
      this.dancers.push({ model: g, phase: Math.random() * 10, base });
    }
    this.toastTimer = this.nextToastIn();
  }

  private nextToastIn() {
    const [a, b] = CONFIG.guests.toastIntervalSec;
    return a + Math.random() * (b - a);
  }

  private randomAisleSpot(): THREE.Vector3 {
    const b = this.world.bounds;
    for (let tries = 0; tries < 30; tries++) {
      const p = new THREE.Vector3(
        b.minX + 1 + Math.random() * (b.maxX - b.minX - 2),
        0,
        b.minZ + 4 + Math.random() * (b.maxZ - b.minZ - 10),
      );
      const pad = 0.6;
      const blocked = this.colliders.some(
        (c) => p.x > c.minX - pad && p.x < c.maxX + pad && p.z > c.minZ - pad && p.z < c.maxZ + pad,
      );
      if (!blocked) return p;
    }
    return new THREE.Vector3(0, 0, 12);
  }

  spawnWanderer() {
    const g = buildGuest(true);
    const pos = this.randomAisleSpot();
    g.group.position.copy(pos);
    this.scene.add(g.group);
    this.wanderers.push({
      model: g,
      pos,
      target: this.randomAisleSpot(),
      stagger: Math.random() * 10,
      bumpCooldown: 0,
      speedMult: 0.7 + Math.random() * 0.7,
    });
  }

  get wandererCount() {
    return this.wanderers.length;
  }

  update(dt: number, playerPos: THREE.Vector3): GuestFrameResult {
    const cfg = CONFIG.guests;
    const res: GuestFrameResult = {
      bumped: false,
      jostle: 0,
      slowFactor: 1,
      toastActive: false,
      toastJustStarted: false,
    };

    // --- toast event timing ---
    if (this.toastActive > 0) {
      this.toastActive -= dt;
      res.toastActive = true;
      res.jostle += 0.05; // whole tent surges
      if (this.toastActive <= 0) this.toastTimer = this.nextToastIn();
    } else {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastActive = cfg.toastDurationSec;
        res.toastJustStarted = true;
        res.toastActive = true;
      }
    }
    const toasting = res.toastActive;

    // seated guests raise mugs during toast
    const targetArmX = toasting ? -2.6 : -1.1;
    for (const g of this.seated) {
      g.armR.rotation.x += (targetArmX - g.armR.rotation.x) * Math.min(1, 6 * dt);
    }

    // --- wanderers ---
    for (const w of this.wanderers) {
      w.bumpCooldown = Math.max(0, w.bumpCooldown - dt);
      w.stagger += dt * 2;
      w.model.armR.rotation.x += (targetArmX - w.model.armR.rotation.x) * Math.min(1, 6 * dt);

      if (!toasting) {
        const toTarget = new THREE.Vector3().subVectors(w.target, w.pos);
        toTarget.y = 0;
        if (toTarget.length() < 0.8) {
          w.target = this.randomAisleSpot();
        } else {
          toTarget.normalize();
          // drunk stagger: heading wobbles side to side
          const wob = Math.sin(w.stagger * 1.7) * 0.7;
          const dir = new THREE.Vector3(
            toTarget.x * Math.cos(wob) - toTarget.z * Math.sin(wob),
            0,
            toTarget.x * Math.sin(wob) + toTarget.z * Math.cos(wob),
          );
          w.pos.addScaledVector(dir, cfg.wandererSpeed * w.speedMult * dt);
          w.model.group.rotation.y = Math.atan2(dir.x, dir.z);
        }
        w.model.group.position.set(w.pos.x, 0.45 + Math.sin(w.stagger * 3.1) * 0.02, w.pos.z);
      }

      // bump the player
      const d = w.pos.distanceTo(playerPos);
      if (d < cfg.bumpRadius && w.bumpCooldown <= 0) {
        w.bumpCooldown = cfg.bumpCooldownSec;
        res.bumped = true;
        this.onBumpLine?.(BUMP_LINES[Math.floor(Math.random() * BUMP_LINES.length)]);
      }
    }

    // --- dancers bob and spin ---
    for (const d of this.dancers) {
      d.phase += dt * 6;
      d.model.group.position.y = 0.45 + Math.abs(Math.sin(d.phase)) * 0.15;
      d.model.group.rotation.y += dt * 1.5;
      d.model.armR.rotation.x = toasting ? -2.6 : -2.0 + Math.sin(d.phase) * 0.4;
    }

    // --- dance zone effect on player ---
    const dxz = Math.hypot(playerPos.x - this.world.stagePos.x, playerPos.z - this.world.stagePos.z);
    if (dxz < cfg.danceZoneRadius) {
      res.slowFactor = cfg.danceSlowFactor;
      res.jostle += cfg.danceJostlePerSec;
    }

    return res;
  }
}

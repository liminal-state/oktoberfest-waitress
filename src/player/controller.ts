import * as THREE from 'three';
import { CONFIG } from '../config';
import type { AABB } from '../world/tent';

export class InputManager {
  private keys = new Set<string>();
  private mouseDx = 0;
  private mouseDy = 0;
  private numberQueued: number | null = null;

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      const m = /^Digit([0-9])$/.exec(e.code);
      if (m) this.numberQueued = parseInt(m[1], 10);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousemove', (e) => {
      this.mouseDx += e.movementX;
      this.mouseDy += e.movementY;
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  isDown(code: string) {
    return this.keys.has(code);
  }

  moveVector(): THREE.Vector2 {
    // Camera looks north (-z): W = -z, D = +x (screen-relative).
    const x = (this.isDown('KeyD') ? 1 : 0) - (this.isDown('KeyA') ? 1 : 0);
    const z = (this.isDown('KeyS') ? 1 : 0) - (this.isDown('KeyW') ? 1 : 0);
    const v = new THREE.Vector2(x, z);
    if (v.lengthSq() > 1) v.normalize();
    return v;
  }

  consumeMouse(): { dx: number; dy: number } {
    const r = { dx: this.mouseDx, dy: this.mouseDy };
    this.mouseDx = 0;
    this.mouseDy = 0;
    return r;
  }

  consumeNumber(): number | null {
    const n = this.numberQueued;
    this.numberQueued = null;
    return n;
  }
}

function collideCircle(pos: THREE.Vector3, radius: number, boxes: AABB[], bounds: AABB) {
  pos.x = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, pos.x));
  pos.z = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, pos.z));
  for (const b of boxes) {
    const cx = Math.max(b.minX, Math.min(b.maxX, pos.x));
    const cz = Math.max(b.minZ, Math.min(b.maxZ, pos.z));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        pos.x = cx + (dx / d) * radius;
        pos.z = cz + (dz / d) * radius;
      } else {
        // center inside the box: push out along the shallowest axis
        const pushL = pos.x - b.minX + radius;
        const pushR = b.maxX - pos.x + radius;
        const pushN = pos.z - b.minZ + radius;
        const pushS = b.maxZ - pos.z + radius;
        const min = Math.min(pushL, pushR, pushN, pushS);
        if (min === pushL) pos.x = b.minX - radius;
        else if (min === pushR) pos.x = b.maxX + radius;
        else if (min === pushN) pos.z = b.minZ - radius;
        else pos.z = b.maxZ + radius;
      }
    }
  }
}

// Sweeps from the player toward a candidate camera offset and stops short of
// the first collider or bound in the way, so the spring-arm works for any
// facing direction (not just the one fixed axis the old camera assumed).
function cameraSpringArm(
  playerPos: THREE.Vector3,
  dirX: number,
  dirZ: number,
  maxDist: number,
  colliders: AABB[],
  bounds: AABB,
  radius: number,
): THREE.Vector2 {
  const steps = 24;
  const stepDist = maxDist / steps;
  let clearDist = maxDist;
  for (let i = 1; i <= steps; i++) {
    const t = i * stepDist;
    const x = playerPos.x + dirX * t;
    const z = playerPos.z + dirZ * t;
    let blocked =
      x < bounds.minX + radius || x > bounds.maxX - radius || z < bounds.minZ + radius || z > bounds.maxZ - radius;
    if (!blocked) {
      for (const c of colliders) {
        if (x > c.minX - radius && x < c.maxX + radius && z > c.minZ - radius && z < c.maxZ + radius) {
          blocked = true;
          break;
        }
      }
    }
    if (blocked) {
      clearDist = Math.max(0, t - stepDist);
      break;
    }
  }
  return new THREE.Vector2(playerPos.x + dirX * clearDist, playerPos.z + dirZ * clearDist);
}

function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class PlayerController {
  pos = new THREE.Vector3(2.5, 0, 14); // start near the bar, off the pole line
  heading = 0;                       // facing south (+z) toward the bar
  // Independent of heading: where the camera itself is looking. Free-look
  // (mouse-driven) with hands empty; auto-settles in behind her heading
  // while carrying, since the mouse is busy balancing the tray then.
  // PI makes the default (before any mouse input) match heading=0 — i.e.
  // camera behind her, facing the bar, same as her spawn facing.
  cameraYaw = Math.PI;
  private vel = new THREE.Vector2();
  // Exposed each frame for the tray physics:
  speed01 = 0;
  turnRate = 0;
  accelMag = 0;

  // Called once per frame before update(): hands-free lets the mouse orbit
  // the camera directly; hands-full lets it drift back to trail her heading.
  updateLook(dt: number, mouseDx: number, freeLook: boolean) {
    const cfg = CONFIG.camera;
    if (freeLook) {
      this.cameraYaw -= mouseDx * cfg.lookSensitivity;
    } else {
      const target = wrapAngle(Math.PI - this.heading);
      const diff = wrapAngle(target - this.cameraYaw);
      this.cameraYaw += diff * Math.min(1, cfg.followLerp * dt);
    }
  }

  update(
    dt: number,
    input: InputManager,
    colliders: AABB[],
    bounds: AABB,
    mugsCarried: number,
    slowFactor: number,
  ) {
    const cfg = CONFIG.player;
    const maxSpeed = Math.max(1.4, (cfg.walkSpeed - mugsCarried * cfg.speedPerMugPenalty) * slowFactor);
    // WASD is relative to wherever the camera is currently looking (not a
    // fixed world axis), so W always walks into what's on screen regardless
    // of how the camera's been spun around.
    const move = input.moveVector();
    const cy = Math.cos(this.cameraYaw);
    const sy = Math.sin(this.cameraYaw);
    const worldMove = new THREE.Vector2(move.x * cy - move.y * sy, move.x * sy + move.y * cy);
    const targetVel = worldMove.multiplyScalar(maxSpeed);

    const prevVel = this.vel.clone();
    // exponential approach for snappy-but-smooth accel
    const k = 1 - Math.exp(-10 * dt);
    this.vel.lerp(targetVel, k);
    this.accelMag = dt > 0 ? this.vel.clone().sub(prevVel).length() / dt : 0;

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.y * dt;
    collideCircle(this.pos, cfg.radius, colliders, bounds);

    // heading turns toward movement direction
    const speed = this.vel.length();
    this.speed01 = speed / cfg.walkSpeed;
    const prevHeading = this.heading;
    if (speed > 0.3) {
      const target = Math.atan2(this.vel.x, this.vel.y);
      let diff = target - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, cfg.turnLerp * dt);
    }
    let hDiff = this.heading - prevHeading;
    while (hDiff > Math.PI) hDiff -= Math.PI * 2;
    while (hDiff < -Math.PI) hDiff += Math.PI * 2;
    this.turnRate = dt > 0 ? hDiff / dt : 0;
  }

  applyPush(dir: THREE.Vector2, strength: number) {
    this.vel.add(dir.clone().normalize().multiplyScalar(strength));
  }

  updateCamera(camera: THREE.PerspectiveCamera, dt: number, colliders: AABB[], bounds: AABB) {
    const cfg = CONFIG.camera;
    // Camera trails behind wherever cameraYaw is currently looking (mouse-
    // controlled with hands free, auto-following her heading while she
    // carries a tray) — not a fixed world direction and not locked to
    // movement, so whatever's in view is always what she's walking toward.
    const armDirX = -Math.sin(this.cameraYaw);
    const armDirZ = Math.cos(this.cameraYaw);
    const arm = cameraSpringArm(this.pos, armDirX, armDirZ, cfg.distance, colliders, bounds, cfg.collisionRadius);

    const target = new THREE.Vector3(arm.x, cfg.height, arm.y);
    const k = 1 - Math.exp(-cfg.lerp * dt);
    camera.position.lerp(target, k);
    camera.lookAt(this.pos.x, cfg.lookAtHeight, this.pos.z);
  }
}

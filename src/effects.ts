import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

interface Puddle {
  mesh: THREE.Mesh;
  life: number;
}

export class Effects {
  private particles: Particle[] = [];
  private puddles: Puddle[] = [];
  private beerMat = new THREE.MeshBasicMaterial({ color: 0xe8a020 });
  private puddleMat = new THREE.MeshBasicMaterial({ color: 0xc07a10, transparent: true, opacity: 0.6 });
  private dropGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  private puddleGeo = new THREE.CircleGeometry(0.4, 10);

  constructor(private scene: THREE.Scene) {}

  spawnSplash(pos: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(this.dropGeo, this.beerMat);
      mesh.position.copy(pos);
      const a = Math.random() * Math.PI * 2;
      const vel = new THREE.Vector3(Math.cos(a) * (0.8 + Math.random()), 1.6 + Math.random() * 1.4, Math.sin(a) * (0.8 + Math.random()));
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.8 });
    }
    const puddle = new THREE.Mesh(this.puddleGeo, this.puddleMat.clone());
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(pos.x, 0.02 + Math.random() * 0.01, pos.z);
    puddle.scale.setScalar(0.5 + Math.random() * 0.6);
    this.scene.add(puddle);
    this.puddles.push({ mesh: puddle, life: 25 });
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.life -= dt;
      if (p.life <= 0 || p.mesh.position.y < 0.02) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const p = this.puddles[i];
      p.life -= dt;
      if (p.life < 5) (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * (p.life / 5);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.puddles.splice(i, 1);
      }
    }
  }
}

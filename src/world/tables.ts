import * as THREE from 'three';
import { woodTexture, tableclothTexture, numberTexture } from './textures';
import type { AABB } from './tent';

export interface TableInfo {
  id: number;
  position: THREE.Vector3;   // table center
  aabb: AABB;                // collision incl. benches
  seatSlots: THREE.Vector3[]; // where seated guests go (world pos, bench height)
}

// 10 long tables, 2 columns x 5 rows. Long axis along x.
export function buildTables(scene: THREE.Scene, colliders: AABB[]): TableInfo[] {
  const tables: TableInfo[] = [];
  const topMatBlue = new THREE.MeshLambertMaterial({ map: tableclothTexture('blue') });
  const topMatRed = new THREE.MeshLambertMaterial({ map: tableclothTexture('red') });
  const legMat = new THREE.MeshLambertMaterial({ map: woodTexture('#7a5228') });
  const benchMat = new THREE.MeshLambertMaterial({ map: woodTexture('#8a5a2b') });

  const tableGeo = new THREE.BoxGeometry(6, 0.12, 1.5);
  const legGeo = new THREE.BoxGeometry(0.15, 0.78, 1.3);
  const benchGeo = new THREE.BoxGeometry(6, 0.1, 0.45);
  const benchLegGeo = new THREE.BoxGeometry(0.12, 0.5, 0.4);

  let id = 1;
  for (let row = 0; row < 5; row++) {
    for (const colX of [-6.2, 6.2]) {
      const z = -13 + row * 4.6;
      const g = new THREE.Group();

      const top = new THREE.Mesh(tableGeo, id % 2 === 0 ? topMatRed : topMatBlue);
      top.position.y = 0.84;
      g.add(top);
      for (const lx of [-2.6, 2.6]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.39, 0);
        g.add(leg);
      }
      // benches both sides
      for (const bz of [-1.15, 1.15]) {
        const bench = new THREE.Mesh(benchGeo, benchMat);
        bench.position.set(0, 0.5, bz);
        g.add(bench);
        for (const lx of [-2.5, 2.5]) {
          const bleg = new THREE.Mesh(benchLegGeo, legMat);
          bleg.position.set(lx, 0.25, bz);
          g.add(bleg);
        }
      }

      // half-drunk amber mugs scattered on the table
      const beerMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0x6a3a00 });
      const foamMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0 });
      for (let m = 0; m < 4; m++) {
        const mx = -2.4 + Math.random() * 4.8;
        const mz = (Math.random() - 0.5) * 1.1;
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.24, 6), beerMat);
        mug.position.set(mx, 1.02, mz);
        g.add(mug);
        const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.088, 0.05, 6), foamMat);
        foam.position.set(mx, 1.16, mz);
        g.add(foam);
      }

      g.position.set(colX, 0, z);
      scene.add(g);

      // floating number sprite
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberTexture(id), depthTest: true }));
      spr.scale.set(0.9, 0.9, 1);
      spr.position.set(colX, 2.6, z);
      scene.add(spr);

      const aabb: AABB = { minX: colX - 3.1, maxX: colX + 3.1, minZ: z - 1.55, maxZ: z + 1.55 };
      colliders.push(aabb);

      // 3 seats per bench side
      const seatSlots: THREE.Vector3[] = [];
      for (const bz of [-1.15, 1.15]) {
        for (const sx of [-2, 0, 2]) {
          seatSlots.push(new THREE.Vector3(colX + sx, 0.55, z + bz));
        }
      }

      tables.push({ id, position: new THREE.Vector3(colX, 0.85, z), aabb, seatSlots });
      id++;
    }
  }
  return tables;
}

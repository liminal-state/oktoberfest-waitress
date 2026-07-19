import * as THREE from 'three';
import { skinTexture } from '../world/textures';

const SHIRT_COLORS = [0x8a2020, 0x20608a, 0x207a30, 0x8a7a20, 0x6a3a8a, 0xa05a20, 0x3a3a3a];
const DIRNDL_COLORS = [0x8a2050, 0x2f5da6, 0x2e7d32, 0x7a2020];

let sharedSkin: THREE.MeshLambertMaterial | null = null;
function skinMat() {
  if (!sharedSkin) sharedSkin = new THREE.MeshLambertMaterial({ map: skinTexture() });
  return sharedSkin;
}

export interface GuestModel {
  group: THREE.Group;
  armR: THREE.Group; // mug arm, pivot at shoulder — rotate to raise for a toast
}

// Torso-up guest, pivot at seat/hip height. Seated guests sit the pivot on a bench;
// standing guests get legs below the pivot and stand at y=0.45.
export function buildGuest(standing = false): GuestModel {
  const group = new THREE.Group();
  const female = Math.random() < 0.4;
  const shirtCol = female
    ? DIRNDL_COLORS[Math.floor(Math.random() * DIRNDL_COLORS.length)]
    : SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtCol });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.6, 7), shirtMat);
  torso.position.y = 0.32;
  group.add(torso);

  if (standing) {
    const shortsMat = new THREE.MeshLambertMaterial({ color: female ? 0x4a4a52 : 0x5a3a1a });
    const legGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.45, 6);
    legGeo.translate(0, -0.225, 0);
    for (const sx of [-0.1, 0.1]) {
      const leg = new THREE.Mesh(legGeo, skinMat());
      leg.position.set(sx, 0.02, 0);
      group.add(leg);
    }
    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.25, 7), shortsMat);
    shorts.position.y = 0.02;
    group.add(shorts);
    // blob shadow (pivot sits 0.45 above the floor for standing guests)
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.36, 10),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.435;
    group.add(shadow);
  }

  if (!female) {
    // lederhosen straps
    const strapMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    for (const sx of [-0.09, 0.09]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.03), strapMat);
      strap.position.set(sx, 0.38, 0.22);
      group.add(strap);
    }
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), skinMat());
  head.position.y = 0.82;
  group.add(head);

  if (female) {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.175, 8, 6, Math.PI * 0.75, Math.PI * 1.5),
      new THREE.MeshLambertMaterial({ color: [0xc89030, 0x5a3a1a, 0x2a1a0a][Math.floor(Math.random() * 3)] }),
    );
    hair.position.y = 0.84; // segment gap already faces +z (their face side)
    group.add(hair);
  } else if (Math.random() < 0.6) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 7), new THREE.MeshLambertMaterial({ color: 0x2e5c2e }));
    hat.position.y = 0.98;
    group.add(hat);
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.02), new THREE.MeshLambertMaterial({ color: 0xe8e0d0 }));
    feather.position.set(0.1, 1.02, 0);
    feather.rotation.z = -0.4;
    group.add(feather);
  }

  // left arm resting on table
  const armGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.4, 5);
  armGeo.translate(0, -0.2, 0); // pivot at shoulder
  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(-0.24, 0.55, 0);
  armL.rotation.x = -1.2;
  armL.rotation.z = -0.3;
  group.add(armL);

  // right arm holds a mug, grouped so it can be raised
  const armR = new THREE.Group();
  armR.position.set(0.24, 0.55, 0);
  const armRMesh = new THREE.Mesh(armGeo, shirtMat);
  armR.add(armRMesh);
  const mug = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.055, 0.18, 6),
    new THREE.MeshLambertMaterial({ color: 0xd8d8e0 }),
  );
  const beer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.048, 0.14, 6),
    new THREE.MeshLambertMaterial({ color: 0xe09018 }),
  );
  beer.position.y = 0.01;
  mug.add(glass, beer);
  mug.position.set(0, -0.42, 0.05);
  armR.add(mug);
  armR.rotation.x = -1.1; // resting: forearm toward table
  armR.rotation.z = 0.25;
  group.add(armR);

  return { group, armR };
}

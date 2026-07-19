import * as THREE from 'three';
import { woodTexture, floorTexture, tentStripeTexture, beerBannerTexture } from './textures';

export interface AABB {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

export interface WorldInfo {
  colliders: AABB[];
  bounds: AABB;              // walkable interior
  barZone: AABB;             // stand here to load mugs
  stagePos: THREE.Vector3;   // dance zone center
}

// Tent interior: x in [-18, 18], z in [-22, 22]. Bar at south (+z), stage at north (-z).
export function buildTent(scene: THREE.Scene): WorldInfo {
  const colliders: AABB[] = [];

  // --- floor ---
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 48),
    new THREE.MeshLambertMaterial({ map: floorTexture() }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // --- tent roof: big striped canopy (two slanted planes + ridge) ---
  const stripes = tentStripeTexture();
  stripes.repeat.set(6, 2);
  const roofMat = new THREE.MeshLambertMaterial({ map: stripes, side: THREE.DoubleSide });
  // Each half: 22 wide (slope, x) x 48 long (ridge, z), laid flat then tilted about z.
  const roofHalf = new THREE.PlaneGeometry(22, 48);
  roofHalf.rotateX(-Math.PI / 2);
  const tilt = 0.3;
  const roofL = new THREE.Mesh(roofHalf, roofMat);
  roofL.position.set(-10.3, 10, 0);
  roofL.rotation.z = -tilt; // west half rises toward center
  scene.add(roofL);
  const roofR = new THREE.Mesh(roofHalf, roofMat);
  roofR.position.set(10.3, 10, 0);
  roofR.rotation.z = tilt;
  scene.add(roofR);

  // --- tent walls (canvas side curtains) ---
  const wallMatN = new THREE.MeshLambertMaterial({ color: 0xd8d2c0, side: THREE.DoubleSide });
  const wallGeoSide = new THREE.PlaneGeometry(48, 7);
  const wallW = new THREE.Mesh(wallGeoSide, wallMatN);
  wallW.position.set(-20, 3.5, 0);
  wallW.rotation.y = Math.PI / 2;
  scene.add(wallW);
  const wallE = new THREE.Mesh(wallGeoSide, wallMatN);
  wallE.position.set(20, 3.5, 0);
  wallE.rotation.y = -Math.PI / 2;
  scene.add(wallE);
  const wallGeoEnd = new THREE.PlaneGeometry(40, 7);
  const wallN = new THREE.Mesh(wallGeoEnd, wallMatN);
  wallN.position.set(0, 3.5, -24);
  scene.add(wallN);
  const wallS = new THREE.Mesh(wallGeoEnd, wallMatN);
  wallS.position.set(0, 3.5, 24);
  wallS.rotation.y = Math.PI;
  scene.add(wallS);

  // --- support poles down the middle ---
  const poleMat = new THREE.MeshLambertMaterial({ map: woodTexture('#9a6a34') });
  const poleGeo = new THREE.CylinderGeometry(0.22, 0.26, 10, 8);
  for (const z of [-15, 0, 15]) {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 5, z);
    scene.add(pole);
    colliders.push({ minX: -0.3, maxX: 0.3, minZ: z - 0.3, maxZ: z + 0.3 });
    // garland ring on pole
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.07, 6, 12),
      new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
    );
    ring.position.set(0, 3.2, z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
  }

  // --- bar counter at south end ---
  const barMat = new THREE.MeshLambertMaterial({ map: woodTexture('#6a4218') });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(14, 1.15, 2.2), barMat);
  bar.position.set(0, 0.575, 19.5);
  scene.add(bar);
  colliders.push({ minX: -7, maxX: 7, minZ: 18.4, maxZ: 20.6 });
  // back shelf with kegs
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 1), barMat);
  shelf.position.set(0, 1.3, 22.5);
  scene.add(shelf);
  colliders.push({ minX: -7, maxX: 7, minZ: 22, maxZ: 23 });
  const kegMat = new THREE.MeshLambertMaterial({ map: woodTexture('#7a5228') });
  for (let i = -2; i <= 2; i++) {
    const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 10), kegMat);
    keg.rotation.z = Math.PI / 2;
    keg.position.set(i * 2.6, 3.1, 22.5);
    scene.add(keg);
  }
  // full Maß mugs lined up on the bar, glowing amber
  const beerMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0x7a4200 });
  const foamMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0, emissive: 0x555044 });
  for (let i = -5; i <= 5; i++) {
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.34, 8), beerMat);
    mug.position.set(i * 1.1 + 0.3, 1.32, 19.2);
    scene.add(mug);
    const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.115, 0.09, 8), foamMat);
    foam.position.set(i * 1.1 + 0.3, 1.53, 19.2);
    scene.add(foam);
  }
  // banner above bar
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 3.6),
    new THREE.MeshBasicMaterial({ map: beerBannerTexture() }),
  );
  banner.position.set(0, 5.2, 21.8);
  banner.rotation.y = Math.PI;
  scene.add(banner);

  // --- band stage at north end ---
  const stage = new THREE.Mesh(new THREE.BoxGeometry(12, 0.9, 5), barMat);
  stage.position.set(0, 0.45, -20.5);
  scene.add(stage);
  colliders.push({ minX: -6, maxX: 6, minZ: -23, maxZ: -18 });
  // band members (static oompah dudes)
  const bandColors = [0x8a2020, 0x20608a, 0x207a30, 0x8a7a20];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.1, 8), new THREE.MeshLambertMaterial({ color: bandColors[i] }));
    body.position.y = 1.45;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8b48c }));
    head.position.y = 2.25;
    g.add(head);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 8), new THREE.MeshLambertMaterial({ color: 0x2e5c2e }));
    hat.position.y = 2.52;
    g.add(hat);
    // brass horn
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xc8a832 }));
    horn.rotation.x = Math.PI / 2 - 0.4;
    horn.position.set(0, 1.7, 0.4);
    g.add(horn);
    g.position.set(-4.5 + i * 3, 0.9, -20.5);
    scene.add(g);
  }

  // --- bunting: strings of little Bavarian flags across the tent ---
  const flagColors = [0x3d6fb4, 0xe8e4d8, 0xd23c3c, 0xe8c840];
  const flagGeo = new THREE.ConeGeometry(0.14, 0.4, 4);
  const flagMats = flagColors.map((c) => new THREE.MeshLambertMaterial({ color: c }));
  for (let z = -18; z <= 18; z += 6) {
    for (let x = -16; x <= 16; x += 1.6) {
      const flag = new THREE.Mesh(flagGeo, flagMats[Math.floor(Math.random() * flagMats.length)]);
      const sag = 1 - Math.pow(x / 16, 2); // strings sag in the middle
      flag.position.set(x, 6.9 - sag * 0.7, z + Math.sin(x * 3) * 0.05);
      flag.rotation.x = Math.PI; // point down
      scene.add(flag);
    }
  }

  // --- hanging festoon lights along the ridge ---
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd878 });
  const bulbGeo = new THREE.SphereGeometry(0.09, 6, 4);
  for (let z = -20; z <= 20; z += 2.2) {
    for (const x of [-9, 0, 9]) {
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x + Math.sin(z * 1.7) * 0.3, 7.4 - Math.abs(x) * 0.12, z);
      scene.add(bulb);
    }
  }

  // --- lighting: warm, flat, vertex-lit era vibe ---
  scene.add(new THREE.AmbientLight(0xffe6c0, 0.85));
  const hemi = new THREE.HemisphereLight(0xfff2d0, 0x5a3a1a, 0.8);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe8b8, 1.4);
  key.position.set(8, 14, 6);
  scene.add(key);
  // physical light units (r155+): point lights need real intensity
  const barGlow = new THREE.PointLight(0xffc060, 40, 20);
  barGlow.position.set(0, 4, 19);
  scene.add(barGlow);
  const stageGlow = new THREE.PointLight(0xffa040, 30, 18);
  stageGlow.position.set(0, 4, -19);
  scene.add(stageGlow);

  scene.fog = new THREE.Fog(0x2a1c0c, 30, 60);
  scene.background = new THREE.Color(0x2a1c0c);

  return {
    colliders,
    bounds: { minX: -19, maxX: 19, minZ: -23, maxZ: 23 },
    barZone: { minX: -7.5, maxX: 7.5, minZ: 16.2, maxZ: 18.4 },
    stagePos: new THREE.Vector3(0, 0, -17),
  };
}

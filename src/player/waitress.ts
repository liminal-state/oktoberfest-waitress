import * as THREE from 'three';
import {
  skinTexture,
  faceTexture,
  bodiceTexture,
  apronClothTexture,
  skirtClothTexture,
} from '../world/textures';

// Articulated dirndl waitress, built facing +z.
export class Waitress {
  group = new THREE.Group();
  trayAnchor = new THREE.Group();
  private legL: THREE.Group;
  private legR: THREE.Group;
  private body: THREE.Group;
  private phase = 0;

  constructor() {
    const skinMat = new THREE.MeshLambertMaterial({ map: skinTexture() });
    const blouseMat = new THREE.MeshLambertMaterial({ color: 0xf6f2e6 });
    const bodiceMat = new THREE.MeshLambertMaterial({ map: bodiceTexture() });
    const skirtMat = new THREE.MeshLambertMaterial({ map: skirtClothTexture(), side: THREE.DoubleSide });
    const apronMat = new THREE.MeshLambertMaterial({ map: apronClothTexture(), side: THREE.DoubleSide });
    const ribbonMat = new THREE.MeshLambertMaterial({ color: 0x27508f });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0xc08a28 });
    const stockingMat = new THREE.MeshLambertMaterial({ color: 0xf2eee2 });
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x35200e });

    this.body = new THREE.Group();

    // --- legs (pivot at hip): skin thigh, white stocking, buckled shoe ---
    const thighGeo = new THREE.CylinderGeometry(0.057, 0.052, 0.28, 10);
    thighGeo.translate(0, -0.14, 0);
    const stockingGeo = new THREE.CylinderGeometry(0.051, 0.046, 0.27, 10);
    stockingGeo.translate(0, -0.415, 0);
    const shoeGeo = new THREE.BoxGeometry(0.11, 0.065, 0.21);
    shoeGeo.translate(0, -0.575, 0.045);
    const buckleGeo = new THREE.BoxGeometry(0.04, 0.03, 0.01);
    buckleGeo.translate(0, -0.56, 0.15);
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xd8b040 });
    const mkLeg = () => {
      const leg = new THREE.Group();
      leg.add(new THREE.Mesh(thighGeo, skinMat));
      leg.add(new THREE.Mesh(stockingGeo, stockingMat));
      leg.add(new THREE.Mesh(shoeGeo, shoeMat));
      leg.add(new THREE.Mesh(buckleGeo, buckleMat));
      return leg;
    };
    this.legL = mkLeg();
    this.legL.position.set(-0.1, 0.6, 0);
    this.legR = mkLeg();
    this.legR.position.set(0.1, 0.6, 0);
    this.group.add(this.legL, this.legR);

    // --- flared dirndl skirt (lathe profile: waist → bell hem) ---
    const skirtPts = [
      new THREE.Vector2(0.44, 0.0),
      new THREE.Vector2(0.42, 0.1),
      new THREE.Vector2(0.36, 0.24),
      new THREE.Vector2(0.28, 0.4),
      new THREE.Vector2(0.2, 0.5),
      new THREE.Vector2(0.17, 0.56),
    ];
    const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtPts, 22), skirtMat);
    skirt.position.y = 0.5;
    this.body.add(skirt);

    // apron over the front of the skirt
    const apron = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.5, 14, 1, true, -0.55, 1.1),
      apronMat,
    );
    apron.position.y = 0.79;
    this.body.add(apron);
    // apron waistband + side bow
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.05, 14), apronMat);
    band.position.y = 1.05;
    this.body.add(band);
    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), apronMat);
    bowKnot.position.set(0.17, 1.05, 0.05);
    this.body.add(bowKnot);
    for (const a of [-0.7, 0.5]) {
      const loop = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.02), apronMat);
      loop.position.set(0.19, 1.03 + (a > 0 ? 0.03 : -0.02), 0.06);
      loop.rotation.z = a;
      this.body.add(loop);
    }

    // --- torso: blouse, bust hint, laced bodice ---
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.34, 14), blouseMat);
    torso.position.y = 1.32;
    this.body.add(torso);
    const bust = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 9), blouseMat);
    bust.scale.set(1.3, 0.75, 0.75);
    bust.position.set(0, 1.37, 0.09);
    this.body.add(bust);
    // bodice wraps OUTSIDE the torso so the lacing shows
    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.265, 0.34, 14, 1, true), bodiceMat);
    bodice.position.y = 1.24;
    bodice.rotation.y = Math.PI / 2; // lacing (texture center) faces +z
    this.body.add(bodice);

    // --- arms: shoulder → elbow → forearm → hand, carrying pose ---
    const upperGeo = new THREE.CylinderGeometry(0.045, 0.042, 0.24, 8);
    upperGeo.translate(0, -0.12, 0);
    const foreGeo = new THREE.CylinderGeometry(0.04, 0.036, 0.28, 8);
    foreGeo.translate(0, -0.14, 0);
    for (const s of [-1, 1]) {
      const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 9), blouseMat);
      sleeve.position.set(s * 0.24, 1.45, 0.02);
      this.body.add(sleeve);
      const shoulder = new THREE.Group();
      shoulder.position.set(s * 0.25, 1.44, 0.02);
      shoulder.rotation.x = -0.5;
      shoulder.rotation.z = s * -0.18;
      const upper = new THREE.Mesh(upperGeo, skinMat);
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.24, 0);
      elbow.rotation.x = -0.75;
      elbow.add(new THREE.Mesh(foreGeo, skinMat));
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), skinMat);
      hand.position.set(0, -0.3, 0);
      elbow.add(hand);
      shoulder.add(elbow);
      this.body.add(shoulder);
    }

    // --- head: painted face, neck, parted hair, front braids with bows ---
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.1, 10), skinMat);
    neck.position.y = 1.53;
    this.body.add(neck);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 18, 14),
      new THREE.MeshLambertMaterial({ map: faceTexture() }),
    );
    head.position.y = 1.68;
    head.rotation.y = -Math.PI / 2; // face texture (at +x in sphere UV space) → +z front
    this.body.add(head);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.187, 18, 14, Math.PI * 0.75, Math.PI * 1.5),
      hairMat,
    );
    hair.position.y = 1.7;
    this.body.add(hair);
    // braids: tapering bead chains draped forward over the shoulders
    for (const s of [-1, 1]) {
      const beads = [0.05, 0.046, 0.042, 0.037];
      for (let i = 0; i < beads.length; i++) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(beads[i], 8, 6), hairMat);
        bead.scale.y = 1.25;
        bead.position.set(s * (0.14 + i * 0.01), 1.56 - i * 0.08, 0.06 + i * 0.032);
        this.body.add(bead);
      }
      // ribbon bow at braid end
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), ribbonMat);
      knot.position.set(s * 0.175, 1.29, 0.16);
      this.body.add(knot);
      for (const a of [-0.8, 0.8]) {
        const loop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.015), ribbonMat);
        loop.position.set(s * 0.175 + a * 0.025, 1.3, 0.16);
        loop.rotation.z = a;
        this.body.add(loop);
      }
    }

    this.group.add(this.body);

    // tray anchor in front of hands
    this.trayAnchor.position.set(0, 1.18, 0.42);
    this.group.add(this.trayAnchor);

    // blob shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    this.group.add(shadow);
  }

  update(dt: number, speed01: number) {
    this.phase += dt * (4 + speed01 * 8);
    const swing = Math.sin(this.phase) * 0.55 * speed01;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.body.position.y = Math.abs(Math.sin(this.phase)) * 0.045 * speed01;
    this.body.rotation.z = Math.sin(this.phase) * 0.03 * speed01;
  }
}

import * as THREE from 'three';
import { skinTexture, faceTexture } from '../world/textures';

// Primitive articulated dirndl waitress, built facing +z.
export class Waitress {
  group = new THREE.Group();
  trayAnchor = new THREE.Group();
  private legL: THREE.Mesh;
  private legR: THREE.Mesh;
  private body: THREE.Group;
  private phase = 0;

  constructor() {
    const skinMat = new THREE.MeshLambertMaterial({ map: skinTexture() });
    const blouseMat = new THREE.MeshLambertMaterial({ color: 0xf2eee0 });
    const bodiceMat = new THREE.MeshLambertMaterial({ color: 0x27508f });
    const skirtMat = new THREE.MeshLambertMaterial({ color: 0x2f5da6 });
    const apronMat = new THREE.MeshLambertMaterial({ color: 0xe8e2cc });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0xc89030 });

    this.body = new THREE.Group();

    // legs (pivot at hip so they can swing)
    const legGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.52, 6);
    legGeo.translate(0, -0.26, 0);
    this.legL = new THREE.Mesh(legGeo, skinMat);
    this.legL.position.set(-0.1, 0.52, 0);
    this.legR = new THREE.Mesh(legGeo, skinMat);
    this.legR.position.set(0.1, 0.52, 0);
    this.group.add(this.legL, this.legR);
    const shoeGeo = new THREE.BoxGeometry(0.11, 0.07, 0.2);
    shoeGeo.translate(0, -0.51, 0.04);
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x3a2410 });
    this.legL.add(new THREE.Mesh(shoeGeo, shoeMat));
    this.legR.add(new THREE.Mesh(shoeGeo, shoeMat));

    // skirt
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.62, 10), skirtMat);
    skirt.position.y = 0.78;
    this.body.add(skirt);
    const apron = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.5, 10, 1, true, -0.6, 1.2), apronMat);
    apron.position.y = 0.76;
    this.body.add(apron);

    // torso: blouse + bodice
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.42, 8), blouseMat);
    torso.position.y = 1.28;
    this.body.add(torso);
    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.3, 8), bodiceMat);
    bodice.position.y = 1.2;
    this.body.add(bodice);

    // puff sleeves + arms reaching forward to carry the tray
    const sleeveGeo = new THREE.SphereGeometry(0.09, 6, 5);
    for (const sx of [-0.24, 0.24]) {
      const sleeve = new THREE.Mesh(sleeveGeo, blouseMat);
      sleeve.position.set(sx, 1.42, 0.02);
      this.body.add(sleeve);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.42, 6), skinMat);
      arm.position.set(sx * 0.75, 1.3, 0.26);
      arm.rotation.x = -1.15; // forearms tilted forward/up
      arm.rotation.z = sx > 0 ? 0.25 : -0.25;
      this.body.add(arm);
    }

    // head with painted face, hair cap + braids
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshLambertMaterial({ map: faceTexture() }));
    head.position.y = 1.68;
    head.rotation.y = -Math.PI / 2; // face texture (at +x in sphere UV space) → +z front
    this.body.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.185, 10, 8, Math.PI * 0.75, Math.PI * 1.5), hairMat);
    hair.position.y = 1.7;
    // segment phi 0.75π–2.25π leaves its gap centered on +z already — no rotation
    this.body.add(hair);
    const braidGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.3, 5);
    for (const sx of [-0.15, 0.15]) {
      const braid = new THREE.Mesh(braidGeo, hairMat);
      braid.position.set(sx, 1.52, -0.05);
      braid.rotation.z = sx > 0 ? -0.2 : 0.2;
      this.body.add(braid);
      const bow = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), skirtMat);
      bow.position.set(sx * 1.25, 1.38, -0.06);
      this.body.add(bow);
    }

    this.group.add(this.body);

    // tray anchor in front of hands
    this.trayAnchor.position.set(0, 1.18, 0.42);
    this.group.add(this.trayAnchor);

    // blob shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 12),
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

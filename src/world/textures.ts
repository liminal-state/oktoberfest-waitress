import * as THREE from 'three';

// Procedural canvas textures — hand-painted-realistic, linear-filtered.

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

function finish(c: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

function noiseSpeckle(ctx: CanvasRenderingContext2D, size: number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgba(${v},${v * 0.8},${v * 0.5},${alpha})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function knot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, 'rgba(40,22,8,0.85)');
  grad.addColorStop(0.4, 'rgba(70,42,16,0.5)');
  grad.addColorStop(1, 'rgba(70,42,16,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // rings around the knot
  ctx.strokeStyle = 'rgba(50,30,10,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * (1 + i * 0.5), r * 0.7 * (1 + i * 0.45), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function woodTexture(base = '#8a5a2b', repeat = 1): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 4; p++) {
    const y = p * 64;
    // per-plank tone variation
    const tone = (Math.random() - 0.5) * 36;
    ctx.fillStyle = `rgba(${tone > 0 ? 255 : 0},${tone > 0 ? 230 : 0},${tone > 0 ? 180 : 0},${Math.abs(tone) / 255})`;
    ctx.fillRect(0, y, 256, 64);
    // soft vertical shading inside the plank (lathe curvature)
    const sh = ctx.createLinearGradient(0, y, 0, y + 64);
    sh.addColorStop(0, 'rgba(0,0,0,0.18)');
    sh.addColorStop(0.15, 'rgba(255,235,190,0.08)');
    sh.addColorStop(0.85, 'rgba(0,0,0,0.05)');
    sh.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = sh;
    ctx.fillRect(0, y, 256, 64);
    // grain: long wavy strokes of varying darkness and width
    for (let i = 0; i < 22; i++) {
      const dark = Math.random() < 0.75;
      const a = 0.08 + Math.random() * 0.18;
      ctx.strokeStyle = dark
        ? `rgba(${45 + Math.random() * 35},${25 + Math.random() * 18},8,${a})`
        : `rgba(235,205,150,${a * 0.8})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.6;
      ctx.beginPath();
      const gy = y + 3 + Math.random() * 58;
      ctx.moveTo(0, gy);
      const wob = () => (Math.random() - 0.5) * 9;
      ctx.bezierCurveTo(60, gy + wob(), 140, gy + wob(), 256, gy + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }
    // occasional knot
    if (Math.random() < 0.7) knot(ctx, 30 + Math.random() * 196, y + 16 + Math.random() * 32, 4 + Math.random() * 5);
    // plank gap: dark line + light catch below
    ctx.fillStyle = 'rgba(20,10,4,0.55)';
    ctx.fillRect(0, y + 62, 256, 3);
    ctx.fillStyle = 'rgba(255,230,180,0.10)';
    ctx.fillRect(0, y + 65 > 255 ? 0 : y + 65, 256, 1);
  }
  noiseSpeckle(ctx, 256, 500, 0.07);
  return finish(c, repeat);
}

export function floorTexture(): THREE.CanvasTexture {
  // trampled beer-hall planks: tone-varied boards, staggered ends, stains, scuffs
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = '#6e4a22';
  ctx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 8; p++) {
    const x = p * 32;
    // per-board tone
    const light = Math.random();
    ctx.fillStyle = `rgba(${light > 0.5 ? 255 : 0},${light > 0.5 ? 225 : 0},${light > 0.5 ? 170 : 0},${0.04 + Math.abs(light - 0.5) * 0.22})`;
    ctx.fillRect(x, 0, 32, 256);
    // long grain
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(${38 + Math.random() * 30},${22 + Math.random() * 14},6,${0.10 + Math.random() * 0.15})`;
      ctx.lineWidth = 0.5 + Math.random();
      const gx = x + 2 + Math.random() * 28;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + (Math.random() - 0.5) * 5, 80, gx + (Math.random() - 0.5) * 5, 180, gx, 256);
      ctx.stroke();
    }
    // board gap + highlight
    ctx.fillStyle = 'rgba(18,10,4,0.6)';
    ctx.fillRect(x, 0, 2, 256);
    ctx.fillStyle = 'rgba(255,225,170,0.08)';
    ctx.fillRect(x + 2, 0, 1, 256);
    // staggered board-end seam
    const seamY = ((p * 97) % 256);
    ctx.fillStyle = 'rgba(18,10,4,0.5)';
    ctx.fillRect(x, seamY, 32, 2);
    if (Math.random() < 0.4) knot(ctx, x + 8 + Math.random() * 16, Math.random() * 256, 3 + Math.random() * 3);
  }
  // beer stains: darker ring + lighter center, like dried spills
  for (let i = 0; i < 12; i++) {
    const sx = Math.random() * 256, sy = Math.random() * 256;
    const r = 8 + Math.random() * 20;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, 'rgba(130,88,20,0.10)');
    grad.addColorStop(0.75, 'rgba(95,60,12,0.14)');
    grad.addColorStop(0.92, 'rgba(60,36,8,0.28)');
    grad.addColorStop(1, 'rgba(60,36,8,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, r, r * (0.6 + Math.random() * 0.4), Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // scuffs
  ctx.strokeStyle = 'rgba(30,18,8,0.20)';
  for (let i = 0; i < 18; i++) {
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    const sx = Math.random() * 256, sy = Math.random() * 256;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 26, sy + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
  noiseSpeckle(ctx, 256, 700, 0.10);
  return finish(c, 12);
}

export function tentStripeTexture(): THREE.CanvasTexture {
  // Bavarian white/blue canvas: stripes with cloth shading, weave, grime
  const [c, ctx] = makeCanvas(256);
  for (let i = 0; i < 8; i++) {
    const x = i * 32;
    const blue = i % 2 === 1;
    // stripe base with curvature shading (canvas bulges between seams)
    const grad = ctx.createLinearGradient(x, 0, x + 32, 0);
    if (blue) {
      grad.addColorStop(0, '#33619e');
      grad.addColorStop(0.5, '#4a7cc4');
      grad.addColorStop(1, '#33619e');
    } else {
      grad.addColorStop(0, '#d3cfc0');
      grad.addColorStop(0.5, '#f2eee0');
      grad.addColorStop(1, '#d3cfc0');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 32, 256);
    // seam stitching
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, 256);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // horizontal weave lines
  ctx.fillStyle = 'rgba(0,0,0,0.045)';
  for (let y = 0; y < 256; y += 3) ctx.fillRect(0, y, 256, 1);
  // grime patches
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(80,60,30,${0.03 + Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 14, 3 + Math.random() * 7, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c, 1);
}

export function tableclothTexture(check: 'blue' | 'red' = 'blue'): THREE.CanvasTexture {
  // woven gingham: overlapping semi-transparent bands read as fabric
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = '#f0ede1';
  ctx.fillRect(0, 0, 128, 128);
  const col = check === 'blue' ? '70,110,190' : '198,58,48';
  ctx.fillStyle = `rgba(${col},0.55)`;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(i * 32, 0, 16, 128); // vertical bands
    ctx.fillRect(0, i * 32, 128, 16); // horizontal bands (intersections double up)
  }
  // thread texture: fine alternating lines
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let y = 0; y < 128; y += 2) ctx.fillRect(0, y, 128, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let x = 0; x < 128; x += 2) ctx.fillRect(x, 0, 1, 128);
  // soft crease shadows
  for (let i = 0; i < 3; i++) {
    const y = 20 + Math.random() * 88;
    const grad = ctx.createLinearGradient(0, y - 4, 0, y + 4);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.07)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 4, 128, 8);
  }
  noiseSpeckle(ctx, 128, 60, 0.05);
  return finish(c, 3);
}

export function skinTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(32);
  ctx.fillStyle = '#e8b48c';
  ctx.fillRect(0, 0, 32, 32);
  noiseSpeckle(ctx, 32, 20, 0.05);
  return finish(c);
}

export interface FaceOptions {
  skin?: string;
  eye?: string;
  mustache?: boolean;
  lipstick?: boolean;
}

export function faceTexture(o: FaceOptions = {}): THREE.CanvasTexture {
  // painted face mapped onto the head sphere's front UV band
  const skin = o.skin ?? '#e8b48c';
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, 128, 128);
  // soft facial shading: lighter center, warm shadow at jaw
  let grad = ctx.createRadialGradient(64, 56, 8, 64, 60, 55);
  grad.addColorStop(0, 'rgba(255,240,220,0.30)');
  grad.addColorStop(0.7, 'rgba(255,240,220,0)');
  grad.addColorStop(1, 'rgba(120,70,40,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  // eyes: whites, iris, pupil, highlight, lash line
  for (const ex of [43, 85]) {
    ctx.fillStyle = '#fdfdfa';
    ctx.beginPath();
    ctx.ellipse(ex, 52, 9.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.eye ?? '#3a6ab0';
    ctx.beginPath();
    ctx.arc(ex, 52.5, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101018';
    ctx.beginPath();
    ctx.arc(ex, 52.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(ex + 1.6, 50.8, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // upper lash line
    ctx.strokeStyle = '#4a2c14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ex, 51, 9.5, 6, 0, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // brows
  ctx.strokeStyle = '#6a4318';
  ctx.lineWidth = 3;
  for (const ex of [43, 85]) {
    ctx.beginPath();
    ctx.moveTo(ex - 9, 42);
    ctx.quadraticCurveTo(ex, 37.5, ex + 9, 41);
    ctx.stroke();
  }
  // nose: subtle shadow + nostrils
  ctx.strokeStyle = 'rgba(150,90,50,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(62, 56);
  ctx.quadraticCurveTo(60, 66, 63, 70);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,70,40,0.55)';
  ctx.beginPath();
  ctx.ellipse(60, 71, 1.6, 1.1, 0, 0, Math.PI * 2);
  ctx.ellipse(68, 71, 1.6, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // mouth
  if (o.mustache) {
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.ellipse(56, 79, 10, 4.5, 0.15, 0, Math.PI * 2);
    ctx.ellipse(72, 79, 10, 4.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a5a4a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(56, 88);
    ctx.quadraticCurveTo(64, 92, 72, 88);
    ctx.stroke();
  } else {
    // smiling lips
    ctx.fillStyle = o.lipstick === false ? '#b06858' : '#c04848';
    ctx.beginPath();
    ctx.moveTo(52, 84);
    ctx.quadraticCurveTo(64, 80, 76, 84);
    ctx.quadraticCurveTo(64, 93, 52, 84);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,30,20,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(52, 84);
    ctx.quadraticCurveTo(64, 82, 76, 84);
    ctx.stroke();
  }
  // blush
  grad = ctx.createRadialGradient(34, 68, 1, 34, 68, 9);
  grad.addColorStop(0, 'rgba(230,120,100,0.45)');
  grad.addColorStop(1, 'rgba(230,120,100,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(24, 58, 20, 20);
  grad = ctx.createRadialGradient(94, 68, 1, 94, 68, 9);
  grad.addColorStop(0, 'rgba(230,120,100,0.45)');
  grad.addColorStop(1, 'rgba(230,120,100,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(84, 58, 20, 20);
  return finish(c);
}

export function bodiceTexture(): THREE.CanvasTexture {
  // deep-blue dirndl bodice with golden front lacing and trim
  const [c, ctx] = makeCanvas(128);
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, '#1d3c6e');
  grad.addColorStop(0.5, '#27508f');
  grad.addColorStop(1, '#1d3c6e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  // fabric weave
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < 128; y += 3) ctx.fillRect(0, y, 128, 1);
  // colorful floral embroidery band along the neckline, gold trim at the waist
  ctx.fillStyle = '#d8a838';
  ctx.fillRect(0, 123, 128, 5);
  ctx.fillRect(0, 0, 128, 3);
  const trimColors = ['#c0392b', '#2e7d32', '#d8a838', '#8a3a6a'];
  for (let x = 3; x < 128; x += 7) {
    ctx.fillStyle = trimColors[Math.floor(Math.random() * trimColors.length)];
    ctx.beginPath();
    ctx.arc(x, 6, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a6a2e';
    ctx.beginPath();
    ctx.ellipse(x + 3.5, 6, 1, 2, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // front lacing: crisscross gold cord between eyelets (center of texture = front)
  ctx.strokeStyle = '#e8c050';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    const y = 14 + i * 22;
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(78, y + 22);
    ctx.moveTo(78, y);
    ctx.lineTo(50, y + 22);
    ctx.stroke();
  }
  ctx.fillStyle = '#f0d878';
  for (let i = 0; i <= 5; i++) {
    const y = 14 + i * 22;
    ctx.beginPath();
    ctx.arc(50, Math.min(y, 124), 3, 0, Math.PI * 2);
    ctx.arc(78, Math.min(y, 124), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c);
}

export function apronClothTexture(): THREE.CanvasTexture {
  // red/white gingham dirndl apron with a ruffled white hem band
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = '#f5f0e2';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(196,48,42,0.72)';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(i * 16, 0, 8, 128);
    ctx.fillRect(0, i * 16, 128, 8);
  }
  // woven thread texture
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let y = 0; y < 128; y += 2) ctx.fillRect(0, y, 128, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let x = 0; x < 128; x += 2) ctx.fillRect(x, 0, 1, 128);
  // ruffled white hem band with a scalloped lace edge
  ctx.fillStyle = '#faf7ef';
  ctx.fillRect(0, 106, 128, 22);
  ctx.fillStyle = 'rgba(170,70,60,0.18)';
  ctx.beginPath();
  for (let x = -4; x <= 128; x += 8) ctx.arc(x, 106, 4, 0, Math.PI, false);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,100,70,0.35)';
  for (let x = 6; x < 128; x += 10) {
    ctx.beginPath();
    ctx.arc(x, 121, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  noiseSpeckle(ctx, 128, 60, 0.05);
  return finish(c, 2);
}

export function skirtClothTexture(): THREE.CanvasTexture {
  // blue dirndl skirt with soft vertical pleats and hem band
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = '#2f5da6';
  ctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) {
    const grad = ctx.createLinearGradient(x, 0, x + 16, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.22)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.10)');
    grad.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 16, 128);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < 128; y += 3) ctx.fillRect(0, y, 128, 1);
  // hem ribbon
  ctx.fillStyle = '#d8a838';
  ctx.fillRect(0, 116, 128, 4);
  return finish(c);
}

export function checkerShirtTexture(color: 'red' | 'blue' = 'red'): THREE.CanvasTexture {
  // classic Bavarian checkered shirt
  const [c, ctx] = makeCanvas(64);
  ctx.fillStyle = '#ece8dc';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = color === 'red' ? 'rgba(180,50,40,0.7)' : 'rgba(50,90,160,0.7)';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(i * 8, 0, 4, 64);
    ctx.fillRect(0, i * 8, 64, 4);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < 64; y += 2) ctx.fillRect(0, y, 64, 1);
  return finish(c, 2);
}

export function numberTexture(n: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = '#1a2f5e';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#f5f0e0';
  ctx.font = 'bold 72px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function beerBannerTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = '#274a8f';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#f5f0e0';
  ctx.font = 'bold 44px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIER', 128, 90);
  ctx.font = 'bold 28px Impact, sans-serif';
  ctx.fillText('★ FESTZELT ★', 128, 140);
  ctx.font = 'bold 22px Impact, sans-serif';
  ctx.fillText('Maß  € 12,50', 128, 190);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

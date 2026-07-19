import * as THREE from 'three';

// Low-res canvas textures with NearestFilter for that early-2000s texel chunk look.

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

function finish(c: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
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

export function woodTexture(base = '#8a5a2b', repeat = 1): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  // planks
  for (let p = 0; p < 4; p++) {
    const y = p * 32;
    ctx.fillStyle = `rgba(0,0,0,${0.12 + Math.random() * 0.1})`;
    ctx.fillRect(0, y, 128, 2);
    // grain streaks
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = `rgba(${40 + Math.random() * 40},${20 + Math.random() * 20},0,${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gy = y + 4 + Math.random() * 26;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(40, gy + (Math.random() - 0.5) * 6, 90, gy + (Math.random() - 0.5) * 6, 128, gy);
      ctx.stroke();
    }
  }
  noiseSpeckle(ctx, 128, 160, 0.12);
  return finish(c, repeat);
}

export function floorTexture(): THREE.CanvasTexture {
  // trampled dirty planks with spill stains
  const [c, ctx] = makeCanvas(128);
  ctx.fillStyle = '#6e4a22';
  ctx.fillRect(0, 0, 128, 128);
  for (let p = 0; p < 8; p++) {
    const x = p * 16;
    ctx.fillStyle = `rgba(0,0,0,${0.18 + Math.random() * 0.1})`;
    ctx.fillRect(x, 0, 2, 128);
    ctx.fillStyle = `rgba(255,220,150,${0.05 + Math.random() * 0.05})`;
    ctx.fillRect(x + 2, 0, 14, 128);
  }
  // beer stains
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(120,80,10,${0.10 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 12, 3 + Math.random() * 8, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  noiseSpeckle(ctx, 128, 300, 0.15);
  return finish(c, 12);
}

export function tentStripeTexture(): THREE.CanvasTexture {
  // Bavarian white/blue stripes, slightly grubby
  const [c, ctx] = makeCanvas(128);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#e8e4d8' : '#3d6fb4';
    ctx.fillRect(i * 16, 0, 16, 128);
  }
  ctx.fillStyle = 'rgba(80,60,30,0.08)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 8, 2 + Math.random() * 4);
  }
  return finish(c, 1);
}

export function tableclothTexture(check: 'blue' | 'red' = 'blue'): THREE.CanvasTexture {
  // gingham check
  const [c, ctx] = makeCanvas(64);
  ctx.fillStyle = '#e9e6da';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = check === 'blue' ? 'rgba(70,110,190,0.85)' : 'rgba(200,60,50,0.85)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(i * 16, 0, 8, 64);
    ctx.fillRect(0, i * 16, 64, 8);
  }
  noiseSpeckle(ctx, 64, 40, 0.08);
  return finish(c, 3);
}

export function skinTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(32);
  ctx.fillStyle = '#e8b48c';
  ctx.fillRect(0, 0, 32, 32);
  noiseSpeckle(ctx, 32, 20, 0.05);
  return finish(c);
}

export function faceTexture(): THREE.CanvasTexture {
  // crude painted-on face, very Postal 2 NPC
  const [c, ctx] = makeCanvas(64);
  ctx.fillStyle = '#e8b48c';
  ctx.fillRect(0, 0, 64, 64);
  // eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(18, 24, 10, 6);
  ctx.fillRect(36, 24, 10, 6);
  ctx.fillStyle = '#2a4a8a';
  ctx.fillRect(21, 25, 4, 4);
  ctx.fillRect(39, 25, 4, 4);
  // brows
  ctx.fillStyle = '#7a4a1a';
  ctx.fillRect(17, 20, 12, 2);
  ctx.fillRect(35, 20, 12, 2);
  // mouth
  ctx.fillStyle = '#b05050';
  ctx.fillRect(26, 42, 12, 3);
  // blush
  ctx.fillStyle = 'rgba(220,120,100,0.4)';
  ctx.fillRect(12, 34, 6, 4);
  ctx.fillRect(46, 34, 6, 4);
  return finish(c);
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

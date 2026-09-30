/* view3d.js — vista 3D con Three.js: texturas procedurales, materiales PBR, cielo/entorno, sombras suaves,
   muebles detallados (models3d.js), ventanales y "fotos" para el generador de renders.
   Plano (x,y) -> 3D (x, altura, z=y). Se carga bajo demanda desde CDN. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const ORBIT_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
  const WALL_H = 2.6, LEVEL_H = WALL_H + 0.25;

  const LIGHTS = {
    day: { name: 'Día', sun: 0xfff1dc, si: 1.25, az: 35, el: 52, hs: 0xfff6ea, hg: 0xbdb8ac, hi: 0.5, exp: 0.6, sky: ['#5f9ede', '#b7d6f0', '#eef3f6'], lamp: 0.12, emis: 0.0, pl: 0xfff0dc, wk: { exp: 1.55, hemi: 1.9, lamp: 2.4 } },
    sunset: { name: 'Atardecer', sun: 0xff8a3d, si: 1.35, az: 250, el: 12, hs: 0xd89a78, hg: 0x4a3a48, hi: 0.28, exp: 0.66, sky: ['#2a3672', '#d0755a', '#eaa46e'], lamp: 0.75, emis: 0.7, pl: 0xffb36b, wk: { exp: 1.25, hemi: 1.4, lamp: 1.4 } },
    night: { name: 'Noche', sun: 0x5570b8, si: 0.1, az: 200, el: 35, hs: 0x1a2450, hg: 0x06070d, hi: 0.18, exp: 0.8, sky: ['#02040c', '#070d24', '#0f1838'], lamp: 0.85, emis: 0.8, pl: 0xffb56b, wk: { exp: 1.1, hemi: 1.2, lamp: 1.0 } },
  };

  let ready = false, loading = null, renderer, scene, camera, controls, root, host, raf = 0, active = false;
  let sun, hemi, sky, envRT, pmrem, lightName = 'day', dynamic = { lamps: [], emis: [], halos: [] };
  let M = null; // materiales
  const texCache = {}, matCache = {};

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  /* ---------- texturas procedurales ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function canvasTex(size, draw, srgb) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb !== false) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
    return `rgb(${c(16)},${c(8)},${c(0)})`;
  };
  function tileTex(base, grout, n) {
    return canvasTex(1024, (g, S) => {
      const r = rng(7), t = S / n;
      g.fillStyle = grout; g.fillRect(0, 0, S, S);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const k = 0.95 + r() * 0.08, x = i * t + 3, y = j * t + 3;
        const gr = g.createLinearGradient(x, y, x + t, y + t);
        gr.addColorStop(0, shade(base, k + 0.03)); gr.addColorStop(1, shade(base, k - 0.03));
        g.fillStyle = gr; g.fillRect(x, y, t - 6, t - 6);
      }
      for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.03})`; g.fillRect(r() * S, r() * S, 2, 2); }
    });
  }
  /* ---------- ruido tileable + texturas fotorrealistas ---------- */
  function hash2(ix, iy, seed) {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function tnoise(x, y, px, py, seed) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const x0 = ((ix % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((iy % py) + py) % py, y1 = (y0 + 1) % py;
    const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed), c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  /** Ruido fractal periódico: u,v en [0,1), cx,cy celdas base por textura. */
  function fbmT(u, v, cx, cy, seed, oct) {
    let s = 0, a = 0.5, tot = 0;
    for (let o = 0; o < oct; o++) { const f = 1 << o; s += a * tnoise(u * cx * f, v * cy * f, cx * f, cy * f, seed + o * 31); tot += a; a *= 0.5; }
    return s / tot;
  }
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  function pixTex(size, fn, srgb) {
    return canvasTex(size, (g, S) => {
      const img = g.createImageData(S, S), d = img.data;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const c = fn(x, y, x / S, y / S), i = (y * S + x) * 4; d[i] = clamp255(c[0]); d[i + 1] = clamp255(c[1]); d[i + 2] = clamp255(c[2]); d[i + 3] = 255; }
      g.putImageData(img, 0, 0);
    }, srgb);
  }

  function woodTex(base, seed) {
    const S = 1024, rows = 16, ph = S / rows, sd = seed || 1, r = rng(sd), b = rgbOf(base), planks = [];
    for (let i = 0; i < rows; i++) { const j1 = r() * S, j2 = (j1 + S * (0.35 + r() * 0.3)) % S; planks.push({ k: 0.9 + r() * 0.2, j: [Math.min(j1, j2), Math.max(j1, j2)], sh: [0.96 + r() * 0.07, 0.96 + r() * 0.07, 0.96 + r() * 0.07], tint: [r() - 0.5, r() - 0.5, r() - 0.5] }); }
    return pixTex(S, (x, y, u, v) => {
      const row = Math.min(rows - 1, (y / ph) | 0), pl = planks[row], seg = x < pl.j[0] ? 0 : x < pl.j[1] ? 1 : 2, pv = (y - row * ph) / ph, ps = sd * 7 + row * 13 + seg * 5;
      const warp = fbmT(u, row / rows + pv * 0.05, 2, 4, ps, 3), fine = fbmT(u, v, 6, 420, ps + 9, 3), ring = 0.5 + 0.5 * Math.sin((pv * 30 + warp * 2.2) * Math.PI);
      let k = pl.k * pl.sh[seg] * (0.93 + 0.06 * ring + 0.22 * (fine - 0.5));
      const dj = Math.min(Math.abs(x - pl.j[0]), Math.abs(x - pl.j[1]), x, S - x);
      if (pv < 0.012 || pv > 0.988 || dj < 2) k *= 0.62; else if (pv < 0.03 || dj < 5) k *= 0.95;
      if (hash2(x, y, ps) > 0.9985) k *= 0.75;
      return [b[0] * k + pl.tint[0] * 6, b[1] * k + pl.tint[1] * 5, b[2] * k + pl.tint[2] * 4];
    });
  }
  function stoneTex(base) {
    const b = rgbOf(base), S = 512;
    return pixTex(S, (x, y, u, v) => {
      const cl = fbmT(u, v, 4, 4, 5, 4), fi = fbmT(u, v, 48, 48, 8, 2), gr = hash2(x, y, 3);
      let k = 0.88 + 0.2 * cl + 0.08 * (fi - 0.5) + (gr > 0.985 ? -0.15 : gr < 0.03 ? 0.06 : 0);
      const jx = Math.min(x % (S / 2), S / 2 - (x % (S / 2))), jy = Math.min(y % (S / 2), S / 2 - (y % (S / 2)));
      if (jx < 2 || jy < 2) k *= 0.4;
      return [b[0] * k, b[1] * k, b[2] * k];
    });
  }
  function marbleTex() {
    return pixTex(1024, (x, y, u, v) => {
      const cloud = fbmT(u, v, 3, 3, 21, 4), warp = fbmT(u, v, 4, 4, 33, 4), w2 = fbmT(u, v, 8, 8, 44, 3);
      const v1 = Math.abs(Math.sin((u * 3 + v * 2 + warp * 3.2) * Math.PI)), vein = Math.pow(1 - v1, 14) * 0.85 + Math.pow(1 - Math.abs(Math.sin((u * 5 - v * 3 + w2 * 2.4) * Math.PI)), 22) * 0.4;
      const k = 0.95 + (cloud - 0.5) * 0.08 - vein * 0.28;
      return [244 * k, 242 * k, 238 * k + (vein > 0.2 ? 4 : 0)];
    });
  }
  function grassTex() {
    return pixTex(512, (x, y, u, v) => {
      const big = fbmT(u, v, 5, 5, 61, 4), fine = fbmT(u, v, 90, 90, 62, 2), blade = hash2(x, y, 7);
      const k = 0.82 + 0.3 * big + 0.16 * (fine - 0.5) + (blade > 0.97 ? 0.12 : 0);
      return [128 * k, 158 * k, 96 * k];
    });
  }
  /** Madera continua (sin tablones) para muebles: vetas finas y alargadas. */
  function grainTex(base) {
    const b = rgbOf(base);
    return pixTex(512, (x, y, u, v) => {
      const warp = fbmT(u, v, 2, 3, 91, 3), fine = fbmT(u, v, 5, 260, 92, 3), ring = 0.5 + 0.5 * Math.sin((v * 22 + warp * 2) * Math.PI);
      const k = 0.92 + 0.05 * ring + 0.24 * (fine - 0.5);
      return [b[0] * k, b[1] * k, b[2] * k];
    });
  }
  function concreteTex(base) {
    const b = rgbOf(base);
    return pixTex(512, (x, y, u, v) => {
      const big = fbmT(u, v, 3, 3, 51, 4), mid = fbmT(u, v, 24, 24, 52, 3), sp = hash2(x, y, 9);
      let k = 0.9 + 0.18 * big + 0.08 * (mid - 0.5) + (sp > 0.992 ? -0.16 : 0) + (sp < 0.006 ? 0.06 : 0);
      if (x < 2 || y < 2) k *= 0.7;
      return [b[0] * k, b[1] * k, b[2] * k];
    });
  }
  function fabricBump() {
    return canvasTex(128, (g, S) => {
      const r = rng(9);
      for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) { const v = ((x >> 1) + (y >> 1)) % 2 ? 150 : 105, k = v + (r() - 0.5) * 34; g.fillStyle = `rgb(${k},${k},${k})`; g.fillRect(x, y, 2, 2); }
    }, false);
  }
  function plasterBump() {
    return pixTex(512, (x, y, u, v) => { const k = 90 + 130 * fbmT(u, v, 40, 40, 71, 3) + 30 * (hash2(x, y, 4) - 0.5); return [k, k, k]; }, false);
  }
  /** Mapa normal (espacio tangente) a partir de la luminosidad de una textura. */
  function normalOf(tex, s) {
    const c = tex.image, S = c.width, d = c.getContext('2d').getImageData(0, 0, S, S).data, h = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) h[i] = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255;
    const out = document.createElement('canvas'); out.width = out.height = S;
    const g = out.getContext('2d'), o = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (h[y * S + ((x + 1) % S)] - h[y * S + ((x - 1 + S) % S)]) * s, dy = (h[((y + 1) % S) * S + x] - h[((y - 1 + S) % S) * S + x]) * s;
      const l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
      o.data[i] = (-dx / l * 0.5 + 0.5) * 255; o.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; o.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; o.data[i + 3] = 255;
    }
    g.putImageData(o, 0, 0);
    const t = new THREE.CanvasTexture(out);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = tex.anisotropy;
    return t;
  }
  /** Normal + rugosidad variable a partir del albedo (oscuro = más rugoso). */
  function pbrMaps(tex, n, rough, vary) {
    const c = tex.image, S = c.width, d = c.getContext('2d').getImageData(0, 0, S, S).data, out = document.createElement('canvas');
    out.width = out.height = S;
    const g = out.getContext('2d'), o = g.createImageData(S, S);
    for (let i = 0; i < S * S; i++) { const l = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255, r = Math.max(0.03, Math.min(1, rough + (0.55 - l) * vary)) * 255; o.data[i * 4] = o.data[i * 4 + 1] = o.data[i * 4 + 2] = r; o.data[i * 4 + 3] = 255; }
    g.putImageData(o, 0, 0);
    const rt = new THREE.CanvasTexture(out);
    rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.anisotropy = tex.anisotropy;
    return { normalMap: normalOf(tex, n), roughnessMap: rt };
  }

  const T = (k, f) => texCache[k] || (texCache[k] = f());
  function carpetTex(base) {
    return canvasTex(512, (g, S) => {
      const r = rng(5);
      g.fillStyle = base; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 26000; i++) { const x = r() * S, y = r() * S; g.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 5, y + (r() - 0.5) * 5); g.stroke(); }
    });
  }
  function bumpOf(tex) {
    const c = tex.image, S = c.width, b = document.createElement('canvas');
    b.width = b.height = S;
    const g = b.getContext('2d'), d = c.getContext('2d').getImageData(0, 0, S, S), o = g.createImageData(S, S);
    for (let i = 0; i < d.data.length; i += 4) { const l = 0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]; o.data[i] = o.data[i + 1] = o.data[i + 2] = l; o.data[i + 3] = 255; }
    g.putImageData(o, 0, 0);
    const t = new THREE.CanvasTexture(b);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = tex.anisotropy;
    return t;
  }
  function chevronTex(base, seed) {
    return canvasTex(1024, (g, S) => {
      const r = rng(seed || 3), p = 256, h = 64;
      for (let c = 0; c < 4; c++) {
        const s = c % 2 ? -1 : 1, x0 = c * p;
        g.save(); g.beginPath(); g.rect(x0, 0, p, S); g.clip();
        for (let y = -p - h; y < S + p; y += h) {
          g.fillStyle = shade(base, 0.86 + r() * 0.26);
          g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + p, y + s * p); g.lineTo(x0 + p, y + s * p + h); g.lineTo(x0, y + h); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(30,15,5,.42)'; g.lineWidth = 1.6; g.stroke();
          for (let l = 0; l < 4; l++) { const t = r() * p; g.strokeStyle = r() > 0.5 ? 'rgba(60,30,10,.10)' : 'rgba(255,240,210,.10)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + t, y + s * t + r() * h); g.lineTo(x0 + Math.min(p, t + 60), y + s * Math.min(p, t + 60) + r() * h); g.stroke(); }
        }
        g.restore();
      }
    });
  }
  function checkerTex(light, dark) {
    return canvasTex(512, (g, S) => {
      const r = rng(4), n = 4, t = S / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? dark : light; g.fillRect(i * t, j * t, t, t); }
      for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.04})`; g.fillRect(r() * S, r() * S, 2, 2); }
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * t, 0); g.lineTo(i * t, S); g.moveTo(0, i * t); g.lineTo(S, i * t); g.stroke(); }
    });
  }
  function mosaicTex(base) {
    return canvasTex(512, (g, S) => {
      const r = rng(6), n = 16, t = S / n, pal = [base, shade(base, 1.12), shade(base, 0.88), '#e6ebee', shade(base, 0.72)];
      g.fillStyle = '#c9ced1'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = pal[(r() * pal.length) | 0]; g.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3); }
    });
  }
  /* --- texturas de pared --- */
  function brickTex() {
    return canvasTex(512, (g, S) => {
      const r = rng(12), rows = 14, rh = S / rows, bw = 102;
      g.fillStyle = '#d9d2c7'; g.fillRect(0, 0, S, S);
      for (let j = 0; j < rows; j++) for (let i = -1; i < 6; i++) {
        const x = i * bw + (j % 2 ? bw / 2 : 0), k = 0.82 + r() * 0.3;
        g.fillStyle = shade('#b4573f', k); g.fillRect(x + 2, j * rh + 2, bw - 4, rh - 4);
        for (let n = 0; n < 40; n++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,220,200' : '60,20,10'},${r() * 0.12})`; g.fillRect(x + 2 + r() * (bw - 6), j * rh + 2 + r() * (rh - 6), 2 + r() * 4, 1 + r() * 2); }
      }
    });
  }
  function stoneWallTex() {
    return canvasTex(512, (g, S) => {
      const r = rng(15);
      g.fillStyle = '#8f8a80'; g.fillRect(0, 0, S, S);
      let y = 0;
      while (y < S) {
        const h = 50 + r() * 45, hh = Math.min(h, S - y); let x = -r() * 60;
        while (x < S) {
          const w = 90 + r() * 110, k = 0.8 + r() * 0.32;
          g.fillStyle = shade(r() > 0.5 ? '#b9b2a6' : '#a9a49a', k); g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 2, w - 4, hh - 4, 5) : g.rect(x + 2, y + 2, w - 4, hh - 4); g.fill();
          for (let n = 0; n < 60; n++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(x + 2 + r() * (w - 6), y + 2 + r() * (hh - 6), 2, 2); }
          x += w;
        }
        y += h;
      }
    });
  }
  function slatTex() {
    return canvasTex(512, (g, S) => {
      const r = rng(18), w = 51.2;
      g.fillStyle = '#2b1f16'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 10; i++) {
        g.fillStyle = shade('#c9a273', 0.82 + r() * 0.3); g.fillRect(i * w + 2, 0, w - 4, S);
        for (let l = 0; l < 22; l++) { g.strokeStyle = r() > 0.5 ? 'rgba(60,30,10,.12)' : 'rgba(255,240,210,.1)'; g.lineWidth = 1; const x = i * w + 4 + r() * (w - 8); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 6, S * 0.3, x + (r() - 0.5) * 6, S * 0.7, x, S); g.stroke(); }
      }
    });
  }
  function subwayTex() {
    return canvasTex(512, (g, S) => {
      const r = rng(21), tw = 128, th = 64;
      g.fillStyle = '#cfcfc9'; g.fillRect(0, 0, S, S);
      for (let j = 0; j < S / th; j++) for (let i = -1; i < S / tw; i++) {
        const x = i * tw + (j % 2 ? tw / 2 : 0), gr = g.createLinearGradient(x, j * th, x + tw, j * th + th);
        gr.addColorStop(0, shade('#f6f6f3', 0.97 + r() * 0.04)); gr.addColorStop(1, shade('#eeeeea', 0.96 + r() * 0.04));
        g.fillStyle = gr; g.fillRect(x + 2, j * th + 2, tw - 4, th - 4);
      }
    });
  }
  function wallpaperTex() {
    return canvasTex(256, (g, S) => {
      g.fillStyle = '#f2ece2'; g.fillRect(0, 0, S, S);
      const n = 4, t = S / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const cx = i * t + t / 2 + ((j % 2) * t) / 2, cy = j * t + t / 2;
        g.fillStyle = 'rgba(120,100,70,.18)'; g.beginPath(); g.moveTo(cx, cy - 20); g.quadraticCurveTo(cx + 18, cy, cx, cy + 20); g.quadraticCurveTo(cx - 18, cy, cx, cy - 20); g.fill();
        g.fillStyle = 'rgba(120,100,70,.14)'; g.beginPath(); g.arc(cx, cy - 26, 4, 0, 7); g.arc(cx, cy + 26, 4, 0, 7); g.fill();
      }
    });
  }
  function stripeTex() {
    return canvasTex(512, (g, S) => {
      const w = S / 16;
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#ddd0b8' : '#f7f1e6'; g.fillRect(i * w, 0, w, S); }
      g.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 16; i++) g.fillRect(i * w, 0, 1.5, S);
    });
  }
  function stuccoTex() {
    return canvasTex(512, (g, S) => {
      const r = rng(30);
      g.fillStyle = '#f0e8d8'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 26000; i++) { const v = r(); g.fillStyle = v > 0.5 ? `rgba(255,255,255,${r() * 0.35})` : `rgba(120,100,70,${r() * 0.25})`; const s = 2 + r() * 6; g.beginPath(); g.arc(r() * S, r() * S, s / 2, 0, 7); g.fill(); }
    });
  }
  const floorCache = {};
  function floorMat(def) {
    if (floorCache[def.id]) return floorCache[def.id];
    let map, tile = 1.2, rough = 0.55, env = 0.45, bs = 0.12;
    switch (def.kind) {
      case 'wood': tile = def.pattern === 'chevron' ? 1.2 : 2.4; map = def.pattern === 'chevron' ? chevronTex(def.color, def.id.length) : woodTex(def.color, def.color.charCodeAt(2) + def.id.length); rough = def.id === 'dark' ? 0.3 : 0.4; break;
      case 'tile': {
        if (def.pattern === 'checker') { map = checkerTex(def.color, '#2b2b2f'); rough = 0.12; env = 1; bs = 0.25; break; }
        if (def.pattern === 'mosaic') { map = mosaicTex(def.color); rough = 0.15; env = 1; bs = 0.4; break; }
        const n = def.id === 'azulejo' ? 4 : def.id === 'terracotta' ? 3 : 2;
        map = tileTex(def.color, def.id === 'terracotta' ? '#8a6a55' : def.id === 'azulejo' ? '#c9d4d8' : '#cfcdc7', n);
        rough = def.id === 'terracotta' ? 0.75 : 0.14; env = def.id === 'terracotta' ? 0.3 : 1; bs = 0.3; break;
      }
      case 'marble': map = T('marble', marbleTex); tile = 2.4; rough = 0.1; env = 1.1; break;
      case 'concrete': map = concreteTex(def.color); tile = 2; rough = 0.42; break;
      case 'carpet': map = carpetTex(def.color); tile = 0.9; rough = 1; env = 0.1; bs = 0.3; break;
      case 'grass': map = T('grass', grassTex); tile = 5; rough = 1; env = 0.12; bs = 0.6; break;
      case 'gravel': map = stoneTex(def.color); tile = 0.9; rough = 1; env = 0.1; bs = 1.2; break;
      default: map = stoneTex(def.color); rough = 0.85; bs = 0.2;
    }
    const K = { wood: [1.1, 0.4, def.id === 'dark' ? 0.45 : 0.35], tile: [2.4, 0.25, 0.3], marble: [0.5, 0.1, 0.45], concrete: [1, 0.4, 0], carpet: [2, 0.12, 0], stone: [2, 0.3, 0], grass: [1.6, 0.9, 0], gravel: [2.4, 0.9, 0] }[def.kind] || [1.5, 0.3, 0];
    const pb = pbrMaps(map, K[0], rough, K[1]);
    const m = new THREE.MeshPhysicalMaterial({ map, normalMap: pb.normalMap, normalScale: new THREE.Vector2(1, 1), roughnessMap: pb.roughnessMap, roughness: 1, metalness: 0, envMapIntensity: env, clearcoat: K[2], clearcoatRoughness: 0.12 });
    return (floorCache[def.id] = { mat: m, tile });
  }

  /* ---------- arte procedural ---------- */
  const ART_PAL = [['#efe6d8', '#c96f3b', '#2f4858', '#e2b04a', '#8aa17a'], ['#f3eee6', '#d98a7a', '#3d5a6c', '#f0c987', '#6f8f72'], ['#ece6da', '#b5533c', '#22333b', '#c9a35c', '#a3b18a'], ['#f5f0ea', '#7a9e9f', '#e07a5f', '#3d405b', '#f2cc8f']];
  const artDraw = {
    abstract(g, W, H, r) {
      const p = ART_PAL[(r() * ART_PAL.length) | 0];
      g.fillStyle = p[0]; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        g.fillStyle = p[1 + ((r() * 4) | 0)]; g.globalAlpha = 0.9;
        const t = r(), x = r() * W, y = r() * H, s = Math.min(W, H) * (0.25 + r() * 0.4);
        if (t < 0.4) { g.beginPath(); g.arc(x, y, s / 2, 0, 7); g.fill(); }
        else if (t < 0.75) g.fillRect(x - s / 2, y - s / 2, s, s * (0.5 + r()));
        else { g.beginPath(); g.arc(x, y + s / 2, s / 2, Math.PI, 0); g.lineTo(x + s / 2, y + s); g.lineTo(x - s / 2, y + s); g.fill(); }
      }
      g.globalAlpha = 1;
    },
    landscape(g, W, H, r) {
      const sky = g.createLinearGradient(0, 0, 0, H * 0.7), warm = r() > 0.4;
      if (warm) { sky.addColorStop(0, '#3d3a6b'); sky.addColorStop(0.6, '#e8836b'); sky.addColorStop(1, '#ffd9a0'); } else { sky.addColorStop(0, '#6fa6d8'); sky.addColorStop(1, '#f3e9d2'); }
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,246,214,.95)'; g.beginPath(); g.arc(W * (0.2 + r() * 0.6), H * 0.36, H * 0.09, 0, 7); g.fill();
      const cols = warm ? ['#6a4c7d', '#4a3a6a', '#2d2a4f', '#1b1a33'] : ['#8fb0c7', '#5e8aa5', '#3d6a80', '#264a5e'];
      cols.forEach((c, i) => {
        g.fillStyle = c; g.beginPath(); g.moveTo(0, H);
        const base = H * (0.5 + i * 0.1), a1 = r() * 6, a2 = r() * 6;
        for (let x = 0; x <= W; x += 8) g.lineTo(x, base - Math.sin(x / W * 3 + a1) * H * 0.07 - Math.sin(x / W * 9 + a2) * H * 0.03 * (1 - i * 0.2));
        g.lineTo(W, H); g.fill();
      });
    },
    botanic(g, W, H, r) {
      g.fillStyle = '#f0eadc'; g.fillRect(0, 0, W, H);
      const greens = ['#4b6b45', '#6f8f5f', '#3d5a3a', '#89a877'];
      for (let k = 0; k < 3; k++) {
        const x0 = W * (0.25 + k * 0.25) + (r() - 0.5) * 40;
        g.strokeStyle = '#4b6b45'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, H); g.quadraticCurveTo(x0 + (r() - 0.5) * 80, H * 0.5, x0 + (r() - 0.5) * 60, H * (0.12 + r() * 0.2)); g.stroke();
        for (let i = 0; i < 9; i++) {
          const t = i / 9, side = i % 2 ? 1 : -1;
          g.save(); g.translate(x0 + Math.sin(t * 3 + k) * 30, H * (0.88 - t * 0.7)); g.rotate(side * (0.3 + r() * 0.3));
          g.fillStyle = greens[(r() * 4) | 0]; g.beginPath(); g.ellipse(side * 34, 0, 50, 18, 0, 0, 7); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(side * 84, 0); g.stroke(); g.restore();
        }
      }
    },
    geo(g, W, H) {
      g.fillStyle = '#f3efe6'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1a1a1d'; g.beginPath(); g.arc(W * 0.5, H * 0.36, W * 0.24, 0, 7); g.fill();
      g.fillStyle = '#c96f3b'; g.beginPath(); g.arc(W * 0.5, H, W * 0.42, Math.PI, 0); g.fill();
      g.fillStyle = '#1a1a1d'; g.fillRect(W * 0.1, H * 0.12, W * 0.07, H * 0.4);
      g.fillStyle = '#d9a441'; g.fillRect(W * 0.78, H * 0.55, W * 0.12, H * 0.3);
    },
    waves(g, W, H) {
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#efe3d0'); bg.addColorStop(1, '#e2cdb2');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) {
        g.strokeStyle = `hsl(${12 + i * 3},${45 + i}%,${42 + i * 1.5}%)`; g.lineWidth = 5; g.beginPath();
        for (let x = 0; x <= W; x += 6) { const y = H * (0.12 + i * 0.052) + Math.sin(x / W * 5 + i * 0.5) * H * 0.05; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      }
    },
  };
  function artTexture(style, seed, aspect) {
    const W = 600, H = Math.max(300, Math.min(900, Math.round(600 / aspect)));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    (artDraw[style] || artDraw.abstract)(c.getContext('2d'), W, H, rng(seed || 1));
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  /* ---------- materiales ---------- */
  const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  function mat(hex, o) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: C(hex), roughness: 0.7, metalness: 0, envMapIntensity: 0.8 }, o || {}));
  }
  function buildMats() {
    const glassOpt = { transparent: true, opacity: 0.18, roughness: 0.03, metalness: 0.1, envMapIntensity: 1.6, depthWrite: false };
    const bookCache = {}, artCache = {};
    const fb = T('fabBump', fabricBump), fn = T('fabN', () => normalOf(fb, 3)); fn.repeat.set(5, 5);
    const wm = T('woodF', () => { const t = grainTex('#dcc39c'); t.repeat.set(0.85, 0.85); return t; });
    const wb = T('woodFb', () => { const t = normalOf(wm, 2.5); t.repeat.set(0.85, 0.85); return t; });
    const dm = T('woodD', () => { const t = woodTex('#dcc39c', 9); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; t.repeat.set(1.4, 1.1); return t; });
    const pn = T('plasterN', () => normalOf(T('plaster', plasterBump), 1.6)); pn.repeat.set(4, 3);
    const wood = (hex, rough) => new THREE.MeshStandardMaterial({ color: C(hex), map: wm, normalMap: wb, normalScale: new THREE.Vector2(0.3, 0.3), roughness: rough || 0.55, envMapIntensity: 0.8 });
    const fab = (hex, rough, sc) => mat(hex, { roughness: rough || 0.95, normalMap: fn, normalScale: new THREE.Vector2((sc || 1.4) * 0.1, (sc || 1.4) * 0.1), envMapIntensity: 0.25 });
    M = FP.Mats = {
      oak: wood('#ffffff'), tableWood: wood('#b47a4b', 0.42), oakDark: wood('#c9995f'), walnut: wood('#7f543a', 0.5),
      white: mat('#f3f1ed', { roughness: 0.45 }), wardrobeBody: mat('#ece7de'), wardrobeDoor: mat('#f5f2ec', { roughness: 0.4 }),
      headboard: fab('#8b96a3', 0.95, 2), bedding: fab('#f4f2ee', 0.95, 1), duvetA: fab('#a9bccd', 0.95, 2), duvetB: fab('#e6dfd3', 0.95, 2), duvetFold: fab('#f4f2ee', 0.95, 2),
      pillow: fab('#fbfaf7', 0.95, 1), accent: fab('#cf7644', 0.9, 2),
      rug: fab('#d9cfc0', 1, 3), rug2: fab('#c9c4bb', 1, 3),
      brass: mat('#c9a35c', { metalness: 0.9, roughness: 0.3 }), lampshade: mat('#f3e3c3', { roughness: 0.9, emissive: C('#3a2a10') }),
      chrome: mat('#d5d8dc', { metalness: 1, roughness: 0.18 }), blackPlastic: mat('#1e2024', { roughness: 0.4 }),
      screen: mat('#050608', { roughness: 0.15, metalness: 0.2, emissive: C('#102040'), emissiveIntensity: 0.6 }),
      chairSeat: fab('#d9cdbb', 0.9, 1.6), sofaBase: fab('#7d8b98', 0.95, 2.2), cushion: fab('#95a3b0', 0.97, 2.4),
      cushion2: fab('#cbb8a2', 0.97, 2), armBase: fab('#b9a58f', 0.95, 2),
      glass: new THREE.MeshStandardMaterial(Object.assign({ color: C('#cfe6f5') }, glassOpt)),
      glassDark: new THREE.MeshStandardMaterial({ color: C('#1c2a3a'), roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.75 }),
      steel: mat('#b9bec4', { metalness: 0.85, roughness: 0.32 }), steelDark: mat('#8b9096', { metalness: 0.9, roughness: 0.3 }),
      blackGlass: mat('#0e1013', { roughness: 0.08, metalness: 0.4 }),
      cabinet: mat('#eeebe4', { roughness: 0.4 }), cabinetDoor: mat('#f7f5f0', { roughness: 0.3 }),
      cabinetIsland: mat('#3f5566', { roughness: 0.4 }), cabinetDoorIsland: mat('#4b6478', { roughness: 0.32 }), cabinetBath: wood('#e6c79c', 0.5),
      marble: new THREE.MeshStandardMaterial({ map: T('marble', marbleTex), roughness: 0.16, envMapIntensity: 1 }),
      ceramic: mat('#fbfbfb', { roughness: 0.12, envMapIntensity: 1.2 }), ceramicIn: mat('#eef3f6', { roughness: 0.1 }), seat: mat('#f4f4f4', { roughness: 0.3 }),
      mirror: mat('#dfe6ea', { metalness: 1, roughness: 0.03 }),
      leaf1: mat('#3f7d47', { roughness: 0.6 }), leaf2: mat('#5b9a55', { roughness: 0.6 }), terracotta: mat('#b9623e', { roughness: 0.9, normalMap: pn, normalScale: new THREE.Vector2(1.2, 1.2) }), soil: mat('#3a2a20', { roughness: 1 }),
      whiteAppl: mat('#f2f4f6', { roughness: 0.28 }),
      book: (c) => bookCache[c] || (bookCache[c] = mat(c, { roughness: 0.8 })),
      // puertas
      doorWoodTex: new THREE.MeshStandardMaterial({ color: C('#f0d8b4'), map: dm, roughness: 0.5, envMapIntensity: 0.7 }),
      doorWhite: mat('#f6f4f0', { roughness: 0.42 }), doorPanel: mat('#eeebe5', { roughness: 0.45 }), doorBlack: mat('#202124', { roughness: 0.45 }),
      doorFrame: mat('#f7f5f1', { roughness: 0.45 }), threshold: mat('#b9a58f', { roughness: 0.6 }), hinge: mat('#8f9296', { metalness: 1, roughness: 0.3 }),
      alu: mat('#2b2d31', { metalness: 0.7, roughness: 0.4 }),
      // paredes y techo
      wall: mat('#f1e9dc', { roughness: 0.93, envMapIntensity: 0.3, normalMap: pn, normalScale: new THREE.Vector2(0.12, 0.12) }), wallOut: mat('#ebe7df', { roughness: 0.95, normalMap: pn, normalScale: new THREE.Vector2(0.1, 0.1) }),
      ceiling: mat('#f6f1e8', { roughness: 0.92, envMapIntensity: 0.2 }), baseboard: mat('#f8f6f2', { roughness: 0.4 }),
      lampOn: new THREE.MeshStandardMaterial({ color: C('#fffaf0'), emissive: C('#fff1d2'), emissiveIntensity: 1, roughness: 0.4 }),
      ground: new THREE.MeshStandardMaterial({ map: T('grass', grassTex), color: C('#ffffff'), roughness: 1, envMapIntensity: 0.2 }), slab: mat('#dcdad5', { roughness: 0.9 }),
      // arte
      frameBlack: mat('#18181b', { roughness: 0.4 }), frameOak: wood('#f0dcb8', 0.5), frameWhite: mat('#f4f2ee', { roughness: 0.4 }), paper: mat('#fbf9f4', { roughness: 0.9 }),
      artMat: (style, seed, aspect) => { const k = style + seed + aspect.toFixed(2); return artCache[k] || (artCache[k] = new THREE.MeshStandardMaterial({ map: artTexture(style, seed, aspect), roughness: 0.55, envMapIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); },
    };
    M.panelMesh = (w, h, tex, color) => { const wm = wallMat({ tex, color: color || '#ffffff' }); return new THREE.Mesh(wallPlane(w, h, wm.tile, 0, 0), wm.mat); };
    initTV();
    M.tvScreen = new THREE.MeshBasicMaterial({ map: tv.tex, toneMapped: false });
    FP.Models.init(M);
  }

  /* ---------- cielo, entorno y luz ---------- */
  function skyTex(cols) {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 512;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, cols[0]); gr.addColorStop(0.5, cols[1]); gr.addColorStop(0.55, cols[2]); gr.addColorStop(1, cols[2]);
    g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function setInterior(on) {
    ceilings.forEach((c) => { c.castShadow = on; });
    fixtures.forEach((f) => { f.visible = on; });   // focos solo al recorrer la casa; la luz se queda siempre
    ceilAOs.forEach((c) => { c.visible = on; });
  }
  function applyLight(name, P) {
    const L = LIGHTS[name], wk = typeof walk !== 'undefined' && walk.on;
    lightName = name;
    const B = wk ? L.wk : { exp: 1, hemi: 1, lamp: 1 };
    renderer.toneMappingExposure = L.exp * B.exp;
    if (sky.material.map) sky.material.map.dispose();
    sky.material.map = skyTex(L.sky);
    sky.material.needsUpdate = true;
    // entorno para reflejos
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 16, 16), new THREE.MeshBasicMaterial({ map: skyTex(L.sky), side: THREE.BackSide })));
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(L.sun).multiplyScalar(name === 'night' ? 0.4 : name === 'sunset' ? 0.9 : 1.6) }));
    const az = U.rad(L.az), el = U.rad(L.el);
    sunDisc.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(45);
    es.add(sunDisc);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(es, 0.02);
    scene.environment = envRT.texture;
    // luces
    sun.color.setHex(L.sun); sun.intensity = L.si;
    hemi.color.setHex(L.hs); hemi.groundColor.setHex(L.hg); hemi.intensity = L.hi * B.hemi;
    if (P) placeSun(P);
    dynamic.lamps.forEach((l) => {
      if (l.userData.user) { l.color.set(l.userData.tint); l.intensity = Math.max(L.lamp, 0.85) * l.userData.k * Math.max(1, B.lamp * 0.7); } // las lámparas puestas a propósito alumbran también de día
      else { l.color.setHex(L.pl); l.intensity = L.lamp * l.userData.k * B.lamp; }
    });
    dynamic.emis.forEach((m) => { m.emissiveIntensity = 0.15 + L.emis * 1.3; });
    dynamic.halos.forEach((h) => { h.material.opacity = name === 'night' ? 0.55 : name === 'sunset' ? 0.32 : 0.06; });
    updateSkyline(name, P);
    if (P && levelsBelow(P) > 0) { scene.fog = new THREE.FogExp2(new THREE.Color(L.sky[2]).convertSRGBToLinear(), name === 'night' ? 0.006 : 0.0032); const fm = facadeMat(); fm.emissiveIntensity = name === 'night' ? 0.42 : name === 'sunset' ? 0.12 : 0; } else scene.fog = null;
    M.screen.emissiveIntensity = 0.4 + L.emis;
    M.lampshade.emissiveIntensity = 0.3 + L.emis * 1.2;
  }
  /** Caja que contiene todos los niveles, jardines y terrazas (puede salirse de la base de la casa). */
  function extent(P) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    FP.Levels.views(P).forEach((v) => { const b = FP.Walls.bounds(v); x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); });
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cz: (y0 + y1) / 2 };
  }
  function placeSun(P) {
    const L = LIGHTS[lightName], E = extent(P), W = E.w, H = E.h, R = Math.max(W, H), az = U.rad(L.az), el = U.rad(L.el);
    sun.position.set(E.cx + Math.sin(az) * Math.cos(el) * R * 2, Math.sin(el) * R * 2, E.cz + Math.cos(az) * Math.cos(el) * R * 2);
    sun.target.position.set(E.cx, 0, E.cz);
    const sc = sun.shadow.camera;
    Object.assign(sc, { left: -R * 0.9, right: R * 0.9, top: R * 0.9, bottom: -R * 0.9, near: 0.5, far: R * 6 });
    sc.updateProjectionMatrix();
  }

  /* ---------- inicialización ---------- */
  async function ensure() {
    if (ready) return;
    if (!loading) loading = loadScript(THREE_URL).then(() => loadScript(ORBIT_URL)).catch((e) => { loading = null; throw e; });
    await loading;
    init();
    ready = true;
  }
  function init() {
    host = document.getElementById('view3d');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    pmrem = new THREE.PMREMGenerator(renderer);
    sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, fog: false }));
    scene.add(sky);
    skyline = new THREE.Mesh(new THREE.CylinderGeometry(330, 330, 240, 64, 1, true), new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    skyline.renderOrder = -1;
    scene.add(skyline);
    hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.5);
    sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; sun.shadow.radius = 4;
    scene.add(hemi, sun, sun.target);
    buildMats();
    applyLight(lightName, null);
    window.addEventListener('resize', resize);
    bindWalk();
  }
  function resize() {
    if (!ready || !active) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ---------- construcción de la escena ---------- */
  const mesh = (geo, m, x, y, z, cast, recv) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast !== false; o.receiveShadow = recv !== false; return o; };
  const bx = (w, h, d, m, x, y, z, cast) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, cast);

  /** Resta rectángulos (huecos de escalera) a un rectángulo; devuelve las piezas que quedan. */
  function carve(rect, holes) {
    let pieces = [rect];
    (holes || []).forEach((h) => {
      const next = [];
      pieces.forEach((a) => {
        const x0 = Math.max(a.x, h.x), x1 = Math.min(a.x + a.w, h.x + h.w), y0 = Math.max(a.y, h.y), y1 = Math.min(a.y + a.h, h.y + h.h);
        if (x1 - x0 < 0.01 || y1 - y0 < 0.01) { next.push(a); return; }
        [{ x: a.x, y: a.y, w: a.w, h: y0 - a.y }, { x: a.x, y: y1, w: a.w, h: a.y + a.h - y1 }, { x: a.x, y: y0, w: x0 - a.x, h: y1 - y0 }, { x: x1, y: y0, w: a.x + a.w - x1, h: y1 - y0 }]
          .forEach((q) => { if (q.w > 0.01 && q.h > 0.01) next.push(q); });
      });
      pieces = next;
    });
    return pieces;
  }

  function planeUV(w, h, tile) {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * h / tile);
    return g;
  }

  function buildWindow(cut, s, ux, uz, ang, group) {
    const o = cut.o, st = FP.Openings.style('window', o.style), w = cut.b - cut.a, hh = st.top - st.sill;
    const c = (cut.a + cut.b) / 2, g = new THREE.Group();
    g.position.set(s.x1 + ux * c, 0, s.y1 + uz * c);
    g.rotation.y = -ang;
    const fr = 0.05, y0 = st.sill, sliding = o.style === 'sliding' || o.style === 'floorsl';
    const add = (m) => { m.castShadow = true; g.add(m); };
    // marco
    add(bx(w, fr, 0.08, M.alu, 0, y0 + fr / 2, 0)); add(bx(w, fr, 0.08, M.alu, 0, st.top - fr / 2, 0));
    add(bx(fr, hh, 0.08, M.alu, -w / 2 + fr / 2, y0 + hh / 2, 0)); add(bx(fr, hh, 0.08, M.alu, w / 2 - fr / 2, y0 + hh / 2, 0));
    // cristales
    if (sliding) {
      const pw = w / 2 + 0.03;
      [[-1, 0.02], [1, -0.02]].forEach(([sd, z]) => {
        const px = sd * (w / 4 - 0.015);
        g.add(bx(pw, hh - fr * 2, 0.008, M.glass, px, y0 + hh / 2, z, false));
        add(bx(0.04, hh - fr * 2, 0.03, M.alu, px + sd * (pw / 2 - 0.02) * -1, y0 + hh / 2, z));
        add(bx(0.04, hh - fr * 2, 0.03, M.alu, px + sd * (pw / 2 - 0.02), y0 + hh / 2, z));
      });
    } else {
      g.add(bx(w - fr * 2, hh - fr * 2, 0.008, M.glass, 0, y0 + hh / 2, 0, false));
      const mull = o.style === 'large' ? [0] : o.style === 'floor' ? [-w / 6, w / 6] : [];
      mull.forEach((x) => add(bx(0.035, hh - fr * 2, 0.06, M.alu, x, y0 + hh / 2, 0)));
      if (o.style === 'single') add(bx(0.035, hh - fr * 2, 0.06, M.alu, 0, y0 + hh / 2, 0));
    }
    // repisa interior (no en ventanales)
    if (st.sill > 0.05) g.add(bx(w + 0.08, 0.03, 0.18, M.white, 0, y0 - 0.015, 0.02));
    group.add(g);
  }

  function buildRail(s, room, group) {
    const dx = s.x2 - s.x1, dz = s.y2 - s.y1, L = Math.hypot(dx, dz);
    if (L < 0.1) return;
    const g = new THREE.Group(), style = (room && room.rail) || 'glass';
    g.position.set((s.x1 + s.x2) / 2, 0, (s.y1 + s.y2) / 2);
    g.rotation.y = -Math.atan2(dz, dx);
    const add = (w, h, d, m, x, y, z, cast) => g.add(bx(w, h, d, m, x, y, z, cast));
    if (style === 'wall') { add(L, 1.05, 0.14, M.wallOut, 0, 0.525, 0); add(L + 0.04, 0.05, 0.18, M.white, 0, 1.075, 0); }
    else {
      const posts = Math.max(2, Math.round(L / 1.4) + 1);
      add(L, 0.05, 0.06, M.steel, 0, 1.08, 0); add(L, 0.06, 0.06, M.steel, 0, 0.1, 0);
      for (let i = 0; i < posts; i++) add(0.05, 1.1, 0.05, M.steel, -L / 2 + (L * i) / (posts - 1), 0.55, 0);
      if (style === 'glass') add(L - 0.08, 0.9, 0.015, M.glass, 0, 0.6, 0, false);
      else for (let x = -L / 2 + 0.1; x < L / 2 - 0.05; x += 0.11) add(0.018, 0.95, 0.018, M.blackPlastic, x, 0.6, 0);
    }
    group.add(g);
  }

  function buildWalls(P, group) {
    const done = new Set();
    FP.Walls.segments(P).forEach((s) => {
      if (s.src === 'rail') { buildRail(s, P.rooms.find((q) => q.id === s.id), group); return; }
      const dx = s.x2 - s.x1, dz = s.y2 - s.y1, L = Math.hypot(dx, dz);
      if (L < 0.05) return;
      const ux = dx / L, uz = dz / L, ang = Math.atan2(dz, dx), out = s.src === 'boundary';
      const piece = (a, b, y0, y1) => {
        if (b - a < 0.005 || y1 - y0 < 0.005) return;
        const c = (a + b) / 2, m = bx(b - a, y1 - y0, s.t, out ? M.wallOut : M.wall, s.x1 + ux * c, (y0 + y1) / 2, s.y1 + uz * c);
        m.rotation.y = -ang;
        group.add(m);
      };
      const cuts = [];
      P.openings.forEach((o) => {
        const rel = (o.x - s.x1) * ux + (o.y - s.y1) * uz, perp = Math.abs(-(o.x - s.x1) * uz + (o.y - s.y1) * ux);
        if (perp < 0.2 && rel > 0 && rel < L) cuts.push({ a: Math.max(0, rel - o.w / 2), b: Math.min(L, rel + o.w / 2), o });
      });
      cuts.sort((p, q) => p.a - q.a);
      let cur = 0;
      cuts.forEach((c) => {
        piece(cur, c.a, 0, WALL_H);
        if (c.o.kind === 'door') {
          piece(c.a, c.b, 2.1, WALL_H);
          if (!done.has(c.o.id)) buildDoorFrame(c, s, ux, uz, ang, group);
        } else {
          const st = FP.Openings.style('window', c.o.style);
          piece(c.a, c.b, 0, st.sill); piece(c.a, c.b, st.top, WALL_H);
          if (!done.has(c.o.id)) buildWindow(c, s, ux, uz, ang, group);
        }
        done.add(c.o.id);
        cur = Math.max(cur, c.b);
      });
      piece(cur, L, 0, WALL_H);
    });
  }

  function buildDoorFrame(c, s, ux, uz, ang, group) {
    const g = new THREE.Group(), mid = (c.a + c.b) / 2, w = c.b - c.a, t = s.t, fr = M.doorFrame;
    g.position.set(s.x1 + ux * mid, 0, s.y1 + uz * mid);
    g.rotation.y = -ang;
    g.add(bx(0.04, 2.1, t, fr, -w / 2 + 0.02, 1.05, 0), bx(0.04, 2.1, t, fr, w / 2 - 0.02, 1.05, 0), bx(w, 0.04, t, fr, 0, 2.08, 0));
    [-1, 1].forEach((sd) => {
      const z = sd * (t / 2 + 0.008);
      g.add(bx(0.075, 2.15, 0.016, fr, -w / 2 - 0.0375, 1.075, z), bx(0.075, 2.15, 0.016, fr, w / 2 + 0.0375, 1.075, z), bx(w + 0.15, 0.075, 0.016, fr, 0, 2.1 + 0.0375, z));
    });
    g.add(bx(w - 0.08, 0.012, t + 0.02, M.threshold, 0, 0.006, 0, false));
    group.add(g);
  }

  const paintCache = {};
  const paintMat = (hex) => paintCache[hex] || (paintCache[hex] = mat(hex, { roughness: 0.42 }));

  /** Hoja de puerta con origen en la bisagra; se extiende hacia +x (dir). Diseños: wood, oak_slat, white, shaker, flush, black, glass, french. */
  function doorSlab(len, dir, o) {
    const fin = o.finish || 'wood', L = new THREE.Group(), H = 2.02, col = o.color || '#f6f4f0';
    const painted = fin === 'white' || fin === 'shaker' || fin === 'flush';
    const add = (w, h, d, m, x, y, z) => { L.add(bx(w, h, d, m, dir * x, y, z, false)); };
    const glass = fin === 'glass' || fin === 'french';
    if (!glass) add(len, H, 0.04, painted ? paintMat(col) : fin === 'black' ? M.doorBlack : fin === 'oak_slat' ? M.walnut : M.doorWoodTex, len / 2, H / 2 + 0.005, 0);
    if (fin === 'white') {
      const cw = (len - 0.24) / 2;
      [[0.15, 0.5], [0.75, 0.42], [1.25, 0.6]].forEach(([y, h]) => [0, 1].forEach((i) => add(cw, h, 0.05, paintMat(col), 0.09 + cw / 2 + i * (cw + 0.06), y + h / 2, 0)));
    } else if (fin === 'shaker') {
      const cw = (len - 0.3) / 2, bar = 0.05;
      [0, 1].forEach((i) => {
        const cx = 0.1 + cw / 2 + i * (cw + 0.1);
        [[0.14, 0.45], [1.05, 0.83]].forEach(([y, h]) => {
          add(cw + bar * 2, bar, 0.048, paintMat(col), cx, y, 0); add(cw + bar * 2, bar, 0.048, paintMat(col), cx, y + h, 0);
          add(bar, h, 0.048, paintMat(col), cx - cw / 2 - bar / 2, y + h / 2, 0); add(bar, h, 0.048, paintMat(col), cx + cw / 2 + bar / 2, y + h / 2, 0);
        });
      });
    } else if (fin === 'oak_slat') {
      const n = Math.floor((len - 0.04) / 0.075);
      for (let i = 0; i < n; i++) [-1, 1].forEach((sd) => add(0.058, H - 0.05, 0.02, M.oak, 0.03 + i * 0.075 + 0.03, H / 2 + 0.005, sd * 0.02));
    } else if (fin === 'wood') add(0.006, H - 0.2, 0.042, M.walnut, len * 0.5, H / 2 + 0.005, 0);
    else if (fin === 'glass') {
      const fr = 0.06;
      add(len, fr, 0.045, M.alu, len / 2, H - fr / 2, 0); add(len, fr, 0.045, M.alu, len / 2, fr / 2 + 0.005, 0);
      add(fr, H, 0.045, M.alu, fr / 2, H / 2 + 0.005, 0); add(fr, H, 0.045, M.alu, len - fr / 2, H / 2 + 0.005, 0);
      add(len - fr * 2, H - fr * 2, 0.012, mat('#e8f0f4', { transparent: true, opacity: 0.5, roughness: 0.2, depthWrite: false }), len / 2, H / 2 + 0.005, 0);
    } else if (fin === 'french') {
      const fr = 0.07, fm = paintMat(col);
      add(len, fr, 0.045, fm, len / 2, H - fr / 2, 0); add(len, fr * 1.4, 0.045, fm, len / 2, fr * 0.7 + 0.005, 0);
      add(fr, H, 0.045, fm, fr / 2, H / 2 + 0.005, 0); add(fr, H, 0.045, fm, len - fr / 2, H / 2 + 0.005, 0);
      add(len - fr * 2, H - fr * 2.4, 0.01, M.glass, len / 2, H / 2 + 0.03, 0);
      for (let i = 1; i < 3; i++) add(0.022, H - fr * 2.4, 0.03, fm, fr + ((len - fr * 2) * i) / 3, H / 2 + 0.03, 0);
      for (let j = 1; j < 5; j++) add(len - fr * 2, 0.022, 0.03, fm, len / 2, fr * 1.4 + ((H - fr * 2.4) * j) / 5, 0);
    }
    // herrajes
    const hk = o.handle || (fin === 'black' ? 'brass' : 'chrome'), hm = hk === 'black' ? M.blackPlastic : hk === 'brass' ? M.brass : M.chrome, px = len - 0.08;
    [-1, 1].forEach((sd) => {
      if (hk === 'bar') {
        [0.75, 1.25].forEach((y) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), hm); p.rotation.x = Math.PI / 2; p.position.set(dir * (len - 0.07), y, sd * 0.045); L.add(p); });
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.55, 12), hm); bar.position.set(dir * (len - 0.07), 1.0, sd * 0.068); L.add(bar);
      } else {
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.008, 20), hm); plate.rotation.x = Math.PI / 2; plate.position.set(dir * px, 1.0, sd * 0.024); L.add(plate);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.035, 12), hm); stem.rotation.x = Math.PI / 2; stem.position.set(dir * px, 1.0, sd * 0.04); L.add(stem);
        L.add(bx(0.12, 0.018, 0.018, hm, dir * (px - 0.05), 1.0, sd * 0.058, false));
      }
    });
    [0.25, 1.0, 1.8].forEach((y) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.1, 10), M.hinge); h.position.set(0, y, 0); L.add(h); });
    return L;
  }

  function buildDoorLeaves(P, group) {
    P.openings.filter((o) => o.kind === 'door' && o.style !== 'open').forEach((o) => {
      const g = new THREE.Group();
      g.position.set(o.x, 0, o.y);
      g.rotation.y = -U.rad(o.rot || 0);
      const s = o.flip < 0 ? -1 : 1, mir = o.mirror ? -1 : 1, open = 1.05, clear = o.w - 0.09;
      const leaf = (hx, len, dir) => {
        const piv = new THREE.Group();
        piv.position.set(hx, 0, 0);
        piv.add(doorSlab(len, dir, o));
        piv.rotation.y = dir > 0 ? -open * s : open * s;
        g.add(piv);
      };
      if (o.style === 'single') leaf(-mir * (o.w / 2 - 0.045), clear, mir);
      else if (o.style === 'double') { leaf(-(o.w / 2 - 0.045), clear / 2, 1); leaf(o.w / 2 - 0.045, clear / 2, -1); }
      else if (o.style === 'barn') {
        const sl = doorSlab(o.w + 0.12, 1, o), pv = new THREE.Group();
        pv.position.set(-o.w / 2 - 0.06 + o.w * 0.5 * mir, 0.0, s * 0.075); pv.add(sl);
        if (mir < 0) pv.scale.x = -1;
        g.add(pv);
        g.add(bx(o.w * 2 + 0.3, 0.04, 0.04, M.blackPlastic, 0, 2.2, s * 0.06, false));
        [-0.25, 0.25].forEach((x) => g.add(bx(0.05, 0.16, 0.03, M.blackPlastic, x + o.w * 0.5 * mir, 2.13, s * 0.075, false)));
      } else {
        const pw = o.w * 0.52, gh = 2.0;
        [[-1, -0.03], [1, 0.03]].forEach(([sd, z]) => {
          const px = sd * (o.w / 4 - 0.02);
          g.add(bx(pw, gh, 0.006, M.glass, px, gh / 2 + 0.03, z, false));
          [[0, gh + 0.03 - 0.02, pw, 0.04], [0, 0.05, pw, 0.06], [-pw / 2 + 0.02, gh / 2 + 0.03, 0.04, gh], [pw / 2 - 0.02, gh / 2 + 0.03, 0.04, gh]].forEach(([dx, y, ww, hh]) => g.add(bx(ww, hh, 0.035, M.alu, px + dx, y, z)));
        });
      }
      group.add(g);
    });
  }

  /* ---------- paredes por habitación ---------- */
  const wallMatCache = {};
  function wallMat(d) {
    const k = d.tex + d.color;
    if (wallMatCache[k]) return wallMatCache[k];
    let map = null, bump = null, rough = 0.9, env = 0.3, bs = 0.1, tile = 1.2;
    const mk = (n, f) => T('wt:' + n, f);
    switch (d.tex) {
      case 'brick': map = mk('brick', brickTex); rough = 0.85; bs = 0.7; break;
      case 'stone': map = mk('stone', stoneWallTex); rough = 0.9; bs = 0.9; break;
      case 'wood': map = mk('slat', slatTex); rough = 0.5; bs = 0.25; env = 0.6; break;
      case 'concrete': map = mk('concw', () => concreteTex('#bdbcb8')); tile = 2; rough = 0.6; bs = 0.15; break;
      case 'tile': map = mk('subway', subwayTex); rough = 0.12; env = 1; bs = 0.25; break;
      case 'wallpaper': map = mk('paper', wallpaperTex); tile = 0.6; rough = 0.85; bs = 0.03; break;
      case 'stripe': map = mk('stripe', stripeTex); rough = 0.85; bs = 0.03; break;
      case 'marble': map = T('marble', marbleTex); tile = 2.4; rough = 0.1; env = 1.1; break;
      case 'stucco': map = mk('stucco', stuccoTex); rough = 0.95; bs = 0.25; break;
      default: bump = T('plaster', plasterBump); bs = 0.02;
    }
    let m;
    if (map) {
      const pb = T('wpbr:' + d.tex, () => pbrMaps(map, Math.max(0.6, bs * 2.2), rough, 0.3));
      m = new THREE.MeshPhysicalMaterial({ color: C(d.color), map, normalMap: pb.normalMap, normalScale: new THREE.Vector2(1, 1), roughnessMap: pb.roughnessMap, roughness: 1, metalness: 0, envMapIntensity: env, clearcoat: d.tex === 'tile' || d.tex === 'marble' ? 0.3 : 0, clearcoatRoughness: 0.15 });
    } else {
      const pn = T('plasterN', () => normalOf(T('plaster', plasterBump), 1.6));
      m = new THREE.MeshStandardMaterial({ color: C(d.color), normalMap: pn, normalScale: new THREE.Vector2(0.14, 0.14), roughness: rough, metalness: 0, envMapIntensity: env });
    }
    return (wallMatCache[k] = { mat: m, tile });
  }
  function wallPlane(w, h, tile, ox, oy) {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w + ox) / tile, (uv.getY(i) * h + oy) / tile);
    return g;
  }
  function cladRoom(P, r, group) {
    const d = FP.Rooms.wallDef(r);
    if (!d) return;
    const wm = wallMat(d), W = P.space.w, H = P.space.h;
    [[r.x, r.y, r.x + r.w, r.y, 0, 1], [r.x + r.w, r.y, r.x + r.w, r.y + r.h, -1, 0], [r.x + r.w, r.y + r.h, r.x, r.y + r.h, 0, -1], [r.x, r.y + r.h, r.x, r.y, 1, 0]].forEach(([x1, y1, x2, y2, nx, ny]) => {
      const dx = x2 - x1, dz = y2 - y1, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      const onB = FP.Walls.onOutline(P, x1, y1, x2, y2);
      const off = (onB ? 0.1 : 0.05) + 0.003, cuts = [];
      P.openings.forEach((o) => {
        const rel = (o.x - x1) * ux + (o.y - y1) * uz, perp = Math.abs(-(o.x - x1) * uz + (o.y - y1) * ux);
        if (perp < 0.2 && rel > 0 && rel < L) cuts.push({ a: Math.max(0, rel - o.w / 2), b: Math.min(L, rel + o.w / 2), o });
      });
      FP.Walls.gapIntervals(P, x1, y1, x2, y2).forEach((g) => cuts.push({ a: g[0], b: g[1], o: { kind: 'gap' } }));
      cuts.sort((p, q) => p.a - q.a);
      const pieces = [];
      let cur = 0;
      cuts.forEach((c) => {
        pieces.push([cur, c.a, 0, WALL_H]);
        if (c.o.kind === 'gap') { /* muro borrado: sin forro */ } else if (c.o.kind === 'door') pieces.push([c.a, c.b, 2.1, WALL_H]);
        else { const st = FP.Openings.style('window', c.o.style); pieces.push([c.a, c.b, 0, st.sill], [c.a, c.b, st.top, WALL_H]); }
        cur = Math.max(cur, c.b);
      });
      pieces.push([cur, L, 0, WALL_H]);
      pieces.forEach(([a, b, h0, h1]) => {
        if (b - a < 0.01 || h1 - h0 < 0.01) return;
        const m = new THREE.Mesh(wallPlane(b - a, h1 - h0, wm.tile, a, h0), wm.mat);
        m.position.set(x1 + ux * (a + b) / 2 + nx * off, (h0 + h1) / 2, y1 + uz * (a + b) / 2 + ny * off);
        m.rotation.y = Math.atan2(nx, ny);
        m.receiveShadow = true;
        group.add(m);
      });
    });
  }

  function baseboards(P, r, group) {
    const W = P.space.w, H = P.space.h;
    [[r.x, r.y, r.x + r.w, r.y, 0, 1], [r.x + r.w, r.y, r.x + r.w, r.y + r.h, -1, 0], [r.x + r.w, r.y + r.h, r.x, r.y + r.h, 0, -1], [r.x, r.y + r.h, r.x, r.y, 1, 0]].forEach(([x1, y1, x2, y2, nx, ny]) => {
      const dx = x2 - x1, dz = y2 - y1, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ang = Math.atan2(dz, dx);
      const onB = FP.Walls.onOutline(P, x1, y1, x2, y2);
      const off = (onB ? 0.1 : 0.05) + 0.007, cuts = [];
      P.openings.forEach((o) => {
        if (o.kind === 'window' && FP.Openings.style('window', o.style).sill > 0.05) return;
        const rel = (o.x - x1) * ux + (o.y - y1) * uz, perp = Math.abs(-(o.x - x1) * uz + (o.y - y1) * ux);
        if (perp < 0.2 && rel > 0 && rel < L) cuts.push([rel - o.w / 2, rel + o.w / 2]);
      });
      FP.Walls.gapIntervals(P, x1, y1, x2, y2).forEach((g) => cuts.push(g));
      cuts.sort((a, b) => a[0] - b[0]);
      let cur = 0;
      const seg = (a, b) => {
        if (b - a < 0.03) return;
        const c = (a + b) / 2, m = bx(b - a, 0.1, 0.014, M.baseboard, x1 + ux * c + nx * off, 0.05, y1 + uz * c + ny * off, false);
        m.rotation.y = -ang; group.add(m);
      };
      cuts.forEach((c) => { seg(cur, c[0] - 0.04); cur = Math.max(cur, c[1] + 0.04); });
      seg(cur, L);
    });
  }

  const MAX_USER_LIGHTS = 14;
  function buildFurniture(P, group) {
    P.furniture.forEach((f) => {
      let g = FP.Models.build(f);
      if (!g) {
        g = new THREE.Group();
        FP.Furniture.parts3(f).forEach((p) => {
          if (p.t === 'b') g.add(bx(p.w, p.z1 - p.z0, p.d, mat(p.c), p.x, (p.z0 + p.z1) / 2, p.y));
        });
      }
      g.position.set(f.x, 0, f.y);
      g.rotation.y = -U.rad(f.rot || 0);
      if (f.mirror) g.scale.x = -1;
      group.add(g);
      // lámparas del usuario: luces reales (hasta MAX_USER_LIGHTS en toda la casa)
      FP.Lamps.emitters(f).forEach((e) => {
        if (dynamic.lamps.filter((l) => l.userData.user).length >= MAX_USER_LIGHTS) return;
        let l;
        if (e.spot) { l = new THREE.SpotLight(0xffffff, 1, e.dist, 1.15, 0.6, 1.5); l.position.set(e.x, e.y, e.z); l.target.position.set(e.x, 0, e.z); group.add(l.target); }
        else { l = new THREE.PointLight(0xffffff, 1, e.dist, 1.5); l.position.set(e.x, e.y, e.z); }
        l.userData = { k: e.k, user: true, tint: e.tint };
        group.add(l);
        dynamic.lamps.push(l);
      });
    });
  }

  function buildRooms(P, group, holesBelow, holesUp) {
    const rooms = P.rooms.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    rooms.forEach((r, i) => {
      const fm = floorMat(FP.Rooms.floorDef(r));
      carve({ x: r.x, y: r.y, w: r.w, h: r.h }, holesBelow).forEach((pc) => {
        const fl = mesh(holesBelow && holesBelow.length ? wallPlane(pc.w, pc.h, fm.tile, pc.x, pc.y) : planeUV(pc.w, pc.h, fm.tile), fm.mat, pc.x + pc.w / 2, 0.004, pc.y + pc.h / 2, false);
        fl.rotation.x = -Math.PI / 2;
        group.add(fl);
      });
      if (FP.Walls.isOutdoor(P, r)) { if (r.type !== 'jardin' || P.level) group.add(bx(r.w, 0.14, r.h, M.slab, r.x + r.w / 2, -0.07, r.y + r.h / 2, false)); return; }
      cladRoom(P, r, group);
      if (r.type !== 'terraza' && r.type !== 'cochera' && r.type !== 'jardin') baseboards(P, r, group);
      const cols = Math.max(1, Math.round(r.w / 1.9)), rws = Math.max(1, Math.round(r.h / 1.9));
      const em = M.lampOn.clone();
      dynamic.emis.push(em);
      for (let a = 0; a < Math.min(cols, 4); a++) for (let b = 0; b < Math.min(rws, 4); b++) {
        const dx = r.x + (r.w * (a + 0.5)) / Math.min(cols, 4), dz = r.y + (r.h * (b + 0.5)) / Math.min(rws, 4);
        fixtures.push(group.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 20), em, dx, WALL_H - 0.012, dz, false, false)) && group.children[group.children.length - 1]);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: 0xffe2b0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.1 }));
        halo.position.set(dx, WALL_H - 0.06, dz); halo.scale.set(0.55, 0.55, 1);
        group.add(halo); dynamic.halos.push(halo); fixtures.push(halo);
      }
      // luces reales repartidas por el techo (2-4 según el tamaño); hay un tope global para no saturar la GPU
      const area = r.w * r.h, want = area < 9 ? 1 : area < 22 ? 2 : area < 40 ? 3 : 4;
      const nx = want >= 3 ? 2 : want, ny = want === 4 ? 2 : want === 3 ? 2 : 1, spots = [];
      for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) spots.push([r.x + (r.w * (a + 0.5)) / nx, r.y + (r.h * (b + 0.5)) / ny]);
      spots.slice(0, want).forEach(([lx, lz]) => {
        if (dynamic.lamps.filter((q) => !q.userData.user).length >= 16) return;
        const pl = new THREE.PointLight(0xffffff, 1, Math.max(4.2, Math.min(7, Math.max(r.w / nx, r.h / ny) * 1.9 + 1.5)), 1.5);
        pl.position.set(lx, WALL_H - 0.35, lz);
        pl.userData.k = want === 1 ? 1.0 : 0.72;
        group.add(pl);
        dynamic.lamps.push(pl);
      });
    });

    // techo en TODA la casa (toda la huella) y luces también donde no hay habitaciones
    const cells = FP.Walls.footprint(P).cells, inRoom = (x, z) => P.rooms.some((q) => x > q.x && x < q.x + q.w && z > q.y && z < q.y + q.h);
    const em2 = M.lampOn.clone();
    dynamic.emis.push(em2);
    let extra = 0;
    cells.forEach((c) => {
      carve(c, holesUp).forEach((pc) => {
        const ce = mesh(new THREE.PlaneGeometry(pc.w, pc.h), M.ceiling, pc.x + pc.w / 2, WALL_H - 0.005, pc.y + pc.h / 2, false);
        ce.rotation.x = Math.PI / 2;
        group.add(ce);
        ceilings.push(ce);
      });
      const nx = Math.max(1, Math.round(c.w / 1.9)), ny = Math.max(1, Math.round(c.h / 1.9));
      for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
        const x = c.x + (c.w * (a + 0.5)) / nx, z = c.y + (c.h * (b + 0.5)) / ny;
        if (inRoom(x, z)) continue;
        group.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 20), em2, x, WALL_H - 0.012, z, false, false)); fixtures.push(group.children[group.children.length - 1]);
        if (extra < 3 && dynamic.lamps.filter((q) => !q.userData.user).length < 16 && (a + b) % 2 === 0) {
          const pl = new THREE.PointLight(0xffffff, 1, 6, 1.7);
          pl.position.set(x, WALL_H - 0.35, z);
          pl.userData.k = 0.8;
          group.add(pl);
          dynamic.lamps.push(pl);
          extra++;
        }
      }
    });
    setInterior(typeof walk !== 'undefined' && walk.on);
  }

  /* ---------- oclusión ambiental falsa (contacto muro-piso, bajo muebles, techo) ---------- */
  let ceilings = [], ceilAOs = [], fixtures = [], levelGroups = [];
  const aoGrad = () => T('aoGrad', () => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 64;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.3, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
    return new THREE.CanvasTexture(c);
  });
  const aoBlob = () => T('aoBlob', () => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 22; g.fillStyle = '#000'; g.fillRect(36, 36, 56, 56);
    return new THREE.CanvasTexture(c);
  });
  const aoMat = (map, op) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, color: 0x000000 });
  function aoQuad(a, b, c, d, y) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], y, a[1], b[0], y, b[1], c[0], y, c[1], d[0], y, d[1]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
    g.setIndex([0, 2, 1, 0, 3, 2]);
    return g;
  }
  const NO_BLOB = new Set(['pond', 'pool', 'path', 'stones', 'hedge', 'shrub', 'rocks', 'fountain', 'flowerbed', 'pergola', 'firepit', 'hammock', 'glamp', 'fence', 'gate', 'sofa_out', 'shed', 'doghouse', 'poker_table']);
  function buildAO(P, group) {
    const W = P.space.w, H = P.space.h, wd = 0.5, floorM = aoMat(aoGrad(), 0.85), ceilM = aoMat(aoGrad(), 0.55);
    const ceilAO = new THREE.Group(); ceilAO.visible = false; group.add(ceilAO); ceilAOs.push(ceilAO);
    P.rooms.forEach((r) => {
      if (FP.Walls.isOutdoor(P, r)) return;
      [[r.x, r.y, r.x + r.w, r.y, 0, 1], [r.x + r.w, r.y, r.x + r.w, r.y + r.h, -1, 0], [r.x + r.w, r.y + r.h, r.x, r.y + r.h, 0, -1], [r.x, r.y + r.h, r.x, r.y, 1, 0]].forEach(([x1, y1, x2, y2, nx, ny]) => {
        const dx = x2 - x1, dz = y2 - y1, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
        const onB = FP.Walls.onOutline(P, x1, y1, x2, y2);
        const off = onB ? 0.1 : 0.05, cuts = [];
        P.openings.forEach((o) => {
          if (o.kind === 'window' && FP.Openings.style('window', o.style).sill > 0.05) return;
          const rel = (o.x - x1) * ux + (o.y - y1) * uz, perp = Math.abs(-(o.x - x1) * uz + (o.y - y1) * ux);
          if (perp < 0.2 && rel > 0 && rel < L) cuts.push([rel - o.w / 2, rel + o.w / 2]);
        });
        FP.Walls.gapIntervals(P, x1, y1, x2, y2).forEach((g) => cuts.push(g));
        cuts.sort((p, q) => p[0] - q[0]);
        const seg = (a, b) => {
          if (b - a < 0.05) return;
          const P0 = [x1 + ux * a + nx * off, y1 + uz * a + ny * off], P1 = [x1 + ux * b + nx * off, y1 + uz * b + ny * off];
          const P2 = [P1[0] + nx * wd, P1[1] + ny * wd], P3 = [P0[0] + nx * wd, P0[1] + ny * wd];
          group.add(new THREE.Mesh(aoQuad(P0, P1, P2, P3, 0.0075), floorM));
          if (r.type !== 'terraza' && r.type !== 'cochera' && r.type !== 'jardin') ceilAO.add(new THREE.Mesh(aoQuad(P0, P1, P2, P3, WALL_H - 0.006), ceilM));
        };
        let cur = 0;
        cuts.forEach((c) => { seg(cur, c[0]); cur = Math.max(cur, c[1]); });
        seg(cur, L);
      });
    });
    const blobM = aoMat(aoBlob(), 0.75);
    P.furniture.forEach((f) => {
      const d = FP.Furniture.def(f.key);
      if (!d || d.wall || d.z < 0.3 || f.key.startsWith('rug') || f.key.startsWith('tree_') || NO_BLOB.has(f.key) || FP.Lamps.NOBLOCK.has(f.key)) return;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(f.w + 0.4, f.h + 0.4), blobM);
      m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; m.rotation.y = -U.rad(f.rot || 0);
      m.position.set(f.x, 0.0065, f.y);
      group.add(m);
    });
  }

  /* ---------- pantalla de las TV: logo DVD rebotando (protector de pantalla clásico) ---------- */
  const tv = { canvas: null, ctx: null, tex: null, logos: [], lw: 0, lh: 0, x: 40, y: 30, vx: 85, vy: 62, ci: 0, ready: false, count: 0 };
  const TV_COLORS = ['#5aa9ff', '#ff62d6', '#4dffe6', '#fff25a', '#86ff62', '#ffa040', '#ff6060', '#ffffff'];
  function initTV() {
    tv.canvas = document.createElement('canvas');
    tv.canvas.width = 512; tv.canvas.height = 288;
    tv.ctx = tv.canvas.getContext('2d');
    tv.ctx.fillStyle = '#000'; tv.ctx.fillRect(0, 0, 512, 288);
    tv.tex = new THREE.CanvasTexture(tv.canvas);
    tv.tex.encoding = THREE.sRGBEncoding; tv.tex.minFilter = THREE.LinearFilter; tv.tex.generateMipmaps = false;
    tv.tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (!FP.DVD_LOGO) return;
    const img = new Image();
    img.onload = () => {
      // máscara del logo: se recorta el margen y se vuelve a pintar en colores claros
      const S = img.width, c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, S, S);
      const d = g.getImageData(0, 0, S, S), px = d.data, useAlpha = px[3] < 10;
      let x0 = S, y0 = S, x1 = 0, y1 = 0;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const i = (y * S + x) * 4, lum = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
        const a = useAlpha ? px[i + 3] / 255 : Math.max(0, Math.min(1, (238 - lum) / 140));
        px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = Math.round(a * 255);
        if (a > 0.2) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      }
      g.putImageData(d, 0, 0);
      const mw = x1 - x0 + 1, mh = y1 - y0 + 1;
      tv.lw = 96; tv.lh = Math.round(96 * mh / mw);
      tv.logos = TV_COLORS.map((col) => {
        const t = document.createElement('canvas');
        t.width = tv.lw * 2; t.height = tv.lh * 2;
        const tg = t.getContext('2d');
        tg.drawImage(c, x0, y0, mw, mh, 0, 0, t.width, t.height);
        tg.globalCompositeOperation = 'source-in';
        tg.fillStyle = col; tg.fillRect(0, 0, t.width, t.height);
        return t;
      });
      tv.ready = true;
    };
    img.src = FP.DVD_LOGO;
  }
  function updateTV(dt) {
    if (!tv.ready || !tv.count) return;
    const W = 512, H = 288;
    tv.x += tv.vx * dt; tv.y += tv.vy * dt;
    let hit = false;
    if (tv.x < 0) { tv.x = 0; tv.vx = Math.abs(tv.vx); hit = true; }
    if (tv.x + tv.lw > W) { tv.x = W - tv.lw; tv.vx = -Math.abs(tv.vx); hit = true; }
    if (tv.y < 0) { tv.y = 0; tv.vy = Math.abs(tv.vy); hit = true; }
    if (tv.y + tv.lh > H) { tv.y = H - tv.lh; tv.vy = -Math.abs(tv.vy); hit = true; }
    if (hit) tv.ci = (tv.ci + 1) % tv.logos.length;
    const g = tv.ctx;
    g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
    const rg = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7); // leve brillo de panel
    rg.addColorStop(0, 'rgba(255,255,255,.05)'); rg.addColorStop(1, 'rgba(0,0,0,.25)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.save();
    g.shadowColor = TV_COLORS[tv.ci]; g.shadowBlur = 14;
    g.drawImage(tv.logos[tv.ci], tv.x, tv.y, tv.lw, tv.lh);
    g.restore();
    tv.tex.needsUpdate = true;
  }

  /* ---------- paisaje urbano tras las ventanas + halos de luz ---------- */
  let skyline = null;
  const SKY = {
    day: { far: '#a9b9c9', near: '#8496aa', win: 'rgba(225,236,246,.55)', winP: 0.5, glow: 'rgba(255,255,255,.35)' },
    sunset: { far: '#8a6a86', near: '#4a3a5c', win: 'rgba(255,190,120,.85)', winP: 0.3, glow: 'rgba(255,150,80,.55)' },
    night: { far: '#131c36', near: '#0a1024', win: 'rgba(255,214,140,.95)', winP: 0.42, glow: 'rgba(255,150,70,.35)' },
  };
  function skylineTex(name) {
    const W = 4096, H = 512, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d'), r = rng(77), S = SKY[name] || SKY.day;
    const layer = (col, minH, maxH, minW, maxW, lit) => {
      let x = -20;
      while (x < W) {
        const w = minW + r() * (maxW - minW), h = minH + r() * (maxH - minH);
        g.fillStyle = col; g.fillRect(x, H - h, w, h);
        if (lit) for (let yy = H - h + 10; yy < H - 8; yy += 11) for (let xx = x + 5; xx < x + w - 6; xx += 9) {
          if (r() < S.winP) { g.fillStyle = r() < 0.12 ? 'rgba(180,215,255,.9)' : S.win; g.fillRect(xx, yy, 4, 6); }
        }
        x += w + r() * 10;
      }
    };
    layer(S.far, 80, 300, 40, 90, true);   // edificios lejanos
    layer(S.near, 60, 210, 50, 120, true); // edificios cercanos
    const gr = g.createLinearGradient(0, H - 150, 0, H);                          // resplandor de la ciudad en el horizonte
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, S.glow);
    g.fillStyle = gr; g.fillRect(0, H - 150, W, 150);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }
  function haloTex() {
    return T('halo', () => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,240,210,.95)'); gr.addColorStop(0.25, 'rgba(255,220,160,.45)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    });
  }
  function updateSkyline(name, P) {
    if (!skyline) return;
    const city = P && P.kind === 'departamento';
    skyline.visible = !!city;
    if (!city) return;
    if (skyline.material.map) skyline.material.map.dispose();
    skyline.material.map = skylineTex(name);
    skyline.material.needsUpdate = true;
    const H0 = levelsBelow(P) * 3;
    skyline.position.set(P.space.w / 2, -H0 + 120, P.space.h / 2);
  }

  /* ---------- edificio bajo el departamento ---------- */
  const levelsBelow = (P0) => { const P = P0.levels ? FP.Levels.view(P0, 0) : P0; return P.kind === 'departamento' ? Math.max(0, Math.min(59, Math.round((P.space.floorNo || 5) - 1))) : 0; };
  function facadeTex(emissive) {
    const S = 256, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d'), r = rng(emissive ? 3 : 2);
    if (emissive) { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); }
    else {
      g.fillStyle = '#d9d6cf'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '90,80,70'},${r() * 0.06})`; g.fillRect(r() * S, r() * S, 2, 2); }
      g.fillStyle = '#bdb9b0'; g.fillRect(0, S - 26, S, 26);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, S - 26, S, 3);
    }
    // ventana de piso a techo parcial
    const wx = 36, wy = 46, ww = S - 72, wh = S - 26 - 46 - 12;
    if (emissive) { const gr = g.createLinearGradient(wx, wy, wx, wy + wh); gr.addColorStop(0, '#e9b06a'); gr.addColorStop(1, '#c98a4a'); g.fillStyle = gr; g.fillRect(wx + 3, wy + 3, ww - 6, wh - 6); }
    else {
      g.fillStyle = '#7d8790'; g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
      const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gr.addColorStop(0, '#5f7f9a'); gr.addColorStop(0.5, '#2c4055'); gr.addColorStop(1, '#3d566d');
      g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(wx + ww * 0.15, wy); g.lineTo(wx + ww * 0.35, wy); g.lineTo(wx + ww * 0.05, wy + wh); g.lineTo(wx, wy + wh); g.lineTo(wx, wy + wh * 0.5); g.closePath(); g.fill();
      g.fillStyle = '#6f7880'; g.fillRect(wx + ww / 2 - 2, wy, 4, wh);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (!emissive) t.encoding = THREE.sRGBEncoding; else t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function facadeMat() {
    return T('facadeMat', () => new THREE.MeshStandardMaterial({ map: T('facadeTex', () => facadeTex(false)), emissiveMap: T('facadeEm', () => facadeTex(true)), emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: 0.55, metalness: 0.1, envMapIntensity: 0.9 }));
  }
  /** Plano de fachada de (x1,z1) a (x2,z2), entre las alturas y0 e y1, con la cara visible hacia (nx,nz). */
  function facadePlane(x1, z1, x2, z2, y0, y1, nx, nz, group) {
    const L = Math.hypot(x2 - x1, z2 - z1);
    if (L < 0.05) return;
    const m = new THREE.Mesh(wallPlane(L, y1 - y0, 3, 0, 0), facadeMat());
    m.position.set((x1 + x2) / 2 + nx * 0.005, (y0 + y1) / 2, (z1 + z2) / 2 + nz * 0.005);
    m.rotation.y = Math.atan2(nx, nz);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  }
  function buildBuilding(P, group, below) {
    const H0 = below * 3, fp = FP.Walls.footprint(P), inside = (x, z) => fp.cells.some((c) => x > c.x && x < c.x + c.w && z > c.y && z < c.y + c.h);
    const top = -0.062, bot = top - H0, concrete = mat('#cfccc5', { roughness: 0.9 });
    fp.cells.forEach((c) => group.add(bx(c.w, H0, c.h, concrete, c.x + c.w / 2, top - H0 / 2, c.y + c.h / 2, true)));
    fp.outline.forEach((sg) => {
      const horiz = Math.abs(sg.y1 - sg.y2) < 1e-6, mx = (sg.x1 + sg.x2) / 2, mz = (sg.y1 + sg.y2) / 2;
      let nx = 0, nz = 0;
      if (horiz) nz = inside(mx, mz - 0.05) ? 1 : -1; else nx = inside(mx - 0.05, mz) ? 1 : -1;
      facadePlane(sg.x1, sg.y1, sg.x2, sg.y2, bot, top, nx, nz, group);
    });
    // plaza al pie del edificio
    const bd = FP.Walls.bounds(P), plaza = mesh(wallPlane(bd.w + 14, bd.h + 14, 2, 0, 0), floorMat({ id: 'plaza', kind: 'stone', color: '#b9b5ad' }).mat, bd.x0 + bd.w / 2, bot + 0.005, bd.y0 + bd.h / 2, false);
    plaza.rotation.x = -Math.PI / 2;
    group.add(plaza);
    // edificios vecinos para dar contexto de ciudad
    const r = rng((P.id || 'x').split('').reduce((a, ch) => a + ch.charCodeAt(0), 7)), cx = P.space.w / 2, cz = P.space.h / 2, R0 = Math.max(P.space.w, P.space.h);
    for (let i = 0; i < 6; i++) {
      const ang = Math.atan2(0.8, 0.3) + Math.PI + (i - 2.5) * 0.62 + (r() - 0.5) * 0.25, dist = R0 * 0.5 + 16 + r() * 22, w = 10 + r() * 10, d = 10 + r() * 10, h = 12 + r() * 40;
      const x = cx + Math.cos(ang) * dist, z = cz + Math.sin(ang) * dist, y1 = bot + h;
      group.add(bx(w, h, d, concrete, x, bot + h / 2, z, true));
      [[x - w / 2, z + d / 2, x + w / 2, z + d / 2, 0, 1], [x + w / 2, z - d / 2, x - w / 2, z - d / 2, 0, -1], [x + w / 2, z + d / 2, x + w / 2, z - d / 2, 1, 0], [x - w / 2, z - d / 2, x - w / 2, z + d / 2, -1, 0]].forEach(([a, b, c2, d2, nx, nz]) => facadePlane(a, b, c2, d2, bot, y1, nx, nz, group));
    }
  }

  /** Barandal de vidrio alrededor del hueco de la escalera (menos por donde se sale). */
  function railHoles(g, holes) {
    holes.forEach((h) => {
      const e = { N: [h.x, h.y, h.x + h.w, h.y], E: [h.x + h.w, h.y, h.x + h.w, h.y + h.h], S: [h.x + h.w, h.y + h.h, h.x, h.y + h.h], W: [h.x, h.y + h.h, h.x, h.y] };
      Object.keys(e).forEach((k) => { if (k !== (h.arrive || 'S')) buildRail({ x1: e[k][0], y1: e[k][1], x2: e[k][2], y2: e[k][3] }, { rail: 'glass' }, g); });
    });
  }
  /** Losa de un nivel superior: piso de la huella + grosor, con el hueco de las escaleras de abajo. */
  function upperSlab(Pi, g, holes) {
    const sf = Pi.space.floor && FP.Rooms.FLOORS.find((f) => f.id === Pi.space.floor), sm = floorMat(sf || { id: 'slab', kind: 'stone', color: '#d7d4cd' });
    FP.Walls.footprint(Pi).cells.forEach((c) => carve(c, holes).forEach((pc) => {
      const fl = mesh(wallPlane(pc.w, pc.h, sm.tile, pc.x, pc.y), sm.mat, pc.x + pc.w / 2, 0.001, pc.y + pc.h / 2, false);
      fl.rotation.x = -Math.PI / 2;
      g.add(fl, bx(pc.w, 0.25, pc.h, M.slab, pc.x + pc.w / 2, -0.126, pc.y + pc.h / 2, false));
    }));
  }
  function applyLevelVis() {
    const P = FP.state.project, cur = P ? FP.Levels.cur(P) : 0, all = FP.state.lvMode !== 'upto';
    levelGroups.forEach((g, i) => { if (g) g.visible = all || i <= cur; });
  }

  function build(P) {
    if (root) { scene.remove(root); root.traverse((o) => { if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose(); }); }
    root = new THREE.Group();
    const LV = FP.Levels.views(P), P0 = LV[0], cur = FP.Levels.cur(P);
    const W = P0.space.w, H = P0.space.h;
    const below = levelsBelow(P0), H0 = below * 3;
    const ground = mesh(wallPlane(600, 600, 6, 0, 0), M.ground, W / 2, -H0 - 0.02, H / 2, false);
    ground.rotation.x = -Math.PI / 2;
    root.add(ground);
    const sf = P0.space.floor && FP.Rooms.FLOORS.find((f) => f.id === P0.space.floor), sm = floorMat(sf || { id: 'slab', kind: 'stone', color: '#d7d4cd' });
    FP.Walls.footprint(P0).cells.forEach((c) => {
      const slab = mesh(wallPlane(c.w, c.h, sm.tile, c.x, c.y), sm.mat, c.x + c.w / 2, 0.0, c.y + c.h / 2, false);
      slab.rotation.x = -Math.PI / 2;
      root.add(slab, bx(c.w, 0.06, c.h, M.slab, c.x + c.w / 2, -0.032, c.y + c.h / 2, false));
    });
    if (below > 0) buildBuilding(P0, root, below);
    ceilings = []; ceilAOs = []; fixtures = []; levelGroups = [];
    dynamic = { lamps: [], emis: [], halos: [] };
    FP.Models.ctx.regEmis = (m) => dynamic.emis.push(m);
    tv.count = 0;
    // el nivel activo primero: si hay más de 16 luces, las de este nivel tienen prioridad
    LV.map((_, i) => i).sort((a, b) => (a === cur ? -1 : b === cur ? -1 : a - b)).forEach((i) => {
      const Pi = LV[i], g = new THREE.Group();
      g.position.y = i * LEVEL_H;
      root.add(g);
      levelGroups[i] = g;
      const holesBelow = i > 0 ? FP.Levels.holes(P, i - 1) : [], holesUp = i < LV.length - 1 ? FP.Levels.holes(P, i) : [];
      if (i > 0) upperSlab(Pi, g, holesBelow);
      FP.Models.ctx.up = i < LV.length - 1;
      buildRooms(Pi, g, holesBelow, holesUp);
      buildWalls(Pi, g);
      buildDoorLeaves(Pi, g);
      tv.count += Pi.furniture.filter((f) => f.key === 'tv' || f.key === 'desk' || f.key === 'ldesk' || f.key === 'desk2' || f.key === 'arcade').length;
      buildFurniture(Pi, g);
      buildAO(Pi, g);
      if (i > 0) railHoles(g, holesBelow);
    });
    applyLevelVis();
    setInterior(walk.on);
    scene.add(root);
    placeSun(P);
    applyLight(lightName, P);
  }

  function fitCamera(P) {
    const LV = FP.Levels.views(P), nl = LV.length, E = extent(P);
    const W = E.w, H = E.h, R = Math.max(W, H, nl > 1 ? nl * LEVEL_H * 1.3 : 0), H0 = levelsBelow(LV[0]) * 3;
    const top = (nl - 1) * LEVEL_H;
    if (H0 > 0) {
      const ty = -H0 * 0.45 + top * 0.5, dist = (R + H0 * 0.8) * 1.75;
      controls.target.set(E.cx, ty, E.cz);
      camera.position.set(E.cx + dist * 0.3, ty + dist * 0.5, E.cz + dist * 0.8);
      controls.minDistance = 0.5;
      controls.maxDistance = dist * 3;
      controls.update();
      return;
    }
    controls.target.set(E.cx, 0.3 + top * 0.45, E.cz);
    camera.position.set(E.cx + R * 0.2, top * 0.45 + R * 1.2, E.cz + R * 0.75);
    controls.minDistance = 0.5;
    controls.maxDistance = R * 4;
    controls.update();
  }
  /* ---------- recorrido en primera persona ---------- */
  const walk = { noclip: true, on: false, x: 0, z: 0, yaw: 0, pitch: 0, keys: {}, look: null, move: null, cols: null, level: 0, P: null };
  const R_BODY = 0.24, EYE = 1.6;

  function colliders(P) {
    const segs = FP.Walls.segments(P).map((s) => {
      const dx = s.x2 - s.x1, dz = s.y2 - s.y1, L = Math.hypot(dx, dz), cuts = [];
      P.openings.forEach((o) => {
        if (o.kind !== 'door') return;
        const rel = ((o.x - s.x1) * dx + (o.y - s.y1) * dz) / (L || 1), perp = Math.abs((-(o.x - s.x1) * dz + (o.y - s.y1) * dx) / (L || 1));
        if (perp < 0.2 && rel > 0 && rel < L) cuts.push([rel - o.w / 2 + 0.02, rel + o.w / 2 - 0.02]);
      });
      return { x1: s.x1, y1: s.y1, dx, dz, L, h: s.t / 2, cuts };
    });
    return { segs, furn: P.furniture.filter((f) => !['tv', 'pendant', 'fan'].includes(f.key) && !FP.Lamps.NOBLOCK.has(f.key) && !f.key.startsWith('art_')) };
  }
  function blocked(x, z) {
    if (walk.noclip) return false;
    const c = walk.cols, P = walk.P;
    const bd = FP.Walls.bounds(P);
    if (x < bd.x0 + 0.15 || z < bd.y0 + 0.15 || x > bd.x1 - 0.15 || z > bd.y1 - 0.15) return true;
    for (const s of c.segs) {
      if (s.L < 0.01) continue;
      const u = ((x - s.x1) * s.dx + (z - s.y1) * s.dz) / s.L;
      const uc = Math.max(0, Math.min(s.L, u));
      if (s.cuts.some((k) => u > k[0] && u < k[1])) continue;
      const px = s.x1 + (s.dx / s.L) * uc, pz = s.y1 + (s.dz / s.L) * uc;
      if (Math.hypot(x - px, z - pz) < s.h + R_BODY) return true;
    }
    for (const f of c.furn) {
      const l = FP.geom.toLocal(f, { x, y: z }), cx = Math.max(-f.w / 2, Math.min(f.w / 2, l.x)), cy = Math.max(-f.h / 2, Math.min(f.h / 2, l.y));
      if (Math.hypot(l.x - cx, l.y - cy) < R_BODY - 0.04) return true;
    }
    return false;
  }
  function updateWalk(dt) {
    const k = walk.keys, run = k.ShiftLeft || k.ShiftRight ? 2.1 : 1;
    let fw = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), st_ = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (walk.move) { fw += -walk.move.dy; st_ += walk.move.dx; }
    const turn = (k.ArrowLeft || k.KeyQ ? 1 : 0) - (k.ArrowRight || k.KeyE ? 1 : 0);
    walk.yaw += turn * 1.8 * dt;
    const len = Math.hypot(fw, st_);
    if (len > 0.01) {
      const sp = 1.7 * run * dt / Math.max(1, len), sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw);
      const dx = (-sy * fw + cy * st_) * sp, dz = (-cy * fw - sy * st_) * sp;
      if (!blocked(walk.x + dx, walk.z + dz)) { walk.x += dx; walk.z += dz; }
      else if (!blocked(walk.x + dx, walk.z)) walk.x += dx;
      else if (!blocked(walk.x, walk.z + dz)) walk.z += dz;
    }
    const bob = len > 0.01 ? Math.sin(performance.now() / 170 * run) * 0.012 : 0;
    camera.position.set(walk.x, EYE + bob + walk.level * LEVEL_H, walk.z);
    camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
  }
  function drawMap() {
    const cv = document.getElementById('minimap'), g = cv.getContext('2d'), P = walk.P;
    const Wd = cv.width, Hd = cv.height, sc = Math.min((Wd - 20) / P.space.w, (Hd - 20) / P.space.h);
    const ox = (Wd - P.space.w * sc) / 2, oy = (Hd - P.space.h * sc) / 2;
    g.clearRect(0, 0, Wd, Hd);
    g.fillStyle = '#fff'; FP.Walls.footprint(P).cells.forEach((c) => g.fillRect(ox + c.x * sc, oy + c.y * sc, c.w * sc + 0.5, c.h * sc + 0.5));
    P.rooms.forEach((r) => { g.fillStyle = FP.Rooms.color(r.type); g.fillRect(ox + r.x * sc, oy + r.y * sc, r.w * sc, r.h * sc); g.strokeStyle = '#333'; g.lineWidth = 1.5; g.strokeRect(ox + r.x * sc, oy + r.y * sc, r.w * sc, r.h * sc); });
    g.strokeStyle = '#111'; g.lineWidth = 2.5; g.lineCap = 'square'; FP.Walls.boundary(P).forEach((b) => { g.beginPath(); g.moveTo(ox + b.x1 * sc, oy + b.y1 * sc); g.lineTo(ox + b.x2 * sc, oy + b.y2 * sc); g.stroke(); });
    g.fillStyle = 'rgba(0,0,0,.28)';
    P.furniture.forEach((f) => { g.save(); g.translate(ox + f.x * sc, oy + f.y * sc); g.rotate(U.rad(f.rot || 0)); g.fillRect(-f.w * sc / 2, -f.h * sc / 2, f.w * sc, f.h * sc); g.restore(); });
    const px = ox + walk.x * sc, py = oy + walk.z * sc;
    g.save(); g.translate(px, py); g.rotate(-walk.yaw);
    g.fillStyle = 'rgba(47,109,246,.25)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 34, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); g.closePath(); g.fill();
    g.fillStyle = '#2f6df6'; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fill(); g.restore();
  }

  function startWalk() {
    const P = FP.state.project;
    if (!ready || !active) { FP.View3D.show().then((ok) => { if (ok) startWalk(); }); return; }
    if (walk.on) return;
    walk.level = FP.Levels.cur(P); walk.P = P;
    walk.cols = colliders(walk.P);
    syncWalkLevelUI();
    const W = P.space.w, H = P.space.h;
    const door = P.openings.find((o) => o.kind === 'door' && (o.x < 0.2 || o.y < 0.2 || o.x > W - 0.2 || o.y > H - 0.2));
    const inside = (px, pz) => P.rooms.some((r) => px > r.x + 0.3 && px < r.x + r.w - 0.3 && pz > r.y + 0.3 && pz < r.y + r.h - 0.3);
    let x, z, tx, tz;
    if (door) {
      const ix = door.x < 0.2 ? 1 : door.x > W - 0.2 ? -1 : 0, iz = door.y < 0.2 ? 1 : door.y > H - 0.2 ? -1 : 0;
      x = door.x + ix * 0.9; z = door.y + iz * 0.9; tx = x + ix * 3; tz = z + iz * 3;
    }
    if (!door || !inside(x, z)) {
      const r = P.rooms.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0];
      x = r ? r.x + r.w / 2 : W / 2; z = r ? r.y + r.h / 2 : H / 2;
      tx = r && r.w >= r.h ? x + 3 : x; tz = r && r.w >= r.h ? z : z - 3;
    }
    walk.x = x; walk.z = z; walk.yaw = Math.atan2(-(tx - x), -(tz - z)); walk.pitch = 0; walk.keys = {};
    walk.on = true;
    setInterior(true);
    applyLight(lightName, P);
    controls.enabled = false;
    camera.fov = 66; camera.near = 0.1; camera.updateProjectionMatrix();
    document.getElementById('app').classList.add('walking');
    setNoclip(walk.noclip);
    document.getElementById('view3d').focus && document.getElementById('view3d').blur();
    FP.emit('walk');
  }
  /** Sube o baja un nivel durante el recorrido (PageUp / PageDown o los botones). */
  function walkLevel(d) {
    if (!walk.on) return;
    const P = FP.state.project, n = FP.Levels.count(P), nl = Math.max(0, Math.min(n - 1, walk.level + d));
    if (nl === walk.level) return;
    walk.level = nl;
    walk.P = FP.Levels.view(P, nl);
    walk.cols = colliders(walk.P);
    syncWalkLevelUI();
  }
  function syncWalkLevelUI() {
    const P = FP.state.project, n = FP.Levels.count(P), up = document.getElementById('walkUp'), dn = document.getElementById('walkDown'), lb = document.getElementById('walkLevel');
    if (!up) return;
    const show = walk.on && n > 1;
    [up, dn, lb].forEach((b) => { b.hidden = !show; });
    up.disabled = walk.level >= n - 1; dn.disabled = walk.level <= 0;
    lb.textContent = FP.Levels.name(P, walk.level);
  }
  function setNoclip(v) {
    walk.noclip = v;
    const b = document.getElementById('walkClip');
    if (b) { b.textContent = v ? 'Atravesar paredes: sí' : 'Atravesar paredes: no'; b.classList.toggle('on', v); }
  }
  function stopWalk() {
    if (!walk.on) return;
    walk.on = false;
    setInterior(false);
    applyLight(lightName, FP.state.project);
    if (document.pointerLockElement) document.exitPointerLock();
    controls.enabled = true;
    camera.fov = 45; camera.updateProjectionMatrix();
    document.getElementById('app').classList.remove('walking');
    syncWalkLevelUI();
    fitCamera(FP.state.project);
    FP.emit('walk');
  }
  function bindWalk() {
    const cv = renderer.domElement;
    const typing = (e) => /INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '');
    window.addEventListener('keydown', (e) => { if (!walk.on || typing(e)) return; if (e.code === 'KeyC') { setNoclip(!walk.noclip); return; } if (e.code === 'PageUp') { walkLevel(1); return; } if (e.code === 'PageDown') { walkLevel(-1); return; } walk.keys[e.code] = true; if (/^(Arrow|Space)/.test(e.code)) e.preventDefault(); });
    window.addEventListener('keyup', (e) => { delete walk.keys[e.code]; });
    window.addEventListener('blur', () => { walk.keys = {}; });
    const look = (dx, dy) => { walk.yaw -= dx * 0.0027; walk.pitch = Math.max(-1.3, Math.min(1.3, walk.pitch - dy * 0.0027)); };
    cv.addEventListener('pointerdown', (e) => {
      if (!walk.on) return;
      if (e.pointerType === 'touch') {
        const half = e.clientX < cv.getBoundingClientRect().left + cv.clientWidth / 2;
        if (half) walk.move = { id: e.pointerId, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0 }; else walk.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
      } else {
        walk.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
        try { cv.requestPointerLock(); } catch (err) { /* arrastre */ }
      }
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!walk.on) return;
      if (document.pointerLockElement === cv) { look(e.movementX || 0, e.movementY || 0); return; }
      if (walk.move && walk.move.id === e.pointerId) { walk.move.dx = Math.max(-1, Math.min(1, (e.clientX - walk.move.sx) / 50)); walk.move.dy = Math.max(-1, Math.min(1, (e.clientY - walk.move.sy) / 50)); }
      else if (walk.look && walk.look.id === e.pointerId) { look(e.clientX - walk.look.x, e.clientY - walk.look.y); walk.look.x = e.clientX; walk.look.y = e.clientY; }
    });
    const up = (e) => { if (walk.move && walk.move.id === e.pointerId) walk.move = null; if (walk.look && walk.look.id === e.pointerId) walk.look = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  let last = 0, shotWant = false;
  function loop() {
    if (!active) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    updateTV(dt);
    if (walk.on) updateWalk(dt); else controls.update();
    renderer.render(scene, camera);
    if (shotWant) { // el buffer solo es legible justo después de renderizar; el punto de mira es HTML, así que no sale en la foto
      shotWant = false;
      try { FP.emit('shot', renderer.domElement.toDataURL('image/jpeg', 0.93)); } catch (e) { FP.toast('No se pudo tomar la captura'); }
    }
    if (walk.on) drawMap();
  }

  FP.View3D = {
    LIGHTS,
    light: () => lightName,
    _scene: () => scene,
    _cam: () => ({ camera, controls }),
    _tv: () => tv,
    async prepare() {
      await ensure();
      build(FP.state.project);
    },
    async show() {
      const note = document.getElementById('load3d');
      note.hidden = false;
      note.textContent = 'Cargando vista 3D…';
      try { await FP.View3D.prepare(); } catch (e) {
        note.textContent = 'La vista 3D necesita conexión a internet la primera vez (para cargar Three.js).';
        return false;
      }
      note.hidden = true;
      active = true;
      resize();
      if (!FP.View3D._fitted) { fitCamera(FP.state.project); FP.View3D._fitted = true; }
      cancelAnimationFrame(raf);
      loop();
      return true;
    },
    hide() { stopWalk(); active = false; cancelAnimationFrame(raf); },
    capture() { if (walk.on) shotWant = true; },
    walkLevel, applyLevelVis,
    startWalk, stopWalk, isWalking: () => walk.on, setNoclip, toggleNoclip: () => setNoclip(!walk.noclip),
    refit() { if (ready) fitCamera(FP.state.project); },
    rebuild() { if (ready && active) { build(FP.state.project); if (walk.on) { const P = FP.state.project; walk.level = Math.min(walk.level, FP.Levels.count(P) - 1); walk.P = FP.Levels.view(P, walk.level); walk.cols = colliders(walk.P); syncWalkLevelUI(); } } },
    setLight(name) { if (ready && LIGHTS[name]) { applyLight(name, FP.state.project); } else lightName = name; FP.emit('light'); },
  };
  // al abrir otro proyecto: salir del recorrido y reconstruir la escena 3D (si no, se seguiría viendo el anterior)
  FP.on('project', () => {
    stopWalk();
    FP.View3D._fitted = false;
    if (ready && active) { build(FP.state.project); fitCamera(FP.state.project); FP.View3D._fitted = true; }
  });
})();

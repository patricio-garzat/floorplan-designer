/* garden.js — jardín: tipo de habitación, pisos de exterior y objetos (árboles, plantas, alberca, pérgola…) con su modelo 3D.
   Los modelos usan THREE solo al construirse (THREE se carga bajo demanda). */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;

  /* ---------- tipo de habitación y pisos ---------- */
  const T = FP.Rooms.TYPES;
  if (!T.find((t) => t.id === 'jardin')) T.splice(T.findIndex((t) => t.id === 'cochera') + 1, 0, { id: 'jardin', name: 'Jardín', w: 6, h: 5, color: '#d9ebcb' });
  [{ id: 'grass', name: 'Pasto', kind: 'grass', color: '#7fae5c' },
    { id: 'gravel', name: 'Grava', kind: 'gravel', color: '#b7ae9f' },
    { id: 'soil', name: 'Tierra', kind: 'gravel', color: '#7a5d43' },
    { id: 'pavers', name: 'Adoquín', kind: 'stone', color: '#a8a39a' }].forEach((f) => { if (!FP.Rooms.FLOORS.find((x) => x.id === f.id)) FP.Rooms.FLOORS.push(f); });

  /* ---------- planta 2D ---------- */
  const lobes = (g, r, n, col) => { let s = ''; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.4; s += g.circ(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.5, col, { hair: 1, soft: 1 }); } return s; };
  const tree = (col, n) => (w, h, g) => g.circ(0, 0, w / 2, col, { soft: 1 }) + lobes(g, w / 2, n || 6, col) + g.circ(0, 0, 0.09, '#6b4a32', { hair: 1 });
  const D = {
    tree_oak: tree('#8fbf73', 7), tree_fruit: tree('#9ccb79', 6), tree_small: tree('#b9a0e0', 5), tree_pine: (w, h, g) => {
      let s = g.circ(0, 0, w / 2, '#6fa883', { soft: 1 }) + g.circ(0, 0, w * 0.33, '#6fa883', { hair: 1, soft: 1 }) + g.circ(0, 0, w * 0.16, '#6fa883', { hair: 1, soft: 1 });
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += g.line(0, 0, Math.cos(a) * w / 2, Math.sin(a) * w / 2, { hair: 1, soft: 1 }); }
      return s;
    },
    tree_palm: (w, h, g) => { let s = g.circ(0, 0, 0.12, '#6b4a32'); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; s += g.path(`M0 0 Q${(Math.cos(a - 0.3) * w * 0.3).toFixed(2)} ${(Math.sin(a - 0.3) * w * 0.3).toFixed(2)} ${(Math.cos(a) * w / 2).toFixed(2)} ${(Math.sin(a) * w / 2).toFixed(2)} Q${(Math.cos(a + 0.3) * w * 0.3).toFixed(2)} ${(Math.sin(a + 0.3) * w * 0.3).toFixed(2)} 0 0`, '#9fd17f', { hair: 1, soft: 1 }); } return s; },
    shrub: (w, h, g) => g.circ(0, 0, w / 2, '#8fbf73', { soft: 1 }) + lobes(g, w / 2, 5, '#8fbf73'),
    hedge: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#8fbf73', { rx: 0.15 }); for (let i = 1; i < Math.round(w / 0.35); i++) s += g.circ(-w / 2 + i * 0.35, 0, 0.14, '#8fbf73', { hair: 1, soft: 1 }); return s; },
    flowerbed: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#c9b9a3', { rx: 0.05 }) + g.rect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12, '#8a6a4f', { rx: 0.03, hair: 1 }); const cs = ['#e85d75', '#f2c14e', '#ffffff', '#b07be0']; for (let i = 0; i < w * 6; i++) s += g.circ(-w / 2 + 0.15 + ((i * 0.37) % (w - 0.3)), -h / 2 + 0.15 + ((i * 0.23) % (h - 0.3)), 0.05, cs[i % 4], { hair: 1 }); return s; },
    rocks: (w, h, g) => g.ell(-0.22, 0, 0.3, 0.26, '#b7b7bb', { soft: 1 }) + g.ell(0.22, 0.1, 0.24, 0.2, '#a8a8ad', { soft: 1 }) + g.ell(0.05, -0.22, 0.18, 0.14, '#c2c2c6', { soft: 1 }),
    pond: (w, h, g) => g.ell(0, 0, w / 2, h / 2, '#c9b9a3') + g.ell(0, 0, w / 2 - 0.12, h / 2 - 0.12, '#7fc1d9', { hair: 1, soft: 1 }) + g.ell(-0.3, -0.1, 0.3, 0.12, '#9bd3e6', { hair: 1, soft: 1 }),
    pool: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#e4e0d8', { rx: 0.12 }) + g.rect(-w / 2 + 0.3, -h / 2 + 0.3, w - 0.6, h - 0.6, '#7cc4dc', { rx: 0.05, hair: 1 }); for (let i = 1; i < 6; i++) s += g.line(-w / 2 + 0.3 + ((w - 0.6) * i) / 6, -h / 2 + 0.3, -w / 2 + 0.3 + ((w - 0.6) * i) / 6, h / 2 - 0.3, { hair: 1, soft: 1 }); return s; },
    fountain: (w, h, g) => g.circ(0, 0, w / 2, '#d6d2ca') + g.circ(0, 0, w / 2 - 0.12, '#9bd3e6', { hair: 1, soft: 1 }) + g.circ(0, 0, 0.3, '#d6d2ca', { hair: 1 }) + g.circ(0, 0, 0.1, '#ffffff', { hair: 1 }),
    pergola: (w, h, g) => { let s = ''; for (let i = 0; i <= 10; i++) s += g.rect(-w / 2 + (i * (w - 0.1)) / 10, -h / 2, 0.1, h, '#c9a26f', { hair: 1 }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { s += g.rect(a * (w / 2 - 0.12) - 0.08, b * (h / 2 - 0.12) - 0.08, 0.16, 0.16, '#6b4a32'); }); return s; },
    path: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#d9d4c9'); for (let i = 1; i < Math.round(h / 0.5); i++) s += g.line(-w / 2, -h / 2 + i * 0.5, w / 2, -h / 2 + i * 0.5, { hair: 1, soft: 1 }); return s + g.line(0, -h / 2, 0, h / 2, { hair: 1, soft: 1 }); },
    stones: (w, h, g) => { let s = ''; [[-0.1, -0.85], [0.12, -0.3], [-0.12, 0.25], [0.1, 0.8]].forEach(([x, y]) => { s += g.circ(x, y, 0.27, '#d3cfc6', { hair: 1 }); }); return s; },
    firepit: (w, h, g) => { let s = g.circ(0, 0, w / 2, '#b9b5ac'); s += g.circ(0, 0, w / 2 - 0.15, '#3a3a3f', { hair: 1 }); s += g.circ(0, 0, 0.16, '#ffb24a', { hair: 1 }); return s; },
    hammock: (w, h, g) => g.rect(-w / 2, -0.06, w, 0.12, '#8a6a4f') + g.ell(0, 0, w / 2 - 0.25, h / 2 - 0.1, '#eadfce', { hair: 1 }) + g.line(-w / 2 + 0.3, 0, w / 2 - 0.3, 0, { soft: 1 }),
    shed: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#c9a26f') + g.line(0, -h / 2, 0, h / 2, { soft: 1 }) + g.rect(-0.35, h / 2 - 0.08, 0.7, 0.08, '#6b4a32', { hair: 1 }),
    glamp: (w, h, g) => g.circ(0, 0, w / 2, '#fff2c0', { hair: 1 }) + g.circ(0, 0, 0.04, '#2a2a2f', { hair: 1 }),
    fence: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#f1ece2', { hair: 1 }); for (let i = 1; i < Math.round(w / 0.25); i++) s += g.line(-w / 2 + i * 0.25, -h / 2, -w / 2 + i * 0.25, h / 2, { hair: 1, soft: 1 }); return s; },
    gate: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#f1ece2', { hair: 1 }) + g.path(`M${-w / 2} ${h / 2}A${w} ${w} 0 0 1 ${w / 2} ${h / 2 - w * 0.9}`, '#ffffff', { nf: 1, dash: 1, soft: 1 }),
    doghouse: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#c98a5e', { rx: 0.03 }) + g.line(-w / 2, 0, w / 2, 0, { soft: 1 }) + g.rect(-0.16, h / 2 - 0.05, 0.32, 0.05, '#2a2a2f', { hair: 1 }),
    sofa_out: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#b8a48a', { rx: 0.06 }) + g.rect(-w / 2 + 0.1, -h / 2 + 0.05, w - 0.2, 0.25, '#d9c8b0', { rx: 0.05, hair: 1 }) + g.rect(-w / 2 + 0.1, -h / 2 + 0.35, w / 2 - 0.12, h - 0.45, '#efe6d6', { rx: 0.05, hair: 1 }) + g.rect(0.02, -h / 2 + 0.35, w / 2 - 0.12, h - 0.45, '#efe6d6', { rx: 0.05, hair: 1 }),
  };
  const NEW = {
    tree_oak: ['Árbol frondoso', 3.6, 3.6, 6.5, '#8fbf73'], tree_fruit: ['Árbol frutal', 2.8, 2.8, 3.8, '#9ccb79'], tree_small: ['Jacaranda', 2.4, 2.4, 4.5, '#b9a0e0'],
    tree_pine: ['Pino', 2.4, 2.4, 7, '#6fa883'], tree_palm: ['Palmera', 2.4, 2.4, 5.5, '#9fd17f'],
    shrub: ['Arbusto', 0.9, 0.9, 0.9, '#8fbf73'], hedge: ['Seto', 2.0, 0.6, 1.3, '#8fbf73'], flowerbed: ['Jardinera con flores', 1.8, 0.7, 0.5, '#c9b9a3'], rocks: ['Rocas decorativas', 1.0, 0.8, 0.5, '#b7b7bb'],
    pond: ['Estanque', 2.6, 1.8, 0.3, '#7fc1d9'], pool: ['Alberca', 6.0, 3.0, 0.4, '#7cc4dc'], fountain: ['Fuente', 1.4, 1.4, 1.4, '#d6d2ca'],
    pergola: ['Pérgola', 3.6, 3.6, 2.6, '#c9a26f'], path: ['Andador de loseta', 1.2, 3.0, 0.03, '#d9d4c9'], stones: ['Piedras de paso', 0.8, 2.4, 0.05, '#d3cfc6'],
    firepit: ['Fogata', 1.1, 1.1, 0.5, '#b9b5ac'], hammock: ['Hamaca', 2.6, 1.0, 1.3, '#eadfce'], shed: ['Casita de herramientas', 2.0, 2.6, 2.3, '#c9a26f'],
    glamp: ['Farol de jardín', 0.3, 0.3, 1.0, '#fff2c0'], fence: ['Reja de jardín', 2.0, 0.12, 1.6, '#f1ece2'], gate: ['Portón de jardín', 1.2, 0.12, 1.8, '#f1ece2'],
    doghouse: ['Casa de perro', 0.8, 1.0, 0.8, '#c98a5e'], sofa_out: ['Sofá de exterior', 2.0, 0.9, 0.8, '#b8a48a'],
  };
  Object.keys(NEW).forEach((k) => { const [name, w, h, z, c] = NEW[k]; I[k] = { name, w, h, z, c, draw: D[k] }; });
  F.CATS.splice(F.CATS.findIndex((c) => c.id === 'exterior') + 1, 0, {
    id: 'jardin', name: 'Jardín', items: ['tree_oak', 'tree_fruit', 'tree_small', 'tree_pine', 'tree_palm', 'shrub', 'hedge', 'flowerbed', 'rocks', 'pool', 'pond', 'fountain', 'pergola', 'path', 'stones', 'firepit', 'hammock', 'sofa_out', 'shed', 'glamp', 'fence', 'gate', 'doghouse'],
  });

  /* ---------- 3D ---------- */
  const H = FP.Models.helpers, B = FP.Models.B, { box, cyl, sph, G } = H;
  let K = null;
  const flat = (hex, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.85 }, o || {}));
  const mats = () => K || (K = {
    bark: flat('#6b4a32', { roughness: 1 }), stone: flat('#a9a59d', { roughness: 0.95 }), stoneL: flat('#d9d4c9', { roughness: 0.9 }), loseta: flat('#cfcac0', { roughness: 0.92 }),
    soil: flat('#5b4330', { roughness: 1 }), white: flat('#f3efe6', { roughness: 0.6 }), wood: flat('#b98a5a', { roughness: 0.7 }), woodD: flat('#6b4a32', { roughness: 0.75 }),
    jac: flat('#9b7fd1', { roughness: 0.9 }), leafP: flat('#3f7a4a', { roughness: 0.9 }), fruit: flat('#e0542f', { roughness: 0.5 }), fabric: flat('#eadfce', { roughness: 1 }),
    water: flat('#4f9db8', { roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.82, envMapIntensity: 1.6 }), tile: flat('#7cc4dc', { roughness: 0.25 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xffa23a, toneMapped: false }), glow: flat('#fff2c0', { emissive: new THREE.Color('#ffe2a0'), emissiveIntensity: 1.3 }), black: flat('#1d1d20', { roughness: 0.5, metalness: 0.4 }),
    rattan: flat('#b8a48a', { roughness: 0.9 }), roof: flat('#7a4a36', { roughness: 0.8 }),
  });
  const rng = (seed) => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const canopy = (g, mat, R, y0, n, seed, sy) => { const r = rng(seed); for (let i = 0; i < n; i++) { const a = r() * 6.283, d = (i ? 0.45 + r() * 0.4 : 0) * R; sph(g, R * (0.55 + r() * 0.3), mat, Math.cos(a) * d, y0 + (r() - 0.3) * R * 0.7, Math.sin(a) * d, 1, sy || 0.85, 1); } };
  const leaf = () => H.M().leaf1, leaf2 = () => H.M().leaf2;

  B.tree_oak = (w) => { const g = G(), m = mats(), R = w * 0.27; cyl(g, 0.2, 2.6, m.bark, 0, 0, 0, 0.12); canopy(g, leaf(), R, 3.4, 8, 3); return g; };
  B.tree_fruit = (w) => {
    const g = G(), m = mats(), R = w * 0.3; cyl(g, 0.14, 1.6, m.bark, 0, 0, 0, 0.09); canopy(g, leaf2(), R, 2.4, 6, 5);
    const r = rng(9); for (let i = 0; i < 12; i++) { const a = r() * 6.283, d = R * (0.6 + r() * 0.7); sph(g, 0.07, m.fruit, Math.cos(a) * d, 2.0 + r() * 0.8, Math.sin(a) * d); }
    return g;
  };
  B.tree_small = (w) => { const g = G(), m = mats(), R = w * 0.3; cyl(g, 0.1, 2.0, m.bark, 0, 0, 0, 0.07); canopy(g, m.jac, R, 2.8, 6, 7, 0.75); return g; };
  B.tree_pine = (w) => { const g = G(), m = mats(); cyl(g, 0.14, 1.2, m.bark, 0, 0, 0, 0.1); for (let i = 0; i < 5; i++) cyl(g, w / 2 * (1 - i * 0.17), 1.5, m.leafP, 0, 0.9 + i * 1.2, 0, 0.02, 14); return g; };
  B.tree_palm = (w) => {
    const g = G(), m = mats();
    for (let i = 0; i < 7; i++) { const s = cyl(g, 0.14 - i * 0.008, 0.85, m.bark, Math.sin(i * 0.25) * 0.12, i * 0.8, 0, 0.13 - i * 0.008); s.rotation.z = 0.05; }
    for (let i = 0; i < 10; i++) { const p = G(); p.position.set(0.3, 5.5, 0); p.rotation.y = (i / 10) * 6.283; const f = box(p, 1.7, 0.03, 0.3, leaf2(), 0.8, 0, 0, 0.01); f.rotation.z = -0.45; g.add(p); }
    return g;
  };
  B.shrub = (w) => { const g = G(); canopy(g, leaf(), w * 0.3, 0.42, 4, 11, 0.9); cyl(g, 0.05, 0.2, mats().bark, 0, 0, 0); return g; };
  B.hedge = (w, d) => { const g = G(), n = Math.max(2, Math.round(w / 0.7)); for (let i = 0; i < n; i++) box(g, w / n + 0.08, 1.2 + (i % 2) * 0.1, d, leaf(), -w / 2 + (w * (i + 0.5)) / n, 0, 0, 0.22); return g; };
  B.flowerbed = (w, d) => {
    const g = G(), m = mats(), r = rng(21), cs = ['#e85d75', '#f2c14e', '#ffffff', '#b07be0', '#ff8a3d'];
    box(g, w, 0.28, d, m.stone, 0, 0, 0, 0.04); box(g, w - 0.14, 0.05, d - 0.14, m.soil, 0, 0.27, 0, 0.02);
    for (let i = 0; i < Math.round(w * 9); i++) { const x = (r() - 0.5) * (w - 0.3), z = (r() - 0.5) * (d - 0.25); sph(g, 0.1, leaf2(), x, 0.36, z, 1, 0.7, 1); sph(g, 0.055, new THREE.MeshStandardMaterial({ color: new THREE.Color(cs[i % 5]).convertSRGBToLinear(), roughness: 0.6 }), x, 0.46, z); }
    return g;
  };
  B.rocks = () => { const g = G(), m = mats(); [[-0.22, 0, 0.3, 0.42], [0.22, 0.1, 0.24, 0.3], [0.05, -0.22, 0.18, 0.22]].forEach(([x, z, r, h], i) => sph(g, r, i % 2 ? m.stoneL : m.stone, x, h / 2 - 0.02, z, 1, h / r * 0.6, 0.9)); return g; };
  B.pond = (w, d) => {
    const g = G(), m = mats(), r = rng(4), a = w / 2, b = d / 2;
    const wt = cyl(g, 1, 0.04, m.water, 0, 0.1, 0); wt.scale.set(a - 0.12, 1, b - 0.12);
    const bs = cyl(g, 1, 0.1, m.soil, 0, 0, 0); bs.scale.set(a, 1, b);
    for (let i = 0; i < 16; i++) { const t = (i / 16) * 6.283; sph(g, 0.17 + r() * 0.08, i % 2 ? m.stone : m.stoneL, Math.cos(t) * (a - 0.05), 0.1, Math.sin(t) * (b - 0.05), 1, 0.65, 1); }
    [[-0.4, -0.1], [0.5, 0.2]].forEach(([x, z]) => cyl(g, 0.22, 0.012, leaf2(), x, 0.125, z, 0.22, 14));
    return g;
  };
  B.pool = (w, d) => {
    const g = G(), m = mats(), c = 0.3;
    box(g, w, 0.32, c, m.stoneL, 0, 0, -d / 2 + c / 2, 0.03); box(g, w, 0.32, c, m.stoneL, 0, 0, d / 2 - c / 2, 0.03);
    box(g, c, 0.32, d - 2 * c, m.stoneL, -w / 2 + c / 2, 0, 0, 0.03); box(g, c, 0.32, d - 2 * c, m.stoneL, w / 2 - c / 2, 0, 0, 0.03);
    box(g, w - 2 * c, 0.02, d - 2 * c, m.tile, 0, 0.04, 0, 0.005);
    box(g, w - 2 * c, 0.02, d - 2 * c, m.water, 0, 0.27, 0, 0.005);
    [-1, 1].forEach((s) => { const l = box(g, 0.04, 0.02, 0.5, m.black, s * 0.14 + w / 2 - c - 0.4, 0.32, -d / 2 + c + 0.05, 0.005); void l; cyl(g, 0.018, 0.75, H.M().chrome, s * 0.14 + w / 2 - c - 0.4, 0.32, -d / 2 + c - 0.05); });
    return g;
  };
  B.fountain = (w) => {
    const g = G(), m = mats(), R = w / 2;
    cyl(g, R, 0.4, m.stoneL, 0, 0, 0, R - 0.04, 28); cyl(g, R - 0.1, 0.03, m.water, 0, 0.36, 0, R - 0.1, 28);
    cyl(g, 0.15, 0.7, m.stoneL, 0, 0.36, 0, 0.1); cyl(g, 0.4, 0.14, m.stoneL, 0, 1.0, 0, 0.3, 24); cyl(g, 0.34, 0.02, m.water, 0, 1.13, 0, 0.34);
    cyl(g, 0.03, 0.3, m.water, 0, 1.13, 0, 0.012);
    return g;
  };
  B.pergola = (w, d) => {
    const g = G(), m = mats(), Hh = 2.6;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.16, Hh, 0.16, m.wood, a * (w / 2 - 0.12), 0, b * (d / 2 - 0.12), 0.01));
    [-1, 1].forEach((b) => box(g, w, 0.2, 0.12, m.woodD, 0, Hh, b * (d / 2 - 0.12), 0.01));
    for (let i = 0; i <= 12; i++) box(g, 0.08, 0.1, d + 0.3, m.wood, -w / 2 + 0.1 + (i * (w - 0.2)) / 12, Hh + 0.2, 0, 0.01);
    return g;
  };
  B.path = (w, d) => { const g = G(), m = mats(); box(g, w, 0.03, d, m.loseta, 0, 0, 0, 0.01); for (let i = 1; i < Math.round(d / 0.5); i++) box(g, w, 0.032, 0.02, m.stone, 0, 0, -d / 2 + i * 0.5, 0.004); box(g, 0.02, 0.032, d, m.stone, 0, 0, 0, 0.004); return g; };
  B.stones = () => { const g = G(), m = mats(); [[-0.1, -0.85], [0.12, -0.3], [-0.12, 0.25], [0.1, 0.8]].forEach(([x, z]) => cyl(g, 0.27, 0.05, m.stoneL, x, 0, z, 0.25, 18)); return g; };
  B.firepit = (w) => {
    const g = G(), m = mats(), R = w / 2 - 0.08;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283, b = box(g, 0.22, 0.22, 0.28, i % 2 ? m.stone : m.stoneL, Math.cos(a) * R, 0, Math.sin(a) * R, 0.05); b.rotation.y = -a; }
    cyl(g, R - 0.12, 0.12, m.black, 0, 0, 0);
    [[0, 0, 0.42], [0.1, 0.06, 0.3], [-0.1, -0.05, 0.26]].forEach(([x, z, h], i) => cyl(g, 0.11 - i * 0.02, h, i ? m.flame : new THREE.MeshBasicMaterial({ color: 0xff7a1f, toneMapped: false }), x, 0.12, z, 0.01, 8));
    return g;
  };
  B.hammock = (w, d) => {
    const g = G(), m = mats();
    [-1, 1].forEach((s) => { const p = cyl(g, 0.05, 1.5, m.woodD, s * (w / 2 - 0.1), 0, 0, 0.04); p.rotation.z = -s * 0.08; box(g, 0.05, 0.05, 0.8, m.woodD, s * (w / 2 - 0.1), 0, 0, 0.01); });
    const n = 8;
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, x0 = -w / 2 + 0.2 + (w - 0.4) * t0, x1 = -w / 2 + 0.2 + (w - 0.4) * t1, y = (t) => 1.3 - Math.sin(Math.PI * t) * 0.55; const len = Math.hypot(x1 - x0, y(t1) - y(t0)); const s = box(g, len + 0.02, 0.03, 0.75 - Math.sin(Math.PI * (t0 + t1) / 2) * 0.1, m.fabric, (x0 + x1) / 2, (y(t0) + y(t1)) / 2, 0, 0.012); s.rotation.z = Math.atan2(y(t1) - y(t0), x1 - x0); }
    return g;
  };
  B.shed = (w, d) => {
    const g = G(), m = mats(), Hh = 2.0;
    box(g, w, Hh, d, m.wood, 0, 0.05, 0, 0.02); box(g, w + 0.05, 0.05, d + 0.05, m.woodD, 0, 0, 0, 0.01);
    [-1, 1].forEach((s) => { const r = box(g, w + 0.3, 0.06, d / 2 + 0.25, m.roof, 0, 0, 0, 0.01); r.position.set(0, Hh + 0.25, s * (d / 4 - 0.02)); r.rotation.x = s * 0.32; });
    box(g, 0.95, 1.85, 0.04, m.woodD, 0, 0.05, d / 2 + 0.005, 0.01); box(g, 0.05, 0.05, 0.05, H.M().chrome, 0.34, 1.0, d / 2 + 0.05);
    box(g, 0.5, 0.45, 0.04, H.M().glass, w / 2 - 0.55, 1.1, d / 2 + 0.005, 0.01);
    return g;
  };
  B.glamp = () => { const g = G(), m = mats(); cyl(g, 0.05, 0.05, m.black, 0, 0, 0); cyl(g, 0.018, 0.8, m.black, 0, 0.05, 0); sph(g, 0.1, m.glow, 0, 0.92, 0, 1, 1.2, 1); cyl(g, 0.12, 0.02, m.black, 0, 1.06, 0, 0.05); return g; };
  const pickets = (g, m, w, h, top) => { const n = Math.max(3, Math.round(w / 0.14)); for (let i = 0; i < n; i++) { const p = box(g, 0.055, h - 0.1, 0.025, m.white, -w / 2 + 0.06 + ((w - 0.12) * i) / (n - 1), 0.05, 0, 0.005); if (top) p.scale.y = 1; } };
  B.fence = (w, d) => { const g = G(), m = mats(); pickets(g, m, w, 1.5); [0.35, 1.2].forEach((y) => box(g, w, 0.06, 0.04, m.white, 0, y, -0.03, 0.005)); [-1, 1].forEach((s) => box(g, 0.1, 1.6, 0.1, m.white, s * (w / 2 - 0.05), 0, 0, 0.01)); return g; };
  B.gate = (w, d) => { const g = G(), m = mats(); pickets(g, m, w - 0.1, 1.5); [0.3, 1.25].forEach((y) => box(g, w - 0.1, 0.07, 0.04, m.white, 0, y, -0.03, 0.005)); [-1, 1].forEach((s) => box(g, 0.1, 1.9, 0.1, m.stoneL, s * (w / 2 - 0.05), 0, 0, 0.01)); box(g, 0.05, 0.05, 0.05, H.M().chrome, w / 2 - 0.2, 0.95, 0.04); return g; };
  B.doghouse = (w, d) => {
    const g = G(), m = mats();
    box(g, w, 0.6, d, m.wood, 0, 0.06, 0, 0.02); [-1, 1].forEach((s) => { const r = box(g, w + 0.14, 0.05, d / 2 + 0.12, m.roof, 0, 0, 0, 0.01); r.position.set(0, 0.74, s * (d / 4 - 0.02)); r.rotation.x = s * 0.45; });
    box(g, 0.34, 0.44, 0.03, m.black, 0, 0.06, d / 2 + 0.005, 0.01); box(g, w + 0.06, 0.06, d + 0.06, m.woodD, 0, 0, 0, 0.01);
    return g;
  };
  B.sofa_out = (w, d) => {
    const g = G(), m = mats(), C = H.M().cushion2;
    box(g, w, 0.3, d, m.rattan, 0, 0.1, 0, 0.05); [-1, 1].forEach((s) => [-1, 1].forEach((t) => cyl(g, 0.03, 0.12, m.black, s * (w / 2 - 0.1), 0, t * (d / 2 - 0.1))));
    box(g, w, 0.45, 0.14, m.rattan, 0, 0.35, -d / 2 + 0.07, 0.05); [-1, 1].forEach((s) => box(g, 0.12, 0.25, d, m.rattan, s * (w / 2 - 0.06), 0.35, 0, 0.04));
    [-1, 1].forEach((s) => { box(g, w / 2 - 0.2, 0.14, d - 0.24, C, s * (w / 4 - 0.02), 0.4, 0.06, 0.05); const b = box(g, w / 2 - 0.22, 0.4, 0.14, C, s * (w / 4 - 0.02), 0.5, -d / 2 + 0.22, 0.06); b.rotation.x = -0.15; });
    return g;
  };
})();

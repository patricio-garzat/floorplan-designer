/* games.js — cuarto de juegos: billar, ping-pong, futbolito, hockey de aire, póker, ajedrez, arcade, pinball, dardos y taquera.
   Planta 2D + modelo 3D (THREE se usa solo al construir, porque se carga bajo demanda). */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;

  /* ---------- planta 2D ---------- */
  const D = {
    pool_table: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#6b4630', { rx: 0.06 }) + g.rect(-w / 2 + 0.13, -h / 2 + 0.13, w - 0.26, h - 0.26, '#2f8a55', { rx: 0.02, hair: 1 });
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b]) => { s += g.circ(a * (w / 2 - 0.1), b * (h / 2 - 0.1), 0.055, '#1d1d1f', { hair: 1 }); });
      const bx = w * 0.2; let i = 0;
      for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) { s += g.circ(bx + r * 0.05, (k - r / 2) * 0.058, 0.026, ['#f2c14e', '#1f6fd0', '#d9352b', '#6a3fa0', '#f08a2e', '#2f9a4e', '#8a2b2b', '#1d1d1f'][i++ % 8], { hair: 1 }); }
      return s + g.circ(-w * 0.22, 0, 0.026, '#ffffff', { hair: 1 }) + g.line(-w / 2 - 0.05, h * 0.42, -w * 0.05, h * 0.03, { soft: 1 });
    },
    pingpong: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#2f6fb0', { rx: 0.02 }) + g.rect(-w / 2 + 0.02, -h / 2 + 0.02, w - 0.04, h - 0.04, '#2f6fb0', { nf: 1, hair: 1, soft: 1 }) + g.line(-w / 2, 0, w / 2, 0, { soft: 1 }) + g.line(0, -h / 2 - 0.06, 0, h / 2 + 0.06) + g.rect(-0.012, -h / 2 - 0.02, 0.024, h + 0.04, '#ffffff', { hair: 1 }),
    foosball: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#8a5a3a', { rx: 0.03 }) + g.rect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12, '#3f9a5a', { hair: 1 }); for (let i = 0; i < 8; i++) { const x = -w / 2 + 0.22 + i * ((w - 0.44) / 7); s += g.line(x, -h / 2 - 0.12, x, h / 2 + 0.12, { soft: 1 }) + g.circ(x, -h / 2 - 0.12, 0.022, '#1d1d1f', { hair: 1 }) + g.circ(x, h / 2 + 0.12, 0.022, '#1d1d1f', { hair: 1 }); } return s; },
    airhockey: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#2b4c86', { rx: 0.08 }) + g.rect(-w / 2 + 0.07, -h / 2 + 0.07, w - 0.14, h - 0.14, '#f4f6f8', { rx: 0.05, hair: 1 }) + g.line(0, -h / 2 + 0.07, 0, h / 2 - 0.07, { soft: 1 }) + g.circ(0, 0, 0.12, '#ffffff', { nf: 1, hair: 1, soft: 1 }) + g.rect(-w / 2 + 0.02, -0.15, 0.06, 0.3, '#1d1d1f', { hair: 1 }) + g.rect(w / 2 - 0.08, -0.15, 0.06, 0.3, '#1d1d1f', { hair: 1 }) + g.circ(-w * 0.25, 0, 0.06, '#d9352b', { hair: 1 }) + g.circ(w * 0.25, 0.1, 0.06, '#2f6fd0', { hair: 1 }),
    poker_table: (w, h, g) => { let s = g.circ(0, 0, w / 2, '#5b3a26') + g.circ(0, 0, w / 2 - 0.1, '#2f7f4f', { hair: 1 }) + g.circ(0, 0, w / 2 - 0.25, '#2f7f4f', { nf: 1, hair: 1, soft: 1, dash: 1 }); [0, 1, 2, 3, 4, 5].forEach((i) => { const a = (i / 6) * Math.PI * 2; s += g.circ(Math.cos(a) * w * 0.27, Math.sin(a) * w * 0.27, 0.05, ['#d9352b', '#1d1d1f', '#2f6fd0'][i % 3], { hair: 1 }); }); return s; },
    chess_table: (w, h, g) => { let s = g.rect(-0.45, -0.45, 0.9, 0.9, '#8a5a3a') + g.rect(-0.36, -0.36, 0.72, 0.72, '#f0e2c6', { hair: 1 }); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) s += g.rect(-0.36 + i * 0.09, -0.36 + j * 0.09, 0.09, 0.09, '#8a5a3a', { hair: 1, soft: 1 }); return s + g.rect(-w / 2, -0.22, 0.4, 0.44, '#c9a27a', { rx: 0.04 }) + g.rect(w / 2 - 0.4, -0.22, 0.4, 0.44, '#c9a27a', { rx: 0.04 }); },
    arcade: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#1d1d24', { rx: 0.03 }) + g.rect(-w / 2 + 0.06, -h / 2 + 0.08, w - 0.12, 0.3, '#3a8fe0', { hair: 1 }) + g.rect(-w / 2 + 0.06, h / 2 - 0.36, w - 0.12, 0.26, '#d9352b', { hair: 1 }) + g.circ(-0.1, h / 2 - 0.22, 0.03, '#fff', { hair: 1 }) + g.circ(0.06, h / 2 - 0.22, 0.03, '#f2c14e', { hair: 1 }) + g.circ(0.16, h / 2 - 0.22, 0.03, '#2f9a4e', { hair: 1 }),
    pinball: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#1d1d24', { rx: 0.03 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.2, w - 0.1, h - 0.3, '#3a8fe0', { hair: 1, rx: 0.02 }) + g.circ(-0.1, 0.1, 0.05, '#f2c14e', { hair: 1 }) + g.circ(0.1, -0.15, 0.05, '#d9352b', { hair: 1 }) + g.line(-0.15, h / 2 - 0.25, -0.05, h / 2 - 0.2, { soft: 1 }) + g.line(0.15, h / 2 - 0.25, 0.05, h / 2 - 0.2, { soft: 1 }),
    art_dartboard: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#1d1d24') + g.circ(0, h / 2, 0.05, '#e7d9b6', { hair: 1 }),
    art_cuerack: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#8a5a3a') + [-1, 0, 1].map((k) => g.circ(k * 0.1, 0, 0.012, '#e7d9b6', { hair: 1 })).join(''),
  };
  const NEW = {
    pool_table: ['Mesa de billar', 2.6, 1.45, 0.85, '#2f8a55'], pingpong: ['Mesa de ping-pong', 2.74, 1.525, 0.76, '#2f6fb0'], foosball: ['Futbolito', 1.4, 0.75, 0.9, '#3f9a5a'],
    airhockey: ['Hockey de aire', 2.0, 1.0, 0.85, '#2b4c86'], poker_table: ['Mesa de póker', 1.6, 1.6, 0.78, '#2f7f4f'], chess_table: ['Mesa de ajedrez con sillas', 1.6, 0.9, 0.78, '#8a5a3a'],
    arcade: ['Máquina arcade', 0.7, 0.85, 1.85, '#1d1d24'], pinball: ['Pinball', 0.6, 1.4, 1.5, '#3a8fe0'],
  };
  Object.keys(NEW).forEach((k) => { const [name, w, h, z, c] = NEW[k]; I[k] = { name, w, h, z, c, draw: D[k] }; });
  const wallIcon = (svg) => (size) => `<svg width="${size}" height="${size}" viewBox="0 0 52 52">${svg}</svg>`;
  I.art_dartboard = { name: 'Tablero de dardos', w: 0.5, h: 0.08, z: 0, c: '#1d1d24', draw: D.art_dartboard, wall: true, ph: 0.5, z0: 1.73, style: 'darts',
    iconFn: wallIcon('<circle cx="26" cy="26" r="20" fill="#1d1d24"/><circle cx="26" cy="26" r="15" fill="#f0e2c6"/><circle cx="26" cy="26" r="11" fill="#d9352b"/><circle cx="26" cy="26" r="8" fill="#f0e2c6"/><circle cx="26" cy="26" r="4" fill="#2f9a4e"/><circle cx="26" cy="26" r="1.6" fill="#d9352b"/>') };
  I.art_cuerack = { name: 'Taquera de billar', w: 0.55, h: 0.1, z: 0, c: '#8a5a3a', draw: D.art_cuerack, wall: true, ph: 1.5, z0: 1.15, style: 'cuerack',
    iconFn: wallIcon('<rect x="6" y="18" width="40" height="18" rx="2" fill="#8a5a3a"/><path d="M14 4v44M22 4v44M30 4v44M38 4v44" stroke="#e7d9b6" stroke-width="3" stroke-linecap="round"/>') };
  F.CATS.splice(Math.max(1, F.CATS.findIndex((c) => c.id === 'sala') + 1), 0, { id: 'juegos', name: 'Juegos', items: ['pool_table', 'pingpong', 'foosball', 'airhockey', 'poker_table', 'chess_table', 'pinball', 'arcade', 'art_dartboard', 'art_cuerack'] });

  /* ---------- 3D ---------- */
  const H = FP.Models.helpers, B = FP.Models.B, { box, cyl, sph, G } = H;
  const cache = {};
  const std = (k, hex, o) => cache[k] || (cache[k] = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.7 }, o || {})));
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
  const tex = (k, w, h, draw, o) => cache[k] || (cache[k] = new THREE.MeshStandardMaterial(Object.assign({ map: canvasTex(w, h, draw), roughness: 0.8 }, o || {})));
  const felt = (k, hex) => tex('felt' + k, 256, 256, (g, w, h) => { g.fillStyle = hex; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } }, { roughness: 1 });
  const BALL_COL = ['#f2c14e', '#1f5fc0', '#d9352b', '#5a2f94', '#f07a2e', '#2f8a4e', '#8a2b2b', '#16161a'];
  const ball = (n) => tex('ball' + n, 64, 64, (g, w, h) => {
    const col = n === 0 ? '#f6f2ea' : BALL_COL[(n - 1) % 8];
    g.fillStyle = n > 8 ? '#f6f2ea' : col; g.fillRect(0, 0, w, h);
    if (n > 8) { g.fillStyle = col; g.fillRect(0, h * 0.28, w, h * 0.44); }
    if (n > 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, 10, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), w / 2, h / 2 + 1); }
  }, { roughness: 0.15, metalness: 0.05 });
  const strut = (g, x0, y0, z0, x1, y1, z1, r, m) => { const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), d = b.clone().sub(a), s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), m); s.position.copy(a.clone().add(b).multiplyScalar(0.5)); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); s.castShadow = true; g.add(s); return s; };
  const wood = () => std('wood', '#5e3b26', { roughness: 0.5 }), woodL = () => std('woodL', '#b98a5a', { roughness: 0.6 }), black = () => std('blk', '#1a1a1f', { roughness: 0.45, metalness: 0.4 }), chrome = () => H.M().chrome;

  B.pool_table = (w, d) => {
    const g = G(), Tp = 0.8, fm = felt('g', '#1f7a4a');
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { box(g, 0.16, Tp - 0.12, 0.16, wood(), a * (w / 2 - 0.2), 0, b * (d / 2 - 0.2), 0.03); box(g, 0.2, 0.05, 0.2, wood(), a * (w / 2 - 0.2), Tp - 0.14, b * (d / 2 - 0.2), 0.02); });
    box(g, w - 0.2, 0.16, d - 0.2, wood(), 0, Tp - 0.28, 0, 0.02);                                   // faldón
    box(g, w, 0.14, d, wood(), 0, Tp - 0.14, 0, 0.04);                                                // losa
    box(g, w - 0.26, 0.012, d - 0.26, fm, 0, Tp, 0, 0.004);                                           // paño
    const r = 0.13; // bandas de madera
    box(g, w, 0.07, r, wood(), 0, Tp, -d / 2 + r / 2, 0.02); box(g, w, 0.07, r, wood(), 0, Tp, d / 2 - r / 2, 0.02);
    box(g, r, 0.07, d - 2 * r, wood(), -w / 2 + r / 2, Tp, 0, 0.02); box(g, r, 0.07, d - 2 * r, wood(), w / 2 - r / 2, Tp, 0, 0.02);
    const cu = std('cush', '#1a6a40', { roughness: 0.9 });  // cojines
    box(g, w - 0.4, 0.04, 0.05, cu, 0, Tp + 0.012, -d / 2 + r + 0.02, 0.012); box(g, w - 0.4, 0.04, 0.05, cu, 0, Tp + 0.012, d / 2 - r - 0.02, 0.012);
    box(g, 0.05, 0.04, d - 0.4, cu, -w / 2 + r + 0.02, Tp + 0.012, 0, 0.012); box(g, 0.05, 0.04, d - 0.4, cu, w / 2 - r - 0.02, Tp + 0.012, 0, 0.012);
    [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b]) => cyl(g, 0.055, 0.016, black(), a * (w / 2 - 0.12), Tp + 0.008, b * (d / 2 - 0.12), 0.055, 16));
    for (let i = 1; i <= 3; i++) [-1, 1].forEach((s) => { sph(g, 0.012, std('dia', '#efe7d2', { roughness: 0.4 }), -w * 0.3 + (i - 1) * w * 0.3, Tp + 0.072, s * (d / 2 - r / 2), 1, 0.3, 1); });
    const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]; let k = 0, y = Tp + 0.0286 + 0.006;
    for (let row = 0; row < 5; row++) for (let c = 0; c <= row; c++) sph(g, 0.0286, ball(order[k++]), w * 0.2 + row * 0.05, y, (c - row / 2) * 0.058);
    sph(g, 0.0286, ball(0), -w * 0.22, y, 0.02);
    const cue = strut(g, -w / 2 - 0.0, Tp + 0.1, d * 0.42, -w * 0.05, Tp + 0.034, d * 0.04, 0.009, woodL()); void cue;   // taco apoyado
    return g;
  };
  B.pingpong = (w, d) => {
    const g = G(), Tp = 0.76, top = std('ptop', '#245fa8', { roughness: 0.45 }), wt = std('pwhite', '#f4f4f4', { roughness: 0.5 }), lg = std('pleg', '#2a2d33', { roughness: 0.5, metalness: 0.6 });
    box(g, w, 0.03, d, top, 0, Tp - 0.03, 0, 0.006);
    box(g, w - 0.02, 0.002, 0.02, wt, 0, Tp, -d / 2 + 0.01); box(g, w - 0.02, 0.002, 0.02, wt, 0, Tp, d / 2 - 0.01); box(g, 0.02, 0.002, d - 0.02, wt, -w / 2 + 0.01, Tp, 0); box(g, 0.02, 0.002, d - 0.02, wt, w / 2 - 0.01, Tp, 0); box(g, w - 0.04, 0.002, 0.008, wt, 0, Tp, 0);
    [-1, 1].forEach((s) => { box(g, 0.06, 0.03, d - 0.2, lg, s * (w / 2 - 0.55), Tp - 0.06, 0, 0.005); [-1, 1].forEach((t) => strut(g, s * (w / 2 - 0.55), Tp - 0.06, t * (d / 2 - 0.12), s * (w / 2 - 0.35), 0.02, t * (d / 2 + 0.12), 0.022, lg)); box(g, 0.05, 0.04, d + 0.3, lg, s * (w / 2 - 0.35), 0, 0, 0.01); });
    box(g, 0.006, 0.152, d + 0.15, std('net', '#e9eef2', { transparent: true, opacity: 0.6, roughness: 1, side: THREE.DoubleSide }), 0, Tp, 0, 0.002); box(g, 0.012, 0.012, d + 0.15, wt, 0, Tp + 0.14, 0, 0.004);
    [-1, 1].forEach((s) => cyl(g, 0.012, 0.16, chrome(), 0, Tp, s * (d / 2 + 0.075)));
    [[-0.6, -0.3, '#d9352b'], [0.6, 0.35, '#1a1a1f']].forEach(([x, z, c], i) => { const p = cyl(g, 0.078, 0.008, std('pad' + c, c, { roughness: 0.8 }), x, Tp + 0.001, z, 0.078, 24); p.rotation.y = i; box(g, 0.025, 0.02, 0.1, woodL(), x, Tp + 0.002, z + 0.13, 0.004); });
    sph(g, 0.02, wt, 0.1, Tp + 0.02, 0.15);
    return g;
  };
  B.foosball = (w, d) => {
    const g = G(), m = std('fb', '#7a4a2e', { roughness: 0.5 }), field = std('fbf', '#2f8a4e', { roughness: 0.9 }), lg = black(), ch = chrome();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.08, 0.66, 0.08, m, a * (w / 2 - 0.08), 0, b * (d / 2 - 0.08), 0.01));
    box(g, w, 0.2, d, m, 0, 0.64, 0, 0.03); box(g, w - 0.12, 0.02, d - 0.12, field, 0, 0.83, 0, 0.004);
    box(g, w, 0.1, 0.06, m, 0, 0.84, -d / 2 + 0.03, 0.01); box(g, w, 0.1, 0.06, m, 0, 0.84, d / 2 - 0.03, 0.01); box(g, 0.06, 0.1, d, m, -w / 2 + 0.03, 0.84, 0, 0.01); box(g, 0.06, 0.1, d, m, w / 2 - 0.03, 0.84, 0, 0.01);
    const counts = [1, 2, 5, 3, 3, 5, 2, 1];
    for (let i = 0; i < 8; i++) {
      const x = -w / 2 + 0.22 + i * ((w - 0.44) / 7), red = i < 4;
      const r = cyl(g, 0.008, d + 0.36, ch, x, 0, 0); r.rotation.x = Math.PI / 2; r.position.set(x, 0.96, 0);
      [-1, 1].forEach((s) => { const hd = cyl(g, 0.02, 0.12, lg, x, 0, 0); hd.rotation.x = Math.PI / 2; hd.position.set(x, 0.96, s * (d / 2 + 0.2)); });
      const n = counts[i], span = Math.min(d - 0.18, n * 0.12);
      for (let k = 0; k < n; k++) { const z = n === 1 ? 0 : -span / 2 + (span * k) / (n - 1); box(g, 0.035, 0.11, 0.045, std('fp' + red, red ? '#d9352b' : '#1f5fc0', { roughness: 0.5 }), x, 0.78, z, 0.008); cyl(g, 0.014, 0.05, std('fh' + red, '#e7d9b6'), x, 0.9, z); }
    }
    sph(g, 0.017, std('fball', '#f6f2ea', { roughness: 0.3 }), 0.05, 0.855, 0.05);
    return g;
  };
  B.airhockey = (w, d) => {
    const g = G(), Tp = 0.85, body = std('ah', '#23396b', { roughness: 0.45 }), sf = std('ahs', '#eef2f5', { roughness: 0.25 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.08, Tp - 0.1, 0.08, black(), a * (w / 2 - 0.12), 0, b * (d / 2 - 0.12), 0.01));
    box(g, w, 0.12, d, body, 0, Tp - 0.12, 0, 0.05); box(g, w - 0.16, 0.012, d - 0.16, sf, 0, Tp, 0, 0.004);
    [-1, 1].forEach((s) => { box(g, w, 0.06, 0.08, body, 0, Tp, s * (d / 2 - 0.04), 0.03); box(g, 0.08, 0.06, d - 0.16, body, s * (w / 2 - 0.04), Tp, 0, 0.03); box(g, 0.05, 0.03, 0.34, black(), s * (w / 2 - 0.1), Tp + 0.003, 0, 0.006); });
    box(g, 0.012, 0.002, d - 0.16, std('ahl', '#d9352b'), 0, Tp + 0.013, 0); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.004, 6, 40), std('ahr', '#2f6fd0')); ring.rotation.x = Math.PI / 2; ring.position.y = Tp + 0.014; g.add(ring);
    cyl(g, 0.04, 0.012, black(), 0.2, Tp + 0.012, 0.05, 0.04, 20);
    [[-0.55, -0.1, '#d9352b'], [0.6, 0.15, '#2f6fd0']].forEach(([x, z, c]) => { cyl(g, 0.05, 0.02, std('st' + c, c, { roughness: 0.3 }), x, Tp + 0.012, z, 0.05, 20); cyl(g, 0.018, 0.04, black(), x, Tp + 0.032, z); });
    box(g, 0.26, 0.09, 0.03, std('ahsc', '#14161c', { emissive: new THREE.Color('#ff3020'), emissiveIntensity: 0.6 }), 0, Tp + 0.06, -d / 2 - 0.02, 0.008);
    return g;
  };
  B.poker_table = (w) => {
    const g = G(), Tp = 0.78, R = w / 2, fm = felt('p', '#1f6a42');
    cyl(g, 0.22, 0.04, wood(), 0, 0, 0, 0.22, 28); cyl(g, 0.07, Tp - 0.12, wood(), 0, 0.04, 0, 0.07, 18);
    cyl(g, R, 0.09, wood(), 0, Tp - 0.13, 0, R - 0.04, 40); cyl(g, R - 0.12, 0.014, fm, 0, Tp - 0.04, 0, R - 0.12, 40);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.06, 12, 48), std('prail', '#241a16', { roughness: 0.6 })); rail.rotation.x = Math.PI / 2; rail.position.y = Tp - 0.02; rail.scale.z = 0.6; g.add(rail);
    const chips = ['#d9352b', '#16161a', '#2f6fd0', '#2f8a4e', '#efe7d2'];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, x = Math.cos(a) * R * 0.52, z = Math.sin(a) * R * 0.52; for (let k = 0; k < 5 + (i % 3); k++) cyl(g, 0.019, 0.004, std('ch' + ((i + k) % 5), chips[(i + k) % 5], { roughness: 0.4 }), x, Tp - 0.026 + k * 0.004, z, 0.019, 14); }
    for (let k = 0; k < 5; k++) box(g, 0.05, 0.002, 0.07, std('card', '#f4f1ea', { roughness: 0.5 }), -0.2 + k * 0.1, Tp - 0.025, 0.03 + (k % 2) * 0.01, 0.002).rotation.y = (k - 2) * 0.1;
    cyl(g, 0.03, 0.006, std('btn', '#f2c14e', { roughness: 0.3, metalness: 0.5 }), 0.3, Tp - 0.026, -0.25, 0.03, 16);
    return g;
  };
  B.chess_table = (w, d) => {
    const g = G(), Tp = 0.74, bd = tex('chessb', 512, 512, (c, W, Hh) => { c.fillStyle = '#6a4127'; c.fillRect(0, 0, W, Hh); const s = 52, o = 48; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#8a5a3a' : '#f0e2c6'; c.fillRect(o + i * s, o + j * s, s, s); } }, { roughness: 0.35 });
    box(g, 0.9, 0.04, 0.9, wood(), 0, Tp - 0.04, 0, 0.01); const top = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), bd); top.rotation.x = -Math.PI / 2; top.position.y = Tp + 0.002; g.add(top);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.06, Tp - 0.04, 0.06, wood(), a * 0.38, 0, b * 0.38, 0.01));
    const P = (hex) => std('cp' + hex, hex, { roughness: 0.35 });
    for (let i = 0; i < 8; i++) for (const [row, col, hi] of [[1, '#efe6cf', 0.05], [6, '#2a1c14', 0.05], [0, '#efe6cf', 0.07], [7, '#2a1c14', 0.07]]) {
      const x = -0.3 + i * 0.0815 - 0.0, z = -0.3 + row * 0.0815, pawn = row === 1 || row === 6;
      cyl(g, pawn ? 0.014 : 0.017, pawn ? 0.045 : (i === 3 || i === 4 ? 0.07 : 0.055), P(col), x, Tp + 0.004, z, pawn ? 0.009 : 0.011, 12); sph(g, pawn ? 0.014 : 0.016, P(col), x, Tp + 0.004 + (pawn ? 0.05 : (i === 3 || i === 4 ? 0.075 : 0.06)), z);
    }
    [-1, 1].forEach((s) => { // sillas
      const x = s * (w / 2 - 0.2), cm = std('chair', '#b98a5a', { roughness: 0.7 });
      box(g, 0.42, 0.04, 0.44, cm, x, 0.44, 0, 0.01); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(g, 0.015, 0.44, cm, x + a * 0.17, 0, b * 0.18, 0.012));
      box(g, 0.04, 0.4, 0.42, cm, x + s * 0.19, 0.48, 0, 0.01);
    });
    return g;
  };
  B.arcade = (w, d) => {
    const g = G(), body = std('arc', '#191a22', { roughness: 0.4 }), art = std('arcart', '#2a6fd0', { roughness: 0.5 }), led = std('arcl', '#ff3f9a', { emissive: new THREE.Color('#ff3f9a'), emissiveIntensity: 1.2 });
    [-1, 1].forEach((s) => { box(g, 0.04, 1.85, d, body, s * (w / 2 - 0.02), 0, 0, 0.008); box(g, 0.012, 1.6, d - 0.1, art, s * (w / 2 + 0.002), 0.12, 0, 0.004); });
    box(g, w - 0.08, 1.85, 0.04, body, 0, 0, -d / 2 + 0.02, 0.006);
    box(g, w - 0.08, 0.7, d - 0.06, body, 0, 0, 0.0, 0.008);                                              // base
    const sb = box(g, w - 0.08, 0.5, 0.05, body, 0, 1.05, -0.1, 0.006); sb.rotation.x = -0.15;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, 0.42), H.M().tvScreen); scr.position.set(0, 1.3, -0.065); scr.rotation.x = -0.15; g.add(scr);
    const cp = box(g, w - 0.08, 0.06, 0.3, body, 0, 0.88, d / 2 - 0.3, 0.006); cp.rotation.x = 0.16;
    cyl(g, 0.012, 0.08, chrome(), -0.14, 0.94, d / 2 - 0.3); sph(g, 0.03, std('joy', '#d9352b', { roughness: 0.3 }), -0.14, 1.02, d / 2 - 0.3);
    ['#2f6fd0', '#f2c14e', '#2f9a4e', '#d9352b'].forEach((c, i) => cyl(g, 0.022, 0.014, std('bt' + c, c, { roughness: 0.3 }), 0.02 + (i % 2) * 0.07, 0.94 + (i < 2 ? 0.0 : 0.0), d / 2 - 0.33 + Math.floor(i / 2) * 0.07));
    box(g, w - 0.08, 0.3, 0.06, led, 0, 1.55, -0.12, 0.006);                                              // marquesina luminosa
    box(g, w - 0.08, 0.2, 0.04, body, 0, 1.65, d / 2 - 0.3, 0.006);
    box(g, 0.2, 0.22, 0.02, black(), 0, 0.3, d / 2 - 0.03, 0.004); [-1, 1].forEach((s) => box(g, 0.03, 0.05, 0.01, std('coin', '#ffd54a', { emissive: new THREE.Color('#ffd54a'), emissiveIntensity: 0.6 }), s * 0.05, 0.4, d / 2 - 0.018));
    return g;
  };
  B.pinball = (w, d) => {
    const g = G(), body = std('pbb', '#1b1c26', { roughness: 0.4 }), art = std('pba', '#2a6fd0', { roughness: 0.5 }), leg = std('pbl', '#b9bec4', { roughness: 0.25, metalness: 0.9 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(g, 0.025, 0.78, leg, a * (w / 2 - 0.05), 0, b * (d / 2 - 0.1)));
    const cab = box(g, w, 0.22, d, body, 0, 0.7, 0, 0.02); box(g, w + 0.004, 0.16, d - 0.05, art, 0, 0.72, 0, 0.004); void cab;
    const pf = box(g, w - 0.08, 0.02, d - 0.12, std('pbf', '#2f7fd0', { roughness: 0.3 }), 0, 0.93, 0.03, 0.004); pf.rotation.x = 0.1;
    const gl = box(g, w - 0.06, 0.012, d - 0.1, std('pbg', '#cfe6ff', { transparent: true, opacity: 0.25, roughness: 0.05 }), 0, 1.0, 0.03, 0.003); gl.rotation.x = 0.1;
    const bb = box(g, w, 0.6, 0.16, body, 0, 0.92, -d / 2 + 0.08, 0.02); void bb; box(g, w - 0.08, 0.46, 0.02, std('pbp', '#ff9a3d', { emissive: new THREE.Color('#ff7a1f'), emissiveIntensity: 0.9 }), 0, 0.99, -d / 2 + 0.17, 0.004);
    [[-0.1, 0.05], [0.1, -0.15], [0, -0.35]].forEach(([x, z]) => cyl(g, 0.035, 0.02, std('bump', '#f2c14e', { emissive: new THREE.Color('#f2c14e'), emissiveIntensity: 0.5 }), x, 0.96, z, 0.035, 14));
    [-1, 1].forEach((s) => { const f = box(g, 0.1, 0.014, 0.025, std('flip', '#d9352b'), s * 0.09, 0.95, d / 2 - 0.27, 0.004); f.rotation.y = s * 0.5; });
    box(g, 0.25, 0.05, 0.03, body, 0, 0.76, d / 2 + 0.005, 0.005);
    [-1, 1].forEach((s) => cyl(g, 0.025, 0.03, std('fbtn', '#d9352b'), s * (w / 2 + 0.005), 0.86, d / 2 - 0.3).rotation.z = Math.PI / 2);
    sph(g, 0.014, chrome(), 0.06, 0.97, 0.1);
    return g;
  };
  B.art_dartboard = (w, d, it) => {
    const g = G(), y = it.z || 1.73, dia = 0.45;
    const bd = tex('dartb', 512, 512, (c, W, Hh) => {
      const cx = W / 2, cy = Hh / 2, R = W / 2, seg = Math.PI / 10, nums = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
      c.fillStyle = '#16161a'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
      for (let i = 0; i < 20; i++) { const a0 = -Math.PI / 2 - seg / 2 + i * seg, dk = i % 2 === 0, rs = [[0.66, dk ? '#16161a' : '#efe3c6'], [0.6, dk ? '#d9352b' : '#2f9a4e'], [0.43, dk ? '#16161a' : '#efe3c6'], [0.37, dk ? '#d9352b' : '#2f9a4e'], [0.0, '#000']];
        for (let r = 0; r < 4; r++) { c.fillStyle = r === 0 ? (dk ? '#d9352b' : '#2f9a4e') : r === 1 ? (dk ? '#16161a' : '#efe3c6') : r === 2 ? (dk ? '#d9352b' : '#2f9a4e') : (dk ? '#16161a' : '#efe3c6'); const outer = [0.97, 0.88, 0.6, 0.52][r] * R * 0.73, inner = [0.88, 0.6, 0.52, 0.2][r] * R * 0.73; c.beginPath(); c.arc(cx, cy, outer, a0, a0 + seg); c.arc(cx, cy, inner, a0 + seg, a0, true); c.closePath(); c.fill(); } void rs;
        c.fillStyle = '#efe3c6'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(nums[i]), cx + Math.cos(a0 + seg / 2) * R * 0.86, cy + Math.sin(a0 + seg / 2) * R * 0.86); }
      c.fillStyle = '#2f9a4e'; c.beginPath(); c.arc(cx, cy, R * 0.065, 0, 7); c.fill(); c.fillStyle = '#d9352b'; c.beginPath(); c.arc(cx, cy, R * 0.028, 0, 7); c.fill();
      c.strokeStyle = '#b9bec4'; c.lineWidth = 1.2; [0.73 * 0.97, 0.73 * 0.88, 0.73 * 0.6, 0.73 * 0.52].forEach((k) => { c.beginPath(); c.arc(cx, cy, R * k, 0, 7); c.stroke(); });
    }, { roughness: 0.85 });
    const z0 = -d / 2 + 0.025;
    cyl(g, dia / 2 + 0.06, 0.04, std('dsr', '#16161a', { roughness: 0.6 }), 0, 0, 0, dia / 2 + 0.06, 40).rotation.x = Math.PI / 2;
    const ring = g.children[g.children.length - 1]; ring.position.set(0, y, z0);
    const face = new THREE.Mesh(new THREE.CircleGeometry(dia / 2, 48), bd); face.position.set(0, y, z0 + 0.022); face.castShadow = true; g.add(face);
    [[0.05, 0.08, 0.1], [-0.06, 0.03, 0.09], [0.1, -0.06, 0.11]].forEach(([x, yy, l], i) => { const dt = cyl(g, 0.004, l, chrome(), 0, 0, 0, 0.002); dt.rotation.x = Math.PI / 2; dt.position.set(x, y + yy, z0 + 0.022 + l / 2); box(g, 0.02, 0.02, 0.012, std('fl' + i, ['#d9352b', '#2f6fd0', '#f2c14e'][i], { roughness: 0.6 }), x, y + yy - 0.01, z0 + 0.022 + l, 0.002); });
    return g;
  };
  B.art_cuerack = (w, d, it) => {
    const g = G(), y = it.z || 1.15, bk = -d / 2;
    box(g, w, 0.12, 0.03, wood(), 0, y + 0.55, bk + 0.015, 0.006); box(g, w, 0.12, 0.03, wood(), 0, y - 0.5, bk + 0.015, 0.006);
    [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => { const x = k * (w / 4); cyl(g, 0.014, 1.45, std('cue' + i, i % 2 ? '#c99a66' : '#6b3f22', { roughness: 0.4 }), x, y - 0.68, bk + 0.05, 0.007); cyl(g, 0.0145, 0.3, std('cueb', '#1a1410', { roughness: 0.5 }), x, y - 0.68, bk + 0.05, 0.0145); [0.55, -0.5].forEach((dy) => { cyl(g, 0.02, 0.05, wood(), x, y + dy - 0.03, bk + 0.045, 0.02); }); });
    box(g, w, 0.04, 0.08, wood(), 0, y - 0.82, bk + 0.04, 0.008);
    return g;
  };
})();

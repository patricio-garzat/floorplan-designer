/* furniture.js — catálogo de muebles (medidas reales en metros) y su dibujo en vista superior.
   Cada mueble se dibuja en coordenadas locales centradas en (0,0); el "frente" es +y. */
(function () {
  'use strict';
  const FP = window.FP, n = FP.util.n;

  /** Pincel de dibujo: en modo plano todo es blanco con línea fina; en presentación usa color. */
  function mk(p, px) {
    const st = '#2a2a2f', soft = '#9a9aa3', sw = n(1.3 * px), hw = n(0.8 * px);
    const fl = (c) => (p ? c : '#ffffff');
    const A = (col, o) =>
      `fill="${o.nf ? 'none' : fl(col)}" stroke="${o.soft ? soft : st}" stroke-width="${o.hair ? hw : sw}" stroke-linejoin="round" stroke-linecap="round"` +
      (o.dash ? ` stroke-dasharray="${n(4 * px)} ${n(3 * px)}"` : '');
    return {
      p, px,
      rect: (x, y, w, h, col, o = {}) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${o.rx ? ` rx="${n(o.rx)}"` : ''} ${A(col, o)}/>`,
      ell: (cx, cy, rx, ry, col, o = {}) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${A(col, o)}/>`,
      circ: (cx, cy, r, col, o = {}) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r)}" ${A(col, o)}/>`,
      line: (x1, y1, x2, y2, o = {}) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${A(null, Object.assign({ nf: 1, hair: 1 }, o))}/>`,
      path: (d, col, o = {}) => `<path d="${d}" ${A(col, o)}/>`,
    };
  }

  /* ---------- dibujos ---------- */
  const bed = (pill, sheet) => (w, h, g) => {
    let s = g.rect(-w / 2, -h / 2, w, h, '#d9cdbb', { rx: 0.03 });
    s += g.rect(-w / 2, -h / 2, w, 0.08, '#b9a288', { hair: 1 });
    const mx = -w / 2 + 0.05, mw = w - 0.1, my = -h / 2 + 0.1;
    s += g.rect(mx, my, mw, h - 0.15, '#f4f1eb', { rx: 0.03, hair: 1 });
    const gap = 0.07, pw = (mw - gap * (pill + 1)) / pill;
    for (let i = 0; i < pill; i++) s += g.rect(mx + gap + i * (pw + gap), my + 0.06, pw, 0.36, '#ffffff', { rx: 0.07, hair: 1 });
    const by = my + 0.55;
    s += g.rect(mx, by, mw, h / 2 - 0.05 - by, sheet, { rx: 0.03, hair: 1 });
    s += g.rect(mx, by, mw, 0.2, '#eef2f6', { rx: 0.02, hair: 1 });
    return s;
  };

  const sofa = (seats) => (w, h, g) => {
    const arm = 0.16, back = 0.22;
    let s = g.rect(-w / 2, -h / 2, w, h, '#c3c9d0', { rx: 0.07 });
    s += g.rect(-w / 2, -h / 2, w, back, '#a9b0b8', { rx: 0.06, hair: 1 });
    s += g.rect(-w / 2, -h / 2 + back * 0.6, arm, h - back * 0.6, '#a9b0b8', { rx: 0.05, hair: 1 });
    s += g.rect(w / 2 - arm, -h / 2 + back * 0.6, arm, h - back * 0.6, '#a9b0b8', { rx: 0.05, hair: 1 });
    const iw = (w - 2 * arm) / seats;
    for (let i = 0; i < seats; i++) s += g.rect(-w / 2 + arm + i * iw + 0.01, -h / 2 + back, iw - 0.02, h - back - 0.03, '#d8dde3', { rx: 0.05, hair: 1 });
    return s;
  };

  const sofaL = (w, h, g) => {
    const cw = 0.9, b = 0.22;
    const d = `M${n(-w / 2)} ${n(-h / 2)}H${n(w / 2)}V${n(h / 2)}H${n(w / 2 - cw)}V${n(-h / 2 + cw)}H${n(-w / 2)}Z`;
    let s = g.path(d, '#c3c9d0');
    s += g.rect(-w / 2, -h / 2, w, b, '#a9b0b8', { hair: 1 });
    s += g.rect(w / 2 - b, -h / 2, b, h, '#a9b0b8', { hair: 1 });
    s += g.rect(-w / 2, -h / 2 + b, 0.16, cw - b, '#a9b0b8', { hair: 1 });
    const lw = w - cw - 0.16, cwid = lw / 2 - 0.02;
    for (let i = 0; i < 2; i++) s += g.rect(-w / 2 + 0.16 + i * (lw / 2) + 0.01, -h / 2 + b, cwid, cw - b - 0.02, '#d8dde3', { rx: 0.05, hair: 1 });
    s += g.rect(w / 2 - cw, -h / 2 + b, cw - b - 0.01, cw - b - 0.02, '#d8dde3', { rx: 0.05, hair: 1 });
    s += g.rect(w / 2 - cw, -h / 2 + cw, cw - b - 0.01, h - cw - 0.03, '#d8dde3', { rx: 0.05, hair: 1 });
    return s;
  };

  const chair = (w, h, g) => {
    let s = g.rect(-w / 2, -h / 2, w, 0.07, '#b8a084', { rx: 0.03 });
    s += g.rect(-w / 2 + 0.02, -h / 2 + 0.09, w - 0.04, h - 0.11, '#e5d6bf', { rx: 0.06 });
    return s;
  };

  const table = (w, h, g) =>
    g.rect(-w / 2, -h / 2, w, h, '#d7c3a5', { rx: 0.04 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.05, w - 0.1, h - 0.1, '#dfcdb0', { rx: 0.02, hair: 1, soft: 1 });

  const wardrobe = (w, h, g) => {
    let s = g.rect(-w / 2, -h / 2, w, h, '#e3d9cb');
    s += g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#ece4d8', { hair: 1, soft: 1 });
    const k = Math.max(2, Math.round(w / 0.6));
    for (let i = 1; i < k; i++) s += g.line(-w / 2 + (w * i) / k, -h / 2 + 0.03, -w / 2 + (w * i) / k, h / 2);
    s += g.line(-w / 2 + 0.06, -h / 2 + 0.18, w / 2 - 0.06, -h / 2 + 0.18, { dash: 1, soft: 1 });
    return s;
  };

  const D = {
    nightstand: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#d9c9b0') + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, h - 0.08, '#e6d9c3', { hair: 1, soft: 1 }) + g.circ(0, -h / 2 + 0.14, 0.07, '#f3e7c4', { hair: 1 }),
    dresser: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#d9c9b0') + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#e6d9c3', { hair: 1, soft: 1 });
      for (let i = 0; i < 3; i++) s += g.line(-w / 2 + (w * (i + 0.5)) / 3 - 0.05, h / 2 - 0.07, -w / 2 + (w * (i + 0.5)) / 3 + 0.05, h / 2 - 0.07, { hair: 0 });
      return s;
    },
    desk: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#d9c9b0') +
      g.rect(-0.22, -h / 2 + 0.05, 0.44, 0.03, '#2a2a2f', { hair: 1 }) +
      g.rect(-0.18, -h / 2 + 0.25, 0.36, 0.12, '#f1f1f4', { rx: 0.015, hair: 1 }),
    armchair: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#c9b8a6', { rx: 0.08 });
      s += g.rect(-w / 2, -h / 2, w, 0.2, '#b3a08c', { rx: 0.06, hair: 1 });
      s += g.rect(-w / 2, -h / 2 + 0.12, 0.15, h - 0.12, '#b3a08c', { rx: 0.05, hair: 1 });
      s += g.rect(w / 2 - 0.15, -h / 2 + 0.12, 0.15, h - 0.12, '#b3a08c', { rx: 0.05, hair: 1 });
      s += g.rect(-w / 2 + 0.15, -h / 2 + 0.2, w - 0.3, h - 0.23, '#dccfc0', { rx: 0.05, hair: 1 });
      return s;
    },
    coffee: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#d7c3a5', { rx: 0.05 }) + g.rect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12, '#e9f2f6', { rx: 0.03, hair: 1, soft: 1 }) +
      g.line(-w / 2 + 0.14, h / 2 - 0.1, -w / 2 + 0.34, -h / 2 + 0.1, { soft: 1 }),
    tv: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#26262b') + g.line(-w / 2 + 0.03, 0, w / 2 - 0.03, 0, { soft: 1 }),
    tvstand: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#cdb99b') + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#dbc9ad', { hair: 1, soft: 1 });
      for (let i = 1; i < 3; i++) s += g.line(-w / 2 + (w * i) / 3, -h / 2 + 0.03, -w / 2 + (w * i) / 3, h / 2 - 0.03);
      return s;
    },
    fridge: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#dfe3e6', { rx: 0.03 }) + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, h - 0.1, '#eef1f3', { hair: 1, soft: 1 }) + g.line(-w / 2 + 0.12, h / 2 - 0.05, w / 2 - 0.12, h / 2 - 0.05, { hair: 0 }),
    stove: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#e4e6e9');
      const bx = w / 4, by = h / 5;
      [[-bx, -by], [bx, -by], [-bx, by], [bx, by]].forEach(([x, y], i) => { const r = i % 3 === 0 ? 0.095 : 0.07; s += g.circ(x, y - 0.02, r, '#5b5b62', { hair: 1 }) + g.circ(x, y - 0.02, r * 0.5, '#8d8d95', { hair: 1 }); });
      for (let i = 0; i < 4; i++) s += g.circ(-w / 2 + (w * (i + 0.5)) / 4, h / 2 - 0.05, 0.02, '#8d8d95', { hair: 1 });
      return s;
    },
    oven: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#e4e6e9') + g.rect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.18, '#f4f5f6', { hair: 1, soft: 1 }) +
      g.line(-w / 2 + 0.1, h / 2 - 0.06, w / 2 - 0.1, h / 2 - 0.06, { hair: 0 }) + g.circ(-0.12, h / 2 - 0.115, 0.018, '#8d8d95') + g.circ(0.12, h / 2 - 0.115, 0.018, '#8d8d95'),
    sink: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#e4e6e9');
      s += g.rect(-w / 2 + 0.05, -h / 2 + 0.1, (w - 0.15) / 2, h - 0.15, '#dcecf3', { rx: 0.04, hair: 1 });
      s += g.rect(0.025, -h / 2 + 0.1, (w - 0.15) / 2, h - 0.15, '#dcecf3', { rx: 0.04, hair: 1 });
      s += g.circ(0, -h / 2 + 0.05, 0.022, '#8d8d95', { hair: 1 }) + g.line(0, -h / 2 + 0.05, 0, -h / 2 + 0.1);
      return s;
    },
    island: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#e6e0d5') + g.rect(-w / 2 + 0.05, -h / 2 + 0.05, w - 0.1, h - 0.1, '#f0ebe1', { hair: 1, soft: 1 }),
    bar: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#d7c3a5') + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, h - 0.08, '#e2d2b8', { hair: 1, soft: 1 }),
    cabinets: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#e6e0d5');
      const k = Math.max(1, Math.round(w / 0.6));
      for (let i = 0; i < k; i++) {
        if (i) s += g.line(-w / 2 + (w * i) / k, -h / 2, -w / 2 + (w * i) / k, h / 2);
        s += g.circ(-w / 2 + (w * (i + 0.5)) / k, h / 2 - 0.05, 0.018, '#8d8d95', { hair: 1 });
      }
      return s;
    },
    wc: (w, h, g) => {
      const t = 0.2, bh = h - t;
      return g.rect(-w / 2, -h / 2, w, t, '#f1f3f4', { rx: 0.03 }) + g.ell(0, -h / 2 + t + bh / 2 - 0.01, w / 2 - 0.01, bh / 2, '#f7f8f9') + g.ell(0, -h / 2 + t + bh / 2 + 0.02, w / 2 - 0.09, bh / 2 - 0.1, '#e4ebee', { hair: 1 });
    },
    basin: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#eef1f3', { rx: 0.05 }) + g.ell(0, 0.03, w * 0.36, h * 0.32, '#dcecf3', { hair: 1 }) + g.circ(0, -h / 2 + 0.06, 0.02, '#8d8d95', { hair: 1 }) + g.circ(0, 0.03, 0.02, '#fff', { hair: 1 }),
    shower: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#e3f0f5') + g.line(-w / 2, -h / 2, w / 2, h / 2, { soft: 1 }) + g.line(w / 2, -h / 2, -w / 2, h / 2, { soft: 1 }) +
      g.circ(0, 0, 0.035, '#fff', { hair: 1 }) + g.circ(-w / 2 + 0.15, -h / 2 + 0.15, 0.05, '#fff', { hair: 1 }),
    tub: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#f1f3f4', { rx: 0.08 }) + g.rect(-w / 2 + 0.07, -h / 2 + 0.07, w - 0.14, h - 0.14, '#dcecf3', { rx: 0.26, hair: 1 }) +
      g.circ(-w / 2 + 0.24, 0, 0.035, '#fff', { hair: 1 }) + g.circ(w / 2 - 0.1, 0, 0.025, '#8d8d95', { hair: 1 }),
    plant: (w, h, g) => {
      let s = '';
      for (let i = 0; i < 7; i++) s += `<g transform="rotate(${i * 51.4})">${g.ell(0, -w * 0.27, w * 0.11, w * 0.24, '#b8d6b0', { hair: 1 })}</g>`;
      return s + g.circ(0, 0, w * 0.17, '#c9b8a6', { hair: 1 });
    },
    washer: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#eceef0', { rx: 0.03 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.03, w - 0.1, 0.07, '#dfe2e5', { hair: 1 }) +
      g.circ(0, 0.05, 0.21, '#d9e6ee', { hair: 1 }) + g.circ(0, 0.05, 0.15, '#c4d6e2', { hair: 1, soft: 1 }),
    dryer: (w, h, g) =>
      g.rect(-w / 2, -h / 2, w, h, '#eceef0', { rx: 0.03 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.03, w - 0.1, 0.07, '#dfe2e5', { hair: 1 }) +
      g.circ(0, 0.05, 0.21, '#e6e9ec', { hair: 1 }) + g.path(`M-0.1 0.05q0.05 -0.07 0.1 0t0.1 0`, null, { nf: 1, hair: 1, soft: 1 }),
    bookshelf: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#d9c9b0');
      for (let x = -w / 2 + 0.05; x < w / 2 - 0.04; x += 0.075) s += g.line(x, -h / 2 + 0.04, x, h / 2 - 0.04, { soft: 1 });
      return s;
    },
  };

  /* ---------- volúmenes 3D (partes: b = caja, c = cilindro, s = esfera) ---------- */
  const B = (x, y, w, d, z0, z1, c) => ({ t: 'b', x, y, w, d, z0, z1, c });
  const bed3 = (pill) => (w, h) => {
    const a = [B(0, 0, w, h, 0, 0.3, '#8b6f52'), B(0, 0.05, w - 0.08, h - 0.14, 0.3, 0.5, '#f1eee8'), B(0, -h / 2 + 0.04, w, 0.08, 0, 0.95, '#7a5f45'), B(0, h * 0.2, w - 0.06, h * 0.55, 0.5, 0.55, '#c5d3e0')];
    const pw = (w - 0.1) / pill - 0.08;
    for (let i = 0; i < pill; i++) a.push(B(-w / 2 + 0.09 + pw / 2 + i * (pw + 0.08) + 0.02, -h / 2 + 0.3, pw, 0.36, 0.5, 0.62, '#ffffff'));
    return a;
  };
  const sofa3 = (w, h) => [B(0, 0, w, h, 0, 0.4, '#8f98a3'), B(0, -h / 2 + 0.11, w, 0.22, 0.4, 0.88, '#7d8792'), B(-w / 2 + 0.08, 0.05, 0.16, h - 0.2, 0.4, 0.65, '#7d8792'), B(w / 2 - 0.08, 0.05, 0.16, h - 0.2, 0.4, 0.65, '#7d8792'), B(0, 0.08, w - 0.32, h - 0.3, 0.4, 0.52, '#b9c0c8')];
  const sofaL3 = (w, h) => [B(0, -h / 2 + 0.45, w, 0.9, 0, 0.4, '#8f98a3'), B(w / 2 - 0.45, 0.45, 0.9, h - 0.9, 0, 0.4, '#8f98a3'), B(0, -h / 2 + 0.11, w, 0.22, 0.4, 0.88, '#7d8792'), B(w / 2 - 0.11, 0, 0.22, h, 0.4, 0.88, '#7d8792'), B(-w / 2 + 0.08, -h / 2 + 0.55, 0.16, 0.6, 0.4, 0.65, '#7d8792')];
  const chair3 = (w, h) => [B(0, 0.03, w - 0.04, h - 0.1, 0.4, 0.45, '#e5d6bf'), B(0, -h / 2 + 0.03, w, 0.06, 0.45, 0.9, '#b8a084'), B(-w / 2 + 0.04, h / 2 - 0.05, 0.04, 0.04, 0, 0.4, '#8a7660'), B(w / 2 - 0.04, h / 2 - 0.05, 0.04, 0.04, 0, 0.4, '#8a7660'), B(-w / 2 + 0.04, -h / 2 + 0.05, 0.04, 0.04, 0, 0.4, '#8a7660'), B(w / 2 - 0.04, -h / 2 + 0.05, 0.04, 0.04, 0, 0.4, '#8a7660')];
  const table3 = (z) => (w, h) => [B(0, 0, w, h, z - 0.05, z, '#d7c3a5'), B(-w / 2 + 0.06, -h / 2 + 0.06, 0.06, 0.06, 0, z - 0.05, '#a68e6b'), B(w / 2 - 0.06, -h / 2 + 0.06, 0.06, 0.06, 0, z - 0.05, '#a68e6b'), B(-w / 2 + 0.06, h / 2 - 0.06, 0.06, 0.06, 0, z - 0.05, '#a68e6b'), B(w / 2 - 0.06, h / 2 - 0.06, 0.06, 0.06, 0, z - 0.05, '#a68e6b')];
  const plant3 = (w) => [{ t: 'c', x: 0, y: 0, r: w * 0.2, z0: 0, z1: 0.3, c: '#b59b83' }, { t: 's', x: 0, y: 0, r: w * 0.5, z0: 0.75, z1: 0, c: '#6fa564' }];
  const wc3 = (w, h) => [B(0, -h / 2 + 0.1, w, 0.2, 0, 0.8, '#f4f6f7'), B(0, 0.1, w * 0.9, h - 0.25, 0, 0.4, '#f4f6f7')];
  const tv3 = (w, h) => [B(0, 0, w, h, 0.55, 1.05, '#1c1c1e')];

  /* ---------- catálogo ---------- */
  const I = {
    bed_single: { name: 'Cama individual', w: 0.9, h: 1.9, z: 0.5, c: '#d9d2c6', draw: bed(1, '#c5d3e0'), parts: bed3(1) },
    bed_double: { name: 'Cama matrimonial', w: 1.4, h: 1.9, z: 0.5, c: '#d9d2c6', draw: bed(2, '#c5d3e0'), parts: bed3(2) },
    bed_queen: { name: 'Cama queen', w: 1.6, h: 2.0, z: 0.5, c: '#d9d2c6', draw: bed(2, '#c5d3e0'), parts: bed3(2) },
    bed_king: { name: 'Cama king', w: 2.0, h: 2.0, z: 0.5, c: '#d9d2c6', draw: bed(2, '#c5d3e0'), parts: bed3(2) },
    nightstand: { name: 'Buró', w: 0.45, h: 0.4, z: 0.5, c: '#d9c9b0', draw: D.nightstand },
    dresser: { name: 'Cómoda', w: 1.2, h: 0.5, z: 0.85, c: '#d9c9b0', draw: D.dresser },
    wardrobe: { name: 'Clóset', w: 1.8, h: 0.6, z: 2.1, c: '#e3d9cb', draw: wardrobe },
    desk: { name: 'Escritorio', w: 1.4, h: 0.7, z: 0.75, c: '#d9c9b0', draw: D.desk, parts: table3(0.75) },
    chair: { name: 'Silla', w: 0.45, h: 0.45, z: 0.9, c: '#e5d6bf', draw: chair, parts: chair3 },
    sofa2: { name: 'Sofá 2 plazas', w: 1.6, h: 0.9, z: 0.85, c: '#8f98a3', draw: sofa(2), parts: sofa3 },
    sofa3: { name: 'Sofá 3 plazas', w: 2.2, h: 0.9, z: 0.85, c: '#8f98a3', draw: sofa(3), parts: sofa3 },
    sofaL: { name: 'Sofá en L', w: 2.6, h: 1.6, z: 0.85, c: '#8f98a3', draw: sofaL, parts: sofaL3 },
    coffee: { name: 'Mesa de centro', w: 1.1, h: 0.6, z: 0.4, c: '#d7c3a5', draw: D.coffee, parts: table3(0.4) },
    tv: { name: 'TV', w: 1.2, h: 0.08, z: 1.05, c: '#1c1c1e', draw: D.tv, parts: tv3 },
    tvstand: { name: 'Mueble de TV', w: 1.6, h: 0.4, z: 0.5, c: '#cdb99b', draw: D.tvstand },
    armchair: { name: 'Sillón', w: 0.85, h: 0.85, z: 0.85, c: '#b3a08c', draw: D.armchair, parts: sofa3 },
    table4: { name: 'Mesa 4 personas', w: 1.2, h: 0.8, z: 0.75, c: '#d7c3a5', draw: table, parts: table3(0.75) },
    table6: { name: 'Mesa 6 personas', w: 1.6, h: 0.9, z: 0.75, c: '#d7c3a5', draw: table, parts: table3(0.75) },
    table8: { name: 'Mesa 8 personas', w: 2.2, h: 1.0, z: 0.75, c: '#d7c3a5', draw: table, parts: table3(0.75) },
    fridge: { name: 'Refrigerador', w: 0.7, h: 0.7, z: 1.8, c: '#dfe3e6', draw: D.fridge },
    stove: { name: 'Estufa', w: 0.6, h: 0.6, z: 0.9, c: '#e4e6e9', draw: D.stove },
    oven: { name: 'Horno', w: 0.6, h: 0.6, z: 0.9, c: '#e4e6e9', draw: D.oven },
    sink: { name: 'Tarja', w: 0.8, h: 0.5, z: 0.9, c: '#e4e6e9', draw: D.sink },
    island: { name: 'Isla', w: 1.8, h: 0.9, z: 0.9, c: '#e6e0d5', draw: D.island },
    bar: { name: 'Barra', w: 1.6, h: 0.4, z: 1.05, c: '#d7c3a5', draw: D.bar },
    cabinets: { name: 'Gabinetes', w: 1.2, h: 0.6, z: 0.9, c: '#e6e0d5', draw: D.cabinets },
    wc: { name: 'WC', w: 0.4, h: 0.7, z: 0.4, c: '#f4f6f7', draw: D.wc, parts: wc3 },
    basin: { name: 'Lavabo', w: 0.55, h: 0.45, z: 0.85, c: '#eef1f3', draw: D.basin },
    shower: { name: 'Regadera', w: 0.9, h: 0.9, z: 0.06, c: '#cfe4ec', draw: D.shower },
    tub: { name: 'Tina', w: 1.7, h: 0.75, z: 0.55, c: '#f1f3f4', draw: D.tub },
    plant: { name: 'Planta', w: 0.5, h: 0.5, z: 1.0, c: '#6fa564', draw: D.plant, parts: plant3 },
    washer: { name: 'Lavadora', w: 0.6, h: 0.6, z: 0.85, c: '#eceef0', draw: D.washer },
    dryer: { name: 'Secadora', w: 0.6, h: 0.6, z: 0.85, c: '#eceef0', draw: D.dryer },
    bookshelf: { name: 'Librero', w: 1.0, h: 0.3, z: 1.8, c: '#d9c9b0', draw: D.bookshelf },
  };


  /* ---------- arte de pared (se monta sobre la pared; el 3D dibuja la obra) ---------- */
  const artPlan = (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#2a2a2f') + g.line(-w / 2 + 0.05, 0, w / 2 - 0.05, 0, { soft: 1 });
  const ARTS = {
    art_abstract: ['Cuadro abstracto', 0.8, 0.6, 'abstract'],
    art_landscape: ['Paisaje panorámico', 1.4, 0.6, 'landscape'],
    art_botanic: ['Lámina botánica', 0.6, 0.8, 'botanic'],
    art_geo: ['Póster geométrico', 0.6, 0.8, 'geo'],
    art_waves: ['Arte ondas', 1.0, 0.7, 'waves'],
    art_triptych: ['Tríptico', 1.8, 0.6, 'abstract'],
    art_mirror: ['Espejo', 0.7, 1.1, 'mirror'],
  };
  const artIcon = (style, size) => {
    const bg = { abstract: '#f2ede4', landscape: '#f0b98a', botanic: '#efe9dc', geo: '#f4f0e8', waves: '#eadfce', mirror: '#dfe8ee' }[style] || '#eee';
    const sh = {
      abstract: '<circle cx="18" cy="20" r="9" fill="#c96f3b"/><rect x="24" y="16" width="16" height="22" rx="3" fill="#2f4858"/><circle cx="16" cy="38" r="6" fill="#e2b04a"/>',
      landscape: '<circle cx="34" cy="16" r="6" fill="#fff3c9"/><path d="M0 40L14 22l10 12 10-8 14 14v6H0z" fill="#5a4a7a"/><path d="M0 46l16-12 14 10 18-8v10H0z" fill="#2f3e64"/>',
      botanic: '<path d="M26 46V14" stroke="#4b6b45" stroke-width="2"/><ellipse cx="18" cy="26" rx="6" ry="12" transform="rotate(-25 18 26)" fill="#6f8f5f"/><ellipse cx="34" cy="22" rx="6" ry="13" transform="rotate(25 34 22)" fill="#4b6b45"/>',
      geo: '<circle cx="26" cy="20" r="11" fill="#1a1a1d"/><path d="M8 46a18 18 0 0 1 36 0z" fill="#c96f3b"/><rect x="8" y="12" width="6" height="14" fill="#1a1a1d"/>',
      waves: '<path d="M0 16q13-10 26 0t26 0M0 26q13-10 26 0t26 0M0 36q13-10 26 0t26 0" fill="none" stroke="#b5533c" stroke-width="3"/>',
      mirror: '<path d="M8 8L44 44" stroke="#fff" stroke-width="5" opacity=".7"/><path d="M22 6L48 32" stroke="#fff" stroke-width="2" opacity=".6"/>',
    }[style] || '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 52 52"><rect x="9" y="4" width="34" height="44" rx="2" fill="#2a2a2f"/><svg x="12" y="7" width="28" height="38" viewBox="0 0 52 52" preserveAspectRatio="none"><rect width="52" height="52" fill="${bg}"/>${sh}</svg></svg>`;
  };
  Object.keys(ARTS).forEach((k) => {
    const [name, w, ph, style] = ARTS[k];
    I[k] = { name, w, h: 0.04, z: 0, c: '#2a2a2f', draw: artPlan, wall: true, ph, z0: 1.5, style, iconFn: (size) => artIcon(style, size) };
  });

  const CATS = [
    { id: 'recamara', name: 'Recámara', items: ['bed_single', 'bed_double', 'bed_queen', 'bed_king', 'nightstand', 'dresser', 'wardrobe', 'desk', 'chair'] },
    { id: 'sala', name: 'Sala', items: ['sofa2', 'sofa3', 'sofaL', 'coffee', 'tv', 'tvstand', 'armchair'] },
    { id: 'comedor', name: 'Comedor', items: ['table4', 'table6', 'table8', 'chair'] },
    { id: 'cocina', name: 'Cocina', items: ['fridge', 'stove', 'oven', 'sink', 'island', 'bar', 'cabinets'] },
    { id: 'bano', name: 'Baño', items: ['wc', 'basin', 'shower', 'tub'] },
    { id: 'arte', name: 'Arte', items: ['art_abstract', 'art_landscape', 'art_botanic', 'art_geo', 'art_waves', 'art_triptych', 'art_mirror'] },
    { id: 'otros', name: 'Otros', items: ['plant', 'washer', 'dryer', 'wardrobe', 'bookshelf'] },
  ];

  FP.Furniture = {
    CATS, ITEMS: I, mk,
    /** Muebles de atrás hacia adelante: por `layer` si lo tienen; las alfombras y piezas planas van al fondo por defecto. */
    ordered(project) {
      const key = (f) => (f.layer !== undefined ? f.layer : (f.key.startsWith('rug') || (I[f.key] && I[f.key].z < 0.1) ? -1e6 : 1e6));
      return project.furniture.map((f, i) => [f, i]).sort((a, b) => key(a[0]) - key(b[0]) || a[1] - b[1]).map((x) => x[0]);
    },
    artIcon,
    def: (key) => I[key],
    create(key, x, y, rot) {
      const d = I[key];
      const o = { id: FP.util.uid(), key, name: d.name, x, y, w: d.w, h: d.h, rot: rot || 0 };
      if (key === 'tv') { o.inch = 55; o.w = 55 * 0.0254 * 0.8716; }
      if (d.wall) { o.ph = d.ph; o.z = d.z0; o.frame = 'black'; o.seed = Math.floor(Math.random() * 1e6); }
      return o;
    },
    /** Dibujo SVG de un mueble colocado. p = modo presentación; px = tamaño de un píxel en metros. */
    svg(it, p, px) {
      const d = I[it.key];
      if (!d) return '';
      return `<g transform="translate(${n(it.x)} ${n(it.y)}) rotate(${n(it.rot || 0)})${it.mirror ? ' scale(-1 1)' : ''}">${d.draw(it.w, it.h, mk(p, px))}</g>`;
    },
    /** Miniatura para el catálogo. */
    icon(key, size) {
      const d = I[key];
      if (d.iconFn) return d.iconFn(size);
      const m = Math.max(d.w, d.h) + 0.1, px = m / size;
      const vw = d.w + 0.1, vh = d.h + 0.1;
      const w = Math.round((vw / m) * size), h = Math.max(6, Math.round((vh / m) * size));
      return `<svg width="${w}" height="${h}" viewBox="${n(-vw / 2)} ${n(-vh / 2)} ${n(vw)} ${n(vh)}">${d.draw(d.w, d.h, mk(true, px))}</svg>`;
    },
    /** Partes 3D en coordenadas locales. */
    parts3(it) {
      const d = I[it.key];
      if (d.parts) return d.parts(it.w, it.h);
      return [B(0, 0, it.w, it.h, 0, d.z, d.c)];
    },
  };
})();

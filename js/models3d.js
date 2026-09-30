/* models3d.js — muebles 3D detallados, construidos con geometría procedural (bordes redondeados, materiales PBR).
   Cada builder recibe (ancho, fondo) en metros y devuelve un Group; el frente del mueble es +z. Requiere THREE y FP.Mats. */
(function () {
  'use strict';
  const FP = window.FP;
  let M; // materiales (FP.Mats)

  const geoCache = {};
  function rbox(w, h, d, r) {
    w = Math.max(w, 0.006); h = Math.max(h, 0.006); d = Math.max(d, 0.006);
    r = Math.min(r == null ? 0.01 : r, w / 2 - 0.002, d / 2 - 0.002);
    r = Math.max(r, 0.0005);
    const k = [w, h, d, r].map((v) => v.toFixed(3)).join('_');
    if (geoCache[k]) return geoCache[k];
    const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const bv = Math.min(0.004, h / 4);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(h - bv * 2, 0.002), bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.8, bevelSegments: 1, curveSegments: 3 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bv, 0);
    return (geoCache[k] = g);
  }
  const put = (g, m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const box = (g, w, h, d, mat, x, y, z, r) => put(g, new THREE.Mesh(rbox(w, h, d, r), mat), x, y, z);
  const cyl = (g, r, h, mat, x, y, z, r2, seg) => put(g, new THREE.Mesh(new THREE.CylinderGeometry(r2 == null ? r : r2, r, h, seg || 20), mat), x, y + h / 2, z);
  const sph = (g, r, mat, x, y, z, sx, sy, sz) => { const m = put(g, new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat), x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return m; };
  const legs = (g, w, d, h, mat, ins, r) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(g, r || 0.025, h, mat, a * (w / 2 - ins), 0, b * (d / 2 - ins), (r || 0.025) * 0.7));
  const G = () => new THREE.Group();
  const handle = (g, x, y, z, len, vertical) => {
    const m = cyl(g, 0.008, len, M.chrome, x, y - (vertical ? len / 2 : 0), z);
    if (!vertical) m.rotation.z = Math.PI / 2;
    return m;
  };

  const B = {};

  /* ---------- recámara ---------- */
  const bed = (pill, duv) => (w, d) => {
    const g = G();
    box(g, w, 0.26, d, M.walnut, 0, 0.1, 0, 0.03);
    legs(g, w, d, 0.1, M.walnut, 0.06);
    box(g, w + 0.02, 0.9, 0.1, M.headboard, 0, 0.1, -d / 2 + 0.05, 0.04);
    box(g, w - 0.08, 0.24, d - 0.14, M.bedding, 0, 0.36, 0.05, 0.06);
    box(g, w - 0.02, 0.07, d - 0.6, M[duv], 0, 0.6, 0.27, 0.04);
    box(g, w - 0.02, 0.09, 0.3, M.duvetFold, 0, 0.6, -d / 2 + 0.72, 0.05);
    const pw = (w - 0.2) / pill - 0.06;
    for (let i = 0; i < pill; i++) { const m = box(g, pw, 0.15, 0.42, M.pillow, -w / 2 + 0.1 + pw / 2 + 0.03 + i * (pw + 0.06), 0.6, -d / 2 + 0.34, 0.07); m.rotation.x = -0.14; }
    box(g, w - 0.02, 0.08, 0.34, M.accent, 0, 0.66, d / 2 - 0.3, 0.02);
    return g;
  };
  B.bed_single = bed(1, 'duvetA'); B.bed_double = bed(2, 'duvetA'); B.bed_queen = bed(2, 'duvetB'); B.bed_king = bed(2, 'duvetB');

  B.nightstand = (w, d) => {
    const g = G();
    legs(g, w, d, 0.16, M.walnut, 0.04, 0.02);
    box(g, w, 0.34, d, M.oak, 0, 0.16, 0, 0.02);
    box(g, w - 0.06, 0.13, 0.012, M.oakDark, 0, 0.36, d / 2 + 0.002, 0.005);
    cyl(g, 0.012, 0.03, M.brass, 0, 0.4, d / 2 + 0.012).rotation.x = Math.PI / 2;
    cyl(g, 0.06, 0.03, M.brass, 0, 0.5, -d / 4);
    cyl(g, 0.012, 0.2, M.brass, 0, 0.53, -d / 4);
    const sh = cyl(g, 0.13, 0.16, M.lampshade, 0, 0.7, -d / 4, 0.09);
    return g;
  };
  B.dresser = (w, d) => {
    const g = G();
    legs(g, w, d, 0.14, M.walnut, 0.06, 0.02);
    box(g, w, 0.72, d, M.oak, 0, 0.14, 0, 0.02);
    for (let i = 0; i < 3; i++) { box(g, w - 0.08, 0.2, 0.012, M.oakDark, 0, 0.2 + i * 0.23, d / 2 + 0.003, 0.005); handle(g, 0, 0.32 + i * 0.23, d / 2 + 0.03, 0.14, false); }
    cyl(g, 0.05, 0.16, M.ceramic, w * 0.3, 0.86, 0, 0.035); sph(g, 0.03, M.leaf1, w * 0.3, 1.08, 0, 1.5, 1.2, 1.5);
    return g;
  };
  B.wardrobe = (w, d) => {
    const g = G(), n = Math.max(2, Math.round(w / 0.6)), dw = w / n;
    box(g, w, 2.1, d, M.wardrobeBody, 0, 0, 0, 0.01);
    for (let i = 0; i < n; i++) {
      box(g, dw - 0.012, 2.0, 0.018, M.wardrobeDoor, -w / 2 + dw * (i + 0.5), 0.05, d / 2 + 0.005, 0.004);
      handle(g, -w / 2 + dw * (i + (i % 2 ? 0.12 : 0.88)), 1.2, d / 2 + 0.03, 0.35, true);
    }
    return g;
  };
  B.desk = (w, d) => {
    const g = G();
    box(g, w, 0.035, d, M.oak, 0, 0.72, 0, 0.01);
    box(g, 0.04, 0.72, d - 0.06, M.white, -w / 2 + 0.03, 0, 0, 0.005);
    box(g, 0.04, 0.72, d - 0.06, M.white, w / 2 - 0.03, 0, 0, 0.005);
    box(g, w - 0.1, 0.35, 0.02, M.white, 0, 0.36, -d / 2 + 0.05, 0.005);
    box(g, 0.5, 0.3, 0.02, M.blackPlastic, 0, 1.0, -d / 2 + 0.2, 0.01);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.26), M.tvScreen);
    scr.position.set(0, 1.15, -d / 2 + 0.217);
    g.add(scr);
    cyl(g, 0.012, 0.22, M.blackPlastic, 0, 0.75, -d / 2 + 0.2);
    box(g, 0.14, 0.008, 0.08, M.blackPlastic, 0, 0.755, -d / 2 + 0.2, 0.01);
    box(g, 0.38, 0.015, 0.13, M.blackPlastic, 0, 0.755, 0.05, 0.01);
    return g;
  };
  B.chair = (w, d) => {
    const g = G();
    box(g, w - 0.04, 0.05, d - 0.06, M.chairSeat, 0, 0.42, 0.02, 0.05);
    const b = box(g, w - 0.06, 0.42, 0.04, M.chairSeat, 0, 0.46, -d / 2 + 0.04, 0.03); b.rotation.x = -0.08;
    legs(g, w - 0.04, d - 0.04, 0.42, M.walnut, 0.03, 0.017);
    return g;
  };

  /* ---------- sala ---------- */
  const sofa = (seats) => (w, d) => {
    const g = G(), arm = 0.17, cw = (w - 2 * arm) / seats;
    legs(g, w, d, 0.09, M.walnut, 0.08, 0.02);
    box(g, w, 0.22, d, M.sofaBase, 0, 0.08, 0, 0.06);
    box(g, arm, 0.3, d, M.sofaBase, -w / 2 + arm / 2, 0.3, 0, 0.07);
    box(g, arm, 0.3, d, M.sofaBase, w / 2 - arm / 2, 0.3, 0, 0.07);
    box(g, w, 0.42, 0.2, M.sofaBase, 0, 0.3, -d / 2 + 0.1, 0.07);
    for (let i = 0; i < seats; i++) {
      const x = -w / 2 + arm + cw * (i + 0.5);
      box(g, cw - 0.02, 0.16, d - 0.24, M.cushion, x, 0.3, 0.07, 0.06);
      const b = box(g, cw - 0.04, 0.36, 0.17, M.cushion, x, 0.44, -d / 2 + 0.28, 0.07); b.rotation.x = -0.2;
    }
    [[-1, 0.3], [1, -0.3]].forEach(([s, ry]) => { const p = box(g, 0.4, 0.4, 0.12, M.accent, s * (w / 2 - arm - 0.25), 0.47, -d / 2 + 0.4, 0.06); p.rotation.set(-0.35, ry, 0); });
    return g;
  };
  B.sofa2 = sofa(2); B.sofa3 = sofa(3);
  B.sofaL = (w, d) => {
    const g = G(), cwid = 0.95;
    [[0, -d / 2 + cwid / 2, w, cwid], [w / 2 - cwid / 2, -d / 2 + cwid + (d - cwid) / 2, cwid, d - cwid]].forEach(([x, z, ww, dd]) => box(g, ww, 0.22, dd, M.sofaBase, x, 0.08, z, 0.06));
    legs(g, w, d, 0.09, M.walnut, 0.08, 0.02);
    box(g, w, 0.42, 0.2, M.sofaBase, 0, 0.3, -d / 2 + 0.1, 0.07);
    box(g, 0.2, 0.42, d - 0.2, M.sofaBase, w / 2 - 0.1, 0.3, 0.1, 0.07);
    box(g, 0.17, 0.3, cwid - 0.2, M.sofaBase, -w / 2 + 0.085, 0.3, -d / 2 + 0.2 + (cwid - 0.2) / 2, 0.07);
    const lw = w - cwid - 0.17, cwk = lw / 2 - 0.02;
    for (let i = 0; i < 2; i++) {
      const x = -w / 2 + 0.17 + lw * (i + 0.5) / 2;
      box(g, cwk, 0.16, cwid - 0.2, M.cushion, x, 0.3, -d / 2 + 0.2 + (cwid - 0.2) / 2, 0.06);
      const b = box(g, cwk, 0.36, 0.17, M.cushion, x, 0.44, -d / 2 + 0.29, 0.07); b.rotation.x = -0.2;
    }
    box(g, cwid - 0.24, 0.16, cwid - 0.2, M.cushion, w / 2 - cwid / 2 - 0.02, 0.3, -d / 2 + 0.2 + (cwid - 0.2) / 2, 0.06);
    box(g, cwid - 0.24, 0.16, d - cwid - 0.05, M.cushion, w / 2 - cwid / 2 - 0.02, 0.3, -d / 2 + cwid + (d - cwid) / 2 - 0.02, 0.06);
    const p = box(g, 0.42, 0.42, 0.12, M.accent, -w / 2 + 0.5, 0.48, -d / 2 + 0.4, 0.06); p.rotation.set(-0.35, 0.3, 0);
    box(g, 2.2, 0.012, 1.6, M.rug, -0.2, 0, d / 2 + 0.55, 0.02);
    return g;
  };
  B.armchair = (w, d) => {
    const g = G();
    legs(g, w, d, 0.16, M.walnut, 0.08, 0.02);
    box(g, w, 0.18, d, M.armBase, 0, 0.14, 0, 0.08);
    box(g, 0.15, 0.32, d - 0.05, M.armBase, -w / 2 + 0.075, 0.28, 0, 0.07);
    box(g, 0.15, 0.32, d - 0.05, M.armBase, w / 2 - 0.075, 0.28, 0, 0.07);
    const b = box(g, w - 0.1, 0.5, 0.2, M.armBase, 0, 0.3, -d / 2 + 0.12, 0.08); b.rotation.x = -0.12;
    box(g, w - 0.34, 0.14, d - 0.24, M.cushion2, 0, 0.32, 0.07, 0.06);
    return g;
  };
  B.coffee = (w, d) => {
    const g = G();
    box(g, w, 0.02, d, M.glass, 0, 0.4, 0, 0.03);
    box(g, w - 0.1, 0.03, d - 0.1, M.brass, 0, 0.36, 0, 0.02);
    legs(g, w, d, 0.36, M.brass, 0.06, 0.012);
    cyl(g, 0.11, 0.04, M.ceramic, -w * 0.2, 0.42, 0, 0.09); sph(g, 0.06, M.leaf2, -w * 0.2, 0.5, 0, 1.2, 0.8, 1.2);
    box(g, 0.28, 0.025, 0.2, M.accent, w * 0.2, 0.42, 0.02, 0.01).rotation.y = 0.3;
    box(g, w + 0.9, 0.012, d + 0.8, M.rug2, 0, 0, 0, 0.02);
    return g;
  };
  B.tv = (w, d) => {
    const g = G(), ph = w * 9 / 16, y0 = 0.58;
    box(g, w, ph + 0.03, 0.045, M.blackPlastic, 0, y0, 0, 0.012);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.05, ph - 0.005), M.tvScreen);
    scr.position.set(0, y0 + (ph + 0.03) / 2, 0.03);
    g.add(scr);
    box(g, Math.min(0.5, w * 0.28), 0.015, 0.16, M.blackPlastic, 0, y0 - 0.08, 0.0, 0.01);
    cyl(g, 0.02, 0.1, M.blackPlastic, 0, y0 - 0.14, -0.02);
    return g;
  };
  B.tvstand = (w, d) => {
    const g = G(), n = w > 1.4 ? 3 : 2, dw = (w - 0.06) / n;
    legs(g, w, d, 0.12, M.walnut, 0.05, 0.02);
    box(g, w, 0.4, d, M.oak, 0, 0.12, 0, 0.02);
    box(g, w + 0.02, 0.025, d + 0.02, M.oakDark, 0, 0.52, 0, 0.01);
    for (let i = 0; i < n; i++) { box(g, dw - 0.014, 0.32, 0.012, M.oakDark, -w / 2 + 0.03 + dw * (i + 0.5), 0.16, d / 2 + 0.003, 0.004); handle(g, -w / 2 + 0.03 + dw * (i + 0.5), 0.34, d / 2 + 0.03, 0.08, false); }
    return g;
  };

  /* ---------- comedor ---------- */
  const table = (w, d) => {
    const g = G();
    box(g, w, 0.045, d, M.tableWood, 0, 0.7, 0, 0.03);
    box(g, w - 0.14, 0.09, d - 0.14, M.walnut, 0, 0.61, 0, 0.02);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.065, 0.61, 0.065, M.walnut, a * (w / 2 - 0.09), 0, b * (d / 2 - 0.09), 0.01));
    cyl(g, 0.1, 0.05, M.ceramic, 0, 0.745, 0, 0.13);
    [[0, 0.95], [0.05, 0.85], [-0.05, 0.88]].forEach(([x, y], i) => { cyl(g, 0.004, y - 0.75, M.leaf1, x, 0.75, 0.02 * i); sph(g, 0.035, i === 1 ? M.accent : M.pillow, x, y + 0.02, 0.02 * i, 1, 0.9, 1); });
    return g;
  };
  B.table4 = table; B.table6 = table; B.table8 = table;

  /* ---------- cocina ---------- */
  B.fridge = (w, d) => {
    const g = G();
    box(g, w, 1.85, d, M.steel, 0, 0.02, 0, 0.02);
    box(g, w - 0.02, 0.008, 0.01, M.blackPlastic, 0, 1.2, d / 2 + 0.002, 0.002);
    handle(g, w / 2 - 0.08, 1.7, d / 2 + 0.04, 0.5, true);
    handle(g, w / 2 - 0.08, 1.05, d / 2 + 0.04, 0.6, true);
    box(g, w - 0.06, 0.012, 0.01, M.blackPlastic, 0, 0.05, d / 2 - 0.005, 0.002);
    return g;
  };
  B.stove = (w, d) => {
    const g = G();
    box(g, w, 0.86, d, M.steel, 0, 0.02, 0, 0.015);
    box(g, w - 0.02, 0.02, d - 0.02, M.blackGlass, 0, 0.88, 0, 0.01);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], i) => { cyl(g, i % 3 ? 0.06 : 0.08, 0.012, M.blackPlastic, a * w * 0.22, 0.9, b * d * 0.2 - 0.02); cyl(g, i % 3 ? 0.03 : 0.045, 0.014, M.steel, a * w * 0.22, 0.9, b * d * 0.2 - 0.02); });
    for (let i = 0; i < 4; i++) { const k = cyl(g, 0.017, 0.025, M.chrome, -w / 2 + w * (i + 0.5) / 4, 0.75, d / 2 + 0.01); k.rotation.x = Math.PI / 2; }
    box(g, w - 0.12, 0.42, 0.012, M.blackGlass, 0, 0.22, d / 2 + 0.004, 0.01);
    handle(g, 0, 0.66, d / 2 + 0.04, w - 0.16, false);
    return g;
  };
  B.oven = (w, d) => {
    const g = G();
    box(g, w, 0.9, d, M.steel, 0, 0, 0, 0.015);
    box(g, w - 0.1, 0.5, 0.012, M.blackGlass, 0, 0.14, d / 2 + 0.004, 0.01);
    handle(g, 0, 0.7, d / 2 + 0.04, w - 0.16, false);
    for (let i = 0; i < 3; i++) { const k = cyl(g, 0.017, 0.025, M.chrome, -0.15 + i * 0.15, 0.82, d / 2 + 0.01); k.rotation.x = Math.PI / 2; }
    return g;
  };
  B.sink = (w, d) => {
    const g = G();
    box(g, w, 0.85, d, M.cabinet, 0, 0, 0, 0.012);
    box(g, w + 0.02, 0.04, d + 0.02, M.marble, 0, 0.85, 0, 0.01);
    box(g, w * 0.36, 0.02, d * 0.6, M.steelDark, -w * 0.2, 0.885, 0.02, 0.03);
    box(g, w * 0.28, 0.02, d * 0.6, M.steelDark, w * 0.2, 0.885, 0.02, 0.03);
    cyl(g, 0.014, 0.28, M.chrome, 0, 0.89, -d / 2 + 0.06);
    const s = cyl(g, 0.01, 0.14, M.chrome, 0, 1.15, -d / 2 + 0.11); s.rotation.x = Math.PI / 2;
    box(g, w / 2 - 0.02, 0.7, 0.014, M.cabinetDoor, -w / 4, 0.08, d / 2 + 0.004, 0.005);
    box(g, w / 2 - 0.02, 0.7, 0.014, M.cabinetDoor, w / 4, 0.08, d / 2 + 0.004, 0.005);
    handle(g, -0.04, 0.6, d / 2 + 0.03, 0.14, true); handle(g, 0.04, 0.6, d / 2 + 0.03, 0.14, true);
    return g;
  };
  B.island = (w, d) => {
    const g = G();
    box(g, w - 0.1, 0.85, d - 0.14, M.cabinetIsland, 0, 0, -0.03, 0.015);
    box(g, w + 0.05, 0.04, d + 0.05, M.marble, 0, 0.85, 0, 0.02);
    const n = Math.max(2, Math.round(w / 0.6));
    for (let i = 0; i < n; i++) { box(g, (w - 0.14) / n - 0.012, 0.7, 0.012, M.cabinetDoorIsland, -w / 2 + 0.07 + (w - 0.14) * (i + 0.5) / n, 0.08, d / 2 - 0.09, 0.004); handle(g, -w / 2 + 0.07 + (w - 0.14) * (i + 0.5) / n, 0.65, d / 2 - 0.06, 0.12, true); }
    cyl(g, 0.16, 0.06, M.ceramic, w * 0.25, 0.89, 0, 0.11); [[0, 0], [0.05, 0.03], [-0.04, 0.05]].forEach(([x, z], i) => sph(g, 0.045, i === 0 ? M.accent : M.leaf2, w * 0.25 + x, 0.98, z));
    return g;
  };
  B.bar = (w, d) => {
    const g = G();
    box(g, w, 1.0, d - 0.05, M.oakDark, 0, 0, -0.02, 0.015);
    box(g, w + 0.04, 0.045, d + 0.06, M.marble, 0, 1.0, 0, 0.02);
    return g;
  };
  B.cabinets = (w, d) => {
    const g = G(), n = Math.max(1, Math.round(w / 0.6));
    box(g, w, 0.85, d, M.cabinet, 0, 0, 0, 0.012);
    box(g, w + 0.02, 0.04, d + 0.02, M.marble, 0, 0.85, 0, 0.01);
    box(g, w, 0.7, 0.32, M.cabinet, 0, 1.4, -d / 2 + 0.16, 0.012);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + w * (i + 0.5) / n;
      box(g, w / n - 0.014, 0.7, 0.014, M.cabinetDoor, x, 0.08, d / 2 + 0.004, 0.005);
      box(g, w / n - 0.014, 0.66, 0.014, M.cabinetDoor, x, 1.42, -d / 2 + 0.33, 0.005);
      handle(g, x + 0.08, 0.58, d / 2 + 0.03, 0.12, true); handle(g, x + 0.08, 1.5, -d / 2 + 0.36, 0.12, true);
    }
    return g;
  };

  /* ---------- baño ---------- */
  B.wc = (w, d) => {
    const g = G();
    box(g, w * 0.92, 0.78, 0.2, M.ceramic, 0, 0, -d / 2 + 0.1, 0.03);
    cyl(g, 0.02, 0.02, M.chrome, 0, 0.78, -d / 2 + 0.1);
    const bowl = sph(g, 0.5, M.ceramic, 0, 0.25, 0.05, (w * 0.5) / 0.5 * 0.95, 0.42 / 1, (d - 0.24) / 2 / 0.5 * 1.0);
    box(g, w * 0.7, 0.03, d - 0.3, M.seat, 0, 0.42, 0.06, 0.15);
    box(g, w * 0.66, 0.4, 0.06, M.ceramic, 0, 0, -0.02, 0.02);
    return g;
  };
  B.basin = (w, d) => {
    const g = G();
    box(g, w, 0.7, d, M.cabinetBath, 0, 0.12, 0, 0.012);
    legs(g, w, d, 0.12, M.chrome, 0.05, 0.012);
    box(g, w + 0.02, 0.03, d + 0.02, M.marble, 0, 0.82, 0, 0.012);
    sph(g, 0.5, M.ceramic, 0, 0.83, 0.02, (w * 0.34) / 0.5, 0.06 / 0.5, (d * 0.34) / 0.5);
    cyl(g, 0.012, 0.16, M.chrome, 0, 0.85, -d / 2 + 0.06);
    const s = cyl(g, 0.009, 0.08, M.chrome, 0, 0.99, -d / 2 + 0.09); s.rotation.x = Math.PI / 2;
    box(g, w * 0.7, 0.6, 0.008, M.mirror, 0, 1.05, -d / 2 - 0.005 + 0.004, 0.01);
    return g;
  };
  B.shower = (w, d) => {
    const g = G();
    box(g, w, 0.06, d, M.ceramic, 0, 0, 0, 0.02);
    cyl(g, 0.04, 0.005, M.chrome, 0, 0.06, 0);
    box(g, w, 2.0, 0.012, M.glass, 0, 0.06, d / 2 - 0.01, 0.002);
    box(g, 0.012, 2.0, d, M.glass, w / 2 - 0.006, 0.06, 0, 0.002);
    box(g, w, 0.03, 0.03, M.chrome, 0, 2.06, d / 2 - 0.01, 0.005);
    box(g, 0.03, 0.03, d, M.chrome, w / 2 - 0.006, 2.06, 0, 0.005);
    cyl(g, 0.012, 0.6, M.chrome, -w / 2 + 0.1, 1.6, -d / 2 + 0.05);
    const a = cyl(g, 0.01, 0.25, M.chrome, -w / 2 + 0.2, 2.16, -d / 2 + 0.1); a.rotation.z = Math.PI / 2;
    cyl(g, 0.09, 0.02, M.chrome, -w / 2 + 0.3, 2.14, -d / 2 + 0.1, 0.09);
    return g;
  };
  B.tub = (w, d) => {
    const g = G();
    box(g, w, 0.56, d, M.ceramic, 0, 0, 0, 0.12);
    box(g, w - 0.16, 0.02, d - 0.16, M.ceramicIn, 0, 0.545, 0, 0.25);
    cyl(g, 0.014, 0.16, M.chrome, w / 2 - 0.12, 0.56, 0);
    const s = cyl(g, 0.01, 0.1, M.chrome, w / 2 - 0.16, 0.7, 0); s.rotation.z = Math.PI / 2;
    return g;
  };

  /* ---------- otros ---------- */
  B.plant = (w) => {
    const g = G();
    cyl(g, w * 0.2, 0.32, M.terracotta, 0, 0, 0, w * 0.27);
    cyl(g, w * 0.22, 0.02, M.soil, 0, 0.32, 0, w * 0.22);
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, r = 0.05 + (i % 5) * 0.045, h = 0.55 + (i * 37 % 10) * 0.07;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const l = sph(g, 0.14, i % 3 ? M.leaf1 : M.leaf2, x, h, z, 0.6, 1.5, 0.28);
      l.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5);
      const s = cyl(g, 0.006, h - 0.3, M.leaf2, x * 0.5, 0.32, z * 0.5);
    }
    return g;
  };
  const washer = (dry) => (w, d) => {
    const g = G();
    box(g, w, 0.85, d, M.whiteAppl, 0, 0, 0, 0.02);
    box(g, w - 0.04, 0.09, 0.012, M.blackGlass, 0, 0.75, d / 2 + 0.004, 0.005);
    const ring = cyl(g, 0.22, 0.03, M.chrome, 0, 0.2, d / 2 + 0.005, 0.22); ring.rotation.x = Math.PI / 2; ring.position.y = 0.38;
    const gl = cyl(g, 0.18, 0.04, M.glassDark, 0, 0.2, d / 2 + 0.02, 0.18); gl.rotation.x = Math.PI / 2; gl.position.y = 0.38;
    cyl(g, 0.02, 0.02, M.chrome, w / 2 - 0.1, 0.7, d / 2 + 0.01).rotation.x = Math.PI / 2;
    if (dry) box(g, 0.2, 0.012, 0.01, M.blackGlass, -w / 2 + 0.16, 0.775, d / 2 + 0.012, 0.002);
    return g;
  };
  B.washer = washer(false); B.dryer = washer(true);
  B.bookshelf = (w, d) => {
    const g = G(), H = 1.85, rows = 5;
    box(g, 0.03, H, d, M.oak, -w / 2 + 0.015, 0, 0, 0.004); box(g, 0.03, H, d, M.oak, w / 2 - 0.015, 0, 0, 0.004);
    box(g, w, H, 0.01, M.oakDark, 0, 0, -d / 2 + 0.005, 0.002);
    for (let r = 0; r <= rows; r++) box(g, w - 0.06, 0.025, d, M.oak, 0, r * ((H - 0.025) / rows), 0, 0.004);
    const cols = ['#b5533c', '#3c6e8f', '#d0a24a', '#5d7a55', '#3b3b45', '#c98c9a', '#8a6fa8'];
    for (let r = 0; r < rows; r++) {
      let x = -w / 2 + 0.05;
      while (x < w / 2 - 0.12) {
        const t = 0.02 + ((x * 173 + r * 7) % 1 + 1) % 1 * 0.03, h = 0.2 + ((r * 31 + x * 91) % 1 + 1) % 1 * 0.1;
        if ((x * 100 | 0) % 7 === 0) { x += 0.12; continue; }
        box(g, t, Math.min(h, (H - 0.025) / rows - 0.06), d - 0.06, M.book(cols[(Math.abs(x * 100 | 0) + r) % cols.length]), x + t / 2, r * ((H - 0.025) / rows) + 0.025, 0, 0.002);
        x += t + 0.003;
      }
    }
    return g;
  };

  /* ---------- arte de pared ---------- */
  const FRAMES = { black: 'frameBlack', oak: 'frameOak', white: 'frameWhite', gold: 'brass' };
  const artPiece = (g, w, ph, zc, x, style, seed, frame) => {
    const fm = M[FRAMES[frame] || 'frameBlack'], ft = 0.032;
    box(g, w, ft, 0.04, fm, x, zc + ph / 2 - ft, 0, 0.004);
    box(g, w, ft, 0.04, fm, x, zc - ph / 2, 0, 0.004);
    box(g, ft, ph - ft * 2, 0.04, fm, x - w / 2 + ft / 2, zc - ph / 2 + ft, 0, 0.004);
    box(g, ft, ph - ft * 2, 0.04, fm, x + w / 2 - ft / 2, zc - ph / 2 + ft, 0, 0.004);
    if (style === 'mirror') {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w - ft * 2, ph - ft * 2), M.mirror);
      m.position.set(x, zc, 0.014); g.add(m);
      return;
    }
    const mat = w > 0.5 ? 0.05 : 0.03;
    box(g, w - ft * 2, ph - ft * 2, 0.004, M.paper, x, zc - ph / 2 + ft, 0.002, 0.001);
    const aw = w - ft * 2 - mat * 2, ah = ph - ft * 2 - mat * 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), M.artMat(style, seed, aw / ah));
    m.position.set(x, zc, 0.0125); m.receiveShadow = true; g.add(m);
  };
  const artB = (style) => (w, d, it) => {
    const g = G(), ph = it.ph || 0.6, zc = it.z || 1.5;
    if (it.key === 'art_triptych') {
      const pw = (w - 0.1) / 3;
      for (let i = 0; i < 3; i++) artPiece(g, pw, ph, zc, -w / 2 + pw / 2 + i * (pw + 0.05), style, (it.seed || 1) + i * 77, it.frame);
    } else artPiece(g, w, ph, zc, 0, style, it.seed || 1, it.frame);
    return g;
  };
  B.art_abstract = artB('abstract'); B.art_landscape = artB('landscape'); B.art_botanic = artB('botanic');
  B.art_geo = artB('geo'); B.art_waves = artB('waves'); B.art_triptych = artB('abstract'); B.art_mirror = artB('mirror');

  FP.Models = {
    B, helpers: { box, cyl, sph, legs, handle, G, put, rbox, M: () => M },
    init(mats) { M = mats; },
    /** Devuelve un Group listo para la escena, o null si no hay builder. */
    build(it) {
      const f = B[it.key];
      if (!f) return null;
      return f(it.w, it.h, it);
    },
  };
})();

/* models3d3.js — modelos 3D de la tercera tanda de muebles: paredes de madera alta, escritorio doble, accesorios. */
(function () {
  'use strict';
  const FP = window.FP, H = FP.Models.helpers, B = FP.Models.B;
  const { box, cyl, sph, legs, handle, G } = H;
  const M = () => H.M();
  const cache = {};
  const mat = (hex, o) => cache[hex + (o ? JSON.stringify(o) : '')] || (cache[hex + (o ? JSON.stringify(o) : '')] = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.6, metalness: 0 }, o || {})));
  const led = () => cache.__led || (cache.__led = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }));
  /** Panel de madera con textura de listones (se ve como el revestimiento de pared). */
  const slat = (g, w, h, x, y, z) => { const p = M().panelMesh(w, h, 'wood', '#ffffff'); p.position.set(x, y, z); p.castShadow = true; p.receiveShadow = true; g.add(p); return p; };
  const shelfDecor = (g, m, x, y, z, i) => {
    const cols = ['#b5533c', '#3c6e8f', '#d0a24a', '#5d7a55', '#3b3b45'];
    if (i % 3 === 0) for (let k = 0; k < 4; k++) box(g, 0.035, 0.2 + (k % 2) * 0.04, 0.16, m.book(cols[(i + k) % 5]), x + k * 0.04, y, z, 0.002);
    else if (i % 3 === 1) { cyl(g, 0.06, 0.12, m.ceramic, x, y, z, 0.045); sph(g, 0.05, m.leaf2, x, y + 0.2, z, 1.2, 1.4, 1.2); }
    else box(g, 0.28, 0.03, 0.2, m.accent, x, y, z, 0.01);
  };

  /* ---------- centro de entretenimiento con pared de madera alta ---------- */
  B.tvwall = (w, d) => {
    const g = G(), m = M(), depth = d;
    box(g, w, 2.6, 0.05, m.walnut, 0, 0, -depth / 2 + 0.025, 0.004);           // respaldo
    slat(g, w - 0.02, 2.6, 0, 1.3, -depth / 2 + 0.056);                          // listones de madera
    box(g, 0.06, 2.6, depth, m.oakDark, -w / 2 + 0.03, 0, 0, 0.004);            // laterales
    box(g, 0.06, 2.6, depth, m.oakDark, w / 2 - 0.03, 0, 0, 0.004);
    box(g, w, 0.05, depth, m.oakDark, 0, 2.55, 0, 0.004);                       // techo del mueble
    legs(g, w - 0.2, depth - 0.1, 0.1, m.blackPlastic, 0.05, 0.02);
    box(g, w - 0.12, 0.42, depth - 0.06, m.oak, 0, 0.1, 0.03, 0.012);           // credenza baja
    const n = Math.max(3, Math.round(w / 0.55));
    for (let i = 0; i < n; i++) { box(g, (w - 0.12) / n - 0.012, 0.36, 0.012, m.oakDark, -w / 2 + 0.06 + ((w - 0.12) * (i + 0.5)) / n, 0.13, depth / 2 - 0.02, 0.004); handle(g, -w / 2 + 0.06 + ((w - 0.12) * (i + 0.5)) / n, 0.42, depth / 2 + 0.005, 0.08, false); }
    box(g, w - 0.12, 0.03, depth - 0.06, m.oakDark, 0, 0.52, 0.03, 0.006);       // cubierta
    // repisas flotantes a los lados de la TV (la TV va al centro, sobre la credenza)
    [-1, 1].forEach((s, si) => [1.35, 1.75, 2.15].forEach((y, yi) => {
      const sx = s * (w / 2 - 0.55);
      box(g, 0.85, 0.035, 0.24, m.oak, sx, y, -depth / 2 + 0.2, 0.006);
      box(g, 0.85, 0.008, 0.012, led(), sx, y - 0.01, -depth / 2 + 0.32, 0.001);   // tira LED cálida
      shelfDecor(g, m, sx - 0.25 + (yi % 2) * 0.2, y + 0.035, -depth / 2 + 0.2, si + yi);
    }));
    box(g, w - 0.3, 0.01, 0.012, led(), 0, 2.5, -depth / 2 + 0.1, 0.001);        // LED superior
    return g;
  };

  /* ---------- librero de madera de piso a techo ---------- */
  B.wallunit = (w, d) => {
    const g = G(), m = M(), rows = 7, colW = 0.6, cols = Math.max(2, Math.round(w / colW));
    box(g, w, 2.6, 0.03, m.oakDark, 0, 0, -d / 2 + 0.015, 0.002);
    for (let i = 0; i <= cols; i++) box(g, 0.03, 2.6, d, m.oak, -w / 2 + (w * i) / cols - (i === cols ? 0.03 : 0) + (i === cols ? 0 : 0), 0, 0, 0.003).position.x = -w / 2 + 0.015 + ((w - 0.03) * i) / cols;
    for (let r = 0; r <= rows; r++) box(g, w, 0.03, d, m.oak, 0, r * ((2.6 - 0.03) / rows), 0, 0.003);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = -w / 2 + 0.05 + ((w - 0.1) * (c + 0.5)) / cols, y = 0.03 + r * ((2.6 - 0.03) / rows);
      if (r < 2) { box(g, (w - 0.1) / cols - 0.03, (2.57 / rows) - 0.05, 0.015, m.oakDark, x, y + 0.01, d / 2 - 0.02, 0.004); handle(g, x + 0.1, y + 0.3, d / 2 + 0.01, 0.1, true); continue; }
      shelfDecor(g, m, x - 0.1, y, 0, r * 5 + c);
      if ((r + c) % 2 === 0) shelfDecor(g, m, x + 0.12, y, 0, r * 5 + c + 1);
    }
    return g;
  };

  /* ---------- escritorio doble con repisas, 2 lugares ---------- */
  B.desk2 = (w, d) => {
    const g = G(), m = M(), sh = 0.3;
    box(g, w, 0.04, d, m.oak, 0, 0.72, 0, 0.012);
    box(g, 0.04, 0.72, d - 0.06, m.white, -w / 2 + 0.03, 0, 0, 0.005); box(g, 0.04, 0.72, d - 0.06, m.white, w / 2 - 0.03, 0, 0, 0.005);
    box(g, 0.45, 0.68, d - 0.08, m.white, 0, 0.04, 0, 0.005);                                   // cajonera central
    for (let i = 0; i < 3; i++) { box(g, 0.4, 0.2, 0.012, m.oakDark, 0, 0.1 + i * 0.22, d / 2 - 0.045, 0.004); handle(g, 0, 0.22 + i * 0.22, d / 2 - 0.02, 0.1, false); }
    // repisas superiores en el fondo (hutch)
    box(g, w, 1.15, 0.03, m.oakDark, 0, 0.9, -d / 2 + 0.015, 0.003);
    for (let i = 0; i <= 4; i++) box(g, 0.03, 1.15, sh, m.oak && m.oak, 0, 0.9, 0, 0.003).position.set(-w / 2 + 0.015 + ((w - 0.03) * i) / 4, 0.9 + 0.575, -d / 2 + sh / 2);
    [0.9, 1.35, 1.75, 2.05].forEach((y, r) => { box(g, w, 0.03, sh, m.oak, 0, y, -d / 2 + sh / 2, 0.003); if (r < 3) for (let c = 0; c < 4; c++) shelfDecor(g, m, -w / 2 + 0.2 + c * (w / 4), y + 0.03, -d / 2 + sh / 2, r + c); });
    // dos puestos de trabajo: monitor + teclado + lámpara
    [-1, 1].forEach((s) => {
      const x = s * (w / 4 + 0.12);
      box(g, 0.58, 0.34, 0.02, m.blackPlastic, x, 0.98, -d / 2 + 0.36, 0.01);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.3), m.tvScreen); scr.position.set(x, 1.15, -d / 2 + 0.372); g.add(scr);
      cyl(g, 0.012, 0.22, m.blackPlastic, x, 0.76, -d / 2 + 0.36); box(g, 0.16, 0.008, 0.1, m.blackPlastic, x, 0.76, -d / 2 + 0.36, 0.01);
      box(g, 0.4, 0.015, 0.14, m.blackPlastic, x, 0.76, -d / 2 + 0.6, 0.01);
      cyl(g, 0.06, 0.02, m.brass, x + s * 0.4, 0.76, -d / 2 + 0.4, 0.06); cyl(g, 0.01, 0.35, m.brass, x + s * 0.4, 0.78, -d / 2 + 0.4);
    });
    return g;
  };

  /* ---------- cama con pared de madera alta ---------- */
  B.bed_wood = (w, d) => {
    const g = G(), m = M(), bw = 1.9;
    box(g, w, 2.4, 0.06, m.walnut, 0, 0, -d / 2 + 0.03, 0.004);
    slat(g, w - 0.02, 2.4, 0, 1.2, -d / 2 + 0.065);
    box(g, bw + 0.1, 0.9, 0.1, m.headboard, 0, 0.1, -d / 2 + 0.11, 0.04);                  // cabecera tapizada
    box(g, bw, 0.28, d - 0.2, m.walnut, 0, 0.1, 0.05, 0.03);
    box(g, bw - 0.08, 0.24, d - 0.32, m.bedding, 0, 0.38, 0.06, 0.06);
    box(g, bw - 0.02, 0.07, d - 0.75, m.duvetB, 0, 0.62, 0.34, 0.04);
    box(g, bw - 0.02, 0.09, 0.3, m.duvetFold, 0, 0.62, -d / 2 + 0.85, 0.05);
    [-1, 1].forEach((s) => { const p = box(g, bw / 2 - 0.15, 0.15, 0.42, m.pillow, s * (bw / 4 + 0.02), 0.62, -d / 2 + 0.48, 0.07); p.rotation.x = -0.14; });
    box(g, bw - 0.02, 0.08, 0.34, m.accent, 0, 0.68, d / 2 - 0.3, 0.02);
    [-1, 1].forEach((s) => {                                                                // burós flotantes con lámpara
      const x = s * (bw / 2 + 0.3);
      box(g, 0.5, 0.2, 0.4, m.oak, x, 0.42, -d / 2 + 0.28, 0.015);
      box(g, 0.44, 0.13, 0.012, m.oakDark, x, 0.45, -d / 2 + 0.48, 0.004);
      cyl(g, 0.06, 0.03, m.brass, x, 0.62, -d / 2 + 0.2); cyl(g, 0.012, 0.2, m.brass, x, 0.65, -d / 2 + 0.2); cyl(g, 0.13, 0.16, m.lampshade, x, 0.83, -d / 2 + 0.2, 0.09);
      box(g, 0.02, 0.6, 0.012, led(), x + s * 0.32, 0.9, -d / 2 + 0.075, 0.001);
    });
    box(g, w - 0.3, 0.012, 0.012, led(), 0, 0.95, -d / 2 + 0.075, 0.001);                    // LED tras la cabecera
    return g;
  };

  /* ---------- clóset de piso a techo ---------- */
  B.closet_full = (w, d) => {
    const g = G(), m = M(), n = Math.max(2, Math.round(w / 0.6)), dw = w / n;
    box(g, w, 2.6, d, m.wardrobeBody, 0, 0, 0, 0.008);
    for (let i = 0; i < n; i++) { box(g, dw - 0.012, 2.5, 0.02, m.doorWoodTex, -w / 2 + dw * (i + 0.5), 0.05, d / 2 + 0.005, 0.004); handle(g, -w / 2 + dw * (i + (i % 2 ? 0.12 : 0.88)), 1.2, d / 2 + 0.03, 0.4, true); }
    return g;
  };

  /* ---------- entrada ---------- */
  B.shoebench = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.05, d, m.oak, 0, 0.38, 0, 0.012); box(g, w - 0.04, 0.06, d - 0.02, m.cushion2, 0, 0.43, 0, 0.03);
    box(g, 0.04, 0.38, d, m.walnut, -w / 2 + 0.02, 0, 0, 0.004); box(g, 0.04, 0.38, d, m.walnut, w / 2 - 0.02, 0, 0, 0.004);
    [0.05, 0.22].forEach((y) => box(g, w - 0.08, 0.02, d - 0.04, m.oakDark, 0, y, 0, 0.003));
    [-0.3, 0, 0.3].forEach((x, i) => box(g, 0.24, 0.08, 0.1, m.book(['#3b3b45', '#b5533c', '#3c6e8f'][i]), x, 0.24, 0, 0.03));
    return g;
  };
  B.coatrack = () => {
    const g = G(), m = M();
    cyl(g, 0.16, 0.03, m.walnut, 0, 0, 0, 0.18); cyl(g, 0.02, 1.75, m.walnut, 0, 0.03, 0);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, h = box(g, 0.2, 0.025, 0.025, m.brass, Math.cos(a) * 0.1, 1.6 - (i % 2) * 0.12, Math.sin(a) * 0.1, 0.008); h.rotation.y = -a; sph(g, 0.025, m.brass, Math.cos(a) * 0.2, 1.62 - (i % 2) * 0.12, Math.sin(a) * 0.2); }
    box(g, 0.34, 0.5, 0.06, mat('#5d6b7d', { roughness: 0.95 }), 0.1, 1.05, 0.15, 0.03).rotation.set(0, 0.5, 0.05);
    return g;
  };

  /* ---------- luz y clima (colgados del techo) ---------- */
  B.pendant = (w) => {
    const g = G(), m = M(), top = 2.6;
    cyl(g, 0.012, 0.9, m.blackPlastic, 0, top - 0.9, 0);
    cyl(g, 0.06, 0.03, m.blackPlastic, 0, top - 0.03, 0);
    const sh = cyl(g, w / 2, 0.28, m.lampshade, 0, top - 1.2, 0, 0.08); sh.material = mat('#f3e3c3', { roughness: 0.8, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0.9, side: THREE.DoubleSide });
    sph(g, 0.06, mat('#fff4d6', { emissive: new THREE.Color('#fff1d2'), emissiveIntensity: 1.6 }), 0, top - 1.14, 0);
    return g;
  };
  B.fan = (w) => {
    const g = G(), m = M(), top = 2.6;
    cyl(g, 0.012, 0.3, m.blackPlastic, 0, top - 0.3, 0);
    cyl(g, 0.09, 0.09, m.blackPlastic, 0, top - 0.4, 0, 0.09);
    for (let i = 0; i < 4; i++) { const b = box(g, w / 2 - 0.08, 0.012, 0.16, m.oak, 0, top - 0.37, 0, 0.03); b.geometry = b.geometry.clone(); b.geometry.translate(w / 4 + 0.05, 0, 0); b.rotation.y = (i * Math.PI) / 2; b.rotation.z = 0.05; }
    cyl(g, 0.07, 0.04, m.lampshade, 0, top - 0.46, 0, 0.06);
    return g;
  };
  B.art_minisplit = (w, d, it) => {
    const g = G(), m = M(), zc = it.z || 2.15, ph = it.ph || 0.3;
    box(g, w, ph, 0.2, m.whiteAppl, 0, zc - ph / 2, 0.08, 0.05);
    box(g, w - 0.1, 0.03, 0.02, mat('#c9ced2'), 0, zc - ph + 0.05, 0.18, 0.005);
    box(g, 0.05, 0.015, 0.005, mat('#5aa9ff', { emissive: new THREE.Color('#5aa9ff'), emissiveIntensity: 1 }), w / 2 - 0.1, zc - ph / 2 + 0.03, 0.182, 0.002);
    return g;
  };

  /* ---------- más accesorios ---------- */
  B.rocker = (w, d) => {
    const g = G(), m = M();
    [-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.014, 8, 24, Math.PI * 0.55), m.walnut); r.rotation.set(0, Math.PI / 2, Math.PI * 1.22); r.position.set(s * (w / 2 - 0.05), 0.42, 0); r.castShadow = true; g.add(r); });
    box(g, w - 0.08, 0.08, d - 0.25, m.armBase, 0, 0.38, 0.03, 0.05);
    const b = box(g, w - 0.12, 0.55, 0.08, m.armBase, 0, 0.42, -d / 2 + 0.16, 0.05); b.rotation.x = -0.25;
    box(g, 0.05, 0.3, d - 0.3, m.walnut, -w / 2 + 0.08, 0.4, 0, 0.01); box(g, 0.05, 0.3, d - 0.3, m.walnut, w / 2 - 0.08, 0.4, 0, 0.01);
    return g;
  };
  B.barcart = (w, d) => {
    const g = G(), m = M();
    [0.15, 0.55].forEach((y) => box(g, w, 0.025, d, m.glass, 0, y, 0, 0.005));
    box(g, w + 0.02, 0.02, d + 0.02, m.brass, 0, 0.86, 0, 0.005);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { cyl(g, 0.012, 0.86, m.brass, a * (w / 2 - 0.02), 0.06, b * (d / 2 - 0.02)); cyl(g, 0.035, 0.03, m.blackPlastic, a * (w / 2 - 0.02), 0, b * (d / 2 - 0.02)); });
    [['#3c6e8f', 0.1], ['#b5533c', 0.03], ['#5d7a55', -0.06]].forEach(([c, x], i) => cyl(g, 0.03, 0.26, mat(c, { roughness: 0.2, transparent: true, opacity: 0.85 }), x, 0.58, -0.1 + i * 0.12, 0.03));
    [0.1, 0.02].forEach((x) => cyl(g, 0.03, 0.09, m.glass, x, 0.17, 0.05, 0.02));
    return g;
  };
  B.aquarium = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.75, d, m.oakDark, 0, 0, 0, 0.012);
    for (let i = 0; i < 3; i++) { box(g, w / 3 - 0.02, 0.62, 0.012, m.oak, -w / 3 + (w * i) / 3, 0.06, d / 2 + 0.003, 0.004); handle(g, -w / 3 + (w * i) / 3 + 0.08, 0.5, d / 2 + 0.02, 0.08, true); }
    box(g, w - 0.04, 0.4, d - 0.08, mat('#7fc4de', { roughness: 0.1, transparent: true, opacity: 0.55, emissive: new THREE.Color('#2a6f8f'), emissiveIntensity: 0.5 }), 0, 0.78, 0, 0.01);
    box(g, w - 0.02, 0.025, d - 0.05, m.blackPlastic, 0, 1.18, 0, 0.005);
    box(g, w - 0.08, 0.05, d - 0.14, mat('#d8c7a8', { roughness: 1 }), 0, 0.78, 0, 0.02);
    [[-0.3, 0.1], [0.05, 0.12], [0.35, 0.09]].forEach(([x, r], i) => sph(g, r, mat(['#7d7f83', '#6b6e73', '#8a8d92'][i], { roughness: 0.9 }), x, 0.86, -0.02, 1, 0.7, 1));
    [[-0.15, 0.04, 0.02], [0.2, 0.05, -0.02]].forEach(([x, y, z], i) => sph(g, 0.03, mat(i ? '#ffd04d' : '#ff8a3d', { emissive: new THREE.Color(i ? '#ffd04d' : '#ff8a3d'), emissiveIntensity: 0.4 }), x, 1.0 + y, z, 1.6, 1, 0.6));
    return g;
  };
  B.daybed = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.18, d, m.walnut, 0, 0.12, 0, 0.03); legs(g, w, d, 0.12, m.walnut, 0.06, 0.02);
    box(g, w - 0.06, 0.16, d - 0.06, m.cushion2, 0, 0.3, 0, 0.06);
    cyl(g, 0.11, w - 0.1, m.cushion2, 0, 0, 0, 0.11, 20).rotation.z = Math.PI / 2;
    const bol = cyl(g, 0.1, w - 0.12, m.accent, 0, 0, 0, 0.1, 20); bol.rotation.z = Math.PI / 2; bol.position.set(0, 0.5, -d / 2 + 0.12);
    box(g, w - 0.1, 0.5, 0.06, m.cushion, 0, 0.3, -d / 2 + 0.05, 0.05);
    return g;
  };
  B.trash = (w) => { const g = G(), m = M(); cyl(g, w / 2, 0.6, m.steel, 0, 0, 0, w / 2 - 0.02, 24); cyl(g, w / 2 + 0.005, 0.03, m.steelDark, 0, 0.6, 0, w / 2, 24); return g; };
  B.hamper = (w) => {
    const g = G(), m = M(), wv = mat('#d9c9b0', { roughness: 1 });
    cyl(g, w / 2, 0.58, wv, 0, 0, 0, w / 2 - 0.03, 24);
    for (let i = 0; i < 6; i++) cyl(g, w / 2 + 0.004, 0.012, m.walnut, 0, 0.08 + i * 0.1, 0, w / 2 - 0.018 + (i > 2 ? 0.02 : 0), 24);
    cyl(g, w / 2 + 0.01, 0.03, m.walnut, 0, 0.58, 0, w / 2, 24);
    return g;
  };
})();

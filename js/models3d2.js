/* models3d2.js — modelos 3D adicionales: muebles, plantas y decoración (usa los helpers de models3d.js). */
(function () {
  'use strict';
  const FP = window.FP, H = FP.Models.helpers, B = FP.Models.B;
  const { box, cyl, sph, legs, handle, G } = H;
  const M = () => H.M();
  const cache = {};
  const mat = (hex, o) => cache[hex + (o ? JSON.stringify(o) : '')] || (cache[hex + (o ? JSON.stringify(o) : '')] = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.7, metalness: 0 }, o || {})));
  const legsAt = (g, w, d, h, m, ins, r, x, z) => { const s = G(); legs(s, w, d, h, m, ins, r); s.position.set(x, 0, z); g.add(s); };
  const rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };

  /* ---------- recámara ---------- */
  B.bed_bunk = (w, d) => {
    const g = G(), m = M();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.06, 1.75, 0.06, m.walnut, a * (w / 2 - 0.03), 0, b * (d / 2 - 0.03), 0.01));
    [0.3, 1.15].forEach((y) => {
      box(g, w - 0.08, 0.05, d - 0.08, m.oak, 0, y, 0, 0.01);
      box(g, w - 0.1, 0.16, d - 0.12, m.bedding, 0, y + 0.05, 0, 0.05);
      box(g, w - 0.1, 0.05, d * 0.6, m.duvetA, 0, y + 0.2, d * 0.18, 0.03);
      box(g, w * 0.6, 0.12, 0.34, m.pillow, 0, y + 0.2, -d / 2 + 0.3, 0.05);
    });
    box(g, w, 0.32, 0.03, m.walnut, 0, 1.4, d / 2 - 0.015, 0.005);
    box(g, 0.04, 1.4, 0.04, m.walnut, w / 2 + 0.02, 0, d / 2 - 0.5, 0.005); box(g, 0.04, 1.4, 0.04, m.walnut, w / 2 + 0.02, 0, d / 2 - 0.1, 0.005);
    for (let i = 0; i < 5; i++) box(g, 0.03, 0.03, 0.36, m.walnut, w / 2 + 0.02, 0.28 + i * 0.26, d / 2 - 0.3, 0.005);
    return g;
  };
  B.crib = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.04, d, m.oak, 0, 0.3, 0, 0.01); box(g, w - 0.1, 0.1, d - 0.1, m.bedding, 0, 0.34, 0, 0.04);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, 0.05, 1.0, 0.05, m.oak, a * (w / 2 - 0.025), 0, b * (d / 2 - 0.025), 0.01));
    [-1, 1].forEach((s) => { box(g, w, 0.04, 0.03, m.oak, 0, 0.95, s * (d / 2 - 0.015), 0.005); for (let x = -w / 2 + 0.1; x < w / 2 - 0.05; x += 0.1) box(g, 0.015, 0.6, 0.015, m.oak, x, 0.36, s * (d / 2 - 0.015), 0.003); });
    box(g, 0.03, 0.62, d - 0.06, m.oak, w / 2 - 0.015, 0.34, 0, 0.005); box(g, 0.03, 0.62, d - 0.06, m.oak, -w / 2 + 0.015, 0.34, 0, 0.005);
    return g;
  };
  B.vanity = (w, d) => {
    const g = G(), m = M();
    legs(g, w, d, 0.7, m.walnut, 0.05, 0.02); box(g, w, 0.04, d, m.white, 0, 0.7, 0, 0.02); box(g, w - 0.1, 0.12, d - 0.06, m.white, 0, 0.58, 0, 0.01);
    box(g, 0.5, 0.7, 0.02, m.mirror, 0, 0.78, -d / 2 + 0.03, 0.01); box(g, 0.54, 0.74, 0.015, m.brass, 0, 0.76, -d / 2 + 0.02, 0.01);
    cyl(g, 0.18, 0.05, m.chairSeat, 0, 0.4, d / 2 + 0.18, 0.18); legsAt(g, 0.3, 0.3, 0.4, m.walnut, 0.03, 0.018, 0, d / 2 + 0.18);
    return g;
  };
  B.bench = (w, d) => { const g = G(), m = M(); legs(g, w, d, 0.28, m.walnut, 0.05, 0.022); box(g, w, 0.16, d, m.cushion2, 0, 0.28, 0, 0.06); return g; };
  B.tallboy = (w, d) => {
    const g = G(), m = M(); box(g, w, 1.3, d, m.oak, 0, 0.06, 0, 0.02); legs(g, w, d, 0.06, m.walnut, 0.04, 0.02);
    for (let i = 0; i < 5; i++) { box(g, w - 0.06, 0.2, 0.012, m.oakDark, 0, 0.12 + i * 0.24, d / 2 + 0.003, 0.004); cyl(g, 0.012, 0.03, m.brass, 0, 0.2 + i * 0.24, d / 2 + 0.02).rotation.x = Math.PI / 2; }
    return g;
  };

  /* ---------- sala ---------- */
  B.pouf = (w) => { const g = G(), m = M(); cyl(g, w / 2, 0.38, m.cushion2, 0, 0.02, 0, w / 2 - 0.03, 28); cyl(g, w / 2 - 0.02, 0.03, m.accent, 0, 0.38, 0, w / 2 - 0.05, 28); return g; };
  B.sidetable = (w) => { const g = G(), m = M(); cyl(g, w / 2, 0.03, m.brass, 0, 0.5, 0, w / 2, 30); cyl(g, 0.02, 0.5, m.brass, 0, 0, 0, 0.02); cyl(g, 0.16, 0.02, m.brass, 0, 0, 0, 0.16); cyl(g, 0.08, 0.1, m.ceramic, 0.05, 0.53, 0, 0.06); return g; };
  B.console = (w, d) => { const g = G(), m = M(); box(g, w, 0.04, d, m.oak, 0, 0.76, 0, 0.01); legs(g, w, d, 0.76, m.walnut, 0.04, 0.02); box(g, w - 0.1, 0.03, d - 0.06, m.oakDark, 0, 0.22, 0, 0.005); cyl(g, 0.07, 0.18, m.ceramic, -w * 0.3, 0.8, 0, 0.05); box(g, 0.3, 0.05, 0.2, m.accent, w * 0.25, 0.8, 0, 0.01); return g; };
  B.floorlamp = (w) => { const g = G(), m = M(); cyl(g, 0.14, 0.02, m.brass, 0, 0, 0, 0.14); cyl(g, 0.012, 1.4, m.brass, 0, 0.02, 0, 0.012); cyl(g, 0.17, 0.26, m.lampshade, 0, 1.36, 0, 0.11); return g; };
  B.fireplace = (w, d) => {
    const g = G(), m = M(), gr = mat('#d9d4cc', { roughness: 0.6 });
    box(g, w, 1.1, d, gr, 0, 0, 0, 0.01); box(g, w * 0.5, 0.65, 0.05, mat('#141416', { roughness: 0.8 }), 0, 0.15, d / 2 - 0.01, 0.005);
    box(g, w + 0.1, 0.06, d + 0.08, m.marble, 0, 1.08, 0, 0.01); box(g, w * 0.6, 0.05, d * 0.5, mat('#ff7a2b', { emissive: new THREE.Color('#ff6a1a'), emissiveIntensity: 1.2 }), 0, 0.2, d / 4, 0.01);
    return g;
  };
  B.rug = (w, d) => { const g = G(), m = M(); box(g, w, 0.014, d, m.rug, 0, 0, 0, 0.02); box(g, w - 0.24, 0.016, d - 0.24, mat('#b9a58f', { roughness: 1 }), 0, 0, 0, 0.01); box(g, w - 0.5, 0.018, d - 0.5, m.rug, 0, 0, 0, 0.01); return g; };
  B.rug_round = (w) => { const g = G(), m = M(); cyl(g, w / 2, 0.014, m.rug, 0, 0, 0, w / 2, 40); cyl(g, w / 2 - 0.15, 0.016, mat('#b9a58f', { roughness: 1 }), 0, 0, 0, w / 2 - 0.15, 40); cyl(g, w / 2 - 0.3, 0.018, m.rug, 0, 0, 0, w / 2 - 0.3, 40); return g; };
  B.piano = (w, d) => {
    const g = G(), m = M(), bk = m.blackGlass;
    box(g, w, 0.95, d - 0.15, bk, 0, 0.2, -0.07, 0.02); box(g, w, 0.06, d, bk, 0, 1.15, 0, 0.02); legs(g, w, d - 0.1, 0.2, bk, 0.05, 0.03);
    box(g, w - 0.1, 0.03, 0.2, mat('#f6f4f0'), 0, 0.7, d / 2 - 0.1, 0.005);
    for (let x = -w / 2 + 0.12; x < w / 2 - 0.1; x += 0.11) box(g, 0.03, 0.02, 0.12, bk, x, 0.735, d / 2 - 0.14, 0.003);
    box(g, 0.5, 0.06, 0.3, m.cushion2, 0, 0.44, d / 2 + 0.38, 0.03); legsAt(g, 0.5, 0.3, 0.44, m.walnut, 0.03, 0.02, 0, d / 2 + 0.38);
    return g;
  };

  /* ---------- comedor ---------- */
  const roundT = (w) => { const g = G(), m = M(); cyl(g, w / 2, 0.045, m.tableWood, 0, 0.7, 0, w / 2, 40); cyl(g, 0.06, 0.66, m.walnut, 0, 0.04, 0, 0.06); cyl(g, 0.3, 0.04, m.walnut, 0, 0, 0, 0.3, 30); cyl(g, 0.1, 0.05, m.ceramic, 0, 0.745, 0, 0.13); sph(g, 0.06, m.accent, 0, 0.85, 0); return g; };
  B.round4 = roundT; B.round6 = roundT;
  B.sideboard = (w, d) => {
    const g = G(), m = M(), n = 4, dw = (w - 0.06) / n;
    legs(g, w, d, 0.14, m.walnut, 0.06, 0.02); box(g, w, 0.68, d, m.oak, 0, 0.14, 0, 0.02); box(g, w + 0.02, 0.03, d + 0.02, m.oakDark, 0, 0.82, 0, 0.01);
    for (let i = 0; i < n; i++) { box(g, dw - 0.014, 0.58, 0.012, m.oakDark, -w / 2 + 0.03 + dw * (i + 0.5), 0.2, d / 2 + 0.003, 0.004); handle(g, -w / 2 + 0.03 + dw * (i + 0.5), 0.5, d / 2 + 0.03, 0.06, false); }
    cyl(g, 0.07, 0.2, m.ceramic, -w * 0.3, 0.85, 0, 0.05); sph(g, 0.05, m.leaf1, -w * 0.3, 1.1, 0, 1.4, 1, 1.4);
    return g;
  };
  B.bench2 = (w, d) => { const g = G(), m = M(); box(g, w, 0.05, d, m.oak, 0, 0.43, 0, 0.015); box(g, 0.05, 0.43, d - 0.06, m.walnut, -w / 2 + 0.05, 0, 0, 0.005); box(g, 0.05, 0.43, d - 0.06, m.walnut, w / 2 - 0.05, 0, 0, 0.005); return g; };
  B.stool = (w) => { const g = G(), m = M(); cyl(g, w / 2, 0.05, m.chairSeat, 0, 0.62, 0, w / 2, 24); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = cyl(g, 0.014, 0.62, m.walnut, a * 0.12, 0, b * 0.12, 0.02); }); cyl(g, w / 2 - 0.06, 0.015, m.brass, 0, 0.25, 0, w / 2 - 0.06); return g; };
  B.hutch = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.85, d, m.oak, 0, 0, 0, 0.015); box(g, w, 1.0, d - 0.06, m.oak, 0, 0.9, -0.03, 0.015);
    [-1, 1].forEach((s) => { box(g, w / 2 - 0.04, 0.9, 0.012, m.glass, s * (w / 4), 0.95, d / 2 - 0.05, 0.002); box(g, 0.02, 0.9, 0.02, m.oakDark, s * (w / 2 - 0.02), 0.95, d / 2 - 0.05, 0.003); });
    [1.15, 1.45].forEach((y) => box(g, w - 0.08, 0.02, d - 0.14, m.oakDark, 0, y, -0.03, 0.003));
    for (let i = 0; i < 4; i++) cyl(g, 0.05, 0.02, m.ceramic, -w * 0.3 + i * 0.16, 1.17, -0.02, 0.05, 20);
    return g;
  };

  /* ---------- cocina / baño / oficina ---------- */
  B.dishwasher = (w, d) => { const g = G(), m = M(); box(g, w, 0.85, d, m.steel, 0, 0, 0, 0.015); box(g, w - 0.04, 0.08, 0.012, m.blackGlass, 0, 0.72, d / 2 + 0.004, 0.004); handle(g, 0, 0.66, d / 2 + 0.04, w - 0.14, false); return g; };
  B.pantry = (w, d) => { const g = G(), m = M(); box(g, w, 2.1, d, m.cabinet, 0, 0, 0, 0.012); [-1, 1].forEach((s) => { box(g, w / 2 - 0.014, 2.0, 0.014, m.cabinetDoor, s * w / 4, 0.05, d / 2 + 0.004, 0.005); handle(g, s * 0.05, 1.05, d / 2 + 0.03, 0.14, true); }); return g; };
  B.dblsink = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.72, d, m.cabinetBath, 0, 0.1, 0, 0.012); legs(g, w, d, 0.1, m.chrome, 0.05, 0.012); box(g, w + 0.02, 0.03, d + 0.02, m.marble, 0, 0.82, 0, 0.012);
    [-1, 1].forEach((s) => { sph(g, 0.5, m.ceramic, s * w * 0.25, 0.83, 0.02, (w * 0.17) / 0.5, 0.06 / 0.5, (d * 0.34) / 0.5); cyl(g, 0.012, 0.16, m.chrome, s * w * 0.25, 0.85, -d / 2 + 0.06); box(g, w * 0.34, 0.85, 0.008, m.mirror, s * w * 0.25, 1.0, -d / 2 - 0.004 + 0.004, 0.01); });
    return g;
  };
  B.bidet = (w, d) => { const g = G(), m = M(); sph(g, 0.5, m.ceramic, 0, 0.22, 0.02, (w * 0.95) / 1, 0.4 / 0.5 * 0.5, (d - 0.15) / 2 / 0.5); box(g, w * 0.9, 0.3, 0.12, m.ceramic, 0, 0, -d / 2 + 0.08, 0.02); cyl(g, 0.012, 0.1, m.chrome, 0, 0.36, -d / 2 + 0.08); return g; };
  B.freetub = (w, d) => {
    const g = G(), m = M();
    const outer = sph(g, 0.5, m.ceramic, 0, 0.3, 0, w, 0.6, d); outer.scale.set(w, 0.6, d);
    const inner = sph(g, 0.5, m.ceramicIn, 0, 0.42, 0, w - 0.16, 0.38, d - 0.16); inner.scale.set(w - 0.16, 0.34, d - 0.16);
    cyl(g, 0.014, 0.9, m.chrome, w / 2 - 0.1, 0, 0); const s = cyl(g, 0.01, 0.2, m.chrome, w / 2 - 0.2, 0.88, 0); s.rotation.z = Math.PI / 2;
    return g;
  };
  B.ldesk = (w, d) => {
    const g = G(), m = M(), t = 0.7;
    box(g, w, 0.035, t, m.oak, 0, 0.72, -d / 2 + t / 2, 0.01); box(g, t, 0.035, d - t, m.oak, -w / 2 + t / 2, 0.72, t / 2, 0.01);
    [[w / 2 - 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + t - 0.05], [-w / 2 + 0.05, d / 2 - 0.05], [-w / 2 + t - 0.05, d / 2 - 0.05], [-w / 2 + 0.05, -d / 2 + 0.05]].forEach(([x, z]) => box(g, 0.05, 0.72, 0.05, m.white, x, 0, z, 0.005));
    box(g, 0.6, 0.35, 0.02, m.blackPlastic, 0.1, 1.0, -d / 2 + 0.2, 0.01); { const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.31), m.tvScreen); scr.position.set(0.1, 1.175, -d / 2 + 0.217); g.add(scr); } cyl(g, 0.012, 0.22, m.blackPlastic, 0.1, 0.755, -d / 2 + 0.2);
    box(g, 0.4, 0.015, 0.14, m.blackPlastic, 0.1, 0.755, -d / 2 + 0.5, 0.01);
    return g;
  };
  B.ochair = (w) => {
    const g = G(), m = M(), bl = mat('#2a2d33', { roughness: 0.6 });
    cyl(g, 0.02, 0.4, m.chrome, 0, 0.05, 0, 0.02); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2, arm = box(g, 0.28, 0.025, 0.04, m.chrome, Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14, 0.01); arm.rotation.y = -a; cyl(g, 0.025, 0.03, m.blackPlastic, Math.cos(a) * 0.27, 0, Math.sin(a) * 0.27); }
    box(g, 0.5, 0.09, 0.48, bl, 0, 0.45, 0.02, 0.06); const b = box(g, 0.46, 0.55, 0.07, bl, 0, 0.5, -0.24, 0.05); b.rotation.x = -0.1;
    box(g, 0.05, 0.02, 0.3, bl, -0.28, 0.65, 0.02, 0.008); box(g, 0.05, 0.02, 0.3, bl, 0.28, 0.65, 0.02, 0.008);
    return g;
  };
  B.filecab = (w, d) => { const g = G(), m = M(); box(g, w, 0.7, d, mat('#b8bec4', { metalness: 0.6, roughness: 0.4 }), 0, 0, 0, 0.01); for (let i = 0; i < 2; i++) { box(g, w - 0.04, 0.3, 0.01, m.steel, 0, 0.03 + i * 0.33, d / 2 + 0.003, 0.003); handle(g, 0, 0.26 + i * 0.33, d / 2 + 0.02, 0.1, false); } return g; };

  /* ---------- exterior ---------- */
  B.lounger = (w, d) => {
    const g = G(), m = M();
    box(g, w, 0.06, d, mat('#8a7a66'), 0, 0.28, 0, 0.02); legs(g, w, d, 0.28, mat('#5b5f66', { metalness: 0.6 }), 0.05, 0.02);
    box(g, w - 0.08, 0.1, d * 0.55, m.pillow, 0, 0.34, d * 0.22, 0.05); const b = box(g, w - 0.08, 0.1, 0.55, m.pillow, 0, 0.42, -d / 2 + 0.3, 0.05); b.rotation.x = 0.55;
    return g;
  };
  B.patiotable = (w) => { const g = G(); const m = M(); cyl(g, w / 2, 0.03, m.glass, 0, 0.7, 0, w / 2, 32); cyl(g, w / 2, 0.04, mat('#5b5f66', { metalness: 0.7 }), 0, 0.68, 0, w / 2 - 0.03, 32); cyl(g, 0.04, 0.68, mat('#5b5f66', { metalness: 0.7 }), 0, 0, 0, 0.04); cyl(g, 0.28, 0.03, mat('#5b5f66', { metalness: 0.7 }), 0, 0, 0, 0.28); return g; };
  B.patiochair = (w, d) => { const g = G(), al = mat('#5b5f66', { metalness: 0.6, roughness: 0.5 }); box(g, w - 0.06, 0.08, d - 0.08, mat('#e9dfd0', { roughness: 0.95 }), 0, 0.42, 0.03, 0.05); const b = box(g, w - 0.08, 0.45, 0.07, mat('#e9dfd0', { roughness: 0.95 }), 0, 0.46, -d / 2 + 0.08, 0.05); b.rotation.x = -0.15; legs(g, w - 0.06, d - 0.06, 0.42, al, 0.03, 0.014); return g; };
  B.bbq = (w, d) => { const g = G(), bl = mat('#2d3036', { roughness: 0.5, metalness: 0.4 }); cyl(g, 0.24, 0.24, bl, 0, 0.75, 0, 0.26, 24); cyl(g, 0.25, 0.04, bl, 0, 0.98, 0, 0.25); legs(g, w, d, 0.75, bl, 0.06, 0.016); box(g, w - 0.1, 0.06, d - 0.1, bl, 0, 0.7, 0, 0.01); return g; };
  B.parasol = (w) => {
    const g = G(), m = M(); cyl(g, 0.02, 2.3, mat('#8a7a66'), 0, 0, 0, 0.02);
    const c = new THREE.Mesh(new THREE.ConeGeometry(w / 2, 0.45, 24, 1, true), mat('#efe6d6', { roughness: 0.9, side: THREE.DoubleSide })); c.position.set(0, 2.35, 0); c.castShadow = true; g.add(c);
    cyl(g, 0.16, 0.05, mat('#8a7a66'), 0, 0, 0, 0.2);
    return g;
  };

  /* ---------- plantas ---------- */
  const pot = (g, r, h, col, top) => { cyl(g, r * 0.75, h, mat(col || '#b9623e', { roughness: 0.9 }), 0, 0, 0, r); cyl(g, r * 0.98, 0.02, mat('#3a2a20', { roughness: 1 }), 0, h, 0, r * 0.98); };
  const G1 = () => mat('#3f7d47', { roughness: 0.55 }), G2 = () => mat('#5b9a55', { roughness: 0.55 }), G3 = () => mat('#2f6a3c', { roughness: 0.55 });
  B.plant_monstera = (w) => {
    const g = G(); pot(g, w * 0.3, 0.36, '#c9b8a6');
    for (let i = 0; i < 11; i++) {
      const a = i * 2.4, r = 0.1 + (i % 4) * 0.08, h = 0.55 + (i % 5) * 0.14;
      cyl(g, 0.006, h - 0.36, G2(), Math.cos(a) * r * 0.5, 0.36, Math.sin(a) * r * 0.5);
      const l = sph(g, 0.15, i % 2 ? G1() : G3(), Math.cos(a) * r, h, Math.sin(a) * r, 1.1, 0.12, 0.9); l.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.4);
    }
    return g;
  };
  B.plant_ficus = (w) => {
    const g = G(); pot(g, w * 0.3, 0.38, '#c9b8a6'); cyl(g, 0.03, 1.2, mat('#6b4a32', { roughness: 0.9 }), 0, 0.36, 0, 0.045);
    [[0, 1.55, 0, 0.42], [0.2, 1.4, 0.1, 0.3], [-0.2, 1.35, -0.1, 0.3], [0.05, 1.8, 0.05, 0.28], [-0.1, 1.5, 0.2, 0.26], [0.15, 1.65, -0.2, 0.26]].forEach(([x, y, z, r], i) => sph(g, r, i % 2 ? G2() : G1(), x, y, z, 1, 0.9, 1));
    return g;
  };
  B.plant_palm = (w) => {
    const g = G(); pot(g, w * 0.22, 0.4, '#b9623e');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.2, tilt = 0.5 + (i % 3) * 0.2; const l = sph(g, 0.5, i % 2 ? G1() : G2(), Math.cos(a) * 0.32, 0.95 + (i % 3) * 0.15, Math.sin(a) * 0.32, 0.05, 0.03, 0.9); l.scale.set(0.04, 0.03, 0.55); l.rotation.set(0, -a + Math.PI / 2, 0); l.rotation.order = 'YXZ'; l.rotation.x = tilt - 1.0; l.position.y += 0.05; }
    for (let i = 0; i < 6; i++) { const a = i * 1.05; cyl(g, 0.008, 0.6 + (i % 3) * 0.15, G3(), Math.cos(a) * 0.05, 0.4, Math.sin(a) * 0.05); }
    return g;
  };
  B.plant_cactus = (w) => {
    const g = G(), cc = mat('#5f9a6a', { roughness: 0.6 }); pot(g, w * 0.32, 0.22, '#d6c7b4');
    cyl(g, 0.07, 0.55, cc, 0, 0.22, 0, 0.07, 18); sph(g, 0.07, cc, 0, 0.77, 0);
    [[0.11, 0.42, 0.25], [-0.11, 0.5, 0.2]].forEach(([x, y, h], i) => { cyl(g, 0.035, 0.1, cc, x * 0.7, y, 0, 0.035).rotation.z = 0; cyl(g, 0.035, h, cc, x, y + 0.05, 0, 0.035); sph(g, 0.035, cc, x, y + h + 0.05, 0); });
    return g;
  };
  B.plant_succ = (w) => {
    const g = G(); pot(g, w * 0.4, 0.13, '#d6c7b4');
    [[0, 0], [0.07, 0.04], [-0.06, 0.05], [0.03, -0.08]].forEach(([x, z], i) => { for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const l = sph(g, 0.04, mat(i % 2 ? '#8fb59a' : '#a5c9a5', { roughness: 0.6 }), x + Math.cos(a) * 0.035, 0.17 + (i % 2) * 0.02, z + Math.sin(a) * 0.035, 1.6, 0.5, 0.7); l.rotation.y = -a; } });
    return g;
  };
  B.plant_bamboo = (w) => {
    const g = G(); pot(g, w * 0.4, 0.4, '#3a3d44');
    for (let i = 0; i < 7; i++) {
      const a = i * 2.2, r = 0.05 + (i % 3) * 0.035, h = 1.3 + (i % 4) * 0.18, x = Math.cos(a) * r, z = Math.sin(a) * r;
      cyl(g, 0.014, h, mat('#7aa84a', { roughness: 0.5 }), x, 0.4, z, 0.016, 8);
      for (let n = 1; n < 6; n++) cyl(g, 0.019, 0.012, mat('#5f8a3a'), x, 0.4 + (h * n) / 6, z, 0.019, 8);
      for (let n = 0; n < 3; n++) { const l = sph(g, 0.1, G2(), x + 0.05, 0.4 + h - n * 0.13, z, 1.6, 0.08, 0.5); l.rotation.y = -a + n; }
    }
    return g;
  };
  B.plant_olive = (w) => {
    const g = G(), silver = mat('#8aa17a', { roughness: 0.6 }), silver2 = mat('#a3b58f', { roughness: 0.6 }); pot(g, w * 0.3, 0.5, '#b9623e');
    const t = cyl(g, 0.035, 1.0, mat('#6b5b4a', { roughness: 0.95 }), 0, 0.5, 0, 0.055); t.rotation.z = 0.1;
    [[0, 1.65, 0, 0.42], [0.25, 1.45, 0.1, 0.3], [-0.25, 1.4, -0.1, 0.3], [0.05, 1.9, 0.08, 0.26], [-0.15, 1.6, 0.25, 0.26], [0.2, 1.7, -0.22, 0.24]].forEach(([x, y, z, r], i) => sph(g, r, i % 2 ? silver : silver2, x, y, z, 1, 0.8, 1));
    return g;
  };
  B.plant_fern = (w) => {
    const g = G(); pot(g, w * 0.3, 0.3, '#c9b8a6');
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = 0.16 + (i % 3) * 0.05; const l = sph(g, 0.2, i % 2 ? G2() : G1(), Math.cos(a) * r, 0.5 + (i % 3) * 0.06, Math.sin(a) * r, 0.16, 0.06, 1); l.rotation.set(0, -a + Math.PI / 2, 0); l.rotation.order = 'YXZ'; l.rotation.x = -0.5; }
    return g;
  };
  B.plant_snake = (w) => {
    const g = G(); pot(g, w * 0.4, 0.3, '#c9b8a6');
    for (let i = 0; i < 8; i++) {
      const a = i * 0.9, r = 0.03 + (i % 3) * 0.02, h = 0.4 + (i % 4) * 0.13;
      const b = box(g, 0.05, h, 0.012, i % 2 ? G3() : G1(), Math.cos(a) * r, 0.3, Math.sin(a) * r, 0.005); b.rotation.y = -a; b.rotation.z = (i % 3 - 1) * 0.06;
      box(g, 0.055, 0.02, 0.014, mat('#c9c85a'), Math.cos(a) * r, 0.3 + h - 0.02, Math.sin(a) * r, 0.002).rotation.y = -a;
    }
    return g;
  };

  /* ---------- decoración de pared ---------- */
  B.art_curtain = (w, d, it) => {
    const g = G(), m = M(), ph = it.ph || 2.5, zc = it.z || 1.3, top = zc + ph / 2, col = mat('#d9cfc0', { roughness: 1 }), col2 = mat('#e9dfd0', { roughness: 1 });
    const n = Math.max(6, Math.round(w / 0.07));
    for (let i = 0; i < n; i++) box(g, w / n + 0.004, ph - 0.05, 0.03, i % 2 ? col : col2, -w / 2 + (w * (i + 0.5)) / n, top - ph, 0.03 + (i % 2) * 0.03, 0.01);
    const rod = cyl(g, 0.012, w + 0.1, m.brass, 0, top, 0.05); rod.rotation.z = Math.PI / 2; rod.position.set(0, top + 0.01, 0.05);
    sph(g, 0.03, m.brass, -w / 2 - 0.06, top + 0.01, 0.05); sph(g, 0.03, m.brass, w / 2 + 0.06, top + 0.01, 0.05);
    return g;
  };
  B.art_shelf = (w, d, it) => {
    const g = G(), m = M(), zc = it.z || 1.6;
    box(g, w, 0.035, 0.22, m.oak, 0, zc, 0.11, 0.008);
    const cols = ['#b5533c', '#3c6e8f', '#d0a24a', '#5d7a55', '#3b3b45'];
    for (let i = 0; i < 5; i++) box(g, 0.035, 0.2 + (i % 2) * 0.04, 0.16, m.book(cols[i]), -w / 2 + 0.1 + i * 0.045, zc + 0.035, 0.11, 0.002);
    cyl(g, 0.05, 0.1, m.terracotta, w * 0.2, zc + 0.035, 0.11, 0.04); for (let k = 0; k < 4; k++) sph(g, 0.05, m.leaf2, w * 0.2 + (k - 1.5) * 0.03, zc + 0.19 + (k % 2) * 0.04, 0.11, 1, 1.4, 1);
    cyl(g, 0.045, 0.08, m.ceramic, w * 0.38, zc + 0.035, 0.11, 0.035);
    return g;
  };
})();

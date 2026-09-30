/* lamps.js — lámparas que SÍ dan luz: catálogo, dibujo en planta, modelo 3D y emisores de luz reales.
   Cada lámpara puede encenderse/apagarse, cambiar de intensidad y de tono (cálido, neutro, frío). */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS, U = FP.util;
  const CEIL = 2.6;
  const TONES = { warm: '#ffc98a', neutral: '#fff0dd', cool: '#dce9ff' }, BRIGHT = { low: 0.6, normal: 1, high: 1.7 };

  /* ---------- definición de la luz de cada tipo ---------- */
  // em: [ox, altura (absoluta, o sobre `elev` si el tipo lo tiene), oz, spot?]  ·  k: fuerza  ·  dist: alcance (m)
  const DEF = {
    floorlamp: { k: 1.0, dist: 6.5, em: [[0, 1.5, 0]] },
    tripod_lamp: { k: 1.0, dist: 6.5, em: [[0, 1.45, 0]] },
    arc_lamp: { k: 1.3, dist: 7.5, em: [[0, 1.95, 0.85]] },
    table_lamp: { k: 0.7, dist: 4.5, elev: 0.55, em: [[0, 0.36, 0]] },
    desk_lamp: { k: 0.8, dist: 4.2, elev: 0.76, em: [[0, 0.38, 0.05]] },
    chandelier: { k: 1.5, dist: 9, em: [[0, 1.95, 0]] },
    pendant: { k: 1.0, dist: 6.5, em: [[0, 1.55, 0]] },
    pendant3: { k: 1.2, dist: 7, em: [[0, 1.75, 0]] },
    ceiling_flush: { k: 1.1, dist: 7, em: [[0, 2.45, 0]] },
    track_light: { k: 1.2, dist: 7, em: [[-0.4, 2.45, 0, 1], [0.4, 2.45, 0, 1]] },
    downlight: { k: 1.0, dist: 6, em: [[0, 2.52, 0, 1]] },
    art_sconce: { k: 0.8, dist: 4.5, wall: true, em: [[0, 0.04, 0.25]] },
    glamp: { k: 0.8, dist: 4.2, em: [[0, 0.95, 0]] },
  };
  FP.Lamps = {
    DEF, TONES,
    is: (key) => !!DEF[key],
    /** Objetos que no bloquean el paso ni llevan sombra de contacto (van en el techo o son diminutos). */
    NOBLOCK: new Set(['pendant', 'pendant3', 'chandelier', 'ceiling_flush', 'track_light', 'downlight', 'table_lamp', 'desk_lamp']),
    on: (it) => it.on !== 0 && it.on !== '0' && it.on !== false,
    /** Luces de esta lámpara en coordenadas del nivel: [{x,y,z,k,dist,spot,tint}] */
    emitters(it) {
      const d = DEF[it.key];
      if (!d || !FP.Lamps.on(it)) return [];
      const t = U.rad(it.rot || 0), c = Math.cos(t), s = Math.sin(t), br = BRIGHT[it.bright] || 1, tint = TONES[it.tone] || TONES.warm;
      return d.em.map(([ox, oy, oz, spot]) => ({
        x: it.x + ox * c - oz * s, z: it.y + ox * s + oz * c,
        y: d.wall ? (it.z || 1.7) + oy : (d.elev ? (it.elev != null ? it.elev : d.elev) : 0) + oy,
        k: d.k * br, dist: d.dist, spot: !!spot, tint,
      }));
    },
  };

  /* ---------- planta 2D ---------- */
  const rays = (g, r, n, r0) => { let s = ''; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; s += g.line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r, Math.sin(a) * r, { hair: 1, soft: 1 }); } return s; };
  const D = {
    tripod_lamp: (w, h, g) => { let s = ''; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 - Math.PI / 2; s += g.line(0, 0, Math.cos(a) * w / 2, Math.sin(a) * w / 2, { soft: 1 }); } return s + g.circ(0, 0, w * 0.32, '#f3e3c3') + g.circ(0, 0, w * 0.18, '#fff4d6', { hair: 1 }); },
    arc_lamp: (w, h, g) => g.rect(-w / 2, -h / 2, w, 0.3, '#d9d4cc', { rx: 0.03 }) + g.line(0, -h / 2 + 0.15, 0, h / 2 - 0.3, { soft: 1 }) + g.circ(0, h / 2 - 0.2, 0.17, '#f3e3c3') + g.circ(0, h / 2 - 0.2, 0.08, '#fff4d6', { hair: 1 }),
    table_lamp: (w, h, g) => g.circ(0, 0, w / 2, '#f3e3c3') + g.circ(0, 0, w / 2 - 0.05, '#fff4d6', { hair: 1 }) + g.circ(0, 0, 0.025, '#8a7660', { hair: 1 }),
    desk_lamp: (w, h, g) => g.rect(-w / 2, -h / 2, w, 0.1, '#3a3a40', { rx: 0.03 }) + g.line(0, -h / 2 + 0.05, 0, h / 2 - 0.08, { soft: 1 }) + g.circ(0, h / 2 - 0.07, 0.07, '#f3e3c3', { hair: 1 }),
    chandelier: (w, h, g) => g.circ(0, 0, w / 2, '#f3e3c3', { nf: 1, soft: 1, dash: 1 }) + g.circ(0, 0, w * 0.12, '#d9b86a', { hair: 1 }) + [0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return g.line(0, 0, Math.cos(a) * w * 0.4, Math.sin(a) * w * 0.4, { hair: 1, soft: 1 }) + g.circ(Math.cos(a) * w * 0.4, Math.sin(a) * w * 0.4, 0.05, '#fff4d6', { hair: 1 }); }).join(''),
    pendant3: (w, h, g) => g.line(-w / 2, 0, w / 2, 0, { soft: 1 }) + [-1, 0, 1].map((k) => g.circ(k * w * 0.32, 0, h * 0.42, '#f3e3c3', { hair: 1 }) + g.circ(k * w * 0.32, 0, 0.03, '#d9b86a', { hair: 1 })).join(''),
    ceiling_flush: (w, h, g) => g.circ(0, 0, w / 2, '#f3e3c3', { soft: 1 }) + g.circ(0, 0, w / 2 - 0.06, '#fff4d6', { hair: 1, soft: 1 }) + rays(g, w / 2 - 0.08, 8, 0.06),
    track_light: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#2a2a2f', { rx: 0.02 }) + [-1, 0, 1].map((k) => g.circ(k * w * 0.33, 0, 0.045, '#fff4d6', { hair: 1 })).join(''),
    downlight: (w, h, g) => g.circ(0, 0, w / 2, '#f3e3c3', { hair: 1 }) + g.circ(0, 0, w / 2 - 0.035, '#fff4d6', { hair: 1, soft: 1 }) + g.line(-0.04, 0, 0.04, 0, { soft: 1 }) + g.line(0, -0.04, 0, 0.04, { soft: 1 }),
    art_sconce: (w, h, g) => g.rect(-w / 2, -h / 2, w, 0.05, '#2a2a2f') + g.path(`M${-w / 2 + 0.02} ${-h / 2 + 0.05} A${w / 2 - 0.02} ${h - 0.05} 0 0 0 ${w / 2 - 0.02} ${-h / 2 + 0.05}Z`, '#fff4d6', { hair: 1 }),
  };
  const NEW = {
    tripod_lamp: ['Lámpara de trípode', 0.55, 0.55, 1.6, '#f3e3c3'], arc_lamp: ['Lámpara de arco', 0.4, 2.0, 2.2, '#d9d4cc'],
    table_lamp: ['Lámpara de mesa', 0.3, 0.3, 0.45, '#f3e3c3'], desk_lamp: ['Lámpara de escritorio', 0.2, 0.3, 0.4, '#3a3a40'],
    chandelier: ['Candil', 0.9, 0.9, 0.1, '#d9b86a'], pendant3: ['Colgante triple', 1.6, 0.35, 0.1, '#f3e3c3'],
    ceiling_flush: ['Plafón de techo', 0.5, 0.5, 0.1, '#f3e3c3'], track_light: ['Spots en riel', 1.2, 0.1, 0.1, '#2a2a2f'], downlight: ['Foco empotrado', 0.16, 0.16, 0.1, '#f3e3c3'],
  };
  Object.keys(NEW).forEach((k) => { const [name, w, h, z, c] = NEW[k]; I[k] = { name, w, h, z, c, draw: D[k] }; });
  I.art_sconce = { name: 'Aplique de pared', w: 0.2, h: 0.14, z: 0, c: '#fff4d6', draw: D.art_sconce, wall: true, ph: 0.3, z0: 1.75, style: 'sconce',
    iconFn: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 52 52"><rect x="10" y="6" width="32" height="6" rx="2" fill="#2a2a2f"/><path d="M14 12a12 14 0 0 0 24 0z" fill="#fff4d6" stroke="#8a7660" stroke-width="1.5"/><path d="M26 30v8M18 34l-4 6M34 34l4 6" stroke="#f3c969" stroke-width="2" stroke-linecap="round"/></svg>` };
  ['pendant', 'floorlamp', 'glamp'].forEach((k) => { if (I[k]) I[k].lamp = true; });
  const C = F.CATS;
  C.splice(Math.max(1, C.findIndex((c) => c.id === 'sala') + 1), 0, { id: 'lamparas', name: 'Lámparas', items: ['downlight', 'ceiling_flush', 'chandelier', 'pendant', 'pendant3', 'track_light', 'floorlamp', 'tripod_lamp', 'arc_lamp', 'table_lamp', 'desk_lamp', 'art_sconce', 'glamp'] });

  /* ---------- 3D ---------- */
  const H = FP.Models.helpers, B = FP.Models.B, { box, cyl, sph, G } = H;
  FP.Models.ctx = FP.Models.ctx || { up: true };
  const std = (hex, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.6 }, o || {}));
  /** Pantalla / bombilla: emisiva si está encendida (su brillo sigue la hora del día) y apagada si no. */
  const glow = (it, base, strength) => {
    const on = FP.Lamps.on(it), tint = TONES[it.tone] || TONES.warm;
    const m = std(on ? base : '#d8d2c6', on ? { emissive: new THREE.Color(tint), emissiveIntensity: strength || 1, side: THREE.DoubleSide, roughness: 0.8 } : { roughness: 0.85, side: THREE.DoubleSide });
    if (on && FP.Models.ctx.regEmis) FP.Models.ctx.regEmis(m);
    return m;
  };
  const bulb = (it) => { const on = FP.Lamps.on(it), m = std('#fff6dc', on ? { emissive: new THREE.Color(TONES[it.tone] || TONES.warm), emissiveIntensity: 1.6 } : {}); if (on && FP.Models.ctx.regEmis) FP.Models.ctx.regEmis(m); return m; };
  const dark = () => std('#2a2a2f', { roughness: 0.4, metalness: 0.6 }), brass = () => std('#c9a24e', { roughness: 0.3, metalness: 0.85 }), wood = () => std('#8a6a4a', { roughness: 0.75 });
  const strut = (g, x0, y0, z0, x1, y1, z1, r, m) => { // cilindro entre dos puntos
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), d = b.clone().sub(a), len = d.length();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), m); s.position.copy(a.clone().add(b).multiplyScalar(0.5));
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); s.castShadow = true; g.add(s); return s;
  };

  B.tripod_lamp = (w, d, it) => {
    const g = G();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; strut(g, Math.cos(a) * w * 0.46, 0.02, Math.sin(a) * w * 0.46, 0, 1.25, 0, 0.013, wood()); }
    cyl(g, 0.225, 0.3, glow(it, '#f3e3c3', 1.0), 0, 1.22, 0, 0.19, 24); sph(g, 0.05, bulb(it), 0, 1.4, 0);
    return g;
  };
  B.arc_lamp = (w, d, it) => {
    const g = G(), m = dark();
    cyl(g, 0.17, 0.05, std('#d9d4cc', { roughness: 0.3 }), 0, 0, -d / 2 + 0.28, 0.17, 24); cyl(g, 0.014, 0.04, m, 0, 0.05, -d / 2 + 0.28);
    let prev = [0, 0.05, -d / 2 + 0.28];
    for (let i = 1; i <= 14; i++) { const t = i / 14, y = 0.05 + Math.sin(t * Math.PI * 0.62) * 2.05, z = -d / 2 + 0.28 + t * (d - 0.55) * 1.0; strut(g, prev[0], prev[1], prev[2], 0, y, z, 0.013, m); prev = [0, y, z]; }
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glow(it, '#f3e3c3', 1.0)); sh.position.set(0, prev[1] - 0.06, prev[2]); sh.rotation.x = Math.PI; sh.castShadow = true; g.add(sh);
    sph(g, 0.05, bulb(it), 0, prev[1] - 0.08, prev[2]);
    return g;
  };
  B.table_lamp = (w, d, it) => {
    const g = G(), e = it.elev != null ? it.elev : 0.55;
    sph(g, 0.085, std('#e8e2d8', { roughness: 0.25 }), 0, e + 0.09, 0, 1, 1.1, 1); cyl(g, 0.014, 0.12, brass(), 0, e + 0.17, 0);
    cyl(g, 0.15, 0.2, glow(it, '#f3e3c3', 0.9), 0, e + 0.24, 0, 0.09, 24); sph(g, 0.03, bulb(it), 0, e + 0.3, 0);
    return g;
  };
  B.desk_lamp = (w, d, it) => {
    const g = G(), e = it.elev != null ? it.elev : 0.76, m = dark();
    cyl(g, 0.08, 0.02, m, 0, e, 0.02, 0.08); strut(g, 0, e + 0.02, 0.02, 0, e + 0.28, -0.03, 0.007, m); strut(g, 0, e + 0.28, -0.03, 0, e + 0.34, 0.1, 0.007, m);
    const head = cyl(g, 0.075, 0.1, glow(it, '#f1ece2', 1.0), 0, 0, 0, 0.03, 18); head.position.set(0, e + 0.33, 0.12); head.rotation.x = 2.2;
    return g;
  };
  B.chandelier = (w, d, it) => {
    const g = G(), br = brass(), top = CEIL;
    cyl(g, 0.012, 0.6, br, 0, top - 0.6, 0); cyl(g, 0.07, 0.03, br, 0, top - 0.03, 0); sph(g, 0.06, br, 0, top - 0.68, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 0.4, 0.012, 8, 40), br); ring.rotation.x = Math.PI / 2; ring.position.y = top - 0.85; g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(w * 0.22, 0.01, 8, 32), br); ring2.rotation.x = Math.PI / 2; ring2.position.y = top - 0.72; g.add(ring2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, x = Math.cos(a) * w * 0.4, z = Math.sin(a) * w * 0.4;
      strut(g, 0, top - 0.68, 0, x, top - 0.85, z, 0.008, br); cyl(g, 0.018, 0.12, std('#f3efe6', { roughness: 0.5 }), x, top - 0.85, z);
      sph(g, 0.022, bulb(it), x, top - 0.71, z, 1, 1.5, 1);
      for (let k = 0; k < 2; k++) sph(g, 0.012, std('#e8f1ff', { roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.8 }), x * (0.8 - k * 0.3), top - 0.95 - k * 0.05, z * (0.8 - k * 0.3), 1, 1.4, 1);
    }
    sph(g, 0.03, bulb(it), 0, top - 0.78, 0);
    return g;
  };
  B.pendant3 = (w, d, it) => {
    const g = G(), m = dark();
    box(g, w, 0.04, 0.06, m, 0, CEIL - 0.04, 0, 0.01);
    [[-0.32, 0.8], [0, 1.05], [0.32, 0.65]].forEach(([k, drop]) => {
      const x = k * w; cyl(g, 0.006, drop, m, x, CEIL - 0.04 - drop, 0);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glow(it, '#f3e3c3', 0.9)); dome.position.set(x, CEIL - 0.04 - drop - 0.12, 0); dome.castShadow = true; g.add(dome);
      sph(g, 0.04, bulb(it), x, CEIL - 0.04 - drop - 0.14, 0);
    });
    return g;
  };
  B.ceiling_flush = (w, d, it) => { const g = G(); cyl(g, w / 2, 0.09, glow(it, '#f3e3c3', 1.0), 0, CEIL - 0.09, 0, w / 2 - 0.02, 32); cyl(g, w / 2 + 0.01, 0.015, std('#e8e2d8'), 0, CEIL - 0.095, 0); return g; };
  B.track_light = (w, d, it) => {
    const g = G(), m = dark();
    box(g, w, 0.03, 0.05, m, 0, CEIL - 0.03, 0, 0.005);
    [-0.4, 0, 0.4].forEach((k, i) => { const x = k * w * 1.0; const c = cyl(g, 0.045, 0.14, m, x, CEIL - 0.18, 0, 0.04, 14); c.rotation.x = 0.4 + i * 0.05; cyl(g, 0.012, 0.06, m, x, CEIL - 0.09, 0); sph(g, 0.03, bulb(it), x, CEIL - 0.22, 0.04); });
    return g;
  };
  B.downlight = (w, d, it) => { const g = G(); cyl(g, w / 2, 0.012, std('#f4f1ea', { roughness: 0.4 }), 0, CEIL - 0.012, 0); cyl(g, w / 2 - 0.03, 0.01, bulb(it), 0, CEIL - 0.014, 0); return g; };
  B.art_sconce = (w, d, it) => {
    const g = G(), y = it.z || 1.75, m = dark();
    box(g, 0.1, 0.18, 0.02, m, 0, y - 0.09, -d / 2 + 0.01, 0.005);
    strut(g, 0, y, -d / 2 + 0.02, 0, y + 0.02, 0.06, 0.008, m);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.18, 20, 1, true), glow(it, '#f3e3c3', 1.0)); sh.position.set(0, y + 0.05, 0.1); g.add(sh);
    sph(g, 0.025, bulb(it), 0, y + 0.05, 0.1);
    return g;
  };
  // los modelos que ya existían: ahora respetan el estado (encendida/apagada) y el tono
  B.floorlamp = (w, d, it) => { const g = G(), br = brass(); cyl(g, 0.14, 0.02, br, 0, 0, 0, 0.14); cyl(g, 0.012, 1.4, br, 0, 0.02, 0); cyl(g, 0.17, 0.26, glow(it, '#f3e3c3', 1.0), 0, 1.3, 0, 0.11, 24); sph(g, 0.035, bulb(it), 0, 1.42, 0); return g; };
  B.pendant = (w, d, it) => {
    const g = G(), m = dark();
    cyl(g, 0.012, 0.9, m, 0, CEIL - 0.9, 0); cyl(g, 0.06, 0.03, m, 0, CEIL - 0.03, 0);
    cyl(g, w / 2, 0.28, glow(it, '#f3e3c3', 0.9), 0, CEIL - 1.2, 0, 0.08, 24); sph(g, 0.06, bulb(it), 0, CEIL - 1.14, 0);
    return g;
  };
  B.glamp = (w, d, it) => { const g = G(), m = dark(); cyl(g, 0.05, 0.05, m, 0, 0, 0); cyl(g, 0.018, 0.8, m, 0, 0.05, 0); sph(g, 0.1, glow(it, '#fff2c0', 1.3), 0, 0.92, 0, 1, 1.2, 1); cyl(g, 0.12, 0.02, m, 0, 1.06, 0, 0.05); return g; };
})();

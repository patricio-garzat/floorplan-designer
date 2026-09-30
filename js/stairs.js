/* stairs.js — escaleras para casas de varios niveles (recta, en L y de caracol). Suben al nivel de arriba y le abren el hueco en el piso. */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;
  const STEPS = 16, HIGH = FP.Levels.HEIGHT;

  const arrow = (g, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, a = 0.14;
    return g.line(x1, y1, x2, y2, { soft: 1 }) + g.line(x2, y2, x2 - ux * a - uy * a * 0.6, y2 - uy * a + ux * a * 0.6, { soft: 1 }) + g.line(x2, y2, x2 - ux * a + uy * a * 0.6, y2 - uy * a - ux * a * 0.6, { soft: 1 });
  };
  const D = {
    straight: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#ece7df', { hair: 1 });
      for (let i = 1; i < STEPS; i++) s += g.line(-w / 2, h / 2 - (h * i) / STEPS, w / 2, h / 2 - (h * i) / STEPS, { soft: 1 });
      return s + arrow(g, 0, h / 2 - 0.15, 0, -h / 2 + 0.3) + g.rect(-w / 2, -h / 2, w, h, '#ffffff', { nf: 1 });
    },
    L: (w, h, g) => {
      const b = 0.95;
      let s = g.path(`M${-w / 2} ${-h / 2}H${w / 2}V${-h / 2 + b}H${-w / 2 + b}V${h / 2}H${-w / 2}Z`, '#ece7df');
      for (let i = 1; i < 8; i++) s += g.line(-w / 2, h / 2 - ((h - b) * i) / 8, -w / 2 + b, h / 2 - ((h - b) * i) / 8, { soft: 1 });
      for (let i = 1; i < 8; i++) s += g.line(-w / 2 + b + ((w - b) * i) / 8, -h / 2, -w / 2 + b + ((w - b) * i) / 8, -h / 2 + b, { soft: 1 });
      s += g.line(-w / 2 + b, -h / 2, -w / 2 + b, -h / 2 + b, { soft: 1 }) + g.line(-w / 2, -h / 2 + b, -w / 2 + b, -h / 2 + b, { soft: 1 });
      return s + arrow(g, -w / 2 + b / 2, h / 2 - 0.15, -w / 2 + b / 2, -h / 2 + b * 0.75) + arrow(g, -w / 2 + b * 0.6, -h / 2 + b / 2, w / 2 - 0.25, -h / 2 + b / 2);
    },
    spiral: (w, h, g) => {
      let s = g.circ(0, 0, w / 2, '#ece7df', { hair: 1 });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += g.line(Math.cos(a) * 0.1, Math.sin(a) * 0.1, Math.cos(a) * w / 2, Math.sin(a) * w / 2, { soft: 1 }); }
      return s + g.circ(0, 0, 0.1, '#b8b2a8', { hair: 1 }) + arrow(g, w * 0.3, w * 0.3, w * 0.36, -w * 0.06);
    },
  };
  I.stairs_straight = { name: 'Escalera recta', w: 1.0, h: 3.2, z: HIGH, c: '#ece7df', draw: D.straight };
  I.stairs_L = { name: 'Escalera en L', w: 2.3, h: 2.9, z: HIGH, c: '#ece7df', draw: D.L };
  I.stairs_spiral = { name: 'Escalera de caracol', w: 1.7, h: 1.7, z: HIGH, c: '#ece7df', draw: D.spiral };
  F.CATS.splice(F.CATS.findIndex((c) => c.id === 'comedor'), 0, { id: 'escaleras', name: 'Escaleras', items: ['stairs_straight', 'stairs_L', 'stairs_spiral'] });

  /** Dirección de llegada (local) de cada escalera: hacia dónde se sale al piso de arriba. */
  FP.Stairs = {
    LOCAL_DIR: { stairs_straight: [0, -1], stairs_L: [1, 0], stairs_spiral: null },
  };

  /* ---------- 3D ---------- */
  const H = FP.Models.helpers, B = FP.Models.B, { box, cyl, G } = H;
  FP.Models.ctx = FP.Models.ctx || { up: true };
  const tread = () => H.M().oak, riser = () => H.M().white;
  const heightOf = () => (FP.Models.ctx.up ? HIGH : 1.0);

  B.stairs_straight = (w, d) => {
    const g = G(), Ht = heightOf(), rise = Ht / STEPS, run = d / STEPS;
    for (let i = 0; i < STEPS; i++) {
      const z0 = d / 2 - (i + 1) * run;
      box(g, w, (i + 1) * rise - 0.04, run, riser(), 0, 0, z0 + run / 2, 0.004);
      box(g, w + 0.02, 0.04, run + 0.03, tread(), 0, (i + 1) * rise - 0.04, z0 + run / 2 - 0.005, 0.006);
    }
    rails(g, w / 2 - 0.03, d / 2, -d / 2, Ht);
    return g;
  };
  /** Pasamanos inclinado + postes a lo largo de una rampa (de z=zA abajo a z=zB arriba). */
  function rails(g, x, zA, zB, Ht) {
    const M = H.M(), L = Math.hypot(zA - zB, Ht), ang = Math.atan2(Ht, Math.abs(zA - zB));
    const r = box(g, 0.05, 0.04, L, M.blackPlastic, x, 0, (zA + zB) / 2, 0.01);
    r.position.y = Ht / 2 + 0.92; r.rotation.x = zA > zB ? ang : -ang;
    const n = Math.max(3, Math.round(Math.abs(zA - zB) / 0.4));
    for (let i = 0; i <= n; i++) { const t = i / n, y = Ht * t; cyl(g, 0.012, 0.9, M.blackPlastic, x, y, zA + (zB - zA) * t); }
  }
  B.stairs_L = (w, d) => {
    const g = G(), Ht = heightOf(), rise = Ht / STEPS, b = 0.95;
    const n1 = 7, n2 = 8, run1 = (d - b) / n1, run2 = (w - b) / n2, x0 = -w / 2;
    for (let i = 0; i < n1; i++) {
      const z0 = d / 2 - (i + 1) * run1;
      box(g, b, (i + 1) * rise - 0.04, run1, riser(), x0 + b / 2, 0, z0 + run1 / 2, 0.004);
      box(g, b + 0.02, 0.04, run1 + 0.03, tread(), x0 + b / 2, (i + 1) * rise - 0.04, z0 + run1 / 2 - 0.005, 0.006);
    }
    box(g, b, 8 * rise - 0.04, b, riser(), x0 + b / 2, 0, -d / 2 + b / 2, 0.004);
    box(g, b + 0.02, 0.04, b + 0.02, tread(), x0 + b / 2, 8 * rise - 0.04, -d / 2 + b / 2, 0.006);
    for (let i = 0; i < n2; i++) {
      const xs = x0 + b + i * run2, h = (9 + i) * rise;
      box(g, run2, h - 0.04, b, riser(), xs + run2 / 2, 0, -d / 2 + b / 2, 0.004);
      box(g, run2 + 0.03, 0.04, b + 0.02, tread(), xs + run2 / 2 - 0.005, h - 0.04, -d / 2 + b / 2, 0.006);
    }
    return g;
  };
  B.stairs_spiral = (w) => {
    const g = G(), M = H.M(), Ht = heightOf(), rise = Ht / STEPS, R = w / 2;
    cyl(g, 0.07, Ht, M.steel, 0, 0, 0);
    for (let i = 0; i < STEPS; i++) {
      const a = (i / STEPS) * Math.PI * 1.85 + 0.4, y = (i + 1) * rise - 0.04;
      const s = box(g, R, 0.04, 0.46, tread(), 0, y, 0, 0.006);
      s.geometry = s.geometry.clone(); s.geometry.translate(R / 2, 0, 0);
      s.rotation.y = -a;
      const col = cyl(g, 0.01, 0.9, M.blackPlastic, Math.cos(a) * (R - 0.04), y, Math.sin(a) * (R - 0.04));
      void col;
    }
    return g;
  };
})();

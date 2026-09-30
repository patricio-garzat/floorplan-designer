/* snap.js — imán inteligente: alineación a paredes, otros objetos y cuadrícula + líneas guía. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util;
  const GRID = 0.05, T_IN = 0.05, T_OUT = 0.1; // T_* = mitad del grosor de pared
  const rnd = (v) => Math.round(v / GRID) * GRID;

  /** Líneas objetivo verticales (xs) y horizontales (ys).
      k: 'lo' = solo para el borde izquierdo/superior del objeto, 'hi' = derecho/inferior, 'any' = cualquiera. */
  function targets(project, exclude, mode) {
    const ex = exclude || new Set(), W = project.space.w, H = project.space.h, xs = [], ys = [];
    const furn = mode === 'furn';
    if (furn) {
      xs.push({ v: T_OUT, k: 'lo', a: 0, b: H }, { v: W - T_OUT, k: 'hi', a: 0, b: H });
      ys.push({ v: T_OUT, k: 'lo', a: 0, b: W }, { v: H - T_OUT, k: 'hi', a: 0, b: W });
    } else {
      xs.push({ v: 0, k: 'any', a: 0, b: H }, { v: W, k: 'any', a: 0, b: H });
      ys.push({ v: 0, k: 'any', a: 0, b: W }, { v: H, k: 'any', a: 0, b: W });
    }
    const vline = (x, a, b) => {
      if (furn) xs.push({ v: x + T_IN, k: 'lo', a, b }, { v: x - T_IN, k: 'hi', a, b });
      else xs.push({ v: x, k: 'any', a, b });
    };
    const hline = (y, a, b) => {
      if (furn) ys.push({ v: y + T_IN, k: 'lo', a, b }, { v: y - T_IN, k: 'hi', a, b });
      else ys.push({ v: y, k: 'any', a, b });
    };
    project.rooms.forEach((r) => {
      if (ex.has(r.id)) return;
      vline(r.x, r.y, r.y + r.h); vline(r.x + r.w, r.y, r.y + r.h);
      hline(r.y, r.x, r.x + r.w); hline(r.y + r.h, r.x, r.x + r.w);
      if (furn) {
        xs.push({ v: r.x + r.w / 2, k: 'any', a: r.y, b: r.y + r.h });
        ys.push({ v: r.y + r.h / 2, k: 'any', a: r.x, b: r.x + r.w });
      }
    });
    project.walls.forEach((w) => {
      if (ex.has(w.id)) return;
      if (Math.abs(w.x1 - w.x2) < 1e-6) vline(w.x1, Math.min(w.y1, w.y2), Math.max(w.y1, w.y2));
      else if (Math.abs(w.y1 - w.y2) < 1e-6) hline(w.y1, Math.min(w.x1, w.x2), Math.max(w.x1, w.x2));
    });
    if (furn) {
      project.furniture.forEach((f) => {
        if (ex.has(f.id) || f.key.startsWith('art_')) return;
        const b = FP.geom.bbox(f, 'furniture');
        xs.push({ v: b.l, k: 'any', a: b.t, b: b.b }, { v: (b.l + b.r) / 2, k: 'any', a: b.t, b: b.b }, { v: b.r, k: 'any', a: b.t, b: b.b });
        ys.push({ v: b.t, k: 'any', a: b.l, b: b.r }, { v: (b.t + b.b) / 2, k: 'any', a: b.l, b: b.r }, { v: b.b, k: 'any', a: b.l, b: b.r });
      });
    }
    return { xs, ys };
  }

  function match(cands, list, thr) {
    let best = null;
    for (const c of cands) for (const t of list) {
      if (t.k === 'lo' && c.k !== 'lo') continue;
      if (t.k === 'hi' && c.k !== 'hi') continue;
      const d = t.v - c.v, ad = Math.abs(d);
      if (ad <= thr && (!best || ad < best.ad - 1e-9)) best = { d, ad, t, c };
    }
    return best;
  }

  FP.Snap = {
    GRID, rnd,
    /** Ajusta un rectángulo {l,t,r,b}. o = {mode:'room'|'furn', thr, on}. Devuelve {dx,dy,guides}. */
    box(b, exclude, o) {
      const guides = [];
      if (!o.on) return { dx: 0, dy: 0, guides };
      const T = targets(FP.state.project, exclude, o.mode), room = o.mode !== 'furn';
      const cx = [{ v: b.l, k: 'lo' }, { v: b.r, k: 'hi' }], cy = [{ v: b.t, k: 'lo' }, { v: b.b, k: 'hi' }];
      if (!room) { cx.push({ v: (b.l + b.r) / 2, k: 'c' }); cy.push({ v: (b.t + b.b) / 2, k: 'c' }); }
      const mx = match(cx, T.xs, o.thr), my = match(cy, T.ys, o.thr);
      const dx = mx ? mx.d : rnd(b.l) - b.l, dy = my ? my.d : rnd(b.t) - b.t;
      if (mx) guides.push({ axis: 'x', v: mx.t.v, a: Math.min(b.t + dy, mx.t.a), b: Math.max(b.b + dy, mx.t.b) });
      if (my) guides.push({ axis: 'y', v: my.t.v, a: Math.min(b.l + dx, my.t.a), b: Math.max(b.r + dx, my.t.b) });
      return { dx, dy, guides };
    },
    /** Ajusta un solo borde (para redimensionar habitaciones). */
    edge(axis, val, exclude, thr, on) {
      if (!on) return { v: val };
      const T = targets(FP.state.project, exclude, 'room');
      const m = match([{ v: val, k: 'lo' }], axis === 'x' ? T.xs : T.ys, thr);
      if (m) return { v: m.t.v, guide: { axis, v: m.t.v, a: m.t.a, b: m.t.b } };
      return { v: rnd(val) };
    },
    /** Ajusta un punto (paredes, medición): vértices existentes primero, luego líneas y cuadrícula. */
    point(pt, thr, on, exclude) {
      if (!on) return { x: pt.x, y: pt.y, guides: [] };
      const P = FP.state.project, W = P.space.w, H = P.space.h, ex = exclude || new Set();
      const vs = [[0, 0], [W, 0], [W, H], [0, H]];
      P.rooms.forEach((r) => { if (!ex.has(r.id)) vs.push([r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]); });
      P.walls.forEach((w) => { if (!ex.has(w.id)) vs.push([w.x1, w.y1], [w.x2, w.y2]); });
      let best = null;
      vs.forEach((v) => { const d = Math.hypot(v[0] - pt.x, v[1] - pt.y); if (d <= thr * 1.6 && (!best || d < best.d)) best = { d, v }; });
      if (best) return { x: best.v[0], y: best.v[1], guides: [], vertex: true };
      const T = targets(P, ex, 'room'), guides = [];
      const mx = match([{ v: pt.x, k: 'lo' }], T.xs, thr), my = match([{ v: pt.y, k: 'lo' }], T.ys, thr);
      if (mx) guides.push({ axis: 'x', v: mx.t.v, a: mx.t.a, b: mx.t.b });
      if (my) guides.push({ axis: 'y', v: my.t.v, a: my.t.a, b: my.t.b });
      return { x: mx ? mx.t.v : rnd(pt.x), y: my ? my.t.v : rnd(pt.y), guides };
    },
    /** Monta un cuadro sobre la pared más cercana, mirando hacia el lado del cursor. */
    artOnWall(pt, it, thr, on) {
      const hit = FP.Snap.toWall(pt, FP.state.project, thr || 0.8, it.w / 2, on);
      if (!hit) return null;
      const r = U.rad(hit.rot), sg = hit.flip, off = hit.seg.t / 2 + it.h / 2;
      return { x: hit.x - Math.sin(r) * sg * off, y: hit.y + Math.cos(r) * sg * off, rot: U.norm360(hit.rot + (sg < 0 ? 180 : 0)) };
    },
    /** Proyecta un punto sobre la pared más cercana. Devuelve {x,y,rot,flip,seg} o null. */
    toWall(pt, project, thr, half, on) {
      let best = null;
      FP.Walls.segments(project).forEach((s) => {
        if (s.src === 'rail') return;
        const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L = Math.hypot(dx, dy);
        if (L < half * 2 + 0.1) return;
        const ux = dx / L, uy = dy / L;
        const u = (pt.x - s.x1) * ux + (pt.y - s.y1) * uy;
        const perp = Math.abs(-(pt.x - s.x1) * uy + (pt.y - s.y1) * ux);
        const uc = U.clamp(u, 0, L);
        const d = Math.hypot(perp, u - uc);
        if (d <= thr && (!best || d < best.d)) best = { d, s, ux, uy, L, u };
      });
      if (!best) return null;
      const { s, ux, uy, L } = best;
      let u = on ? rnd(best.u) : best.u;
      u = U.clamp(u, half + 0.06, L - half - 0.06);
      const x = s.x1 + ux * u, y = s.y1 + uy * u;
      let rot = U.deg(Math.atan2(uy, ux));
      if (rot > 90) rot -= 180;
      if (rot <= -90) rot += 180;
      const r = U.rad(rot), side = (pt.x - x) * -Math.sin(r) + (pt.y - y) * Math.cos(r);
      return { x, y, rot, flip: side >= 0 ? 1 : -1, seg: s };
    },
  };
})();

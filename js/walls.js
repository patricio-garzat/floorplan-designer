/* walls.js — huella de la casa (rectángulo menos recortes), muro exterior (con tramos borrados),
   bordes de habitaciones y paredes libres. */
(function () {
  'use strict';
  const FP = window.FP, EPS = 0.011;
  const uniq = (arr) => arr.sort((a, b) => a - b).filter((v, i, a) => !i || Math.abs(v - a[i - 1]) > 1e-6);

  const Walls = (FP.Walls = {
    T_OUT: 0.2, // grosor muro exterior (m)
    T_IN: 0.1, // grosor muros interiores (m)

    cuts(project) {
      const W = project.space.w, H = project.space.h;
      return (project.space.cuts || []).map((c) => {
        const x1 = Math.max(0, c.x), y1 = Math.max(0, c.y), x2 = Math.min(W, c.x + c.w), y2 = Math.min(H, c.y + c.h);
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      }).filter((c) => c.w > 0.05 && c.h > 0.05);
    },

    /** { cells:[rects rellenos], outline:[segmentos exteriores fusionados] } */
    footprint(project) {
      const W = project.space.w, H = project.space.h, cuts = Walls.cuts(project);
      if (!cuts.length) {
        return { cells: [{ x: 0, y: 0, w: W, h: H }], outline: [{ x1: 0, y1: 0, x2: W, y2: 0 }, { x1: W, y1: 0, x2: W, y2: H }, { x1: W, y1: H, x2: 0, y2: H }, { x1: 0, y1: H, x2: 0, y2: 0 }] };
      }
      const xs = uniq([0, W].concat(...cuts.map((c) => [c.x, c.x + c.w]))), ys = uniq([0, H].concat(...cuts.map((c) => [c.y, c.y + c.h])));
      const filled = (i, j) => {
        if (i < 0 || j < 0 || i >= xs.length - 1 || j >= ys.length - 1) return false;
        const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
        return !cuts.some((c) => cx > c.x && cx < c.x + c.w && cy > c.y && cy < c.y + c.h);
      };
      const cells = [], hs = [], vs = [];
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
        if (!filled(i, j)) continue;
        cells.push({ x: xs[i], y: ys[j], w: xs[i + 1] - xs[i], h: ys[j + 1] - ys[j] });
        if (!filled(i, j - 1)) hs.push({ y: ys[j], a: xs[i], b: xs[i + 1] });
        if (!filled(i, j + 1)) hs.push({ y: ys[j + 1], a: xs[i], b: xs[i + 1] });
        if (!filled(i - 1, j)) vs.push({ x: xs[i], a: ys[j], b: ys[j + 1] });
        if (!filled(i + 1, j)) vs.push({ x: xs[i + 1], a: ys[j], b: ys[j + 1] });
      }
      const merge = (list, key) => {
        list.sort((p, q) => p[key] - q[key] || p.a - q.a);
        const out = [];
        list.forEach((s) => { const l = out[out.length - 1]; if (l && Math.abs(l[key] - s[key]) < 1e-6 && Math.abs(l.b - s.a) < 1e-6) l.b = s.b; else out.push({ [key]: s[key], a: s.a, b: s.b }); });
        return out;
      };
      const outline = merge(hs, 'y').map((s) => ({ x1: s.a, y1: s.y, x2: s.b, y2: s.y })).concat(merge(vs, 'x').map((s) => ({ x1: s.x, y1: s.a, x2: s.x, y2: s.b })));
      return { cells, outline };
    },
    outline: (project) => Walls.footprint(project).outline,

    /** ¿Este tipo de habitación debe quedarse dentro de los muros de la casa? (balcón, terraza y cochera pueden salir) */
    isInner: (type) => type !== 'balcon' && type !== 'terraza' && type !== 'cochera',
    /** ¿El rectángulo invade alguna zona recortada (fuera de los muros de la casa)? */
    overlapsCut(project, r) {
      return Walls.cuts(project).some((c) => r.x < c.x + c.w - 0.005 && r.x + r.w > c.x + 0.005 && r.y < c.y + c.h - 0.005 && r.y + r.h > c.y + 0.005);
    },
    /** Empuja un rectángulo fuera de las zonas recortadas por el camino más corto. Devuelve {x,y} o null si no cabe. */
    pushOut(project, r) {
      const W = project.space.w, H = project.space.h, cuts = Walls.cuts(project);
      let x = r.x, y = r.y;
      for (let it = 0; it < 8; it++) {
        const c = cuts.find((q) => x < q.x + q.w - 0.005 && x + r.w > q.x + 0.005 && y < q.y + q.h - 0.005 && y + r.h > q.y + 0.005);
        if (!c) return { x, y };
        const opts = [[c.x - (x + r.w), 0], [c.x + c.w - x, 0], [0, c.y - (y + r.h)], [0, c.y + c.h - y]]
          .filter(([dx, dy]) => x + dx >= -1e-6 && x + dx + r.w <= W + 1e-6 && y + dy >= -1e-6 && y + dy + r.h <= H + 1e-6)
          .sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
        if (!opts.length) return null;
        x += opts[0][0]; y += opts[0][1];
      }
      return null;
    },
    /** ¿El punto cae dentro de la huella de la casa? */
    inside(project, x, y) { return Walls.footprint(project).cells.some((c) => x >= c.x - 1e-6 && x <= c.x + c.w + 1e-6 && y >= c.y - 1e-6 && y <= c.y + c.h + 1e-6); },

    /** Polígono de ángulos rectos (puntos en metros, ≥ 0) -> { w, h, cuts }: la base es la caja que lo contiene y los recortes son lo que queda fuera. */
    shapeToSpace(pts) {
      if (!pts || pts.length < 4) return null;
      const r2 = (v) => Math.round(v * 100) / 100, W = r2(Math.max(...pts.map((p) => p.x))), H = r2(Math.max(...pts.map((p) => p.y)));
      const xs = uniq([0, W].concat(pts.map((p) => r2(p.x)))), ys = uniq([0, H].concat(pts.map((p) => r2(p.y))));
      const inside = (cx, cy) => {
        let c = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const a = pts[i], b = pts[j];
          if ((a.y > cy) !== (b.y > cy) && cx < ((b.x - a.x) * (cy - a.y)) / (b.y - a.y) + a.x) c = !c;
        }
        return c;
      };
      const nx = xs.length - 1, ny = ys.length - 1, empty = [];
      let filled = 0;
      for (let j = 0; j < ny; j++) { empty.push([]); for (let i = 0; i < nx; i++) { const e = !inside((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2); empty[j].push(e); if (!e) filled += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]); } }
      if (filled < 1) return null;
      // tramos horizontales vacíos por fila, luego se fusionan hacia abajo si tienen el mismo ancho
      const runs = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        if (!empty[j][i]) continue;
        let k = i; while (k + 1 < nx && empty[j][k + 1]) k++;
        runs.push({ i0: i, i1: k, j0: j, j1: j }); i = k;
      }
      const cuts = [];
      runs.forEach((r) => {
        const m = cuts.find((c) => c.i0 === r.i0 && c.i1 === r.i1 && c.j1 === r.j0 - 1);
        if (m) m.j1 = r.j1; else cuts.push(Object.assign({}, r));
      });
      return { w: W, h: H, cuts: cuts.map((c) => ({ x: xs[c.i0], y: ys[c.j0], w: r2(xs[c.i1 + 1] - xs[c.i0]), h: r2(ys[c.j1 + 1] - ys[c.j0]) })) };
    },

    /** Resta los tramos borrados a un segmento axis-aligned; devuelve las piezas restantes. */
    subtract(seg, gaps) {
      const horiz = Math.abs(seg.y1 - seg.y2) < 1e-6;
      if (!horiz && Math.abs(seg.x1 - seg.x2) > 1e-6) return [seg];
      const c = horiz ? seg.y1 : seg.x1;
      let pieces = [[Math.min(horiz ? seg.x1 : seg.y1, horiz ? seg.x2 : seg.y2), Math.max(horiz ? seg.x1 : seg.y1, horiz ? seg.x2 : seg.y2)]];
      (gaps || []).forEach((g) => {
        const gh = Math.abs(g.y1 - g.y2) < 1e-6;
        if (gh !== horiz || Math.abs((gh ? g.y1 : g.x1) - c) > EPS) return;
        const ga = Math.min(gh ? g.x1 : g.y1, gh ? g.x2 : g.y2), gb = Math.max(gh ? g.x1 : g.y1, gh ? g.x2 : g.y2), next = [];
        pieces.forEach(([a, b]) => { if (gb <= a || ga >= b) next.push([a, b]); else { if (ga > a) next.push([a, ga]); if (gb < b) next.push([gb, b]); } });
        pieces = next;
      });
      return pieces.filter(([a, b]) => b - a > 0.02).map(([a, b]) => (horiz ? { x1: a, y1: c, x2: b, y2: c } : { x1: c, y1: a, x2: c, y2: b }));
    },
    /** Muro exterior sin los tramos borrados. */
    boundary(project) {
      const out = [];
      Walls.outline(project).forEach((seg) => Walls.subtract(seg, project.space.gaps).forEach((p) => out.push(p)));
      return out;
    },

    /** ¿Un borde (axis-aligned) coincide con el muro exterior? Sirve para calcular el grosor visible. */
    onOutline(project, x1, y1, x2, y2) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, horiz = Math.abs(y1 - y2) < 1e-6;
      return Walls.outline(project).some((s) => {
        const sh = Math.abs(s.y1 - s.y2) < 1e-6;
        if (sh !== horiz) return false;
        return horiz ? Math.abs(s.y1 - y1) < 0.01 && mx >= Math.min(s.x1, s.x2) - 0.01 && mx <= Math.max(s.x1, s.x2) + 0.01
          : Math.abs(s.x1 - x1) < 0.01 && my >= Math.min(s.y1, s.y2) - 0.01 && my <= Math.max(s.y1, s.y2) + 0.01;
      });
    },

    /** Todas las líneas de pared del proyecto, útiles para snap, puertas/ventanas y 3D. */
    segments(project) {
      const a = [];
      Walls.boundary(project).forEach((s) => a.push({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, t: Walls.T_OUT, src: 'boundary' }));
      project.rooms.forEach((r) => {
        if (Walls.isOutdoor(project, r)) { // barandal: todo el perímetro salvo el lado que toca el muro de la casa
          [[r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h], [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y]].forEach(([x1, y1, x2, y2]) => {
            if ((r.rail || (r.type === 'cochera' ? 'none' : 'glass')) !== 'none' && !Walls.onOutline(project, x1, y1, x2, y2)) a.push({ x1, y1, x2, y2, t: 0.05, src: 'rail', id: r.id });
          });
          return;
        }
        const E = (x1, y1, x2, y2) => Walls.subtract({ x1, y1, x2, y2 }, project.space.gaps).forEach((p) => a.push({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, t: Walls.T_IN, src: 'room', id: r.id }));
        E(r.x, r.y, r.x + r.w, r.y); E(r.x + r.w, r.y, r.x + r.w, r.y + r.h);
        E(r.x + r.w, r.y + r.h, r.x, r.y + r.h); E(r.x, r.y + r.h, r.x, r.y);
      });
      project.walls.forEach((w) => Walls.subtract({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 }, project.space.gaps).forEach((p) => a.push({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, t: Walls.T_IN, src: 'wall', id: w.id })));
      return a;
    },

    /** Todas las líneas de pared (rectas) SIN restar los tramos borrados: sirve para elegir qué borrar. */
    lines(project) {
      const out = Walls.outline(project).map((s) => Object.assign({}, s));
      project.rooms.forEach((r) => {
        if (Walls.isOutdoor(project, r)) return;
        out.push({ x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y }, { x1: r.x + r.w, y1: r.y, x2: r.x + r.w, y2: r.y + r.h }, { x1: r.x + r.w, y1: r.y + r.h, x2: r.x, y2: r.y + r.h }, { x1: r.x, y1: r.y + r.h, x2: r.x, y2: r.y });
      });
      project.walls.forEach((w) => { if (Math.abs(w.x1 - w.x2) < 1e-6 || Math.abs(w.y1 - w.y2) < 1e-6) out.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 }); });
      return out;
    },
    /** Tramos borrados que caen sobre un borde, como intervalos [a,b] medidos desde su inicio. */
    gapIntervals(project, x1, y1, x2, y2) {
      const dx = x2 - x1, dz = y2 - y1, L = Math.hypot(dx, dz);
      if (L < 1e-6) return [];
      const ux = dx / L, uz = dz / L, horiz = Math.abs(dz) < 1e-6, out = [];
      (project.space.gaps || []).forEach((g) => {
        const gh = Math.abs(g.y1 - g.y2) < 1e-6;
        if (gh !== horiz || Math.abs((gh ? g.y1 : g.x1) - (horiz ? y1 : x1)) > EPS) return;
        const a = (g.x1 - x1) * ux + (g.y1 - y1) * uz, b = (g.x2 - x1) * ux + (g.y2 - y1) * uz, lo = Math.min(a, b), hi = Math.max(a, b);
        if (hi > 0 && lo < L) out.push([Math.max(0, lo), Math.min(L, hi)]);
      });
      return out;
    },
    /** Balcón, o terraza cuyo centro queda fuera de la base: se dibuja con barandal en vez de muros. */
    isOutdoor(project, r) {
      if (r.type === 'balcon') return true;
      if (r.type !== 'terraza' && r.type !== 'cochera') return false;
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      return !Walls.footprint(project).cells.some((c) => cx > c.x && cx < c.x + c.w && cy > c.y && cy < c.y + c.h);
    },
    /** Caja que contiene la casa y todas las habitaciones (incluidos balcones fuera de la base). */
    bounds(project) {
      let x0 = 0, y0 = 0, x1 = project.space.w, y1 = project.space.h;
      project.rooms.forEach((r) => { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
      return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
    },
    length: (w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1),
    create(x1, y1, x2, y2) { return { id: FP.util.uid(), x1, y1, x2, y2 }; },
  });
})();

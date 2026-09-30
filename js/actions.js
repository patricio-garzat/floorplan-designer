/* actions.js — operaciones sobre la selección: borrar, duplicar, copiar/pegar, rotar, mover con flechas. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, st = FP.state, G = FP.geom;
  let clipboard = null, pasteN = 0;

  function selected() { return st.sel.map(FP.find).filter(Boolean); }
  function fitInside(items) {
    // mantiene cada objeto dentro de sus límites (muebles y balcones pueden estar fuera de la base)
    const P = st.project;
    let ax = -1e9, bx = 1e9, ay = -1e9, by = 1e9;
    items.forEach(({ obj, coll }) => { const q = G.bbox(obj, coll), LM = FP.limits(P, coll, obj); ax = Math.max(ax, LM.x0 - q.l); bx = Math.min(bx, LM.x1 - q.r); ay = Math.max(ay, LM.y0 - q.t); by = Math.min(by, LM.y1 - q.b); });
    const dx = Math.min(bx, Math.max(ax, 0)), dy = Math.min(by, Math.max(ay, 0));
    if (dx || dy) items.forEach(({ obj, coll }) => G.translate(obj, coll, dx, dy));
  }
  function offsetFor(obj, coll, d) {
    if (coll === 'openings') { const a = U.rad(obj.rot || 0); return { dx: Math.cos(a) * (obj.w + 0.05), dy: Math.sin(a) * (obj.w + 0.05) }; }
    return { dx: d, dy: d };
  }
  function cloneItems(items, d) {
    const out = [];
    const seen = new Set(items.map((i) => i.obj.id));
    const all = items.slice();
    // duplicar una habitación arrastra sus muebles y puertas/ventanas
    items.forEach(({ obj, coll }) => {
      if (coll !== 'rooms') return;
      const c = G.children(st.project, obj);
      c.furniture.forEach((o) => { if (!seen.has(o.id)) { seen.add(o.id); all.push({ obj: o, coll: 'furniture' }); } });
      c.openings.forEach((o) => { if (!seen.has(o.id)) { seen.add(o.id); all.push({ obj: o, coll: 'openings' }); } });
    });
    all.forEach(({ obj, coll }) => {
      const c = U.clone(obj);
      c.id = U.uid();
      const o = offsetFor(c, coll, d);
      G.translate(c, coll, o.dx, o.dy);
      if (coll === 'rooms') c.name = FP.Rooms.uniqueName(st.project, c.type);
      out.push({ obj: c, coll });
    });
    return out;
  }

  FP.Actions = {
    selected,
    remove() {
      const items = selected();
      if (!items.length) return;
      const ids = new Set(items.map((i) => i.obj.id));
      FP.COLLS.forEach((c) => { st.project[c] = st.project[c].filter((o) => !ids.has(o.id)); });
      st.sel = [];
      FP.emit('selection');
      FP.commit();
      FP.render();
    },
    duplicate() {
      const items = selected();
      if (!items.length) return;
      const copies = cloneItems(items, 0.3);
      fitInside(copies);
      copies.forEach(({ obj, coll }) => st.project[coll].push(obj));
      FP.select(copies.map((c) => c.obj.id));
      FP.commit();
      FP.render();
    },
    copy() {
      const items = selected();
      if (!items.length) return false;
      clipboard = items.map(({ obj, coll }) => ({ obj: U.clone(obj), coll }));
      pasteN = 0;
      FP.toast('Copiado');
      return true;
    },
    paste() {
      if (!clipboard) return;
      pasteN++;
      const copies = clipboard.map(({ obj, coll }) => {
        const c = U.clone(obj); c.id = U.uid();
        const o = offsetFor(c, coll, 0.3 * pasteN);
        G.translate(c, coll, o.dx, o.dy);
        if (coll === 'rooms') c.name = FP.Rooms.uniqueName(st.project, c.type);
        return { obj: c, coll };
      });
      fitInside(copies);
      copies.forEach(({ obj, coll }) => st.project[coll].push(obj));
      FP.select(copies.map((c) => c.obj.id));
      FP.commit();
      FP.render();
    },
    selectAll() {
      const P = st.project;
      FP.select([].concat(P.rooms, P.walls, P.openings, P.furniture, P.measures).map((o) => o.id));
    },
    /** R: gira muebles 90°, alterna el lado de apertura de puertas/ventanas y gira habitaciones 90°. */
    rotate(dir) {
      const items = selected();
      if (!items.length) return;
      items.forEach(({ obj, coll }) => {
        if (coll === 'furniture') obj.rot = U.norm360((obj.rot || 0) + 90 * (dir || 1));
        else if (coll === 'openings') obj.flip = -obj.flip;
        else if (coll === 'rooms') {
          const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2, w = obj.w;
          obj.w = obj.h; obj.h = w;
          obj.x = U.clamp(cx - obj.w / 2, 0, Math.max(0, st.project.space.w - obj.w));
          obj.y = U.clamp(cy - obj.h / 2, 0, Math.max(0, st.project.space.h - obj.h));
        }
      });
      FP.commit();
      FP.render();
    },
    mirror() {
      const items = selected().filter(({ coll, obj }) => coll === 'furniture' && !obj.key.startsWith('art_'));
      if (!items.length) return;
      items.forEach(({ obj }) => { obj.mirror = !obj.mirror; });
      FP.commit();
      FP.render();
    },
    flipHinge() {
      selected().forEach(({ obj, coll }) => { if (coll === 'openings') obj.mirror = !obj.mirror; });
      FP.commit();
      FP.render();
    },
    nudge(dx, dy) {
      const items = selected();
      if (!items.length) return;
      items.forEach(({ obj, coll }) => G.translate(obj, coll, dx, dy));
      fitInside(items);
      FP.commit();
      FP.render();
    },
  };
})();

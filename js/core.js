/* core.js — namespace, utilidades, estado global, historial (undo/redo) y geometría común.
   Todo el modelo trabaja en METROS. */
(function () {
  'use strict';
  const FP = (window.FP = {});

  /* ---------- utilidades ---------- */
  const U = (FP.util = {
    uid() { return 'i' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); },
    clamp(v, a, b) { return Math.min(b, Math.max(a, v)); },
    n(v) { return +(+v).toFixed(4); },
    fmt(v) { return (+v).toFixed(2); },
    parse(s) { const v = parseFloat(String(s).replace(',', '.')); return isFinite(v) ? v : NaN; },
    esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    rad(d) { return (d * Math.PI) / 180; },
    deg(r) { return (r * 180) / Math.PI; },
    clone(o) { return JSON.parse(JSON.stringify(o)); },
    norm360(d) { d = d % 360; return d < 0 ? d + 360 : d; },
    distSeg(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
      let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    },
    ago(ts) {
      const d = new Date(ts), now = new Date();
      const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
      if (days <= 0) return 'Modificado hoy';
      if (days === 1) return 'Modificado ayer';
      if (days < 7) return 'Modificado hace ' + days + ' días';
      return 'Modificado el ' + d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    },
  });

  /* ---------- bus de eventos ---------- */
  const handlers = {};
  FP.on = (e, fn) => { (handlers[e] = handlers[e] || []).push(fn); };
  FP.emit = (e, d) => { (handlers[e] || []).forEach((fn) => fn(d)); };

  /* ---------- estado ---------- */
  FP.COLLS = ['rooms', 'walls', 'openings', 'furniture', 'measures'];
  const st = (FP.state = {
    project: null,
    tool: 'select', // select | room | wall | door | window | furn | measure
    place: null, // datos del elemento que se va a colocar
    sel: [], // ids seleccionados
    mode: 'plan', // plan | pres | 3d
    showDims: true,
    showGrid: true,
    snap: true,
    view: { x: 0, y: 0, s: 40 }, // px por metro
  });

  FP.newProject = function (o) {
    o = o || {};
    const now = Date.now();
    return {
      id: U.uid(),
      name: o.name || (o.kind === 'casa' ? 'Mi Casa' : 'Mi Departamento'),
      kind: o.kind || 'departamento',
      space: { w: o.w || 10, h: o.h || 8 },
      rooms: [], walls: [], openings: [], furniture: [], measures: [],
      levels: [{ id: U.uid(), name: 'Planta baja' }], level: 0,
      created: now, modified: now,
    };
  };

  FP.setProject = function (p) {
    st.project = p;
    st.sel = [];
    st.tool = 'select';
    st.place = null;
    FP.history.reset();
    FP.emit('project');
    FP.emit('selection');
    FP.emit('tool');
  };

  FP.find = function (id) {
    const p = st.project;
    if (!p) return null;
    for (const c of FP.COLLS) {
      const o = p[c].find((x) => x.id === id);
      if (o) return { obj: o, coll: c };
    }
    return null;
  };

  FP.select = function (ids) {
    st.sel = ids.filter((id) => FP.find(id));
    FP.emit('selection');
  };

  FP.setTool = function (tool, place) {
    st.tool = tool;
    st.place = place || null;
    FP.emit('tool');
  };

  FP.stats = function () {
    const p = st.project, vs = FP.Levels ? FP.Levels.views(p) : [p];
    const sum = (f) => vs.reduce((a, v) => a + f(v), 0);
    return {
      area: sum((v) => FP.Walls.footprint(v).cells.reduce((a, c) => a + c.w * c.h, 0)),
      rooms: sum((v) => v.rooms.length),
      baths: sum((v) => v.rooms.filter((r) => r.type === 'bano').length),
      furniture: sum((v) => v.furniture.filter((f) => !f.key.startsWith('art_')).length),
      roomsArea: sum((v) => v.rooms.reduce((a, r) => a + r.w * r.h, 0)),
    };
  };

  /* ---------- historial ---------- */
  const H = (FP.history = {
    stack: [], idx: -1,
    snap() {
      const p = st.project;
      return JSON.stringify({ space: p.space, rooms: p.rooms, walls: p.walls, openings: p.openings, furniture: p.furniture, measures: p.measures, levels: p.levels, level: p.level });
    },
    reset() { H.stack = [H.snap()]; H.idx = 0; },
    push() {
      const s = H.snap();
      if (s === H.stack[H.idx]) return false;
      H.stack = H.stack.slice(0, H.idx + 1);
      H.stack.push(s);
      if (H.stack.length > 150) H.stack.shift();
      H.idx = H.stack.length - 1;
      return true;
    },
    restore(i) {
      Object.assign(st.project, JSON.parse(H.stack[i]));
      st.sel = st.sel.filter((id) => FP.find(id));
      st.project.modified = Date.now();
      FP.emit('restore');
      FP.emit('selection');
      FP.emit('change');
    },
    undo() { if (H.canUndo()) { H.idx--; H.restore(H.idx); } },
    redo() { if (H.canRedo()) { H.idx++; H.restore(H.idx); } },
    canUndo() { return H.idx > 0; },
    canRedo() { return H.idx < H.stack.length - 1; },
  });

  /** Registra el estado actual como un paso de historial. */
  FP.commit = function () {
    if (H.push()) {
      st.project.modified = Date.now();
      FP.emit('change');
    }
  };
  /** Descarta cambios no confirmados (p. ej. Esc durante un arrastre). */
  FP.revert = function () { H.restore(H.idx); };
  FP.render = () => FP.emit('render');
  /** Límites donde puede estar un objeto: muebles, balcones y terrazas pueden salir de la base de la casa. */
  FP.limits = function (project, coll, obj) {
    const W = project.space.w, H = project.space.h;
    const ext = coll === 'furniture' || (coll === 'rooms' && obj && (obj.type === 'balcon' || obj.type === 'terraza' || obj.type === 'cochera' || obj.type === 'jardin'));
    if (coll === 'rooms' && obj && obj.type === 'jardin') return { x0: -30, y0: -30, x1: W + 30, y1: H + 30 };
    return ext ? { x0: -8, y0: -8, x1: W + 8, y1: H + 8 } : { x0: 0, y0: 0, x1: W, y1: H };
  };

  /* ---------- geometría ---------- */
  FP.geom = {
    bbox(o, coll) {
      if (coll === 'rooms') return { l: o.x, t: o.y, r: o.x + o.w, b: o.y + o.h };
      if (coll === 'furniture' || coll === 'openings') {
        const w = o.w, h = coll === 'openings' ? 0.2 : o.h;
        const a = U.rad(o.rot || 0), c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
        const hx = (c * w) / 2 + (s * h) / 2, hy = (s * w) / 2 + (c * h) / 2;
        return { l: o.x - hx, t: o.y - hy, r: o.x + hx, b: o.y + hy };
      }
      return { l: Math.min(o.x1, o.x2), t: Math.min(o.y1, o.y2), r: Math.max(o.x1, o.x2), b: Math.max(o.y1, o.y2) };
    },
    translate(o, coll, dx, dy) {
      if (coll === 'walls' || coll === 'measures') { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
      else { o.x += dx; o.y += dy; }
    },
    /** Elementos "pegados" a una habitación: muebles dentro y puertas/ventanas en sus bordes. */
    children(project, r) {
      const furn = project.furniture.filter((f) => f.x > r.x && f.x < r.x + r.w && f.y > r.y && f.y < r.y + r.h);
      const tol = 0.13;
      const openings = project.openings.filter((o) => {
        const nearV = (Math.abs(o.x - r.x) < tol || Math.abs(o.x - (r.x + r.w)) < tol) && o.y >= r.y - tol && o.y <= r.y + r.h + tol;
        const nearH = (Math.abs(o.y - r.y) < tol || Math.abs(o.y - (r.y + r.h)) < tol) && o.x >= r.x - tol && o.x <= r.x + r.w + tol;
        return nearV || nearH;
      });
      return { furniture: furn, openings };
    },
    toLocal(o, w) {
      const dx = w.x - o.x, dy = w.y - o.y, a = -U.rad(o.rot || 0);
      return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
    },
    toWorld(o, lx, ly) {
      const a = U.rad(o.rot || 0);
      return { x: o.x + lx * Math.cos(a) - ly * Math.sin(a), y: o.y + lx * Math.sin(a) + ly * Math.cos(a) };
    },
  };

  /* ---------- avisos ---------- */
  let toastT = 0;
  FP.toast = function (msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2200);
  };
})();

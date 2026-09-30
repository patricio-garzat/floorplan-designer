/* editor.js — canvas 2D (SVG): zoom/pan, selección, arrastre, redimensionado, herramientas de colocación. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, st = FP.state, G = FP.geom, n = U.n;
  const ACC = FP.Render.ACC;
  const PLACE = ['room', 'door', 'window', 'furn'];

  let svg, gWorld, gScene, gOver, wrap;
  let rafId = 0, sceneDirty = true;
  let drag = null, guides = [], ghost = null, ghostRot = 0, snapDot = null;
  let pinch = null, spaceDown = false, viewTouched = false, wallStart = null, measureStart = null, cursorW = { x: 0, y: 0 };
  const pointers = new Map();

  const thr = () => 10 / st.view.s;
  let shapePts = []; // contorno de la casa que se está dibujando con líneas
  const snapOn = (e) => st.snap && !(e && e.altKey);

  /* ---------- vista ---------- */
  function toWorld(cx, cy) {
    const r = svg.getBoundingClientRect();
    return { x: (cx - r.left - st.view.x) / st.view.s, y: (cy - r.top - st.view.y) / st.view.s };
  }
  function viewCenter() { const r = svg.getBoundingClientRect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); }

  function fit() {
    const P = st.project;
    if (!P || !svg) return;
    const cw = svg.clientWidth, ch = svg.clientHeight;
    if (!cw || !ch) return;
    const mx = cw < 700 ? 34 : 90, my = cw < 700 ? 56 : 84, bd = FP.Walls.bounds(P), W = bd.w, H = bd.h;
    const s = U.clamp(Math.min((cw - mx * 2) / (W + 1.2), (ch - my * 2) / (H + 1.2)), 8, 300);
    st.view.s = s;
    st.view.x = (cw - W * s) / 2 - bd.x0 * s;
    st.view.y = (ch - H * s) / 2 + 6 - bd.y0 * s;
    viewTouched = false;
    FP.emit('view');
    requestRender();
  }
  function zoomAt(cx, cy, f) {
    const r = svg.getBoundingClientRect(), x = cx - r.left, y = cy - r.top, v = st.view;
    const ns = U.clamp(v.s * f, 8, 400), k = ns / v.s;
    v.x = x - (x - v.x) * k; v.y = y - (y - v.y) * k; v.s = ns;
    viewTouched = true;
    FP.emit('view');
    requestRender();
  }
  function zoomBy(f) { const r = svg.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); }

  /* ---------- render ---------- */
  function requestRender(full = true) {
    if (full) sceneDirty = true;
    if (!rafId) rafId = requestAnimationFrame(render);
  }
  function render() {
    rafId = 0;
    if (!st.project || st.mode === '3d') return;
    const v = st.view, px = 1 / v.s;
    gWorld.setAttribute('transform', `translate(${n(v.x)} ${n(v.y)}) scale(${n(v.s)})`);
    if (sceneDirty) {
      sceneDirty = false;
      gScene.innerHTML = FP.Render.scene(st.project, { mode: st.mode === 'pres' ? 'pres' : 'plan', px, showDims: st.showDims, showGrid: st.showGrid });
    }
    gOver.innerHTML = (FP.Levels ? FP.Levels.underlay(st.project) : '') + overlay(px);
  }

  /* ---------- hit test ---------- */
  function hitTest(w) {
    const P = st.project, tol = 6 / st.view.s;
    // cuadros y cortinas van sobre puertas/ventanas: tienen prioridad al hacer clic
    for (let i = P.furniture.length - 1; i >= 0; i--) {
      const f = P.furniture[i];
      if (!f.key.startsWith('art_')) continue;
      const l = G.toLocal(f, w), t = tol * 0.4;
      if (Math.abs(l.x) <= f.w / 2 + t && Math.abs(l.y) <= Math.max(f.h / 2, 0.06) + t) return { id: f.id, coll: 'furniture' };
    }
    for (let i = P.openings.length - 1; i >= 0; i--) {
      const o = P.openings[i], l = G.toLocal(o, w);
      if (Math.abs(l.x) <= o.w / 2 + tol && Math.abs(l.y) <= 0.14 + tol) return { id: o.id, coll: 'openings' };
    }
    for (let i = P.furniture.length - 1; i >= 0; i--) {
      const f = P.furniture[i], l = G.toLocal(f, w), t = tol * 0.4;
      if (Math.abs(l.x) <= f.w / 2 + t && Math.abs(l.y) <= f.h / 2 + t) return { id: f.id, coll: 'furniture' };
    }
    for (let i = P.measures.length - 1; i >= 0; i--) {
      const m = P.measures[i];
      if (U.distSeg(w.x, w.y, m.x1, m.y1, m.x2, m.y2) <= tol * 1.5) return { id: m.id, coll: 'measures' };
    }
    for (let i = P.walls.length - 1; i >= 0; i--) {
      const q = P.walls[i];
      if (U.distSeg(w.x, w.y, q.x1, q.y1, q.x2, q.y2) <= Math.max(0.05, tol)) return { id: q.id, coll: 'walls' };
    }
    let best = null;
    P.rooms.forEach((r) => {
      if (w.x >= r.x - tol && w.x <= r.x + r.w + tol && w.y >= r.y - tol && w.y <= r.y + r.h + tol) {
        if (!best || r.w * r.h <= best.a) best = { id: r.id, coll: 'rooms', a: r.w * r.h };
      }
    });
    return best;
  }

  function handlePoints(obj, coll, px) {
    if (coll === 'rooms') {
      const { x, y, w, h } = obj;
      return [['nw', x, y, 'nwse-resize'], ['n', x + w / 2, y, 'ns-resize'], ['ne', x + w, y, 'nesw-resize'], ['e', x + w, y + h / 2, 'ew-resize'],
        ['se', x + w, y + h, 'nwse-resize'], ['s', x + w / 2, y + h, 'ns-resize'], ['sw', x, y + h, 'nesw-resize'], ['w', x, y + h / 2, 'ew-resize']]
        .map((a) => ({ id: a[0], x: a[1], y: a[2], cur: a[3] }));
    }
    if (coll === 'furniture') {
      const p = G.toWorld(obj, 0, -obj.h / 2 - 26 * px);
      return [{ id: 'rot', x: p.x, y: p.y, cur: 'grab', rot: 1 }];
    }
    if (coll === 'walls' || coll === 'measures') return [{ id: 'p1', x: obj.x1, y: obj.y1, cur: 'move' }, { id: 'p2', x: obj.x2, y: obj.y2, cur: 'move' }];
    return [];
  }
  function handleHit(w) {
    if (st.sel.length !== 1) return null;
    const f = FP.find(st.sel[0]);
    if (!f) return null;
    const px = 1 / st.view.s, r = 10 * px;
    return handlePoints(f.obj, f.coll, px).find((h) => Math.hypot(h.x - w.x, h.y - w.y) <= r) || null;
  }

  /* ---------- ghost (elemento por colocar) ---------- */
  function shiftInto(b, LM) {
    const W = LM.x1, H = LM.y1, X0 = LM.x0, Y0 = LM.y0;
    let dx = 0, dy = 0;
    if (b.r > W) dx = W - b.r;
    if (b.b > H) dy = H - b.b;
    if (b.l + dx < X0) dx = X0 - b.l;
    if (b.t + dy < Y0) dy = Y0 - b.t;
    return { dx, dy };
  }
  function updateGhost(w, e) {
    const P = st.project, pl = st.place, t = st.tool, on = snapOn(e), W = P.space.w, H = P.space.h;
    guides = [];
    if (!pl) { ghost = null; return; }
    if (t === 'room') {
      const def = FP.Rooms.def(pl.type), LM = FP.limits(P, 'rooms', pl), gw = Math.min(def.w, LM.x1 - LM.x0), gh = Math.min(def.h, LM.y1 - LM.y0);
      const b = { l: w.x - gw / 2, t: w.y - gh / 2, r: w.x + gw / 2, b: w.y + gh / 2 };
      const sn = FP.Snap.box(b, null, { mode: 'room', thr: thr(), on });
      guides = sn.guides;
      ghost = { kind: 'room', type: pl.type, x: U.clamp(b.l + sn.dx, LM.x0, LM.x1 - gw), y: U.clamp(b.t + sn.dy, LM.y0, LM.y1 - gh), w: gw, h: gh };
    } else if (t === 'furn') {
      const d = FP.Furniture.def(pl.key);
      const it = { key: pl.key, x: w.x, y: w.y, w: d.w, h: d.h, rot: ghostRot };
      if (d.wall) {
        const a = FP.Snap.artOnWall(w, it, 0.9, on);
        if (a) { ghost = Object.assign({ kind: 'furn', ok: true }, it, a); } else ghost = Object.assign({ kind: 'furn', ok: false }, it);
        return;
      }
      const sn = FP.Snap.box(G.bbox(it, 'furniture'), null, { mode: 'furn', thr: thr(), on });
      it.x += sn.dx; it.y += sn.dy; guides = sn.guides;
      const sh = shiftInto(G.bbox(it, 'furniture'), FP.limits(P, 'furniture'));
      it.x += sh.dx; it.y += sh.dy;
      ghost = Object.assign({ kind: 'furn' }, it);
    } else {
      const s = FP.Openings.style(t, pl.style), hit = FP.Snap.toWall(w, P, 0.6, s.w / 2, on);
      ghost = hit
        ? { kind: t, ok: true, style: s.id, w: s.w, x: hit.x, y: hit.y, rot: hit.rot, flip: hit.flip }
        : { kind: t, ok: false, style: s.id, w: s.w, x: w.x, y: w.y, rot: 0, flip: 1 };
    }
  }
  function finishPlace(id, keep) {
    ghost = null; guides = [];
    FP.commit();
    if (keep) { FP.select([id]); requestRender(); return; }
    FP.setTool('select');
    FP.select([id]);
  }
  function placeGhost(keep) {
    const P = st.project;
    if (!ghost) return;
    if (ghost.kind === 'room') {
      const r = FP.Rooms.create(P, ghost.type, ghost.x, ghost.y, ghost.w, ghost.h);
      P.rooms.push(r);
      finishPlace(r.id, keep);
    } else if (ghost.kind === 'furn') {
      if (ghost.ok === false) { FP.toast('Acércalo a una pared'); return; }
      const f = FP.Furniture.create(ghost.key, ghost.x, ghost.y, ghost.rot);
      P.furniture.push(f);
      finishPlace(f.id, keep);
    } else {
      if (!ghost.ok) { FP.toast('Acércala a una pared'); return; }
      const o = FP.Openings.create(ghost.kind, ghost.style, ghost.x, ghost.y, ghost.rot, ghost.flip);
      P.openings.push(o);
      finishPlace(o.id, false);
    }
  }

  /* ---------- paredes y mediciones ---------- */
  function wallPoint(w, e, from) {
    const P = st.project, on = snapOn(e), s = FP.Snap.point(w, thr(), on);
    let x = s.x, y = s.y;
    guides = s.guides || [];
    snapDot = s.vertex ? { x, y } : null;
    if (from && on && !s.vertex) {
      if (Math.abs(x - from.x) < Math.abs(y - from.y) * 0.12) x = from.x;
      else if (Math.abs(y - from.y) < Math.abs(x - from.x) * 0.12) y = from.y;
    }
    return { x: U.clamp(x, 0, P.space.w), y: U.clamp(y, 0, P.space.h) };
  }
  function finishWall(a, b, chain) {
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.15) { wallStart = null; return; }
    st.project.walls.push(FP.Walls.create(a.x, a.y, b.x, b.y));
    FP.commit();
    wallStart = chain ? { x: b.x, y: b.y } : null;
  }
  function finishMeasure(a, b) {
    measureStart = null;
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.02) return;
    st.project.measures.push({ id: U.uid(), x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    FP.commit();
  }

  /* ---------- recortar la huella / borrar tramos del muro exterior ---------- */
  let eraseHover = null;
  function nearestOutline(w) {
    const P = st.project, lim = Math.max(0.3, 14 / st.view.s), lines = FP.Walls.lines(P);
    const info = (sg) => { const horiz = Math.abs(sg.y1 - sg.y2) < 1e-6; return { horiz, c: horiz ? sg.y1 : sg.x1, lo: Math.min(horiz ? sg.x1 : sg.y1, horiz ? sg.x2 : sg.y2), hi: Math.max(horiz ? sg.x1 : sg.y1, horiz ? sg.x2 : sg.y2) }; };
    let best = null;
    lines.forEach((sg) => {
      const q = info(sg), along = q.horiz ? w.x : w.y, across = q.horiz ? w.y : w.x, t = U.clamp(along, q.lo, q.hi), d = Math.hypot(along - t, across - q.c);
      if (d <= lim && (!best || d < best.d)) best = Object.assign({ d, t }, q);
    });
    if (!best) return null;
    // unir los tramos colineales que se tocan (p. ej. el borde de dos habitaciones seguidas) para poder borrar de corrido
    let lo = best.lo, hi = best.hi, grew = true;
    const same = lines.map(info).filter((q) => q.horiz === best.horiz && Math.abs(q.c - best.c) < 0.011);
    while (grew) { grew = false; same.forEach((q) => { if (q.lo <= hi + 1e-6 && q.hi >= lo - 1e-6 && (q.lo < lo - 1e-6 || q.hi > hi + 1e-6)) { lo = Math.min(lo, q.lo); hi = Math.max(hi, q.hi); grew = true; } }); }
    best.lo = lo; best.hi = hi; best.t = U.clamp(best.t, lo, hi);
    return best;
  }
  const snapAlong = (h, v, on) => {
    let t = U.clamp(v, h.lo, h.hi);
    if (on) { t = FP.Snap.rnd(t); if (Math.abs(t - h.lo) < thr()) t = h.lo; if (Math.abs(t - h.hi) < thr()) t = h.hi; t = U.clamp(t, h.lo, h.hi); }
    return t;
  };
  const gapOf = (h, a, b) => (h.horiz ? { x1: Math.min(a, b), y1: h.c, x2: Math.max(a, b), y2: h.c } : { x1: h.c, y1: Math.min(a, b), x2: h.c, y2: Math.max(a, b) });
  const cutRect = (a, b) => {
    const P = st.project, x1 = U.clamp(Math.min(a.x, b.x), 0, P.space.w), x2 = U.clamp(Math.max(a.x, b.x), 0, P.space.w), y1 = U.clamp(Math.min(a.y, b.y), 0, P.space.h), y2 = U.clamp(Math.max(a.y, b.y), 0, P.space.h);
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };

  /* ---------- eventos ---------- */
  function startPan(e) {
    drag = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: st.view.x, vy: st.view.y, moved: true };
    svg.style.cursor = 'grabbing';
  }
  function startPinch() {
    if (drag && drag.moved && drag.type !== 'pan') FP.revert();
    drag = null; guides = [];
    const p = [...pointers.values()];
    pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, cx: (p[0].x + p[1].x) / 2, cy: (p[0].y + p[1].y) / 2 };
  }
  function doPinch() {
    const p = [...pointers.values()];
    if (p.length < 2) return;
    const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, cx = (p[0].x + p[1].x) / 2, cy = (p[0].y + p[1].y) / 2;
    zoomAt(cx, cy, d / pinch.d);
    st.view.x += cx - pinch.cx; st.view.y += cy - pinch.cy;
    pinch = { d, cx, cy };
    requestRender();
  }

  function startMove(w, hit) {
    const P = st.project, items = [];
    const add = (obj, coll) => { if (!items.find((i) => i.id === obj.id)) items.push({ id: obj.id, obj, coll, orig: U.clone(obj) }); };
    st.sel.forEach((id) => { const f = FP.find(id); if (f) add(f.obj, f.coll); });
    items.slice().forEach((it) => {
      if (it.coll !== 'rooms') return;
      const c = G.children(P, it.obj);
      c.furniture.forEach((o) => add(o, 'furniture'));
      c.openings.forEach((o) => add(o, 'openings'));
    });
    drag = { type: 'move', start: w, moved: false, primary: hit.id, items, excl: new Set(items.map((i) => i.id)), single: st.sel.length === 1, sx: 0, sy: 0 };
  }

  function onDown(e) {
    if (st.mode === '3d') return;
    FP.emit('canvasdown');
    const ae = document.activeElement;
    if (ae && ae !== document.body && /INPUT|SELECT|TEXTAREA/.test(ae.tagName)) ae.blur();
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { startPinch(); return; }
    if (pointers.size > 2) return;
    const w = toWorld(e.clientX, e.clientY);
    if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceDown)) { startPan(e); e.preventDefault(); return; }
    if (e.button !== 0) return;
    const t = st.tool;
    if (t === 'select') { downSelect(e, w); return; }
    if (PLACE.includes(t)) {
      updateGhost(w, e);
      drag = { type: 'place', start: w, sx: e.clientX, sy: e.clientY, moved: false };
    } else if (t === 'wall') {
      const p = wallPoint(w, e, wallStart);
      if (wallStart) { finishWall(wallStart, p, true); drag = null; }
      else drag = { type: 'wall', a: p, b: p, sx: e.clientX, sy: e.clientY, moved: false };
    } else if (t === 'measure') {
      const p = wallPoint(w, e, null);
      if (measureStart) { finishMeasure(measureStart, p); drag = null; }
      else drag = { type: 'measure', a: p, b: p, sx: e.clientX, sy: e.clientY, moved: false };
    } else if (t === 'shape') {
      const p = shapePoint(w, e), f = shapePts[0], l = shapePts[shapePts.length - 1];
      if (f && shapePts.length >= 3 && Math.hypot(w.x - f.x, w.y - f.y) < 14 / st.view.s) finishShape();
      else if (!l || Math.abs(p.x - l.x) > 1e-6 || Math.abs(p.y - l.y) > 1e-6) shapePts.push(p);
    } else if (t === 'cut') {
      const p = FP.Snap.point(w, thr(), snapOn(e));
      drag = { type: 'cut', a: p, b: p, sx: e.clientX, sy: e.clientY, moved: false };
    } else if (t === 'erase') {
      const h = nearestOutline(w);
      if (h) { const a = snapAlong(h, h.horiz ? w.x : w.y, snapOn(e)); drag = { type: 'erase', h, a, b: a, sx: e.clientX, sy: e.clientY, moved: false }; }
      else FP.toast('Acércate a un muro');
    }
    requestRender(false);
  }

  function downSelect(e, w) {
    const hd = handleHit(w);
    if (hd) {
      const f = FP.find(st.sel[0]);
      drag = { type: 'handle', hd: hd.id, obj: f.obj, coll: f.coll, orig: U.clone(f.obj), start: w, moved: false };
      return;
    }
    const hit = hitTest(w);
    if (hit) {
      if (e.shiftKey) {
        if (st.sel.includes(hit.id)) { FP.select(st.sel.filter((i) => i !== hit.id)); return; }
        FP.select(st.sel.concat(hit.id));
      } else if (!st.sel.includes(hit.id)) FP.select([hit.id]);
      startMove(w, hit);
      drag.sx = e.clientX; drag.sy = e.clientY;
    } else {
      if (!e.shiftKey && st.sel.length) FP.select([]);
      if (e.pointerType === 'touch') startPan(e);
      else drag = { type: 'marquee', start: w, cur: w, add: e.shiftKey, base: st.sel.slice(), moved: false };
    }
  }

  function onMove(e) {
    if (st.mode === '3d') return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) { doPinch(); return; }
    const w = toWorld(e.clientX, e.clientY);
    cursorW = w;
    if (drag) dragMove(e, w); else hover(e, w);
  }

  /** Punto del contorno: va a la cuadrícula y se alinea (recto) con el punto anterior. */
  function shapePoint(w, e) {
    let p = FP.Snap.point(w, thr(), snapOn(e));
    p = { x: Math.max(0, Math.round(p.x * 20) / 20), y: Math.max(0, Math.round(p.y * 20) / 20) };
    const l = shapePts[shapePts.length - 1];
    if (l) { if (Math.abs(p.x - l.x) >= Math.abs(p.y - l.y)) p.y = l.y; else p.x = l.x; }
    return p;
  }
  function finishShape() {
    const pts = shapePts.slice();
    if (pts.length < 3) { FP.toast('Marca al menos 3 puntos'); return false; }
    const f = pts[0], l = pts[pts.length - 1];
    if (Math.abs(f.x - l.x) > 1e-6 && Math.abs(f.y - l.y) > 1e-6) pts.push({ x: f.x, y: l.y }); // esquina para cerrar con línea recta
    // proyecto vacío y de un solo nivel: la forma se pega a la esquina (0,0); si no, se respeta su posición para no desalinear los niveles
    const Pj = st.project, empty = FP.Levels.views(Pj).every((v) => !v.rooms.length && !v.walls.length && !v.furniture.length && !v.openings.length);
    if (empty && FP.Levels.count(Pj) === 1) {
      const mx = Math.min(...pts.map((q) => q.x)), my = Math.min(...pts.map((q) => q.y));
      pts.forEach((q) => { q.x -= mx; q.y -= my; });
    }
    const res = FP.Walls.shapeToSpace(pts);
    if (!res) { FP.toast('La forma es muy pequeña'); return false; }
    const Ps = st.project.space;
    Ps.w = U.clamp(res.w, 2, 80); Ps.h = U.clamp(res.h, 2, 80); Ps.cuts = res.cuts; Ps.gaps = [];
    shapePts = [];
    FP.commit();
    FP.setTool('select');
    fit();
    FP.toast('Forma lista · ' + Math.round(FP.stats().area * 10) / 10 + ' m²');
    return true;
  }

  function hover(e, w) {
    const t = st.tool;
    let cur = 'default';
    snapDot = null;
    if (spaceDown) cur = 'grab';
    else if (t === 'select') {
      const h = handleHit(w);
      cur = h ? h.cur : hitTest(w) ? 'move' : 'default';
      guides = [];
    } else if (PLACE.includes(t)) { updateGhost(w, e); cur = 'crosshair'; }
    else if (t === 'wall') { const p = wallPoint(w, e, wallStart); cursorW = p; cur = 'crosshair'; }
    else if (t === 'measure') { const p = wallPoint(w, e, null); cursorW = p; cur = 'crosshair'; }
    else if (t === 'cut') { cursorW = FP.Snap.point(w, thr(), snapOn(e)); cur = 'crosshair'; }
    else if (t === 'shape') { cursorW = shapePoint(w, e); cur = 'crosshair'; }
    else if (t === 'erase') { const h = nearestOutline(w); eraseHover = h ? { h, t: snapAlong(h, h.horiz ? w.x : w.y, snapOn(e)) } : null; cur = h ? 'crosshair' : 'not-allowed'; }
    svg.style.cursor = cur;
    requestRender(false);
  }

  function applyDelta(it, dx, dy) {
    const o = it.obj, q = it.orig;
    if (it.coll === 'walls' || it.coll === 'measures') { o.x1 = q.x1 + dx; o.y1 = q.y1 + dy; o.x2 = q.x2 + dx; o.y2 = q.y2 + dy; }
    else { o.x = q.x + dx; o.y = q.y + dy; }
  }

  function dragMove(e, w) {
    const d = drag, P = st.project, on = snapOn(e), W = P.space.w, H = P.space.h;
    switch (d.type) {
      case 'pan':
        st.view.x = d.vx + (e.clientX - d.sx); st.view.y = d.vy + (e.clientY - d.sy);
        viewTouched = true; FP.emit('view'); requestRender();
        return;
      case 'marquee':
        d.cur = w; d.moved = true; requestRender(false);
        return;
      case 'move': {
        let dx = w.x - d.start.x, dy = w.y - d.start.y;
        if (!d.moved) { if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return; d.moved = true; }
        const prim = d.items.find((i) => i.id === d.primary);
        if (d.single && prim.coll === 'furniture' && prim.obj.key.startsWith('art_')) {
          const a = FP.Snap.artOnWall({ x: prim.orig.x + dx, y: prim.orig.y + dy }, prim.obj, 0.9, on);
          if (a) { prim.obj.x = a.x; prim.obj.y = a.y; prim.obj.rot = a.rot; } else { prim.obj.x = prim.orig.x + dx; prim.obj.y = prim.orig.y + dy; }
          guides = [];
        } else if (d.single && prim.coll === 'openings') {
          const pt = { x: prim.orig.x + dx, y: prim.orig.y + dy }, hit = FP.Snap.toWall(pt, P, 0.6, prim.obj.w / 2, on);
          if (hit) { prim.obj.x = hit.x; prim.obj.y = hit.y; prim.obj.rot = hit.rot; } else { prim.obj.x = pt.x; prim.obj.y = pt.y; }
          guides = [];
        } else {
          const b0 = G.bbox(prim.orig, prim.coll), b = { l: b0.l + dx, t: b0.t + dy, r: b0.r + dx, b: b0.b + dy };
          const sn = FP.Snap.box(b, d.excl, { mode: prim.coll === 'furniture' ? 'furn' : 'room', thr: thr(), on });
          dx += sn.dx; dy += sn.dy; guides = sn.guides;
          let ax = -1e9, bx = 1e9, ay = -1e9, by = 1e9;
          d.items.forEach((it) => { const q = G.bbox(it.orig, it.coll), LM = FP.limits(P, it.coll, it.obj); ax = Math.max(ax, LM.x0 - q.l); bx = Math.min(bx, LM.x1 - q.r); ay = Math.max(ay, LM.y0 - q.t); by = Math.min(by, LM.y1 - q.b); });
          dx = Math.min(bx, Math.max(ax, dx)); dy = Math.min(by, Math.max(ay, dy));
          d.items.forEach((it) => applyDelta(it, dx, dy));
        }
        FP.emit('live');
        return;
      }
      case 'handle': {
        const o = d.obj, q = d.orig, dx = w.x - d.start.x, dy = w.y - d.start.y;
        if (!d.moved) { if (Math.hypot(dx, dy) * st.view.s < 2) return; d.moved = true; }
        guides = [];
        if (d.coll === 'rooms') {
          const ex = new Set([q.id]), hd = d.hd;
          const se = (axis, v) => { const r = FP.Snap.edge(axis, v, ex, thr(), on); if (r.guide) guides.push(r.guide); return r.v; };
          let L = q.x, R = q.x + q.w, T = q.y, B = q.y + q.h;
          if (hd.includes('w')) L = se('x', q.x + dx);
          if (hd.includes('e')) R = se('x', q.x + q.w + dx);
          if (hd.includes('n')) T = se('y', q.y + dy);
          if (hd.includes('s')) B = se('y', q.y + q.h + dy);
          const LM = FP.limits(P, 'rooms', o);
          L = U.clamp(L, LM.x0, LM.x1); R = U.clamp(R, LM.x0, LM.x1); T = U.clamp(T, LM.y0, LM.y1); B = U.clamp(B, LM.y0, LM.y1);
          const MIN = 0.5;
          if (R - L < MIN) { if (hd.includes('w')) L = Math.max(LM.x0, R - MIN); else R = Math.min(LM.x1, L + MIN); }
          if (B - T < MIN) { if (hd.includes('n')) T = Math.max(LM.y0, B - MIN); else B = Math.min(LM.y1, T + MIN); }
          o.x = L; o.y = T; o.w = R - L; o.h = B - T;
        } else if (d.hd === 'rot') {
          let r = U.norm360(U.deg(Math.atan2(w.y - o.y, w.x - o.x)) + 90);
          r = on ? (Math.round(r / 15) * 15) % 360 : Math.round(r);
          o.rot = r;
        } else {
          const p = wallPoint(w, e, null);
          let x = p.x, y = p.y;
          if (d.coll === 'walls' && on && !snapDot) {
            const ox = d.hd === 'p1' ? o.x2 : o.x1, oy = d.hd === 'p1' ? o.y2 : o.y1;
            if (Math.abs(x - ox) < Math.abs(y - oy) * 0.12) x = ox;
            else if (Math.abs(y - oy) < Math.abs(x - ox) * 0.12) y = oy;
          }
          if (d.hd === 'p1') { o.x1 = x; o.y1 = y; } else { o.x2 = x; o.y2 = y; }
        }
        FP.emit('live');
        return;
      }
      case 'place': {
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
        if (st.tool === 'room' && d.moved) {
          const a = FP.Snap.point(d.start, thr(), on), b = FP.Snap.point(w, thr(), on);
          guides = b.guides || [];
          const LM = FP.limits(P, 'rooms', st.place);
          let x1 = U.clamp(Math.min(a.x, b.x), LM.x0, LM.x1), x2 = U.clamp(Math.max(a.x, b.x), LM.x0, LM.x1);
          let y1 = U.clamp(Math.min(a.y, b.y), LM.y0, LM.y1), y2 = U.clamp(Math.max(a.y, b.y), LM.y0, LM.y1);
          if (x2 - x1 < 0.5) x2 = Math.min(LM.x1, x1 + 0.5), x1 = x2 - 0.5;
          if (y2 - y1 < 0.5) y2 = Math.min(LM.y1, y1 + 0.5), y1 = y2 - 0.5;
          ghost = { kind: 'room', type: st.place.type, x: x1, y: y1, w: x2 - x1, h: y2 - y1, custom: true };
        } else updateGhost(w, e);
        requestRender(false);
        return;
      }
      case 'cut':
        d.b = FP.Snap.point(w, thr(), on);
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
        requestRender(false);
        return;
      case 'erase':
        d.b = snapAlong(d.h, d.h.horiz ? w.x : w.y, on);
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
        requestRender(false);
        return;
      case 'wall':
      case 'measure':
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
        d.b = wallPoint(w, e, d.type === 'wall' ? d.a : null);
        requestRender(false);
    }
  }

  function onUp(e) {
    pointers.delete(e.pointerId);
    try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    const d = drag;
    drag = null;
    if (!d) return;
    const P = st.project;
    switch (d.type) {
      case 'move':
      case 'handle':
        guides = [];
        if (d.moved) FP.commit();
        break;
      case 'marquee': {
        if (!d.moved) break;
        const a = d.start, b = d.cur, R = { l: Math.min(a.x, b.x), t: Math.min(a.y, b.y), r: Math.max(a.x, b.x), b: Math.max(a.y, b.y) };
        const hit = [];
        FP.COLLS.forEach((c) => P[c].forEach((o) => {
          const q = G.bbox(o, c);
          const inter = q.l <= R.r && q.r >= R.l && q.t <= R.b && q.b >= R.t;
          const inside = q.l >= R.l && q.r <= R.r && q.t >= R.t && q.b <= R.b;
          if (c === 'rooms' ? inside : inter) hit.push(o.id);
        }));
        FP.select(d.add ? d.base.concat(hit.filter((i) => !d.base.includes(i))) : hit);
        break;
      }
      case 'place':
        placeGhost(e.shiftKey && st.tool === 'furn');
        break;
      case 'wall':
        if (d.moved) { finishWall(d.a, d.b, false); wallStart = null; } else wallStart = d.a;
        break;
      case 'measure':
        if (d.moved) finishMeasure(d.a, d.b); else measureStart = d.a;
        break;
      case 'cut': {
        if (!d.moved) break;
        const r = cutRect(d.a, d.b), Ps = P.space;
        if (r.w < 0.5 || r.h < 0.5) { FP.toast('El recorte es muy pequeño'); break; }
        if (r.w * r.h > Ps.w * Ps.h * 0.85) { FP.toast('Deja al menos parte de la base'); break; }
        Ps.cuts = (Ps.cuts || []).concat([r]);
        FP.commit();
        FP.setTool('select');
        break;
      }
      case 'erase':
        if (d.moved && Math.abs(d.b - d.a) > 0.1) {
          P.space.gaps = (P.space.gaps || []).concat([gapOf(d.h, d.a, d.b)]);
          FP.commit();
        }
        break;
      default:
    }
    requestRender(false);
  }

  function onWheel(e) {
    if (st.mode === '3d') return;
    e.preventDefault();
    if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
      st.view.x -= e.deltaX; viewTouched = true; requestRender();
      return;
    }
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)));
  }

  /* ---------- overlay (selección, guías, ghost) ---------- */
  function outline(o, coll, px) {
    const sw = n(1.5 * px);
    if (coll === 'rooms') return `<rect x="${n(o.x)}" y="${n(o.y)}" width="${n(o.w)}" height="${n(o.h)}" fill="rgba(47,109,246,.05)" stroke="${ACC}" stroke-width="${sw}"/>`;
    if (coll === 'furniture') return `<g transform="translate(${n(o.x)} ${n(o.y)}) rotate(${n(o.rot || 0)})"><rect x="${n(-o.w / 2 - 0.02)}" y="${n(-o.h / 2 - 0.02)}" width="${n(o.w + 0.04)}" height="${n(o.h + 0.04)}" rx="0.03" fill="rgba(47,109,246,.06)" stroke="${ACC}" stroke-width="${sw}"/></g>`;
    if (coll === 'openings') return `<g transform="translate(${n(o.x)} ${n(o.y)}) rotate(${n(o.rot || 0)})"><rect x="${n(-o.w / 2 - 0.05)}" y="-0.16" width="${n(o.w + 0.1)}" height="0.32" rx="0.04" fill="rgba(47,109,246,.08)" stroke="${ACC}" stroke-width="${sw}"/></g>`;
    return `<line x1="${n(o.x1)}" y1="${n(o.y1)}" x2="${n(o.x2)}" y2="${n(o.y2)}" stroke="${ACC}" stroke-opacity=".3" stroke-width="${n(Math.max(0.16, 8 * px))}" stroke-linecap="round"/>`;
  }

  function handlesSvg(o, coll, px) {
    const pts = handlePoints(o, coll, px);
    let s = '';
    const hs = n(4.5 * px), sw = n(1.5 * px);
    pts.forEach((h) => {
      if (h.rot) {
        const top = G.toWorld(o, 0, -o.h / 2);
        s += `<line x1="${n(top.x)}" y1="${n(top.y)}" x2="${n(h.x)}" y2="${n(h.y)}" stroke="${ACC}" stroke-width="${sw}"/><circle cx="${n(h.x)}" cy="${n(h.y)}" r="${n(6 * px)}" fill="#fff" stroke="${ACC}" stroke-width="${sw}"/>`;
        s += `<path d="M${n(h.x - 2.6 * px)} ${n(h.y + 0.6 * px)}a${n(2.8 * px)} ${n(2.8 * px)} 0 1 1 ${n(2.6 * px)} ${n(2.4 * px)}" fill="none" stroke="${ACC}" stroke-width="${n(1.2 * px)}"/>`;
      } else s += `<rect x="${n(h.x - hs)}" y="${n(h.y - hs)}" width="${n(hs * 2)}" height="${n(hs * 2)}" rx="${n(1.5 * px)}" fill="#fff" stroke="${ACC}" stroke-width="${sw}"/>`;
    });
    return s;
  }

  function selDims(o, coll, px) {
    if (!st.showDims) return '';
    if (coll === 'rooms') {
      return FP.Measure.dim(o.x, o.y, o.x + o.w, o.y, -0.4, U.fmt(o.w) + ' m', px, { color: ACC, bold: 1, fs: 11.5 }) +
        FP.Measure.dim(o.x, o.y, o.x, o.y + o.h, 0.4, U.fmt(o.h) + ' m', px, { color: ACC, bold: 1, fs: 11.5 });
    }
    if (coll === 'walls') return FP.Measure.dim(o.x1, o.y1, o.x2, o.y2, 0.3, U.fmt(FP.Walls.length(o)) + ' m', px, { color: ACC, bold: 1 });
    return '';
  }

  function overlay(px) {
    let s = '';
    st.sel.forEach((id) => { const f = FP.find(id); if (f) s += outline(f.obj, f.coll, px); });
    if (st.sel.length === 1 && st.tool === 'select' && !(drag && drag.type === 'pan')) {
      const f = FP.find(st.sel[0]);
      if (f) s += selDims(f.obj, f.coll, px) + handlesSvg(f.obj, f.coll, px);
    }
    // guías de alineación
    guides.forEach((g) => {
      s += g.axis === 'x'
        ? `<line x1="${n(g.v)}" y1="${n(g.a)}" x2="${n(g.v)}" y2="${n(g.b)}" stroke="${ACC}" stroke-width="${n(px)}" stroke-dasharray="${n(4 * px)} ${n(3 * px)}"/>`
        : `<line x1="${n(g.a)}" y1="${n(g.v)}" x2="${n(g.b)}" y2="${n(g.v)}" stroke="${ACC}" stroke-width="${n(px)}" stroke-dasharray="${n(4 * px)} ${n(3 * px)}"/>`;
    });
    // ghost
    if (ghost && PLACE.includes(st.tool)) {
      if (ghost.kind === 'room') {
        s += `<rect x="${n(ghost.x)}" y="${n(ghost.y)}" width="${n(ghost.w)}" height="${n(ghost.h)}" fill="rgba(47,109,246,.09)" stroke="${ACC}" stroke-width="${n(1.5 * px)}" stroke-dasharray="${n(6 * px)} ${n(4 * px)}"/>`;
        s += `<text x="${n(ghost.x + ghost.w / 2)}" y="${n(ghost.y + ghost.h / 2)}" text-anchor="middle" font-size="${n(12 * px)}" font-weight="600" fill="${ACC}" font-family="${FP.FONT}">${U.fmt(ghost.w)} × ${U.fmt(ghost.h)} m</text>`;
      } else if (ghost.kind === 'furn') {
        s += `<g opacity=".78">${FP.Furniture.svg(ghost, true, px)}</g>` + outline(ghost, 'furniture', px);
      } else {
        const o = Object.assign({ mirror: false }, ghost);
        s += `<g opacity="${ghost.ok ? 0.9 : 0.35}">${FP.Openings.svg(o, true, px)}</g>`;
        if (ghost.ok) s += outline(o, 'openings', px);
      }
    }
    // previsualización de pared / medición
    const line = (a, b, wall) => {
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      let t = wall
        ? `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${ACC}" stroke-opacity=".55" stroke-width="${FP.Walls.T_IN}" stroke-linecap="square"/>`
        : `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${ACC}" stroke-width="${n(1.5 * px)}" stroke-dasharray="${n(5 * px)} ${n(3 * px)}"/><circle cx="${n(a.x)}" cy="${n(a.y)}" r="${n(3.5 * px)}" fill="${ACC}"/><circle cx="${n(b.x)}" cy="${n(b.y)}" r="${n(3.5 * px)}" fill="${ACC}"/>`;
      if (L > 0.02) {
        let ang = U.deg(Math.atan2(b.y - a.y, b.x - a.x));
        if (ang >= 90) ang -= 180;
        if (ang < -90) ang += 180;
        t += `<text transform="translate(${n((a.x + b.x) / 2)} ${n((a.y + b.y) / 2)}) rotate(${n(ang)})" text-anchor="middle" dy="${n(-9 * px)}" font-size="${n(12 * px)}" font-weight="600" fill="${ACC}" font-family="${FP.FONT}" stroke="#fff" stroke-width="${n(3.5 * px)}" stroke-linejoin="round" paint-order="stroke">${U.fmt(L)} m</text>`;
      }
      return t;
    };
    if (st.tool === 'wall') {
      const a = drag && drag.type === 'wall' ? drag.a : wallStart, b = drag && drag.type === 'wall' ? drag.b : cursorW;
      if (a && b) s += line(a, b, true);
    } else if (st.tool === 'measure') {
      const a = drag && drag.type === 'measure' ? drag.a : measureStart, b = drag && drag.type === 'measure' ? drag.b : cursorW;
      if (a && b) s += line(a, b, false);
    }
    if ((st.tool === 'wall' || st.tool === 'measure') && snapDot) s += `<circle cx="${n(snapDot.x)}" cy="${n(snapDot.y)}" r="${n(6 * px)}" fill="none" stroke="${ACC}" stroke-width="${n(1.5 * px)}"/>`;
    // recortar base / borrar tramos
    if (st.tool === 'shape') {
      const pts = shapePts, cur = cursorW, near = pts.length >= 3 && Math.hypot(cur.x - pts[0].x, cur.y - pts[0].y) < 14 / st.view.s;
      const all = pts.concat(cur && !near && pts.length ? [cur] : cur && !pts.length ? [cur] : []);
      if (pts.length >= 2) s += `<polygon points="${pts.map((q) => n(q.x) + ',' + n(q.y)).join(' ')}${cur && !near ? ' ' + n(cur.x) + ',' + n(cur.y) : ''}" fill="rgba(47,109,246,.09)" stroke="none"/>`;
      if (pts.length) s += `<polyline points="${all.map((q) => n(q.x) + ',' + n(q.y)).join(' ')}${near ? ' ' + n(pts[0].x) + ',' + n(pts[0].y) : ''}" fill="none" stroke="${ACC}" stroke-width="0.14" stroke-linejoin="round" stroke-linecap="square"/>`;
      for (let i = 0; i < all.length - 1; i++) { const a = all[i], b = all[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y); if (L > 0.05) s += FP.Measure.dim(a.x, a.y, b.x, b.y, 0.45, U.fmt(L) + ' m', px, { color: ACC, bold: 1, fs: 11.5 }); }
      pts.forEach((q, i) => { s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n((i === 0 && pts.length >= 3 ? (near ? 9 : 6) : 4) * px)}" fill="${i === 0 ? (near ? ACC : '#fff') : ACC}" stroke="${ACC}" stroke-width="${n(2 * px)}"/>`; });
      if (cur) s += `<circle cx="${n(cur.x)}" cy="${n(cur.y)}" r="${n(5 * px)}" fill="none" stroke="${ACC}" stroke-width="${n(1.5 * px)}"/>`;
    }
    if (st.tool === 'cut') {
      const a = drag && drag.type === 'cut' ? drag.a : null;
      if (a) {
        const r = cutRect(a, drag.b);
        s += `<rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.w)}" height="${n(r.h)}" fill="rgba(217,45,32,.14)" stroke="#d92d20" stroke-width="${n(1.5 * px)}" stroke-dasharray="${n(6 * px)} ${n(4 * px)}"/>`;
        s += `<text x="${n(r.x + r.w / 2)}" y="${n(r.y + r.h / 2)}" text-anchor="middle" font-size="${n(12 * px)}" font-weight="600" fill="#d92d20" font-family="${FP.FONT}">${U.fmt(r.w)} × ${U.fmt(r.h)} m</text>`;
      } else s += `<circle cx="${n(cursorW.x)}" cy="${n(cursorW.y)}" r="${n(5 * px)}" fill="none" stroke="#d92d20" stroke-width="${n(1.5 * px)}"/>`;
    } else if (st.tool === 'erase') {
      if (drag && drag.type === 'erase') {
        const g = gapOf(drag.h, drag.a, drag.b);
        s += `<line x1="${n(g.x1)}" y1="${n(g.y1)}" x2="${n(g.x2)}" y2="${n(g.y2)}" stroke="#d92d20" stroke-opacity=".55" stroke-width="0.28" stroke-linecap="butt"/>`;
        s += FP.Measure.dim(g.x1, g.y1, g.x2, g.y2, drag.h.horiz ? -0.5 : 0.5, U.fmt(Math.abs(drag.b - drag.a)) + ' m', px, { color: '#d92d20', bold: 1 });
      } else if (eraseHover) {
        const h = eraseHover.h, p = h.horiz ? { x: eraseHover.t, y: h.c } : { x: h.c, y: eraseHover.t };
        s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(6 * px)}" fill="#d92d20" fill-opacity=".85"/>`;
      }
    }
    // marquesina
    if (drag && drag.type === 'marquee' && drag.moved) {
      const a = drag.start, b = drag.cur;
      s += `<rect x="${n(Math.min(a.x, b.x))}" y="${n(Math.min(a.y, b.y))}" width="${n(Math.abs(a.x - b.x))}" height="${n(Math.abs(a.y - b.y))}" fill="rgba(47,109,246,.06)" stroke="${ACC}" stroke-width="${n(px)}" stroke-dasharray="${n(4 * px)} ${n(3 * px)}"/>`;
    }
    return s;
  }

  /* ---------- API pública ---------- */
  function cancel() {
    if (shapePts.length) { shapePts = []; requestRender(false); return true; }
    if (drag) { if (drag.moved && drag.type !== 'pan' && drag.type !== 'marquee') FP.revert(); drag = null; guides = []; requestRender(false); return true; }
    if (wallStart || measureStart) { wallStart = measureStart = null; requestRender(false); return true; }
    if (st.tool !== 'select') { FP.setTool('select'); return true; }
    if (st.sel.length) { FP.select([]); return true; }
    return false;
  }

  FP.Editor = {
    /** Teclas del dibujo de forma: Enter cierra, Retroceso quita el último punto. */
    shapeKey(e) {
      if (st.tool !== 'shape') return false;
      if (e.key === 'Enter') { finishShape(); return true; }
      if (e.key === 'Backspace' || e.key === 'Delete') { shapePts.pop(); requestRender(false); return true; }
      return false;
    },
    init() {
      svg = document.getElementById('stage');
      wrap = svg.parentElement;
      svg.innerHTML = '<g id="world"><g id="scene"></g><g id="overlay" pointer-events="none"></g></g>';
      gWorld = svg.querySelector('#world'); gScene = svg.querySelector('#scene'); gOver = svg.querySelector('#overlay');
      svg.addEventListener('pointerdown', onDown);
      svg.addEventListener('pointermove', onMove);
      svg.addEventListener('pointerup', onUp);
      svg.addEventListener('pointercancel', onUp);
      svg.addEventListener('wheel', onWheel, { passive: false });
      svg.addEventListener('contextmenu', (e) => e.preventDefault());
      svg.addEventListener('dblclick', (e) => {
        if (st.tool !== 'select') { if (st.tool === 'wall') { wallStart = null; requestRender(false); } return; }
        const h = hitTest(toWorld(e.clientX, e.clientY));
        if (h) FP.emit('focusName');
      });
      svg.addEventListener('pointerleave', () => { if (!drag && PLACE.includes(st.tool)) { ghost = null; guides = []; requestRender(false); } });
      new ResizeObserver(() => { if (!viewTouched) fit(); else requestRender(); }).observe(wrap);
      ['live', 'change', 'render', 'restore', 'mode'].forEach((ev) => FP.on(ev, () => { if (ev === 'restore') drag = null; requestRender(true); }));
      FP.on('project', () => { ghost = null; guides = []; drag = null; wallStart = measureStart = null; setTimeout(fit, 0); });
      FP.on('selection', () => requestRender(false));
      FP.on('tool', () => { shapePts = []; eraseHover = null; ghost = null; guides = []; ghostRot = 0; wallStart = measureStart = null; drag = null; snapDot = null; svg.style.cursor = 'default'; requestRender(false); });
    },
    fit, zoomBy, viewCenter, cancel,
    setSpace(v) { spaceDown = v; if (svg) svg.style.cursor = v ? 'grab' : 'default'; },
    isBusy() { return !!drag; },
    rotateGhost() {
      if (ghost && ghost.kind === 'furn') { ghostRot = (ghostRot + 90) % 360; updateGhost(cursorW, null); requestRender(false); return true; }
      return false;
    },
    resetView() { viewTouched = false; fit(); },
  };
})();

/* levels.js — varios niveles (plantas) por proyecto.
   El nivel ACTIVO vive en la raíz del proyecto (space, rooms, walls, openings, furniture, measures), así todo el editor sigue
   funcionando igual. Los demás niveles se guardan en project.levels[i]. Al cambiar de nivel se intercambian las referencias. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, st = FP.state;
  const KEYS = ['space', 'rooms', 'walls', 'openings', 'furniture', 'measures'];
  const EMPTY = () => ({ rooms: [], walls: [], openings: [], furniture: [], measures: [] });
  const NAMES = ['Planta baja', 'Planta alta'];

  const Lv = (FP.Levels = {
    KEYS,
    /** Altura entre pisos (m): muro + losa. Debe coincidir con la escena 3D. */
    HEIGHT: 2.6 + 0.25,
    defName: (i) => NAMES[i] || 'Nivel ' + (i + 1),

    ensure(P) {
      if (!P) return P;
      if (!Array.isArray(P.levels) || !P.levels.length) { P.levels = [{ id: U.uid(), name: Lv.defName(0) }]; P.level = 0; }
      if (!(P.level >= 0 && P.level < P.levels.length)) P.level = 0;
      P.levels.forEach((l, i) => { if (!l.id) l.id = U.uid(); if (!l.name) l.name = Lv.defName(i); });
      return P;
    },
    count: (P) => (P && P.levels ? P.levels.length : 1),
    cur: (P) => (P && P.level) || 0,
    name: (P, i) => (P.levels && P.levels[i] ? P.levels[i].name : Lv.defName(i)),

    /** Vista de un nivel como si fuera un proyecto completo (para dibujarlo en 3D o en el plano). */
    view(P, i) {
      if (!P.levels || i === Lv.cur(P)) return P;
      const l = P.levels[i];
      return Object.assign({}, P, { level: i }, KEYS.reduce((o, k) => { o[k] = l[k] || (k === 'space' ? P.space : []); return o; }, {}));
    },
    views(P) { return Array.from({ length: Lv.count(P) }, (_, i) => Lv.view(P, i)); },

    /** Guarda el nivel activo en su ficha (solo para cambiar de nivel: después se vuelve a vaciar). */
    _stash(P) { const l = P.levels[P.level]; KEYS.forEach((k) => { l[k] = P[k]; }); },
    _load(P, i) {
      const l = P.levels[i];
      KEYS.forEach((k) => { P[k] = l[k]; delete l[k]; });
      P.level = i;
    },
    switchTo(P, i) {
      Lv.ensure(P);
      if (i === P.level || i < 0 || i >= P.levels.length) return false;
      Lv._stash(P);
      Lv._load(P, i);
      st.sel = [];
      FP.commit();
      FP.emit('restore'); FP.emit('selection'); FP.emit('level');
      return true;
    },
    /** Agrega un nivel arriba del último. dup=true copia el contenido del nivel actual. */
    add(P, dup) {
      Lv.ensure(P);
      const src = U.clone({ space: P.space, rooms: P.rooms, walls: P.walls, openings: P.openings, furniture: P.furniture, measures: P.measures });
      const lv = Object.assign({ id: U.uid(), name: Lv.defName(P.levels.length) }, EMPTY());
      lv.space = Object.assign(U.clone(src.space), { gaps: dup ? src.space.gaps || [] : [] });
      if (dup) {
        const ids = {};
        FP.COLLS.forEach((c) => { lv[c] = src[c].map((o) => { const id = U.uid(); ids[o.id] = id; return Object.assign(o, { id }); }); });
        lv.furniture = lv.furniture.filter((f) => !f.key.startsWith('stairs'));
      } else lv.space.cuts = U.clone(src.space.cuts || []);
      delete lv.space.floorNo;
      Lv._stash(P);
      P.levels.push(lv);
      Lv._load(P, P.levels.length - 1);
      st.sel = [];
      FP.commit();
      FP.emit('restore'); FP.emit('selection'); FP.emit('level');
    },
    remove(P, i) {
      Lv.ensure(P);
      if (P.levels.length < 2 || i < 0 || i >= P.levels.length) return false;
      Lv._stash(P);
      const cur = P.level;
      P.levels.splice(i, 1);
      const next = i === cur ? Math.min(i, P.levels.length - 1) : cur > i ? cur - 1 : cur;
      Lv._load(P, next);
      st.sel = [];
      FP.commit();
      FP.emit('restore'); FP.emit('selection'); FP.emit('level');
      return true;
    },
    rename(P, i, name) {
      Lv.ensure(P);
      name = String(name || '').trim().slice(0, 30);
      if (!name || !P.levels[i]) return;
      P.levels[i].name = name;
      FP.commit();
      FP.emit('level');
    },

    /** Agujeros (en metros) que las escaleras del nivel i abren en el piso del nivel i+1. */
    holes(P, i) {
      const v = Lv.view(P, i);
      return (v.furniture || []).filter((f) => f.key.startsWith('stairs')).map((f) => {
        const b = FP.geom.bbox(f, 'furniture'), ld = FP.Stairs && FP.Stairs.LOCAL_DIR[f.key];
        let arrive = null;
        if (ld) { // lado por donde se sale al piso de arriba
          const t = U.rad(f.rot || 0), lx = f.mirror ? -ld[0] : ld[0], ly = ld[1];
          const dx = lx * Math.cos(t) - ly * Math.sin(t), dy = lx * Math.sin(t) + ly * Math.cos(t);
          arrive = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N';
        }
        return { x: b.l - 0.02, y: b.t - 0.02, w: b.r - b.l + 0.04, h: b.b - b.t + 0.04, arrive };
      });
    },

    /** Silueta del nivel de abajo, tenue, como guía al dibujar un nivel superior. */
    underlay(P) {
      const i = Lv.cur(P) - 1;
      if (i < 0) return '';
      const v = Lv.view(P, i), n = U.n;
      let s = '<g pointer-events="none" opacity=".4">';
      FP.Walls.footprint(v).cells.forEach((c) => { s += `<rect x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}" fill="#8b93a7" fill-opacity=".13"/>`; });
      v.rooms.forEach((r) => { s += `<rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.w)}" height="${n(r.h)}" fill="none" stroke="#8b93a7" stroke-width=".04" stroke-dasharray=".18 .12"/>`; });
      FP.Walls.segments(v).forEach((g) => { s += `<line x1="${n(g.x1)}" y1="${n(g.y1)}" x2="${n(g.x2)}" y2="${n(g.y2)}" stroke="#8b93a7" stroke-opacity=".7" stroke-width="${n(g.t)}"/>`; });
      v.furniture.filter((f) => f.key.startsWith('stairs')).forEach((f) => { s += FP.Furniture.svg(f, false, 0.02); });
      return s + '</g>';
    },
  });

  // proyectos viejos o recién abiertos: siempre con al menos un nivel
  const setP = FP.setProject;
  FP.setProject = function (p) { Lv.ensure(p); return setP(p); };
})();

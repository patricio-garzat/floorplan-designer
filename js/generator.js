/* generator.js — generador aleatorio de departamentos y casas con distribución realista:
   zona privada (recámaras + baños + vestidor) separada de la zona pública (sala, comedor, cocina) por un pasillo,
   puertas coherentes, ventanas en fachadas, muebles pegados a muros sin invadir el giro de las puertas, y arte. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, st = FP.state;

  function mkRng(seed) {
    let a = seed >>> 0;
    const f = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return {
      f, pick: (arr) => arr[Math.floor(f() * arr.length)], range: (lo, hi) => lo + f() * (hi - lo), chance: (p) => f() < p,
      shuffle: (arr) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    };
  }
  const r5 = (v) => +(Math.round(v / 0.05) * 0.05).toFixed(2);
  const SIDES = ['N', 'E', 'S', 'W'];
  const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
  const TALL = new Set(['wardrobe', 'fridge', 'bookshelf', 'cabinets']);
  const def = (k) => FP.Furniture.def(k);
  const isArt = (f) => f.key.startsWith('art_');
  const sideLen = (rc, s) => (s === 'N' || s === 'S' ? rc.w : rc.h);
  const overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  const facing = (x, y, tx, ty) => U.norm360(U.deg(Math.atan2(-(tx - x), ty - y)));

  function wallPose(rc, s, w, h, along, T) {
    T = T == null ? 0.06 : T;
    if (s === 'N') return { x: rc.x + along, y: rc.y + T + h / 2, rot: 0 };
    if (s === 'S') return { x: rc.x + along, y: rc.y + rc.h - T - h / 2, rot: 180 };
    if (s === 'W') return { x: rc.x + T + h / 2, y: rc.y + along, rot: 270 };
    return { x: rc.x + rc.w - T - h / 2, y: rc.y + along, rot: 90 };
  }
  /** Punto a `dist` metros del muro `s` (cara interior) y `along` a lo largo. */
  function pointFrom(rc, s, dist, along) {
    if (s === 'N') return { x: rc.x + along, y: rc.y + dist };
    if (s === 'S') return { x: rc.x + along, y: rc.y + rc.h - dist };
    if (s === 'W') return { x: rc.x + dist, y: rc.y + along };
    return { x: rc.x + rc.w - dist, y: rc.y + along };
  }

  /* ===================================================================== */
  /*  1. DISTRIBUCIÓN                                                      */
  /* ===================================================================== */
  function layout(kind, beds, R) {
    const house = kind === 'casa', hall = beds >= 2 || house, HALL_H = 1.2;
    const ph = r5(R.range(house ? 4.0 : 3.5, house ? 4.6 : 4.0));
    const cols = [];
    cols.push({ w: r5(R.range(3.5, 4.1)), rooms: [{ type: 'principal', name: 'Recámara principal', h: ph, tag: 'principal' }] });
    const ensBath = r5(Math.min(ph - 1.5, R.range(2.0, 2.4)));
    const ens = { w: r5(R.range(2.0, 2.4)), rooms: [] };
    if (hall && ph - ensBath >= 1.5) {
      ens.rooms.push({ type: 'bano', name: 'Baño principal', h: ensBath, tag: 'ens' }, { type: 'vestidor', name: 'Vestidor', h: ph - ensBath, tag: 'vest' });
    } else ens.rooms.push({ type: 'bano', name: 'Baño principal', h: ph, tag: 'ens' });
    cols.push(ens);
    if (!hall) cols.push({ w: r5(R.range(2.3, 2.8)), rooms: [{ type: 'oficina', name: 'Estudio', h: ph, tag: 'private' }] });
    for (let i = 2; i <= beds; i++) cols.push({ w: r5(R.range(2.8, 3.3)), rooms: [{ type: 'recamara', name: 'Recámara ' + i, h: ph, tag: 'private' }] });
    if (beds >= 2 || house) {
      const bh = r5(Math.min(ph - 1.4, R.range(2.0, 2.4)));
      const sh = { w: r5(R.range(1.9, 2.3)), rooms: [] };
      if (house && ph - bh >= 1.4) sh.rooms.push({ type: 'bano', name: 'Baño', h: bh, tag: 'private' }, { type: 'lavanderia', name: 'Lavandería', h: ph - bh, tag: 'private' });
      else sh.rooms.push({ type: 'bano', name: 'Baño', h: ph, tag: 'private' });
      cols.push(sh);
    }
    if (house && R.chance(0.75)) cols.push({ w: r5(R.range(2.8, 3.3)), rooms: [{ type: 'oficina', name: 'Oficina', h: ph, tag: 'private' }] });
    let W = r5(cols.reduce((a, c) => a + c.w, 0));
    if (W < 8.2) { cols[0].w = r5(cols[0].w + (8.2 - W)); W = 8.2; }
    const hb = r5(R.range(house ? 4.6 : 3.9, house ? 5.6 : 4.6)), wk = r5(R.range(2.6, 3.1));
    const pub = [];
    if (W >= 10.5) {
      const wc = r5(R.range(2.6, 3.1));
      pub.push({ type: 'sala', name: 'Sala', w: r5(W - wc - wk), tag: 'sala' }, { type: 'comedor', name: 'Comedor', w: wc, tag: 'comedor' }, { type: 'cocina', name: 'Cocina', w: wk, tag: 'cocina' });
    } else pub.push({ type: 'sala', name: 'Sala / Comedor', w: r5(W - wk), tag: 'sala' }, { type: 'cocina', name: 'Cocina', w: wk, tag: 'cocina' });

    const rooms = [];
    let x = 0;
    cols.forEach((c) => {
      let y = 0;
      const cw = c === cols[cols.length - 1] ? r5(W - x) : c.w;
      c.rooms.forEach((rm, i) => { rooms.push({ id: U.uid(), type: rm.type, name: rm.name, tag: rm.tag, x: r5(x), y: r5(y), w: cw, h: rm.h }); y += rm.h; });
      x += c.w;
    });
    const pubY = hall ? r5(ph + HALL_H) : ph;
    if (hall) rooms.push({ id: U.uid(), type: 'otro', name: 'Pasillo', tag: 'hall', x: 0, y: ph, w: W, h: HALL_H });
    x = 0;
    pub.forEach((p, i) => { const pw = i === pub.length - 1 ? r5(W - x) : p.w; rooms.push({ id: U.uid(), type: p.type, name: p.name, tag: p.tag, x: r5(x), y: pubY, w: pw, h: hb }); x += p.w; });
    return { W, H: r5(pubY + hb), rooms, hall };
  }

  /* ===================================================================== */
  /*  2. PUERTAS Y VENTANAS                                                */
  /* ===================================================================== */
  function shared(a, b) {
    const e = 0.011;
    if (Math.abs(a.x + a.w - b.x) < e || Math.abs(b.x + b.w - a.x) < e) {
      const c = Math.abs(a.x + a.w - b.x) < e ? b.x : a.x, lo = Math.max(a.y, b.y), hi = Math.min(a.y + a.h, b.y + b.h);
      if (hi - lo > 0.3) return { orient: 'v', c, lo, hi };
    }
    if (Math.abs(a.y + a.h - b.y) < e || Math.abs(b.y + b.h - a.y) < e) {
      const c = Math.abs(a.y + a.h - b.y) < e ? b.y : a.y, lo = Math.max(a.x, b.x), hi = Math.min(a.x + a.w, b.x + b.w);
      if (hi - lo > 0.3) return { orient: 'h', c, lo, hi };
    }
    return null;
  }
  function occupied(ops, orient, c, t, w) {
    return ops.some((o) => {
      const horiz = Math.abs(o.rot % 180) < 1;
      if ((orient === 'h') !== horiz) return false;
      const oc = horiz ? o.y : o.x, ot = horiz ? o.x : o.y;
      return Math.abs(oc - c) < 0.2 && Math.abs(ot - t) < (o.w + w) / 2 + 0.2;
    });
  }
  function flipToward(o, tx, ty) {
    const r = U.rad(o.rot), n = { x: -Math.sin(r), y: Math.cos(r) };
    return (tx - o.x) * n.x + (ty - o.y) * n.y >= 0 ? 1 : -1;
  }
  function addDoor(ops, a, b, styles, into, R, finish) {
    const seg = shared(a, b);
    if (!seg) return null;
    for (const st_ of styles) {
      const w = FP.Openings.style('door', st_).w;
      if (seg.hi - seg.lo < w + 0.55) continue;
      for (let k = 0; k < 14; k++) {
        const t = R.range(seg.lo + w / 2 + 0.3, seg.hi - w / 2 - 0.3);
        if (occupied(ops, seg.orient, seg.c, t, w)) continue;
        const o = FP.Openings.create('door', st_, seg.orient === 'h' ? t : seg.c, seg.orient === 'h' ? seg.c : t, seg.orient === 'h' ? 0 : 90, 1);
        o.flip = flipToward(o, into.x + into.w / 2, into.y + into.h / 2);
        o.finish = finish;
        ops.push(o);
        return o;
      }
    }
    return null;
  }
  function addWindows(ops, rooms, W, H, R, theme) {
    rooms.forEach((rm) => {
      if (rm.tag === 'hall' || rm.type === 'vestidor') return;
      const edges = [];
      if (rm.y < 0.01) edges.push({ orient: 'h', c: 0, lo: rm.x, hi: rm.x + rm.w, rot: 0 });
      if (Math.abs(rm.y + rm.h - H) < 0.01) edges.push({ orient: 'h', c: H, lo: rm.x, hi: rm.x + rm.w, rot: 0 });
      if (rm.x < 0.01) edges.push({ orient: 'v', c: 0, lo: rm.y, hi: rm.y + rm.h, rot: 90 });
      if (Math.abs(rm.x + rm.w - W) < 0.01) edges.push({ orient: 'v', c: W, lo: rm.y, hi: rm.y + rm.h, rot: 90 });
      const bath = rm.type === 'bano' || rm.type === 'lavanderia';
      edges.forEach((e) => {
        const L = e.hi - e.lo;
        if (L < 1.6) return;
        const n = L >= 4.8 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const opts = bath ? ['single'] : rm.type === 'cocina' ? ['sliding', 'single', 'large'] : rm.type === 'sala' || rm.type === 'comedor' ? theme.bigWin : rm.type === 'principal' ? ['large', 'floor', 'large'] : ['large', 'sliding', 'single'];
          let styleId = R.pick(opts), s = FP.Openings.style('window', styleId), w = bath ? 0.8 : s.w;
          const c = e.lo + (n === 1 ? L / 2 : L * (i ? 0.72 : 0.28)) + R.range(-0.25, 0.25);
          while (w > L / n - 0.9 && styleId !== 'single') { styleId = styleId === 'floorsl' ? 'floor' : styleId === 'floor' ? 'large' : 'single'; s = FP.Openings.style('window', styleId); w = s.w; }
          if (w > L / n - 0.6 || occupied(ops, e.orient, e.c, c, w)) continue;
          const o = FP.Openings.create('window', styleId, e.orient === 'h' ? c : e.c, e.orient === 'h' ? e.c : c, e.rot, 1);
          o.w = w;
          ops.push(o);
        }
      });
    });
  }

  /** Balcón exterior con puerta corrediza, pegado al muro de la sala o de la recámara principal. */
  function addBalcony(ops, rooms, L, R, entrance) {
    const W = L.W, H = L.H, cands = [];
    ['sala', 'principal', 'comedor'].forEach((t) => {
      const rm = rooms.find((r) => r.tag === t);
      if (!rm) return;
      if (Math.abs(rm.y + rm.h - H) < 0.01) cands.push({ rm, side: 'S', lo: rm.x, hi: rm.x + rm.w });
      if (rm.y < 0.01) cands.push({ rm, side: 'N', lo: rm.x, hi: rm.x + rm.w });
      if (rm.x < 0.01) cands.push({ rm, side: 'W', lo: rm.y, hi: rm.y + rm.h });
      if (Math.abs(rm.x + rm.w - W) < 0.01) cands.push({ rm, side: 'E', lo: rm.y, hi: rm.y + rm.h });
    });
    for (const c of R.shuffle(cands)) {
      let lo = c.lo + 0.7, hi = c.hi - 0.7;
      if (c.side === 'S' && entrance && entrance.x > lo - 1 && entrance.x < hi + 1) { // evitar la puerta de entrada
        const left = [lo, entrance.x - 1.3], right = [entrance.x + 1.3, hi];
        [lo, hi] = left[1] - left[0] >= right[1] - right[0] ? left : right;
      }
      if (hi - lo < 2.4) continue;
      const bw = Math.min(hi - lo, R.range(2.6, 4.6)), start = R.range(lo, hi - bw), mid = start + bw / 2, dep = R.pick([1.4, 1.5, 1.6]);
      const horiz = c.side === 'S' || c.side === 'N';
      const b = { id: U.uid(), type: 'balcon', name: 'Balcón', tag: 'balcon', floor: 'deck', rail: R.pick(['glass', 'glass', 'bars', 'wall']),
        x: horiz ? start : c.side === 'W' ? -dep : W, y: horiz ? (c.side === 'S' ? H : -dep) : start, w: horiz ? bw : dep, h: horiz ? dep : bw };
      // quitar ventanas que se cruzan con el balcón y poner la puerta corrediza
      for (let i = ops.length - 1; i >= 0; i--) {
        const o = ops[i];
        if (o.kind !== 'window') continue;
        const onWall = horiz ? Math.abs(o.y - (c.side === 'S' ? H : 0)) < 0.2 : Math.abs(o.x - (c.side === 'W' ? 0 : W)) < 0.2;
        if (onWall && Math.abs((horiz ? o.x : o.y) - mid) < bw / 2 + o.w / 2 + 0.1) ops.splice(i, 1);
      }
      const dw = 1.5;
      const door = FP.Openings.create('door', 'sliding', horiz ? mid : (c.side === 'W' ? 0 : W), horiz ? (c.side === 'S' ? H : 0) : mid, horiz ? 0 : 90, 1);
      door.w = Math.min(dw, bw - 0.4);
      door.flip = flipToward(door, c.rm.x + c.rm.w / 2, c.rm.y + c.rm.h / 2);
      ops.push(door);
      rooms.push(b);
      return b;
    }
    return null;
  }

  /* ===================================================================== */
  /*  3. MUEBLES                                                           */
  /* ===================================================================== */
  function makeCtx(rooms, ops, R, theme) {
    return { rooms, ops, R, theme, F: [] };
  }
  function sideInfo(rc, ops) {
    const info = {};
    SIDES.forEach((s) => { info[s] = { len: sideLen(rc, s), ops: [] }; });
    ops.forEach((o) => {
      const chk = (s, line, coord, along, span) => { if (Math.abs(line - coord) < 0.15 && along > 0 && along < span) info[s].ops.push({ a: along - o.w / 2, b: along + o.w / 2, o }); };
      chk('N', rc.y, o.y, o.x - rc.x, rc.w); chk('S', rc.y + rc.h, o.y, o.x - rc.x, rc.w);
      chk('W', rc.x, o.x, o.y - rc.y, rc.h); chk('E', rc.x + rc.w, o.x, o.y - rc.y, rc.h);
    });
    return info;
  }
  function reservedRects(rc, info) {
    const out = [];
    SIDES.forEach((s) => info[s].ops.forEach(({ a, b, o }) => {
      let depth = 0;
      if (o.kind === 'door') depth = o.style === 'open' ? 0.7 : o.style === 'sliding' ? 0.5 : o.w + 0.1;
      else if (FP.Openings.style('window', o.style).sill < 0.05) depth = 0.35;
      if (!depth) return;
      if (s === 'N') out.push({ l: rc.x + a - 0.1, r: rc.x + b + 0.1, t: rc.y, b: rc.y + depth });
      if (s === 'S') out.push({ l: rc.x + a - 0.1, r: rc.x + b + 0.1, t: rc.y + rc.h - depth, b: rc.y + rc.h });
      if (s === 'W') out.push({ l: rc.x, r: rc.x + depth, t: rc.y + a - 0.1, b: rc.y + b + 0.1 });
      if (s === 'E') out.push({ l: rc.x + rc.w - depth, r: rc.x + rc.w, t: rc.y + a - 0.1, b: rc.y + b + 0.1 });
    }));
    return out;
  }
  const wallScore = (info, s) => info[s].ops.reduce((a, p) => a + (p.o.kind === 'door' ? 3 : 1.4), 0) - info[s].len * 0.06;
  const wallFree = (info, s, a, b) => !info[s].ops.some((p) => p.a < b && p.b > a);

  /** Intenta colocar un mueble; devuelve el objeto o null si choca / sale del cuarto. */
  function place(c, room, key, pose, o) {
    o = o || {};
    const d = def(key), it = FP.Furniture.create(key, pose.x, pose.y, pose.rot);
    if (o.w) it.w = o.w;
    if (o.h) it.h = o.h;
    const bb = FP.geom.bbox(it, 'furniture'), m = 0.055;
    if (bb.l < room.x + m || bb.r > room.x + room.w - m || bb.t < room.y + m || bb.b > room.y + room.h - m) return null;
    if (room._res.some((r) => overlap(bb, r))) return null;
    const clr = o.clr == null ? 0.03 : o.clr;
    for (const f of c.F) {
      if (isArt(f) || (o.ignore && o.ignore.includes(f))) continue;
      const fb = FP.geom.bbox(f, 'furniture');
      if (overlap(bb, { l: fb.l - clr, r: fb.r + clr, t: fb.t - clr, b: fb.b + clr })) return null;
    }
    c.F.push(it);
    return it;
  }
  function scan(room, rc, s, w, c) {
    const L = sideLen(rc, s), out = [];
    for (let a = w / 2 + 0.12; a <= L - w / 2 - 0.12 + 1e-6; a += 0.15) out.push(a);
    const mid = L / 2;
    return c.R.chance(0.5) ? out.sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid)) : c.R.shuffle(out);
  }
  function placeOnWalls(c, room, rc, key, sides, o) {
    const d = def(key), w = (o && o.w) || d.w, h = (o && o.h) || d.h;
    for (const s of sides) for (const a of scan(room, rc, s, w, c)) {
      const it = place(c, room, key, wallPose(rc, s, w, h, a), o);
      if (it) return { it, s, a };
    }
    return null;
  }
  function plantFor(c, room) {
    const area = room.w * room.h, small = ['plant_succ', 'plant_cactus', 'plant_snake', 'plant_bamboo', 'plant_fern'], big = ['plant', 'plant_monstera', 'plant_ficus', 'plant_palm', 'plant_olive', 'plant_fern'];
    return c.R.pick(area >= 12 ? big.concat(small) : small.concat(['plant_monstera']));
  }
  function corners(c, room, rc, key, o) {
    if (key === 'plant') key = plantFor(c, room);
    const d = def(key), w = (o && o.w) || d.w, h = (o && o.h) || d.h;
    for (const s of c.R.shuffle(SIDES)) for (const end of c.R.shuffle([0, 1])) {
      const L = sideLen(rc, s), a = end ? L - w / 2 - 0.1 : w / 2 + 0.1;
      const it = place(c, room, key, wallPose(rc, s, w, h, a), o);
      if (it) return it;
    }
    return null;
  }
  function mountArt(c, room, rc, info, s, along, key) {
    const d = def(key), L = sideLen(rc, s);
    if (along - d.w / 2 < 0.25 || along + d.w / 2 > L - 0.25) return null;
    if (!wallFree(info, s, along - d.w / 2 - 0.12, along + d.w / 2 + 0.12)) return null;
    const p = wallPose(rc, s, d.w, 0.04, along, 0.05), it = FP.Furniture.create(key, p.x, p.y, p.rot);
    const bb = FP.geom.bbox(it, 'furniture');
    if (c.F.some((f) => TALL.has(f.key) && overlap(bb, FP.geom.bbox(f, 'furniture')))) return null;
    it.frame = c.theme.frame;
    c.F.push(it);
    return it;
  }
  function hangArt(c, room, rc, info, keys) {
    const sides = c.R.shuffle(SIDES.filter((s) => sideLen(rc, s) >= 1.6)).sort((a, b) => wallScore(info, a) - wallScore(info, b));
    for (const s of sides) {
      const key = c.R.pick(keys), L = sideLen(rc, s);
      for (const a of [L / 2, L * 0.33, L * 0.66]) if (mountArt(c, room, rc, info, s, a, key)) return true;
    }
    return false;
  }

  function furnishBed(c, room, info, main) {
    const R = c.R, area = room.w * room.h;
    const key = main ? R.pick(['bed_king', 'bed_king', 'bed_queen']) : area < 9.5 ? R.pick(['bed_single', 'bed_double']) : R.pick(['bed_queen', 'bed_double']);
    const bd = def(key), order = SIDES.slice().sort((p, q) => wallScore(info, p) - wallScore(info, q));
    let bed = null, bs = null, ba = 0;
    for (const s of order) {
      const L = sideLen(room, s);
      if (L < bd.w + 1.1) continue;
      for (const off of [0, -0.25, 0.25, -0.5, 0.5]) {
        bed = place(c, room, key, wallPose(room, s, bd.w, bd.h, L / 2 + off));
        if (bed) { bs = s; ba = L / 2 + off; break; }
      }
      if (bed) break;
    }
    if (!bed) return;
    const ns = def('nightstand');
    [-1, 1].forEach((sg) => place(c, room, 'nightstand', wallPose(room, bs, ns.w, ns.h, ba + sg * (bd.w / 2 + ns.w / 2 + 0.04))));
    mountArt(c, room, room, info, bs, ba, R.pick(['art_abstract', 'art_geo', 'art_landscape', 'art_waves']));
    const others = order.filter((s) => s !== bs);
    placeOnWalls(c, room, room, 'wardrobe', others, { w: main || area > 12 ? 1.8 : 1.2 }) || placeOnWalls(c, room, room, 'wardrobe', others, { w: 1.2 });
    if (area >= 11.5) {
      const dk = placeOnWalls(c, room, room, 'desk', others);
      if (dk) {
        const f = INWARD[dk.s], ch = def('chair');
        place(c, room, 'chair', { x: dk.it.x + f[0] * (0.35 + ch.h / 2), y: dk.it.y + f[1] * (0.35 + ch.h / 2), rot: dk.it.rot + 180 }, { clr: 0 });
      }
    }
    if (area >= 13) placeOnWalls(c, room, room, 'dresser', others);
    if (main && area >= 14) placeOnWalls(c, room, room, 'vanity', others);
    if (area >= 10 && R.chance(0.7)) corners(c, room, room, 'plant');
  }

  function furnishLiving(c, room, rc, info) {
    const R = c.R, cand = SIDES.filter((s) => s !== rc._virtual);
    const sides = cand.filter((s) => sideLen(rc, s) >= 2.6).sort((a, b) => wallScore(info, a) - wallScore(info, b));
    for (const s of sides) {
      const L = sideLen(rc, s), D = s === 'N' || s === 'S' ? rc.h : rc.w;
      const sofaKey = rc.w * rc.h >= 24 && R.chance(0.45) ? 'sofaL' : L >= 3.6 ? 'sofa3' : 'sofa2', sd = def(sofaKey);
      const tvDist = U.clamp(D - 0.46 - sd.h - 0.6, 0, 2.7);
      if (tvDist < 1.0) continue;
      for (const along of scan(room, rc, s, 1.9, c)) {
        const stand = def('tvstand'), sp = wallPose(rc, s, stand.w, stand.h, along);
        const st1 = place(c, room, 'tvstand', sp);
        if (!st1) continue;
        const tv = place(c, room, 'tv', sp, { clr: -1 });
        const sofaP = pointFrom(rc, s, 0.06 + 0.4 + tvDist + sd.h / 2, along), rotS = sp.rot + 180;
        const sofa = place(c, room, sofaKey, { x: sofaP.x, y: sofaP.y, rot: rotS });
        if (sofa && sofaKey === 'sofaL') sofa.mirror = R.chance(0.5);
        if (!sofa) { c.F = c.F.filter((f) => f !== st1 && f !== tv); continue; }
        const cp = pointFrom(rc, s, 0.06 + 0.4 + tvDist * 0.5 + 0.1, along);
        place(c, room, 'coffee', { x: cp.x, y: cp.y, rot: sp.rot }, { clr: 0.05 });
        if (R.chance(0.7)) {
          [-1, 1].some((sg) => {
            const p = pointFrom(rc, s, 0.06 + 0.4 + tvDist * 0.5 + 0.1, along + sg * 1.5);
            return place(c, room, 'armchair', { x: p.x, y: p.y, rot: facing(p.x, p.y, cp.x, cp.y) }, { clr: 0.05 });
          });
        }
        hangArt(c, room, rc, info, ['art_landscape', 'art_triptych', 'art_abstract']);
        if (R.chance(0.85)) corners(c, room, rc, 'plant');
        if (R.chance(0.75)) corners(c, room, rc, 'floorlamp');
        if (R.chance(0.5)) placeOnWalls(c, room, rc, 'console', SIDES.filter((q) => q !== rc._virtual).sort((a, b) => wallScore(info, a) - wallScore(info, b)));
        if (rc.w * rc.h > 26) {
          const ord = SIDES.filter((q) => q !== rc._virtual).sort((a, b) => wallScore(info, a) - wallScore(info, b));
          placeOnWalls(c, room, rc, 'bookshelf', ord); placeOnWalls(c, room, rc, 'dresser', ord); corners(c, room, rc, 'plant');
          hangArt(c, room, rc, info, ['art_botanic', 'art_geo', 'art_waves']);
        }
        return true;
      }
    }
    // alternativa sin TV: sofá contra un muro con mesa de centro y sillón
    const fs = SIDES.filter((s) => s !== rc._virtual).sort((a, b) => wallScore(info, a) - wallScore(info, b));
    const sofa = placeOnWalls(c, room, rc, rc.w * rc.h > 12 ? 'sofa3' : 'sofa2', fs);
    if (sofa) {
      const p = pointFrom(rc, sofa.s, 0.06 + def(sofa.it.key).h + 0.6, sofa.a);
      place(c, room, 'coffee', { x: p.x, y: p.y, rot: sofa.it.rot }, { clr: 0.05 });
      const q = pointFrom(rc, sofa.s, 0.06 + def(sofa.it.key).h + 0.6, sofa.a + 1.6);
      place(c, room, 'armchair', { x: q.x, y: q.y, rot: facing(q.x, q.y, p.x, p.y) }, { clr: 0.05 });
      hangArt(c, room, rc, info, ['art_landscape', 'art_abstract']);
      corners(c, room, rc, 'plant');
      return true;
    }
    // último recurso: sofá flotante hacia el centro de la zona
    const cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2, key = rc.w * rc.h > 12 ? 'sofa3' : 'sofa2';
    for (const rot of c.R.shuffle([0, 90, 180, 270])) {
      const f = [Math.sin(-U.rad(rot)), Math.cos(U.rad(rot))];
      for (const [dx, dy] of [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4], [0.8, 0.4], [-0.8, -0.4]]) {
        const sofa = place(c, room, key, { x: cx + dx, y: cy + dy, rot }, { clr: 0.1 });
        if (!sofa) continue;
        place(c, room, 'coffee', { x: sofa.x + f[0] * 1.35, y: sofa.y + f[1] * 1.35, rot }, { clr: 0.05 });
        corners(c, room, rc, 'plant');
        return true;
      }
    }
    return false;
  }

  function furnishDining(c, room, rc, info) {
    const R = c.R, area = rc.w * rc.h, minD = Math.min(rc.w, rc.h);
    const key = area >= 20 && minD >= 3.6 ? 'table8' : area >= 12 && minD >= 3.2 ? 'table6' : 'table4', d = def(key);
    const rot = rc.w >= rc.h ? 0 : 90, cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2;
    let table = null;
    for (const [dx, dy] of [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25], [0.4, 0.4], [-0.4, -0.4]]) {
      table = place(c, room, key, { x: cx + dx, y: cy + dy, rot }, { clr: 0.5 });
      if (table) break;
    }
    if (!table) return;
    const per = key === 'table4' ? 2 : key === 'table6' ? 2 : 3, ch = def('chair'), chairs = [];
    const spots = [];
    for (let i = 0; i < per; i++) { const lx = (i - (per - 1) / 2) * (d.w / per) * (per === 2 ? 0.95 : 1); spots.push([lx, -(d.h / 2 + 0.14), 0], [lx, d.h / 2 + 0.14, 180]); }
    if (key !== 'table4') spots.push([-(d.w / 2 + 0.14), 0, 270], [d.w / 2 + 0.14, 0, 90]);
    spots.forEach(([lx, ly, r]) => { const p = FP.geom.toWorld(table, lx, ly); place(c, room, 'chair', { x: p.x, y: p.y, rot: table.rot + r }, { clr: 0, ignore: [table] }); });
    if (area >= 10) placeOnWalls(c, room, rc, R.chance(0.7) ? 'sideboard' : 'hutch', SIDES.filter((q) => q !== rc._virtual).sort((a, b) => wallScore(info, a) - wallScore(info, b)));
    hangArt(c, room, rc, info, ['art_botanic', 'art_abstract', 'art_waves']);
    if (R.chance(0.5)) corners(c, room, rc, 'plant');
  }

  function furnishKitchen(c, room, info) {
    const R = c.R, order = SIDES.slice().sort((p, q) => wallScore(info, p) - wallScore(info, q)).filter((s) => sideLen(room, s) >= 1.8);
    const seq = R.shuffle([['fridge', 0.7], ['stove', 0.6], ['sink', 0.8]]);
    let list = [seq[0], ['cabinets', 0.6], seq[1], ['cabinets', 1.2], seq[2], R.chance(0.6) ? ['dishwasher', 0.6] : ['cabinets', 0.6]], first = null;
    for (const s of order) {
      const L = sideLen(room, s), flip = R.chance(0.5), left = [];
      let cur = 0.12;
      for (const [key, w] of list) {
        let ok = false;
        while (cur + w <= L - 0.12) {
          const a = flip ? L - cur - w / 2 : cur + w / 2;
          if (place(c, room, key, wallPose(room, s, w, def(key).h, a), { w })) { ok = true; break; }
          cur += 0.15;
        }
        if (ok) { cur += w; first = first || s; } else left.push([key, w]);
      }
      list = left;
      if (!list.some(([k]) => ['fridge', 'stove', 'sink'].includes(k))) break;
    }
    if (!first) return;
    const D = first === 'N' || first === 'S' ? room.h : room.w, L1 = sideLen(room, first);
    if (room.w * room.h >= 13 && D >= 0.06 + 0.6 + 1.1 + 0.9 + 0.9) {
      const p = pointFrom(room, first, 0.06 + 0.6 + 1.1 + 0.45, L1 / 2), rot = wallPose(room, first, 1, 1, 0).rot;
      place(c, room, 'island', { x: p.x, y: p.y, rot }, { clr: 0.4 });
    }
    if (R.chance(0.5)) corners(c, room, room, 'plant');
  }

  function furnishBath(c, room, info) {
    const R = c.R, area = room.w * room.h;
    const doors = info; // sólo para puntuar muros
    const order = SIDES.slice().sort((p, q) => wallScore(info, p) - wallScore(info, q));
    if (area >= 5.4 && Math.max(room.w, room.h) >= 2.6 && R.chance(0.6)) placeOnWalls(c, room, room, 'tub', order) || corners(c, room, room, 'shower');
    else corners(c, room, room, 'shower');
    placeOnWalls(c, room, room, 'wc', order);
    (area >= 7.5 && room.name === 'Baño principal' && placeOnWalls(c, room, room, 'dblsink', order)) || placeOnWalls(c, room, room, 'basin', order);
    if (area >= 6 && !c.F.some((f) => f.key === 'shower') ) corners(c, room, room, 'shower');
    if (area >= 6.5 && R.chance(0.6)) corners(c, room, room, 'plant');
  }

  function hangCurtains(c, room, info) {
    SIDES.forEach((s) => info[s].ops.forEach(({ a, b, o }) => {
      if (o.kind !== 'window' || !c.R.chance(0.6)) return;
      const ow = o.w, L = sideLen(room, s), mid = (a + b) / 2;
      [-1, 1].forEach((sg) => {
        const w = Math.min(0.7, Math.max(0.4, ow * 0.3)), al = mid + sg * (ow / 2 + w / 2 + 0.05);
        if (al - w / 2 < 0.15 || al + w / 2 > L - 0.15) return;
        const p = wallPose(room, s, w, 0.05, al, 0.05), it = FP.Furniture.create('art_curtain', p.x, p.y, p.rot);
        it.w = w; it.h = 0.05;
        c.F.push(it);
      });
    }));
  }

  function furnishRoom(c, room) {
    furnishRoom0(c, room);
    if (['sala', 'principal', 'recamara'].includes(room.type)) hangCurtains(c, room, sideInfo(room, c.ops));
  }
  function furnishRoom0(c, room) {
    const info = sideInfo(room, c.ops);
    room._res = reservedRects(room, info);
    const R = c.R;
    switch (room.type) {
      case 'balcon': {
        const horiz = room.w >= room.h, cx = room.x + room.w / 2, cy = room.y + room.h / 2;
        place(c, room, 'sidetable', { x: cx, y: cy, rot: 0 }, { clr: 0.2 });
        [-1, 1].forEach((sg) => place(c, room, 'patiochair', horiz ? { x: cx + sg * 0.7, y: cy, rot: sg < 0 ? 270 : 90 } : { x: cx, y: cy + sg * 0.7, rot: sg < 0 ? 0 : 180 }, { clr: 0.05 }));
        corners(c, room, room, 'plant'); corners(c, room, room, 'plant');
        break;
      }
      case 'principal': furnishBed(c, room, info, true); break;
      case 'recamara': furnishBed(c, room, info, false); break;
      case 'sala': {
        const combined = /Comedor/.test(room.name);
        if (combined) {
          const lw = r5(room.w * 0.58), rcL = { x: room.x, y: room.y, w: lw, h: room.h, _virtual: 'E' }, rcD = { x: room.x + lw, y: room.y, w: room.w - lw, h: room.h };
          furnishLiving(c, room, rcL, sideInfo(rcL, c.ops));
          furnishDining(c, room, rcD, sideInfo(rcD, c.ops));
        } else furnishLiving(c, room, room, info);
        break;
      }
      case 'comedor': furnishDining(c, room, room, info); break;
      case 'cocina': furnishKitchen(c, room, info); break;
      case 'bano': furnishBath(c, room, info); break;
      case 'vestidor': placeOnWalls(c, room, room, 'wardrobe', SIDES.slice().sort((p, q) => wallScore(info, p) - wallScore(info, q)), { w: 1.8 }); placeOnWalls(c, room, room, 'wardrobe', SIDES, { w: 1.2 }); break;
      case 'oficina': {
        const order = SIDES.slice().sort((p, q) => wallScore(info, p) - wallScore(info, q));
        const dk = placeOnWalls(c, room, room, 'desk', order);
        if (dk) { const f = INWARD[dk.s], ch = def('chair'); place(c, room, 'ochair', { x: dk.it.x + f[0] * (0.35 + ch.h / 2), y: dk.it.y + f[1] * (0.35 + ch.h / 2), rot: dk.it.rot + 180 }, { clr: 0 }); }
        placeOnWalls(c, room, room, 'bookshelf', order);
        placeOnWalls(c, room, room, 'filecab', order);
        hangArt(c, room, room, info, ['art_geo', 'art_abstract']);
        corners(c, room, room, 'plant');
        break;
      }
      case 'lavanderia': {
        const r1 = placeOnWalls(c, room, room, 'washer', SIDES);
        placeOnWalls(c, room, room, 'dryer', SIDES);
        placeOnWalls(c, room, room, 'cabinets', SIDES, { w: 0.6 });
        break;
      }
      default: // pasillo
        hangArt(c, room, room, info, ['art_landscape', 'art_botanic', 'art_geo']);
        corners(c, room, room, 'plant');
        if (R.chance(0.4)) hangArt(c, room, room, info, ['art_abstract']);
    }
  }

  /* ===================================================================== */
  /*  4. ENSAMBLAJE                                                        */
  /* ===================================================================== */
  const THEMES = [
    { name: 'cálido', floors: { principal: 'walnut', recamara: 'oak', sala: 'oak', comedor: 'oak', cocina: 'porcelain', bano: 'porcelain', hall: 'oak', oficina: 'ash', vestidor: 'oak', lavanderia: 'porcelain_g' }, door: 'wood', frame: 'oak', bigWin: ['large', 'floor', 'large', 'floorsl'] },
    { name: 'elegante', floors: { principal: 'dark', recamara: 'walnut', sala: 'dark', comedor: 'dark', cocina: 'porcelain_g', bano: 'marble', hall: 'dark', oficina: 'walnut', vestidor: 'walnut', lavanderia: 'porcelain_g' }, door: 'black', frame: 'gold', bigWin: ['floor', 'floorsl', 'large'] },
    { name: 'moderno', floors: { principal: 'ash', recamara: 'ash', sala: 'porcelain_g', comedor: 'porcelain_g', cocina: 'porcelain_g', bano: 'porcelain', hall: 'porcelain_g', oficina: 'ash', vestidor: 'ash', lavanderia: 'porcelain' }, door: 'white', frame: 'black', bigWin: ['floorsl', 'floor', 'large'] },
    { name: 'mediterráneo', floors: { principal: 'oak', recamara: 'oak', sala: 'oak', comedor: 'oak', cocina: 'terracotta', bano: 'azulejo', hall: 'terracotta', oficina: 'oak', vestidor: 'oak', lavanderia: 'azulejo' }, door: 'wood', frame: 'white', bigWin: ['large', 'floor', 'large'] },
    { name: 'loft', floors: { principal: 'oak', recamara: 'oak', sala: 'concrete', comedor: 'concrete', cocina: 'concrete', bano: 'porcelain_g', hall: 'concrete', oficina: 'oak', vestidor: 'oak', lavanderia: 'porcelain_g' }, door: 'black', frame: 'black', bigWin: ['floorsl', 'floor', 'floorsl'] },
  ];

  const P = (tex, color) => ({ tex, color });
  const THEME_X = {
    'cálido': { walls: { default: P('paint', '#efe3d0'), principal: P('paint', '#d8c3a5'), recamara: P('paint', '#e9e0d3'), bano: P('tile', '#ffffff'), cocina: P('paint', '#f2cc8f'), comedor: P('paint', '#e8b4b8'), pasillo: P('paint', '#f6f4f0') }, doors: ['wood', 'white', 'oak_slat'], doorColor: '#f6f4f0', handles: ['chrome', 'brass'] },
    'elegante': { walls: { default: P('paint', '#c9b8a3'), principal: P('wallpaper', '#3d5a6c'), sala: P('paint', '#8d8d8d'), recamara: P('paint', '#b9c7c9'), bano: P('marble', '#ffffff'), cocina: P('tile', '#ffffff'), comedor: P('wallpaper', '#c9b8a3') }, doors: ['black', 'shaker', 'glass'], doorColor: '#22333b', handles: ['brass', 'black'] },
    'moderno': { walls: { default: P('paint', '#ffffff'), sala: P('concrete', '#ffffff'), principal: P('paint', '#b9c7c9'), recamara: P('paint', '#e9e0d3'), bano: P('tile', '#ffffff'), cocina: P('paint', '#ffffff') }, doors: ['flush', 'white', 'black'], doorColor: '#f6f4f0', handles: ['black', 'bar'] },
    'mediterráneo': { walls: { default: P('stucco', '#f6f4f0'), principal: P('stucco', '#a9c3b0'), recamara: P('stucco', '#f2cc8f'), sala: P('stucco', '#f6f4f0'), bano: P('tile', '#dfe9ec'), cocina: P('tile', '#ffffff'), comedor: P('stucco', '#e8b4b8') }, doors: ['wood', 'french', 'shaker'], doorColor: '#7d9c8c', handles: ['brass', 'black'] },
    'loft': { walls: { default: P('paint', '#f6f4f0'), sala: P('brick', '#ffffff'), cocina: P('concrete', '#ffffff'), principal: P('paint', '#8d8d8d'), recamara: P('paint', '#e9e0d3'), bano: P('tile', '#ffffff'), comedor: P('brick', '#ffffff') }, doors: ['black', 'glass', 'oak_slat'], doorColor: '#22333b', handles: ['black', 'bar'] },
  };

  function generate(opts) {
    opts = opts || {};
    const kind = opts.kind === 'casa' ? 'casa' : 'departamento';
    const R = mkRng(opts.seed || Math.floor(Math.random() * 4e9));
    const beds = opts.beds || (kind === 'casa' ? R.pick([2, 3, 3, 4].map((v) => Math.min(v, 3))) : R.pick([1, 2, 2, 3]));
    const theme = Object.assign({}, R.pick(THEMES)), L = layout(kind, beds, R), tx = THEME_X[theme.name];
    theme.door = R.pick(tx.doors);
    const rooms = L.rooms, ops = [];
    const by = (t) => rooms.find((r) => r.tag === t), all = (t) => rooms.filter((r) => r.tag === t);
    const principal = by('principal'), ens = by('ens'), vest = by('vest'), hall = by('hall'), sala = by('sala'), comedor = by('comedor'), cocina = by('cocina');
    const dfin = (rm) => (rm.type === 'bano' || rm.type === 'lavanderia' ? 'flush' : theme.door);

    // entrada
    const w0 = R.chance(0.2) ? 'double' : 'single', ew = FP.Openings.style('door', w0).w;
    const et = R.range(sala.x + 0.9 + ew / 2, sala.x + Math.min(sala.w, 4.4) - 0.9 - ew / 2);
    const entrance = FP.Openings.create('door', w0, et, L.H, 0, -1);
    entrance.finish = R.pick(['wood', 'oak_slat', 'black']);
    ops.push(entrance);
    // conexiones
    if (L.hall) {
      rooms.filter((r) => ['principal', 'private'].includes(r.tag)).forEach((r) => addDoor(ops, r, hall, ['single'], r, R, dfin(r)));
      if (ens) addDoor(ops, ens, principal, ['single'], ens, R, 'flush');
      if (vest) addDoor(ops, vest, principal, ['single'], vest, R, theme.door);
      addDoor(ops, hall, sala, ['open'], hall, R, theme.door) || addDoor(ops, hall, cocina, ['open'], hall, R, theme.door);
    } else {
      addDoor(ops, principal, sala, ['single'], principal, R, theme.door);
      if (ens) (addDoor(ops, ens, sala, ['single'], ens, R, 'flush') || addDoor(ops, ens, principal, ['single'], ens, R, 'flush'));
      rooms.filter((r) => r.tag === 'private').forEach((r) => addDoor(ops, r, sala, ['single'], r, R, theme.door));
    }
    if (comedor) { addDoor(ops, sala, comedor, ['open'], sala, R, theme.door); addDoor(ops, comedor, cocina, R.chance(0.65) ? ['open'] : ['single'], cocina, R, theme.door); }
    else addDoor(ops, sala, cocina, R.chance(0.6) ? ['open'] : ['single'], cocina, R, theme.door);
    addWindows(ops, rooms, L.W, L.H, R, theme);
    if (R.chance(kind === 'casa' ? 0.7 : beds >= 2 ? 0.6 : 0.45)) addBalcony(ops, rooms, L, R, entrance);

    // muebles
    const c = makeCtx(rooms, ops, R, theme);
    rooms.forEach((rm) => furnishRoom(c, rm));

    // acabado de puertas
    const hk = R.pick(tx.handles);
    ops.forEach((o) => { if (o.kind !== 'door') return; o.handle = hk; o.color = o.finish === 'flush' && o !== entrance && !tx.doors.includes('flush') ? '#f6f4f0' : o.finish === 'flush' ? '#f6f4f0' : tx.doorColor; });
    // salida
    const out = rooms.map((r) => {
      const fl = r.type === 'balcon' ? 'deck' : theme.floors[r.tag === 'hall' ? 'hall' : r.type] || 'oak';
      const wl = tx.walls[r.tag === 'hall' ? 'pasillo' : r.type] || tx.walls.default;
      if (r.type === 'balcon') return { id: r.id, type: 'balcon', name: r.name, x: r.x, y: r.y, w: r.w, h: r.h, floor: 'deck', rail: r.rail };
      return { id: r.id, type: r.type, name: r.name, x: r.x, y: r.y, w: r.w, h: r.h, floor: fl, wall: { tex: wl.tex, color: wl.color } };
    });
    return { kind, beds, theme: theme.name, space: { w: L.W, h: L.H }, rooms: out, openings: ops, furniture: c.F, name: (kind === 'casa' ? 'Casa' : 'Departamento') + ' · ' + beds + (beds === 1 ? ' recámara' : ' recámaras') };
  }

  /** Reemplaza el contenido del proyecto actual (se puede deshacer). */
  function apply(opts) {
    const g = generate(opts), P = st.project;
    P.space = g.space; P.kind = g.kind;
    P.rooms = g.rooms; P.walls = []; P.openings = g.openings; P.furniture = g.furniture; P.measures = [];
    if (opts.rename !== false) P.name = g.name;
    st.sel = [];
    FP.emit('project');
    FP.emit('selection');
    FP.commit();
    FP.Editor.resetView();
    FP.toast('Diseño ' + g.theme + ' · ' + g.name.split(' · ')[1]);
    return g;
  }

  /** Ventanita para elegir tipo y recámaras. */
  function dialog() {
    let kind = st.project ? st.project.kind : 'departamento', beds = 0;
    const d = document.createElement('div');
    d.className = 'overlay open'; d.style.zIndex = 95; d.style.background = 'rgba(20,20,25,.4)';
    const draw = () => {
      d.innerHTML = `<div class="start-card" style="max-width:440px;padding:26px">
        <h2 style="margin:0 0 4px;font-size:23px;letter-spacing:-.02em">Diseño aleatorio</h2>
        <p class="sub" style="margin:0 0 16px;font-size:13.5px">Crea una distribución realista con muebles, ventanas, pisos y arte. Puedes generar tantas veces como quieras y deshacer con Ctrl/Cmd+Z.</p>
        <div class="field-label">Tipo</div>
        <div class="chips" style="margin-bottom:14px">${[['departamento', 'Departamento'], ['casa', 'Casa']].map(([k, n]) => `<button class="chip${kind === k ? ' on' : ''}" data-kind="${k}">${n}</button>`).join('')}</div>
        <div class="field-label">Recámaras</div>
        <div class="chips" style="margin-bottom:20px">${[[0, 'Al azar'], [1, '1'], [2, '2'], [3, '3']].map(([k, n]) => `<button class="chip${beds === k ? ' on' : ''}" data-beds="${k}">${n}</button>`).join('')}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button class="pbtn" id="rdClose">Cerrar</button><button class="primary" id="rdGo">${FP.icon('dice', 16)} Generar</button></div></div>`;
      d.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.kind; draw(); }));
      d.querySelectorAll('[data-beds]').forEach((b) => b.addEventListener('click', () => { beds = +b.dataset.beds; draw(); }));
      d.querySelector('#rdClose').onclick = () => d.remove();
      d.querySelector('#rdGo').onclick = () => {
        const P = st.project;
        if ((P.rooms.length || P.furniture.length) && !window.confirm('Esto reemplaza tu plano actual (puedes deshacer con Ctrl/Cmd+Z). ¿Continuar?')) return;
        apply({ kind, beds });
        draw();
      };
    };
    draw();
    document.body.appendChild(d);
  }

  FP.Generator = { generate, apply, dialog, THEMES, _i: { place, wallPose, sideInfo, reservedRects, makeCtx, mkRng, def } };
})();

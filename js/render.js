/* render.js — convierte el proyecto en SVG (función pura). La usan el editor, la exportación y las miniaturas.
   opts: { mode:'plan'|'pres', px:(metros por píxel), showDims, showGrid } */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, n = U.n;
  const INK = '#1d1d1f', ACC = '#2f6df6';

  function labels(project, p, px) {
    const scale = 1 / px;
    let s = '';
    project.rooms.forEach((r) => {
      const pw = r.w * scale, ph = r.h * scale;
      if (pw < 46 || ph < 26) return;
      const full = pw >= 96 && ph >= 56;
      const fs1 = n(px * (p ? 13.5 : 12.5)), fs2 = n(px * 10.5);
      const lines = [{ t: r.name, fs: fs1, w: 600, c: INK }];
      if (full) {
        lines.push({ t: `${U.fmt(r.w)} × ${U.fmt(r.h)} m`, fs: fs2, w: 500, c: '#6e6e73' });
        lines.push({ t: `${(r.w * r.h).toFixed(1)} m²`, fs: fs2, w: 500, c: '#6e6e73' });
      }
      const gap = px * 3, total = lines.reduce((a, l) => a + l.fs * 1.15, 0) + gap * (lines.length - 1);
      let y = r.y + r.h / 2 - total / 2;
      const halo = p ? FP.Rooms.color(r.type) : '#fff';
      lines.forEach((l) => {
        y += l.fs * 1.0;
        s += `<text x="${n(r.x + r.w / 2)}" y="${n(y)}" text-anchor="middle" font-size="${l.fs}" font-weight="${l.w}" fill="${l.c}" font-family="${FP.FONT}" stroke="${halo}" stroke-opacity=".85" stroke-width="${n(px * 3.5)}" stroke-linejoin="round" paint-order="stroke">${U.esc(l.t)}</text>`;
        y += l.fs * 0.15 + gap;
      });
    });
    return s;
  }

  function measures(project, px) {
    let s = '';
    project.measures.forEach((m) => {
      const L = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
      if (L < 0.01) return;
      s += `<g stroke="${ACC}" stroke-width="${n(1.4 * px)}" fill="${ACC}"><line x1="${n(m.x1)}" y1="${n(m.y1)}" x2="${n(m.x2)}" y2="${n(m.y2)}" stroke-dasharray="${n(5 * px)} ${n(3 * px)}"/><circle cx="${n(m.x1)}" cy="${n(m.y1)}" r="${n(3.2 * px)}" stroke="none"/><circle cx="${n(m.x2)}" cy="${n(m.y2)}" r="${n(3.2 * px)}" stroke="none"/></g>`;
      let ang = U.deg(Math.atan2(m.y2 - m.y1, m.x2 - m.x1));
      if (ang >= 90) ang -= 180;
      if (ang < -90) ang += 180;
      s += `<text transform="translate(${n((m.x1 + m.x2) / 2)} ${n((m.y1 + m.y2) / 2)}) rotate(${n(ang)})" text-anchor="middle" dy="${n(-6 * px)}" font-size="${n(11.5 * px)}" font-weight="600" fill="${ACC}" font-family="${FP.FONT}" stroke="#fff" stroke-width="${n(3.5 * px)}" stroke-linejoin="round" paint-order="stroke">${U.fmt(L)} m</text>`;
    });
    return s;
  }

  FP.Render = {
    ACC,
    scene(project, o) {
      const p = o.mode === 'pres', px = o.px, W = project.space.w, H = project.space.h;
      let s = '<defs>';
      if (o.showGrid) {
        s += `<pattern id="g1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#d9d9e0" stroke-width="${n(px)}"/></pattern>`;
        if (px < 0.05) s += `<pattern id="g2" width=".5" height=".5" patternUnits="userSpaceOnUse"><path d="M.5 0H0V.5" fill="none" stroke="#ebebf0" stroke-width="${n(px)}"/></pattern>`;
      }
      if (p) s += '<filter id="sh" x="-15%" y="-15%" width="130%" height="130%"><feDropShadow dx="0" dy="0.03" stdDeviation="0.035" flood-color="#000" flood-opacity=".2"/></filter>';
      s += `<mask id="wm" maskUnits="userSpaceOnUse" x="-8" y="-8" width="${n(W + 16)}" height="${n(H + 16)}"><rect x="-8" y="-8" width="${n(W + 16)}" height="${n(H + 16)}" fill="#fff"/>${project.openings.map(FP.Openings.mask).join('')}</mask>`;
      if (p) {
        s += '<pattern id="pw" width="1.2" height="0.6" patternUnits="userSpaceOnUse"><path d="M0 0H1.2M0 .2H1.2M0 .4H1.2" stroke="#8a5a2b" stroke-opacity=".13" stroke-width="' + n(px) + '" fill="none"/><path d="M.4 0V.2M.9 .2V.4M.2 .4V.6" stroke="#8a5a2b" stroke-opacity=".13" stroke-width="' + n(px) + '"/></pattern>';
        s += '<pattern id="pt" width=".6" height=".6" patternUnits="userSpaceOnUse"><path d="M.6 0H0V.6" stroke="#5b7f8a" stroke-opacity=".2" stroke-width="' + n(px) + '" fill="none"/></pattern>';
      }
      s += '</defs>';

      // hoja + cuadrícula
      const sf = p && project.space.floor && FP.Rooms.FLOORS.find((f) => f.id === project.space.floor);
      const mixw = (hex) => { const v = parseInt(hex.slice(1), 16), c = (sh) => Math.round((((v >> sh) & 255) * 0.5) + 127); return `rgb(${c(16)},${c(8)},${c(0)})`; };
      const cells = FP.Walls.footprint(project).cells, cr = (c, fill) => `<rect x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w + 0.002)}" height="${n(c.h + 0.002)}" fill="${fill}"/>`;
      cells.forEach((c) => { s += cr(c, sf ? mixw(sf.color) : '#fff'); });
      if (sf) cells.forEach((c) => { s += cr(c, { wood: 'url(#pw)', tile: 'url(#pt)', stone: 'url(#pt)' }[sf.kind] || 'none'); });
      if (o.showGrid) cells.forEach((c) => { if (px < 0.05) s += cr(c, 'url(#g2)'); s += cr(c, 'url(#g1)'); });
      // pisos de habitaciones
      if (p) project.rooms.forEach((r) => { s += `<rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.w)}" height="${n(r.h)}" fill="${FP.Rooms.color(r.type)}"/><rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.w)}" height="${n(r.h)}" fill="${{ wood: 'url(#pw)', tile: 'url(#pt)', stone: 'url(#pt)' }[FP.Rooms.floorDef(r).kind] || 'none'}"/>`; });

      // muros (con huecos para puertas/ventanas)
      s += `<g mask="url(#wm)" fill="none" stroke="${INK}" stroke-linejoin="miter">`;
      const segs = FP.Walls.segments(project);
      ['room', 'wall', 'boundary', 'rail'].forEach((src) => segs.filter((g) => g.src === src).forEach((g) => { s += `<line x1="${n(g.x1)}" y1="${n(g.y1)}" x2="${n(g.x2)}" y2="${n(g.y2)}" stroke-width="${g.t}" stroke-linecap="square"/>`; }));
      s += '</g>';

      // muebles
      s += `<g${p ? ' filter="url(#sh)"' : ''}>${project.furniture.map((f) => FP.Furniture.svg(f, p, px)).join('')}</g>`;
      // puertas y ventanas
      s += project.openings.map((op) => FP.Openings.svg(op, p, px)).join('');
      // etiquetas y mediciones
      s += labels(project, p, px);
      s += measures(project, px);
      // cotas exteriores
      if (o.showDims) {
        const shaped = (project.space.cuts || []).length > 0;
        if (shaped) { // forma propia: cota en cada tramo del muro exterior (por fuera) y las medidas totales más lejos
          FP.Walls.outline(project).forEach((g) => {
            const L = Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
            if (L < 0.3) return;
            const dx = g.x2 - g.x1, dy = g.y2 - g.y1, nx = -dy / L, ny = dx / L, mx = (g.x1 + g.x2) / 2, my = (g.y1 + g.y2) / 2;
            const out = FP.Walls.inside(project, mx + nx * 0.06, my + ny * 0.06) ? -1 : 1;
            s += FP.Measure.dim(g.x1, g.y1, g.x2, g.y2, 0.55 * out, U.fmt(L) + ' m', px, { bold: 1, fs: 11.5, color: '#3a3a3f' });
          });
          // medidas totales solo si ningún tramo ya cubre todo el ancho / alto
          const ol = FP.Walls.outline(project), full = (a) => ol.some((g) => Math.abs(g.x1 - g.x2) > 1e-6 === a && Math.hypot(g.x2 - g.x1, g.y2 - g.y1) > (a ? W : H) - 0.02);
          if (!full(true)) s += FP.Measure.dim(0, 0, W, 0, -1.5, U.fmt(W) + ' m', px, { fs: 11, color: '#8a8a93' });
          if (!full(false)) s += FP.Measure.dim(0, 0, 0, H, 1.5, U.fmt(H) + ' m', px, { fs: 11, color: '#8a8a93' });
        } else {
          s += FP.Measure.dim(0, 0, W, 0, -0.6, U.fmt(W) + ' m', px, { bold: 1, fs: 12, color: '#3a3a3f' });
          s += FP.Measure.dim(0, 0, 0, H, 0.6, U.fmt(H) + ' m', px, { bold: 1, fs: 12, color: '#3a3a3f' });
        }
      }
      return s;
    },
  };
})();

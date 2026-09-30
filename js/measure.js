/* measure.js — cotas (líneas de dimensión) y utilidades de medición. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, n = U.n;
  const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";

  FP.FONT = FONT;
  FP.Measure = {
    /** Cota entre (x1,y1)-(x2,y2), desplazada `off` metros hacia la normal (-uy, ux). */
    dim(x1, y1, x2, y2, off, text, px, o = {}) {
      const col = o.color || '#55555c', fs = n(px * (o.fs || 11));
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (L < 1e-6) return '';
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, sg = off < 0 ? -1 : 1;
      const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
      const tk = 4 * px, tx = (ux + nx) * 0.7071 * tk, ty = (uy + ny) * 0.7071 * tk;
      const ext = (px_, py_, qx, qy) => `<line x1="${n(px_ + nx * sg * 0.06)}" y1="${n(py_ + ny * sg * 0.06)}" x2="${n(qx + nx * sg * 0.08)}" y2="${n(qy + ny * sg * 0.08)}"/>`;
      let s = `<g stroke="${col}" stroke-width="${n(px)}" fill="none" stroke-linecap="round">`;
      s += ext(x1, y1, ax, ay) + ext(x2, y2, bx, by);
      s += `<line x1="${n(ax)}" y1="${n(ay)}" x2="${n(bx)}" y2="${n(by)}"/>`;
      s += `<line x1="${n(ax - tx)}" y1="${n(ay - ty)}" x2="${n(ax + tx)}" y2="${n(ay + ty)}"/>`;
      s += `<line x1="${n(bx - tx)}" y1="${n(by - ty)}" x2="${n(bx + tx)}" y2="${n(by + ty)}"/>`;
      s += '</g>';
      let ang = U.deg(Math.atan2(dy, dx));
      if (ang >= 90) ang -= 180;
      if (ang < -90) ang += 180;
      s += `<text transform="translate(${n((ax + bx) / 2)} ${n((ay + by) / 2)}) rotate(${n(ang)})" text-anchor="middle" dy="${n(-4 * px)}" font-size="${fs}" font-weight="${o.bold ? 600 : 500}" fill="${col}" font-family="${FONT}" stroke="${o.halo || '#fff'}" stroke-width="${n(3 * px)}" stroke-linejoin="round" paint-order="stroke">${text}</text>`;
      return s;
    },
    len: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    fmt: (m) => U.fmt(m) + ' m',
  };
})();

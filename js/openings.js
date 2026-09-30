/* openings.js — puertas y ventanas con simbología arquitectónica.
   Coordenadas locales: x a lo largo del muro, y perpendicular. `flip` (+1/-1) = lado hacia donde abre. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, n = U.n;

  const DEFS = {
    door: {
      label: 'Puerta', h3: 2.1, sill: 0,
      styles: [
        { id: 'single', name: 'Puerta sencilla', w: 0.9 },
        { id: 'double', name: 'Puerta doble', w: 1.6 },
        { id: 'sliding', name: 'Puerta corrediza', w: 1.5 },
        { id: 'barn', name: 'Puerta de granero', w: 1.0 },
        { id: 'open', name: 'Paso libre (sin puerta)', w: 1.2 },
      ],
    },
    window: {
      label: 'Ventana', h3: 1.2, sill: 0.9,
      styles: [
        { id: 'single', name: 'Ventana sencilla', w: 1.0, sill: 0.9, top: 2.1 },
        { id: 'large', name: 'Ventana grande', w: 2.0, sill: 0.5, top: 2.2 },
        { id: 'sliding', name: 'Ventana corrediza', w: 1.6, sill: 0.9, top: 2.1 },
        { id: 'floor', name: 'Ventanal piso a techo', w: 2.4, sill: 0, top: 2.5 },
        { id: 'floorsl', name: 'Ventanal corredizo', w: 3.0, sill: 0, top: 2.5 },
      ],
    },
  };

  const INK = '#1d1d1f', GRAY = '#8a8a93';

  FP.Openings = {
    DEFS,
    style: (kind, id) => DEFS[kind].styles.find((s) => s.id === id) || DEFS[kind].styles[0],
    create(kind, style, x, y, rot, flip) {
      const s = FP.Openings.style(kind, style);
      return { id: U.uid(), kind, style: s.id, x, y, rot: rot || 0, w: s.w, flip: flip || 1, mirror: false, finish: 'wood', color: '#f6f4f0', handle: 'chrome' };
    },
    label(o) { return FP.Openings.style(o.kind, o.style).name; },

    /** Rectángulo negro para la máscara que "corta" el muro. */
    mask(o) {
      return `<rect x="${n(-o.w / 2)}" y="-0.12" width="${n(o.w)}" height="0.24" fill="#000" transform="translate(${n(o.x)} ${n(o.y)}) rotate(${n(o.rot || 0)})"/>`;
    },

    svg(o, p, px) {
      const w = o.w, s = o.flip < 0 ? -1 : 1, T = 0.1;
      const sw = n(1.4 * px), hw = n(0.8 * px), F = (c) => (p ? c : '#fff');
      const dash = `stroke-dasharray="${n(4 * px)} ${n(3 * px)}"`;
      let g = `<g transform="translate(${n(o.x)} ${n(o.y)}) rotate(${n(o.rot || 0)})${o.mirror ? ' scale(-1 1)' : ''}">`;
      if (o.kind === 'door') {
        const jamb = (x) => `<rect x="${n(x - 0.025)}" y="-0.07" width="0.05" height="0.14" fill="${INK}"/>`;
        g += jamb(-w / 2) + jamb(w / 2);
        const leaf = (x, len, sgn) => `<rect x="${n(x)}" y="${sgn > 0 ? 0 : n(-len)}" width="0.04" height="${n(len)}" fill="${F('#f5efe6')}" stroke="${INK}" stroke-width="${sw}"/>`;
        const arc = (sx, hx, r, sweep, ey) => `<path d="M${n(sx)} 0A${n(r)} ${n(r)} 0 0 ${sweep} ${n(hx)} ${n(ey)}" fill="none" stroke="${GRAY}" stroke-width="${hw}" ${dash}/>`;
        if (o.style === 'single') {
          g += `<line x1="${n(-w / 2)}" y1="0" x2="${n(w / 2)}" y2="0" stroke="${GRAY}" stroke-width="${hw}"/>`;
          g += leaf(-w / 2, w, s) + arc(w / 2, -w / 2 + 0.02, w, s > 0 ? 1 : 0, s * w);
        } else if (o.style === 'double') {
          const h2 = w / 2;
          g += `<line x1="${n(-w / 2)}" y1="0" x2="${n(w / 2)}" y2="0" stroke="${GRAY}" stroke-width="${hw}"/>`;
          g += leaf(-w / 2, h2, s) + arc(0, -w / 2 + 0.02, h2, s > 0 ? 1 : 0, s * h2);
          g += leaf(w / 2 - 0.04, h2, s) + arc(0, w / 2 - 0.02, h2, s > 0 ? 0 : 1, s * h2);
        } else if (o.style === 'barn') {
          g += `<rect x="${n(-w / 2 - 0.06 + w * 0.5)}" y="${s > 0 ? 0.03 : -0.09}" width="${n(w + 0.12)}" height="0.06" fill="${F('#f5efe6')}" stroke="${INK}" stroke-width="${sw}"/>`;
          g += `<line x1="${n(-w / 2 - 0.1)}" y1="${s > 0 ? 0.13 : -0.13}" x2="${n(w * 1.5 + 0.1)}" y2="${s > 0 ? 0.13 : -0.13}" stroke="${GRAY}" stroke-width="${hw}"/>`;
        } else if (o.style === 'open') {
          g += `<line x1="${n(-w / 2)}" y1="0" x2="${n(w / 2)}" y2="0" stroke="${GRAY}" stroke-width="${hw}" ${dash}/>`;
        } else {
          g += `<rect x="${n(-w / 2)}" y="-0.04" width="${n(w * 0.55)}" height="0.03" fill="${F('#f5efe6')}" stroke="${INK}" stroke-width="${sw}"/>`;
          g += `<rect x="${n(-w / 2 + w * 0.45)}" y="0.01" width="${n(w * 0.55)}" height="0.03" fill="${F('#f5efe6')}" stroke="${INK}" stroke-width="${sw}"/>`;
          g += `<path d="M${n(-w * 0.18)} ${n(s * 0.16)}H${n(w * 0.18)}m${n(-0.05)} -0.04l0.05 0.04l${n(-0.05)} 0.04" fill="none" stroke="${GRAY}" stroke-width="${hw}"/>`;
        }
      } else {
        g += `<rect x="${n(-w / 2)}" y="${-T / 2}" width="${n(w)}" height="${T}" fill="${F('#e3f1fa')}" stroke="${INK}" stroke-width="${sw}"/>`;
        if (o.style === 'sliding' || o.style === 'floorsl') {
          g += `<rect x="${n(-w / 2 + 0.02)}" y="-0.035" width="${n(w * 0.55)}" height="0.03" fill="${F('#f4fafe')}" stroke="${INK}" stroke-width="${hw}"/>`;
          g += `<rect x="${n(w / 2 - 0.02 - w * 0.55)}" y="0.005" width="${n(w * 0.55)}" height="0.03" fill="${F('#f4fafe')}" stroke="${INK}" stroke-width="${hw}"/>`;
        } else {
          g += `<line x1="${n(-w / 2)}" y1="0" x2="${n(w / 2)}" y2="0" stroke="${INK}" stroke-width="${hw}"/>`;
          g += `<line x1="${n(-w / 2)}" y1="-0.025" x2="${n(w / 2)}" y2="-0.025" stroke="${INK}" stroke-width="${hw}"/>`;
          g += `<line x1="${n(-w / 2)}" y1="0.025" x2="${n(w / 2)}" y2="0.025" stroke="${INK}" stroke-width="${hw}"/>`;
          if (o.style === 'floor') g += `<line x1="${n(-w / 6)}" y1="${-T / 2}" x2="${n(-w / 6)}" y2="${T / 2}" stroke="${INK}" stroke-width="${sw}"/><line x1="${n(w / 6)}" y1="${-T / 2}" x2="${n(w / 6)}" y2="${T / 2}" stroke="${INK}" stroke-width="${sw}"/>`;
          if (o.style === 'large') g += `<line x1="0" y1="${-T / 2}" x2="0" y2="${T / 2}" stroke="${INK}" stroke-width="${sw}"/>`;
        }
      }
      return g + '</g>';
    },

    /** Miniatura para los menús. */
    icon(kind, style) {
      const s = FP.Openings.style(kind, style), w = s.w;
      const o = { kind, style: s.id, x: 0, y: 0, rot: 0, w, flip: 1, mirror: false };
      const vw = w + 0.3, px = vw / 44;
      const vh = kind === 'door' ? (s.id === 'double' ? w / 2 : s.id === 'sliding' || s.id === 'open' || s.id === 'barn' ? 0.4 : w) + 0.3 : 0.4;
      const y0 = kind === 'door' ? -0.15 : -0.2;
      return `<svg width="44" height="${Math.round(vh / px)}" viewBox="${n(-vw / 2)} ${y0} ${n(vw)} ${n(vh)}">${FP.Openings.svg(o, true, px)}</svg>`;
    },
  };
})();

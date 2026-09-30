/* catalog3.js — más muebles y accesorios (planta 2D). Modelos 3D en models3d3.js. */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;

  const wood = '#c9a26f', dark = '#6b4630';
  const D = {
    tvwall: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, 0.07, dark) + g.rect(-w / 2 + 0.02, -h / 2 + 0.07, w - 0.04, h - 0.07, wood);
      const n = Math.max(3, Math.round(w / 0.5));
      for (let i = 1; i < n; i++) s += g.line(-w / 2 + (w * i) / n, -h / 2 + 0.07, -w / 2 + (w * i) / n, h / 2);
      return s + g.rect(-w / 2 + 0.3, -h / 2 + 0.12, 0.5, 0.08, '#f3e3c3', { hair: 1, soft: 1 }) + g.rect(w / 2 - 0.8, -h / 2 + 0.12, 0.5, 0.08, '#f3e3c3', { hair: 1, soft: 1 });
    },
    wallunit: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, wood);
      for (let i = 1; i < 4; i++) s += g.line(-w / 2 + (w * i) / 4, -h / 2, -w / 2 + (w * i) / 4, h / 2);
      return s + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#dcb98a', { hair: 1, soft: 1 });
    },
    desk2: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#d9c9b0') + g.rect(-w / 2, -h / 2, w, 0.3, wood, { hair: 1 }) + g.rect(-0.2, -h / 2 + 0.3, 0.4, h - 0.3, '#c5b192', { hair: 1 });
      for (let i = 1; i < 4; i++) s += g.line(-w / 2 + (w * i) / 4, -h / 2, -w / 2 + (w * i) / 4, -h / 2 + 0.3, { soft: 1 });
      return s + g.rect(-w / 4 - 0.22, -h / 2 + 0.36, 0.44, 0.03, '#2a2a2f', { hair: 1 }) + g.rect(w / 4 - 0.22, -h / 2 + 0.36, 0.44, 0.03, '#2a2a2f', { hair: 1 });
    },
    bed_wood: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, 0.1, dark) + g.rect(-w / 2 + 0.03, -h / 2 + 0.1, 0.5, 0.4, '#d9c9b0', { hair: 1 }) + g.rect(w / 2 - 0.53, -h / 2 + 0.1, 0.5, 0.4, '#d9c9b0', { hair: 1 });
      const bw = 1.9, bx = -bw / 2;
      s += g.rect(bx, -h / 2 + 0.1, bw, h - 0.1, '#f4f1eb', { rx: 0.03 });
      s += g.rect(bx + 0.1, -h / 2 + 0.16, bw / 2 - 0.15, 0.36, '#fff', { rx: 0.07, hair: 1 }) + g.rect(0.05, -h / 2 + 0.16, bw / 2 - 0.15, 0.36, '#fff', { rx: 0.07, hair: 1 });
      return s + g.rect(bx, -h / 2 + 0.7, bw, h - 0.8, '#a9bccd', { rx: 0.03, hair: 1 });
    },
    closet_full: (w, h, g) => {
      let s = g.rect(-w / 2, -h / 2, w, h, '#e3d9cb');
      const n = Math.max(2, Math.round(w / 0.6));
      for (let i = 1; i < n; i++) s += g.line(-w / 2 + (w * i) / n, -h / 2 + 0.02, -w / 2 + (w * i) / n, h / 2);
      return s + g.line(-w / 2 + 0.05, -h / 2 + 0.2, w / 2 - 0.05, -h / 2 + 0.2, { dash: 1, soft: 1 });
    },
    shoebench: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#b9a58f', { rx: 0.03 }) + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#d6c7b4', { rx: 0.03, hair: 1 }),
    coatrack: (w, h, g) => { let s = g.circ(0, 0, 0.03, '#5b3a2a'); for (let i = 0; i < 6; i++) s += `<g transform="rotate(${i * 60})">${g.line(0, 0, 0, -w / 2 + 0.02)}</g>`; return s; },
    pendant: (w, h, g) => g.circ(0, 0, w / 2, '#f3e3c3', { soft: 1 }) + g.circ(0, 0, w / 2 - 0.08, '#fff4d6', { hair: 1, soft: 1 }) + g.circ(0, 0, 0.03, '#5b5f66', { hair: 1 }),
    fan: (w, h, g) => { let s = ''; for (let i = 0; i < 4; i++) s += `<g transform="rotate(${i * 90 + 20})">${g.rect(-0.07, -w / 2, 0.14, w / 2 - 0.05, '#e6dccb', { hair: 1, soft: 1, rx: 0.05 })}</g>`; return s + g.circ(0, 0, 0.1, '#8d8d95', { hair: 1 }); },
    rocker: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#c9b8a6', { rx: 0.08 }) + g.rect(-w / 2, -h / 2, w, 0.14, '#b3a08c', { rx: 0.05, hair: 1 }) + g.line(-w / 2 + 0.05, h / 2 - 0.02, w / 2 - 0.05, h / 2 - 0.02, { soft: 1 }) + g.rect(-w / 2 + 0.1, -h / 2 + 0.18, w - 0.2, h - 0.3, '#ddd0c0', { rx: 0.06, hair: 1 }),
    barcart: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#e9dfd0', { rx: 0.02 }) + g.circ(-0.1, -0.2, 0.04, '#7fb08a', { hair: 1 }) + g.circ(0.08, -0.05, 0.04, '#c96f3b', { hair: 1 }) + g.circ(0, 0.2, 0.05, '#dcecf3', { hair: 1 }),
    aquarium: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#cdb99b') + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, h - 0.08, '#bfe3f2', { hair: 1, soft: 1 }) + g.circ(-0.2, 0, 0.03, '#ff9a3d', { hair: 1 }) + g.circ(0.2, 0.03, 0.03, '#ffd04d', { hair: 1 }),
    daybed: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#efe6d6', { rx: 0.05 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.05, w - 0.1, 0.4, '#d9c8b0', { rx: 0.08, hair: 1 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.5, w - 0.1, h - 0.55, '#f7f3ea', { rx: 0.04, hair: 1 }),
    trash: (w, h, g) => g.circ(0, 0, w / 2, '#b9bec4') + g.circ(0, 0, w / 2 - 0.04, '#8d9096', { hair: 1 }),
    hamper: (w, h, g) => g.circ(0, 0, w / 2, '#d9c9b0') + g.circ(0, 0, w / 2 - 0.05, '#c5b192', { hair: 1, soft: 1 }),
  };

  const NEW = {
    tvwall: ['Centro de entretenimiento con pared de madera', 2.6, 0.45, 2.6, wood],
    wallunit: ['Librero de madera piso a techo', 2.4, 0.38, 2.6, wood],
    desk2: ['Escritorio doble con repisas (2 lugares)', 2.4, 0.8, 1.9, '#d9c9b0'],
    bed_wood: ['Cama con pared de madera', 2.7, 2.1, 2.4, dark],
    closet_full: ['Clóset de piso a techo', 2.4, 0.6, 2.6, '#e3d9cb'],
    shoebench: ['Banco con zapatera', 1.2, 0.4, 0.9, '#b9a58f'],
    coatrack: ['Perchero', 0.4, 0.4, 1.8, '#5b3a2a'],
    pendant: ['Lámpara colgante', 0.6, 0.6, 0.1, '#f3e3c3'],
    fan: ['Ventilador de techo', 1.2, 1.2, 0.1, '#e6dccb'],
    rocker: ['Mecedora', 0.7, 0.85, 0.9, '#c9b8a6'],
    barcart: ['Carrito de bar', 0.5, 0.8, 0.85, '#e9dfd0'],
    aquarium: ['Acuario con mueble', 1.2, 0.4, 1.2, '#cdb99b'],
    daybed: ['Diván', 0.8, 1.9, 0.6, '#efe6d6'],
    trash: ['Bote de basura', 0.35, 0.35, 0.6, '#b9bec4'],
    hamper: ['Cesto de ropa', 0.4, 0.4, 0.6, '#d9c9b0'],
  };
  Object.keys(NEW).forEach((k) => { const [name, w, h, z, c] = NEW[k]; I[k] = { name, w, h, z, c, draw: D[k] }; });

  const wallIcon = (svg) => (size) => `<svg width="${size}" height="${size}" viewBox="0 0 52 52">${svg}</svg>`;
  I.art_minisplit = { name: 'Minisplit (aire acondicionado)', w: 0.95, h: 0.22, z: 0, c: '#f3f4f6', draw: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#f3f4f6', { rx: 0.03 }), wall: true, ph: 0.3, z0: 2.15, style: 'minisplit',
    iconFn: wallIcon('<rect x="6" y="16" width="40" height="15" rx="4" fill="#f3f4f6" stroke="#8d9096" stroke-width="1.5"/><rect x="10" y="26" width="32" height="3" rx="1.5" fill="#c9ced2"/><circle cx="41" cy="21" r="1.5" fill="#5aa9ff"/><path d="M14 38q4 4 8 0M28 38q4 4 8 0" stroke="#9fc4e8" fill="none" stroke-width="1.5"/>') };

  const C = F.CATS, by = (id) => C.find((c) => c.id === id);
  by('sala').items.unshift('tvwall', 'wallunit');
  by('sala').items.push('rocker', 'barcart', 'aquarium', 'daybed');
  by('recamara').items.unshift('bed_wood', 'closet_full');
  by('oficina').items.unshift('desk2');
  by('otros').items.push('trash', 'hamper');
  const at = C.findIndex((c) => c.id === 'oficina');
  C.splice(at, 0,
    { id: 'entrada', name: 'Entrada', items: ['shoebench', 'coatrack', 'console', 'art_mirror'] },
    { id: 'clima', name: 'Luz y clima', items: ['pendant', 'fan', 'art_minisplit', 'floorlamp', 'art_curtain'] });
})();

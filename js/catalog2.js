/* catalog2.js — muebles, plantas y decoración adicionales (dibujo en planta). Los modelos 3D están en models3d2.js. */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;

  const rugDraw = (col, edge) => (w, h, g) => g.rect(-w / 2, -h / 2, w, h, col, { rx: 0.02, soft: 1 }) + g.rect(-w / 2 + 0.1, -h / 2 + 0.1, w - 0.2, h - 0.2, edge, { hair: 1, soft: 1 }) + g.rect(-w / 2 + 0.2, -h / 2 + 0.2, w - 0.4, h - 0.4, col, { hair: 1, soft: 1 });
  const roundTable = (col) => (w, h, g) => g.circ(0, 0, w / 2, col) + g.circ(0, 0, w / 2 - 0.06, col, { hair: 1, soft: 1 });
  const plant = (n, leaf, pot, len, wd) => (w, h, g) => {
    let s = '';
    for (let i = 0; i < n; i++) s += `<g transform="rotate(${(i * 360) / n + (i % 2) * 8})">${g.ell(0, -w * len, w * wd, w * len * 0.9, leaf, { hair: 1 })}</g>`;
    return s + g.circ(0, 0, w * 0.13, pot, { hair: 1 });
  };
  const bed = (w, h, g, sheet) => g.rect(-w / 2, -h / 2, w, h, '#d9cdbb', { rx: 0.03 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.06, w - 0.1, h - 0.11, '#f4f1eb', { rx: 0.03, hair: 1 }) + g.rect(-w / 2 + 0.1, -h / 2 + 0.1, w - 0.2, 0.3, '#fff', { rx: 0.06, hair: 1 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.55, w - 0.1, h - 0.66, sheet, { rx: 0.03, hair: 1 });

  const D = {
    bed_bunk: (w, h, g) => bed(w, h, g, '#a9bccd') + g.line(w / 2 - 0.04, h / 2 - 0.9, w / 2 - 0.04, h / 2 - 0.1) + g.line(-w / 2 + 0.04, h / 2 - 0.9, -w / 2 + 0.04, h / 2 - 0.1),
    crib: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#efe6d6', { rx: 0.03 }) + g.rect(-w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12, '#f7f4ee', { hair: 1 }); for (let x = -w / 2 + 0.1; x < w / 2 - 0.05; x += 0.1) s += g.line(x, -h / 2, x, h / 2, { soft: 1 }); return s; },
    vanity: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#efe6d6', { rx: 0.03 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.03, w - 0.1, 0.05, '#dfe8ee', { hair: 1 }) + g.circ(0, h / 2 - 0.12, 0.08, '#c9b8a6', { hair: 1 }),
    bench: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#b9a58f', { rx: 0.05 }) + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, h - 0.08, '#d6c7b4', { rx: 0.04, hair: 1 }),
    tallboy: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#d9c9b0') + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#e6d9c3', { hair: 1, soft: 1 }) + g.line(-w / 4, h / 2 - 0.07, w / 4, h / 2 - 0.07),
    pouf: (w, h, g) => g.circ(0, 0, w / 2, '#c9a88a') + g.circ(0, 0, w / 2 - 0.07, '#d8bda2', { hair: 1 }),
    sidetable: (w, h, g) => g.circ(0, 0, w / 2, '#d7c3a5') + g.circ(0, 0, w / 2 - 0.05, '#e2d2b8', { hair: 1, soft: 1 }),
    console: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#d7c3a5', { rx: 0.02 }) + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#e2d2b8', { hair: 1, soft: 1 }),
    floorlamp: (w, h, g) => g.circ(0, 0, w / 2, '#f3e3c3') + g.circ(0, 0, w / 2 - 0.06, '#fff4d6', { hair: 1 }) + g.circ(0, 0, 0.02, '#8a7660', { hair: 1 }),
    fireplace: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#d9d4cc') + g.rect(-w / 2 + 0.25, -h / 2 + 0.05, w - 0.5, h - 0.05, '#3a3a3f', { hair: 1 }) + g.line(-w / 2 + 0.3, h / 2 - 0.12, w / 2 - 0.3, h / 2 - 0.12, { soft: 1 }),
    rug: rugDraw('#d9cfc0', '#c9b8a3'),
    rug_round: (w, h, g) => g.circ(0, 0, w / 2, '#d9cfc0', { soft: 1 }) + g.circ(0, 0, w / 2 - 0.1, '#c9b8a3', { hair: 1, soft: 1 }) + g.circ(0, 0, w / 2 - 0.22, '#d9cfc0', { hair: 1, soft: 1 }),
    piano: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#1e2024', { rx: 0.03 }) + g.rect(-w / 2 + 0.05, h / 2 - 0.16, w - 0.1, 0.12, '#f4f4f4', { hair: 1 }) + g.line(-w / 2 + 0.05, h / 2 - 0.1, w / 2 - 0.05, h / 2 - 0.1, { soft: 1 }),
    round4: roundTable('#d7c3a5'), round6: roundTable('#d7c3a5'),
    sideboard: (w, h, g) => { let s = g.rect(-w / 2, -h / 2, w, h, '#cdb99b'); for (let i = 1; i < 4; i++) s += g.line(-w / 2 + (w * i) / 4, -h / 2 + 0.03, -w / 2 + (w * i) / 4, h / 2 - 0.03); return s + g.rect(-w / 2 + 0.03, -h / 2 + 0.03, w - 0.06, h - 0.06, '#dbc9ad', { hair: 1, soft: 1 }); },
    bench2: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#c9b08f', { rx: 0.03 }) + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, h - 0.08, '#dccbb3', { hair: 1, soft: 1 }),
    stool: (w, h, g) => g.circ(0, 0, w / 2, '#b9a58f') + g.circ(0, 0, w / 2 - 0.05, '#d6c7b4', { hair: 1 }),
    hutch: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#cdb99b') + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w / 2 - 0.06, h - 0.08, '#e9f2f6', { hair: 1, soft: 1 }) + g.rect(0.02, -h / 2 + 0.04, w / 2 - 0.06, h - 0.08, '#e9f2f6', { hair: 1, soft: 1 }),
    dishwasher: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#dfe3e6', { rx: 0.02 }) + g.line(-w / 2 + 0.08, h / 2 - 0.05, w / 2 - 0.08, h / 2 - 0.05, { hair: 0 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.05, w - 0.1, 0.08, '#c9ced2', { hair: 1 }),
    pantry: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#eeebe4') + g.line(0, -h / 2 + 0.03, 0, h / 2) + g.circ(-0.05, h / 2 - 0.06, 0.018, '#8d8d95', { hair: 1 }) + g.circ(0.05, h / 2 - 0.06, 0.018, '#8d8d95', { hair: 1 }),
    dblsink: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#eef1f3', { rx: 0.04 }) + g.ell(-w / 4, 0.03, w * 0.17, h * 0.3, '#dcecf3', { hair: 1 }) + g.ell(w / 4, 0.03, w * 0.17, h * 0.3, '#dcecf3', { hair: 1 }) + g.circ(-w / 4, -h / 2 + 0.06, 0.02, '#8d8d95', { hair: 1 }) + g.circ(w / 4, -h / 2 + 0.06, 0.02, '#8d8d95', { hair: 1 }),
    bidet: (w, h, g) => g.ell(0, 0.02, w / 2 - 0.01, h / 2 - 0.02, '#f7f8f9') + g.ell(0, 0.04, w / 2 - 0.08, h / 2 - 0.1, '#e4ebee', { hair: 1 }) + g.circ(0, -h / 2 + 0.06, 0.02, '#8d8d95', { hair: 1 }),
    freetub: (w, h, g) => g.ell(0, 0, w / 2, h / 2, '#f7f8f9') + g.ell(0, 0, w / 2 - 0.08, h / 2 - 0.08, '#e4ebee', { hair: 1 }) + g.circ(-w / 2 + 0.25, 0, 0.03, '#fff', { hair: 1 }),
    ldesk: (w, h, g) => `<path d="M${-w / 2} ${-h / 2}H${w / 2}V${-h / 2 + 0.7}H${-w / 2 + 0.7}V${h / 2}H${-w / 2}Z" fill="${g.p ? '#d9c9b0' : '#fff'}" stroke="#2a2a2f" stroke-width="${1.3 * g.px}" stroke-linejoin="round"/>` + g.rect(-0.2, -h / 2 + 0.06, 0.4, 0.03, '#2a2a2f', { hair: 1 }),
    ochair: (w, h, g) => g.circ(0, 0.02, w / 2 - 0.03, '#3a3d44') + g.rect(-w / 2 + 0.06, -h / 2, w - 0.12, 0.1, '#2a2d33', { rx: 0.04, hair: 1 }) + g.circ(0, 0.02, 0.05, '#666', { hair: 1 }),
    filecab: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#c9ced2') + g.line(-w / 2 + 0.05, h / 2 - 0.08, w / 2 - 0.05, h / 2 - 0.08, { hair: 0 }) + g.line(-w / 2 + 0.03, 0, w / 2 - 0.03, 0),
    lounger: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#efe6d6', { rx: 0.05 }) + g.rect(-w / 2 + 0.04, -h / 2 + 0.04, w - 0.08, 0.5, '#d6c7b4', { rx: 0.04, hair: 1 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.6, w - 0.1, h - 0.65, '#fff', { rx: 0.04, hair: 1 }),
    patiotable: roundTable('#b9a58f'),
    patiochair: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#c9b08f', { rx: 0.05 }) + g.rect(-w / 2 + 0.05, -h / 2 + 0.1, w - 0.1, h - 0.15, '#e9dfd0', { rx: 0.05, hair: 1 }),
    bbq: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#3a3d44', { rx: 0.03 }) + g.circ(-0.1, 0, 0.17, '#8d9096', { hair: 1 }) + g.rect(0.13, -0.16, 0.13, 0.32, '#5b5f66', { hair: 1 }),
    parasol: (w, h, g) => { let s = g.circ(0, 0, w / 2, '#e9dfd0', { soft: 1 }); for (let i = 0; i < 8; i++) s += `<g transform="rotate(${i * 45})">${g.line(0, 0, 0, -w / 2 + 0.02, { soft: 1 })}</g>`; return s + g.circ(0, 0, 0.04, '#5b5f66', { hair: 1 }); },
    plant_monstera: plant(9, '#4b8a55', '#b9623e', 0.3, 0.16),
    plant_ficus: plant(10, '#5b9a55', '#c9b8a6', 0.34, 0.1),
    plant_palm: plant(12, '#4f8f4a', '#b9623e', 0.4, 0.06),
    plant_cactus: (w, h, g) => g.circ(0, 0, w * 0.34, '#7fb08a', { hair: 1 }) + g.circ(0, 0, w * 0.2, '#5f9a6a', { hair: 1 }) + g.circ(w * 0.3, -w * 0.1, w * 0.12, '#7fb08a', { hair: 1 }),
    plant_succ: plant(8, '#8fb59a', '#d6c7b4', 0.22, 0.1),
    plant_bamboo: (w, h, g) => { let s = g.circ(0, 0, w * 0.45, '#c9b8a6', { hair: 1 }); [[-0.1, -0.05], [0.08, -0.1], [0.1, 0.08], [-0.06, 0.1], [0, 0]].forEach(([x, y]) => { s += g.circ(x * w * 2, y * w * 2, w * 0.07, '#6f9a4a', { hair: 1 }); }); return s; },
    plant_olive: plant(14, '#8aa17a', '#b9623e', 0.36, 0.1),
    plant_fern: plant(16, '#5b9a55', '#b9623e', 0.36, 0.06),
    plant_snake: plant(6, '#4b7a4f', '#c9b8a6', 0.2, 0.06),
  };

  const NEW = {
    bed_bunk: ['Litera', 0.95, 2.0, 1.8, '#c9b08f'], crib: ['Cuna', 1.25, 0.7, 0.95, '#efe6d6'], vanity: ['Tocador', 1.0, 0.45, 0.75, '#efe6d6'], bench: ['Banco de cama', 1.4, 0.4, 0.45, '#b9a58f'], tallboy: ['Cómoda alta', 0.8, 0.45, 1.3, '#d9c9b0'],
    pouf: ['Puf', 0.5, 0.5, 0.4, '#c9a88a'], sidetable: ['Mesa lateral', 0.5, 0.5, 0.55, '#d7c3a5'], console: ['Consola', 1.2, 0.35, 0.8, '#d7c3a5'], floorlamp: ['Lámpara de piso', 0.35, 0.35, 1.6, '#f3e3c3'],
    fireplace: ['Chimenea', 1.4, 0.45, 1.1, '#d9d4cc'], rug: ['Alfombra', 2.4, 1.7, 0.02, '#d9cfc0'], rug_round: ['Alfombra redonda', 1.8, 1.8, 0.02, '#d9cfc0'], piano: ['Piano', 1.5, 0.6, 1.2, '#1e2024'],
    round4: ['Mesa redonda 4', 1.1, 1.1, 0.75, '#d7c3a5'], round6: ['Mesa redonda 6', 1.5, 1.5, 0.75, '#d7c3a5'], sideboard: ['Aparador', 1.6, 0.45, 0.85, '#cdb99b'], bench2: ['Banca', 1.4, 0.4, 0.45, '#c9b08f'], stool: ['Banco alto', 0.38, 0.38, 0.65, '#b9a58f'], hutch: ['Vitrina', 1.0, 0.4, 1.9, '#cdb99b'],
    dishwasher: ['Lavavajillas', 0.6, 0.6, 0.85, '#dfe3e6'], pantry: ['Alacena alta', 0.6, 0.6, 2.1, '#eeebe4'],
    dblsink: ['Doble lavabo', 1.4, 0.55, 0.85, '#eef1f3'], bidet: ['Bidet', 0.4, 0.6, 0.4, '#f7f8f9'], freetub: ['Tina exenta', 1.7, 0.8, 0.6, '#f7f8f9'],
    ldesk: ['Escritorio en L', 1.6, 1.5, 0.75, '#d9c9b0'], ochair: ['Silla de oficina', 0.6, 0.6, 1.0, '#3a3d44'], filecab: ['Archivero', 0.45, 0.6, 0.7, '#c9ced2'],
    lounger: ['Camastro', 0.7, 1.9, 0.4, '#efe6d6'], patiotable: ['Mesa de jardín', 1.0, 1.0, 0.72, '#b9a58f'], patiochair: ['Silla de jardín', 0.55, 0.55, 0.85, '#c9b08f'], bbq: ['Asador', 0.6, 0.5, 0.95, '#3a3d44'], parasol: ['Sombrilla', 2.2, 2.2, 2.4, '#e9dfd0'],
    plant_monstera: ['Monstera', 0.7, 0.7, 1.1, '#4b8a55'], plant_ficus: ['Ficus', 0.7, 0.7, 1.9, '#5b9a55'], plant_palm: ['Palma areca', 0.85, 0.85, 1.6, '#4f8f4a'], plant_cactus: ['Cactus', 0.4, 0.4, 0.8, '#5f9a6a'],
    plant_succ: ['Suculentas', 0.3, 0.3, 0.2, '#8fb59a'], plant_bamboo: ['Bambú', 0.5, 0.5, 1.7, '#6f9a4a'], plant_olive: ['Olivo', 0.85, 0.85, 1.9, '#8aa17a'], plant_fern: ['Helecho', 0.6, 0.6, 0.7, '#5b9a55'], plant_snake: ['Lengua de suegra', 0.35, 0.35, 0.9, '#4b7a4f'],
  };
  Object.keys(NEW).forEach((k) => { const [name, w, h, z, c] = NEW[k]; I[k] = { name, w, h, z, c, draw: D[k] }; });

  // arte extra (mismo mecanismo de montaje en pared)
  const artPlan = (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#2a2a2f') + g.line(-w / 2 + 0.05, 0, w / 2 - 0.05, 0, { soft: 1 });
  const wallIcon = (svg) => (size) => `<svg width="${size}" height="${size}" viewBox="0 0 52 52">${svg}</svg>`;
  I.art_curtain = { name: 'Cortina', w: 1.2, h: 0.05, z: 0, c: '#d9cfc0', draw: artPlan, wall: true, ph: 2.5, z0: 1.3, style: 'curtain', iconFn: wallIcon('<rect x="8" y="6" width="36" height="2.5" fill="#c9a35c"/><path d="M10 9c3 8 3 24 0 36M16 9c3 8 3 24 0 36M22 9c3 8 3 24 0 36" stroke="#b5a48c" stroke-width="4" fill="none"/><path d="M10 9c3 8 3 24 0 36M16 9c3 8 3 24 0 36M22 9c3 8 3 24 0 36" stroke="#e9dfd0" stroke-width="2" fill="none"/>') };
  I.art_shelf = { name: 'Repisa flotante', w: 1.0, h: 0.22, z: 0, c: '#d7c3a5', draw: (w, h, g) => g.rect(-w / 2, -h / 2, w, h, '#d7c3a5', { rx: 0.01 }), wall: true, ph: 0.2, z0: 1.6, style: 'shelf', iconFn: wallIcon('<rect x="6" y="34" width="40" height="4" rx="1" fill="#b9a58f"/><rect x="10" y="18" width="5" height="16" fill="#c96f3b"/><rect x="16" y="14" width="5" height="20" fill="#2f4858"/><circle cx="34" cy="28" r="6" fill="#5b9a55"/><rect x="31" y="32" width="6" height="2" fill="#b9623e"/>') };

  // categorías
  const C = F.CATS, byId = (id) => C.find((c) => c.id === id);
  byId('recamara').items.push('bed_bunk', 'crib', 'vanity', 'bench', 'tallboy');
  byId('sala').items.push('pouf', 'sidetable', 'console', 'floorlamp', 'fireplace', 'piano', 'rug', 'rug_round');
  byId('comedor').items.push('round4', 'round6', 'sideboard', 'bench2', 'stool', 'hutch');
  byId('cocina').items.push('dishwasher', 'pantry');
  byId('bano').items.push('dblsink', 'bidet', 'freetub');
  byId('arte').items.push('art_curtain', 'art_shelf');
  const at = C.findIndex((c) => c.id === 'arte');
  C.splice(at, 0,
    { id: 'oficina', name: 'Oficina', items: ['desk', 'ldesk', 'ochair', 'filecab', 'bookshelf', 'chair'] },
    { id: 'plantas', name: 'Plantas', items: ['plant', 'plant_monstera', 'plant_ficus', 'plant_palm', 'plant_cactus', 'plant_succ', 'plant_bamboo', 'plant_olive', 'plant_fern', 'plant_snake'] },
    { id: 'exterior', name: 'Terraza', items: ['lounger', 'patiotable', 'patiochair', 'bbq', 'parasol', 'plant_palm', 'plant_olive'] });
  F.PLANT_KEYS = ['plant', 'plant_monstera', 'plant_ficus', 'plant_palm', 'plant_cactus', 'plant_succ', 'plant_bamboo', 'plant_olive', 'plant_fern', 'plant_snake'];
})();

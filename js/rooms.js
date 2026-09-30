/* rooms.js — tipos de habitación y utilidades. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util;

  const TYPES = [
    { id: 'recamara', name: 'Recámara', w: 3.5, h: 4, color: '#f4ece3' },
    { id: 'principal', name: 'Recámara principal', w: 4, h: 4.5, color: '#f1e6dc' },
    { id: 'sala', name: 'Sala', w: 5, h: 4, color: '#e8eef4' },
    { id: 'comedor', name: 'Comedor', w: 3.5, h: 3.5, color: '#f4efdf' },
    { id: 'cocina', name: 'Cocina', w: 3, h: 3.5, color: '#eaf0e4' },
    { id: 'bano', name: 'Baño', w: 2, h: 2.5, color: '#e2eff2' },
    { id: 'vestidor', name: 'Vestidor', w: 2, h: 2, color: '#efe8f1' },
    { id: 'oficina', name: 'Oficina', w: 3, h: 3, color: '#e8ebf5' },
    { id: 'lavanderia', name: 'Lavandería', w: 1.8, h: 2.2, color: '#e6f1ee' },
    { id: 'terraza', name: 'Terraza', w: 4, h: 2.5, color: '#e9f2df' },
    { id: 'balcon', name: 'Balcón', w: 3, h: 1.4, color: '#e6efdc' },
    { id: 'otro', name: 'Otro', w: 3, h: 3, color: '#f0f0f2' },
  ];

  const FLOORS = [
    { id: 'oak', name: 'Madera clara', kind: 'wood', color: '#d2ae82' },
    { id: 'walnut', name: 'Madera nogal', kind: 'wood', color: '#8a5a3a' },
    { id: 'ash', name: 'Madera gris', kind: 'wood', color: '#a9a196' },
    { id: 'dark', name: 'Madera oscura', kind: 'wood', color: '#4a3628' },
    { id: 'porcelain', name: 'Porcelanato blanco', kind: 'tile', color: '#ebebe8' },
    { id: 'porcelain_g', name: 'Porcelanato gris', kind: 'tile', color: '#a9abae' },
    { id: 'azulejo', name: 'Azulejo azul claro', kind: 'tile', color: '#dfe9ec' },
    { id: 'terracotta', name: 'Barro terracota', kind: 'tile', color: '#b8623c' },
    { id: 'marble', name: 'Mármol', kind: 'marble', color: '#f2f1ee' },
    { id: 'concrete', name: 'Concreto pulido', kind: 'concrete', color: '#9c9c9a' },
    { id: 'stone', name: 'Piedra natural', kind: 'stone', color: '#b9b5ac' },
    { id: 'carpet', name: 'Alfombra', kind: 'carpet', color: '#cdbfae' },
    { id: 'chevron_oak', name: 'Espiga roble', kind: 'wood', pattern: 'chevron', color: '#cfa878' },
    { id: 'chevron_walnut', name: 'Espiga nogal', kind: 'wood', pattern: 'chevron', color: '#7a4e33' },
    { id: 'checker', name: 'Damero blanco y negro', kind: 'tile', pattern: 'checker', color: '#f2f2ee' },
    { id: 'mosaic', name: 'Mosaico', kind: 'tile', pattern: 'mosaic', color: '#9db7c2' },
    { id: 'slate', name: 'Pizarra oscura', kind: 'stone', color: '#4a4e52' },
    { id: 'deck', name: 'Deck de madera', kind: 'wood', color: '#9b7a55' },
  ];

  const WALLS = [
    { id: 'paint', name: 'Pintura lisa', color: '#f6f4f0' },
    { id: 'stucco', name: 'Estuco rústico', color: '#efe6d6' },
    { id: 'brick', name: 'Ladrillo aparente', color: '#ffffff' },
    { id: 'stone', name: 'Muro de piedra', color: '#ffffff' },
    { id: 'wood', name: 'Panel de madera', color: '#ffffff' },
    { id: 'concrete', name: 'Concreto aparente', color: '#ffffff' },
    { id: 'tile', name: 'Azulejo metro', color: '#ffffff' },
    { id: 'wallpaper', name: 'Papel tapiz', color: '#e9e0d3' },
    { id: 'stripe', name: 'Rayas verticales', color: '#d8c3a5' },
    { id: 'marble', name: 'Mármol', color: '#ffffff' },
  ];
  const WALL_SWATCHES = ['#ffffff', '#f6f4f0', '#e9e0d3', '#d8c3a5', '#c9b8a3', '#b9c7c9', '#a9c3b0', '#7d9c8c', '#d98a7a', '#e8b4b8', '#f2cc8f', '#3d5a6c', '#22333b', '#8d8d8d'];
  const DEF_FLOOR = { recamara: 'oak', principal: 'walnut', sala: 'oak', comedor: 'oak', oficina: 'ash', vestidor: 'oak', bano: 'porcelain', cocina: 'porcelain', lavanderia: 'porcelain_g', terraza: 'stone', balcon: 'deck', cochera: 'concrete', jardin: 'grass', otro: 'oak' };

  FP.Rooms = {
    TYPES, FLOORS, WALLS, WALL_SWATCHES,
    wallDef: (r) => (r.wall && r.wall.tex ? { tex: r.wall.tex, color: r.wall.color || (WALLS.find((w) => w.id === r.wall.tex) || WALLS[0]).color } : null),
    floorDef: (r) => FLOORS.find((f) => f.id === (r.floor || DEF_FLOOR[r.type])) || FLOORS[0],
    def: (id) => TYPES.find((t) => t.id === id) || TYPES[TYPES.length - 1],
    color: (id) => FP.Rooms.def(id).color,
    /** Nombre único: "Recámara", "Recámara 2", ... */
    uniqueName(project, type) {
      const base = FP.Rooms.def(type).name;
      const used = project.rooms.filter((r) => r.type === type).length;
      if (!used) return base;
      let i = used + 1;
      while (project.rooms.some((r) => r.name === base + ' ' + i)) i++;
      return base + ' ' + i;
    },
    create(project, type, x, y, w, h) {
      return { id: U.uid(), type, name: FP.Rooms.uniqueName(project, type), x, y, w, h };
    },
    area: (r) => r.w * r.h,
  };
})();

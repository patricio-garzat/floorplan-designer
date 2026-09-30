/* cars.js — vehículos para la cochera: compacto, sedán y camioneta (planta 2D + modelo 3D). El frente apunta a +y (2D) / +z (3D). */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;

  // [nombre, ancho, largo, alto, color, ancho-cabina(%), largo-cabina(%), desplazamiento cabina(%), radio rueda, alto-carrocería]
  const CARS = {
    car_compact: ['Carro compacto', 1.72, 3.95, 1.5, '#3f7fc4', 0.86, 0.58, -0.04, 0.29, 0.62],
    car_sedan: ['Sedán', 1.85, 4.75, 1.45, '#b0332d', 0.84, 0.46, -0.06, 0.32, 0.6],
    car_suv: ['Camioneta', 2.0, 5.05, 1.85, '#3b4149', 0.9, 0.66, -0.05, 0.38, 0.78],
  };

  Object.keys(CARS).forEach((k) => {
    const [name, w, h, z, c, cw, cl, co] = CARS[k];
    I[k] = {
      name, w, h, z, c,
      draw: (w, h, g) => {
        const glass = '#2b3440', body = c, tw = 0.24, wl = 0.62;
        let s = '';
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { s += g.rect(a * (w / 2 - 0.02) - tw / 2, b * (h / 2 - 0.85) - wl / 2, tw, wl, '#16181c', { rx: 0.05, hair: 1 }); });
        s += g.rect(-w / 2 + 0.06, -h / 2, w - 0.12, h, body, { rx: 0.3 });
        const cabL = h * cl, cabY = h * co - cabL / 2;
        s += g.rect(-w * cw / 2, cabY - 0.25, w * cw, 0.3, glass, { rx: 0.1, hair: 1, soft: 1 });          // parabrisas trasero
        s += g.rect(-w * cw / 2, cabY + cabL - 0.05, w * cw, 0.34, glass, { rx: 0.1, hair: 1, soft: 1 });   // parabrisas delantero
        s += g.rect(-w * cw / 2 + 0.05, cabY + 0.05, w * cw - 0.1, cabL - 0.1, '#ffffff', { rx: 0.12, hair: 1, soft: 1, o: 0.22 });
        s += g.line(0, -h / 2 + 0.25, 0, h / 2 - 0.25, { dash: 1, soft: 1 });
        s += g.rect(-w / 2 - 0.02, h * 0.1, 0.1, 0.18, '#2a2a2f', { hair: 1 }) + g.rect(w / 2 - 0.08, h * 0.1, 0.1, 0.18, '#2a2a2f', { hair: 1 }); // espejos
        s += g.rect(-w / 2 + 0.15, h / 2 - 0.08, 0.34, 0.08, '#fff6c9', { rx: 0.03, hair: 1 }) + g.rect(w / 2 - 0.49, h / 2 - 0.08, 0.34, 0.08, '#fff6c9', { rx: 0.03, hair: 1 });
        s += g.rect(-w / 2 + 0.15, -h / 2, 0.3, 0.07, '#c4211c', { rx: 0.03, hair: 1 }) + g.rect(w / 2 - 0.45, -h / 2, 0.3, 0.07, '#c4211c', { rx: 0.03, hair: 1 });
        return s;
      },
    };
  });
  const C = F.CATS;
  C.splice(C.findIndex((x) => x.id === 'exterior') + 1, 0, { id: 'vehiculos', name: 'Vehículos', items: Object.keys(CARS) });

  /* ---------- 3D ---------- */
  const H = FP.Models.helpers, B = FP.Models.B, { box, G } = H;
  const paints = {};
  let K = null; // materiales compartidos: se crean al primer uso (THREE se carga bajo demanda)
  const paint = (hex) => paints[hex] || (paints[hex] = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.28, metalness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 1.3 }));
  const flat = (hex, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.7 }, o || {}));
  const mats = () => K || (K = {
    tire: flat('#16171a', { roughness: 0.95 }), rim: flat('#b9bec4', { roughness: 0.25, metalness: 0.9 }), glass: flat('#1a222c', { roughness: 0.05, metalness: 0.6 }),
    lightOn: flat('#fff6d0', { emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.6 }), tail: flat('#b81b16', { emissive: new THREE.Color('#ff2a1f'), emissiveIntensity: 0.4 }), bumper: flat('#22262b', { roughness: 0.6 }),
  });

  Object.keys(CARS).forEach((k) => {
    const [, , , , color, cw, cl, co, wr, bh] = CARS[k];
    B[k] = (w, d) => {
      const g = G(), P = paint(color), m = mats(), ride = wr * 0.55;
      const bodyH = bh - ride - 0.12;
      box(g, w - 0.04, bodyH, d - 0.04, P, 0, ride + 0.08, 0, 0.12);                                   // carrocería
      const cabL = d * cl, cabZ = -d * co, cabH = k === 'car_suv' ? 0.68 : 0.52, cabY = ride + 0.08 + bodyH;
      box(g, w * cw, cabH, cabL, m.glass, 0, cabY - 0.04, cabZ, 0.14);                                   // cristales
      box(g, w * cw - 0.04, 0.04, cabL - 0.16, P, 0, cabY + cabH - 0.05, cabZ, 0.12);                   // techo
      box(g, 0.05, cabH - 0.06, cabL - 0.3, P, -w * cw / 2 + 0.03, cabY, cabZ, 0.01); box(g, 0.05, cabH - 0.06, cabL - 0.3, P, w * cw / 2 - 0.03, cabY, cabZ, 0.01); // postes
      box(g, 0.05, cabH - 0.06, 0.05, P, 0, cabY, cabZ + cabL * 0.12, 0.01);
      [-1, 1].forEach((s) => {
        box(g, 0.34, 0.1, 0.06, m.lightOn, s * (w / 2 - 0.3), ride + bodyH * 0.65, d / 2 - 0.01, 0.03);
        box(g, 0.3, 0.09, 0.06, m.tail, s * (w / 2 - 0.27), ride + bodyH * 0.7, -d / 2 + 0.01, 0.03);
        box(g, 0.1, 0.1, 0.16, P, s * (w / 2 + 0.03), cabY - 0.06, cabZ + cabL / 2 - 0.05, 0.03);       // espejos
        [-1, 1].forEach((f) => {
          const wz = f * (d / 2 - 0.85), wh = new THREE.Group();
          const t = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, 0.22, 24), m.tire); t.rotation.z = Math.PI / 2; t.castShadow = true; wh.add(t);
          const r = new THREE.Mesh(new THREE.CylinderGeometry(wr * 0.62, wr * 0.62, 0.225, 16), m.rim); r.rotation.z = Math.PI / 2; wh.add(r);
          wh.position.set(s * (w / 2 - 0.13), wr, wz); g.add(wh);
        });
      });
      box(g, w - 0.3, 0.12, 0.05, m.bumper, 0, ride + 0.12, d / 2 - 0.005, 0.02);  // parrilla/defensa
      return g;
    };
  });

  /* tipo de habitación: cochera */
  const T = FP.Rooms.TYPES;
  if (!T.find((t) => t.id === 'cochera')) T.splice(T.findIndex((t) => t.id === 'balcon') + 1, 0, { id: 'cochera', name: 'Cochera', w: 6, h: 3.4, color: '#e6e6e8' });
})();

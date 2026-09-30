/* people.js — personas de referencia de tamaño: hombre (1.70 m) y mujer (1.58 m), estatura promedio en México.
   Modelo 3D procedural (torso torneado, extremidades, cabeza con rostro y cabello) y símbolo en planta. */
(function () {
  'use strict';
  const FP = window.FP, F = FP.Furniture, I = F.ITEMS;

  /* ---------- planta 2D (vista desde arriba: hombros, cabeza, brazos) ---------- */
  const top = (shirt, hair, sw, hairLong) => (w, h, g) => {
    let s = g.ell(0, 0.02, sw, h * 0.34, shirt, { soft: 1 });                               // hombros
    s += g.ell(-sw + 0.03, 0.03, 0.055, 0.1, shirt, { hair: 1, soft: 1 }) + g.ell(sw - 0.03, 0.03, 0.055, 0.1, shirt, { hair: 1, soft: 1 }); // brazos
    if (hairLong) s += g.ell(0, -0.01, 0.12, 0.13, hair, { hair: 1, soft: 1 });
    s += g.circ(0, -0.01, 0.105, hair, { soft: 1 });                                        // cabeza (cabello visto desde arriba)
    return s + g.path('M-0.03 0.085 L0 0.13 L0.03 0.085', '#e7b792', { hair: 1, nf: 1 });  // nariz: marca el frente
  };
  I.person_man = { name: 'Persona · hombre (1.70 m)', w: 0.52, h: 0.3, z: 1.7, c: '#3f6fa8', draw: top('#3f6fa8', '#2a211b', 0.25, false) };
  I.person_woman = { name: 'Persona · mujer (1.58 m)', w: 0.44, h: 0.27, z: 1.58, c: '#f1ece2', draw: top('#f1ece2', '#3a2a20', 0.21, true) };
  F.CATS.push({ id: 'personas', name: 'Personas', items: ['person_man', 'person_woman'] });

  /* ---------- 3D ---------- */
  const H = FP.Models.helpers, B = FP.Models.B, G = H.G;
  const mat = (hex, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.8 }, o || {}));
  const cache = {};
  const M = (k, hex, o) => cache[k] || (cache[k] = mat(hex, o));
  const add = (g, geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const sphere = (r) => new THREE.SphereGeometry(r, 24, 16);
  /** Miembro cónico: desde y=0 (radio r0) hasta y=-len (radio r1), colgando hacia abajo. */
  const limb = (r0, r1, len) => { const c = new THREE.CylinderGeometry(r0, r1, len, 20); c.translate(0, -len / 2, 0); return c; };
  /** Torso torneado a partir de un perfil (radio por altura) y achatado en profundidad. */
  const lathe = (prof) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);

  function person(o) {
    const g = G(), s = o.H / 1.7, body = new THREE.Group(), w = o.fem;
    const skin = M('skin' + o.skin, o.skin, { roughness: 0.55 }), shirt = M('sh' + o.shirt, o.shirt, { roughness: 0.85 }), pants = M('pa' + o.pants, o.pants, { roughness: 0.9 });
    const shoe = M('shoe' + o.shoe, o.shoe, { roughness: 0.5 }), hair = M('ha' + o.hair, o.hair, { roughness: 0.75 });
    const hipX = w ? 0.095 : 0.088, shX = w ? 0.178 : 0.218, pelY = 0.93;

    // piernas
    [-1, 1].forEach((k) => {
      const leg = new THREE.Group(); leg.position.set(k * hipX, pelY, 0); leg.rotation.z = -k * 0.015; body.add(leg);
      add(leg, limb(w ? 0.087 : 0.092, w ? 0.056 : 0.06, 0.45), pants, 0, 0, 0);                    // muslo
      add(leg, sphere(w ? 0.056 : 0.06), pants, 0, -0.45, 0);                                          // rodilla
      const sh = new THREE.Group(); sh.position.y = -0.45; leg.add(sh);
      add(sh, limb(w ? 0.054 : 0.058, w ? 0.036 : 0.04, 0.39), pants, 0, 0, 0);                        // pantorrilla
      add(sh, limb(0.04, 0.038, 0.06), skin, 0, -0.39, 0);                                             // tobillo
      const foot = add(sh, new THREE.BoxGeometry(0.095, 0.072, 0.27), shoe, 0, -0.43, 0.05);            // zapato
      foot.geometry = new THREE.BoxGeometry(0.095, 0.072, 0.27, 2, 2, 4);
      add(sh, sphere(0.047), shoe, 0, -0.415, 0.165, 1, 0.75, 1.25);                                    // puntera redondeada
    });
    // cadera
    add(body, sphere(1), pants, 0, pelY + 0.02, 0, w ? 0.175 : 0.165, 0.115, 0.112);
    // torso (falda del perfil: cintura -> pecho -> hombros)
    const prof = w ? [[0.001, 0], [0.135, 0.02], [0.135, 0.11], [0.148, 0.23], [0.165, 0.33], [0.172, 0.4], [0.155, 0.46], [0.09, 0.505], [0.001, 0.52]]
      : [[0.001, 0], [0.15, 0.02], [0.152, 0.12], [0.165, 0.25], [0.19, 0.36], [0.2, 0.43], [0.17, 0.49], [0.09, 0.525], [0.001, 0.54]];
    const torso = add(body, lathe(prof), shirt, 0, 0.98, 0, 1.0, 1, w ? 0.6 : 0.64);
    if (w) { [-1, 1].forEach((k) => add(body, sphere(0.062), shirt, k * 0.072, 1.295, 0.085, 1, 0.9, 0.85)); } // busto sutil
    [-1, 1].forEach((k) => add(body, sphere(w ? 0.052 : 0.06), shirt, k * shX, 1.42, 0, 1, 1, 1));            // hombros
    void torso;
    // cuello y cabeza
    add(body, limb(0.048, 0.043, 0.1), skin, 0, 1.53, 0.004);
    const head = new THREE.Group(); head.position.set(0, 1.585, 0.008); body.add(head);
    add(head, sphere(1), skin, 0, 0, 0, 0.088, 0.116, 0.101);                                              // cráneo
    add(head, sphere(1), skin, 0, -0.058, 0.03, 0.075, 0.07, 0.075);                                        // mandíbula / barbilla
    add(head, sphere(0.022), skin, 0, -0.012, 0.102, 1, 1.1, 1.2);                                          // nariz
    [-1, 1].forEach((k) => {
      add(head, sphere(0.0125), M('sclera', '#f3eee8', { roughness: 0.3 }), k * 0.034, 0.014, 0.093, 1.25, 0.8, 0.55);   // ojos
      add(head, sphere(0.0072), M('eye', '#1b1512', { roughness: 0.15 }), k * 0.034, 0.014, 0.0985, 1, 1, 0.5);
      add(head, sphere(0.014), skin, k * 0.089, -0.004, 0.0, 0.6, 1.3, 1);                                   // orejas
      add(head, new THREE.BoxGeometry(0.034, 0.006, 0.008), hair, k * 0.034, 0.038, 0.093);                 // cejas
    });
    add(head, new THREE.BoxGeometry(0.04, 0.007, 0.01), M('lip', w ? '#b8544f' : '#a8655a', { roughness: 0.4 }), 0, -0.056, 0.098); // boca
    // cabello
    if (w) {
      const cap = new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.47);
      add(head, cap, hair, 0, 0.008, -0.014, 0.096, 0.122, 0.112);
      add(head, sphere(1), hair, 0, -0.1, -0.055, 0.094, 0.15, 0.06);                                        // melena larga
      [-1, 1].forEach((k) => add(head, sphere(1), hair, k * 0.085, -0.08, -0.02, 0.022, 0.12, 0.05));
    } else {
      add(head, new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.4), hair, 0, 0.014, -0.012, 0.094, 0.113, 0.108);
      add(head, sphere(1), hair, 0, 0.03, -0.05, 0.09, 0.08, 0.06);
    }
    // brazos
    [-1, 1].forEach((k) => {
      const arm = new THREE.Group(); arm.position.set(k * (shX + (w ? 0.012 : 0.018)), 1.41, 0); arm.rotation.z = k * 0.07; arm.rotation.x = 0.04; body.add(arm);
      add(arm, limb(w ? 0.042 : 0.05, w ? 0.034 : 0.04, 0.3), o.sleeve ? skin : shirt, 0, 0, 0);            // brazo
      add(arm, sphere(w ? 0.034 : 0.04), o.sleeve ? skin : shirt, 0, -0.3, 0);
      const fo = new THREE.Group(); fo.position.y = -0.3; fo.rotation.x = -0.18; arm.add(fo);
      add(fo, limb(w ? 0.032 : 0.038, w ? 0.024 : 0.028, 0.26), skin, 0, 0, 0);                              // antebrazo
      add(fo, new THREE.SphereGeometry(1, 16, 12), skin, 0, -0.295, 0.004, 0.031, 0.05, 0.02);              // mano
    });
    body.scale.set(1, 1, 1);
    g.add(body); g.scale.setScalar(s);
    return g;
  }
  B.person_man = () => person({ H: 1.7, fem: false, skin: '#d9a77f', shirt: '#3f6fa8', pants: '#2c2f3a', shoe: '#2b241f', hair: '#231b16', sleeve: false });
  B.person_woman = () => person({ H: 1.58, fem: true, skin: '#e0b08a', shirt: '#f1ece2', pants: '#34435c', shoe: '#e8e2d8', hair: '#3a2a20', sleeve: false });
})();

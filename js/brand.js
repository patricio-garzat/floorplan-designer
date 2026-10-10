/* brand.js — identidad de marca: símbolo (plano con puerta, ventana y cota) y nombre.
   Mismo dibujo que assets/logo-mark.svg; `idp` evita choques de ids cuando hay varios en la página. */
(function () {
  'use strict';
  window.FP = window.FP || {};
  window.FP.Brand = {
    NAME: 'Floorplan Designer',
    COLORS: { a: '#4f7cff', b: '#8b5cf6', cyan: '#5ee6ff', ink: '#0e1230' },
    mark(idp, size) {
      const s = size ? ` width="${size}" height="${size}"` : '';
      return `<svg viewBox="0 0 96 96"${s} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Floorplan Designer"><defs>
<linearGradient id="${idp}g" x1="8" y1="4" x2="88" y2="92" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4f7cff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>
<linearGradient id="${idp}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<g><rect x="2" y="2" width="92" height="92" rx="26" fill="url(#${idp}g)"/><rect x="2" y="2" width="92" height="92" rx="26" fill="url(#${idp}h)"/></g>
<g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M42 75H24V31H72V43"/><path d="M72 59V75H58"/><path d="M50 31V53H72"/></g>
<g fill="none" stroke-linecap="round"><path d="M72 43V59" stroke="#5ee6ff" stroke-width="4"/><path d="M42 75V59" stroke="#fff" stroke-width="3"/><path d="M42 59A16 16 0 0 1 58 75" stroke="#fff" stroke-opacity=".72" stroke-width="2.4"/><path d="M24 20H72M24 16V24M72 16V24" stroke="#5ee6ff" stroke-width="2.6"/></g></svg>`;
    },
    wordmark: () => 'Floorplan <em>Designer</em>',
  };
})();

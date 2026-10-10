/* splash.js — animación de entrada: el símbolo se dibuja trazo a trazo y luego "vuela" a su lugar en la barra superior.
   Se puede saltar con un clic o cualquier tecla. Respeta "reducir movimiento". */
(function () {
  'use strict';
  const splash = document.getElementById('splash');
  if (!splash) return;
  const root = document.documentElement, flight = splash.querySelector('.sp-flight');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T0 = performance.now(), HOLD = reduced ? 500 : 3150; // ms que se ve la animación completa antes de volar
  let leaving = false, loaded = document.readyState === 'complete';

  function finish() { root.classList.remove('splash-on'); splash.remove(); }
  function leave() {
    if (leaving) return;
    leaving = true;
    splash.classList.add('sp-out');
    const target = document.querySelector('#topbar .brand svg');
    const a = flight.getBoundingClientRect(), b = target ? target.getBoundingClientRect() : null;
    if (reduced || !b || !b.width || !a.width) { setTimeout(finish, 450); return; }
    const s = b.width / a.width, dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    flight.style.transition = 'transform .9s cubic-bezier(.66,0,.2,1)';
    requestAnimationFrame(() => { flight.style.transform = `translate(${dx}px,${dy}px) scale(${s})`; });
    setTimeout(finish, 960);
  }
  const hold = /splash=hold/.test(location.search); // solo para revisar la animación cuadro a cuadro
  function tryLeave() { if (hold) return; if (loaded && performance.now() - T0 >= HOLD) leave(); else setTimeout(tryLeave, 80); }
  window.addEventListener('load', () => { loaded = true; });
  tryLeave();
  // saltar: clic o tecla (después de un instante para que no se salte sin querer)
  const skip = () => { if (performance.now() - T0 > 500) { loaded = true; leave(); } };
  splash.addEventListener('pointerdown', skip);
  window.addEventListener('keydown', skip);
})();

/* levelbar.js — selector de niveles (plantas) sobre el lienzo: cambiar, agregar, duplicar, renombrar y eliminar. */
(function () {
  'use strict';
  const FP = window.FP, st = FP.state, U = FP.util;
  let el, menu = false, arm = false, editing = -1, armT = 0;

  function render() {
    const P = st.project;
    if (!P) { el.innerHTML = ''; return; }
    if (editing >= 0) return; // no pisar el campo mientras se escribe
    FP.Levels.ensure(P);
    const n = P.levels.length, cur = P.level;
    el.innerHTML = P.levels.map((l, i) => `<button class="lv${i === cur ? ' on' : ''}" data-i="${i}" title="Doble clic para renombrar">${U.esc(l.name)}</button>`).join('')
      + (n > 1 ? `<button class="lv-x${arm ? ' arm' : ''}" data-del title="Eliminar el nivel actual">${arm ? '¿Eliminar?' : FP.icon('trash', 15)}</button>` : '')
      + `<button class="lv-add" data-add title="Agregar un nivel">${FP.icon('plus', 15)}<span>Nivel</span></button>`
      + (menu ? `<div class="lv-menu"><button data-new="empty"><b>Nivel vacío</b><small>Con la misma forma de la casa</small></button><button data-new="dup"><b>Duplicar este nivel</b><small>Copia habitaciones, puertas y muebles</small></button></div>` : '');
  }

  function startRename(i) {
    const P = st.project, b = el.querySelector(`.lv[data-i="${i}"]`);
    if (!b) return;
    editing = i;
    const inp = document.createElement('input');
    inp.className = 'lv-in'; inp.value = P.levels[i].name; inp.maxLength = 30;
    b.replaceWith(inp);
    inp.focus(); inp.select();
    let done = false;
    const end = (ok) => { if (done) return; done = true; editing = -1; if (ok) FP.Levels.rename(P, i, inp.value); render(); };
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') end(true); else if (e.key === 'Escape') end(false); });
    inp.addEventListener('blur', () => end(true));
  }

  function onClick(e) {
    const P = st.project;
    if (!P) return;
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.i != null) { menu = arm = false; FP.Levels.switchTo(P, +b.dataset.i); render(); return; }
    if (b.dataset.add != null) { menu = !menu; arm = false; render(); return; }
    if (b.dataset.new) { menu = false; FP.Levels.add(P, b.dataset.new === 'dup'); FP.toast(b.dataset.new === 'dup' ? 'Nivel duplicado' : 'Nivel agregado: dibuja sobre la silueta del nivel de abajo'); render(); return; }
    if (b.dataset.del != null) {
      if (!arm) { arm = true; clearTimeout(armT); armT = setTimeout(() => { arm = false; render(); }, 3000); render(); return; }
      arm = false; FP.Levels.remove(P, P.level); render();
    }
  }

  FP.LevelBar = {
    init() {
      el = document.getElementById('levelBar');
      el.addEventListener('click', onClick);
      el.addEventListener('dblclick', (e) => { const b = e.target.closest('.lv'); if (b) startRename(+b.dataset.i); });
      document.addEventListener('pointerdown', (e) => { if (menu && !el.contains(e.target)) { menu = false; render(); } });
      ['project', 'restore', 'level', 'change'].forEach((ev) => FP.on(ev, render));
      render();
    },
  };
})();

/* dialogs.js — pantalla inicial "Crea tu espacio", "Mis proyectos" y proyecto de ejemplo. */
(function () {
  'use strict';
  const FP = window.FP, st = FP.state, U = FP.util;
  let startEl, projEl;

  /* ---------- proyecto de ejemplo (departamento de 10 × 8 m) ---------- */
  function example() {
    const p = FP.newProject({ kind: 'departamento', w: 10, h: 8, name: 'Departamento Monterrey' });
    const R = (type, name, x, y, w, h) => p.rooms.push({ id: U.uid(), type, name, x, y, w, h });
    R('principal', 'Recámara principal', 0, 0, 3.5, 4);
    R('bano', 'Baño', 3.5, 0, 2.5, 2);
    R('bano', 'Baño 2', 3.5, 2, 2.5, 2);
    R('recamara', 'Recámara', 6, 0, 4, 4);
    R('sala', 'Sala', 0, 4, 4.5, 4);
    R('comedor', 'Comedor', 4.5, 4, 2.5, 4);
    R('cocina', 'Cocina', 7, 4, 3, 4);
    const O = (kind, style, x, y, rot, flip, mirror) => { const o = FP.Openings.create(kind, style, x, y, rot, flip); o.mirror = !!mirror; p.openings.push(o); };
    O('door', 'single', 3.6, 8, 0, -1);
    O('door', 'single', 1.0, 4, 0, -1);
    O('door', 'single', 3.5, 1.5, 90, 1);
    O('door', 'single', 4.7, 4, 0, -1);
    O('door', 'single', 6.6, 4, 0, 1, true);
    O('window', 'large', 1.4, 8, 0, 1);
    O('window', 'single', 5.75, 8, 0, 1);
    O('window', 'single', 8.5, 8, 0, 1);
    O('window', 'large', 0, 2, 90, 1);
    O('window', 'large', 8, 0, 0, 1);
    O('window', 'single', 4.75, 0, 0, 1);
    const F = (key, x, y, rot) => p.furniture.push(FP.Furniture.create(key, x, y, rot));
    F('bed_king', 1.75, 1.15, 0); F('nightstand', 0.33, 0.32, 0); F('nightstand', 3.17, 0.32, 0); F('wardrobe', 2.6, 3.65, 0);
    F('wc', 3.95, 0.47, 0); F('basin', 4.65, 0.34, 0); F('shower', 5.45, 0.55, 0);
    F('wc', 3.95, 2.47, 0); F('basin', 4.65, 2.34, 0); F('shower', 5.45, 2.55, 0);
    F('bed_queen', 8, 1.15, 0); F('nightstand', 6.93, 0.32, 0); F('nightstand', 9.07, 0.32, 0); F('wardrobe', 9.6, 2.9, 90);
    F('tvstand', 0.3, 6, 270); F('tv', 0.26, 6, 270); F('sofa3', 3.5, 6, 90); F('coffee', 2.1, 6, 90); F('plant', 0.45, 7.45, 0);
    F('table6', 5.75, 6, 90);
    [[5.05, 5.55, 270], [5.05, 6.45, 270], [6.45, 5.55, 90], [6.45, 6.45, 90], [5.75, 4.95, 0], [5.75, 7.05, 180]].forEach((c) => F('chair', c[0], c[1], c[2]));
    F('fridge', 9.55, 4.4, 90); F('stove', 9.6, 5.05, 90); F('sink', 9.65, 5.85, 90); F('cabinets', 9.6, 7.0, 90); F('island', 7.9, 6.4, 90);
    return p;
  }

  function open(p) { closeAll(); FP.setProject(p); FP.emit('opened'); }
  function closeAll() { startEl.classList.remove('open'); projEl.classList.remove('open'); }

  /* ---------- pantalla inicial ---------- */
  function showStart() {
    projEl.classList.remove('open');
    const saved = FP.Storage.list();
    let kind = 'departamento', touched = false, W = 10, H = 8;
    startEl.innerHTML = `
      <div class="start-card">
        <div class="logo-big"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V3h18v18z"/><path d="M3 12h9v9M12 3v5M16 12h5"/></svg></div>
        <h1>Crea tu espacio</h1>
        <p class="sub">Diseña el plano de tu casa o departamento en minutos.</p>
        <div class="field-label">¿Qué quieres diseñar?</div>
        <div class="kind">
          <button data-kind="departamento" class="on">${FP.icon('apt', 22)}<b>Departamento</b></button>
          <button data-kind="casa">${FP.icon('house', 22)}<b>Casa</b></button>
        </div>
        <div class="field-label">Tamaño del espacio</div>
        <div class="size">
          <label><span>Ancho</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input id="sW" type="number" min="2" max="60" step="0.5" value="10"><em>m</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>
          <span class="x">×</span>
          <label><span>Largo</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input id="sH" type="number" min="2" max="60" step="0.5" value="8"><em>m</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>
        </div>
        <div class="preview"><div class="pv-box"><div id="pvRect"></div></div><div class="pv-info"><b id="pvArea">80 m²</b><span>de superficie total</span></div></div>
        <button class="primary big" id="sCreate">Crear plano</button>
        <div class="alt">
          <button id="sRandom">Generar uno aleatorio</button><i>·</i><button id="sBlank">Empezar desde cero</button><i>·</i><button id="sShape">Dibujar mi forma</button><i>·</i><button id="sExample">Ver un ejemplo</button>${saved.length ? `<i>·</i><button id="sProjects">Mis proyectos (${saved.length})</button>` : ''}
        </div>
      </div>`;
    startEl.classList.add('open');
    const sW = startEl.querySelector('#sW'), sH = startEl.querySelector('#sH');
    const upd = () => {
      W = U.clamp(U.parse(sW.value) || 2, 2, 60); H = U.clamp(U.parse(sH.value) || 2, 2, 60);
      const k = 88 / Math.max(W, H);
      const r = startEl.querySelector('#pvRect');
      r.style.width = W * k + 'px'; r.style.height = H * k + 'px';
      startEl.querySelector('#pvArea').textContent = Math.round(W * H * 10) / 10 + ' m²';
    };
    startEl.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
      kind = b.dataset.kind;
      startEl.querySelectorAll('[data-kind]').forEach((x) => x.classList.toggle('on', x === b));
      if (!touched) { sW.value = kind === 'casa' ? 14 : 10; sH.value = kind === 'casa' ? 10 : 8; upd(); }
    }));
    [sW, sH].forEach((i) => { i.addEventListener('input', () => { touched = true; upd(); }); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); }); });
    const create = () => { upd(); open(FP.newProject({ kind, w: W, h: H })); };
    startEl.querySelector('#sCreate').addEventListener('click', create);
    startEl.querySelector('#sRandom').addEventListener('click', () => { const p = FP.newProject({ kind }); open(p); FP.Generator.apply({ kind }); FP.history.reset(); });
    startEl.querySelector('#sBlank').addEventListener('click', () => open(FP.newProject({ kind, w: 20, h: 14, name: kind === 'casa' ? 'Mi Casa' : 'Mi Plano' })));
    startEl.querySelector('#sShape').addEventListener('click', () => { open(FP.newProject({ kind, w: 30, h: 20, name: kind === 'casa' ? 'Mi Casa' : 'Mi Plano' })); FP.setTool('shape'); FP.toast('Haz clic en cada esquina de tu casa; cierra en el primer punto'); });
    startEl.querySelector('#sExample').addEventListener('click', () => open(example()));
    const sp = startEl.querySelector('#sProjects');
    if (sp) sp.addEventListener('click', showProjects);
    upd();
  }

  /* ---------- mis proyectos ---------- */
  function showProjects() {
    const list = FP.Storage.list();
    projEl.innerHTML = `
      <div class="proj-card">
        <div class="proj-head"><h2>Mis proyectos</h2><div><button class="primary" id="pNew">+ Nuevo proyecto</button><button class="x" id="pClose">${FP.icon('close', 18)}</button></div></div>
        ${list.length ? '<div class="proj-grid">' + list.map((p) => `
          <div class="pcard" data-id="${p.id}">
            <div class="thumb"><img alt="" src="${FP.Exporter.thumbURI(p)}"></div>
            <div class="pinfo"><b>${U.esc(p.name)}</b><span>${Math.round(p.space.w * p.space.h * 10) / 10} m² · ${U.ago(p.modified).replace('Modificado', 'modificado')}</span></div>
            <div class="pacts"><button class="pbtn" data-a="open">Abrir</button><button class="pbtn" data-a="dup">Duplicar</button><button class="pbtn danger" data-a="del">Eliminar</button></div>
          </div>`).join('') + '</div>' : '<div class="proj-empty"><p>Aún no tienes proyectos guardados.</p></div>'}
      </div>`;
    projEl.classList.add('open');
    projEl.querySelector('#pClose').addEventListener('click', () => { projEl.classList.remove('open'); if (!st.project) showStart(); });
    projEl.querySelector('#pNew').addEventListener('click', showStart);
    projEl.querySelectorAll('.pcard').forEach((c) => c.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'), id = c.dataset.id;
      const a = b ? b.dataset.a : 'open';
      if (a === 'open') { const p = FP.Storage.get(id); if (p) open(p); }
      else if (a === 'dup') { FP.Storage.duplicate(id); showProjects(); }
      else if (a === 'del') { if (window.confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) { FP.Storage.remove(id); showProjects(); } }
    }));
  }

  FP.Dialogs = {
    init() {
      startEl = document.getElementById('start');
      projEl = document.getElementById('projects');
      projEl.addEventListener('pointerdown', (e) => { if (e.target === projEl) { projEl.classList.remove('open'); if (!st.project) showStart(); } });
    },
    showStart, showProjects, closeAll, example,
  };
})();

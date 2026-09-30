/* ui.js — iconos, barra de herramientas, menús flotantes, barra superior, avisos. */
(function () {
  'use strict';
  const FP = window.FP, st = FP.state, U = FP.util;

  const P = {
    select: '<path d="M5 3l14 7-6 2-2 6z"/>',
    room: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M12 9v6M9 12h6"/>',
    wall: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 12h18M9 6v6M15 12v6"/>',
    door: '<path d="M4 20h16M7 20V5M7 5a15 15 0 0 1 13 15"/>',
    window: '<rect x="4" y="8" width="16" height="8"/><path d="M4 12h16M12 8v8"/>',
    furn: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3zM6 18v2M18 18v2"/>',
    base: '<path d="M4 4h9v6h7v10H4z"/><path d="M13 4l7 6" stroke-dasharray="2 2"/>',
    measure: '<path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    export: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
    flip: '<path d="M12 4v16"/><path d="M8 8l-5 4 5 4z"/><path d="M16 8l5 4-5 4z"/>',
    grid: '<path d="M4 4h16v16H4z"/><path d="M4 12h16M12 4v16"/>',
    dims: '<path d="M3 8v8M21 8v8M3 12h18M6 9.5L3 12l3 2.5M18 9.5L21 12l-3 2.5"/>',
    magnet: '<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z"/><path d="M6 8h4M14 8h4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
    apt: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
    house: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M9 21l2-6 3 1v5M11 15l1-5 3 2 2 3M12 10l-3 2-1 3"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1"/><circle cx="15" cy="15" r="1.1"/><circle cx="15" cy="9" r="1.1"/><circle cx="9" cy="15" r="1.1"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
  };
  FP.icon = (name, size) => `<svg class="ic" width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;

  const TOOLS = [
    { id: 'select', label: 'Seleccionar', key: 'V' },
    { id: 'room', label: 'Habitación', key: 'H', menu: 1 },
    { id: 'wall', label: 'Pared', key: 'W' },
    { id: 'door', label: 'Puerta', key: 'D', menu: 1 },
    { id: 'window', label: 'Ventana', key: 'N', menu: 1 },
    { id: 'furn', label: 'Muebles', key: 'M', menu: 1 },
    { id: 'base', label: 'Base', key: 'B', menu: 1 },
    { id: 'measure', label: 'Medir', key: 'E' },
  ];
  const HINTS = {
    select: 'Haz clic para seleccionar · arrastra para mover · Shift para elegir varios',
    room: 'Haz clic para colocar la habitación, o arrastra para dibujarla del tamaño que quieras',
    wall: 'Arrastra para dibujar una pared · Esc para terminar',
    door: 'Acerca la puerta a una pared y haz clic · el lado donde esté el cursor es hacia donde abre',
    window: 'Acerca la ventana a una pared y haz clic',
    furn: 'Haz clic para colocar · R para girar · Shift para colocar varios · Esc para cancelar',
    measure: 'Haz clic en dos puntos para medir la distancia',
    addarea: 'Arrastra un rectángulo para AGREGAR ese espacio a la casa (puede salirse de la base actual) · Esc para cancelar',
    push: 'Arrastra un muro exterior hacia afuera para ampliar la casa, o hacia adentro para reducirla · Esc para cancelar',
    shape: 'Haz clic en cada esquina de la casa (las líneas salen rectas) · clic en el primer punto o Enter para cerrar · Retroceso quita el último · Esc cancela',
    cut: 'Arrastra un rectángulo sobre la base para recortarla (esquinas, patios…) · Esc para cancelar',
    erase: 'Pon el cursor sobre cualquier muro (de la casa o de una habitación) y arrastra hasta donde quieras borrarlo · Esc para terminar',
    '3d': 'Arrastra para girar · rueda para acercar · clic derecho para desplazar',
  };

  let openFly = null, furnCat = 'recamara', furnQuery = '';
  let flyEl, hintEl;

  function closeFly() { openFly = null; flyEl.classList.remove('open'); syncTools(); }

  function syncTools() {
    document.querySelectorAll('#toolbar .tool').forEach((b) => {
      const id = b.dataset.tool;
      b.classList.toggle('on', openFly ? openFly === id : st.tool === id || (id === 'base' && (st.tool === 'cut' || st.tool === 'erase' || st.tool === 'shape' || st.tool === 'addarea' || st.tool === 'push')));
    });
  }

  function itemCard(key) {
    const d = FP.Furniture.def(key);
    return `<button class="card" data-key="${key}" title="${U.esc(d.name)}"><span class="ico">${FP.Furniture.icon(key, 52)}</span><b>${U.esc(d.name)}</b><small>${U.fmt(d.w)} × ${U.fmt(d.h)} m</small></button>`;
  }

  function renderFurnFly() {
    const cats = FP.Furniture.CATS;
    const q = furnQuery.trim().toLowerCase();
    let keys;
    if (q) {
      const seen = new Set();
      keys = [];
      cats.forEach((c) => c.items.forEach((k) => { if (!seen.has(k) && FP.Furniture.def(k).name.toLowerCase().includes(q)) { seen.add(k); keys.push(k); } }));
    } else keys = cats.find((c) => c.id === furnCat).items;
    flyEl.innerHTML = `
      <div class="fly-head"><h3>Muebles</h3><button class="x" data-close>${FP.icon('close', 16)}</button></div>
      <label class="search">${FP.icon('search', 15)}<input id="furnQ" placeholder="Buscar mueble…" value="${U.esc(furnQuery)}" autocomplete="off"></label>
      <div class="chips">${cats.map((c) => `<button class="chip${!q && c.id === furnCat ? ' on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="grid">${keys.map(itemCard).join('') || '<p class="empty">Sin resultados</p>'}</div>`;
    flyEl.classList.add('wide');
  }

  function showFly(id) {
    openFly = id;
    flyEl.classList.remove('wide');
    if (id === 'room') {
      flyEl.innerHTML = `<div class="fly-head"><h3>¿Qué habitación quieres agregar?</h3><button class="x" data-close>${FP.icon('close', 16)}</button></div>
        <div class="list">${FP.Rooms.TYPES.map((t) => `<button class="row" data-room="${t.id}"><i style="background:${t.color}"></i><span>${t.name}</span><small>${t.w} × ${t.h} m</small></button>`).join('')}</div>`;
    } else if (id === 'base') {
      const P = st.project, nc = (P.space.cuts || []).length, ng = (P.space.gaps || []).length;
      flyEl.innerHTML = `<div class="fly-head"><h3>Forma de la casa</h3><button class="x" data-close>${FP.icon('close', 16)}</button></div>
        <div class="list">
          <button class="row" data-base="addarea"><span class="opi">${FP.icon('room', 22)}</span><span>Agregar un área<br><small>Amplía la casa con otro espacio (ala, cuarto extra…)</small></span></button>
          <button class="row" data-base="push"><span class="opi">${FP.icon('wall', 22)}</span><span>Mover un muro exterior<br><small>Arrástralo para hacer la casa más grande o más chica</small></span></button>
          <button class="row" data-base="shape"><span class="opi">${FP.icon('wall', 22)}</span><span>Dibujar la forma con líneas<br><small>Traza el contorno esquina por esquina (L, U, T…)</small></span></button>
          <button class="row" data-base="cut"><span class="opi">${FP.icon('base', 22)}</span><span>Recortar un área<br><small>Esquinas, patios, forma en L…</small></span></button>
          <button class="row" data-base="erase"><span class="opi">${FP.icon('wall', 22)}</span><span>Borrar un tramo de muro<br><small>De la casa o de una habitación</small></span></button>
          ${nc || ng ? `<button class="row" data-base="reset"><span class="opi">${FP.icon('undo', 20)}</span><span>Restaurar forma original<br><small>${nc} recorte(s) · ${ng} tramo(s) borrado(s)</small></span></button>` : ''}
        </div>`;
    } else if (id === 'door' || id === 'window') {
      const d = FP.Openings.DEFS[id];
      flyEl.innerHTML = `<div class="fly-head"><h3>${id === 'door' ? 'Tipo de puerta' : 'Tipo de ventana'}</h3><button class="x" data-close>${FP.icon('close', 16)}</button></div>
        <div class="list">${d.styles.map((s) => `<button class="row" data-op="${id}:${s.id}"><span class="opi">${FP.Openings.icon(id, s.id)}</span><span>${s.name}</span><small>${s.w} m</small></button>`).join('')}</div>`;
    } else renderFurnFly();
    flyEl.classList.add('open');
    syncTools();
    if (id === 'furn') { const q = flyEl.querySelector('#furnQ'); if (q && !('ontouchstart' in window)) q.focus(); }
  }

  function onFlyClick(e) {
    if (e.target.closest('[data-close]')) return closeFly();
    const r = e.target.closest('[data-room]');
    if (r) { closeFly(); FP.setTool('room', { type: r.dataset.room }); return; }
    const bs = e.target.closest('[data-base]');
    if (bs) {
      const a = bs.dataset.base;
      closeFly();
      if (a === 'reset') { delete st.project.space.cuts; delete st.project.space.gaps; FP.commit(); FP.render(); FP.toast('Forma restaurada'); } else FP.setTool(a);
      return;
    }
    const o = e.target.closest('[data-op]');
    if (o) { const [k, s] = o.dataset.op.split(':'); closeFly(); FP.setTool(k, { style: s }); return; }
    const c = e.target.closest('[data-cat]');
    if (c) { furnCat = c.dataset.cat; furnQuery = ''; renderFurnFly(); return; }
    const k = e.target.closest('[data-key]');
    if (k) { closeFly(); FP.setTool('furn', { key: k.dataset.key }); }
  }

  function onTool(id) {
    if (st.mode === '3d') { FP.toast('Vuelve a Plano o Presentación para editar'); return; }
    const t = TOOLS.find((x) => x.id === id);
    if (t.menu) { if (openFly === id) closeFly(); else showFly(id); return; }
    closeFly();
    FP.setTool(id);
  }

  function setMode(m) {
    if (st.mode === m) return;
    st.mode = m;
    closeFly();
    if (m !== '3d') { FP.View3D.hide(); }
    if (m === '3d') {
      if (st.tool !== 'select') FP.setTool('select');
      FP.select([]);
    }
    FP.emit('mode');
    if (m === '3d') FP.View3D.show();
  }

  function refreshHint() {
    hintEl.textContent = st.mode === '3d' ? HINTS['3d'] : HINTS[st.tool] || '';
  }
  function refreshTop() {
    const p = st.project;
    if (!p) return;
    const nameEl = document.getElementById('projName');
    if (document.activeElement !== nameEl) nameEl.value = p.name;
    document.getElementById('projArea').textContent = Math.round(FP.stats().area * 10) / 10 + ' m²';
    document.getElementById('btnUndo').disabled = !FP.history.canUndo();
    document.getElementById('btnRedo').disabled = !FP.history.canRedo();
  }

  function toggle(id, key, cls) {
    const b = document.getElementById(id);
    b.addEventListener('click', () => { st[key] = !st[key]; b.classList.toggle('on', st[key]); FP.render(); });
    b.classList.toggle('on', st[key]);
  }

  FP.UI = {
    closeFly, setMode, refreshTop,
    init() {
      flyEl = document.getElementById('flyout');
      hintEl = document.getElementById('hint');
      const tb = document.getElementById('toolbar');
      tb.innerHTML = TOOLS.map((t) => `<button class="tool" data-tool="${t.id}" title="${t.label} (${t.key})">${FP.icon(t.id)}<span>${t.label}</span></button>`).join('');
      tb.addEventListener('click', (e) => { const b = e.target.closest('.tool'); if (b) onTool(b.dataset.tool); });
      flyEl.addEventListener('click', onFlyClick);
      flyEl.addEventListener('input', (e) => { if (e.target.id === 'furnQ') { furnQuery = e.target.value; const pos = e.target.selectionStart; renderFurnFly(); const q = flyEl.querySelector('#furnQ'); q.focus(); q.setSelectionRange(pos, pos); } });
      FP.on('canvasdown', () => { if (openFly) closeFly(); });

      // iconos de la barra superior
      const set = (id, ic, size) => { const el = document.getElementById(id); el.insertAdjacentHTML('afterbegin', FP.icon(ic, size || 18)); };
      set('btnUndo', 'undo'); set('btnRedo', 'redo'); set('btnProjects', 'folder'); set('btnSave', 'save'); set('btnExport', 'export'); set('btnRandom', 'dice');
      document.getElementById('btnRandom').addEventListener('click', () => FP.Generator.dialog());
      document.getElementById('walkBtn').insertAdjacentHTML('afterbegin', FP.icon('walk', 18));
      document.getElementById('walkBtn').addEventListener('click', () => FP.View3D.startWalk());
      document.getElementById('walkClip').addEventListener('click', () => FP.View3D.toggleNoclip());
      document.getElementById('walkUp').addEventListener('click', () => FP.View3D.walkLevel(1));
      document.getElementById('walkDown').addEventListener('click', () => FP.View3D.walkLevel(-1));
      document.getElementById('shotBtn').insertAdjacentHTML('afterbegin', FP.icon('camera', 18));
      document.getElementById('shotBtn').addEventListener('click', () => FP.View3D.capture());
      document.getElementById('walkExit').addEventListener('click', () => FP.View3D.stopWalk());
      set('zoomIn', 'plus', 16); set('zoomOut', 'minus', 16); set('zoomFit', 'fit', 16);
      set('tgDims', 'dims', 15); set('tgGrid', 'grid', 15); set('tgSnap', 'magnet', 15);
      document.getElementById('btnUndo').addEventListener('click', () => FP.history.undo());
      document.getElementById('btnRedo').addEventListener('click', () => FP.history.redo());
      document.getElementById('zoomIn').addEventListener('click', () => FP.Editor.zoomBy(1.25));
      document.getElementById('zoomOut').addEventListener('click', () => FP.Editor.zoomBy(0.8));
      document.getElementById('zoomFit').addEventListener('click', () => (st.mode === '3d' ? FP.View3D.refit() : FP.Editor.resetView()));
      toggle('tgDims', 'showDims'); toggle('tgGrid', 'showGrid'); toggle('tgSnap', 'snap');

      // modo
      document.getElementById('modeSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
      FP.on('mode', () => {
        document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === st.mode));
        document.getElementById('app').dataset.mode = st.mode;
        refreshHint();
      });

      // nombre del proyecto
      const nameEl = document.getElementById('projName');
      nameEl.addEventListener('input', () => { if (st.project) { st.project.name = nameEl.value; st.project.modified = Date.now(); FP.emit('namechange'); } });
      nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameEl.blur(); });
      nameEl.addEventListener('blur', () => { if (!nameEl.value.trim()) { nameEl.value = st.project.name = 'Mi plano'; } });

      // menú exportar
      const em = document.getElementById('exportMenu'), be = document.getElementById('btnExport');
      be.addEventListener('click', (e) => { e.stopPropagation(); em.classList.toggle('open'); });
      document.addEventListener('click', () => em.classList.remove('open'));
      em.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-exp]');
        if (!b) return;
        em.classList.remove('open');
        const kind = b.dataset.exp;
        try {
          if (kind === 'png') { await FP.Exporter.png(st.project); FP.toast('PNG exportado'); }
          else if (kind === 'svg') { FP.Exporter.svg(st.project); FP.toast('SVG exportado'); }
          else if (kind === 'pdf') { FP.toast('Generando PDF…'); await FP.Exporter.pdf(st.project); }
        } catch (err) { FP.toast('No se pudo exportar'); }
      });

      ['tool', 'mode'].forEach((ev) => FP.on(ev, () => { syncTools(); refreshHint(); }));
      ['change', 'project', 'restore', 'live'].forEach((ev) => FP.on(ev, refreshTop));
      syncTools(); refreshHint();
    },
  };
})();

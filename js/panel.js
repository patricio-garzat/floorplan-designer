/* panel.js — panel derecho: "Mi plano" o propiedades del elemento seleccionado. */
(function () {
  'use strict';
  const FP = window.FP, st = FP.state, U = FP.util;
  let el, fields = [], key = '';

  const num = (label, k, get, set, o = {}) => ({ type: 'num', label, k, get, set, unit: o.unit || 'm', min: o.min, max: o.max, step: o.step || (o.unit === '°' ? 15 : 0.1) });
  const txt = (label, k, get, set) => ({ type: 'text', label, k, get, set });
  const color = (label, k, get, set) => ({ type: 'color', label, k, get, set });
  function setWall(r, tex, color) {
    if (!tex && !color) { delete r.wall; return; }
    const cur = r.wall && r.wall.tex, id = tex || cur || 'paint', d = FP.Rooms.WALLS.find((w) => w.id === id) || FP.Rooms.WALLS[0];
    r.wall = { tex: d.id, color: color || (tex && tex !== cur ? d.color : (r.wall && r.wall.color) || d.color) };
  }
  const ro = (label, k, get) => ({ type: 'ro', label, k, get });
  const sel = (label, k, opts, get, set) => ({ type: 'select', label, k, opts, get, set });

  function fieldsFor(f) {
    const P = st.project, W = P.space.w, H = P.space.h, o = f.obj;
    switch (f.coll) {
      case 'rooms':
        return [
          txt('Nombre', 'name', (o) => o.name, (o, v) => { o.name = v.trim() || FP.Rooms.def(o.type).name; }),
          sel('Tipo', 'type', FP.Rooms.TYPES.map((t) => [t.id, t.name]), (o) => o.type, (o, v) => { o.type = v; }),
          num('Ancho', 'w', (o) => o.w, (o, v) => { o.w = U.clamp(v, 0.5, W + 8); if (!(o.type === 'balcon' || o.type === 'terraza' || o.type === 'cochera') && o.x + o.w > W) o.x = W - o.w; }, { min: 0.5, max: W }),
          num('Largo', 'h', (o) => o.h, (o, v) => { o.h = U.clamp(v, 0.5, H + 8); if (!(o.type === 'balcon' || o.type === 'terraza' || o.type === 'cochera') && o.y + o.h > H) o.y = H - o.h; }, { min: 0.5, max: H }),
          sel('Piso', 'floor', FP.Rooms.FLOORS.map((f) => [f.id, f.name]), (o) => FP.Rooms.floorDef(o).id, (o, v) => { o.floor = v; }),
          sel('Textura de pared', 'wtex', [['', 'Pintura base']].concat(FP.Rooms.WALLS.map((w) => [w.id, w.name])), (o) => (o.wall && o.wall.tex) || '', (o, v) => setWall(o, v, null)),
          color('Color de pared', 'wcolor', (o) => (FP.Rooms.wallDef(o) || { color: '#f6f4f0' }).color, (o, v) => setWall(o, (o.wall && o.wall.tex) || 'paint', v)),
          ro('Área', 'area', (o) => U.fmt(o.w * o.h) + ' m²'),
        ].concat(o.type === 'balcon' || o.type === 'terraza' || o.type === 'cochera' ? [sel('Barandal', 'rail', [['glass', 'Cristal'], ['bars', 'Rejas metálicas'], ['wall', 'Muro bajo']].concat(o.type === 'cochera' ? [['none', 'Sin barandal']] : []), (o) => o.rail || (o.type === 'cochera' ? 'none' : 'glass'), (o, v) => { o.rail = v; })] : []);
      case 'furniture':
        if (o.key.startsWith('art_')) {
          return [
            txt('Nombre', 'name', (o) => o.name, (o, v) => { o.name = v.trim() || FP.Furniture.def(o.key).name; }),
            num('Ancho', 'w', (o) => o.w, (o, v) => { o.w = U.clamp(v, 0.2, 3); }, { min: 0.2, max: 3 }),
            num('Alto del cuadro', 'ph', (o) => o.ph, (o, v) => { o.ph = U.clamp(v, 0.2, 2); }, { min: 0.2, max: 2 }),
            num('Altura al centro', 'z', (o) => o.z, (o, v) => { o.z = U.clamp(v, 0.3, 2.4); }, { min: 0.3, max: 2.4 }),
            sel('Marco', 'frame', [['black', 'Negro'], ['oak', 'Madera'], ['white', 'Blanco'], ['gold', 'Dorado']], (o) => o.frame || 'black', (o, v) => { o.frame = v; }),
          ];
        }
        if (o.key === 'tv') {
          const wOf = (i) => i * 0.0254 * 0.8716; // ancho de una pantalla 16:9 según su diagonal
          return [
            txt('Nombre', 'name', (o) => o.name, (o, v) => { o.name = v.trim() || FP.Furniture.def(o.key).name; }),
            num('Tamaño', 'inch', (o) => o.inch || Math.round(o.w / 0.0254 / 0.8716), (o, v) => { o.inch = Math.round(v); o.w = wOf(o.inch); }, { unit: '"', min: 15, max: 120, step: 1 }),
            ro('Ancho', 'wro', (o) => U.fmt(o.w) + ' m'),
            num('Rotación', 'rot', (o) => Math.round(o.rot || 0), (o, v) => { o.rot = U.norm360(Math.round(v)); }, { unit: '°', step: 15 }),
          ];
        }
        return [
          txt('Nombre', 'name', (o) => o.name, (o, v) => { o.name = v.trim() || FP.Furniture.def(o.key).name; }),
          num('Ancho', 'w', (o) => o.w, (o, v) => { o.w = U.clamp(v, 0.05, Math.min(W, H)); }, { min: 0.05 }),
          num('Largo', 'h', (o) => o.h, (o, v) => { o.h = U.clamp(v, 0.05, Math.min(W, H)); }, { min: 0.05 }),
          num('Rotación', 'rot', (o) => Math.round(o.rot || 0), (o, v) => { o.rot = U.norm360(Math.round(v)); }, { unit: '°', step: 15 }),
        ];
      case 'openings': {
        const d = FP.Openings.DEFS[o.kind];
        return [
          sel('Tipo', 'style', d.styles.map((s) => [s.id, s.name]), (o) => o.style, (o, v) => { o.style = v; o.w = FP.Openings.style(o.kind, v).w; }),
          num('Ancho', 'w', (o) => o.w, (o, v) => {
            o.w = U.clamp(v, 0.4, Math.max(W, H));
            const hit = FP.Snap.toWall({ x: o.x, y: o.y }, P, 0.3, o.w / 2, false); // mantenerla dentro de su muro
            if (hit) { o.x = hit.x; o.y = hit.y; o.rot = hit.rot; }
          }, { min: 0.4, max: Math.max(W, H), step: 0.5 }),
        ].concat(o.kind === 'door' ? [
          sel('Diseño', 'finish', [['wood', 'Madera lisa'], ['oak_slat', 'Listones de madera'], ['white', 'Paneles clásicos'], ['shaker', 'Shaker'], ['flush', 'Lisa pintada'], ['black', 'Negra moderna'], ['glass', 'Vidrio y aluminio'], ['french', 'Vidrio con retícula']], (o) => o.finish || 'wood', (o, v) => { o.finish = v; }),
          color('Color', 'color', (o) => o.color || '#f6f4f0', (o, v) => { o.color = v; }),
          sel('Manija', 'handle', [['chrome', 'Palanca cromo'], ['black', 'Palanca negra'], ['brass', 'Palanca latón'], ['bar', 'Barra']], (o) => o.handle || 'chrome', (o, v) => { o.handle = v; }),
        ] : []);
      }
      case 'walls':
        return [num('Largo', 'len', (o) => FP.Walls.length(o), (o, v) => {
          const L = FP.Walls.length(o) || 1, k = Math.max(0.1, v) / L;
          o.x2 = U.clamp(o.x1 + (o.x2 - o.x1) * k, 0, W); o.y2 = U.clamp(o.y1 + (o.y2 - o.y1) * k, 0, H);
        }, { min: 0.1 })];
      case 'measures':
        return [ro('Distancia', 'len', (o) => U.fmt(Math.hypot(o.x2 - o.x1, o.y2 - o.y1)) + ' m')];
      default:
        return [];
    }
  }

  function fieldHTML(f, obj) {
    const v = f.get(obj);
    if (f.type === 'num') return `<label class="fld"><span>${f.label}</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input type="number" data-k="${f.k}" value="${(+v).toFixed((f.unit === '°' || f.unit === '"') ? 0 : 2)}" step="${f.step}"${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}><em>${f.unit}</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>`;
    if (f.type === 'text') return `<label class="fld"><span>${f.label}</span><span class="in wide"><input type="text" data-k="${f.k}" value="${U.esc(v)}" maxlength="40"></span></label>`;
    if (f.type === 'select') return `<label class="fld"><span>${f.label}</span><span class="in wide"><select data-k="${f.k}">${f.opts.map(([id, nm]) => `<option value="${id}"${id === v ? ' selected' : ''}>${nm}</option>`).join('')}</select></span></label>`;
    if (f.type === 'color') return `<label class="fld"><span>${f.label}</span><span class="in wide colorin"><input type="color" data-k="${f.k}" value="${v}"><em>${v}</em></span></label>`;
    return `<div class="fld"><span>${f.label}</span><b data-k="${f.k}">${v}</b></div>`;
  }

  const btn = (act, icon, label, cls) => `<button class="pbtn${cls ? ' ' + cls : ''}" data-act="${act}">${FP.icon(icon, 16)}<span>${label}</span></button>`;

  const KIND = { rooms: 'Habitación', furniture: 'Mueble', openings: 'Apertura', walls: 'Pared', measures: 'Medida' };
  function titleOf(f) {
    if (f.coll === 'openings') return FP.Openings.label(f.obj);
    if (f.coll === 'furniture' || f.coll === 'rooms') return f.obj.name;
    return KIND[f.coll];
  }

  function overview() {
    const P = st.project, s = FP.stats();
    return `<div class="ptitle"><small>Resumen</small><h2>Mi plano</h2></div>
      <div class="stats">
        <div><b>${Math.round(s.area * 10) / 10}<em> m²</em></b><span>Superficie</span></div>
        <div><b>${s.rooms}</b><span>Habitaciones</span></div>
        <div><b>${s.baths}</b><span>Baños</span></div>
        <div><b>${s.furniture}</b><span>Muebles</span></div>
      </div>
      <div class="psec"><h4>Tamaño del espacio</h4>
        <label class="fld"><span>Ancho</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input type="number" data-space="w" value="${P.space.w.toFixed(2)}" step="0.5" min="2" max="60"><em>m</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>
        <label class="fld"><span>Largo</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input type="number" data-space="h" value="${P.space.h.toFixed(2)}" step="0.5" min="2" max="60"><em>m</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>
        ${P.kind === 'departamento' ? `<label class="fld"><span>Piso en el edificio</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input type="number" data-space-fl value="${P.space.floorNo || 5}" step="1" min="1" max="60"><em>°</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>` : ''}
        ${(P.space.cuts || []).length || (P.space.gaps || []).length ? `<div class="fld"><span>Forma de la base</span><button class="pbtn" data-act="resetbase">Restaurar</button></div>` : ''}
        <div class="fld"><span>En habitaciones</span><b>${U.fmt(s.roomsArea)} m²</b></div>
        <label class="fld"><span>Piso de la base</span><span class="in wide"><select data-space-floor>${FP.Rooms.FLOORS.reduce((h, f) => h + `<option value="${f.id}"${P.space.floor === f.id ? ' selected' : ''}>${f.name}</option>`, `<option value=""${P.space.floor ? '' : ' selected'}>Concreto (por defecto)</option>`)}</select></span></label>
      </div>
      <div class="psec tips"><h4>Consejos</h4>
        <p>Empieza con <b>Habitación</b>, luego agrega puertas, ventanas y muebles.</p>
        <p>Arrastra las esquinas de una habitación para cambiar su tamaño.</p>
        <p><kbd>R</kbd> gira · <kbd>Supr</kbd> borra · <kbd>Espacio</kbd>+arrastrar mueve el lienzo.</p>
      </div>`;
  }

  function threeD() {
    const L = FP.View3D.LIGHTS, cur = FP.View3D.light();
    return `<div class="ptitle"><small>Vista</small><h2>3D</h2></div>
      <div class="pbtns"><button class="pbtn go" data-act="walk">${FP.icon('walk', 16)}<span>Recorrer la casa</span></button></div>
      <div class="psec" style="margin-top:18px"><h4>Iluminación</h4><div class="chips">${Object.keys(L).map((k) => `<button class="chip${k === cur ? ' on' : ''}" data-light="${k}">${L[k].name}</button>`).join('')}</div></div>
      <div class="psec"><h4>Pisos</h4>
        ${st.project.kind === 'departamento' ? `<label class="fld"><span>Piso en el edificio</span><span class="in"><button type="button" class="stb" data-st="-1" tabindex="-1">−</button><input type="number" data-space-fl value="${st.project.space.floorNo || 5}" step="1" min="1" max="60"><em>°</em><button type="button" class="stb" data-st="1" tabindex="-1">+</button></span></label>` : ''}
        <label class="fld"><span>Base de la casa</span><span class="in wide"><select data-space-floor>${FP.Rooms.FLOORS.reduce((h, f) => h + `<option value="${f.id}"${st.project.space.floor === f.id ? ' selected' : ''}>${f.name}</option>`, `<option value=""${st.project.space.floor ? '' : ' selected'}>Concreto (por defecto)</option>`)}</select></span></label>
        <label class="fld"><span>Todas</span><span class="in wide"><select data-floor-all><option value="">Elegir…</option>${FP.Rooms.FLOORS.map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></span></label>
        ${st.project.rooms.map((r) => `<label class="fld"><span>${U.esc(r.name)}</span><span class="in wide"><select data-floor="${r.id}">${FP.Rooms.FLOORS.map((f) => `<option value="${f.id}"${f.id === FP.Rooms.floorDef(r).id ? ' selected' : ''}>${f.name}</option>`).join('')}</select></span></label>`).join('')}
      </div>
      <div class="psec"><h4>Paredes</h4>
        <label class="fld"><span>Todas</span><span class="in wide"><select data-wtex-all><option value="">Textura…</option>${FP.Rooms.WALLS.map((w) => `<option value="${w.id}">${w.name}</option>`).join('')}</select></span></label>
        <label class="fld"><span>Color (todas)</span><span class="in wide colorin"><input type="color" data-wcol-all value="#f6f4f0"><em>elegir</em></span></label>
        ${st.project.rooms.map((r) => { const d = FP.Rooms.wallDef(r); return `<div class="fld wrow"><span>${U.esc(r.name)}</span><span class="in"><select data-wtex="${r.id}"><option value="">Base</option>${FP.Rooms.WALLS.map((w) => `<option value="${w.id}"${d && d.tex === w.id ? ' selected' : ''}>${w.name}</option>`).join('')}</select></span><input class="colsq" type="color" data-wcol="${r.id}" value="${d ? d.color : '#f6f4f0'}"></div>`; }).join('')}
      </div>
      <div class="psec tips"><p>Arrastra para girar la cámara, rueda para acercar, clic derecho para desplazar.</p>
      <p>Con <b>Recorrer la casa</b> caminas por dentro con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> y el mouse.</p>
      <p>Para editar, vuelve a <b>Plano</b> o <b>Presentación</b>.</p></div>`;
  }

  function render() {
    if (!el || !st.project) return;
    if (st.mode === '3d') { el.innerHTML = threeD(); fields = []; document.body.classList.remove('has-sel'); return; }
    const items = st.sel.map(FP.find).filter(Boolean);
    document.body.classList.toggle('has-sel', items.length > 0);
    key = st.sel.join(',');
    if (!items.length) { fields = []; el.innerHTML = overview(); return; }
    if (items.length > 1) {
      fields = [];
      el.innerHTML = `<div class="ptitle"><small>Selección</small><h2>${items.length} elementos</h2></div>
        <div class="pbtns">${btn('dup', 'copy', 'Duplicar')}${btn('del', 'trash', 'Eliminar', 'danger')}</div>
        <p class="note">Arrastra para moverlos juntos. Shift + clic para sumar o quitar elementos.</p>`;
      return;
    }
    const f = items[0];
    fields = fieldsFor(f);
    let acts = '';
    if (f.coll === 'furniture' && f.obj.key.startsWith('art_')) acts += btn('reseed', 'sparkle', 'Otra obra');
    else if (f.coll === 'furniture') acts += btn('rot', 'rotate', 'Rotar 90°') + btn('mirror', 'flip', 'Espejo');
    if (f.coll === 'rooms') acts += btn('rot', 'rotate', 'Girar 90°');
    if (f.coll === 'openings') acts += btn('rot', 'flip', 'Cambiar lado') + (f.obj.kind === 'door' && f.obj.style !== 'sliding' ? btn('hinge', 'flip', 'Invertir bisagra') : '');
    if (f.coll !== 'measures') acts += btn('dup', 'copy', 'Duplicar');
    acts += btn('del', 'trash', 'Eliminar', 'danger');
    el.innerHTML = `<div class="ptitle"><small>${KIND[f.coll]}</small><h2>${U.esc(titleOf(f))}</h2></div>
      <div class="psec">${fields.map((fl) => fieldHTML(fl, f.obj)).join('')}</div>
      ${f.coll === 'rooms' ? `<div class="psec"><h4>Colores de pared</h4><div class="sw">${FP.Rooms.WALL_SWATCHES.map((c) => `<button class="swb" data-wc="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div></div>` : ''}
      <div class="pbtns">${acts}</div>`;
  }

  /** Actualiza valores sin reconstruir (durante arrastres). */
  function refresh() {
    if (!el || st.mode === '3d') return;
    const items = st.sel.map(FP.find).filter(Boolean);
    if (!items.length) { if (!el.querySelector('[data-space]') || document.activeElement.closest('#panel')) return; el.innerHTML = overview(); return; }
    if (items.length !== 1) return;
    const f = items[0];
    fields.forEach((fl) => {
      const inp = el.querySelector(`[data-k="${fl.k}"]`);
      if (!inp || inp === document.activeElement) return;
      const v = fl.get(f.obj);
      if (fl.type === 'ro') inp.textContent = v;
      else if (fl.type === 'num') inp.value = (+v).toFixed((fl.unit === '°' || fl.unit === '"') ? 0 : 2);
      else inp.value = v;
    });
  }

  function onChange(e) {
    const inp = e.target;
    if (inp.dataset.spaceFl !== undefined) {
      const v = Math.max(1, Math.min(60, Math.round(U.parse(inp.value) || 5)));
      st.project.space.floorNo = v;
      FP.commit(); FP.render(); if (st.mode === '3d') FP.View3D.refit(); render();
      return;
    }
    if (inp.dataset.spaceFloor !== undefined) {
      if (inp.value) st.project.space.floor = inp.value; else delete st.project.space.floor;
      FP.commit(); FP.render(); render();
      return;
    }
    if (inp.dataset.wtex !== undefined || inp.dataset.wtexAll !== undefined || inp.dataset.wcol !== undefined || inp.dataset.wcolAll !== undefined) {
      const rooms = inp.dataset.wtexAll !== undefined || inp.dataset.wcolAll !== undefined ? st.project.rooms : st.project.rooms.filter((x) => x.id === (inp.dataset.wtex || inp.dataset.wcol));
      rooms.forEach((r) => {
        if (inp.dataset.wtex !== undefined || inp.dataset.wtexAll !== undefined) { if (inp.value || inp.dataset.wtex !== undefined) setWall(r, inp.value, null); }
        else setWall(r, (r.wall && r.wall.tex) || 'paint', inp.value);
      });
      FP.commit(); FP.render(); render();
      return;
    }
    if (inp.dataset.floor !== undefined || inp.dataset.floorAll !== undefined) {
      if (inp.dataset.floorAll !== undefined) { if (inp.value) st.project.rooms.forEach((r) => { r.floor = inp.value; }); }
      else { const r = st.project.rooms.find((x) => x.id === inp.dataset.floor); if (r) r.floor = inp.value; }
      FP.commit(); FP.render(); render();
      return;
    }
    if (inp.dataset.space) {
      const v = U.parse(inp.value), P = st.project;
      if (!(v >= 2)) { render(); return; }
      const val = U.clamp(v, 2, 60);
      P.space[inp.dataset.space] = val;
      if (P.space.cuts) P.space.cuts = P.space.cuts.map((c) => ({ x: Math.min(c.x, P.space.w - 0.5), y: Math.min(c.y, P.space.h - 0.5), w: Math.min(c.w, P.space.w - c.x), h: Math.min(c.h, P.space.h - c.y) })).filter((c) => c.w > 0.3 && c.h > 0.3);
      // no dejar nada fuera del espacio
      P.rooms.forEach((r) => { if (r.type === 'balcon' || r.type === 'terraza' || r.type === 'cochera') return; r.x = Math.min(r.x, Math.max(0, P.space.w - r.w)); r.y = Math.min(r.y, Math.max(0, P.space.h - r.h)); r.w = Math.min(r.w, P.space.w); r.h = Math.min(r.h, P.space.h); });
      FP.commit(); FP.render(); render();
      return;
    }
    const f = st.sel.length === 1 && FP.find(st.sel[0]);
    if (!f || !inp.dataset.k) return;
    const fl = fields.find((x) => x.k === inp.dataset.k);
    if (!fl || fl.type === 'ro') return;
    if (fl.type === 'num') {
      const v = U.parse(inp.value);
      if (isNaN(v) || (fl.min != null && v < fl.min - 1e-9)) { inp.value = (+fl.get(f.obj)).toFixed((fl.unit === '°' || fl.unit === '"') ? 0 : 2); return; }
      fl.set(f.obj, v);
    } else fl.set(f.obj, inp.value);
    FP.commit(); FP.render(); render();
  }

  function onClick(e) {
    const lb = e.target.closest('[data-light]');
    if (lb) { FP.View3D.setLight(lb.dataset.light); render(); return; }
    const sw = e.target.closest('[data-wc]');
    if (sw) { FP.Actions.selected().forEach(({ obj, coll }) => { if (coll === 'rooms') setWall(obj, (obj.wall && obj.wall.tex) || 'paint', sw.dataset.wc); }); FP.commit(); FP.render(); render(); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'walk') { FP.View3D.startWalk(); return; }
    const a = b.dataset.act;
    if (a === 'del') FP.Actions.remove();
    else if (a === 'dup') FP.Actions.duplicate();
    else if (a === 'rot') FP.Actions.rotate(1);
    else if (a === 'resetbase') { delete st.project.space.cuts; delete st.project.space.gaps; FP.commit(); FP.render(); render(); }
    else if (a === 'hinge') FP.Actions.flipHinge();
    else if (a === 'mirror') FP.Actions.mirror();
    else if (a === 'reseed') { FP.Actions.selected().forEach(({ obj }) => { obj.seed = Math.floor(Math.random() * 1e6); }); FP.commit(); FP.render(); }
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.stb');
    if (!b) return;
    const inp = b.parentElement.querySelector('input');
    if (!inp) return;
    const step = (parseFloat(inp.step) || 0.1) * (e.shiftKey ? 5 : 1), dec = step < 1 ? 2 : 0;
    let v = (parseFloat(inp.value) || 0) + step * +b.dataset.st;
    if (inp.min !== '') v = Math.max(+inp.min, v);
    if (inp.max !== '') v = Math.min(+inp.max, v);
    inp.value = v.toFixed(inp.dataset.k === 'rot' ? 0 : dec);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });

  FP.Panel = {
    init() {
      el = document.getElementById('panel');
      el.addEventListener('change', onChange);
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur(); });
      ['selection', 'change', 'project', 'restore', 'mode'].forEach((ev) => FP.on(ev, () => { if (ev === 'change' && document.activeElement && el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return; render(); }));
      FP.on('live', refresh);
      FP.on('focusName', () => { const i = el.querySelector('[data-k="name"]'); if (i) { i.focus(); i.select(); } });
      render();
    },
    render,
  };
})();

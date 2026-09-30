/* main.js — arranque, autoguardado y atajos de teclado. */
(function () {
  'use strict';
  const FP = window.FP, st = FP.state;
  let saveT = 0, dirty = false;

  function stateLabel(t) { const el = document.getElementById('saveState'); if (el) el.textContent = t; }

  function save(manual) {
    if (!st.project) return;
    const ok = FP.Storage.save(st.project);
    dirty = false;
    stateLabel(ok ? 'Guardado' : 'No se pudo guardar');
    if (manual) FP.toast(ok ? 'Proyecto guardado' : 'No se pudo guardar (almacenamiento lleno)');
  }
  function scheduleSave() {
    dirty = true;
    stateLabel('Guardando…');
    clearTimeout(saveT);
    saveT = setTimeout(() => save(false), 900);
  }

  function typing(e) { return /INPUT|SELECT|TEXTAREA/.test((e.target.tagName || '')) || e.target.isContentEditable; }

  function onKey(e) {
    if (document.getElementById('start').classList.contains('open') || document.getElementById('projects').classList.contains('open')) {
      if (e.key === 'Escape' && st.project) FP.Dialogs.closeAll();
      return;
    }
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (e.key === 'Escape') {
      if (FP.View3D.isWalking()) { FP.View3D.stopWalk(); return; }
      if (typing(e)) { e.target.blur(); return; }
      FP.UI.closeFly();
      FP.Editor.cancel();
      return;
    }
    if (mod && k === 's') { e.preventDefault(); save(true); return; }
    if (typing(e)) return;
    if (e.code === 'Space' && FP.View3D.isWalking()) { e.preventDefault(); if (!e.repeat) FP.View3D.capture(); return; }
    if (e.code === 'Space') { e.preventDefault(); FP.Editor.setSpace(true); return; }
    if (mod && k === 'z') { e.preventDefault(); if (FP.Editor.isBusy()) return; e.shiftKey ? FP.history.redo() : FP.history.undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); FP.history.redo(); return; }
    if (st.mode === '3d') return;
    if (mod && k === 'c') { e.preventDefault(); FP.Actions.copy(); return; }
    if (mod && k === 'v') { e.preventDefault(); FP.Actions.paste(); return; }
    if (mod && k === 'd') { e.preventDefault(); FP.Actions.duplicate(); return; }
    if (mod && k === 'a') { e.preventDefault(); FP.Actions.selectAll(); return; }
    if (mod) return;
    if (FP.Editor.shapeKey(e)) { e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); FP.Actions.remove(); return; }
    if (e.code === 'BracketRight' || e.code === 'BracketLeft' || k === ']' || k === '[' || k === '}' || k === '{') { const up = e.code === 'BracketRight' || k === ']' || k === '}'; FP.Actions.layer(e.shiftKey ? (up ? 'front' : 'back') : up ? 'up' : 'down'); return; }
    if (k === 'f') { FP.Actions.mirror(); return; }
    if (k === 'r') { if (!FP.Editor.rotateGhost()) FP.Actions.rotate(e.shiftKey ? -1 : 1); return; }
    if (e.key.startsWith('Arrow') && st.sel.length) {
      e.preventDefault();
      const d = e.shiftKey ? 0.5 : 0.05;
      FP.Actions.nudge(e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0);
      return;
    }
    const map = { v: 'select', h: 'room', w: 'wall', d: 'door', n: 'window', m: 'furn', e: 'measure', b: 'base' };
    if (map[k]) document.querySelector(`#toolbar [data-tool="${map[k]}"]`).click();
  }

  document.addEventListener('DOMContentLoaded', () => {
    FP.Editor.init();
    FP.UI.init();
    FP.Panel.init();
    FP.Dialogs.init();
    FP.LevelBar.init();
    FP.Shots.init();

    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', (e) => { if (e.code === 'Space') FP.Editor.setSpace(false); });
    window.addEventListener('blur', () => FP.Editor.setSpace(false));
    window.addEventListener('beforeunload', () => { if (dirty) save(false); });

    document.getElementById('btnSave').addEventListener('click', () => save(true));
    document.getElementById('btnProjects').addEventListener('click', () => { if (dirty) save(false); FP.Dialogs.showProjects(); });
    document.getElementById('projName').addEventListener('input', scheduleSave);
    FP.on('namechange', scheduleSave);
    FP.on('change', () => { if (st.project) scheduleSave(); });
    FP.on('change', () => { if (st.mode === '3d') FP.View3D.rebuild(); });
    FP.on('project', () => { dirty = false; stateLabel(''); });

    FP.Dialogs.showStart();
  });
})();

/* storage.js — proyectos en LocalStorage. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util;
  const KEY = 'fp.projects.v1';

  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function writeAll(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
  }

  FP.Storage = {
    list() { return Object.values(readAll()).sort((a, b) => b.modified - a.modified); },
    get(id) { const p = readAll()[id]; return p ? U.clone(p) : null; },
    save(project) {
      const all = readAll();
      all[project.id] = U.clone(project);
      return writeAll(all);
    },
    remove(id) { const all = readAll(); delete all[id]; writeAll(all); },
    duplicate(id) {
      const p = FP.Storage.get(id);
      if (!p) return null;
      p.id = U.uid();
      p.name += ' (copia)';
      p.created = p.modified = Date.now();
      FP.Storage.save(p);
      return p;
    },
  };
})();

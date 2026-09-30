/* shots.js — capturas de pantalla del recorrido 3D (barra espaciadora): se guardan en una bandeja y se descargan en JPG. */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util;
  const list = [];
  let tray, row, flash;

  const fname = (i) => `${(FP.state.project.name || 'plano').replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, '').trim().replace(/\s+/g, '-') || 'plano'}-captura-${String(i + 1).padStart(2, '0')}.jpg`;
  const save = (url, name) => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };

  /** Aplica el mismo "look" de la vista (saturación, contraste y viñeta) para que la captura se vea como en pantalla. */
  function finish(url) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d');
        try { g.filter = 'saturate(0.9) contrast(1.03)'; } catch (e) { /* sin filtro */ }
        g.drawImage(img, 0, 0);
        g.filter = 'none';
        const rg = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75);
        rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.28)');
        g.fillStyle = rg; g.fillRect(0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.93));
      };
      img.onerror = () => res(url);
      img.src = url;
    });
  }

  function render() {
    tray.classList.toggle('has', list.length > 0);
    tray.querySelector('#shotsN').textContent = list.length + (list.length === 1 ? ' captura' : ' capturas');
    row.innerHTML = list.map((s, i) => `<div class="thumb-s" data-i="${i}"><img src="${s.url}" alt="Captura ${i + 1}"><span class="acts"><button data-a="dl" title="Descargar">↓</button><button data-a="del" title="Quitar">×</button></span></div>`).join('');
    row.scrollLeft = row.scrollWidth;
  }

  function lightbox(i) {
    const s = list[i];
    if (!s) return;
    const d = document.createElement('div');
    d.className = 'lightbox';
    d.innerHTML = `<img src="${s.url}" alt=""><div class="lb-bar"><button class="primary" data-a="dl">Descargar</button><button class="pbtn" data-a="close">Cerrar</button></div>`;
    d.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]');
      if (a && a.dataset.a === 'dl') { save(s.url, fname(i)); return; }
      if (a || e.target === d) d.remove();
    });
    document.body.appendChild(d);
  }

  FP.Shots = {
    init() {
      tray = document.getElementById('shots');
      row = tray.querySelector('.shots-row');
      flash = document.getElementById('flash');
      tray.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'), t = e.target.closest('.thumb-s');
        if (a && !t) {
          if (a.dataset.a === 'all') list.forEach((s, i) => setTimeout(() => save(s.url, fname(i)), i * 300));
          else if (a.dataset.a === 'clear') { list.length = 0; render(); }
          return;
        }
        if (!t) return;
        const i = +t.dataset.i;
        if (a && a.dataset.a === 'dl') save(list[i].url, fname(i));
        else if (a && a.dataset.a === 'del') { list.splice(i, 1); render(); }
        else lightbox(i);
      });
      FP.on('shot', async (url) => {
        flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
        list.push({ url: await finish(url), t: Date.now() });
        render();
        FP.toast('Captura ' + list.length + ' guardada · la encuentras abajo a la derecha');
      });
      FP.on('project', () => { list.length = 0; render(); });
      render();
    },
    count: () => list.length,
  };
})();

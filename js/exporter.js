/* exporter.js — PNG, SVG y PDF del plano (sin interfaz). */
(function () {
  'use strict';
  const FP = window.FP, U = FP.util, n = U.n;
  const M = 1.2; // margen alrededor del plano (m) para cotas

  function safeName(p) { return (p.name || 'plano').replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, '').trim().replace(/\s+/g, '-') || 'plano'; }

  function download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  const Ex = (FP.Exporter = {
    /** SVG autónomo. pxPerM = resolución de salida. */
    svgString(project, o = {}) {
      const mode = o.mode || (FP.state.mode === 'pres' ? 'pres' : 'plan'), ppm = o.pxPerM || 100;
      const bd = FP.Walls.bounds(project), vw = bd.w + M * 2, vh = bd.h + M * 2, px = 1 / ppm, x0 = bd.x0 - M, y0 = bd.y0 - M;
      const inner = FP.Render.scene(project, { mode, px, showDims: o.showDims !== false, showGrid: false });
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(vw * ppm)}" height="${Math.round(vh * ppm)}" viewBox="${n(x0)} ${n(y0)} ${n(vw)} ${n(vh)}"><rect x="${n(x0)}" y="${n(y0)}" width="${n(vw)}" height="${n(vh)}" fill="#fff"/>${inner}</svg>`;
    },
    thumbURI(project) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Ex.svgString(project, { mode: 'plan', pxPerM: 30, showDims: false }));
    },
    canvas(project, o = {}) {
      const maxPx = 4096, bd = FP.Walls.bounds(project), W = bd.w + M * 2, H = bd.h + M * 2;
      const ppm = Math.min(o.pxPerM || 120, maxPx / Math.max(W, H));
      const svg = Ex.svgString(project, Object.assign({}, o, { pxPerM: ppm }));
      return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = Math.round(W * ppm); c.height = Math.round(H * ppm);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          res(c);
        };
        img.onerror = () => rej(new Error('No se pudo generar la imagen'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    },
    async png(project) {
      const c = await Ex.canvas(project, { pxPerM: 140 });
      return new Promise((res) => c.toBlob((b) => { download(b, safeName(project) + '.png'); res(); }, 'image/png'));
    },
    svg(project) {
      download(new Blob([Ex.svgString(project, { pxPerM: 100 })], { type: 'image/svg+xml' }), safeName(project) + '.svg');
    },

    /** Lámina A4 horizontal: nombre, superficie, plano, escala y fecha. */
    async pdf(project) {
      const now = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const area = (project.space.w * project.space.h).toFixed(1);
      // escala estándar en la que cabe el dibujo
      const PW = 297, PH = 210, mar = 10, band = 26;
      const AW = PW - mar * 2, AH = PH - mar * 2 - band;
      const bd = FP.Walls.bounds(project), dw = bd.w + M * 2, dh = bd.h + M * 2;
      const need = 1000 / Math.min(AW / dw, AH / dh);
      const scale = [20, 25, 50, 75, 100, 125, 150, 200, 250, 500].find((s) => s >= need) || Math.ceil(need);
      const mmPerM = 1000 / scale, iw = dw * mmPerM, ih = dh * mmPerM;
      let canvas;
      try { canvas = await Ex.canvas(project, { pxPerM: 150 }); } catch (e) { FP.toast('No se pudo generar el PDF'); return; }
      const dataURL = canvas.toDataURL('image/png');
      try {
        if (!window.jspdf) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setDrawColor(200); doc.setLineWidth(0.2); doc.rect(mar, mar, PW - mar * 2, PH - mar * 2);
        doc.addImage(dataURL, 'PNG', mar + (AW - iw) / 2, mar + (AH - ih) / 2, iw, ih);
        const by = PH - mar - band;
        doc.line(mar, by, PW - mar, by);
        doc.setTextColor(29); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        doc.text(project.name, mar + 6, by + 11);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110);
        doc.text(`Plano arquitectónico · ${project.space.w.toFixed(2)} × ${project.space.h.toFixed(2)} m`, mar + 6, by + 18);
        const cols = [['SUPERFICIE', area + ' m²'], ['ESCALA', '1:' + scale], ['FECHA', now]];
        let x = PW - mar - 6;
        cols.slice().reverse().forEach(([k, v]) => {
          doc.setFontSize(7); doc.setTextColor(140); doc.setFont('helvetica', 'normal');
          const wv = Math.max(doc.getTextWidth(k), (doc.setFontSize(11), doc.getTextWidth(v)));
          doc.setFontSize(7); doc.text(k, x - wv, by + 9);
          doc.setFontSize(11); doc.setTextColor(29); doc.setFont('helvetica', 'bold'); doc.text(v, x - wv, by + 16);
          x -= wv + 14;
        });
        doc.save(safeName(project) + '.pdf');
      } catch (e) {
        Ex.printFallback(project, dataURL, area, scale, now);
      }
    },

    /** Sin internet (jsPDF no carga): abre una lámina lista para "Guardar como PDF" desde el diálogo de impresión. */
    printFallback(project, dataURL, area, scale, now) {
      const w = window.open('', '_blank');
      if (!w) { FP.toast('Permite ventanas emergentes para exportar el PDF'); return; }
      w.document.write(`<!doctype html><title>${U.esc(project.name)}</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:-apple-system,Helvetica,Arial,sans-serif;margin:0;color:#1d1d1f}
      .sheet{border:1px solid #ccc;height:188mm;display:flex;flex-direction:column}.plan{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}.plan img{max-width:100%;max-height:100%}
      .band{border-top:1px solid #ccc;padding:5mm 6mm;display:flex;justify-content:space-between;align-items:flex-end}.band h1{font-size:18px;margin:0}.band small{color:#777}.k{font-size:8px;color:#999}.v{font-size:12px;font-weight:700}.m{display:flex;gap:14mm}</style>
      <div class="sheet"><div class="plan"><img src="${dataURL}"></div><div class="band"><div><h1>${U.esc(project.name)}</h1><small>Plano arquitectónico · ${project.space.w.toFixed(2)} × ${project.space.h.toFixed(2)} m</small></div>
      <div class="m"><div><div class="k">SUPERFICIE</div><div class="v">${area} m²</div></div><div><div class="k">ESCALA</div><div class="v">1:${scale}</div></div><div><div class="k">FECHA</div><div class="v">${now}</div></div></div></div></div>
      <script>setTimeout(()=>print(),400)<\/script>`);
      w.document.close();
    },
  });
})();

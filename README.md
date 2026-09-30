# Simple Floor Plan Designer

Editor de planos de casas y departamentos. HTML + CSS + JavaScript puro (SVG para el editor 2D, Three.js para la vista 3D). Sin build ni instalación.

## Cómo ejecutarlo

Abre `index.html` en el navegador (doble clic). Si prefieres un servidor local:

```bash
cd floorplan-designer && python3 -m http.server 8000   # http://localhost:8000
```

Internet solo hace falta para: la tipografía Inter (opcional), la vista **3D** (Three.js) y el **PDF** (jsPDF). Se cargan bajo demanda desde CDN; sin conexión el PDF cae a una lámina lista para imprimir/guardar como PDF.

## Uso rápido

1. Elige Departamento o Casa, define ancho y largo → **Crear plano** (o **Ver un ejemplo**).
2. **Habitación** → elige el tipo → clic para colocarla, o arrastra para dibujarla del tamaño que quieras. Arrastra las esquinas para redimensionar, o escribe las medidas en el panel derecho.
3. **Puerta / Ventana** → elige el tipo → acércala a una pared (el lado donde esté el cursor es hacia donde abre).
4. **Muebles** → categoría o buscador → clic para colocar (`R` gira, `Shift` coloca varios).
5. **Medir** → dos clics. **Guardar** (`Ctrl/Cmd+S`), **Exportar** → PNG / SVG / PDF.

## Extras
- **Aleatorio** (barra superior o pantalla inicial): genera un departamento o casa con distribución realista, ventanas, puertas, muebles, pisos y arte. Se puede deshacer.
- **3D → Recorrer la casa**: caminas en primera persona (WASD + mouse) con minimapa y colisiones.
- **Pisos**: por habitación (panel de la habitación, o lista «Pisos» en la vista 3D).
- **Arte**: Muebles → Arte. Se pega solo a la pared; cambia marco, altura y obra en el panel.
- **Puertas**: 8 diseños (madera, listones, paneles, shaker, lisa pintada con color, negra, vidrio y aluminio, vidrio con retícula), 4 manijas y tipos sencilla / doble / corrediza / granero / paso libre.
- **Paredes**: por habitación, 10 texturas (pintura, estuco, ladrillo, piedra, madera, concreto, azulejo, papel tapiz, rayas, mármol) y color libre, desde el panel de la habitación o la vista 3D.
- **Catálogo**: más de 90 elementos, incluidas 10 plantas, exterior, oficina, cortinas y repisas.

## Atajos

| Tecla | Acción |
|---|---|
| `V` `H` `W` `D` `N` `M` `E` | Seleccionar · Habitación · Pared · Puerta · Ventana · Muebles · Medir |
| `Supr` / `⌫` | Eliminar |
| `Ctrl/Cmd+Z`, `+Shift+Z` | Deshacer / rehacer |
| `Ctrl/Cmd+S` | Guardar |
| `Ctrl/Cmd+C` `V` `D` `A` | Copiar · pegar · duplicar · seleccionar todo |
| `R` (`Shift+R`) | Rotar mueble / habitación 90°, o cambiar el lado de una puerta |
| `Esc` | Cancelar herramienta / selección |
| `Espacio` + arrastrar | Mover el lienzo (también clic central o derecho) |
| Rueda | Zoom (pellizco en tablet) |
| Flechas (`Shift` = 50 cm) | Mover lo seleccionado 5 cm |
| `Alt` mientras arrastras | Desactiva el imán temporalmente |

## Arquitectura

Todo el modelo trabaja en **metros**; el canvas solo aplica una escala (`state.view.s` px/m).

```
js/core.js       namespace FP, estado, bus de eventos, historial undo/redo, geometría común
js/furniture.js  catálogo (medidas reales) + dibujo en vista superior + partes 3D
js/rooms.js      tipos de habitación
js/walls.js      segmentos de pared (exterior, bordes de habitaciones, paredes libres)
js/openings.js   puertas y ventanas (simbología arquitectónica)
js/measure.js    cotas
js/snap.js       imán inteligente: paredes, objetos, cuadrícula, guías
js/render.js     proyecto → SVG (función pura; la usan editor, exportación y miniaturas)
js/storage.js    proyectos en LocalStorage (clave fp.projects.v1)
js/exporter.js   PNG / SVG / PDF
js/view3d.js     Three.js (carga diferida)
js/actions.js    borrar, duplicar, copiar/pegar, rotar, mover con flechas
js/editor.js     interacción del canvas: zoom/pan, selección, arrastre, handles, herramientas
js/ui.js         iconos, barra de herramientas, menús flotantes, barra superior
js/panel.js      panel derecho (Mi plano / propiedades)
js/dialogs.js    pantalla inicial, Mis proyectos, proyecto de ejemplo
js/main.js       arranque, autoguardado, atajos
```

Para añadir un mueble: agrega una entrada en `ITEMS` y en `CATS` de `js/furniture.js` (medidas + función `draw`).

## Varios niveles y formas propias

- **Niveles**: la barra sobre el lienzo (`+ Nivel`) agrega plantas vacías (con la forma de abajo) o duplica la actual. Doble clic en un nivel para renombrarlo. El nivel de abajo se ve tenue como guía.
- **Escaleras** (categoría *Escaleras*): recta, en L y de caracol. Suben al nivel de arriba y le abren el hueco al piso, con barandal.
- **3D**: muestra todos los niveles apilados; "Hasta este nivel" deja ver por dentro. En el recorrido, `Re Pág` / `Av Pág` (o los botones) suben y bajan de nivel.
- **Forma de la casa**: herramienta *Base → Dibujar la forma con líneas* (o "Dibujar mi forma" en la pantalla inicial). Las líneas salen rectas (ángulos de 90°), así que sirve para L, U, T, escalonadas, etc.

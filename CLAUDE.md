# FotoCabina — reglas para cualquier agente de IA que trabaje en este repo

Todo el proyecto vive en `src/`. Nada se crea fuera de esa carpeta (salvo este archivo y `AGENTS.md`).

## 1. Leer antes de tocar código, en este orden

1. `src/PRODUCT.md` — quién usa la app, para qué, qué no se puede inventar.
2. `src/DESIGN.md` — sistema de diseño **obligatorio**. Referencia viva: `src/pages/00-design-system/index.html`.
3. `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` — decisiones de producto, hardware y arquitectura, y el plan por fases. Su encabezado dice qué documento manda sobre qué.
4. `src/docs/MAPA_DE_PANTALLAS.md` — inventario de pantallas y estado de cada una.
5. El `README.md` de la pantalla que vas a tocar (`src/pages/NN-nombre/README.md`).

## 2. Qué documento se actualiza, y cuándo

| Si pasó esto… | …actualizá esto, en el mismo commit |
| --- | --- |
| Cambiaste cómo funciona una pantalla | `src/pages/NN-nombre/README.md` |
| Una pantalla pasó de "falta" a "en curso" o "hecha", o apareció una pendiente | `src/docs/MAPA_DE_PANTALLAS.md` (la fila de esa pantalla) |
| Se tomó una decisión de producto, hardware o arquitectura, o cambió el rumbo de una fase | `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` (sección que corresponda + "Última revisión") |
| Agregaste una pantalla nueva | fila en `src/README.md` y en el mapa |
| Cambio al sistema de diseño o al producto | **Solo con acuerdo explícito del dueño del proyecto.** No se toca `DESIGN.md` ni `PRODUCT.md` por iniciativa propia. |

Un commit que cambia comportamiento y no trae su documentación está incompleto. No dejes "después lo documento".

## 3. Checklist de cierre de cada tarea

Antes de dar una tarea por terminada:

- [ ] Se probó en el navegador (captura o prueba real), sin errores en consola.
- [ ] Sin emojis en la interfaz; solo íconos monocromáticos SVG. Un solo botón verde lima por pantalla.
- [ ] README de la pantalla al día.
- [ ] Fila del mapa de pantallas al día.
- [ ] Si hubo decisión de producto: anotada en `DSLRBOOTH_PRODUCT_CONTEXT.md`.
- [ ] Commit solo con los archivos que tocó **esta** tarea, mensaje en español, y push a `main`.

## 4. Trabajo en paralelo con otros agentes

- Cada agente toca **solo** los archivos de su pantalla y las filas/secciones de documentación que le corresponden. No modificar, reordenar ni "limpiar" carpetas ajenas.
- Si ves cambios sin commitear que no son tuyos, no los toques ni los comentes: son de otro agente en curso. Commiteá únicamente tus archivos, por ruta explícita (`git add ruta/…`), nunca `git add .` ni `git add -A`.
- Los documentos compartidos (`MAPA_DE_PANTALLAS.md`, `src/README.md`, `DSLRBOOTH_PRODUCT_CONTEXT.md`) se editan en la sección propia y se commitean solo si no arrastran cambios ajenos; si los arrastran, avisale al dueño del proyecto en el mensaje de cierre.

## 5. Convenciones técnicas

- Páginas estáticas: `index.html` + `styles.css` + `app.js` por carpeta, sin dependencias ni CDNs.
- Antes de crear un componente, buscarlo en `00-design-system` o `01-camera-flow` (clases `ds-*`).
- Textos de interfaz, nombres de archivos, clases y commits en español.
- Páginas de prueba, capturas y servidores locales viven fuera del repo (carpeta temporal); nunca se commitean.
- Carpetas de referencia local (`pantallas dslrbooth/`, `ui inspo/`) y el archivo de memoria personal están en `.gitignore`: el repo es público.

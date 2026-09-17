# 03 · Editor de plantillas

Editor de plantillas rehecho desde cero como producto propio (reemplaza a `02-layout-editor`, que queda intacto como referencia). Plan completo, decisiones y estado por fase en [`docs/PLAN_EDITOR_PLANTILLAS.md`](../../docs/PLAN_EDITOR_PLANTILLAS.md) — leerlo antes de tocar este código.

## Qué hace

- **Galería de plantillas** (pantalla de inicio): mis plantillas guardadas con miniatura real, 15 plantillas base (tiras, postales, apaisadas), duplicar, renombrar, eliminar, importar/exportar archivo `.fotocabina.json`.
- **Lienzo en milímetros** con reglas, zoom, guías inteligentes (centro, bordes, espaciado igual, medición con Alt, guías propias), selección múltiple, capas, alinear/distribuir.
- **Elementos**: espacio de foto numerado, texto (con tipografía completa y fuentes propias .ttf/.otf/.woff), forma, imagen, dato del evento (fecha, hora, n.º de sesión, nombre).
- **Imágenes**: arrastrar y soltar, "Al lienzo", "Al área segura + fondo automático", y "Detectar espacios de foto" (para traer un diseño hecho en Canva con rectángulos o agujeros donde van las fotos).
- **Impresión**: motor de render propio a 300 ppp, vista de hoja 4×6 con línea de corte, imprimir copia de prueba, guía PNG para diseñar en Canva al tamaño exacto.
- Modo oscuro y claro (switch en la barra superior).

El QR de entrega digital **no** es un elemento de esta pantalla: vive en la pantalla de resultado de la cabina (`01-camera-flow`, A8 del mapa de pantallas).

## Estructura

Un archivo por responsabilidad (ver el detalle y el porqué de esta convención en `PLAN_EDITOR_PLANTILLAS.md` sección 3): `estado.js` (modelo de datos y persistencia), `lienzo.js` (dibujo y manipulación directa), `guias.js` (guías inteligentes), `imagenes.js`, `tipografia.js`, `inspector.js`, `paneles.js`, `galeria.js`, `render.js` (motor de impresión), `paquete.js` (exportar/importar), `iconos.js`, `app.js` (arranque y atajos).

Guarda su estado en `localStorage` (clave `fotocabina-editor-v1`). Sin dependencias externas ni CDNs.

## Pendiente

Todo lo planificado (Fases 1–4) está construido. Lo que sigue depende de uso real: conectar con la cabina, y decidir cuándo retirar `02-layout-editor`.

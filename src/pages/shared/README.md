# shared

Módulos JavaScript sin llamadas de red, compartidos entre varias páginas del panel de operador. Cada archivo se referencia con `<script src="../shared/archivo.js">` desde la página que lo usa; no depende de ninguna otra página.

## Archivos

- **`almacen-eventos.js`** — eventos del operador en `localStorage` (sin backend todavía): listar, obtener, guardar, eliminar, y quién es "el evento activo" ahora mismo. Lo usan hoy `04-lista-eventos` (dueña de la lista) y `01-camera-flow` (lee el evento activo al abrir). Interfaz pensada para no cambiar cuando llegue una capa de datos real (Fase E, `docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §5.1.1): ese día este archivo es el único punto a reemplazar.

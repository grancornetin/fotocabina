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

Un archivo por responsabilidad (ver el detalle y el porqué de esta convención en `PLAN_EDITOR_PLANTILLAS.md` sección 3): `estado.js` (modelo de datos y persistencia), `lienzo.js` (dibujo y manipulación directa), `guias.js` (guías inteligentes), `imagenes.js`, `tipografia.js`, `inspector.js`, `paneles.js`, `galeria.js`, `render.js` (puente al motor de impresión, que ahora es compartido), `paquete.js` (exportar/importar), `iconos.js`, `app.js` (arranque y atajos).

Guarda su estado en `localStorage` (clave `fotocabina-editor-v1`). Sin dependencias externas ni CDNs.

**El motor de dibujo es compartido (hito 0.2):** vive en `../shared/motor-plantillas.js` (`MotorPlantillas`) y recibe la plantilla como dato; el editor lo carga antes que `estado.js` en `index.html`. `render.js` quedó en dos líneas (`const EditorRender = MotorPlantillas;`) para no tocar `paquete.js` ni `galeria.js`. `EditorEstado.textoDeDato` y `PT_A_MM` delegan en el motor, y el registro de fuentes incrustadas (`tipografia.js` → `registrarFuentes`) usa `MotorPlantillas.cargarFuentes`. El editor se ve y se usa igual que antes. La cabina dibuja con el mismo motor, así editor y cabina producen exactamente la misma imagen. Cualquier cambio de cómo se dibuja una plantilla se hace en el motor, nunca aquí.

## Conectado a un evento (2026-09-21 / 2026-09-22)

Si la URL trae `?evento=<id>` (llegando desde "Editar plantilla" en `04-lista-eventos`, o "Cambiar"/"Plantillas" en `01-camera-flow`), el editor asocia la plantilla que el operador termine abriendo o creando en esa visita al evento del almacén compartido (`../shared/almacen-eventos.js`): si el evento ya tenía una plantilla real asignada, la abre directo en el lienzo (salta la galería); si no, deja elegir/crear una normalmente y la guarda sola. Para no pisar cambios de otras pestañas, el editor ya no guarda la copia del evento que leyó al abrirse: usa `AlmacenEventos.cambiarPlantilla(id, plantillaId)`, que lee el evento fresco y cambia solo la plantilla (hito 1.3). Toda la lógica vive en `iniciarConexionEvento()` dentro de `app.js`, suscrita al evento `plantilla-abierta` de `estado.js` — no se tocó `galeria.js` ni ningún otro flujo. Usado sin ese parámetro (como siempre), el editor no se ve afectado en nada.

**El logo es el botón "Inicio" (2026-09-22, `docs/FLUJO_NAVEGACION.md`):** tocarlo lleva siempre a `04-lista-eventos`, sin importar si el editor se abrió suelto, desde la lista o desde la cabina — mismo criterio que el logo de `01-camera-flow`. Antes era un `<div>` sin ningún link.

**Botón principal contextual, "Lanzar evento" (2026-09-22):** con un evento conectado, la barra superior ya no muestra solo "Exportar" — el botón principal cambia a **"Lanzar evento"** (mismo verde lima, mismo lugar): guarda la plantilla activa en el evento y vuelve directo a `01-camera-flow` con ese evento activo, en un solo gesto (`lanzarEvento()` en `app.js`). La flechita de al lado (ahora un botón propio, `#ed-exportar-flecha`) sigue abriendo el mismo menú de siempre — con "Lanzar evento" como primer ítem, separado por un rótulo **"O exportá tu imagen como:"** del resto (Imagen PNG / Hoja para imprimir / Guía para Canva / Archivo de plantilla / Importar, sin cambios), para que quede claro que son dos cosas distintas: una acción de flujo y opciones de exportación. Sin evento conectado (editor suelto), el botón principal sigue siendo "Exportar" y ni el ítem "Lanzar evento" ni el rótulo aparecen — hace exactamente lo de siempre. Resuelve el hueco real: antes de esto, entrar al editor desde un evento no tenía forma de "terminar" y volver a la cabina.

## Pendiente

Todo lo planificado (Fases 1–4) está construido. Falta que `01-camera-flow` lea el número de fotos por sesión de la plantilla real conectada (hoy sigue siendo un ajuste manual — ver README de `01-camera-flow`), y decidir cuándo retirar `02-layout-editor`.

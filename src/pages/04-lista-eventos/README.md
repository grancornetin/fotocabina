# 04 · Lista de eventos

Puerta de entrada del panel de operador (pantalla C1 del mapa de pantallas). Vista principal de eventos, organizados por estado.

## Qué hace

- **Navegación lateral** tipo torre de control (Eventos, Editor de plantillas, Cámara, Impresora, Ayuda), fija en desktop y colapsada a tabs inferiores en mobile/tablet (regla de Navigation de `DESIGN.md`). "Eventos" y "Editor de plantillas" están construidos. "Cámara" abre una hoja que explica dónde se configura (Ajustes › Cámara dentro de la cabina, por evento — C3 no es una pantalla aparte), sin el sello "Próximamente". Impresora y Ayuda sí abren "Próximamente" hasta que existan (C4, ayuda).
- **Tabs por estado:** Próximos / En curso / Archivados.
- **Card de evento:** miniatura, nombre, fecha, **nombre real de la plantilla asignada** (se lee de la plantilla; si el evento no tiene, dice "Sin plantilla asignada"; si la borraron, "Plantilla no encontrada"), **cantidad real de sesiones** y badge de estado (con glow lima si está "En curso"). El n.º de sesiones ya no es el número fijo de demostración: se cuenta de las sesiones guardadas en IndexedDB (armadas, y aparte "N incompletas" si las hay). Mientras se cuenta dice "Contando sesiones…" y, si no se pudo leer, "No se pudieron contar las sesiones": nunca muestra un número falso.
- **Acciones por card:**
  - **Editar plantilla** (ícono de lápiz) — abre `03-editor-plantillas` asociado a este evento (ver conexión abajo).
  - **Lanzar** — marca el evento como activo (ver conexión abajo) y abre `01-camera-flow`.
  - **Duplicar** — clona el evento **completo** (nombre + " (copia)", plantilla, modo de entrega, copias, impresión automática, ritmo y cámara) como uno nuevo en "Próximos", con id nuevo y sin lo que pertenece a un lanzamiento (`congelado`). Antes (hallazgo 7) la copia perdía la entrega y las copias.
  - **Archivar / Eliminar** — el ícono cambia según el estado: en Próximos/En curso archiva (con confirmación, reversible); en Archivados elimina (con confirmación, irreversible). **Eliminar borra de verdad** (hito 0.1b): primero borra todas las sesiones del evento y sus archivos (fotos, tira, hoja, GIF) de IndexedDB en una sola operación y recién entonces el evento; si el borrado de sesiones falla, el evento no se elimina y se avisa. El diálogo dice cuántas sesiones se borran ("Se borran «X» y sus 12 sesiones guardadas, con todas sus fotos"). También se limpian las copias congeladas de plantilla que ya nadie usa y el contador de sesiones del evento.
- **Crear evento** (2026-09-22) — abre `05-crear-evento` (C2 del mapa): nombre, fecha, copias, plantilla asignada y modo de entrega. Guardar vuelve acá con el evento ya visible en "Próximos".
- Modo oscuro/claro con el mismo criterio que `00-design-system` (elige el sistema operativo por defecto, o el switch de la barra lateral).

## Conectada a `01-camera-flow` y `03-editor-plantillas` (2026-09-17 / 2026-09-21 / 2026-09-22)

Los eventos ya no son datos de prueba en memoria: viven en el almacén compartido `../shared/almacen-eventos.js` (localStorage, **formato v2** desde el hito 0.1b: estados `proximo` / `en-curso` / `archivado`, `entrega`, `plantillas`, `ritmo`, `preferenciasDeEquipo`; ver `../shared/README.md`). Los eventos guardados con el formato anterior se migran solos la primera vez que se abre cualquier pantalla (con copia de respaldo de la clave vieja). Los de demostración no tienen plantilla real: muestran "Sin plantilla asignada" y, al lanzarlos, la cabina bloquea "Lanzar evento" con un aviso y el botón "Abrir el editor" hasta asignarles una (decisión 1A). "Lanzar" guarda el evento elegido como "evento activo" en ese almacén antes de navegar a `01-camera-flow`, que lo lee al abrir y carga su nombre, plantilla y ajustes. "Editar plantilla" (en cada card) abre `03-editor-plantillas?evento=<id>`: si el evento ya tiene una plantilla real asignada la abre directo, si no deja elegir/crear una y la asocia sola.

**"Editor de plantillas" del menú lateral (2026-09-22):** antes decía "Plantillas" y abría la hoja "Próximamente" aunque el editor ya existía y funcionaba — se conecta ahora, abriendo `03-editor-plantillas` suelto (sin evento asociado), igual que abrirlo directo. Es la vía para revisar o crear plantillas sin atarlas todavía a un evento puntual; para editar la plantilla de un evento específico se sigue usando "Editar plantilla" en su card.

## Conteo y nombres derivados (hito 0.1b)

Esta pantalla carga `../shared/almacen-plantillas.js` (nombres de plantilla) y `../01-camera-flow/almacen-sesiones.js` (conteo y borrado de sesiones). La tarjeta se dibuja al instante y esos dos datos se completan en cuanto llegan. Hallazgo: `almacen-sesiones.js` debería vivir en `shared/` (ver `../shared/README.md`).

## Pendiente

- **Miniatura real:** hoy todas las cards muestran el mismo ícono de cámara placeholder; falta traer la miniatura real de la plantilla o de una foto reciente del evento.
- El acceso de Impresora de la navegación abre "Próximamente" hasta que exista C4 (o se decida que también vive dentro de la cabina, como cámara).

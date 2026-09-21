# 04 · Lista de eventos

Puerta de entrada del panel de operador (pantalla C1 del mapa de pantallas). Vista principal de eventos, organizados por estado.

## Qué hace

- **Navegación lateral** tipo torre de control (Eventos, Plantillas, Cámara, Impresora, Ayuda), fija en desktop y colapsada a tabs inferiores en mobile/tablet (regla de Navigation de `DESIGN.md`). Solo "Eventos" está construido; el resto abre una hoja "Próximamente".
- **Tabs por estado:** Próximos / En curso / Archivados.
- **Card de evento:** miniatura, nombre, fecha, plantilla asignada, cantidad de sesiones y badge de estado (con glow lima si está "En curso").
- **Acciones por card:**
  - **Editar plantilla** (ícono de lápiz) — abre `03-editor-plantillas` asociado a este evento (ver conexión abajo).
  - **Lanzar** — marca el evento como activo (ver conexión abajo) y abre `01-camera-flow`.
  - **Duplicar** — clona el evento completo (nombre + " (copia)", plantilla asignada y todos sus ajustes de sesión) como uno nuevo en "Próximos".
  - **Archivar / Eliminar** — el ícono cambia según el estado: en Próximos/En curso archiva (con confirmación, reversible); en Archivados elimina (con confirmación, irreversible).
- **Crear evento** — todavía no existe la pantalla de configuración (C2 del mapa); abre una hoja "Próximamente".
- Modo oscuro/claro con el mismo criterio que `00-design-system` (elige el sistema operativo por defecto, o el switch de la barra lateral).

## Conectada a `01-camera-flow` y `03-editor-plantillas` (2026-09-17 / 2026-09-21)

Los eventos ya no son datos de prueba en memoria: viven en el almacén compartido `../shared/almacen-eventos.js` (localStorage), con toda su config (`plantillaId` real del editor, ajustes de fotos/cuenta/pausa/mensaje/PIN/volver/espejo). "Lanzar" guarda el evento elegido como "evento activo" en ese almacén antes de navegar a `01-camera-flow`, que lo lee al abrir y carga su nombre, plantilla y ajustes. "Editar plantilla" abre `03-editor-plantillas?evento=<id>`: si el evento ya tiene una plantilla real asignada la abre directo, si no deja elegir/crear una y la asocia sola. Ver el README de cada página para el detalle de qué pasa de su lado.

## Pendiente

- **C2 (crear/configurar evento):** hoy "Crear evento" no hace nada real.
- **Miniatura real:** hoy todas las cards muestran el mismo ícono de cámara placeholder; falta traer la miniatura real de la plantilla o de una foto reciente del evento.
- Los accesos de Plantillas, Cámara e Impresora de la navegación abren "Próximamente" hasta que existan esas pantallas (B3, C3, C4 del mapa).

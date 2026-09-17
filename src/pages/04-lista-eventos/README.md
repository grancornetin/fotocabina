# 04 · Lista de eventos

Puerta de entrada del panel de operador (pantalla C1 del mapa de pantallas). Vista principal de eventos, organizados por estado.

## Qué hace

- **Navegación lateral** tipo torre de control (Eventos, Plantillas, Cámara, Impresora, Ayuda), fija en desktop y colapsada a tabs inferiores en mobile/tablet (regla de Navigation de `DESIGN.md`). Solo "Eventos" está construido; el resto abre una hoja "Próximamente".
- **Tabs por estado:** Próximos / En curso / Archivados.
- **Card de evento:** miniatura, nombre, fecha, plantilla asignada, cantidad de sesiones y badge de estado (con glow lima si está "En curso").
- **Acciones por card:**
  - **Lanzar** — marca el evento como activo (ver conexión abajo) y abre `01-camera-flow`.
  - **Duplicar** — clona el evento completo (nombre + " (copia)", plantilla asignada y todos sus ajustes de sesión) como uno nuevo en "Próximos".
  - **Archivar / Eliminar** — el ícono cambia según el estado: en Próximos/En curso archiva (con confirmación, reversible); en Archivados elimina (con confirmación, irreversible).
- **Crear evento** — todavía no existe la pantalla de configuración (C2 del mapa); abre una hoja "Próximamente".
- Modo oscuro/claro con el mismo criterio que `00-design-system` (elige el sistema operativo por defecto, o el switch de la barra lateral).

## Conectada a `01-camera-flow` (2026-09-17)

Los eventos ya no son datos de prueba en memoria: viven en el almacén compartido `../shared/almacen-eventos.js` (localStorage), con toda su config (plantilla asignada, ajustes de fotos/cuenta/pausa/mensaje/PIN/volver/espejo). "Lanzar" guarda el evento elegido como "evento activo" en ese almacén antes de navegar a `01-camera-flow`, que lo lee al abrir y carga su nombre, plantilla y ajustes. Ver el README de `01-camera-flow` para el detalle de qué pasa del lado de la cabina.

## Pendiente

- **C2 (crear/configurar evento):** hoy "Crear evento" no hace nada real.
- **Plantilla real del editor:** el campo `plantilla` de cada evento es todavía un nombre de texto suelto, no una referencia a una plantilla guardada de verdad en `03-editor-plantillas`. En curso — ver `docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §3.9.
- **Miniatura real:** hoy todas las cards muestran el mismo ícono de cámara placeholder; falta traer la miniatura real de la plantilla o de una foto reciente del evento.
- Los accesos de Plantillas, Cámara e Impresora de la navegación abren "Próximamente" hasta que existan esas pantallas (B3, C3, C4 del mapa).

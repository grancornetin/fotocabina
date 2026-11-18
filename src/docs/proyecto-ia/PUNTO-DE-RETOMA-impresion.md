# Punto de retoma: hito 3, impresión con impresora simulada

> Agente: Frontend Developer. Tarea: hito 3 (`ARQUITECTURA_FLUJO.md` §7.2 y §7.10). Sin commit ni push (lo hace el orquestador tras certificar).

## Estado: CP1 y CP2 CONSTRUIDOS y verificados por quien los escribió; falta certificación independiente

**Archivos tocados (todos sin commitear):**
- Nuevo: `src/pages/shared/impresion.js` (adaptador, impresora simulada, cola persistente, conteo, tope).
- `src/pages/shared/tests-validador.html` (bloque nuevo al final: 42 casos de impresión; 146 en total, sin regresión).
- `src/pages/01-camera-flow/index.html`, `app.js`, `styles.css` (A7, A9, A10 variante impresora, aviso de tope, copias adicionales, reimpresión, semáforo real, panel C4).
- Documentación: `01-camera-flow/README.md`, `shared/README.md`, `docs/MAPA_DE_PANTALLAS.md`, `docs/FLUJO_NAVEGACION.md`, `docs/ARQUITECTURA_FLUJO.md` (§7.2 fila 3, §7.10 nueva, notas en 2.3 y 7.7).
- No se tocó `04-lista-eventos`, `05-crear-evento`, `DESIGN.md` ni `PRODUCT.md`.

## Verificación hecha
- `tests-validador.html` en Chrome: 146 de 146.
- Chrome real (arneses fuera del repo en `C:/tmp/h3/`): `t1-nucleo.js` (42 puntos), `t2-panel.js` (36), `t3-pantallas.js` (46: 390 y 1366 px, sin desborde, un solo lima), `t4-demo.js` (demostración sin evento), y regresión del hito 1.3 (`C:/tmp/h13/t1-ciclo.js` 44/44, `t2-extras.js` 11/11). Consola limpia.

## Pendiente (no simulado como hecho)
- Adaptador de impresora real, impresión silenciosa (app de escritorio), C5, C6, C7.
- La cola y los conteos no entran al respaldo (`06-respaldo`).
- El texto de la hoja "Próximamente" de Impresora en el menú lateral de `04-lista-eventos` (app.js, línea ~700) dice que C4 no está construida: ahora es falso (C4 vive en la cabina). Lo debe corregir el dueño de esa pantalla.
- Certificación independiente y prueba manual del dueño.

## Cómo probar
Servidor estático desde `src/` (`python -m http.server 8321`). Pruebas automáticas: `http://localhost:8321/pages/shared/tests-validador.html`. Con la cabina: Ajustes › Impresora tiene el bloque "Simulación" para forzar estados.

## Cómo retomar
"Lee este archivo y continúa donde quedó."

## Ronda de correcciones tras certificación (2026-11-18): HECHA
Corregidos los bloqueantes (huérfano "imprimiendo" tras recarga rápida; tope vigente en reintentar, reintentar todos y trasladar), los importantes (latido del arriendo, reclamo condicional, error de guardado y registro dañado, aviso al descartar un retenido) y los menores (línea propia de hojas, texto "enviada", A10 sin repetir, copias sin valor ignorado, texto de la hoja de Impresora en `04-lista-eventos`). Pruebas: 146 de 146; recorridos reales repetidos sin fallos; arneses de recarga `C:/tmp/certH3/c4.mjs` y `c4c.mjs` pasan. Reserva: mensajes de estado duplicados entre validador e impresión.

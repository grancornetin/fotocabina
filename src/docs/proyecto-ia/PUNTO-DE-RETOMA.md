# Punto de retoma: orquestador, hitos 0.2 y 1.1

**Estado:** HECHO (0.2 en ad14c88; 1.1 commiteado al cerrar). **Actualizado:** 2026-11-16
- 0.1a ya estaba commiteado (fb6c020).
- Plan: 0.2 (motor compartido `shared/motor-plantillas.js` + lector `shared/almacen-plantillas.js`, el editor pasa a usarlo) -> revisión + prueba del editor -> commit 0.2. Luego 1.1 (cabina con plantilla real) -> revisión -> Evidence Collector -> Reality Checker -> docs -> commit 1.1.
- Hecho hasta ahora: lectura de documentos y diseño del encargo; reservas en TABLERO.md.
- Siguiente: ver TABLERO.md (filas 4 y 5) y `git status` para saber qué quedó escrito.

## Frontend 0.2 (motor de plantillas compartido)

**Estado:** TERMINADO y probado; sin commit (lo hace el orquestador).
- Creados: `pages/shared/motor-plantillas.js` (MotorPlantillas), `pages/shared/almacen-plantillas.js` (AlmacenPlantillas, solo lectura).
- Cambiados: `pages/03-editor-plantillas/render.js` (ahora un puente de 2 líneas), `estado.js` (textoDeDato y PT_A_MM delegan en el motor), `tipografia.js` (registrarFuentes usa MotorPlantillas.cargarFuentes), `index.html` (carga el motor antes de estado.js), `README.md` del editor y `pages/shared/README.md`.
- Probado con Chrome headless (arnés fuera del repo, `C:\tmp\fotocabina-0.2`): 78 imágenes del render original y del nuevo (render, hoja con línea de corte, guía, miniatura, fotos vacías, en 15 plantillas, con fuente incrustada) idénticas píxel a píxel; editor sin errores de consola; fotos/datos/validación/fuentes/almacén verificados.
- Falta (otro agente): MAPA y FLUJO no se tocaron; la cabina (1.1) aún no usa el motor.
- Correcciones del Code Reviewer aplicadas (motor-plantillas.js, almacen-plantillas.js, tipografia.js): clave de fuentes con huella del archivo, `cargarFuentes` que nunca falla (nulos, error síncrono, fallos no guardados, mismo resultado para quien la reutilice), imágenes fallidas no guardadas, fecha 'AAAA-MM-DD' como día local, `listar()` asigna id solo en la copia si falta, `TAMANO_MIN_PT` del motor, aviso de Blob URL en el encabezado. Rehecha la comparación: 78/78 imágenes idénticas a HEAD; fuente rota y dos plantillas con misma familia y archivos distintos probadas.

## Frontend 1.1 (cabina con plantilla real)

**Estado:** TERMINADO y probado; sin commit.
- Archivos (todos en `pages/01-camera-flow/`): `app.js`, `index.html`, `styles.css`, `almacen-sesiones.js` (guarda `hoja`), `README.md`.
- Probado con Chrome headless y cámara falsa (arnés en `C:\tmp\fotocabina-1.1`, fuera del repo): sesiones completas de 2, 3 y 4 fotos según la plantilla, postal 4x6 y apaisada, hoja con dos tiras, sin plantilla / borrada / dañada / sin fotos = Lanzar deshabilitado con aviso, demo sin evento como antes, sesión en la galería, consola sin errores.
- Correcciones del Code Reviewer aplicadas en `01-camera-flow/` (app.js, styles.css, README): lanzar solo con plantilla 'valida' o 'demo' y cámara conectada (con try/catch y espera de carga), número de sesión por máximo+1 con respaldo, miniatura solo al mostrar la tarjeta (no al lanzar), sin librerías y evento real = plantilla inválida, blobs asignados al final al componer, URL de impresión más duradera. Repetidas las pruebas de 2/3/4 fotos, sin plantilla y demo: consola sin errores.

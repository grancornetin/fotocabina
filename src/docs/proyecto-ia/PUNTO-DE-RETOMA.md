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

## Frontend 0.1b (repositorio v2, congelado, recorte 16:9)

**Estado:** TERMINADO y probado por el constructor (sin certificar); sin commit (lo hace el orquestador).
- Archivos: `shared/almacen-eventos.js` (reescrito v2 + migración), `shared/almacen-plantillas.js` (+`huella`), `shared/README.md`; `01-camera-flow/almacen-sesiones.js` (IndexedDB v3), `app.js`, `README.md`; `04-lista-eventos/app.js`, `index.html`, `README.md`; `05-crear-evento/app.js`, `README.md`. El editor 03 NO se tocó (sigue funcionando por el alias `plantillaId`).
- Pruebas (arnés `C:/tmp/fotocabina-0.1b`, fuera del repo; resultados `res-t1.json`, `res-t2.json`, `res-t3.json`, `res-t7-v169|v43|v916.json`, capturas en `shots/`): t1 migración 33/33; t2 congelado/contador/duplicar/borrado/evento sin plantilla/recomposición 44/44; t3 perfil limpio + crear en 05 + editor + cabina demo 16/16; t7 recorte 42/42 por cada cámara (16:9, 4:3, vertical). Consola sin errores en 01, 03, 04 y 05.
- Pendiente (otros): conteo de hojas/tope de impresión (no se tocó la impresión), `AlmacenEventos` asíncrono, mover `almacen-sesiones.js` a `shared/`, que el editor hable en `plantillas`, abandono del invitado (D4).

**Correcciones del Code Reviewer (0.1b) aplicadas:** respaldo confirmado antes de sobrescribir (si falla, solo en memoria), `ajustesExtra`, captura sin imagen = aviso y reintento, `aplicarAjustes` conserva la cámara, marco medido sin transición, alias con habilitadas únicas, `limpiarCongeladas` respeta copias de menos de 1 min, README. Pruebas t1/t2/t3/t7 repetidas y t4 nueva (10 comprobaciones).

**Riesgos del Reality Checker (0.1b) aplicados:** R1 (ninguna escritura sobrescribe el v1 sin respaldo confirmado; reintenta y si falla queda en memoria con aviso), R2 (original dañado sin copia -danado no se sobrescribe), R3 (cuota llena: `errorDeGuardado()` + copia en memoria + aviso en 04, 05 y 01), recarga de la cabina con plantilla viva borrada usa la copia congelada del evento (sin congelado sigue bloqueado, 1A), frase del README de shared corregida. Pruebas t1 33/33, t2 44/44, t3 16/16, t4 10/10, t5 (nueva) 13/13, t7 42/42 x3 cámaras; consola limpia.

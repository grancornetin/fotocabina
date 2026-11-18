# Punto de retoma: orquestador, hitos 0.2, 1.1, 0.1b y 0.3

## Frontend 1.3 (ciclo de vida del evento) - TERMINADO y probado por quien lo construyó (2026-11-17); sin certificación independiente y sin commit

**Estado:** HECHO. Regresión completa: tests-validador 64/64; h12 t1 42/42, t2 17/17, t4 21/21; 0.1b t1 33/33, t2 44/44 (prueba ajustada: Boda de Ana ahora está En curso), t3 16/16, t4 10/10 (con perfil limpio), t5 13/13, t7 sin fallos en las 3 cámaras; nuevas h13 t1 44/44 y t2 11/11. Falta: docs de src/docs (otro agente), commit, certificación independiente, prueba manual del dueño.
- Plan: (1) `shared/almacen-eventos.js`: `marcarEnCurso`, `terminar`, `reabrir` (+ `lanzadoEn`/`terminadoEn`). (2) Cabina: `launchEvent` pasa a en curso; sección "Evento" en Ajustes con "Terminar evento" y confirmación; no inicia sesiones si el evento ya está archivado. (3) Lista 04: "Terminar evento" en tarjetas en curso, "Reabrir" en archivados (sin Lanzar), conteo fresco al eliminar, refresco por `storage`/`pageshow`. (4) Pruebas en `C:/tmp/h13`. (5) READMEs de shared, 04 y 01.
- Hecho (checkpoint 1, 2026-11-17): CÓDIGO ESCRITO en `shared/almacen-eventos.js` (marcarEnCurso/terminar/reabrir/fueLanzado), `01-camera-flow/{app.js,index.html,styles.css,almacen-sesiones.js}` (sección Ajustes > Evento, diálogo Terminar, en curso al lanzar, no inicia sesión si archivado, `contarPorEvento` suma `total`), `04-lista-eventos/{app.js,styles.css}` (Terminar/Reabrir, conteo fresco al eliminar, refresco por storage/pageshow, `?terminado=`). Prueba `C:/tmp/h13/t1-ciclo.js` 44/44.
- Checkpoint 2: READMEs de shared, 04 y 01 al día; pruebas extra `C:/tmp/h13/t2-extras.js` 11/11 (invitado con evento terminado en otra pestaña, refresco entre pestañas, móvil 390 px, oscuro); `tests-validador.html` 64/64; h12 t1 42/42 y t2 17/17. Hallazgos 5 y 6 anotados en el Tablero. Falta solo: terminar la regresión (h12 t4 y 0.1b t1-t7, `C:/tmp/h13/regresion13.out`) y entregar el reporte final.
- Aviso: los archivos del repo son CRLF; editar con scripts que respeten CRLF (ver `C:/tmp/h13/parche-*.py`).
- **Correcciones post-revisión (2026-11-17, Frontend Developer, SIN commit):** (a) lista 04 relee el evento al aceptar eliminar y `refrescarLista` cierra el aviso si el evento cambió o desapareció; (b) diálogos accesibles (Escape, foco a Cancelar, trampa de foco, foco de vuelta al origen, aria-modal/aria-describedby/aria-live) en `01` endOverlay y `04` confirmOverlay; (c) `launchEvent` de 01 relee y aborta con aviso si el evento está archivado o ya no existe; (d) `AlmacenEventos.cambiarPlantilla(id, plantillaId)` nuevo y el editor 03 lo usa en vez de guardar la copia vieja; (e) `fueLanzado` solo mira `lanzadoEn`; (f) menores: 01 refresca Ajustes > Evento por `storage`/`visibilitychange`, doble apertura del diálogo Terminar bloqueada; (g) sección 3.13 en `DSLRBOOTH_PRODUCT_CONTEXT.md` + "Última revisión"; READMEs de shared, 04, 01 y 03 al día. Pruebas nuevas: `C:/tmp/h14/t3-correcciones.js` (35/35). Regresión completa: `C:/tmp/h14/regresion14.out`. Falta: certificación independiente de lo corregido, prueba manual del dueño, commit.

**Estado:** 0.2, 1.1 y 0.1b HECHOS y commiteados; 0.3 HECHO y certificado (2026-11-17), **sin commit**. **Actualizado:** 2026-11-17

## Frontend 1.2 (editar evento, varias plantillas, tope, A7 por modo de entrega)

**Estado:** TERMINADO y probado por quien lo construyó (2026-11-17); sin certificación independiente y sin commit.
- Archivos: `shared/validador-evento.js` (`configuracion` suma mensajePausa/pacienciaSeg/espejo; `configuracionEfectiva` exportada; el resumen suma impresión automática y tope), `shared/tests-validador.html` (64 casos), `shared/almacen-eventos.js` (solo sanea `entrega.topeHojas`), `shared/README.md`, `05-crear-evento/{index.html, app.js, styles.css, README.md}` (reescritos: crear y editar, varias plantillas, tope, resumen del validador, salir sin guardar), `04-lista-eventos/{app.js, styles.css, README.md}` (botón "Editar evento", línea de entrega, "(+N más)"), `01-camera-flow/{app.js, index.html, README.md}` (`configCongelada()` desde el validador; `aplicarModoEntrega()` en A7; línea de entrega en la tarjeta de plantilla; sin GIF ni QR en solo impresión).
- Pruebas (arnés `C:/tmp/h12`, servidor `C:/tmp/fotocabina-0.1b/server.js` puerto 8321, Chrome headless, cámara falsa): `tests-validador.html` 64/64; `t1-editar.js` 42/42; `t2-cabina.js` 17/17; capturas en `C:/tmp/h12/shots` (escritorio claro y oscuro, teléfono sin desborde); consola limpia. Regresión (`C:/tmp/fotocabina-0.1b`): t1 33/33, t2 44/44, t3 16/16, t4 10/10, t5 13/13 (se ajustó en esa prueba solo dónde se lee el aviso de "no hay espacio" en 05: ahora está en `#errorGuardado`), t7 42/42 con las tres cámaras.
- **Correcciones del Code Reviewer aplicadas (2026-11-17):** tope inválido se descarta en el almacén (1); crear no duplica y el botón se bloquea al guardar (2); evento ya lanzado no se guarda sin plantilla, aviso ámbar si la por defecto es ilegible y aviso al operador en la cabina (3); detección de cambio ajeno con "Recargar" / "Guardar igualmente" (5); tope conservado al cambiar de modo (6); aria del tope y aviso de salir modal con Escape y foco atrapado (7); texto de entrega (9); `configCongelada()` nula si el evento real ya no existe y la cabina no empieza sesión (10). Nueva prueba `C:/tmp/h12/t4-correcciones.js` 21/21; t1 42/42 (ajustada: el evento de la prueba ya lanzado no puede quedar sin plantilla), t2 17/17, tests-validador 64/64.
- Pendiente (otros): docs de `src/docs` (§7, §8, mapa, flujo, RETOMAR), commit, certificación independiente, prueba manual del dueño.

## Frontend 0.3 (validador "evento listo para lanzar")

**Estado:** TERMINADO y certificado (Code Reviewer, Evidence Collector, Reality Checker: LISTO CON RESERVAS; documentación hecha). Sin commit ni push (lo hace el orquestador al cerrar).
- Archivos: `shared/validador-evento.js` (nuevo), `shared/tests-validador.html` (nuevo, 55 de 55 casos, sí se commitea, ver CLAUDE.md §5), `01-camera-flow/{index.html, app.js, styles.css}` (Lanzar usa el validador; lista breve de bloqueos y avisos en `#launchNotes`), `04-lista-eventos/{index.html, app.js, styles.css}` (etiqueta "No lanzable" con motivo), READMEs de `shared/`, `01-camera-flow/` y `04-lista-eventos/`.
- Pruebas: arnés fuera del repo (`C:/tmp/h03/`), Chrome headless, consola sin errores.
- Correcciones del Code Reviewer aplicadas: copia congelada = aviso `PLANTILLA_SOLO_COPIA_CONGELADA`; la lista no marca si no pudo leer las plantillas; ritmo acotado; impresora `desconocido`/`unknown` = aviso.
- Reservas abiertas: ver `ARQUITECTURA_FLUJO.md` §7.6 y el hallazgo 1 del Tablero (`configCongelada()`).
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

## ORQUESTADOR: misión 2026-11-17 (hito 1.6 respaldo y restauración, luego hito corto 04/01)
**Estado:** EN CURSO. Orden: A) hito 1.6 (constructor, Code Reviewer, Evidence Collector, Reality Checker, commit si certifica) y B) hito corto (lanzar de cada tarjeta deja de ser lima; desborde móvil 390 px de la cabina).
- Decisiones del dueño ya tomadas (2026-11-17): varios eventos En curso a la vez; Reabrir sin confirmación; Próximo se puede archivar; Terminar desde la cabina vuelve a Archivados hasta que exista C10; el botón Lanzar lima de la lista y el desborde de la cabina van en el hito B.
- Defaults elegidos por el orquestador para 1.6 (reportar al dueño): pantalla nueva `src/pages/06-respaldo/` abierta desde "Respaldo" en el menú de la lista (se mudará a C8 cuando exista); el respaldo NO incluye el PIN ni ajustes de cámara; archivo ZIP estándar (abre en el Explorador); restaurar por defecto SUMA sin borrar nada (lo existente gana), con opción "Reemplazar todo" con confirmación destructiva; importar un evento que ya existe lo crea como copia nueva.
- Avance: (actualizar abajo en cada checkpoint)



## Frontend 1.6 (respaldo y restauración) — CONSTRUIDO, pendiente de certificación independiente
**Estado final del constructor:** todo hecho: código, pruebas y documentación. Sin commit (lo hace el orquestador).
- **Pruebas:** `shared/tests-validador.html` 99/99 (64 anteriores + 35 nuevos, con localStorage de doble en memoria; el real queda intacto). Pruebas reales en Chrome (arnés y capturas en `C:/tmp/h16`, fuera del repo): ida y vuelta idéntica, restaurar dos veces sin duplicar, reemplazar, archivos corruptos/futuros/ajenos rechazados, fallo simulado en IndexedDB y localStorage deja todo igual, exportar/importar evento con y sin colisión, 390 px sin scroll horizontal, claro y oscuro, cabina y editor abren con lo restaurado, consola sin errores.
- **Archivos:** `shared/respaldo.js` (nuevo), `shared/almacen-eventos.js`, `shared/almacen-plantillas.js`, `01-camera-flow/almacen-sesiones.js` (solo funciones nuevas), `06-respaldo/*` (nuevo), `04-lista-eventos/{index.html,styles.css,app.js,README.md}`, `shared/tests-validador.html`, `shared/README.md`, docs: MAPA, `src/README.md`, FLUJO_NAVEGACION, ARQUITECTURA (§7.9 y tabla 7.2), DSLRBOOTH §3.14.
- **Para el orquestador:** consolidar RETOMAR, TABLERO, BITACORA y cerebro. Hay un servidor `python -m http.server 8716` que quedó corriendo (sobre `src/`); se puede cerrar. La carpeta `.playwright-mcp/` de la raíz ya se borró (la recrea la herramienta del navegador si se vuelve a usar; no se commitea).

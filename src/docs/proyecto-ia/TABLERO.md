# Tablero de agentes de FotoCabina

> **Qué es:** el centro de mando. Aquí cada agente se registra, dice qué hace, qué terminó y qué le queda; reserva los archivos que va a tocar para no pisar a otro; y deja hallazgos para otros agentes.
> **Va de la mano con** `BITACORA.md` (historia) y `RETOMAR.md` (cambio de turno).
> **Quién lo mantiene:** todos los agentes, cada vez que se mueven. Un tablero desactualizado es peor que no tenerlo.

## Cómo usarlo (obligatorio, en este orden)
1. **Al llegar:** lee todo el tablero. Si tu nombre no está en "Agentes", agrégate (nombre claro por rol: `frontend`, `seguridad`, `orquestador`…).
2. **Antes de empezar una tarea:** revisa "Reservas". Si lo que vas a tocar está reservado por otro agente → NO lo toques: anótate en "Esperas" y trabaja en otra cosa. Si está libre → reserva (archivo o carpeta, con tu nombre y hora).
3. **Mientras trabajas:** mantén tu fila de "Agentes" y tus "Tareas" al día (estado: pendiente · en curso · pausada · hecha · bloqueada).
4. **Si encuentras algo fuera de tu alcance:** NO lo arregles. Anótalo en "Hallazgos" mencionando al agente responsable con `@nombre` (ejemplo: la página de login no tiene protección → `@seguridad`). Queda *abierto* hasta que ese agente lo cierre.
5. **Al entrar, cada agente revisa los hallazgos que lo mencionan** y los resuelve o los reprograma explicando por qué; actualiza el estado.
6. **Al terminar o pausar:** libera tus reservas (o márcalas "en pausa" con motivo), marca tus tareas, escribe una línea en la Bitácora.
7. **Commits:** `git add` solo por nombre y solo lo de TU reserva (nunca `git add .`/`-A`). El commit lleva al final `# agente: <tu nombre>`; un hook revisa que no incluya archivos reservados por otro. Un commit con trabajo incompleto de otro agente es el error que este tablero existe para evitar.
8. **Un agente que ve a otro caído** (reserva con más de 24 h sin movimiento) pregunta al dueño antes de tomar sus archivos.
9. **Mejora continua:** cuando algo se pisó, se olvidó o confundió, agrega la lección en "Lecciones del equipo" y mejora la regla que falló.

## Agentes
| Agente | Rol | Estado | Sesión/cuenta | Última actividad |
|---|---|---|---|---|
| orquestador | coordina, consolida RETOMAR; dirige el esqueleto de arquitectura, el hito 0.1a y los hitos 0.2, 1.1, 0.1b y 0.3 | activo | | 2026-11-17 |
| frontend | Frontend Developer: construyó 0.2, 1.1, 0.1b, 0.3 y 1.2; 1.3 construido (en certificación independiente) | libre | | 2026-11-17 |
| orquestador-escritorio | Agents Orchestrator: programa de escritorio (Electron), cámara T5 por EDSDK e impresión silenciosa (bloque 1) | hecho: Bloque 1 certificado con reservas y commiteado (2026-11-19) | | 2026-11-19 |
| orquestador-bloque2 | Agents Orchestrator: bloque 2 fase A (pantallas C10, C11, C6, C8, C5, C2c, C7 y diapositivas) | en curso, pausada por uso del plan (2026-11-19); nada construido aún; retoma en `PUNTO-DE-RETOMA-bloque2.md` | | 2026-11-19 |

## Tareas
| # | Tarea | Agente | Estado | Archivos | Inicio | Fin / notas |
|---|---|---|---|---|---|---|
| 1 | Adoptar el proyecto y ordenar el espacio de trabajo | orquestador | en curso | `RETOMAR.md`, `src/docs/proyecto-ia/*`, `cerebro-fotocabina/*`, `CLAUDE.md`, `.gitignore` | 2026-11-16 | Falta aprobación del equipo y decisión de commit |
| 3 | Hito 0.1a: guardar cada foto al tomarla + PIN al equipo | orquestador | hecha | `src/pages/01-camera-flow/*`, `src/pages/shared/equipo.js`, `src/pages/shared/almacen-eventos.js`, `src/pages/shared/README.md`, docs del hito | 2026-11-16 | Probado con Chrome headless y revisado; falta prueba del dueño con cámara real |
| 2 | Esqueleto de arquitectura (documento maestro) | orquestador | hecha | `src/docs/ARQUITECTURA_FLUJO.md`, `src/docs/proyecto-ia/PUNTO-DE-RETOMA.md` | 2026-11-16 | Revisado por Reality Checker y Software Architect; espera decisiones del dueño |
| 4 | Hito 0.2: motor de plantillas compartido (`shared/`) sin romper el editor | frontend | hecha | `src/pages/shared/motor-plantillas.js`, `src/pages/shared/almacen-plantillas.js`, `src/pages/03-editor-plantillas/render.js` (y `index.html`, `estado.js` solo para enganchar el motor) | 2026-11-16 | Certifican Evidence Collector (editor igual) y Code Reviewer |
| 5 | Hito 1.1: la cabina compone con la plantilla real del evento | frontend | hecha | `src/pages/01-camera-flow/*` | 2026-11-16 | Certifican Evidence Collector y Reality Checker (agentes distintos de quien construye) |
| 6 | Hito 0.1b: repositorio v2 de eventos con plantilla congelada por sesión, migración v1 a v2, recorte 16:9 de la cámara | frontend | hecha | `src/pages/shared/almacen-eventos.js`, `src/pages/shared/almacen-plantillas.js`, `src/pages/shared/README.md`, `src/pages/01-camera-flow/*`, `src/pages/04-lista-eventos/*`, `src/pages/05-crear-evento/*` (solo lo mínimo para el repositorio) | 2026-11-16 | Certificado: Code Reviewer, Evidence Collector 6/6 y Reality Checker (código aprobado). Falta prueba manual del dueño con cámara real |
| 7 | Hito 0.3: validador único "evento listo para lanzar" | frontend | hecha | `src/pages/shared/validador-evento.js`, `src/pages/shared/tests-validador.html`, `src/pages/01-camera-flow/*` (solo el bloqueo de lanzar), `src/pages/04-lista-eventos/*` (solo marca de no lanzable) | 2026-11-17 | Certificado: Code Reviewer, Evidence Collector, Reality Checker (LISTO CON RESERVAS; documentación hecha). Falta commit y prueba del dueño. Siguen 1.2, 1.3, 1.6 en ese orden |
| 8 | Hito 1.2: C2 crear y editar con varias plantillas y tope de hojas; el validador da la configuración congelada; A7 respeta el modo de entrega | frontend | hecha (certificada 2026-11-17) | `src/pages/shared/validador-evento.js`, `src/pages/shared/tests-validador.html`, `src/pages/shared/almacen-eventos.js` (solo `topeHojas`), `src/pages/shared/README.md`, `src/pages/05-crear-evento/*`, `src/pages/04-lista-eventos/*` (botón Editar y línea de entrega), `src/pages/01-camera-flow/*` (configCongelada y A7) | 2026-11-17 | Sin commit; pruebas en `C:/tmp/h12`: validador 64/64, editar 42/42, cabina 17/17, regresión 0.1b t1-t7 sin fallos |
| 9 | Hito 1.3: ciclo de vida del evento (en curso automático, Terminar evento, Reabrir, conteo real y aviso al eliminar) | frontend | hecha | `src/pages/shared/almacen-eventos.js`, `src/pages/shared/tests-validador.html` (solo si hace falta), `src/pages/shared/README.md`, `src/pages/04-lista-eventos/*`, `src/pages/01-camera-flow/*` (lanzar, sección Evento de Ajustes, conteo), `src/docs/proyecto-ia/PUNTO-DE-RETOMA.md` | 2026-11-17 | Certificado (Evidence Collector y Reality Checker con reservas); commiteado. Detalle en `ARQUITECTURA_FLUJO.md` §7.8 |
| 10 | Hito 1.6: respaldo y restauración (exportar todo a un archivo, restaurar, exportar/importar un evento, aviso de espacio) | frontend (orquestado) | hecha (certificada) | `src/pages/06-respaldo/*` (nueva), `src/pages/shared/respaldo.js` (nuevo), `src/pages/shared/almacen-eventos.js`, `src/pages/shared/almacen-plantillas.js`, `src/pages/shared/tests-validador.html`, `src/pages/shared/README.md`, `src/pages/01-camera-flow/almacen-sesiones.js` (solo funciones de exportar/importar crudo), `src/pages/04-lista-eventos/*` (menú Respaldo, Exportar/Importar evento, aviso de espacio) | 2026-11-17 | Después va el hito corto B (lima de la lista y desborde móvil de la cabina)|
| 11 | Mini-hito A: "Lanzar" deshabilitado en eventos "No lanzable" | orquestador | hecha | `src/pages/04-lista-eventos/*` | 2026-11-18 | Commit `d25655d` |
| 12 | Hito 3: impresión con impresora simulada (cola, A9, A10, C4, tope y conteo de hojas) | frontend (orquestado) | hecha (certificada con reservas) | `src/pages/shared/impresion.js`, `src/pages/01-camera-flow/*`, `src/pages/shared/{README.md,tests-validador.html}`, docs, `src/docs/PRUEBA_TECNICA_ESCRITORIO.md` | 2026-11-18 | Prueba técnica D8 preparada, no ejecutada. Reservas en `ARQUITECTURA_FLUJO.md` §7.10 |
| 13 | Hito 3b: hojas en el respaldo, rollo acumulado, copias sin PIN, borrar con impresión automática, doc D8 | orquestador | hecha (certificada) | `shared/{impresion,respaldo}.js`, `shared/{README.md,tests-validador.html}`, `01-camera-flow/*`, `04-lista-eventos/*`, `06-respaldo/*`, docs | 2026-11-18 | Detalle en `ARQUITECTURA_FLUJO.md` §7.11 |
| 14 | Programa de escritorio (bloque 1): caparazón Electron, cámara real T5 por EDSDK, impresión silenciosa por driver de Windows | orquestador-escritorio | hecha: certificada con reservas (Code Reviewer, Evidence Collector, Reality Checker) y commiteada; falta prueba con papel real y T5 recertificada | `src/escritorio/` (nueva), `src/pages/shared/{impresion.js,impresion-escritorio.js (nuevo),camara-escritorio.js (nuevo),README.md,tests-validador.html}`, `src/pages/01-camera-flow/{app.js,index.html,README.md}`, `.gitignore`, docs del hito, `src/docs/proyecto-ia/PUNTO-DE-RETOMA-escritorio.md` | 2026-11-19 | Punto de retoma en `PUNTO-DE-RETOMA-escritorio.md` |
| 15 | Bloque 2, fase A: pantallas nuevas C10, C11, C6, C8, C5, C2c, C7 y diapositivas (carpetas nuevas en `src/pages/`) | orquestador-bloque2 | en curso, pausada por uso del plan (nada construido; sin carpetas ni reservas tomadas) | ninguno todavía | 2026-11-19 | Plan y siguiente paso en `PUNTO-DE-RETOMA-bloque2.md`. Fase B espera al commit del bloque 1 |

## Reservas (qué archivo o carpeta está tomando cada agente)
| Archivo o carpeta | Agente | Desde | Estado | Motivo |
|---|---|---|---|---|
| RETOMAR.md, src/docs/proyecto-ia/, cerebro-fotocabina/ | orquestador | 2026-11-16 | en curso | Ordenar espacio de trabajo |
| src/docs/ARQUITECTURA_FLUJO.md, src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md, src/docs/MAPA_DE_PANTALLAS.md, src/docs/FLUJO_NAVEGACION.md, src/README.md, CLAUDE.md | orquestador | 2026-11-16 | liberada | Esqueleto de arquitectura (solo documentación) |
| src/pages/01-camera-flow/, src/pages/shared/ (equipo.js, almacen-eventos.js, README.md) | orquestador | 2026-11-16 | liberada | Hito 0.1a terminado |
| src/pages/shared/motor-plantillas.js, src/pages/shared/almacen-plantillas.js, src/pages/shared/README.md, src/pages/03-editor-plantillas/ (render.js, index.html, estado.js, README.md) | frontend (orquestador) | 2026-11-16 | liberada | Hito 0.2 hecho |
| src/pages/01-camera-flow/ (index.html, app.js, styles.css, README.md) | frontend (orquestador) | 2026-11-16 | liberada | Hito 1.1 hecho |
| src/docs/MAPA_DE_PANTALLAS.md, FLUJO_NAVEGACION.md, ARQUITECTURA_FLUJO.md (solo §7 y hallazgos), src/README.md | writer (orquestador) | 2026-11-16 | liberada | Documentación hecha |
| src/pages/shared/ (almacen-eventos.js, almacen-plantillas.js, README.md), src/pages/01-camera-flow/, src/pages/04-lista-eventos/, src/pages/05-crear-evento/ | frontend (orquestador) | 2026-11-16 | liberada | Hito 0.1b |
| src/docs/ARQUITECTURA_FLUJO.md (§6, §7, §8), MAPA_DE_PANTALLAS.md, FLUJO_NAVEGACION.md, BITACORA.md, RETOMAR.md, TABLERO.md | orquestador | 2026-11-16 | liberada | Documentación del hito 0.1b |

| src/docs/ARQUITECTURA_FLUJO.md (§2.3, §2.4, §6, §7, §7.6), MAPA_DE_PANTALLAS.md, FLUJO_NAVEGACION.md, BITACORA.md, TABLERO.md, CLAUDE.md (§5) | writer (orquestador) | 2026-11-17 | liberada | Documentación del hito 0.3 |
| src/pages/shared/validador-evento.js, src/pages/shared/tests-validador.html, src/pages/01-camera-flow/ (bloqueo de lanzar), src/pages/04-lista-eventos/ (marca "No lanzable") | frontend (orquestador) | 2026-11-17 | liberada | Hito 0.3 hecho (falta commit y prueba del dueño) |
| src/pages/shared/ (validador-evento.js, tests-validador.html, almacen-eventos.js, README.md), src/pages/05-crear-evento/, src/pages/04-lista-eventos/, src/pages/01-camera-flow/ | frontend | 2026-11-17 | liberada | Hito 1.2 construido (falta certificación y commit) |
| src/docs/ARQUITECTURA_FLUJO.md (§6, §7.2, §7.6, §7.7, §8), MAPA_DE_PANTALLAS.md, FLUJO_NAVEGACION.md, proyecto-ia/BITACORA.md, proyecto-ia/TABLERO.md | writer (orquestador) | 2026-11-17 | liberada | Documentación del hito 1.2 |
| src/pages/shared/ (almacen-eventos.js, README.md), src/pages/04-lista-eventos/, src/pages/01-camera-flow/ | frontend | 2026-11-17 | liberada | Hito 1.3 construido (falta certificación y commit) |
| src/docs/ARQUITECTURA_FLUJO.md (§2.3, §2.6, §6, §7.2, §7.6, §7.7, §7.8, §8), MAPA_DE_PANTALLAS.md, FLUJO_NAVEGACION.md, proyecto-ia/BITACORA.md, proyecto-ia/TABLERO.md | writer (orquestador) | 2026-11-17 | liberada | Documentación del hito 1.3 |
| src/pages/06-respaldo/, src/pages/shared/ (respaldo.js, almacen-eventos.js, almacen-plantillas.js, tests-validador.html, README.md), src/pages/01-camera-flow/almacen-sesiones.js, src/pages/04-lista-eventos/ | frontend (orquestado) | 2026-11-17 | liberada | Hito 1.6 hecho (commit) |
| src/pages/shared/impresion.js, src/pages/01-camera-flow/, src/pages/04-lista-eventos/ (un texto), docs del hito 3 | frontend (orquestado) | 2026-11-18 | liberada | Hito 3 hecho (commit) |
| src/escritorio/ (nueva), src/pages/shared/{impresion.js, impresion-escritorio.js, camara-escritorio.js, README.md, tests-validador.html}, src/pages/01-camera-flow/{app.js, index.html, README.md}, .gitignore, MAPA_DE_PANTALLAS.md, ARQUITECTURA_FLUJO.md (§7.12), FLUJO_NAVEGACION.md (si aplica), DSLRBOOTH_PRODUCT_CONTEXT.md, BITACORA.md, RETOMAR.md | orquestador-escritorio | 2026-11-19 | liberada (commiteado) | Bloque 1 del programa de escritorio |

## Esperas (quién espera a quién)
| Agente | Espera a | Por qué | Retoma cuando |
|---|---|---|---|
| | | | |

## Hallazgos (para otros agentes)
| # | Hallazgo | Detectado por | Mencionado | Estado | Resuelto por / fecha |
|---|---|---|---|---|---|
| 1 | `configCongelada()` de `01-camera-flow/app.js` duplica la configuración efectiva que ya calcula el validador. Debe tomarla de `shared/validador-evento.js` (una sola fuente). Detalle y demás reservas del hito 0.3 en `ARQUITECTURA_FLUJO.md` §7.6 | orquestador (Reality Checker) | @desarrollador | resuelto | frontend, 2026-11-17 (hito 1.2): `configCongelada()` llama a `ValidadorEvento.configuracionEfectiva`; documentado en `ARQUITECTURA_FLUJO.md` §7.6 punto 1 y §7.7 |
| 2 | Hito 1.2: `AlmacenEventos.guardar` sigue síncrono y la edición de evento (C2) usa `obtener` + `guardar`; cuando el almacén pase a promesas (regla 7) hay que tocar `05-crear-evento` y `04-lista-eventos` | frontend | @desarrollador | abierto | |
| 3 | Hito 1.2: en solo impresión la cabina ya no genera el GIF (decisión de bajo riesgo según §2.3); si el dueño quiere GIF también ahí (por ejemplo para la galería del operador), es un cambio de una línea en `compose()` de `01-camera-flow/app.js` | frontend | @orquestador | abierto | |
| 4 | Hito 1.2: `DESTINOS.EDITAR_EVENTO` del validador no está conectado a `05-crear-evento?editar=<id>`; los avisos "Cambiar las copias" y "Cambiar la entrega" aún no abren el formulario de edición (`ARQUITECTURA_FLUJO.md` §7.7, reserva 5) | escritor de docs | @desarrollador | abierto | |
| 5 | Hito 1.3: `ARQUITECTURA_FLUJO.md` se contradice sobre cuántos eventos pueden estar "en curso" a la vez (§2.3 dice uno solo por equipo y el anterior vuelve a próximo; §2.6 dice varios, uno por equipo). El hito 1.3 NO cambia a otros eventos al lanzar uno. Hay que decidir y unificar el texto | frontend | @orquestador | resuelto (texto) | escritor de docs, 2026-11-17: texto unificado en §2.3 y §2.6 ("pueden coexistir varios En curso"); queda como decisión de bajo riesgo a confirmar por el dueño (`ARQUITECTURA_FLUJO.md` §7.8 reserva 3 y §8) |
| 6 | Hito 1.3: navegación nueva para `FLUJO_NAVEGACION.md`: cabina (Ajustes › Evento › Terminar evento) a lista de eventos con `?terminado=<id>` (abre en Archivados con aviso); lista, tarjeta Archivados › "Reabrir" (a En curso o a Próximos según si se lanzó); lista, tarjeta En curso › "Terminar evento". Faltan además las filas de MAPA_DE_PANTALLAS (C1, C2b) y §6 hallazgo 7 (cerrado) y §7.6 reserva 9 (cerrada) | frontend | @escritor-docs | resuelto | escritor de docs, 2026-11-17: filas de `FLUJO_NAVEGACION.md` (C1 y C2b), `MAPA_DE_PANTALLAS.md` (C1 y C2b), §6 hallazgo 7 y §7.6 reserva 9 actualizados; estado del hito y reservas abiertas en `ARQUITECTURA_FLUJO.md` §7.8 |
| 7 | Hito 3: el editor `03-editor-plantillas` tiene 5 botones lima a 1366 px y desborda a 390 px (ya existía, no es del hito) | Evidence Collector | @desarrollador | abierto | |
| 8 | Hito 3: la cola de impresión y sus conteos no entran al respaldo de `06-respaldo` (restaurar reinicia el tope) | frontend | @desarrollador | resuelto | orquestador, 2026-11-18 (hito 3b): los conteos entran; la cola no |
| 9 | Hito 3b: el candado del operador queda tapado por la capa de resultado en la cabina (solo se entra con Escape + PIN) | Evidence Collector | @desarrollador | abierto | |
| 10 | PREGUNTA PARA EL DUEÑO: cómo se empaquetará el EDSDK de Canon en el instalador respetando la licencia de Canon (el repo es público y no puede llevar las DLL; hoy el programa las busca en una ruta configurable). No la decide el agente | orquestador-escritorio | @dueño (vía sesión principal) | abierto | |

## Lecciones del equipo
<!-- Una línea por lección: fecha · qué pasó · qué regla se cambió -->

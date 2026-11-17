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
| orquestador | coordina, consolida RETOMAR; dirige el esqueleto de arquitectura, el hito 0.1a y los hitos 0.2 y 1.1 | activo | | 2026-11-16 |
| frontend | Frontend Developer: construyó 0.2, 1.1 y 0.1b | libre | | 2026-11-16 |

## Tareas
| # | Tarea | Agente | Estado | Archivos | Inicio | Fin / notas |
|---|---|---|---|---|---|---|
| 1 | Adoptar el proyecto y ordenar el espacio de trabajo | orquestador | en curso | `RETOMAR.md`, `src/docs/proyecto-ia/*`, `cerebro-fotocabina/*`, `CLAUDE.md`, `.gitignore` | 2026-11-16 | Falta aprobación del equipo y decisión de commit |
| 3 | Hito 0.1a: guardar cada foto al tomarla + PIN al equipo | orquestador | hecha | `src/pages/01-camera-flow/*`, `src/pages/shared/equipo.js`, `src/pages/shared/almacen-eventos.js`, `src/pages/shared/README.md`, docs del hito | 2026-11-16 | Probado con Chrome headless y revisado; falta prueba del dueño con cámara real |
| 2 | Esqueleto de arquitectura (documento maestro) | orquestador | hecha | `src/docs/ARQUITECTURA_FLUJO.md`, `src/docs/proyecto-ia/PUNTO-DE-RETOMA.md` | 2026-11-16 | Revisado por Reality Checker y Software Architect; espera decisiones del dueño |

| 4 | Hito 0.2: motor de plantillas compartido (`shared/`) sin romper el editor | frontend | hecha | `src/pages/shared/motor-plantillas.js`, `src/pages/shared/almacen-plantillas.js`, `src/pages/03-editor-plantillas/render.js` (y `index.html`, `estado.js` solo para enganchar el motor) | 2026-11-16 | Certifican Evidence Collector (editor igual) y Code Reviewer |
| 5 | Hito 1.1: la cabina compone con la plantilla real del evento | frontend | hecha | `src/pages/01-camera-flow/*` | 2026-11-16 | Certifican Evidence Collector y Reality Checker (agentes distintos de quien construye) |

| 6 | Hito 0.1b: repositorio v2 de eventos con plantilla congelada por sesión, migración v1 a v2, recorte 16:9 de la cámara | frontend | hecha | `src/pages/shared/almacen-eventos.js`, `src/pages/shared/almacen-plantillas.js`, `src/pages/shared/README.md`, `src/pages/01-camera-flow/*`, `src/pages/04-lista-eventos/*`, `src/pages/05-crear-evento/*` (solo lo mínimo para el repositorio) | 2026-11-16 | Certificado: Code Reviewer, Evidence Collector 6/6 y Reality Checker (código aprobado). Falta prueba manual del dueño con cámara real |

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

## Esperas (quién espera a quién)
| Agente | Espera a | Por qué | Retoma cuando |
|---|---|---|---|
| | | | |

## Hallazgos (para otros agentes)
| # | Hallazgo | Detectado por | Mencionado | Estado | Resuelto por / fecha |
|---|---|---|---|---|---|
| | | | | abierto | |

## Lecciones del equipo
<!-- Una línea por lección: fecha · qué pasó · qué regla se cambió -->

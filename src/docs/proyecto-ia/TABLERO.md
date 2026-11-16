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
| orquestador | coordina, consolida RETOMAR | activo | | 2026-11-16 |

## Tareas
| # | Tarea | Agente | Estado | Archivos | Inicio | Fin / notas |
|---|---|---|---|---|---|---|
| 1 | Adoptar el proyecto y ordenar el espacio de trabajo | orquestador | en curso | `RETOMAR.md`, `src/docs/proyecto-ia/*`, `cerebro-fotocabina/*`, `CLAUDE.md`, `.gitignore` | 2026-11-16 | Falta aprobación del equipo y decisión de commit |

## Reservas (qué archivo o carpeta está tomando cada agente)
| Archivo o carpeta | Agente | Desde | Estado | Motivo |
|---|---|---|---|---|
| RETOMAR.md, src/docs/proyecto-ia/, cerebro-fotocabina/ | orquestador | 2026-11-16 | en curso | Ordenar espacio de trabajo |

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

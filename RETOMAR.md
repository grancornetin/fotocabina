# RETOMAR: FotoCabina

> **Qué es:** el reporte de cambio de turno. Es el puente entre cuentas y sesiones: la cuenta que entra no recuerda nada, así que este archivo le dice el punto exacto hasta donde llegó la anterior, hacia dónde iba y qué está pendiente.
> **Regla de oro:** debe estar 100% al día en todo momento, porque el límite de uso puede cortar el trabajo sin aviso.
> **Quién lo mantiene:** todos los agentes; el orquestador lo consolida.

## Cómo mantenerlo
1. **Al iniciar una tarea:** agrégala en "En curso" con hora, agente y la dirección en que va (1 línea). Si no queda registrada aquí, no existe.
2. **Al terminarla:** muévela a "Hecho y verificado" (con cómo se verificó).
3. **Si se corta o se pausa:** en "En curso" escribe **dónde se cortó** (archivo y paso) y **hacia dónde iba**. Nunca la marques como hecha si no lo está.
4. **Con aviso de uso ≥ 70 %:** trabajar por checkpoints (archivos coherentes tras cada hito). **≥ 90 %:** no iniciar tareas grandes; preparar el cambio de cuenta.
5. **"Prepara el cambio de cuenta":** el orquestador pausa a todos los agentes; cada uno deja checkpoint y actualiza su parte del Tablero, la Bitácora y este archivo; después el orquestador deja este documento completo y avisa al dueño en el chat (sin commit/push salvo que él lo pida).
6. **Sin secretos:** nada de claves, contraseñas ni datos personales.

## Cómo retomar (para la cuenta que entra)
1. Lee este archivo, luego `src/docs/proyecto-ia/TABLERO.md` y las últimas entradas de `src/docs/proyecto-ia/BITACORA.md`.
2. Verifica contra la realidad: `git status`, rama y últimos commits. **Manda el repositorio, no este documento**; si difieren, corrige este archivo.
3. Resume al dueño en el chat, en 5 líneas, dónde quedó y qué sigue; las decisiones pendientes, todas juntas en lista numerada.
4. Relanza lo que quedó a medias leyendo el `PUNTO-DE-RETOMA.md` de cada agente: "ya hay trabajo previo; léelo y continúa sin rehacer lo terminado".

---

**Actualizado:** 2026-11-16  ·  **Cuenta/sesión:** sesión de /actualizar-proyecto  ·  **Rama:** main

## Estado en una frase
Etapa 1 (uso propio), fase de construcción (decisión 2026-11-16: antes de más pantallas se diseña el esqueleto completo) de pantallas: cabina del invitado, editor de plantillas, lista de eventos, crear evento y cámara ya funcionan en el navegador; falta impresora, panel en vivo, servidor local de entrega y toda la parte de hardware real. Último commit de código: `57930dd` (C3 cámara, 2026-09-25). Sin cambios pendientes de código.

## Hecho y verificado
- Cabina del invitado `01-camera-flow`: A1, A3–A7, A11 migradas; A8 (QR) solo maqueta. Probado por el dueño con cámara real el 2026-09-16.
- Editor de plantillas `03-editor-plantillas`: Fases 1–4 completas y aprobadas para producción (2026-09-17). `02-layout-editor` descartado (no se borra, no se toca).
- C1 lista de eventos (`04-lista-eventos`), C2 crear evento (`05-crear-evento`), C3 cámara (dentro de Ajustes de la cabina), conectadas por el almacén compartido `pages/shared/almacen-eventos.js`.
- Documentación al día hasta C3 (mapa, flujo de navegación, contexto de producto).
- Esqueleto de arquitectura escrito y revisado (2026-11-16): `src/docs/ARQUITECTURA_FLUJO.md`. Hallazgo mayor: la cabina no dibuja la plantilla real del evento.
- Espacio de trabajo con agentes creado hoy (2026-11-16): este archivo, `src/docs/proyecto-ia/`, cerebro local `cerebro-fotocabina/`, orquestador en `.claude/agents/`.

## En curso / a medias
| Tarea | Agente | Estado | Dónde quedó (archivo y paso) | Hacia dónde iba |
|---|---|---|---|---|
| (nada en curso) | | | | |

## Siguiente paso exacto
1. El dueño responde las 11 decisiones de la sección 8 de `src/docs/ARQUITECTURA_FLUJO.md`.
2. Construir según la sección 7: hito 0.1a (guardar cada foto al tomarla y PIN al equipo), 0.2 (motor de plantillas compartido), 1.1 (la cabina usa la plantilla real); en paralelo, prueba técnica de escritorio (3a).

## Decisiones pendientes del dueño
1. Tope de impresiones por evento: qué ve el invitado al llegar al límite, qué pasa en modo "solo impresión", si las copias adicionales cuentan (se presentan en el chat).
2. Quién puede pedir copias adicionales (operador, invitado o ambos).
3. Datos personales de invitados (D9), aprobación general del esqueleto (D1) y cambios a PRODUCT.md (D11).
4. Visto bueno a la prueba técnica de escritorio (D8).
Ya respondidas el 2026-11-16: D2, D3, D4, D5, D6, textos en "tú"; D7 baja de prioridad. Ver `src/docs/ARQUITECTURA_FLUJO.md` §8.

## Cómo probar / publicar
Páginas estáticas: abrir `src/pages/<pantalla>/index.html` en el navegador (doble clic). Entrada del operador: `src/pages/04-lista-eventos/index.html`. Sin build ni servidor. Al cerrar una tarea, el checklist está en `CLAUDE.md` §3 (incluye commit y push a `main`).

## Cómo retomar (frase para decirle a Claude)
"Lee RETOMAR.md y continúa donde quedó la sesión anterior."

## Advertencias
- El repo es público: nada de `TIEMPO.md`, `MEMORIA-PROYECTO.md` ni el cerebro en git (ya están en `.gitignore`).
- Las reglas del repo piden commit y push a `main` al cerrar cada tarea; las reglas globales del dueño piden no commitear "para guardar" por límite de uso. Manda: commit solo al cerrar una tarea terminada y verificada.
- Las cámaras del navegador cambian de identificador entre sesiones; si la guardada no responde, la cabina cae a la del equipo.
- Pendiente de prueba del dueño con cámara real: lo resuelto el 2026-09-16 en `01-camera-flow` y C3.

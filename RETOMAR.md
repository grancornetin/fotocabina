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
- Espacio de trabajo con agentes creado hoy (2026-11-16): este archivo, `src/docs/proyecto-ia/`, cerebro local `cerebro-fotocabina/`, orquestador en `.claude/agents/`.

## En curso / a medias
| Tarea | Agente | Estado | Dónde quedó (archivo y paso) | Hacia dónde iba |
|---|---|---|---|---|
| Esqueleto de arquitectura (flujo único: usuarios, eventos, ajustes, conexiones entre pantallas) | orquestador + equipo | por empezar | Equipo de 17 agentes instalado y commiteado; falta producir el esqueleto | Documento maestro en `src/docs/ARQUITECTURA_FLUJO.md` antes de construir C4 y siguientes |

## Siguiente paso exacto
1. El orquestador dirige al equipo para producir el esqueleto de arquitectura (`src/docs/ARQUITECTURA_FLUJO.md`): tipos de usuario, funciones por pantalla, modelo del evento y cómo cada ajuste afecta al resto, mapa de conexiones, huecos y orden de construcción.
2. El dueño revisa el esqueleto en el chat.
3. Con el esqueleto aprobado, seguir con las pantallas (C4 impresora u otra según el orden definido).

## Decisiones pendientes del dueño
1. Aprobar el esqueleto de arquitectura cuando esté listo.

## Cómo probar / publicar
Páginas estáticas: abrir `src/pages/<pantalla>/index.html` en el navegador (doble clic). Entrada del operador: `src/pages/04-lista-eventos/index.html`. Sin build ni servidor. Al cerrar una tarea, el checklist está en `CLAUDE.md` §3 (incluye commit y push a `main`).

## Cómo retomar (frase para decirle a Claude)
"Lee RETOMAR.md y continúa donde quedó la sesión anterior."

## Advertencias
- El repo es público: nada de `TIEMPO.md`, `MEMORIA-PROYECTO.md` ni el cerebro en git (ya están en `.gitignore`).
- Las reglas del repo piden commit y push a `main` al cerrar cada tarea; las reglas globales del dueño piden no commitear "para guardar" por límite de uso. Manda: commit solo al cerrar una tarea terminada y verificada.
- Las cámaras del navegador cambian de identificador entre sesiones; si la guardada no responde, la cabina cae a la del equipo.
- Pendiente de prueba del dueño con cámara real: lo resuelto el 2026-09-16 en `01-camera-flow` y C3.

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

**Actualizado:** 2026-11-17 (hito 1.3 cerrado y commiteado)  ·  **Cuenta/sesión:** orquestador  ·  **Rama:** main

## Estado en una frase
Etapa 1 (uso propio), fase de construcción (decisión 2026-11-16: antes de más pantallas se diseña el esqueleto completo) de pantallas: cabina del invitado, editor de plantillas, lista de eventos, crear evento y cámara ya funcionan en el navegador; falta impresora, panel en vivo, servidor local de entrega y toda la parte de hardware real. Último commit de código: `57930dd` (C3 cámara, 2026-09-25). Sin cambios pendientes de código.

## Hecho y verificado
- Cabina del invitado `01-camera-flow`: A1, A3–A7, A11 migradas; A8 (QR) solo maqueta. Probado por el dueño con cámara real el 2026-09-16.
- Editor de plantillas `03-editor-plantillas`: Fases 1–4 completas y aprobadas para producción (2026-09-17). `02-layout-editor` descartado (no se borra, no se toca).
- C1 lista de eventos (`04-lista-eventos`), C2 crear evento (`05-crear-evento`), C3 cámara (dentro de Ajustes de la cabina), conectadas por el almacén compartido `pages/shared/almacen-eventos.js`.
- Documentación al día hasta C3 (mapa, flujo de navegación, contexto de producto).
- Esqueleto de arquitectura escrito y revisado (2026-11-16): `src/docs/ARQUITECTURA_FLUJO.md`. Hallazgo mayor: la cabina no dibuja la plantilla real del evento.
- Hito 0.1a (2026-11-16): cada foto se guarda al tomarla (sesiones "incompleta"/"fallida") y PIN al equipo (`shared/equipo.js`, hash, creación obligatoria al primer lanzamiento, bloqueo 5 min tras 5 intentos). Probado con Chrome headless (arnés temporal fuera del repo), consola sin errores, revisado por Code Reviewer. Pendiente de prueba del dueño con cámara real. Detalle y hallazgos abiertos: `ARQUITECTURA_FLUJO.md` §7.3.
- Hito 0.2 (motor de plantillas compartido, commit `ad14c88`) y hito 1.1 (la cabina dibuja la plantilla real del evento; n.º de fotos y marco salen de la plantilla; hoja 4×6 con dos tiras al imprimir; sin plantilla válida "Lanzar" queda bloqueado con aviso y botón al editor). Revisados por Code Reviewer; certificados por Evidence Collector (capturas, consola sin errores, editor igual: 140 comparaciones de píxeles) y Reality Checker (LISTO CON RESERVAS). Detalle y reservas: `ARQUITECTURA_FLUJO.md` §7.4 y §7.2.
- Hito 0.1b (2026-11-17): repositorio v2 de eventos (migración con respaldo confirmado, aviso si el navegador se queda sin espacio), plantilla congelada por sesión (las sesiones viejas conservan su diseño, las nuevas usan la edición nueva), recorte de la cámara 16:9 sin estirar, eventos sin plantilla siguen bloqueados (1A). Evidence Collector 6/6 PASA con Chrome real y cámaras simuladas; Reality Checker aprobó el código. Los arreglos finales de datos (R1-R3, recarga con copia congelada) los probó solo quien los escribió (t1-t7 pasan): sin recertificación independiente. Detalle: `ARQUITECTURA_FLUJO.md` §7.5.
- Hito 0.3 (2026-11-17): validador único "evento listo para lanzar" (`shared/validador-evento.js`), usado por la lista (marca "No lanzable" con motivo) y la cabina (bloquea Lanzar con motivo). Solo digital sin servidor y impresora no comprobable solo AVISAN; disco bajo 200 MB bloquea (regla aún inactiva en navegador). Certificado: Evidence Collector (con recertificación de las correcciones D1 y D3, 42/42) y Reality Checker (listo con reservas); 55/55 pruebas en `shared/tests-validador.html`. Reservas abiertas: `ARQUITECTURA_FLUJO.md` §7.6.
- Hito 1.2 (2026-11-17): editar evento (`05-crear-evento?editar=<id>`, botón "Editar evento" en la lista), varias plantillas habilitadas con "por defecto", tope de hojas (solo modo ambos), configuración congelada de una sola fuente (`ValidadorEvento.configuracionEfectiva`) y la cabina respeta el modo de entrega (solo impresión sin QR/descarga/GIF; solo digital sin Imprimir). Certificado: Evidence Collector 9/9 y Reality Checker (listo con reservas); 64/64 en `tests-validador.html`. Reservas: `ARQUITECTURA_FLUJO.md` §7.7.
- Hito 1.3 (2026-11-17): ciclo de vida del evento (En curso automático al lanzar, Terminar evento, Reabrir, conteo real y aviso al eliminar), con correcciones de carreras entre pestañas, diálogos accesibles y editor que no pisa el estado. Certificado: Evidence Collector (todo pasa) y Reality Checker (LISTO CON RESERVAS). Reservas: `ARQUITECTURA_FLUJO.md` §7.8 (botón lima Lanzar por tarjeta y viewport móvil de la cabina ya existían; faltan pruebas automáticas de las funciones nuevas). Falta prueba manual del dueño.
- Espacio de trabajo con agentes creado (2026-11-16) (2026-11-16): este archivo, `src/docs/proyecto-ia/`, cerebro local `cerebro-fotocabina/`, orquestador en `.claude/agents/`.

## En curso / a medias
| Tarea | Agente | Estado | Dónde quedó (archivo y paso) | Hacia dónde iba |
|---|---|---|---|---|

## Siguiente paso exacto
1. El dueño prueba a mano con cámara real (idealmente 16:9) y confirma que las caras no se ven estiradas.
2. Construir según `ARQUITECTURA_FLUJO.md` §7: 1.6 (respaldo y restauración); luego 3a/3 (impresión) y C5 con A12.

## Decisiones pendientes del dueño
1. Visto bueno a la prueba técnica de escritorio (D8), más adelante, al llegar a impresión.
2. Redacción final del aviso de uso de fotos (se propone un texto al construir la pantalla de bienvenida).
Todas las demás decisiones del esqueleto están respondidas (2026-11-16). Ver `src/docs/ARQUITECTURA_FLUJO.md` §8.

## Cómo probar / publicar
Páginas estáticas: abrir `src/pages/<pantalla>/index.html` en el navegador (doble clic). Entrada del operador: `src/pages/04-lista-eventos/index.html`. Sin build ni servidor. Al cerrar una tarea, el checklist está en `CLAUDE.md` §3 (incluye commit y push a `main`).

## Cómo retomar (frase para decirle a Claude)
"Lee RETOMAR.md y continúa donde quedó la sesión anterior."

## Advertencias
- El repo es público: nada de `TIEMPO.md`, `MEMORIA-PROYECTO.md` ni el cerebro en git (ya están en `.gitignore`).
- Las reglas del repo piden commit y push a `main` al cerrar cada tarea; las reglas globales del dueño piden no commitear "para guardar" por límite de uso. Manda: commit solo al cerrar una tarea terminada y verificada.
- Las cámaras del navegador cambian de identificador entre sesiones; si la guardada no responde, la cabina cae a la del equipo.
- Pendiente de prueba del dueño con cámara real: lo resuelto el 2026-09-16 en `01-camera-flow` y C3.


# Bitácora de FotoCabina

> **Qué es:** el registro de todo cambio hecho en el proyecto. Cualquier agente (o el dueño) debe poder abrirla y saber exactamente dónde está el proyecto, cómo avanzó y qué queda sin resolver.
> **Quién la mantiene:** TODO agente que mueva algo. Es obligatorio y se hace en el mismo momento del cambio, no "después".

## Cómo usarla
1. **Para entender el proyecto:** lee primero el bloque "Estado actual", después las últimas 10 entradas.
2. **Para registrar:** agrega una entrada **al final** de "Registro" (nunca reescribas entradas viejas; si algo cambia, agrega una entrada nueva que lo corrija).
3. **Cuándo:** al cerrar un hito, al tomar una decisión, al descartar algo, al encontrar un problema, al publicar o al pausar. Un cambio sin entrada no existe.
4. **Qué va en cada entrada:** fecha, quién (agente y sesión), qué cambió (1–2 líneas), **por qué**, dónde verlo (archivo, commit o documento) y estado.
5. **Qué no va:** claves, contraseñas, datos personales, detalle explotable de fallas de seguridad (di "hallazgo de seguridad, ver Tablero").
6. **Al cerrar:** actualiza el bloque "Estado actual" y "Sin resolver".
7. **Mantención:** cada ~10 entradas, el orquestador hace una retrospectiva de 5 líneas (qué se repitió, qué se olvidó, qué regla falta) y la anota como entrada tipo `retro`. Si una regla de este archivo estorba, se mejora aquí mismo.

## Estado actual
- **Fase:** construccion
- **Última actualización:** 2026-11-16
- **Dónde estamos:** Etapa 1 (uso propio). Cabina, editor de plantillas, lista de eventos, crear evento y cámara (C3) construidos. Faltan impresora (C4), panel en vivo (C5), detalle de sesión (C6), errores del operador (C7), selección de plantilla (A2) e imprimiendo (A9). Detalle por pantalla en `src/docs/MAPA_DE_PANTALLAS.md`.
- **Publicado en producción:** nada aún (prototipo web; sin app de escritorio ni hardware real conectado). Último commit: `57930dd`.

## Sin resolver
| # | Pendiente | Quién lo tiene | Desde | Dónde ver |
|---|---|---|---|---|
| 1 | Probar con cámara real lo resuelto el 2026-09-16 y C3 | dueño | 2026-09-16 | `src/pages/01-camera-flow/README.md` |
| 2 | La cabina debe leer el n.º de fotos de la plantilla real (hoy es ajuste manual) | sin asignar | 2026-09-21 | `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §3.9 punto 4 |
| 3 | Servidor local real para el QR de entrega (A8 es maqueta) | sin asignar | 2026-09-16 | Fase D, contexto §3.6 |

## Registro
<!-- Formato: ## [AAAA-MM-DD HH:MM] tipo | título   (tipo: cambio · decisión · descarte · hallazgo · publicación · pausa · retro) -->

## [2026-11-16] cambio | Se crea el espacio de trabajo
- **Quién:** orquestador (skill nuevo-proyecto)
- **Qué:** se crean Bitácora, Tablero, RETOMAR, Ideas, Equipo, Tiempo, Memoria del proyecto y el esqueleto del cerebro.
- **Por qué:** que cualquier agente o cuenta pueda continuar sin perder contexto.
- **Dónde verlo:** `src/docs/proyecto-ia/`, `RETOMAR.md`, `cerebro-fotocabina/`
- **Estado:** hecho

## [2026-11-16] cambio | Se adopta el proyecto existente (/actualizar-proyecto)
- **Quién:** orquestador
- **Qué:** el proyecto ya tenía buena documentación en `src/` y `CLAUDE.md`. Se adoptó sin mover nada: `src/PRODUCT.md`, `src/DESIGN.md`, `src/docs/MAPA_DE_PANTALLAS.md` y `src/docs/FLUJO_NAVEGACION.md` siguen siendo la fuente. El historial técnico por commit queda en `git log`; esta Bitácora lleva solo el porqué y el quién desde hoy.
- **Por qué:** poder cambiar de cuenta sin perder el hilo, y que varios agentes no se pisen.
- **Decisión del dueño:** `proyecto-ia/` vive en `src/docs/proyecto-ia/` (no en la raíz) para respetar la regla "todo en `src/`"; `RETOMAR.md` queda en la raíz porque los hooks lo buscan ahí. Se actualizó esa regla en `CLAUDE.md`.
- **Dónde verlo:** `RETOMAR.md`, `CLAUDE.md` (bloque NAVAJA-IA), `.gitignore`.
- **Estado:** hecho, sin commit.

## [2026-11-16] decisión | Equipo ampliado y regla de commit a main
- **Quién:** dueño, vía orquestador
- **Qué:** equipo de 17 agentes instalado en `.claude/agents/` (arquitectura, diseño, construcción, calidad). Commit y push a `main` siempre, con todo al día.
- **Por qué:** el producto es un solo flujo interconectado (usuarios, evento, ajustes, pantallas); se diseña el esqueleto completo antes de seguir construyendo, para no rehacer después.
- **Dónde verlo:** `src/docs/proyecto-ia/EQUIPO.md`
- **Estado:** hecho

## [2026-11-16] decision | Esqueleto de arquitectura producido
- **Quién:** orquestador, con revisión de Reality Checker y Software Architect
- **Qué:** nuevo documento maestro `src/docs/ARQUITECTURA_FLUJO.md` (usuarios, 4 capas de configuración, matriz de dependencias, validador, mapa de flujos con pantallas nuevas A12/C2c/C8-C11, contrato de datos, hallazgos, orden de construcción y 11 decisiones para el dueño). Correcciones de texto en MAPA, FLUJO y DSLRBOOTH §2; el documento se suma a CLAUDE.md §1 y src/README.md.
- **Por qué:** el producto es un solo flujo interconectado; se diseña antes de construir más pantallas.
- **Hallazgo mayor:** la cabina no dibuja la plantilla real del evento al componer.
- **Dónde verlo:** `src/docs/ARQUITECTURA_FLUJO.md`
- **Estado:** hecho como propuesta; esperan las 11 decisiones del dueño. Sin código tocado.

## [2026-11-16] decisión | Respuestas del dueño al esqueleto (primera tanda)
- **Quién:** dueño, vía sesión principal
- **Qué:** aprobó D3, D4, D6 y textos en "tú"; ajustó D2 (también bloquea en "impresión y digital"); cambió D5 (copias adicionales siempre accesibles al operador; impresión automática configurable); agregó tope de impresiones por evento y conteo de hojas para costos. Respaldo baja de prioridad (datos de prueba).
- **Por qué:** la impresión es el costo real del evento y las sesiones suelen pedir más de una copia.
- **Dónde verlo:** `src/docs/ARQUITECTURA_FLUJO.md` §8 (bloque "Respuestas del dueño").
- **Estado:** hecho; quedan decisiones nuevas sobre el tope de impresiones y las pendientes D1, D9, D11.

## [2026-11-16] decisión | Lógica del tope de impresiones
- **Quién:** dueño, vía sesión principal
- **Qué:** al llegar al tope el invitado ve un mensaje amable antes de las fotos y sigue solo digital; el tope solo existe si el evento incluye entrega digital; las copias adicionales cuentan para el tope; solo el operador pide copias adicionales.
- **Por qué:** el límite protege el costo de papel y siempre debe haber una forma de llevarse las fotos.
- **Dónde verlo:** `src/docs/ARQUITECTURA_FLUJO.md` §8.
- **Estado:** hecho


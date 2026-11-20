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

## [2026-11-16] decisión | Esqueleto aprobado; aviso de uso de fotos
- **Quién:** dueño, vía sesión principal
- **Qué:** aprobó el esqueleto de arquitectura. No se piden datos personales; la cabina muestra un aviso: las fotos pueden usarse en redes y anuncios del negocio y usar la cabina implica aceptarlo. Se actualizó `src/PRODUCT.md` (con permiso del dueño): evidencia corregida y mínimo de accesibilidad.
- **Por qué:** la cabina es parte del negocio del operador y sus fotos son material de difusión.
- **Dónde verlo:** `src/PRODUCT.md`, `src/docs/ARQUITECTURA_FLUJO.md` §8.
- **Estado:** hecho

## [2026-11-16] hito | 0.1a construido: foto guardada al tomarla y PIN al equipo
- **Quién:** orquestador (con revisión de Code Reviewer)
- **Qué:** cada foto se guarda en disco en el instante de tomarla; las sesiones cortadas quedan "incompletas" y se ven en la galería; el PIN es del equipo (hash, creación obligatoria al primer lanzamiento, bloqueo de 5 min tras 5 intentos); voseo corregido en `01-camera-flow`.
- **Por qué:** un corte de luz perdía las fotos de la sesión en curso, y el PIN 1234 era público y visible.
- **Dónde verlo:** `src/pages/01-camera-flow/`, `src/pages/shared/equipo.js`, `src/docs/ARQUITECTURA_FLUJO.md` §7.3.
- **Estado:** hecho y probado con Chrome headless; falta que el dueño lo pruebe a mano con cámara real.

## [2026-11-16] hito | 0.2 construido: motor de plantillas compartido (pendiente de cierre)
- **Quién:** frontend (dirigido por orquestador); revisó Code Reviewer; certificó Evidence Collector (editor igual a HEAD en 140 comparaciones de píxeles, consola sin errores).
- **Qué:** el dibujo de plantillas pasó a `src/pages/shared/motor-plantillas.js`; el editor lo usa vía `render.js`. Nuevo lector `shared/almacen-plantillas.js` (solo lectura).
- **Por qué:** la cabina debe dibujar la plantilla real sin duplicar el motor.
- **Estado:** hecho (commit `ad14c88`).

## [2026-11-16] hito | 1.1 construido: la cabina dibuja la plantilla real del evento
- **Quién:** frontend (dirigido por orquestador); revisó Code Reviewer (6 observaciones corregidas); certificó Evidence Collector (sesiones completas 2/3/4 fotos, bloqueos, demo, consola limpia) y Reality Checker (LISTO CON RESERVAS).
- **Qué:** nº de fotos, marco de encuadre y diseño de la tira salen de la plantilla del evento; Imprimir usa la hoja con dos tiras; sin plantilla válida "Lanzar" se bloquea con aviso y botón al editor; sin evento queda el diseño antiguo (demo).
- **Por qué:** el trabajo del editor no llegaba a la foto del invitado (hallazgo 1 del esqueleto).
- **Reservas abiertas:** `capture()` estira la imagen con cámaras 16:9; eventos antiguos sin `plantillaId` quedan bloqueados; plantilla congelada al lanzar pendiente (0.1b); excepción preexistente en el editor al renombrar desde la barra.
- **Dónde verlo:** `src/pages/01-camera-flow/`, `src/docs/ARQUITECTURA_FLUJO.md` §7.4.
- **Estado:** hecho; falta la prueba del dueño con cámara real.

## [2026-11-16] hito | 0.1b construido y certificado: repositorio v2, plantilla congelada por sesión y recorte de cámara
- **Quién:** orquestador + equipo (frontend construyó; Code Reviewer corrigió; Evidence Collector certificó 6/6; Reality Checker aprobó el código y bloqueó solo la documentación, ya hecha).
- **Qué:** los eventos pasan al formato v2 con migración automática y respaldo; al lanzar se congela la plantilla y cada sesión guarda la copia con que se tomó (editar la plantilla aplica a la sesión siguiente); número de sesión con contador propio del evento; la foto se recorta al marco sin estirarse (16:9 incluido); un evento sin plantilla queda con "Lanzar" bloqueado (decisión 1A); eliminar un evento borra sus sesiones y archivos, y duplicar lo clona completo. `AlmacenEventos` quedó síncrono, no asíncrono como decía el plan.
- **Por qué:** las fotos 16:9 salían deformadas, editar una plantilla cambiaba sesiones ya hechas, el número de sesión podía repetirse y borrar un evento dejaba fotos huérfanas.
- **Reservas abiertas:** contador no atómico entre pestañas; `almacen-sesiones.js` debería vivir en `shared/`; copias congeladas solo se limpian al borrar el evento; impresión automática y copias aún sin conectar; puente temporal del editor al formato v2; falta la prueba manual del dueño con cámara real y 16:9.
- **Dónde verlo:** `src/docs/ARQUITECTURA_FLUJO.md` §7.5, `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §3.12, `src/pages/shared/`, `src/pages/01-camera-flow/`, `src/pages/04-lista-eventos/`, `src/pages/05-crear-evento/`.
- **Estado:** hecho y certificado; pendiente de commit y de la prueba del dueño con cámara real.

## [2026-11-17] hito | 0.3 construido: validador único "evento listo para lanzar"
- **Quién:** orquestador + equipo (frontend construyó; Code Reviewer corrigió; Evidence Collector certificó; Reality Checker: LISTO CON RESERVAS, su único bloqueo era la documentación, ya hecha).
- **Qué:** una sola revisión (`shared/validador-evento.js`) decide si un evento se puede lanzar y por qué. La lista de eventos marca "No lanzable" con el motivo y la cabina bloquea "Lanzar evento" explicando el bloqueo. Sin servidor local, la entrega solo digital avisa (no bloquea); la impresora no comprobable en el navegador avisa; el disco bloquea bajo 200 MB (regla inactiva hasta que haya dato real). Pruebas sin dependencias: 55 de 55.
- **Por qué:** las reglas de "se puede lanzar" estaban desperdigadas (cámara en la cabina, plantilla en otro lado) y una regla cambiada en un sitio no llegaba al otro.
- **Reservas abiertas:** la cabina duplica su configuración congelada (debe salir del validador); endurecer estados de impresora y cámaras inválidas; acotar el ritmo; reutilizar la regla de tira 2 × 6 del motor; mostrar ritmo y resumen (C2c); pasar el espacio libre real; botón "Lanzar" lima aún visible en una tarjeta "No lanzable"; falta "Reabrir" para archivados (decisión del dueño, hito 1.3); el tope de hojas aún no lo configura ninguna pantalla (hito 1.2). Detalle en `ARQUITECTURA_FLUJO.md` §7.6.
- **Dónde verlo:** `src/pages/shared/validador-evento.js`, `src/pages/shared/tests-validador.html`, `src/pages/01-camera-flow/`, `src/pages/04-lista-eventos/`, `src/docs/ARQUITECTURA_FLUJO.md` §2.3, §2.4 y §7.6.
- **Estado:** hecho y certificado; pendiente de commit y de la prueba del dueño en el navegador.

## [2026-11-17] hito | 1.2 construido: editar evento, varias plantillas, tope de hojas y resultado según el modo de entrega
- **Quién:** orquestador + equipo (frontend construyó y probó; Code Reviewer corrigió; escritor técnico dejó la documentación). Faltan Evidence Collector y Reality Checker.
- **Qué:** (1) cada evento se puede **editar** desde su tarjeta ("Editar evento" abre `05-crear-evento?editar=<id>`): conserva id, estado, sesiones y copia congelada, avisa si hay cambios sin guardar o si otra pestaña cambió el evento, y en un evento en curso los cambios valen desde la sesión siguiente. (2) Un evento puede **habilitar varias plantillas** con una "por defecto" (la cabina usa solo esa hasta que exista A2). (3) **Tope de hojas** por evento, solo con modo "Ambos"; se conserva al cambiar de modo. (4) `ValidadorEvento.configuracionEfectiva` es la única fuente de la configuración congelada (la cabina dejó de armarla a mano). (5) **A7 respeta el modo congelado en la sesión:** solo impresión sin QR, descarga, compartir ni GIF; solo digital sin "Imprimir".
- **Por qué:** el modo de entrega, las copias y el tope se guardaban y nadie los leía; un error al crear un evento solo se arreglaba duplicando y borrando; la configuración congelada estaba duplicada entre la cabina y el validador.
- **Decisiones de bajo riesgo tomadas por defecto (el dueño puede cambiarlas):** solo impresión no genera GIF; el tope solo existe con "Ambos"; los archivados se pueden editar; la demostración equivale a "Ambos" con 1 copia; el tope se conserva al cambiar de modo. Detalle en `ARQUITECTURA_FLUJO.md` sección 8.
- **Reservas abiertas:** A2 (elegir entre plantillas habilitadas, hito 2); avisos que necesitan impresora (C4); `AlmacenEventos` sigue síncrono; conteo de hojas, mensaje al llegar al tope, impresión automática real y copias adicionales (hito de impresión); `DESTINOS.EDITAR_EVENTO` del validador sin conectar al formulario de edición; botón "Reabrir" de archivados (hito 1.3). Detalle en `ARQUITECTURA_FLUJO.md` §7.7.
- **Dónde verlo:** `src/pages/05-crear-evento/`, `src/pages/04-lista-eventos/`, `src/pages/01-camera-flow/`, `src/pages/shared/validador-evento.js` (64 casos en `tests-validador.html`), `src/docs/ARQUITECTURA_FLUJO.md` §6, §7.7 y §8, `src/docs/FLUJO_NAVEGACION.md` ("C1 → C2 en edición").
- **Estado:** HECHO, certificado (Evidence Collector 9/9, Reality Checker listo con reservas); sin commit; falta la prueba manual del dueño.

## [2026-11-17] hito | 1.3 construido: ciclo de vida del evento (en curso automático, Terminar evento, Reabrir)
- **Quién:** orquestador + equipo (frontend construyó y probó; escritor técnico dejó la documentación). Faltan Code Reviewer, Evidence Collector y Reality Checker.
- **Qué:** (1) "Lanzar evento" en la cabina pasa el evento de Próximo a **En curso** (sin tocar a otros eventos En curso). (2) Nueva sección **Ajustes › Evento** en la cabina con **"Terminar evento"** (con confirmación): archiva el evento y vuelve a la lista en la pestaña Archivados. (3) La lista tiene **"Terminar evento"** en las tarjetas En curso y **"Reabrir"** en las Archivadas (sin confirmación; vuelve a En curso si el evento se lanzó, a Próximos si no). (4) Cada tarjeta cuenta las sesiones reales, el aviso de eliminar da el número exacto y la lista se refresca sola cuando otra pestaña cambia los eventos. (5) Un evento terminado en otra pestaña ya no recibe sesiones nuevas.
- **Por qué:** "Lanzar" no cambiaba el estado ni existía forma de cerrar un evento ni de arrepentirse (hallazgo 7 de `ARQUITECTURA_FLUJO.md` §6.1 y reserva 9 de §7.6).
- **Decisiones de bajo riesgo tomadas por defecto (a confirmar por el dueño):** pueden coexistir varios eventos En curso (se unificó la contradicción entre §2.3 y §2.6); "Reabrir" sin confirmación y con destino según si el evento llegó a lanzarse; un Próximo se puede archivar; terminar desde la cabina vuelve a la lista en Archivados porque el resumen C10 aún no existe. Detalle en `ARQUITECTURA_FLUJO.md` §8 y §7.8.
- **Reservas abiertas:** el aviso del validador "Ir a la lista" aún no abre la pestaña Archivados; el resumen C10 (hito 7) reemplazará la salida de "Terminar evento"; certificación independiente y prueba manual del dueño. Detalle en `ARQUITECTURA_FLUJO.md` §7.8.
- **Dónde verlo:** `src/pages/shared/almacen-eventos.js` y `README.md` ("Ciclo de vida del evento"), `src/pages/04-lista-eventos/`, `src/pages/01-camera-flow/`, `src/docs/FLUJO_NAVEGACION.md` (C1 y C2b), `src/docs/MAPA_DE_PANTALLAS.md` (C1 y C2b), `src/docs/ARQUITECTURA_FLUJO.md` §2.3, §2.6, §7.8 y §8. Pruebas propias del constructor en `C:/tmp/h13` (fuera del repo).
- **Estado:** construido, en certificación independiente; sin commit; falta la prueba manual del dueño.

## [2026-11-17] hito | 1.3 cerrado: ciclo de vida del evento, certificado
- **Quién:** orquestador + equipo (frontend corrigió; Evidence Collector certificó; Reality Checker: LISTO CON RESERVAS).
- **Qué:** se corrigieron las carreras entre pestañas (eliminar y lanzar releen el evento), los diálogos de confirmación son accesibles (Escape, foco, trampa de foco), el editor ya no pisa el estado del evento y reabrir decide solo por `lanzadoEn`. Decisiones del 1.3 en `DSLRBOOTH_PRODUCT_CONTEXT.md` 3.13.
- **Reservas:** botón lima "Lanzar" por tarjeta en la lista y viewport de la cabina en móvil (ya existían); faltan pruebas automáticas de las funciones nuevas; prueba manual del dueño.
- **Dónde verlo:** `src/pages/shared/almacen-eventos.js`, `src/pages/04-lista-eventos/`, `src/pages/01-camera-flow/`, `src/docs/ARQUITECTURA_FLUJO.md` 7.8.
- **Estado:** HECHO y certificado; commiteado.

## [2026-11-18] hito | 1.6 cerrado: respaldo y restauración
- **Quién:** orquestador + equipo (frontend construyó; Code Reviewer corrigió; Evidence Collector certificó; Reality Checker: LISTO CON RESERVAS).
- **Qué:** pantalla nueva Respaldo (`06-respaldo`) abierta desde el menú de la lista: crea un ZIP con eventos, plantillas, sesiones y fotos (sin PIN), restaura sumando o reemplazando todo (todo o nada), exportar/importar un evento y aviso de poco espacio. Pruebas automáticas 104/104 (incluye ciclo de vida del evento).
- **Por qué:** todo vivía solo en el navegador; borrar datos del sitio lo perdía todo (hallazgo 4, decisión D7).
- **Reservas:** fotos sin cifrar y sin PIN; restaurar con editor abierto puede pisar; sin prueba de varios GB; prueba manual del dueño pendiente. Detalle en `ARQUITECTURA_FLUJO.md` 7.9.
- **Estado:** HECHO, certificado; commiteado.

## [2026-11-18] hito | B cerrado: un solo lima en la lista y cabina sin desborde móvil
- **Quién:** orquestador + equipo (frontend construyó; Evidence Collector certificó comparando contra la versión anterior en 390 y 1366 px, con sesión completa de invitado; sin Reality Checker aparte por ser un cambio de 2 líneas de estilo, revisado por el orquestador).
- **Qué:** "Lanzar" de cada tarjeta pasa a botón normal (el lima queda para "Crear evento"); la cabina 01 ya no mide 780 px a 390 px (`overflow: hidden` en `.cabin`). Sin cambios de comportamiento.
- **Observación abierta:** un evento "No lanzable" aún muestra "Lanzar" habilitado y lleva a la cabina, que muestra el bloqueo.
- **Estado:** HECHO, certificado; commiteado.

## 2026-11-18 · Mini-hito A: "Lanzar" deshabilitado en eventos "No lanzable"
- **Quién:** orquestador (construyó), Code Reviewer (sin bloqueantes), Evidence Collector (PASA 8 de 8 en Chrome real, 390 y 1366 px, claro y oscuro, consola limpia, un solo lima, 104/104 pruebas).
- **Qué:** decisión del dueño (opción B): en la lista 04, el botón "Lanzar" de una tarjeta que el validador marca "No lanzable" queda deshabilitado y el motivo se lee en la propia tarjeta (mismo validador, sin lógica duplicada). Tras la revisión se agregó una guarda (sin motor de plantillas no se deshabilita nada) y la opacidad pasó a 0,4 (DESIGN.md); esos dos retoques mínimos no se volvieron a probar en navegador.
- **Observación cerrada:** la del hito B ("No lanzable" con Lanzar habilitado).

## 2026-11-18 · Hito 3: impresión de punta a punta con impresora simulada
- **Quién:** orquestador, Frontend Developer (construyó y corrigió), Code Reviewer (2 bloqueantes y 6 importantes, corregidos; revisión final sin bloqueantes), Evidence Collector (recertificación en Chrome real, 390 y 1366 px, 146/146), Reality Checker (LISTO CON RESERVAS).
- **Qué:** `shared/impresion.js` (adaptador simulado, cola persistente, conteo y tope de hojas), A9, A10 de impresora, impresión automática, copias adicionales solo del operador con PIN, reimpresión desde la galería, panel C4 en Ajustes, validador D2 conectado. Tras la certificación se corrigieron 3 detalles más (la impresora que cuenta al reintentar, un fallo tardío que revivía un trabajo retenido, un segundo botón lima en el detalle de galería); pruebas 146/146, casos 1, 3, 4 y 6 repetidos.
- **Pendiente:** adaptador real (prueba técnica de escritorio D8, preparada en `src/docs/PRUEBA_TECNICA_ESCRITORIO.md`, no ejecutada), C5/C6/C7, conteo en el respaldo. Reservas en `ARQUITECTURA_FLUJO.md` §7.10.

## 2026-11-18 · Hito 3b: hojas en el respaldo, rollo acumulado, copias sin PIN y borrar con impresión automática
- **Quién:** orquestador (construyó y corrigió), Code Reviewer (sin bloqueantes; 5 importantes corregidos), Evidence Collector (Chrome real, todo pasa), Reality Checker; el doc de la prueba D8 lo redactó el Desktop App Engineer.
- **Qué:** el conteo de hojas (por evento y rollo por impresora) entra al respaldo y a exportar/importar evento; el rollo se acumula entre eventos y solo "Rollo nuevo" (con confirmación) lo reinicia; "Copias adicionales" sin PIN y solo en modo operador (galería); con impresión automática el trabajo espera la confirmación del invitado y "Borrar y empezar de nuevo" lo cancela sin gastar hoja y lleva al inicio; `PRUEBA_TECNICA_ESCRITORIO.md` personalizada a HiTi P510L, SELPHY CP1500 y EOS T5 (no ejecutada).
- **Dónde verlo:** `src/pages/shared/{impresion,respaldo}.js`, `src/pages/01-camera-flow/`, `src/pages/06-respaldo/`, `src/docs/ARQUITECTURA_FLUJO.md` §7.11, `DSLRBOOTH_PRODUCT_CONTEXT.md` 3.16. Pruebas: `tests-validador.html`.

## 2026-11-19 · Hito 4 (bloque 1): programa de escritorio, cámara Canon e impresión silenciosa (certificado con reservas)
- **Quién:** orquestador-escritorio (construyó y probó), Code Reviewer (rechazó con 4 graves; re-revisión aprobó con reservas), Evidence Collector, Desktop App Engineer (correcciones), Reality Checker.
- **Qué:** `src/escritorio/` (Electron): ventana con las pantallas actuales, cámara Canon T5 por EDSDK (proceso aparte, koffi) con vista previa y foto completa dentro de la cabina, respaldo a cámara web, y adaptador real de impresión por driver de Windows que se enchufa a la cola existente (`shared/impresion-escritorio.js`, `shared/camara-escritorio.js`). Decisión Electron vs Tauri: Electron (Tauri exige Rust y Visual Studio Build Tools).
- **Por qué:** el dueño deja la suscripción de dslrBooth y termina su propia app, sin costo.
- **Dónde verlo:** `src/escritorio/README.md`, `ARQUITECTURA_FLUJO.md` §7.12, `DSLRBOOTH_PRODUCT_CONTEXT.md` 3.17, `PUNTO-DE-RETOMA-escritorio.md`. Pruebas: 175/175; sesión real de 3 fotos con la T5; impresión de punta a punta solo con la impresora virtual XPS.
- **Incidente:** antes de la instrucción del dueño se enviaron 2 trabajos de prueba a la Epson L5190 (apagada); quedaron cancelados, no salió nada.
- **Certificación independiente (2026-11-19):** Code Reviewer APROBADO CON RESERVAS (4 graves y 4 medias corregidas); Evidence Collector PASA lo probado (webcam e impresora virtual XPS, 175/175; T5 desconectada, no verificada); tras sus hallazgos H1-H6 y bajo 9 se corrigieron (comilla simple en nombres de impresora, trabajo pegado en el spooler sin reintento, foto vieja, temporizador, oyente duplicado) y Reality Checker dio LISTO CON RESERVAS. Reservas: T5 real sin recertificar tras las correcciones; sin papel real ni HiTi; rama `trabajo-pegado` solo leída; selector de cámara muestra "Canon" aunque se use webcam.
- **Pendiente:** prueba con papel real (la pide el dueño), apagado automático de la cámara sin probar, decisión de empaquetado del EDSDK.

## 2026-11-19 · Bloque 2, fase A: PAUSADA por uso del plan (sin construir nada)
- **Quién:** orquestador-bloque2.
- **Qué:** solo se leyó la documentación y se dejó el plan de las 8 piezas (C10, C11, C6, C8, C5, C2c, C7, diapositivas) con sus filas de navegación a decidir y lo que pasa a la Fase B. No hay archivos de código ni carpetas nuevas.
- **Dónde verlo:** `src/docs/proyecto-ia/PUNTO-DE-RETOMA-bloque2.md`.
- **Estado:** EN CURSO, pausada por orden del dueño (uso del plan cerca de 88 %). Sin commit.

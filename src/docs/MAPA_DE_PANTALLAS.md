# Mapa de pantallas — FotoCabina

> Lista completa de pantallas del producto, organizadas por quién las usa y en qué etapa del negocio aparecen. Sirve como plan de construcción: primero migramos lo que ya existe al nuevo sistema visual, después completamos lo que falta de la Etapa 1, y dejamos la Etapa 2 mapeada para cuando llegue el momento.
>
> Última revisión: 2026-11-16 (hitos 0.2 y 1.1: la cabina dibuja la plantilla real del evento, a falta de certificación; correcciones de texto; las pantallas nuevas propuestas A12, C2c y C8 a C11 están en `docs/ARQUITECTURA_FLUJO.md` §3.1 a la espera de aprobación del dueño).

## Cómo leer esta lista

- **Estado:** `Existe` (ya hay una versión funcional, hay que migrarla al nuevo sistema visual) / `Falta` (no existe todavía, hay que diseñarla y construirla) / `Futuro` (Etapa 2, solo mapeada, no se construye ahora).
- **Rol:** quién usa esa pantalla — Invitado (tótem), Operador (vos o un cliente futuro), o Sistema (pantallas que no dependen del rol, como errores).

---

## Etapa 1 — Uso propio (lo que necesitás para correr un evento real)

### A. Cabina del invitado (tótem táctil, vertical)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| A1 | **Pantalla de espera / bienvenida** | **Migrado** | Estado por defecto del tótem entre sesiones. Implementado en `01-camera-flow` como el modo idle con ícono de cámara pulsante en Lima Voltaje y "Toca la pantalla para empezar". **Hito 1.1 (2026-11-16, certificado):** no cambia su aspecto; solo se llega a ella si el evento tiene una plantilla válida (sin ella "Lanzar evento" queda bloqueado, ver C2b). La cabina abierta sin evento (demostración) la muestra como siempre. |
| A2 | **Selección de plantilla** (si el evento tiene más de una) | Falta | El invitado elige entre las plantillas habilitadas para ese evento. Si el evento tiene una sola plantilla, se salta este paso. Hoy `01-camera-flow` muestra la plantilla asignada al evento activo (conexión con `04-lista-eventos`, §3.9), pero solo una por evento — todavía no hay forma de habilitar varias plantillas por evento ni de que el invitado elija. |
| A3 | **Countdown y captura** | **Migrado** | Countdown grande, duración configurable por el operador (3/5/10/15 s), disparo, se repite por cada foto de la sesión. Incluye marco de encuadre proporcional a la foto de la plantilla (zona iluminada = lo que entra en la foto; **desde el hito 1.1 sale del espacio de foto real de la plantilla, foto por foto**, y el número de fotos de la sesión lo manda la plantilla en vez del ajuste manual) y controles de emergencia del operador: botón Pausar (Reanudar / Cancelar) y tecla ESC para cancelar la sesión. Migrado en `01-camera-flow` con el patrón operador→lanzar evento (F11)→invitado, basado en las capturas de DSLRBooth aportadas por el usuario. **Hito 0.1a (2026-11-16):** cada foto se guarda en disco en el instante de tomarla; si se corta la luz o se cierra la página, la sesión queda "incompleta" con sus fotos. **Hito 0.1b (2026-11-16, certificado):** al lanzar, la cabina congela una copia de la plantilla y cada sesión conserva la copia con que se tomó; al empezar cada sesión nueva relee la plantilla vigente, así que editarla aplica a la sesión siguiente, no a las ya hechas. La foto ya no se estira: se **recorta** a la proporción exacta del marco, con cualquier cámara (16:9, 4:3, vertical). Un evento sin plantilla queda con "Lanzar evento" bloqueado (decisión 1A). **Pendiente:** prueba manual con cámara real, en especial 16:9. Sin evento (demostración) se conserva la proporción fija de antes. |
| A4 | **Interstitial entre fotos** | **Migrado (versión mínima)** | Pausa breve entre cada foto — tiempo para cambiar pose/prop, y palanca de negocio para regular el ritmo de gente atendida (contadores/pausas más largas = menos sesiones por hora). Hoy es un mensaje fijo con temporizador; el editor visual de animaciones/GIF propios (equivalente al "Asistente virtual" de DSLRBooth) queda para C2/C3. |
| A5 | **Revisión de la sesión** | **Migrado** | Muestra las fotos tomadas; el invitado (u operador) puede repetir una foto puntual tocándola, o confirmar y continuar. Mejora sobre DSLRBooth, que solo permite rehacer toda la sesión. **Hito 1.1:** cuántas fotos se revisan y se pueden repetir lo define la plantilla del evento. |
| A6 | **Componiendo** (estado de carga) | **Migrado** | Spinner + texto breve mientras se arma la composición final. **Hito 1.1 (certificado):** con evento, compone con el motor compartido (`shared/motor-plantillas.js`) y la plantilla real, con fecha, n.º de sesión y nombre del evento reales; si la plantilla falla en pleno evento, vuelve a la revisión con las fotos a salvo y la sesión queda "fallida". Sin evento se usa el diseño antiguo de FotoCabina. |
| A7 | **Resultado final** | **Migrado** | Vista con tabs (Tira / Fotos / GIF), acciones de Descargar/Imprimir, y un footer con "Borrar y repetir sesión" + "Finalizar" (vuelve al inicio del tótem). Desde la pestaña "Fotos" se puede repetir una foto puntual y la tira se vuelve a componer sola; cada foto se descarga por separado y el GIF animado se genera con un codificador propio. Vuelve sola al inicio tras N segundos sin actividad (configurable), porque en un evento el invitado se va sin tocar "Finalizar". **Hito 1.1 (certificado):** la tira que se ve, se descarga y se comparte es la plantilla tal cual; **Imprimir usa la hoja** (4×6 con dos tiras y línea de corte si la plantilla lo pide, o la tira sola) con el tamaño de papel real de la plantilla; la sesión guarda además `hoja`, `impresion` (medidas en mm), `numero` y `plantillaId`, y la galería reimprime la hoja. El GIF sigue igual. Pendiente: la impresión sigue pasando por el diálogo del navegador (A9). |
| A8 | **Entrega digital (QR)** | Maqueta visual | No es una pantalla propia: es una tarjeta en la esquina del resultado (A7) con el QR de descarga y sus dos estados (esperando escaneo / descargado). El QR se genera de verdad (librería `qrcode` vendorizada, sin red) pero apunta a una URL de muestra y el paso a "descargado" está simulado con un temporizador — falta el servidor local que sirva la URL real (Fase D, `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.6/§3.7). |
| A9 | **Imprimiendo** (estado de carga) | Falta | Confirma que el trabajo se envió a la cola de impresión, sin bloquear al siguiente invitado. Hoy `01-camera-flow` abre el diálogo de impresión del navegador directamente, sin este paso intermedio. |
| A10 | **Error de sesión** (cámara/impresora) | Parcial | Hay un aviso simple de error de cámara (`notice`) en `01-camera-flow`, pero falta el estado de error de impresora y el diseño final pensado para el Principio 5 de PRODUCT.md. |
| A11 | **Galería / historial de sesiones** (acceso desde el inicio) | **Migrado** | Botón "Galería" en el header de operador de `01-camera-flow`: sesiones de este evento o de todos, con reimprimir, descargar tira/GIF/fotos y eliminar. Guardado local en IndexedDB. La gestión completa del evento (C6) sigue pendiente. Desde el hito 0.1a las sesiones cortadas aparecen con la marca "Incompleta" (y "N de M fotos"), y la tira solo se puede imprimir o descargar si existe. |

### B. Editor de plantillas (desktop, operador)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| B1 | **Editor de layout** | **Construido y aprobado para producción** (`03-editor-plantillas`, Fases 1–4 hechas); desde el hito 0.2 (2026-11-16) dibuja con el motor compartido `shared/motor-plantillas.js`, sin cambio visual (140 comparaciones de píxeles idénticas) | Rehecho como producto propio: lienzo en milímetros con reglas, guías inteligentes (centro, bordes, espaciado igual, medición con Alt, guías propias), barra contextual flotante, inspector, capas, arrastrar imágenes, detección automática de espacios de foto en diseños de Canva, modo claro/oscuro. Plan y estado en `docs/PLAN_EDITOR_PLANTILLAS.md`. Desde el hito 0.2 el dibujo ya no vive en el editor: la cabina usa el mismo motor, así editor y cabina producen la misma imagen (ver `pages/shared/README.md`). El dueño del proyecto confirmó este editor como el definitivo; `02-layout-editor` queda **descartado**, sin desarrollo nuevo, solo como referencia histórica. |
| B2 | **Tipografía avanzada** (dentro del editor) | **Construido** (Fase 2) | Fuente, peso, cursiva, subrayado, tachado, mayúsculas, interlineado, espaciado, alineación H/V, ajuste a la caja (crecer/reducir/recortar), fuentes .ttf/.otf/.woff propias agrupadas por familia y guardadas dentro de la plantilla, edición directa sobre el lienzo. |
| B3 | **Galería de plantillas propias** | **Construido** (Fase 3) | Pantalla de inicio del editor: mis plantillas con miniatura real, 15 plantillas base (tiras, postales, apaisadas), duplicar, renombrar, eliminar, importar/exportar archivo `.fotocabina.json`. |
| B4 | **Vista de impresión / previsualización de hoja** | **Construido** (Fase 3) | Motor de render propio a 300 ppp, hoja 4×6 con dos tiras y línea de corte, exportar PNG, imprimir copia de prueba, guía PNG para diseñar en Canva. Datos de sesión (fecha, hora, n.º, evento) como elementos de la plantilla. El QR de entrega digital **no** es un elemento de plantilla: vive en la pantalla de resultado de la cabina (ver A8). |

### C. Panel del operador (configuración y monitoreo del evento)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| C1 | **Lista de eventos** | **Construida** (`04-lista-eventos`) | Puerta de entrada / dashboard del panel de operador: eventos creados, próximos, en curso, archivados. Tabs por estado, card con miniatura/plantilla/sesiones, editar plantilla/lanzar/duplicar/archivar/eliminar. Nav lateral: "Eventos" y "Editor de plantillas" (2026-09-22: antes decía "Plantillas" y abría "Próximamente" pese a que el editor ya existía — conectado, abre `03-editor-plantillas` suelto) construidos; Impresora y Ayuda esperan C4 y la ayuda (Cámara abre una hoja que explica dónde se configura: C3 vive dentro de la cabina). Conectada de verdad con `01-camera-flow` y `03-editor-plantillas` vía almacén compartido (`pages/shared/almacen-eventos.js`, ver `docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §3.9): "Lanzar" pasa nombre, plantilla real y ajustes de sesión del evento a la cabina; "Editar plantilla" abre el editor asociado a ese evento puntual. C2 (crear evento) ya está construida. **Hito 0.1b (2026-11-16):** los eventos pasan al formato v2 (migración automática con respaldo); la card muestra el nombre real de la plantilla y el n.º real de sesiones (ya no el número fijo de demostración); duplicar clona el evento completo (entrega, copias, ritmo); eliminar borra de verdad sus sesiones y archivos, avisando cuántas; los eventos de demostración no tienen plantilla y al lanzarlos la cabina los bloquea hasta asignarles una. |
| C2 | **Crear / configurar evento** | **Construida** (`05-crear-evento`) | Nombre del evento, fecha, impresión automática al terminar (interruptor con selector de 1 a 5 hojas 4×6 por sesión; guardado pero aún no leído por la cabina), plantilla asignada (selector con las plantillas reales del editor, o "Elegir después") y modo de entrega (Impresión/Digital/Ambos). Guardar y volver a la lista son un solo paso (mismo patrón que "Lanzar evento" del editor, ver `docs/FLUJO_NAVEGACION.md`). El PIN de operador **no** se configura acá — se decidió que es universal para todos los eventos (2026-09-22), sigue en Ajustes de `01-camera-flow`. Punto de retiro externo / impresión remota quedan afuera hasta que existan H3/H4. La cantidad de fotos por sesión **la define la plantilla asignada** (sus huecos de foto) y desde el hito 1.1 (2026-11-16, certificado) `01-camera-flow` la lee de ahí. El invitado no configura nada. **Hito 0.1b:** crea el evento en formato v2 (id estable); "Elegir después" deja el evento sin plantilla y la cabina bloquea "Lanzar evento" hasta asignarla. La impresión automática y las copias se guardan y se congelan en cada sesión, pero la cabina aún no imprime según ellas. |
| C2b | **Modo operador previo al lanzamiento** | **Migrado (estructura)** | Header minimalista en `01-camera-flow`: logo (botón "Inicio" → `04-lista-eventos`), evento, semáforos cámara/impresora, riel Galería · Plantilla · Ajustes · Ayuda, y "Lanzar evento" (bloqueado sin cámara conectada y, desde el hito 1.1, sin plantilla válida: evento sin plantilla elegida, plantilla borrada, dañada o sin espacios de foto; la tarjeta de plantilla explica el motivo y ofrece "Abrir el editor" con el evento ya asociado; el invitado nunca ve nada técnico). Panel de Ajustes con Sesión y Cámara funcionando (fotos, cuenta regresiva, pausa, mensaje; el PIN ya no es del evento: es del equipo y se crea/cambia desde acá, ver P1; se guardan por evento cuando hay evento activo, y en el equipo si la cabina se abrió suelta) e Impresión / Compartir / Efectos marcadas "Próximamente". Tarjeta de plantilla activa sobre la cámara. Con un evento activo, "Plantilla" y "Cambiar" abren `03-editor-plantillas` asociado a ese evento; sin evento activo, y Ayuda, siguen abriendo una hoja "Próximamente" hasta que existan (C3–C4, ayuda). Detalle de estas decisiones de navegación en `docs/FLUJO_NAVEGACION.md`. |
| C3 | **Configuración de cámara** | **Construida** (dentro de `01-camera-flow`, Ajustes › Cámara) | No es pantalla aparte: panel dentro de la cabina (decisión 2026-09-24). Selector con las cámaras reales del equipo, prueba en vivo al elegir, guardado **por evento**. Si la cámara guardada no responde, cae sola a la del equipo. Desconexión con la cabina abierta → semáforo rojo, imagen borrada, "Lanzar evento" bloqueado, "Reconectar cámara". Mensajes distintos para sin permiso / sin cámara / cámara ocupada por otro programa. Pendiente: aviso al invitado si se desconecta en plena sesión (A10) y ajustes avanzados de DSLR (app de escritorio). |
| C4 | **Configuración de impresora** | Falta | Selección de impresora, tamaño de papel/media, orientación, copias por defecto, prueba de impresión. |
| C5 | **Panel "en vivo" del evento** | Falta | La pantalla que se mira durante el evento: estado de cámara/impresora en tiempo real, cola de impresión, sesiones en curso, contador de invitados atendidos. Es la más crítica para "no frenar la fila" (Principio 5). |
| C6 | **Detalle de sesión** | Falta | Ver una sesión puntual: fotos originales, composición final, estado de impresión/entrega, opción de reimprimir. |
| C7 | **Resolución de error del operador** | Falta | Versión detallada (no la simplificada del invitado) del error de cámara/impresora, con pasos de diagnóstico y reintento. |

---

## Etapa 2 — Producto comercial (mapeadas, no se construyen todavía)

### D. Cuenta y suscripción

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| D1 | **Login / registro** | Futuro | Acceso con la cuenta compartida (Firebase, misma infraestructura que Luz Ai Studio). |
| D2 | **Estado de licencia/suscripción** | Futuro | Muestra plan activo, vencimiento, plataformas con licencia activa (desktop / iPad / mobile). |
| D3 | **Planes y precios** | Futuro | Se construye recién cuando el modelo de planes esté definido (hoy deliberadamente abierto en PRODUCT.md). |
| D4 | **Checkout / pago** | Futuro | Por plataforma (Windows, App Store, Play Store), cada canal con su propio flujo de pago nativo. |
| D5 | **Perfil de cuenta** | Futuro | Datos del operador/cliente, plataformas activas, cierre de sesión. |

### E. Mobile — cabina con DSLR (iPad + cámara USB)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| E1–E9 | **Mismo flujo que A1–A9, adaptado a iPad** | Futuro | Reusa el motor de plantillas/composición y el mismo lenguaje visual; ajusta densidad táctil y navegación a iPad en vez de tótem fijo. |

### F. Mobile — cabina liviana (cámara propia del dispositivo)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| F1–F9 | **Versión reducida de A1–A9** | Futuro | Mismo flujo conceptual, sin dependencia de DSLR ni impresora profesional; pensado para el cliente de entrada. |

### G. Mobile — control remoto

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| G1 | **Vinculación con cabina activa** | Futuro | Conecta el celular a una cabina desktop corriendo en la red local del evento. |
| G2 | **Control y preview remoto** | Futuro | Disparar la sesión, ver preview en vivo, aprobar la foto, desde el celular. |

### H. Mobile / Web — app complementaria

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| H1 | **Galería de eventos** (vista del operador, fuera del evento) | Futuro | Revisar eventos pasados y sus sesiones desde el celular. |
| H2 | **Galería del invitado** (vía QR, posible PWA) | Futuro | Lo que ve un invitado al escanear el QR de entrega digital — puede ser la primera pieza en PWA. |
| H3 | **Punto de retiro digital** (tablet Android/iOS en el evento) | Futuro | Tablet en otro sector del salón, conectada a un servidor local del evento, donde cada invitado busca y descarga sus fotos (código de sesión, QR o galería del evento). Variante del compartir por QR para no retener gente frente a la cabina. Configurable por evento; detalle en `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.7. |
| H4 | **Estación de impresión remota** | Futuro | Cuando la impresora acepte trabajos por Wi‑Fi: la cabina en un punto, el retiro de copias en otro, con la cola viajando por la red local. Configurable por evento; detalle en §3.7. |

---

## Resumen numérico

- **Etapa 1 — Migrado en `01-camera-flow`:** A1, A3, A4 (versión mínima), A5, A6, A7, A11 — 7 pantallas/pasos.
- **Etapa 1 — Parcial:** A8 (maqueta visual del QR, sin servidor local real), A10 (falta error de impresora y diseño final).
- **Etapa 1 — Falta construir:** A2, A9 (2 del flujo invitado) + C4-C7 (4 del panel de operador) = 6 pantallas/piezas. El editor de plantillas (B1-B4) ya está completo. C1 (lista de eventos), C2 (crear evento) y C3 (cámara, dentro de la cabina) ya están construidas y conectadas.
- **Etapa 2 — Futuro, solo mapeado:** 5 pantallas propias de cuenta/suscripción (D1-D5) + 4 flujos completos reusados y adaptados por plataforma (E, F, G, H).

## Próximo paso acordado

1. ~~Migrar `01-camera-flow` (pantallas A1, A3-A7) al nuevo sistema visual~~ — **hecho**, con mejoras sobre DSLRBooth (repetir foto individual, footer de salida claro). Ver capturas de referencia en `pantallas dslrbooth/`.
2. ~~Rehacer el editor de plantillas (`02-layout-editor` → `03-editor-plantillas`)~~ — **hecho y aprobado para producción** el 2026-09-17 (Fases 1-4 completas).
3. ~~Construir C1 (lista de eventos) y conectarla con la cabina~~ — **hecho** el 2026-09-17 (`04-lista-eventos`, ver su README y `docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §3.9).
4. ~~Conectar la plantilla real del editor con el evento~~ — **hecho** el 2026-09-21 (ver `docs/DSLRBOOTH_PRODUCT_CONTEXT.md` §3.9). Lo que quedaba (que la cabina lea el número de fotos y dibuje la plantilla real) se construyó en los hitos 0.2 y 1.1 del 2026-11-16; el 1.1 está **certificado**. Plantilla congelada por sesión y recorte de cámara sin estirar: **hechos** en el hito 0.1b (2026-11-16, certificado). Pendiente: prueba manual del dueño con cámara real.
5. ~~Construir C2 (crear evento) y conectarla~~ — **hecho** el 2026-09-22 (`05-crear-evento`, ver su README y `docs/FLUJO_NAVEGACION.md`).
6. ~~Construir C3 (configuración de cámara)~~ — **hecho** el 2026-09-24, como panel dentro de Ajustes de `01-camera-flow` (ver su README).
7. Seguir con el resto del panel del operador (C4-C7).

## Pendientes de `01-camera-flow` reportados tras prueba real (2026-09-16)

Detectados por el dueño del proyecto probando el flujo completo con cámara. **Resueltos el 2026-09-16** en `01-camera-flow` (detalle en su README); pendiente de que el dueño los pruebe con cámara real.

| # | Pendiente | Resolución |
| --- | --- | --- |
| P1 | **Volver a los controles de operador después de lanzar el evento** | Botón "Operador" en la esquina (o ESC sin sesión en curso) abre un teclado PIN; con el PIN correcto vuelve al header sin cerrar la app. El PIN es del equipo (`shared/equipo.js`, hito 0.1a 2026-11-16): se crea la primera vez que se lanza un evento (no existe PIN de fábrica), se guarda con hash, se cambia desde Ajustes (pide el actual) y tras 5 intentos fallidos se bloquea 5 minutos (el bloqueo persiste al recargar). |
| P2 | **Galería de la sesión en curso** | Cada tira se guarda sola al componerse; la galería (header de operador, filtro "Este evento") muestra la sesión recién tomada primero. |
| P3 | **Galería global de fotos** (= A11) | Misma galería con filtro "Todos los eventos". Persistencia local en IndexedDB (`almacen-sesiones.js`); las sesiones sobreviven a recargar la página. |
| P4 | **Descargar / compartir cada imagen del set individualmente** | Chip "Descargar" por foto en resultado y galería; "Descargar" del resultado baja lo que se ve (tira / fotos / GIF); "Compartir" con la hoja del sistema donde el dispositivo lo soporta. La entrega por QR (A8) sigue pendiente. |
| P5 | **GIF animado real** | Codificador GIF propio sin librerías (`codificador-gif.js`); el GIF se genera al componer, se muestra animado en la pestaña GIF, se descarga y queda guardado con la sesión. |

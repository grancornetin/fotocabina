# Mapa de pantallas — FotoCabina

> Lista completa de pantallas del producto, organizadas por quién las usa y en qué etapa del negocio aparecen. Sirve como plan de construcción: primero migramos lo que ya existe al nuevo sistema visual, después completamos lo que falta de la Etapa 1, y dejamos la Etapa 2 mapeada para cuando llegue el momento.
>
> Última revisión: 2026-09-16.

## Cómo leer esta lista

- **Estado:** `Existe` (ya hay una versión funcional, hay que migrarla al nuevo sistema visual) / `Falta` (no existe todavía, hay que diseñarla y construirla) / `Futuro` (Etapa 2, solo mapeada, no se construye ahora).
- **Rol:** quién usa esa pantalla — Invitado (tótem), Operador (vos o un cliente futuro), o Sistema (pantallas que no dependen del rol, como errores).

---

## Etapa 1 — Uso propio (lo que necesitás para correr un evento real)

### A. Cabina del invitado (tótem táctil, vertical)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| A1 | **Pantalla de espera / bienvenida** | **Migrado** | Estado por defecto del tótem entre sesiones. Implementado en `01-camera-flow` como el modo idle con ícono de cámara pulsante en Lima Voltaje y "Tocá la pantalla para empezar". |
| A2 | **Selección de plantilla** (si el evento tiene más de una) | Falta | El invitado elige entre las plantillas habilitadas para ese evento. Si el evento tiene una sola plantilla, se salta este paso. Hoy `01-camera-flow` asume una sola plantilla fija. |
| A3 | **Countdown y captura** | **Migrado** | Countdown grande, duración configurable por el operador (3/5/10/15 s), disparo, se repite por cada foto de la sesión. Incluye marco de encuadre proporcional a la foto de la plantilla (zona iluminada = lo que entra en la foto) y controles de emergencia del operador: botón Pausar (Reanudar / Cancelar) y tecla ESC para cancelar la sesión. Migrado en `01-camera-flow` con el patrón operador→lanzar evento (F11)→invitado, basado en las capturas de DSLRBooth aportadas por el usuario. |
| A4 | **Interstitial entre fotos** | **Migrado (versión mínima)** | Pausa breve entre cada foto — tiempo para cambiar pose/prop, y palanca de negocio para regular el ritmo de gente atendida (contadores/pausas más largas = menos sesiones por hora). Hoy es un mensaje fijo con temporizador; el editor visual de animaciones/GIF propios (equivalente al "Asistente virtual" de DSLRBooth) queda para C2/C3. |
| A5 | **Revisión de la sesión** | **Migrado** | Muestra las fotos tomadas; el invitado (u operador) puede repetir una foto puntual tocándola, o confirmar y continuar. Mejora sobre DSLRBooth, que solo permite rehacer toda la sesión. |
| A6 | **Componiendo** (estado de carga) | **Migrado** | Spinner + texto breve mientras se arma la composición final. |
| A7 | **Resultado final** | **Migrado** | Vista con tabs (Tira / Fotos / GIF), acciones de Descargar/Imprimir, y un footer con "Borrar y repetir sesión" + "Finalizar" (vuelve al inicio del tótem). Desde la pestaña "Fotos" se puede repetir una foto puntual y la tira se vuelve a componer sola; cada foto se descarga por separado y el GIF animado se genera con un codificador propio. Vuelve sola al inicio tras N segundos sin actividad (configurable), porque en un evento el invitado se va sin tocar "Finalizar". |
| A8 | **Entrega digital (QR)** | Maqueta visual | No es una pantalla propia: es una tarjeta en la esquina del resultado (A7) con el QR de descarga y sus dos estados (esperando escaneo / descargado). El QR se genera de verdad (librería `qrcode` vendorizada, sin red) pero apunta a una URL de muestra y el paso a "descargado" está simulado con un temporizador — falta el servidor local que sirva la URL real (Fase D, `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.6/§3.7). |
| A9 | **Imprimiendo** (estado de carga) | Falta | Confirma que el trabajo se envió a la cola de impresión, sin bloquear al siguiente invitado. Hoy `01-camera-flow` abre el diálogo de impresión del navegador directamente, sin este paso intermedio. |
| A10 | **Error de sesión** (cámara/impresora) | Parcial | Hay un aviso simple de error de cámara (`notice`) en `01-camera-flow`, pero falta el estado de error de impresora y el diseño final pensado para el Principio 5 de PRODUCT.md. |
| A11 | **Galería / historial de sesiones** (acceso desde el inicio) | **Migrado** | Botón "Galería" en el header de operador de `01-camera-flow`: sesiones de este evento o de todos, con reimprimir, descargar tira/GIF/fotos y eliminar. Guardado local en IndexedDB. La gestión completa del evento (C6) sigue pendiente. |

### B. Editor de plantillas (desktop, operador)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| B1 | **Editor de layout** | **Construido y aprobado para producción** (`03-editor-plantillas`, Fases 1–4 hechas) | Rehecho como producto propio: lienzo en milímetros con reglas, guías inteligentes (centro, bordes, espaciado igual, medición con Alt, guías propias), barra contextual flotante, inspector, capas, arrastrar imágenes, detección automática de espacios de foto en diseños de Canva, modo claro/oscuro. Plan y estado en `docs/PLAN_EDITOR_PLANTILLAS.md`. El dueño del proyecto confirmó este editor como el definitivo; `02-layout-editor` queda **descartado**, sin desarrollo nuevo, solo como referencia histórica. |
| B2 | **Tipografía avanzada** (dentro del editor) | **Construido** (Fase 2) | Fuente, peso, cursiva, subrayado, tachado, mayúsculas, interlineado, espaciado, alineación H/V, ajuste a la caja (crecer/reducir/recortar), fuentes .ttf/.otf/.woff propias agrupadas por familia y guardadas dentro de la plantilla, edición directa sobre el lienzo. |
| B3 | **Galería de plantillas propias** | **Construido** (Fase 3) | Pantalla de inicio del editor: mis plantillas con miniatura real, 15 plantillas base (tiras, postales, apaisadas), duplicar, renombrar, eliminar, importar/exportar archivo `.fotocabina.json`. |
| B4 | **Vista de impresión / previsualización de hoja** | **Construido** (Fase 3) | Motor de render propio a 300 ppp, hoja 4×6 con dos tiras y línea de corte, exportar PNG, imprimir copia de prueba, guía PNG para diseñar en Canva. Datos de sesión (fecha, hora, n.º, evento) como elementos de la plantilla. El QR de entrega digital **no** es un elemento de plantilla: vive en la pantalla de resultado de la cabina (ver A8). |

### C. Panel del operador (configuración y monitoreo del evento)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| C1 | **Lista de eventos** | Falta | Vista principal del operador: eventos creados, próximos, en curso, archivados. |
| C2 | **Crear / configurar evento** | Falta | Nombre del evento, plantilla asignada, copias, modo de entrega (impresión/digital/ambos), y en el futuro punto de retiro externo / impresión remota. La cantidad de fotos por sesión **la define la plantilla asignada** (sus huecos de foto), no un campo manual — el ajuste "Fotos por sesión" de `01-camera-flow` es provisorio hasta conectar la cabina con el editor. El invitado no configura nada. |
| C2b | **Modo operador previo al lanzamiento** | **Migrado (estructura)** | Header minimalista en `01-camera-flow`: evento, semáforos cámara/impresora, riel Galería · Plantillas · Editor · Ajustes · Ayuda, y "Lanzar evento". Panel de Ajustes con Sesión y Cámara funcionando (fotos, cuenta regresiva, pausa, mensaje, PIN, guardados en el equipo) e Impresión / Compartir / Efectos marcadas "Próximamente". Tarjeta de plantilla activa sobre la cámara. Plantillas y Ayuda abren una hoja "Próximamente" hasta que existan (B3, C3–C4, ayuda). |
| C3 | **Configuración de cámara** | Falta | Selección y prueba de la cámara conectada (o cámara del dispositivo), estado de conexión, live view de prueba. |
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
- **Etapa 1 — Falta construir:** A2, A9 (2 del flujo invitado) + C1-C7 (7 del panel de operador) = 9 pantallas/piezas. El editor de plantillas (B1-B4) ya está completo.
- **Etapa 2 — Futuro, solo mapeado:** 5 pantallas propias de cuenta/suscripción (D1-D5) + 4 flujos completos reusados y adaptados por plataforma (E, F, G, H).

## Próximo paso acordado

1. ~~Migrar `01-camera-flow` (pantallas A1, A3-A7) al nuevo sistema visual~~ — **hecho**, con mejoras sobre DSLRBooth (repetir foto individual, footer de salida claro). Ver capturas de referencia en `pantallas dslrbooth/`.
2. ~~Rehacer el editor de plantillas (`02-layout-editor` → `03-editor-plantillas`)~~ — **hecho y aprobado para producción** el 2026-09-17 (Fases 1-4 completas).
3. Seguir con el panel del operador (C1-C7), que es el bloque más grande que queda de la Etapa 1.

## Pendientes de `01-camera-flow` reportados tras prueba real (2026-09-16)

Detectados por el dueño del proyecto probando el flujo completo con cámara. **Resueltos el 2026-09-16** en `01-camera-flow` (detalle en su README); pendiente de que el dueño los pruebe con cámara real.

| # | Pendiente | Resolución |
| --- | --- | --- |
| P1 | **Volver a los controles de operador después de lanzar el evento** | Botón "Operador" en la esquina (o ESC sin sesión en curso) abre un teclado PIN; con el PIN correcto vuelve al header sin cerrar la app. El PIN pasará a configurarse por evento en C2. |
| P2 | **Galería de la sesión en curso** | Cada tira se guarda sola al componerse; la galería (header de operador, filtro "Este evento") muestra la sesión recién tomada primero. |
| P3 | **Galería global de fotos** (= A11) | Misma galería con filtro "Todos los eventos". Persistencia local en IndexedDB (`almacen-sesiones.js`); las sesiones sobreviven a recargar la página. |
| P4 | **Descargar / compartir cada imagen del set individualmente** | Chip "Descargar" por foto en resultado y galería; "Descargar" del resultado baja lo que se ve (tira / fotos / GIF); "Compartir" con la hoja del sistema donde el dispositivo lo soporta. La entrega por QR (A8) sigue pendiente. |
| P5 | **GIF animado real** | Codificador GIF propio sin librerías (`codificador-gif.js`); el GIF se genera al componer, se muestra animado en la pestaña GIF, se descarga y queda guardado con la sesión. |

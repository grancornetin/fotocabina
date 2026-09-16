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
| A7 | **Resultado final** | **Migrado** | Vista con tabs (Tira / Fotos / GIF), acciones de Descargar/Imprimir, y un footer con "Borrar y repetir sesión" + "Finalizar" (vuelve al inicio del tótem). Desde la pestaña "Fotos" se puede repetir una foto puntual y la tira se vuelve a componer sola. El GIF animado real todavía no se ensambla (placeholder pendiente de librería de encoding). |
| A8 | **Entrega digital (QR)** | Falta | Pantalla con el QR de descarga y estado (esperando escaneo / descargado). No implementada todavía en `01-camera-flow`. |
| A9 | **Imprimiendo** (estado de carga) | Falta | Confirma que el trabajo se envió a la cola de impresión, sin bloquear al siguiente invitado. Hoy `01-camera-flow` abre el diálogo de impresión del navegador directamente, sin este paso intermedio. |
| A10 | **Error de sesión** (cámara/impresora) | Parcial | Hay un aviso simple de error de cámara (`notice`) en `01-camera-flow`, pero falta el estado de error de impresora y el diseño final pensado para el Principio 5 de PRODUCT.md. |
| A11 | **Galería / historial de sesiones** (acceso desde el inicio) | **Migrado** | Botón "Galería" en el header de operador de `01-camera-flow`: sesiones de este evento o de todos, con reimprimir, descargar tira/GIF/fotos y eliminar. Guardado local en IndexedDB. La gestión completa del evento (C6) sigue pendiente. |

### B. Editor de plantillas (desktop, operador)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| B1 | **Editor de layout** | Existe (`02-layout-editor`, a migrar) | Ya prototipado: capas, alineación, guías, selección múltiple. Se migra al nuevo sistema visual respetando toda su funcionalidad actual. |
| B2 | **Tipografía avanzada** (dentro del editor) | Falta | El bloque pendiente que ya identificamos en el documento de producto: mayúsculas/negrita/cursiva, fuentes locales, ajuste de caja. Se agrega sobre B1, no es una pantalla aparte. |
| B3 | **Galería de plantillas propias** | Falta | Lista de plantillas guardadas por el operador, para elegir cuál editar o duplicar antes de un evento. |
| B4 | **Vista de impresión / previsualización de hoja** | Existe (modal dentro de `02-layout-editor`, a migrar) | Ya existe como modal ("Hoja lista para el driver"); se migra visualmente junto con B1. |

### C. Panel del operador (configuración y monitoreo del evento)

| # | Pantalla | Estado | Qué hace |
| --- | --- | --- | --- |
| C1 | **Lista de eventos** | Falta | Vista principal del operador: eventos creados, próximos, en curso, archivados. |
| C2 | **Crear / configurar evento** | Falta | Nombre del evento, plantilla asignada, cantidad de fotos por sesión, copias, modo de entrega (impresión/digital/ambos). El MVP original (`01-camera-flow`) tenía estos campos visibles para el invitado — se migran acá, el invitado no configura nada. |
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

---

## Resumen numérico

- **Etapa 1 — Migrado en `01-camera-flow`:** A1, A3, A4 (versión mínima), A5, A6, A7 — 6 pantallas/pasos del flujo del invitado.
- **Etapa 1 — Parcial:** A10 (falta error de impresora y diseño final).
- **Etapa 1 — Falta construir:** A2, A8, A9, A11 (4 del flujo invitado) + B2-B3 (2 del editor) + C1-C7 (7 del panel de operador) + B1/B4 a migrar visualmente = 14 pantallas/piezas.
- **Etapa 2 — Futuro, solo mapeado:** 5 pantallas propias de cuenta/suscripción (D1-D5) + 4 flujos completos reusados y adaptados por plataforma (E, F, G, H).

## Próximo paso acordado

1. ~~Migrar `01-camera-flow` (pantallas A1, A3-A7) al nuevo sistema visual~~ — **hecho**, con mejoras sobre DSLRBooth (repetir foto individual, footer de salida claro). Ver capturas de referencia en `pantallas dslrbooth/`.
2. Migrar `02-layout-editor` (B1, B4) al nuevo sistema visual.
3. Revisar juntos cómo quedaron esas dos migraciones antes de construir cualquier pantalla nueva de la lista "Falta" — incluyendo A11 (galería/historial), que quedó pendiente de esta ronda de feedback.

## Pendientes de `01-camera-flow` reportados tras prueba real (2026-09-16)

Detectados por el dueño del proyecto probando el flujo completo con cámara. **Resueltos el 2026-09-16** en `01-camera-flow` (detalle en su README); pendiente de que el dueño los pruebe con cámara real.

| # | Pendiente | Resolución |
| --- | --- | --- |
| P1 | **Volver a los controles de operador después de lanzar el evento** | Botón "Operador" en la esquina (o ESC sin sesión en curso) abre un teclado PIN; con el PIN correcto vuelve al header sin cerrar la app. El PIN pasará a configurarse por evento en C2. |
| P2 | **Galería de la sesión en curso** | Cada tira se guarda sola al componerse; la galería (header de operador, filtro "Este evento") muestra la sesión recién tomada primero. |
| P3 | **Galería global de fotos** (= A11) | Misma galería con filtro "Todos los eventos". Persistencia local en IndexedDB (`almacen-sesiones.js`); las sesiones sobreviven a recargar la página. |
| P4 | **Descargar / compartir cada imagen del set individualmente** | Chip "Descargar" por foto en resultado y galería; "Descargar" del resultado baja lo que se ve (tira / fotos / GIF); "Compartir" con la hoja del sistema donde el dispositivo lo soporta. La entrega por QR (A8) sigue pendiente. |
| P5 | **GIF animado real** | Codificador GIF propio sin librerías (`codificador-gif.js`); el GIF se genera al componer, se muestra animado en la pestaña GIF, se descarga y queda guardado con la sesión. |

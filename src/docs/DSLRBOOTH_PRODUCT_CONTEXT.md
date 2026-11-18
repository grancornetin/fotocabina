# FotoCabina — contexto de producto, estudio de DSLRBooth y continuidad

> Documento de continuidad del proyecto. Mantenerlo actualizado cuando se tome una decisión de producto, hardware o arquitectura.
>
> Última revisión: 2026-11-18 (hito 3: sección 3.15, impresión con impresora simulada; antes, hito 1.6: sección 3.14, respaldo y restauración; antes, hito 1.3: sección 3.13, ciclo de vida del evento; antes, hito 0.1b: sección 3.12, decisiones de plantilla congelada, eventos sin plantilla y recorte de cámara; antes, esqueleto de arquitectura: sección 3.11 y documento maestro `docs/ARQUITECTURA_FLUJO.md`).
>
> **Qué documento manda sobre qué** (para no duplicar):
> - `PRODUCT.md` — verdad del producto para diseño (quién lo usa, para qué, restricciones). Se lee primero.
> - `DESIGN.md` — sistema de diseño obligatorio. Referencia viva: `pages/00-design-system`.
> - **Este documento** — decisiones de producto, hardware y arquitectura, y el plan por fases (§6). Cuando se toma una decisión que cambia el rumbo, se anota acá.
> - `docs/ARQUITECTURA_FLUJO.md` — **documento maestro del flujo**: tipos de usuario, qué define a un evento y cómo cada ajuste afecta al resto, mapa de flujos, funciones por pantalla, contrato de datos (qué se comparte y cómo escala), huecos y orden de construcción. Manda en **cómo se conectan** pantallas, datos y ajustes; se lee antes de construir cualquier pantalla.
> - `docs/MAPA_DE_PANTALLAS.md` — inventario de pantallas y su estado (hecha / en curso / falta / futuro).
> - `docs/FLUJO_NAVEGACION.md` — cómo se conectan las pantallas entre sí: de dónde viene cada una, hacia dónde va, y qué pasa al volver. Se lee y actualiza junto con el mapa de pantallas cada vez que una pantalla se conecta con otra.
> - `docs/PLAN_EDITOR_PLANTILLAS.md` — plan detallado del editor (lo mantiene quien trabaja el editor).
> - `pages/*/README.md` — detalle de cómo funciona cada pantalla hoy.

## 0. Norte del producto (léase primero)

FotoCabina tiene dos etapas de vida, en este orden:

1. **Etapa 1 — Uso propio.** Nico la usa en sus propios eventos privados. El objetivo es que funcione bien en un solo caso real: su hardware, sus plantillas, sus eventos. No hay todavía clientes externos ni cobros.
2. **Etapa 2 — Producto comercial.** Una vez validada en uso real, FotoCabina se vende como **suscripción** a otros operadores de cabinas fotográficas (fotógrafos, empresas de eventos). Cada cliente paga una licencia y usa la app con sus propios eventos, sin ver ni tocar los datos de otros clientes.

Esto significa que, desde ahora, toda decisión técnica debe evitar dos errores:

- **No optimizar de más para "producto"** cuando todavía no hay un segundo usuario real (sería construir andamiaje que nadie prueba).
- **No atarse tanto al uso personal** que después haya que reescribir la base para separar los datos y la sesión de un cliente de los de otro (multi-tenant).

La forma de balancear esto: separar desde el diseño (aunque no desde el código todavía) **el motor de cabina** (captura, plantillas, impresión — lo que ya existe y sigue evolucionando igual, lo use uno o mil clientes) de **la capa de negocio** (cuentas, licencias, pagos, planes — que se puede sumar después sin tocar el motor).

## 1. Propósito del producto

FotoCabina será una aplicación de fotocabina profesional orientada a eventos, distribuida en varias plataformas y pensada para operar sin depender de Internet durante el evento en sí.

El primer uso objetivo es una sesión de tres fotografías que genera una composición de dos tiras idénticas de **2 × 6 pulgadas** dentro de una hoja de **4 × 6 pulgadas**. Esto es una configuración inicial, no una limitación del producto: una plantilla podrá definir libremente cuántas fotos tiene, su orden, tamaños, capas y salida de impresión.

### Principios acordados

1. **Offline primero durante el evento.** La sesión de captura, composición e impresión debe poder operar sin Internet. La nube se usa para licencias/cuentas (validación periódica, no continua), respaldo, QR público o administración remota — nunca debe bloquear una sesión en curso.
2. **Multi-plataforma por caso de uso, no por moda.** Cada plataforma existe porque resuelve un escenario real de cabina, no porque "hay que estar en todos lados" (ver sección 1.1).
3. **Una plataforma, varias páginas/módulos.** El código de interfaz y lógica se organiza en módulos independientes (hoy `pages/`, luego se reorganizará en motor + shells por plataforma); no se debe volver a concentrar todo en un único archivo monolítico.
4. **Plantillas libres.** No se debe codificar el diseño de tres fotos. El usuario agrega slots de foto, texto, imágenes PNG, formas y otros elementos según lo requiera cada diseño.
5. **Impresión confiable antes que rapidez aparente.** La app debe verificar perfil, tamaño de papel, impresora elegida, estado y cola antes de aceptar una sesión para imprimir.
6. **Entrega digital sin fila.** El huésped debe poder recibir una copia digital por un canal local; Internet no será un requisito.
7. **Motor de cabina separado del negocio.** La lógica de sesión/plantilla/impresión no debe saber de suscripciones ni de planes; solo pregunta "¿esta licencia está activa?" a una capa aparte.

### 1.1 Las plataformas y para qué sirve cada una

FotoCabina no es una sola app: son varios "shells" (cascarones de interfaz) que comparten el mismo motor de cabina y las mismas plantillas, pero están pensados para escenarios distintos.

| Plataforma | Escenario real | Rol |
| --- | --- | --- |
| **Desktop (Windows)** | Cabina profesional: PC + DSLR/mirrorless por USB + impresora de sublimación (DNP/HiTi). | Motor principal. Es donde vive primero cada función nueva (captura real, impresión con driver, cola persistente). |
| **Mobile — cabina con DSLR (iPad + cámara USB)** | Igual que la de LumaBooth/dslrBooth "iPad edition": un iPad conectado por USB/adaptador a una DSLR real, con impresora conectada por red o USB. | Segundo motor de captura, mismo nivel profesional que desktop pero en tablet. No es una versión reducida: apunta al mismo resultado de calidad. |
| **Mobile — cabina liviana (cámara del propio dispositivo)** | Cliente sin DSLR: usa la cámara del celular/tablet como cabina completa, imprime en una impresora fotográfica doméstica o solo entrega digital. | Versión de entrada, para quien no invirtió en equipo profesional todavía. Mismo motor de plantillas, captura más simple. |
| **Mobile — control remoto** | Una cabina desktop ya está corriendo en el evento; el operador quiere disparar la sesión, ver el preview o aprobar la foto desde el celular sin pararse frente al PC. | No captura ni imprime por sí sola: es un cliente remoto que habla con la cabina desktop activa (red local). |
| **Mobile / Web — app complementaria** | Antes/después del evento: gestionar eventos, revisar o editar plantillas, ver la galería de fotos tomadas, compartir/descargar, administrar cuenta y suscripción. | No opera la cabina en el momento del evento. Es la cara "de oficina" del producto. |
| **PWA** | Evolución natural de la app complementaria (y eventualmente de la cabina liviana) para no depender de tiendas de apps en ciertos flujos — por ejemplo la galería que ve el invitado desde el QR. | Capa web ligera sobre el mismo backend; no reemplaza a las apps nativas para control de hardware. |

Cada plataforma que controla hardware (desktop, iPad+DSLR, cabina liviana) tiene **su propia licencia y su propio pago** en la tienda/canal correspondiente (Windows, App Store, Play Store). La app complementaria/PWA se autentica contra la misma cuenta de usuario, no contra una licencia de plataforma.

## 2. Estado del repositorio

```text
PRODUCT.md                    # Verdad del producto para diseño
DESIGN.md                     # Sistema de diseño (obligatorio)
pages/
├── 00-design-system/        # Showcase del sistema de diseño (dark / light / sistema)
├── 01-camera-flow/          # Cabina: modo operador + modo invitado (ver su README)
├── 02-layout-editor/        # Descartado, solo referencia histórica
├── 03-editor-plantillas/    # Editor de plantillas definitivo (docs/PLAN_EDITOR_PLANTILLAS.md)
├── 04-lista-eventos/        # C1, lista de eventos
├── 05-crear-evento/         # C2, crear evento
└── shared/                  # Módulos comunes (almacén de eventos)
docs/
├── ARQUITECTURA_FLUJO.md
├── DSLRBOOTH_PRODUCT_CONTEXT.md
├── MAPA_DE_PANTALLAS.md
└── PLAN_EDITOR_PLANTILLAS.md
```

Cada página conserva estructura, estilos y lógica en archivos separados (`index.html`, `styles.css`, `app.js`). Los módulos comunes que aparezcan más adelante irán en `shared/`; no se debe volver a concentrar toda la aplicación en un único HTML.

### Qué hay hoy (2026-09-16)

| Módulo | Estado | Alcance real |
| --- | --- | --- |
| `00-design-system` | Aprobado | Tokens, componentes y modo claro/oscuro. Todo lo nuevo se construye con esto. |
| `01-camera-flow` | MVP de cabina cerrado (navegador) | Operador: evento, semáforos, galería, ajustes (fotos, cuenta hasta 30 s, pausa, mensaje, PIN, vuelta al inicio, cámara, espejo), "Lanzar evento". Invitado: pantalla completa, countdown, interstitial, marco de encuadre, revisión con repetir foto, tira 4 × 6, GIF real, descargar/compartir/imprimir, sesiones guardadas en IndexedDB, vuelta automática al inicio, PIN para volver al operador. No controla todavía DSLR, flash ni impresora profesional; la cantidad de fotos todavía es un ajuste manual (ver §3.5). |
| `02-layout-editor` | Prototipo, congelado | Editor original; queda como referencia hasta que `03` lo reemplace. |
| `03-editor-plantillas` | Aprobado para producción (2026-09-17) | Editor definitivo. Plan y estado en `docs/PLAN_EDITOR_PLANTILLAS.md`. |
| `04-lista-eventos`, `05-crear-evento`, `shared/` | Construidos | C1 y C2, conectados por el almacén compartido (§3.9). |

Lo que falta del mapa (A2, A8 QR, A9, A10, panel de operador C1–C7, B2–B4 y todo lo de Etapa 2) está listado con su estado en `docs/MAPA_DE_PANTALLAS.md`.

## 3. Qué se puede aprender de DSLRBooth/LumaBooth

En 2026 la marca presenta su producto Windows como **LumaBooth for Windows (dslrBooth)**. No se ha realizado ingeniería inversa de su código ni de protocolos propietarios: las conclusiones siguientes describen el comportamiento público documentado y sirven como referencia de producto, no como una copia de su implementación.

### 3.1 Flujo operativo que debemos emular y mejorar

1. Seleccionar evento, cámara, impresión y método de entrega.
2. Validar que el hardware esté disponible antes de atender personas.
3. Ejecutar la sesión: live view, cuenta regresiva, disparos y revisión.
4. Recibir las fotos de alta calidad y componer la salida desde una plantilla.
5. Crear un único archivo final con las dimensiones del material cargado.
6. Enviar el trabajo a una cola de impresión; nunca bloquear la interfaz ni perder una sesión ante una desconexión breve.
7. Imprimir y entregar la copia digital desde una pantalla posterior, sin frenar el siguiente grupo.

La documentación del proveedor confirma que trabaja con plantillas importables, configuraciones de impresión y un flujo de compartir posterior a la captura. Sus plantillas se importan como ZIP, lo que refuerza que una plantilla es un paquete de datos y recursos, no una imagen fija. [Importación de plantillas de LumaBooth](https://support.dslrbooth.com/hc/en-us/articles/203603974-Purchased-template-from-store)

### 3.2 Cámara y captura

LumaBooth/dslrBooth se apoya en cámaras conectadas por USB y en su configuración manual. Su documentación de incidencias menciona Canon y Nikon, la importancia de cables USB cortos y de buena calidad, alimentación estable, hubs alimentados cuando el equipo entrega poca potencia, modo manual y que otras aplicaciones de fotografía no tengan tomada la cámara. [Guía oficial de conexión de cámara](https://support.dslrbooth.com/hc/en-us/articles/202677020-Camera-not-connecting-or-disconnects)

Para flashes de estudio, la referencia oficial recomienda modo manual y sincronización por PC Sync —o adaptador si la cámara no trae el puerto—; ofrece como punto inicial f/7, 1/100 s, potencia de flash alta y ajuste del ISO mediante pruebas. Es una orientación de montaje, no una receta universal: el perfil de exposición deberá probarse por cámara, lente, flash y recinto. [Uso de flash externo](https://support.dslrbooth.com/hc/en-us/articles/202291274-Use-external-flash-with-camera)

**Decisión de arquitectura:** FotoCabina necesitará una capa `CameraAdapter` que oculte las diferencias entre:

- cámara web / cámara integrada para pruebas;
- Canon con SDK o control PTP compatible;
- Nikon con SDK o control PTP compatible;
- futuras marcas sólo después de validación por modelo.

La aplicación debe guardar perfiles por cámara: nombre, conexión, modo de captura, exposición, live view, orientación, retardo de cuenta regresiva y directorio temporal. No se debe prometer compatibilidad sólo por marca: se valida una matriz **modelo + firmware + cable + alimentación + Windows**.

### 3.3 Cómo se forma la impresión y quién corta el papel

La idea clave es que el software no “corta una imagen” por sí mismo. Compone una imagen final que coincide con el tamaño físico del medio y solicita a la impresora/driver ese trabajo. El controlador, el firmware y el material instalado de la impresora determinan si existe un corte y dónde se aplica.

Para la configuración de dos tiras, la opción robusta es:

```text
Plantilla 2 × 6     ─┐
                     ├─ duplicar ─> composición final 4 × 6 ─> driver / impresora
Plantilla 2 × 6     ─┘
```

La salida se rasteriza con resolución y perfil adecuados a la impresora. Si el modelo/material ofrece “cortar en tiras 2 × 6”, se activa el modo correspondiente del perfil de impresora; si no, se entrega el 4 × 6 completo o se usa una solución física compatible.

La documentación pública de LumaBooth muestra precisamente que el corte de 4 × 6 a dos tiras 2 × 6 se ofrece sólo cuando la combinación de impresora y material admite ese corte; también oculta tamaños no soportados por el firmware. [Notas de LumaBooth 5.3](https://dslrbooth.com/releases/lumabooth_apple/v5.3/) y [detalle de tamaños/corte 5.4.2](https://dslrbooth.com/blog/lumabooth-5-4-2-usb-print-sizes).

**Conclusión para FotoCabina:** no enviar “dos fotos 2 × 6” esperando que una DNP o HiTi adivine el corte. Se debe generar el **job completo 4 × 6**, asociarlo a un perfil de media específico y dejar que el driver/firmware haga el corte cuando el perfil lo permita.

### 3.4 Drivers, USB directo y perfiles de impresora

Hay dos vías que debemos distinguir:

| Vía | Qué hace | Uso previsto en FotoCabina |
| --- | --- | --- |
| **Driver de Windows / cola del sistema** | La aplicación entrega el raster final a una impresora instalada. El driver traduce el trabajo al protocolo del fabricante. | Primera vía de producción en Windows. Permite usar la impresora fija seleccionada y eliminar el diálogo manual de impresión. |
| **SDK o USB directo específico** | La aplicación implementa el protocolo/SDK permitido por el fabricante; puede detectar papel, estado y errores detallados. | Fase posterior, sólo para modelos validados y con SDK/licencia disponibles. |

En el prototipo actual, el botón de imprimir abre el diálogo de Windows. Es correcto como prueba, pero no será el flujo final. La aplicación de escritorio debe tener un `PrinterProfile` con el nombre/identificador de una impresora previamente elegida, tamaño de media, orientación, copias, corte y estrategia de reintento.

La referencia de LumaBooth es útil: documenta impresión USB directa para determinados equipos DNP, Citizen y HiTi, y también una ruta mediante un asistente de escritorio para impresoras con driver. [Opciones de impresión](https://support.dslrbooth.com/hc/en-us/articles/360005893753-Printing-with-LumaBooth). En su asistente, la impresora debe tener el driver del fabricante instalado, estar seleccionada y compartir red local con los dispositivos que envían trabajos; no necesita Internet. [LumaBooth Assistant](https://support.dslrbooth.com/hc/en-us/articles/228611008-LumaBooth-Assistant)

Para Windows/dslrBooth, la propia guía de errores pide que el tamaño de papel del layout coincida con el material/configuración del driver y que se use el driver actualizado del fabricante. [Error de driver de impresora](https://support.dslrbooth.com/hc/en-us/articles/360008265513-Printer-Driver-Error-Message)

### 3.5 Capas, layout y composición

La composición debe ser un motor propio, no una captura de pantalla del editor. Una plantilla se describe en unidades físicas/normalizadas y se renderiza a un lienzo de salida.

```text
Template JSON + recursos
        ↓
Resolver slots de foto, textos y variables de sesión
        ↓
Motor de capas / recorte / máscara / efectos
        ↓
Raster final con DPI y perfil de media
        ↓
PrintJob persistido → cola → driver o adaptador directo
```

Tipos iniciales de capa:

- `photo-slot`: fuente, recorte, posición de foco, rotación, máscara, borde, filtros.
- `image`: PNG/SVG/imagen con transparencia para overlays, logos y marcos.
- `text`: contenido, fuente, peso, estilo, color, alineación, interlineado, espaciado, transformación y ajuste a caja.
- `shape`: rectángulo, línea, círculo y color.
- `guide` / `safe-area`: sólo editor; jamás sale al raster de impresión.

La plantilla debe incluir su tamaño de salida, sangrado/área segura, DPI objetivo y si requiere duplicación a otra media.

**Decisión (2026-09-16): la plantilla manda sobre la sesión.** La cantidad de fotos que toma la cabina, el orden y la proporción de cada una (que define el marco de encuadre en pantalla) salen de los `photo-slot` de la plantilla activa, no de un ajuste manual. Si el editor entrega una plantilla con 10 huecos, la sesión toma 10 fotos. El ajuste "Fotos por sesión" que hoy tiene `01-camera-flow` es provisorio hasta que la cabina lea plantillas reales del editor (`03-editor-plantillas`). Los recursos —incluidas fuentes cargadas— deben viajar con la plantilla o su paquete para que el resultado no cambie en otro equipo.

### 3.6 Entrega digital y conectividad local

El QR de nube es opcional. DSLRBooth/LumaBooth documenta que sus QR online dependen de subir el resultado y que, si no se completa en un plazo breve, no deben retrasar la impresión. Su alternativa LumaShare ofrece QR offline. [Comportamiento de QR](https://support.dslrbooth.com/hc/en-us/articles/201432420-QR-Codes)

FotoCabina debe separar dos canales:

1. **Impresión local obligatoria:** cola local, sin Internet.
2. **Entrega digital local opcional:** red Wi‑Fi propia creada por la cabina, una URL temporal por sesión/QR y descarga desde el teléfono. Airdrop y Bluetooth se evaluarán por sistema operativo, permisos y experiencia; no serán el único canal.

No se debe depender del Wi‑Fi del recinto. Una red propia o router de viaje evita aislamiento de clientes y caídas típicas de redes de eventos; es el mismo principio operativo que documenta LumaBooth para su asistente de impresión. [LumaBooth Assistant](https://support.dslrbooth.com/hc/en-us/articles/228611008-LumaBooth-Assistant)

### 3.7 Operación distribuida en el evento (ideas registradas 2026-09-16)

Hoy se prueba y desarrolla solo en desktop; nada de esto se construye todavía. Se registra para que el motor y la arquitectura no cierren la puerta:

- **Control remoto desde el celular del operador.** El teléfono se vincula a la cabina activa por la red local del evento y permite disparar, pausar, cancelar o repetir una sesión a distancia, ver el preview y el estado de cámara/impresora. Es la pantalla G del mapa (`docs/MAPA_DE_PANTALLAS.md`).
- **Punto de retiro digital en tablet (Android/iOS).** Un servidor local levantado para el evento almacena las sesiones; una tablet en otro sector del salón actúa como estación donde cada invitado busca y se lleva sus fotos (por código de sesión, QR o galería del evento). Es una variante del compartir por QR, pensada para eventos donde no conviene que la gente se quede frente a la cabina.
- **Impresión a distancia.** Cuando la impresora soporte trabajos por Wi‑Fi, la cabina puede estar en un punto y la estación de retiro/impresión en otro, con la cola de impresión viajando por la red local.
- **Todo configurable por evento.** Cada evento decide si usa punto de retiro externo, impresión remota, QR en la cabina, o solo impresión local. La cabina debe funcionar completa sin ninguno de estos extras (offline primero, principio 1).

Consecuencia de arquitectura: las sesiones deben persistirse con un identificador estable y un formato que pueda servirse por HTTP local (hoy `01-camera-flow` ya las guarda con id, fotos, tira y GIF en IndexedDB — es el embrión de ese almacén).

**Avance 2026-09-17: maqueta visual del QR en el resultado (A8).** Se agregó a `01-camera-flow` una tarjeta con QR real en la esquina de la pantalla de resultado, con sus dos estados (esperando / descargado). Es solo maqueta: el QR apunta a una URL de muestra y el cambio de estado es un temporizador, porque todavía no existe el servidor local de Fase D que sirva la URL real y confirme la descarga. Detalle en `pages/01-camera-flow/README.md`.

**Decisión sobre "sin dependencias" y librerías de terceros vendorizadas (2026-09-17).** La regla de "sin dependencias ni CDNs" del proyecto apunta a evitar **llamadas de red en tiempo de ejecución** (un servicio externo que ve el contenido, se cae, o deja de ser gratis — como pasó con Google Charts). No prohíbe usar código de terceros auditado y probado, empaquetado como archivo local dentro de la carpeta de la página, sin ninguna llamada a internet. Ese es justamente el caso del generador de QR: un primer intento escrito a mano (Reed-Solomon, máscaras, formato BCH) no lograba producir códigos decodificables después de varias rondas de corrección, así que se reemplazó por la librería open source `qrcode` (MIT, sin dependencias propias) empaquetada como IIFE con `esbuild` y guardada como `qrcode.min.js` junto a la página — mismo criterio que ya se usaba para la fuente Inter. El codificador de GIF (`codificador-gif.js`), en cambio, sí se escribió a mano porque ahí funcionó y se verificó de punta a punta. Regla general: preferir código propio cuando es simple y se puede verificar bien; para algoritmos con un estándar exacto y muchos casos borde (como QR), vendorizar una librería auditada es más confiable que reimplementarlo.

### 3.8 Decisiones del flujo del invitado (tomadas probando `01-camera-flow`, 2026-09-16)

Valen para cualquier plataforma que corra la cabina, no solo para el prototipo web:

- **Repetir una foto solo antes de armar la tira.** La pantalla de revisión ("¿Usamos estas fotos?") es el único punto donde se reemplaza una foto puntual. Una vez compuesta la tira no hay vuelta atrás foto por foto: el resultado es un cierre, no otra ronda de edición. Sí existe "Borrar y repetir sesión" (empezar de cero), equivalente al de DSLRBooth.
- **La pantalla de resultado nunca hace scroll.** Dos zonas: la pieza (tira / fotos / GIF) escalada al alto, y un panel con las salidas y un único botón lima, "Finalizar", anclado abajo. En vertical el panel pasa abajo. Motivo: en un tótem táctil un botón fuera de vista es un botón que no existe.
- **La sesión se guarda sola al componer.** Si el invitado se va sin tocar nada, el operador la encuentra en la galería. "Finalizar" solo la marca como finalizada.
- **Vuelta automática al inicio** por inactividad en el resultado (configurable: nunca / 30 / 60 / 90 s), con aviso en los últimos 10 s. Cualquier toque reinicia el conteo.
- **Controles de emergencia del operador durante la sesión:** ESC cancela, botón "Pausar" congela y ofrece reanudar o cancelar. Volver al modo operador desde el modo invitado pide PIN.
- **Interstitial entre fotos** con duración configurable: además de dar tiempo a cambiar de pose, es la palanca para regular el ritmo de la fila.
- **Nunca emojis** en la interfaz; solo íconos monocromáticos (regla del sistema de diseño).

### 3.9 Conectar las pantallas entre sí: almacén compartido de eventos (2026-09-17)

Hasta ahora cada página (`01-camera-flow`, `04-lista-eventos`, `03-editor-plantillas`) vivía aislada: abrir "Lanzar" en la lista de eventos llevaba a la cabina sin pasarle ningún dato (ni nombre, ni plantilla, ni ajustes). Primer paso de conexión real entre pantallas, sin todavía tener backend:

- **Decisión:** los datos compartidos entre páginas (por ahora, eventos) viven en `localStorage` a través de un módulo único, `pages/shared/almacen-eventos.js`. Cualquier página que necesite leer o escribir eventos lo hace por esa interfaz (`listar`, `obtener`, `guardar`, `eliminar`, `setActivo`/`obtenerActivo` para "cuál es el evento activo ahora"), nunca tocando `localStorage` directo. El día que exista una capa de datos real (Fase E, §5.1.1), este archivo es el único punto a reemplazar — el resto de las páginas no cambia.
- **Se descartó** pasar datos solo por parámetros de URL (`?evento=id`): no alcanza para que una página "recuerde" el evento activo si se navega sin ese parámetro (por ejemplo, recargar la página).
- **Hecho (2026-09-17):** `04-lista-eventos` (C1) ya lee/escribe del almacén — lanzar, duplicar, archivar y eliminar son reales y persisten. `01-camera-flow` ya lee el evento activo al abrir: carga su nombre en el dropdown de evento, sus ajustes de sesión (fotos/cuenta/pausa/mensaje/PIN/volver/espejo, antes guardados sueltos en el equipo) y muestra su plantilla asignada. Si no hay evento activo (la cabina se abre directo, sin pasar por la lista), sigue funcionando exactamente igual que antes de esta conexión, con los ajustes generales del equipo.
- **Hecho (2026-09-21):** conectado `03-editor-plantillas` con el evento. El campo del evento ahora es `plantillaId` (referencia real a una plantilla del editor) más `plantilla` como nombre de respaldo para mostrar. Puntos 1-3 del plan original completados:
  1. `plantillaId` reemplaza al nombre de texto suelto en el almacén (`pages/shared/almacen-eventos.js`); `plantilla` se actualiza junto con él para no tener que ir a buscar el nombre al editor solo para pintar una card.
  2. En `04-lista-eventos`, cada card tiene un botón "Editar plantilla" (ícono de lápiz) que abre `03-editor-plantillas/index.html?evento=<id>`. En `01-camera-flow`, "Cambiar" y "Plantillas" hacen lo mismo cuando hay un evento activo real; si se abrió la cabina suelta (sin evento), se mantiene la hoja "Próximamente" de siempre.
  3. `03-editor-plantillas` (`app.js`, función `iniciarConexionEvento`) lee `?evento=id` de la URL: si el evento ya tiene una `plantillaId` válida, abre esa plantilla directo en el lienzo (salta la galería); si no, deja que se abra la galería normal y, apenas el operador abre o crea una plantilla ahí (evento `plantilla-abierta` de `EditorEstado`, que ya existía), la asocia a ese evento en el almacén. El editor usado suelto (sin `?evento=`) no se tocó: sigue exactamente igual.
  - **Punto 4 pendiente:** ajustar el número de fotos por sesión de `01-camera-flow` para que salga de los `photo-slot` de la plantilla real asignada, en vez del ajuste manual "Fotos por sesión" (decisión pendiente desde §3.5 — "la plantilla manda sobre la sesión"). `EditorEstado.fotosPorSesion()` ya existe y calcula ese número; falta que la cabina lo lea del editor cuando el evento tiene `plantillaId`.
  - Riesgo cuidado: el editor no tenía noción de "evento" y se conectó sin tocar `galeria.js` ni el flujo de duplicar/exportar/importar/renombrar — la conexión vive entera en un módulo aparte dentro de `app.js` (`iniciarConexionEvento`), suscrito a un evento que ya existía.

### 3.10 Decisiones del panel de operador (2026-09-22 / 2026-09-24)

Tomadas por el dueño del proyecto al construir C2 y C3:

- **El PIN de operador es universal**, no por evento. `docs/MAPA_DE_PANTALLAS.md` sugería configurarlo en C2 (crear evento); se descartó. Sigue en Ajustes de la cabina, igual para todos los eventos del equipo.
- **La configuración de cámara (C3) vive dentro de la cabina**, en Ajustes › Cámara, no como pantalla aparte. Es un panel que se abre y cierra en el lugar; no necesita un "volver".
- **La cámara elegida se guarda por evento** (campo `camaraId` en los ajustes del evento, junto con fotos/cuenta/pausa). Con dos cabinas en equipos distintos, cada evento recuerda la suya.
- **El identificador de cámara del navegador no es estable** (`deviceId` de MediaDevices): puede cambiar entre sesiones por privacidad, y cambia si se mueve el evento a otro equipo. Por eso, si la cámara guardada no responde, la cabina cae sola a la cámara del equipo en vez de bloquearse. Cuando llegue la app de escritorio con control directo de DSLR (§3.2, `CameraAdapter`), el perfil de cámara debería guardarse por modelo/número de serie, no por este identificador.

### 3.11 Esqueleto de arquitectura (2026-11-16)

Todo el detalle está en `docs/ARQUITECTURA_FLUJO.md`; aquí solo las decisiones de rumbo que quedan **propuestas**, a la espera del dueño (sección 8 de ese documento):

- La configuración se ordena en cuatro capas: **equipo, evento, plantilla y sesión**. La plantilla manda sobre la sesión (§3.5); la sesión congela la configuración con que se hizo; el evento congela sus plantillas al lanzarse.
- Un **validador único** (bloqueos, avisos y configuración efectiva) es el punto donde cada ajuste afecta al resto.
- Contrato de datos con versión, ids estables, registros separados de archivos y **adaptadores** (cámara, impresora, repositorio, entrega, licencia) para escalar a escritorio, Etapa 2 y otras plataformas sin reescribir pantallas.
- Hallazgo mayor: la cabina todavía **no dibuja la plantilla real** del evento al componer (ver §6.1 del documento maestro).
- Pantallas nuevas propuestas: A12 (cabina en pausa), C2c (revisión previa), C8 (ajustes del equipo), C9 (red y entrega digital), C10 (resumen y cierre), C11 (ayuda).
- Orden de construcción recomendado y prueba técnica de escritorio antes de la impresión: sección 7 de ese documento.

### 3.12 Hito 0.1b: plantilla congelada, eventos sin plantilla y recorte de cámara (2026-11-16)

Construido y certificado (Evidence Collector 6/6; código aprobado por Reality Checker). Detalle técnico en `docs/ARQUITECTURA_FLUJO.md` §7.5 y en `pages/shared/README.md`. Decisiones del dueño que quedan firmes:

- **Evento sin plantilla = "Lanzar" bloqueado (decisión 1A).** Un evento que no tiene plantilla asignada (los de demostración, o uno creado con "Elegir después") no se puede lanzar: la cabina muestra un aviso y el botón "Abrir el editor" hasta que se le asigne una. No se inventa una plantilla de respaldo.
- **Recorte en vez de estirar.** Con una cámara 16:9 (o cualquier proporción distinta del marco), la foto se recorta al encuadre exacto que el invitado ve en el marco; nunca se deforma. Lo que se ve dentro del marco es lo que queda en la foto.
- **Las sesiones conservan el diseño con que se tomaron; las nuevas usan la edición nueva.** Al lanzar, cada sesión guarda su propia copia de la plantilla. Si el operador edita la plantilla con el evento en marcha, la edición aplica a la sesión siguiente, sin relanzar el evento, y las sesiones ya hechas no cambian.
- **Foto suelta = recorte exacto del marco** (decisión de bajo riesgo): la foto individual que se descarga o se repite es la misma región que mostraba el marco, no la imagen completa de la cámara.
- **Número de sesión:** sale de un contador propio de cada evento, que no repite aunque se borren sesiones.

### 3.13 Hito 1.3: ciclo de vida del evento (2026-11-17)

Construido; detalle técnico en `docs/ARQUITECTURA_FLUJO.md` §2.6 y §7.2 y en `pages/shared/README.md`. Decisiones que quedan firmes:

- **Varios eventos "En curso" pueden coexistir.** Lanzar un evento lo pasa a "En curso" y no toca a los demás: dos eventos el mismo fin de semana (o dos cabinas) no se pisan. "En curso" lo pone el sistema al lanzar de verdad (desde la cabina), no al abrir la cabina.
- **"Reabrir" un archivado no pide confirmación** (se puede deshacer terminándolo otra vez). Vuelve a "En curso" si ya se había lanzado (queda la hora de lanzamiento) y a "Próximos" si nunca se lanzó. Un archivado no se puede lanzar: primero se reabre.
- **Un "Próximo" también se puede archivar** (por ejemplo, un evento cancelado antes de realizarse). Un evento en curso se cierra con "Terminar evento".
- **"Terminar evento" desde la cabina vuelve a la lista, en la pestaña Archivados**, con un aviso, mientras no exista la pantalla de cierre del evento (C10, resumen y respaldo al terminar). Las sesiones y sus fotos se conservan; terminar no borra nada.
- **Eliminar un archivado avisa cuántas sesiones se pierden** (todas, también las incompletas y la que estuviera abierta) y que no se puede deshacer. El número se cuenta de nuevo al abrir el aviso, y al aceptar se vuelve a leer el evento: si otra pestaña lo reabrió o lo cambió mientras tanto, no se elimina y se avisa.
- **La cabina no entra a modo invitado con un evento terminado o eliminado desde otra pestaña**: al lanzar y al tocar la pantalla de inicio se relee el evento y se avisa al operador.
- **Los avisos de confirmación son accesibles por teclado** (Escape, foco en Cancelar, el foco no se escapa del aviso, vuelve al botón de origen).

### 3.14 Hito 1.6: respaldo y restauración (2026-11-17)

Construido; detalle técnico en `docs/ARQUITECTURA_FLUJO.md` §7.9 y en `pages/shared/README.md`. Decisiones de producto (defaults de bajo riesgo, a confirmar por el dueño):

- **Pantalla propia "Respaldo"** (`pages/06-respaldo`), abierta desde el menú lateral de la lista de eventos, sin PIN. Se muda a Ajustes del equipo (C8) cuando exista.
- **Un respaldo es un ZIP estándar** que se abre en el Explorador de Windows. Trae eventos, plantillas, sesiones, fotos (tira, hoja, GIF) y copias de plantilla. **No trae el PIN** ni nada del Equipo: en otro equipo se crea un PIN nuevo; en el mismo se conserva el actual.
- **Las fotos de los invitados son datos personales:** la casilla "Incluir las fotos de los invitados" viene marcada, y sin ella no se guardan sesiones (solo eventos y plantillas).
- **Restaurar suma por defecto** ("Sumar a lo que ya tengo": no borra nada y lo que ya existe se queda). "Reemplazar todo" borra lo de ahora, pide confirmación con el botón rojo y ofrece respaldar antes. Siempre todo o nada: si algo falla, no se cambia nada.
- **Exportar e importar un evento suelto** desde la lista. Si el evento ya existe en el equipo, se importa como copia nueva "… (importado)" sin tocar el original; un evento importado nunca queda como evento activo.
- **Aviso de poco espacio** (desde 80 %) en la lista, sin bloquear nada, con enlace a Respaldo.

### 3.15 Hito 3: impresión de punta a punta con impresora simulada (2026-11-18)

Construido contra una impresora **simulada** detrás de un adaptador (`pages/shared/impresion.js`); el detalle técnico está en `docs/ARQUITECTURA_FLUJO.md` §7.10. No hay hardware, driver ni servidor local: lo real queda para la app de escritorio (hitos 3a y 8). Decisiones de arquitectura y producto:

- **La cola de impresión es persistente** (localStorage, un solo registro, para que el tope de hojas sea atómico) y nunca bloquea la interfaz: reintenta sola, escala tras 4 intentos y no reimprime sola una hoja que quedó a medias.
- **El diálogo de impresión del navegador ya no se usa** (una cola automática no puede abrir ventanas).
- **Tope de hojas:** cuenta lo comprometido, no solo lo impreso; solo con modo "Ambos"; mensaje amable antes de las fotos; las copias adicionales y las reimpresiones cuentan; se mide contra el tope vigente del evento.
- **Copias adicionales solo del operador** (con PIN). Conteo de hojas por evento y por impresora; una hoja 4 x 6 con dos tiras es 1 hoja.
- **D2 aplicada:** con la impresora en problemas, "Lanzar evento" se bloquea en "Solo impresión" y en "Ambos"; "Solo digital" no la mira.
- **Pendientes:** impresión real, estado real de la impresora, panel en vivo (C5), detalle (C6), errores (C7) y el conteo de hojas dentro del respaldo. La prueba técnica de escritorio (D8) está preparada en `docs/PRUEBA_TECNICA_ESCRITORIO.md` y espera el visto bueno del dueño.

## 4. Requisitos del editor de layouts

El editor debe sentirse cercano a Canva en precisión y productividad, no como un formulario con cajas movibles.

### Ya prototipado

- Lienzo 2 × 6 y vista de hoja 4 × 6 con dos copias.
- Agregar fotos, texto, formas e imágenes/logos.
- Capas, traer al frente, enviar atrás, duplicar, eliminar y bloquear.
- Selección múltiple mediante Shift y selección por área arrastrando como en el explorador de archivos.
- Movimiento del grupo sin desmarcarlo al arrastrar un elemento seleccionado.
- Guías de centro, alineación y magnetismo al acercarse.
- Medición de distancia entre elementos.
- Reconocimiento de **espaciado repetido**: si las fotos ya tienen la misma separación, un texto u otro elemento se ajusta a esa distancia y muestra una guía “X mm · igual”.
- Texto que no aumenta de altura sólo por moverlo con mouse o flechas.
- PNG de overlay sin fondo agregado: la transparencia debe conservarse sobre las fotos y el lienzo.

### Requisito tipográfico pendiente

El siguiente bloque de trabajo del editor es la tipografía. Debe incluir:

- mayúsculas, minúsculas y texto original, sin destruir el contenido fuente;
- negrita, cursiva, subrayado y tachado;
- selector de familias; interlineado y espaciado entre letras;
- alineación horizontal y vertical de la caja;
- ajuste inteligente cuando el texto supera la caja: crecimiento controlado, salto de línea y/o modo de ajuste elegido explícitamente;
- carga local de fuentes `.ttf`, `.otf`, `.woff` y `.woff2` de fuentes autorizadas; la fuente debe incorporarse al paquete de plantilla para que la impresión no cambie en otra máquina;
- misma tipografía en editor, previsualización y raster final de impresión.

Efectos como sombra, contorno, curvatura, gradiente y máscara de texto se consideran una fase posterior. La documentación oficial de Canva confirma que el mínimo esperado para un editor actual ya incluye fuente, peso, énfasis, alineación, espaciado y transformación entre mayúsculas/minúsculas. [Formato de texto en Canva](https://www.canva.com/help/format-text/)

## 5. Arquitectura objetivo

### 5.1 Aplicación y procesos

```text
Interfaz de cabina / editor
        │
        ├── Gestor de sesiones
        ├── Motor de plantillas y composición
        ├── Cola de impresión persistente
        ├── Entrega digital local
        └── Almacenamiento local de eventos
                 │
                 ▼
            Puente de hardware
        ├── CameraAdapter
        ├── FlashProfile / configuración de captura
        └── PrintAdapter
             ├── Windows printer spooler / SDK directo (desktop)
             └── Adaptador de cámara USB en iPad (mobile con DSLR)
```

Este bloque —el "motor de cabina"— es el mismo sin importar la plataforma ni si hay uno o mil clientes. No debe tener ninguna dependencia de licencias, planes o cuentas de usuario.

La elección concreta de shell de escritorio (por ejemplo, Tauri o Electron) y de framework mobile (nativo, React Native, Capacitor, etc.) queda pendiente de una prueba que abarque impresión, cámara y actualización offline en cada plataforma. Sea cual sea la elección, debe permitir compartir el motor de plantillas/composición entre desktop y mobile sin reescribirlo dos veces.

### 5.1.1 Capa de negocio (licencias, cuentas, planes)

Separada del motor de cabina, vive una capa liviana que responde una sola pregunta antes de dejar operar la app: **¿esta licencia/cuenta está activa?**

```text
App (desktop / iPad+DSLR / mobile liviana / complementaria)
        │
        ▼
  Capa de negocio (Firebase — reutilizando infraestructura de Luz Ai Studio)
        ├── Auth (cuenta del operador/cliente)
        ├── Licencias por plataforma (desktop / App Store / Play Store, cada una con su compra)
        ├── Estado de suscripción (activa / vencida / en gracia)
        └── Datos de cuenta compartidos entre plataformas (perfil, plantillas propias, eventos)
                 │
                 ▼
        Motor de cabina (offline, no sabe nada de lo anterior)
```

Reglas de esta capa:

- La validación de licencia es **periódica, no continua**: se chequea al abrir la app o cada cierto tiempo, y se guarda un permiso local con vencimiento corto (por ejemplo, algunos días de gracia). Nunca debe cortar una sesión de evento en curso por falta de señal de Internet.
- El modelo de planes (único plan vs. niveles Basic/Pro/etc.) **todavía no está definido** — se decide con más uso real y clientes concretos. La arquitectura solo debe dejar un lugar claro (`SubscriptionStatus`/`PlanId`) para no tener que reescribir el motor cuando se defina.
- Cada plataforma con hardware (desktop, iPad+DSLR, cabina liviana) valida **su propia licencia de esa tienda/canal**; la cuenta de usuario en Firebase es la que une todo (mismo login, plantillas y eventos visibles en la app complementaria/PWA sin importar desde qué plataforma se generaron).
- Durante la Etapa 1 (uso propio de Nico), esta capa puede ser tan simple como una bandera "licencia válida" fija; no hace falta construir el sistema de planes completo hasta que haya un segundo cliente real.

### 5.2 Entidades que deben persistirse

| Entidad | Responsabilidad |
| --- | --- |
| `EventProfile` | Nombre, diseño activo, modo de sesión, entrega, impresora y dispositivos. |
| `CameraProfile` | Modelo, adaptador, live view, exposición, cuenta regresiva y prueba de conexión. |
| `PrinterProfile` | Impresora específica, media, DPI, orientación, copias, modo de corte, color y límites de cola. |
| `Template` | Lienzo, unidades, capas, variables, recursos y versión. |
| `Session` | Capturas originales, composición final, fecha, estado, errores y entrega. |
| `PrintJob` | Archivo raster final, impresora, reintentos, estado y mensaje del driver. |
| `DeliveryLink` | Token local temporal, archivo asociado, vencimiento y estado de descarga. |

### 5.3 Estados de una sesión

```text
ready → countdown → capturing → review → composing → queued → printing → delivered
                                              │             │
                                              └── failed ───┘
```

Un error de cámara o impresora debe conservar la sesión y permitir reintentar; nunca debe borrar las fotos originales ni bloquear la siguiente sesión sin informar el estado.

## 6. Plan de implementación

Las fases A–D construyen el motor de cabina y corren en **desktop primero**, para uso propio de Nico (Etapa 1). Mobile y la capa de negocio (Fase E) se abordan recién cuando el motor esté validado con eventos reales — no antes, para no construir "para clientes" sin tener todavía ni un cliente.

### Fase A — prototipo visual y paquetes de plantilla

1. Finalizar tipografía del editor.
2. Reemplazar almacenamiento efímero por archivos de plantilla exportables/importables.
3. Empaquetar fuente, PNGs y metadatos junto al JSON de la plantilla.
4. Definir motor de render independiente de la pantalla del editor.

### Fase B — aplicación local y flujo de sesión

1. Crear shell de escritorio Windows.
2. Llevar `01-camera-flow` a una pantalla de sesión real. *(El flujo de invitado y los controles de operador ya están resueltos en el prototipo web — §3.8; falta conectarlo a plantillas reales del editor y a hardware.)*
3. Añadir almacenamiento local, recuperación después de reinicio y cola persistente.
4. Conectar una cámara de prueba concreta y validar captura de alta resolución.

### Fase C — impresión profesional

1. Implementar selección fija de impresora durante configuración, no por sesión.
2. Crear perfiles 4 × 6 / 2 × 6 y generar raster final desde la plantilla.
3. Validar una impresora real DNP o HiTi con su driver actualizado.
4. Medir corte, márgenes, color, tiempo por copia, errores y reimpresión.
5. Sólo después evaluar SDK/USB directo para modelos específicos.

### Fase D — entrega digital y operación

1. Router local de cabina y servidor HTTP local temporal.
2. QR offline por sesión, descarga rápida y vencimiento automático.
3. Panel de operador: estado de cámara, flash, papel, impresora, cola y red.
4. Telemetría o respaldo opcional cuando haya Internet, sin bloquear el evento.

### Fase E — comercialización (Etapa 2, después de validar con eventos reales)

1. Sumar la capa de negocio (sección 5.1.1) sobre Firebase: cuentas, licencia básica activa/inactiva.
2. Empaquetar y publicar la versión mobile "cabina con DSLR" (iPad + cámara USB), reusando el motor de plantillas/composición ya probado en desktop.
3. Publicar la app mobile complementaria (gestión de eventos, galería, cuenta) y evaluar la PWA para la galería que ve el invitado desde el QR.
4. Definir recién ahí el modelo de planes/precios (único vs. niveles) con datos de clientes reales, y construir el control remoto desktop↔mobile.
5. Agregar la cabina liviana (cámara del propio dispositivo) como entrada de menor costo, una vez validado el resto.

## 7. Validaciones antes de comprar o prometer compatibilidad

| Área | Preguntas que se deben responder con una prueba real |
| --- | --- |
| Cámara | ¿Qué modelo Canon/Nikon exacto? ¿Conecta y mantiene live view durante horas? ¿Qué cable/alimentación se usará? |
| Flash | ¿Qué trigger o PC Sync? ¿La exposición se mantiene con distintos grupos y alturas? |
| Impresora | ¿Modelo exacto DNP/HiTi, firmware, ribbon/media, driver y modo de corte? |
| Color | ¿Qué DPI y perfil entrega tonos de piel correctos? ¿Hay que compensar desde driver o motor? |
| Corte | ¿La media actual permite realmente 2 × 6 desde 4 × 6? ¿Qué ocurre con una cantidad impar de copias? |
| PC | ¿Puertos USB y alimentación suficientes? ¿La impresora y cámara mantienen conexión en un evento largo? |
| Entrega | ¿El teléfono se conecta a la red local sin Internet y descarga en menos de unos segundos? |

## 8. Regla de mantenimiento del repositorio

Antes de comenzar una función nueva:

1. Definir en qué página o módulo vive.
2. Crear o actualizar sus archivos separados, evitando lógica nueva dentro de HTML monolítico.
3. Actualizar este documento si cambia una decisión de producto, hardware o arquitectura.
4. Guardar el código y el contexto en el repositorio antes de publicar un nuevo sitio o prototipo.

Esto permite retomar FotoCabina incluso sin acceso a esta conversación o a créditos de una herramienta.

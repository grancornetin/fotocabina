# FotoCabina — contexto de producto, estudio de DSLRBooth y continuidad

> Documento de continuidad del proyecto. Mantenerlo actualizado cuando se tome una decisión de producto, hardware o arquitectura.
>
> Última revisión: 2026-09-16.

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
pages/
├── 01-camera-flow/      # MVP recuperado de captura, sesión y composición 4 × 6
└── 02-layout-editor/    # Editor visual de plantillas
docs/
└── DSLRBOOTH_PRODUCT_CONTEXT.md
```

Cada página conserva estructura, estilos y lógica en archivos separados (`index.html`, `styles.css`, `app.js`). Los módulos comunes que aparezcan más adelante irán en `shared/`; no se debe volver a concentrar toda la aplicación en un único HTML.

### Qué hay hoy

| Módulo | Estado | Alcance real |
| --- | --- | --- |
| `01-camera-flow` | MVP recuperado | Usa la cámara disponible del navegador, realiza una sesión de 2 o 3 fotos, compone un 4 × 6 y abre descarga/impresión. No controla todavía una DSLR, flash o impresora profesional. |
| `02-layout-editor` | Prototipo funcional | Crea layouts 2 × 6 / 4 × 6, capas, fotos, textos, formas e imágenes; prepara una vista de dos tiras en un 4 × 6. |

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
2. Llevar `01-camera-flow` a una pantalla de sesión real.
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

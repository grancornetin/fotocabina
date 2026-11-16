# Arquitectura del flujo — FotoCabina (esqueleto completo)

> Documento maestro. Responde una sola pregunta: **cómo encaja todo con todo** antes de construir más pantallas. Cubre quién usa la app, qué define a un evento, cómo cada decisión cambia otras, por dónde se mueve cada persona, qué debe poder hacer cada pantalla, qué datos se comparten y en qué orden conviene construir lo que falta.
>
> Nace el 2026-11-16 de un pedido del dueño: "todo es un solo flujo, interconectado; cada decisión afecta el evento de alguna forma y puede abrir puertas a decisiones nuevas". Es solo diseño y documentación: no cambia código.
>
> **Estado:** completo, revisado por el Reality Checker y por un Software Architect (2026-11-16); sus observaciones están integradas. Las decisiones de la sección 8 esperan al dueño y se le presentan en el chat.
>
> **Cómo se relaciona con los otros documentos** (no los duplica):
> - `PRODUCT.md` y `DESIGN.md` siguen mandando sobre producto y diseño. Este documento no los toca; si algo exige cambiarlos, está anotado en la sección 8.
> - `DSLRBOOTH_PRODUCT_CONTEXT.md` guarda las decisiones de producto, hardware y fases. Este documento manda en **cómo se conectan** pantallas, datos y ajustes.
> - `MAPA_DE_PANTALLAS.md` es el inventario y el estado de cada pantalla; `FLUJO_NAVEGACION.md` es el detalle pantalla por pantalla de errores y bordes. Este documento les pone el marco común y agrega las pantallas y piezas que faltaban.

## Cómo leerlo (para el dueño)

- La **sección 8** (decisiones) es lo único que requiere respuesta del dueño; se le presenta en el chat, cada una con la recomendación primero.
- La **sección 2** es el corazón: explica qué ajustes tiene un evento y qué pasa con el resto cuando cambias uno.
- Las demás secciones son el plano para quien construya: agentes de IA o, más adelante, un desarrollador.
- Palabras que se repiten: **equipo** = el computador (o iPad) donde corre la cabina; **ficha del evento** = todos los datos que definen un evento; **validador** = la revisión automática que dice si el evento está listo para lanzarse.

---

## 1. Tipos de usuario y roles

Hoy `PRODUCT.md` nombra dos roles (invitado y operador). Al pensar el flujo completo aparecen otros que cambian lo que cada pantalla debe mostrar. Los marcados "futuro" no se construyen ahora, pero la base de datos y las pantallas deben dejarles lugar.

| Rol | Quién es | Dónde está | Qué necesita | Qué NO debe ver ni poder hacer | Etapa |
| --- | --- | --- | --- | --- | --- |
| **Invitado en la cabina** | Persona en la fiesta, sin conocimiento del producto, 60 a 120 segundos, de pie, a veces con una copa y poca luz | Tótem táctil vertical (A1 a A12) | Entender sin instrucciones, saber qué viene, tener una segunda oportunidad en cada foto, irse con su foto (impresa y/o digital) | Configuración, errores técnicos, otros eventos, fotos de otros invitados, ningún teclado ni menú del sistema | 1 |
| **Operador** (hoy Nico; mañana un cliente suscrito) | Dueño de la cabina | Panel (C1 a C11), cabina en modo operador, editor de plantillas | Antes del evento: armar todo y comprobar que funciona. Durante: ver el estado de un vistazo, resolver un error con la fila esperando, volver rápido a donde estaba. Después: ver qué pasó y entregar el material | Nada queda fuera de su alcance, pero lo peligroso (borrar un evento con sesiones, cambiar la plantilla en pleno evento) pide confirmación explícita | 1 |
| **Ayudante del operador** (staff, anfitrión de turno) | Una persona que cuida la cabina mientras el operador atiende otra cosa | Cabina; panel en vivo C5; celular con control remoto (G) | Ver el estado, reintentar una impresión, pausar la cabina, avisar al operador | Cambiar ajustes, plantillas, eventos, borrar sesiones | Futuro. Hoy se resuelve con el mismo PIN; si hace falta, un segundo PIN "solo operar" |
| **Invitado en retiro digital** | Quien se lleva su foto en otro lugar: escaneando el QR desde su teléfono (H2) o buscándola en una tablet en el salón (H3) | Su celular, o una tablet del evento | Encontrar SU sesión rápido (QR, código corto o galería del evento), descargar tira, fotos y GIF, sin instalar nada | Ver sesiones de otros por accidente, ver el panel del operador | 1 (QR), futuro (tablet) |
| **Anfitrión** (quien contrató la cabina: novios, empresa, cumpleañero) | Cliente del operador. No usa el panel; recibe el resultado | Después del evento, en su celular o computador | Una galería del evento completa, descargable, con un enlace que dure | Cualquier ajuste | Futuro (hoy el operador entrega a mano). Ojo: "cliente" en los documentos a veces significa anfitrión y a veces operador suscrito; conviene separar los nombres |
| **Operador con cuenta (suscriptor)** | El mismo operador visto desde el negocio | App complementaria o web (D1 a D5, H1) | Pagar, ver su licencia, ver sus eventos desde el celular | No puede tocar datos de otros suscriptores (multi-inquilino) | 2 |
| **Control remoto** | El operador o su ayudante con el celular | Celular en la red local del evento (G1, G2) | Disparar, pausar, cancelar, ver preview y estado | Nada que la cabina física no permita; la cabina siempre manda | Futuro |

**Consecuencias de diseño** (ya aplicadas en las secciones siguientes):

1. Hay **dos densidades de información opuestas** (Principio 2 de `PRODUCT.md`): ninguna pantalla sirve a invitado y operador a la vez. Lo que ve el invitado nunca incluye datos del equipo, del PIN ni de otros eventos.
2. El PIN protege un **límite de confianza**: del lado del invitado nada técnico; del lado del operador todo. El día que exista el ayudante, el PIN se vuelve dos niveles, no se rehace el panel.
3. El **anfitrión** y el **invitado en retiro** consumen lo mismo: sesiones ya terminadas, solo lectura, con un enlace temporal. Se diseña una vez (galería de solo lectura) y sirve a los dos.
4. Etapa 1 se prueba con un solo operador, pero toda ficha lleva ya un lugar para "a qué cuenta pertenece" (vacío hoy) para no reescribir cuando haya suscriptores.

---

## 2. Modelo del evento: qué lo define y cómo se conecta

### 2.1 Las cuatro capas de configuración

El problema de fondo: hoy la cámara, el PIN, la copia y el modo de entrega conviven en la misma bolsa de ajustes del evento aunque no son del mismo tipo. Cuatro capas, cada dato en la suya:

| Capa | Qué contiene | Quién la cambia | Cuánto dura | Ejemplos |
| --- | --- | --- | --- | --- |
| **Equipo** | Lo que pertenece a ESTE computador o iPad, valga para el evento que valga | El operador, una vez, al instalar | Mientras exista el equipo | PIN de operador, impresoras y cámaras disponibles, red local/servidor de entrega, tema claro/oscuro, idioma, carpeta de datos, licencia (futuro) |
| **Evento** | Lo que define UN evento concreto | El operador, antes (y con cuidado, durante) | Mientras exista el evento | Nombre, fecha, modo de entrega, copias, plantillas habilitadas, ritmo de la sesión, cámara e impresora preferidas, QR, apariencia |
| **Plantilla** | El diseño de la pieza: papel, resolución, huecos de foto, textos, imágenes | El operador en el editor (B1) | Se reutiliza en muchos eventos | Tamaño en mm, 300 ppp, n.º de fotos, "duplicar en hoja 4×6", fuentes |
| **Sesión** | Lo que pasó con UN invitado | El sistema, nunca el operador | Para siempre (o hasta que se purgue) | Fotos originales, tira, GIF, estado, impresiones, entregas, **copia congelada de la configuración con que se hizo** |

**Dos reglas que ordenan todo lo demás:**

- **La plantilla manda sobre la sesión** (decisión 2026-09-16, `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.5). El n.º de fotos, la proporción de cada foto (marco de encuadre) y el papel salen de la plantilla. El evento no los repite.
- **La sesión congela su configuración, y el evento congela sus plantillas.** Al pasar a "En curso" el evento guarda una copia inmutable de cada plantilla habilitada (editar o borrar después la original no afecta a un evento ya lanzado, y el evento se puede mover a otro equipo con su plantilla). Al empezar cada sesión se guarda la configuración efectiva (referencia a esa copia, copias, modo de entrega, tiempos). Así, si el operador cambia algo en pleno evento, la sesión que está en pantalla no se corrompe y cada sesión guardada se puede reproducir o reimprimir tal como fue. Se mantiene la decisión del dueño de que la cámara se guarda por evento: solo cambia dónde vive el identificador (preferencia del evento sobre un hecho del equipo). Esto resuelve de raíz las "condiciones de carrera" que `FLUJO_NAVEGACION.md` lista sin resolver (A7, C2b).

### 2.2 La ficha del evento: todo lo que decide un evento

Estado = situación real revisada en el código el 2026-11-16. "Mal ubicado" = existe pero en la capa equivocada. "Nadie lo lee" = se guarda pero ninguna pantalla lo usa todavía.

| Grupo | Decisión / ajuste | Se define en | Hoy se guarda en | Estado |
| --- | --- | --- | --- | --- |
| **Identidad** | Nombre, fecha | C2 Crear evento | `evento.nombre`, `evento.fecha` | Existe. No se puede editar después (hueco, ver 6) |
| | Estado (próximo, en curso, archivado) | C1 (archivar) | `evento.estado` | Parcial: "Lanzar" no lo pasa a "en curso" y no existe "Terminar evento" |
| | Identificador, versión del formato, cuenta dueña | Sistema | `evento.id` | Falta versión y cuenta |
| **Entrega** | Modo: impresión / digital / ambos | C2 | `evento.entrega` | **Nadie lo lee**: la cabina siempre ofrece imprimir y QR |
| | Copias por sesión | C2 | `evento.copias` | **Nadie lo lee** |
| | Salidas digitales ofrecidas (tira, fotos, GIF) | Ajustes › Compartir | No existe | Falta. Hoy siempre se generan las tres |
| | QR activo y cuánto dura el enlace | Ajustes › Compartir (C9) | No existe | Falta. A8 es maqueta |
| **Plantilla** | Plantilla del evento | C2 / editor (B3) | `evento.plantillaId` + texto de respaldo `evento.plantilla` | Existe, solo UNA por evento |
| | Plantillas habilitadas para que el invitado elija (A2) | C2 | No existe | Falta |
| | N.º de fotos de la sesión | Plantilla | `ajustes.fotos` (a mano) | **Mal ubicado**: duplica lo que ya dice la plantilla |
| **Ritmo** | Cuenta regresiva, pausa entre fotos, mensaje de la pausa | Ajustes › Sesión | `ajustes.cuenta`, `pausa`, `mensajePausa` | Existe |
| | Volver al inicio por inactividad | Ajustes › Sesión | `ajustes.volver` | Existe, pero solo actúa en A7 |
| **Cámara** | Cámara elegida | Ajustes › Cámara (C3) | `ajustes.camaraId` | Existe. Es un hecho del equipo guardado como preferencia del evento (ver 2.1) |
| | Espejo | Ajustes › Cámara | `ajustes.espejo` | Existe |
| **Impresión** | Impresora, papel/media, corte, consumo de papel | Ajustes › Impresión (C4) | No existe | Falta |
| **Seguridad** | PIN de operador | Ajustes › Sesión | `ajustes.pin` en cada evento | **Mal ubicado**: se decidió "universal" (2026-09-22) pero se guarda copiado en cada evento |
| **Apariencia** | Textos de bienvenida/despedida, mensajes, logo | Ajustes › Efectos y asistente | No existe | Falta. Reservar el lugar; construir después |
| **Conservación** | Cuánto tiempo guardar sesiones, qué purgar | C10 / Ajustes | No existe | Falta |
| **Resultados** | N.º de sesiones, última sesión, impresiones, entregas | Derivado | `evento.sesiones` (número fijo de demostración) | **Mal**: la lista muestra un número inventado; la cabina cuenta de verdad en su propia base |

### 2.3 Qué pasa si cambias X: matriz de dependencias

Léela así: "si el operador cambia esto, el sistema debe recalcular / habilitar / bloquear / avisar esto otro". Esta tabla es la **especificación del validador** (2.4): cada fila es una regla que se escribe una sola vez y todas las pantallas usan.

| Si cambias… | Se recalcula o afecta | Habilita u oculta | Bloquea o avisa |
| --- | --- | --- | --- |
| **Modo de entrega = solo impresión** | A7 muestra Imprimir y oculta QR, Descargar y Compartir. No se genera el GIF (más rápido A6). Copias activas | A9 (imprimiendo), C4, semáforo de impresora obligatorio | **Bloquea** "Lanzar evento" si no hay impresora lista (en el navegador no se puede detectar la impresora: mientras no exista la app de escritorio solo **avisa**) |
| **Modo = solo digital** | A7 muestra QR y Descargar y oculta Imprimir. Copias no aplica. Se generan tira, fotos y GIF | C9 (red/QR), H2/H3 en el futuro | Semáforo de impresora pasa a "no aplica". **Bloquea** si no hay forma de entregar (sin servidor local ni red propia, un tótem sin teclado no sirve para descargar). Hoy el servidor no existe: el modo solo digital queda como "no disponible" hasta la Fase D |
| **Modo = ambos** | A7 muestra todo | Todo lo anterior | **Avisa** (no bloquea) si falta impresora: el evento sigue con entrega digital |
| **Plantilla (cambiar)** | N.º de fotos, duración de la sesión, marco de encuadre, papel, miniaturas, tamaño que ocupa cada sesión | A2 si el evento tiene 2 o más plantillas habilitadas | **Bloquea** si la plantilla no existe, no se puede dibujar o no tiene ninguna foto. **Avisa** si el papel no coincide con el de la impresora (`DSLRBOOTH_PRODUCT_CONTEXT.md` §3.4) |
| **Eliminar una plantilla** | Todos los eventos que la usan | | **Bloquea** si la usa un evento próximo o en curso (lista los eventos); eventos archivados solo avisan |
| **Cámara (cambiar)** | Proporción real de la foto frente al hueco de la plantilla (recorte), espejo recomendado, resolución disponible | | **Bloquea** si no hay cámara. **Avisa** si la resolución de la cámara no alcanza para el hueco más grande a la resolución de la plantilla (por ejemplo, una webcam contra un hueco grande a 300 ppp) |
| **Impresora (cambiar)** | Medios admitidos, tiempo por copia, si corta tiras, cola pendiente de la anterior | | **Avisa** si el papel de la plantilla no está entre los medios de la impresora. Con trabajos pendientes en la impresora anterior: preguntar qué hacer con ellos |
| **Copias** | Papel gastado por sesión; tiempo que la impresora necesita por invitado | | **Avisa** si (copias × tiempo de impresión) supera el tiempo de una sesión: la fila de impresión va a crecer (ver 2.5) |
| **Cuenta regresiva / pausa entre fotos** | Duración de la sesión, invitados por hora | | Sin bloqueos. Muestra al operador "≈ N s por sesión, ≈ M sesiones por hora" |
| **N.º de fotos (cambia solo porque cambió la plantilla)** | Todo lo de la fila "Plantilla"; cantidad de cuadros del GIF | | |
| **QR activo / vigencia del enlace** | Tarjeta del QR en A7, espacio que ocupan las sesiones en el equipo, qué ve H2 | Servidor local, C9 | **Bloquea** activar QR sin servidor local ni red propia. Un enlace vencido nunca debe dejar al invitado sin explicación |
| **Inactividad ("volver al inicio")** | Debe aplicar a A2, A3, A4, A5 y A7 con una sola regla (hoy solo A7) | | No debe contar mientras se imprime ni mientras se compone |
| **PIN (capa equipo)** | Vale para todos los eventos del equipo, de inmediato | | No se cambia con una sesión de invitado en curso. **Avisa** si sigue siendo el de fábrica |
| **Estado del evento** | Próximo → En curso al lanzar (un solo evento "en curso" por equipo: al cambiar el evento activo, el anterior vuelve a "próximo" o se pregunta; un "próximo" también se puede archivar sin lanzarlo). En curso → Archivado con "Terminar evento" | Archivado: galería solo lectura, resumen C10, exportar | Un evento archivado **no** se puede lanzar sin "reabrirlo" |
| **Eliminar un evento** | Sus sesiones, impresiones, enlaces | | **Pide confirmar mostrando cuántas sesiones y fotos se pierden** y ofrece exportar antes. Hoy las sesiones quedan huérfanas |
| **Duplicar un evento** | Copia la ficha completa, incluidos modo de entrega y copias (hoy el duplicado los pierde) (no las sesiones ni los contadores), mismo estado "próximo" | | **Avisa** si la plantilla que apunta ya no existe |
| **Mover el evento a otro equipo** | Cámara e impresora se vuelven a elegir (los identificadores no viajan) | | Aviso explícito al importar el paquete (sección 5) |
| **Retiro digital (futuro, H3)** | QR de A7 se reemplaza por "retira tu foto en la estación" + código corto | Servidor local, tablet de retiro | Requiere servidor y red propia |
| **Apariencia (futuro)** | A1, A7, A12: textos y marca | | Cualquier texto propio pasa por el mismo contraste y tamaños de `DESIGN.md` |
| **Licencia vencida (futuro, Etapa 2)** | Funciones de negocio (crear eventos nuevos, sincronizar) | | **Nunca** corta un evento en curso ni la impresión (principio offline-first) |

### 2.4 El validador: una sola revisión, usada por todos

La pieza que une las pantallas. Es una función sin pantalla propia: recibe equipo + evento + plantilla + una **foto del estado en vivo** (cámaras listadas, estado de impresora, espacio en disco, ya resueltos: la función nunca consulta hardware) y devuelve cuatro cosas. Cada bloqueo o aviso lleva un código estable y la acción que lo arregla ("abrir ajustes de cámara"), y la función se prueba con una tabla de casos en una página `tests.html` sin dependencias:

1. **Configuración efectiva**: los valores finales ya resueltos (por ejemplo "3 fotos, tira 2×6 duplicada en hoja 4×6, 2 copias"). Es lo que se congela dentro de cada sesión.
2. **Bloqueos**: cosas que impiden lanzar (sin cámara, sin plantilla válida, modo impresión sin impresora, disco casi lleno).
3. **Avisos**: cosas que permiten lanzar pero conviene saber (PIN de fábrica, papel distinto al de la impresora, resolución justa, sin servidor para el QR).
4. **Resumen para el operador**: "≈ 45 s por sesión · ≈ 60 sesiones por hora · la impresora tarda más que la sesión".

Quién la usa: C2 (al crear y editar, muestra avisos al elegir), C1 (marca en rojo un evento no lanzable), C2b/C2c (semáforos y panel "Listo para lanzar"), A1 (invitado: no invitar a tocar si hay bloqueo), A2, A9, C5 (estado en vivo), C10 (resumen). **Si una regla cambia, se cambia en un solo lugar**: es la respuesta técnica al "cada decisión afecta al evento".

Hoy esas reglas están desperdigadas o ausentes: el bloqueo por cámara vive dentro de `01-camera-flow`; el aviso por impresora está "pendiente de C4" (`FLUJO_NAVEGACION.md`, decisión 4); lo demás no existe.

**Refinamiento de la decisión 4 del flujo** ("lanzar se bloquea sin cámara y advierte sin impresora"): la impresora bloquea o solo advierte **según el modo de entrega**. Solo impresión: bloquea. Ambos: advierte. Solo digital: ni la mira. Está en la sección 8 para tu aprobación.

### 2.5 Ritmo de la fila: el cálculo que más le sirve al operador

Una sesión dura aproximadamente `fotos × cuenta + (fotos − 1) × pausa + revisión + composición`. La impresión toma su propio tiempo por hoja. **Si imprimir tarda más que una sesión, la fila de impresión crece sin parar aunque la cabina vaya perfecto.** El validador debe mostrar esa comparación antes de lanzar y C5 debe mostrarla en vivo. Las palancas son tres y ya existen o están previstas: la pausa entre fotos (A4), el n.º de copias y, a futuro, un tope de cola que avise "espera un momento" al invitado.

### 2.6 Ciclo de vida del evento

```text
  (crear)        (lanzar por 1.ª vez)        (Terminar evento)         (eliminar)
 Próximo  ───────►  En curso  ───────────►  Archivado  ───────────►  (desaparece, con aviso de lo que se pierde)
    ▲                  │  ▲                    │
    │                  │  └─ "Reabrir" ◄───────┘   (el operador se arrepiente)
    └── Duplicar crea un Próximo nuevo
```

- "En curso" lo pone el sistema al lanzar; "Archivado" lo pone el operador con **Terminar evento** (que lleva al resumen C10). Hoy ninguna de las dos transiciones ocurre sola.
- Varios eventos pueden estar "en curso" a la vez, uno por equipo (decisión 5 de `FLUJO_NAVEGACION.md`: el evento activo vive en el equipo).
- Un evento archivado es de **solo lectura**: se ve la galería, se exporta, se elimina; no recibe sesiones nuevas.

---

## 3. Mapa maestro de flujos

### 3.1 Todas las pantallas, existentes y futuras

Estado: **Hecha** (funciona en el navegador) · **Parcial** · **Falta** (Etapa 1) · **Futuro** (Etapa 2). Las filas marcadas **NUEVA** no estaban en `MAPA_DE_PANTALLAS.md`: aparecen al pensar el flujo completo y se proponen para sumarse (la sección 8 pide tu visto bueno).

**Invitado en la cabina (tótem)**

| Id | Pantalla | Estado | Se llega desde | Sale hacia | Vacío o caso especial | Al volver |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Espera / bienvenida | Hecha | Lanzar; fin de A7; cancelar; error fatal; arranque en frío | A2 o A3; "Operador" + PIN → C2b | Si el validador tiene un bloqueo: muestra A12 en vez de invitar a tocar | Siempre es el punto de reposo |
| A2 | Elegir plantilla | Falta | A1, solo si el evento habilita 2 o más | A3 | Evento con 1 plantilla: no existe. Sin tocar → A1 | Sin "atrás": flujo lineal |
| A3 | Cuenta regresiva y captura | Hecha | A1/A2; vuelve de A4 | A4 o A5; Pausar; ESC → A1 | Cámara se cae → A10 conservando las fotos buenas | Pausar: Reanudar o Cancelar |
| A4 | Pausa entre fotos | Hecha (mínima) | A3 | A3 | Animación futura falla → mensaje fijo | Igual que A3 |
| A5 | Revisión | Hecha | A3 (última foto) | A6; repetir una foto → A3 → A5 | Foto con error de captura: obliga a repetir | Ver decisión de abandono (sección 8) |
| A6 | Componiendo | Hecha | A5 | A7 | Tarda de más: mensaje, nunca spinner mudo | Sin cancelar |
| A7 | Resultado (incluye tarjeta QR = A8) | Hecha (QR maqueta) | A6 | A9 (imprimir); A1 (Finalizar o inactividad) | Muestra solo las salidas que el modo de entrega permite | Cierre = "Finalizar" lima, sin scroll |
| A9 | Imprimiendo | Falta | A7, Imprimir | A7 | Sin impresora: el botón Imprimir no existe en ese modo | Vuelve a A7 sin bloquear al siguiente |
| A10 | Error de sesión | Parcial (solo cámara) | Cualquier paso A3 a A9 | Mismo paso; A1; escala → C7 | Mensaje único y amable, sin términos técnicos | Reintenta donde falló, no desde cero |
| A12 | **NUEVA** Cabina en pausa o no lista | Falta | A1 con bloqueo; "Pausar cabina" del operador; error antes de empezar | A1 cuando el validador queda sin bloqueos | "Volvemos en un momento", sin culpar ni explicar | Se vuelve sola a A1 |

**Editor de plantillas (operador)**

| Id | Pantalla | Estado | Nota de conexión |
| --- | --- | --- | --- |
| B1 a B4 | Editor, tipografía, galería, vista de hoja | Hechas, aprobadas | Sin cambios de flujo. Dos huecos conocidos: sin aviso de cambios sin guardar y sin advertencia al borrar una plantilla en uso (regla de 2.3) |

**Panel del operador**

| Id | Pantalla | Estado | Se llega desde | Sale hacia | Vacío o caso especial | Al volver |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | Lista de eventos | Hecha | Apertura de la app; logo "Inicio" desde cualquier pantalla del panel | C2, B1/B3, C2b, C10, galería | Sin eventos: "Aún no tienes eventos" + Crear + Importar. Fila marcada si el validador la ve no lanzable | Conserva la pestaña y la posición |
| C2 | Crear evento / **Editar evento** | Parcial (solo crea) | C1 | C1 (guardar y volver, un solo paso) | Plantilla "elegir después": el evento queda "no lanzable" y C1 lo dice | Cancelar avisa si hay cambios |
| C2b | Cabina en modo operador | Hecha (estructura) | C1 (Lanzar); PIN desde A1 | A1; B1; C1; A11; Ajustes | Con el panel C2c integrado | PIN: vuelve sin perder cámara ni sesiones |
| C2c | **NUEVA** Revisión previa ("Listo para lanzar") | Falta | Panel dentro de C2b | Lleva a corregir cada ítem | Cada bloqueo trae su botón "Arreglar" | Se vuelve a calcular al volver |
| C3 | Cámara | Hecha (panel en Ajustes) | C2b > Ajustes | Cierra en el lugar | Sin cámara: explica la causa | Sin "volver" |
| C4 | Impresora | Falta | C2b > Ajustes (y semáforo) | Cierra en el lugar | Modo solo digital: "No aplica" | Sin "volver" |
| C5 | Panel en vivo | Falta | C2b durante el evento; segunda ventana; celular (G) | C7; C6; pausar → A12 | Sin sesiones aún: "Todo listo, esperando al primer invitado" | Puede quedar abierto en paralelo |
| C6 | Detalle de sesión | Falta | A11, C5, C1 (evento archivado) | Reimprimir → A9; cerrar | Fotos originales faltantes: lo dice, sin huecos mudos | Vuelve a la pantalla de origen |
| C7 | Resolución de errores | Falta | A10 (con PIN), C5 | Reintentar → punto que falló | Varios errores a la vez: los lista todos | Vuelve a donde fallaba |
| C8 | **NUEVA** Ajustes del equipo | Falta | C1 (menú "Equipo"); primer arranque | C1 | Primer uso: asistente corto (PIN, cámara, impresora) | Guarda y vuelve |
| C9 | **NUEVA** Red y entrega digital | Falta (Fase D) | C2b > Ajustes > Compartir | Cierra en el lugar | Servidor no levanta: causa y botón reintentar; nunca frena la impresión | Sin "volver" |
| C10 | **NUEVA** Resumen y cierre del evento | Falta | "Terminar evento" (C5/C2b); C1 en un archivado | Exportar, entregar al anfitrión, C1 | Evento sin sesiones: lo dice y permite archivar igual | Vuelve a C1 con el evento archivado |
| C11 | **NUEVA** Ayuda del operador | Falta | C2b y C1 (hoy "Próximamente") | Cierra en el lugar | Guía de montaje y qué hacer ante cada error de C7 | Sin "volver" |

**Etapa 2 (solo reservadas)**: D1 a D5 (cuenta y licencia) y **D6 NUEVA** (miembros y ayudantes, para el rol de 1). E, F: la cabina en iPad y la liviana reutilizan A1 a A12. G1 y G2: control remoto. H1 galería del operador; H2 galería del invitado; H3 punto de retiro; H4 impresión remota; **H5 NUEVA** galería del anfitrión (solo lectura, todo el evento).

### 3.2 El viaje completo en tres momentos

**Antes del evento (el operador, sentado)**

```text
Primer uso del equipo ─► C8 (PIN propio, cámara, impresora)
C1 Lista de eventos
 ├─ vacía ─► "Crea tu primer evento" ─► C2 ─► (guardar) ─► C1
 ├─ Editar evento ─► C2 en modo edición ─► C1
 ├─ Editar plantilla ─► B3/B1 ─("Lanzar evento")─► C2b
 └─ Lanzar ─► C2b
C2b Cabina en modo operador
 ├─ C2c "Listo para lanzar": cámara, plantilla, impresora, disco, PIN, servidor; cada ítem con "Arreglar"
 ├─ Ajustes: Sesión · Cámara (C3) · Impresión (C4) · Compartir (C9) · Efectos
 ├─ "Ensayo": una sesión de prueba como invitado (no cuenta en los números y se borra sola)
 └─ Galería · Plantilla · Ayuda · logo ─► C1
```

**Durante el evento**

```text
C2b ─"Lanzar evento"─► A1 (pantalla completa; el evento pasa a "En curso")
A1 ─► [A2] ─► A3 ⇄ A4 ─► A5 ─► A6 ─► A7 ─(Imprimir)─► A9 ─► A7 ─(Finalizar o inactividad)─► A1
Cualquier paso ─(falla)─► A10 ─(reintento)─► mismo paso   │  ─(escala con PIN)─► C7
A1 ─(ESC o Operador + PIN)─► C2b
Operador: C5 en una segunda ventana o en el celular; "Pausar cabina" muestra A12; "Terminar evento" ─► C10
```

**Después del evento**

```text
C10 Resumen ─► exportar paquete / entregar al anfitrión ─► C1 (evento archivado)
C1 > Archivados ─► ver sesiones (C6, sin lanzar la cabina) ─► exportar ─► eliminar (con aviso)
Etapa 2: H1 y H5 desde el celular o la web
```

### 3.3 Reglas de "qué pasa al volver" y al reabrir

1. **Pantalla de tarea puntual** (editor, crear/editar evento, ajustes): devuelve a quien la abrió, con lo hecho ya guardado y con un botón que dice a dónde va. Es el principio ya vigente (`FLUJO_NAVEGACION.md`).
2. **Pantalla de destino** (lista de eventos, cabina antes de lanzar): sin "volver".
3. **Operador entra con PIN en medio de una sesión de invitado**: la sesión se pausa; el operador elige Reanudar o Cancelar. Los cambios de ajustes que haga valen desde la **próxima** sesión (la actual los tiene congelados).
4. **Cierre inesperado o corte de luz**: al reabrir, la app propone "Continuar el evento" directo al estado anterior. Las sesiones a medias quedan en la galería como "incompletas" con sus fotos; los trabajos de impresión pendientes se retoman **pidiendo confirmación** (para no imprimir fotos viejas por sorpresa).
5. **Formularios largos** (C2, editor): avisan antes de perder cambios. El resto guarda en el momento y no pregunta.
6. **Evento activo eliminado o archivado desde otra pestaña**: la cabina lo detecta, no lanza un evento fantasma y lleva a C1.

### 3.4 Errores y estados vacíos: la regla general

- El **invitado** ve un solo tipo de error: un mensaje amable y breve (A10, A12). Nunca "cámara no encontrada" ni códigos.
- El **operador** ve el detalle con la acción concreta (C7): qué falló, qué hacer, y un botón que reintenta sin repetir la sesión.
- **Sin Internet nunca es un error de cabina** (offline-first). Solo se avisa en pantallas de cuenta o licencia, separadas de los errores de hardware.
- Los casos por pantalla (impresora sin papel, atascada, desconectada; cámara; servidor local; guardado lleno; abandono) ya están en `FLUJO_NAVEGACION.md` y siguen valiendo. Este documento no los repite; agrega solo los que aparecen por las piezas nuevas: A12, C2c, C8, C9, C10 y el modo de entrega.

---

## 4. Funciones por pantalla y por usuario

Cada bloque dice qué **debe poder hacer** cada usuario, qué **no debe**, y qué datos lee y escribe (los nombres de datos se explican en la sección 5). Es la lista de aceptación para construir y probar cada pantalla.

### Invitado

**A1 Espera.** Debe poder: entender de un vistazo que toca la pantalla para empezar; ver (opcional) el nombre del evento. No debe: ver ningún dato técnico ni botones de operador salvo el acceso discreto con PIN. Lee: evento, validador (¿hay bloqueo?). Escribe: nada.

**A2 Elegir plantilla.** Debe poder: ver 2 a 4 miniaturas legibles a un metro y tocar una; si no toca, volver a A1 por inactividad. No debe: mostrar plantillas que no se pueden dibujar. Lee: plantillas habilitadas del evento. Escribe: la elegida en la sesión.

**A3 Captura.** Debe poder: ver cuenta regresiva grande, el marco de encuadre proporcional al hueco de la plantilla y cuántas fotos quedan. No debe: permitir que un toque accidental altere la cuenta. Lee: configuración efectiva. Escribe: cada foto original, de inmediato (si se corta la luz, no se pierde).

**A4 Pausa entre fotos.** Debe poder: dar tiempo y ánimo ("cambia de pose"), con el mensaje que eligió el operador. Palanca de ritmo de la fila. Lee: pausa, mensaje.

**A5 Revisión.** Debe poder: ver las fotos, repetir una puntual, confirmar o borrar y repetir la sesión. No debe: dejar confirmar con una foto con error. Escribe: foto reemplazada. Abandono: ver decisión en la sección 8.

**A6 Componiendo.** Debe poder: nada; solo esperar menos de 3 s. Si tarda, decirlo. Escribe: tira (y GIF solo si el modo es digital).

**A7 Resultado.** Debe poder: ver la pieza, imprimir, descargar, compartir, escanear el QR y cerrar con un solo botón lima, sin scroll. Las salidas visibles dependen del modo de entrega. No debe: mostrar Imprimir en modo solo digital ni QR en modo solo impresión. Lee: configuración congelada de la sesión. Escribe: sesión final; pedido de impresión; estado de entrega.

**A9 Imprimiendo.** Debe poder: confirmar "Enviado a imprimir" y volver a A7 sin esperar. Escribe: trabajo de impresión en la cola persistente. No debe: bloquear al siguiente invitado ni perder el trabajo si la impresora falla.

**A10 Error.** Debe poder: un mensaje único, un reintento automático breve, y avisar al operador sin que el invitado haga nada. No debe: mostrar detalle técnico. Conserva siempre las fotos.

**A12 Cabina en pausa o no lista.** Debe poder: decir "Volvemos en un momento" y volver sola a A1 al resolverse. No debe: invitar a tocar ni pedir nada.

### Operador (panel)

**C1 Lista de eventos.** Debe poder: ver eventos por estado con datos reales (sesiones, última sesión, si es lanzable); crear, **editar**, duplicar, lanzar, **terminar**, archivar, reabrir, eliminar (con aviso de lo que se pierde), exportar e importar un evento, abrir el resumen o las sesiones de un evento archivado sin lanzar la cabina, y entrar a Plantillas, Equipo y Ayuda desde el menú lateral. Lee: eventos, validador, conteo real de sesiones. Escribe: estado del evento.

**C2 Crear y editar evento.** Debe poder: nombre, fecha, modo de entrega, copias, una o varias plantillas habilitadas (y cuál va por defecto), y ver al instante los avisos del validador ("esta plantilla no cabe en el papel de la impresora"). El mismo formulario sirve para editar. No debe: pedir cosas del equipo (PIN, hardware). Escribe: ficha del evento.

**C2b Cabina en modo operador.** Debe poder: ver semáforos reales, el panel C2c, la tarjeta con plantilla y ritmo estimado, abrir ajustes, el editor y la galería, hacer un ensayo, y lanzar. "Lanzar evento" se bloquea según el validador (sección 2.4). Lee: validador. Escribe: evento activo, estado "en curso".

**C2c Revisión previa.** Debe poder: listar cada ítem con verde, amarillo (aviso) o rojo (bloqueo), explicarlo en una frase y llevar a arreglarlo con un toque. Mostrar el resumen de ritmo (2.5). No debe: ser una pantalla aparte: es un panel dentro de C2b.

**C3 Cámara.** Hecha. Debe poder (ya puede): elegir cámara, ver la prueba en vivo, espejo, recuperarse si la cámara se cae. Pendiente: avisar de la resolución frente al hueco de la plantilla.

**C4 Impresora.** Debe poder: elegir la impresora, ver los medios que admite, elegir papel (el de la plantilla por defecto), copias por defecto, hacer una impresión de prueba, configurar el consumo de papel (cuántas copias trae el rollo) para recibir aviso antes de que se acabe, y decidir qué hacer con trabajos pendientes al cambiar de impresora. En el navegador solo se puede hacer parte (ver sección 6, hallazgo 8). Escribe: perfil de impresora (capa equipo) y preferencia en el evento.

**C5 Panel en vivo.** Debe poder: ver de un vistazo cámara, impresora, red, cola de impresión (cuántos trabajos, cuánto atraso), sesiones del día, invitados atendidos, la comparación sesión contra impresión (2.5) y alertas que no se pueden pasar por alto; pausar y reanudar la cabina (A12); reintentar un trabajo; terminar el evento. Debe poder abrirse **sin cerrar el modo invitado** (segunda ventana o celular). No debe: permitir cambiar ajustes sin PIN. Lee: mensajes de la cabina (sección 5.4). Escribe: órdenes de pausa o reintento.

**C6 Detalle de sesión.** Debe poder: ver fotos originales, tira, GIF, configuración con que se hizo, historial de impresión y entrega, reimprimir y reenviar el enlace, borrar. Muestra en qué paso falló una sesión fallida y ofrece reintentar desde ahí.

**C7 Resolución de errores.** Debe poder: diagnóstico con detalle real, pasos concretos, reintento selectivo (reimprimir sin repetir la sesión), desactivar un canal que falla (por ejemplo el QR) y seguir solo con impresión, y mostrar varios errores a la vez, priorizados.

**C8 Ajustes del equipo.** Se abre con PIN. Debe poder: cambiar el PIN (con aviso si sigue el de fábrica), ver cámaras e impresoras conocidas, elegir tema claro/oscuro, ver espacio en disco, hacer un **respaldo completo** y restaurarlo, y a futuro ver la licencia. Es la casa de todo lo de la capa equipo.

**C9 Red y entrega digital.** Debe poder: encender y apagar el servidor local, ver el nombre de la red y la dirección, probar con el propio teléfono, elegir la vigencia de los enlaces y las salidas ofrecidas, y ver el estado en tiempo real. Requiere la app de escritorio (Fase D).

**C10 Resumen y cierre.** Debe poder: ver sesiones, copias impresas, entregas descargadas, errores y tiempo promedio; exportar todo el evento (fotos, tiras, GIF, ficha) a un archivo para el anfitrión; decidir cuánto conservar en el equipo; archivar.

**C11 Ayuda del operador.** Debe poder: guía de montaje en orden, y por cada error de C7 el paso a paso. Puede ser texto estático.

**Editor B1 a B4.** Sin funciones nuevas. Debe poder (agregado): avisar si se borra una plantilla que usa un evento próximo o en curso; mostrar "esta plantilla pide N fotos y papel X × Y" como resumen que C2 reutiliza.

### Etapa 2 (resumen; el detalle está en `FLUJO_NAVEGACION.md`)

- **D1 a D5:** cuenta y licencia; nunca cortan un evento en curso. **D6** (nueva): invitar ayudantes con permiso "solo operar".
- **E y F:** reutilizan A1 a A12 con otra plataforma de captura. **G:** control remoto, habla con la cabina por la red local usando los mismos mensajes de 5.4.
- **H2 y H5:** galería de solo lectura (invitado o anfitrión) sobre el mismo enlace temporal. **H3:** estación de retiro con búsqueda por código corto. **H4:** impresión remota usando la misma cola.

---

## 5. Contrato de datos entre pantallas

Es el acuerdo sobre **qué se comparte y con qué forma**, para que la misma información viaje igual entre las pantallas de hoy (páginas del navegador), la futura app de escritorio, la Etapa 2 (cuentas y nube) y las demás plataformas (iPad, celular liviano, control remoto) **sin reescribir las pantallas**. No es código: es el plano que el código debe respetar.

### 5.1 Siete reglas del contrato

1. **Todo registro lleva su versión de formato** (`version`), un **identificador estable** de texto (nunca un contador 1, 2, 3, que choca al unir datos de dos equipos), fechas en formato universal (`2026-11-16T21:30:00Z`), el **equipo de origen** y la **cuenta dueña** (vacía hoy). Con esos cuatro campos, mover datos entre equipos o subirlos a la nube después no exige reescribir nada.
2. **Datos livianos y archivos pesados van separados** (en el navegador: un segundo almacén `archivos` en la misma base IndexedDB, con borrado en cascada al borrar sesión o evento, y cada foto se escribe junto con su registro en una sola transacción; se pide almacenamiento persistente al lanzar). Las plantillas con fuentes e imágenes también pasan a ese almacén, porque `localStorage` se llena rápido. El registro (JSON) dice "esta sesión tiene la foto `f-8k2`"; la foto vive aparte. Los registros se pueden sincronizar y respaldar rápido; las fotos solo cuando el operador quiera.
3. **No se guarda lo que se puede calcular.** El n.º de fotos sale de la plantilla; el n.º de sesiones, de contar sesiones; el nombre de la plantilla, de la plantilla. Un dato guardado dos veces tarde o temprano se contradice (hoy pasa con `fotos` y con `sesiones`).
4. **Se agregan campos, no se renombran.** Un lector nuevo entiende registros viejos (los migra al leer) y uno viejo no destruye lo que no entiende (lo conserva al guardar).
5. **Unidades fijas:** milímetros para papel y huecos, píxeles solo en la imagen final, segundos para tiempos.
6. **Una sola puerta de acceso.** Ninguna pantalla toca `localStorage` ni IndexedDB directamente: todas hablan con el "repositorio" y los "adaptadores" (5.5). Ya se cumple a medias con `AlmacenEventos`; falta para sesiones, equipo e impresión.
7. **La puerta es asíncrona desde ya** (responde con promesas, aunque hoy conteste al instante). Hoy `AlmacenEventos` responde de forma síncrona; cuando el almacén sea una base de datos o la red, un cambio de síncrono a asíncrono obliga a tocar todas las pantallas. Hacerlo ahora cuesta poco (pocas pantallas lo usan) y evita ese costo después.

### 5.2 Las entidades y dónde viven en cada etapa

| Entidad | Capa | Qué guarda | Hoy (navegador) | App de escritorio (Etapa 1 real) | Etapa 2 y otras plataformas |
| --- | --- | --- | --- | --- | --- |
| **Equipo** | Equipo | PIN, cámaras e impresoras conocidas, red local, tema, carpeta de datos | Claves sueltas de `localStorage` mezcladas con ajustes de evento | Archivo de configuración local | Local; solo las preferencias se sincronizan |
| **Evento (v2)** | Evento | Ficha completa (5.3) | `localStorage`, clave `fotocabina-eventos` | Base de datos local | Se sincroniza con la cuenta (datos livianos) |
| **Plantilla** | Plantilla | Papel, huecos, capas, fuentes e imágenes incrustadas | `localStorage`, clave `fotocabina-editor-v1`; exportable como `.fotocabina.json` | Carpeta de plantillas + base de datos | Se sincroniza; formato ya versionado, es el que viaja |
| **Sesión (v2)** | Sesión | Estado, configuración congelada, referencias a fotos, tira, GIF, impresiones y entrega | IndexedDB `fotocabina`/`sesiones`, con las imágenes dentro del registro; **sin versión ni configuración congelada** | Base de datos + carpeta de archivos | Metadatos opcionales a la nube; archivos solo si el operador activa respaldo |
| **Trabajo de impresión** | Sesión | Qué se imprime, en qué impresora, cuántas copias, estado, intentos, último error | **No existe** | Cola persistente en base de datos | Igual; en H4 la cola cruza la red local |
| **Enlace de entrega** | Sesión | Código temporal, archivo asociado, vencimiento, descargas | **No existe** (A8 es maqueta) | Servidor local lo emite y lo valida | Nube opcional si el operador lo configura |
| **Paquete de evento** | Evento | Ficha + plantilla + sesiones + archivos en un solo archivo | **No existe** | Exportar e importar | Es la base del respaldo y de entregar al anfitrión |
| **Licencia local** | Equipo | Estado, vencimiento, plataformas | No existe (Etapa 1: siempre activa) | Archivo firmado con vencimiento de gracia | Capa de negocio; el motor solo pregunta "¿activa?" |

### 5.3 Formato propuesto (resumido)

**Evento v2.** Nótese lo que NO está: `fotos`, `pin`, `sesiones` ni el nombre de la plantilla.

```json
{
  "version": 2,
  "id": "ev-lq3k9-a1b2",
  "cuentaId": null,
  "equipoOrigen": "eq-9f3a",
  "nombre": "Casamiento de Juli y Fran",
  "fecha": "2026-10-03",
  "estado": "proximo",
  "entrega": {
    "modo": "ambos",
    "copias": 2,
    "salidasDigitales": ["tira", "fotos", "gif"],
    "qr": { "activo": true, "vigenciaHoras": 48 }
  },
  "plantillas": { "habilitadas": ["tpl-4d1c"], "porDefecto": "tpl-4d1c" },
  "ritmo": { "cuentaSeg": 3, "pausaSeg": 3, "mensajePausa": "Cambia de pose", "pacienciaSeg": 30 },
  "preferenciasDeEquipo": {
    "camara": { "referencia": "eq-9f3a/cam-1", "espejo": true },
    "impresora": { "referencia": "eq-9f3a/imp-1", "medio": "4x6" }
  },
  "apariencia": {},
  "conservacion": { "purgarTrasDias": null },
  "creadoEn": "2026-09-22T14:02:11Z",
  "actualizadoEn": "2026-11-16T20:10:45Z"
}
```

**Migración desde el formato de hoy** (antes de sobrescribir se guarda una copia de respaldo de la clave vieja; el estado plural actual `proximos / en-curso / archivados` equivale a `proximo / en-curso / archivado`; hay que quitar de la cabina el selector manual de fotos en el mismo cambio): `entrega` y `copias` pasan a `entrega.modo` y `entrega.copias`; `plantillaId` pasa a `plantillas`; `ajustes.cuenta/pausa/mensajePausa/volver` pasan a `ritmo`; `ajustes.camaraId/espejo` pasan a `preferenciasDeEquipo.camara`; `ajustes.pin` sube al Equipo; `ajustes.fotos`, `plantilla` (texto) y `sesiones` se descartan (se derivan).

**Sesión v2.** Reglas: se mantienen los nombres que ya existen (`evento`, `fecha`) y se agregan campos, no se renombran; las impresiones y entregas se consultan por `sesionId` desde su propio registro (la sesión no lista ids); `salidas` guarda la tira y la **hoja compuesta** que de verdad se imprime. Los ids nuevos usan `crypto.randomUUID()`; los enlaces de entrega, 128 bits aleatorios y nunca un id de sesión.

```json
{
  "version": 2,
  "id": "s-lq3k9-x7p2",
  "eventoId": "ev-lq3k9-a1b2",
  "equipoId": "eq-9f3a",
  "esEnsayo": false,
  "estado": "compuesta",
  "plantilla": { "id": "tpl-4d1c", "copiaCongelada": true },
  "configCongelada": {
    "fotos": 3,
    "papel": { "anchoMm": 50.8, "altoMm": 152.4, "ppp": 300, "duplicarEnHoja": true },
    "modo": "ambos", "copias": 2, "cuentaSeg": 3, "pausaSeg": 3
  },
  "fotos": [{ "n": 1, "archivo": "f-a1", "intentos": 1 }],
  "salidas": { "tira": "f-t1", "hoja": "f-h1", "gif": "f-g1" },
  "iniciadaEn": "2026-10-03T21:14:02Z",
  "terminadaEn": "2026-10-03T21:15:10Z",
  "error": null
}
```

Estados de una sesión (amplía §5.3 de `DSLRBOOTH_PRODUCT_CONTEXT.md`): `capturando → revision → componiendo → compuesta → finalizada`, más `incompleta` (el invitado se fue o hubo corte de luz; las fotos se conservan) y `fallida` (con el paso exacto donde falló). **La reimpresión usa la tira ya compuesta que guarda la sesión** (`salidas.tira`), no vuelve a dibujar con la plantilla actual: así una reimpresión es idéntica a la original aunque la plantilla haya cambiado.

**Trabajo de impresión.**

```json
{ "version": 1, "id": "pj-77a", "sesionId": "s-lq3k9-x7p2", "impresora": "eq-9f3a/imp-1",
  "medio": "4x6", "copias": 2, "archivo": "f-h1",
  "estado": "en-cola", "intentos": 0, "ultimoError": null, "creadoEn": "2026-10-03T21:15:11Z" }
```

Estados: `en-cola → imprimiendo → impreso`, o `fallido` (reintenta solo hasta N veces, luego alerta persistente), `retenido` (cambió la impresora o falta papel: espera una decisión del operador) y `cancelado`. Al arrancar, todo trabajo que estaba "imprimiendo" pasa a `retenido` (no se sabe si salió) y nunca se reintenta solo, para no imprimir dos veces. En el navegador el éxito de una impresión no es observable: el estado real es `enviado` hasta que exista el adaptador de escritorio.

### 5.4 Los mensajes de la cabina (cómo se enteran las demás pantallas)

La cabina es la **fuente de verdad**: va avisando lo que pasa con mensajes cortos del mismo formato, y quien quiera saber (panel en vivo, control remoto, punto de retiro, la propia cabina) los escucha. Las **órdenes** (pausar, reintentar) viajan al revés, como pedidos con identificador propio, para que repetirlas nunca duplique una acción (requisito de `FLUJO_NAVEGACION.md`, G2).

| Mensajes que emite la cabina | Órdenes que recibe |
| --- | --- |
| `cabina.estado` (cámara, impresora, red, pausada, evento) | `orden.pausar`, `orden.reanudar` |
| `sesion.iniciada`, `sesion.foto-tomada`, `sesion.compuesta`, `sesion.finalizada`, `sesion.incompleta`, `sesion.cancelada` | `orden.cancelar-sesion` |
| `impresion.encolada`, `impresion.iniciada`, `impresion.ok`, `impresion.error` | `orden.reintentar-impresion`, `orden.cancelar-impresion` |
| `entrega.enlace-creado`, `entrega.descargada`, `entrega.vencida`, `servidor.estado` | `orden.reiniciar-servidor` |
| `alerta.abierta`, `alerta.cerrada` (con gravedad y causa) | `orden.terminar-evento` |

Forma de todo mensaje: `{ "id", "seq", "tipo", "eventoId", "sesionId" (si aplica), "en", "datos" }`. La cabina emite además un latido con el estado completo cada pocos segundos, y las órdenes reciben acuse (`orden.ok` o `orden.rechazada`). El panel reconstruye su estado desde el repositorio al abrir; los mensajes solo lo mantienen al día.

**Advertencia:** entre dos páginas abiertas con doble clic (`file://`) los navegadores no garantizan compartir canal, `localStorage` ni IndexedDB. Regla: todo lo que comparta datos entre páginas se prueba servido desde `http://localhost`. Y una pestaña en segundo plano se ralentiza: C5 como segunda pestaña sirve para demostrar, no para operar un evento real; para eso debe ser una ventana de la app de escritorio o el celular por red local.

**Cómo escala sin reescribir:** hoy se puede transportar entre dos pestañas del mismo navegador (el panel en vivo C5 como segunda ventana, sin tocar la cabina); en la app de escritorio, entre procesos de la misma aplicación; en el control remoto y el punto de retiro, por la red local con el mismo formato. Cambia el "cable", no el mensaje.

### 5.5 Los adaptadores: el borde con lo que cambia entre plataformas

Las pantallas hablan con estas interfaces y nunca con el hardware ni con el almacenamiento directamente. Cambiar de plataforma es cambiar el adaptador, no la pantalla. Es la misma idea que `CameraAdapter` y `PrinterProfile` de `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.2 y §5.1, extendida al resto.

| Adaptador | Qué debe poder hacer (nombres de ejemplo) | Hoy | Escritorio Windows | iPad con DSLR / celular liviano |
| --- | --- | --- | --- | --- |
| **Cámara** | listar, conectar, vista en vivo, capturar, avisar estado | Cámaras del navegador | SDK Canon/Nikon o PTP, más webcam | USB al iPad / cámara del dispositivo |
| **Impresora** | listar, medios admitidos, imprimir trabajo, estado, cancelar | El diálogo de impresión del navegador | Cola de Windows en modo silencioso; luego SDK por modelo | Impresión de iPad o por red |
| **Repositorio** (datos y archivos) | leer, guardar, listar, borrar, suscribirse a cambios, exportar paquete | `localStorage` e IndexedDB | Base de datos local + carpeta de archivos | Base local del dispositivo |
| **Entrega** | crear enlace, ver estado, encender/apagar servidor | Maqueta | Servidor HTTP local, red propia | Servidor en el equipo de la cabina |
| **Licencia** | preguntar si está activa | Siempre sí | Archivo con vencimiento | Tienda de aplicaciones |

Y una pieza sin pantalla que **hoy no está compartida**: el **motor de plantillas** (recibe una plantilla, las fotos y los datos de sesión y devuelve la imagen final). Existe dentro del editor (`03-editor-plantillas/render.js`) pero depende del estado interno del editor y la cabina no lo usa (ver hallazgo 1 de la sección 6). Debe vivir en `shared/` y recibir la plantilla como dato, para que editor, cabina, escritorio e iPad dibujen **exactamente lo mismo**.

### 5.6 Cómo se cubren los tres escalones

| Escalón | Qué se reemplaza | Qué no cambia |
| --- | --- | --- |
| **App de escritorio** | Los adaptadores (cámara, impresora, repositorio, entrega) por versiones reales; el servidor local se vuelve posible | Pantallas, formato de datos, mensajes de la cabina, validador, motor de plantillas |
| **Etapa 2 (cuentas, suscripción)** | Se activa el campo `cuentaId`, se añade sincronización de datos livianos y la capa de licencia | El motor de cabina no sabe de planes; ningún formato cambia (los campos ya estaban) |
| **Multi-plataforma** | Adaptadores de cada plataforma | Todo lo demás; las plantillas y los eventos son los mismos archivos |

**Dato aparte, de privacidad:** las fotos de invitados son datos personales (y a veces de menores). Por eso el contrato separa los archivos de los registros, permite purgar por evento (`conservacion`) y no recoge nombres, correos ni teléfonos de invitados. Chile tiene una ley de datos personales nueva que entra en vigencia a fines de 2026 (confirmar la fecha exacta con un profesional); aplica ya en la Etapa 1 por las fotos de invitados (ver decisión 9). Diseño mínimo: aviso visible de que la foto se guarda y por cuánto tiempo, borrado en cascada (fotos, enlaces, trabajos), conservación con un valor por defecto finito en vez de "para siempre", y el paquete de evento nunca incluye el PIN ni datos del equipo. El PIN es un candado de cortesía contra el invitado, no seguridad fuerte: se guarda con hash y el conteo de intentos fallidos se persiste.

---

## 6. Huecos, contradicciones y riesgos

Encontrados el 2026-11-16 leyendo la documentación **y el código** de cada pantalla. "Evidencia" dice dónde se comprobó. Ordenados por gravedad: **grave** = rompe la promesa del producto o puede perder datos; **medio** = produce confusión o trabajo doble; **menor** = pulido.

### 6.1 Con lo ya construido

| # | Gravedad | Hallazgo | Evidencia | Qué lo arregla |
| --- | --- | --- | --- | --- |
| 1 | **Grave** | **La cabina no dibuja la plantilla real.** El evento "tiene" una plantilla, pero es solo una etiqueta: al componer, la cabina pinta su propio diseño fijo (lienzo 1200 × 1800, título "FOTOCABINA", marcos lima, pie "Hecho con FotoCabina"), sin hoja 4 × 6 de dos tiras, y el marco de encuadre usa una proporción fija. Todo el trabajo del editor no llega todavía a la foto del invitado. Es el verdadero alcance del "punto 4 pendiente" de `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.9 | `01-camera-flow/app.js`: `compose()` y `FRAME_RATIO`. El motor del editor, `03-editor-plantillas/render.js`, depende del estado interno del editor y nadie más lo usa | Hito 0.2 y 1.1 (sección 7): motor de plantillas compartido, y la cabina lo usa. **Cerrado por 1.1 (certificado 2026-11-16)** (0.2 hecho y commiteado; ver 7.4) |
| 2 | **Grave** | **El modo de entrega y las copias se guardan y nadie los lee.** C2 los pide al crear el evento, pero la cabina siempre ofrece imprimir, descargar y QR, y ninguna pantalla muestra las copias | Búsqueda en `01-camera-flow/app.js` y `04-lista-eventos/app.js`: sin ninguna referencia a esos campos | Validador + A7 y A9 que respetan el modo (secciones 2.3 y 4) |
| 3 | **Grave** | **No hay forma de editar un evento una vez creado** (nombre, fecha, copias, entrega, plantillas). Un error al crearlo se arregla duplicando y borrando | `05-crear-evento` solo crea; la tarjeta de `04-lista-eventos` no ofrece "Editar" | C2 en modo edición (hito 1.2) |
| 4 | **Grave** | **Todos los datos viven solo dentro del navegador** (eventos y plantillas en `localStorage`, sesiones en IndexedDB). Borrar los datos del sitio, cambiar de navegador o de computador pierde eventos, plantillas y todas las fotos, sin aviso ni respaldo. Además las plantillas guardan fuentes e imágenes dentro de `localStorage`, que tiene un tope pequeño (unos pocos MB según el navegador): "storage lleno" es un riesgo real y hoy sin aviso. Y las páginas compartirán datos solo si el navegador trata las páginas abiertas con doble clic como el mismo origen; eso cambia según el navegador | `shared/almacen-eventos.js`; `03-editor-plantillas/estado.js` (clave `fotocabina-editor-v1`); `01-camera-flow/almacen-sesiones.js` | Respaldo y paquete de evento (hito 1.6); aviso de espacio; app de escritorio (la solución de fondo) |
| 5 | **Grave** | **La sesión se guarda recién al componer la tira.** Las fotos tomadas antes (durante la captura y la revisión) no existen en ningún almacén: un corte de luz o un cierre en esos 30 a 60 segundos las pierde, y no existe el estado "incompleta". Contradice la regla de `DSLRBOOTH_PRODUCT_CONTEXT.md` §5.3 ("nunca debe borrar las fotos originales") | `01-camera-flow/app.js`: `guardarSesionActual()` se llama desde `compose()` | Guardar cada foto al tomarla (hito 0.1) |
| 6 | Medio | **El PIN tiene tres problemas.** (a) Se decidió "universal" el 2026-09-22, pero se guarda copiado dentro de cada evento. (b) El valor de fábrica `1234` está en un repositorio público. (c) La pantalla del operador lo escribe en claro ("ingresa el PIN 1234") y el campo lo muestra. Sigue sin bloqueo por intentos fallidos (ya anotado en `FLUJO_NAVEGACION.md`, hueco 5) | `01-camera-flow/app.js`: `AJUSTES_BASE.pin`, texto de `connectHint`; `shared/almacen-eventos.js` | PIN al Equipo, cambio obligatorio al primer uso, bloqueo tras intentos (hito 0.1 y decisión 3) |
| 7 | **Grave** | **Estado y contadores que no dicen la verdad.** "Lanzar" no pasa el evento a "En curso" ni existe "Terminar". La tarjeta de la lista muestra `evento.sesiones`, un número fijo de demostración, mientras la cabina cuenta de verdad desde su base: dos fuentes que se contradicen. Y eliminar un evento no borra sus sesiones aunque el diálogo dice "Las sesiones guardadas se pierden": es una promesa falsa de borrado de fotos de invitados (problema de privacidad), y quedan huérfanas ocupando espacio y apareciendo en la galería "Todos". Además, duplicar un evento pierde el modo de entrega y las copias | `04-lista-eventos/app.js` (solo guarda el evento activo al lanzar y no carga el almacén de sesiones); `shared/almacen-eventos.js` (`sesiones` fijo) | Ciclo de vida (2.6), conteo derivado, aviso al eliminar (hito 1.3) |
| 8 | **Grave** | **Varias pantallas no pueden ser reales en un navegador**, y la hoja de ruta no lo dice claro: un navegador no puede listar impresoras, ni imprimir sin mostrar el diálogo del sistema, ni levantar un servidor. Hoy "Imprimir" abre el diálogo de Windows delante del invitado. Eso afecta a C4 (elegir impresora), A9 (imprimiendo de verdad), A8/C9 (QR real), H3 y G. Construirlas como "maquetas" sin pensarlas puede obligar a tirarlas | `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.4 y §6; `MAPA_DE_PANTALLAS.md` A8/A9/C4 | Construir contra adaptadores simulados (5.5) y decidir cuándo probar la app de escritorio (decisión 8) |
| 9 | **Grave** | **Una plantilla borrada o inexistente no se detecta en ningún punto.** Los eventos de demostración nombran plantillas ("Fiesta Neón") que no existen en el editor, borrar una plantilla no comprueba si está en uso, y como nada la usa de verdad (hallazgo 1) hoy nadie se entera. Es el "hueco recurrente" de A2, B3, C1 y C2 en `FLUJO_NAVEGACION.md` | `shared/almacen-eventos.js` (eventos de demostración); `03-editor-plantillas` (eliminar sin chequeo) | Validador y aviso al eliminar (2.3) |
| 10 | Medio | **Equipo y evento mezclados** (la cámara por evento sigue siendo decisión del dueño; lo que cambia es dónde vive el identificador). Cámara, espejo y PIN viven en la ficha del evento aunque son del equipo, y existe además un segundo juego de ajustes "sueltos del equipo" para la cabina sin evento. Dos orígenes para lo mismo | `01-camera-flow/app.js`: `AJUSTES_CLAVE` y `eventoActivo.ajustes` | Capas de 2.1 y Equipo (hito 0.1) |
| 11 | Medio | **Abandono del invitado.** Solo A7 tiene tiempo de espera; A2 a A5 no, y no está definido qué hace A5 al vencer | `FLUJO_NAVEGACION.md`, huecos 1 y 2 | Una sola regla de paciencia (hito 1.5, decisión 4) |
| 12 | Medio | **Un solo "evento activo" por navegador.** Es una clave única; dos pestañas del mismo equipo con la cabina abierta se pisan | `shared/almacen-eventos.js`: `fotocabina-evento-activo` | Identificar la cabina por pestaña/equipo al pasar a escritorio; mientras tanto, no abrir dos cabinas a la vez |
| 13 | Medio | **El ritmo de la fila no se calcula en ninguna parte**, aunque es la palanca de negocio que `PRODUCT.md` y `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.8 destacan | Sin código ni pantalla | Validador, sección 2.5 |
| 14 | Medio | **"Copias" es ambiguo.** C2 dice "copias por sesión"; la hoja 4 × 6 trae dos tiras: ¿2 copias son 2 hojas o 2 tiras? Y con cantidad impar de tiras, ¿qué pasa con la mitad de hoja? (`DSLRBOOTH_PRODUCT_CONTEXT.md` §7 lo plantea y no lo responde) | `05-crear-evento/README.md` | Decisión 5 |
| 15 | Medio | **Se puede lanzar sin revisar nada.** La tarjeta de evento ofrece "Lanzar" sin consultar la plantilla ni el estado (el botón aparece incluso en eventos archivados; no hay ninguna validación) | `04-lista-eventos/app.js` | Validador y C2c (hitos 0.3 y 1.4) |
| 16 | Medio | **No existe un "ensayo".** Para probar la cabina antes del evento hay que hacer sesiones reales que se cuentan y quedan en la galería | Sin código | "Ensayo" de la sección 3.2 (hito 1.4) |
| 17 | Medio | **No hay forma de pausar la cabina de cara al invitado.** Si el operador debe cambiar papel, el tótem sigue invitando a tocar | `FLUJO_NAVEGACION.md` (A3 y A4 lo dejan "sin definir") | A12 (hito 4) |
| 18 | Menor | **Los textos de la interfaz usan voseo** ("Tocá para empezar", "Lanzá el evento", "Cambiá de pose") y el dueño es chileno ("tú") | Textos en `01-camera-flow`, `04-lista-eventos`, `05-crear-evento` | Decisión 10 |
| 19 | Menor | **El menú lateral de la lista** tiene "Cámara" e "Impresora" como hojas informativas. Con el equipo como capa (C8) conviene una sola entrada "Equipo" | `04-lista-eventos/README.md` | Hito 7 |

### 6.2 Contradicciones con la documentación

| # | Dónde | Qué dice | Qué es verdad hoy | Acción |
| --- | --- | --- | --- | --- |
| D1 | `MAPA_DE_PANTALLAS.md`, fila C2b | Los ajustes se guardan "en el equipo" | Se guardan por evento cuando hay evento activo (2026-09-17) | **Corregido** en este trabajo |
| D2 | `MAPA_DE_PANTALLAS.md`, tabla P1 | "El PIN pasará a configurarse por evento en C2" | Se decidió lo contrario el 2026-09-22: universal | **Corregido** |
| D3 | `MAPA_DE_PANTALLAS.md`, fila C1 | "Falta C2" y "Cámara/Impresora/Ayuda esperan C3/C4" | C2 y C3 ya están construidas | **Corregido** |
| D4 | `FLUJO_NAVEGACION.md`, C1 "Sale" | "Crear evento → C2 (falta)" | C2 está construida | **Corregido** |
| D5 | `DSLRBOOTH_PRODUCT_CONTEXT.md` §2 | Árbol de carpetas sin 04, 05 ni `shared/`; "03 en construcción" | 03 aprobado; existen 04, 05 y `shared/` | **Corregido** |
| D6 | `PRODUCT.md`, "Evidence on Hand" | Cita `02-layout-editor` como el prototipo "más maduro" | Está descartado; el editor definitivo es 03. Además PRODUCT.md solo conoce dos roles | **No se toca** (requiere tu acuerdo; decisión 11) |
| D7 | `FLUJO_NAVEGACION.md`, decisión 4 | "Lanzar se bloquea sin cámara, advierte sin impresora" | Debe depender del modo de entrega (2.4) | Queda como propuesta en la decisión 2; no se modifica hasta que respondas |
| D8 | `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.2 y §3.10 | Perfiles por cámara (§3.2) y cámara guardada por evento (§3.10) | Compatibles si el evento guarda una **preferencia** y el perfil vive en el Equipo | Se resuelve con el modelo de 2.1 y 5.3; sin conflicto real |
| D9 | `MAPA_DE_PANTALLAS.md`, A2 | "Falta" y habla de habilitar varias plantillas por evento | C2 hoy solo permite una; A2 depende de ampliar C2 | Dependencia anotada en la sección 7 |

### 6.3 Riesgos del propio plan

1. **Crecer de más.** Este esqueleto suma piezas nuevas (A12, C2c, C8 a C11). La regla de `DSLRBOOTH_PRODUCT_CONTEXT.md` §0 (no construir para "producto" cuando solo hay un usuario) sigue mandando: lo marcado Etapa 2 **solo reserva el lugar** en los datos; no se construye. De lo nuevo de Etapa 1, el orden de la sección 7 deja para el final lo menos urgente (C10, C11).
2. **Dependencia de la app de escritorio.** Lo que más le importa a un evento real (impresión silenciosa, DSLR, QR sin Internet) no se puede cerrar en el navegador. Si la prueba técnica de escritorio se deja para el final, todo el panel se habrá construido sobre supuestos.
3. **Datos personales.** Fotos de invitados (también menores) quedan en el equipo del operador y en enlaces temporales. Hay que definir cuánto se conserva y quién puede verlas antes de entregar enlaces; Chile tiene una nueva ley de datos personales con entrada en vigor escalonada que conviene revisar con un profesional antes de cobrar a terceros.
4. **Accesibilidad sin estándar.** `PRODUCT.md` deja abierto qué estándar cumplir; el tótem en poca luz y con una copa en la mano ya exige objetivos táctiles grandes y buen contraste. Sin definirlo, cada pantalla nueva decide por su cuenta.
5. **Botón lima.** En C2c, A12 y C5 los botones ("Arreglar", "Reanudar", "Reintentar") son secundarios: la Regla del Único Verde de `DESIGN.md` sigue valiendo en cada pantalla.
6. **Compatibilidad de hardware sin validar** (cámara, impresora, corte de 2 × 6): sigue siendo la tabla de pruebas de `DSLRBOOTH_PRODUCT_CONTEXT.md` §7; ningún diseño la reemplaza.

---

## 7. Orden de construcción recomendado

Criterio: primero lo que **todas las demás cosas necesitan** y lo que hoy **miente**, después lo nuevo, y lo que depende de hardware real al final, contra adaptadores simulados mientras tanto. Los hitos son puntos de cierre seguros: cada uno deja todo coherente, probado y commiteado antes del siguiente.

### 7.1 Cadena de dependencias

```text
0 Fundación ─► 1 Cerrar lo que miente ─► 2 A2 selección ─► 3 Impresión simulada (A9 + C4)
   │                                                              │
   │                                                              ▼
   │                                            4 C5 en vivo + A12 ─► 5 C6 detalle ─► 6 C7 errores + C11
   │                                                                                         │
   └────────────────────────────────────────────────────────────────────────────────────────▼
                                         7 C8 equipo completo + C10 resumen ─► 8 App de escritorio (adaptadores reales)
                                                                                         │
                                                                    Fase D: servidor local, A8 real, C9, retiro (H3), control remoto (G)
```

### 7.2 La lista

Tamaño: S (menos de un día de agente), M (varios días), L (una fase). "Navegador" = se puede construir y probar hoy sin hardware nuevo.

| Hito | Pieza | Depende de | Desbloquea | Tam. | Navegador |
| --- | --- | --- | --- | --- | --- |
| **0.1a (HECHO 2026-11-16, ver 7.3)** | **Guardar cada foto al tomarla** (almacén `archivos`, estados incompleta/fallida) y **PIN al Equipo** con cambio obligatorio y bloqueo por intentos. Barato y protege fotos reales | Nada | Todo | S | Sí |
| **0.1b** | **Repositorio v2**: evento v2 con migración y respaldo de la clave vieja, interfaz asíncrona con caché en memoria, plantillas congeladas al lanzar, sesión v2 | 0.1a | Todo | M | Sí |
| **0.2 (HECHO 2026-11-16, ver 7.4)** | **Motor de plantillas compartido** en `shared/`, extraído del editor sin cambiar cómo se ve ni se usa el editor | Nada | 1.1, A2, hoja 4 × 6 real | M | Sí |
| **0.3** | **Validador** (2.4): configuración efectiva, bloqueos, avisos, ritmo | 0.1b, 0.2 | 1.2, 1.4, A2, C5 | M | Sí |
| **1.1 (HECHO 2026-11-16; ver 7.4)** | La cabina compone con la plantilla real: n.º de fotos, marco de encuadre, hoja 4 × 6 de dos tiras (cierra el hallazgo 1 y el punto 4 pendiente). Es lo más valioso y puede ir justo después de 0.2 | 0.2 | Todo lo que dependa del resultado | M | Sí |
| **1.2** | **C2 crear y editar** con varias plantillas habilitadas; A7 respeta el modo de entrega; las copias se leen | 0.1, 0.3 | A2, A9 | M | Sí |
| **1.3** | Ciclo de vida: "En curso" automático, **Terminar evento**, conteo real en C1, aviso al eliminar con sesiones | 0.1 | C10 | S | Sí |
| **1.4** | **C2c Revisión previa** dentro de C2b y **Ensayo** | 0.3 | Confianza antes de lanzar | S | Sí |
| **1.5** | Paciencia unificada en A2 a A5 y regla de abandono | Decisión 4 | A2 | S | Sí |
| **1.6** | **Respaldo y restauración** (exportar todo a un archivo) y exportar/importar un evento; aviso de espacio | 0.1 | Seguridad de los datos antes del primer evento real | M | Sí |
| **3a** | **Prueba técnica de escritorio** (1 a 3 días): impresión silenciosa a impresora real, DSLR, servidor local. Decide la herramienta y condiciona la cola y el almacenamiento, por eso va **antes** del hito 3 y puede hacerse en paralelo con 0.x. Atajo para un primer evento sin app: Chrome o Edge en modo kiosco con impresión sin diálogo sobre un servidor local mínimo (`http://localhost`); da pantalla completa e impresión directa, con limitaciones (una sola impresora, sin estado de impresora) | Nada | 3, 8 | S | No |
| **2** | **A2 Selección de plantilla** | 1.1, 1.2, 1.5 | | S | Sí |
| **3** | **Impresión de punta a punta con impresora simulada**: trabajo y cola persistente, A9, C4 como panel en Ajustes, variantes de impresora en A10, avisos de ritmo | 1.2, 0.3 | C5, C6, C7; luego se enchufa la real | L | Sí (simulada) |
| **4** | **C5 Panel en vivo** como segunda ventana (mensajes de 5.4) y **A12 Cabina en pausa** | 3 | Operar con la fila esperando | M | Sí |
| **5** | **C6 Detalle de sesión** y "Ver sesiones" desde C1 sin lanzar la cabina | 3 | | S | Sí |
| **6** | **C7 Resolución de errores** y **C11 Ayuda** | 3, 4 (los errores reales se conocen recién ahí) | | M | Sí |
| **7** | **C8 Ajustes del equipo** completo (menú "Equipo") y **C10 Resumen y cierre** | 1.3, 1.6 | Entregar al anfitrión | M | Sí |
| **8** | **App de escritorio**: **antes de empezar, una prueba técnica corta** (impresión silenciosa a una impresora real, cámara DSLR, servidor local) que decide la herramienta (`DSLRBOOTH_PRODUCT_CONTEXT.md` §5.1); luego adaptadores reales de cámara, impresora, repositorio | 3 (cola y perfiles ya definidos) | Primer evento real completo | L | **No** |
| **D** | Fase D sobre escritorio: servidor local, **A8 real**, **C9**, punto de retiro (H3), control remoto (G) | 8 | Entrega digital sin Internet | L | **No** |
| **E** | Etapa 2: cuentas, licencia, planes, iPad, celular, anfitrión (H5) | Eventos reales con éxito | | L | No |

**Camino mínimo al primer evento real de Nico** (si la prioridad es usar la cabina pronto): 0.1a, 0.2, 1.1, 0.1b, 0.3, 1.2, 1.3, 1.6, 3a, 3, el panel en vivo C5 con A12 (`MAPA_DE_PANTALLAS.md` lo llama la más crítica), 8, y de la Fase D solo el QR local si se quiere entrega digital. Todo lo demás mejora la operación pero no impide el primer evento.

**Lo que se puede hacer en paralelo** sin pisarse: 0.1 y 0.2 (carpetas distintas); 1.3 con 1.4; 5 con 4. Cada agente toca solo lo suyo, según `CLAUDE.md` §4.

---

## 8. Decisiones que necesita el dueño

Todas con mi recomendación primero. Si respondes "sí a todo lo recomendado", el trabajo puede seguir sin más preguntas.

1. **Aprobar el esqueleto.** *Recomiendo: sí.* Significa aceptar tres ideas: (a) la configuración tiene cuatro capas (equipo, evento, plantilla, sesión); (b) hay un "validador" único que dice si un evento está listo y qué cambia cuando tocas un ajuste; (c) cada sesión guarda una copia congelada de la configuración con que se hizo. Sin esto, cada pantalla nueva vuelve a decidir por su cuenta.
2. **Cuándo la impresora impide lanzar.** *Recomiendo:* depende del modo de entrega. Solo impresión: **bloquea** (sin impresora no hay evento). Impresión y digital: **avisa** y sigue. Solo digital: ni la mira. Es un ajuste a la decisión 4 de `FLUJO_NAVEGACION.md`, que hoy dice "siempre avisa".
3. **PIN.** *Recomiendo:* pasa a ser del equipo (como ya decidiste: universal), se pide cambiarlo la primera vez que se usa (hoy es `1234` y está escrito en pantalla), y se bloquea unos minutos tras intentos fallidos.
4. **Qué pasa si el invitado se va a medio camino.** *Recomiendo:* separar "paciencia" (elegir plantilla, revisión, resultado: 30 s por defecto, sin opción "nunca") de "presencia" (cuenta regresiva y pausa, donde el invitado no toca nada y se vigila que siga ahí). En la **revisión** (cuando ya tomó todas las fotos): se arma la tira sola y se guarda en la galería **sin imprimir** (el operador puede reimprimir). Si se fue antes de terminar las fotos: la sesión queda como "incompleta" en la galería, sin imprimir.
5. **Copias.** *Recomiendo:* cuentan **hojas físicas** (una hoja 4 × 6 trae dos tiras), son fijas por evento y el invitado no las elige; si alguien quiere más, el operador reimprime desde la galería. Así se evita el caso de la media hoja.
6. **Ciclo de vida y pantallas nuevas.** *Recomiendo: sí* a que el evento pase solo a "En curso" al lanzarlo, que exista el botón "Terminar evento" (lleva al resumen y archiva), y a sumar al mapa de pantallas las nuevas: A12 (cabina en pausa), C2c (revisión previa), C8 (ajustes del equipo), C9 (red y entrega digital), C10 (resumen y cierre) y C11 (ayuda).
7. **Respaldo de los datos antes del primer evento real.** *Recomiendo: sí, prioridad alta.* Hoy todo (eventos, plantillas, fotos) vive solo dentro del navegador; limpiar los datos del navegador lo borra todo. Propongo un botón "Respaldar todo a un archivo" y "Exportar este evento" (hito 1.6).
8. **App de escritorio: cuándo empezar.** *Recomiendo:* hacer una **prueba técnica corta** **antes** de construir la impresión simulada (hito 3a), porque si la herramienta resulta ser otra, la cola y el almacenamiento se rehacen; mientras tanto, todo se construye contra adaptadores simulados.
9. **Datos personales de los invitados.** *Recomiendo:* **no** pedir nombre, correo ni teléfono (la entrega por QR no los necesita), avisar al invitado que la foto se guarda y fijar un plazo de conservación por defecto (por ejemplo 30 días tras terminar el evento) en vez de "para siempre". La ley chilena de datos personales entra en vigencia a fines de 2026: conviene una revisión legal antes de entregar enlaces a terceros.
10. **Textos en "tú" chileno.** *Recomiendo: sí.* Hoy la interfaz dice "Tocá", "Lanzá", "Cambiá"; propongo "Toca", "Lanza", "Cambia". Es un cambio de textos, no de diseño.
11. **Cambios que tocan `PRODUCT.md` y `DESIGN.md`** (no los toco sin tu acuerdo). *Recomiendo: sí;* yo preparo el texto exacto. Serían solo dos: (a) en `PRODUCT.md`, corregir la "evidencia" que aún cita `02-layout-editor` como el prototipo más maduro; (b) dejar escrito el estándar de accesibilidad mínimo (objetivos táctiles grandes en el tótem, contraste suficiente en poca luz). Los roles nuevos (ayudante, anfitrión, retiro) y la personalización de marca son Etapa 2: quedan reservados aquí y se llevan a `PRODUCT.md` y `DESIGN.md` cuando se construyan.

### Respuestas del dueño (2026-11-16) — mandan sobre lo recomendado arriba

- **D4 (abandono):** aprobada como se propuso (30 s de paciencia; en revisión se arma la tira y se guarda sin imprimir; si faltan fotos queda "incompleta").
- **D2 (impresora y lanzamiento) — AJUSTADA:** "solo impresión" bloquea el lanzamiento si la impresora tiene un problema; **"impresión y digital" también bloquea** (no se parte un evento con la impresora mal); "solo digital" no la mira. Nada de "solo avisa".
- **Tope de impresiones por evento (NUEVO):** un evento puede tener un límite de hojas (ejemplo: 100). Al llegar al límite no se imprime más aunque la impresora esté conectada y tenga papel; la cabina sigue solo con entrega digital. Lógica decidida por el dueño:
  - **Al llegar al límite** el invitado ve un mensaje amable, antes de tomar las fotos (ejemplo: "Las impresiones de este evento llegaron a su límite, pero aún puedes llevarte tus fotos de forma digital"), y la sesión sigue solo con entrega digital.
  - **El tope solo se puede configurar si el evento incluye entrega digital.** En modo "solo impresión" no se ofrece (el dueño no prevé usar ese modo; siempre habrá una forma de llevarse las fotos).
  - **Las copias adicionales cuentan** para el tope (cada hoja física cuenta). Si quedan menos hojas que las pedidas, se imprimen las que quedan y se avisa.
  - **Copias adicionales: solo el operador** puede pedirlas (el invitado no).
  - El operador ve en todo momento cuántas hojas lleva y cuántas quedan del tope.
- **D3 (PIN):** aprobada (universal, se cambia la primera vez, bloqueo tras intentos fallidos).
- **D5 (copias) — CAMBIADA:** la impresión automática de la tira al terminar la sesión es configurable (una hoja 4 × 6 con dos tiras 2 × 6). En la pantalla de resultado hay un botón para **imprimir copias adicionales**, porque las sesiones suelen pedir más de una. La cantidad de copias es un ajuste muy usado: debe estar **presente y accesible al operador, no escondido ni bloqueado** (también como valor por evento).
- **Conteo de hojas 4 × 6 (NUEVO):** se cuenta cada hoja impresa por evento y por impresora, para saber el consumo de insumos, calcular costos y estadísticas, y avisar cuántas copias quedan antes de cambiar papel y cinta.
- **Textos en "tú" chileno:** aprobado.
- **Ciclo del evento (D6):** aprobado, con las pantallas nuevas A12, C2c, C8, C9, C10 y C11.
- **Respaldo (D7):** hoy los datos son de prueba, así que baja de prioridad; se hace antes del primer evento real, no antes.
- **Prueba técnica de escritorio (D8):** se explicó al dueño en el chat; queda pendiente su visto bueno.

- **D1 (esqueleto):** aprobado por el dueño (2026-11-16).
- **D9 (datos personales) — AJUSTADA:** no se pide ningún dato personal. La pantalla de bienvenida muestra un aviso claro, antes de que el invitado empiece: sus fotos pueden usarse para publicaciones en redes sociales o anuncios de los negocios del operador, y usar la cabina implica aceptarlo (si no está de acuerdo, no la usa). El texto exacto del aviso lo fija el operador. Como las fotos son material del negocio, el borrado automático a los 30 días no es la regla por defecto: el plazo de conservación es un ajuste del evento (por defecto, sin borrado automático). Pendiente: revisión legal antes de cobrar a terceros (Etapa 2).
- **D11 (PRODUCT.md):** aprobada y aplicada (referencia a `02-layout-editor` corregida; mínimo de accesibilidad y aviso de uso de las fotos agregados a `src/PRODUCT.md`).

**Lo que NO necesito que decidas ahora:** nombres de planes y precios (Etapa 2), marca blanca de clientes, tablet de retiro y control remoto (quedan reservados en los datos, no se construyen).

---

## Apéndice: cómo se hizo y cómo mantenerlo

- Fuentes: `CLAUDE.md`, `RETOMAR.md`, `PRODUCT.md`, `DESIGN.md`, `DSLRBOOTH_PRODUCT_CONTEXT.md`, `MAPA_DE_PANTALLAS.md`, `FLUJO_NAVEGACION.md`, `PLAN_EDITOR_PLANTILLAS.md`, los README de cada pantalla y lectura directa del código de `01-camera-flow`, `03-editor-plantillas`, `04-lista-eventos`, `05-crear-evento` y `shared/`.
- **Mantenimiento:** este documento se actualiza cuando cambie el modelo del evento (2.2 y 2.3), el contrato (sección 5) o el orden de construcción (7). Cada pantalla que se construya marca su fila en `MAPA_DE_PANTALLAS.md` como siempre; si su construcción cambia una regla de la matriz 2.3, se corrige aquí en el mismo commit.

### 7.3 Hito 0.1a construido (2026-11-16): lo que quedó y lo que difiere del documento

- **Hecho:** cada foto se escribe en el almacén `archivos` (IndexedDB v2) junto con el registro de su sesión, en una sola transacción, en el instante de tomarla; estados `capturando → revision → componiendo → compuesta → finalizada`, más `incompleta` y `fallida` (con `error.paso`). Al abrir la cabina, toda sesión que quedó abierta pasa a `incompleta`. Borrar una sesión borra sus archivos. El PIN pasó al Equipo (`shared/equipo.js`): hash PBKDF2 con sal, 5 intentos y bloqueo de 5 minutos persistente, cambio desde Ajustes.
- **Difiere del texto del documento (hallazgo, para confirmar):** (1) **no hay PIN de fábrica**: en vez de "se pide cambiar el 1234", el primer "Lanzar evento" obliga a crear el PIN (el 1234 y los repetidos como 7777 se rechazan). Cumple la intención y evita dejar un valor público. (2) El PIN propio que ya existiera en un evento se migra al equipo; el de fábrica se descarta. (3) La sesión guarda `version: 2`, `fotos: [{n, archivo, intentos}]` y `salidas`, pero todavía **no** tiene `configCongelada`, `plantilla`, `equipoId` ni `eventoId` (usa `evento`, `eventoNombre`, `fecha`): eso es el hito 0.1b. Se agregó `fotosEsperadas` y `esEnsayo`. (4) Las sesiones del formato anterior se leen sin migrarlas.
- **Hallazgos abiertos (no se resolvieron por no ser de este hito):**
  1. Dos pestañas de la cabina a la vez: al abrir una, la otra puede perder su sesión en curso marcada como incompleta (hallazgo 12 de 6.1, ahora con efecto en sesiones). Regla vigente: una sola cabina abierta.
  2. La galería carga todas las fotos como texto base64; con cientos de sesiones será lenta (conviene miniaturas o carga bajo demanda, hito 5).
  3. Recargar la página (F5) en modo invitado devuelve los controles de operador sin pedir PIN: el PIN es candado de cortesía; se cierra con la app de escritorio o con un modo de pantalla completa sin recarga.
  4. "Repetir toda la sesión" desde la revisión deja en disco las fotos viejas hasta que se reemplazan; una sesión cortada en ese momento puede mezclar tomas.
  5. Sin recuperación de PIN olvidado (hoy solo borrando los datos del sitio).
  6. D4 pendiente de construir (hito 1.5): una sesión que se corta en la revisión con todas las fotos hoy queda "incompleta" en vez de armar la tira sola.

### 7.4 Hitos 0.2 y 1.1 construidos: qué quedó y qué difiere del documento

**Estado.** 0.2 está **hecho** y commiteado (2026-11-16, `ad14c88`). 1.1 está **hecho** (2026-11-16): revisado por Code Reviewer, certificado por Evidence Collector (sesiones completas de 2, 3 y 4 fotos, bloqueos, demo, consola sin errores) y Reality Checker (LISTO CON RESERVAS). Reservas abiertas: (a) `capture()` toma siempre 1280 × 960 y estira la imagen: con una cámara real 16:9 la foto se deforma y el marco puede no coincidir con lo impreso (anterior a 1.1, sin probar con cámara real); (b) los eventos que solo tienen el nombre de la plantilla (`plantillaId` nulo, incluidos los de demostración) quedan con "Lanzar" bloqueado hasta que se les asigne una plantilla; (c) la copia congelada de la plantilla por evento (§2.1) sigue pendiente (0.1b); (d) el editor lanza una excepción al renombrar desde la barra (`03-editor-plantillas/app.js` `actualizarNombre`), anterior a estos hitos.

- **0.2, qué quedó:** `shared/motor-plantillas.js` (dibuja una plantilla que recibe como dato; acepta las fotos y los datos de la sesión; valida la plantilla; carga las fuentes incrustadas) y `shared/almacen-plantillas.js` (lectura de plantillas, solo lectura; el editor sigue siendo el único que escribe). El editor dibuja con el motor sin cambiar cómo se ve: 140 comparaciones de píxeles contra la versión anterior, sin diferencias.
- **1.1, qué quedó:** la cabina lee la plantilla del evento (`plantillaId`), la valida y compone con el motor. El n.º de fotos sale de la plantilla; el marco de encuadre sale del espacio de foto de cada toma; Imprimir usa la hoja 4 × 6 con dos tiras si la plantilla lo pide, con el papel real de la plantilla. La sesión guarda además `hoja`, `impresion` (medidas en mm), `numero` y `plantillaId`. Sin plantilla válida, "Lanzar evento" queda deshabilitado con aviso y botón al editor (`?evento=id`; ver `FLUJO_NAVEGACION.md`, B1 y C2b).

**Hallazgos y diferencias con el texto del documento (para confirmar):**

1. **El motor era más independiente de lo que decían §5.5 y el hallazgo 1.** Esos textos decían que dependía del estado interno del editor; en realidad solo usaba tres funciones del estado (resolver el texto de un dato, la conversión de puntos a milímetros y el registro de fuentes). Quedó resuelto en 0.2: esas piezas pasaron al motor y el editor delega en él. Los textos de §5.5 y de la fila 1 de 6.1 se dejan como estaban, como registro de lo que se encontró.
2. **`AlmacenPlantillas.listar()` devuelve `null`, no una lista vacía, si no existe la clave del almacén** (o está dañado); devuelve `[]` solo si el almacén existe y no tiene plantillas válidas. Quien lo use debe distinguir "no hay plantillas" de "no se pudo leer" (relevante para A2 y para el validador, hito 0.3). Una plantilla sin `id` recibe uno estable solo en la copia entregada; lo guardado no cambia.
3. **La cabina lee la plantilla viva del editor.** Se relee al abrir la cabina, al cambiar de evento y al tocar "Lanzar evento", y queda fija desde el lanzamiento. Pero si el operador edita la plantilla en otra pestaña y vuelve a lanzar, cambia lo que se compone, y las sesiones ya hechas conservan su tira pero no una copia de la plantilla. Se resuelve con las plantillas congeladas al lanzar del hito 0.1b (la sesión todavía no guarda `configCongelada`, ver 7.3).
4. **Modo demostración sin evento:** la cabina abierta suelta (evento "demo") conserva el diseño antiguo (selector manual de fotos, marco 4 / 3,2, tira fija de FotoCabina en 1200 × 1800). Es deliberado, para no romper la prueba rápida, pero significa que ese modo **no** prueba la plantilla real; el ensayo del hito 1.4 debería usar una plantilla.
5. **Plantilla inválida = bloqueo solo al lanzar.** El hueco recurrente "evento sin plantilla válida" (hallazgo 9) queda cubierto en el momento de lanzar, no al crear el evento (C2) ni al borrar la plantilla (B3). Eso lo cierra el validador (hito 0.3).
6. **Número de sesión (inferencia del código, sin prueba en el navegador):** se calcula como las sesiones ya armadas del evento + 1 y se guarda en la sesión para no cambiar al reintentar. Si se borran sesiones de la galería, un número puede repetirse. Conviene un contador propio del evento en 0.1b.
7. **La hoja se guarda aparte de la tira** (nuevo archivo `hoja` en el almacén de sesiones). Las sesiones anteriores al 1.1 no la tienen: al reimprimir desde la galería se imprime la tira, con 4 × 6 pulgadas como antes.
8. **Sigue pendiente (no es de estos hitos):** la impresión pasa por el diálogo del navegador (hallazgo 8, hito 3), y el conteo de hojas y el tope de impresiones de las respuestas del dueño aún no existen.

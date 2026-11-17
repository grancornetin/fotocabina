# 05 · Crear y editar evento

Pantalla C2 del mapa de pantallas. El mismo formulario **crea** un evento nuevo (desde `04-lista-eventos`, "Crear evento") y **edita** uno que ya existe (`index.html?editar=<id>`, desde el botón "Editar evento" de su tarjeta en la lista).

## Qué hace

- **Nombre del evento** (obligatorio, con validación) y **fecha**.
- **Modo de entrega**: Impresión / Digital / Ambos, selección única, con una frase que dice qué verá el invitado (solo impresión: sin QR ni descargas; solo digital: sin imprimir; ambos: todo). No incluye todavía punto de retiro externo ni impresión remota (Etapa 2, H3/H4).
- **Impresión** (no se muestra en "solo digital"): interruptor "Imprimir automáticamente al terminar la sesión" y, al encenderlo, copias automáticas por sesión (1 a 5 hojas 4×6; cada hoja trae dos tiras; si el evento ya trae otro número, se agrega a la lista). Se guardan en `entrega` (`impresionAuto`, `copias`). La cabina **todavía no imprime según ellos** (hito de impresión): se leen, se congelan en cada sesión y se muestran. Las copias adicionales las pide solo el operador desde el resultado y cuentan para el tope.
- **Tope de hojas del evento** (opcional, solo con modo "Ambos"): `entrega.topeHojas`, entero de 1 a 99999; vacío = sin tope. Si el número no es válido el campo se marca (`aria-invalid`, `aria-describedby`, "Escribe un número entero entre 1 y 99999, o déjalo vacío") y no se guarda nada. Si cambias a otro modo, **el tope se conserva** (por si vuelves a "Ambos"): no se aplica, y el resumen del validador avisa. El almacén descarta cualquier valor que no sea un entero de 1 en adelante (0, negativos, decimales y texto no son un tope; más de 99999 se acota a 99999). En "solo impresión" el campo no se ofrece y la pantalla explica por qué (respuesta del dueño del 2026-11-16: el tope solo existe si el evento entrega también fotos digitales). El mensaje amable al invitado cuando se alcance el tope es del hito de impresión; aquí solo se configura.
- **Plantillas** (hito 1.2): lista de las plantillas guardadas en el editor (se leen con `../shared/almacen-plantillas.js`, solo lectura), con nombre, n.º de fotos y papel. Se **marcan** las que el evento habilita (`plantillas.habilitadas`) y se elige cuál va **por defecto** (`plantillas.porDefecto`, la que usa la cabina hoy; elegir entre las habilitadas será A2). Reglas: la primera que se marca queda por defecto; si se quita la por defecto, pasa a otra habilitada; sin ninguna marcada el evento queda sin plantilla ("Elegir después") y "Lanzar" se bloquea hasta asignarle una. Una plantilla dañada o sin espacio de foto no se puede habilitar; una habilitada que ya no existe en el editor aparece como "Plantilla no encontrada" para poder quitarla.
- **Así queda el evento**: resumen en vivo calculado por el validador compartido (`../shared/validador-evento.js`), sin repetir sus reglas: configuración efectiva ("2 fotos, papel 4 × 6 in, 3 copias, impresión y digital, con impresión automática, tope de 120 hojas"), ritmo estimado ("≈ 35 s por sesión · ≈ 102 sesiones por hora") y los bloqueos y avisos que dependen de lo que se decide aquí (rojo = no se podrá lanzar, ámbar = conviene saberlo). No muestra los avisos de hardware ni del PIN (cámara no comprobada, impresora no comprobable, PIN sin crear).
- **Guardar y volver son un solo paso**: "Crear evento" / "Guardar cambios" guarda en el almacén compartido y navega a `04-lista-eventos`. **Cancelar** y "Mis eventos" vuelven sin guardar; si hay cambios sin guardar preguntan antes con un cuadro modal ("Seguir editando" / "Salir sin guardar"): `aria-modal`, Escape lo cierra, el foco queda atrapado entre sus dos botones y vuelve al botón que lo abrió.
- **Un solo guardado:** mientras se guarda, el botón queda deshabilitado (el doble clic no duplica). Si el guardado falla (por ejemplo, sin espacio) se avisa en un cuadro de error y el botón se rehabilita; el reintento reutiliza el mismo evento (mismo id), así que nunca se crean duplicados.

## Modo edición (`?editar=<id>`)

- Parte del evento guardado y solo cambia lo que se ve en el formulario: nombre, fecha, entrega (modo, impresión automática, copias, tope) y plantillas. **Conserva** el id, el estado (próximo, en curso o archivado), el ritmo, la cámara, las sesiones (viven en otro almacén y no se tocan) y la **copia congelada** del último lanzamiento. Al guardar se vuelve a leer el evento del almacén, así no se pisa lo que otra pantalla haya cambiado mientras tanto.
- **Evento en curso:** un aviso ámbar dice que los cambios de plantilla, entrega y copias valen **desde la sesión siguiente**; las ya tomadas no cambian (la cabina relee el evento al empezar cada sesión; decisión del dueño, `docs/ARQUITECTURA_FLUJO.md` §8). Ver `01-camera-flow/README.md`.
- Un evento archivado también se puede editar (nombre, fecha, entrega, plantillas); sigue archivado.
- **Evento ya lanzado** (tiene copia congelada): no se puede guardar sin plantilla por defecto (mensaje claro, no cambia nada); si la plantilla por defecto elegida no se puede leer o está dañada, un texto ámbar avisa antes de guardar que la cabina seguirá con la copia guardada al lanzar.
- **Cambio ajeno mientras editas:** al abrir se anota `actualizadoEn` del evento; si al guardar es distinto (la cabina u otra pestaña lo cambiaron), no se guarda: un aviso ámbar deja elegir "Recargar el evento" (pierdes lo editado) o "Guardar igualmente" (se parte del evento actual y se pisan solo los campos de este formulario).
- Si el `id` no existe (enlace viejo, evento eliminado), se muestra "No encontramos ese evento" con un botón a la lista y el formulario no se abre.

## Decisión de producto: el PIN es universal, no por evento

`docs/MAPA_DE_PANTALLAS.md` sugería originalmente que el PIN de operador se definiera por evento aquí. El dueño del proyecto decidió (2026-09-22) que el PIN sigue siendo **universal para todos los eventos** — no se toca en esta pantalla; es del Equipo (`../shared/equipo.js`).

## Conectada a `04-lista-eventos` y `shared/`

El evento se arma con `AlmacenEventos.crear()` (formato v2: id estable `ev-<uuid>`) y se guarda con `AlmacenEventos.guardar()`; en edición se parte de `AlmacenEventos.obtener(id)`. Carga `../shared/almacen-eventos.js`, `motor-plantillas.js`, `validador-evento.js` y `almacen-plantillas.js`. Ya no lee directo el almacén del editor.

## Pendiente

- Miniatura/imagen del evento (hoy ninguna pantalla la pide todavía; ver "Miniatura real" pendiente en el README de `04-lista-eventos`).
- Avisos que necesitan datos del equipo (papel distinto al de la impresora, ritmo de impresión) aparecerán aquí cuando exista C4 y `vivo.impresora` deje de ser nulo.
- Si en el futuro se agrega punto de retiro externo o impresión remota (H3/H4), sumar esas opciones aquí sin romper el formulario actual.

# Flujo de navegación — FotoCabina (punta a punta)

> Mapa completo de cómo se mueve cada persona (invitado, operador, cliente con cuenta) por **todas** las pantallas del producto — las construidas hoy y las que todavía faltan (`docs/MAPA_DE_PANTALLAS.md`, secciones A-H). Cubre el camino feliz de cada pantalla y sus escenarios de error/borde: hardware (cámara, impresora en sus 4 variantes, bluetooth), red (sin internet, servidor local caído, QR roto), comportamiento humano (invitado que abandona, operador con varios eventos el mismo día) y fallos de guardado.
>
> Nace el 2026-09-21 de un problema real: al entrar al editor de plantillas desde un evento, no había forma de volver a la cabina — cada pantalla se construyó mirando su propio diseño, sin pensar el viaje completo. Se actualiza junto con `docs/MAPA_DE_PANTALLAS.md` cada vez que se conecta, construye o decide algo sobre la navegación entre pantallas (ver `CLAUDE.md` §2).
>
> Índice visual de este mismo contenido, pensado para navegar rápido: ver el artifact "Flujo del Operador" (link compartido aparte).

## Quién se mueve por la app y qué necesita

- **Invitado** (tótem, `pages/01-camera-flow` modo invitado): flujo lineal, sin navegación por diseño. 60-120 segundos, sin curva de aprendizaje, a veces en poca luz o con una copa en la mano.
- **Operador** (hoy Nico, a futuro un cliente que paga suscripción): dos momentos muy distintos. **Antes del evento, sentado:** arma plantillas, revisa configuración, puede ir y venir sin costo. **Durante el evento, de pie, con gente esperando:** necesita volver rápido sin perder lo que armó — un callejón sin salida acá es la fila creciendo mientras busca cómo volver.
- **Cliente con cuenta** (Etapa 2, todavía no construido): gestiona su suscripción y ve sus eventos desde fuera del momento del evento, mobile o web.

## Principio general: "volver a donde entré"

Una pantalla que se abre **para una tarea puntual** (editor de plantillas, configurar cámara, crear evento) siempre debe devolver a quien la abrió a donde estaba, con lo hecho ya guardado — sin botones "atrás" del navegador ni preguntas de confirmación extra. El nombre del botón de salida dice lo que va a pasar, nunca un "X" genérico.

Una pantalla **de destino** (lista de eventos, la cabina antes de lanzar) es donde el operador se queda trabajando un rato — no tiene "volver" porque no se llega a ella para una tarea puntual, es el punto de partida o de base.

## Decisiones de navegación ya tomadas (2026-09-21)

1. **Editor de plantillas → "Lanzar evento".** *(Decidido 2026-09-21, implementado recién 2026-09-22 — quedó anotado como hecho en esta ronda anterior sin construirse de verdad; el dueño del proyecto lo detectó probando el flujo real: entraba al editor desde un evento y no había forma de terminar y volver.)* Cuando el editor se abre desde un evento (lista o cabina), el botón principal de la barra deja de decir "Exportar" y pasa a decir **"Lanzar evento"** (mismo verde lima, mismo lugar): guarda la plantilla activa en el evento y devuelve directo a la cabina con ese diseño ya puesto — mismo gesto, no dos pasos separados. La flechita de al lado (ahora un botón propio) sigue abriendo el mismo menú de exportar de siempre, con "Lanzar evento" como primer ítem. Si el editor se abre suelto (sin evento), sigue exactamente igual que siempre.
2. **"Editor" y "Plantillas" se fusionan en un solo acceso.** *(Implementado 2026-09-22.)* Eran dos íconos separados en el riel de la cabina que hacían exactamente lo mismo (abrir el editor con el evento activo). Ahora son un único ícono "Plantilla".
3. **El logo de FotoCabina se vuelve el botón "Inicio", en toda pantalla del panel de operador.** *(Implementado 2026-09-22 en `01-camera-flow`; el mismo criterio en `03-editor-plantillas` se detectó faltante y se implementó por separado el mismo día.)* Tocarlo lleva siempre a la lista de eventos — resuelve el hueco de "no hay forma de volver a mis eventos", sin agregar un ícono nuevo a ninguna barra.
4. **"Lanzar evento" se bloquea sin cámara, advierte sin impresora.** *(Parcial: el bloqueo por cámara ya existía desde antes de esta ronda de decisiones — el botón nace deshabilitado y se habilita recién cuando la cámara conecta con éxito. La advertencia por impresora queda pendiente de que exista C4, configuración de impresora — hoy no hay ningún semáforo de impresora real, es un placeholder fijo.)*
5. **El "evento activo" vive en el dispositivo, no en la cuenta.** Dos cabinas físicas distintas (dos salones, dos equipos) pueden tener cada una su propio evento activo en simultáneo sin pisarse — es una propiedad del equipo que corre esa cabina, no un límite global del operador. *(Ya es así hoy: `almacen-eventos.js` guarda el evento activo en el `localStorage` de cada equipo, no en una cuenta compartida — coherente sin cambios de código.)*

## El viaje completo, en palabras simples

1. El operador abre la app y ve la **lista de eventos** — su punto de partida siempre.
2. Si el evento no tiene plantilla, o quiere cambiarla, toca **"Editar plantilla"** y va al editor.
3. Cuando termina, toca **"Lanzar evento"** (no "Exportar"/"Guardar"): guarda la plantilla en el evento y lo lleva directo a la **cabina**, lista para arrancar.
4. Ya en la cabina, si algo de la plantilla no convence, el ícono **"Plantilla"** del riel repite el mismo círculo: vuelve al editor, "Lanzar evento" trae de vuelta a la cabina.
5. Si el operador quiere trabajar con **otro** evento, toca el **logo (Inicio)** y vuelve a la lista de eventos.
6. Al lanzar el evento de verdad (pantalla completa, modo invitado), no hay navegación a otra pantalla — la cabina cambia de modo. Con el PIN vuelve a sus controles sin perder la sesión en curso.

## Cómo leer las tablas de abajo

Cada pantalla tiene: **Cómo se llega** (todos los caminos posibles), **Cómo se sale** (destinos, incluido volver), **Escenario feliz**, y **Escenarios de error/borde** — hardware, red, abandono humano, guardado local, condiciones de carrera. El detalle completo pantalla por pantalla es largo a propósito: el objetivo es que ningún click quede sin una reacción pensada, no que sea corto.

---

## A — Cabina del invitado (tótem)

### A1 · Pantalla de espera
- **Llega:** operador lanza el evento (C2b) · retorno automático desde A7 por inactividad · invitado cancela sesión desde A3-A5 · error fatal en A10 · arranque en frío tras crash.
- **Sale:** toque en pantalla → A2 (si el evento tiene ≥2 plantillas) o A3 directo · botón "Operador"/ESC + PIN → C2b.
- **Feliz:** ícono de cámara pulsante, "Tocá para empezar", toca, avanza.
- **Errores/bordes:**
  - Cámara desconectada al llegar → no debe invitar a tocar; mensaje genérico "La cabina no está lista", permanece en A1.
  - Sin evento activo (cabina abierta suelta) → usa "Sesión de prueba" con ajustes del equipo.
  - Sin internet / licencia vencida → sigue funcionando igual (offline-first); aviso solo al operador, nunca al invitado.
  - Fallo de guardado local → no impide A1; si falla leer el evento activo, cae a "Sesión de prueba" con aviso al operador.
  - Toques repetidos (rebote táctil) → un solo toque inicia sesión, ignora el resto mientras transiciona.

### A2 · Selección de plantilla — *Falta*
- **Llega:** desde A1, solo si el evento tiene ≥2 plantillas habilitadas (config en C2, no existe todavía).
- **Sale:** elige plantilla → A3. Sin botón "atrás" (flujo lineal); timeout de inactividad → vuelve a A1.
- **Feliz:** 2-4 miniaturas, toca una, arranca A3 con su marco de encuadre.
- **Errores/bordes:**
  - Ninguna plantilla habilitada (error de config) → no debería llegar acá; fallback a la última válida o error suave → A1.
  - Invitado no elige y se queda parado → **falta timeout acá** (hoy solo existe en A7) → vuelve a A1 sin sesión iniciada.
  - Plantilla con recurso roto (fuente/imagen faltante) → placeholder en la miniatura, no ofrecerla si no renderiza, avisar al operador.
  - *Hueco:* qué pasa si el operador cancela/pausa el evento mientras el invitado está eligiendo (condición de carrera) — sin definir.

### A3 · Countdown y captura
- **Llega:** desde A2 (si aplicó) o A1. Se repite en loop por cada foto de la sesión.
- **Sale:** completa foto → A4 (si quedan más) o A5 (si era la última) · operador "Pausar" → congela, ofrece Reanudar/Cancelar · ESC → cancela todo → A1.
- **Feliz:** countdown grande, marco de encuadre iluminado, disparo automático, avanza.
- **Errores/bordes:**
  - Cámara se desconecta a mitad de countdown → A10, preserva fotos ya tomadas, ofrece reintentar solo esa foto.
  - Cámara nunca conectada / permiso denegado → error inmediato → A10 (mensaje distinto al de desconexión).
  - Bluetooth desconectado (si el trigger depende de eso) → mismo patrón, detalle técnico solo para el operador (C7).
  - Toque prematuro del invitado → no altera el countdown; solo Pausar/ESC del operador interrumpe.
  - Invitado abandona físicamente a mitad de sesión → **falta timeout acá** (hoy solo A7); debería cancelar sola tras N segundos, preservar lo capturado, volver a A1.
  - Fallo de guardado local durante la captura → la foto se toma pero no persiste; avisar sin frenar la sesión visible, reintentar en background.
  - Cancelación desde control remoto (G2, futuro) → mismo camino que ESC local, sin delay perceptible.
  - Corte de luz/reinicio a mitad de sesión → al recuperar, no debe quedar una sesión fantasma (cola persistente, §5.3).

### A4 · Interstitial entre fotos
- **Llega:** desde A3, tras cada foto excepto la última.
- **Sale:** automático por temporizador → vuelve a A3 · operador Pausar/ESC, igual que en A3.
- **Feliz:** mensaje breve con temporizador ("Cambiá de pose"), pasa sola a la siguiente captura.
- **Errores/bordes:**
  - Invitado abandona durante el interstitial → mismo hueco de timeout que A3, debería compartir el mecanismo.
  - Operador pausa el evento completo con un interstitial activo → sin definir si la sesión se cancela o solo se congela junto al resto.
  - Animación/GIF del interstitial futuro (asistente virtual, C2/C3) falla al cargar → degrada al mensaje fijo actual, nunca bloquea el paso siguiente.

### A5 · Revisión de la sesión
- **Llega:** desde A3, al completar la última foto.
- **Sale:** confirma → A6 · repite una foto → vuelve a A3 solo para esa, luego vuelve acá · "Borrar y repetir sesión" → reinicia desde A3/A1.
- **Feliz:** ve las N fotos, confirma, pasa a composición.
- **Errores/bordes:**
  - Una foto salió con error de captura → debe marcarse visualmente, forzar "Repetir" antes de poder confirmar.
  - Invitado abandona sin decidir → **falta timeout y falta definir qué hace al vencer** (¿confirma con lo que hay, o descarta?) — decisión de producto pendiente.
  - Repetir dispara error de cámara → mismo camino que A10, preservando las fotos buenas.
  - Fallo de guardado local de las fotos → debe poder seguir a A6 igual, reintento en background, aviso al operador si persiste.

### A6 · Componiendo (carga)
- **Llega:** desde A5, al confirmar.
- **Sale:** automático al terminar el render → A7. Sin cancelación manual.
- **Feliz:** spinner breve, pasa sola a A7 en 1-3 s.
- **Errores/bordes:**
  - Falla el motor de composición (recurso roto, memoria insuficiente) → A10, preserva las fotos originales siempre (principio §5.3).
  - GIF falla o tarda → no bloquea el paso a A7; su pestaña puede mostrar "Generando…" y completarse después, o marcar error puntual sin afectar tira/fotos.
  - Composición tarda anormalmente → timeout con "esto está tardando más de lo normal", nunca spinner infinito silencioso.
  - Corte de energía durante el render → al reabrir, recupera desde las fotos originales ya guardadas, sin sesión fantasma en A6.

### A7 · Resultado final
- **Llega:** desde A6, al terminar la composición.
- **Sale:** "Borrar y repetir sesión" → A3/A1 · "Finalizar" → A1 (marca finalizada) · timeout de inactividad (nunca/30/60/90 s, aviso en últimos 10 s) → A1 sola, sesión ya guardada · Imprimir → A9 (falta; hoy abre el diálogo del sistema directo).
- **Feliz:** tabs Tira/Fotos/GIF, imprime y/o descarga, escanea QR, toca "Finalizar" o se va.
- **Errores/bordes:**
  - Impresora sin papel / sin tinta / atascada / desconectada → interrumpe el envío sin perder el trabajo en cola; falta el paso intermedio A9 que hoy no existe.
  - Descarga falla (espacio insuficiente, bloqueo del navegador) → mensaje claro, reintentar o usar QR en su lugar.
  - "Compartir" no soportado por el dispositivo → el botón directamente no aparece (ya resuelto).
  - QR falla → ver A8.
  - Invitado abandona sin finalizar → cubierto por timeout automático, sesión ya guardada, nada se pierde.
  - Fallo de guardado local al persistir la sesión final → riesgo de que la tira no quede en galería (A11); reintentar o alertar al operador.
  - Operador cambia el evento activo del dropdown mientras hay un invitado en A7 de una sesión previa → no debe cortar ni corromper esa sesión — ya pertenece al evento que estaba activo cuando arrancó.

### A8 · Entrega digital QR — *parte de A7, no pantalla propia*
- **Llega:** aparece automáticamente como tarjeta dentro de A7.
- **Sale:** no navega; cambia de estado (esperando → descargado) dentro de la misma tarjeta.
- **Feliz:** QR visible, invitado lo escanea, descarga desde su teléfono en la red local, tarjeta pasa a "Descargado".
- **Errores/bordes:**
  - QR no se lee (dañado, mal escaneado) → falta fallback (código corto manual, regenerar) — hoy no existe, es una maqueta con URL de muestra.
  - Servidor local para Wi-Fi no arranca o cae a mitad de evento → nunca debe demorar la impresión (principio §3.6); la tarjeta debería mostrar "no disponible ahora" en vez de esperar indefinidamente. **Este caso puntual — servidor que no pudo levantarse — no está definido en ningún documento todavía.**
  - Invitado sin la red Wi-Fi de la cabina disponible → mensaje claro de que necesita esa red, no la del recinto.
  - Enlace vencido (token temporal expirado) → mensaje de enlace vencido, opción de regenerar desde el punto de retiro (H3) si el evento lo tiene.
  - Doble escaneo/descarga repetida → no duplica ni bloquea, "Descargado" es idempotente.

### A9 · Imprimiendo (carga) — *Falta*
- **Llega:** desde A7 al tocar "Imprimir" (hoy no existe como paso propio).
- **Sale:** automático al confirmar que entró a la cola → vuelve a A7, sin bloquear al siguiente invitado.
- **Feliz:** "Enviado a imprimir", vuelve al resultado sin fricción.
- **Errores/bordes:**
  - Sin impresora configurada → error inmediato, mensaje simple al invitado, detalle completo en C7.
  - Sin papel / sin tinta / atascada / desconectada → el trabajo queda en cola persistente, se reintenta sin repetir la sesión.
  - Cola llena o con fallos acumulados → informa posición o error agregado, nunca cuelga la interfaz (principio DSLRBooth §3.1).
  - Reintento automático falla repetidamente → tras N intentos, escala a alerta persistente para el operador (C5/C7).

### A10 · Error de sesión — *Parcial, hoy solo cubre cámara*
- **Llega:** desde cualquier paso A3-A9 donde falle cámara, impresora, guardado local, red local, o el motor de composición.
- **Sale:** reintentar → vuelve al paso donde ocurrió · operador cancela → A1 · escala con PIN → C2b/C7.
- **Feliz:** N/A — es la pantalla de error; el camino bueno es que un reintento la resuelva rápido.
- **Variantes que debe cubrir (hoy solo cubre cámara de forma simple):**
  - Error de cámara → mensaje simple "Estamos resolviendo un problema técnico", nunca detalle técnico; reintento automático breve, luego escala.
  - Error de impresora (las 4 variantes) → mismo criterio: sesión y fotos nunca se pierden, mensaje genérico y amable.
  - Fallo del motor de composición o recurso corrupto → mensaje genérico, log detallado solo en C7.
  - Sin internet → no debería aparecer nunca acá (offline-first); si aparece, es un bug de diseño.
  - Fallo de guardado local → distinguir de errores de hardware; probablemente no frena al invitado.
  - **Gap ya señalado por el propio mapa:** "falta el estado de error de impresora y el diseño final pensado para el Principio 5" — hoy solo cubre cámara.

### A11 · Galería / historial de sesiones
- **Llega:** botón "Galería" en el header de operador (C2b), en cualquier momento.
- **Sale:** cerrar → vuelve a C2b · reimprimir → flujo de A9 · eliminar (con confirmación).
- **Feliz:** filtra por evento o todos, ve sesiones recientes primero, reimprime una tira pedida de nuevo.
- **Errores/bordes:**
  - IndexedDB corrupta/llena/bloqueada → distinguir "no hay sesiones" de "error leyendo el almacén".
  - Reimprimir dispara los mismos errores de impresora que A9.
  - Eliminar falla → avisar, no fingir éxito.
  - Operador con varios eventos el mismo día → filtro "todos" debe distinguir claramente a qué evento pertenece cada sesión.
  - Storage lleno impide guardar nuevas sesiones mientras la galería muestra las viejas → falta alerta proactiva de espacio bajo.

---

## B — Editor de plantillas

### B1 · Editor de layout
- **Llega:** desde C1 ("Editar plantilla" en una card, `?evento=<id>`) · desde la cabina, ícono "Plantilla" del riel (fusión de los dos accesos anteriores, con evento) · desde B3, abriendo/creando una plantilla suelta.
- **Sale:** **"Lanzar evento"** (con evento) → guarda la plantilla en el evento, va a la cabina, no vuelve a C1 · sin evento, el cierre depende de B3 o cerrar la página.
- **Feliz:** arma capas, guías, tipografía; toca "Lanzar evento"; vuelve a la cabina con la plantilla puesta.
- **Errores/bordes:**
  - Se pierde el evento asociado (id inválido, evento eliminado desde otra pestaña) → degrada a modo suelto con aviso, sin perder el trabajo.
  - Fuente/imagen falla al importar → error claro en el momento de subir, no al exportar.
  - Cierre accidental con cambios sin guardar → **falta autosave o aviso de "cambios sin guardar"** — no documentado hoy.
  - Storage lleno al guardar → aviso explícito, nunca fallo silencioso.
  - Dos dispositivos editando la misma plantilla a la vez (Etapa 2) → condición de carrera no resuelta.
  - Detección automática de espacios de foto en un diseño importado falla → informa qué no se detectó, permite marcarlo a mano.

### B2 · Tipografía avanzada
- **Llega:** desde B1, seleccionando un elemento de texto.
- **Sale:** deseleccionar/cerrar panel → vuelve a B1.
- **Feliz:** cambia fuente/peso/alineación, ve el cambio en vivo.
- **Errores/bordes:**
  - Fuente cargada inválida o protegida por licencia → rechaza con mensaje claro.
  - Ajuste de caja mal configurado → riesgo de texto cortado sin aviso; debe mostrar indicador de overflow.
  - Fuente no viaja bien con el paquete de plantilla → la impresión en otro equipo se vería distinta, sin validación visible hoy (§3.5).

### B3 · Galería de plantillas propias
- **Llega:** pantalla de inicio del editor (suelto) · destino implícito si el evento no tiene plantilla real todavía.
- **Sale:** abrir/crear → B1; si venía de un evento, la elección se asocia sola.
- **Feliz:** ve sus plantillas con miniatura real, duplica una base, la abre.
- **Errores/bordes:**
  - Importar `.fotocabina.json` corrupto o de versión incompatible → error claro, no crea una plantilla rota.
  - Exportar falla (permisos, disco lleno) → aviso explícito.
  - Eliminar una plantilla en uso por un evento activo → advertir el impacto antes de confirmar.
  - Plantilla asociada a un evento fue borrada desde acá → hereda el mismo hueco de A2 ("evento sin plantilla válida").

### B4 · Vista de impresión / hoja
- **Llega:** desde B1, "imprimir copia de prueba" o "exportar".
- **Sale:** cerrar preview → vuelve a B1.
- **Feliz:** ve la hoja 4×6 con las dos tiras y línea de corte, exporta o imprime prueba.
- **Errores/bordes:**
  - Copia de prueba dispara los mismos 4 errores de impresora, en contexto de prueba (no bloquea ningún evento en curso).
  - Exportar falla por permisos o disco lleno.
  - Render pesado en equipo con poca memoria → riesgo de cuelgue, necesita timeout/feedback de progreso.

---

## C — Panel del operador

### C1 · Lista de eventos — *Construida*
- **Llega:** apertura de la app, o tocando el **logo/"Inicio"** desde la cabina (decisión nueva, resuelve el hueco de vuelta).
- **Sale:** "Lanzar" → cabina (C2b/A1) · "Editar plantilla" → B1/B3 · "Crear evento" → C2 (falta) · Duplicar/Archivar/Eliminar actúan en la misma vista.
- **Feliz:** ve eventos por tabs (Próximos/En curso/Archivados), toca "Lanzar" en el de hoy.
- **Errores/bordes:**
  - Almacén de eventos corrupto/vacío por fallo de localStorage → distinguir "no hay eventos" de "error leyendo el almacén".
  - Archivar/Eliminar falla a mitad → revertir visualmente, no mostrar el cambio como hecho.
  - Duplicar un evento con plantilla asociada ya inexistente → hereda una referencia inválida, mismo hueco de A2/B3.
  - Dos operadores editando la lista a la vez desde dispositivos distintos (Etapa 2) → condición de carrera, relevante recién con backend real.
  - Dos eventos "En curso" el mismo día en cabinas distintas → **resuelto por decisión nueva:** el evento activo vive en el dispositivo, cada cabina física el suyo, sin conflicto.

### C2 · Crear / configurar evento — *Construida (2026-09-22)*
- **Llega:** desde C1, "Crear evento" (botón principal o el de la lista vacía).
- **Sale:** guardar → vuelve a C1 con el evento nuevo visible, mismo patrón que "Lanzar evento" del editor (guardar y volver son un solo paso) · cancelar / botón "Mis eventos" del header → C1 sin guardar.
- **Feliz:** nombra el evento, opcionalmente le asigna plantilla (selector con las reales del editor, o "Elegir después"), define copias y modo de entrega (Impresión/Digital/Ambos), guarda, lo ve primero en "Próximos".
- **Decisión de producto (2026-09-22):** el PIN de operador **no** se configura acá — es universal para todos los eventos, sigue en Ajustes de `01-camera-flow`. El mapa original sugería PIN por evento; se descartó explícitamente.
- **Errores/bordes:**
  - Guardar sin nombre → validación clara en el formulario (implementado), foco vuelve al campo.
  - Asignar una plantilla que luego se borra en B3 → mismo hueco recurrente de A2/B3/C1 (todavía sin resolver en ningún lado).
  - Activar "punto de retiro externo" o "impresión remota" (futuro, H3/H4) → **no se muestran todavía** esas opciones, en vez de mostrarlas deshabilitadas; se agregan cuando existan H3/H4.
  - Cierre accidental a mitad de carga → *(hueco sin resolver, igual que B1: no hay autosave ni aviso de cambios sin guardar)*.
  - Storage lleno al crear → *(hueco sin resolver: `AlmacenEventos.guardar()` no distingue este caso todavía)*.

### C2b · Modo operador previo al lanzamiento — *Migrado (estructura)*
- **Llega:** desde C1 al "Lanzar" un evento · desde modo invitado, "Operador"/ESC + PIN correcto (vuelve, no llega de cero).
- **Sale:** "Lanzar evento" (lima) → A1, pantalla completa · riel: Galería→A11, **Plantilla**→B1 (con evento) o "Próximamente" (sin evento), Ajustes→panel lateral, Ayuda→"Próximamente" · **logo→C1** (nuevo) · semáforo de impresora→sección Impresión de Ajustes.
- **Feliz:** semáforos en verde, tarjeta de plantilla activa OK, toca "Lanzar evento".
- **Errores/bordes:**
  - **Resuelto por decisión nueva:** semáforo de cámara en rojo → "Lanzar evento" queda deshabilitado. Semáforo de impresora en rojo → puede lanzar igual, con advertencia visible (el evento puede ser solo digital).
  - Cambiar de evento desde el dropdown con ajustes sin guardar del anterior → debe confirmarse que no los pisa sin avisar (el README dice que "recarga al vuelo", falta verificar que no pierda cambios).
  - Evento activo eliminado/archivado desde otra pestaña mientras esta pantalla sigue abierta → debe detectar el estado inconsistente, no dejar lanzar un evento fantasma.
  - PIN de operador olvidado o adivinado por fuerza bruta (hoy fijo `1234` en código) → falta política de bloqueo tras intentos fallidos.
  - Sin internet / licencia vencida (Etapa 2) → no bloquea "Lanzar evento"; a lo sumo aviso discreto, nunca frena el evento en curso.

### C3 · Configuración de cámara — *Falta*
- **Llega:** desde C2b o desde C1 (navegación lateral "Cámara").
- **Sale:** guardar/probar → vuelve a la pantalla de origen.
- **Feliz:** selecciona la cámara conectada, ve live view de prueba, confirma.
- **Errores/bordes:**
  - Cámara no detectada → diagnóstico claro (revisar cable, reconectar), con más detalle técnico del que ve el invitado en A10.
  - Detectada pero live view no arranca (conflicto con otra app, §3.2) → sugiere cerrar otras apps de cámara.
  - Se desconecta durante la prueba → semáforo pasa a rojo en tiempo real, no queda mostrando el último frame como si siguiera viva.
  - Varias cámaras conectadas a la vez → debe permitir elegir cuál usar sin ambigüedad.
  - Bluetooth desconectado (si el trigger depende de eso) → mismo patrón de diagnóstico detallado.

### C4 · Configuración de impresora — *Falta*
- **Llega:** desde C2b (semáforo de impresora) o C1 (navegación lateral "Impresora").
- **Sale:** guardar/probar → vuelve a la pantalla de origen.
- **Feliz:** elige impresora, papel/media, orientación, copias por defecto, prueba exitosa.
- **Errores/bordes:**
  - Impresora no detectada por el driver → diagnóstico detallado (§3.4: coincidencia del tamaño de papel del layout con el material del driver).
  - Sin papel/tinta/atascada durante la prueba → mismo patrón de error + reintento, sin afectar ningún evento en curso.
  - Tamaño de papel configurado no coincide con el material físico → mostrar el error del driver traducido a lenguaje claro.
  - Impresora por red (futuro, H4) no responde → error de conectividad de red, distinto del error físico.
  - Cambiar de impresora con cola pendiente de la anterior → falta definir qué pasa con esos trabajos.

### C5 · Panel "en vivo" del evento — *Falta*
- **Llega:** desde C2b durante el evento en curso (acceso rápido sin definir todavía).
- **Sale:** cerrar/volver → C2b. Probablemente queda abierto en paralelo mientras el evento corre.
- **Feliz:** cámara/impresora en verde de un vistazo, cola vacía, sesiones en curso, contador de invitados.
- **Errores/bordes:**
  - Cámara se desconecta durante el evento → alerta visible en tiempo real, sin que el operador tenga que ir a buscarla (es justamente el propósito de esta pantalla).
  - Impresora en cualquiera de sus 4 fallas → misma alerta, con indicación de cuántos trabajos quedan retenidos.
  - Cola creciendo sin resolverse → muestra el atraso acumulado, no solo OK/error binario.
  - Servidor local cae a mitad de evento → alerta acá, el operador decide si sigue solo con impresión o reinicia el servicio.
  - Sin internet → no degrada ninguna métrica en vivo (son locales); solo la sección de licencia (Etapa 2) depende de red, mostrada aparte.
  - Falla de guardado local generalizada → alerta de primer nivel, porque afecta a todo el evento en curso, no solo a una sesión.

### C6 · Detalle de sesión — *Falta*
- **Llega:** desde A11 (galería) o C5 (panel en vivo).
- **Sale:** cerrar → vuelve a la pantalla de origen.
- **Feliz:** ve fotos originales, composición final, estado de impresión/entrega, reimprime si hace falta.
- **Errores/bordes:**
  - Reimprimir dispara los mismos errores de impresora que A9.
  - Sesión con estado `failed` (§5.3: `ready→countdown→capturing→review→composing→queued→printing→delivered`) → muestra en qué paso exacto falló, permite reintentar desde ahí, no desde cero.
  - Fotos originales faltantes por error de guardado → indicarlo explícitamente, no mostrar huecos vacíos sin explicación.
  - Estado de entrega QR desincronizado del real → refleja el último estado conocido con marca de tiempo, no asume éxito.

### C7 · Resolución de error del operador — *Falta*
- **Llega:** escalado desde A10 (con PIN) · desde C5 (alerta en vivo) · notificación directa durante el evento.
- **Sale:** resolver/reintentar → vuelve al punto de la sesión que falló, o a C5/C2b si no había sesión específica.
- **Feliz:** N/A — el objetivo es diagnóstico rápido sin perder al invitado que espera.
- **Debe cubrir, con detalle técnico real (a diferencia de A10):**
  - Cámara: cable, permiso denegado, conflicto con otra app, batería.
  - Impresora: sin papel, sin tinta, atascada, desconectada, error de driver, papel incorrecto — con reintento selectivo (reimprimir sin repetir la sesión).
  - Bluetooth desconectado si aplica.
  - Servidor local / Wi-Fi de la cabina caída → diagnóstico de red, opción de reiniciar el servicio sin reiniciar toda la app.
  - QR fallando → mismo diagnóstico, opción de desactivar ese canal temporalmente y seguir solo con impresión.
  - Guardado local lleno/bloqueado → diagnóstico de espacio, limpiar sesiones ya entregadas sin perder las de la fila actual.
  - Sin internet → dejar explícito que **no es** un error real (offline-first); un aviso de licencia debe verse claramente separado de los errores de hardware.
  - Fallo repetido tras varios reintentos → ofrece una salida de negocio clara: seguir solo con entrega digital, avisar a la fila, o pausar el evento completo desde acá.
  - Errores simultáneos (cámara Y impresora a la vez) → prioriza/lista todos, no solo el primero.

---

## D — Cuenta y suscripción (Etapa 2, futuro)

### D1 · Login / registro
- **Llega:** apertura de la app complementaria/PWA, o cualquier pantalla que requiera cuenta fuera del motor de cabina offline.
- **Sale:** login/registro exitoso → D5 o directo a C1 de esa cuenta.
- **Feliz:** email/contraseña (Firebase, infraestructura compartida con Luz Ai Studio), accede a sus eventos.
- **Errores/bordes:**
  - Sin internet al loguearse → distinguir claramente "no podés entrar a la cuenta" de "la cabina no funciona"; el motor offline sigue operando sin login si ya había sesión cacheada (§5.1.1).
  - Credenciales incorrectas repetidas → bloqueo temporal razonable, mensaje claro.
  - Licencia vencida en todas las plataformas → permite login (para ver estado/pagar) pero nunca corta una sesión offline en curso (§5.1.1).
  - Email ya usado, compartido con Luz Ai Studio → manejar cuenta cruzada sin confundir datos de un producto con otro.
  - Recuperar contraseña sin conexión → falla con mensaje claro, distinto de un error de cabina.

### D2 · Estado de licencia/suscripción
- **Llega:** desde D5 o D1 tras login si la licencia no está activa.
- **Sale:** ver detalle → D3 (cambiar plan) o D4 (renovar).
- **Feliz:** ve plan activo, vencimiento, plataformas con licencia activa.
- **Errores/bordes:**
  - Vencida y período de gracia también vencido → sigue operando eventos offline en curso, bloquea solo funciones de negocio (sync, nueva cuenta en la nube).
  - Discrepancia entre plataformas (desktop activa, iPad vencida) → mostrarse por plataforma, no como estado único ambiguo.
  - Sin internet al abrir esta pantalla → muestra el último estado cacheado con marca de tiempo, no un error bloqueante.
  - Pago rechazado con detalle insuficiente → derivar a D4 con el motivo cuando el proveedor lo entregue.

### D3 · Planes y precios
- **Llega:** desde D2, o desde un gate de feature bloqueada (a definir — no se asume en el diseño todavía).
- **Sale:** elige plan → D4 · cancelar → D2/D5.
- **Feliz:** compara planes, elige uno.
- **Errores/bordes:**
  - Precios no cargan (sin internet o backend caído) → no bloquea la cabina; "no se pudo cargar, reintentá más tarde".
  - Plan elegido ya no disponible (catálogo cambió mientras miraba) → revalidar antes de pasar a D4.

### D4 · Checkout / pago
- **Llega:** desde D3. Por plataforma (Windows/App Store/Play Store), cada canal con su flujo nativo.
- **Sale:** pago exitoso → D2 actualizado · cancelar → D3.
- **Feliz:** completa el pago nativo del canal, licencia se activa.
- **Errores/bordes:**
  - Rechazado (tarjeta, fondos, fraude) → mensaje del canal, cuenta nunca queda en estado ambiguo.
  - Conexión se corta a mitad → reconcilia con el estado real del proveedor al reconectar, nunca cobra doble ni deja la licencia en limbo.
  - Reembolso/disputa posterior → se refleja en D2 con degradación ordenada, sin cortar sesión offline en curso.
  - Pago exitoso en la tienda pero falla la sync a la cuenta compartida → cliente pagó y no ve el beneficio; caso crítico de negocio, requiere soporte.

### D5 · Perfil de cuenta
- **Llega:** desde D1 tras login, o navegación directa desde la app complementaria.
- **Sale:** cerrar sesión → D1 · navega a D2 o config de plataformas.
- **Feliz:** ve sus datos, plataformas activas, cierra sesión cuando quiere.
- **Errores/bordes:**
  - Cierra sesión con un evento offline en curso en la cabina de esa misma cuenta → no lo interrumpe, el motor de cabina no depende de sesión de cuenta en tiempo real.
  - Datos de perfil no sincronizan sin red → muestra último estado cacheado, edición local con sync diferida.
  - Datos cruzados con Luz Ai Studio (infraestructura compartida) → filtrar claramente qué pertenece a cada producto.

---

## E — Mobile: cabina con DSLR (iPad + USB) — Futuro

### E1-E9 · Mismo flujo que A1-A9, adaptado a iPad
- **Llega/sale:** mismos caminos que A1-A9, con navegación táctil de iPad en vez de tótem fijo.
- **Feliz:** igual que A1-A9, mismo motor de plantillas/composición.
- **Errores/bordes:** hereda todos los de A1-A10 (cámara, impresora, guardado, timeout, abandono, QR, servidor local), más los propios de esta plataforma:
  - Cámara DSLR conectada por USB/adaptador se desconecta por movimiento del iPad (más frecuente que en la cabina fija).
  - Adaptador USB-C/Lightning falla o se calienta en uso prolongado.
  - iPad se queda sin batería a mitad de evento → alertar con anticipación (batería baja) antes de perder la sesión.
  - App pasa a background por notificación del SO (llamada, otra app) → riesgo de perder el estado de sesión en curso.

---

## F — Mobile: cabina liviana (cámara del dispositivo) — Futuro

### F1-F9 · Versión reducida de A1-A9
- **Llega/sale:** mismos caminos conceptuales que A1-A9, sin impresora profesional (el paso de impresión puede omitirse o usar una impresora doméstica).
- **Feliz:** igual que A, con la cámara propia del dispositivo, entrega mayormente digital.
- **Errores/bordes:** hereda los de A, con matices:
  - Sin impresora profesional conectada (caso normal acá, no un error) → el modo de entrega debe poder omitir impresión sin tratarlo como fallo.
  - Impresora doméstica sin papel/tinta/atascada → mismos errores que A9/A10, driver genérico menos confiable, mayor chance de fallo silencioso.
  - Permisos de cámara revocados a mitad de evento (usuario cambia configuración del SO) → error específico, distinto de "desconexión física".
  - Dispositivo con poca memoria (gama baja, típico del cliente de entrada) → mayor chance del escenario de guardado local lleno.

---

## G — Mobile: control remoto — Futuro

### G1 · Vinculación con cabina activa
- **Llega:** apertura de la app de control remoto, buscando cabinas activas en la red local del evento.
- **Sale:** vinculación exitosa → G2 · cancelar → cierra o vuelve a selección de red.
- **Feliz:** ve la cabina activa en la lista, la selecciona, se vincula.
- **Errores/bordes:**
  - Cabina no aparece en la red → "no se encontró ninguna cabina", sugiere revisar la red.
  - Vinculación falla a mitad (pérdida de señal) → permite reintentar sin duplicar vínculos.
  - Más de una cabina activa en la red (operador con varios eventos el mismo día, cada uno en su salón) → permite elegir explícitamente cuál, con el nombre del evento visible.
  - Servidor local de la cabina cae después de vincularse pero antes de G2 → error de conexión perdida, vuelve a re-vincular.

### G2 · Control y preview remoto
- **Llega:** desde G1 tras vincularse.
- **Sale:** desvincular → G1 · cerrar la app remota no afecta la cabina, que sigue operando localmente.
- **Feliz:** dispara la sesión, ve preview en vivo, aprueba la foto, todo reflejado en la cabina física.
- **Errores/bordes:**
  - Se corta la conexión a mitad de una acción remota → la cabina es la fuente de verdad, no queda en estado ambiguo; el remoto re-sincroniza al reconectar, nunca duplica un disparo.
  - Latencia alta desfasa el preview remoto → indicador de retraso/desconexión, nunca deja creer que es tiempo real cuando no lo es.
  - Control remoto y control físico actúan al mismo tiempo → condición de carrera; el control físico de la cabina tiene prioridad como fuente de verdad.
  - Errores de hardware en la cabina deben reflejarse también en el remoto en tiempo real, o el operador remoto actúa a ciegas.
  - Batería del celular se agota a mitad de uso → la cabina sigue operando localmente, el remoto es un cliente adicional, no el control único.

---

## H — Mobile / Web: app complementaria — Futuro

### H1 · Galería de eventos (fuera del evento)
- **Llega:** apertura de la app complementaria/PWA, tras login (D1) si aplica.
- **Sale:** selecciona evento → detalle de ese evento (equivalente remoto de C6/A11).
- **Feliz:** revisa eventos pasados y sus sesiones desde el celular, fuera del momento del evento.
- **Errores/bordes:**
  - Sin internet → esta pantalla sí depende de red (no es parte del motor offline); "sin conexión" claro, last-known-state si existe.
  - Datos desincronizados entre lo local del evento y lo que llegó a la nube (si hay respaldo/telemetría opcional) → muestra cuándo fue la última sincronización.
  - Evento con muchas sesiones tarda en cargar → degrada con paginación, no cuelga la vista.

### H2 · Galería del invitado (vía QR) — posible PWA
- **Llega:** escaneando el QR de A7/A8 dentro de su ventana de vigencia, o vía enlace guardado.
- **Sale:** descarga sus fotos; sin "salida" formal, es una vista de consulta.
- **Feliz:** ve su foto/tira/GIF, la descarga a su teléfono.
- **Errores/bordes:**
  - Enlace vencido (mismo mecanismo que A8) → "este enlace ya no está disponible", sin detalle técnico.
  - Sin conexión al abrir el enlace después del evento, si dependía del servidor local que ya no existe → explica que el enlace solo funciona durante el evento, o migra a la nube si el operador lo configuró.
  - Evento finalizado con datos purgados (política de retención sin definir) → mensaje claro de contenido ya no disponible.

### H3 · Punto de retiro digital (tablet en el evento)
- **Llega:** tablet dedicada en otro sector del salón, conectada al servidor local del evento.
- **Sale:** descarga completada → vuelve a estado de espera para el siguiente invitado.
- **Feliz:** busca su código o escanea QR, encuentra su foto, la descarga sin volver a la cabina.
- **Errores/bordes:**
  - Servidor local del evento cae → toda la tablet queda inútil; estado de error claro, reintento automático, y visible para el operador en C5.
  - Código de sesión no existe o mal tipeado → "no encontramos esa sesión", sugiere buscar por galería del evento.
  - Wi-Fi local satura con muchos dispositivos (evento grande) → degradación de performance; prioriza la impresión y la cabina principal sobre este punto de retiro.
  - Tablet sin batería/desconfigurada a mitad de evento → mismo patrón que el iPad de cabina (E), pero acá el impacto es solo perder este servicio adicional, sin frenar la cabina principal.
  - Bluetooth desconectado (si el emparejamiento depende de eso) → error de configuración inicial, no bloquea el resto del evento.

### H4 · Estación de impresión remota
- **Llega:** configurado por evento (C2, futuro); la cola de impresión viaja por red local desde la cabina.
- **Sale:** copia retirada → vuelve a estado de espera.
- **Feliz:** invitado se toma la foto en la cabina, camina hasta la estación, retira su copia ya impresa.
- **Errores/bordes:**
  - Impresora remota en cualquiera de sus 4 fallas → mismos errores que A9/C4, pero el operador puede estar lejos físicamente — la alerta en C5 se vuelve crítica.
  - Red local cae entre la cabina y la estación → la cola reintenta automáticamente al reconectar, sin perder ni duplicar trabajos.
  - Cola remota se atrasa respecto a la cabina → visible en C5, para decidir si baja el ritmo (vía A4/interstitial) o revisa la estación.
  - Invitado retira la copia de otra persona por error → la estación debe mostrar identificador de sesión/nombre, no solo "la próxima en la pila".

---

## Patrones transversales de error

Estos tipos de error se repiten en varias pantallas — acá solo se referencia dónde aplica cada uno; el detalle específico está en cada pantalla arriba.

| Patrón de error | Dónde aplica |
| --- | --- |
| **Cámara** (desconexión, sin permiso, conflicto con otra app, batería) | A1, A3, A5, A10, C2b, C3, C5, C7, E1-E9, F1-F9 |
| **Impresora — sin papel** | A7, A9, A10, A11, B4, C2b, C4, C5, C6, C7, F1-F9, H4 |
| **Impresora — sin tinta/ribbon** | A7, A9, A10, A11, B4, C2b, C4, C5, C6, C7, F1-F9, H4 |
| **Impresora — atascada** | A7, A9, A10, A11, B4, C4, C5, C6, C7, H4 |
| **Impresora — desconectada** | A1, A7, A9, A10, A11, C2b, C4, C5, C7, H4 |
| **Sin internet / licencia vencida** | A1, A10, C2b, C5, C7, D1-D5, H1, H2 — nunca bloquea el motor de cabina offline, solo afecta pantallas de la capa de negocio |
| **Invitado abandona a mitad de camino** | A2 (hueco), A3, A4 (hueco), A5, A7 (cubierto por timeout) |
| **Timeout de inactividad** | A1 (destino), A2/A3/A4/A5 (huecos, no documentados hoy), A7 (único cubierto explícitamente) |
| **Operador con varios eventos el mismo día** | A7, A11, C1 (resuelto: evento activo por dispositivo), C2b, C5, G1, H1 |
| **Servidor local / Wi-Fi de la cabina caído** | A8, C5, C7, H2, H3, H4 |
| **QR fallando** | A8, H2 |
| **Bluetooth desconectado** | A3, A10, C3, C7, H3 |
| **Guardado local lleno/bloqueado** | A1, A3, A5, A6, A7, A11, B1, B3, C1, C2, C5, C7, F1-F9 |
| **Condición de carrera** (operador↔invitado o multi-dispositivo) | A2 (hueco), B1, C1, C2b, D5, G2 |
| **Reintento tras fallo repetido / degradación ordenada** | A9, C5, C7, H4 |

## Huecos que siguen sin resolver

Estas son decisiones de producto pendientes — no bloquean lo que ya está construido, pero conviene resolverlas antes de construir la pantalla que las toca:

1. **Timeout de inactividad falta en A2, A3/A4 y A5** — hoy solo existe en A7. El mismo mecanismo de "vuelve sola a A1 tras N segundos sin actividad" debería aplicar a cualquier paso donde el invitado pueda quedarse parado.
2. **Qué hace A5 si el invitado abandona sin decidir** — ¿confirma automáticamente con lo que hay, o descarta la sesión? No está definido.
3. **A8 (QR) no tiene un estado real para "el servidor local no pudo levantarse"** (puerto ocupado, firewall) — hoy es una maqueta con temporizador fijo, y este es justo uno de los casos límite pedidos explícitamente.
4. **No hay autosave ni aviso de "cambios sin guardar" en el editor de plantillas** — riesgo real porque es una sesión de trabajo larga y tranquila (más propensa a cierres accidentales).
5. **El PIN de operador es fijo en código (`1234`)**, sin política de bloqueo tras intentos fallidos — hueco de seguridad básica para un producto en un tótem público.
6. **C2 (crear evento) no define dónde vive "punto de retiro externo" ni "impresión remota"** aunque ya se sabe que debería incluirlas (ligado a H3/H4).

# 01 · Camera flow

Flujo de cabina migrado al sistema de diseño (ver `pages/00-design-system`), con dos modos:

- **Modo operador:** barra minimalista de 7 elementos fijos que no crece con las funciones nuevas: marca · dropdown de evento (el único de la barra) · semáforos de cámara e impresora · riel de 5 íconos con etiqueta al pasar/tocar (Galería, Plantillas, Editor, Ajustes, Ayuda) · "Lanzar evento" (único botón lima). Patrón inspirado en el flujo real de DSLRBooth, adaptado a nuestra identidad. Los dropdowns son un componente propio (`.ds-select`), no `<select>` nativos.
  - **Ajustes** abre un panel lateral con secciones: **Sesión** (fotos por sesión, cuenta regresiva hasta 30 s, pausa entre fotos, mensaje de la pausa, PIN) y **Cámara** funcionan; **Impresión**, **Compartir** y **Efectos y asistente** aparecen marcadas "Próximamente" para que el operador vea el mapa completo sin prometer lo que no existe. Los ajustes se guardan en este equipo (localStorage) y sobreviven a recargar.
  - **Plantillas**, **Ayuda** y "Cambiar" plantilla abren una hoja "Próximamente". **Editor** abre `02-layout-editor` de verdad. El semáforo de impresora lleva a la sección Impresión de Ajustes.
  - **Tarjeta de plantilla activa** sobre la cámara (abajo a la izquierda): miniatura + "3 fotos · 2×6 en 4×6 · cuenta 3 s · pausa 3 s" + contador del evento ("12 sesiones · última 15:04"), para verificar configuración y rendimiento de un vistazo antes de lanzar.
  - **Volver al inicio por inactividad** (Ajustes › Sesión: nunca / 30 / 60 / 90 s, por defecto 30 s): si el invitado se va de la pantalla de resultado sin tocar nada, la cabina vuelve sola a "Tocá para empezar". Cualquier toque o tecla reinicia el conteo; en los últimos 10 s aparece el aviso "Vuelve al inicio en N s". La sesión ya quedó guardada en la galería.
  - **Espejo de cámara** (Ajustes › Cámara): con la cámara del dispositivo ayuda a posar; con una DSLR suele ir apagado. Afecta la vista en vivo y las fotos capturadas.
- **Modo invitado:** pantalla completa (fullscreen al lanzar), sin header ni configuración visible. Flujo: "Tocá para empezar" → countdown con número gigante (duración configurable por el operador) → **interstitial** entre cada foto (pausa breve para cambiar pose/prop, y palanca para regular el ritmo de la fila en el evento) → revisión de fotos → composición → resultado. Un botón discreto de "Bloquear/Desbloquear" en la esquina permite al operador salir del modo invitado.

### Mejoras sobre el flujo de referencia (DSLRBooth)

- **Repetir una foto individual** tocando "Repetir" sobre su miniatura en la pantalla de revisión, antes de armar la tira. Es la única chance: **una vez armada la tira no hay vuelta atrás foto por foto** (decisión de producto 2026-09-16, para que el resultado sea un cierre y no otra ronda de edición). DSLRBooth solo permite "Borrar y repetir" la sesión completa. El chip está siempre visible porque en el tótem táctil no existe hover.
- **Marco de encuadre proporcional a la plantilla:** durante la sesión, la zona que entra en la foto se ve iluminada y el resto de la cámara oscurecido, con la misma proporción que tiene cada foto en la tira (hoy fija en `FRAME_RATIO` dentro de `app.js`; cuando el editor de plantillas exponga el tamaño real por diseño, se lee de ahí). Igual que la guía de DSLRBooth, para que el invitado se mantenga dentro del cuadro.
- **Controles de emergencia del operador durante la sesión:** botón "Pausar" en la esquina (congela el countdown/interstitial y ofrece Reanudar o Cancelar sesión) y tecla **ESC** que cancela la sesión en curso y vuelve al inicio — para cuando alguien toca la pantalla antes de tiempo o hay que reiniciar en el momento.
- **Pantalla de resultado en dos zonas, nunca con scroll:** a la izquierda el escenario con la pieza (tira, fotos sueltas o GIF) escalada al alto disponible; a la derecha un panel fijo con "¡Listo!", las pestañas Tira / Fotos / GIF, las salidas (Imprimir, Descargar —dice qué baja según la pestaña—, Compartir donde el dispositivo lo soporta) y, anclado abajo, el cierre: "Borrar y repetir sesión" discreto y **"Finalizar"** como único botón lima. En vertical o angosto (tótem, tablet, celular) el panel pasa abajo y el escenario ocupa el alto que sobra. Las dos versiones anteriores (columna centrada) obligaban a hacer scroll para encontrar "Finalizar" en pantallas de 768 px de alto.

- **Acceso de operador protegido por PIN:** durante el evento, el botón "Operador" de la esquina (o la tecla ESC sin sesión en curso) abre un teclado numérico; con el PIN correcto (`PIN_OPERADOR` en `app.js`, hoy `1234`) se vuelve al header de operador sin cerrar la app ni perder la cámara. Un invitado que lo toque por error solo ve el teclado y puede cancelarlo.
- **Sesiones guardadas automáticamente** (`almacen-sesiones.js`, IndexedDB del navegador): cada tira compuesta se guarda sola con sus fotos originales, la tira y el GIF, aunque el invitado se vaya sin tocar "Finalizar". "Borrar y repetir sesión" la elimina; "Finalizar" la marca como finalizada.
- **Galería** (botón en el header de operador): sesiones del evento actual o de todos los eventos, más recientes primero. Al abrir una: reimprimir, descargar la tira, descargar el GIF, descargar cada foto por separado, o eliminar (pide un segundo toque).
- **Descargar y compartir por vista:** en el resultado, "Descargar" baja lo que se está viendo (tira / las 3 fotos / GIF) y cada foto tiene su propio chip "Descargar". "Compartir" aparece solo en dispositivos que soportan compartir archivos (celulares y tablets) y usa la hoja de compartir del sistema.
- **GIF animado real** (`codificador-gif.js`, sin librerías): se genera en el navegador a partir de las 3 fotos (480×360, 0,6 s por cuadro, bucle infinito) apenas se arma la tira, y queda guardado con la sesión. Tarda 1–3 s según la máquina; mientras tanto la pestaña GIF muestra "Generando GIF…".

Archivos de la página: `index.html`, `styles.css`, `app.js`, más dos módulos auxiliares sin dependencias: `almacen-sesiones.js` (guardado local) y `codificador-gif.js` (GIF).

Funcionalidad conservada del MVP original:
- Solicita la cámara disponible en el navegador.
- Ejecuta una sesión con cuenta regresiva (3 fotos).
- Compone una hoja 4 × 6.
- Permite descargar la composición o abrir la impresión del sistema.

Pendiente para una fase posterior (no bloquea esta migración): editor visual de las animaciones del interstitial (hoy es un mensaje fijo con temporizador simple; en DSLRBooth esto se configura en "Asistente virtual" con GIFs/imágenes propias del operador) — se construye en el panel de operador (pantallas C2/C3 del mapa de pantallas).

Esta página es un prototipo de navegador. La integración profesional con Canon/Nikon, flash y una impresora térmica pertenece a la futura aplicación de escritorio offline (ver `docs/DSLRBOOTH_PRODUCT_CONTEXT.md`).

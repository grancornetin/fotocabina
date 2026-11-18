# 06 · Respaldo y restauración

Pantalla para guardar TODO lo del equipo en un archivo y recuperarlo (hito 1.6, `docs/ARQUITECTURA_FLUJO.md` §7.9). Hoy los datos viven solo dentro del navegador: limpiar los datos del sitio, cambiar de navegador o de computador los pierde. Esta pantalla es la salida.

**Se abre desde** el ítem "Respaldo" del menú lateral (y de la barra inferior en móvil) de `04-lista-eventos`. **Vuelve a** la lista con el botón "Volver a Eventos" (arriba a la izquierda), siguiendo el principio "volver a donde entré" de `docs/FLUJO_NAVEGACION.md`. No pide PIN (la lista tampoco lo pide).

> **Pensada para mudarse a C8 (Ajustes del equipo) en el hito 7.** Entonces este ítem del menú de la lista desaparece y la pantalla pasa a ser una sección de Equipo; la lógica (`../shared/respaldo.js`) no cambia.

## Qué hace

1. **Espacio en este equipo.** "Espacio usado X de Y (Z %)" con una barra (ámbar desde 80 %, roja desde 95 %), y una línea simple sobre si el navegador protege los datos (`navigator.storage.persisted()`). Si el navegador no entrega el dato, lo dice y no inventa nada. Con 80 % o más muestra "Queda poco espacio en este equipo. Haz un respaldo y libera lo que ya no uses."
2. **Crear respaldo.** Descarga `fotocabina-respaldo-AAAA-MM-DD.zip` (un ZIP estándar sin compresión: se abre con el Explorador de Windows). Casilla **"Incluir las fotos de los invitados"** (marcada por defecto; son datos personales). Sin fotos, el respaldo trae eventos, plantillas, contadores y copias de plantilla, pero **no sesiones** (una sesión sin sus fotos no sirve). Muestra "Preparando… 40 de 120 archivos" y la fecha del último respaldo (`fotocabina-ultimo-respaldo` en localStorage). Si no hay nada que respaldar, lo dice (no es un error). Si no pudo leer las plantillas del editor o los eventos (datos dañados), el respaldo se descarga igual pero la pantalla avisa en ámbar que está **INCOMPLETO** y qué falta; nunca afirma que fue completo. Las sesiones antiguas (formato v1) también se respaldan con sus imágenes. **Es el único botón lima de la pantalla.**
3. **Restaurar desde un archivo.** Elegir archivo → **se valida todo antes de tocar nada** (es un ZIP, CRC de cada entrada, manifest de FotoCabina, versión de formato que esta app entiende, estructura de los datos) → resumen (fecha, eventos, plantillas, sesiones, fotos, peso, si trae fotos) frente a lo que hay hoy → elegir modo:
   - **Sumar a lo que ya tengo** (por defecto, recomendado): no borra nada. Un evento, plantilla o sesión que ya existe por id se queda como está y se informa cuántos se omitieron. Restaurar dos veces el mismo archivo no duplica nada.
   - **Reemplazar todo**: borra lo de ahora y deja exactamente el respaldo (también suelta el evento activo). Pide confirmación con el botón rojo destructivo (nunca lima) y ofrece "Respaldar lo de ahora" en el mismo cuadro.
   - El cuadro avisa **"Cierra la cabina y el editor de plantillas antes de seguir"** (el editor guarda desde su memoria y puede pisar lo restaurado; ver reservas en §7.9).
   - **Todo o nada:** primero se guarda localStorage (con instantánea para deshacer) y después IndexedDB en una sola transacción; si algo falla, se devuelve la instantánea y el cuadro dice que no se cambió nada. Antes de empezar se comprueba el espacio con 10 % de margen.
   - Un archivo de **un solo evento** no se restaura aquí: la pantalla avisa que se importa desde la lista ("Importar evento").
4. Tras restaurar: el contador de sesiones de cada evento queda en el mayor valor visto, para que el próximo número de sesión no repita ninguno.

## Qué entra y qué no

Entra: eventos, contadores de sesión, plantillas del editor, sesiones, archivos (fotos, tira, hoja, GIF) y copias congeladas de plantilla. **No entra:** el PIN ni nada del Equipo (al restaurar en otro equipo se crea un PIN nuevo; en el mismo equipo se conserva el actual), el evento activo, el tema, `fotocabina-ajustes` ni la copia de seguridad de la migración v1. Formato del archivo: `../shared/README.md` ("Respaldo y restauración").

## Errores con siguiente paso

Cada mensaje dice qué pasó y qué hacer: "no es un respaldo de FotoCabina", "lo creó una versión más nueva… actualiza FotoCabina", "está dañado… vuelve a copiarlo o usa otro respaldo", "fue modificado (tiene compresión)… usa el archivo tal como se descargó", "no hay espacio… libera espacio o restaura sin fotos", "no se pudo restaurar y no se cambió nada".

## Accesibilidad y diseño

Cuadro de confirmación con `role="dialog"`, `aria-modal`, `aria-describedby`; foco inicial en Cancelar, Tab/Shift+Tab giran dentro del cuadro, Escape lo cierra (no mientras trabaja) y el foco vuelve al botón de origen. El progreso y los resultados van en regiones `aria-live`. Sin emojis; íconos SVG de trazo 2,4. Casilla y opciones nativas (`input` checkbox y radio). Probada en modo claro, oscuro y a 390 px sin scroll horizontal. Mientras trabaja, el navegador avisa si se intenta cerrar la pestaña.

## Archivos

`index.html`, `styles.css`, `app.js` (solo interfaz; toda la lógica está en `../shared/respaldo.js`). Carga `../shared/almacen-eventos.js`, `../shared/almacen-plantillas.js`, `../01-camera-flow/almacen-sesiones.js` y `../shared/respaldo.js`.

## Conteo de hojas (hito 3b)
El respaldo completo y "Exportar evento" llevan el conteo de hojas impresas (`datos/impresion.json`): por evento (para el tope) y, en el respaldo completo, por impresora (rollo acumulado) con el ajuste de rollo. La vista previa lo dice ("Trae el conteo de hojas impresas…"). Sumar: gana el mayor por evento y no pisa el rollo de este equipo; Reemplazar: queda como el respaldo; importar evento: solo el de ese evento. Un respaldo anterior sin ese archivo se restaura igual (sin tocar los conteos de este equipo). Reglas completas en `../shared/README.md`.

## Pendiente

- Pasarla a C8 (hito 7) y decidir si lleva PIN allí.
- Cifrar el archivo con contraseña (hoy las fotos van sin cifrar; el archivo debe guardarse en un lugar seguro).
- Probar con un volumen real de varios GB (hoy probada con decenas de archivos).

# Plan del nuevo Editor de Plantillas — FotoCabina

> Documento de continuidad. Está escrito para que **cualquier agente de IA o persona pueda retomar el trabajo sin haber leído la conversación original**. Si retomás este trabajo: leé este archivo completo, después la sección "Estado actual / retomar aquí" al final, y recién ahí tocá código.
>
> Creado: 2026-09-16. Dueño del proyecto: Nico (no programador — ver `memoria_trabajo_para_ias.txt`).

---

## 0. Reglas obligatorias antes de tocar nada

1. Leer `README.md` (sección "Reglas para trabajar en este proyecto"), `PRODUCT.md`, `DESIGN.md`, `pages/00-design-system/index.html` y `docs/MAPA_DE_PANTALLAS.md`, en ese orden.
2. Leer `memoria_trabajo_para_ias.txt`: el dueño no programa. Se le explica en lenguaje simple, se le entregan cambios completos, se le dice cómo probar.
3. **El editor viejo `pages/02-layout-editor/` NO se toca ni se borra.** Queda como referencia funcional hasta que el nuevo lo supere en todo. Recién entonces se reemplaza y se actualiza el mapa de pantallas.
4. El editor nuevo vive en `pages/03-editor-plantillas/`. Solo se tocan archivos de esa carpeta (y este documento).
5. Sin dependencias externas, sin CDNs, sin frameworks. HTML + CSS + JavaScript puro. Debe abrir con doble clic en el navegador.
6. Diseño: cumplir `DESIGN.md` al pie de la letra. Un solo verde lima por pantalla (en el editor, el verde es para **guías inteligentes y selección activa**, que son "datos en vivo"). Sin emojis, sin glassmorphism, sin degradés multicolor, sin sombras negras salvo en modales/menús flotantes. Íconos SVG propios de trazo grueso (2.2–2.4px).
7. Nombres de archivos, funciones, clases CSS y textos de interfaz **en español**.
8. Trabajar por fases. Cerrar una fase, actualizar la sección "Estado actual" de este documento, y que el dueño pruebe antes de seguir.

---

## 1. Por qué se rehace desde cero

- El editor actual (`02-layout-editor`) es un prototipo: todo el código está comprimido en pocas líneas ilegibles, usa porcentajes en vez de milímetros reales, el visual es anterior al sistema de diseño, y la tipografía es mínima.
- El dueño del proyecto definió que **el editor es la pieza más importante para el operador**: "por sí solo debe valer el 50% del precio de la licencia". Debe sentirse premium, ágil, potente, al nivel de Canva/Figma en precisión e interacción.
- DSLRBooth (referencia de la competencia, capturas en `pantallas dslrbooth/header de herramientas/plantillas/`) sirve **solo como lista de funciones que deben existir**. Está expresamente prohibido copiar su interfaz, su disposición o sus controles. Todo se piensa para nuestro producto.

### Funciones del editor viejo que NO se pueden perder

Todas están en `pages/02-layout-editor/app.js` (código comprimido, se puede leer como referencia de lógica):

- Guías magnéticas de centro (50%) y de bordes/centros de otros elementos, con imán al acercarse (~8px).
- Medición de distancia al elemento vecino en mm mientras se arrastra.
- Detección de **espaciado repetido**: si dos elementos ya tienen una separación, el que se arrastra se pega a esa misma distancia y muestra "X mm · igual".
- Selección múltiple por arrastre en el lienzo (marquee) y con Shift.
- Mover un grupo seleccionado arrastrando cualquiera de sus elementos.
- Capas: orden (frente/atrás), duplicar, eliminar, bloquear.
- Alinear (izquierda/centro/derecha/arriba/medio/abajo) y distribuir.
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z), duplicar (Ctrl+D), mover con flechas.
- Imágenes PNG con transparencia que se conserva sobre fotos y lienzo.
- Texto que no cambia de altura solo por moverlo.
- Vista de hoja 4×6 con dos tiras 2×6 y preparación de impresión.
- Guardado automático en el navegador (localStorage).

### Funciones que DSLRBooth tiene y nosotros también debemos tener (checklist)

- Agregar: imagen, foto de la cabina (slot), texto, dato de sesión (fecha, fecha y hora, número de sesión, nombre del evento), figura, código QR, color de fondo.
- Papel: tamaño (2×6, 4×6, libre), unidad (mm/cm/pulgadas), resolución (300 ppp), orientación, ancho/alto.
- Elemento seleccionado: posición X/Y, tamaño, mantener proporción, rotación, color de trazo, ancho de trazo, sombra.
- Alinear y distribuir.
- Capas con visibilidad (ojo), bloqueo (candado), duplicar, eliminar.
- Nueva plantilla, guardar como nueva, importar, exportar, imprimir copia de prueba, eliminar plantilla, deshacer/rehacer, estado "Guardada / Editada".

---

## 2. Concepto de producto: "La mesa de trabajo del operador"

El lienzo es el protagonista absoluto. Las herramientas aparecen **cuando se necesitan y donde se necesitan**. No es un formulario con cajas movibles.

### Disposición de la pantalla (desktop, operador)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ BARRA SUPERIOR: marca · nombre de plantilla (editable) · Guardado/Editada │
│                 undo/redo · zoom · Vista de hoja · Exportar (primario)    │
├────┬─────────────────────────────────────────────────────────┬────────────┤
│ R  │  [barra contextual flotante del elemento seleccionado]  │ INSPECTOR  │
│ A  │                                                         │            │
│ I  │   regla horizontal (mm)                                 │ Posición   │
│ L  │ r ┌───────────────────────────┐                         │ Tamaño     │
│    │ e │                           │                         │ Rotación   │
│ +  │ g │        LIENZO             │                         │ Opacidad   │
│    │ l │   (área segura, corte,    │                         │ ...según   │
│ P  │ a │    guías propias,         │                         │ tipo       │
│ A  │   │    guías inteligentes)    │                         │            │
│ N  │ m │                           │                         ├────────────┤
│ E  │ m └───────────────────────────┘                         │ CAPAS      │
│ L  │                                                         │ (lista)    │
└────┴─────────────────────────────────────────────────────────┴────────────┘
```

- **Rail izquierdo (angosto, íconos):** Fotos · Texto · Formas · Imágenes · Datos del evento · QR · Fondo · Papel. Al tocar un ícono se despliega un panel al lado con las opciones de ese grupo. Tocar de nuevo lo cierra.
- **Barra contextual flotante:** aparece sobre el elemento seleccionado (o fijada arriba del lienzo si no entra). Muestra solo las acciones frecuentes del tipo seleccionado: para texto → fuente, tamaño, negrita, cursiva, color, alineación; para foto → encuadre, esquinas, borde; para forma → color, esquinas, trazo. Además siempre: duplicar, bloquear, eliminar, orden de capa.
- **Inspector derecho:** valores exactos en **milímetros** (X, Y, ancho, alto, rotación, opacidad) más las propiedades profundas del tipo. Debajo, la lista de **capas** con ojo/candado, arrastrar para reordenar, doble clic para renombrar. Se puede colapsar.
- **Lienzo:** reglas en mm arriba e izquierda; arrastrar desde una regla crea una guía propia (se borra arrastrándola fuera). Zoom con Ctrl+rueda o botones; mover el lienzo con Espacio+arrastre o rueda. Área segura y línea de corte visibles como líneas discretas (nunca verdes: son referencia, no datos vivos).
- **Guías inteligentes (lima):** centro del lienzo, bordes y centros de otros elementos, espaciado igual, distancia en mm al vecino. Con **Alt presionado** sobre otro elemento se muestra la distancia entre el seleccionado y ese. Todas en Lima Voltaje con etiqueta de mm en número tabular.
- **Pantalla de inicio del editor = Galería de plantillas (B3 del mapa):** al abrir el editor se ven "Mis plantillas" (miniatura real, nombre, tamaño, fecha) y "Plantillas base" (tira 2×6 · 3 fotos, tira 2×6 · 4 fotos, postal 4×6 · 1 foto, postal 4×6 · 4 fotos, en blanco). Abrir, duplicar, renombrar, eliminar (con confirmación de dos toques).

### Detalles que lo hacen premium (no negociables)

- Estado "Guardado" / "Sin guardar" siempre visible; guardado automático.
- Atajos de teclado completos y una hoja de referencia con la tecla `?`.
- Feedback inmediato (100–150 ms) en cada acción; transiciones de estado 150–250 ms; nada decorativo. Motion solo para explicar estado (aparece panel, cambia selección, se pega una guía).
- Modo oscuro (referencia) y modo claro, ambos completos.
- Estados vacíos que enseñan ("Todavía no hay fotos. Agregá la primera desde el rail."), nunca "nada aquí".
- Números tabulares en todo valor que cambie (mm, zoom, contador).
- Todo control tiene: normal, hover, foco (borde lima), activo, deshabilitado.

---

## 3. Estructura de archivos

```text
pages/03-editor-plantillas/
├── index.html          # estructura: barra superior, rail, lienzo, inspector, galería, modales
├── styles.css          # todos los estilos (tokens copiados de 00-design-system, ambos modos)
├── iconos.js           # SVG propios de trazo grueso, un objeto {nombre: svgString}
├── estado.js           # modelo de datos, historial (undo/redo), guardado local, unidades mm↔px
├── lienzo.js           # dibujo del lienzo, reglas, zoom/pan, selección, arrastre, redimensión, rotación
├── guias.js            # guías inteligentes, espaciado igual, medición Alt, guías propias
├── imagenes.js         # arrastrar y soltar imágenes, lectura de archivos, "Al lienzo", detección de espacios de foto
├── inspector.js        # barra contextual flotante + panel derecho + lista de capas
├── paneles.js          # rail izquierdo y sus paneles de "Agregar"
├── tipografia.js       # fuentes locales (FontFace), ajuste del texto a la caja, edición directa sobre el lienzo
├── render.js           # motor de raster: plantilla → canvas → PNG a N ppp, hoja duplicada, miniaturas, patrón QR
├── galeria.js          # pantalla de inicio: mis plantillas + plantillas base
├── paquete.js          # exportar/importar archivo de plantilla, PNG, hoja, imprimir copia de prueba
└── app.js              # arranque: une todo, atajos de teclado, eventos globales
```

Todos los `.js` se cargan en `index.html` con `<script>` en ese orden. Cada archivo expone un único objeto global con prefijo `Editor` (ej. `EditorEstado`, `EditorLienzo`, `EditorGuias`). Nada de módulos ES ni bundlers: tiene que abrir con doble clic.

Se aparta de la convención "un solo app.js" del README porque el editor es la pantalla más grande del producto y un solo archivo sería ilegible (que es exactamente el problema del editor viejo).

---

## 4. Modelo de datos de la plantilla

Todo se guarda en **milímetros** (unidad física real). La conversión a píxeles de pantalla la hace el lienzo según el zoom; la conversión a píxeles de impresión la hace el motor de render según los ppp.

```js
{
  version: 1,
  id: "abc123",
  nombre: "Tira clásica · 3 fotos",
  creada: "2026-09-16T10:00:00Z",
  modificada: "2026-09-16T10:30:00Z",
  papel: {
    preset: "tira-2x6",        // "tira-2x6" | "hoja-4x6" | "libre"
    anchoMm: 50.8,
    altoMm: 152.4,
    ppp: 300,
    orientacion: "vertical",   // "vertical" | "horizontal"
    sangradoMm: 1.5,           // margen exterior que se recorta
    areaSeguraMm: 3,           // margen interior donde no conviene poner nada importante
    duplicarEnHoja: true       // true = dos tiras 2x6 en una hoja 4x6
  },
  fondo: { tipo: "color", color: "#FFFFFF" },   // futuro: tipo "imagen"
  guiasPropias: [ { eje: "x", mm: 25.4 } ],
  fotosPorSesion: 3,            // se calcula = cantidad de slots de foto distintos
  elementos: [
    {
      id: "e1",
      tipo: "foto",             // "foto" | "texto" | "forma" | "imagen" | "dato" | "qr"
      nombre: "Foto 1",
      xMm: 5, yMm: 10, anchoMm: 40.8, altoMm: 30,
      rotacion: 0,              // grados
      opacidad: 100,
      visible: true,
      bloqueado: false,
      orden: 2,                 // z-index
      // --- propios de cada tipo ---
      // foto:   numero (1..N), encuadre "cubrir"|"contener", focoX, focoY, radioMm, borde {anchoMm, color}, mascara "rectangulo"|"circulo", filtro "ninguno"|"bn"|"sepia"
      // texto:  contenido, fuente, peso, cursiva, subrayado, tachado, mayusculas "original"|"mayusculas"|"minusculas", tamanoPt, interlineado, espaciado, alineacion "izquierda"|"centro"|"derecha", alineacionVertical "arriba"|"centro"|"abajo", ajuste "crecer"|"reducir"|"fijo", color
      // forma:  figura "rectangulo"|"circulo"|"linea", relleno, radioMm, trazo {anchoMm, color}
      // imagen: origen (dataURL), nombreArchivo, encuadre, radioMm
      // dato:   campo "fecha"|"fechaHora"|"numeroSesion"|"nombreEvento", formato, + todas las propiedades de texto
      // qr:     contenido "enlaceEntrega", colorOscuro, colorClaro
    }
  ],
  recursos: {
    fuentes: [ { familia: "Mi Fuente", archivo: "mifuente.woff2", dataURL: "..." } ]
  }
}
```

Guardado local: clave `fotocabina-editor-v1` en localStorage con `{ plantillas: [...], ultimaAbierta: id }`. Fase 3 agrega exportar/importar como archivo `.fotocabina.json` (paquete con recursos incrustados).

---

## 5. Fases de construcción

Cada fase termina con: código funcionando, este documento actualizado, y el dueño probándolo en el navegador antes de seguir.

### Fase 1 — La mesa de trabajo (base de todo)

Objetivo: reemplazar y superar todo lo que hace el editor viejo, con el nuevo visual y en milímetros.

- [ ] Estructura de la pantalla (barra superior, rail, lienzo, inspector, capas) con el sistema de diseño, modo oscuro.
- [ ] Lienzo en mm con reglas, área segura, línea de corte, zoom (botones + Ctrl+rueda + "ajustar a pantalla"), pan (Espacio+arrastre, rueda).
- [ ] Elementos: foto (slot numerado), forma (rectángulo/círculo/línea), imagen (PNG con transparencia), texto básico (contenido, tamaño, color — la tipografía completa es Fase 2).
- [ ] Selección: clic, Shift+clic, marquee, Ctrl+A, Escape. Mover grupo. Manijas de redimensión en 8 puntos; Shift mantiene proporción; manija de rotación.
- [ ] Guías inteligentes: centro, bordes/centros de otros, espaciado igual, distancia en mm al vecino, medición con Alt, guías propias desde las reglas, imán a guías/cuadrícula (activable).
- [ ] Barra contextual flotante por tipo + inspector en mm + lista de capas (ojo, candado, reordenar arrastrando, renombrar).
- [ ] Alinear/distribuir (respecto a selección o al lienzo si hay un solo elemento).
- [ ] Undo/redo, duplicar, eliminar, flechas (1 mm; Shift = 10 mm), orden de capa (Ctrl+] / Ctrl+[).
- [ ] Guardado automático local + indicador "Guardado / Sin guardar" + nombre editable.
- [ ] Panel "Papel": preset, ancho/alto libre, orientación, ppp, sangrado, área segura, duplicar en hoja.
- [ ] Estados vacíos y hoja de atajos (`?`).

### Fase 2 — Tipografía completa (B2 del mapa)

- [x] Fuente (lista de sistema + fuentes cargadas), peso, cursiva, subrayado, tachado.
- [x] Mayúsculas/minúsculas/original sin destruir el contenido (CSS `text-transform`; el contenido guardado no cambia).
- [x] Tamaño en pt, interlineado, espaciado entre letras (en em), alineación horizontal y vertical.
- [x] Ajuste a la caja: crecer (la caja crece con el texto, nunca se achica sola), reducir (la letra baja hasta entrar; muestra etiqueta "N pt"; el modelo conserva el tamaño pedido), fijo/recortar.
- [x] Carga de fuentes locales `.ttf/.otf/.woff/.woff2`, guardadas como dataURL en `plantilla.recursos.fuentes` y registradas con `FontFace` al cargar.
- [x] Edición de texto directamente sobre el lienzo (doble clic o Enter; Esc cancela, Ctrl+Enter o clic afuera confirma).

Nota para la Fase 3 (motor de render): el modo "reducir" calcula el tamaño final en pantalla (`EditorTipografia.ajustarNodo`). El raster a 300 ppp tiene que repetir la misma búsqueda (bajar 6 % por vuelta hasta que entre, mínimo 4 pt) para que la impresión coincida con lo que se ve.

### Fase 3 — Plantillas e impresión (B3 + B4 del mapa)

- [x] Galería de inicio (`galeria.js`): mis plantillas con miniatura real (render a baja resolución), 15 plantillas base (`PLANTILLAS_BASE` en `estado.js`, esquemas en fracciones del papel inspirados en los layouts A–M que aportó el dueño), abrir, duplicar, renombrar (doble clic en el nombre), eliminar con doble toque de confirmación, exportar archivo. Se abre al iniciar y con el botón "Plantillas" (Ctrl+O).
- [x] Datos de sesión (tipo `dato`: fecha, fecha y hora, número de sesión, nombre del evento) con texto de muestra en el lienzo (`textoDeDato`) y todas las opciones tipográficas. En el evento la cabina reemplaza el valor.
- [x] Código QR: **decidido que NO va en la plantilla** (corrección del dueño, ver Estado actual 2026-09-17). El QR de entrega digital es parte de la pantalla de resultado de la cabina (A7/A8 del mapa de pantallas), en una esquina, y lleva a las fotos + info + copia digital de la tira. El editor no tiene tipo `qr`, rail ni panel para eso.
- [x] Motor de render propio (`render.js`): plantilla → canvas → PNG a los ppp del papel. Dibuja fondo, fotos (de prueba o gris numerado), imágenes, formas, textos con salto de línea, alineación, subrayado/tachado, espaciado, mayúsculas y modo "reducir" replicado, QR, rotación, opacidad, esquinas y bordes.
- [x] Vista de hoja (Ctrl+P): tira duplicada en 4×6 (lado a lado si es vertical, apilada si es apaisada) con línea de corte; "Descargar hoja PNG"; "Imprimir copia de prueba" abre la hoja en una pestaña con `@page` del tamaño exacto y llama a imprimir.
- [x] Exportar/importar archivo `.fotocabina.json` (`paquete.js`): lleva imágenes y fuentes adentro; importar acepta varios archivos y abre la última.
- [x] Fondo: color (rail "Fondo"). Fondo con imagen = una imagen "Al lienzo" enviada al fondo (no hace falta un tipo aparte).
- [x] Menú "Exportar" en la barra: Imagen PNG (Ctrl+E) · Hoja para imprimir PNG · Archivo de plantilla · Importar.

### Fase 4 — Pulido

- [x] Modo claro completo y switch de 3 estados (Oscuro/Claro/Sistema) en la barra superior, persistido en `localStorage` con la clave `fotocabina-theme` (misma clave que `00-design-system`, para que la elección de tema sea consistente si en el futuro se navega entre páginas). Se agregó el bloque `@media (prefers-color-scheme: light)` que faltaba para el modo "Sistema" (antes solo existía `[data-theme="light"]`, el modo Sistema no reaccionaba al SO).
- [x] Auditoría contra `DESIGN.md` y `craft-floor`: contraste verificado (el eyebrow "Plantillas"/fog sobre fondo claro da 4.9:1, cumple el mínimo de 4.5:1 para texto chico); los colores fijos que quedan en el CSS (`#FFFFFF`, `#111214`, etc.) son intencionales — representan el **papel** (siempre blanco salvo que el usuario elija otro color) y sus manijas de selección, no superficies de la interfaz, así que no deben seguir el tema de la app.
- [x] Revisión de motion: todas las transiciones están en 100–250ms con `ease-standard`/`ease-out-expo`; las únicas `animation` de entrada son paneles, modales, toasts y la barra contextual (eventos discretos, no coreografía de scroll); `prefers-reduced-motion` cubierto.
- [x] **Bug corregido: redimensionar un elemento rotado ya no lo desplaza.** Causa raíz: al cambiar ancho/alto se recalculaban `x`/`y` en el sistema de coordenadas sin rotar, pero CSS rota sobre el centro (`transform-origin: center`) — el centro de una caja rotada no se mueve de forma lineal con `x`/`y` cuando el tamaño cambia de forma asimétrica. Arreglo en `lienzo.js` (bloque `tipo === 'redimensionar'`): se calcula el nuevo centro en el sistema local (sin rotar) y se convierte al lienzo rotándolo el mismo ángulo, así el punto opuesto al que se arrastra queda fijo. Verificado con prueba matemática aislada: diferencia residual de 0,001 mm (puro redondeo), contra varios mm de salto antes del arreglo. Sin rotación (caso normal) el comportamiento no cambió.
- [x] Actualizar `docs/MAPA_DE_PANTALLAS.md` (B1, B2, B3, B4) y `README.md` (tabla de páginas) — hecho en las fases anteriores, ya reflejan el estado actual.
- [ ] Retiro de `02-layout-editor`: **no se retira todavía**, queda a criterio del dueño una vez que use el editor nuevo en un caso real. No es bloqueante para dar la Fase 4 por cerrada.

---

## 6. Convenciones de código para quien continúe

- Un objeto global por archivo (`EditorEstado`, `EditorLienzo`, ...). Nada de variables globales sueltas.
- Toda modificación del modelo pasa por `EditorEstado.aplicar(fn, descripcion)`, que guarda historial, marca "Sin guardar", persiste y vuelve a dibujar. Nunca mutar `plantilla.elementos` directamente desde la interfaz.
- Coordenadas: el modelo está en mm. `EditorLienzo.mmAPx(mm)` y `EditorLienzo.pxAMm(px)` son las únicas funciones de conversión.
- Íconos: agregar al objeto de `iconos.js`, siempre `viewBox="0 0 24 24"`, `stroke-width` 2.2–2.4, `fill="none"`, `stroke-linecap="round"`.
- CSS: prefijo `ed-` para clases del editor; reusar `ds-btn`, `ds-badge`, `ds-select`, `ds-input`, `ds-toggle` copiando su CSS desde `00-design-system` / `01-camera-flow` (no enlazar archivos de otras carpetas: cada página es autocontenida).
- Textos de interfaz en español rioplatense neutro ("Agregá", "Elegí", "Guardado").
- Sin comentarios que expliquen qué hace el código; solo comentarios de "por qué" cuando no es obvio.

---

## 7. Cómo probar cada fase (para el dueño)

1. Abrir `pages/03-editor-plantillas/index.html` con doble clic (Chrome o Edge).
2. Fase 1: agregar 3 fotos, moverlas hasta que aparezca "igual" en verde entre ellas, redimensionar con Shift, rotar, seleccionar todas con marquee y alinear al centro, Ctrl+Z varias veces, recargar la página y verificar que todo sigue igual, cambiar el papel a 4×6.
3. Fase 2: escribir un texto largo, cambiar fuente/peso/interlineado, cargar una fuente .ttf propia, verificar que se ve igual tras recargar.
4. Fase 3: exportar PNG y abrirlo: debe medir 600×1800 px (2×6 a 300 ppp) o 1200×1800 (4×6). Exportar paquete, borrar la plantilla, importar el paquete: todo vuelve idéntico.

---

## 8. Estado actual / retomar aquí

> Actualizar esta sección al cerrar cada bloque de trabajo. Formato: fecha, qué se hizo, qué falta, por dónde seguir.

**2026-09-16 — Inicio.** Plan escrito y aprobado por el dueño.

**2026-09-16 — Fase 1 construida, pendiente de prueba del dueño.** Existen `index.html`, `styles.css`, `iconos.js`, `estado.js`, `guias.js`, `lienzo.js`, `inspector.js`, `paneles.js`, `app.js` en `pages/03-editor-plantillas/`. Verificado con captura en Chrome sin ventana: arranca sin errores, muestra la plantilla base (tira 2×6 con 3 fotos), la selección con manijas, la guía de centro, el espaciado igual "3 mm", la barra contextual, el panel de Fotos, el inspector y las capas.

Qué quedó hecho de la Fase 1: todo el checklist de la sección 5, salvo:
- Los paneles "Datos" y "QR" muestran tarjetas deshabilitadas con la nota "Fase 3" (a propósito).
- Redimensionar un elemento **rotado** funciona pero puede desplazarlo un poco (se ignora la compensación del centro de rotación). Es una simplificación conocida; arreglar en Fase 4 si molesta en uso real.
- La edición de texto se hace desde el inspector (doble clic en el texto enfoca el campo). La edición directa sobre el lienzo es Fase 2.
- El botón "Exportar" descarga por ahora un `.fotocabina.json` con la plantilla (sin fuentes, sin PNG a 300 ppp — eso es Fase 3).

Cómo se probó sin abrir un navegador visible: se creó un `prueba.html` temporal (fuera del proyecto) que carga los mismos archivos y simula un arrastre con `PointerEvent`, y se sacó captura con `chrome.exe --headless=new --screenshot`. Sirve para que un agente sin navegador pueda verificar cambios visuales.

**2026-09-16 — Ronda 1 de correcciones tras prueba del dueño.**
- Bug del switch "Visible" (apagar ocultaba el texto y no se podía volver a prender): causa = la sincronización de valores salteaba el control enfocado; ahora solo saltea campos de texto. Ocultar ya no quita la selección. El bloque "Orden" pasó a botones con texto ("Al frente / Subir / Bajar / Al fondo") y nota explicativa.
- Duplicar una foto crea una copia exacta con el mismo número ("Foto 3 copia"), no un espacio nuevo.
- Nuevo `imagenes.js`: arrastrar imágenes desde una carpeta y soltarlas en el lienzo (sobre un espacio de foto = foto de prueba). Si la imagen tiene la proporción del papel, se ajusta sola al lienzo y se manda al fondo. Botón "Al lienzo" y botón **"Detectar espacios de foto"** (busca agujeros transparentes, rectángulos negros o del color sólido más frecuente; crea un espacio de foto por rectángulo, misma proporción, numerados de arriba hacia abajo; reemplaza los espacios vacíos anteriores; Ctrl+Z deshace). Probado con una imagen sintética tipo Canva: 3 rectángulos detectados con error < 0,1 mm.
- Pedido del dueño anotado para Fase 3: importar, exportar imagen de muestra a 300 ppp, imprimir copia de prueba, elegir/crear/guardar-como plantilla. Se le explicó que la plantilla se guarda como datos (JSON) y la imagen es el resultado de cada sesión.

**2026-09-16 — Ronda 2 (flujo Canva → editor).**
- Los espacios detectados se agrandan 0,5 mm por lado (`SOBREPASO_MM` en `imagenes.js`) para tapar la línea del rectángulo que quedaba visible.
- Nuevo botón **"Al área segura + fondo automático"** en el inspector de imagen: encoge la imagen hasta el área segura (nada se corta al imprimir) y, si el borde de la imagen es de un solo color (≥85 % del anillo exterior), pinta el fondo del papel con ese color; si no, avisa y deja el fondo como estaba. Decisión del dueño: prefiere esto a rediseñar en Canva. "Al lienzo" (borde a borde) sigue disponible.
- Detección afinada: "negro" ahora es < 22 por canal y la tolerancia del color más frecuente bajó a ±12, para que un fondo gris oscuro con rectángulos negros no se confunda en un solo bloque.
- Idea anotada, no construida: aviso automático "hay contenido fuera del área segura".

**2026-09-16 — Fase 1 aprobada por el dueño ("funciona a las mil maravillas"). Fase 2 construida, pendiente de prueba.**
- Nuevo `tipografia.js`. Bloque "Texto" del inspector completo (fuente, cargar fuente, tamaño, peso, cursiva/subrayado/tachado, mayúsculas, color, interlineado, espaciado, alineación H/V, ajuste a la caja). Barra contextual de texto: fuente, tamaño, N, I, AA, color, alineación.
- Panel "Texto" del rail: lista de fuentes propias cargadas con botón para quitarlas.
- Bug corregido durante la prueba: `window.EditorTipografia` siempre era `undefined` porque los módulos se declaran con `const` (no crean propiedad en `window`). Regla para quien continúe: para comprobar si un módulo existe usar `typeof EditorX !== 'undefined'`.
- Probado con captura: texto largo con "crecer" pasó de 9 a 19,4 mm; texto con "reducir" bajó de 20 a 6 pt con etiqueta visible.
- No probado sin navegador: la carga real de un archivo de fuente (requiere elegir archivo). Lo prueba el dueño.
- Pedido del dueño: las fuentes se **agrupan por familia**. `interpretarNombre()` en `tipografia.js` lee el nombre del archivo ("Montserrat-BoldItalic.otf" → familia Montserrat, peso 700, cursiva) y cada archivo se registra con `FontFace` con su peso y estilo; el modelo guarda `{familia, peso, cursiva, archivo, dataURL}` por archivo. Se pueden elegir varios archivos a la vez. El panel Texto lista una fila por familia con sus variantes. Probado con 17 nombres de Google Fonts (incluye SemiBold, ExtraLight, BoldItalic).

**2026-09-16 — Fase 2 aprobada. Fase 3 construida, pendiente de prueba del dueño.**
- Orden de carga de scripts (importa): iconos, estado, guias, **render**, lienzo, imagenes, tipografia, inspector, paneles, galeria, paquete, app.
- `estado.js` ahora maneja varias plantillas: `listarPlantillas`, `abrirPlantilla`, `crearPlantilla(baseId)`, `incorporarPlantilla` (importadas), `duplicarPlantilla`, `eliminarPlantilla`, `renombrarPlantilla`. Evento `plantillas` avisa a la galería.
- Verificado con capturas: galería con miniaturas reales y bases; render a 300 ppp = 600 × 1800 px para 2×6; hoja = 1200 × 1800 con dos copias y línea de corte; textos, subrayado, "reducir" y QR se ven iguales en lienzo y en el raster.
- Detalle para pruebas sin ventana: las animaciones de entrada de los modales quedan congeladas con `--virtual-time-budget`; para capturar un modal inyectar `.ed-modal-tarjeta{animation:none}` en el arnés. No es un bug del editor.
- No probado sin navegador: la descarga real de archivos y la ventana de impresión (requieren interacción). Lo prueba el dueño.

**2026-09-16 — Ajustes de Fase 3 pedidos por el dueño.**
- Los QR eran demasiado grandes: ahora se agregan de 12 mm en la esquina inferior derecha (dentro del área segura) y con **`imprimir: false`** por defecto. Nueva propiedad `imprimir` en todos los elementos (switch "Se imprime" en el inspector): apagada, el elemento se ve en el editor con la etiqueta "Pantalla" y borde punteado, y **el motor de render lo omite** (`render.js` filtra `imprimir === false` salvo `opciones.incluirSoloPantalla`). Pensado para que el QR viva en la pantalla de entrega digital sin robar espacio al diseño. La cabina (fuera de este editor) deberá renderizar con `incluirSoloPantalla: true` para la vista en pantalla.
- Nuevo "Guía para Canva PNG" en el menú Exportar (`EditorPaquete.exportarGuia` → `renderizar(p, { modoGuia: true })`): fondo transparente al tamaño exacto en píxeles, espacios de foto en gris con número y medida, área segura punteada, encabezado con nombre y tamaño. Flujo: Canva → "Tamaño personalizado" con esos píxeles → subir la guía como capa → diseñar encima → exportar → traer al editor → "Al lienzo" / "Detectar espacios de foto".

**2026-09-17 — Corrección del dueño: el QR no va en la plantilla.** Se había agregado un tipo de elemento `qr` (patrón de muestra, panel en el rail, propiedad `imprimir` en todos los elementos para poder marcarlo "solo pantalla"). El dueño aclaró que se lo imaginaba distinto: un QR fijo en una esquina de la **pantalla de entrega digital de la cabina** (no del diseño de la tira), que además de descargar la foto da acceso a info y a la copia digital en formato tira. Imprimirlo sería desperdiciar espacio útil del papel.

Revertido por completo: se sacó el tipo `qr`, el botón "QR" del rail, su panel, sus campos en el inspector y la barra contextual, y la propiedad `imprimir` (ya no hace falta sin QR). `normalizar()` en `estado.js` filtra cualquier elemento `tipo:'qr'` que hubiera quedado guardado de la versión anterior, así que no hace falta que el dueño borre nada a mano. Verificado con captura: rail con 7 botones (sin QR), render sin ese tipo, y una nota en el panel "Datos" explicando dónde va a vivir el QR real. Anotado como pendiente futuro, **fuera de este editor**: diseñar esa pantalla de entrega (QR + vínculo a fotos/copia digital) es tarea de la pantalla A7/A8 (cabina), no del editor de plantillas.

**2026-09-17 — Fase 4 construida, pendiente de prueba del dueño.** Modo claro con switch de 3 estados, bug de redimensionar rotado corregido, motion y contraste auditados. El editor de plantillas queda funcionalmente completo (Fases 1–4). Lo único abierto es una decisión de negocio, no técnica: cuándo retirar `02-layout-editor`.

**2026-09-17 — Corrección de UI pedida por el dueño.** El botón de eliminar en "Mis plantillas" se agrandaba in place para pedir confirmación ("¿Seguro?") y desbordaba la fila de acciones de la tarjeta. Reemplazado por un popover flotante (`.ed-confirmar-popover` en `galeria.js`/`styles.css`) que aparece arriba del ícono de basura, con el nombre de la plantilla en la pregunta y botones "Cancelar"/"Eliminar" — no cambia el tamaño de nada alrededor. Se cierra con Escape (`EditorGaleria.alEscape`, ahora también lo usa el atajo global de Escape en `app.js`) o con un clic afuera.

Próximo paso: que el dueño pruebe el switch de tema, el arreglo de redimensionar un elemento rotado, y este nuevo popover de eliminar. Si todo cierra, **no queda ninguna fase pendiente del plan original**; los próximos pasos del editor serían pedidos nuevos del dueño (por ejemplo, conectar con la cabina real, o ítems que vayan surgiendo de uso en un evento real). Con su OK arranca la **Fase 4 (pulido)**: modo claro y switch, auditoría contra DESIGN.md, motion, revisión del redimensionar rotado, actualizar mapa/README, decidir el retiro de `02-layout-editor`. Recién después arrancar **Fase 2 (tipografía)**: crear `tipografia.js`, ampliar el bloque "Texto" del inspector y la barra contextual, y agregar la carga de fuentes locales guardadas en `plantilla.recursos.fuentes`.

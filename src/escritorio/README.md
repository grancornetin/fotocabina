# escritorio

Programa de escritorio de FotoCabina (Windows). Abre las pantallas de `src/pages/` tal como están y les presta lo que el navegador no puede: **hablar con la cámara Canon por cable** y **imprimir en silencio** por el driver de Windows. Sin costo: Electron, koffi y PowerShell son gratuitos.

## Por qué Electron y no Tauri
Tauri necesita instalar Rust y las herramientas de compilación de Visual Studio (este PC no las tiene); Electron corre con Node (ya instalado) y no compila nada. La cámara se maneja con `koffi`, que llama a la DLL de Canon sin compilar.

## Cómo se usa
```
cd src/escritorio
npm install            (una sola vez; descarga Electron y koffi)
npm start              (abre la lista de eventos)
```
Opciones (después de `--`, por ejemplo `npm start -- --kiosco`): `--kiosco` pantalla completa · `--dev` herramientas de desarrollo (F12) · `--pantalla=01-camera-flow/index.html` abre otra pantalla · `--salida-prueba=<carpeta>` NO imprime: guarda cada hoja como `.xps` y ofrece solo impresoras virtuales (para probar sin gastar papel).

Los datos (eventos, sesiones, cola de impresión) viven en la carpeta de datos del programa, **distinta** de la del navegador: para traer lo que hay en Chrome, usa Respaldo (`06-respaldo`) en el navegador viejo y restaura en el programa.

## Estructura
| Archivo | Qué hace |
| --- | --- |
| `main.js` | Ventana, permisos, navegación solo entre pantallas propias y las órdenes que reciben cámara e impresión. |
| `preload.js` | Lo único que ven las pantallas: `window.fotocabinaEscritorio` (`camara`, `impresion`, `info`). |
| `config.js` | Dónde está el SDK de Canon (ver abajo). |
| `camara/puente-camara.js` | Proceso aparte que habla con el SDK de Canon (vista previa, disparo, desconexión). Si el SDK se cae, no cae el programa. |
| `camara/camara-canon.js` | Lanza ese proceso y le habla por mensajes. |
| `impresion/servidor.ps1` | PowerShell que queda abierto: lista impresoras, lee su estado e imprime una imagen sin diálogo. |
| `impresion/impresora-windows.js` | Lado Node del anterior. |

Del lado de las pantallas: `pages/shared/camara-escritorio.js` (fuente de cámara) e `pages/shared/impresion-escritorio.js` (adaptador de impresora real). Sin el programa (en un navegador) no existen y todo sigue como antes.

## El SDK de Canon (EDSDK): nunca entra al repositorio
La licencia de Canon no permite repartir sus archivos y el repositorio es público. Se busca, en orden: variable `FOTOCABINA_EDSDK` · `configuracion.local.json` (`{ "rutaEdsdk": "..." }`, junto a `config.js`) · `configuracion.json` en la carpeta de datos del programa · carpeta `edsdk/` junto al programa · `C:\SDK-Canon\v13.21.10`. Todo eso está en `.gitignore`. **Cómo se empaquetará en un instalador respetando la licencia: pendiente de decisión del dueño (Tablero, hallazgo 10).**

## Qué se sabe y qué no
- **Cámara (probado con la EOS Rebel T5 real):** conecta en ~1 s, vista previa ~21 cuadros/s (1056×704), disparo con la foto completa (5184×3456, ~2,7 MB) en ~1 s tras el comando (~2 s incluyendo bajar y volver a subir el espejo). Si otro programa (dslrBooth, EOS Utility) tiene la cámara, se avisa y se usa la cámara web. Si el proceso de la cámara se cae, la cabina muestra "Reconectar cámara" y reconecta.
- **Apagado automático de la cámara:** el programa pide más tiempo cuando la cámara avisa que se va a apagar, y si igual se apaga o duerme, la cabina lo dice y pide encenderla y reconectar. **Esta parte NO se pudo probar** (no se dejó dormir la cámara). Recomendación: desactivar el apagado automático en el menú de la cámara.
- **Impresión (probado hasta el driver, sin papel):** envío silencioso, elección del papel 4×6 del driver, hoja llena sin márgenes, cola persistente de la cabina, detección de error y cancelación del trabajo para no imprimir doble. Comprobado de punta a punta con la impresora virtual "Microsoft XPS Document Writer" (página de 3,94×5,83 pulgadas, la hoja llena). **NO probado con papel real ni con la HiTi** (no hay impresora a mano). El estado que Windows informa viene del spooler: si el driver no avisa "sin papel" o "sin cinta", nadie lo sabe hasta intentar imprimir (límite conocido).
- **Impresión con papel real (HiTi P510L, probada el 2026-11-20 con el dueño; sigue sin probarse la SELPHY):** sale en silencio, sin ventanas, unos 18 a 25 s por hoja; el papel del driver "6x4" no tiene márgenes, pero la impresora **corre la imagen** unos mm (el driver informa márgenes 0): `config.js` trae un ajuste de fábrica por impresora y tipo de papel (`normal` 2,6 mm; `corte` 1,5 mm, ambos hacia la derecha) que el operador afina con "Alinear el corte" en la cabina (ver `pages/01-camera-flow/README.md`); esa corrección viaja con cada orden (`ajusteXMm`/`ajusteYMm`) y manda sobre el valor de fábrica. También se puede fijar a mano en `configuracion.json` de los datos del programa (`ajusteImpresoras`).
- **Corte en dos tiras:** si la hoja lleva dos tiras (`partir`), `servidor.ps1` usa el papel "6x4-Split (6x2 2 prints)" del driver y la HiTi corta al medio; si el driver no tiene papel Split (p. ej. la SELPHY) imprime la hoja entera sin cortar. Para las hojas normales sigue sin usar las variantes Split/2UP/Combo.
- **Sin papel o sin cinta (probado con papel fuera):** el driver de HiTi retiene el trabajo en el spooler ("Error, Printing, Retained") y muestra **su propio aviso** en pantalla ("Paper box missing", con "Volver a imprimir esta página" y "Cancelar la impresión"). El programa **no cancela ni reintenta**: espera hasta 15 minutos a que el operador decida en ese aviso. "Volver a imprimir" (tras reponer el papel) saca **una sola hoja** y el trabajo queda `completado`; "Cancelar" no saca nada y devuelve `impresora-cancelada` (definitivo: la cola no reintenta sola); si nadie responde, `trabajo-pegado` (definitivo, revisar la cola de Windows). Antes se cancelaba el trabajo y la cola reintentaba sola, y con el aviso del driver abierto podía salir doble. El aviso es del driver (no se puede evitar ni personalizar) y mientras tanto la pantalla del invitado sigue en "imprimiendo": **falta un aviso al operador dentro de la cabina**. Cinta agotada: no se probó (se espera el mismo comportamiento).
- **Hallazgos menores de la HiTi:** los 2 o 3 grises más oscuros salen casi iguales y los grises tienen un leve tinte; la impresora se come 1 a 2,5 mm por borde, así que las plantillas deben dejar al menos 3 mm de margen interno (el editor ya trae área segura de 3 mm).
- Pendiente (de seguridad): el programa todavía no está firmado ni empaquetado en instalador.

# Prueba técnica de escritorio (D8, hito 3a), personalizada al hardware real

> **Estado:** preparada, NO ejecutada, esperando visto bueno del dueño (D8). Fecha: 2026-11-18. Decisión D8 de `ARQUITECTURA_FLUJO.md` §8. Documento para agentes; al dueño se le presenta en el chat.
>
> **Cómo leer las marcas.** **[Confirmado]** = dicho por una fuente citada (códigos F1 a F13, al final). **[Suposición, a comprobar]** = no hay fuente o la fuente es de terceros; se comprueba en el equipo real. Si una búsqueda no dio resultado, se dice. Varias páginas oficiales de Canon bloquearon la lectura directa (error 403); esas citas vienen del resultado del buscador y se marcan.

## Hardware real
- Impresora principal: **HiTi P510L** (sublimación, rollo). Impresora a veces: **Canon SELPHY CP1500**. Cámara: **Canon EOS T5** (Rebel T5 / EOS 1200D, DSLR).
- Interfaz a cumplir: `AdaptadorImpresora` en `src/pages/shared/impresion.js` (`instantanea()` síncrona, `consultar()`, `enviar(trabajo, contenido)`, `cancelar()`, `medios`, estados `sin-papel`, `sin-cinta`, `atascada`, `desconocido`...). Hoy solo existe la impresora simulada.

## Qué se sabe de cada equipo

### HiTi P510L
- **Papel y rendimiento.** 300 x 300 dpi; tamaños 4x6, 5x7, 6x8 y 6x9, todos con impresión "2-UP"; máximo 6x9 sin bordes; unos 12 s para 6x4; capacidad 330 (4x6), 190 (5x7), 150 (6x9) imágenes por kit. **[Confirmado]** F1 (copia del manual de HiTi alojada en un sitio de terceros).
- **Driver Windows.** El manual solo cubre Windows hasta 7 **[Confirmado]** F1. HiTi publicó driver 3.3.0.25a y firmware 1.16 para la P510L en 2012 **[Confirmado]** F2. Un listado de terceros indica driver 3.7.0.29 (2015) compatible con Windows 7 a 11, ID USB `HITIHITI_P510L4C26` **[Suposición, a comprobar]** F13. El sitio oficial de descargas (`download.hiti.com`) no respondió durante la búsqueda: bajar el driver de ahí y anotar versión.
- **SDK o API del fabricante.** No se encontró ninguno público **[Suposición, a comprobar]** (búsqueda sin resultado; puede existir bajo acuerdo con HiTi). Se asume que la ruta es el driver de Windows.
- **Impresión silenciosa.** Mismo camino que cualquier impresora con driver: la app envía a la cola del driver sin mostrar diálogo. Con Chrome sería con la opción de línea de comandos de impresión de kiosco; con Electron o Tauri, enviando el trabajo a la impresora por nombre **[Suposición, a comprobar]** (no hay fuente aquí; es práctica general de Chrome y de Windows).
- **Tamaño personalizado, márgenes, corte, mate.** "2-UP" existe en todos los tamaños **[Confirmado]** F1. Que el corte parta la hoja 4x6 en dos tiras de 2x6, que se pueda fijar sin bordes y que exista sobre-laminado mate en esta máquina: **[Suposición, a comprobar]** (la búsqueda no halló documentación HiTi; otro fabricante de la misma clase ofrece "corte 2 pulgadas" y mate en su driver, pero no es evidencia de HiTi). Se mira en las Preferencias de impresión del driver instalado.
- **Estado (sin papel, sin cinta, atasco).** En Windows el spooler no consulta la impresora física: el estado solo aparece mientras despacha un trabajo y lo informa el monitor de puerto; el monitor por defecto solo marca el bit de error general **[Confirmado]** F6. `Win32_Printer` (WMI) puede mostrar "Idle" aunque el driver no informe nada **[Confirmado]** F7. Que el driver de la P510L informe sin papel o sin cinta por ese canal: **[Suposición, a comprobar]**. Una utilidad de estado de HiTi existe para la P525L según un listado de terceros; para la P510L **[Suposición, a comprobar]**.
- **Limitaciones previsibles.** Que el driver no entregue cinta o papel restante: **[Suposición, a comprobar]**; si es así, el conteo de hojas de la cola (hito 3) es la única fuente, con capacidad por tamaño (330/190/150).

### Canon SELPHY CP1500
- **Papel.** Postal 100 x 148 mm sin bordes (91,3 x 121,7 con bordes), tarjeta 54 x 86 mm, etiquetas; 300 dpi; unos 41 s por postal y 23 s por tarjeta; USB-C y Wi-Fi; 18 hojas de capacidad **[Confirmado]** F3. El "set de 108 hojas" dla consulta inicial no apareció en la fuente: **[Suposición, a comprobar]**.
- **Driver Windows.** Canon no ofrece driver instalable para Windows 11; solo firmware (1.0.7.0 Windows). Windows la maneja con el driver genérico IPP, que tras actualizaciones recientes solo muestra tamaño Letter y escala de grises; el driver de la CP1300 tampoco funciona **[Confirmado]** F4, F5 (foro de Microsoft con moderador; Canon USA dice que Windows 11 es lo garantizado, F3 regional dice que USB en Windows 10 exige la actualización 2022). Impresión por Wi-Fi directa (IPP) desde la app sin pasar por el driver: **[Suposición, a comprobar]**. Wi-Fi solo en 2,4 GHz **[Suposición, a comprobar]** (dato de una tienda): choca con usar el Wi-Fi propio de la cabina para el QR.
- **Silenciosa y estado.** Sin driver propio, el tamaño postal y el color son el punto de riesgo; el estado vía Windows es el mismo límite de F6/F7 **[Confirmado]** y su comportamiento con esta impresora **[Suposición, a comprobar]**.
- **Diferencias que tocan el adaptador.** Dos impresoras de distinto tipo a la vez (la cola ya guarda `impresoraId`); el consumo es por tamaño y rollo en la HiTi y por cassette en la Canon (cada adaptador declara sus propios `medios` y su capacidad); la HiTi hace 2 tiras por hoja, la Canon imprime postal completa. Si la Canon no logra imprimir fiable desde Windows, queda como "solo desde su propia app".

### Canon EOS T5 (cámara)
- **EDSDK.** Gratis, se pide registrándose en el Canon Developer Programme y esperando aprobación; trae captura remota y Live View **[Confirmado]** F10 (resultado de búsqueda). La T5 / 1200D aparece en listas regionales antiguas del SDK (v2.14) y no en las versiones recientes **[Suposición, a comprobar]**: hay que pedir al registrarse la versión que la soporte. Licencias regionales (alguna restringe la distribución al país de venta) **[Suposición, a comprobar]**.
- **EOS Webcam Utility.** Los instructivos oficiales de Canon listarían la "EOS Rebel T5", pero el PDF no se pudo abrir y los foros de Canon se contradicen (unos dicen que no funciona, otros que sí) **[Suposición, a comprobar]** F8. Versión actual (Pro): 720p gratis, 1080p por suscripción, sin 4K, Windows 10 y 11 **[Confirmado]** F9. Latencia: **[Suposición, a comprobar]**.
- **Live View por EDSDK y por programas alternos.** digiCamControl y gphoto2 en Windows: no se confirmó soporte de la 1200D **[Suposición, a comprobar]**. Dragonframe lista la T5 con Live View de 1056 x 704 **[Suposición, a comprobar]** F12 (tercero).
- **Calor y energía.** Con la batería LP-E10 el Live View dura unos 1 h 15 min a 23 °C **[Confirmado]** F11. La T5 usa el adaptador AC **ACK-E10** (acoplador DR-E10), no el E18 (modelo de otras cámaras Canon) **[Confirmado]** F11. El límite por sobrecalentamiento del Live View continuo de la T5 no se encontró en fuente: **[Suposición, a comprobar]** (otras Rebel muestran un icono de temperatura y luego detienen el Live View).
- **Desde el navegador.** `getUserMedia` funciona si la T5 aparece como cámara web (Webcam Utility). La salida HDMI con capturadora: que la T5 entregue Live View limpio por HDMI **[Suposición, a comprobar]** (Canon documenta la salida HDMI para reproducción en TV, F11).
- **Ruta más simple primero:** probar Webcam Utility + `getUserMedia` (sin código nuevo) y dispararla con la cámara web actual como respaldo; solo calidad de vista previa, la foto final saldría de ese video. **Ruta más robusta:** EDSDK desde un proceso nativo (shell Electron o Tauri, o un servicio auxiliar) con Live View para la vista previa y disparo remoto a resolución completa.

## Pruebas (1 a 3 días, en los equipos reales; nada se instala fuera de una carpeta de prueba)
| # | Prueba | Pasa si | Cómo |
|---|---|---|---|
| 1 | Impresión silenciosa en la HiTi P510L | 20 hojas 4x6 con dos tiras seguidas, sin diálogo ni tocar nada; cada hoja sale a ±1 mm de las medidas y con corte correcto; cero bordes blancos; tiempo por hoja anotado (referencia 12 s, F1) | (a) Chrome en kiosco con impresión sin diálogo; (b) shell Electron o Tauri enviando a la cola del driver. Anotar versión de driver y firmware |
| 1b | Impresión en la SELPHY CP1500 | 5 postales y 5 tarjetas en color y tamaño correcto sin diálogo, por USB y por Wi-Fi; si el driver genérico no basta, se registra y se prueba IPP directo | Driver IPP de Windows, luego IPP directo |
| 2 | Estado de ambas impresoras | Con la bandeja sin papel, la cinta fuera y un papel atascado provocados a propósito, la app lo ve en menos de 10 s en al menos 2 de 3 casos por impresora; si no, el estado queda "desconocido" y el conteo de hojas manda | `GetPrinter`/`EnumJobs` y WMI (F6, F7) más la utilidad de HiTi |
| 3 | Cámara T5 | Foto en la app en menos de 3 s desde el disparo, sin diálogos, 50 disparos seguidos sin fallar; Live View 30 min seguidos sin que la cámara lo corte | (1) Webcam Utility y `getUserMedia`; (2) EDSDK. Medir con batería y con ACK-E10 |
| 4 | Servidor local para el QR | Un celular en el Wi-Fi propio descarga la foto sin Internet en menos de 5 s; se comprueba que la SELPHY por Wi-Fi no obliga a dejar ese Wi-Fi | Servidor mínimo dentro de la app |
| 5 | Reinicio y corte de luz con trabajos en cola | Con 3 trabajos en cola se corta la luz: al volver no se pierde ninguno y no se reimprime ninguno ya impreso | La cola actual (hito 3) |
| 6 | Instalación y actualización sin Internet | Un PC limpio instala y abre en menos de 10 min incluyendo driver de la HiTi y la cámara; las dos impresoras y la cámara se ven desde la app | Instalador del shell elegido |

## Qué cambia en las pruebas 1 a 6 por estos modelos
1. La prueba 1 ahora mide medidas, corte y tiempos reales; la HiTi imprime por rollo con "2-UP", así que el corte de la tira es lo que más se vigila.
2. Se agrega la 1b porque la SELPHY no tiene driver propio en Windows (F4, F5): es la prueba con más riesgo.
3. La 2 asume que el estado puede no llegar: se define de antemano qué hace la app cuando es "desconocido".
4. La 3 deja de ser genérica: decide entre Webcam Utility (simple) y EDSDK (robusta) y mide el límite de Live View con batería y con adaptador AC.
5. La 4 vigila que el Wi-Fi de la SELPHY (solo 2,4 GHz, si se confirma) no choque con el Wi-Fi propio de la cabina.
6. La 6 incluye instalar el driver de la HiTi (versión por confirmar) y el software de la cámara en el PC limpio.

## Qué hay que comprobar en el equipo real (lista para el dueño)
- Modelo exacto y versión de Windows del PC del evento (Windows 10 con actualización 2022 o Windows 11), CPU y RAM.
- HiTi P510L: versión de driver y de firmware instaladas y la última publicada en `download.hiti.com`; si el driver instala en Windows 11; qué opciones muestra (tamaños, 2-UP, corte, sin bordes, mate); si la cola de Windows pasa a "sin papel" al sacar el rollo; cuántas hojas rinde un rollo real por tamaño.
- Canon SELPHY CP1500: qué driver toma Windows (IPP genérico u otro), si ofrece postal y color, versión de firmware, si imprime por IPP directo, en qué banda de Wi-Fi conecta, cuántas hojas trae el set que se compre.
- Canon EOS T5: si aparece como cámara en Webcam Utility y qué resolución y retraso da; qué versión del EDSDK entrega Canon al registrarse y si lista la T5; si la T5 saca Live View por HDMI; cuánto aguanta el Live View seguido (minutos hasta el icono de temperatura); si se compra el adaptador AC ACK-E10.
- Número de serie y firmware de la cámara; cables USB originales y de buen largo para ambas impresoras y la cámara.
- Papel y cinta o rollo para unas 40 hojas por impresora y un celular de prueba.

## Salida
Informe corto: qué herramienta ganó y por qué, qué quedó fuera, riesgos y el contrato del adaptador real (uno por impresora). Con eso se abre el hito 8.

## Atajo si se quiere un primer evento sin app
Chrome en modo kiosco con impresión sin diálogo y la cámara por Webcam Utility. Limitaciones: una sola impresora y sin estado de impresora **[Suposición, a comprobar]**.

## Fuentes
- F1 Manual HiTi P510L (copia) https://www.manualsdir.com/manuals/771386/hiti-p510l.html?page=11
- F2 HiTi, aviso P510 (2012) https://www.hiti.com/about/news.aspx?MenuID=232&lang=EN
- F3 Canon, especificaciones SELPHY CP1500 http://id.canon/en/consumer/selphy-cp1500/black/specification
- F4 Microsoft Q&A, CP1500 y driver IPP https://learn.microsoft.com/en-us/answers/a/12363813
- F5 Canon, firmware CP1500 Windows https://asia.canon/en/support/0401137902
- F6 Microsoft Learn, estado de impresora y trabajo https://learn.microsoft.com/en-US/troubleshoot/windows/win32/printer-print-job-status
- F7 Microsoft Learn, Win32_Printer https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-printer
- F8 Canon, instructivo Webcam Utility Windows https://downloads.canon.com/webcam-utility/Canon-WebCam-Utility-Instructions-Win-Official-L.pdf
- F9 Canon USA, FAQ Webcam Utility Pro https://www.usa.canon.com/digital-cameras/eos-webcam-utility/faq
- F10 Canon Suecia, EDSDK https://www.canon.se/pro/stories/eos-digital-sdk-explained/ y Canon Oceanía https://www.canon.co.nz/apps/eos-digital-software-development-kit
- F11 Canon, T5/1200D batería y especificaciones https://hk.canon/en/support/8201999900 y https://id.canon/en/support/6200196000
- F12 Dragonframe, soporte de cámaras https://www.dragonframe.com/camera-support/
- F13 Listado de terceros del driver HiTi P510L https://treexy.com/products/driver-fusion/database/printers/hiti/p510l/

## Resultados de la prueba con papel real (2026-11-20, con el dueño, HiTi P510L + Canon EOS T5)
| Prueba | Resultado |
|---|---|
| T5 por EDSDK (script y dentro de la cabina) | Conecta en ~1,8 s, vista previa ~11 cuadros/s, foto completa 5184x3456 (~5,4 MB), disparo ~3 s en total (5,7 s el primero). Sesión de 3 fotos dentro de la cabina sin fallos. |
| Impresión silenciosa HiTi P510L (papel "6x4") | PASA: sin ventanas, 18 a 25 s por hoja (el fabricante dice 12 s), cola de Windows vacía después. Sin estirar (cuadro de 50 mm mide 50 mm, círculo redondo). Driver con nombre propio "HiTi P510L" (el de la P520L/P525L no sirve). |
| Márgenes y posición | El driver informa márgenes 0 pero la impresora corre la imagen: ~2,6 mm a la izquierda con el papel normal. Corregido con un ajuste por impresora y tipo de papel; recorte resultante ~1,5 mm a la izquierda y ~2,5 mm a la derecha, ~2 mm arriba y ~2,5 mm abajo. Las plantillas deben dejar 3 mm de margen. |
| Color | Barras de color y tonos de piel bien; verde más oscuro que en pantalla; los 2 o 3 grises más oscuros salen casi iguales; grises con leve tinte (oscuros verdosos, claros lavanda). |
| Papel agotado a propósito | El driver retiene el trabajo y muestra su aviso ("Paper box missing", error 32776). Con la versión anterior del programa (cancelaba y reintentaba) podía salir doble; corregido: el programa espera la decisión del operador. "Volver a imprimir" = una sola hoja (confirmado); "Cancelar" = ninguna hoja, `impresora-cancelada`. |
| Cinta agotada | No probada. |
| Estado que informa Windows | Con papel fuera Windows no lo marca antes de imprimir (la impresora queda "lista"); el fallo aparece al mandar el trabajo (error en ~3 s). |
| Corte en dos tiras (papel "6x4-Split") | PASA tras ajustar: la HiTi corta al medio. Ajuste de fábrica 1,5 mm; con la hoja de alineación el corte cayó justo en el 0. La SELPHY no corta. |
| Sesión completa en la cabina (T5 + HiTi) | PASA: 3 fotos, tira con la plantilla del evento, impresión automática a la primera, trabajo "hecho", contador de hojas en 1. |
Hojas gastadas: 3 de pruebas de calibración y 1 de la hoja con papel agotado, más las de corte y la sesión de la cabina. Pendiente: SELPHY, cinta agotada y las reservas listadas en `RETOMAR.md`.

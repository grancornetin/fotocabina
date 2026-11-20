# Punto de retoma: programa de escritorio (bloque 1)

> Agente: orquestador-escritorio. Iniciado 2026-11-19. Se actualiza tras cada hito.

## Decisión de arquitectura
Electron (no Tauri): Tauri necesita Rust y Visual Studio Build Tools (este PC no los tiene); Electron corre con Node y es gratis. La cámara se maneja con `koffi` (llama a la DLL de Canon sin compilar) en un proceso aparte.

## Hecho y verificado (2026-11-19)
- `src/escritorio/` completo: `main.js`, `preload.js`, `config.js`, `camara/{puente-camara,camara-canon}.js`, `impresion/{servidor.ps1,impresora-windows.js}`, `README.md`, `package.json` (+ lock). node_modules/dist/edsdk en `.gitignore`.
- Cámara T5 real dentro del programa: conecta, vista previa en vivo en la cabina, sesión de 3 fotos con foto completa (2560x2048 tras recortar), reconexión tras matar el proceso de cámara, caída a cámara web cuando la Canon está ocupada por otro proceso.
- Impresión: adaptador real en la cola (`shared/impresion-escritorio.js`, `impresion.js` con opción `proveedor` y ids `win:`), probado de punta a punta con XPS Document Writer (`--salida-prueba`): cola pasó a "hecho", contó la hoja, página 3,94x5,83 pulgadas.
- `shared/tests-validador.html`: 175/175 (7 casos nuevos).
- Documentación al día: `escritorio/README.md`, `shared/README.md`, `01-camera-flow/README.md`, MAPA (C3, C4), `ARQUITECTURA_FLUJO.md` §7.12, `DSLRBOOTH_PRODUCT_CONTEXT.md` §3.17 + Última revisión, `src/README.md`.

## Honestidad
- Antes de la instrucción del dueño se enviaron 2 trabajos de prueba a la Epson L5190 (apagada): quedaron cancelados/eliminando, no salió nada.
- NO probado: apagado automático de la cámara (no se la dejó dormir), impresión con papel real, HiTi.

## A medias
- Certificación: el Code Reviewer dio RECHAZADO con 4 graves (consulta de estado que mataba PowerShell en plena impresión y podía duplicar la hoja; tiempos agotados que cerraban el proceso nuevo; errores "desconocidos" que se reintentaban solos; arranque de PowerShell que podía colgarse) más medios (carrera conectar/desconectar de la cámara, barra invertida en nombres UNC, vista previa que no se reiniciaba). TODO CORREGIDO y reprobado (cámara, XPS de punta a punta, 175/175), pero SIN nueva revisión independiente. El lanzamiento del Evidence Collector fue denegado por el sistema de permisos y no se reintentó; el Reality Checker no se lanzó. Falta: re-revisión y certificación de evidencia por agentes independientes (las pruebas hechas hasta ahora las hizo quien construyó).
- Hallazgos del revisor NO corregidos (bajos): iniciar() tras detener() duplica el oyente del proveedor (impresion.js); un respaldo importado desde el escritorio deja `win:...` como "desconectada" en el navegador (consistente con el diseño).
- Falta: Bitácora, Tablero, RETOMAR al cierre; commit y push SOLO tras certificar.
- Por decidir: qué archivos entran al commit (solo los de la reserva; `.playwright-mcp/`, `PUNTO-DE-RETOMA-cert-3b.md` y `RETOMAR.md` de la sesión principal NO son míos salvo la sección que edito).

## Prueba con papel real (PENDIENTE, la debe pedir el dueño en el chat)
Impresora: HiTi P510L (o la que tenga a mano). Hojas: 3 (una de prueba 4x6, una con dos tiras, una con copia doble). Se mide: que salga sin diálogo, tamaño y márgenes (sin bordes blancos ni recorte), color, tiempo por hoja y qué estado informa Windows con papel o cinta agotados.

## Cómo probar a mano (para retomar)
`cd src/escritorio && npm start` (si la terminal tiene ELECTRON_RUN_AS_NODE definida, quitarla). Sin papel: `npm start -- --salida-prueba=<carpeta> --pantalla=01-camera-flow/index.html` y elegir la impresora "Microsoft XPS Document Writer".

## Siguiente paso exacto
1. Leer los informes de certificación y corregir lo que pidan.
2. Cerrar documentación (Bitácora, Tablero, RETOMAR), commit por rutas explícitas y push a main.
3. Avisar al dueño en el chat; el bloque 2 NO se inicia sin su visto bueno.

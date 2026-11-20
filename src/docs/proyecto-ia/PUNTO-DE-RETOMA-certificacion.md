# Punto de retoma: certificación independiente del Bloque 1 (escritorio)

> Agente: Agents Orchestrator (certificación). Retomado 2026-11-19. Se actualiza tras cada certificador. Nada de esto está commiteado.

## Estado (checkpoint 2)
- Code Reviewer (re-revisión): APROBADO CON RESERVAS. Los 4 graves y las 4 medias originales CORREGIDOS (verificado en código). Bajo 9 (oyente duplicado en impresion.js iniciar() tras detener()) NO corregido; bajo 10 aceptable por diseño.
  Hallazgos nuevos a corregir antes de papel real: H1 (medio) nombre de impresora con comilla simple falla en WQL (escape correcto `\'`; servidor.ps1 líneas ~78 y ~136); H2 (medio) Quitar-Trabajo traga fallos y puede dejar trabajo en el spooler -> hoja doble en reintento (servidor.ps1 ~115-118, ~213-215); H3 (bajo-medio) códigos 'envio' y 'servidor' se reintentan solos (impresion-escritorio.js ~114); H4 sufijo único en nombre de documento; H5 foto vieja en disparo (puente-camara.js ~289: llamar eventos() antes de poner fotoRecibida=null); H6 limpiar temporizador en catch de camara-canon.js:84.
- Evidence Collector: PASA lo probado (Electron abre, lista y cabina sin errores de consola; caída a webcam con mensaje correcto; sesión de 3 fotos con webcam; impresión con XPS virtual: hoja 100x150 mm, cola "hecho", 1 hoja contada; tests-validador 175/175). NO VERIFICADO: todo lo de la T5 real (estaba desconectada), papel real, HiTi, sin papel/cinta, reintentos, cancelación. Evidencia: C:\tmp\cert-escritorio\. Hallazgo menor: selector de cámara muestra "Cámara Canon (por cable)" aunque se use la webcam.
- Reality Checker: NO lanzado aún.
- Correcciones: ninguna hecha todavía por mí.

## Siguiente paso exacto
1. Corregir H1, H2, H3, H5, H6 y bajo 9 (agente Desktop App Engineer), sin imprimir en físicas.
2. Re-revisión corta (Code Reviewer) de esas correcciones + repetir XPS y 175/175.
3. Reality Checker. Veredicto máximo LISTO CON RESERVAS ("T5 real sin recertificar tras las correcciones", papel real no probado).
4. Si sin graves: commit por ruta explícita (lista abajo) y push; si no, documentar y no commitear.
5. Cerrar RETOMAR, Tablero, Bitácora.

## Archivos del Bloque 1 (únicos a commitear, por ruta explícita)
.gitignore, src/README.md, src/escritorio/ (incluye package-lock.json; node_modules NUNCA), src/pages/shared/{camara-escritorio,impresion-escritorio,impresion}.js, shared/{README.md,tests-validador.html}, 01-camera-flow/{app.js,index.html,README.md}, docs: ARQUITECTURA_FLUJO §7.12, DSLRBOOTH_PRODUCT_CONTEXT §3.17, MAPA_DE_PANTALLAS (C3/C4), BITACORA, TABLERO, RETOMAR, PUNTO-DE-RETOMA-escritorio.md, PUNTO-DE-RETOMA-certificacion.md.
NO commitear: .playwright-mcp/, PUNTO-DE-RETOMA-cert-3b.md, PUNTO-DE-RETOMA-bloque2.md, ni C:\SDK-Canon.
Reglas a pasar a cada especialista: solo impresoras virtuales; si el sistema bloquea algo, reportar y no sortear; checkpoints.

## CIERRE (checkpoint final)
H1-H6 y bajo 9 corregidos (Desktop App Engineer). Reality Checker: LISTO CON RESERVAS (reservas no graves para commit). Bloque 1 commiteado y subido a main. Quedan: prueba con papel real, T5 recertificada, y Bloque 2 cuando el dueño lo pida.

# FotoCabina — instrucciones para agentes

Las reglas completas están en [CLAUDE.md](CLAUDE.md). Leerlo entero antes de tocar el repo: orden de lectura de los documentos, qué documento se actualiza con cada tipo de cambio, checklist de cierre y reglas de trabajo en paralelo.

Resumen mínimo:

1. Todo vive en `src/`. Leer `src/PRODUCT.md`, `src/DESIGN.md`, `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` y `src/docs/MAPA_DE_PANTALLAS.md` antes de empezar.
2. Cada cambio de comportamiento va con su documentación en el mismo commit (README de la pantalla, fila del mapa, y el documento de contexto si hubo una decisión).
3. Tocar solo los archivos propios; commitear por ruta explícita; nunca `git add .`.
4. Sin emojis en la interfaz. Sistema de diseño obligatorio.

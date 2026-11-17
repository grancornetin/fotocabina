# 05 · Crear evento

Pantalla C2 del mapa de pantallas. Formulario corto para crear un evento nuevo desde `04-lista-eventos`.

## Qué hace

- **Nombre del evento** (obligatorio, con validación) y **fecha**.
- **Imprimir automáticamente al terminar la sesión** (interruptor, apagado por defecto). Al encenderlo aparece un selector de **copias automáticas por sesión** (1 a 5 hojas 4×6; cada hoja trae dos tiras). Se guardan en `entrega` (`entrega.impresionAuto` y `entrega.copias`, hojas). La cabina todavía no los lee para imprimir: se conectan al construir la impresión (`docs/ARQUITECTURA_FLUJO.md`); sí se congelan al lanzar (`configCongelada` de cada sesión). Las copias adicionales las pide solo el operador desde el resultado y cuentan para el tope de impresiones del evento.
- **Plantilla asignada**: selector con las plantillas ya guardadas en `03-editor-plantillas` (lee directo su almacén, `fotocabina-editor-v1`, sin cargar el editor completo), más la opción "Elegir después" si todavía no hay ninguna lista o el operador prefiere asignarla más tarde desde la card en la lista.
- **Modo de entrega**: Impresión / Digital / Ambos, selección única con feedback visual claro. No incluye todavía punto de retiro externo ni impresión remota (Etapa 2, H3/H4) — esas opciones no se muestran hasta que existan esas pantallas.
- **Guardar y volver son un solo paso** (mismo patrón que "Lanzar evento" en el editor, ver `docs/FLUJO_NAVEGACION.md`): "Crear evento" guarda el evento en el almacén compartido y navega directo a `04-lista-eventos`, donde aparece primero en la pestaña "Próximos". "Cancelar" y el botón "Mis eventos" del header vuelven sin guardar nada.

## Decisión de producto: el PIN es universal, no por evento

`docs/MAPA_DE_PANTALLAS.md` sugería originalmente que el PIN de operador se definiera por evento aquí. El dueño del proyecto decidió (2026-09-22) que el PIN sigue siendo **universal para todos los eventos** — no se toca en esta pantalla, sigue viviendo en Ajustes de `01-camera-flow` (C2b) como hasta ahora.

## Conectada a `04-lista-eventos` y `shared/almacen-eventos.js`

"Crear evento" en la lista ya no muestra la hoja "Próximamente": lleva aquí de verdad. El evento se arma con `AlmacenEventos.crear()` (formato v2: id estable `ev-<uuid>`, `entrega: { modo, copias, impresionAuto }`, `plantillas: { habilitadas, porDefecto }`, ritmo y cámara por defecto) y se guarda con `AlmacenEventos.guardar()`. Un evento creado con "Elegir después" queda sin plantilla: "Lanzar evento" se bloquea en la cabina hasta asignarle una.

## Pendiente

- Miniatura/imagen del evento (hoy ninguna pantalla la pide todavía; ver "Miniatura real" pendiente en el README de `04-lista-eventos`).
- Si en el futuro se agrega punto de retiro externo o impresión remota (H3/H4), sumar esas opciones aquí sin romper el formulario actual.

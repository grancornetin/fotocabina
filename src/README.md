# FotoCabina

Proyecto único de fotocabina, organizado como páginas independientes que luego se unirán en un solo flujo de producto.

## Páginas disponibles

| Carpeta | Página | Estado |
| --- | --- | --- |
| `pages/00-design-system` | Sistema de diseño: paleta, tipografía, botones, tabs, cards, inputs, iconos y estados vivos. | Referencia visual para todas las pantallas futuras. |
| `pages/01-camera-flow` | Flujo de cabina: modo operador (lanzar evento) y modo invitado (countdown, captura, revisión, resultado). | Migrado al sistema de diseño. Pendientes listados en `docs/MAPA_DE_PANTALLAS.md`. |
| `pages/02-layout-editor` | Editor de layouts (prototipo original): capas, selección múltiple, guías, alineación, espaciado y preparación para impresión. | **Descartado.** Reemplazado por `03-editor-plantillas`, aprobado para producción. Queda solo como referencia histórica, sin desarrollo nuevo. |
| `pages/03-editor-plantillas` | Editor de plantillas **definitivo**, aprobado para producción: galería de plantillas, lienzo en mm con reglas y guías inteligentes, tipografía completa con fuentes propias, datos de sesión, render a 300 ppp con vista de hoja e importar/exportar. | Fases 1–4 completas. Plan y estado en `docs/PLAN_EDITOR_PLANTILLAS.md`. |

## Reglas para trabajar en este proyecto (personas y agentes de IA)

Antes de crear o modificar cualquier pantalla, leer en este orden:

1. [PRODUCT.md](PRODUCT.md) — quién usa la app, para qué, y qué no se puede inventar (precios, planes, capacidades).
2. [DESIGN.md](DESIGN.md) — **el sistema de diseño, de cumplimiento obligatorio**: paleta exacta (negro / grafito / verde lima solo como acento funcional), tipografía, radios, elevación, componentes y las reglas "Do / Don't". Nada de emojis, nada de glassmorphism, nada de degradés multicolor, un solo verde por pantalla.
3. [pages/00-design-system/index.html](pages/00-design-system/index.html) — la implementación viva de ese sistema. Los componentes nuevos se construyen copiando estos patrones (clases `ds-*`), no inventando otros.
4. [docs/MAPA_DE_PANTALLAS.md](docs/MAPA_DE_PANTALLAS.md) — qué pantallas existen, cuáles faltan y qué quedó pendiente. Actualizarlo al terminar cada pantalla.

Convenciones:

- Cada pantalla vive en su propia carpeta `pages/NN-nombre/` con `index.html`, `styles.css` y `app.js` autocontenidos (sin dependencias externas ni CDNs).
- Antes de armar un componente nuevo, buscar si ya existe en `00-design-system` o en `01-camera-flow` (dropdown propio `ds-select`, tabs `ds-tabs`, badges de estado, botones `ds-btn--*`, miniaturas con "Repetir").
- Si varios agentes trabajan en paralelo: cada uno toca solo los archivos de su pantalla. No modificar, reescribir ni "ordenar" carpetas ajenas. `DESIGN.md` y `PRODUCT.md` se cambian solo con acuerdo explícito del dueño del proyecto.
- Nombres de archivos, módulos, clases y textos de interfaz en español.

Cada página es autocontenida y separa estructura, estilos y lógica:

```text
pages/NN-nombre/
├── index.html   # estructura de la página
├── styles.css   # estilos de la página
└── app.js       # comportamiento de la página
```

No requiere dependencias ni conexión a Internet para abrir estas páginas en un navegador. En el futuro, los componentes reutilizables irán en `shared/` y las páginas se enlazarán desde un flujo UI/UX común, sin perder su independencia.

## Documento de continuidad

La visión de producto, el estudio de DSLRBooth/LumaBooth, las decisiones de impresión/corte, la arquitectura propuesta y el roadmap están en [docs/DSLRBOOTH_PRODUCT_CONTEXT.md](docs/DSLRBOOTH_PRODUCT_CONTEXT.md).

## Trabajo futuro

1. Integrar las páginas en el flujo de cabina.
2. Conectar cámara, impresión y entrega digital mediante una aplicación de escritorio offline.
3. Mantener cada nueva pantalla en su propia carpeta `pages/NN-nombre` y versionar cada cambio en este repositorio.

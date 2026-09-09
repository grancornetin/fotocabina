# FotoCabina

Proyecto único de fotocabina, organizado como páginas independientes que luego se unirán en un solo flujo de producto.

## Páginas disponibles

| Carpeta | Página | Estado |
| --- | --- | --- |
| `pages/01-camera-flow` | MVP de captura: flujo de sesión de 3 fotos y salida de dos tiras 2 × 6. | Recuperado del primer MVP. |
| `pages/02-layout-editor` | Editor de layouts: capas, selección múltiple, guías, alineación, espaciado y preparación para impresión. | En evolución. |

Cada página es autocontenida y separa estructura, estilos y lógica:

```text
pages/NN-nombre/
├── index.html   # estructura de la página
├── styles.css   # estilos de la página
└── app.js       # comportamiento de la página
```

No requiere dependencias ni conexión a Internet para abrir estas páginas en un navegador. En el futuro, los componentes reutilizables irán en `shared/` y las páginas se enlazarán desde un flujo UI/UX común, sin perder su independencia.

## Trabajo futuro

1. Integrar las páginas en el flujo de cabina.
2. Conectar cámara, impresión y entrega digital mediante una aplicación de escritorio offline.
3. Mantener cada nueva pantalla en su propia carpeta `pages/NN-nombre` y versionar cada cambio en este repositorio.

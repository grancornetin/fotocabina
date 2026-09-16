<!-- Sistema de diseño aprobado por el dueño del proyecto (2026-09-15) y de cumplimiento obligatorio para toda pantalla nueva. Implementación de referencia: pages/00-design-system/index.html (tokens en su styles.css). Ejemplo aplicado a un flujo real: pages/01-camera-flow. -->

---
name: FotoCabina
description: Fotocabina profesional para eventos — precisión de iPhone, actitud de Nike.
---

# Design System: FotoCabina

## Overview

**Creative North Star: "El Vestuario de Alto Rendimiento"**

FotoCabina no es una herramienta de oficina ni un juguete de fiesta: es equipo profesional que se usa bajo presión, en vivo, frente a gente. El modelo mental es el vestuario de un atleta de elite antes de salir a la cancha — cada superficie es negro mate y grafito cepillado, silenciosa y segura, hasta que algo se activa: entonces aparece un solo verde lima eléctrico, nítido, inconfundible, indicando "esto está vivo, esto está listo, tocá acá". Es la misma disciplina visual que un unibody de aluminio de iPhone (precisión, superficies limpias, tipografía que respira) cruzada con la seguridad gráfica de una app de Nike (números grandes, trazo grueso, una sola señal de color que nunca se diluye).

La app tiene dos registros de uso muy distintos y el sistema debe sostener ambos sin partirse en dos identidades: el invitado (tótem táctil, 90 segundos, cero curva de aprendizaje, condiciones de poca luz) necesita pantallas grandes, casi sin texto, con un solo gesto obvio por momento; el operador (panel, editor de plantillas) necesita densidad de información controlada, estados de error legibles a la distancia, y una sensación de "torre de control", no de formulario administrativo.

Rechazos confirmados: nada de gris carbón genérico de mockup de IA, nada de vidrio esmerilado (glassmorphism) decorativo sin función, nada de degradé multicolor, nada de iconografía tipo Font Awesome fina y genérica. El verde lima nunca es decorativo — si un elemento no es la acción principal o un dato en vivo, no lleva verde lima.

**Key Characteristics:**
- Negro casi puro como base, nunca gris medio como fondo principal.
- Un solo acento vivo (verde lima eléctrico), reservado para acción primaria y datos en tiempo real.
- Superficies con textura sutil de material (grano fino tipo aluminio cepillado / carbono), nunca completamente planas ni completamente "glass".
- Tipografía con números grandes y tabulares para countdown, timers y contadores — los números son un componente, no solo texto.
- Iconografía lineal de trazo grueso (2–2.5px a escala de 24px), geométrica, sin relleno salvo el estado activo.
- Bordes redondeados generosos pero consistentes (nunca mezclar radios distintos sin motivo semántico).

## Colors

Paleta restringida y funcional: negro/blanco y gris grafito/perla construyen el 90%+ de cada pantalla; el verde lima aparece solo donde hay algo que hacer o algo que está pasando ahora. El sistema soporta **modo oscuro y modo claro en toda la app**, incluida la cabina del invitado — pero dark es el modo de referencia (donde nace cada componente) porque el uso real más exigente (tótem en un evento nocturno) ocurre ahí; light se deriva de él manteniendo los mismos roles.

### Primary
- **Lima Voltaje** (`#C6FF3D` en dark, `#7ED321` en light): la única acción primaria posible en cualquier pantalla — el botón de disparo, "Confirmar", el estado "impresora lista", el contador de countdown en su último segundo. Nunca se usa en más de un elemento protagonista por vista. En dark es el único color que puede glow (resplandor sutil) porque señala algo vivo; en light el glow se retira (no funciona sobre fondo claro) y el rol de "vivo" lo lleva el propio contraste de color más un borde sólido.

### Neutral — Modo oscuro (por defecto)
- **Negro Vestuario** (`#0A0A0B`): fondo base. No es `#000000` puro (evita el efecto pantalla-apagada en OLED) pero se lee como negro real.
- **Grafito Superficie** (`#18191B`): superficie elevada primaria — cards, paneles, barras.
- **Grafito Superficie Alta** (`#222325`): segundo nivel de elevación — modales, tabs activos.
- **Acero Borde** (`#2E3033`): bordes y divisores sutiles.
- **Niebla** (`#8A8D91`): texto secundario, iconos inactivos, placeholders.
- **Blanco Hueso** (`#F4F5F2`): texto primario. No blanco puro — reduce el contraste agresivo a poca distancia.

### Neutral — Modo claro
- **Blanco Vestuario** (`#F7F7F5`): fondo base. No blanco puro — mantiene la sensación de material físico, no de pantalla vacía.
- **Perla Superficie** (`#FFFFFF`): superficie elevada primaria — cards, paneles, barras, con borde para separarse del fondo.
- **Perla Superficie Alta** (`#F0F1ED`): segundo nivel de elevación.
- **Niebla Borde** (`#DCDEDA`): bordes y divisores sutiles.
- **Grafito Texto Secundario** (`#6B6E72`): texto secundario, iconos inactivos, placeholders (mismo rol que Niebla en dark, tonalidad invertida).
- **Negro Vestuario** (`#111214`): texto primario en modo claro. Reusa un tono casi idéntico al fondo base de dark, cerrando el círculo entre ambos modos.

### Estados (mismos en ambos modos, ajustan solo su fondo tenue)
- **Rojo Señal** (`#FF4D4D` dark / `#D93636` light): único color de error/alerta, reservado exclusivamente a fallos reales (cámara desconectada, impresora sin papel). No se usa para nada decorativo ni de advertencia leve.
- **Ámbar Espera** (`#FFB13D` dark / `#C97F12` light): estados de advertencia/carga que no son error (reconectando, cola de impresión, procesando).

### Named Rules
**La Regla del Único Verde.** El verde lima aparece en un solo elemento protagonista por pantalla. Si dos cosas compiten por verde lima, una de las dos está mal jerarquizada, no se resuelve poniendo verde a ambas.

**La Regla del Rol Espejado.** Cada color de un modo tiene un rol idéntico en el otro (fondo, superficie, superficie alta, borde, texto secundario, texto primario, acento). Nunca se agrega un token nuevo solo para un modo — si algo necesita existir en light, primero se le busca su equivalente en dark y viceversa.

## Typography

**Display / Body Font:** "SF Pro Display", -apple-system, "Inter", "Segoe UI", sans-serif (pila del sistema con Inter como respaldo web fiel — SF Pro no se puede licenciar para web, así que en producción web esto renderiza como Inter, que comparte proporciones y densidad).
**Tabular/Numérico:** misma familia, con `font-variant-numeric: tabular-nums` obligatorio en cualquier número que cambie en vivo (countdown, contadores, timers), para que no "tiemble" el ancho al cambiar de dígito.

**Character:** Geométrica, neutra, de altísima legibilidad a distancia — la misma familia de sensación que la interfaz de un iPhone o una app de entrenamiento Nike. Los números son el elemento con más personalidad del sistema: grandes, gruesos, tabulares.

### Hierarchy
- **Display** (800, `clamp(3.5rem, 12vw, 8rem)`, line-height 0.95): números de countdown y hero numérico del tótem. Siempre en Blanco Hueso o Lima Voltaje según estado.
- **Headline** (700, `clamp(1.75rem, 4vw, 2.5rem)`, line-height 1.1): títulos de pantalla ("Sonreí", "¡Listo!", nombre del evento).
- **Title** (600, 1.25rem, line-height 1.3): encabezados de sección y cards.
- **Body** (450, 1rem, line-height 1.5): texto de interfaz general, descripciones, ayuda.
- **Label** (600, 0.75rem, letter-spacing 0.08em, mayúsculas): etiquetas de estado, tabs, badges, metadatos de operador.

### Named Rules
**La Regla del Número Grande.** Cualquier valor que el usuario deba leer en menos de un segundo (countdown, cantidad de copias, tiempo restante) se muestra en Display o al menos Headline — nunca en Body. Un número crítico en tamaño de texto normal es un error de jerarquía.

## Layout

Grid base de 8px para todo el espaciado (múltiplos de 8: 8, 16, 24, 32, 48, 64, 96). Contenedor de operador con densidad media (16–24px de padding interno en cards); contenedor de invitado/tótem con densidad muy baja (48px+ de aire alrededor de cada elemento interactivo, objetivos táctiles de mínimo 64px).

Dos comportamientos responsivos distintos por rol, no uno solo:
- **Superficie del invitado (tótem):** diseño vertical fijo pensado para pantalla alta y angosta (proporción tipo 9:16 o más alta), un solo foco de atención por pantalla, navegación mínima o inexistente (el flujo avanza solo).
- **Superficie del operador:** grid responsivo estándar, con panel lateral de navegación en desktop que colapsa a tabs inferiores en mobile/tablet.

## Elevation & Depth

Sistema de capas tonales, no de sombras dramáticas. La profundidad se transmite subiendo un escalón de superficie (Negro Vestuario → Grafito Superficie → Grafito Superficie Alta) más un borde sutil de 1px en Acero Borde, no con `box-shadow` pesado. La única sombra real del sistema es un resplandor (glow) de color, reservado al elemento en Lima Voltaje activo — nunca sombra de drop-shadow negra decorativa.

### Shadow Vocabulary
- **glow-accent** (`box-shadow: 0 0 24px rgba(198,255,61,0.35)`): halo sutil detrás de un botón/elemento primario en estado activo o "listo". Se anima con pulso lento (ver Componentes).
- **elevation-modal** (`box-shadow: 0 16px 48px rgba(0,0,0,0.5)`): única sombra neutra del sistema, exclusiva de modales/overlays flotantes sobre el resto de la interfaz.

### Named Rules
**La Regla de la Capa, no la Sombra.** Para indicar jerarquía entre superficies normales, subí un nivel de gris — no agregues una sombra negra. Las sombras negras están reservadas a elementos que literalmente flotan sobre todo lo demás (modales).

## Shapes

Radios generosos pero disciplinados, en tres pasos: 12px (controles pequeños: chips, inputs, iconos contenedores), 20px (cards, botones grandes, tabs), 28px (paneles y modales grandes). Nunca esquinas vivas (0px) salvo en divisores y líneas. Los bordes usan 1px sólido en Acero Borde, nunca degradé ni doble borde.

## Components

Todo componente nace en Grafito Superficie sobre Negro Vestuario, con el trazo grueso y la actitud "equipo deportivo profesional" descrita en Overview — tactile, seguro, sin fragilidad visual.

### Buttons
- **Shape:** 20px de radio, altura mínima 56px (48px en variantes compactas de operador).
- **Primary:** fondo Lima Voltaje, texto Negro Vestuario (900 weight), con `glow-accent` en reposo si representa la acción principal de la pantalla. Al presionar, escala a 0.97 y el glow se intensifica brevemente.
- **Secondary:** fondo Grafito Superficie Alta, texto Blanco Hueso, borde 1px Acero Borde. Sin glow.
- **Ghost:** sin fondo, texto Blanco Hueso o Niebla, subrayado de foco en Lima Voltaje solo al enfocar con teclado.
- **Destructive:** fondo transparente, texto y borde Rojo Señal; confirma con un segundo toque cuando la acción es irreversible.

### Chips / Tabs
- **Style:** cápsula de 20px de radio; tab inactivo en Grafito Superficie con texto Niebla; tab activo en Grafito Superficie Alta con texto Blanco Hueso y un indicador de línea inferior de 3px en Lima Voltaje.
- **State:** transición de 200ms en color de fondo y del indicador al cambiar de tab; nunca salto instantáneo.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** Grafito Superficie; Grafito Superficie Alta cuando la card está seleccionada o es interactiva en hover.
- **Shadow Strategy:** ninguna por defecto (ver Elevation & Depth); solo `glow-accent` si la card representa un estado "activo/en vivo" (ej. sesión en curso).
- **Border:** 1px Acero Borde, se vuelve 1px Lima Voltaje al seleccionar.
- **Internal Padding:** 24px (16px en densidad compacta de operador).

### Inputs / Fields
- **Style:** fondo Negro Vestuario (un paso más oscuro que la card que lo contiene), borde 1px Acero Borde, radio 12px, texto Blanco Hueso, placeholder en Niebla.
- **Focus:** borde pasa a 1px Lima Voltaje + halo sutil `0 0 0 3px rgba(198,255,61,0.15)`. Nunca el navegador default azul.
- **Error / Disabled:** error usa borde Rojo Señal + texto de ayuda en Rojo Señal debajo; disabled reduce opacidad general a 40% y quita el cursor de edición.

### Navigation
- **Operador (desktop):** panel lateral fijo en Grafito Superficie, ítem activo con fondo Grafito Superficie Alta + barra vertical de 3px en Lima Voltaje a la izquierda del ítem. Iconos de trazo grueso, texto Label.
- **Operador (mobile/tablet):** colapsa a barra de tabs inferior, mismos estados.
- **Invitado (tótem):** sin navegación persistente — el flujo es lineal y cada pantalla tiene como máximo una acción explícita, sin menú.

### Iconografía (componente de firma)
Trazo lineal grueso (2–2.5px a 24px de base), esquinas ligeramente redondeadas, sin relleno en estado inactivo; en estado activo/seleccionado, el ícono pasa a relleno sólido en Lima Voltaje o Blanco Hueso según contexto. Construidos a mano en SVG propio del sistema — no librerías genéricas de terceros — para mantener el peso de trazo y el lenguaje geométrico consistente con la tipografía. **Nunca emojis**, en ningún lugar de la interfaz (ni como ícono, ni como decoración, ni en copy): rompen el trazo monocromático y la sobriedad "vestuario profesional" que define todo el sistema.

## Do's and Don'ts

### Do:
- **Do** usar Lima Voltaje en un único elemento protagonista por pantalla (botón primario, dato en vivo, o indicador de estado "listo").
- **Do** subir un escalón de superficie (Negro Vestuario → Grafito Superficie → Grafito Superficie Alta) para indicar jerarquía, en vez de agregar sombra negra.
- **Do** usar números tabulares grandes para cualquier valor que cambie en tiempo real.
- **Do** mantener objetivos táctiles de al menos 64px en la superficie del invitado (tótem), considerando uso con poca luz y posible distracción.
- **Do** dibujar los iconos propios en SVG con trazo grueso consistente; no mezclar con librerías de iconos de estilo distinto.

### Don't:
- **Don't** usar gris medio o carbón como fondo principal — el fondo base siempre es Negro Vestuario (dark) o Blanco Vestuario (light), nunca un gris a mitad de camino.
- **Don't** aplicar glassmorphism, blur decorativo o degradé multicolor en ningún componente.
- **Don't** usar Lima Voltaje de forma decorativa (fondos grandes, ilustraciones, texto largo) — es una señal funcional, no un color de marca para rellenar espacio.
- **Don't** mezclar radios de esquina fuera de la escala de 12/20/28px sin justificación semántica nueva documentada acá.
- **Don't** usar sombras negras (`box-shadow` neutro) en componentes de superficie normal — reservadas exclusivamente a modales/overlays flotantes.
- **Don't** aplicar el glow de Lima Voltaje en modo claro — es un efecto exclusivo de dark (no se lee sobre fondo blanco); en light el estado "vivo" se marca con borde sólido de 2px en Lima Voltaje en vez de resplandor.
- **Don't** elegir el modo por categoría de pantalla ("el tótem siempre dark", "el panel siempre light") — el modo lo elige el usuario o el sistema operativo; cada pantalla debe funcionar bien en ambos.
- **Don't** usar emojis en ningún lugar de la interfaz. Todo ícono se dibuja en SVG propio, trazo grueso, monocromático — un emoji rompe esa disciplina y se lee poco profesional para el producto.

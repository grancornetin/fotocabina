# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

FotoCabina se distribuye en varias plataformas con roles distintos: aplicación de escritorio Windows (cabina profesional con DSLR/mirrorless), iPad conectado por USB a una DSLR (cabina profesional portátil), app mobile liviana (cámara propia del dispositivo), app mobile de control remoto, y app mobile/web complementaria (gestión de eventos y galería). El diseño debe sostener una identidad visual coherente entre plataformas, adaptando cada shell a las convenciones nativas de touch/desktop donde corresponda.

## Users

Dos roles con necesidades muy distintas:

1. **Invitado del evento** (usuario final de la cabina): persona en una fiesta/evento corporativo o social, sin conocimiento previo del producto, que se acerca a una cabina física tipo tótem/kiosco vertical, interactúa unos 60-120 segundos, y espera un resultado divertido, rápido y de calidad profesional (foto impresa y/o entrega digital). Cero curva de aprendizaje: debe entenderse sin instrucciones.
2. **Operador/cliente del negocio** (dueño u operador de la cabina): hoy es el propio fundador (Nico) usándola en sus eventos privados; en la Etapa 2 del negocio será un fotógrafo o empresa de eventos que paga una suscripción. Configura el evento, arma o elige plantillas de diseño, gestiona la impresora y la sesión, monitorea el estado durante el evento y resuelve errores sin frenar la fila de invitados.

## Product Purpose

FotoCabina es una aplicación de fotocabina profesional para eventos que reemplaza el software de cabina fotográfica tradicional (categoría de referencia: DSLRBooth/LumaBooth). Cubre el flujo completo: captura (DSLR o cámara del dispositivo), composición sobre una plantilla de diseño, impresión física confiable y entrega digital, operando sin depender de Internet durante el evento en sí. Éxito = un invitado completa una sesión y se retira con su foto (impresa y/o digital) sin fricción visible, y el operador puede correr un evento de varias horas sin intervención manual constante.

## Positioning

A diferencia del software de cabina fotográfica tradicional (instalado, con licencia perpetua, orientado solo a desktop), FotoCabina nace multi-plataforma desde el diseño: el mismo motor de plantillas y composición corre en desktop, iPad con DSLR y mobile liviano, bajo un modelo de suscripción. El editor de plantillas apunta a una precisión y fluidez de nivel Canva (capas, alineación, guías inteligentes de espaciado), no a un formulario de campos fijos como ofrece la competencia.

## Operating Context

- **Evento en vivo, offline-first:** la sesión de captura → composición → impresión debe funcionar sin Internet. La validación de licencia/cuenta es periódica, nunca bloquea una sesión en curso.
- **Cabina física del invitado:** pantalla táctil vertical tipo tótem/kiosco — formato alto y angosto, uso de pie, a veces en ambientes con poca luz (fiestas nocturnas) o con el invitado sosteniendo una copa en una mano. Los objetivos táctiles deben ser grandes y tolerantes a error.
- **Panel del operador:** puede usarse sentado (configuración previa al evento) o de pie/apurado (durante el evento, resolviendo un error de impresora con una fila de gente esperando). Debe priorizar claridad y velocidad de lectura de estado por sobre densidad de información.
- **Editor de plantillas:** sesión de trabajo tranquila, previa al evento, en desktop — comparable en interacción a un editor de diseño tipo Canva (selección múltiple, capas, guías).

## Capabilities and Constraints

- Sesión de captura de N fotos (hoy 3) compuesta en una plantilla de salida física — configuración inicial 2×6 duplicado en hoja 4×6, pero el tamaño/cantidad de fotos por plantilla es libre, no hardcodeado.
- Impresión vía driver del sistema (fase actual) con evolución a perfiles de impresora dedicados (DNP/HiTi) y posible SDK/USB directo.
- Entrega digital por canal local (red propia de la cabina, QR/URL temporal), sin depender del Wi-Fi del recinto.
- Editor de plantillas con capas (foto, imagen/logo, texto, forma, guía), selección múltiple, alineación y guías de espaciado inteligente.
- Licencias por plataforma: cada shell con acceso a hardware (desktop, iPad+DSLR, mobile liviana) tiene su propio pago/licencia en su tienda/canal; una cuenta de usuario (Firebase, compartiendo infraestructura con el proyecto hermano Luz Ai Studio) une los datos entre plataformas.
- Modelo de planes/precios de suscripción: **todavía no definido** — se decidirá con uso real, no debe asumirse en el diseño de UI (evitar hardcodear gating de features específico).

## Brand Commitments

- Nombre del producto: **FotoCabina**.
- Paleta de marca ya decidida y no negociable: **negro, gris y verde lima casi neón como color de acento**. No se reemplaza por otra paleta en este trabajo de diseño.
- Referencia estética explícita: nivel de pulido y sobriedad de **iPhone/Apple** combinado con la actitud gráfica y de marca de **Nike** — confianza, movimiento, precisión, sin caer en lo corporativo genérico.
- Documento de continuidad de producto y arquitectura: `docs/DSLRBOOTH_PRODUCT_CONTEXT.md` (roadmap de fases, modelo comercial, entidades de datos) — visual y de negocio, se debe mantener coherente con ese documento pero sin duplicarlo acá.

## Evidence on Hand

- Prototipo funcional existente: `pages/01-camera-flow` (flujo de captura MVP) y `pages/02-layout-editor` (editor de plantillas, el más maduro).
- Moodboard de referencia visual aportado por el usuario en `ui inspo/` (paneles minimalistas oscuros con mucho aire, tarjetas con acento vibrante único, jerarquía tipográfica clara con grid de 8px, iconografía lineal simple, componentes con estados default/hover/pressed bien diferenciados).
- No hay pantallas finales, tests de usuario ni datos de eventos reales todavía: la app aún no se usó en un evento en producción.

## Product Principles

1. **Offline primero, negocio después.** Ninguna decisión de UI puede depender de que haya Internet durante un evento en curso.
2. **Invitado sin curva de aprendizaje, operador con control total.** Son dos audiencias con densidades de información opuestas; nunca diseñar una sola pantalla para ambas.
3. **El motor de diseño (plantillas) es el corazón del producto**, no un accesorio del flujo de captura — su calidad de interacción debe estar a la altura de un editor profesional.
4. **Coherencia entre plataformas sin copiar-pegar layouts.** Mismo lenguaje visual y tokens, pero cada shell (desktop, tótem táctil, mobile) respeta su propio contexto de uso.
5. **Confiabilidad se ve.** Estados de error, carga y reintento (cámara, impresora, cola) deben ser tan cuidados visualmente como el flujo feliz, porque un evento en vivo no permite pantallas de error crudas.

## Accessibility & Inclusion

- Pantalla de invitado: debe funcionar para personas sin conocimiento técnico del producto, en condiciones de poca luz o distracción (evento social), con objetivos táctiles grandes.
- Sin requisito de accesibilidad formal (WCAG específico) confirmado aún por el usuario — queda abierto para una futura revisión, no se debe asumir un estándar sin confirmarlo.

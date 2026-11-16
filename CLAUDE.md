# FotoCabina — reglas para cualquier agente de IA que trabaje en este repo

Todo el proyecto vive en `src/`. Nada se crea fuera de esa carpeta salvo este archivo, `AGENTS.md`, `RETOMAR.md` (cambio de turno entre cuentas, lo buscan los hooks) y `.claude/agents/` (equipo de agentes). El espacio de trabajo con agentes (Bitácora, Tablero, Ideas, Equipo) vive en `src/docs/proyecto-ia/`.

## 1. Leer antes de tocar código, en este orden

1. `src/PRODUCT.md` — quién usa la app, para qué, qué no se puede inventar.
2. `src/DESIGN.md` — sistema de diseño **obligatorio**. Referencia viva: `src/pages/00-design-system/index.html`.
3. `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` — decisiones de producto, hardware y arquitectura, y el plan por fases. Su encabezado dice qué documento manda sobre qué.
4. `src/docs/MAPA_DE_PANTALLAS.md` — inventario de pantallas y estado de cada una.
5. `src/docs/ARQUITECTURA_FLUJO.md` — documento maestro del flujo: usuarios, qué define a un evento y cómo cada ajuste afecta al resto, contrato de datos, funciones por pantalla y orden de construcción. **Leerlo antes de construir o conectar cualquier pantalla.**
6. `src/docs/FLUJO_NAVEGACION.md` — cómo se conectan las pantallas entre sí (de dónde vienen, hacia dónde van, qué pasa al volver). **Leerlo siempre que una pantalla vaya a abrir o ser abierta por otra** — no se construye ni se conecta una pantalla nueva sin decidir antes su fila en este documento.
7. El `README.md` de la pantalla que vas a tocar (`src/pages/NN-nombre/README.md`).

## 2. Qué documento se actualiza, y cuándo

| Si pasó esto… | …actualizá esto, en el mismo commit |
| --- | --- |
| Cambiaste cómo funciona una pantalla | `src/pages/NN-nombre/README.md` |
| Una pantalla pasó de "falta" a "en curso" o "hecha", o apareció una pendiente | `src/docs/MAPA_DE_PANTALLAS.md` (la fila de esa pantalla) |
| Una pantalla nueva abre o es abierta por otra (navegación entre pantallas) | `src/docs/FLUJO_NAVEGACION.md` (fila de esa conexión: de dónde viene, hacia dónde va, qué pasa al volver) |
| Se tomó una decisión de producto, hardware o arquitectura, o cambió el rumbo de una fase | `src/docs/DSLRBOOTH_PRODUCT_CONTEXT.md` (sección que corresponda + "Última revisión") |
| Agregaste una pantalla nueva | fila en `src/README.md` y en el mapa |
| Cambio al sistema de diseño o al producto | **Solo con acuerdo explícito del dueño del proyecto.** No se toca `DESIGN.md` ni `PRODUCT.md` por iniciativa propia. |

Un commit que cambia comportamiento y no trae su documentación está incompleto. No dejes "después lo documento".

## 3. Checklist de cierre de cada tarea

Antes de dar una tarea por terminada:

- [ ] Se probó en el navegador (captura o prueba real), sin errores en consola.
- [ ] Sin emojis en la interfaz; solo íconos monocromáticos SVG. Un solo botón verde lima por pantalla.
- [ ] README de la pantalla al día.
- [ ] Fila del mapa de pantallas al día.
- [ ] Si hubo decisión de producto: anotada en `DSLRBOOTH_PRODUCT_CONTEXT.md`.
- [ ] Commit solo con los archivos que tocó **esta** tarea, mensaje en español, y push a `main`.

## 4. Trabajo en paralelo con otros agentes

- Cada agente toca **solo** los archivos de su pantalla y las filas/secciones de documentación que le corresponden. No modificar, reordenar ni "limpiar" carpetas ajenas.
- Si ves cambios sin commitear que no son tuyos, no los toques ni los comentes: son de otro agente en curso. Commiteá únicamente tus archivos, por ruta explícita (`git add ruta/…`), nunca `git add .` ni `git add -A`.
- Los documentos compartidos (`MAPA_DE_PANTALLAS.md`, `src/README.md`, `DSLRBOOTH_PRODUCT_CONTEXT.md`) se editan en la sección propia y se commitean solo si no arrastran cambios ajenos; si los arrastran, avisale al dueño del proyecto en el mensaje de cierre.

## 5. Convenciones técnicas

- Páginas estáticas: `index.html` + `styles.css` + `app.js` por carpeta, sin dependencias ni CDNs.
- Antes de crear un componente, buscarlo en `00-design-system` o `01-camera-flow` (clases `ds-*`).
- Textos de interfaz, nombres de archivos, clases y commits en español.
- Páginas de prueba, capturas y servidores locales viven fuera del repo (carpeta temporal); nunca se commitean.
- Carpetas de referencia local (`pantallas dslrbooth/`, `ui inspo/`) y el archivo de memoria personal están en `.gitignore`: el repo es público.

<!-- NAVAJA-IA:INICIO (bloque administrado por la skill nuevo-proyecto; edítalo ahí o con cuidado) -->
## Espacio de trabajo con agentes — instrucción permanente

El dueño no es programador y solo lee el chat: lo que requiera su decisión se le presenta en el chat, en lenguaje simple, con la recomendación primero. Trabaja con varias sesiones en paralelo y con dos cuentas de Claude, así que **el estado vive en archivos**:

| Archivo | Para qué |
|---|---|
| `RETOMAR.md` (raíz) | Cambio de turno entre cuentas: dónde quedó todo y qué sigue |
| `src/docs/proyecto-ia/TABLERO.md` | Quién hace qué, reservas de archivos, hallazgos entre agentes |
| `src/docs/proyecto-ia/BITACORA.md` | Historia: qué cambió, por qué, quién, dónde verlo |
| `src/docs/proyecto-ia/IDEAS.md` | Ideas sueltas del dueño y su enriquecimiento |
| `src/docs/proyecto-ia/EQUIPO.md` | Agentes contratados y por qué |
| `src/docs/proyecto-ia/TIEMPO.md` | Horas por tarea (solo local) |
| `src/docs/proyecto-ia/MEMORIA-PROYECTO.md` + `~/.claude/perfil-del-dueno.md` | Cómo trabajar con el dueño (solo local) |
| `cerebro-fotocabina/` | Wiki Obsidian: lo que debe perdurar (ver `cerebro-fotocabina/CLAUDE.md`). **Siempre en `.gitignore`: nunca va a git** |
| `PRODUCT.md`, `DESIGN.md` | Producto y sistema de diseño: toda pantalla se construye contra `DESIGN.md` |

**Al empezar una sesión:** leer `RETOMAR.md`, `src/docs/proyecto-ia/TABLERO.md` y `cerebro-fotocabina/index.md`; registrarse en el Tablero; contar al dueño en 5 líneas dónde quedó el trabajo antes de hacer nada.
**Al empezar una tarea:** reservar sus archivos en el Tablero, ponerla "en curso" en `RETOMAR.md` y anotar inicio en `TIEMPO.md`.
**Al cerrar cada hito:** entrada en Bitácora, Tablero y `RETOMAR.md` al día; si algo perdura, al cerebro. Cada archivo trae sus propias instrucciones al inicio: léelas.
**Agentes:** el trabajo con agentes lo dirige siempre el **Agents Orchestrator** (`.claude/agents/agents-orchestrator.md`): él busca al agente indicado en el repo agency-agents (`C:/Users/Nico Trabajo/Downloads/agency-agents-main/`) y envía a trabajar a los demás con las reglas de este espacio. Ante una tarea que necesita especialistas, lánzalo a él con el objetivo, los archivos que NO se deben tocar y la cláusula de checkpoints; no elijas agentes sueltos.
**Hallazgos fuera de tu alcance:** no los arregles; anótalos en el Tablero mencionando al agente responsable (`@nombre`). **Ideas fuera de alcance:** a `IDEAS.md`.
**Commits:** `git add` solo por nombre y solo lo de tu reserva (nunca `git add .` ni `-A`); el commit termina con `# agente: <tu nombre>`. En este repo el commit y push a `main` ocurren al cerrar una tarea terminada y verificada (sección 3); nunca se hacen "para guardar" por límite de uso.
**Uso del plan:** ≥ 70 % trabajar por checkpoints; ≥ 90 % no iniciar tareas grandes y preparar el cambio de cuenta (pausar agentes, checkpoint, actualizar su sección del Tablero, Bitácora y `RETOMAR.md`).
**Nunca subir a GitHub:** `cerebro-fotocabina/`, `TIEMPO.md`, `MEMORIA-PROYECTO.md`, claves, datos personales ni detalle explotable de fallas.
**Mejora continua:** cuando una regla falle (se pisaron, se olvidó algo), corrígela en el archivo correspondiente y anótalo en "Lecciones del equipo" del Tablero.
<!-- NAVAJA-IA:FIN -->

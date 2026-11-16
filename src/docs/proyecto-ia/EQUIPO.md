# Equipo de agentes de FotoCabina

> **Qué es:** el registro de los agentes "contratados" para este proyecto, por qué y en qué fase. Fuente de agentes: `C:/Users/Nico Trabajo/Downloads/agency-agents-main/` y `~/.claude/agents/`.
> **Quién lo mantiene:** el orquestador, con aprobación del dueño.

## Cómo se arma
1. Pensar el proyecto del día 0 a la mantención y proponer al dueño, en el chat, un equipo corto por fases (recomendación primero).
2. Con su aprobación, copiar **solo los elegidos** a `.claude/agents/` del proyecto y anotarlos aquí.
3. Al cambiar de fase, revisar: ¿quién entra, quién se retira, quién ya no hace falta?
4. Los nombres del Tablero (`frontend`, `seguridad`…) deben corresponder a filas de esta tabla.

## Regla fija
El **Agents Orchestrator** dirige siempre: busca en agency-agents al agente indicado para cada trabajo y envía a trabajar a los demás con las reglas del Tablero. La sesión principal lo lanza a él, no elige agentes sueltos.

## Equipo
| Fase | Agente (archivo) | Para qué | Estado | Motivo de contratarlo |
|---|---|---|---|---|
| siempre | Agents Orchestrator (`agents-orchestrator.md`) | Dirige al equipo, elige y envía agentes, consolida Tablero, Bitácora y RETOMAR | fijo | Regla del dueño |
| 1 Arquitectura | Product Manager (`product-manager.md`) | Qué debe poder hacer cada tipo de usuario; alcance por etapa | activo | El producto es un solo flujo, no pantallas sueltas |
| 1 Arquitectura | Workflow Architect (`specialized-workflow-architect.md`) | Mapa completo de caminos, ramas, fallas y "qué pasa si" entre pantallas | activo | Cada decisión del evento abre o cierra otras |
| 1 Arquitectura | Software Architect (`engineering-software-architect.md`) | Modelo de datos del evento y cómo ajustes y configuración se propagan | activo | Evitar rehacer la base después |
| 1 Arquitectura | UX Architect (`design-ux-architect.md`) | Esqueleto de navegación, jerarquía y funciones por pantalla | activo | Piensa el conjunto antes de construir |
| 1 Arquitectura | UX Researcher (`design-ux-researcher.md`) | Recorridos de invitado y operador; qué falla en un evento real | activo | Decisiones con base, no a ojo |
| 2 Diseño | UI Designer (`design-ui-designer.md`) | Componentes y pantallas contra `DESIGN.md` | activo | Consistencia visual |
| 2 Diseño | Brand Guardian (`design-brand-guardian.md`) | Identidad coherente entre plataformas | activo | Producto multiplataforma |
| 2 Diseño | Behavioral Nudge Engine (`product-behavioral-nudge-engine.md`) | Ritmo de la fila, mensajes y motivación del invitado | activo | Palanca de negocio del interstitial |
| 2 Diseño | Accessibility Auditor (`testing-accessibility-auditor.md`) | Objetivos táctiles, contraste, poca luz | activo | Tótem táctil en fiestas |
| 3 Construcción | Frontend Developer (`engineering-frontend-developer.md`) | Construye las pantallas | activo | HTML/CSS/JS sin dependencias |
| 3 Construcción | Technical Writer (`engineering-technical-writer.md`) | README por pantalla, mapa y flujo al día | activo | Regla de documentación del repo |
| 3 Construcción | Sprint Prioritizer (`product-sprint-prioritizer.md`) | Orden de construcción según dependencias | activo | Evitar construir antes de decidir |
| 4 Calidad | UI Finish-Gate Reviewer (`design-ui-finish-gate-reviewer.md`) | Compuerta de cierre de cada pantalla | activo | UI genérica no sale |
| 4 Calidad | Reality Checker (`testing-reality-checker.md`) | Frena aprobaciones sin evidencia; "listo" solo con prueba | activo | Pedido del dueño |
| 4 Calidad | Evidence Collector (`testing-evidence-collector.md`) | Capturas y consola reales | activo | Checklist de cierre |
| 4 Calidad | Test Automation Engineer (`testing-test-automation-engineer.md`) | Pruebas de flujo completo evento a sesión | activo | Que lo conectado no se rompa |
| 4 Calidad | Code Reviewer (`engineering-code-reviewer.md`) | Revisa cambios antes del commit | activo | Calidad sin dueño programador |

### En reserva (no copiados aún; entran con su fase)
| Fase | Agente | Para qué |
|---|---|---|
| B hardware | Desktop App Engineer, Embedded Firmware Engineer | App Windows, control de cámara e impresora |
| C impresión | Performance Benchmarker | Tiempo por copia y colas |
| E comercial | Senior SecOps Engineer, Payments & Billing Engineer, Identity & Access Engineer | Cuentas, licencias, pagos |

## Retirados
| Agente | Fecha | Por qué |
|---|---|---|

# Prueba técnica de escritorio (D8, hito 3a): propuesta lista, NO ejecutada

> **Estado:** preparada el 2026-11-18. **No se ejecuta hasta que el dueño dé su visto bueno** (decisión D8 de `ARQUITECTURA_FLUJO.md` §8). Este documento es para los agentes; al dueño se le presenta en el chat.

## Para qué sirve
La cabina funciona hoy en el navegador con una impresora **simulada** (hito 3). Lo que un navegador no puede hacer: imprimir en silencio a una impresora fija, controlar una cámara DSLR y servir el QR sin Internet. Esta prueba decide **con qué herramienta se construye la app de escritorio** (hito 8) antes de gastar semanas en ella. El adaptador de impresora ya tiene una interfaz (`shared/impresion.js`, `AdaptadorImpresora`): el resultado de la prueba define qué adaptador real se escribe.

## Qué se prueba (1 a 3 días, en el PC y los equipos reales de Nico)
| # | Prueba | Pasa si | Candidatos |
|---|---|---|---|
| 1 | Impresión **silenciosa** (sin diálogo) de una hoja 4 x 6 con dos tiras a la impresora real, 20 hojas seguidas | Sale sin tocar nada, tamaño y corte correctos, sin márgenes blancos | (a) Chrome/Edge en modo kiosco con impresión sin diálogo sobre un servidor local mínimo; (b) shell Electron o Tauri con el driver de Windows |
| 2 | Estado de la impresora (sin papel, sin cinta, atascada, desconectada) | La app se entera sin que alguien mire la impresora | Cola de Windows / API del fabricante (DNP, HiTi) |
| 3 | Cámara DSLR por USB con disparo y vista en vivo | Foto en la app en menos de 3 s, sin diálogos | Librería del fabricante, gphoto2 o similar; si no, la cámara web actual |
| 4 | Servidor local en la red de la cabina para el QR | Un celular en el Wi-Fi propio descarga la foto sin Internet | Servidor mínimo dentro de la app |
| 5 | Reinicio y corte de luz con trabajos en cola | Nada se pierde ni se reimprime solo | La cola actual |
| 6 | Instalación y actualización sin Internet | Se instala y abre en un PC limpio | Instalador del shell elegido |

## Qué se necesita de Nico
La impresora real (modelo exacto), la cámara real (modelo), un PC con Windows como el del evento, papel y cinta para unas 40 hojas de prueba y un celular. Nada se instala fuera de una carpeta de prueba; no se toca el repo salvo el informe.

## Salida
Un informe corto con: qué herramienta ganó y por qué, qué quedó fuera, riesgos, y el contrato del adaptador real. Con eso se abre el hito 8 y se ajusta la cola si hiciera falta.

## Atajo si se quiere un primer evento sin app
Opción (a) de la prueba 1: Chrome en modo kiosco con impresión silenciosa. Limitaciones: una sola impresora y sin estado de impresora.

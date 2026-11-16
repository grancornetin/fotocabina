// Almacén compartido de eventos, en localStorage (sin backend todavía). Cualquier página
// del panel de operador (lista de eventos, cabina, editor de plantillas) lee y escribe acá
// para que el evento elegido en 04-lista-eventos viaje al resto de la app: nombre, plantilla
// asignada y los mismos ajustes de sesión que hoy vivían sueltos en cada pantalla.
//
// Cuando exista una capa de datos real (Fase E, docs/DSLRBOOTH_PRODUCT_CONTEXT.md §5.1.1),
// este archivo es el punto único a reemplazar: el resto de las páginas ya consumen esta
// misma interfaz (listar, obtener, guardar, eliminar, evento activo).
(function (raiz) {
  'use strict';

  const CLAVE_EVENTOS = 'fotocabina-eventos';
  const CLAVE_ACTIVO = 'fotocabina-evento-activo';

  const AJUSTES_BASE = {
    fotos: 3,
    cuenta: 3,
    pausa: 3,
    mensajePausa: '¡Cambia de pose!',
    volver: 30,
    espejo: true,
  };

  // "plantillaId" es la referencia real a una plantilla guardada en 03-editor-plantillas
  // (localStorage propio del editor, clave "fotocabina-editor-v1"). Empieza en null porque
  // los eventos de ejemplo no conocen ninguna plantilla real todavía; "plantilla" queda como
  // nombre de respaldo para mostrar mientras no se haya elegido una de verdad (ver
  // docs/DSLRBOOTH_PRODUCT_CONTEXT.md §3.9).
  const EVENTOS_DEMO = [
    {
      id: 'ev-1',
      nombre: 'Casamiento de Juli y Fran',
      fecha: '2026-10-03',
      estado: 'proximos',
      plantilla: 'Tira clásica 2×6',
      plantillaId: null,
      sesiones: 0,
      ajustes: { ...AJUSTES_BASE },
    },
    {
      id: 'ev-2',
      nombre: 'Cumpleaños 15 de Mora',
      fecha: '2026-09-17',
      estado: 'en-curso',
      plantilla: 'Fiesta Neón',
      plantillaId: null,
      sesiones: 48,
      ajustes: { ...AJUSTES_BASE, fotos: 4, cuenta: 5 },
    },
    {
      id: 'ev-3',
      nombre: 'Evento corporativo Nexa',
      fecha: '2026-08-22',
      estado: 'archivados',
      plantilla: 'Tira clásica 2×6',
      plantillaId: null,
      sesiones: 132,
      ajustes: { ...AJUSTES_BASE },
    },
    {
      id: 'ev-4',
      nombre: 'Aniversario Bar Rústico',
      fecha: '2026-11-14',
      estado: 'proximos',
      plantilla: 'Fiesta Neón',
      plantillaId: null,
      sesiones: 0,
      ajustes: { ...AJUSTES_BASE },
    },
  ];

  function leerTodos() {
    try {
      const guardado = localStorage.getItem(CLAVE_EVENTOS);
      if (!guardado) {
        localStorage.setItem(CLAVE_EVENTOS, JSON.stringify(EVENTOS_DEMO));
        return clonar(EVENTOS_DEMO);
      }
      return JSON.parse(guardado);
    } catch (e) {
      return clonar(EVENTOS_DEMO);
    }
  }

  function guardarTodos(eventos) {
    try {
      localStorage.setItem(CLAVE_EVENTOS, JSON.stringify(eventos));
    } catch (e) {
      // sin persistencia disponible, los cambios igual valen durante esta sesión
    }
  }

  function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  function listar() {
    return leerTodos();
  }

  function obtener(id) {
    return leerTodos().find((e) => e.id === id) || null;
  }

  function guardar(evento) {
    const eventos = leerTodos();
    const indice = eventos.findIndex((e) => e.id === evento.id);
    if (indice >= 0) eventos[indice] = evento;
    else eventos.unshift(evento);
    guardarTodos(eventos);
    return evento;
  }

  function eliminar(id) {
    guardarTodos(leerTodos().filter((e) => e.id !== id));
  }

  function nuevoId() {
    return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function ajustesPorDefecto() {
    return { ...AJUSTES_BASE };
  }

  // Evento activo: el que se lanzó por última vez desde la lista de eventos. Otras páginas
  // (hoy la cabina) lo leen al abrir para saber con qué evento están trabajando. Si no hay
  // ninguno guardado (por ejemplo, se abrió la cabina directo sin pasar por la lista), esas
  // páginas siguen funcionando con sus valores generales de siempre.
  function setActivo(id) {
    try {
      localStorage.setItem(CLAVE_ACTIVO, id);
    } catch (e) {
      // sin persistencia disponible
    }
  }

  function obtenerActivo() {
    let id = null;
    try {
      id = localStorage.getItem(CLAVE_ACTIVO);
    } catch (e) {
      return null;
    }
    if (!id) return null;
    return obtener(id);
  }

  function limpiarActivo() {
    try {
      localStorage.removeItem(CLAVE_ACTIVO);
    } catch (e) {
      // sin persistencia disponible
    }
  }

  raiz.AlmacenEventos = {
    listar,
    obtener,
    guardar,
    eliminar,
    nuevoId,
    ajustesPorDefecto,
    setActivo,
    obtenerActivo,
    limpiarActivo,
  };
})(window);

(function () {
  'use strict';

  // Los eventos viven en el almacén compartido (shared/almacen-eventos.js, localStorage, formato
  // v2), para que "Lanzar" pueda pasarle el evento elegido a 01-camera-flow y, más adelante, al
  // editor de plantillas. La primera vez que se abre esta pantalla, el almacén se llena solo
  // con eventos de ejemplo. Los eventos guardados con el formato anterior se migran al leer.
  var eventos = AlmacenEventos.listar();

  var estadoLabel = {
    'proximo': 'Próximo',
    'en-curso': 'En curso',
    'archivado': 'Archivado',
  };

  // Las pestañas usan el nombre en plural; el estado guardado va en singular.
  var estadoDePestana = { 'proximos': 'proximo', 'en-curso': 'en-curso', 'archivados': 'archivado' };

  var filtroActual = 'proximos';
  var eventoAConfirmar = null;

  // Datos que no se guardan en el evento sino que se derivan (regla 3 del contrato de datos):
  // el nombre de la plantilla sale de la plantilla, y el n.º de sesiones de contar las sesiones
  // guardadas. null = todavía no se sabe; false = no se pudo leer (no se muestra un número falso).
  var conteo = null;
  var nombresPlantilla = null;
  // Plantillas completas por id, para que el validador revise cada evento. null = todavía no se leyeron.
  var plantillasPorId = null;

  var eventsGrid = document.getElementById('eventsGrid');
  var eventsEmpty = document.getElementById('eventsEmpty');
  var eventsEmptyTitle = document.getElementById('eventsEmptyTitle');
  var eventsEmptyText = document.getElementById('eventsEmptyText');
  var eventsEmptyBtn = document.getElementById('eventsEmptyBtn');
  var eventsSub = document.getElementById('eventsSub');
  var eventsTabs = document.getElementById('eventsTabs');

  function formatearFecha(iso) {
    var partes = iso.split('-');
    var fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function esc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function iconoCamara() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/></svg>';
  }

  function idPlantilla(evento) {
    return (evento.plantillas && evento.plantillas.porDefecto) || null;
  }

  function textoPlantilla(evento) {
    var id = idPlantilla(evento);
    if (!id) return 'Sin plantilla asignada';
    if (nombresPlantilla === null) return '';
    if (nombresPlantilla === false) return 'Plantilla no disponible';
    var nombre = nombresPlantilla[id] || 'Plantilla no encontrada';
    var otras = ((evento.plantillas && evento.plantillas.habilitadas) || []).filter(function (x) { return x !== id; }).length;
    return otras > 0 ? nombre + ' (+' + otras + (otras === 1 ? ' más)' : ' más)') : nombre;
  }

  // Cómo entrega el evento, en una línea: modo, impresión automática y tope de hojas (se leen del evento).
  function textoEntrega(evento) {
    var e = evento.entrega || {};
    var modos = { impresion: 'Solo impresión', digital: 'Solo digital', ambos: 'Impresión y digital' };
    var texto = modos[e.modo] || 'Entrega sin definir';
    if (e.modo !== 'digital' && e.impresionAuto) {
      var n = e.copias || 1;
      texto += ' · impresión automática de ' + n + (n === 1 ? ' hoja' : ' hojas');
    }
    if (e.modo === 'ambos' && e.topeHojas) texto += ' · tope ' + e.topeHojas + (e.topeHojas === 1 ? ' hoja' : ' hojas');
    return texto;
  }

  function textoSesiones(evento) {
    if (conteo === null) return 'Contando sesiones…';
    if (conteo === false) return 'No se pudieron contar las sesiones';
    var c = conteo[evento.id] || { completas: 0, incompletas: 0 };
    var texto = c.completas + (c.completas === 1 ? ' sesión' : ' sesiones');
    if (c.incompletas) texto += ' · ' + c.incompletas + (c.incompletas === 1 ? ' incompleta' : ' incompletas');
    return texto;
  }

  // ¿Se puede lanzar este evento? Lo decide el validador (shared/validador-evento.js), sin cargar hardware:
  // cámaras, impresora y disco quedan sin dato (null), así que aquí solo pesan los bloqueos del evento y la plantilla.
  // Devuelve el primer bloqueo, o null si se puede lanzar o todavía no hay datos para saberlo.
  // Los eventos archivados no se marcan: su pestaña ya lo dice.
  function bloqueoDeLanzamiento(evento) {
    if (typeof ValidadorEvento === 'undefined' || evento.estado === 'archivado') return null;
    var id = idPlantilla(evento);
    // Sin datos de plantillas (todavía no cargan o no se pudieron leer) no se puede afirmar que una asignada "ya no existe": no se marca.
    // Un evento sin ninguna plantilla asignada sí se marca, porque no depende de esa lectura.
    if (plantillasPorId === null || (!plantillasPorId && id)) return null;
    var plantilla = id && plantillasPorId ? (plantillasPorId[id] || null) : null;
    var res = ValidadorEvento.validar({
      evento: evento,
      plantilla: plantilla,
      vivo: { camaras: null, impresora: null, espacioLibreMB: null },
    });
    return res.bloqueos[0] || null;
  }

  function pintarLanzable(parrafo, evento) {
    var b = bloqueoDeLanzamiento(evento);
    parrafo.textContent = '';
    parrafo.hidden = !b;
    if (!b) return;
    var etiqueta = document.createElement('span');
    etiqueta.className = 'ds-badge ds-badge--error';
    etiqueta.textContent = 'No lanzable';
    var motivo = document.createElement('span');
    motivo.className = 'event-card-block-text';
    motivo.textContent = b.mensaje;
    parrafo.appendChild(etiqueta);
    parrafo.appendChild(motivo);
  }

  // Pone al día, en las tarjetas ya dibujadas, lo que llega después de dibujar (nombres y conteo).
  function refrescarDerivados() {
    Array.prototype.forEach.call(eventsGrid.querySelectorAll('.event-card'), function (card) {
      var evento = eventos.filter(function (e) { return e.id === card.getAttribute('data-id'); })[0];
      if (!evento) return;
      var plantilla = card.querySelector('[data-campo="plantilla"]');
      var sesiones = card.querySelector('[data-campo="sesiones"]');
      if (plantilla) plantilla.textContent = textoPlantilla(evento);
      if (sesiones) sesiones.textContent = textoSesiones(evento);
      var lanzable = card.querySelector('[data-campo="lanzable"]');
      if (lanzable) pintarLanzable(lanzable, evento);
    });
  }

  function cargarDerivados() {
    var pNombres = (typeof AlmacenPlantillas !== 'undefined')
      ? AlmacenPlantillas.listar().then(function (lista) {
          var mapa = {};
          var completas = {};
          (lista || []).forEach(function (p) { mapa[p.id] = p.nombre; completas[p.id] = p; });
          nombresPlantilla = mapa;
          // listar() da null si el almacén no existe o está dañado: no se sabe, no se marca nada (no es "ya no existe").
          plantillasPorId = lista === null ? false : completas;
        }).catch(function () { nombresPlantilla = false; plantillasPorId = false; })
      : Promise.resolve();
    var pConteo = (typeof AlmacenSesiones !== 'undefined')
      ? AlmacenSesiones.contarPorEvento().then(function (c) { conteo = c; }).catch(function () { conteo = false; })
      : Promise.resolve();
    return Promise.all([pNombres, pConteo]).then(refrescarDerivados);
  }

  function crearCardEvento(evento) {
    var card = document.createElement('article');
    card.className = 'event-card' + (evento.estado === 'en-curso' ? ' event-card--live' : '');
    card.setAttribute('data-id', evento.id);

    var badgeClase = evento.estado === 'en-curso' ? 'ds-badge--ready' : 'ds-badge--idle';
    var esArchivado = evento.estado === 'archivado';

    card.innerHTML =
      '<div class="event-card-thumb">' + iconoCamara() + '</div>' +
      '<div class="event-card-body">' +
        '<div class="event-card-top">' +
          '<h3 class="event-card-name">' + esc(evento.nombre) + '</h3>' +
          '<span class="ds-badge ' + badgeClase + '">' + estadoLabel[evento.estado] + '</span>' +
        '</div>' +
        '<p class="event-card-meta">' + esc(formatearFecha(evento.fecha)) + ' · <span data-campo="plantilla">' + esc(textoPlantilla(evento)) + '</span></p>' +
        '<p class="event-card-delivery" data-campo="entrega">' + esc(textoEntrega(evento)) + '</p>' +
        '<p class="event-card-block" data-campo="lanzable" hidden></p>' +
        '<p class="event-card-stats">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="7" height="7" rx="1.5"/><rect x="13" y="3" width="7" height="7" rx="1.5"/><rect x="4" y="14" width="7" height="7" rx="1.5"/><rect x="13" y="14" width="7" height="7" rx="1.5"/></svg>' +
          '<span data-campo="sesiones">' + esc(textoSesiones(evento)) + '</span>' +
        '</p>' +
        '<div class="event-card-actions">' +
          '<button class="event-action-btn" data-action="editar" title="Editar evento" aria-label="Editar evento">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>' +
          '</button>' +
          '<button class="event-action-btn" data-action="editar-plantilla" title="Editar plantilla del evento" aria-label="Editar plantilla del evento">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M13 7l4 4"/></svg>' +
          '</button>' +
          '<button class="event-action-btn" data-action="duplicar" title="Duplicar evento" aria-label="Duplicar evento">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>' +
          '</button>' +
          '<button class="event-action-btn event-action-btn--danger" data-action="' + (esArchivado ? 'eliminar' : 'archivar') + '" title="' + (esArchivado ? 'Eliminar evento' : 'Archivar evento') + '" aria-label="' + (esArchivado ? 'Eliminar evento' : 'Archivar evento') + '">' +
            (esArchivado
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 002 2h10a2 2 0 002-2V9M10 13h4"/></svg>') +
          '</button>' +
          '<button class="event-launch-btn" data-action="lanzar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>' +
            'Lanzar' +
          '</button>' +
        '</div>' +
      '</div>';

    // Cada tarjeta nueva (cambio de pestaña, duplicar, archivar) vuelve a mostrar la marca con los datos ya leidos.
    pintarLanzable(card.querySelector('[data-campo="lanzable"]'), evento);

    card.querySelector('[data-action="lanzar"]').addEventListener('click', function () {
      AlmacenEventos.setActivo(evento.id);
      window.location.href = '../01-camera-flow/index.html';
    });

    card.querySelector('[data-action="editar"]').addEventListener('click', function () {
      window.location.href = '../05-crear-evento/index.html?editar=' + encodeURIComponent(evento.id);
    });

    card.querySelector('[data-action="editar-plantilla"]').addEventListener('click', function () {
      window.location.href = '../03-editor-plantillas/index.html?evento=' + encodeURIComponent(evento.id);
    });

    card.querySelector('[data-action="duplicar"]').addEventListener('click', function () {
      duplicarEvento(evento);
    });

    var archivarBtn = card.querySelector('[data-action="archivar"], [data-action="eliminar"]');
    archivarBtn.addEventListener('click', function () {
      pedirConfirmacion(evento);
    });

    return card;
  }

  // La copia conserva TODO lo que define al evento (plantilla, entrega y copias, ritmo, cámara);
  // solo cambia el nombre, el id y el estado (vuelve a "Próximo").
  function duplicarEvento(evento) {
    var copia = AlmacenEventos.duplicar(evento);
    if (!copia) { mostrarAviso('No se pudo duplicar el evento.'); return; }
    AlmacenEventos.guardar(copia);
    var errDup = AlmacenEventos.errorDeGuardado();
    if (errDup) { eventos = AlmacenEventos.listar(); render(); mostrarAviso(errDup.mensaje); return; }
    eventos = AlmacenEventos.listar();
    mostrarAviso('Evento duplicado con la misma plantilla, entrega, copias y ajustes. Cámbiale el nombre y la fecha.');
    render();
  }

  function pedirConfirmacion(evento) {
    eventoAConfirmar = evento;
    var esArchivado = evento.estado === 'archivado';
    document.getElementById('confirmTitle').textContent = esArchivado ? 'Eliminar evento' : 'Archivar evento';
    var texto;
    if (esArchivado) {
      var c = conteo && conteo[evento.id];
      var cuantas = c ? c.completas + c.incompletas : 0;
      if (conteo === false || conteo === null) {
        texto = 'Esta acción no se puede deshacer. Se borran "' + evento.nombre + '" y todas sus sesiones guardadas, con sus fotos.';
      } else if (cuantas > 0) {
        texto = 'Esta acción no se puede deshacer. Se borran "' + evento.nombre + '" y sus ' + cuantas + (cuantas === 1 ? ' sesión guardada' : ' sesiones guardadas') + ', con todas sus fotos.';
      } else {
        texto = 'Esta acción no se puede deshacer. Se borra "' + evento.nombre + '". No tiene sesiones guardadas.';
      }
    } else {
      texto = 'El evento "' + evento.nombre + '" se mueve a Archivados. Puedes volver a activarlo cuando quieras.';
    }
    document.getElementById('confirmText').textContent = texto;
    document.getElementById('confirmAcceptBtn').textContent = esArchivado ? 'Eliminar' : 'Archivar';
    document.getElementById('confirmOverlay').setAttribute('data-visible', 'true');
  }

  function cerrarConfirmacion() {
    eventoAConfirmar = null;
    document.getElementById('confirmOverlay').setAttribute('data-visible', 'false');
  }

  document.getElementById('confirmCancelBtn').addEventListener('click', cerrarConfirmacion);

  // Eliminar de verdad: primero se borran las sesiones del evento y sus archivos (en IndexedDB, en una
  // sola operación); solo si eso salió bien se borra el evento. Así no quedan fotos de invitados
  // huérfanas ni se promete un borrado que no ocurrió.
  function eliminarEventoYSesiones(evento) {
    if (typeof AlmacenSesiones === 'undefined') return Promise.reject(new Error('sin almacén de sesiones'));
    return AlmacenSesiones.borrarDeEvento(evento.id).then(function (borradas) {
      AlmacenEventos.eliminar(evento.id);
      var enUso = AlmacenEventos.listar().map(function (e) {
        return e.congelado && e.congelado.plantilla ? e.congelado.plantilla.huella : null;
      }).filter(Boolean);
      return AlmacenSesiones.limpiarCongeladas(enUso).catch(function () { return 0; }).then(function () { return borradas; });
    });
  }

  document.getElementById('confirmAcceptBtn').addEventListener('click', function () {
    if (!eventoAConfirmar) return;
    var evento = eventoAConfirmar;
    if (evento.estado === 'archivado') {
      cerrarConfirmacion();
      eliminarEventoYSesiones(evento).then(function (borradas) {
        eventos = AlmacenEventos.listar();
        if (conteo) delete conteo[evento.id];
        mostrarAviso(borradas > 0
          ? 'Evento eliminado, con sus ' + borradas + (borradas === 1 ? ' sesión.' : ' sesiones.')
          : 'Evento eliminado.');
        render();
      }).catch(function () {
        mostrarAviso('No se pudieron borrar las sesiones del evento, así que el evento no se eliminó. Inténtalo de nuevo.');
      });
      return;
    }
    // Se archiva sobre la copia más reciente del almacén (no sobre la de cuando se dibujó la lista).
    var fresco = AlmacenEventos.obtener(evento.id) || evento;
    fresco.estado = 'archivado';
    AlmacenEventos.guardar(fresco);
    var errArch = AlmacenEventos.errorDeGuardado();
    mostrarAviso(errArch ? errArch.mensaje : 'Evento archivado.');
    eventos = AlmacenEventos.listar();
    cerrarConfirmacion();
    render();
  });

  function mostrarAviso(texto) {
    var notice = document.getElementById('notice');
    notice.textContent = texto;
    notice.hidden = false;
    clearTimeout(notice._timeout);
    notice._timeout = setTimeout(function () { notice.hidden = true; }, 5200);
  }

  var textosVacio = {
    'proximos': { title: 'No hay eventos próximos', text: 'Crea un evento nuevo para empezar a configurar la cabina.' },
    'en-curso': { title: 'Ningún evento en curso', text: 'Cuando lances un evento desde "Próximos" va a aparecer aquí.' },
    'archivados': { title: 'No hay eventos archivados', text: 'Los eventos que archives van a quedar guardados aquí.' },
  };

  function render() {
    var visibles = eventos.filter(function (e) { return e.estado === estadoDePestana[filtroActual]; });

    eventsGrid.innerHTML = '';
    visibles.forEach(function (evento) {
      eventsGrid.appendChild(crearCardEvento(evento));
    });

    var hayVacio = visibles.length === 0;
    eventsEmpty.hidden = !hayVacio;
    eventsGrid.hidden = hayVacio;
    if (hayVacio) {
      eventsEmptyTitle.textContent = textosVacio[filtroActual].title;
      eventsEmptyText.textContent = textosVacio[filtroActual].text;
      eventsEmptyBtn.hidden = filtroActual === 'en-curso';
    }

    var totalActivos = eventos.filter(function (e) { return e.estado !== 'archivado'; }).length;
    eventsSub.textContent = totalActivos + (totalActivos === 1 ? ' evento activo' : ' eventos activos');
  }

  eventsTabs.addEventListener('click', function (ev) {
    var tab = ev.target.closest('.ds-tab');
    if (!tab) return;
    Array.prototype.forEach.call(eventsTabs.querySelectorAll('.ds-tab'), function (t) {
      t.setAttribute('aria-selected', String(t === tab));
    });
    filtroActual = tab.getAttribute('data-filter');
    render();
  });

  function irACrearEvento() {
    window.location.href = '../05-crear-evento/index.html';
  }

  document.getElementById('createEventBtn').addEventListener('click', irACrearEvento);
  document.getElementById('eventsEmptyBtn').addEventListener('click', irACrearEvento);

  /* ---------- Hoja "Próximamente" para accesos aún no construidos ---------- */

  var soonTextos = {
    camara: 'La cámara se elige por evento, desde la cabina: toca "Lanzar" en el evento y abre Ajustes › Cámara.',
    impresora: 'La configuración de impresora (C4) todavía no está construida.',
    ayuda: 'La ayuda todavía no está construida.',
  };

  // "Cámara" ya existe (vive en Ajustes de la cabina, por evento): su hoja solo indica dónde
  // está, así que no lleva el sello "Próximamente" que sí llevan Impresora y Ayuda.
  var yaConstruidos = { camara: true };

  function mostrarSoon(titulo, texto, textoKey) {
    document.getElementById('soonTitle').textContent = titulo;
    document.getElementById('soonText').textContent = texto;
    document.querySelector('#soonOverlay .ds-badge').hidden = !!yaConstruidos[textoKey];
    document.getElementById('soonOverlay').setAttribute('data-visible', 'true');
  }

  document.getElementById('soonCloseBtn').addEventListener('click', function () {
    document.getElementById('soonOverlay').setAttribute('data-visible', 'false');
  });

  function conectarAccesoSoon(id, titulo, textoKey) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      mostrarSoon(titulo, soonTextos[textoKey], textoKey);
    });
  }

  // "Editor de plantillas" ya conecta de verdad a 03-editor-plantillas (href real en el
  // HTML), sin pasar por acá. Cámara se configura dentro de la cabina (su hoja lo explica);
  // Impresora y Ayuda siguen sin pantalla todavía.
  conectarAccesoSoon('navCamara', 'Cámara', 'camara');
  conectarAccesoSoon('navImpresora', 'Impresora', 'impresora');
  conectarAccesoSoon('navAyuda', 'Ayuda', 'ayuda');
  conectarAccesoSoon('tabCamara', 'Cámara', 'camara');
  conectarAccesoSoon('tabImpresora', 'Impresora', 'impresora');

  /* ---------- Modo de color: igual criterio que 00-design-system ---------- */

  var STORAGE_KEY = 'fotocabina-tema';

  function aplicarTema(modo) {
    if (modo === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', modo);
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-choice]'), function (btn) {
      btn.setAttribute('aria-checked', String(btn.getAttribute('data-theme-choice') === modo));
    });
    try { localStorage.setItem(STORAGE_KEY, modo); } catch (e) { /* almacenamiento no disponible */ }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-theme-choice]'), function (btn) {
    btn.addEventListener('click', function () {
      aplicarTema(btn.getAttribute('data-theme-choice'));
    });
  });

  var temaGuardado = 'system';
  try { temaGuardado = localStorage.getItem(STORAGE_KEY) || 'system'; } catch (e) { /* almacenamiento no disponible */ }
  aplicarTema(temaGuardado);

  render();
  cargarDerivados();
})();

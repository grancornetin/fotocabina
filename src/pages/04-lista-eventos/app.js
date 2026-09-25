(function () {
  'use strict';

  // Los eventos viven en el almacén compartido (shared/almacen-eventos.js, localStorage),
  // para que "Lanzar" pueda pasarle el evento elegido a 01-camera-flow y, más adelante, al
  // editor de plantillas. La primera vez que se abre esta pantalla, el almacén se llena solo
  // con eventos de ejemplo.
  var eventos = AlmacenEventos.listar();

  var estadoLabel = {
    'proximos': 'Próximo',
    'en-curso': 'En curso',
    'archivados': 'Archivado',
  };

  var filtroActual = 'proximos';
  var eventoAConfirmar = null;

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
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function iconoCamara() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/></svg>';
  }

  function crearCardEvento(evento) {
    var card = document.createElement('article');
    card.className = 'event-card' + (evento.estado === 'en-curso' ? ' event-card--live' : '');

    var badgeClase = evento.estado === 'en-curso' ? 'ds-badge--ready' : 'ds-badge--idle';

    card.innerHTML =
      '<div class="event-card-thumb">' + iconoCamara() + '</div>' +
      '<div class="event-card-body">' +
        '<div class="event-card-top">' +
          '<h3 class="event-card-name">' + evento.nombre + '</h3>' +
          '<span class="ds-badge ' + badgeClase + '">' + estadoLabel[evento.estado] + '</span>' +
        '</div>' +
        '<p class="event-card-meta">' + formatearFecha(evento.fecha) + ' · ' + evento.plantilla + '</p>' +
        '<p class="event-card-stats">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="7" height="7" rx="1.5"/><rect x="13" y="3" width="7" height="7" rx="1.5"/><rect x="4" y="14" width="7" height="7" rx="1.5"/><rect x="13" y="14" width="7" height="7" rx="1.5"/></svg>' +
          '<span>' + evento.sesiones + (evento.sesiones === 1 ? ' sesión' : ' sesiones') + '</span>' +
        '</p>' +
        '<div class="event-card-actions">' +
          '<button class="event-action-btn" data-action="editar-plantilla" title="Editar plantilla del evento" aria-label="Editar plantilla del evento">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M13 7l4 4"/></svg>' +
          '</button>' +
          '<button class="event-action-btn" data-action="duplicar" title="Duplicar evento" aria-label="Duplicar evento">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>' +
          '</button>' +
          '<button class="event-action-btn event-action-btn--danger" data-action="' + (evento.estado === 'archivados' ? 'eliminar' : 'archivar') + '" title="' + (evento.estado === 'archivados' ? 'Eliminar evento' : 'Archivar evento') + '" aria-label="' + (evento.estado === 'archivados' ? 'Eliminar evento' : 'Archivar evento') + '">' +
            (evento.estado === 'archivados'
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 002 2h10a2 2 0 002-2V9M10 13h4"/></svg>') +
          '</button>' +
          '<button class="event-launch-btn" data-action="lanzar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>' +
            'Lanzar' +
          '</button>' +
        '</div>' +
      '</div>';

    card.querySelector('[data-action="lanzar"]').addEventListener('click', function () {
      AlmacenEventos.setActivo(evento.id);
      window.location.href = '../01-camera-flow/index.html';
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

  function duplicarEvento(evento) {
    var copia = {
      id: AlmacenEventos.nuevoId(),
      nombre: evento.nombre + ' (copia)',
      fecha: evento.fecha,
      estado: 'proximos',
      plantilla: evento.plantilla,
      plantillaId: evento.plantillaId || null,
      sesiones: 0,
      ajustes: Object.assign({}, evento.ajustes || AlmacenEventos.ajustesPorDefecto()),
    };
    AlmacenEventos.guardar(copia);
    eventos = AlmacenEventos.listar();
    mostrarAviso('Evento duplicado con la misma plantilla, cámara, impresora y ajustes. Cambiale el nombre y la fecha.');
    render();
  }

  function pedirConfirmacion(evento) {
    eventoAConfirmar = evento;
    var esArchivado = evento.estado === 'archivados';
    document.getElementById('confirmTitle').textContent = esArchivado ? 'Eliminar evento' : 'Archivar evento';
    document.getElementById('confirmText').textContent = esArchivado
      ? 'Esta acción no se puede deshacer. Las sesiones guardadas de "' + evento.nombre + '" se pierden.'
      : 'El evento "' + evento.nombre + '" se mueve a Archivados. Podés volver a activarlo cuando quieras.';
    document.getElementById('confirmAcceptBtn').textContent = esArchivado ? 'Eliminar' : 'Archivar';
    document.getElementById('confirmOverlay').setAttribute('data-visible', 'true');
  }

  function cerrarConfirmacion() {
    eventoAConfirmar = null;
    document.getElementById('confirmOverlay').setAttribute('data-visible', 'false');
  }

  document.getElementById('confirmCancelBtn').addEventListener('click', cerrarConfirmacion);

  document.getElementById('confirmAcceptBtn').addEventListener('click', function () {
    if (!eventoAConfirmar) return;
    if (eventoAConfirmar.estado === 'archivados') {
      AlmacenEventos.eliminar(eventoAConfirmar.id);
      mostrarAviso('Evento eliminado.');
    } else {
      eventoAConfirmar.estado = 'archivados';
      AlmacenEventos.guardar(eventoAConfirmar);
      mostrarAviso('Evento archivado.');
    }
    eventos = AlmacenEventos.listar();
    cerrarConfirmacion();
    render();
  });

  function mostrarAviso(texto) {
    var notice = document.getElementById('notice');
    notice.textContent = texto;
    notice.hidden = false;
    clearTimeout(notice._timeout);
    notice._timeout = setTimeout(function () { notice.hidden = true; }, 3200);
  }

  var textosVacio = {
    'proximos': { title: 'No hay eventos próximos', text: 'Creá un evento nuevo para empezar a configurar la cabina.' },
    'en-curso': { title: 'Ningún evento en curso', text: 'Cuando lances un evento desde "Próximos" va a aparecer acá.' },
    'archivados': { title: 'No hay eventos archivados', text: 'Los eventos que archivés van a quedar guardados acá.' },
  };

  function render() {
    var visibles = eventos.filter(function (e) { return e.estado === filtroActual; });

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

    var totalActivos = eventos.filter(function (e) { return e.estado !== 'archivados'; }).length;
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
    camara: 'La cámara se elige por evento, desde la cabina: tocá "Lanzar" en el evento y abrí Ajustes › Cámara.',
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
})();

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
    // Sin el validador o sin el motor de plantillas (fallo de carga) no hay datos fiables: no se marca ni se deshabilita nada.
    if (typeof ValidadorEvento === 'undefined' || typeof MotorPlantillas === 'undefined' || evento.estado === 'archivado') return null;
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

  // "Lanzar" queda deshabilitado mientras el validador diga "No lanzable" (decisión del dueño, 2026-11-18);
  // el motivo se lee en la propia tarjeta (aria-describedby) y no se duplica la lógica.
  function aplicarLanzar(card, bloqueo) {
    var btn = card.querySelector('[data-action="lanzar"]');
    var parrafo = card.querySelector('[data-campo="lanzable"]');
    if (!btn) return;
    if (bloqueo) {
      btn.disabled = true;
      btn.setAttribute('title', 'No se puede lanzar: ' + bloqueo.mensaje);
      if (parrafo) {
        if (!parrafo.id) parrafo.id = 'bloqueo-' + card.getAttribute('data-id');
        btn.setAttribute('aria-describedby', parrafo.id);
      }
    } else {
      btn.disabled = false;
      btn.removeAttribute('title');
      btn.removeAttribute('aria-describedby');
    }
  }

  function pintarLanzable(parrafo, evento) {
    var b = bloqueoDeLanzamiento(evento);
    parrafo.textContent = '';
    parrafo.hidden = !b;
    var tarjeta = parrafo.closest('.event-card');
    if (tarjeta) aplicarLanzar(tarjeta, b);
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
    var esEnCurso = evento.estado === 'en-curso';

    // Ciclo de vida: próximo se archiva (ícono), en curso se termina (botón con texto), archivado se elimina (ícono)
    // y se reabre (botón con texto, en lugar de "Lanzar": un archivado no se lanza).
    var iconoArchivar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 002 2h10a2 2 0 002-2V9M10 13h4"/></svg>';
    var iconoEliminar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/></svg>';
    var botonCierre = esEnCurso
      ? '<span class="event-actions-break" aria-hidden="true"></span>' +
        '<button class="event-text-btn event-text-btn--danger" data-action="terminar" title="Terminar evento" aria-label="Terminar evento">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>Terminar evento' +
        '</button>'
      : '<button class="event-action-btn event-action-btn--danger" data-action="' + (esArchivado ? 'eliminar' : 'archivar') + '" title="' + (esArchivado ? 'Eliminar evento' : 'Archivar evento') + '" aria-label="' + (esArchivado ? 'Eliminar evento' : 'Archivar evento') + '">' +
          (esArchivado ? iconoEliminar : iconoArchivar) +
        '</button>';
    var botonPrincipal = esArchivado
      ? '<button class="event-text-btn event-text-btn--end" data-action="reabrir" title="Reabrir evento" aria-label="Reabrir evento">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 2.6 5.9"/><path d="M4 18v-6h6"/></svg>Reabrir' +
        '</button>'
      : '<button class="event-text-btn event-launch-btn" data-action="lanzar">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>' +
          'Lanzar' +
        '</button>';

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
          '<button class="event-action-btn" data-action="exportar" title="Exportar evento" aria-label="Exportar evento">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>' +
          '</button>' +
          botonCierre +
          botonPrincipal +
        '</div>' +
      '</div>';

    // Cada tarjeta nueva (cambio de pestaña, duplicar, archivar) vuelve a mostrar la marca con los datos ya leidos.
    pintarLanzable(card.querySelector('[data-campo="lanzable"]'), evento);

    var lanzarBtn = card.querySelector('[data-action="lanzar"]');
    if (lanzarBtn) lanzarBtn.addEventListener('click', function () {
      // El evento pasa a "En curso" cuando se lanza de verdad, desde la cabina (no al abrirla).
      AlmacenEventos.setActivo(evento.id);
      window.location.href = '../01-camera-flow/index.html';
    });

    var reabrirBtn = card.querySelector('[data-action="reabrir"]');
    if (reabrirBtn) reabrirBtn.addEventListener('click', function () { reabrirEvento(evento); });

    card.querySelector('[data-action="editar"]').addEventListener('click', function () {
      window.location.href = '../05-crear-evento/index.html?editar=' + encodeURIComponent(evento.id);
    });

    card.querySelector('[data-action="editar-plantilla"]').addEventListener('click', function () {
      window.location.href = '../03-editor-plantillas/index.html?evento=' + encodeURIComponent(evento.id);
    });

    card.querySelector('[data-action="duplicar"]').addEventListener('click', function () {
      duplicarEvento(evento);
    });

    card.querySelector('[data-action="exportar"]').addEventListener('click', function () {
      abrirExportar(evento);
    });

    var cierreBtn = card.querySelector('[data-action="archivar"], [data-action="eliminar"], [data-action="terminar"]');
    cierreBtn.addEventListener('click', function () {
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

  // Cuántas sesiones tiene el evento AHORA (se vuelve a contar al abrir el aviso, no se usa el número de cuando
  // se dibujó la lista). Devuelve { total, incompletas } o null si no se pudo leer.
  function contarEvento(id) {
    if (typeof AlmacenSesiones === 'undefined') return Promise.resolve(null);
    return AlmacenSesiones.contarPorEvento().then(function (c) {
      conteo = c;
      var d = c[id] || { completas: 0, incompletas: 0, total: 0 };
      return { total: d.total !== undefined ? d.total : d.completas + d.incompletas, incompletas: d.incompletas };
    }).catch(function () { return null; });
  }

  function textoSesiones2(n) {
    return n === 1 ? '1 sesión' : n + ' sesiones';
  }

  function pedirConfirmacion(evento) {
    eventoAConfirmar = evento;
    focoOrigenConfirmar = document.activeElement;
    var esArchivado = evento.estado === 'archivado';
    var esEnCurso = evento.estado === 'en-curso';
    document.getElementById('confirmTitle').textContent = esArchivado ? 'Eliminar evento' : (esEnCurso ? 'Terminar evento' : 'Archivar evento');
    document.getElementById('confirmText').textContent = 'Contando las sesiones del evento…';
    document.getElementById('confirmAcceptBtn').textContent = esArchivado ? 'Eliminar' : (esEnCurso ? 'Terminar evento' : 'Archivar');
    document.getElementById('confirmAcceptBtn').disabled = true;
    document.getElementById('confirmOverlay').setAttribute('data-visible', 'true');
    document.getElementById('confirmCancelBtn').focus();
    contarEvento(evento.id).then(function (c) {
      if (eventoAConfirmar !== evento) return; // el aviso se cerró o se abrió otro mientras se contaba
      var texto;
      if (esArchivado) {
        if (c === null) {
          texto = 'Esta acción no se puede deshacer. No pudimos contar las sesiones: se borran "' + evento.nombre + '" y todas las sesiones que tenga guardadas, con todas sus fotos.';
        } else if (c.total > 0) {
          texto = 'Esta acción no se puede deshacer. Se borran "' + evento.nombre + '" y sus ' + textoSesiones2(c.total) + ' guardadas' +
            (c.incompletas ? ' (' + c.incompletas + (c.incompletas === 1 ? ' incompleta' : ' incompletas') + ')' : '') + ', con todas sus fotos.';
        } else {
          texto = 'Esta acción no se puede deshacer. Se borra "' + evento.nombre + '". No tiene sesiones guardadas.';
        }
      } else {
        var guardan = c === null ? 'Sus sesiones y fotos se conservan. ' : (c.total > 0 ? (c.total === 1 ? 'Su sesión y sus fotos se conservan. ' : 'Sus ' + c.total + ' sesiones y sus fotos se conservan. ') : 'No tiene sesiones guardadas. ');
        texto = '"' + evento.nombre + '" pasa a Archivados y ya no se podrá lanzar ni tomar sesiones nuevas. ' + guardan + 'Si te arrepientes, lo reabres desde Archivados.';
      }
      document.getElementById('confirmText').textContent = texto;
      document.getElementById('confirmAcceptBtn').disabled = false;
    });
  }

  function nombreEstado(estado) {
    return estado === 'archivado' ? 'Archivado' : (estado === 'en-curso' ? 'En curso' : 'Próximo');
  }

  var focoOrigenConfirmar = null;

  // Cierra el aviso y, si se pide, devuelve el foco al botón que lo abrió (si la tarjeta sigue en pantalla).
  function cerrarConfirmacion(devolverFoco) {
    eventoAConfirmar = null;
    document.getElementById('confirmOverlay').setAttribute('data-visible', 'false');
    var origen = focoOrigenConfirmar;
    focoOrigenConfirmar = null;
    if (devolverFoco === true && origen && origen.isConnected) { try { origen.focus(); } catch (e) { /* sin foco */ } }
  }

  document.getElementById('confirmCancelBtn').addEventListener('click', function () { cerrarConfirmacion(true); });
  document.getElementById('confirmOverlay').addEventListener('click', function (e) {
    if (e.target === this) cerrarConfirmacion(true);
  });

  // Teclado del aviso: Escape lo cierra; Tab y Shift+Tab giran entre sus botones habilitados.
  document.addEventListener('keydown', function (e) {
    if (document.getElementById('confirmOverlay').getAttribute('data-visible') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); cerrarConfirmacion(true); return; }
    if (e.key !== 'Tab') return;
    var botones = Array.prototype.filter.call(document.querySelectorAll('#confirmOverlay button'), function (b) { return !b.disabled; });
    if (!botones.length) return;
    var primero = botones[0], ultimo = botones[botones.length - 1];
    var dentro = document.getElementById('confirmOverlay').contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === primero || !dentro)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) { e.preventDefault(); primero.focus(); }
  });

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
    if (!eventoAConfirmar || document.getElementById('confirmAcceptBtn').disabled) return;
    var evento = eventoAConfirmar;
    // El aviso se abrió con una copia del evento que puede haber quedado vieja (otra pestaña lo reabrió, lo
    // eliminó o lo cambió): se relee del almacén y, si ya no corresponde la acción, se cancela con aviso.
    var vigente = AlmacenEventos.obtener(evento.id);
    if (!vigente) {
      cerrarConfirmacion();
      mostrarAviso('Este evento ya no existe.');
      refrescarLista();
      return;
    }
    if (vigente.estado !== evento.estado) {
      cerrarConfirmacion();
      mostrarAviso('Este evento cambió en otra pestaña (ahora está ' + nombreEstado(vigente.estado) + '), así que no se hizo nada. Revisa la lista e inténtalo de nuevo.');
      refrescarLista();
      return;
    }
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
    // Se termina (o archiva) sobre la copia más reciente del almacén (no sobre la de cuando se dibujó la lista).
    var eraEnCurso = evento.estado === 'en-curso';
    var terminado = AlmacenEventos.terminar(evento.id);
    var errArch = AlmacenEventos.errorDeGuardado();
    if (!terminado) mostrarAviso('Este evento ya no existe.');
    else mostrarAviso(errArch ? errArch.mensaje : (eraEnCurso ? 'Evento terminado. Quedó en Archivados: lo puedes reabrir desde ahí.' : 'Evento archivado. Lo puedes reabrir desde Archivados.'));
    eventos = AlmacenEventos.listar();
    cerrarConfirmacion();
    render();
  });

  // Reabrir un archivado: vuelve a "En curso" si ya se había lanzado, o a "Próximos" si nunca se lanzó.
  function reabrirEvento(evento) {
    // Se lee el estado real: si otra pestaña ya lo reabrió o lo eliminó, no se anuncia una reapertura que no ocurrió.
    var actual = AlmacenEventos.obtener(evento.id);
    if (!actual || actual.estado !== 'archivado') {
      eventos = AlmacenEventos.listar();
      mostrarAviso(!actual ? 'Este evento ya no existe.' : 'Este evento ya no estaba archivado (otra pestaña lo cambió). La lista se actualizó.');
      render();
      return;
    }
    var r = AlmacenEventos.reabrir(evento.id);
    var err = AlmacenEventos.errorDeGuardado();
    eventos = AlmacenEventos.listar();
    if (!r) { mostrarAviso('Este evento ya no existe.'); render(); return; }
    if (err) { mostrarAviso(err.mensaje); render(); return; }
    if (r.estado === 'en-curso') {
      mostrarAviso('Evento reabierto: está En curso, donde lo dejaste. Ya se puede lanzar.');
      seleccionarPestana('en-curso');
    } else if (r.estado === 'proximo') {
      mostrarAviso('Evento reabierto: está en Próximos. Ya se puede lanzar.');
      seleccionarPestana('proximos');
    } else {
      render();
    }
  }

  function mostrarAviso(texto, ms) {
    var notice = document.getElementById('notice');
    notice.textContent = texto;
    notice.hidden = false;
    clearTimeout(notice._timeout);
    notice._timeout = setTimeout(function () { notice.hidden = true; }, ms || 5200);
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

  function seleccionarPestana(filtro) {
    Array.prototype.forEach.call(eventsTabs.querySelectorAll('.ds-tab'), function (t) {
      t.setAttribute('aria-selected', String(t.getAttribute('data-filter') === filtro));
    });
    filtroActual = filtro;
    render();
  }

  eventsTabs.addEventListener('click', function (ev) {
    var tab = ev.target.closest('.ds-tab');
    if (!tab) return;
    seleccionarPestana(tab.getAttribute('data-filter'));
  });

  function irACrearEvento() {
    window.location.href = '../05-crear-evento/index.html';
  }

  document.getElementById('createEventBtn').addEventListener('click', irACrearEvento);
  document.getElementById('eventsEmptyBtn').addEventListener('click', irACrearEvento);

  /* ---------- Exportar e importar un evento (hito 1.6) ----------
     Toda la lógica vive en shared/respaldo.js (Respaldo). Aquí solo se pide y se muestra. */

  var xfer = { modo: null, evento: null, paquete: null, trabajando: false, foco: null };

  function xferEl(id) { return document.getElementById(id); }

  function xferProgreso(p) {
    xferEl('xferProgress').hidden = false;
    xferEl('xferProgressText').textContent = p.texto || '';
    var barra = xferEl('xferBar');
    if (p.total > 0) {
      barra.classList.remove('is-indeterminate');
      barra.firstElementChild.style.width = Math.max(2, Math.min(100, (p.hecho / p.total) * 100)) + '%';
    } else {
      barra.classList.add('is-indeterminate');
      barra.firstElementChild.style.width = '';
    }
  }

  // Mientras trabaja: botones apagados, el cuadro no se puede cerrar y el navegador avisa si se intenta salir.
  function xferTrabajo(si) {
    xfer.trabajando = si;
    xferEl('xferAcceptBtn').disabled = si;
    xferEl('xferCancelBtn').disabled = si;
    xferEl('xferFotos').disabled = si;
    window.onbeforeunload = si ? function (e) { e.preventDefault(); e.returnValue = ''; return ''; } : null;
    if (!si) xferEl('xferProgress').hidden = true;
  }

  function xferAbrir() {
    xfer.foco = document.activeElement;
    xferEl('xferError').hidden = true;
    xferEl('xferProgress').hidden = true;
    xferEl('xferCancelBtn').textContent = 'Cancelar';
    xferEl('xferOverlay').setAttribute('data-visible', 'true');
    xferEl('xferCancelBtn').focus();
  }

  function xferCerrar(devolverFoco) {
    if (xfer.trabajando) return;
    xferEl('xferOverlay').setAttribute('data-visible', 'false');
    var origen = xfer.foco;
    xfer.foco = null;
    xfer.paquete = null;
    if (devolverFoco !== false && origen && origen.isConnected) { try { origen.focus(); } catch (e) { /* sin foco */ } }
  }

  // Falló o no corresponde: el cuadro queda con el motivo y solo se puede cerrar. No se cambió nada.
  function xferError(texto) {
    xferTrabajo(false);
    xferEl('xferError').textContent = texto;
    xferEl('xferError').hidden = false;
    xferEl('xferAcceptBtn').hidden = true;
    xferEl('xferCancelBtn').textContent = 'Cerrar';
    xferEl('xferCancelBtn').focus();
  }

  function abrirExportar(evento) {
    xfer.modo = 'exportar';
    xfer.evento = evento;
    xfer.paquete = null;
    xferEl('xferTitle').textContent = 'Exportar evento';
    xferEl('xferText').textContent = '«' + evento.nombre + '» se guarda en un archivo .zip con su ficha, las plantillas que usa y sus sesiones.';
    xferEl('xferFotosRow').hidden = false;
    xferEl('xferFotos').checked = true;
    xferEl('xferNote').hidden = true;
    xferEl('xferAcceptBtn').textContent = 'Exportar';
    xferEl('xferAcceptBtn').hidden = false;
    xferTrabajo(false);
    xferAbrir();
  }

  function hacerExportar() {
    xferTrabajo(true);
    xferProgreso({ texto: 'Preparando…' });
    Respaldo.crearPaqueteEvento(xfer.evento.id, { conFotos: xferEl('xferFotos').checked, alProgresar: xferProgreso }).then(function (r) {
      Respaldo.descargar(r.blob, r.nombre);
      xferTrabajo(false);
      xferCerrar(true);
      var falta = r.manifest.plantillasFaltantes || 0;
      var avisos = (r.advertencias || []).map(function (x) { return x.mensaje; }).join(' ');
      mostrarAviso((avisos ? 'Evento exportado pero INCOMPLETO: «' : 'Evento exportado: «') + r.nombre + '» (' + Respaldo.formatearBytes(r.blob.size) + ').' + (avisos ? ' ' + avisos : '') +
        (falta ? ' ' + (falta === 1 ? '1 plantilla del evento ya no existe en el editor y no se incluyó.' : falta + ' plantillas del evento ya no existen en el editor y no se incluyeron.') : ''), 8000);
    }).catch(function (e) {
      xferError('No se pudo exportar el evento. ' + e.message);
    });
  }

  function textoPlural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function abrirImportar(archivo) {
    xfer.modo = 'importar';
    xfer.evento = null;
    xfer.paquete = null;
    xferEl('xferTitle').textContent = 'Importar evento';
    xferEl('xferText').textContent = 'Revisando el archivo…';
    xferEl('xferFotosRow').hidden = true;
    xferEl('xferNote').hidden = true;
    xferEl('xferAcceptBtn').textContent = 'Importar';
    xferEl('xferAcceptBtn').hidden = false;
    xferAbrir();
    xferTrabajo(true);
    xferProgreso({ texto: 'Abriendo el archivo…' });
    Respaldo.leerPaquete(archivo, { alProgresar: xferProgreso }).then(function (p) {
      xferTrabajo(false);
      if (p.tipo !== 'evento') {
        xferEl('xferText').textContent = '';
        xferError('Este archivo es un respaldo completo, no un solo evento. Para restaurarlo entra a «Respaldo» desde el menú.');
        return;
      }
      xfer.paquete = p;
      var v = Respaldo.previsualizarImportacion(p);
      var r = p.resumen;
      xferEl('xferText').textContent = '«' + r.evento.nombre + '» · ' + textoPlural(r.sesiones, 'sesión', 'sesiones') + (r.conFotos ? (r.sesiones ? ' con sus fotos' : '') : ' (el archivo no trae fotos)') + ' · ' + textoPlural(r.plantillas, 'plantilla', 'plantillas') + ' · ' + Respaldo.formatearBytes(r.bytes) + (r.hojasContadas ? ' · ' + textoPlural(r.hojasContadas, 'hoja impresa', 'hojas impresas') + ' contadas para su límite' : '') + '. ' +
        (v.existe
          ? 'Ya hay un evento igual en este equipo: se agrega como copia nueva con el nombre «' + v.nombreFinal + '» y el que ya tienes no se toca.'
          : 'Se agrega a tu lista sin tocar nada de lo que ya tienes.');
      xferEl('xferNote').hidden = false;
      xferEl('xferAcceptBtn').disabled = false;
      xferEl('xferCancelBtn').disabled = false;
      xferEl('xferAcceptBtn').focus();
    }).catch(function (e) {
      xferEl('xferText').textContent = '';
      xferError(e.message);
    });
  }

  function hacerImportar() {
    if (!xfer.paquete) return;
    xferTrabajo(true);
    xferProgreso({ texto: 'Preparando…' });
    Respaldo.importarEvento(xfer.paquete, { alProgresar: xferProgreso }).then(function (r) {
      xferTrabajo(false);
      xferCerrar(false);
      eventos = AlmacenEventos.listar();
      conteo = null;
      seleccionarPestana(r.estado === 'en-curso' ? 'en-curso' : (r.estado === 'archivado' ? 'archivados' : 'proximos'));
      cargarDerivados();
      avisarEspacio();
      mostrarAviso('Evento importado: «' + r.nombre + '».' +
        (r.copia ? ' Ya tenías uno igual, así que entró como copia nueva y el que tenías no se tocó.' : '') +
        ' Trae ' + textoPlural(r.sesiones.sesionesAgregadas, 'sesión', 'sesiones') + (r.plantillas.agregadas ? ' y se agregaron ' + textoPlural(r.plantillas.agregadas, 'plantilla', 'plantillas') + ' al editor.' : '.'), 9000);
    }).catch(function (e) {
      xferError('No se pudo importar el evento y no se cambió nada. ' + e.message);
    });
  }

  xferEl('xferAcceptBtn').addEventListener('click', function () {
    if (xfer.trabajando) return;
    if (xfer.modo === 'exportar') hacerExportar();
    else if (xfer.modo === 'importar') hacerImportar();
  });
  xferEl('xferCancelBtn').addEventListener('click', function () { xferCerrar(true); });
  xferEl('xferOverlay').addEventListener('click', function (e) { if (e.target === this) xferCerrar(true); });

  // Teclado del cuadro: Escape lo cierra (salvo mientras trabaja); Tab y Shift+Tab giran entre sus controles.
  document.addEventListener('keydown', function (e) {
    var overlay = xferEl('xferOverlay');
    if (overlay.getAttribute('data-visible') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); xferCerrar(true); return; }
    if (e.key !== 'Tab') return;
    var controles = Array.prototype.filter.call(overlay.querySelectorAll('button, input'), function (b) { return !b.disabled && b.offsetParent !== null; });
    if (!controles.length) { e.preventDefault(); return; }
    var primero = controles[0], ultimo = controles[controles.length - 1];
    var dentro = overlay.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === primero || !dentro)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) { e.preventDefault(); primero.focus(); }
  });

  document.getElementById('importEventBtn').addEventListener('click', function () {
    if (!xfer.trabajando) document.getElementById('importInput').click();
  });
  document.getElementById('importInput').addEventListener('change', function () {
    var archivo = this.files && this.files[0];
    this.value = '';
    if (archivo) abrirImportar(archivo);
  });

  // Aviso discreto cuando queda poco espacio (80 % o más). No bloquea nada; lleva a Respaldo.
  function avisarEspacio() {
    if (typeof Respaldo === 'undefined') return;
    Respaldo.estadoEspacio().then(function (est) {
      document.getElementById('spaceNotice').hidden = !(est.disponible && est.porcentaje >= 80);
    }).catch(function () { /* sin dato: no se avisa */ });
  }

  /* ---------- Hoja "Próximamente" para accesos aún no construidos ---------- */

  var soonTextos = {
    camara: 'La cámara se elige por evento, desde la cabina: toca "Lanzar" en el evento y abre Ajustes › Cámara.',
    impresora: 'La impresora se configura dentro de la cabina: abre un evento, entra a Ajustes y elige Impresora.',
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

  // Si la lista queda desactualizada (se lanzó o terminó un evento desde la cabina, que es otra página u otra pestaña, o se volvió
  // con "atrás" y el navegador mostró la copia vieja), se vuelve a leer el estado real y las sesiones.
  function refrescarLista() {
    eventos = AlmacenEventos.listar();
    // Si hay un aviso abierto sobre un evento que ya no existe o cambió de estado, se cierra con una explicación
    // (la tarjeta de debajo se vuelve a dibujar y la acción ya no corresponde).
    if (eventoAConfirmar) {
      var vigente = eventos.filter(function (x) { return x.id === eventoAConfirmar.id; })[0];
      if (!vigente || vigente.estado !== eventoAConfirmar.estado) {
        cerrarConfirmacion(false);
        mostrarAviso(!vigente ? 'Ese evento ya no existe.' : 'Ese evento cambió en otra pestaña, así que se cerró el aviso. Revisa la lista e inténtalo de nuevo.');
      }
    }
    render();
    cargarDerivados();
    avisarEspacio();
  }

  window.addEventListener('storage', function (ev) {
    if (ev.key === null || ev.key === 'fotocabina-eventos') refrescarLista();
  });
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) refrescarLista(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refrescarLista(); });

  render();
  cargarDerivados();
  avisarEspacio();

  // Viene de "Terminar evento" en la cabina: se abre directo en Archivados con el aviso.
  (function () {
    var id = null;
    try { id = new URLSearchParams(window.location.search).get('terminado'); } catch (e) { id = null; }
    if (!id) return;
    try { window.history.replaceState(null, '', window.location.pathname); } catch (e) { /* sin historial */ }
    var e = eventos.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    if (e.estado === 'archivado') {
      seleccionarPestana('archivados');
      mostrarAviso('Evento terminado. Quedó en Archivados: lo puedes reabrir desde ahí.');
    }
  })();
})();

(function () {
  'use strict';

  // C2: crear y editar evento. Con `?editar=<id>` el mismo formulario edita un evento que ya existe:
  // conserva su id, estado, sesiones y copia congelada (solo se cambian los campos que se ven aquí).
  // La revisión del evento ("Así queda el evento") la hace el validador compartido
  // (shared/validador-evento.js): esta pantalla no repite ninguna de sus reglas.

  var TOPE_MAX = 99999;
  var COPIAS_BASE = [1, 2, 3, 4, 5];
  // Avisos del validador que dependen del hardware o del equipo, no de lo que se decide en este formulario.
  var CODIGOS_OCULTOS = ['CAMARA_NO_COMPROBADA', 'IMPRESORA_NO_COMPROBABLE', 'PIN_SIN_CREAR', 'EVENTO_ARCHIVADO'];

  var params = new URLSearchParams(window.location.search);
  var editarId = params.get('editar');
  var modoEdicion = !!editarId;
  var eventoOriginal = modoEdicion ? AlmacenEventos.obtener(editarId) : null;

  var form = document.getElementById('crearForm');
  var faltante = document.getElementById('crearMissing');
  var campoNombre = document.getElementById('campoNombre');
  var fNombre = document.getElementById('fNombre');
  var fFecha = document.getElementById('fFecha');
  var tImpresionAuto = document.getElementById('tImpresionAuto');
  var selectCopias = document.getElementById('selectCopias');
  var seccionImpresion = document.getElementById('seccionImpresion');
  var entregaOptions = document.getElementById('entregaOptions');
  var entregaHint = document.getElementById('entregaHint');
  var campoTope = document.getElementById('campoTope');
  var fTope = document.getElementById('fTope');
  var topeNoAplica = document.getElementById('topeNoAplica');
  var plantillaLista = document.getElementById('plantillaLista');
  var plantillaVacio = document.getElementById('plantillaVacio');
  var errorGuardado = document.getElementById('errorGuardado');
  var guardarBtn = document.getElementById('guardarBtn');

  // Estado del formulario
  var entregaActual = 'impresion';
  var copiasAuto = 1;
  var habilitadas = [];
  var porDefecto = null;
  var disponibles = undefined; // undefined = todavía no se leyeron; null = almacén ausente o dañado; arreglo = leídas
  var instantaneaInicial = '';
  var saliendo = false;
  var guardando = false;        // candado: un solo guardado a la vez (el botón queda deshabilitado)
  var eventoNuevo = null;       // en "crear": el evento ya armado, para que un reintento reutilice su id y no duplique
  var sello = eventoOriginal ? eventoOriginal.actualizadoEn : null; // versión del evento al abrir (para detectar cambios ajenos)
  var conflictoBox = document.getElementById('conflictoBox');
  var TEXTO_TOPE = 'Escribe un número entero entre 1 y 99999, o déjalo vacío.';
  var TEXTO_TOPE_AYUDA = 'Al llegar a este número no se imprime más y el evento sigue solo con entrega digital. Cada hoja cuenta, incluidas las copias adicionales. Déjalo vacío para no poner límite.';

  if (modoEdicion && !eventoOriginal) {
    form.hidden = true;
    faltante.hidden = false;
    document.title = 'FotoCabina — Editar evento';
    return;
  }

  // ---------- Textos y utilidades ----------

  var HINTS_ENTREGA = {
    impresion: 'Solo impresión: el invitado se lleva su tira impresa. En su pantalla no aparecen el QR ni las descargas.',
    digital: 'Solo digital: el invitado se lleva sus fotos por QR o descarga. La cabina no le ofrece imprimir.',
    ambos: 'Impresión y digital: el invitado puede imprimir y también llevarse sus fotos en el celular.',
  };

  function textoHojas(n) { return n + (n === 1 ? ' hoja' : ' hojas'); }

  function leerTope() {
    var crudo = fTope.value.trim();
    if (!crudo) return { vacio: true, valor: null, valido: true };
    var n = Number(crudo);
    var valido = isFinite(n) && Math.floor(n) === n && n >= 1 && n <= TOPE_MAX;
    return { vacio: false, valor: valido ? n : null, valido: valido };
  }

  // ---------- Entrega ----------

  function pintarEntrega() {
    entregaOptions.querySelectorAll('.entrega-opt').forEach(function (b) {
      b.setAttribute('aria-checked', b.dataset.value === entregaActual ? 'true' : 'false');
    });
    entregaHint.textContent = HINTS_ENTREGA[entregaActual] || '';
    // Solo digital no imprime: no se pregunta nada de impresión. El tope solo existe con entrega digital + impresión.
    seccionImpresion.hidden = entregaActual === 'digital';
    campoTope.hidden = entregaActual !== 'ambos';
    pintarTopeNoAplica();
  }

  // Fuera del modo "Ambos" el tope no se ofrece, pero si ya había uno se conserva (el validador lo ignora y avisa).
  function pintarTopeNoAplica() {
    var t = leerTope();
    var hayGuardado = t.valido && t.valor;
    topeNoAplica.hidden = entregaActual !== 'impresion';
    if (entregaActual === 'impresion') {
      topeNoAplica.textContent = hayGuardado
        ? 'El tope de ' + t.valor + ' hojas se conserva, pero no se aplica en solo impresión: el tope solo vale cuando el evento también entrega fotos digitales (modo "Ambos").'
        : 'El tope de impresiones solo se ofrece cuando el evento entrega también fotos digitales (modo "Ambos"), para que siempre haya una forma de llevarse la foto.';
    }
  }

  entregaOptions.addEventListener('click', function (e) {
    var btn = e.target.closest('.entrega-opt');
    if (!btn) return;
    entregaActual = btn.dataset.value;
    pintarEntrega();
    cambio();
  });

  // ---------- Impresión automática y copias ----------

  function ponerCopias(n) {
    copiasAuto = n;
    var menu = selectCopias.querySelector('.ds-select-menu');
    if (!menu.querySelector('[data-value="' + n + '"]')) {
      var li = document.createElement('li');
      li.className = 'ds-select-option';
      li.setAttribute('role', 'option');
      li.dataset.value = String(n);
      li.textContent = textoHojas(n);
      menu.appendChild(li);
    }
    menu.querySelectorAll('.ds-select-option').forEach(function (o) {
      o.setAttribute('aria-selected', o.dataset.value === String(n) ? 'true' : 'false');
    });
    selectCopias.querySelector('.ds-select-value').textContent = textoHojas(n);
  }

  function ponerImpresionAuto(on) {
    tImpresionAuto.setAttribute('aria-checked', on ? 'true' : 'false');
    selectCopias.hidden = !on;
  }

  function initImpresion() {
    var trigger = selectCopias.querySelector('.ds-select-trigger');
    var menu = selectCopias.querySelector('.ds-select-menu');
    function cerrar() {
      selectCopias.classList.remove('is-open');
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
    tImpresionAuto.addEventListener('click', function () {
      var on = tImpresionAuto.getAttribute('aria-checked') !== 'true';
      ponerImpresionAuto(on);
      if (!on) cerrar();
      cambio();
    });
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (selectCopias.classList.contains('is-open')) { cerrar(); return; }
      selectCopias.classList.add('is-open');
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    });
    menu.addEventListener('click', function (e) {
      var opt = e.target.closest('.ds-select-option');
      if (!opt) return;
      ponerCopias(parseInt(opt.dataset.value, 10) || 1);
      cerrar();
      cambio();
    });
    document.addEventListener('click', cerrar);
  }

  function limpiarErrorTope() {
    campoTope.classList.remove('ds-field--error');
    fTope.setAttribute('aria-invalid', 'false');
    document.getElementById('topeHelp').textContent = TEXTO_TOPE_AYUDA;
  }
  function marcarErrorTope() {
    campoTope.classList.add('ds-field--error');
    fTope.setAttribute('aria-invalid', 'true');
    document.getElementById('topeHelp').textContent = TEXTO_TOPE;
  }

  fTope.addEventListener('input', function () {
    limpiarErrorTope();
    pintarTopeNoAplica();
    cambio();
  });

  // ---------- Plantillas habilitadas ----------

  var ICONO_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';

  function enPulgadas(mm) { return String(Math.round((mm / 25.4) * 10) / 10).replace('.', ','); }

  // { id, nombre, meta, usable, existe } por cada fila: las plantillas del editor y las que el evento
  // tiene habilitadas pero ya no existen (para poder quitarlas).
  function filasDePlantillas() {
    var filas = [];
    var vistos = {};
    (Array.isArray(disponibles) ? disponibles : []).forEach(function (p) {
      var v = MotorPlantillas.validarPlantilla(p);
      var meta;
      if (v.valida) {
        var n = MotorPlantillas.contarFotos(p);
        meta = n + (n === 1 ? ' foto' : ' fotos') + ' · ' + enPulgadas(p.papel.anchoMm) + ' × ' + enPulgadas(p.papel.altoMm) + ' in';
      } else {
        meta = 'No se puede usar: ábrela en el editor para arreglarla.';
      }
      filas.push({ id: p.id, nombre: p.nombre || 'Plantilla', meta: meta, usable: v.valida, existe: true });
      vistos[p.id] = true;
    });
    habilitadas.forEach(function (id) {
      if (vistos[id]) return;
      filas.push({
        id: id,
        nombre: 'Plantilla no encontrada',
        meta: disponibles === null ? 'No se pudieron leer las plantillas del editor.' : 'Ya no existe en el editor. Quítala o elige otra.',
        usable: false,
        existe: false,
      });
    });
    return filas;
  }

  function pintarPlantillas() {
    var filas = disponibles === undefined ? [] : filasDePlantillas();
    plantillaLista.textContent = '';
    plantillaVacio.hidden = !(disponibles !== undefined && filas.length === 0);
    plantillaLista.hidden = filas.length === 0;
    filas.forEach(function (f) {
      var activa = habilitadas.indexOf(f.id) !== -1;
      var esDefecto = activa && porDefecto === f.id;
      var li = document.createElement('li');
      li.className = 'plantilla-fila' + (activa ? ' is-activa' : '') + (f.usable || !activa ? '' : ' is-problema');
      li.dataset.id = f.id;

      var check = document.createElement('button');
      check.type = 'button';
      check.className = 'plantilla-check';
      check.setAttribute('role', 'checkbox');
      check.setAttribute('aria-checked', activa ? 'true' : 'false');
      check.setAttribute('aria-label', 'Habilitar la plantilla ' + f.nombre);
      check.dataset.accion = 'habilitar';
      check.disabled = !activa && !f.usable;
      check.innerHTML = ICONO_CHECK;

      var info = document.createElement('div');
      info.className = 'plantilla-info';
      var nombre = document.createElement('span');
      nombre.className = 'plantilla-nombre';
      nombre.textContent = f.nombre;
      var meta = document.createElement('span');
      meta.className = 'plantilla-meta';
      meta.textContent = f.meta;
      info.appendChild(nombre);
      info.appendChild(meta);

      var defecto = document.createElement('button');
      defecto.type = 'button';
      defecto.className = 'plantilla-defecto';
      defecto.setAttribute('role', 'radio');
      defecto.setAttribute('aria-checked', esDefecto ? 'true' : 'false');
      defecto.setAttribute('aria-label', 'Usar ' + f.nombre + ' por defecto');
      defecto.dataset.accion = 'defecto';
      defecto.disabled = !activa || !f.usable;
      defecto.textContent = esDefecto ? 'Por defecto' : 'Usar por defecto';

      li.appendChild(check);
      li.appendChild(info);
      li.appendChild(defecto);
      plantillaLista.appendChild(li);
    });
  }

  plantillaLista.addEventListener('click', function (e) {
    var boton = e.target.closest('button[data-accion]');
    if (!boton || boton.disabled) return;
    var id = boton.closest('.plantilla-fila').dataset.id;
    if (boton.dataset.accion === 'habilitar') {
      var i = habilitadas.indexOf(id);
      if (i !== -1) {
        habilitadas.splice(i, 1);
        if (porDefecto === id) porDefecto = habilitadas[0] || null;
      } else {
        habilitadas.push(id);
        if (!porDefecto) porDefecto = id;
      }
    } else if (habilitadas.indexOf(id) !== -1) {
      porDefecto = id;
    }
    pintarPlantillas();
    cambio();
  });

  // ---------- Revisión del evento (la hace el validador) ----------

  function aplicarFormulario(ev) {
    var nombre = fNombre.value.trim();
    ev.nombre = nombre || ev.nombre || 'Evento sin nombre';
    ev.fecha = fFecha.value || ev.fecha || new Date().toISOString().slice(0, 10);
    var entrega = Object.assign({}, ev.entrega, {
      modo: entregaActual,
      copias: copiasAuto,
      impresionAuto: tImpresionAuto.getAttribute('aria-checked') === 'true',
    });
    var tope = leerTope();
    // El tope se conserva aunque el modo no lo use (el validador lo ignora y avisa); un valor inválido no se guarda.
    if (tope.valido && tope.valor) entrega.topeHojas = tope.valor;
    else if (entregaActual === 'ambos' || tope.vacio) delete entrega.topeHojas;
    ev.entrega = entrega;
    ev.plantillas = { habilitadas: habilitadas.slice(), porDefecto: porDefecto };
    return ev;
  }

  // Evento tal como quedaría si se guardara ahora (sin guardarlo). En edición parte del evento real, para que
  // el validador vea también su ritmo, estado y copia congelada.
  function eventoBorrador() {
    var base = modoEdicion ? AlmacenEventos.obtener(editarId) : (eventoNuevo || AlmacenEventos.crear({ nombre: 'Evento nuevo' }));
    return base ? aplicarFormulario(base) : null;
  }

  function plantillaParaValidar() {
    if (!porDefecto) return null;
    if (disponibles === null) return ValidadorEvento.ILEGIBLE;
    var hallada = (disponibles || []).filter(function (p) { return p.id === porDefecto; })[0];
    return hallada || null;
  }

  function actualizarResumen() {
    var texto = document.getElementById('resumenTexto');
    var ritmo = document.getElementById('resumenRitmo');
    var notas = document.getElementById('resumenNotas');
    notas.textContent = '';
    if (disponibles === undefined || typeof ValidadorEvento === 'undefined') return;
    var ev = eventoBorrador();
    if (!ev) { texto.textContent = 'No se pudo calcular el resumen.'; ritmo.hidden = true; return; }
    var res = ValidadorEvento.validar({ evento: ev, plantilla: plantillaParaValidar(), vivo: { camaras: null, impresora: null, espacioLibreMB: null } });
    texto.textContent = res.configuracion.resumen;
    if (res.ritmo.disponible) {
      ritmo.hidden = false;
      ritmo.textContent = '≈ ' + res.ritmo.segundosPorSesion + ' s por sesión · ≈ ' + res.ritmo.sesionesPorHora + ' sesiones por hora';
    } else {
      ritmo.hidden = true;
    }
    if (tieneCongelado()) {
      var sinDefecto = !porDefecto;
      var noDisponible = porDefecto && (disponibles === null || !(disponibles || []).some(function (p) { return p.id === porDefecto && MotorPlantillas.validarPlantilla(p).valida; }));
      if (sinDefecto || noDisponible) {
        var li0 = document.createElement('li');
        li0.className = 'resumen-nota resumen-nota--bloqueo';
        li0.textContent = sinDefecto
          ? 'Este evento ya se lanzó: sin plantilla no se podrá guardar. Marca una y déjala por defecto.'
          : 'Atención: la plantilla por defecto no se puede leer o está dañada. Este evento ya se lanzó, así que la cabina seguirá con la copia guardada al lanzarlo y no con tu elección.';
        notas.appendChild(li0);
      }
    }
    res.bloqueos.concat(res.avisos).filter(function (n) { return CODIGOS_OCULTOS.indexOf(n.codigo) === -1; }).forEach(function (n) {
      var li = document.createElement('li');
      li.className = 'resumen-nota resumen-nota--' + n.gravedad;
      li.textContent = n.mensaje;
      notas.appendChild(li);
    });
  }

  // ---------- Cambios sin guardar ----------

  function instantanea() {
    return JSON.stringify([fNombre.value.trim(), fFecha.value, entregaActual, copiasAuto,
      tImpresionAuto.getAttribute('aria-checked'), fTope.value.trim(), habilitadas, porDefecto]);
  }

  function hayCambios() { return instantanea() !== instantaneaInicial; }

  function cambio() {
    errorGuardado.hidden = true;
    actualizarResumen();
  }

  var destinoSalida = null;
  var salirOverlay = document.getElementById('salirOverlay');
  var salirSeguir = document.getElementById('salirSeguirBtn');
  var salirSalir = document.getElementById('salirSalirBtn');
  var focoPrevio = null;

  function abrirSalir() {
    focoPrevio = document.activeElement;
    salirOverlay.setAttribute('data-visible', 'true');
    salirSeguir.focus();
  }
  function cerrarSalir() {
    salirOverlay.setAttribute('data-visible', 'false');
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  function pedirSalida(e) {
    if (saliendo || !hayCambios()) return;
    e.preventDefault();
    destinoSalida = e.currentTarget.getAttribute('href');
    abrirSalir();
  }
  document.getElementById('backLink').addEventListener('click', pedirSalida);
  document.getElementById('cancelarBtn').addEventListener('click', pedirSalida);
  salirSeguir.addEventListener('click', cerrarSalir);
  salirSalir.addEventListener('click', function () {
    saliendo = true;
    window.location.href = destinoSalida || '../04-lista-eventos/index.html';
  });
  // Escape cierra el aviso y Tab no sale de sus dos botones (foco atrapado).
  document.addEventListener('keydown', function (e) {
    if (salirOverlay.getAttribute('data-visible') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); cerrarSalir(); return; }
    if (e.key === 'Tab') {
      var primero = salirSeguir, ultimo = salirSalir;
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      else if (document.activeElement !== primero && document.activeElement !== ultimo) { e.preventDefault(); primero.focus(); }
    }
  });
  window.addEventListener('beforeunload', function (e) {
    // Solo si la persona ya tocó la página: sin interacción el navegador ignora el aviso y deja un error en consola.
    if (saliendo || !hayCambios() || !(navigator.userActivation && navigator.userActivation.hasBeenActive)) return;
    e.preventDefault();
    e.returnValue = '';
  });

  // ---------- Nombre ----------

  function mostrarErrorNombre(mensaje) {
    campoNombre.classList.add('ds-field--error');
    campoNombre.querySelector('.ds-field-help').textContent = mensaje;
  }

  function limpiarErrorNombre() {
    campoNombre.classList.remove('ds-field--error');
    campoNombre.querySelector('.ds-field-help').textContent = 'Ponle un nombre que lo distinga del resto en la lista.';
  }

  fNombre.addEventListener('input', function () { limpiarErrorNombre(); cambio(); });
  fFecha.addEventListener('input', cambio);

  // ---------- Guardar (crear o editar, y volver a la lista en un solo paso) ----------

  function mostrarErrorGeneral(mensaje) {
    errorGuardado.textContent = mensaje;
    errorGuardado.hidden = false;
  }

  function tieneCongelado() {
    return modoEdicion && !!(eventoOriginal && eventoOriginal.congelado);
  }

  function bloquear(si) {
    guardando = si;
    guardarBtn.disabled = si;
    guardarBtn.setAttribute('aria-busy', si ? 'true' : 'false');
  }

  function guardarAhora(ignorarCambioAjeno) {
    if (guardando) return;
    bloquear(true);
    var nombre = fNombre.value.trim();
    if (!nombre) {
      mostrarErrorNombre('Escribe un nombre para el evento.');
      fNombre.focus();
      bloquear(false);
      return;
    }
    if (entregaActual === 'ambos' && !leerTope().valido) {
      marcarErrorTope();
      fTope.focus();
      bloquear(false);
      return;
    }
    // Un evento que ya se lanzó no puede quedarse sin plantilla: la cabina lo abriría sin saber con cuál seguir.
    if (tieneCongelado() && !porDefecto) {
      mostrarErrorGeneral('Este evento ya se lanzó y necesita una plantilla: marca al menos una (y déjala por defecto) antes de guardar.');
      bloquear(false);
      return;
    }

    var evento;
    if (modoEdicion) {
      // Se relee el evento al guardar: así no se pisa nada que otra pantalla haya cambiado mientras tanto.
      evento = AlmacenEventos.obtener(editarId);
      if (!evento) { mostrarErrorGeneral('Este evento ya no existe: puede que se haya eliminado desde otra pestaña. Vuelve a la lista.'); bloquear(false); return; }
      if (!ignorarCambioAjeno && evento.actualizadoEn !== sello) {
        // Cambió desde que se abrió el formulario (cabina, otra pestaña): se deja elegir en vez de pisarlo.
        conflictoBox.hidden = false;
        conflictoBox.scrollIntoView({ block: 'nearest' });
        bloquear(false);
        return;
      }
      aplicarFormulario(evento);
    } else {
      // Se crea una sola vez: si el guardado falla y se reintenta, se reutiliza el mismo evento (mismo id), sin duplicar.
      if (!eventoNuevo) eventoNuevo = AlmacenEventos.crear({ nombre: nombre, fecha: fFecha.value || new Date().toISOString().slice(0, 10) });
      evento = eventoNuevo;
      aplicarFormulario(evento);
    }

    AlmacenEventos.guardar(evento);
    var errGuardado = AlmacenEventos.errorDeGuardado();
    if (errGuardado) { mostrarErrorGeneral(errGuardado.mensaje); bloquear(false); return; }
    saliendo = true;
    window.location.href = '../04-lista-eventos/index.html';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    conflictoBox.hidden = true;
    guardarAhora(false);
  });
  document.getElementById('conflictoRecargarBtn').addEventListener('click', function () {
    saliendo = true;
    window.location.reload();
  });
  document.getElementById('conflictoGuardarBtn').addEventListener('click', function () {
    conflictoBox.hidden = true;
    guardarAhora(true);
  });

  // ---------- Arranque ----------

  function precargar() {
    if (modoEdicion) {
      var e = eventoOriginal;
      document.title = 'FotoCabina — Editar evento';
      document.getElementById('formTitulo').textContent = 'Editar evento';
      document.getElementById('formSub').textContent = 'Cambia lo que necesites. El evento conserva su historial de sesiones y su estado.';
      document.getElementById('guardarTexto').textContent = 'Guardar cambios';
      document.getElementById('avisoEnCurso').hidden = e.estado !== 'en-curso';
      fNombre.value = e.nombre;
      fFecha.value = e.fecha;
      entregaActual = e.entrega.modo;
      ponerCopias(e.entrega.copias);
      ponerImpresionAuto(e.entrega.impresionAuto === true);
      if (e.entrega.topeHojas) fTope.value = String(e.entrega.topeHojas);
      sello = e.actualizadoEn;
      habilitadas = (e.plantillas.habilitadas || []).slice();
      porDefecto = e.plantillas.porDefecto || null;
    } else {
      fFecha.value = new Date().toISOString().slice(0, 10);
    }
    pintarEntrega();
    initImpresion();
    instantaneaInicial = instantanea();
  }

  precargar();
  pintarPlantillas();

  // Las plantillas viven en el almacén del editor; se leen con el lector compartido (solo lectura).
  var lectura = (typeof AlmacenPlantillas !== 'undefined' && typeof MotorPlantillas !== 'undefined')
    ? AlmacenPlantillas.listar().catch(function () { return null; })
    : Promise.resolve(null);
  lectura.then(function (lista) {
    disponibles = lista;
    pintarPlantillas();
    actualizarResumen();
  });
})();

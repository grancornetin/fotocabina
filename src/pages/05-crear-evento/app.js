(function () {
  'use strict';

  // Plantillas guardadas en el editor viven en su propio localStorage
  // (03-editor-plantillas/estado.js, clave "fotocabina-editor-v1"). Esta pantalla no carga
  // todo el editor solo para listar nombres: lee ese almacén directo, mismo criterio liviano
  // que ya usa el resto del proyecto para no depender de módulos pesados innecesarios.
  var CLAVE_EDITOR = 'fotocabina-editor-v1';

  function listarPlantillasDelEditor() {
    try {
      var datos = JSON.parse(localStorage.getItem(CLAVE_EDITOR) || '{}');
      return (datos.plantillas || []).map(function (p) {
        return { id: p.id, nombre: p.nombre || 'Plantilla' };
      });
    } catch (e) {
      return [];
    }
  }

  var form = document.getElementById('crearForm');
  var campoNombre = document.getElementById('campoNombre');
  var fNombre = document.getElementById('fNombre');
  var fFecha = document.getElementById('fFecha');
  var tImpresionAuto = document.getElementById('tImpresionAuto');
  var selectCopias = document.getElementById('selectCopias');
  var copiasAuto = 1;
  var entregaOptions = document.getElementById('entregaOptions');
  var plantillaHint = document.getElementById('plantillaHint');

  var entregaActual = 'impresion';
  var plantillaElegida = null; // { id, nombre } o null = "Elegir después"

  // ---------- Selector de plantilla ----------

  function initSelectPlantilla() {
    var select = document.getElementById('selectPlantilla');
    var trigger = select.querySelector('.ds-select-trigger');
    var value = select.querySelector('.ds-select-value');
    var menu = select.querySelector('.ds-select-menu');

    var plantillas = listarPlantillasDelEditor();
    menu.innerHTML = '<li class="ds-select-option" role="option" data-value="" aria-selected="true">Elegir después</li>';
    plantillas.forEach(function (p) {
      var li = document.createElement('li');
      li.className = 'ds-select-option';
      li.setAttribute('role', 'option');
      li.dataset.value = p.id;
      li.textContent = p.nombre;
      menu.appendChild(li);
    });

    if (!plantillas.length) {
      plantillaHint.textContent = 'Todavía no tienes plantillas guardadas en el editor. Puedes crear el evento igual y asignarle una plantilla después.';
    }

    function cerrar() {
      select.classList.remove('is-open');
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
    function abrir() {
      select.classList.add('is-open');
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (select.classList.contains('is-open')) cerrar(); else abrir();
    });

    menu.addEventListener('click', function (e) {
      var opt = e.target.closest('.ds-select-option');
      if (!opt) return;
      menu.querySelectorAll('.ds-select-option').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      opt.setAttribute('aria-selected', 'true');
      value.textContent = opt.textContent;
      plantillaElegida = opt.dataset.value ? { id: opt.dataset.value, nombre: opt.textContent } : null;
      cerrar();
    });

    document.addEventListener('click', cerrar);
  }

  // ---------- Impresión automática y copias ----------

  function initImpresion() {
    var trigger = selectCopias.querySelector('.ds-select-trigger');
    var value = selectCopias.querySelector('.ds-select-value');
    var menu = selectCopias.querySelector('.ds-select-menu');
    function cerrar() {
      selectCopias.classList.remove('is-open');
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
    tImpresionAuto.addEventListener('click', function () {
      var on = tImpresionAuto.getAttribute('aria-checked') !== 'true';
      tImpresionAuto.setAttribute('aria-checked', on ? 'true' : 'false');
      selectCopias.hidden = !on;
      if (!on) cerrar();
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
      menu.querySelectorAll('.ds-select-option').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      opt.setAttribute('aria-selected', 'true');
      value.textContent = opt.textContent;
      copiasAuto = parseInt(opt.dataset.value, 10) || 1;
      cerrar();
    });
    document.addEventListener('click', cerrar);
  }

  // ---------- Modo de entrega ----------

  entregaOptions.addEventListener('click', function (e) {
    var btn = e.target.closest('.entrega-opt');
    if (!btn) return;
    entregaOptions.querySelectorAll('.entrega-opt').forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
    btn.setAttribute('aria-checked', 'true');
    entregaActual = btn.dataset.value;
  });

  // ---------- Guardar (crear evento y volver a la lista en un solo paso) ----------

  function mostrarErrorNombre(mensaje) {
    campoNombre.classList.add('ds-field--error');
    var help = campoNombre.querySelector('.ds-field-help');
    help.textContent = mensaje;
  }

  function limpiarErrorNombre() {
    campoNombre.classList.remove('ds-field--error');
    campoNombre.querySelector('.ds-field-help').textContent = 'Ponle un nombre que lo distinga del resto en la lista.';
  }

  fNombre.addEventListener('input', limpiarErrorNombre);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = fNombre.value.trim();
    if (!nombre) {
      mostrarErrorNombre('Escribe un nombre para el evento.');
      fNombre.focus();
      return;
    }

    // Evento nuevo en el formato v2: id estable de texto, entrega ({ modo, copias, impresionAuto })
    // y plantilla elegida (si no, queda sin plantilla y "Lanzar" se bloquea hasta asignarle una).
    var evento = AlmacenEventos.crear({
      nombre: nombre,
      fecha: fFecha.value || new Date().toISOString().slice(0, 10),
      plantillaId: plantillaElegida ? plantillaElegida.id : null,
      entrega: {
        modo: entregaActual,
        copias: copiasAuto,
        impresionAuto: tImpresionAuto.getAttribute('aria-checked') === 'true',
      },
    });

    AlmacenEventos.guardar(evento);
    var errGuardado = AlmacenEventos.errorDeGuardado();
    if (errGuardado) { mostrarErrorNombre(errGuardado.mensaje); return; }
    window.location.href = '../04-lista-eventos/index.html';
  });

  initSelectPlantilla();
  initImpresion();
})();

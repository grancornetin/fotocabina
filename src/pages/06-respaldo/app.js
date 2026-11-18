(function () {
  'use strict';

  // Respaldo y restauración (hito 1.6). Toda la lógica vive en shared/respaldo.js: esta pantalla solo pide y muestra.
  // Regla de la pantalla: el único botón lima es "Crear respaldo"; restaurar es secundario y el rojo solo se usa en "Reemplazar todo".

  const $ = (id) => document.getElementById(id);
  const R = window.Respaldo;

  let paquete = null;        // el archivo ya leído y validado
  let ocupado = false;       // una sola tarea a la vez
  let vistaModo = null;      // resultado de previsualizar() para el modo elegido
  let focoOrigen = null;

  /* ---------- Tema (el mismo que eligió el operador en la lista) ---------- */

  (function aplicarTema() {
    let modo = 'system';
    try { modo = localStorage.getItem('fotocabina-tema') || 'system'; } catch (e) { /* sin almacenamiento */ }
    if (modo === 'dark' || modo === 'light') document.documentElement.setAttribute('data-theme', modo);
  })();

  /* ---------- Utilidades ---------- */

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function fechaLarga(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function porcentaje(p) {
    if (p > 0 && p < 0.1) return 'menos de 0,1';
    return p.toLocaleString('es-CL', { maximumFractionDigits: p < 10 ? 1 : 0 });
  }

  function mostrar(el, texto) {
    el.textContent = texto || '';
    el.hidden = !texto;
  }

  function pintarBarra(barra, hecho, total) {
    const relleno = barra.firstElementChild;
    if (total > 0) {
      barra.classList.remove('is-indeterminada');
      relleno.style.width = Math.max(2, Math.min(100, (hecho / total) * 100)) + '%';
    } else {
      barra.classList.add('is-indeterminada');
      relleno.style.width = '';
    }
  }

  function progresoEn(contenedor, texto, barra) {
    return function (p) {
      contenedor.hidden = false;
      texto.textContent = p.texto || '';
      pintarBarra(barra, p.hecho || 0, p.total || 0);
    };
  }

  function bloquearSalida(activo) {
    ocupado = activo;
    window.onbeforeunload = activo ? function (e) { e.preventDefault(); e.returnValue = ''; return ''; } : null;
  }

  /* ---------- Espacio ---------- */

  async function pintarEspacio() {
    const est = await R.estadoEspacio();
    const barra = $('espacioBarra');
    if (est.disponible) {
      $('espacioTexto').textContent = 'Espacio usado ' + R.formatearBytes(est.usado) + ' de ' + R.formatearBytes(est.cuota) + ' (' + porcentaje(est.porcentaje) + ' %)';
      barra.hidden = false;
      barra.setAttribute('data-nivel', est.nivel);
      barra.setAttribute('aria-valuenow', String(Math.round(est.porcentaje)));
      barra.firstElementChild.style.width = Math.max(est.porcentaje > 0 ? 1 : 0, Math.min(100, est.porcentaje)) + '%';
    } else {
      $('espacioTexto').textContent = 'Este navegador no informa cuánto espacio queda, así que no podemos mostrarlo.';
      barra.hidden = true;
    }
    let persistente = 'No se pudo saber si el navegador protege los datos de FotoCabina.';
    if (est.persistente === true) persistente = 'El navegador protege los datos de FotoCabina: no los borra solo cuando falta espacio.';
    else if (est.persistente === false) persistente = 'El navegador podría borrar los datos de FotoCabina si el equipo se queda sin espacio. Por eso conviene tener un respaldo.';
    $('espacioPersistente').textContent = persistente;
    $('espacioAviso').hidden = !(est.disponible && (est.nivel === 'aviso' || est.nivel === 'critico'));
  }

  /* ---------- Crear respaldo ---------- */

  function pintarUltimo() {
    const iso = R.ultimoRespaldo();
    $('ultimoRespaldo').textContent = iso
      ? 'Último respaldo: ' + fechaLarga(iso)
      : 'Todavía no has hecho ningún respaldo en este equipo.';
  }

  function habilitarBotones(si) {
    ['crearBtn', 'elegirBtn', 'restaurarBtn'].forEach(function (id) { $(id).disabled = !si; });
    $('fotosCheck').disabled = !si;
  }

  async function crearRespaldo() {
    if (ocupado) return;
    bloquearSalida(true);
    habilitarBotones(false);
    mostrar($('crearMensaje'), '');
    mostrar($('crearAdvertencia'), '');
    $('crearMensaje').className = 'resp-msg';
    const pintar = progresoEn($('crearProgreso'), $('crearProgresoTexto'), $('crearProgresoBarra'));
    pintar({ texto: 'Preparando…' });
    try {
      const r = await R.crearRespaldo({ conFotos: $('fotosCheck').checked, alProgresar: pintar });
      R.descargar(r.blob, r.nombre, { registrar: true });
      const incompleto = r.advertencias && r.advertencias.length;
      if (incompleto) mostrar($('crearAdvertencia'), 'Atención: este respaldo está INCOMPLETO. ' + r.advertencias.map(function (x) { return x.mensaje; }).join(' ') + ' Revisa esos datos antes de confiar en este archivo; no se perdió nada de lo que quedó en el equipo.');
      $('crearMensaje').textContent = (incompleto ? 'Se descargó «' : 'Listo: se descargó «') + r.nombre + '» (' + R.formatearBytes(r.blob.size) + ', con ' + plural(r.resumen.eventos, 'evento', 'eventos') + ', ' + plural(r.resumen.plantillas, 'plantilla', 'plantillas') + ' y ' + plural(r.resumen.sesiones, 'sesión', 'sesiones') + '). Guárdalo fuera de este computador, por ejemplo en un pendrive.';
      $('crearMensaje').hidden = false;
      pintarUltimo();
    } catch (e) {
      $('crearMensaje').textContent = (e.codigo === 'VACIO' || e.codigo === 'ILEGIBLE') ? e.message : 'No se pudo crear el respaldo. ' + e.message;
      $('crearMensaje').className = e.codigo === 'VACIO' ? 'resp-msg' : 'resp-error';
      $('crearMensaje').hidden = false;
    } finally {
      $('crearProgreso').hidden = true;
      bloquearSalida(false);
      habilitarBotones(true);
      pintarEspacio();
    }
  }

  /* ---------- Elegir y revisar un archivo ---------- */

  function modoElegido() {
    return document.querySelector('input[name="modo"]:checked').value;
  }

  function fila(nombre, respaldo, hoy) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = nombre;
    const a = document.createElement('td');
    a.textContent = respaldo;
    const b = document.createElement('td');
    b.textContent = hoy;
    tr.appendChild(th);
    tr.appendChild(a);
    tr.appendChild(b);
    return tr;
  }

  async function pintarModo() {
    if (!paquete) return;
    const modo = modoElegido();
    $('modoPrevio').textContent = 'Calculando…';
    mostrar($('modoEspacio'), '');
    $('restaurarBtn').disabled = true;
    let vista;
    try {
      vista = await R.previsualizar(paquete, modo);
    } catch (e) {
      $('modoPrevio').textContent = '';
      mostrar($('modoEspacio'), 'No se pudo comparar con lo que hay hoy. ' + e.message);
      return;
    }
    if (modo !== modoElegido()) return; // el operador ya cambió de opción
    vistaModo = vista;
    const a = vista.actual;
    if (modo === 'sumar') {
      let t = 'Se agregarían ' + plural(vista.eventos.nuevos, 'evento', 'eventos') + ', ' + plural(vista.plantillas.nuevos, 'plantilla', 'plantillas') + ' y ' + plural(vista.sesiones.nuevos, 'sesión', 'sesiones') + '.';
      const ya = vista.eventos.existentes + vista.plantillas.existentes + vista.sesiones.existentes;
      if (ya) t += ' Ya existen ' + plural(vista.eventos.existentes, 'evento', 'eventos') + ', ' + plural(vista.plantillas.existentes, 'plantilla', 'plantillas') + ' y ' + plural(vista.sesiones.existentes, 'sesión', 'sesiones') + ': se dejan como están.';
      $('modoPrevio').textContent = t;
    } else {
      $('modoPrevio').textContent = 'Se borrarían ' + plural(a.eventos, 'evento', 'eventos') + ', ' + plural(a.plantillas, 'plantilla', 'plantillas') + ' y ' + plural(a.sesiones, 'sesión', 'sesiones') + ' de este equipo, y quedaría exactamente lo del respaldo.';
    }
    if (!vista.espacio.cabe) {
      mostrar($('modoEspacio'), 'No hay espacio suficiente para restaurar así: hacen falta ' + R.formatearBytes(vista.espacio.necesario) + ' y quedan ' + R.formatearBytes(vista.espacio.libre) + ' libres. Libera espacio o elige un respaldo sin fotos.');
    } else if (!vista.espacio.comprobado) {
      $('modoPrevio').textContent += ' El navegador no informa el espacio libre, así que no se pudo comprobar de antemano; si no cabe, no se cambia nada.';
    }
    $('restaurarBtn').disabled = !vista.espacio.cabe;
  }

  async function pintarResumen() {
    const s = paquete.resumen;
    const a = await R.resumenActual();
    $('resumenFecha').textContent = 'Creado el ' + fechaLarga(s.fecha) + ' · ' + (s.conFotos ? 'incluye las fotos de los invitados' : 'no incluye fotos ni sesiones');
    const filas = $('resumenFilas');
    filas.textContent = '';
    filas.appendChild(fila('Eventos', String(s.eventos), String(a.eventos)));
    filas.appendChild(fila('Plantillas', String(s.plantillas), String(a.plantillas)));
    filas.appendChild(fila('Sesiones', String(s.sesiones), String(a.sesiones)));
    filas.appendChild(fila('Fotos', String(s.fotos), String(a.fotos)));
    const pesoFotos = paquete.datos.archivos.reduce(function (suma, x) { return suma + x.tamano; }, 0);
    filas.appendChild(fila('Peso de las fotos', R.formatearBytes(pesoFotos), R.formatearBytes(a.bytes)));
    $('restResumen').hidden = false;
  }

  async function elegirArchivo(archivo) {
    if (!archivo || ocupado) return;
    bloquearSalida(true);
    habilitarBotones(false);
    paquete = null;
    vistaModo = null;
    $('restResumen').hidden = true;
    $('restResultado').hidden = true;
    mostrar($('restError'), '');
    mostrar($('restInfo'), '');
    const pintar = progresoEn($('leerProgreso'), $('leerProgresoTexto'), $('leerProgresoBarra'));
    pintar({ texto: 'Abriendo el archivo…' });
    try {
      const p = await R.leerPaquete(archivo, { alProgresar: pintar });
      if (p.tipo === 'evento') {
        mostrar($('restInfo'), 'Este archivo es de un solo evento («' + p.resumen.evento.nombre + '»), no un respaldo completo. Para agregarlo usa «Importar evento» en la lista de Eventos.');
      } else {
        paquete = p;
        await pintarResumen();
      }
    } catch (e) {
      mostrar($('restError'), e.message);
    } finally {
      $('leerProgreso').hidden = true;
      bloquearSalida(false);
      habilitarBotones(true);
      if (paquete) await pintarModo();
    }
  }

  /* ---------- Cuadro de confirmación ---------- */

  let trabajando = false;
  let respaldadoAhora = false;

  function abrirDialogo() {
    focoOrigen = document.activeElement;
    $('dlgOverlay').setAttribute('data-visible', 'true');
    $('dlgCancelarBtn').focus();
  }

  function cerrarDialogo(devolverFoco) {
    if (trabajando) return;
    $('dlgOverlay').setAttribute('data-visible', 'false');
    if (devolverFoco !== false && focoOrigen && focoOrigen.isConnected) { try { focoOrigen.focus(); } catch (e) { /* sin foco */ } }
    focoOrigen = null;
  }

  function dialogoBotones(activos) {
    ['dlgAceptarBtn', 'dlgCancelarBtn', 'dlgRespaldarBtn'].forEach(function (id) { $(id).disabled = !activos; });
  }

  function pedirConfirmacion() {
    if (!paquete || ocupado) return;
    const modo = modoElegido();
    const v = vistaModo && vistaModo.modo === modo ? vistaModo : null;
    respaldadoAhora = false;
    mostrar($('dlgError'), '');
    mostrar($('dlgRespaldado'), '');
    $('dlgProgreso').hidden = true;
    $('dlgAviso').hidden = false;
    $('dlgCancelarBtn').textContent = 'Cancelar';
    const aceptar = $('dlgAceptarBtn');
    aceptar.hidden = false;
    aceptar.disabled = false;
    $('dlgCancelarBtn').disabled = false;
    if (modo === 'reemplazar') {
      const a = v ? v.actual : { eventos: 0, plantillas: 0, sesiones: 0 };
      $('dlgTitulo').textContent = 'Reemplazar todo';
      $('dlgTexto').textContent = 'Se borra TODO lo que hay en este equipo (' + plural(a.eventos, 'evento', 'eventos') + ', ' + plural(a.plantillas, 'plantilla', 'plantillas') + ' y ' + plural(a.sesiones, 'sesión', 'sesiones') + ' con sus fotos) y queda exactamente lo del respaldo. Esto no se puede deshacer. Si quieres conservar lo de ahora, haz primero un respaldo.';
      aceptar.textContent = 'Reemplazar todo';
      aceptar.className = 'ds-btn ds-btn--destructive ds-btn--compact';
      $('dlgRespaldarBtn').hidden = false;
      $('dlgRespaldarBtn').disabled = false;
    } else {
      $('dlgTitulo').textContent = 'Sumar a lo que ya tengo';
      $('dlgTexto').textContent = v
        ? 'Se agregan ' + plural(v.eventos.nuevos, 'evento', 'eventos') + ', ' + plural(v.plantillas.nuevos, 'plantilla', 'plantillas') + ' y ' + plural(v.sesiones.nuevos, 'sesión', 'sesiones') + '. No se borra nada de lo que ya tienes.'
        : 'Se agrega lo que falte. No se borra nada de lo que ya tienes.';
      aceptar.textContent = 'Sumar';
      aceptar.className = 'ds-btn ds-btn--secondary ds-btn--compact';
      $('dlgRespaldarBtn').hidden = true;
    }
    abrirDialogo();
  }

  async function respaldarAhora() {
    if (trabajando) return;
    trabajando = true;
    bloquearSalida(true);
    dialogoBotones(false);
    mostrar($('dlgError'), '');
    const pintar = progresoEn($('dlgProgreso'), $('dlgProgresoTexto'), $('dlgProgresoBarra'));
    pintar({ texto: 'Preparando el respaldo de lo de ahora…' });
    try {
      const r = await R.crearRespaldo({ conFotos: true, alProgresar: pintar });
      R.descargar(r.blob, r.nombre, { registrar: true });
      respaldadoAhora = true;
      mostrar($('dlgRespaldado'), (r.advertencias && r.advertencias.length ? 'Se descargó «' + r.nombre + '» pero está INCOMPLETO: ' + r.advertencias.map(function (x) { return x.mensaje; }).join(' ') : 'Listo: se descargó «' + r.nombre + '». Ya puedes reemplazar con calma.'));
      pintarUltimo();
    } catch (e) {
      if (e.codigo === 'VACIO') mostrar($('dlgRespaldado'), 'No había nada que respaldar: este equipo está vacío.');
      else mostrar($('dlgError'), 'No se pudo hacer el respaldo de lo de ahora. ' + e.message);
    } finally {
      $('dlgProgreso').hidden = true;
      trabajando = false;
      bloquearSalida(false);
      dialogoBotones(true);
      $('dlgAceptarBtn').focus();
    }
  }

  async function restaurar() {
    if (trabajando || !paquete) return;
    const modo = modoElegido();
    trabajando = true;
    bloquearSalida(true);
    dialogoBotones(false);
    $('dlgRespaldarBtn').hidden = true;
    $('dlgAviso').hidden = true;
    mostrar($('dlgError'), '');
    const pintar = progresoEn($('dlgProgreso'), $('dlgProgresoTexto'), $('dlgProgresoBarra'));
    pintar({ texto: 'Preparando…' });
    let resultado = null;
    try {
      resultado = await R.restaurar(paquete, { modo: modo, alProgresar: pintar });
    } catch (e) {
      mostrar($('dlgError'), e.message);
    }
    $('dlgProgreso').hidden = true;
    trabajando = false;
    bloquearSalida(false);
    if (resultado) {
      $('dlgOverlay').setAttribute('data-visible', 'false');
      focoOrigen = null;
      $('restResultadoTexto').textContent = R.textoResultado(resultado);
      $('restResultado').hidden = false;
      $('restResumen').hidden = true;
      paquete = null;
      pintarEspacio();
      $('restResultado').scrollIntoView({ block: 'nearest' });
    } else {
      // Falló: no se cambió nada. El cuadro queda con el motivo y solo se puede cerrar.
      $('dlgAceptarBtn').hidden = true;
      $('dlgRespaldarBtn').hidden = true;
      $('dlgCancelarBtn').textContent = 'Cerrar';
      $('dlgCancelarBtn').disabled = false;
      $('dlgCancelarBtn').focus();
      pintarEspacio();
    }
  }

  /* ---------- Eventos de la pantalla ---------- */

  $('crearBtn').addEventListener('click', crearRespaldo);
  $('elegirBtn').addEventListener('click', function () { if (!ocupado) $('archivoInput').click(); });
  $('archivoInput').addEventListener('change', function () {
    const archivo = this.files && this.files[0];
    this.value = '';
    elegirArchivo(archivo);
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="modo"]'), function (r) {
    r.addEventListener('change', pintarModo);
  });
  $('restaurarBtn').addEventListener('click', pedirConfirmacion);
  $('dlgCancelarBtn').addEventListener('click', function () { cerrarDialogo(true); });
  $('dlgAceptarBtn').addEventListener('click', restaurar);
  $('dlgRespaldarBtn').addEventListener('click', respaldarAhora);
  $('dlgOverlay').addEventListener('click', function (e) { if (e.target === this) cerrarDialogo(true); });

  // Teclado del cuadro: Escape lo cierra (salvo mientras trabaja); Tab y Shift+Tab giran entre sus botones.
  document.addEventListener('keydown', function (e) {
    if ($('dlgOverlay').getAttribute('data-visible') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); cerrarDialogo(true); return; }
    if (e.key !== 'Tab') return;
    const botones = Array.prototype.filter.call($('dlgOverlay').querySelectorAll('button'), function (b) { return !b.disabled && !b.hidden && b.offsetParent !== null; });
    if (!botones.length) { e.preventDefault(); return; }
    const primero = botones[0];
    const ultimo = botones[botones.length - 1];
    const dentro = $('dlgOverlay').contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === primero || !dentro)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) { e.preventDefault(); primero.focus(); }
  });

  pintarUltimo();
  pintarEspacio();
})();

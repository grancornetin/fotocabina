(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));

  const cabin = q('#cabin');
  const video = q('#video');
  const flash = q('#flash');
  const frameWindow = q('#frameWindow');

  const connectBtn = q('#connectBtn');
  const connectHint = q('#connectHint');
  const launchBtn = q('#launchBtn');
  const galleryBtn = q('#galleryBtn');
  const templatesBtn = q('#templatesBtn');
  const settingsBtn = q('#settingsBtn');
  const helpBtn = q('#helpBtn');
  const printerStatusBadge = q('#printerStatusBadge');
  const templateMeta = q('#templateMeta');
  const templateChangeBtn = q('#templateChangeBtn');
  const settingsDrawer = q('#settingsDrawer');
  const drawerBackdrop = q('#drawerBackdrop');
  const drawerCloseBtn = q('#drawerCloseBtn');
  const pauseMessageInput = q('#pauseMessageInput');
  const pinChangeBtn = q('#pinChangeBtn');
  const pinStatus = q('#pinStatus');
  const pinTitle = q('#pinTitle');
  const soonOverlay = q('#soonOverlay');
  const soonTitle = q('#soonTitle');
  const soonText = q('#soonText');
  const soonCloseBtn = q('#soonCloseBtn');
  const interstitialText = q('#interstitialText');
  const templateStats = q('#templateStats');
  const mirrorToggle = q('#mirrorToggle');
  const idleHint = q('#idleHint');
  const cameraStatusBadge = q('#cameraStatusBadge');
  const cameraStatusText = q('#cameraStatusText');

  const guestIdle = q('#guestIdle');
  const countdownLayer = q('#countdownLayer');
  const countdownLabel = q('#countdownLabel');
  const countdownNumber = q('#countdownNumber');
  const interstitialLayer = q('#interstitialLayer');
  const interstitialTimer = q('#interstitialTimer');

  const pauseBtn = q('#pauseBtn');
  const lockBtn = q('#lockBtn');
  const pauseOverlay = q('#pauseOverlay');
  const resumeBtn = q('#resumeBtn');
  const cancelSessionBtn = q('#cancelSessionBtn');

  const review = q('#review');
  const reviewStrip = q('#reviewStrip');
  const retakeAllBtn = q('#retakeAllBtn');
  const confirmBtn = q('#confirmBtn');

  const composing = q('#composing');

  const result = q('#result');
  const finalPrint = q('#finalPrint');
  const resultGif = q('#resultGif');
  const gifStatus = q('#gifStatus');
  const resultPhotosGrid = q('#resultPhotosGrid');
  const downloadBtn = q('#downloadBtn');
  const downloadLabel = q('#downloadLabel');
  const shareBtn = q('#shareBtn');
  const printBtn = q('#printBtn');
  const retakeSessionBtn = q('#retakeSessionBtn');
  const finishBtn = q('#finishBtn');
  const qrCard = q('#qrCard');
  const qrCanvas = q('#qrCanvas');
  const qrCardTitle = q('#qrCardTitle');
  const qrCardSub = q('#qrCardSub');

  const gallery = q('#gallery');
  const galleryList = q('#galleryList');
  const galleryGrid = q('#galleryGrid');
  const galleryEmpty = q('#galleryEmpty');
  const galleryCloseBtn = q('#galleryCloseBtn');
  const galleryDetail = q('#galleryDetail');
  const detailBackBtn = q('#detailBackBtn');
  const detailMeta = q('#detailMeta');
  const detailStrip = q('#detailStrip');
  const detailPhotos = q('#detailPhotos');
  const detailPrintBtn = q('#detailPrintBtn');
  const detailDownloadBtn = q('#detailDownloadBtn');
  const detailGifBtn = q('#detailGifBtn');
  const detailDeleteBtn = q('#detailDeleteBtn');

  const pinOverlay = q('#pinOverlay');
  const pinHint = q('#pinHint');
  const pinDots = q('#pinDots');
  const pinPad = q('#pinPad');

  const notice = q('#notice');

  const printStatus = q('#printStatus');
  const printLabel = q('#printLabel');
  const printSent = q('#printSent');
  const printSentTitle = q('#printSentTitle');
  const printSentSub = q('#printSentSub');
  const limitOverlay = q('#limitOverlay');
  const limitCancelBtn = q('#limitCancelBtn');
  const limitOkBtn = q('#limitOkBtn');
  const copiesOverlay = q('#copiesOverlay');
  const copiesTitle = q('#copiesTitle');
  const copiesInfo = q('#copiesInfo');
  const copiesValue = q('#copiesValue');
  const copiesWarn = q('#copiesWarn');
  const copiesMinus = q('#copiesMinus');
  const copiesPlus = q('#copiesPlus');
  const copiesCancelBtn = q('#copiesCancelBtn');
  const copiesOkBtn = q('#copiesOkBtn');

  // ---------- Impresión (hito 3) ----------
  // La cabina nunca habla con la impresora: le entrega trabajos a la cola de shared/impresion.js, que los guarda
  // antes de intentar y los manda a la impresora (hoy una SIMULADA; mañana un adaptador real con la misma interfaz).
  // La cola pide la imagen justo antes de imprimir: la hoja ya compuesta que guarda la sesión (así una reimpresión
  // sale idéntica a la original). La sesión actual además queda en memoria por si el guardado en disco falló.
  const contenidoReciente = new Map();
  function recordarContenido(sesionId, blob, medidas) {
    if (!sesionId || !blob) return;
    contenidoReciente.set(sesionId, { blob, medidas: medidas || null });
    while (contenidoReciente.size > 4) contenidoReciente.delete(contenidoReciente.keys().next().value);
  }
  async function contenidoDeImpresion(trabajo) {
    if (trabajo.origen === 'prueba') return { blob: await hojaDePrueba(), medidas: HOJA_4X6_MM };
    const enMemoria = contenidoReciente.get(trabajo.sesionId);
    if (enMemoria) return enMemoria;
    const guardada = await AlmacenSesiones.obtener(trabajo.sesionId);
    const blob = guardada && (guardada.hoja || guardada.tira);
    return blob ? { blob, medidas: guardada.impresion || null } : null;
  }
  const impresion = (typeof Impresion !== 'undefined') ? Impresion.crearServicio({ resolverContenido: contenidoDeImpresion, topeDe: (id) => topeVigenteDe(id) }) : null;
  // Espera de confirmación de la impresión automática (ver "Impresión automática" más abajo).
  const ESPERA_CONFIRMACION_MS = 20000;
  const esperaImpresion = (typeof Impresion !== 'undefined') ? Impresion.crearEspera({
    ms: ESPERA_CONFIRMACION_MS,
    alLiberar: (p) => {
      avisarEnvio(enviarAImprimir({ sesion: p.sesion, copias: p.copias, origen: 'auto', topeHojas: p.topeHojas }), true);
      actualizarEstadoImpresionResultado();
    },
  }) : { armar() {}, confirmar() {}, descartar() {}, enEspera() { return false; } };
  const liberarImpresionEnEspera = () => { try { esperaImpresion.confirmar(); } catch (e) { /* nunca debe impedir salir de la pantalla */ } };
  const descartarImpresionEnEspera = () => esperaImpresion.descartar();

  // Ajustes de sesión del operador. Si la cabina se abrió desde "Lanzar" en la lista de
  // eventos (04-lista-eventos), el evento activo del almacén compartido (shared/almacen-
  // eventos.js, formato v2) trae su propio ritmo (cuenta, pausa, mensaje, paciencia) y su
  // preferencia de cámara y espejo, y esos son los que mandan — así "Duplicar" en la lista
  // tiene sentido. Dentro de la cabina se trabaja con el formato plano de siempre
  // (`ajustes.cuenta`, `.pausa`, `.volver`...); AlmacenEventos.ajustesDeEvento / aplicarAjustes
  // hacen el paso de ida y vuelta. Si no hay evento activo (la cabina se abrió directo, como
  // siempre se pudo hacer), se siguen usando los ajustes generales de este equipo.
  const AJUSTES_CLAVE = 'fotocabina-ajustes';
  // El PIN ya no es un ajuste del evento: es del equipo (shared/equipo.js, ARQUITECTURA_FLUJO.md
  // §2.1) y vale para todos los eventos. Los ajustes viejos que lo traían se limpian al leerlos.
  const AJUSTES_BASE = { fotos: 3, cuenta: 3, pausa: 3, mensajePausa: '¡Cambia de pose!', volver: 30, espejo: true, camaraId: null };
  const MENSAJE_PAUSA_ANTIGUO = '¡Cambiá de pose!';
  const eventoActivo = (typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtenerActivo() : null;
  // PIN propio que el operador ya tenía en el formato anterior (dentro de los ajustes); se conserva
  // una vez, como PIN del equipo, si no era el de fábrica.
  let pinAntiguo = null;
  const ajustes = cargarAjustes();

  function limpiarAjustesAntiguos(guardados) {
    const limpios = { ...guardados };
    if (limpios.pin !== undefined) {
      if (!pinAntiguo && /^\d{4}$/.test(limpios.pin) && limpios.pin !== '1234') pinAntiguo = limpios.pin;
      delete limpios.pin;
    }
    if (limpios.mensajePausa === MENSAJE_PAUSA_ANTIGUO) limpios.mensajePausa = AJUSTES_BASE.mensajePausa;
    return limpios;
  }

  function cargarAjustes() {
    if (eventoActivo) {
      return { ...AJUSTES_BASE, ...AlmacenEventos.ajustesDeEvento(eventoActivo) };
    }
    try {
      const guardado = JSON.parse(localStorage.getItem(AJUSTES_CLAVE) || '{}');
      return { ...AJUSTES_BASE, ...limpiarAjustesAntiguos(guardado) };
    } catch (e) {
      return { ...AJUSTES_BASE };
    }
  }

  function guardarAjustes() {
    if (typeof AlmacenEventos !== 'undefined' && eventoActual.id !== 'demo') {
      // Se relee el evento antes de escribir: así no se pisa lo que otra parte guardó mientras tanto
      // (por ejemplo la copia congelada del lanzamiento).
      try {
        const fresco = AlmacenEventos.obtener(eventoActual.id);
        if (fresco) AlmacenEventos.guardar(AlmacenEventos.aplicarAjustes(fresco, ajustes));
        const errGuardado = AlmacenEventos.errorDeGuardado();
        if (errGuardado) showNotice(errGuardado.mensaje);
      } catch (e) { /* sin persistencia disponible */ }
    } else {
      try {
        localStorage.setItem(AJUSTES_CLAVE, JSON.stringify(ajustes));
      } catch (e) {
        // sin persistencia disponible, los ajustes igual valen durante esta sesión
      }
    }
    actualizarResumenPlantilla();
  }

  // Cuántas fotos tiene la sesión: las que define la plantilla del evento; sin plantilla (demostración), el ajuste de siempre.
  function numeroDeFotos() {
    return plantillaActiva ? MotorPlantillas.contarFotos(plantillaActiva) : ajustes.fotos;
  }

  function textoEntrega(c) {
    const modos = { impresion: 'Solo impresión', digital: 'Solo digital', ambos: 'Impresión y digital' };
    let t = modos[c.modo] || 'Entrega sin definir';
    // Las hojas solo se nombran si la impresión es automática (si no, no hay nada que contar todavía).
    if (c.modo !== 'digital' && c.impresionAuto) t += ` · ${c.copias} ${c.copias === 1 ? 'hoja' : 'hojas'} · impresión automática`;
    if (c.topeHojas) t += ` · tope ${c.topeHojas} ${c.topeHojas === 1 ? 'hoja' : 'hojas'}`;
    return t;
  }

  // Cuántas hojas lleva el evento y cuántas quedan del tope (el operador lo ve siempre en la tarjeta y en Ajustes).
  function textoHojasDelEvento(c) {
    if (!impresion || eventoActual.id === 'demo' || (c && c.modo === 'digital')) return '';
    const h = impresion.hojasDelEvento(eventoActual.id, c && c.topeHojas);
    if (!h.usadas && h.restantes === null) return '';
    return h.restantes === null
      ? ` · llevan ${h.usadas} ${h.usadas === 1 ? 'hoja' : 'hojas'}`
      : ` · llevan ${h.usadas} de ${h.tope} (${h.restantes === 0 ? 'ya no quedan' : `quedan ${h.restantes}`})`;
  }

  const enPulgadas = (mm) => String(Math.round((mm / 25.4) * 10) / 10).replace('.', ',');
  const textoPapel = (p) => `${enPulgadas(p.papel.anchoMm)} × ${enPulgadas(p.papel.altoMm)} in`;

  function actualizarResumenPlantilla() {
    const pausa = ajustes.pausa > 0 ? `pausa ${ajustes.pausa} s` : 'sin pausa';
    const nombrePlantilla = q('.template-name');
    const miniatura = q('#templateThumbImg');
    const dibujoBase = q('svg.template-thumb');
    const aviso = q('#templateAviso');
    const selectorFotos = q('.ds-select[data-select="photos"]');

    if (plantillaActiva) {
      const n = numeroDeFotos();
      templateMeta.textContent = `${n} ${n === 1 ? 'foto' : 'fotos'} · ${textoPapel(plantillaActiva)} · cuenta ${ajustes.cuenta} s · ${pausa}`;
      if (nombrePlantilla) nombrePlantilla.textContent = plantillaActiva.nombre;
    } else if (estadoPlantilla.modo === 'invalida') {
      templateMeta.textContent = `Falta una plantilla válida · cuenta ${ajustes.cuenta} s · ${pausa}`;
      if (nombrePlantilla) nombrePlantilla.textContent = 'Sin plantilla válida';
    } else {
      templateMeta.textContent = `${ajustes.fotos} fotos · 2×6 en 4×6 · cuenta ${ajustes.cuenta} s · ${pausa}`;
    }

    // Cómo entrega este evento (modo, copias, impresión automática, tope): se lee del evento, no se decide aquí.
    // Las copias y la impresión automática todavía no imprimen solas (hito de impresión): solo se muestran.
    const entregaEl = q('#templateEntrega');
    if (entregaEl) {
      const real = eventoActual.id !== 'demo' && typeof ValidadorEvento !== 'undefined';
      const cfgEntrega = real ? configCongelada() : null;
      entregaEl.hidden = !cfgEntrega;
      if (cfgEntrega) entregaEl.textContent = textoEntrega(cfgEntrega);
      // Cuántas hojas lleva el evento y cuántas quedan: línea propia (no se corta en pantallas angostas).
      const hojasEl = q('#templateHojas');
      if (hojasEl) {
        const th = cfgEntrega ? textoHojasDelEvento(cfgEntrega).replace(/^ · /, '') : '';
        hojasEl.hidden = !th;
        hojasEl.textContent = th ? th.charAt(0).toUpperCase() + th.slice(1) : '';
      }
    }

    // Con plantilla real, el número de fotos lo manda la plantilla: el selector manual no se ofrece.
    if (selectorFotos) selectorFotos.hidden = estadoPlantilla.modo !== 'demo';

    if (aviso) {
      aviso.hidden = estadoPlantilla.modo !== 'invalida';
      // El motivo ya viene redactado por el validador (shared/validador-evento.js).
      q('#templateAvisoTexto').textContent = estadoPlantilla.modo !== 'invalida' ? '' : estadoPlantilla.motivo;
    }
    if (dibujoBase && miniatura) {
      const conMiniatura = !!plantillaActiva && !!miniatura.getAttribute('src');
      miniatura.hidden = !conMiniatura;
      dibujoBase.style.display = conMiniatura ? 'none' : '';
    }
    actualizarLanzamiento();
  }

  // ---------- Validador del evento (hito 0.3) ----------
  // Qué impide lanzar, y qué conviene saber, lo decide shared/validador-evento.js (una sola regla para
  // todas las pantallas). Aquí solo se arma la foto del estado en vivo y se muestra el resultado.

  // Cámaras en vivo: nada conectado = lista vacía (el validador bloquea); conectada = la activa (con su
  // resolución real) más las demás que el navegador lista.
  function camarasVivas() {
    if (!cabin.classList.contains('is-connected')) return [];
    const pista = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
    const aj = pista && pista.getSettings ? pista.getSettings() : {};
    const id = aj.deviceId || ajustes.camaraId || 'activa';
    const propia = camarasListadas.find((c) => c.id === id);
    const activa = { id, etiqueta: (propia && propia.etiqueta) || 'Cámara conectada', activa: true, anchoPx: aj.width || null, altoPx: aj.height || null };
    return [activa, ...camarasListadas.filter((c) => c.id !== id)];
  }

  // La impresora la informa el adaptador de shared/impresion.js (hoy la simulada; sin dato = null y no marca nada).
  // El espacio en disco no se puede detectar desde el navegador.
  function entradaValidador(evento, plantilla) {
    const pin = (typeof AjustesEquipo !== 'undefined') ? AjustesEquipo.estadoPin() : null;
    return {
      equipo: pin ? { pin: { definido: !!pin.definido } } : null,
      evento,
      plantilla,
      vivo: { camaras: camarasVivas(), impresora: impresion ? impresion.paraValidador() : null, espacioLibreMB: null },
    };
  }

  // Veredicto actual del evento; null si no aplica (demostración) o todavía se está leyendo la plantilla.
  function evaluarEvento() {
    if (estadoPlantilla.modo === 'demo' || estadoPlantilla.modo === 'cargando' || typeof ValidadorEvento === 'undefined') return null;
    const evento = (typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtener(eventoActual.id) : null;
    return ValidadorEvento.validar(entradaValidador(evento, plantillaParaValidar));
  }

  // Bloqueos y avisos que no son de la plantilla (esos van en su tarjeta, con botón al editor) ni de la
  // cámara (el panel de cámara ya lo explica). Breve: máximo 4 líneas.
  function pintarNotasDeLanzamiento(res) {
    const lista = q('#launchNotes');
    if (!lista) return;
    lista.textContent = '';
    const notas = res
      ? [...res.bloqueos, ...res.avisos].filter((n) => (n.grupo !== 'plantilla' || n.gravedad === 'aviso') && n.codigo !== 'SIN_CAMARA' && n.codigo !== 'CAMARA_NO_COMPROBADA')
      : [];
    if (avisoDesfase) notas.unshift({ gravedad: 'aviso', mensaje: avisoDesfase });
    notas.slice(0, 4).forEach((n) => {
      const li = document.createElement('li');
      li.className = 'launch-note launch-note--' + n.gravedad;
      li.textContent = n.mensaje;
      lista.appendChild(li);
    });
    if (notas.length > 4) {
      const li = document.createElement('li');
      li.className = 'launch-note';
      li.textContent = `Y ${notas.length - 4} ${notas.length - 4 === 1 ? 'aviso más' : 'avisos más'}.`;
      lista.appendChild(li);
    }
    lista.hidden = lista.children.length === 0;
  }

  // "Lanzar evento" solo se ofrece cuando el validador no ve ningún bloqueo (o en demostración, con la cámara lista).
  function actualizarLanzamiento() {
    const conectada = cabin.classList.contains('is-connected');
    const res = evaluarEvento();
    pintarNotasDeLanzamiento(res);
    const listo = estadoPlantilla.modo === 'demo' ? true : (!!res && res.listo && estadoPlantilla.modo === 'valida');
    launchBtn.disabled = !conectada || !listo;
  }

  const sinPunto = (t) => String(t || '').replace(/\.+$/, '');
  const enMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);

  // Lee la plantilla del evento desde el almacén del editor y la valida. Se llama al abrir la cabina,
  // al cambiar de evento y al lanzar (así lo que se compone durante el evento queda fijo desde el lanzamiento).
  async function cargarPlantilla(conMiniatura = true) {
    const token = ++cargaPlantillaId;
    const eventoId = eventoActual.id;
    let nuevoEstado, nueva = null, miniaturaUrl = null; // null = no tocar la miniatura que ya se ve
    let usaCongelada = false, crudaLeida = null; // crudaLeida: lo que se leyó (objeto, null o ILEGIBLE), tal como lo revisa el validador
    if (eventoId === 'demo') {
      nuevoEstado = { modo: 'demo', motivo: '' };
    } else if (typeof AlmacenPlantillas === 'undefined' || typeof MotorPlantillas === 'undefined' || typeof ValidadorEvento === 'undefined') {
      nuevoEstado = { modo: 'invalida', motivo: 'Faltan componentes de la aplicación: recarga la página.' };
    } else {
      estadoPlantilla = { modo: 'cargando', motivo: '' };
      plantillaActiva = null;
      actualizarLanzamiento();
      const evento = (typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtener(eventoId) : null;
      const plantillaId = evento && evento.plantillas && evento.plantillas.porDefecto;
      let hallada = null;
      let huboError = false;
      if (plantillaId) {
        try { hallada = await AlmacenPlantillas.obtener(plantillaId); } catch (e) { hallada = null; huboError = true; }
        // Recarga con la plantilla viva borrada: si el evento ya se lanzó y su copia congelada sigue en
        // IndexedDB, se usa esa copia (el evento no se bloquea). Sin congelado, sigue bloqueado (decisión 1A).
        const huellaCongelada = evento && evento.congelado && evento.congelado.plantilla && evento.congelado.plantilla.huella;
        if (!hallada && huellaCongelada && typeof AlmacenSesiones !== 'undefined') {
          try { hallada = await AlmacenSesiones.obtenerCongelada(huellaCongelada); usaCongelada = !!hallada; } catch (e) { hallada = null; }
        }
      }
      // Si la plantilla es válida o no, y por qué, lo dice el validador (la regla vive en un solo lugar).
      // Si se usa la copia congelada, el validador recibe null (como la lista): así emite el aviso PLANTILLA_SOLO_COPIA_CONGELADA y no bloquea.
      crudaLeida = usaCongelada ? null : (hallada || (huboError ? ValidadorEvento.ILEGIBLE : null));
      const res = ValidadorEvento.validar(entradaValidador(evento, crudaLeida));
      const bloqPlantilla = res.bloqueos.find((b) => b.grupo === 'plantilla');
      if (bloqPlantilla || !hallada) {
        nuevoEstado = { modo: 'invalida', motivo: (bloqPlantilla || { mensaje: 'No se pudo leer la copia guardada de la plantilla de este evento. Elige o crea una en el editor.' }).mensaje };
      } else {
        nuevoEstado = { modo: 'valida', motivo: '', congelada: usaCongelada };
        nueva = hallada;
        if (conMiniatura) { try { miniaturaUrl = await MotorPlantillas.miniatura(hallada, 108); } catch (e) { miniaturaUrl = ''; } }
      }
    }
    if (token !== cargaPlantillaId) return; // llegó una carga más nueva
    if (nueva !== plantillaActiva) { huellaActiva = null; modificadaActiva = null; congeladaOk = false; }
    plantillaActiva = nueva;
    plantillaParaValidar = crudaLeida;
    estadoPlantilla = nuevoEstado;
    const img = q('#templateThumbImg');
    if (img && miniaturaUrl !== null) { if (miniaturaUrl) img.src = miniaturaUrl; else img.removeAttribute('src'); }
    if (img && !nueva) img.removeAttribute('src');
    actualizarResumenPlantilla();
    if (cabin.classList.contains('is-guest-mode')) updateFrameWindow(1);
  }

  // ---------- Congelado de la plantilla (hito 0.1b) ----------
  // Al lanzar el evento, y al empezar cada sesión si el operador editó la plantilla mientras tanto,
  // se congela una copia completa del diseño (IndexedDB, por huella) y una nota liviana en el evento.
  // Cada sesión guarda a qué diseño pertenece, así ver o recomponer una sesión antigua nunca usa la
  // plantilla de hoy.

  // Lo que se congela junto con el diseño: número de fotos, papel, entrega, copias y ritmo.
  // La configuración efectiva la calcula el validador (shared/validador-evento.js, hito 1.2): aquí solo se le
  // entrega el evento (con el ritmo y el espejo que el operador tiene en pantalla) y la plantilla vigente.
  // La cabina abierta sin evento (demostración) usa un evento de prueba que ofrece todas las salidas.
  function configCongelada() {
    const real = eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined';
    let evento = real ? AlmacenEventos.obtener(eventoActual.id) : null;
    // Un evento real que ya no existe (eliminado desde otra pestaña) no se reemplaza por uno inventado: sin configuración.
    if (real && !evento) return null;
    if (!evento && typeof AlmacenEventos !== 'undefined') {
      evento = AlmacenEventos.crear({ nombre: eventoActual.nombre, entrega: { modo: 'ambos', copias: 1, impresionAuto: false } });
    }
    if (evento) AlmacenEventos.aplicarAjustes(evento, ajustes);
    return ValidadorEvento.configuracionEfectiva(evento, plantillaActiva, { fotos: numeroDeFotos() });
  }

  // Congela `plantilla` como la vigente de esta cabina: calcula su huella, guarda la copia y anota el
  // congelado en el evento. Si no se pudo guardar la copia, la sesión se toma igual pero queda
  // marcada `copiaCongelada: false`.
  async function congelarVigente(plantilla) {
    plantillaActiva = plantilla;
    plantillaParaValidar = plantilla;
    modificadaActiva = plantilla.modificada || null;
    huellaActiva = await AlmacenPlantillas.huella(plantilla);
    congeladaOk = false;
    try {
      await AlmacenSesiones.congelarPlantilla(huellaActiva, plantilla);
      congeladaOk = true;
    } catch (e) { /* se sigue sin copia congelada */ }
    if (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') {
      try {
        AlmacenEventos.congelar(eventoActual.id, { plantilla: { id: plantilla.id, huella: huellaActiva, nombre: plantilla.nombre }, config: configCongelada(), copiaGuardada: congeladaOk });
      } catch (e) { /* sin persistencia disponible */ }
    }
  }

  // Al empezar cada sesión: si la plantilla vigente del editor cambió (otra huella), las sesiones
  // nuevas usan la edición y se congela. Si no se puede leer (la borraron, quedó inválida), se sigue
  // con la que ya estaba congelada: un evento en marcha no se frena delante del invitado.
  let avisoDesfase = null; // el evento ya no apunta a una plantilla que se pueda usar: la cabina sigue con la congelada

  async function refrescarPlantillaVigente() {
    if (eventoActual.id === 'demo' || typeof AlmacenPlantillas === 'undefined' || typeof AlmacenEventos === 'undefined') return;
    const evento = AlmacenEventos.obtener(eventoActual.id);
    const id = evento && evento.plantillas && evento.plantillas.porDefecto;
    const avisar = (texto) => { if (avisoDesfase !== texto) { avisoDesfase = texto; showNotice(texto); actualizarLanzamiento(); } };
    if (!id) { avisar('Este evento ya no tiene una plantilla por defecto: la cabina sigue con la plantilla con que se lanzó. Revisa el evento antes de seguir.'); return; }
    const nueva = await AlmacenPlantillas.obtener(id);
    if (!nueva || !MotorPlantillas.validarPlantilla(nueva).valida) { avisar('La plantilla por defecto del evento no se puede leer o está dañada: la cabina sigue con la copia guardada al lanzar. Revisa el evento.'); return; }
    if (avisoDesfase) { avisoDesfase = null; actualizarLanzamiento(); }
    if (plantillaActiva && nueva.id === plantillaActiva.id && nueva.modificada && nueva.modificada === modificadaActiva && huellaActiva) return;
    const huellaNueva = await AlmacenPlantillas.huella(nueva);
    if (huellaNueva === huellaActiva) { modificadaActiva = nueva.modificada || null; return; }
    await congelarVigente(nueva);
    estadoPlantilla = { modo: 'valida', motivo: '' };
    actualizarResumenPlantilla();
    updateFrameWindow(1);
  }

  // Empezar una sesión desde la pantalla de inicio del invitado: primero se asegura la plantilla vigente.
  async function iniciarSesionInvitado() {
    if (iniciandoSesion || sessionActive) return;
    if (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') {
      const vigente = AlmacenEventos.obtener(eventoActual.id);
      if (!vigente) {
        showNotice('Este evento ya no existe (se eliminó desde otra pestaña). Vuelve a la lista de eventos.');
        return;
      }
      // Un evento terminado (por ejemplo desde la lista, en otra pestaña) no recibe sesiones nuevas.
      if (vigente.estado === 'archivado') {
        showNotice('Este evento ya se terminó. Para seguir, reábrelo desde la lista de eventos.');
        return;
      }
    }
    iniciandoSesion = true;
    try {
      // El evento ya usó todas sus hojas: el invitado lo sabe ANTES de tomar las fotos y sigue solo con entrega digital.
      if (topeAlcanzadoAhora() && !(await esperarAvisoDeTope())) { iniciandoSesion = false; return; }
      try { await refrescarPlantillaVigente(); } catch (e) { /* se sigue con la plantilla congelada */ }
    } finally {
      iniciandoSesion = false;
    }
    runSession();
  }

  const PROXIMAMENTE = {
    plantillas: { titulo: 'Plantillas del evento', texto: 'Elegir qué diseños puede usar el invitado en este evento y ver cómo queda cada uno antes de lanzar.' },
    ayuda: { titulo: 'Ayuda', texto: 'Guía rápida de uso, atajos de teclado y contacto de soporte.' },
  };
  // Proporción del marco de encuadre cuando no hay plantilla real (demostración). Con plantilla,
  // sale del espacio de foto que se va a tomar (MotorPlantillas.proporcionDeFoto).
  const FRAME_RATIO_NUM = 4 / 3.2;
  const GIF_ANCHO = 480, GIF_ALTO = 360, GIF_RETARDO_MS = 600;

  const ICONO_CAMARA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.6em;height:0.6em;display:inline-block;vertical-align:middle"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/></svg>';
  const ICONO_REPETIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 10-3 6.3"/><path d="M20 6v6h-6"/></svg>';
  const ICONO_DESCARGAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>';

  let stream = null;
  let photos = [];
  let finalBlob = null;
  let gifBlob = null;
  let gifGeneracion = 0;
  let eventoActual = eventoActivo ? { id: eventoActivo.id, nombre: eventoActivo.nombre } : { id: 'demo', nombre: 'Sesión de prueba' };
  let sesionActual = null;
  let hojaBlob = null;      // hoja física (2 tiras en 4x6) cuando la plantilla lo pide; null si se imprime la tira sola
  let hojaMedidas = null;   // { anchoMm, altoMm } de lo que se imprime
  let ultimoNumeroAsignado = 0; // respaldo del número de sesión si no se puede leer el almacén
  // Plantilla real del evento (hito 1.1). modo: 'demo' (sin evento, comportamiento antiguo), 'cargando',
  // 'valida' (plantillaActiva lista) o 'invalida' (el evento no se puede lanzar; motivo en palabras simples).
  let plantillaActiva = null;
  let estadoPlantilla = { modo: 'demo', motivo: '' };
  let plantillaParaValidar = null; // lo último que se leyó de la plantilla (aunque no sirva), para el validador
  let camarasListadas = [];       // cámaras del equipo que lista el navegador: [{ id, etiqueta }]
  let cargaPlantillaId = 0;
  // Congelado (hito 0.1b): la plantilla con la que se toman las sesiones nuevas. `huellaActiva` es la
  // identidad de ese diseño; `congeladaOk` dice si su copia completa ya está guardada en IndexedDB
  // (plantillasCongeladas); `modificadaActiva` evita recalcular la huella si la plantilla no se tocó.
  let huellaActiva = null;
  let modificadaActiva = null;
  let congeladaOk = false;
  let iniciandoSesion = false;

  // Cola de guardado: cada escritura a disco espera a la anterior, así dos fotos seguidas nunca
  // se pisan al actualizar el registro de la misma sesión y el orden en disco es el real.
  let colaGuardado = Promise.resolve();
  function encolarGuardado(tarea) {
    // Cada tarea tiene un tope de tiempo: un guardado colgado no debe frenar a los siguientes.
    const conTope = () => Promise.race([tarea(), new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('guardado demorado')), 8000))]);
    const siguiente = colaGuardado.then(conTope);
    colaGuardado = siguiente.catch(() => {});
    return siguiente;
  }
  function avisarFalloDeGuardado() {
    showNotice('No se pudo guardar la foto en este equipo.');
  }

  // Estado de pausa/cancelación cooperativo: las esperas consultan estos flags en cada tick
  // para poder cortar o congelar un countdown/interstitial en curso.
  let sessionActive = false;
  let paused = false;
  let cancelRequested = false;

  let pinBuffer = '';
  let pausadoPorPin = false;

  let filtroGaleria = 'event';
  let sesionDetalle = null;
  let urlsTemporales = [];

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  class SessionCancelled extends Error {}

  async function interruptibleWait(totalMs) {
    const step = 100;
    let elapsed = 0;
    while (elapsed < totalMs) {
      if (cancelRequested) throw new SessionCancelled();
      if (paused) {
        await sleep(step);
        continue;
      }
      await sleep(Math.min(step, totalMs - elapsed));
      elapsed += step;
    }
  }

  function showNotice(text) {
    notice.textContent = text;
    notice.hidden = false;
    clearTimeout(showNotice._t);
    showNotice._t = setTimeout(hideNotice, 4000);
  }
  function hideNotice() {
    notice.hidden = true;
  }

  function crearUrl(blob) {
    const url = URL.createObjectURL(blob);
    urlsTemporales.push(url);
    return url;
  }
  function liberarUrls() {
    urlsTemporales.forEach((u) => URL.revokeObjectURL(u));
    urlsTemporales = [];
  }

  // ---------- Dropdowns propios ----------

  // Delegación de eventos en el <ul> (no un listener por <li>): algunos selects se rellenan
  // dinámicamente después de este arranque (eventos reales en poblarSelectorEventos(),
  // cámaras reales en poblarSelectorCamaras() recién tras conectar) — con un listener por
  // opción, las opciones nuevas quedaban sin click funcionando. Con delegación en el menú
  // contenedor, cualquier <li> agregado más tarde ya responde sin volver a engancharlo.
  function initSelects() {
    qa('.ds-select').forEach((select) => {
      const trigger = select.querySelector('.ds-select-trigger');
      const value = select.querySelector('.ds-select-value');
      const menu = select.querySelector('.ds-select-menu');

      function close() {
        select.classList.remove('is-open');
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }
      function open() {
        qa('.ds-select.is-open').forEach((s) => { if (s !== select && s._close) s._close(); });
        select.classList.add('is-open');
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      }

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (select.classList.contains('is-open')) close();
        else open();
      });

      menu.addEventListener('click', (e) => {
        const opt = e.target.closest('.ds-select-option');
        if (!opt) return;
        menu.querySelectorAll('.ds-select-option').forEach((o) => o.setAttribute('aria-selected', 'false'));
        opt.setAttribute('aria-selected', 'true');
        value.textContent = opt.textContent;
        close();

        const tipo = select.dataset.select;
        if (tipo === 'countdown') { ajustes.cuenta = parseInt(opt.dataset.value, 10) || 3; guardarAjustes(); }
        if (tipo === 'photos') { ajustes.fotos = parseInt(opt.dataset.value, 10) || 3; guardarAjustes(); }
        if (tipo === 'pause') { ajustes.pausa = parseInt(opt.dataset.value, 10) || 0; guardarAjustes(); }
        if (tipo === 'return') { ajustes.volver = parseInt(opt.dataset.value, 10) || 0; guardarAjustes(); }
        if (tipo === 'event') { cambiarEvento(opt.dataset.value, opt.textContent); }
        if (tipo === 'camera') { ajustes.camaraId = opt.dataset.value || null; guardarAjustes(); connectCamera(); }
        if (tipo === 'printer' && impresion) { cambiarImpresoraDesdePanel(opt.dataset.value); }
        if (tipo === 'simestado' && impresion) { impresion.configurarSimulacion({ estado: opt.dataset.value }); refrescarImpresora(true); }
      });

      select._close = close;
    });

    document.addEventListener('click', () => {
      qa('.ds-select.is-open').forEach((s) => s._close && s._close());
    });
  }

  function seleccionarOpcion(tipo, valor) {
    const select = q(`.ds-select[data-select="${tipo}"]`);
    if (!select) return;
    const opciones = Array.from(select.querySelectorAll('.ds-select-option'));
    const opcion = opciones.find((o) => o.dataset.value === String(valor)) || opciones[0];
    opciones.forEach((o) => o.setAttribute('aria-selected', String(o === opcion)));
    select.querySelector('.ds-select-value').textContent = opcion.textContent;
  }

  function aplicarAjustesAControles() {
    seleccionarOpcion('photos', ajustes.fotos);
    seleccionarOpcion('countdown', ajustes.cuenta);
    seleccionarOpcion('pause', ajustes.pausa);
    seleccionarOpcion('return', ajustes.volver);
    pauseMessageInput.value = ajustes.mensajePausa;
    actualizarResumenPlantilla();
    aplicarEspejo();
  }

  function aplicarEspejo() {
    video.classList.toggle('is-unmirrored', !ajustes.espejo);
    mirrorToggle.setAttribute('aria-checked', String(ajustes.espejo));
  }

  // ---------- Selector de evento (alimentado por 04-lista-eventos vía almacén compartido) ----------

  function poblarSelectorEventos() {
    if (typeof AlmacenEventos === 'undefined') return;
    const select = q('.ds-select[data-select="event"]');
    if (!select) return;
    const menu = select.querySelector('.ds-select-menu');
    const value = select.querySelector('.ds-select-value');

    const eventos = AlmacenEventos.listar().filter((e) => e.estado !== 'archivado');

    // Sin evento activo (la cabina se abrió directo, sin pasar por "Lanzar" en la lista):
    // el dropdown ofrece los eventos existentes para elegir, pero no fuerza ninguno — se
    // queda en "Sesión de prueba" hasta que el operador elija uno.
    const opcionesDisponibles = eventoActivo
      ? eventos
      : [{ id: 'demo', nombre: 'Sesión de prueba' }, ...eventos];

    menu.innerHTML = '';
    opcionesDisponibles.forEach((evento) => {
      const opcion = document.createElement('li');
      opcion.className = 'ds-select-option';
      opcion.setAttribute('role', 'option');
      opcion.dataset.value = evento.id;
      opcion.textContent = evento.nombre;
      if (evento.id === eventoActual.id) opcion.setAttribute('aria-selected', 'true');
      menu.appendChild(opcion);
    });

    const activo = opcionesDisponibles.find((e) => e.id === eventoActual.id);
    if (activo) value.textContent = activo.nombre;
  }

  // Cambiar de evento desde el dropdown de la barra: recarga los ajustes de ese evento
  // (fotos, cuenta, pausa, PIN) y lo marca como el activo en el almacén compartido, igual
  // que si se hubiera tocado "Lanzar" en la lista de eventos.
  function cambiarEvento(id, nombre) {
    eventoActual = { id, nombre };
    if (typeof AlmacenEventos === 'undefined' || id === 'demo') { actualizarSeccionEvento(); actualizarContadorEvento(); cargarPlantilla(); return; }

    AlmacenEventos.setActivo(id);
    const evento = AlmacenEventos.obtener(id);
    if (evento) {
      Object.assign(ajustes, AlmacenEventos.ajustesDeEvento(evento));
      aplicarAjustesAControles();
    }
    actualizarSeccionEvento();
    actualizarContadorEvento();
    cargarPlantilla();
  }

  // ---------- Ciclo de vida del evento (hito 1.3) ----------
  // "En curso" lo pone el sistema al lanzar; "Terminar evento" lo pide el operador (Ajustes > Evento)
  // y pasa el evento a Archivados. Los estados y sus reglas viven en AlmacenEventos (shared).

  const seccionEvento = q('#seccionEvento');
  const estadoEventoTexto = q('#eventoEstadoTexto');
  const terminarEventoBtn = q('#terminarEventoBtn');
  const endOverlay = q('#endOverlay');
  const endTitle = q('#endTitle');
  const endText = q('#endText');
  const endAcceptBtn = q('#endAcceptBtn');
  const endCancelBtn = q('#endCancelBtn');
  const rolloOverlay = q('#rolloOverlay');
  const rolloTexto = q('#rolloTexto');
  const rolloOkBtn = q('#rolloOkBtn');
  const rolloCancelBtn = q('#rolloCancelBtn');

  function marcarEventoEnCurso() {
    if (eventoActual.id === 'demo' || typeof AlmacenEventos === 'undefined') return;
    try {
      AlmacenEventos.marcarEnCurso(eventoActual.id);
      const err = AlmacenEventos.errorDeGuardado();
      if (err) showNotice(err.mensaje);
    } catch (e) { /* sin persistencia disponible */ }
    actualizarSeccionEvento();
  }

  // Sección "Evento" de Ajustes: solo con un evento real. Muestra su estado y, si no está archivado, "Terminar evento".
  function actualizarSeccionEvento() {
    if (!seccionEvento) return;
    const evento = (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtener(eventoActual.id) : null;
    seccionEvento.hidden = !evento;
    if (!evento) return;
    const esArchivado = evento.estado === 'archivado';
    estadoEventoTexto.textContent = {
      proximo: 'Este evento está en Próximos. Pasa a En curso solo cuando lo lanzas.',
      'en-curso': 'Este evento está En curso. Al terminarlo pasa a Archivados y ya no se puede lanzar.',
      archivado: 'Este evento está Archivado y no se puede lanzar. Reábrelo desde la lista de eventos.',
    }[evento.estado] || '';
    terminarEventoBtn.hidden = esArchivado;
    terminarEventoBtn.textContent = evento.estado === 'proximo' ? 'Archivar evento' : 'Terminar evento';
  }

  let focoOrigenFin = null;

  async function pedirTerminarEvento() {
    if (endOverlay.dataset.visible === 'true') return;
    focoOrigenFin = document.activeElement;
    const evento = (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtener(eventoActual.id) : null;
    if (!evento) { showNotice('Este evento ya no existe. Vuelve a la lista de eventos.'); return; }
    if (evento.estado === 'archivado') { actualizarSeccionEvento(); showNotice('Este evento ya estaba terminado.'); return; }
    cerrarDrawer();
    const esProximo = evento.estado === 'proximo';
    let cuantas = null;
    try { cuantas = (await AlmacenSesiones.listarRegistros(evento.id)).length; } catch (e) { cuantas = null; }
    const sesiones = cuantas === null ? 'Sus sesiones y fotos'
      : (cuantas === 1 ? 'Su sesión y sus fotos' : `Sus ${cuantas} sesiones y sus fotos`);
    endTitle.textContent = esProximo ? 'Archivar evento' : 'Terminar evento';
    endText.textContent = `"${evento.nombre}" pasa a Archivados y ya no se podrá lanzar ni tomar sesiones nuevas. ` +
      (cuantas === 0 ? 'No tiene sesiones guardadas. ' : `${sesiones} se conservan. `) +
      'Si te arrepientes, lo reabres desde la lista de eventos.';
    endAcceptBtn.textContent = esProximo ? 'Archivar evento' : 'Terminar evento';
    endOverlay.dataset.visible = 'true';
    endCancelBtn.focus();
  }

  function terminarEventoAbierto() {
    return endOverlay.dataset.visible === 'true';
  }

  // Cierra el diálogo y devuelve el foco a donde estaba. El botón de origen vive en el panel de Ajustes, que
  // se cerró para mostrar el diálogo: se reabre en su sección para que el foco no quede en algo invisible.
  function cerrarTerminarEvento(devolverFoco = true) {
    endOverlay.dataset.visible = 'false';
    if (!devolverFoco) return;
    if (focoOrigenFin && seccionEvento.contains(focoOrigenFin)) abrirDrawer('seccionEvento');
    if (focoOrigenFin && focoOrigenFin.isConnected && !focoOrigenFin.hidden) { try { focoOrigenFin.focus(); } catch (e) { /* sin foco */ } }
    focoOrigenFin = null;
  }

  // Trampa de foco: Tab y Shift+Tab giran entre los botones del diálogo.
  function trampaFocoTerminar(e) {
    const botones = Array.from(endOverlay.querySelectorAll('button')).filter((b) => !b.disabled && !b.hidden);
    if (!botones.length) return;
    const primero = botones[0];
    const ultimo = botones[botones.length - 1];
    const dentro = endOverlay.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === primero || !dentro)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) { e.preventDefault(); primero.focus(); }
  }

  function confirmarTerminarEvento() {
    cerrarTerminarEvento(false);
    focoOrigenFin = null;
    let r = null;
    try { r = AlmacenEventos.terminar(eventoActual.id); } catch (e) { r = null; }
    const err = AlmacenEventos.errorDeGuardado();
    if (!r) { showNotice('Este evento ya no existe. Vuelve a la lista de eventos.'); return; }
    if (err) { showNotice(err.mensaje); actualizarSeccionEvento(); return; }
    // Vuelve a la lista, ya en la pestaña Archivados (docs/FLUJO_NAVEGACION.md).
    window.location.href = `../04-lista-eventos/index.html?terminado=${encodeURIComponent(eventoActual.id)}`;
  }

  // ---------- Contador del evento (tarjeta de plantilla) ----------

  async function actualizarContadorEvento() {
    try {
      const registros = await AlmacenSesiones.listarRegistros(eventoActual.id);
      const completas = registros.filter(AlmacenSesiones.esCompleta);
      const incompletas = registros.filter(AlmacenSesiones.esIncompleta).length;
      if (!completas.length && !incompletas) {
        templateStats.textContent = 'Sin sesiones todavía';
        return;
      }
      const partes = [];
      if (completas.length) {
        const ultima = new Date(completas[0].fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        partes.push(`${completas.length} ${completas.length === 1 ? 'sesión' : 'sesiones'}`);
        partes.push(`última ${ultima}`);
      }
      if (incompletas) partes.push(`${incompletas} ${incompletas === 1 ? 'incompleta' : 'incompletas'}`);
      templateStats.textContent = partes.join(' · ');
    } catch (e) {
      templateStats.textContent = '';
    }
  }

  // ---------- Volver al inicio por inactividad (pantalla de resultado) ----------

  let temporizadorInicio = null;
  let restanteInicio = 0;

  function iniciarTemporizadorInicio() {
    detenerTemporizadorInicio();
    if (!ajustes.volver) return;
    restanteInicio = ajustes.volver;
    temporizadorInicio = setInterval(() => {
      restanteInicio -= 1;
      if (restanteInicio > 0 && restanteInicio <= 10) {
        idleHint.textContent = `Vuelve al inicio en ${restanteInicio} s`;
        idleHint.hidden = false;
      }
      if (restanteInicio <= 0) {
        detenerTemporizadorInicio();
        enterIdle();
      }
    }, 1000);
  }

  function reiniciarTemporizadorInicio() {
    if (!temporizadorInicio) return;
    restanteInicio = ajustes.volver;
    idleHint.hidden = true;
  }

  function detenerTemporizadorInicio() {
    if (temporizadorInicio) clearInterval(temporizadorInicio);
    temporizadorInicio = null;
    idleHint.hidden = true;
  }

  // ---------- Panel de ajustes y hojas "Próximamente" ----------

  function abrirDrawer(seccionId) {
    if (impresion) refrescarImpresora(true);
    settingsDrawer.dataset.open = 'true';
    drawerBackdrop.dataset.visible = 'true';
    if (seccionId) {
      const seccion = document.getElementById(seccionId);
      if (seccion) seccion.scrollIntoView({ block: 'start' });
    }
  }
  function cerrarDrawer() {
    settingsDrawer.dataset.open = 'false';
    drawerBackdrop.dataset.visible = 'false';
  }
  function drawerAbierto() {
    return settingsDrawer.dataset.open === 'true';
  }

  function abrirProximamente(clave) {
    soonTitle.textContent = PROXIMAMENTE[clave].titulo;
    soonText.textContent = PROXIMAMENTE[clave].texto;
    soonOverlay.dataset.visible = 'true';
  }
  function cerrarProximamente() {
    soonOverlay.dataset.visible = 'false';
  }
  function proximamenteAbierto() {
    return soonOverlay.dataset.visible === 'true';
  }

  // ---------- Cámara ----------

  function setCameraStatus(state, text) {
    cameraStatusBadge.dataset.state = state;
    cameraStatusText.textContent = text;
  }

  // "camaraId" es el deviceId elegido en Ajustes › Cámara (C3), guardado por evento como el
  // resto de los ajustes de sesión. Sin elección (null), se pide la cámara "ideal" del
  // sistema, igual que siempre — así una cabina que nunca tocó ese selector sigue andando
  // sin cambios. El deviceId de MediaDevices no es un identificador físico estable: el
  // navegador puede rotarlo entre sesiones (política de privacidad/fingerprinting) o la
  // cámara puede haberse desenchufado — si el guardado ya no sirve, cae sola a la cámara
  // genérica del equipo en vez de dejar la cabina bloqueada hasta que el operador entre a
  // Ajustes a mano.
  async function connectCamera(forzarGenerica) {
    hideNotice();
    connectBtn.disabled = true;
    connectBtn.textContent = 'Conectando…';
    setCameraStatus('warn', 'Cámara conectando');

    const usarIdGuardado = ajustes.camaraId && !forzarGenerica;
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const videoConstraints = usarIdGuardado
        ? { deviceId: { exact: ajustes.camaraId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: { ideal: 'user' }, width: { ideal: 1920 }, height: { ideal: 1080 } };
      stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      video.srcObject = stream;
      await video.play();
      vigilarDesconexion(stream);

      cabin.classList.add('is-connected');
      connectHint.classList.remove('stage-hint--error');
      setCameraStatus('ready', 'Cámara lista');
      connectHint.textContent = `Todo listo. Lanza el evento cuando quieras. Durante el evento, toca "Operador" e ingresa tu PIN para volver aquí.`;
      connectBtn.textContent = 'Cámara conectada';
      actualizarLanzamiento();
      poblarSelectorCamaras();
    } catch (e) {
      if (usarIdGuardado) {
        // La cámara elegida ya no responde: se prueba una vez más con la genérica del
        // equipo antes de rendirse, para no dejar la cabina sin cámara por un deviceId
        // vencido que el operador ni sabe que cambió.
        connectCamera(true);
        return;
      }
      setCameraStatus('error', 'Cámara sin conectar');
      connectBtn.disabled = false;
      connectBtn.textContent = 'Reintentar cámara';
      mostrarErrorEnPanelCamara(mensajeErrorCamara(e));
    }
  }

  // Los errores de cámara se muestran debajo del propio botón "Conectar/Reconectar", en el
  // lugar donde el operador ya está mirando — no como aviso flotante, que quedaba encimado
  // sobre este mismo panel (los dos se anclan abajo al centro).
  function mostrarErrorEnPanelCamara(texto) {
    connectHint.textContent = texto;
    connectHint.classList.add('stage-hint--error');
  }

  // Cada causa pide una acción distinta del operador, así que cada una tiene su mensaje.
  function mensajeErrorCamara(e) {
    const nombre = e && e.name;
    if (nombre === 'NotAllowedError' || nombre === 'SecurityError') return 'El navegador no tiene permiso para usar la cámara. Toca el candado de la barra de direcciones y permite la cámara.';
    if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No encontramos ninguna cámara conectada. Revisa el cable USB y vuelve a intentar.';
    if (nombre === 'NotReadableError' || nombre === 'AbortError') return 'La cámara está siendo usada por otro programa. Cierra las otras apps de cámara (Zoom, Teams, la app de Cámara) y reintenta.';
    return 'No pudimos abrir la cámara. Revisa que esté conectada y reintenta.';
  }

  // Si la cámara se desconecta después de conectar (cable flojo, batería de la DSLR), el
  // navegador corta el track: el semáforo pasa a rojo y "Lanzar evento" se bloquea, en vez
  // de quedar mostrando el último cuadro congelado como si siguiera viva.
  function vigilarDesconexion(s) {
    s.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        if (stream !== s) return;
        video.srcObject = null;
        cabin.classList.remove('is-connected');
        setCameraStatus('error', 'Cámara desconectada');
        connectBtn.disabled = false;
        connectBtn.textContent = 'Reconectar cámara';
        launchBtn.disabled = true;
        mostrarErrorEnPanelCamara('Se perdió la conexión con la cámara. Revisa el cable y toca "Reconectar cámara".');
      });
    });
  }

  // Lista las cámaras reales del equipo en el selector de Ajustes › Cámara. El navegador
  // solo entrega nombres (label) de dispositivo después de que el operador ya dio permiso
  // de cámara al menos una vez — por eso se llama recién tras un connectCamera() exitoso,
  // no al cargar la página.
  async function poblarSelectorCamaras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    let dispositivos = [];
    try {
      dispositivos = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    } catch (e) {
      return;
    }
    if (!dispositivos.length) return;
    camarasListadas = dispositivos.map((d, i) => ({ id: d.deviceId, etiqueta: d.label || `Cámara ${i + 1}` }));
    actualizarLanzamiento();

    const select = q('.ds-select[data-select="camera"]');
    if (!select) return;
    const menu = select.querySelector('.ds-select-menu');
    const value = select.querySelector('.ds-select-value');

    menu.innerHTML = '';
    dispositivos.forEach((d, i) => {
      const opcion = document.createElement('li');
      opcion.className = 'ds-select-option';
      opcion.setAttribute('role', 'option');
      opcion.dataset.value = d.deviceId;
      opcion.textContent = d.label || `Cámara ${i + 1}`;
      if (d.deviceId === ajustes.camaraId) opcion.setAttribute('aria-selected', 'true');
      menu.appendChild(opcion);
    });

    const activa = dispositivos.find((d) => d.deviceId === ajustes.camaraId);
    value.textContent = activa ? (activa.label || 'Cámara elegida') : dispositivos[0].label || 'Cámara del dispositivo';
    if (!activa) menu.querySelector('.ds-select-option').setAttribute('aria-selected', 'true');
  }

  // ---------- Marco de encuadre (guía proporcional al tamaño de foto en la plantilla) ----------

  // Proporción (ancho / alto) del marco que se está mostrando. `capture()` recorta a esta misma
  // proporción, así lo que el invitado ve dentro del marco es lo que queda en la foto.
  let ratioMarcoActual = FRAME_RATIO_NUM;

  function updateFrameWindow(numeroFoto) {
    let ratio = FRAME_RATIO_NUM;
    if (plantillaActiva) {
      const r = MotorPlantillas.proporcionDeFoto(plantillaActiva, numeroFoto || 1);
      if (r && isFinite(r) && r > 0) ratio = r;
    }
    ratioMarcoActual = ratio;
    frameWindow.style.setProperty('--frame-ratio', String(Math.round(ratio * 1000) / 1000));
  }

  // ---------- Modo invitado: entrar / salir ----------

  // Primera vez en este equipo: antes de lanzar hay que crear el PIN de operador, porque sin
  // él nadie podría volver a los controles (ni existe un PIN de fábrica que adivinar).
  async function pedirLanzamiento() {
    cerrarDrawer();
    try {
      await cargarPlantilla(false); // la plantilla se relee y queda fija para este lanzamiento
    } catch (e) {
      estadoPlantilla = { modo: 'invalida', motivo: 'No se pudo leer la plantilla de este evento. Elige o crea una en el editor.' };
      plantillaActiva = null;
      actualizarResumenPlantilla();
    }
    if (estadoPlantilla.modo === 'cargando') { showNotice('Un momento: estamos revisando la plantilla. Vuelve a tocar "Lanzar evento".'); return; }
    if (estadoPlantilla.modo !== 'valida' && estadoPlantilla.modo !== 'demo') {
      showNotice('Primero elige una plantilla válida para este evento.');
      return;
    }
    // Cualquier otro bloqueo del evento (por ejemplo, archivado) también lo dice el validador.
    const veredicto = evaluarEvento();
    const otro = veredicto && veredicto.bloqueos.find((b) => b.codigo !== 'SIN_CAMARA');
    if (otro) { showNotice(otro.mensaje); return; }
    if (!cabin.classList.contains('is-connected')) { showNotice('La cámara no está conectada.'); return; }
    if (plantillaActiva) { try { await congelarVigente(plantillaActiva); } catch (e) { /* la sesión igual queda sin copia congelada */ } }
    if (AjustesEquipo.estadoPin().definido) launchEvent();
    else abrirPin('crear', launchEvent);
  }

  function launchEvent() {
    cerrarDrawer();
    cerrarProximamente();
    // Se relee el evento antes de entrar a modo invitado: si se terminó o se eliminó desde otra pestaña
    // mientras el operador tecleaba el PIN, no se lanza y se le avisa (el aviso es para el operador).
    if (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') {
      const vigente = AlmacenEventos.obtener(eventoActual.id);
      if (!vigente) { showNotice('Este evento ya no existe (se eliminó desde otra pestaña). Vuelve a la lista de eventos.'); actualizarSeccionEvento(); return; }
      if (vigente.estado === 'archivado') { showNotice('Este evento ya se terminó, así que no se lanzó. Para seguir, reábrelo desde la lista de eventos.'); actualizarSeccionEvento(); return; }
    }
    marcarEventoEnCurso();
    cabin.classList.add('is-guest-mode');
    updateFrameWindow(1);

    if (cabin.requestFullscreen) {
      cabin.requestFullscreen().catch(() => {});
    }

    enterIdle();
  }

  function exitEvent() {
    detenerTemporizadorInicio();
    liberarImpresionEnEspera();
    if (sessionActive) cancelRequested = true;
    cerrarSesionAbierta();
    cabin.classList.remove('is-guest-mode');
    sessionActive = false;
    paused = false;
    pausadoPorPin = false;
    review.hidden = true;
    composing.hidden = true;
    result.hidden = true;
    guestIdle.dataset.visible = 'false';
    countdownLayer.dataset.visible = 'false';
    interstitialLayer.dataset.visible = 'false';
    pauseOverlay.dataset.visible = 'false';
    pinOverlay.dataset.visible = 'false';
    pauseBtn.hidden = true;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function enterIdle() {
    detenerTemporizadorInicio();
    cerrarSesionAbierta();
    photos = [];
    finalBlob = null;
    hojaBlob = null;
    hojaMedidas = null;
    gifBlob = null;
    sesionActual = null;
    gifGeneracion++;
    sessionActive = false;
    paused = false;
    review.hidden = true;
    composing.hidden = true;
    result.hidden = true;
    guestIdle.dataset.visible = 'true';
    countdownLayer.dataset.visible = 'false';
    interstitialLayer.dataset.visible = 'false';
    pauseOverlay.dataset.visible = 'false';
    pauseBtn.hidden = true;
    liberarImpresionEnEspera(); // ya con el resultado oculto: confirma la impresión automática que esperaba
  }

  // ---------- Sesión de captura ----------

  async function runSession() {
    guestIdle.dataset.visible = 'false';
    photos = [];
    await captureAllPhotos(0);
  }

  // ---------- Sesión en disco: cada foto se guarda en el instante de tomarla ----------
  // (docs/ARQUITECTURA_FLUJO.md §4 A3 y §5.3). Si se corta la luz o se cierra la página a mitad
  // de la sesión, las fotos ya tomadas existen: la sesión queda "incompleta" en la galería.

  function asegurarSesion() {
    if (!sesionActual) {
      const ahora = new Date().toISOString();
      sesionActual = {
        id: AlmacenSesiones.nuevoId(),
        evento: eventoActual.id,
        eventoId: eventoActual.id,
        equipoId: null,
        eventoNombre: eventoActual.nombre,
        fecha: ahora,
        iniciadaEn: ahora,
        estado: 'capturando',
        fotosEsperadas: numeroDeFotos(),
        plantilla: { id: plantillaActiva ? plantillaActiva.id : null, copiaCongelada: !!(plantillaActiva && huellaActiva && congeladaOk), huella: plantillaActiva ? huellaActiva : null },
        configCongelada: configSesion(),
        esEnsayo: false,
        error: null,
        fotos: [],
        intentosFotos: [],
      };
    }
    return sesionActual;
  }

  // Cambia el estado de la sesión y lo deja escrito (después de las fotos que ya estaban en cola).
  function marcarEstado(estado, extra) {
    const sesion = sesionActual;
    if (!sesion) return Promise.resolve();
    sesion.estado = estado;
    Object.assign(sesion, extra || {});
    return encolarGuardado(async () => {
      if ((sesion.intentosFotos || []).length === 0) return; // aún no hay nada en disco
      await AlmacenSesiones.guardarRegistro(sesion);
    }).catch(() => avisarFalloDeGuardado()).then(actualizarContadorEvento);
  }

  function guardarFotoAhora(indice) {
    const sesion = asegurarSesion();
    const dataUrl = photos[indice];
    return encolarGuardado(() => AlmacenSesiones.guardarFoto(sesion, indice + 1, dataUrl))
      .catch(() => avisarFalloDeGuardado());
  }

  // El invitado se fue o la sesión se cortó antes de terminar: las fotos tomadas se conservan.
  function cerrarSesionAbierta() {
    const sesion = sesionActual;
    if (!sesion || !AlmacenSesiones.ESTADOS_ABIERTOS.includes(sesion.estado)) return;
    sesion.estado = 'incompleta';
    sesion.terminadaEn = new Date().toISOString();
    encolarGuardado(async () => {
      if ((sesion.intentosFotos || []).length === 0) return; // sin fotos no hay nada que conservar
      await AlmacenSesiones.guardarRegistro(sesion);
    }).catch(() => avisarFalloDeGuardado()).then(actualizarContadorEvento);
  }

  function beginCapture() {
    sessionActive = true;
    cancelRequested = false;
    pauseBtn.hidden = false;
    countdownLayer.dataset.visible = 'true';
  }

  function endCapture() {
    countdownLayer.dataset.visible = 'false';
    interstitialLayer.dataset.visible = 'false';
    pauseBtn.hidden = true;
    sessionActive = false;
  }

  async function captureAllPhotos(startIndex) {
    beginCapture();
    asegurarSesion();
    sesionActual.estado = 'capturando';
    try {
      const total = numeroDeFotos();
      for (let i = startIndex; i < total; i++) {
        updateFrameWindow(i + 1);
        countdownLabel.textContent = `Foto ${i + 1} de ${total}`;
        await countdown(ajustes.cuenta);
        let foto = capture();
        if (!foto) {
          // La cámara no entregó imagen: se avisa y se repite esta foto (hasta 3 veces) sin perder la sesión.
          let intentos = 1;
          while (!foto && intentos < 3) { showNotice('La cámara no entregó imagen. Repitiendo la foto…'); await countdown(ajustes.cuenta); foto = capture(); intentos++; }
          if (!foto) { showNotice('La cámara no entregó imagen. La sesión se canceló.'); throw new SessionCancelled(); }
        }
        photos[i] = foto;
        guardarFotoAhora(i);

        if (i < total - 1 && ajustes.pausa > 0) {
          countdownLayer.dataset.visible = 'false';
          await runInterstitial();
          countdownLayer.dataset.visible = 'true';
        }
      }
      endCapture();
      showReview();
    } catch (e) {
      if (!(e instanceof SessionCancelled)) throw e;
      endCapture();
      enterIdle();
    }
  }

  async function countdown(totalSeconds) {
    countdownNumber.classList.remove('countdown-number--shot');
    for (let n = totalSeconds; n > 0; n--) {
      countdownNumber.textContent = n;
      await interruptibleWait(1000);
    }
    countdownNumber.innerHTML = ICONO_CAMARA;
    countdownNumber.classList.add('countdown-number--shot');
    await interruptibleWait(250);
  }

  // Pausa entre fotos: da tiempo a cambiar pose/prop y sirve para regular el ritmo de la fila.
  // La duración y el mensaje quedan como parámetros simples acá; el editor visual de este paso
  // (animaciones/GIFs propios del operador) se construye más adelante en el panel de operador.
  async function runInterstitial() {
    interstitialText.textContent = ajustes.mensajePausa;
    interstitialLayer.dataset.visible = 'true';
    for (let s = ajustes.pausa; s > 0; s--) {
      interstitialTimer.textContent = s;
      await interruptibleWait(1000);
    }
    interstitialLayer.dataset.visible = 'false';
  }

  // ---------- Recorte de la foto al marco (sin estirar nunca) ----------
  // La cámara puede entregar 4:3, 16:9 (DSLR, capturadora) o vertical. La foto se RECORTA (cover,
  // centrado en el marco) a la proporción del espacio de foto de la plantilla; nunca se deforma.

  const LADO_MAXIMO_FOTO = 2560;

  // Ajusta un rectángulo de origen (sx, sy, sw, sh) a la proporción exacta `ratio`, sin salirse de él
  // y manteniendo su centro. Con eso la foto sale con la proporción pedida aunque el marco en
  // pantalla tenga un borde de un par de píxeles.
  function ajustarARatio(rect, ratio) {
    let { sx, sy, sw, sh } = rect;
    if (sw / sh > ratio) { const nuevoAncho = sh * ratio; sx += (sw - nuevoAncho) / 2; sw = nuevoAncho; }
    else { const nuevoAlto = sw / ratio; sy += (sh - nuevoAlto) / 2; sh = nuevoAlto; }
    return { sx, sy, sw, sh };
  }

  // Recorte centrado del mayor tamaño posible con esa proporción (cuando no hay marco medible).
  function recorteCentrado(vw, vh, ratio) {
    return ajustarARatio({ sx: 0, sy: 0, sw: vw, sh: vh }, ratio);
  }

  // Región del video (en píxeles del video) que queda dentro del marco de la pantalla.
  //   vw, vh: tamaño real del video · escenario: { ancho, alto } del contenedor del video (que lo
  //   muestra con object-fit: cover, centrado) · marco: { x, y, ancho, alto } relativo a ese
  //   contenedor · espejo: si el video se muestra reflejado.
  function recorteDelMarco(vw, vh, escenario, marco, espejo, ratio) {
    const k = Math.max(escenario.ancho / vw, escenario.alto / vh);
    const ox = (escenario.ancho - vw * k) / 2;
    const oy = (escenario.alto - vh * k) / 2;
    const xMarco = espejo ? escenario.ancho - (marco.x + marco.ancho) : marco.x;
    const crudo = { sx: (xMarco - ox) / k, sy: (marco.y - oy) / k, sw: marco.ancho / k, sh: marco.alto / k };
    // El marco nunca debería salirse del video; si por redondeos lo hace, se recorta al video.
    const x0 = Math.max(0, crudo.sx), y0 = Math.max(0, crudo.sy);
    const x1 = Math.min(vw, crudo.sx + crudo.sw), y1 = Math.min(vh, crudo.sy + crudo.sh);
    return ajustarARatio({ sx: x0, sy: y0, sw: Math.max(1, x1 - x0), sh: Math.max(1, y1 - y0) }, ratio);
  }

  function regionDeCaptura() {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return null;
    const ratio = ratioMarcoActual;
    const espejo = !!ajustes.espejo;
    const escena = video.getBoundingClientRect();
    // El marco anima su proporción (220 ms): se mide ya en su tamaño final, sin transición.
    const transicion = frameWindow.style.transition;
    frameWindow.style.transition = 'none';
    const marco = frameWindow.getBoundingClientRect();
    frameWindow.style.transition = transicion;
    if (escena.width > 0 && escena.height > 0 && marco.width > 0 && marco.height > 0) {
      return recorteDelMarco(vw, vh, { ancho: escena.width, alto: escena.height }, { x: marco.left - escena.left, y: marco.top - escena.top, ancho: marco.width, alto: marco.height }, espejo, ratio);
    }
    return recorteCentrado(vw, vh, ratio);
  }

  function capture() {
    const region = regionDeCaptura();
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (region) {
      // Tamaño de salida: el del recorte en píxeles reales del video (hasta un tope), con la
      // proporción exacta del marco.
      const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(region.sw, region.sh));
      c.width = Math.max(1, Math.round(region.sw * escala));
      c.height = Math.max(1, Math.round(region.sh * escala));
      if (ajustes.espejo) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      // En espejo, el video se dibuja sin reflejar su región y el canvas se refleja: igual que la pantalla.
      ctx.drawImage(video, region.sx, region.sy, region.sw, region.sh, 0, 0, c.width, c.height);
    } else {
      return null; // el video no entrega imagen: nunca se guarda una foto negra
    }

    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');

    return c.toDataURL('image/jpeg', 0.92);
  }

  // ---------- Pausa / reanudar / cancelar ----------

  function pauseSession() {
    if (!sessionActive) return;
    paused = true;
    pauseOverlay.dataset.visible = 'true';
  }

  function resumeSession() {
    paused = false;
    pauseOverlay.dataset.visible = 'false';
  }

  function cancelSession() {
    cancelRequested = true;
    paused = false;
    pauseOverlay.dataset.visible = 'false';
  }

  // ---------- PIN de operador (del equipo, no del evento) ----------
  // El PIN vive en shared/equipo.js: con hash, sin valor de fábrica y con bloqueo tras intentos
  // fallidos que sobrevive a recargar la página. Este teclado sirve para tres cosas:
  //   entrar  -> volver a los controles de operador desde el modo invitado
  //   crear   -> primera vez en este equipo: elegir el PIN antes de lanzar el evento
  //   cambiar -> Ajustes > Cambiar PIN (pide el actual, luego el nuevo dos veces)
  const TEXTOS_PIN = {
    actual: 'Ingresa tu PIN actual.',
    verificar: 'Ingresa el PIN para volver a los controles.',
    nuevo: 'Elige un PIN de 4 dígitos.',
    repetir: 'Repite el PIN para confirmarlo.',
  };
  let pinFlujo = null; // { modo, pasos, paso, nuevo, alTerminar }
  let pinOcupado = false;
  let relojBloqueo = null;

  function renderPinDots() {
    Array.from(pinDots.children).forEach((dot, i) => {
      dot.dataset.filled = String(i < pinBuffer.length);
    });
  }

  function pinMensaje(texto, esError) {
    pinHint.textContent = texto;
    pinHint.classList.toggle('pin-hint--error', !!esError);
    pinDots.classList.toggle('pin-dots--error', !!esError);
  }

  function formatearRestante(ms) {
    const total = Math.ceil(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function pasoPideVerificar() {
    const paso = pinFlujo && pinFlujo.pasos[pinFlujo.paso];
    return paso === 'actual' || paso === 'verificar';
  }

  // Mientras el equipo está bloqueado por intentos fallidos, el teclado se desactiva y muestra
  // cuánto falta. Al vencer el bloqueo vuelve solo a pedir el PIN.
  function actualizarBloqueoPin() {
    clearInterval(relojBloqueo);
    relojBloqueo = null;
    if (!pinFlujo || !pasoPideVerificar()) { pinPad.classList.remove('is-locked'); return; }
    const estado = AjustesEquipo.estadoPin();
    pinPad.classList.toggle('is-locked', estado.bloqueado);
    if (!estado.bloqueado) {
      if (pinHint.dataset.bloqueo === 'true') {
        pinHint.dataset.bloqueo = 'false';
        pinMensaje(TEXTOS_PIN[pinFlujo.pasos[pinFlujo.paso]], false);
      }
      return;
    }
    pinHint.dataset.bloqueo = 'true';
    pinBuffer = '';
    renderPinDots();
    pinMensaje(`Demasiados intentos. Vuelve a intentar en ${formatearRestante(estado.restanteMs)}.`, true);
    relojBloqueo = setInterval(actualizarBloqueoPin, 1000);
  }

  function mostrarPaso() {
    pinBuffer = '';
    renderPinDots();
    pinHint.dataset.bloqueo = 'false';
    pinMensaje(TEXTOS_PIN[pinFlujo.pasos[pinFlujo.paso]], false);
    pinTitle.textContent = pinFlujo.modo === 'entrar' ? 'Acceso de operador' : (pinFlujo.modo === 'crear' ? 'Crea tu PIN de operador' : 'Cambiar PIN');
    actualizarBloqueoPin();
  }

  function abrirPin(modo = 'entrar', alTerminar = null, alCerrar = null) {
    const definido = AjustesEquipo.estadoPin().definido;
    if (modo === 'entrar' && !definido) { exitEvent(); return; } // sin PIN en el equipo, nadie queda encerrado
    const pasos = modo === 'entrar' ? ['verificar'] : (definido ? ['actual', 'nuevo', 'repetir'] : ['nuevo', 'repetir']);
    pinFlujo = { modo: modo === 'entrar' ? modo : (definido ? 'cambiar' : 'crear'), pasos, paso: 0, nuevo: '', alTerminar, alCerrar };
    pinOverlay.dataset.visible = 'true';
    mostrarPaso();
    if (sessionActive && !paused) {
      pauseSession();
      pausadoPorPin = true;
    }
  }

  function cerrarPin() {
    const flujoCerrado = pinFlujo;
    if (flujoCerrado && flujoCerrado.alCerrar) flujoCerrado.alCerrar(); // cancelado: quien pidió el PIN retoma lo suyo
    clearInterval(relojBloqueo);
    relojBloqueo = null;
    pinOverlay.dataset.visible = 'false';
    pinBuffer = '';
    pinFlujo = null;
    pinPad.classList.remove('is-locked');
    if (pausadoPorPin) {
      pausadoPorPin = false;
      resumeSession();
    }
  }

  function pinAbierto() {
    return pinOverlay.dataset.visible === 'true';
  }

  async function pinCompleto() {
    const flujo = pinFlujo;
    const paso = flujo.pasos[flujo.paso];
    pinOcupado = true;
    try {
      if (paso === 'verificar' || paso === 'actual') {
        const resultado = await AjustesEquipo.verificarPin(pinBuffer);
        if (pinFlujo !== flujo) return; // se canceló mientras se verificaba
        if (resultado.ok) {
          if (paso === 'verificar') { pausadoPorPin = false; cerrarPin(); exitEvent(); return; }
          flujo.paso += 1;
          mostrarPaso();
          return;
        }
        if (resultado.bloqueado) { actualizarBloqueoPin(); return; }
        const quedan = resultado.intentosRestantes;
        pinMensaje(`PIN incorrecto. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`, true);
        await sleep(700);
        if (pinFlujo !== flujo) return;
        pinBuffer = '';
        renderPinDots();
        pinDots.classList.remove('pin-dots--error');
        return;
      }

      if (paso === 'nuevo') {
        const problema = AjustesEquipo.problemaConPin(pinBuffer);
        if (problema) {
          pinMensaje(problema, true);
          await sleep(900);
          if (pinFlujo === flujo) mostrarPaso();
          return;
        }
        flujo.nuevo = pinBuffer;
        flujo.paso += 1;
        mostrarPaso();
        return;
      }

      if (paso === 'repetir') {
        if (pinBuffer !== flujo.nuevo) {
          pinMensaje('Los PIN no coinciden. Empecemos de nuevo.', true);
          await sleep(900);
          if (pinFlujo !== flujo) return;
          flujo.paso = flujo.pasos.indexOf('nuevo');
          flujo.nuevo = '';
          mostrarPaso();
          return;
        }
        const guardado = await AjustesEquipo.definirPin(flujo.nuevo);
        if (pinFlujo !== flujo) { actualizarEstadoPin(); return; } // se canceló: el PIN quedó guardado pero no se lanza nada
        if (!guardado.ok) {
          pinMensaje(guardado.motivo, true);
          await sleep(1200);
          if (pinFlujo !== flujo) return;
          flujo.paso = flujo.pasos.indexOf('nuevo');
          mostrarPaso();
          return;
        }
        cerrarPin();
        actualizarEstadoPin();
        if (flujo.modo === 'cambiar') showNotice('Listo, cambiaste tu PIN.');
        if (flujo.alTerminar) flujo.alTerminar();
      }
    } finally {
      pinOcupado = false;
    }
  }

  async function teclaPin(key) {
    if (pinOcupado) return;
    if (key === 'cancel') { cerrarPin(); return; }
    if (pinPad.classList.contains('is-locked')) return;
    if (key === 'back') { pinBuffer = pinBuffer.slice(0, -1); renderPinDots(); return; }
    if (!/^\d$/.test(key) || pinBuffer.length >= 4) return;

    pinBuffer += key;
    renderPinDots();
    if (pinBuffer.length < 4) return;
    await pinCompleto();
  }

  // Estado del PIN en Ajustes: dice si ya hay uno y deja cambiarlo (nunca lo muestra).
  function actualizarEstadoPin() {
    const definido = AjustesEquipo.estadoPin().definido;
    pinChangeBtn.textContent = definido ? 'Cambiar PIN' : 'Crear PIN';
    pinStatus.textContent = definido
      ? 'Es el mismo para todos los eventos de este equipo.'
      : 'Aún no tienes PIN. Se te pedirá crearlo al lanzar el evento.';
  }

  // ---------- Miniatura reusable con chips de acción (revisión, resultado y galería) ----------

  function buildThumb(src, index, acciones) {
    const wrap = document.createElement('div');
    wrap.className = 'review-thumb-wrap';

    const img = document.createElement('img');
    img.src = src;
    img.className = 'review-thumb';
    img.alt = `Foto ${index + 1} de la sesión`;
    wrap.appendChild(img);

    const bar = document.createElement('div');
    bar.className = 'thumb-actions';
    acciones.forEach((accion) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'thumb-chip' + (accion.primaria ? ' thumb-chip--primary' : '');
      chip.innerHTML = `${accion.icono}<span>${accion.etiqueta}</span>`;
      chip.setAttribute('aria-label', `${accion.etiqueta} foto ${index + 1}`);
      chip.addEventListener('click', () => accion.alHacerClick(index));
      bar.appendChild(chip);
    });
    wrap.appendChild(bar);
    return wrap;
  }

  const accionRepetir = (handler) => ({ etiqueta: 'Repetir', icono: ICONO_REPETIR, primaria: true, alHacerClick: handler });
  const accionDescargarFoto = (fuente) => ({
    etiqueta: 'Descargar',
    icono: ICONO_DESCARGAR,
    primaria: false,
    alHacerClick: (i) => descargarDataUrl(fuente()[i], `fotocabina-foto-${i + 1}.jpg`),
  });

  // ---------- Revisión (con repetir foto individual) ----------

  function showReview() {
    reviewStrip.innerHTML = '';
    photos.forEach((src, index) => {
      reviewStrip.appendChild(buildThumb(src, index, [accionRepetir(retakeSinglePhoto)]));
    });
    review.hidden = false;
    marcarEstado('revision');
  }

  async function recaptureOne(index) {
    beginCapture();
    updateFrameWindow(index + 1);
    countdownLabel.textContent = `Repitiendo foto ${index + 1} de ${numeroDeFotos()}`;
    try {
      await countdown(ajustes.cuenta);
      const foto = capture();
      if (!foto) {
        showNotice('La cámara no entregó imagen. Toca "Repetir" de nuevo.');
        endCapture();
        return true; // vuelve a la revisión con la foto anterior intacta
      }
      photos[index] = foto;
      guardarFotoAhora(index);
      endCapture();
      return true;
    } catch (e) {
      if (!(e instanceof SessionCancelled)) throw e;
      endCapture();
      enterIdle();
      return false;
    }
  }

  async function retakeSinglePhoto(index) {
    review.hidden = true;
    if (await recaptureOne(index)) showReview();
  }

  function retakeAllPhotos() {
    photos = [];
    review.hidden = true;
    captureAllPhotos(0);
  }

  // ---------- Componer, guardar y mostrar resultado ----------

  async function confirmAndCompose() {
    review.hidden = true;
    composing.hidden = false;
    marcarEstado('componiendo', { error: null });
    try {
      await compose();
    } catch (e) {
      // La tira no se pudo armar: las fotos originales siguen a salvo en disco. La sesión queda
      // "fallida" con el paso donde falló y el invitado puede volver a intentar desde la revisión.
      composing.hidden = true;
      showReview();
      await marcarEstado('fallida', { error: { paso: 'componiendo', mensaje: String((e && e.message) || e) } });
      showNotice('No se pudo armar la tira. Toca "Confirmar" para intentarlo de nuevo.');
      return;
    }
    composing.hidden = true;
    setResultTab('strip');
    aplicarModoEntrega();
    result.hidden = false;
    iniciarTemporizadorInicio();
    imprimirAutomatico();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawCover(ctx, img, dx, dy, dw, dh) {
    const scale = Math.max(dw / img.width, dh / img.height);
    const sw = dw / scale;
    const sh = dh / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function aBlob(canvas) {
    return new Promise((resolver, rechazar) => canvas.toBlob((b) => (b ? resolver(b) : rechazar(new Error('No se pudo crear la imagen'))), 'image/png'));
  }

  // Número de esta sesión dentro del evento. Sale de un contador propio del evento (guardado, no se
  // recalcula): sobrevive a borrados de sesiones y a reiniciar, y nunca entrega dos veces el mismo
  // número. Las sesiones guardadas antes de que existiera el contador se tienen en cuenta la primera
  // vez (`minimo`). Se guarda en la sesión para no cambiar al reintentar la composición.
  async function numeroDeSesion(sesion) {
    if (sesion.numero) return sesion.numero;
    let minimo = ultimoNumeroAsignado;
    try {
      const registros = await AlmacenSesiones.listarRegistros(eventoActual.id);
      const armadas = registros.filter((r) => r.id !== sesion.id && AlmacenSesiones.esCompleta(r));
      // Las sesiones con número cuentan por su número; las antiguas (sin número) por conteo.
      minimo = Math.max(minimo, armadas.length, ...armadas.map((r) => Number(r.numero) || 0));
    } catch (e) {
      // Sin lectura del almacén el contador guardado igual evita repetir; se suma el de esta pantalla.
    }
    sesion.numero = AlmacenEventos.siguienteNumeroSesion(eventoActual.id, minimo);
    ultimoNumeroAsignado = Math.max(ultimoNumeroAsignado, sesion.numero);
    return sesion.numero;
  }

  // Con plantilla real: la tira es la plantilla tal cual; la hoja es lo que se imprime (dos tiras en 4x6 si la plantilla lo pide).
  async function componerConPlantilla() {
    const p = plantillaActiva;
    const v = MotorPlantillas.validarPlantilla(p);
    if (!v.valida) throw new Error(v.motivos.join(' '));
    if (photos.filter(Boolean).length < MotorPlantillas.contarFotos(p)) throw new Error('Faltan fotos para la plantilla');
    const sesion = asegurarSesion();
    const opciones = { fotos: photos, datos: { fecha: new Date(), numeroSesion: await numeroDeSesion(sesion), nombreEvento: eventoActual.nombre } };
    const hoja = await MotorPlantillas.renderizarHoja(p, opciones);
    const tira = hoja.copias === 1 ? hoja.canvas : await MotorPlantillas.renderizar(p, opciones);
    const nuevaTira = await aBlob(tira);
    const nuevaHoja = hoja.copias === 1 ? null : await aBlob(hoja.canvas);
    finalBlob = nuevaTira;
    hojaBlob = nuevaHoja;
    hojaMedidas = { anchoMm: hoja.anchoMm, altoMm: hoja.altoMm };
  }

  // Sin evento (demostración): el diseño fijo de siempre.
  async function componerDemo() {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 1800;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#18191B';
    ctx.fillRect(48, 48, 1104, 1704);

    ctx.fillStyle = '#F4F5F2';
    ctx.font = '700 44px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('FOTOCABINA', 600, 140);
    ctx.fillStyle = '#C6FF3D';
    ctx.font = '600 22px Inter, system-ui';
    ctx.fillText(new Date().toLocaleDateString('es-CL'), 600, 178);

    // Las fotos se reparten en el alto disponible (230 → 1690) según cuántas haya en la sesión.
    const margin = 96, gap = 24, w = 1008;
    const h = Math.floor((1460 - gap * (photos.length - 1)) / photos.length);
    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = 230 + i * (h + gap);
      drawCover(ctx, img, margin, y, w, h);
      ctx.strokeStyle = '#C6FF3D';
      ctx.lineWidth = 4;
      ctx.strokeRect(margin, y, w, h);
    }

    ctx.fillStyle = '#8A8D91';
    ctx.font = '600 22px Inter, system-ui';
    ctx.fillText('Hecho con FotoCabina', 600, 1710);
    finalBlob = await aBlob(c);
    hojaBlob = null;
    hojaMedidas = null;
  }

  async function compose() {
    if (plantillaActiva) await componerConPlantilla();
    else await componerDemo();
    if (finalPrint.src) URL.revokeObjectURL(finalPrint.src);
    finalPrint.src = URL.createObjectURL(finalBlob);

    // Una vez armada la tira no hay vuelta atrás: la única chance de repetir una foto es la revisión previa.
    resultPhotosGrid.innerHTML = '';
    photos.forEach((src, index) => {
      resultPhotosGrid.appendChild(buildThumb(src, index, [accionDescargarFoto(() => photos)]));
    });

    await guardarSesionActual();
    // Solo impresión: no hay GIF ni QR (la sesión es más rápida y el invitado no ve salidas digitales).
    if (modoDeEntrega() === 'impresion') {
      gifGeneracion++;
      gifBlob = null;
      if (qrEntregaTimeout) clearTimeout(qrEntregaTimeout);
    } else {
      generarGif();
      mostrarQrEntrega();
    }
  }

  // ---------- Entrega digital por QR (A8 del mapa de pantallas) ----------
  // Maqueta visual: el QR se genera de verdad (librería qrcode vendorizada, sin red), pero
  // apunta a una URL de muestra porque todavía no existe el servidor local de la Fase D
  // (docs/DSLRBOOTH_PRODUCT_CONTEXT.md §3.6/§3.7). El paso a "descargado" está simulado.
  let qrEntregaTimeout = null;

  function mostrarQrEntrega() {
    if (qrEntregaTimeout) clearTimeout(qrEntregaTimeout);
    qrCard.hidden = false;
    qrCard.dataset.state = 'waiting';
    qrCardTitle.textContent = 'Llévate tus fotos';
    qrCardSub.textContent = 'Escanea el código con tu celular';

    const idSesion = (sesionActual && sesionActual.id) || 'demo';
    const urlMuestra = `https://fotocabina.app/s/${idSesion}`;
    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(qrCanvas, urlMuestra, { width: 152, margin: 1, color: { dark: '#0A0A0B', light: '#FFFFFF' } }, (err) => {
        if (err) qrCard.hidden = true;
      });
    } else {
      qrCard.hidden = true;
    }

    // Simulación del escaneo real: en un evento de verdad este cambio lo dispara el servidor
    // local cuando confirma la descarga, no un temporizador fijo en el navegador.
    qrEntregaTimeout = setTimeout(() => {
      qrCard.dataset.state = 'done';
      qrCardTitle.textContent = 'Descargado';
      qrCardSub.textContent = 'Ya lo tienes en tu celular';
    }, 6000);
  }

  // Al armar la tira se guardan la tira y el estado "compuesta". Las fotos ya estaban en disco
  // desde que se tomaron; si alguna no se pudo guardar entonces, aquí se reintenta.
  async function guardarSesionActual() {
    const sesion = asegurarSesion();
    sesion.fotos = photos.slice();
    sesion.tira = finalBlob;
    sesion.hoja = hojaBlob;
    sesion.impresion = hojaMedidas || sesion.impresion || null;
    sesion.gif = gifBlob;
    sesion.estado = 'compuesta';
    sesion.error = null;
    try {
      await encolarGuardado(() => AlmacenSesiones.guardar(sesion));
    } catch (e) {
      showNotice('No se pudo guardar la sesión en este equipo.');
    }
    actualizarContadorEvento();
  }

  async function generarGif() {
    const generacion = ++gifGeneracion;
    gifBlob = null;
    resultGif.hidden = true;
    gifStatus.textContent = 'Generando GIF…';
    await sleep(40);

    const cuadros = [];
    for (const src of photos) {
      const img = await loadImage(src);
      const c = document.createElement('canvas');
      c.width = GIF_ANCHO;
      c.height = GIF_ALTO;
      const ctx = c.getContext('2d');
      drawCover(ctx, img, 0, 0, GIF_ANCHO, GIF_ALTO);
      cuadros.push(ctx.getImageData(0, 0, GIF_ANCHO, GIF_ALTO));
    }
    if (generacion !== gifGeneracion) return;

    const bytes = CodificadorGif.crearGif({ cuadros, retardoMs: GIF_RETARDO_MS });
    if (generacion !== gifGeneracion) return;

    gifBlob = new Blob([bytes], { type: 'image/gif' });
    if (resultGif.src) URL.revokeObjectURL(resultGif.src);
    resultGif.src = URL.createObjectURL(gifBlob);
    resultGif.hidden = false;
    gifStatus.textContent = '';

    if (sesionActual) {
      const sesion = sesionActual;
      sesion.gif = gifBlob;
      try { await encolarGuardado(() => AlmacenSesiones.guardar(sesion)); } catch (e) { /* ya se avisó al guardar la tira */ }
    }
  }

  // ---------- Tabs de resultado ----------

  function tabActiva() {
    const tab = q('#resultTabs .ds-tab[aria-selected="true"]');
    return tab ? tab.dataset.tab : 'strip';
  }

  function setResultTab(tabName) {
    qa('#resultTabs .ds-tab').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.tab === tabName));
    });
    qa('.result-view').forEach((view) => {
      view.hidden = view.dataset.view !== tabName;
    });
    const etiquetas = { strip: 'Descargar tira', photos: 'Descargar fotos', gif: 'Descargar GIF' };
    downloadLabel.textContent = etiquetas[tabName] || 'Descargar';
  }

  qa('#resultTabs .ds-tab').forEach((tab) => {
    tab.addEventListener('click', () => setResultTab(tab.dataset.tab));
  });

  // ---------- Descargar / compartir / imprimir ----------

  function descargarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function descargarDataUrl(dataUrl, nombre) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = nombre;
    a.click();
  }

  async function descargarTodasLasFotos(fotos) {
    for (let i = 0; i < fotos.length; i++) {
      descargarDataUrl(fotos[i], `fotocabina-foto-${i + 1}.jpg`);
      await sleep(350);
    }
  }

  // Medidas de la hoja en milímetros; sin dato (sesiones antiguas y demostración), 4x6 pulgadas como siempre.
  const HOJA_4X6_MM = { anchoMm: 101.6, altoMm: 152.4 };

  // ---------- Imprimir (hito 3): cola, A9/A10, copias adicionales y tope de hojas ----------

  // Hoja de prueba de C4 ("Impresión de prueba"): se dibuja al momento, no pertenece a ninguna sesión.
  async function hojaDePrueba() {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 1800;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#0A0A0B';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, c.width - 120, c.height - 120);
    ctx.fillStyle = '#0A0A0B';
    ctx.textAlign = 'center';
    ctx.font = '800 96px Inter, system-ui';
    ctx.fillText('FotoCabina', 600, 330);
    ctx.font = '600 52px Inter, system-ui';
    ctx.fillText('Impresión de prueba', 600, 430);
    ctx.font = '500 38px Inter, system-ui';
    ctx.fillText(new Date().toLocaleString('es-CL'), 600, 520);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) ctx.strokeRect(150 + i * 25, 650 + i * 25, 900 - i * 50, 900 - i * 50);
    return aBlob(c);
  }

  // Tope de hojas VIGENTE del evento (lo que el operador tiene guardado ahora). Solo existe con el modo "Ambos".
  function topeVigenteDe(eventoId) {
    if (typeof AlmacenEventos === 'undefined' || typeof ValidadorEvento === 'undefined' || !eventoId || eventoId === 'demo') return null;
    const ev = AlmacenEventos.obtener(eventoId);
    return ev ? ValidadorEvento.configuracionEfectiva(ev, null).topeHojas : null;
  }

  // El evento ya usó todas sus hojas (impresas, en cola o por revisar).
  function topeAlcanzadoAhora() {
    if (!impresion) return false;
    const tope = topeVigenteDe(eventoActual.id);
    return !!tope && impresion.hojasDelEvento(eventoActual.id, tope).restantes === 0;
  }

  // Configuración congelada de la sesión que empieza. Si el tope ya se alcanzó, la sesión nace "solo digital":
  // no ofrece imprimir y lo dice (el invitado ya vio el aviso antes de tomar las fotos).
  function configSesion() {
    const cfg = configCongelada();
    if (!cfg || cfg.modo !== 'ambos' || !cfg.topeHojas || !impresion || eventoActual.id === 'demo') return cfg;
    if (impresion.hojasDelEvento(eventoActual.id, cfg.topeHojas).restantes > 0) return cfg;
    return { ...cfg, modoOriginal: 'ambos', modo: 'digital', impresionAuto: false, topeAlcanzado: true, resumen: cfg.resumen + ' · tope de hojas alcanzado: solo entrega digital' };
  }

  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  function problemaDeImpresora() {
    if (!impresion) return false;
    const e = impresion.estado('ambos');
    return e.semaforo === 'error' || e.cola.pausada;
  }

  // Manda una sesión a la cola. Devuelve el resultado de encolar (ver shared/impresion.js) o null si no hay cola.
  function enviarAImprimir({ sesion, copias, origen, topeHojas }) {
    if (!impresion || !sesion) { showNotice('No se pudo preparar la impresión en este equipo.'); return null; }
    recordarContenido(sesion.id, sesion.hoja || sesion.tira, sesion.impresion);
    const res = impresion.encolar({ sesionId: sesion.id, eventoId: sesion.eventoId || sesion.evento, eventoNombre: sesion.eventoNombre, copias, origen, topeHojas });
    refrescarImpresora(true);
    return res;
  }

  let temporizadorEnviado = null;
  // A9 (Enviado a imprimir) y A10 (variante impresora): una tarjeta breve que no bloquea nada.
  function mostrarEnviado({ tono, titulo, sub }) {
    printSent.dataset.tono = tono;
    printSentTitle.textContent = titulo;
    printSentSub.textContent = sub || '';
    printSent.dataset.visible = 'true';
    clearTimeout(temporizadorEnviado);
    temporizadorEnviado = setTimeout(() => { printSent.dataset.visible = 'false'; }, tono === 'aviso' ? 6000 : 2600);
  }

  // Cuenta lo que pasó con el pedido de impresión (para el invitado y para quien lo pidió).
  function avisarEnvio(res, paraInvitado) {
    if (!res) return;
    if (!res.ok) {
      mostrarEnviado({ tono: 'aviso', titulo: 'No se imprimió', sub: paraInvitado
        ? 'Las impresiones de este evento llegaron a su límite, pero puedes llevarte tus fotos de forma digital.'
        : 'Este evento ya usó todas sus hojas. Sube el tope en "Editar evento" para seguir imprimiendo.' });
      return;
    }
    if (problemaDeImpresora()) {
      mostrarEnviado({ tono: 'aviso', titulo: 'Un momento, por favor', sub: result.hidden ? impresion.mensajeInvitado(modoDeEntrega()) : '' });
      return;
    }
    mostrarEnviado({
      tono: 'ok',
      titulo: 'Enviado a imprimir',
      sub: res.parcial
        ? `Se imprime ${plural(res.hojas, 'hoja', 'hojas')} de ${res.pedidas}: era lo que quedaba del límite del evento.`
        : plural(res.hojas, 'hoja', 'hojas'),
    });
  }

  // Lo que ve el invitado sobre su impresión (sin términos técnicos).
  function resumenImpresionSesion(sesionId) {
    if (esperaImpresion.enEspera(sesionId)) {
      return { tono: 'ok', texto: 'Tu tira se imprimirá en unos segundos o cuando toques Finalizar. ¿No te gustó? Toca «Borrar y empezar de nuevo» y no se imprime.' };
    }
    if (!impresion || !sesionId) return null;
    const trabajos = impresion.listar({ sesionId }).filter((t) => t.estado !== 'cancelado');
    if (!trabajos.length) return null;
    const hojas = trabajos.reduce((s, t) => s + t.hojas, 0);
    const conProblema = trabajos.some((t) => ['fallido', 'reintentando', 'retenido'].includes(t.estado))
      || (trabajos.some((t) => t.estado === 'en-cola') && problemaDeImpresora());
    if (conProblema) return { tono: 'aviso', texto: impresion.mensajeInvitado(modoDeEntrega()) };
    if (trabajos.some((t) => t.estado === 'en-cola' || t.estado === 'imprimiendo')) return { tono: 'ok', texto: `Imprimiendo tu tira (${plural(hojas, 'hoja', 'hojas')})…` };
    return { tono: 'ok', texto: `Tu tira fue enviada a la impresora (${plural(hojas, 'hoja', 'hojas')}).` };
  }

  function actualizarEstadoImpresionResultado() {
    const cfg = sesionActual && sesionActual.configCongelada;
    let r = result.hidden || !sesionActual ? null : resumenImpresionSesion(sesionActual.id);
    if (!r && !result.hidden && cfg && cfg.topeAlcanzado) {
      r = { tono: 'aviso', texto: 'Las impresiones de este evento llegaron a su límite, pero puedes llevarte tus fotos de forma digital.' };
    }
    printStatus.hidden = !r;
    if (r) { printStatus.textContent = r.texto; printStatus.dataset.tono = r.tono; }
    // Lo que ya salió de la impresora no se puede recuperar: el botón de borrar se esconde para no prometer lo imposible.
    retakeSessionBtn.hidden = !result.hidden && !!sesionActual && hojaYaSalio(sesionActual.id);
  }

  const sesionesImpresasSolas = new Set();

  // Impresión automática (hito 3b, decisión del dueño 2026-11-18): el trabajo NO sale a la impresora hasta que el invitado
  // confirma su resultado. Se confirma al tocar "Finalizar", al volver al inicio por inactividad, al salir al modo operador
  // o, como red de seguridad (para que nunca dependa del ajuste de inactividad), tras ESPERA_CONFIRMACION_MS en el resultado.
  // Mientras espera NO está en la cola: no gasta hoja ni cuenta para el tope, y "Borrar y empezar de nuevo" lo descarta sin rastro.
  // ¿Alguna hoja de esta sesión ya salió o puede haber salido? (Entonces "Borrar y empezar de nuevo" ya no puede evitar el gasto.)
  function hojaYaSalio(sesionId) {
    if (!impresion || !sesionId) return false;
    return impresion.listar({ sesionId }).some((t) => ['imprimiendo', 'hecho', 'retenido'].includes(t.estado));
  }
  // Impresión automática al terminar la sesión: según el evento (`impresionAuto` y `copias`, ya congelados en la sesión).
  function imprimirAutomatico() {
    const sesion = sesionActual;
    const cfg = sesion && sesion.configCongelada;
    if (sesion && cfg && cfg.modo !== 'digital' && cfg.impresionAuto && !sesionesImpresasSolas.has(sesion.id)) {
      sesionesImpresasSolas.add(sesion.id);
      esperaImpresion.armar({ sesion, sesionId: sesion.id, copias: cfg.copias, topeHojas: cfg.topeHojas });
    }
    actualizarEstadoImpresionResultado();
  }

  // Si el invitado borra su sesión, lo que aún no salió de la cola no debe imprimirse (ni gastar hojas del tope).
  function cancelarImpresionesPendientesDe(sesionId) {
    if (!impresion || !sesionId) return;
    contenidoReciente.delete(sesionId);
    impresion.listar({ sesionId, estados: ['en-cola', 'reintentando', 'fallido', 'retenido'] }).forEach((t) => impresion.cancelar(t.id));
    refrescarImpresora(true);
  }

  // ----- Copias adicionales (solo en modo operador, sin PIN propio: ya se entró con el PIN del equipo) -----
  let copiasCtx = null;
  let copiasFoco = null; // quién abrió el diálogo: a él vuelve el foco al cerrarlo
  const COPIAS_MAX = 20;

  function copiasAbierto() { return copiesOverlay.dataset.visible === 'true'; }

  function pintarCopias() {
    const c = copiasCtx;
    const quedan = c.restantes;
    copiesValue.textContent = String(c.copias);
    copiesMinus.disabled = c.copias <= 1;
    copiesPlus.disabled = c.copias >= COPIAS_MAX;
    let aviso = '';
    if (quedan === 0) aviso = 'Este evento ya usó todas sus hojas. Sube el tope en "Editar evento" para seguir imprimiendo.';
    else if (quedan !== null && c.copias > quedan) aviso = `Solo quedan ${plural(quedan, 'hoja', 'hojas')} del límite del evento: se imprimirán ${quedan}.`;
    copiesWarn.hidden = !aviso;
    copiesWarn.textContent = aviso;
    copiesOkBtn.disabled = quedan === 0;
  }

  function abrirCopias(ctx) {
    if (!impresion) { showNotice('No se pudo preparar la impresión en este equipo.'); return; }
    detenerTemporizadorInicio();
    const h = impresion.hojasDelEvento(ctx.eventoId, ctx.topeHojas);
    copiasCtx = { ...ctx, restantes: h.restantes, copias: 1 };
    copiasFoco = ctx.foco || null;
    copiesTitle.textContent = ctx.titulo;
    copiesInfo.textContent = h.tope
      ? `Cada hoja cuenta para el límite del evento: llevan ${h.usadas} de ${h.tope} (${h.restantes === 0 ? 'ya no quedan' : `quedan ${h.restantes}`}).`
      : `Elige cuántas hojas imprimir de esta sesión. Este evento lleva ${plural(h.usadas, 'hoja', 'hojas')}.`;
    pintarCopias();
    copiesOverlay.dataset.visible = 'true';
    cabin.classList.add('has-dialog');
    (copiesOkBtn.disabled ? copiesCancelBtn : copiesOkBtn).focus();
  }

  function cerrarCopias() {
    copiesOverlay.dataset.visible = 'false';
    cabin.classList.remove('has-dialog');
    copiasCtx = null;
    if (copiasFoco && copiasFoco.isConnected && !copiasFoco.hidden) { try { copiasFoco.focus(); } catch (e) { /* sin foco */ } }
    copiasFoco = null;
    if (!result.hidden) iniciarTemporizadorInicio();
  }

  function confirmarCopias() {
    const c = copiasCtx;
    if (!c || copiesOkBtn.disabled) return;
    const res = enviarAImprimir({ sesion: c.sesion, copias: c.copias, origen: c.origen, topeHojas: c.topeHojas });
    cerrarCopias();
    avisarEnvio(res, false);
    actualizarEstadoImpresionResultado();
  }

  function cambiarCopias(delta) {
    if (!copiasCtx) return;
    copiasCtx.copias = Math.min(COPIAS_MAX, Math.max(1, copiasCtx.copias + delta));
    pintarCopias();
  }

  // Aviso ANTES de tomar las fotos cuando el evento ya llegó a su tope: resuelve true si el invitado quiere seguir solo digital.
  let cerrarAvisoTope = null;
  function limiteAbierto() { return limitOverlay.dataset.visible === 'true'; }
  function esperarAvisoDeTope() {
    return new Promise((resolver) => {
      cerrarAvisoTope = (seguir) => { limitOverlay.dataset.visible = 'false'; cerrarAvisoTope = null; resolver(seguir); };
      limitOverlay.dataset.visible = 'true';
      limitOkBtn.focus();
    });
  }

  // Trampa de foco simple para los diálogos nuevos (Tab no sale de la tarjeta).
  function trampaFocoEn(overlay, e) {
    const foco = Array.from(overlay.querySelectorAll('button:not([disabled])'));
    if (!foco.length) return;
    const primero = foco[0], ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    else if (!overlay.contains(document.activeElement)) { e.preventDefault(); primero.focus(); }
  }

  // ----- Semáforo, aviso al operador y refresco -----
  // Lo que importa para pintar la cabina se resume en una firma: solo se redibuja cuando cambia.
  let firmaImpresion = '';

  function modoDelEventoActual() {
    if (eventoActual.id === 'demo' || typeof AlmacenEventos === 'undefined') return 'ambos';
    const ev = AlmacenEventos.obtener(eventoActual.id);
    return ev && ev.entrega && ev.entrega.modo ? ev.entrega.modo : 'ambos';
  }

  function refrescarImpresora(forzar) {
    if (!impresion) return;
    const modo = modoDelEventoActual();
    const e = impresion.estado(modo);
    printerStatusBadge.dataset.state = e.semaforo;
    printerStatusBadge.textContent = e.texto;
    const alerta = modo !== 'digital' && (e.semaforo === 'error' || e.semaforo === 'warn');
    lockBtn.dataset.alerta = String(alerta);
    lockBtn.setAttribute('aria-label', alerta ? 'Acceso de operador: hay un aviso de impresión' : 'Acceso de operador');
    actualizarEstadoImpresionResultado();
    const firma = JSON.stringify([modo, e.impresora.estado, e.impresora.lenta, e.impresora.nombre, e.cola, e.rollo, e.semaforo]);
    if (forzar !== true && firma === firmaImpresion) return;
    firmaImpresion = firma;
    actualizarResumenPlantilla();
    actualizarContadorEvento();
    pintarPanelImpresora(e);
  }

  // ---------- C4 Impresora: panel dentro de Ajustes (hito 3) ----------
  // Elegir impresora, papel contra el de la plantilla, copias del evento, consumo de papel, hoja de prueba, trabajos
  // pendientes y el control "Simulación". Lo que persiste vive en shared/impresion.js (perfil del equipo) y en el evento
  // (copias e impresión automática, como en "Editar evento").
  const c4 = {
    badge: q('#c4Badge'), guardado: q('#c4Guardado'), medios: q('#c4Medios'), papelAviso: q('#c4PapelAviso'),
    decision: q('#c4Decision'), decisionTitulo: q('#c4DecisionTitulo'),
    auto: q('#c4AutoToggle'), autoAyuda: q('#c4AutoAyuda'),
    copiasMenos: q('#c4CopiasMenos'), copiasMas: q('#c4CopiasMas'), copiasValor: q('#c4CopiasValor'), copiasAyuda: q('#c4CopiasAyuda'), hojasEvento: q('#c4HojasEvento'),
    hojasRollo: q('#c4HojasRollo'), avisoRollo: q('#c4AvisoRollo'), rolloEstado: q('#c4RolloEstado'), cambioRollo: q('#c4CambioRollo'), totales: q('#c4Totales'),
    colaResumen: q('#c4ColaResumen'), cola: q('#c4Cola'), prueba: q('#c4Prueba'), reintentarTodos: q('#c4ReintentarTodos'),
    sim: q('#c4Sim'), simLenta: q('#c4SimLenta'), simRollo: q('#c4SimRollo'),
  };
  let decisionImpresora = null;
  let temporizadorPanel = null;

  function eventoDelPanel() {
    if (eventoActual.id === 'demo' || typeof AlmacenEventos === 'undefined') return null;
    return AlmacenEventos.obtener(eventoActual.id);
  }

  function avisarEnPanel(texto) {
    const p = q('#c4Feedback');
    if (!p) return;
    p.textContent = texto;
    clearTimeout(temporizadorPanel);
    temporizadorPanel = setTimeout(() => { p.textContent = ''; }, 6000);
  }

  const textoMedio = (m) => `${enPulgadas(m.anchoMm)} × ${enPulgadas(m.altoMm)} in`;
  const MOTIVOS_TRABAJO = { 'en-cola': 'en fila', imprimiendo: 'imprimiendo', reintentando: 'reintentando', fallido: 'sin imprimir', retenido: 'por revisar' };

  function guardarEntregaDelEvento(cambio) {
    const ev = eventoDelPanel();
    if (!ev) return false;
    ev.entrega = { ...ev.entrega, ...cambio };
    AlmacenEventos.guardar(ev);
    const err = AlmacenEventos.errorDeGuardado();
    if (err) showNotice(err.mensaje);
    refrescarImpresora(true);
    return true;
  }

  function pintarTrabajosDelPanel() {
    const trabajos = impresion.listar({ estados: ['en-cola', 'imprimiendo', 'reintentando', 'fallido', 'retenido'] });
    c4.cola.textContent = '';
    const cola = impresion.resumenCola();
    const atraso = cola.atrasoSeg >= 60 ? `≈ ${Math.round(cola.atrasoSeg / 60)} min` : `≈ ${cola.atrasoSeg} s`;
    const partes = [];
    if (cola.pendientes) partes.push(`${plural(cola.pendientes, 'trabajo', 'trabajos')} en fila (${plural(cola.hojasPendientes, 'hoja', 'hojas')}, ${atraso})`);
    if (cola.fallidos) partes.push(`${plural(cola.fallidos, 'sin imprimir', 'sin imprimir')}`);
    if (cola.retenidos) partes.push(`${plural(cola.retenidos, 'por revisar', 'por revisar')}`);
    c4.colaResumen.textContent = partes.length ? partes.join(' · ') : 'No hay nada pendiente.';
    c4.reintentarTodos.hidden = cola.fallidos < 2;
    trabajos.slice(0, 6).forEach((t) => {
      const li = document.createElement('li');
      li.className = 'c4-job' + (t.estado === 'fallido' ? ' c4-job--error' : '');
      const info = document.createElement('span');
      info.className = 'c4-job-text';
      const hora = new Date(t.creadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      const motivo = t.estado === 'reintentando' ? `reintentando (intento ${t.intentos} de ${Impresion.CONFIG_BASE.maxIntentos})` : MOTIVOS_TRABAJO[t.estado];
      info.textContent = `${hora} · ${plural(t.hojas, 'hoja', 'hojas')} · ${motivo}${t.ultimoError && (t.estado === 'fallido' || t.estado === 'retenido') ? ': ' + t.ultimoError.mensaje : ''}`;
      li.appendChild(info);
      const acciones = document.createElement('span');
      acciones.className = 'c4-job-actions';
      const boton = (texto, accion) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ds-btn ds-btn--secondary ds-btn--compact';
        b.textContent = texto;
        b.addEventListener('click', accion);
        acciones.appendChild(b);
      };
      if (t.estado === 'fallido' || t.estado === 'retenido') {
        boton(t.estado === 'fallido' ? 'Reintentar' : 'Imprimir de nuevo', () => {
          const r = impresion.reintentar(t.id, { topeHojas: topeVigenteDe(t.eventoId) });
          if (!r.ok && r.motivo === 'tope') avisarEnPanel('Ese evento ya usó todas sus hojas: sube el tope en "Editar evento" para imprimirlo.');
          else if (r.ok && r.recortado) avisarEnPanel(`Quedaban pocas hojas del tope: se reintenta con ${plural(r.trabajo.hojas, 'hoja', 'hojas')}.`);
          refrescarImpresora(true);
        });
      }
      if (t.estado !== 'imprimiendo') boton(t.estado === 'fallido' || t.estado === 'retenido' ? 'Descartar' : 'Cancelar', () => {
        impresion.cancelar(t.id);
        if (t.estado === 'retenido') avisarEnPanel('Descartado. Ojo: puede que esa hoja ya haya salido de la impresora.');
        refrescarImpresora(true);
      });
      li.appendChild(acciones);
      c4.cola.appendChild(li);
    });
    if (trabajos.length > 6) {
      const li = document.createElement('li');
      li.className = 'c4-job c4-job--mas';
      li.textContent = `Y ${trabajos.length - 6} más.`;
      c4.cola.appendChild(li);
    }
  }

  function pintarPanelImpresora(e) {
    if (!impresion || !c4.badge) return;
    c4.badge.dataset.state = e.semaforo;
    c4.badge.textContent = e.texto;

    // Impresoras disponibles (se arma una vez) y la elegida.
    const select = q('.ds-select[data-select="printer"]');
    const menu = select.querySelector('.ds-select-menu');
    const lista = impresion.impresoras();
    if (menu.children.length !== lista.length) {
      menu.textContent = '';
      lista.forEach((m) => {
        const li = document.createElement('li');
        li.className = 'ds-select-option';
        li.setAttribute('role', 'option');
        li.dataset.value = m.id;
        li.textContent = m.nombre;
        menu.appendChild(li);
      });
    }
    const actual = lista.find((m) => m.actual) || lista[0];
    Array.from(menu.children).forEach((li) => li.setAttribute('aria-selected', String(li.dataset.value === actual.id)));
    select.querySelector('.ds-select-value').textContent = actual.nombre;
    c4.medios.textContent = `Papel que admite: ${actual.medios.map(textoMedio).join(', ')}`;

    // Papel de la plantilla contra el de la impresora: el aviso lo redacta el validador.
    const res = evaluarEvento();
    const avisoPapel = res && res.avisos.find((a) => a.codigo === 'PAPEL_DISTINTO');
    const guardado = e.errorDeGuardado ? e.errorDeGuardado.mensaje : (e.ilegible ? 'La fila de impresión guardada estaba dañada: se empezó de cero y se guardó una copia aparte del registro dañado.' : '');
    c4.guardado.hidden = !guardado;
    c4.guardado.textContent = guardado;
    c4.papelAviso.hidden = !avisoPapel;
    c4.papelAviso.textContent = avisoPapel ? avisoPapel.mensaje : '';

    // Decisión pendiente al cambiar de impresora.
    c4.decision.hidden = !decisionImpresora;

    // Copias e impresión automática (son del evento).
    const ev = eventoDelPanel();
    const imprime = !!ev && ev.entrega && ev.entrega.modo !== 'digital';
    c4.auto.disabled = !imprime;
    c4.copiasMenos.disabled = !imprime || ev.entrega.copias <= 1;
    c4.copiasMas.disabled = !imprime || ev.entrega.copias >= COPIAS_MAX;
    c4.auto.setAttribute('aria-checked', String(!!(imprime && ev.entrega.impresionAuto)));
    c4.copiasValor.textContent = imprime ? String(ev.entrega.copias) : '–';
    c4.copiasAyuda.textContent = !ev ? 'Sin evento: las copias se cambian en "Editar evento".'
      : !imprime ? 'Este evento es solo digital: no imprime.'
      : 'Cada hoja 4×6 (con dos tiras) cuenta como una hoja. Se aplica desde la próxima sesión.';
    if (ev) {
      const cfg = ValidadorEvento.configuracionEfectiva(ev, null);
      const h = impresion.hojasDelEvento(ev.id, cfg.topeHojas);
      c4.hojasEvento.textContent = `Este evento lleva ${plural(h.usadas, 'hoja', 'hojas')}${h.enCurso ? ` (${h.enCurso} en fila)` : ''}. `
        + (h.tope ? `Tope: ${h.tope}, ${h.restantes === 0 ? 'ya no quedan' : `quedan ${h.restantes}`}.` : (ev.entrega.modo === 'ambos' ? 'Sin tope de hojas.' : 'El tope de hojas solo existe con "Impresión y digital".'));
    } else {
      c4.hojasEvento.textContent = 'Sin evento: el conteo de hojas aparece al abrir un evento.';
    }

    // Consumo de papel.
    const perfil = impresion.perfil();
    if (document.activeElement !== c4.hojasRollo) c4.hojasRollo.value = perfil.hojasPorRollo ? String(perfil.hojasPorRollo) : '';
    if (document.activeElement !== c4.avisoRollo) c4.avisoRollo.value = String(perfil.avisoRestantes);
    const rollo = e.rollo;
    c4.rolloEstado.textContent = !rollo.configurado ? 'Configura cuántas hojas trae el rollo para recibir un aviso antes de que se acabe.'
      : rollo.aviso === 'agotado' ? `El rollo ya llegó a sus ${rollo.total} hojas según el conteo: cuando lo cambies toca "Rollo nuevo".`
      : rollo.aviso === 'bajo' ? `Quedan unas ${rollo.restantes} hojas del rollo: ten papel y cinta a mano.`
      : `Quedan unas ${rollo.restantes} de ${rollo.total} hojas del rollo (según el conteo, sumando todos los eventos desde el último «Rollo nuevo»).`;
    c4.rolloEstado.dataset.tono = rollo.aviso ? 'aviso' : '';
    const cont = impresion.contadores().porImpresora[perfil.impresoraId];
    c4.totales.textContent = cont ? `Esta impresora lleva ${plural(cont.impresas, 'hoja', 'hojas')} en total${cont.cambioEn ? `; último cambio de rollo: ${formatearFecha(cont.cambioEn).replace(/\.$/, '')}` : ''}.` : 'Esta impresora todavía no imprimió nada.';

    pintarTrabajosDelPanel();

    // Simulación (solo con la impresora simulada).
    const sim = impresion.simulacion();
    c4.sim.hidden = !sim.disponible;
    if (sim.disponible) {
      const selSim = q('.ds-select[data-select="simestado"]');
      const opcion = Array.from(selSim.querySelectorAll('.ds-select-option')).find((o) => o.dataset.value === sim.estado);
      Array.from(selSim.querySelectorAll('.ds-select-option')).forEach((o) => o.setAttribute('aria-selected', String(o === opcion)));
      if (opcion) selSim.querySelector('.ds-select-value').textContent = opcion.textContent;
      c4.simLenta.setAttribute('aria-checked', String(!!sim.lenta));
      if (document.activeElement !== c4.simRollo) c4.simRollo.value = sim.rolloRestante === null ? '' : String(sim.rolloRestante);
    }
  }

  function cambiarImpresoraDesdePanel(id) {
    const r = impresion.cambiarImpresora(id);
    if (r.ok) { decisionImpresora = null; refrescarImpresora(true); return; }
    if (r.motivo === 'decision') {
      decisionImpresora = id;
      c4.decisionTitulo.textContent = `Hay ${plural(r.pendientes, 'trabajo', 'trabajos')} sin imprimir (${plural(r.hojas, 'hoja', 'hojas')}). ¿Qué hacemos con ${r.pendientes === 1 ? 'él' : 'ellos'}?`;
    }
    refrescarImpresora(true);
  }

  c4.decision.addEventListener('click', (e) => {
    const b = e.target.closest('[data-decision]');
    if (!b || !decisionImpresora) return;
    const id = decisionImpresora;
    decisionImpresora = null;
    if (b.dataset.decision !== 'no') impresion.cambiarImpresora(id, b.dataset.decision);
    refrescarImpresora(true);
  });
  c4.auto.addEventListener('click', () => {
    const ev = eventoDelPanel();
    if (ev && ev.entrega.modo !== 'digital') guardarEntregaDelEvento({ impresionAuto: !ev.entrega.impresionAuto });
  });
  const cambiarCopiasDelEvento = (delta) => {
    const ev = eventoDelPanel();
    if (ev && ev.entrega.modo !== 'digital') guardarEntregaDelEvento({ copias: Math.min(COPIAS_MAX, Math.max(1, ev.entrega.copias + delta)) });
  };
  c4.copiasMenos.addEventListener('click', () => cambiarCopiasDelEvento(-1));
  c4.copiasMas.addEventListener('click', () => cambiarCopiasDelEvento(1));
  c4.hojasRollo.addEventListener('change', () => { impresion.guardarPerfil({ hojasPorRollo: c4.hojasRollo.value }); refrescarImpresora(true); });
  c4.avisoRollo.addEventListener('change', () => { impresion.guardarPerfil({ avisoRestantes: c4.avisoRollo.value }); refrescarImpresora(true); });
  // "Rollo nuevo": el conteo del rollo es de esta impresora y se acumula entre eventos; solo este botón lo reinicia, y pide confirmar.
  const rolloAbierto = () => rolloOverlay.dataset.visible === 'true';
  c4.cambioRollo.addEventListener('click', () => {
    if (rolloAbierto()) return;
    const r = impresion.restantesRollo();
    const nombre = impresion.estado('ambos').impresora.nombre;
    rolloTexto.textContent = `El conteo del rollo de ${nombre} vuelve a cero${r.desdeCambio ? ` (llevaba ${plural(r.desdeCambio, 'hoja', 'hojas')}, sumando todos los eventos)` : ''}. `
      + 'Confírmalo solo si ya pusiste papel y cinta nuevos: empezar otro evento no lo reinicia. El conteo de hojas de cada evento no cambia.';
    cerrarDrawer();
    rolloOverlay.dataset.visible = 'true';
    rolloCancelBtn.focus();
  });
  function cerrarRollo() {
    rolloOverlay.dataset.visible = 'false';
    abrirDrawer('seccionImpresion');
    try { c4.cambioRollo.focus(); } catch (e) { /* sin foco */ }
  }
  rolloCancelBtn.addEventListener('click', cerrarRollo);
  rolloOverlay.addEventListener('click', (e) => { if (e.target === rolloOverlay) cerrarRollo(); });
  rolloOkBtn.addEventListener('click', () => {
    impresion.cambiarRollo();
    cerrarRollo();
    avisarEnPanel('Listo: el conteo del rollo volvió a cero.');
    refrescarImpresora(true);
  });
  c4.prueba.addEventListener('click', () => {
    impresion.encolar({ sesionId: null, eventoId: null, eventoNombre: 'Prueba', copias: 1, origen: 'prueba' });
    avisarEnPanel('Hoja de prueba enviada a la fila.');
    refrescarImpresora(true);
  });
  c4.reintentarTodos.addEventListener('click', () => {
    const r = impresion.reintentarFallidos();
    if (r.sinTope) avisarEnPanel(`${plural(r.sinTope, 'trabajo no se reintentó', 'trabajos no se reintentaron')}: el evento ya usó todas sus hojas.`);
    else if (r.recortados) avisarEnPanel(`${plural(r.recortados, 'trabajo se reintenta', 'trabajos se reintentan')} con menos hojas, por el tope del evento.`);
    refrescarImpresora(true);
  });
  c4.simLenta.addEventListener('click', () => { impresion.configurarSimulacion({ lenta: c4.simLenta.getAttribute('aria-checked') !== 'true' }); refrescarImpresora(true); });
  c4.simRollo.addEventListener('change', () => { impresion.configurarSimulacion({ rolloRestante: c4.simRollo.value.trim() === '' ? null : Number(c4.simRollo.value) }); refrescarImpresora(true); });



  function dataUrlAFile(dataUrl, nombre) {
    const [cabecera, base64] = dataUrl.split(',');
    const tipo = (cabecera.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], nombre, { type: tipo });
  }

  function archivosParaCompartir() {
    const tab = tabActiva();
    if (tab === 'gif') return gifBlob ? [new File([gifBlob], 'fotocabina.gif', { type: 'image/gif' })] : [];
    if (tab === 'photos') return photos.map((p, i) => dataUrlAFile(p, `fotocabina-foto-${i + 1}.jpg`));
    return finalBlob ? [new File([finalBlob], 'fotocabina-tira.png', { type: 'image/png' })] : [];
  }

  function puedeCompartirArchivos() {
    try {
      const prueba = new File([new Blob(['x'])], 'x.png', { type: 'image/png' });
      return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [prueba] }));
    } catch (e) {
      return false;
    }
  }

  const compartirSoportado = puedeCompartirArchivos();

  // ---------- Resultado según el modo de entrega (A7, hito 1.2) ----------
  // Lo que se ofrece al invitado lo manda el modo de entrega con que se congeló SU sesión
  // (docs/ARQUITECTURA_FLUJO.md §2.3): solo impresión = sin QR, descarga ni compartir; solo digital = sin
  // imprimir. El operador reimprime desde la galería (no pasa por esta pantalla). Sin evento (demostración)
  // el modo es "ambos": se ofrece todo, como siempre.

  function modoDeEntrega() {
    const c = sesionActual && sesionActual.configCongelada;
    return (c && ['impresion', 'digital', 'ambos'].includes(c.modo)) ? c.modo : 'ambos';
  }

  function aplicarModoEntrega() {
    const modo = modoDeEntrega();
    const imprime = modo !== 'digital';
    const digital = modo !== 'impresion';
    const cfgSesion = (sesionActual && sesionActual.configCongelada) || {};
    // Con impresión automática el invitado no pide nada: imprime sola. Sin ella, un solo pedido por sesión.
    printBtn.hidden = !imprime || !!cfgSesion.impresionAuto;
    printBtn.disabled = false;
    printLabel.textContent = 'Imprimir';
    downloadBtn.hidden = !digital;
    shareBtn.hidden = !(digital && compartirSoportado);
    q('#resultTabs').hidden = !digital;
    qrCard.hidden = !digital;
    const sub = q('.result-sub');
    if (sub) {
      sub.textContent = modo === 'impresion' ? 'Tu tira ya está armada. Imprímela para llevártela.'
        : modo === 'digital' ? 'Tu tira ya está armada. Escanea el código o descárgala para llevártela.'
        : 'Tu tira ya está armada. Elige cómo llevártela.';
    }
    actualizarEstadoImpresionResultado();
  }

  // ---------- Galería de sesiones ----------

  function formatearFecha(iso) {
    const fecha = new Date(iso);
    const hoy = new Date();
    const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const esHoy = fecha.toDateString() === hoy.toDateString();
    return esHoy ? hora : `${fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} · ${hora}`;
  }

  async function abrirGaleria() {
    gallery.hidden = false;
    galleryDetail.hidden = true;
    galleryList.hidden = false;
    await renderGaleria();
  }

  function cerrarGaleria() {
    gallery.hidden = true;
    sesionDetalle = null;
    liberarUrls();
  }

  // Etiqueta visible solo para las sesiones que no terminaron bien (el resto no lleva marca).
  function etiquetaEstado(sesion) {
    if (sesion.estado === 'incompleta') return 'Incompleta';
    if (sesion.estado === 'fallida') return 'No se armó la tira';
    return '';
  }

  function textoFotos(sesion) {
    const tomadas = sesion.fotos.filter(Boolean).length;
    if (sesion.estado === 'incompleta' && sesion.fotosEsperadas) return `${tomadas} de ${sesion.fotosEsperadas} fotos`;
    return `${tomadas} ${tomadas === 1 ? 'foto' : 'fotos'}`;
  }

  async function renderGaleria() {
    liberarUrls();
    galleryGrid.innerHTML = '';
    let sesiones = [];
    try {
      sesiones = await AlmacenSesiones.listar(filtroGaleria === 'event' ? eventoActual.id : null);
    } catch (e) {
      showNotice('No se pudo leer la galería en este equipo.');
    }

    galleryEmpty.hidden = sesiones.length > 0;
    sesiones.forEach((sesion) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gallery-card';

      const img = document.createElement('img');
      img.alt = sesion.tira ? 'Tira de la sesión' : 'Primera foto de la sesión';
      img.src = sesion.tira ? crearUrl(sesion.tira) : (sesion.fotos.find(Boolean) || '');
      card.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'gallery-card-meta';
      const nombreEvento = filtroGaleria === 'all' ? ` · ${sesion.eventoNombre}` : '';
      const tiempo = document.createElement('span');
      tiempo.className = 'gallery-card-time';
      tiempo.textContent = formatearFecha(sesion.fecha);
      const cuenta = document.createElement('span');
      cuenta.className = 'gallery-card-count';
      cuenta.textContent = `${textoFotos(sesion)}${nombreEvento}`;
      meta.appendChild(tiempo);
      meta.appendChild(cuenta);
      card.appendChild(meta);
      const etiqueta = etiquetaEstado(sesion);
      if (etiqueta) {
        const marca = document.createElement('span');
        marca.className = 'gallery-card-badge';
        marca.textContent = etiqueta;
        card.appendChild(marca);
      }

      card.addEventListener('click', () => mostrarDetalle(sesion));
      galleryGrid.appendChild(card);
    });
  }

  // Una sesión con todas sus fotos pero sin tira (la composición falló) se arma con la copia
  // congelada de ESA sesión (su diseño original), nunca con la plantilla de hoy. Devuelve
  // { tira, hoja, medidas } o null si no se puede (sin copia congelada o faltan fotos).
  async function recomponerSesion(sesion) {
    const huella = sesion.plantilla && sesion.plantilla.huella;
    if (!huella || typeof MotorPlantillas === 'undefined') return null;
    const p = await AlmacenSesiones.obtenerCongelada(huella);
    if (!p || !MotorPlantillas.validarPlantilla(p).valida) return null;
    if (sesion.fotos.filter(Boolean).length < MotorPlantillas.contarFotos(p)) return null;
    const datos = { fecha: new Date(sesion.fecha), nombreEvento: sesion.eventoNombre };
    if (sesion.numero) datos.numeroSesion = sesion.numero;
    const opciones = { fotos: sesion.fotos, datos };
    const hoja = await MotorPlantillas.renderizarHoja(p, opciones);
    const tira = hoja.copias === 1 ? hoja.canvas : await MotorPlantillas.renderizar(p, opciones);
    return {
      tira: await aBlob(tira),
      hoja: hoja.copias === 1 ? null : await aBlob(hoja.canvas),
      medidas: { anchoMm: hoja.anchoMm, altoMm: hoja.altoMm },
    };
  }

  function mostrarDetalle(sesion) {
    sesionDetalle = sesion;
    galleryList.hidden = true;
    galleryDetail.hidden = false;
    detailStrip.src = sesion.tira ? crearUrl(sesion.tira) : (sesion.fotos.find(Boolean) || '');
    const etiqueta = etiquetaEstado(sesion);
    detailMeta.textContent = `${sesion.eventoNombre} · ${formatearFecha(sesion.fecha)} · ${textoFotos(sesion)}${etiqueta ? ` · ${etiqueta}` : ''}`;
    detailPrintBtn.disabled = !sesion.tira;
    detailDownloadBtn.disabled = !sesion.tira;
    detailGifBtn.disabled = !sesion.gif;
    detailDeleteBtn.textContent = 'Eliminar sesión';
    detailDeleteBtn.dataset.confirm = 'false';

    if (!sesion.tira) {
      recomponerSesion(sesion).then((r) => {
        if (!r || sesionDetalle !== sesion) return;
        sesion.tira = r.tira;
        sesion.hoja = r.hoja;
        sesion.impresion = r.medidas;
        detailStrip.src = crearUrl(r.tira);
        detailPrintBtn.disabled = false;
        detailDownloadBtn.disabled = false;
        detailMeta.textContent += ' · armada con el diseño original de la sesión';
      }).catch(() => { /* se queda con las fotos sueltas */ });
    }

    detailPhotos.innerHTML = '';
    sesion.fotos.forEach((src, index) => {
      if (!src) return;
      detailPhotos.appendChild(buildThumb(src, index, [accionDescargarFoto(() => sesion.fotos)]));
    });
  }

  async function volverAGaleria() {
    sesionDetalle = null;
    galleryDetail.hidden = true;
    galleryList.hidden = false;
    await renderGaleria();
  }

  // ---------- Wiring ----------

  // Migración al PIN del equipo (una sola vez): el PIN propio que el operador ya había elegido
  // pasa al equipo y se borra de los eventos guardados; el de fábrica (1234) simplemente se descarta.
  // De paso se corrige el mensaje de pausa antiguo (voseo) en los eventos ya guardados.
  async function migrarPinAlEquipo() {
    if (typeof AlmacenEventos !== 'undefined') {
      try {
        // La migración de los eventos a v2 quitó el PIN de cada evento; si había uno propio queda en el respaldo.
        const delRespaldo = AlmacenEventos.pinAntiguoDelRespaldo();
        if (!pinAntiguo && delRespaldo) pinAntiguo = delRespaldo;
      } catch (e) { /* sin persistencia disponible */ }
    }
    if (pinAntiguo) await AjustesEquipo.migrarPinAntiguo(pinAntiguo);
    // Ya pasó al equipo (o no había): el PIN no debe quedar en claro en el respaldo de los eventos.
    try { AlmacenEventos.limpiarPinsDelRespaldo(); } catch (e) { /* sin respaldo */ }
    // El PIN viejo también podía estar en los ajustes sueltos del equipo: se borra de ahí.
    try {
      const sueltos = JSON.parse(localStorage.getItem(AJUSTES_CLAVE) || 'null');
      if (sueltos && sueltos.pin !== undefined) {
        if (/^\d{4}$/.test(sueltos.pin) && sueltos.pin !== '1234' && !AjustesEquipo.estadoPin().definido) await AjustesEquipo.migrarPinAntiguo(sueltos.pin);
        localStorage.setItem(AJUSTES_CLAVE, JSON.stringify(limpiarAjustesAntiguos(sueltos)));
      }
    } catch (e) { /* sin persistencia disponible */ }
    actualizarEstadoPin();
  }
  migrarPinAlEquipo();

  // Al abrir la cabina no hay ninguna sesión de invitado en curso: lo que quedó a medias (cierre
  // de la página, corte de luz) pasa a "incompleta" con las fotos que alcanzaron a guardarse.
  AlmacenSesiones.marcarIncompletas().then((n) => {
    if (n > 0) showNotice(n === 1 ? 'Encontramos 1 sesión que quedó a medias. Sus fotos están en la galería, marcada como incompleta.' : `Encontramos ${n} sesiones que quedaron a medias. Sus fotos están en la galería, marcadas como incompletas.`);
    actualizarContadorEvento();
  }).catch(() => {});

  poblarSelectorEventos();
  initSelects();

  connectBtn.addEventListener('click', connectCamera);
  launchBtn.addEventListener('click', pedirLanzamiento);
  galleryBtn.addEventListener('click', abrirGaleria);
  aplicarAjustesAControles();
  cargarPlantilla();
  actualizarContadorEvento();
  actualizarSeccionEvento();

  // Cola de impresión: arranca con la cabina (lo que quedó "imprimiendo" pasa a "por revisar"), avisa a esta pantalla
  // de cada cambio y se vuelve a mirar cada segundo (el estado de la impresora y los semáforos dependen de ella).
  if (impresion) {
    impresion.suscribir(() => refrescarImpresora(true));
    impresion.iniciar();
    refrescarImpresora(true);
    setInterval(() => refrescarImpresora(false), 1000);
    window.addEventListener('storage', (e) => { if (e.key === null || e.key === impresion.CLAVE) refrescarImpresora(true); });
  }

  window.addEventListener('storage', (e) => { if (e.key === null || e.key === 'fotocabina-eventos') actualizarSeccionEvento(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') actualizarSeccionEvento(); });

  terminarEventoBtn.addEventListener('click', pedirTerminarEvento);
  endCancelBtn.addEventListener('click', () => cerrarTerminarEvento());
  endAcceptBtn.addEventListener('click', confirmarTerminarEvento);
  endOverlay.addEventListener('click', (e) => { if (e.target === endOverlay) cerrarTerminarEvento(); });

  mirrorToggle.addEventListener('click', () => {
    ajustes.espejo = !ajustes.espejo;
    guardarAjustes();
    aplicarEspejo();
  });

  // Cualquier toque sobre la pantalla de resultado reinicia la vuelta automática al inicio
  result.addEventListener('pointerdown', reiniciarTemporizadorInicio);

  window.addEventListener('pagehide', () => { try { liberarImpresionEnEspera(); } catch (e) { /* sin cola */ } });
  settingsBtn.addEventListener('click', () => abrirDrawer());
  printerStatusBadge.addEventListener('click', () => abrirDrawer('seccionImpresion'));
  drawerCloseBtn.addEventListener('click', cerrarDrawer);
  drawerBackdrop.addEventListener('click', cerrarDrawer);

  // "Plantilla" (riel) y "Cambiar" (tarjeta) abren el editor con este evento asociado
  // (docs/FLUJO_NAVEGACION.md, decisión "Editor y Plantillas se fusionan en un solo acceso")
  // solo si la cabina se abrió desde un evento real de la lista; si se abrió directo (sin
  // evento), no hay a qué evento asociar la plantilla elegida y se mantiene la hoja
  // "Próximamente" de siempre.
  function irAEditorDePlantilla() {
    if (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') window.location.href = `../03-editor-plantillas/index.html?evento=${encodeURIComponent(eventoActual.id)}`;
    else abrirProximamente('plantillas');
  }
  templatesBtn.addEventListener('click', irAEditorDePlantilla);
  templateChangeBtn.addEventListener('click', irAEditorDePlantilla);
  q('#templateAvisoBtn').addEventListener('click', irAEditorDePlantilla);
  helpBtn.addEventListener('click', () => abrirProximamente('ayuda'));
  soonCloseBtn.addEventListener('click', cerrarProximamente);
  soonOverlay.addEventListener('click', (e) => { if (e.target === soonOverlay) cerrarProximamente(); });

  pauseMessageInput.addEventListener('input', () => {
    ajustes.mensajePausa = pauseMessageInput.value.trim() || AJUSTES_BASE.mensajePausa;
    guardarAjustes();
  });
  guestIdle.addEventListener('click', iniciarSesionInvitado);

  pauseBtn.addEventListener('click', pauseSession);
  resumeBtn.addEventListener('click', resumeSession);
  cancelSessionBtn.addEventListener('click', cancelSession);

  lockBtn.addEventListener('click', () => abrirPin('entrar'));
  pinChangeBtn.addEventListener('click', () => { cerrarDrawer(); abrirPin('cambiar'); });
  pinPad.addEventListener('click', (e) => {
    const key = e.target.closest('[data-key]');
    if (key) teclaPin(key.dataset.key);
  });

  retakeAllBtn.addEventListener('click', retakeAllPhotos);
  confirmBtn.addEventListener('click', confirmAndCompose);

  // "Borrar y empezar de nuevo" (hito 3b): lo que esperaba confirmación se descarta sin rastro, lo que ya estaba en la fila se cancela
  // (sin gastar hoja ni contar para el tope), se borra la sesión con sus fotos y el invitado vuelve a la PANTALLA DE INICIO.
  retakeSessionBtn.addEventListener('click', async () => {
    if (retakeSessionBtn.disabled) return;
    const sesion = sesionActual;
    // Si una hoja ya salió o se está imprimiendo, borrar no la recupera: no se promete lo imposible.
    if (sesion && hojaYaSalio(sesion.id)) { actualizarEstadoImpresionResultado(); return; }
    retakeSessionBtn.disabled = true;
    detenerTemporizadorInicio();
    descartarImpresionEnEspera();
    result.hidden = true;
    try {
      if (sesion) {
        sesionActual = null;
        cancelarImpresionesPendientesDe(sesion.id);
        try { await encolarGuardado(() => AlmacenSesiones.borrar(sesion.id)); } catch (e) { /* si falla, quedará en la galería */ }
        actualizarContadorEvento();
      }
    } finally {
      retakeSessionBtn.disabled = false;
      enterIdle();
    }
  });

  finishBtn.addEventListener('click', async () => {
    if (sesionActual) {
      const sesion = sesionActual;
      sesion.estado = 'finalizada';
      sesion.terminadaEn = new Date().toISOString();
      try { await encolarGuardado(() => AlmacenSesiones.guardarRegistro(sesion)); } catch (e) { /* ya guardada al componer */ }
    }
    enterIdle(); // confirma el resultado: aquí sale la impresión automática que esperaba
  });

  downloadBtn.addEventListener('click', () => {
    const tab = tabActiva();
    if (tab === 'gif') {
      if (!gifBlob) { showNotice('El GIF todavía se está generando.'); return; }
      descargarBlob(gifBlob, 'fotocabina.gif');
    } else if (tab === 'photos') {
      descargarTodasLasFotos(photos);
    } else if (finalBlob) {
      descargarBlob(finalBlob, 'fotocabina-tira.png');
    }
  });

  if (compartirSoportado) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', async () => {
      const files = archivosParaCompartir();
      if (!files.length) { showNotice('Todavía no hay nada para compartir en esta vista.'); return; }
      try {
        await navigator.share({ files, title: 'FotoCabina' });
      } catch (e) {
        if (e && e.name !== 'AbortError') showNotice('No se pudo compartir desde este dispositivo.');
      }
    });
  }

  // El invitado pide su impresión una sola vez (las copias extra las pide el operador).
  printBtn.addEventListener('click', () => {
    if (!finalBlob || !sesionActual || printBtn.disabled) return;
    const cfg = sesionActual.configCongelada || {};
    printBtn.disabled = true;
    printLabel.textContent = 'Enviado';
    avisarEnvio(enviarAImprimir({ sesion: sesionActual, copias: cfg.copias || 1, origen: 'invitado', topeHojas: cfg.topeHojas }), true);
    actualizarEstadoImpresionResultado();
  });

  copiesMinus.addEventListener('click', () => cambiarCopias(-1));
  copiesPlus.addEventListener('click', () => cambiarCopias(1));
  copiesCancelBtn.addEventListener('click', cerrarCopias);
  copiesOkBtn.addEventListener('click', confirmarCopias);
  copiesOverlay.addEventListener('click', (e) => { if (e.target === copiesOverlay) cerrarCopias(); });
  limitOkBtn.addEventListener('click', () => { if (cerrarAvisoTope) cerrarAvisoTope(true); });
  limitCancelBtn.addEventListener('click', () => { if (cerrarAvisoTope) cerrarAvisoTope(false); });

  galleryCloseBtn.addEventListener('click', cerrarGaleria);
  detailBackBtn.addEventListener('click', volverAGaleria);
  qa('#galleryTabs .ds-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
      filtroGaleria = tab.dataset.filter;
      qa('#galleryTabs .ds-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      await renderGaleria();
    });
  });

  // Reimprimir desde la galería usa la misma cola (y cuenta para el tope), con la hoja ya compuesta de la sesión.
  detailPrintBtn.addEventListener('click', () => {
    if (!sesionDetalle || !sesionDetalle.tira) return;
    const sesion = sesionDetalle;
    const eventoId = sesion.eventoId || sesion.evento;
    abrirCopias({ titulo: 'Copias adicionales', foco: detailPrintBtn, sesion, origen: 'adicional', eventoId, topeHojas: topeVigenteDe(eventoId) });
  });
  detailDownloadBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.tira) descargarBlob(sesionDetalle.tira, 'fotocabina-tira.png'); });
  detailGifBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.gif) descargarBlob(sesionDetalle.gif, 'fotocabina.gif'); });
  detailDeleteBtn.addEventListener('click', async () => {
    if (!sesionDetalle) return;
    if (detailDeleteBtn.dataset.confirm !== 'true') {
      detailDeleteBtn.dataset.confirm = 'true';
      detailDeleteBtn.textContent = 'Toca de nuevo para eliminar';
      return;
    }
    cancelarImpresionesPendientesDe(sesionDetalle.id);
    try {
      await AlmacenSesiones.borrar(sesionDetalle.id);
    } catch (e) {
      showNotice('No se pudo eliminar la sesión.');
      return;
    }
    await volverAGaleria();
    actualizarContadorEvento();
  });

  // Teclado: dígitos/Backspace/Escape mientras el PIN está abierto; ESC cancela la sesión en
  // curso o, si no hay sesión, abre el acceso de operador; F11 alterna pantalla completa.
  document.addEventListener('keydown', (e) => {
    if (!result.hidden) reiniciarTemporizadorInicio();

    if (terminarEventoAbierto()) {
      if (e.key === 'Escape') { e.preventDefault(); cerrarTerminarEvento(); }
      else if (e.key === 'Tab') trampaFocoTerminar(e);
      return;
    }
    if (rolloAbierto()) {
      if (e.key === 'Escape') { e.preventDefault(); cerrarRollo(); }
      else if (e.key === 'Tab') trampaFocoEn(rolloOverlay, e);
      return;
    }
    if (limiteAbierto()) {
      if (e.key === 'Escape') { e.preventDefault(); if (cerrarAvisoTope) cerrarAvisoTope(false); }
      else if (e.key === 'Tab') trampaFocoEn(limitOverlay, e);
      return;
    }
    if (copiasAbierto()) {
      if (e.key === 'Escape') { e.preventDefault(); cerrarCopias(); }
      else if (e.key === 'Tab') trampaFocoEn(copiesOverlay, e);
      return;
    }
    if (proximamenteAbierto()) {
      if (e.key === 'Escape') cerrarProximamente();
      return;
    }
    if (drawerAbierto()) {
      if (e.key === 'Escape') cerrarDrawer();
      return;
    }

    if (pinAbierto()) {
      if (/^\d$/.test(e.key)) teclaPin(e.key);
      else if (e.key === 'Backspace') teclaPin('back');
      else if (e.key === 'Escape') cerrarPin();
      e.preventDefault();
      return;
    }

    if (e.key === 'Escape' && cabin.classList.contains('is-guest-mode')) {
      e.preventDefault();
      if (sessionActive) cancelSession();
      else abrirPin('entrar');
      return;
    }

    if (e.key === 'F11') {
      e.preventDefault();
      if (!document.fullscreenElement && cabin.classList.contains('is-guest-mode')) {
        cabin.requestFullscreen().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  });
})();

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

    // Con plantilla real, el número de fotos lo manda la plantilla: el selector manual no se ofrece.
    if (selectorFotos) selectorFotos.hidden = estadoPlantilla.modo !== 'demo';

    if (aviso) {
      aviso.hidden = estadoPlantilla.modo !== 'invalida';
      q('#templateAvisoTexto').textContent = estadoPlantilla.modo !== 'invalida' ? ''
        : estadoPlantilla.sinAsignar
          ? 'Este evento todavía no tiene una plantilla. Elige o crea una en el editor para poder lanzarlo.'
          : `Este evento no tiene una plantilla válida: ${estadoPlantilla.motivo}. Elige o crea una en el editor.`;
    }
    if (dibujoBase && miniatura) {
      const conMiniatura = !!plantillaActiva && !!miniatura.getAttribute('src');
      miniatura.hidden = !conMiniatura;
      dibujoBase.style.display = conMiniatura ? 'none' : '';
    }
    actualizarLanzamiento();
  }

  // "Lanzar evento" solo se ofrece con la cámara lista y una plantilla que se pueda dibujar (o en demostración).
  function actualizarLanzamiento() {
    const plantillaLista = estadoPlantilla.modo === 'demo' || estadoPlantilla.modo === 'valida';
    launchBtn.disabled = !cabin.classList.contains('is-connected') || !plantillaLista;
  }

  const sinPunto = (t) => String(t || '').replace(/\.+$/, '');
  const enMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);

  // Lee la plantilla del evento desde el almacén del editor y la valida. Se llama al abrir la cabina,
  // al cambiar de evento y al lanzar (así lo que se compone durante el evento queda fijo desde el lanzamiento).
  async function cargarPlantilla(conMiniatura = true) {
    const token = ++cargaPlantillaId;
    const eventoId = eventoActual.id;
    let nuevoEstado, nueva = null, miniaturaUrl = null; // null = no tocar la miniatura que ya se ve
    if (eventoId === 'demo') {
      nuevoEstado = { modo: 'demo', motivo: '' };
    } else if (typeof AlmacenPlantillas === 'undefined' || typeof MotorPlantillas === 'undefined') {
      nuevoEstado = { modo: 'invalida', motivo: 'faltan componentes de la aplicación' };
    } else {
      estadoPlantilla = { modo: 'cargando', motivo: '' };
      plantillaActiva = null;
      actualizarLanzamiento();
      const evento = (typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtener(eventoId) : null;
      const plantillaId = evento && evento.plantillas && evento.plantillas.porDefecto;
      if (!plantillaId) {
        nuevoEstado = { modo: 'invalida', motivo: 'todavía no se eligió ninguna', sinAsignar: true };
      } else {
        let hallada = null;
        try { hallada = await AlmacenPlantillas.obtener(plantillaId); } catch (e) { hallada = null; }
        // Recarga con la plantilla viva borrada: si el evento ya se lanzó y su copia congelada sigue en
        // IndexedDB, se usa esa copia (el evento no se bloquea). Sin congelado, sigue bloqueado (decisión 1A).
        let usaCongelada = false;
        const huellaCongelada = evento && evento.congelado && evento.congelado.plantilla && evento.congelado.plantilla.huella;
        if (!hallada && huellaCongelada && typeof AlmacenSesiones !== 'undefined') {
          try { hallada = await AlmacenSesiones.obtenerCongelada(huellaCongelada); usaCongelada = !!hallada; } catch (e) { hallada = null; }
        }
        if (!hallada) {
          nuevoEstado = { modo: 'invalida', motivo: 'la que tenía ya no existe o no se pudo leer' };
        } else {
          const v = MotorPlantillas.validarPlantilla(hallada);
          if (!v.valida) nuevoEstado = { modo: 'invalida', motivo: enMinuscula(v.motivos.map(sinPunto).join('; ')) };
          else {
            nuevoEstado = { modo: 'valida', motivo: '', congelada: usaCongelada };
            nueva = hallada;
            if (conMiniatura) { try { miniaturaUrl = await MotorPlantillas.miniatura(hallada, 108); } catch (e) { miniaturaUrl = ''; } }
          }
        }
      }
    }
    if (token !== cargaPlantillaId) return; // llegó una carga más nueva
    if (nueva !== plantillaActiva) { huellaActiva = null; modificadaActiva = null; congeladaOk = false; }
    plantillaActiva = nueva;
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
  function configCongelada() {
    const evento = (eventoActual.id !== 'demo' && typeof AlmacenEventos !== 'undefined') ? AlmacenEventos.obtener(eventoActual.id) : null;
    const entrega = (evento && evento.entrega) || {};
    const papel = plantillaActiva && plantillaActiva.papel ? plantillaActiva.papel : null;
    return {
      fotos: numeroDeFotos(),
      papel: papel ? { anchoMm: papel.anchoMm, altoMm: papel.altoMm, ppp: papel.ppp || 300, duplicarEnHoja: !!papel.duplicarEnHoja } : null,
      modo: entrega.modo || null,
      copias: entrega.copias || null,
      impresionAuto: !!entrega.impresionAuto,
      cuentaSeg: ajustes.cuenta,
      pausaSeg: ajustes.pausa,
      mensajePausa: ajustes.mensajePausa,
      pacienciaSeg: ajustes.volver,
      espejo: !!ajustes.espejo,
    };
  }

  // Congela `plantilla` como la vigente de esta cabina: calcula su huella, guarda la copia y anota el
  // congelado en el evento. Si no se pudo guardar la copia, la sesión se toma igual pero queda
  // marcada `copiaCongelada: false`.
  async function congelarVigente(plantilla) {
    plantillaActiva = plantilla;
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
  async function refrescarPlantillaVigente() {
    if (eventoActual.id === 'demo' || typeof AlmacenPlantillas === 'undefined' || typeof AlmacenEventos === 'undefined') return;
    const evento = AlmacenEventos.obtener(eventoActual.id);
    const id = evento && evento.plantillas && evento.plantillas.porDefecto;
    if (!id) return;
    const nueva = await AlmacenPlantillas.obtener(id);
    if (!nueva || !MotorPlantillas.validarPlantilla(nueva).valida) return;
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
    iniciandoSesion = true;
    try { await refrescarPlantillaVigente(); } catch (e) { /* se sigue con la plantilla congelada */ }
    iniciandoSesion = false;
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
    if (typeof AlmacenEventos === 'undefined' || id === 'demo') { actualizarContadorEvento(); cargarPlantilla(); return; }

    AlmacenEventos.setActivo(id);
    const evento = AlmacenEventos.obtener(id);
    if (evento) {
      Object.assign(ajustes, AlmacenEventos.ajustesDeEvento(evento));
      aplicarAjustesAControles();
    }
    actualizarContadorEvento();
    cargarPlantilla();
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
      estadoPlantilla = { modo: 'invalida', motivo: 'no se pudo leer' };
      plantillaActiva = null;
      actualizarResumenPlantilla();
    }
    if (estadoPlantilla.modo === 'cargando') { showNotice('Un momento: estamos revisando la plantilla. Vuelve a tocar "Lanzar evento".'); return; }
    if (estadoPlantilla.modo !== 'valida' && estadoPlantilla.modo !== 'demo') {
      showNotice('Primero elige una plantilla válida para este evento.');
      return;
    }
    if (!cabin.classList.contains('is-connected')) { showNotice('La cámara no está conectada.'); return; }
    if (plantillaActiva) { try { await congelarVigente(plantillaActiva); } catch (e) { /* la sesión igual queda sin copia congelada */ } }
    if (AjustesEquipo.estadoPin().definido) launchEvent();
    else abrirPin('crear', launchEvent);
  }

  function launchEvent() {
    cerrarDrawer();
    cerrarProximamente();
    cabin.classList.add('is-guest-mode');
    updateFrameWindow(1);

    if (cabin.requestFullscreen) {
      cabin.requestFullscreen().catch(() => {});
    }

    enterIdle();
  }

  function exitEvent() {
    detenerTemporizadorInicio();
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
        configCongelada: configCongelada(),
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

  function abrirPin(modo = 'entrar', alTerminar = null) {
    const definido = AjustesEquipo.estadoPin().definido;
    if (modo === 'entrar' && !definido) { exitEvent(); return; } // sin PIN en el equipo, nadie queda encerrado
    const pasos = modo === 'entrar' ? ['verificar'] : (definido ? ['actual', 'nuevo', 'repetir'] : ['nuevo', 'repetir']);
    pinFlujo = { modo: modo === 'entrar' ? 'entrar' : (definido ? 'cambiar' : 'crear'), pasos, paso: 0, nuevo: '', alTerminar };
    pinOverlay.dataset.visible = 'true';
    mostrarPaso();
    if (sessionActive && !paused) {
      pauseSession();
      pausadoPorPin = true;
    }
  }

  function cerrarPin() {
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
    result.hidden = false;
    iniciarTemporizadorInicio();
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
    generarGif();
    mostrarQrEntrega();
  }

  // ---------- Entrega digital por QR (A8 del mapa de pantallas) ----------
  // Maqueta visual: el QR se genera de verdad (librería qrcode vendorizada, sin red), pero
  // apunta a una URL de muestra porque todavía no existe el servidor local de la Fase D
  // (docs/DSLRBOOTH_PRODUCT_CONTEXT.md §3.6/§3.7). El paso a "descargado" está simulado.
  let qrEntregaTimeout = null;

  function mostrarQrEntrega() {
    if (qrEntregaTimeout) clearTimeout(qrEntregaTimeout);
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

  function imprimirUrl(url, medidas) {
    const m = medidas && medidas.anchoMm > 0 && medidas.altoMm > 0 ? medidas : HOJA_4X6_MM;
    const ancho = `${Math.round(m.anchoMm * 100) / 100}mm`, alto = `${Math.round(m.altoMm * 100) / 100}mm`;
    const w = window.open('', '_blank');
    if (!w) { showNotice('El navegador bloqueó la ventana de impresión.'); return; }
    w.document.write(`<title>FotoCabina</title><style>@page{size:${ancho} ${alto};margin:0}html,body{margin:0;width:${ancho};height:${alto}}img{width:${ancho};height:${alto};display:block}</style><img src="${url}" onload="print();setTimeout(close,400)">`);
    w.document.close();
  }

  function imprimirBlob(blob, medidas) {
    const url = URL.createObjectURL(blob);
    imprimirUrl(url, medidas);
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  }

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

  mirrorToggle.addEventListener('click', () => {
    ajustes.espejo = !ajustes.espejo;
    guardarAjustes();
    aplicarEspejo();
  });

  // Cualquier toque sobre la pantalla de resultado reinicia la vuelta automática al inicio
  result.addEventListener('pointerdown', reiniciarTemporizadorInicio);

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

  retakeSessionBtn.addEventListener('click', async () => {
    detenerTemporizadorInicio();
    result.hidden = true;
    if (sesionActual) {
      const sesion = sesionActual;
      sesionActual = null;
      try { await encolarGuardado(() => AlmacenSesiones.borrar(sesion.id)); } catch (e) { /* si falla, quedará en la galería */ }
      actualizarContadorEvento();
    }
    gifBlob = null;
    retakeAllPhotos();
  });

  finishBtn.addEventListener('click', async () => {
    if (sesionActual) {
      const sesion = sesionActual;
      sesion.estado = 'finalizada';
      sesion.terminadaEn = new Date().toISOString();
      try { await encolarGuardado(() => AlmacenSesiones.guardarRegistro(sesion)); } catch (e) { /* ya guardada al componer */ }
    }
    enterIdle();
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

  if (puedeCompartirArchivos()) {
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

  printBtn.addEventListener('click', () => {
    if (!finalBlob) return;
    if (hojaBlob) imprimirBlob(hojaBlob, hojaMedidas);
    else imprimirBlob(finalBlob, hojaMedidas);
  });

  galleryCloseBtn.addEventListener('click', cerrarGaleria);
  detailBackBtn.addEventListener('click', volverAGaleria);
  qa('#galleryTabs .ds-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
      filtroGaleria = tab.dataset.filter;
      qa('#galleryTabs .ds-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      await renderGaleria();
    });
  });

  detailPrintBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.tira) imprimirBlob(sesionDetalle.hoja || sesionDetalle.tira, sesionDetalle.impresion); });
  detailDownloadBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.tira) descargarBlob(sesionDetalle.tira, 'fotocabina-tira.png'); });
  detailGifBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.gif) descargarBlob(sesionDetalle.gif, 'fotocabina.gif'); });
  detailDeleteBtn.addEventListener('click', async () => {
    if (!sesionDetalle) return;
    if (detailDeleteBtn.dataset.confirm !== 'true') {
      detailDeleteBtn.dataset.confirm = 'true';
      detailDeleteBtn.textContent = 'Toca de nuevo para eliminar';
      return;
    }
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

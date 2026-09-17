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
  const pinInput = q('#pinInput');
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

  // Ajustes de sesión del operador, persistidos en este equipo (localStorage). El PIN pasará a
  // configurarse por evento cuando exista la pantalla de configuración (C2 del mapa).
  const AJUSTES_CLAVE = 'fotocabina-ajustes';
  const AJUSTES_BASE = { fotos: 3, cuenta: 3, pausa: 3, mensajePausa: '¡Cambiá de pose!', pin: '1234', volver: 30, espejo: true };
  const ajustes = cargarAjustes();

  function cargarAjustes() {
    try {
      const guardado = JSON.parse(localStorage.getItem(AJUSTES_CLAVE) || '{}');
      return { ...AJUSTES_BASE, ...guardado };
    } catch (e) {
      return { ...AJUSTES_BASE };
    }
  }

  function guardarAjustes() {
    try {
      localStorage.setItem(AJUSTES_CLAVE, JSON.stringify(ajustes));
    } catch (e) {
      // sin persistencia disponible, los ajustes igual valen durante esta sesión
    }
    actualizarResumenPlantilla();
  }

  function actualizarResumenPlantilla() {
    const pausa = ajustes.pausa > 0 ? `pausa ${ajustes.pausa} s` : 'sin pausa';
    templateMeta.textContent = `${ajustes.fotos} fotos · 2×6 en 4×6 · cuenta ${ajustes.cuenta} s · ${pausa}`;
  }

  const PROXIMAMENTE = {
    plantillas: { titulo: 'Plantillas del evento', texto: 'Elegir qué diseños puede usar el invitado en este evento y ver cómo queda cada uno antes de lanzar.' },
    ayuda: { titulo: 'Ayuda', texto: 'Guía rápida de uso, atajos de teclado y contacto de soporte.' },
  };
  // Proporción de cada foto dentro de la plantilla actual (2x6 duplicado en 4x6 → recorte
  // casi cuadrado por foto). Cuando el editor de plantillas defina el tamaño real por diseño,
  // este valor se lee de la plantilla activa en vez de quedar fijo acá.
  const FRAME_RATIO = '4 / 3.2';
  const GIF_ANCHO = 480, GIF_ALTO = 360, GIF_RETARDO_MS = 600;

  const ICONO_CAMARA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.6em;height:0.6em;display:inline-block;vertical-align:middle"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/></svg>';
  const ICONO_REPETIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 10-3 6.3"/><path d="M20 6v6h-6"/></svg>';
  const ICONO_DESCARGAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>';

  let stream = null;
  let photos = [];
  let finalBlob = null;
  let gifBlob = null;
  let gifGeneracion = 0;
  let eventoActual = { id: 'demo', nombre: 'Sesión de prueba' };
  let sesionActual = null;

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

  function initSelects() {
    qa('.ds-select').forEach((select) => {
      const trigger = select.querySelector('.ds-select-trigger');
      const value = select.querySelector('.ds-select-value');
      const menu = select.querySelector('.ds-select-menu');
      const options = Array.from(menu.querySelectorAll('.ds-select-option'));

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

      options.forEach((opt) => {
        opt.addEventListener('click', () => {
          options.forEach((o) => o.setAttribute('aria-selected', 'false'));
          opt.setAttribute('aria-selected', 'true');
          value.textContent = opt.textContent;
          close();

          const tipo = select.dataset.select;
          if (tipo === 'countdown') { ajustes.cuenta = parseInt(opt.dataset.value, 10) || 3; guardarAjustes(); }
          if (tipo === 'photos') { ajustes.fotos = parseInt(opt.dataset.value, 10) || 3; guardarAjustes(); }
          if (tipo === 'pause') { ajustes.pausa = parseInt(opt.dataset.value, 10) || 0; guardarAjustes(); }
          if (tipo === 'return') { ajustes.volver = parseInt(opt.dataset.value, 10) || 0; guardarAjustes(); }
          if (tipo === 'event') { eventoActual = { id: opt.dataset.value, nombre: opt.textContent }; actualizarContadorEvento(); }
        });
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
    pinInput.value = ajustes.pin;
    actualizarResumenPlantilla();
    aplicarEspejo();
  }

  function aplicarEspejo() {
    video.classList.toggle('is-unmirrored', !ajustes.espejo);
    mirrorToggle.setAttribute('aria-checked', String(ajustes.espejo));
  }

  // ---------- Contador del evento (tarjeta de plantilla) ----------

  async function actualizarContadorEvento() {
    try {
      const sesiones = await AlmacenSesiones.listar(eventoActual.id);
      if (!sesiones.length) {
        templateStats.textContent = 'Sin sesiones todavía';
        return;
      }
      const ultima = new Date(sesiones[0].fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      templateStats.textContent = `${sesiones.length} ${sesiones.length === 1 ? 'sesión' : 'sesiones'} · última ${ultima}`;
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

  async function connectCamera() {
    hideNotice();
    connectBtn.disabled = true;
    connectBtn.textContent = 'Conectando…';
    setCameraStatus('warn', 'Cámara conectando');

    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();

      cabin.classList.add('is-connected');
      setCameraStatus('ready', 'Cámara lista');
      connectHint.textContent = `Todo listo. Lanzá el evento cuando quieras. Durante el evento, tocá "Operador" e ingresá el PIN ${ajustes.pin} para volver acá.`;
      connectBtn.textContent = 'Cámara conectada';
      launchBtn.disabled = false;
    } catch (e) {
      setCameraStatus('error', 'Cámara sin conectar');
      connectBtn.disabled = false;
      connectBtn.textContent = 'Reintentar cámara';
      showNotice('No pudimos abrir la cámara. Da permiso de acceso cuando el navegador lo pida.');
    }
  }

  // ---------- Marco de encuadre (guía proporcional al tamaño de foto en la plantilla) ----------

  function updateFrameWindow() {
    frameWindow.style.setProperty('--frame-ratio', FRAME_RATIO);
  }

  // ---------- Modo invitado: entrar / salir ----------

  function launchEvent() {
    cerrarDrawer();
    cerrarProximamente();
    cabin.classList.add('is-guest-mode');
    updateFrameWindow();

    if (cabin.requestFullscreen) {
      cabin.requestFullscreen().catch(() => {});
    }

    enterIdle();
  }

  function exitEvent() {
    detenerTemporizadorInicio();
    if (sessionActive) cancelRequested = true;
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
    photos = [];
    finalBlob = null;
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
    try {
      const total = ajustes.fotos;
      for (let i = startIndex; i < total; i++) {
        countdownLabel.textContent = `Foto ${i + 1} de ${total}`;
        await countdown(ajustes.cuenta);
        photos[i] = capture();

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

  function capture() {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 960;
    const ctx = c.getContext('2d');
    if (ajustes.espejo) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, c.width, c.height);

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

  // ---------- PIN de operador ----------

  function renderPinDots() {
    Array.from(pinDots.children).forEach((dot, i) => {
      dot.dataset.filled = String(i < pinBuffer.length);
    });
  }

  function abrirPin() {
    pinBuffer = '';
    renderPinDots();
    pinDots.classList.remove('pin-dots--error');
    pinHint.classList.remove('pin-hint--error');
    pinHint.textContent = 'Ingresá el PIN para volver a los controles.';
    pinOverlay.dataset.visible = 'true';
    if (sessionActive && !paused) {
      pauseSession();
      pausadoPorPin = true;
    }
  }

  function cerrarPin() {
    pinOverlay.dataset.visible = 'false';
    pinBuffer = '';
    if (pausadoPorPin) {
      pausadoPorPin = false;
      resumeSession();
    }
  }

  function pinAbierto() {
    return pinOverlay.dataset.visible === 'true';
  }

  async function teclaPin(key) {
    if (key === 'cancel') { cerrarPin(); return; }
    if (key === 'back') { pinBuffer = pinBuffer.slice(0, -1); renderPinDots(); return; }
    if (!/^\d$/.test(key) || pinBuffer.length >= 4) return;

    pinBuffer += key;
    renderPinDots();
    if (pinBuffer.length < 4) return;

    if (pinBuffer === ajustes.pin) {
      pausadoPorPin = false;
      exitEvent();
      return;
    }

    pinDots.classList.add('pin-dots--error');
    pinHint.classList.add('pin-hint--error');
    pinHint.textContent = 'PIN incorrecto.';
    await sleep(600);
    pinBuffer = '';
    renderPinDots();
    pinDots.classList.remove('pin-dots--error');
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
  }

  async function recaptureOne(index) {
    beginCapture();
    countdownLabel.textContent = `Repitiendo foto ${index + 1} de ${ajustes.fotos}`;
    try {
      await countdown(ajustes.cuenta);
      photos[index] = capture();
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
    await compose();
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

  async function compose() {
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

    finalBlob = await new Promise((r) => c.toBlob(r, 'image/png'));
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
    qrCardTitle.textContent = 'Llevate tus fotos';
    qrCardSub.textContent = 'Escaneá el código con tu celular';

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
      qrCardSub.textContent = 'Ya lo tenés en tu celular';
    }, 6000);
  }

  // La sesión se guarda sola apenas se arma la tira: si el invitado se va sin tocar "Finalizar",
  // el operador igual la encuentra en la galería para reimprimir o reenviar.
  async function guardarSesionActual() {
    if (!sesionActual) {
      sesionActual = {
        id: AlmacenSesiones.nuevoId(),
        evento: eventoActual.id,
        eventoNombre: eventoActual.nombre,
        fecha: new Date().toISOString(),
        estado: 'compuesta',
      };
    }
    sesionActual.fotos = photos.slice();
    sesionActual.tira = finalBlob;
    sesionActual.gif = gifBlob;
    try {
      await AlmacenSesiones.guardar(sesionActual);
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
      sesionActual.gif = gifBlob;
      try { await AlmacenSesiones.guardar(sesionActual); } catch (e) { /* ya se avisó al guardar la tira */ }
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

  function imprimirUrl(url) {
    const w = window.open('', '_blank');
    if (!w) { showNotice('El navegador bloqueó la ventana de impresión.'); return; }
    w.document.write(`<title>FotoCabina 4x6</title><style>@page{size:4in 6in;margin:0}html,body{margin:0;width:4in;height:6in}img{width:4in;height:6in;display:block}</style><img src="${url}" onload="print();setTimeout(close,400)">`);
    w.document.close();
  }

  function imprimirBlob(blob) {
    const url = URL.createObjectURL(blob);
    imprimirUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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
      img.alt = 'Tira de la sesión';
      img.src = sesion.tira ? crearUrl(sesion.tira) : (sesion.fotos[0] || '');
      card.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'gallery-card-meta';
      const nombreEvento = filtroGaleria === 'all' ? ` · ${sesion.eventoNombre}` : '';
      meta.innerHTML = `<span class="gallery-card-time">${formatearFecha(sesion.fecha)}</span><span class="gallery-card-count">${sesion.fotos.length} fotos${nombreEvento}</span>`;
      card.appendChild(meta);

      card.addEventListener('click', () => mostrarDetalle(sesion));
      galleryGrid.appendChild(card);
    });
  }

  function mostrarDetalle(sesion) {
    sesionDetalle = sesion;
    galleryList.hidden = true;
    galleryDetail.hidden = false;
    detailStrip.src = sesion.tira ? crearUrl(sesion.tira) : (sesion.fotos[0] || '');
    detailMeta.textContent = `${sesion.eventoNombre} · ${formatearFecha(sesion.fecha)} · ${sesion.fotos.length} fotos`;
    detailGifBtn.disabled = !sesion.gif;
    detailDeleteBtn.textContent = 'Eliminar sesión';
    detailDeleteBtn.dataset.confirm = 'false';

    detailPhotos.innerHTML = '';
    sesion.fotos.forEach((src, index) => {
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

  initSelects();

  connectBtn.addEventListener('click', connectCamera);
  launchBtn.addEventListener('click', launchEvent);
  galleryBtn.addEventListener('click', abrirGaleria);
  aplicarAjustesAControles();
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

  templatesBtn.addEventListener('click', () => abrirProximamente('plantillas'));
  templateChangeBtn.addEventListener('click', () => abrirProximamente('plantillas'));
  helpBtn.addEventListener('click', () => abrirProximamente('ayuda'));
  soonCloseBtn.addEventListener('click', cerrarProximamente);
  soonOverlay.addEventListener('click', (e) => { if (e.target === soonOverlay) cerrarProximamente(); });

  pauseMessageInput.addEventListener('input', () => {
    ajustes.mensajePausa = pauseMessageInput.value.trim() || AJUSTES_BASE.mensajePausa;
    guardarAjustes();
  });
  pinInput.addEventListener('input', () => {
    const valor = pinInput.value.replace(/\D/g, '').slice(0, 4);
    pinInput.value = valor;
    const valido = valor.length === 4;
    pinInput.setAttribute('aria-invalid', String(!valido));
    if (valido) {
      ajustes.pin = valor;
      guardarAjustes();
    }
  });

  guestIdle.addEventListener('click', runSession);

  pauseBtn.addEventListener('click', pauseSession);
  resumeBtn.addEventListener('click', resumeSession);
  cancelSessionBtn.addEventListener('click', cancelSession);

  lockBtn.addEventListener('click', abrirPin);
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
      try { await AlmacenSesiones.borrar(sesionActual.id); } catch (e) { /* si falla, quedará en la galería */ }
      sesionActual = null;
      actualizarContadorEvento();
    }
    gifBlob = null;
    retakeAllPhotos();
  });

  finishBtn.addEventListener('click', async () => {
    if (sesionActual) {
      sesionActual.estado = 'finalizada';
      try { await AlmacenSesiones.guardar(sesionActual); } catch (e) { /* ya guardada al componer */ }
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
    imprimirUrl(finalPrint.src);
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

  detailPrintBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.tira) imprimirBlob(sesionDetalle.tira); });
  detailDownloadBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.tira) descargarBlob(sesionDetalle.tira, 'fotocabina-tira.png'); });
  detailGifBtn.addEventListener('click', () => { if (sesionDetalle && sesionDetalle.gif) descargarBlob(sesionDetalle.gif, 'fotocabina.gif'); });
  detailDeleteBtn.addEventListener('click', async () => {
    if (!sesionDetalle) return;
    if (detailDeleteBtn.dataset.confirm !== 'true') {
      detailDeleteBtn.dataset.confirm = 'true';
      detailDeleteBtn.textContent = 'Tocá de nuevo para eliminar';
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
      else abrirPin();
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

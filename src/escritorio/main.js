/*
  FotoCabina de escritorio (proceso principal de Electron).

  Qué hace: abre las pantallas de siempre (src/pages/…) en una ventana, sin cambiar su aspecto, y les presta lo que el
  navegador no puede: hablar con la cámara Canon (EDSDK) e imprimir en silencio por el driver de Windows.
  Las pantallas no tocan Node: solo ven `window.fotocabinaEscritorio` (preload.js). Si no existe (se abren en un
  navegador), siguen funcionando como antes con la cámara web y la impresora simulada.

  Uso: `npm start` dentro de src/escritorio/. Opciones: --kiosco (pantalla completa), --dev (herramientas de desarrollo),
  --pantalla=<ruta bajo src/pages> (por defecto 04-lista-eventos/index.html),
  --salida-prueba=<carpeta> (no imprime: guarda cada hoja como .xps y ofrece solo impresoras virtuales).
*/
'use strict';

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');

const { buscarEdsdk } = require('./config');
const { CamaraCanon } = require('./camara/camara-canon');
const { ImpresoraWindows } = require('./impresion/impresora-windows');

const CARPETA_PAGINAS = path.resolve(__dirname, '..', 'pages');
const argumento = (nombre) => { const a = process.argv.find((x) => x === '--' + nombre || x.startsWith('--' + nombre + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : null; };
const MODO_KIOSCO = !!argumento('kiosco');
const MODO_DEV = !!argumento('dev');
const PANTALLA_INICIAL = String(argumento('pantalla') || '04-lista-eventos/index.html');

let ventana = null;
let camara = null;
let impresora = null;
let edsdk = null;
let suscritoACuadros = false;

// Una sola copia del programa a la vez: dos procesos peleándose por la cámara y la impresora serían un desastre.
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => { if (ventana) { if (ventana.isMinimized()) ventana.restore(); ventana.focus(); } });
}

function urlDePantalla(rel) {
  const ruta = path.resolve(CARPETA_PAGINAS, rel);
  if (!ruta.startsWith(CARPETA_PAGINAS + path.sep)) throw new Error('Pantalla fuera de src/pages: ' + rel);
  return pathToFileURL(ruta).href;
}

// Solo se aceptan órdenes de nuestras propias pantallas (archivos de src/pages), nunca de otra página.
function esOrigenPropio(evento) {
  try {
    const url = evento.senderFrame ? evento.senderFrame.url : evento.sender.getURL();
    if (!url.startsWith('file:')) return false;
    return path.resolve(fileURLToPath(url)).startsWith(CARPETA_PAGINAS + path.sep);
  } catch (e) { return false; }
}

function manejar(canal, fn) {
  ipcMain.handle(canal, async (evento, ...args) => {
    if (!esOrigenPropio(evento)) return { ok: false, codigo: 'origen', mensaje: 'Origen no permitido.' };
    try { return { ok: true, ...(await fn(...args)) }; }
    catch (e) { return { ok: false, codigo: e && e.codigo || 'error', codigoSdk: e && e.codigoSdk, mensaje: e && e.message || String(e) }; }
  });
}

function enviarAVentana(canal, datos) {
  if (ventana && !ventana.isDestroyed()) ventana.webContents.send(canal, datos);
}

function prepararCamara() {
  edsdk = buscarEdsdk(app.getPath('userData'));
  camara = new CamaraCanon({ carpetaDll: edsdk.carpeta });
  camara.on('cuadro', (jpeg) => { if (suscritoACuadros) enviarAVentana('camara:cuadro', jpeg); });
  camara.on('estado', (e) => enviarAVentana('camara:estado', e));
  camara.on('aviso', (e) => enviarAVentana('camara:aviso', e));

  manejar('camara:conectar', async () => {
    const r = await camara.conectar();
    return { nombre: r.nombre };
  });
  manejar('camara:disparar', async () => {
    const r = await camara.disparar();
    return { jpeg: r.jpeg, ms: r.ms };
  });
  manejar('camara:desconectar', async () => { suscritoACuadros = false; await camara.desconectar(); return {}; });
  manejar('camara:estado', async () => camara.instantanea());
  manejar('camara:suscribir', async (activo) => { suscritoACuadros = !!activo; return {}; });
}

function prepararImpresion() {
  impresora = new ImpresoraWindows();
  // Modo de prueba sin papel: --salida-prueba=<carpeta> guarda cada hoja como archivo (.xps) en vez de imprimirla y muestra
  // también las impresoras virtuales. Así la tubería completa se prueba sin gastar papel ni tinta.
  const salidaPrueba = argumento('salida-prueba');
  manejar('impresion:listar', async () => {
    const todas = await impresora.listar();
    return { impresoras: salidaPrueba ? todas.map((i) => ({ ...i, virtual: false })).filter((i) => /xps|pdf/i.test(i.nombre)) : todas };
  });
  manejar('impresion:estado', async (nombre) => ({ estado: await impresora.estado(String(nombre || '')) }));
  manejar('impresion:imprimir', async (datos) => {
    const d = datos || {};
    if (!d.nombre || !d.imagen) { const e = new Error('Faltan datos para imprimir.'); e.codigo = 'datos'; throw e; }
    const r = await impresora.imprimir({
      nombre: String(d.nombre), hojas: Math.min(99, Math.max(1, Math.round(Number(d.hojas) || 1))), anchoMm: Number(d.anchoMm) || 101.6, altoMm: Number(d.altoMm) || 152.4,
      imagen: Buffer.from(d.imagen), trabajoId: d.trabajoId,
      salidaArchivo: salidaPrueba ? path.join(String(salidaPrueba), `hoja-${Date.now()}.xps`) : null,
    });
    return { resultado: r };
  });
}

function prepararInformacion() {
  manejar('escritorio:info', async () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    plataforma: process.platform,
    edsdk: edsdk.carpeta ? { disponible: true, origen: edsdk.origen } : { disponible: false, intentadas: edsdk.intentadas },
  }));
}

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1366, height: 800, minWidth: 1024, minHeight: 640,
    backgroundColor: '#0b0b0c',
    fullscreen: MODO_KIOSCO,
    autoHideMenuBar: true,
    title: 'FotoCabina',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      // La cabina cuenta segundos y dispara aunque la ventana quede tapada o sin foco: nada de ahorro de energía por segundo plano.
      backgroundThrottling: false,
    },
  });
  ventana.setMenuBarVisibility(false);
  const wc = ventana.webContents;

  // Solo se navega entre las pantallas del propio programa; nada de ventanas nuevas ni sitios externos.
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('will-navigate', (e, url) => {
    try {
      if (!(url.startsWith('file:') && path.resolve(fileURLToPath(url)).startsWith(CARPETA_PAGINAS + path.sep))) e.preventDefault();
    } catch (x) { e.preventDefault(); }
  });
  // Al salir de una pantalla se suelta la cámara (otro programa puede necesitarla y la sesión del SDK no debe quedar colgada).
  wc.on('did-start-navigation', (detalles) => {
    if (detalles.isMainFrame && !detalles.isSameDocument) { suscritoACuadros = false; if (camara && camara.instantanea().hayHijo) camara.desconectar().catch(() => {}); }
  });
  if (MODO_DEV) wc.on('before-input-event', (e, i) => { if (i.type === 'keyDown' && (i.key === 'F12' || (i.control && i.shift && i.key.toLowerCase() === 'i'))) wc.toggleDevTools(); });

  ventana.loadURL(urlDePantalla(PANTALLA_INICIAL));
  ventana.on('closed', () => { ventana = null; });
}

app.whenReady().then(() => {
  // Permisos del navegador: solo la cámara web (respaldo de la DSLR) y pantalla completa, y solo para nuestras pantallas.
  const permitidos = new Set(['media', 'fullscreen']);
  session.defaultSession.setPermissionRequestHandler((wc, permiso, devolver, detalles) => {
    let propio = false;
    try { propio = (detalles.requestingUrl || '').startsWith('file:') && path.resolve(fileURLToPath(detalles.requestingUrl)).startsWith(CARPETA_PAGINAS + path.sep); } catch (e) { propio = false; }
    devolver(propio && permitidos.has(permiso));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permiso) => permitidos.has(permiso));

  prepararCamara();
  prepararImpresion();
  prepararInformacion();
  crearVentana();
});

app.on('window-all-closed', () => { app.quit(); });

let cerrando = false;
app.on('before-quit', (e) => {
  if (cerrando) return;
  cerrando = true;
  e.preventDefault();
  const fin = () => app.exit(0);
  Promise.race([
    Promise.allSettled([camara ? camara.desconectar() : null, impresora ? impresora.cerrar() : null]),
    new Promise((r) => setTimeout(r, 4000)),
  ]).then(fin, fin);
});

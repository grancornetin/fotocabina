/*
  Puente de la cámara Canon (proceso aparte). Habla con el SDK oficial de Canon (EDSDK) por la DLL de 64 bits.

  Por qué es un proceso aparte: si el SDK se cuelga o se cae (cable suelto, cámara que se duerme), se cae este proceso,
  no el programa. El programa lo vuelve a lanzar y la cabina muestra "Reconectar cámara".

  Cómo se usa: lo lanza `camara-canon.js` con child_process.fork (mensajes con process.send). Necesita un Node o un
  Electron de 64 bits (la DLL de Canon es de 64 bits).

  Las DLL de Canon NO viven en este repositorio (su licencia no permite repartirlas): se reciben por la ruta de la
  configuración (ver config.js).

  Mensajes que recibe: { id, cmd: 'conectar' | 'disparar' | 'desconectar' | 'estado', ... }
  Mensajes que envía:  { id, ok, ...datos } (respuesta) y { evento: 'cuadro' | 'estado', ... } (sin id).

  Secuencia del SDK (probada con la EOS Rebel T5): EdsInitializeSDK, EdsGetCameraList, EdsOpenSession, controladores de
  eventos, SaveTo=Host + EdsSetCapacity, Evf_Mode=1, Evf_OutputDevice=PC, bucle EdsDownloadEvfImage; para disparar se
  apaga la vista previa, EdsSendCommand TakePicture y se espera la foto con EdsGetEvent; después se vuelve a encender.
*/
'use strict';

const path = require('path');
const fs = require('fs');

// Códigos de error del SDK que significan "la cámara ya no está" (ver EDSDKErrors.h).
const ERR = {
  OK: 0x0,
  DEVICE_NOT_FOUND: 0x80,
  DEVICE_BUSY: 0x81,
  DEVICE_INVALID: 0x82,
  COMM_PORT_IS_IN_USE: 0xC0, // otro programa ya tiene abierta la cámara
  COMM_DISCONNECTED: 0xC1,
  COMM_USB_BUS_ERR: 0xC4,
  SESSION_NOT_OPEN: 0x2003,
  OBJECT_NOTREADY: 0xA102,
  TAKE_PICTURE_AF_NG: 0x8D01,
};
const ERRORES_DE_PERDIDA = new Set([ERR.DEVICE_NOT_FOUND, ERR.DEVICE_INVALID, ERR.COMM_DISCONNECTED, ERR.COMM_USB_BUS_ERR, ERR.SESSION_NOT_OPEN]);

const PROP = { SaveTo: 0x0b, EvfOutputDevice: 0x500, EvfMode: 0x501, ProductName: 0x02, BatteryLevel: 0x08 };
const EVENTO_OBJETO = { DirItemRequestTransfer: 0x208 };
const EVENTO_ESTADO = { Todos: 0x300, Apagada: 0x301, VaADormir: 0x303, ErrorInterno: 0x306 };
const CMD = { Disparar: 0x0, ExtenderApagado: 0x1, BotonObturador: 0x4 };
const OBTURADOR_COMPLETO_SIN_AF = 0x00010003;
const OBTURADOR_SUELTO = 0x0;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const hex = (n) => '0x' + (n >>> 0).toString(16).toUpperCase();

function crearPuente(enviar) {
  const koffi = require('koffi');
  let lib = null;
  let f = null; // funciones del SDK
  let tipos = null;
  let sdkIniciado = false;
  let camara = null;
  let lista = null;
  let estado = 'desconectada';
  let nombreCamara = '';
  let vistaActiva = false;
  let bucleEnCurso = null;
  let pedirParar = false;
  let fotoRecibida = null; // { jpeg, nombre } entregado por el controlador de eventos
  let errorFoto = null;
  let trozos = null;
  let cb = null; // controladores registrados (se conservan para que no los recoja el recolector)
  let cola = Promise.resolve();

  function cambiarEstado(nuevo, detalle) {
    if (estado === nuevo && !detalle) return;
    estado = nuevo;
    enviar({ evento: 'estado', estado: nuevo, detalle: detalle || '' });
  }

  function cargarSdk(carpetaDll) {
    if (lib) return;
    const dll = path.join(carpetaDll, 'EDSDK.dll');
    if (!fs.existsSync(dll)) { const e = new Error('No se encontró EDSDK.dll en ' + carpetaDll); e.codigo = 'sin-sdk'; throw e; }
    // EDSDK.dll necesita EdsImage.dll (y otras) de su misma carpeta.
    try { koffi.load('kernel32.dll').func('bool SetDllDirectoryW(str16 ruta)')(carpetaDll); } catch (e) { /* si falla, la carga de abajo lo dirá */ }
    // El SDK espera un hilo con COM de apartamento único.
    try { koffi.load('ole32.dll').func('int32 CoInitializeEx(void *reservado, uint32 modelo)')(null, 2); } catch (e) { /* no es fatal */ }
    lib = koffi.load(dll);
    const DirItemInfo = koffi.struct('EdsDirectoryItemInfo', {
      size: 'uint64', isFolder: 'int32', groupID: 'uint32', option: 'uint32',
      szFileName: koffi.array('char', 256, 'String'), format: 'uint32', dateTime: 'uint32',
    });
    const Capacidad = koffi.struct('EdsCapacity', { numberOfFreeClusters: 'int32', bytesPerSector: 'int32', reset: 'int32' });
    const ProtoObjeto = koffi.proto('uint32 EdsObjectEventHandler(uint32 evento, void *objeto, void *contexto)');
    const ProtoEstado = koffi.proto('uint32 EdsStateEventHandler(uint32 evento, uint32 parametro, void *contexto)');
    tipos = { DirItemInfo, Capacidad, ProtoObjeto, ProtoEstado };
    f = {
      iniciar: lib.func('uint32 EdsInitializeSDK()'),
      terminar: lib.func('uint32 EdsTerminateSDK()'),
      listaCamaras: lib.func('uint32 EdsGetCameraList(_Out_ void **lista)'),
      contar: lib.func('uint32 EdsGetChildCount(void *ref, _Out_ uint32 *n)'),
      hijo: lib.func('uint32 EdsGetChildAtIndex(void *ref, int32 i, _Out_ void **hijo)'),
      abrirSesion: lib.func('uint32 EdsOpenSession(void *camara)'),
      cerrarSesion: lib.func('uint32 EdsCloseSession(void *camara)'),
      liberar: lib.func('uint32 EdsRelease(void *ref)'),
      ponerPropiedad: lib.func('uint32 EdsSetPropertyData(void *ref, uint32 propiedad, int32 param, uint32 tamano, void *datos)'),
      ponerCapacidad: lib.func('uint32 EdsSetCapacity(void *camara, EdsCapacity capacidad)'),
      crearFlujoMemoria: lib.func('uint32 EdsCreateMemoryStream(uint64 tamano, _Out_ void **flujo)'),
      crearImagenEvf: lib.func('uint32 EdsCreateEvfImageRef(void *flujo, _Out_ void **imagen)'),
      bajarEvf: lib.func('uint32 EdsDownloadEvfImage(void *camara, void *imagen)'),
      puntero: lib.func('uint32 EdsGetPointer(void *flujo, _Out_ void **p)'),
      largo: lib.func('uint32 EdsGetLength(void *flujo, _Out_ uint64 *n)'),
      comando: lib.func('uint32 EdsSendCommand(void *camara, uint32 comando, int32 param)'),
      alObjeto: lib.func('uint32 EdsSetObjectEventHandler(void *camara, uint32 evento, EdsObjectEventHandler *cb, void *ctx)'),
      alEstado: lib.func('uint32 EdsSetCameraStateEventHandler(void *camara, uint32 evento, EdsStateEventHandler *cb, void *ctx)'),
      eventos: lib.func('uint32 EdsGetEvent()'),
      infoItem: lib.func('uint32 EdsGetDirectoryItemInfo(void *item, _Out_ EdsDirectoryItemInfo *info)'),
      bajar: lib.func('uint32 EdsDownload(void *item, uint64 tamano, void *flujo)'),
      bajarListo: lib.func('uint32 EdsDownloadComplete(void *item)'),
      cancelarBajada: lib.func('uint32 EdsDownloadCancel(void *item)'),
      leerPropiedad: lib.func('uint32 EdsGetPropertyData(void *ref, uint32 propiedad, int32 param, uint32 tamano, _Out_ uint8_t *datos)'),
    };
  }

  function leerFlujo(flujo) {
    const p = [null]; const n = [0];
    let r = f.puntero(flujo, p); if (r) throw errorSdk('EdsGetPointer', r);
    r = f.largo(flujo, n); if (r) throw errorSdk('EdsGetLength', r);
    const largo = Number(n[0]);
    if (!largo || !p[0]) return Buffer.alloc(0);
    return copiarMemoria(p[0], largo); // copia: el flujo se reutiliza
  }

  // Copia `largo` bytes desde un puntero nativo. Se hace por trozos de tamaño fijo con arreglos tipados porque Electron
  // no permite ArrayBuffer externos (koffi.view cierra el proceso). Trozos: 64 KB, 1 KB, 16 B y 1 B, de mayor a menor.
  function copiarMemoria(ptr, largo) {
    if (!trozos) trozos = [65536, 1024, 16, 1].map((n) => ({ n, tipo: koffi.array('uint8_t', n, 'Typed') }));
    const salida = Buffer.allocUnsafe(largo);
    let pos = 0;
    while (pos < largo) {
      const t = trozos.find((x) => x.n <= largo - pos);
      const trozo = koffi.decode(ptr, pos, t.tipo);
      salida.set(trozo, pos);
      pos += t.n;
    }
    return salida;
  }

  function errorSdk(donde, codigo) {
    const e = new Error(`${donde} falló (${hex(codigo)})`);
    e.codigoSdk = codigo;
    e.codigo = ERRORES_DE_PERDIDA.has(codigo) ? 'camara-perdida' : (codigo === ERR.DEVICE_BUSY || codigo === ERR.COMM_PORT_IS_IN_USE) ? 'camara-ocupada' : 'error-sdk';
    return e;
  }

  const poner32 = (ref, prop, valor) => {
    const b = Buffer.alloc(4); b.writeUInt32LE(valor >>> 0, 0);
    return f.ponerPropiedad(ref, prop, 0, 4, b);
  };

  // ---- controladores de eventos del SDK (se ejecutan dentro de EdsGetEvent, en este mismo hilo) ----
  function alObjeto(evento, objeto) {
    if (evento === EVENTO_OBJETO.DirItemRequestTransfer) {
      let flujo = null;
      try {
        const info = {};
        let r = f.infoItem(objeto, info); if (r) throw errorSdk('EdsGetDirectoryItemInfo', r);
        const tam = Number(info.size);
        const memoria = [null];
        r = f.crearFlujoMemoria(tam, memoria); if (r) throw errorSdk('EdsCreateMemoryStream', r);
        flujo = memoria[0];
        r = f.bajar(objeto, tam, flujo); if (r) throw errorSdk('EdsDownload', r);
        f.bajarListo(objeto);
        fotoRecibida = { jpeg: leerFlujo(flujo), nombre: info.szFileName };
      } catch (e) {
        errorFoto = e;
        try { f.cancelarBajada(objeto); } catch (x) { /* nada */ }
      } finally {
        if (flujo) f.liberar(flujo);
        f.liberar(objeto);
      }
    }
    return 0;
  }

  function alEstado(evento, parametro) {
    if (evento === EVENTO_ESTADO.Apagada) {
      // La cámara se apagó o se durmió (apagado automático) o se soltó el cable: el SDK ya no la ve.
      pedirParar = true;
      cambiarEstado('durmiendo', 'La cámara se apagó o se durmió (apagado automático). Enciéndela o tócala para despertarla y reconecta.');
    } else if (evento === EVENTO_ESTADO.VaADormir) {
      // Aviso de que se va a apagar sola: se le pide más tiempo mientras la cabina esté conectada.
      try { f.comando(camara, CMD.ExtenderApagado, 0); } catch (e) { /* nada */ }
      enviar({ evento: 'aviso', codigo: 'apagado-automatico', detalle: 'La cámara avisó que se apagaría sola; se le pidió más tiempo. Conviene desactivar el apagado automático en la cámara.' });
    } else if (evento === EVENTO_ESTADO.ErrorInterno) {
      enviar({ evento: 'aviso', codigo: 'error-interno', detalle: 'La cámara informó un error interno.' });
    }
    return 0;
  }

  // ---- conexión ----
  async function conectar(carpetaDll) {
    if (estado === 'conectada' && camara) return { nombre: nombreCamara };
    cargarSdk(carpetaDll);
    if (!sdkIniciado) {
      const r = f.iniciar(); if (r) throw errorSdk('EdsInitializeSDK', r);
      sdkIniciado = true;
    }
    cambiarEstado('conectando');
    const l = [null];
    let r = f.listaCamaras(l); if (r) throw errorSdk('EdsGetCameraList', r);
    lista = l[0];
    const n = [0]; f.contar(lista, n);
    if (!n[0]) { f.liberar(lista); lista = null; cambiarEstado('desconectada'); const e = new Error('No hay ninguna cámara Canon conectada.'); e.codigo = 'sin-camara'; throw e; }
    const c = [null]; r = f.hijo(lista, 0, c); if (r) throw errorSdk('EdsGetChildAtIndex', r);
    camara = c[0];
    r = f.abrirSesion(camara);
    if (r) {
      f.liberar(camara); camara = null; f.liberar(lista); lista = null;
      cambiarEstado('desconectada');
      const e = errorSdk('EdsOpenSession', r);
      if (e.codigo === 'camara-ocupada') { e.codigo = 'camara-ocupada'; e.message = 'La cámara está siendo usada por otro programa (dslrBooth, EOS Utility). Ciérralo y reintenta.'; }
      throw e;
    }
    cb = {
      objeto: koffi.register((ev, obj) => alObjeto(ev, obj), koffi.pointer(tipos.ProtoObjeto)),
      estado: koffi.register((ev, par) => alEstado(ev, par), koffi.pointer(tipos.ProtoEstado)),
    };
    f.alObjeto(camara, EVENTO_OBJETO.DirItemRequestTransfer, cb.objeto, null);
    f.alEstado(camara, EVENTO_ESTADO.Todos, cb.estado, null);
    r = poner32(camara, PROP.SaveTo, 2); if (r) throw errorSdk('SaveTo=PC', r); // la foto llega al PC, no a la tarjeta
    f.ponerCapacidad(camara, { numberOfFreeClusters: 0x7FFFFFFF, bytesPerSector: 0x1000, reset: 1 });
    nombreCamara = 'Canon EOS';
    try {
      const buf = Buffer.alloc(64); if (!f.leerPropiedad(camara, PROP.ProductName, 0, 64, buf)) nombreCamara = buf.toString('latin1').replace(/\0.*$/s, '') || nombreCamara;
    } catch (e) { /* el nombre es solo informativo */ }
    pedirParar = false;
    cambiarEstado('conectada');
    await iniciarVista();
    return { nombre: nombreCamara };
  }

  // ---- vista previa en vivo ----
  async function iniciarVista() {
    if (vistaActiva) return;
    let r = poner32(camara, PROP.EvfMode, 1); if (r && r !== ERR.OBJECT_NOTREADY) throw errorSdk('Evf_Mode', r);
    r = poner32(camara, PROP.EvfOutputDevice, 2); if (r) throw errorSdk('Evf_OutputDevice=PC', r);
    vistaActiva = true; pedirParar = false;
    bucleEnCurso = bucleVista().catch((e) => { enviar({ evento: 'aviso', codigo: 'vista-error', detalle: String(e && e.message || e) }); });
  }

  async function detenerVista() {
    pedirParar = true; vistaActiva = false;
    if (bucleEnCurso) { try { await bucleEnCurso; } catch (e) { /* ya se avisó */ } bucleEnCurso = null; }
    pedirParar = estado !== 'conectada';
  }

  async function bucleVista() {
    const m = [null]; const im = [null];
    let r = f.crearFlujoMemoria(0, m); if (r) throw errorSdk('EdsCreateMemoryStream', r);
    r = f.crearImagenEvf(m[0], im); if (r) { f.liberar(m[0]); throw errorSdk('EdsCreateEvfImageRef', r); }
    let seguidos = 0;
    try {
      while (vistaActiva && !pedirParar) {
        f.eventos(); // entrega eventos de estado (apagado, aviso de sueño) y de objeto
        r = f.bajarEvf(camara, im[0]);
        if (r === 0) {
          seguidos = 0;
          const jpeg = leerFlujo(m[0]);
          if (jpeg.length) enviar({ evento: 'cuadro', jpeg });
          await new Promise((res) => setImmediate(res));
        } else if (r === ERR.OBJECT_NOTREADY) {
          await esperar(15);
        } else if (ERRORES_DE_PERDIDA.has(r)) {
          cambiarEstado('desconectada', 'Se perdió la conexión con la cámara (' + hex(r) + ').');
          return;
        } else {
          seguidos += 1;
          if (seguidos > 100) { cambiarEstado('desconectada', 'La vista previa dejó de responder (' + hex(r) + ').'); return; }
          await esperar(30);
        }
      }
    } finally {
      vistaActiva = false; // el bucle terminó (por orden o por pérdida): iniciarVista() puede volver a arrancarlo
      f.liberar(im[0]); f.liberar(m[0]);
    }
  }

  // ---- disparo ----
  async function disparar() {
    if (estado !== 'conectada' || !camara) { const e = new Error('La cámara no está conectada.'); e.codigo = 'camara-perdida'; throw e; }
    await detenerVista();
    try {
      f.eventos(); // limpia eventos viejos (antes de anular fotoRecibida: un evento viejo podría dejarla puesta)
      fotoRecibida = null; errorFoto = null;
      try { poner32(camara, PROP.EvfOutputDevice, 0); } catch (e) { /* sigue */ }
      await esperar(800); // el espejo necesita bajar antes de disparar (con menos tiempo la T5 responde "desconectada")
      let r = f.comando(camara, CMD.Disparar, 0);
      if (r === ERR.TAKE_PICTURE_AF_NG) {
        // No logró enfocar (poca luz, tapa puesta): se dispara igual sin enfoque automático, para no dejar al invitado esperando.
        r = f.comando(camara, CMD.BotonObturador, OBTURADOR_COMPLETO_SIN_AF);
        await esperar(150);
        f.comando(camara, CMD.BotonObturador, OBTURADOR_SUELTO);
      }
      if (r) throw errorSdk('TakePicture', r);
      const t0 = Date.now();
      while (!fotoRecibida && !errorFoto && Date.now() - t0 < 15000 && estado === 'conectada') { f.eventos(); await esperar(10); }
      if (errorFoto) throw errorFoto;
      if (!fotoRecibida) {
        const e = new Error(estado === 'conectada' ? 'La foto no llegó al equipo en 15 segundos.' : 'La cámara se desconectó al disparar.');
        e.codigo = estado === 'conectada' ? 'foto-no-llego' : 'camara-perdida';
        throw e;
      }
      return { jpeg: fotoRecibida.jpeg, ms: Date.now() - t0 };
    } finally {
      if (estado === 'conectada') { try { await iniciarVista(); } catch (e) { enviar({ evento: 'aviso', codigo: 'vista-error', detalle: String(e.message) }); } }
    }
  }

  async function desconectar() {
    await detenerVista();
    try { if (camara) { f.cerrarSesion(camara); f.liberar(camara); } } catch (e) { /* ya no estaba */ }
    try { if (lista) f.liberar(lista); } catch (e) { /* idem */ }
    camara = null; lista = null;
    try { if (sdkIniciado) { f.terminar(); sdkIniciado = false; } } catch (e) { /* idem */ }
    cambiarEstado('desconectada');
  }

  // Las órdenes se atienden de a una (el SDK no es reentrante).
  function encolar(fn) {
    const siguiente = cola.then(fn, fn);
    cola = siguiente.catch(() => {});
    return siguiente;
  }

  async function atender(msg) {
    try {
      let datos = {};
      if (msg.cmd === 'conectar') datos = await encolar(() => conectar(msg.carpetaDll));
      else if (msg.cmd === 'disparar') datos = await encolar(() => disparar());
      else if (msg.cmd === 'desconectar') datos = await encolar(() => desconectar());
      else if (msg.cmd === 'estado') datos = { estado, nombre: nombreCamara };
      else throw new Error('Orden desconocida: ' + msg.cmd);
      enviar({ id: msg.id, ok: true, ...datos });
    } catch (e) {
      enviar({ id: msg.id, ok: false, codigo: e.codigo || 'error', codigoSdk: e.codigoSdk, mensaje: e.message });
    }
  }

  return { atender, desconectar, estadoActual: () => estado };
}

// ---- Modo proceso hijo ----
if (require.main === module && typeof process.send === 'function') {
  const puente = crearPuente((m) => { try { process.send(m); } catch (e) { /* el padre ya cerró */ } });
  process.on('message', (m) => { puente.atender(m); });
  process.on('disconnect', () => { puente.desconectar().finally(() => process.exit(0)); });
  process.send({ evento: 'listo' });
}

module.exports = { crearPuente, ERR };

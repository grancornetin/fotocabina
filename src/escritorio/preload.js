/*
  Puente seguro entre las pantallas y el programa. Las pantallas no tienen Node: solo ven lo que se expone aquí
  como `window.fotocabinaEscritorio`. Todas las órdenes devuelven una promesa; si algo falla, la promesa se rechaza
  con un Error que trae `codigo` (por ejemplo 'sin-camara', 'camara-ocupada', 'camara-perdida', 'impresora-sin-papel').
*/
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

async function pedir(canal, ...args) {
  const r = await ipcRenderer.invoke(canal, ...args);
  if (!r || r.ok === false) {
    const e = new Error((r && r.mensaje) || 'Error del programa de escritorio');
    e.codigo = (r && r.codigo) || 'error';
    if (r && r.codigoSdk) e.codigoSdk = r.codigoSdk;
    throw e;
  }
  return r;
}

function suscribir(canal, fn) {
  const oyente = (_evento, dato) => { try { fn(dato); } catch (e) { /* un oyente roto no frena el resto */ } };
  ipcRenderer.on(canal, oyente);
  return () => ipcRenderer.removeListener(canal, oyente);
}

contextBridge.exposeInMainWorld('fotocabinaEscritorio', {
  esEscritorio: true,
  info: () => pedir('escritorio:info'),
  camara: {
    conectar: () => pedir('camara:conectar'),
    // Devuelve { jpeg: Uint8Array } con la foto completa de la cámara.
    disparar: async () => { const r = await pedir('camara:disparar'); return { jpeg: r.jpeg, ms: r.ms }; },
    desconectar: () => pedir('camara:desconectar'),
    estado: () => pedir('camara:estado'),
    // Los cuadros de la vista previa llegan como Uint8Array (JPEG). Devuelve la función para dejar de escuchar.
    alCuadro: (fn) => { pedir('camara:suscribir', true).catch(() => {}); const quitar = suscribir('camara:cuadro', fn); return () => { quitar(); pedir('camara:suscribir', false).catch(() => {}); }; },
    alEstado: (fn) => suscribir('camara:estado', fn),
    alAviso: (fn) => suscribir('camara:aviso', fn),
  },
  impresion: {
    listar: async () => (await pedir('impresion:listar')).impresoras,
    estado: async (nombre) => (await pedir('impresion:estado', nombre)).estado,
    // datos: { nombre, hojas, anchoMm, altoMm, imagen: ArrayBuffer | Uint8Array, trabajoId, partir, ajusteXMm, ajusteYMm }
    imprimir: async (datos) => (await pedir('impresion:imprimir', datos)).resultado,
    // { nombre, partir } -> { xMm, yMm }: el ajuste de fábrica de esa impresora y tipo de papel.
    ajusteBase: async (datos) => (await pedir('impresion:ajuste-base', datos)).ajuste,
  },
});

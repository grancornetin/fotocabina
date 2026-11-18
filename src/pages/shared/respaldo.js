// Respaldo y restauración (hito 1.6, docs/ARQUITECTURA_FLUJO.md §7.9): guarda TODO lo del equipo en un archivo y lo
// restaura, y exporta / importa un solo evento. Global `Respaldo`. Sin dependencias, sin red.
//
// Es la "puerta" de esta función (regla 6 del contrato de datos): las pantallas (04-lista-eventos, 06-respaldo) solo
// hablan con este módulo; él habla con los almacenes (AlmacenEventos, AlmacenPlantillas, AlmacenSesiones) por sus
// funciones dedicadas y nunca toca localStorage ni IndexedDB por su cuenta (salvo la fecha del último respaldo).
//
// FORMATO DEL PAQUETE (versión de formato 1): un ZIP estándar SIN compresión (método "stored", con CRC32), que se abre
// con el Explorador de Windows. Entradas:
//   manifest.json             identificación: app, formato, tipo ('respaldo' | 'evento'), fecha, versiones de datos, conteos, bytes, conFotos
//   LEEME.txt                 explicación para una persona
//   datos/eventos.json        [evento v2]
//   datos/contadores.json     { eventoId: último n.º de sesión }
//   datos/plantillas.json     contenedor del editor { plantillas, ultimaAbierta } (o null) — en un evento, solo las plantillas que usa
//   datos/sesiones.json       [registro de sesión tal como está guardado]
//   datos/archivos.json       [{ id, sesionId, tipo, tamano, creadoEn, mime, entrada }]
//   datos/congeladas.json     [{ huella, nombre, creadoEn, plantilla }]
//   archivos/NNNNNN.bin       cada foto, tira, hoja o GIF como entrada propia (no base64)
// Nunca entra: el PIN ni nada del Equipo, el evento activo, el tema, los ajustes sueltos ni la copia de la migración v1.
//
// REGLA DE ORO: restaurar es "todo o nada". Primero se VALIDA todo el archivo (ZIP válido, CRC de cada entrada, manifest
// conocido, versión que esta app entiende, estructura de los datos) sin escribir nada; después se guarda localStorage
// con una instantánea para deshacer y por último IndexedDB en UNA sola transacción. Si algo falla se devuelve la
// instantánea y se avisa que no se cambió nada. Antes de escribir se comprueba el espacio libre (con 10 % de margen).
//
// Las partes puras (CRC32, escritor y lector de ZIP, validación del manifest, nombres de archivo) no usan el DOM y se
// prueban en shared/tests-validador.html.
(function (raiz) {
  'use strict';

  const FORMATO = 1;
  const APP = 'FotoCabina';
  const CLAVE_ULTIMO = 'fotocabina-ultimo-respaldo';
  const MARGEN_ESPACIO = 1.1;
  const TROZO = 4 * 1024 * 1024;
  const U32 = 0xFFFFFFFF;
  const U16 = 0xFFFF;
  const MAX_CENTRAL = 256 * 1024 * 1024;
  const VERSIONES_DATOS = { evento: 2, sesion: 2, baseDeDatos: 3, plantillas: 'editor-v1' };

  class ErrorRespaldo extends Error {
    constructor(codigo, mensaje, causa) {
      super(mensaje);
      this.name = 'ErrorRespaldo';
      this.codigo = codigo;
      this.causa = causa || null;
    }
  }

  const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const clonar = (v) => JSON.parse(JSON.stringify(v));
  const noop = () => {};
  const codificar = (texto) => new TextEncoder().encode(texto);

  function plural(n, uno, varios) {
    return n + ' ' + (n === 1 ? uno : varios);
  }

  function formatearBytes(n) {
    if (!Number.isFinite(n)) return '—';
    const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = Math.max(0, n);
    let i = 0;
    while (v >= 1024 && i < unidades.length - 1) { v /= 1024; i += 1; }
    const texto = i === 0 ? String(Math.round(v)) : v.toLocaleString('es-CL', { maximumFractionDigits: v >= 100 ? 0 : 1 });
    return texto + ' ' + unidades[i];
  }

  // ---------- CRC32 ----------

  const TABLA_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  // CRC32 de unos bytes. `previo` permite seguir un cálculo en trozos (pasar el resultado anterior).
  function crc32(bytes, previo) {
    let c = (previo === undefined ? 0 : previo) ^ U32;
    for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ U32) >>> 0;
  }

  // CRC32 de un Blob leyéndolo en trozos (nunca lo carga entero en memoria).
  async function crc32Blob(blob, alAvanzar) {
    let crc = 0;
    for (let i = 0; i < blob.size; i += TROZO) {
      const trozo = new Uint8Array(await blob.slice(i, Math.min(blob.size, i + TROZO)).arrayBuffer());
      crc = crc32(trozo, crc);
      if (alAvanzar) alAvanzar(Math.min(blob.size, i + TROZO));
    }
    return crc;
  }

  // ---------- ZIP "stored" ----------

  function aBlob(datos) {
    if (datos instanceof Blob) return datos;
    if (typeof datos === 'string') return new Blob([codificar(datos)]);
    return new Blob([datos]);
  }

  function fechaDos(d) {
    const y = Math.min(2107, Math.max(1980, d.getFullYear()));
    return {
      hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      fecha: ((y - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    };
  }

  // Arma un ZIP sin compresión. `entradas` = [{ nombre, datos: Blob | Uint8Array | string }]. Devuelve una promesa
  // con un Blob armado con partes (los Blobs grandes se enlazan, no se copian a memoria). Los nombres con tildes
  // llevan la marca UTF-8. Opciones: `fecha` (Date), `alAvanzar(hecho, total)`, `forzarZip64` (solo para pruebas:
  // escribe los registros ZIP64 aunque no hagan falta; el escritor los usa solo con más de 65 535 entradas o 4 GB).
  async function crearZip(entradas, opciones) {
    const op = opciones || {};
    const { hora, fecha } = fechaDos(op.fecha || new Date());
    const partes = [];
    const centrales = [];
    let desplazamiento = 0;
    for (let i = 0; i < entradas.length; i++) {
      const e = entradas[i];
      const datos = aBlob(e.datos);
      if (datos.size >= U32) throw new ErrorRespaldo('DEMASIADO_GRANDE', 'Un archivo individual pesa más de 4 GB y no cabe en el respaldo.');
      const nombre = codificar(e.nombre);
      const crc = await crc32Blob(datos);
      const flags = /[^\x20-\x7E]/.test(e.nombre) ? 0x0800 : 0;
      const local = new Uint8Array(30 + nombre.length);
      const dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, flags, true);
      dv.setUint16(8, 0, true);
      dv.setUint16(10, hora, true);
      dv.setUint16(12, fecha, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, datos.size, true);
      dv.setUint32(22, datos.size, true);
      dv.setUint16(26, nombre.length, true);
      dv.setUint16(28, 0, true);
      local.set(nombre, 30);
      partes.push(local);
      if (datos.size) partes.push(datos);
      centrales.push({ nombre, crc, tamano: datos.size, flags, desplazamiento });
      desplazamiento += local.length + datos.size;
      if (op.alAvanzar) op.alAvanzar(i + 1, entradas.length);
    }
    const cdInicio = desplazamiento;
    let cdTamano = 0;
    centrales.forEach((c) => {
      const grande = op.forzarZip64 === true || c.desplazamiento >= U32;
      const extra = grande ? 12 : 0;
      const b = new Uint8Array(46 + c.nombre.length + extra);
      const dv = new DataView(b.buffer);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, grande ? 45 : 20, true);
      dv.setUint16(6, grande ? 45 : 20, true);
      dv.setUint16(8, c.flags, true);
      dv.setUint16(10, 0, true);
      dv.setUint16(12, hora, true);
      dv.setUint16(14, fecha, true);
      dv.setUint32(16, c.crc, true);
      dv.setUint32(20, c.tamano, true);
      dv.setUint32(24, c.tamano, true);
      dv.setUint16(28, c.nombre.length, true);
      dv.setUint16(30, extra, true);
      dv.setUint16(32, 0, true);
      dv.setUint16(34, 0, true);
      dv.setUint16(36, 0, true);
      dv.setUint32(38, 0, true);
      dv.setUint32(42, grande ? U32 : c.desplazamiento, true);
      b.set(c.nombre, 46);
      if (grande) {
        const o = 46 + c.nombre.length;
        dv.setUint16(o, 1, true);
        dv.setUint16(o + 2, 8, true);
        dv.setBigUint64(o + 4, BigInt(c.desplazamiento), true);
      }
      partes.push(b);
      cdTamano += b.length;
    });
    const necesitaZip64 = op.forzarZip64 === true || centrales.length >= U16 || cdInicio >= U32 || cdTamano >= U32;
    if (necesitaZip64) {
      const z = new Uint8Array(56 + 20);
      const dz = new DataView(z.buffer);
      dz.setUint32(0, 0x06064b50, true);
      dz.setBigUint64(4, 44n, true);
      dz.setUint16(12, 45, true);
      dz.setUint16(14, 45, true);
      dz.setUint32(16, 0, true);
      dz.setUint32(20, 0, true);
      dz.setBigUint64(24, BigInt(centrales.length), true);
      dz.setBigUint64(32, BigInt(centrales.length), true);
      dz.setBigUint64(40, BigInt(cdTamano), true);
      dz.setBigUint64(48, BigInt(cdInicio), true);
      dz.setUint32(56, 0x07064b50, true);
      dz.setUint32(60, 0, true);
      dz.setBigUint64(64, BigInt(cdInicio + cdTamano), true);
      dz.setUint32(72, 1, true);
      partes.push(z);
    }
    const fin = new Uint8Array(22);
    const df = new DataView(fin.buffer);
    df.setUint32(0, 0x06054b50, true);
    df.setUint16(4, 0, true);
    df.setUint16(6, 0, true);
    df.setUint16(8, necesitaZip64 ? U16 : centrales.length, true);
    df.setUint16(10, necesitaZip64 ? U16 : centrales.length, true);
    df.setUint32(12, necesitaZip64 ? U32 : cdTamano, true);
    df.setUint32(16, necesitaZip64 ? U32 : cdInicio, true);
    df.setUint16(20, 0, true);
    partes.push(fin);
    return new Blob(partes, { type: 'application/zip' });
  }

  const MENSAJE_NO_ES_ZIP = 'Este archivo no es un respaldo de FotoCabina. Elige un archivo .zip que hayas creado con «Crear respaldo» o «Exportar evento».';
  const MENSAJE_DANADO = 'El archivo está dañado y no se puede leer. No se cambió nada. Vuelve a copiarlo desde donde lo guardaste o usa otro respaldo.';

  function numeroSeguro(big, mensaje) {
    const n = Number(big);
    if (!Number.isSafeInteger(n)) throw new ErrorRespaldo('CORRUPTO', mensaje || MENSAJE_DANADO);
    return n;
  }

  // Abre un ZIP (Blob o File) leyendo solo el directorio central. Devuelve
  // { blob, entradas: [{ nombre, tamano, crc, desplazamiento }], porNombre: Map, abrirDatos(entrada), leerTexto(entrada), verificar(entrada, alAvanzar) }.
  // Lanza ErrorRespaldo: NO_ES_ZIP (no hay ZIP), CORRUPTO (directorio roto o CRC malo), COMPRIMIDO (entradas con compresión o cifrado).
  async function abrirZip(blob) {
    if (!blob || typeof blob.size !== 'number' || blob.size < 22) throw new ErrorRespaldo('NO_ES_ZIP', MENSAJE_NO_ES_ZIP);
    const leer = async (desde, hasta) => new Uint8Array(await blob.slice(desde, hasta).arrayBuffer());
    const ventana = Math.min(blob.size, 22 + U16);
    const cola = await leer(blob.size - ventana, blob.size);
    let pos = -1;
    for (let i = cola.length - 22; i >= 0; i--) {
      if (cola[i] === 0x50 && cola[i + 1] === 0x4b && cola[i + 2] === 0x05 && cola[i + 3] === 0x06) {
        const largo = new DataView(cola.buffer, cola.byteOffset + i, 22).getUint16(20, true);
        if (i + 22 + largo <= cola.length) { pos = i; break; }
      }
    }
    if (pos < 0) throw new ErrorRespaldo('NO_ES_ZIP', MENSAJE_NO_ES_ZIP);
    const dvFin = new DataView(cola.buffer, cola.byteOffset + pos, 22);
    let total = dvFin.getUint16(10, true);
    let cdTamano = dvFin.getUint32(12, true);
    let cdInicio = dvFin.getUint32(16, true);
    const posAbsoluta = blob.size - ventana + pos;
    if (total === U16 || cdTamano === U32 || cdInicio === U32) {
      if (posAbsoluta < 20) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      const loc = await leer(posAbsoluta - 20, posAbsoluta);
      const dl = new DataView(loc.buffer, loc.byteOffset, 20);
      if (dl.getUint32(0, true) !== 0x07064b50) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      const posZ = numeroSeguro(dl.getBigUint64(8, true));
      if (posZ + 56 > blob.size) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      const z = await leer(posZ, posZ + 56);
      const dz = new DataView(z.buffer, z.byteOffset, 56);
      if (dz.getUint32(0, true) !== 0x06064b50) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      total = numeroSeguro(dz.getBigUint64(32, true));
      cdTamano = numeroSeguro(dz.getBigUint64(40, true));
      cdInicio = numeroSeguro(dz.getBigUint64(48, true));
    }
    if (cdInicio + cdTamano > blob.size || cdTamano > MAX_CENTRAL) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
    const central = await leer(cdInicio, cdInicio + cdTamano);
    const dc = new DataView(central.buffer, central.byteOffset, central.length);
    const entradas = [];
    const porNombre = new Map();
    let p = 0;
    for (let n = 0; n < total; n++) {
      if (p + 46 > central.length || dc.getUint32(p, true) !== 0x02014b50) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      const flags = dc.getUint16(p + 8, true);
      const metodo = dc.getUint16(p + 10, true);
      const crc = dc.getUint32(p + 16, true);
      let tamanoComp = dc.getUint32(p + 20, true);
      let tamano = dc.getUint32(p + 24, true);
      const largoNombre = dc.getUint16(p + 28, true);
      const largoExtra = dc.getUint16(p + 30, true);
      const largoComentario = dc.getUint16(p + 32, true);
      let desplazamiento = dc.getUint32(p + 42, true);
      if (p + 46 + largoNombre + largoExtra + largoComentario > central.length) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      const nombre = new TextDecoder('utf-8').decode(central.subarray(p + 46, p + 46 + largoNombre));
      let e = p + 46 + largoNombre;
      const finExtra = e + largoExtra;
      while (e + 4 <= finExtra) {
        const id = dc.getUint16(e, true);
        const largo = dc.getUint16(e + 2, true);
        if (id === 1) {
          let o = e + 4;
          if (tamano === U32) { tamano = numeroSeguro(dc.getBigUint64(o, true)); o += 8; }
          if (tamanoComp === U32) { tamanoComp = numeroSeguro(dc.getBigUint64(o, true)); o += 8; }
          if (desplazamiento === U32) { desplazamiento = numeroSeguro(dc.getBigUint64(o, true)); o += 8; }
        }
        e += 4 + largo;
      }
      if ((flags & 1) || metodo !== 0) {
        throw new ErrorRespaldo('COMPRIMIDO', 'Este archivo fue modificado después de crearlo (tiene compresión o contraseña) y FotoCabina no puede leerlo así. Usa el archivo tal como se descargó, sin volver a comprimirlo.');
      }
      if (tamano !== tamanoComp || desplazamiento + 30 > cdInicio) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
      const entrada = { nombre, tamano, crc, desplazamiento, inicioDatos: null };
      if (nombre.endsWith('/')) { p += 46 + largoNombre + largoExtra + largoComentario; continue; }
      entradas.push(entrada);
      porNombre.set(nombre, entrada);
      p += 46 + largoNombre + largoExtra + largoComentario;
    }
    const zip = {
      blob,
      entradas,
      porNombre,
      // Blob con los bytes de la entrada (lee el encabezado local para saber dónde empiezan). Es una referencia al archivo, no una copia.
      async abrirDatos(entrada, tipo) {
        if (entrada.inicioDatos === null) {
          const h = await leer(entrada.desplazamiento, entrada.desplazamiento + 30);
          const dh = new DataView(h.buffer, h.byteOffset, 30);
          if (h.length < 30 || dh.getUint32(0, true) !== 0x04034b50) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
          entrada.inicioDatos = entrada.desplazamiento + 30 + dh.getUint16(26, true) + dh.getUint16(28, true);
        }
        if (entrada.inicioDatos + entrada.tamano > cdInicio) throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO);
        return blob.slice(entrada.inicioDatos, entrada.inicioDatos + entrada.tamano, tipo || '');
      },
      async leerTexto(entrada) {
        const datos = await zip.abrirDatos(entrada);
        try {
          return new TextDecoder('utf-8', { fatal: true }).decode(await datos.arrayBuffer()).replace(/^﻿/, '');
        } catch (err) {
          throw new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO, err);
        }
      },
      async verificar(entrada, alAvanzar) {
        const datos = await zip.abrirDatos(entrada);
        const crcReal = await crc32Blob(datos, alAvanzar);
        if (crcReal !== entrada.crc) {
          throw new ErrorRespaldo('CORRUPTO', 'El archivo está dañado: falló la verificación de «' + entrada.nombre + '». No se cambió nada. Vuelve a copiarlo desde donde lo guardaste o usa otro respaldo.');
        }
      },
    };
    return zip;
  }

  // ---------- Manifest ----------

  const CONTEOS = ['eventos', 'plantillas', 'sesiones', 'archivos', 'fotos', 'congeladas'];

  // Revisa el manifest de un paquete. { ok: true, manifest } o { ok: false, codigo, mensaje }.
  // `formatoMaximo` es la versión de formato más nueva que esta app entiende (por defecto la actual).
  function validarManifest(m, formatoMaximo) {
    const max = formatoMaximo || FORMATO;
    if (!esObjeto(m) || m.app !== APP) {
      return { ok: false, codigo: 'NO_ES_FOTOCABINA', mensaje: 'Este ZIP no es de FotoCabina (no trae su archivo de identificación). Elige un archivo creado con «Crear respaldo» o «Exportar evento».' };
    }
    if (!Number.isInteger(m.formato) || m.formato < 1) {
      return { ok: false, codigo: 'ESTRUCTURA', mensaje: 'El archivo trae una identificación que no se entiende. No se cambió nada. Crea el respaldo de nuevo.' };
    }
    if (m.formato > max) {
      return { ok: false, codigo: 'VERSION_NUEVA', mensaje: 'Este respaldo lo creó una versión más nueva de FotoCabina (formato ' + m.formato + ') y esta versión solo entiende hasta el formato ' + max + '. Actualiza FotoCabina e inténtalo de nuevo. No se cambió nada.' };
    }
    if (m.tipo !== 'respaldo' && m.tipo !== 'evento') {
      return { ok: false, codigo: 'ESTRUCTURA', mensaje: 'No se sabe qué tipo de paquete es este archivo. No se cambió nada.' };
    }
    if (typeof m.creadoEn !== 'string' || isNaN(Date.parse(m.creadoEn)) || typeof m.conFotos !== 'boolean' || !esObjeto(m.conteos)) {
      return { ok: false, codigo: 'ESTRUCTURA', mensaje: 'Al archivo le falta información (fecha o conteos). No se cambió nada. Crea el respaldo de nuevo.' };
    }
    for (const c of CONTEOS) {
      if (!Number.isInteger(m.conteos[c]) || m.conteos[c] < 0) {
        return { ok: false, codigo: 'ESTRUCTURA', mensaje: 'Al archivo le falta información (conteo de ' + c + '). No se cambió nada. Crea el respaldo de nuevo.' };
      }
    }
    return { ok: true, manifest: m };
  }

  // ---------- Nombres de archivo ----------

  function fechaLocal(d) {
    const x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }

  function nombreRespaldo(fecha) {
    return 'fotocabina-respaldo-' + fechaLocal(fecha) + '.zip';
  }

  function nombreLimpio(texto) {
    const limpio = String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');
    return limpio || 'sin-nombre';
  }

  function nombreArchivoEvento(nombre, fecha) {
    return 'evento-' + nombreLimpio(nombre) + '-' + fechaLocal(fecha) + '.zip';
  }

  // ---------- Último respaldo ----------

  function ultimoRespaldo() {
    try {
      const v = localStorage.getItem(CLAVE_ULTIMO);
      return v && !isNaN(Date.parse(v)) ? v : null;
    } catch (e) { return null; }
  }

  function registrarRespaldo() {
    try { localStorage.setItem(CLAVE_ULTIMO, new Date().toISOString()); } catch (e) { /* sin persistencia */ }
  }

  // Descarga el Blob con un enlace `download` y revoca la dirección un minuto después. `registrar`: anota la fecha del
  // último respaldo (solo para respaldos completos).
  function descargar(blob, nombre, opciones) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 60000);
    if (opciones && opciones.registrar) registrarRespaldo();
  }

  // ---------- Espacio ----------

  // { disponible, usado, cuota, porcentaje, nivel: 'ok' | 'aviso' | 'critico' | 'desconocido', persistente: true | false | null }
  // Sin dato del navegador no se inventa nada: `disponible` es false y `nivel` 'desconocido'.
  async function estadoEspacio() {
    const r = { disponible: false, usado: null, cuota: null, porcentaje: null, nivel: 'desconocido', persistente: null };
    try {
      if (navigator.storage && typeof navigator.storage.estimate === 'function') {
        const e = await navigator.storage.estimate();
        if (Number.isFinite(e.usage) && Number.isFinite(e.quota) && e.quota > 0) {
          r.disponible = true;
          r.usado = e.usage;
          r.cuota = e.quota;
          r.porcentaje = (e.usage / e.quota) * 100;
          r.nivel = r.porcentaje >= 95 ? 'critico' : (r.porcentaje >= 80 ? 'aviso' : 'ok');
        }
      }
    } catch (e) { /* sin dato */ }
    try {
      if (navigator.storage && typeof navigator.storage.persisted === 'function') r.persistente = await navigator.storage.persisted();
    } catch (e) { /* sin dato */ }
    return r;
  }

  // Comprueba que lo que se va a agregar quepa con 10 % de margen. `liberable` = lo que se borra a cambio (modo "Reemplazar").
  // Si el navegador no da el dato, no se frena: la restauración es todo o nada y se devuelve si no cabe.
  async function comprobarEspacio(necesario, liberable) {
    const est = await estadoEspacio();
    if (!est.disponible) return { comprobado: false, necesario, libre: null, cabe: true };
    const libre = est.cuota - est.usado + (liberable || 0);
    return { comprobado: true, necesario, libre, cabe: necesario * MARGEN_ESPACIO <= libre };
  }

  function errorDeEspacio(chequeo) {
    return new ErrorRespaldo('SIN_ESPACIO', 'No hay espacio suficiente en este equipo: hacen falta ' + formatearBytes(chequeo.necesario) + ' (más un margen) y quedan ' + formatearBytes(chequeo.libre) + ' libres. No se cambió nada. Libera espacio (por ejemplo, elimina eventos viejos) o restaura sin las fotos.');
  }

  // ---------- Lo que hay hoy ----------

  // { eventos, plantillas, sesiones, fotos, archivos, bytes } de este equipo (para comparar con un respaldo).
  async function resumenActual() {
    const eventos = AlmacenEventos.exportarCrudo().eventos.length;
    const cont = AlmacenPlantillas.leerContenedorParaRespaldo();
    const c = await AlmacenSesiones.contarContenido();
    return { eventos, plantillas: cont ? cont.plantillas.length : 0, sesiones: c.sesiones, fotos: c.fotos, archivos: c.archivos, bytes: c.bytes, congeladas: c.congeladas };
  }

  // ---------- Armar paquetes ----------

  const LEEME = [
    'Este archivo es un respaldo de FotoCabina.',
    '',
    'No lo abras para editarlo: para recuperar tus datos, en FotoCabina entra a «Respaldo» y elige «Restaurar desde un archivo»',
    '(si es de un solo evento, usa «Importar evento» en la lista de Eventos).',
    '',
    'Adentro hay tus eventos, plantillas y sesiones como archivos de texto (carpeta datos) y las fotos de las sesiones',
    '(carpeta archivos). Si no marcaste «Incluir las fotos de los invitados» al crearlo, no trae fotos ni sesiones.',
    'Las fotos son datos personales de los invitados: guárdalo en un lugar seguro y no lo compartas sin necesidad.',
    '',
    'No incluye el PIN del equipo.',
    '',
  ].join('\r\n');

  // Las sesiones del formato antiguo (v1) guardan tira / gif / hoja como Blob DENTRO del registro: JSON los perdería
  // (quedarían como {}). Se sacan a entradas de archivos del paquete (`v1Campo` dice a qué campo vuelven) y el registro
  // queda con ese campo en null. Devuelve { sesiones: [registros sin Blobs], extras: [archivos con blob] }.
  function extraerBlobsV1(sesiones) {
    const extras = [];
    const limpias = sesiones.map((s) => {
      if (!esObjeto(s) || s.version === 2) return s;
      let copia = null;
      Object.keys(s).forEach((k) => {
        if (s[k] instanceof Blob) {
          if (!copia) copia = { ...s };
          copia[k] = null;
          extras.push({ id: 'v1-' + s.id + '-' + k, sesionId: s.id, tipo: k, tamano: s[k].size, creadoEn: null, blob: s[k], v1Campo: k });
        }
      });
      return copia || s;
    });
    return { sesiones: limpias, extras };
  }

  // Lo contrario: devuelve a cada registro v1 sus Blob (de los archivos con `v1Campo`) y deja en `archivos` solo los normales.
  function reponerBlobsV1(sesiones, archivos) {
    const copias = new Map(sesiones.map((s) => [s.id, { ...s }]));
    const normales = [];
    archivos.forEach((a) => {
      if (a.v1Campo && copias.has(a.sesionId)) copias.get(a.sesionId)[a.v1Campo] = a.blob;
      else normales.push(a);
    });
    return { sesiones: sesiones.map((s) => copias.get(s.id)), archivos: normales };
  }

  // Junta los datos en las entradas del ZIP y devuelve { blob, manifest, resumen }.
  async function empaquetar(d, avanzar) {
    const crudo0 = d.crudo || { sesiones: [], archivos: [], congeladas: [] };
    const v1 = extraerBlobsV1(crudo0.sesiones);
    const crudo = { sesiones: v1.sesiones, archivos: crudo0.archivos.concat(v1.extras), congeladas: crudo0.congeladas };
    crudo.archivos = crudo.archivos.filter((a) => a && a.blob);
    const archivosMeta = crudo.archivos.map((a, i) => {
      const meta = {
        id: a.id, sesionId: a.sesionId, tipo: a.tipo, tamano: a.blob.size, creadoEn: a.creadoEn, mime: (a.blob && a.blob.type) || '',
        entrada: 'archivos/' + String(i + 1).padStart(6, '0') + '.bin',
      };
      if (a.v1Campo) meta.v1Campo = a.v1Campo;
      return meta;
    });
    const json = {
      'datos/eventos.json': JSON.stringify(d.eventos),
      'datos/contadores.json': JSON.stringify(d.contadores || {}),
      'datos/plantillas.json': JSON.stringify(d.plantillas === undefined ? null : d.plantillas),
      'datos/sesiones.json': JSON.stringify(crudo.sesiones),
      'datos/archivos.json': JSON.stringify(archivosMeta),
      'datos/congeladas.json': JSON.stringify(crudo.congeladas),
    };
    const fotos = crudo.archivos.filter((a) => a.tipo === 'foto').length;
    let bytes = 0;
    Object.keys(json).forEach((k) => { bytes += codificar(json[k]).length; });
    crudo.archivos.forEach((a) => { bytes += a.tamano; });
    const manifest = {
      app: APP,
      formato: FORMATO,
      tipo: d.tipo,
      creadoEn: new Date().toISOString(),
      conFotos: d.conFotos,
      versiones: clonar(VERSIONES_DATOS),
      conteos: {
        eventos: d.eventos.length,
        plantillas: d.plantillas && Array.isArray(d.plantillas.plantillas) ? d.plantillas.plantillas.length : 0,
        sesiones: crudo.sesiones.length,
        archivos: crudo.archivos.length,
        fotos,
        congeladas: crudo.congeladas.length,
      },
      bytes,
      origen: { navegador: (typeof navigator !== 'undefined' && navigator.userAgent) || '', plataforma: (typeof navigator !== 'undefined' && navigator.platform) || '' },
    };
    if (d.extraManifest) Object.assign(manifest, d.extraManifest);
    if (d.advertencias && d.advertencias.length) manifest.advertencias = d.advertencias.map((a) => a.codigo);
    const entradas = [{ nombre: 'manifest.json', datos: JSON.stringify(manifest, null, 2) }, { nombre: 'LEEME.txt', datos: LEEME }];
    Object.keys(json).forEach((k) => entradas.push({ nombre: k, datos: json[k] }));
    // Texto dañado que no se pudo leer: se guarda tal cual para no perderlo (el lector lo ignora).
    if (d.textoIlegible) entradas.push({ nombre: 'datos/plantillas-ilegibles.txt', datos: d.textoIlegible });
    crudo.archivos.forEach((a, i) => entradas.push({ nombre: archivosMeta[i].entrada, datos: a.blob }));
    const blob = await crearZip(entradas, { alAvanzar: (hecho, total) => avanzar({ fase: 'preparar', texto: 'Preparando… ' + hecho + ' de ' + total + ' archivos', hecho, total }) });
    return { blob, manifest, resumen: { ...manifest.conteos, bytes: blob.size }, advertencias: d.advertencias || [] };
  }

  // Avisos de lo que NO se pudo leer y por tanto no entra al respaldo (nunca se calla): [{ codigo, mensaje }].
  function advertenciasDeLectura(ev, estadoPlantillas) {
    const lista = [];
    if (ev && ev.ilegible) lista.push({ codigo: 'EVENTOS_ILEGIBLES', mensaje: 'No se pudieron leer los eventos guardados en este equipo (están dañados), así que este respaldo NO los incluye.' });
    if (estadoPlantillas === 'danado') lista.push({ codigo: 'PLANTILLAS_ILEGIBLES', mensaje: 'No se pudieron leer las plantillas del editor (están dañadas), así que este respaldo NO las incluye.' });
    return lista;
  }

  // Respaldo completo de este equipo. Opciones: { conFotos (por defecto true), alProgresar }. Devuelve { blob, nombre, manifest, resumen }.
  // Lanza ErrorRespaldo('VACIO') si no hay nada que respaldar.
  async function crearRespaldo(opciones) {
    const op = opciones || {};
    const conFotos = op.conFotos !== false;
    const avanzar = op.alProgresar || noop;
    avanzar({ fase: 'leer', texto: 'Leyendo eventos y plantillas…' });
    const ev = AlmacenEventos.exportarCrudo();
    const contenedor = AlmacenPlantillas.leerContenedorParaRespaldo();
    const estadoPl = AlmacenPlantillas.estadoContenedorParaRespaldo();
    const advertencias = advertenciasDeLectura(ev, estadoPl);
    const total = await AlmacenSesiones.contarContenido();
    if (!ev.eventos.length && !(contenedor && contenedor.plantillas.length) && !total.sesiones && !total.congeladas) {
      if (advertencias.length) throw new ErrorRespaldo('ILEGIBLE', advertencias.map((a) => a.mensaje).join(' ') + ' No hay nada más que respaldar.');
      throw new ErrorRespaldo('VACIO', 'No hay nada que respaldar todavía: este equipo no tiene eventos, plantillas ni sesiones guardadas.');
    }
    avanzar({ fase: 'leer', texto: conFotos ? 'Leyendo sesiones y fotos…' : 'Leyendo copias de plantillas…' });
    const crudo = await AlmacenSesiones.leerTodoCrudo({ incluirSesiones: conFotos, incluirArchivos: conFotos, huellas: 'todas' });
    const r = await empaquetar({
      tipo: 'respaldo', conFotos, eventos: ev.eventos, contadores: ev.contadores, plantillas: contenedor, crudo, advertencias,
      textoIlegible: estadoPl === 'danado' ? AlmacenPlantillas.instantaneaParaRespaldo() : null,
    }, avanzar);
    return { blob: r.blob, nombre: nombreRespaldo(), manifest: r.manifest, resumen: r.resumen, advertencias: r.advertencias };
  }

  // Paquete de UN evento: su ficha, las plantillas que usa (habilitadas y por defecto, las del editor que aún existen), sus copias
  // congeladas y, con `conFotos`, sus sesiones y archivos. Devuelve { blob, nombre, manifest, resumen }.
  async function crearPaqueteEvento(id, opciones) {
    const op = opciones || {};
    const conFotos = op.conFotos !== false;
    const avanzar = op.alProgresar || noop;
    avanzar({ fase: 'leer', texto: 'Leyendo el evento…' });
    const ev = AlmacenEventos.exportarCrudo();
    const evento = ev.eventos.find((e) => e.id === id);
    if (!evento) throw new ErrorRespaldo('NO_ENCONTRADO', 'Este evento ya no existe, así que no se puede exportar. Revisa la lista de eventos.');
    const pl = evento.plantillas || {};
    const ids = Array.from(new Set([].concat(Array.isArray(pl.habilitadas) ? pl.habilitadas : [], pl.porDefecto ? [pl.porDefecto] : [])));
    const contenedor = AlmacenPlantillas.leerContenedorParaRespaldo();
    const estadoPl = AlmacenPlantillas.estadoContenedorParaRespaldo();
    const advertencias = advertenciasDeLectura(null, estadoPl);
    const usadas = contenedor ? contenedor.plantillas.filter((p) => p && ids.includes(p.id)) : [];
    const huellas = evento.congelado && evento.congelado.plantilla && evento.congelado.plantilla.huella ? [evento.congelado.plantilla.huella] : [];
    avanzar({ fase: 'leer', texto: conFotos ? 'Leyendo sesiones y fotos…' : 'Leyendo copias de plantillas…' });
    const crudo = await AlmacenSesiones.leerTodoCrudo({ eventoIds: [id], incluirSesiones: conFotos, incluirArchivos: conFotos, huellas });
    const contadores = Number.isFinite(ev.contadores[id]) ? { [id]: ev.contadores[id] } : {};
    const r = await empaquetar({
      tipo: 'evento', conFotos, eventos: [evento], contadores, plantillas: { plantillas: usadas }, crudo,
      advertencias,
      extraManifest: { evento: { id: evento.id, nombre: evento.nombre }, plantillasFaltantes: estadoPl === 'valido' ? ids.length - usadas.length : 0 },
    }, avanzar);
    return { blob: r.blob, nombre: nombreArchivoEvento(evento.nombre), manifest: r.manifest, resumen: r.resumen, advertencias: r.advertencias };
  }

  // ---------- Leer y validar un paquete (sin escribir nada) ----------

  function normalizarError(e) {
    if (e instanceof ErrorRespaldo) return e;
    if (e && (e.name === 'NotReadableError' || e.name === 'NotFoundError' || e.name === 'SecurityError')) {
      return new ErrorRespaldo('ERROR_LECTURA', 'No se pudo leer el archivo (puede que lo hayan movido o borrado). Elígelo de nuevo. No se cambió nada.', e);
    }
    if (e instanceof RangeError) return new ErrorRespaldo('CORRUPTO', MENSAJE_DANADO, e);
    return new ErrorRespaldo('ERROR', 'Ocurrió un problema inesperado' + (e && e.message ? ' (' + e.message + ')' : '') + '. No se cambió nada. Inténtalo de nuevo.', e);
  }

  function estructura(detalle) {
    return new ErrorRespaldo('ESTRUCTURA', 'Al archivo le falta información o está mal formado (' + detalle + '). No se cambió nada. Crea el respaldo de nuevo.');
  }

  // Revisa la forma de los datos de un paquete ya leído. Lanza ErrorRespaldo('ESTRUCTURA') si algo no cuadra.
  function validarDatos(datos, manifest, zip) {
    const ids = (lista) => lista.map((x) => x.id);
    if (!Array.isArray(datos.eventos) || !datos.eventos.every((e) => esObjeto(e) && typeof e.id === 'string' && e.id)) throw estructura('eventos');
    if (new Set(ids(datos.eventos)).size !== datos.eventos.length) throw estructura('eventos repetidos');
    if (manifest.tipo === 'evento' && datos.eventos.length !== 1) throw estructura('un paquete de evento debe traer exactamente un evento');
    if (!esObjeto(datos.contadores) || !Object.keys(datos.contadores).every((k) => Number.isFinite(datos.contadores[k]))) throw estructura('contadores');
    if (datos.plantillas !== null) {
      if (!esObjeto(datos.plantillas) || !Array.isArray(datos.plantillas.plantillas)) throw estructura('plantillas');
      // Se respeta lo que guardó el editor tal cual: una plantilla puede venir sin id o sin papel y aun así se respalda y se restaura.
      if (!datos.plantillas.plantillas.every((p) => esObjeto(p))) throw estructura('plantillas');
      const conId = ids(datos.plantillas.plantillas).filter((x) => typeof x === 'string' && x);
      if (new Set(conId).size !== conId.length) throw estructura('plantillas repetidas');
    }
    if (!Array.isArray(datos.sesiones) || !datos.sesiones.every((s) => esObjeto(s) && typeof s.id === 'string' && s.id)) throw estructura('sesiones');
    const idsSesiones = new Set(ids(datos.sesiones));
    if (idsSesiones.size !== datos.sesiones.length) throw estructura('sesiones repetidas');
    if (!Array.isArray(datos.archivos)) throw estructura('archivos');
    const idsArchivos = new Set();
    datos.archivos.forEach((a) => {
      if (!esObjeto(a) || typeof a.id !== 'string' || !a.id || typeof a.sesionId !== 'string' || typeof a.tipo !== 'string' || !Number.isInteger(a.tamano) || a.tamano < 0 || typeof a.entrada !== 'string') throw estructura('archivos');
      if (idsArchivos.has(a.id)) throw estructura('archivos repetidos');
      idsArchivos.add(a.id);
      const e = zip.porNombre.get(a.entrada);
      if (!e || e.tamano !== a.tamano) throw estructura('falta el archivo ' + a.entrada);
      if (!idsSesiones.has(a.sesionId)) throw estructura('un archivo no tiene sesión');
    });
    if (!Array.isArray(datos.congeladas) || !datos.congeladas.every((c) => esObjeto(c) && typeof c.huella === 'string' && c.huella && esObjeto(c.plantilla))) throw estructura('copias de plantillas');
    if (!manifest.conFotos && (datos.sesiones.length || datos.archivos.length)) throw estructura('dice no traer fotos pero las trae');
    const real = {
      eventos: datos.eventos.length,
      plantillas: datos.plantillas ? datos.plantillas.plantillas.length : 0,
      sesiones: datos.sesiones.length,
      archivos: datos.archivos.length,
      fotos: datos.archivos.filter((a) => a.tipo === 'foto').length,
      congeladas: datos.congeladas.length,
    };
    CONTEOS.forEach((c) => { if (real[c] !== manifest.conteos[c]) throw estructura('los conteos no coinciden: ' + c); });
    return real;
  }

  // Lee y VALIDA un archivo de respaldo o de evento sin tocar nada. Devuelve el paquete:
  // { tipo, manifest, resumen: { fecha, tipo, conFotos, eventos, plantillas, sesiones, fotos, archivos, bytes, evento? }, datos, bytesDatos, blobDe(meta) }.
  // Lanza ErrorRespaldo (códigos: NO_ES_ZIP, NO_ES_FOTOCABINA, VERSION_NUEVA, CORRUPTO, COMPRIMIDO, ESTRUCTURA, ERROR_LECTURA).
  async function leerPaquete(archivo, opciones) {
    const avanzar = (opciones && opciones.alProgresar) || noop;
    try {
      avanzar({ fase: 'abrir', texto: 'Abriendo el archivo…' });
      const zip = await abrirZip(archivo);
      const entradaManifest = zip.porNombre.get('manifest.json');
      if (!entradaManifest) throw new ErrorRespaldo('NO_ES_FOTOCABINA', 'Este ZIP no es de FotoCabina (no trae su archivo de identificación). Elige un archivo creado con «Crear respaldo» o «Exportar evento».');
      await zip.verificar(entradaManifest);
      let manifest;
      try { manifest = JSON.parse(await zip.leerTexto(entradaManifest)); } catch (e) { manifest = null; }
      const v = validarManifest(manifest);
      if (!v.ok) throw new ErrorRespaldo(v.codigo, v.mensaje);
      const n = zip.entradas.length;
      for (let i = 0; i < n; i++) {
        avanzar({ fase: 'verificar', texto: 'Comprobando que el archivo está sano… ' + (i + 1) + ' de ' + n, hecho: i + 1, total: n });
        await zip.verificar(zip.entradas[i]);
      }
      const leerJson = async (nombre, vacio) => {
        const e = zip.porNombre.get(nombre);
        if (!e) { if (vacio !== undefined) return vacio; throw estructura('falta ' + nombre); }
        try { return JSON.parse(await zip.leerTexto(e)); } catch (err) { throw err instanceof ErrorRespaldo ? err : estructura('no se puede leer ' + nombre); }
      };
      const datos = {
        eventos: await leerJson('datos/eventos.json'),
        contadores: await leerJson('datos/contadores.json'),
        plantillas: await leerJson('datos/plantillas.json', null),
        sesiones: await leerJson('datos/sesiones.json'),
        archivos: await leerJson('datos/archivos.json'),
        congeladas: await leerJson('datos/congeladas.json'),
      };
      const real = validarDatos(datos, manifest, zip);
      let bytesDatos = 0;
      zip.entradas.forEach((e) => { if (e.nombre.startsWith('datos/')) bytesDatos += e.tamano; });
      const resumen = { fecha: manifest.creadoEn, tipo: manifest.tipo, conFotos: manifest.conFotos, ...real, bytes: archivo.size };
      if (manifest.tipo === 'evento') resumen.evento = { id: datos.eventos[0].id, nombre: datos.eventos[0].nombre || 'Evento sin nombre', fecha: datos.eventos[0].fecha || null, estado: datos.eventos[0].estado || null };
      return {
        tipo: manifest.tipo, manifest, resumen, datos, bytesDatos,
        // El tipo MIME viene del archivo (no es de fiar): solo se aceptan imágenes conocidas; cualquier otro (por ejemplo text/html) entra sin tipo.
        blobDe: async (meta) => zip.abrirDatos(zip.porNombre.get(meta.entrada), /^image\/(png|jpe?g|gif|webp|avif|bmp)$/i.test(meta.mime || '') ? meta.mime : ''),
      };
    } catch (e) {
      throw normalizarError(e);
    }
  }

  // ---------- Restaurar e importar ----------

  // Arma los archivos del paquete como Blobs (referencias al archivo elegido, no copias) listos para IndexedDB.
  async function prepararArchivos(paquete, avanzar, ids) {
    const salida = [];
    const metas = paquete.datos.archivos.filter((a) => !ids || ids.has(a.sesionId));
    for (let i = 0; i < metas.length; i++) {
      const m = metas[i];
      salida.push({ id: m.id, sesionId: m.sesionId, tipo: m.tipo, tamano: m.tamano, creadoEn: m.creadoEn, v1Campo: m.v1Campo || null, blob: await paquete.blobDe(m) });
      if (i % 25 === 0 || i === metas.length - 1) avanzar({ fase: 'preparar', texto: 'Preparando… ' + (i + 1) + ' de ' + metas.length + ' archivos', hecho: i + 1, total: metas.length });
    }
    return salida;
  }

  function minimosDeContador(sesiones) {
    const minimos = Object.create(null);
    sesiones.forEach((s) => {
      const ev = s.eventoId || s.evento;
      const n = Number(s.numero);
      if (ev && Number.isFinite(n)) minimos[ev] = Math.max(minimos[ev] || 0, n);
    });
    return minimos;
  }

  function errorDeEscritura(e, deshecho) {
    if (e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message || '')))) {
      return new ErrorRespaldo('SIN_ESPACIO', 'Se acabó el espacio de este equipo a mitad de camino' + (deshecho ? ', así que no se cambió nada' : '') + '. Libera espacio (por ejemplo, elimina eventos viejos) o restaura sin las fotos.', e);
    }
    return new ErrorRespaldo('ERROR_ESCRITURA',
      (deshecho ? 'No se pudo restaurar y no se cambió nada' : 'No se pudo restaurar y además no se logró devolver todo a como estaba: revisa tus eventos y plantillas') +
      '. Inténtalo de nuevo; si sigue igual, cierra la cabina y el editor y vuelve a probar.', e);
  }

  // Escritura todo o nada: localStorage (con instantánea para deshacer) y después IndexedDB en una sola transacción.
  // plan = { modo, eventos: { eventos, contadores }, minimos, plantillas: [..] | contenedor, ultimaAbierta, sesiones: { sesiones, archivos, congeladas }, opcionesSesiones }
  async function aplicar(plan, avanzar) {
    let instEventos;
    let instPlantillas;
    try {
      instEventos = AlmacenEventos.tomarInstantanea();
      instPlantillas = AlmacenPlantillas.instantaneaParaRespaldo();
    } catch (e) {
      throw new ErrorRespaldo('ERROR_ESCRITURA', 'No se puede acceder al almacenamiento de este navegador, así que no se cambió nada.', e);
    }
    const deshacer = () => {
      let ok = true;
      try { AlmacenEventos.devolverInstantanea(instEventos); } catch (e) { ok = false; }
      try { AlmacenPlantillas.devolverInstantaneaDeRespaldo(instPlantillas); } catch (e) { ok = false; }
      return ok;
    };
    const resultado = {};
    avanzar({ fase: 'guardar', texto: 'Guardando eventos y plantillas…' });
    try {
      resultado.eventos = AlmacenEventos.importarCrudo(plan.eventos, { modo: plan.modo, minimos: plan.minimos });
      if (plan.modo === 'reemplazar') {
        AlmacenPlantillas.reemplazarContenedorDesdeRespaldo(plan.plantillas);
        const n = plan.plantillas && Array.isArray(plan.plantillas.plantillas) ? plan.plantillas.plantillas.length : 0;
        resultado.plantillas = { agregadas: n, omitidas: 0 };
      } else {
        resultado.plantillas = AlmacenPlantillas.agregarPlantillasDesdeRespaldo(plan.plantillas, { ultimaAbierta: plan.ultimaAbierta });
      }
    } catch (e) {
      throw errorDeEscritura(e, deshacer());
    }
    avanzar({ fase: 'guardar', texto: 'Guardando sesiones y fotos…' });
    try {
      resultado.sesiones = await AlmacenSesiones.escribirCrudo(plan.sesiones, plan.opcionesSesiones);
    } catch (e) {
      throw errorDeEscritura(e, deshacer());
    }
    return resultado;
  }

  // Qué pasaría al restaurar este respaldo, SIN escribir nada: conteos nuevos / ya existentes, espacio y lo que hay hoy.
  // modo: 'sumar' | 'reemplazar'. Devuelve { modo, actual, eventos: { nuevos, existentes }, plantillas: {...}, sesiones: {...}, bytes, liberable, espacio }.
  async function previsualizar(paquete, modo) {
    const reemplazar = modo === 'reemplazar';
    const actual = await resumenActual();
    const eventosLocales = new Set(AlmacenEventos.exportarCrudo().eventos.map((e) => e.id));
    const cont = AlmacenPlantillas.leerContenedorParaRespaldo();
    const plantillasLocales = new Set(cont ? cont.plantillas.map((p) => p && p.id) : []);
    const idsLocales = await AlmacenSesiones.idsExistentes();
    const sesionesLocales = new Set(idsLocales.sesiones);
    const d = paquete.datos;
    const pl = d.plantillas ? d.plantillas.plantillas : [];
    const cuenta = (lista, locales) => {
      const existentes = reemplazar ? 0 : lista.filter((x) => locales.has(x.id)).length;
      return { nuevos: lista.length - existentes, existentes };
    };
    const sesionesNuevas = new Set(d.sesiones.filter((s) => reemplazar || !sesionesLocales.has(s.id)).map((s) => s.id));
    let bytes = paquete.bytesDatos;
    d.archivos.forEach((a) => { if (sesionesNuevas.has(a.sesionId)) bytes += a.tamano; });
    const liberable = reemplazar ? actual.bytes : 0;
    const necesario = reemplazar ? Math.max(0, bytes - liberable) : bytes;
    const espacio = await comprobarEspacio(necesario, 0);
    return {
      modo: reemplazar ? 'reemplazar' : 'sumar',
      actual,
      eventos: cuenta(d.eventos, eventosLocales),
      plantillas: cuenta(pl, plantillasLocales),
      sesiones: { nuevos: sesionesNuevas.size, existentes: d.sesiones.length - sesionesNuevas.size },
      bytes,
      liberable,
      espacio,
    };
  }

  // Restaura un respaldo COMPLETO (ya leído con `leerPaquete`). modo: 'sumar' (por defecto: no borra nada, gana lo que ya está) o
  // 'reemplazar' (borra lo de ahora y deja exactamente el respaldo; también suelta el evento activo). Todo o nada.
  // Devuelve { modo, eventos: { agregados, omitidos }, plantillas: { agregadas, omitidas }, sesiones: {...} }.
  async function restaurar(paquete, opciones) {
    const op = opciones || {};
    const avanzar = op.alProgresar || noop;
    const modo = op.modo === 'reemplazar' ? 'reemplazar' : 'sumar';
    if (!paquete || paquete.tipo !== 'respaldo') throw new ErrorRespaldo('TIPO_INCORRECTO', 'Este archivo es de un solo evento, no un respaldo completo. Para agregarlo usa «Importar evento» en la lista de Eventos.');
    try {
      avanzar({ fase: 'revisar', texto: 'Revisando el espacio…' });
      const vista = await previsualizar(paquete, modo);
      if (!vista.espacio.cabe) throw errorDeEspacio(vista.espacio);
      const d = paquete.datos;
      let archivos = [];
      let sesiones = d.sesiones;
      if (modo === 'sumar') {
        const locales = new Set((await AlmacenSesiones.idsExistentes()).sesiones);
        const nuevas = new Set(d.sesiones.filter((s) => !locales.has(s.id)).map((s) => s.id));
        archivos = await prepararArchivos(paquete, avanzar, nuevas);
      } else {
        archivos = await prepararArchivos(paquete, avanzar, null);
      }
      const rep = reponerBlobsV1(sesiones, archivos);
      sesiones = rep.sesiones;
      archivos = rep.archivos;
      const resultado = await aplicar({
        modo,
        eventos: { eventos: d.eventos, contadores: d.contadores },
        minimos: minimosDeContador(sesiones),
        plantillas: modo === 'reemplazar' ? d.plantillas : (d.plantillas ? d.plantillas.plantillas : []),
        ultimaAbierta: d.plantillas ? d.plantillas.ultimaAbierta : null,
        sesiones: { sesiones, archivos, congeladas: d.congeladas },
        opcionesSesiones: { modo },
      }, avanzar);
      resultado.modo = modo;
      return resultado;
    } catch (e) {
      throw normalizarError(e);
    }
  }

  function nuevoIdPlantilla() {
    let u;
    try { u = raiz.crypto.randomUUID(); } catch (e) { u = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + '-' + Math.random().toString(36).slice(2, 10); }
    return 'pl-' + u;
  }

  // Qué pasaría al importar este evento: { existe, nombreFinal } (si el id ya existe en este equipo, entra como copia nueva).
  function previsualizarImportacion(paquete) {
    const ev = paquete.datos.eventos[0];
    const existe = AlmacenEventos.exportarCrudo().eventos.some((e) => e.id === ev.id);
    const nombre = ev.nombre || 'Evento sin nombre';
    return { existe, nombreFinal: existe ? nombre + ' (importado)' : nombre };
  }

  // Importa un paquete de UN evento. Si su id ya existe en este equipo entra como COPIA NUEVA (id nuevo, sesiones con ids nuevos y
  // archivos renombrados, nombre «… (importado)») sin tocar el existente; si no existe, conserva su id. Las plantillas: mismo id e
  // idéntico contenido (comparado por huella) se reutiliza; mismo id y distinto contenido entra como plantilla nueva con id nuevo
  // (el evento se ajusta); id nuevo se agrega. Conserva el estado del evento, pero nunca queda como evento activo de la cabina.
  // Todo o nada, como restaurar. Devuelve { eventoId, nombre, copia, plantillas: { agregadas, reutilizadas, conIdNuevo }, sesiones: {...} }.
  async function importarEvento(paquete, opciones) {
    const op = opciones || {};
    const avanzar = op.alProgresar || noop;
    if (!paquete || paquete.tipo !== 'evento') throw new ErrorRespaldo('TIPO_INCORRECTO', 'Este archivo es un respaldo completo, no un solo evento. Para restaurarlo entra a «Respaldo» desde el menú.');
    try {
      const d = paquete.datos;
      const evento = clonar(d.eventos[0]);
      const vista = previsualizarImportacion(paquete);
      const copia = vista.existe;
      if (copia) {
        evento.id = AlmacenEventos.nuevoId();
        evento.nombre = vista.nombreFinal;
        evento.creadoEn = new Date().toISOString();
        evento.actualizadoEn = evento.creadoEn;
      }
      // Plantillas
      avanzar({ fase: 'revisar', texto: 'Revisando las plantillas…' });
      const contenedor = AlmacenPlantillas.leerContenedorParaRespaldo();
      const localesPorId = new Map((contenedor ? contenedor.plantillas : []).filter(Boolean).map((p) => [p.id, p]));
      const aAgregar = [];
      const mapa = Object.create(null);
      let reutilizadas = 0;
      for (const p of (d.plantillas ? d.plantillas.plantillas : [])) {
        const local = localesPorId.get(p.id);
        if (!local) { aAgregar.push(p); continue; }
        const hLocal = await AlmacenPlantillas.huella(AlmacenPlantillas.copiaNormalizada(local));
        const hNueva = await AlmacenPlantillas.huella(AlmacenPlantillas.copiaNormalizada(p));
        if (hLocal && hLocal === hNueva) { reutilizadas += 1; continue; }
        const nueva = clonar(p);
        nueva.id = nuevoIdPlantilla();
        nueva.nombre = (p.nombre || 'Plantilla') + ' (importada)';
        mapa[p.id] = nueva.id;
        aAgregar.push(nueva);
      }
      const ids = (lista) => (Array.isArray(lista) ? lista.map((x) => mapa[x] || x) : []);
      if (evento.plantillas) {
        evento.plantillas = { habilitadas: ids(evento.plantillas.habilitadas), porDefecto: mapa[evento.plantillas.porDefecto] || evento.plantillas.porDefecto || null };
      }
      if (evento.congelado && evento.congelado.plantilla && mapa[evento.congelado.plantilla.id]) evento.congelado.plantilla.id = mapa[evento.congelado.plantilla.id];
      // Sesiones y archivos
      const locales = copia ? new Set() : new Set((await AlmacenSesiones.idsExistentes()).sesiones);
      const nuevas = new Set(d.sesiones.filter((s) => !locales.has(s.id)).map((s) => s.id));
      let bytes = paquete.bytesDatos;
      d.archivos.forEach((a) => { if (nuevas.has(a.sesionId)) bytes += a.tamano; });
      const chequeo = await comprobarEspacio(bytes, 0);
      if (!chequeo.cabe) throw errorDeEspacio(chequeo);
      const rep = reponerBlobsV1(d.sesiones, await prepararArchivos(paquete, avanzar, nuevas));
      const archivos = rep.archivos;
      const minimos = minimosDeContador(d.sesiones);
      const contadores = {};
      const base = Number.isFinite(d.contadores[d.eventos[0].id]) ? d.contadores[d.eventos[0].id] : 0;
      contadores[evento.id] = Math.max(base, minimos[d.eventos[0].id] || 0);
      const resultado = await aplicar({
        modo: 'sumar',
        eventos: { eventos: [evento], contadores },
        minimos: {},
        plantillas: aAgregar,
        ultimaAbierta: null,
        sesiones: { sesiones: rep.sesiones, archivos, congeladas: d.congeladas },
        opcionesSesiones: { modo: 'sumar', regenerarIds: copia, eventoDestino: evento.id, mapaPlantillas: mapa },
      }, avanzar);
      return {
        eventoId: evento.id,
        nombre: evento.nombre,
        estado: evento.estado,
        copia,
        plantillas: { agregadas: resultado.plantillas.agregadas, reutilizadas, conIdNuevo: Object.keys(mapa).length },
        sesiones: resultado.sesiones,
      };
    } catch (e) {
      throw normalizarError(e);
    }
  }

  // Texto para el operador con lo que pasó al restaurar (una frase o dos).
  function textoResultado(res) {
    const e = res.eventos || { agregados: 0, omitidos: 0 };
    const p = res.plantillas || { agregadas: 0, omitidas: 0 };
    const s = res.sesiones || { sesionesAgregadas: 0, sesionesOmitidas: 0 };
    if (res.modo === 'reemplazar') {
      return 'Listo. Ahora este equipo tiene exactamente lo del respaldo: ' + plural(e.agregados, 'evento', 'eventos') + ', ' + plural(p.agregadas, 'plantilla', 'plantillas') + ' y ' + plural(s.sesionesAgregadas, 'sesión', 'sesiones') + '.';
    }
    let t = 'Listo. Se sumaron ' + plural(e.agregados, 'evento', 'eventos') + ', ' + plural(p.agregadas, 'plantilla', 'plantillas') + ' y ' + plural(s.sesionesAgregadas, 'sesión', 'sesiones') + '.';
    if (e.omitidos || p.omitidas || s.sesionesOmitidas) {
      t += ' Ya estaban ' + plural(e.omitidos, 'evento', 'eventos') + ', ' + plural(p.omitidas, 'plantilla', 'plantillas') + ' y ' + plural(s.sesionesOmitidas, 'sesión', 'sesiones') + ', y se dejaron como estaban.';
    }
    return t;
  }

  raiz.Respaldo = {
    FORMATO,
    ErrorRespaldo,
    // partes puras
    crc32,
    crc32Blob,
    extraerBlobsV1,
    reponerBlobsV1,
    crearZip,
    abrirZip,
    validarManifest,
    nombreRespaldo,
    nombreArchivoEvento,
    formatearBytes,
    // funciones de la función
    crearRespaldo,
    crearPaqueteEvento,
    leerPaquete,
    previsualizar,
    restaurar,
    previsualizarImportacion,
    importarEvento,
    textoResultado,
    resumenActual,
    estadoEspacio,
    descargar,
    ultimoRespaldo,
  };
})(window);

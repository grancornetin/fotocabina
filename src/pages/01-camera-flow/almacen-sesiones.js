// Guardado local de sesiones en IndexedDB (sin dependencias).
//
// Dos almacenes en la misma base (docs/ARQUITECTURA_FLUJO.md §5.1, regla 2): `sesiones` guarda
// el registro liviano (estado, referencias) y `archivos` guarda lo pesado (cada foto original,
// la tira y el GIF como Blob). Cada foto se escribe JUNTO con el registro de su sesión en una
// sola transacción: si se corta la luz justo después de tomarla, la foto ya existe y la sesión
// la conoce. Borrar una sesión borra también sus archivos (cascada).
//
// Estados de una sesión: capturando → revision → componiendo → compuesta → finalizada, más
// `incompleta` (el invitado se fue o hubo un corte; las fotos se conservan) y `fallida` (con el
// paso donde falló en `error.paso`). Las sesiones guardadas con el formato anterior (fotos como
// texto dentro del registro, tira y GIF como Blob) se siguen leyendo sin migrarlas.
//
// La app ve siempre la misma forma "hidratada": `fotos` = lista de fotos (data URL), `tira` y
// `gif` = Blob. Por dentro, el registro guarda solo referencias: `fotos: [{ n, archivo,
// intentos }]` y `salidas: { tira, gif }` (formato de ARQUITECTURA_FLUJO.md §5.3).
(function (raiz) {
  'use strict';

  const NOMBRE_DB = 'fotocabina';
  const VERSION = 2;
  const ALMACEN = 'sesiones';
  const ARCHIVOS = 'archivos';
  const ESTADOS_ABIERTOS = ['capturando', 'revision', 'componiendo'];

  function abrir() {
    return new Promise((resolver, rechazar) => {
      const pedido = indexedDB.open(NOMBRE_DB, VERSION);
      pedido.onupgradeneeded = () => {
        const db = pedido.result;
        if (!db.objectStoreNames.contains(ALMACEN)) {
          const almacen = db.createObjectStore(ALMACEN, { keyPath: 'id' });
          almacen.createIndex('evento', 'evento', { unique: false });
          almacen.createIndex('fecha', 'fecha', { unique: false });
        }
        if (!db.objectStoreNames.contains(ARCHIVOS)) {
          const archivos = db.createObjectStore(ARCHIVOS, { keyPath: 'id' });
          archivos.createIndex('sesionId', 'sesionId', { unique: false });
        }
      };
      pedido.onsuccess = () => {
        const db = pedido.result;
        db.onversionchange = () => db.close(); // otra pestaña pide actualizar la base: no la bloqueamos
        resolver(db);
      };
      pedido.onerror = () => rechazar(pedido.error);
      pedido.onblocked = () => rechazar(new Error('La base está bloqueada por otra pestaña de la cabina'));
    });
  }

  function esperar(pedido) {
    return new Promise((resolver, rechazar) => {
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rechazar(pedido.error);
    });
  }

  // Abre una transacción sobre los dos almacenes y devuelve lo que devuelva `operacion`
  // recién cuando la transacción se confirmó por completo (así "guardado" significa guardado).
  async function transaccion(modo, operacion) {
    const db = await abrir();
    return new Promise((resolver, rechazar) => {
      let tx;
      try {
        tx = db.transaction([ALMACEN, ARCHIVOS], modo);
      } catch (error) {
        db.close();
        rechazar(error);
        return;
      }
      let resultado;
      Promise.resolve(operacion(tx.objectStore(ALMACEN), tx.objectStore(ARCHIVOS)))
        .then((valor) => { resultado = valor; })
        .catch((error) => { try { tx.abort(); } catch (e) { /* ya cerrada */ } rechazar(error); });
      tx.oncomplete = () => { db.close(); resolver(resultado); };
      tx.onerror = () => { db.close(); rechazar(tx.error); };
      tx.onabort = () => { db.close(); rechazar(tx.error || new Error('transacción cancelada')); };
    });
  }

  // ---------- Conversión foto <-> archivo ----------

  function dataUrlABlob(dataUrl) {
    const [cabecera, base64] = dataUrl.split(',');
    const tipo = (cabecera.match(/data:(.*?)[;,]/) || [])[1] || 'image/jpeg';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: tipo });
  }

  function blobADataUrl(blob) {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result);
      lector.onerror = () => rechazar(lector.error);
      lector.readAsDataURL(blob);
    });
  }

  const idArchivo = (sesionId, nombre) => `f-${sesionId}-${nombre}`;

  // ---------- Escritura ----------

  // Registro liviano a partir de la sesión en memoria: sin imágenes, solo referencias.
  function aRegistro(sesion, fotosRef) {
    const { fotos, tira, gif, intentosFotos, ...resto } = sesion;
    const salidas = { ...(resto.salidas || {}) };
    if (tira) salidas.tira = idArchivo(sesion.id, 'tira');
    if (gif) salidas.gif = idArchivo(sesion.id, 'gif');
    return { ...resto, version: 2, fotos: fotosRef, salidas };
  }

  function ponerArchivo(almacenArchivos, sesionId, nombre, tipo, blob) {
    almacenArchivos.put({ id: idArchivo(sesionId, nombre), sesionId, tipo, blob, tamano: blob.size, creadoEn: new Date().toISOString() });
  }

  // Guarda el registro de la sesión sin tocar sus archivos (cambios de estado, avisos de error).
  // Conserva las referencias a archivos que ya existían en disco.
  function guardarRegistro(sesion) {
    return transaccion('readwrite', async (almacen) => {
      const anterior = await esperar(almacen.get(sesion.id));
      const base = anterior && anterior.version === 2 ? anterior : null;
      const registro = aRegistro(sesion, base ? base.fotos : []);
      if (base) registro.salidas = { ...base.salidas, ...registro.salidas };
      almacen.put(registro);
    });
  }

  // Guarda UNA foto recién tomada junto con el registro de su sesión, en una sola transacción.
  // `n` empieza en 1. Si la foto ya existía (repetir una foto), se reemplaza y suma un intento.
  function guardarFoto(sesion, n, dataUrl) {
    const blob = dataUrlABlob(dataUrl);
    return transaccion('readwrite', async (almacen, archivos) => {
      const anterior = await esperar(almacen.get(sesion.id));
      const fotosRef = (anterior && anterior.version === 2 ? anterior.fotos : []).filter((f) => f.n !== n);
      const previa = anterior && anterior.version === 2 ? anterior.fotos.find((f) => f.n === n) : null;
      fotosRef.push({ n, archivo: idArchivo(sesion.id, `foto${n}`), intentos: previa ? previa.intentos + 1 : 1 });
      fotosRef.sort((a, b) => a.n - b.n);
      ponerArchivo(archivos, sesion.id, `foto${n}`, 'foto', blob);
      const registro = aRegistro({ ...sesion, fotos: [], tira: null, gif: null }, fotosRef);
      if (anterior && anterior.version === 2) registro.salidas = { ...anterior.salidas };
      almacen.put(registro);
      sesion.intentosFotos = [];
      fotosRef.forEach((f) => { sesion.intentosFotos[f.n - 1] = f.intentos; });
    }).then((r) => {
      if (!sesion.fotosEnDisco) sesion.fotosEnDisco = new Set();
      sesion.fotosEnDisco.add(n);
      return r;
    });
  }

  // Guarda la sesión completa (registro + tira + GIF) en una sola transacción. Las fotos que
  // ya están en disco no se reescriben; solo se escriben las que falten (sesión sin guardar
  // foto a foto, por ejemplo una importada).
  function guardar(sesion) {
    return transaccion('readwrite', async (almacen, archivos) => {
      const anterior = await esperar(almacen.get(sesion.id));
      const previo = anterior && anterior.version === 2 ? anterior : null;
      // Se reescribe toda foto que no se haya confirmado en disco en esta sesión (por ejemplo, si
      // el guardado de una repetición falló y en disco quedó la toma anterior).
      const conocidas = new Set(sesion.fotosEnDisco || []);
      const fotosRef = previo ? previo.fotos.slice() : [];
      (sesion.fotos || []).forEach((src, i) => {
        const n = i + 1;
        if (src && !conocidas.has(n)) {
          ponerArchivo(archivos, sesion.id, `foto${n}`, 'foto', dataUrlABlob(src));
          const indice = fotosRef.findIndex((f) => f.n === n);
          const ref = { n, archivo: idArchivo(sesion.id, `foto${n}`), intentos: (sesion.intentosFotos || [])[i] || 1 };
          if (indice >= 0) fotosRef[indice] = ref; else fotosRef.push(ref);
        }
      });
      fotosRef.sort((a, b) => a.n - b.n);
      if (sesion.tira) ponerArchivo(archivos, sesion.id, 'tira', 'tira', sesion.tira);
      if (sesion.gif) ponerArchivo(archivos, sesion.id, 'gif', 'gif', sesion.gif);
      const registro = aRegistro(sesion, fotosRef);
      if (previo) registro.salidas = { ...previo.salidas, ...registro.salidas };
      almacen.put(registro);
    });
  }

  // Borra la sesión y todos sus archivos (cascada, en la misma transacción).
  function borrar(id) {
    return transaccion('readwrite', async (almacen, archivos) => {
      const claves = await esperar(archivos.index('sesionId').getAllKeys(id));
      claves.forEach((clave) => archivos.delete(clave));
      almacen.delete(id);
    });
  }

  // ---------- Lectura ----------

  // Dentro de la transacción solo se leen Blobs (IndexedDB se cierra si se espera otra cosa,
  // como convertir una imagen); la conversión a data URL se hace después, fuera de ella.
  async function leerPartes(registro, archivos) {
    if (!registro) return null;
    if (registro.version !== 2) return { registro, heredada: true };
    const fotos = [];
    for (const ref of registro.fotos || []) {
      const archivo = await esperar(archivos.get(ref.archivo));
      fotos[ref.n - 1] = archivo ? archivo.blob : null;
    }
    const salidas = registro.salidas || {};
    const tira = salidas.tira ? await esperar(archivos.get(salidas.tira)) : null;
    const gif = salidas.gif ? await esperar(archivos.get(salidas.gif)) : null;
    return { registro, fotos, tira: tira ? tira.blob : null, gif: gif ? gif.blob : null };
  }

  // Devuelve la sesión en la forma que usa la app: fotos (data URL), tira y gif (Blob).
  async function hidratar(partes) {
    if (!partes) return null;
    if (partes.heredada) return partes.registro;
    const { registro } = partes;
    const sesion = { ...registro };
    sesion.intentosFotos = [];
    (registro.fotos || []).forEach((ref) => { sesion.intentosFotos[ref.n - 1] = ref.intentos; });
    sesion.fotos = [];
    for (let i = 0; i < partes.fotos.length; i++) {
      sesion.fotos[i] = partes.fotos[i] ? await blobADataUrl(partes.fotos[i]) : null;
    }
    sesion.tira = partes.tira;
    sesion.gif = partes.gif;
    return sesion;
  }

  async function obtener(id) {
    const partes = await transaccion('readonly', async (almacen, archivos) => leerPartes(await esperar(almacen.get(id)), archivos));
    return hidratar(partes);
  }

  // evento: id del evento para filtrar, o null para traer todas las sesiones. Más recientes primero.
  async function listar(evento) {
    const lista = await transaccion('readonly', async (almacen, archivos) => {
      const registros = await esperar(evento ? almacen.index('evento').getAll(evento) : almacen.getAll());
      const partes = [];
      for (const registro of registros || []) partes.push(await leerPartes(registro, archivos));
      return partes;
    });
    const sesiones = [];
    for (const partes of lista) sesiones.push(await hidratar(partes));
    return sesiones.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }

  // Solo el registro liviano, sin leer imágenes (para contar sesiones sin cargar fotos).
  function listarRegistros(evento) {
    return transaccion('readonly', async (almacen) => {
      const registros = await esperar(evento ? almacen.index('evento').getAll(evento) : almacen.getAll());
      return (registros || []).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    });
  }

  // Al abrir la cabina no puede haber una sesión de invitado en curso: toda sesión que quedó
  // "capturando", "revision" o "componiendo" se cortó (cierre de la página, corte de luz) y pasa
  // a "incompleta" con sus fotos. Una sesión sin ninguna foto no tiene nada que conservar y se
  // descarta. Devuelve cuántas sesiones quedaron incompletas.
  function marcarIncompletas() {
    return transaccion('readwrite', async (almacen, archivos) => {
      const registros = (await esperar(almacen.getAll())) || [];
      let marcadas = 0;
      for (const registro of registros) {
        if (!ESTADOS_ABIERTOS.includes(registro.estado)) continue;
        const conFotos = registro.version === 2 ? (registro.fotos || []).length > 0 : (registro.fotos || []).some(Boolean);
        if (!conFotos) {
          const claves = await esperar(archivos.index('sesionId').getAllKeys(registro.id));
          claves.forEach((clave) => archivos.delete(clave));
          almacen.delete(registro.id);
          continue;
        }
        almacen.put({ ...registro, estado: 'incompleta', terminadaEn: registro.terminadaEn || new Date().toISOString() });
        marcadas += 1;
      }
      return marcadas;
    });
  }

  function nuevoId() {
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  raiz.AlmacenSesiones = {
    ESTADOS_ABIERTOS,
    guardar,
    guardarFoto,
    guardarRegistro,
    borrar,
    obtener,
    listar,
    listarRegistros,
    marcarIncompletas,
    nuevoId,
  };
})(window);

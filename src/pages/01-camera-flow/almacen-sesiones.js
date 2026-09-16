// Guardado local de sesiones en IndexedDB (sin dependencias). Cada sesión conserva sus
// fotos originales, la tira compuesta y el GIF, para poder reimprimir o reenviar después.
(function (raiz) {
  'use strict';

  const NOMBRE_DB = 'fotocabina';
  const VERSION = 1;
  const ALMACEN = 'sesiones';

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
      };
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rechazar(pedido.error);
    });
  }

  async function transaccion(modo, operacion) {
    const db = await abrir();
    return new Promise((resolver, rechazar) => {
      const tx = db.transaction(ALMACEN, modo);
      const pedido = operacion(tx.objectStore(ALMACEN));
      tx.oncomplete = () => { db.close(); resolver(pedido ? pedido.result : undefined); };
      tx.onerror = () => { db.close(); rechazar(tx.error); };
      tx.onabort = () => { db.close(); rechazar(tx.error); };
    });
  }

  function guardar(sesion) {
    return transaccion('readwrite', (almacen) => almacen.put(sesion));
  }

  function borrar(id) {
    return transaccion('readwrite', (almacen) => almacen.delete(id));
  }

  function obtener(id) {
    return transaccion('readonly', (almacen) => almacen.get(id));
  }

  // evento: id del evento para filtrar, o null para traer todas las sesiones. Más recientes primero.
  async function listar(evento) {
    const sesiones = await transaccion('readonly', (almacen) =>
      evento ? almacen.index('evento').getAll(evento) : almacen.getAll());
    return (sesiones || []).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }

  function nuevoId() {
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  raiz.AlmacenSesiones = { guardar, borrar, obtener, listar, nuevoId };
})(window);

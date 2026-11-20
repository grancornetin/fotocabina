/*
  Impresoras reales de Windows para la cola de impresión (docs/ARQUITECTURA_FLUJO.md §7.12). Sin dependencias.

  Solo tiene impresoras cuando la pantalla corre dentro del programa de escritorio (src/escritorio/): ahí
  `window.fotocabinaEscritorio.impresion` manda la hoja al driver de Windows SIN diálogo. En un navegador `disponible`
  es false y la cola sigue usando la impresora simulada.

  Cumple la interfaz `AdaptadorImpresora` de shared/impresion.js (ver el encabezado de ese archivo): las pantallas y la
  cola no cambian. El estado que informa es el que Windows conoce por el spooler (muchas impresoras no avisan "sin papel"
  hasta que intentan imprimir): por eso el validador lo trata con cautela y la cola reintenta sin imprimir doble.

  Se enchufa con `Impresion.crearServicio({ proveedor: ImpresionEscritorio.proveedor })`:
    proveedor.adaptadores()      lista síncrona (última conocida) de adaptadores reales
    proveedor.actualizar()       async, vuelve a leer la lista de impresoras de Windows
    proveedor.seleccionar(id)    le dice cuál impresora vigilar (consulta su estado cada pocos segundos)
    proveedor.alCambiar(fn)      avisa cuando cambió la lista o el estado de la impresora vigilada
*/
const ImpresionEscritorio = (() => {
  'use strict';

  const PREFIJO = 'win:';
  const SEG_POR_HOJA = 12;       // estimación para el ritmo del validador (una térmica 4×6 tarda 8 a 20 s)
  const SONDEO_MS = 8000;
  const REGEX_VARIANTES = /split|2up|3up|combo|up\)/i;

  const esRealId = (id) => typeof id === 'string' && id.indexOf(PREFIJO) === 0;

  function mediosDe(lista) {
    const vistos = new Set();
    const salida = [];
    (lista || []).forEach((m) => {
      if (!m || REGEX_VARIANTES.test(m.nombre || '')) return;
      const ancho = Math.round(Number(m.anchoMm) * 10) / 10, alto = Math.round(Number(m.altoMm) * 10) / 10;
      if (!(ancho > 0 && alto > 0)) return;
      const clave = ancho + 'x' + alto;
      if (vistos.has(clave)) return;
      vistos.add(clave);
      salida.push({ id: m.nombre || clave, anchoMm: ancho, altoMm: alto });
    });
    return salida;
  }

  // `Base` es Impresion.AdaptadorImpresora (se pasa al crear para no depender del orden de carga de los scripts).
  function crearProveedor(api, Base, Impresion) {
    const oyentes = new Set();
    let adaptadores = [];
    let seleccionada = null;
    let temporizador = null;
    let leyendo = null;

    const avisar = () => oyentes.forEach((f) => { try { f(); } catch (e) { /* un oyente roto no frena nada */ } });

    class ImpresoraDeWindows extends Base {
      constructor(datos) {
        super({ id: PREFIJO + datos.nombre, nombre: datos.nombre, medios: mediosDe(datos.medios) });
        this.simulada = false;
        this.nombreWindows = datos.nombre;
        this.driver = datos.driver || '';
        this._estado = datos.estado || 'desconocido';
        this._detalle = datos.detalle || '';
        this._ocupada = false;
      }
      _poner(estado, detalle) {
        const cambio = estado !== this._estado || (detalle || '') !== this._detalle;
        this._estado = estado; this._detalle = detalle || '';
        return cambio;
      }
      instantanea() {
        let estado = this._estado;
        if (this._ocupada && (estado === 'lista' || estado === 'ocupada')) estado = 'imprimiendo';
        return {
          id: this.id, nombre: this.nombre, simulada: false, estado,
          detalle: this._detalle || (Impresion.MENSAJES_ESTADO[estado] || ''),
          segundosPorHoja: SEG_POR_HOJA, lenta: false,
          medios: this.medios.map((m) => ({ ...m })),
          driver: this.driver,
        };
      }
      async consultar() {
        if (this._ocupada) return this.instantanea(); // imprimiendo: Windows está ocupado con nuestra hoja, no se le molesta
        try {
          const e = await api.estado(this.nombreWindows);
          // 'imprimiendo' lo decide la cola (trabajo propio en curso); aquí solo cuenta lo que Windows dice de la impresora.
          this._poner(e.estado === 'imprimiendo' ? 'lista' : e.estado, e.detalle);
        } catch (err) {
          this._poner('desconocido', 'No se pudo consultar a Windows.');
        }
        return this.instantanea();
      }
      async enviar(trabajo, contenido) {
        if (!contenido || !contenido.blob) { const e = new Error('No se encontró la hoja que había que imprimir.'); e.codigo = 'sin-contenido'; e.definitivo = true; throw e; }
        const medidas = contenido.medidas || {};
        const imagen = new Uint8Array(await contenido.blob.arrayBuffer());
        this._ocupada = true;
        let r;
        try {
          r = await api.imprimir({
            nombre: this.nombreWindows, hojas: trabajo.hojas, anchoMm: medidas.anchoMm || 101.6, altoMm: medidas.altoMm || 152.4,
            imagen, trabajoId: trabajo.id,
          });
        } catch (err) {
          // No se sabe si el trabajo llegó al spooler (tiempo agotado, PowerShell caído): reintentar solo podría imprimir
          // doble, así que queda para que lo decida el operador (definitivo = no se reintenta solo).
          const e = new Error((err && err.message) || 'No se pudo hablar con Windows para imprimir.');
          e.codigo = 'error';
          e.definitivo = true;
          throw e;
        } finally {
          this._ocupada = false;
        }
        if (!r || r.ok !== true) {
          const codigo = (r && r.codigo) || 'error';
          const e = new Error((r && r.detalle) || 'La impresora no pudo imprimir.');
          e.codigo = codigo === 'envio' ? 'error' : codigo;
          // 'envio' (no se sabe si llegó al spooler), 'servidor' (falló el servidor de impresión) y 'trabajo-pegado'
          // (no se pudo sacar del spooler) no se reintentan solos: podrían imprimir doble.
          if (codigo === 'sin-contenido' || codigo === 'envio' || codigo === 'servidor' || codigo === 'trabajo-pegado') e.definitivo = true;
          // Si Windows dice que la impresora tiene un problema, el próximo estado lo refleja.
          const problema = codigo.indexOf('impresora-') === 0 ? codigo.slice('impresora-'.length) : null;
          if (problema && Impresion.ESTADOS_PROBLEMA.indexOf(problema) >= 0) this._poner(problema, e.message);
          throw e;
        }
        this._poner('lista', '');
        return { ok: true, hojas: trabajo.hojas, papel: r.papel || null, estadoSpooler: r.estado || null };
      }
      cancelar() { /* el trabajo ya es de Windows; si falla, la cola no lo reenvía solo (queda "retenido" si no se sabe) */ }
    }

    async function actualizar() {
      if (leyendo) return leyendo;
      leyendo = (async () => {
        let lista = [];
        try { lista = await api.listar(); } catch (e) { lista = []; }
        const reales = lista.filter((i) => !i.virtual);
        const previos = new Map(adaptadores.map((a) => [a.id, a]));
        adaptadores = reales.map((i) => {
          const a = previos.get(PREFIJO + i.nombre);
          if (a) { a._poner(i.estado, i.detalle); a.medios = mediosDe(i.medios); a.driver = i.driver || ''; return a; }
          return new ImpresoraDeWindows(i);
        });
        avisar();
      })().finally(() => { leyendo = null; });
      return leyendo;
    }

    async function vigilar() {
      const a = adaptadores.find((x) => x.id === seleccionada);
      if (!a) return;
      const antes = a.instantanea();
      const despues = await a.consultar();
      if (antes.estado !== despues.estado || antes.detalle !== despues.detalle) avisar();
    }

    function seleccionar(id) {
      seleccionada = esRealId(id) ? id : null;
      if (temporizador) { clearInterval(temporizador); temporizador = null; }
      if (seleccionada) { vigilar(); temporizador = setInterval(vigilar, SONDEO_MS); }
    }

    return {
      adaptadores: () => adaptadores.slice(),
      adaptadorDe: (id) => adaptadores.find((a) => a.id === id) || null,
      actualizar, seleccionar,
      alCambiar: (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
    };
  }

  const puente = (typeof window !== 'undefined' && window.fotocabinaEscritorio && window.fotocabinaEscritorio.esEscritorio) ? window.fotocabinaEscritorio : null;
  const proveedor = (puente && typeof Impresion !== 'undefined') ? crearProveedor(puente.impresion, Impresion.AdaptadorImpresora, Impresion) : null;

  return { disponible: !!proveedor, PREFIJO, esRealId, mediosDe, crearProveedor, proveedor };
})();

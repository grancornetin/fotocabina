/*
  Impresión (hito 3, docs/ARQUITECTURA_FLUJO.md §5.3, §5.5 y §7.10): adaptador de impresora, cola de trabajos
  PERSISTENTE y conteo de hojas. Sin dependencias y sin tocar la pantalla.

  Hoy NO existe hardware, driver ni servidor local: todo corre contra una impresora SIMULADA (ImpresoraSimulada).
  Las pantallas hablan solo con el servicio (crearServicio) y este con un AdaptadorImpresora; el día que haya una
  impresora real se escribe otro adaptador con la misma interfaz y no se toca ninguna pantalla.

  ───────────── Interfaz del adaptador (AdaptadorImpresora) ─────────────
    id, nombre, simulada            identidad ('simulada' = true solo en las de prueba)
    medios                          [{ id, anchoMm, altoMm }] papeles que admite
    instantanea()      SÍNCRONA     último estado conocido: { id, nombre, simulada, estado, detalle, segundosPorHoja, lenta, medios }
                                    (un adaptador real devuelve el último dato que consultó; el validador y los semáforos
                                    necesitan una respuesta inmediata)
    consultar()        async        vuelve a preguntarle a la impresora y devuelve la instantánea nueva
    enviar(trabajo, contenido)      async. Imprime `trabajo.hojas` hojas físicas. `contenido` = { blob, medidas }.
                                    Resuelve { ok: true } o RECHAZA con un Error que lleva `codigo` ('impresora-sin-papel',
                                    'impresora-atascada', 'sin-contenido'...) y, si no tiene sentido reintentar, `definitivo: true`.
    cancelar(trabajoId)             pide cortar un trabajo (la simulada lo ignora: ya salió o no)
  Estados de impresora: lista, ocupada, imprimiendo, sin-papel, sin-cinta, atascada, desconectada, tapa-abierta, error,
  desconocido (el adaptador no sabe: caso del navegador; el validador lo trata como "no comprobable", nunca como bloqueo).
  "Lenta" no es un estado: es una impresora 'lista' con muchos segundos por hoja (la lee el ritmo del validador).

  ───────────── Trabajo de impresión (registro persistente) ─────────────
    { version: 1, id, sesionId, eventoId, eventoNombre, impresoraId, hojas, copiasPedidas, origen, estado,
      intentos, ultimoError: { codigo, mensaje } | null, proximoIntentoEn, creadoEn, actualizadoEn, terminadoEn, hojasImpresas }
    `hojas` = hojas FÍSICAS (una hoja 4×6 con dos tiras = 1). `origen`: 'auto' | 'invitado' | 'adicional' | 'reimpresion' | 'prueba'.
    estado: en-cola → imprimiendo → hecho, o reintentando (falló: espera y vuelve a intentar), fallido (se acabaron los
    intentos: alerta para el operador), retenido (no se sabe si salió, o cambió la impresora: espera decisión), cancelado.
    El archivo no se guarda en el trabajo: se pide a quien llama (`resolverContenido`) justo antes de enviar, así la
    reimpresión es idéntica a la sesión original (ARQUITECTURA_FLUJO.md §5.3).

  ───────────── Reglas que garantiza la cola ─────────────
    · Nunca bloquea la interfaz: `encolar` es síncrono y vuelve al instante; imprimir ocurre aparte.
    · Nunca pierde un trabajo: se guarda ANTES de intentar; si la impresora falla se reintenta (2, 4 y 8 s) y, agotados los
      intentos, queda `fallido` a la vista del operador hasta que lo reintente; si la página se cierra imprimiendo,
      el trabajo vuelve como `retenido` (no se reimprime solo para no gastar dos hojas).
    · Una sola pestaña procesa la cola a la vez (arriendo en el almacenamiento), para no imprimir doble.
    · Tope de hojas por evento: se descuenta al ENCOLAR (lo en cola y lo retenido ya cuentan), de forma atómica.
    · Conteo: cada hoja impresa suma por evento y por impresora (y "desde el último cambio de rollo").

  Persistencia: localStorage, clave `fotocabina-impresion` (un solo registro; mismas razones y límites que `AlmacenEventos`).
  Para pruebas, el servicio acepta `almacenamiento` y `reloj` propios.
*/
const Impresion = (() => {
  'use strict';

  const CLAVE = 'fotocabina-impresion';
  const VERSION = 1;

  const ESTADOS_OK = ['lista', 'ocupada', 'imprimiendo'];
  const ESTADOS_PROBLEMA = ['sin-papel', 'sin-cinta', 'atascada', 'desconectada', 'tapa-abierta', 'error'];
  const ESTADOS_SIMULABLES = ['lista', 'sin-papel', 'sin-cinta', 'atascada', 'desconectada', 'tapa-abierta', 'error'];
  const MENSAJES_ESTADO = {
    'sin-papel': 'A la impresora se le acabó el papel.',
    'sin-cinta': 'A la impresora se le acabó la cinta.',
    'desconectada': 'La impresora está desconectada.',
    'tapa-abierta': 'La impresora tiene la tapa abierta.',
    'atascada': 'El papel de la impresora está atascado.',
    'error': 'La impresora informa un error.',
  };
  const ESTADOS_ACTIVOS = ['en-cola', 'imprimiendo', 'reintentando'];
  const ORIGENES = ['auto', 'invitado', 'adicional', 'reimpresion', 'prueba'];

  const HOJA_4X6 = Object.freeze({ id: '4x6', anchoMm: 101.6, altoMm: 152.4 });
  const MODELOS = Object.freeze({
    'simulada-4x6': { id: 'simulada-4x6', nombre: 'Impresora simulada 4×6', medios: [HOJA_4X6] },
    'simulada-5x7': { id: 'simulada-5x7', nombre: 'Impresora simulada 5×7', medios: [{ id: '5x7', anchoMm: 127, altoMm: 177.8 }] },
  });
  const IMPRESORA_POR_DEFECTO = 'simulada-4x6';
  const SEG_POR_HOJA = 8;
  const SEG_POR_HOJA_LENTA = 45;

  const CONFIG_BASE = Object.freeze({
    maxIntentos: 4,
    esperasMs: [2000, 4000, 8000],
    maxHistorial: 200,
    arriendoMs: 15000,
    pulsoMs: 1000,
  });

  const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const esNumero = (x) => typeof x === 'number' && isFinite(x);
  const entero = (x, defecto, min, max) => {
    const n = esNumero(x) ? Math.round(x) : (typeof x === 'string' && x.trim() !== '' && isFinite(Number(x)) ? Math.round(Number(x)) : defecto);
    return Math.min(max, Math.max(min, n));
  };
  const copiar = (x) => JSON.parse(JSON.stringify(x));
  const ahoraIso = (ms) => new Date(ms).toISOString();
  function idNuevo(prefijo) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefijo}-${crypto.randomUUID().slice(0, 12)}`;
    return `${prefijo}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }

  const RELOJ_REAL = Object.freeze({
    ahora: () => Date.now(),
    esperar: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
  });

  function almacenamientoEnMemoria() {
    const m = {};
    return {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
      setItem: (k, v) => { m[k] = String(v); },
      removeItem: (k) => { delete m[k]; },
    };
  }

  // ───────────── Adaptador: la interfaz y la impresora simulada ─────────────

  class AdaptadorImpresora {
    constructor(datos) {
      const d = datos || {};
      this.id = d.id;
      this.nombre = d.nombre;
      this.simulada = false;
      this.medios = Array.isArray(d.medios) ? d.medios : [];
    }
    instantanea() { throw new Error('AdaptadorImpresora.instantanea() no está implementada'); }
    async consultar() { return this.instantanea(); }
    async enviar() { throw new Error('AdaptadorImpresora.enviar() no está implementada'); }
    cancelar() { /* por defecto no se puede cortar */ }
    // Comprueba que un objeto cumple la interfaz (lo usan las pruebas y el servicio al recibir un adaptador propio).
    static cumple(obj) {
      return !!obj && ['instantanea', 'consultar', 'enviar', 'cancelar'].every((m) => typeof obj[m] === 'function') && typeof obj.id === 'string';
    }
  }

  function errorDeImpresion(codigo, mensaje, definitivo) {
    const e = new Error(mensaje);
    e.codigo = codigo;
    if (definitivo) e.definitivo = true;
    return e;
  }

  // Impresora de mentira: su estado lo decide el operador (control "Simulación" de C4) y se guarda en el registro,
  // así sobrevive a recargar la página. Si "rolloRestante" tiene número, cada hoja impresa lo descuenta y, al llegar
  // a cero, la impresora informa "sin papel" (así se prueba el aviso de fin de rollo).
  class ImpresoraSimulada extends AdaptadorImpresora {
    constructor(modelo, acceso, reloj) {
      super(modelo);
      this.simulada = true;
      this._acceso = acceso; // { leer(): estado simulado, escribir(parcial) }
      this._reloj = reloj;
      this._ocupada = false;
    }
    instantanea() {
      const s = this._acceso.leer();
      let estado = s.estado;
      if (estado === 'lista' && s.rolloRestante !== null && s.rolloRestante <= 0) estado = 'sin-papel';
      if (estado === 'lista' && this._ocupada) estado = 'imprimiendo';
      return {
        id: this.id,
        nombre: this.nombre,
        simulada: true,
        estado,
        detalle: MENSAJES_ESTADO[estado] || '',
        segundosPorHoja: s.lenta ? SEG_POR_HOJA_LENTA : SEG_POR_HOJA,
        lenta: !!s.lenta,
        medios: this.medios.map((m) => ({ ...m })),
        rolloRestante: s.rolloRestante,
      };
    }
    async enviar(trabajo, contenido) {
      const antes = this.instantanea();
      if (!ESTADOS_OK.includes(antes.estado)) throw errorDeImpresion('impresora-' + antes.estado, antes.detalle || 'La impresora no está lista.');
      if (!contenido || !contenido.blob) throw errorDeImpresion('sin-contenido', 'No se encontró la tira que había que imprimir.', true);
      const s = this._acceso.leer();
      const ms = antes.segundosPorHoja * Math.max(1, trabajo.hojas) * 1000 * s.escalaTiempo;
      this._ocupada = true;
      try {
        if (ms > 0) await this._reloj.esperar(ms);
      } finally {
        this._ocupada = false;
      }
      // Si el operador "rompió" la impresora mientras imprimía (se atascó, se abrió la tapa), esa hoja no salió.
      const despues = this.instantanea();
      if (!ESTADOS_OK.includes(despues.estado)) throw errorDeImpresion('impresora-' + despues.estado, despues.detalle || 'La impresora falló mientras imprimía.');
      const fresco = this._acceso.leer();
      if (fresco.rolloRestante !== null) this._acceso.escribir({ rolloRestante: Math.max(0, fresco.rolloRestante - trabajo.hojas) });
      return { ok: true, hojas: trabajo.hojas };
    }
  }

  // ───────────── Registro persistente ─────────────

  const SIM_BASE = Object.freeze({ estado: 'lista', lenta: false, rolloRestante: null, escalaTiempo: 1 });

  function registroNuevo() {
    return {
      version: VERSION,
      perfil: { impresoraId: IMPRESORA_POR_DEFECTO, hojasPorRollo: 0, avisoRestantes: 30 },
      simulacion: {},
      trabajos: [],
      contadores: { porEvento: {}, porImpresora: {} },
      pausa: null,
      arriendo: null,
    };
  }

  function normalizarRegistro(crudo) {
    const base = registroNuevo();
    if (!esObjeto(crudo)) return base;
    const r = { ...base };
    if (esObjeto(crudo.perfil)) {
      const p = crudo.perfil;
      r.perfil = {
        impresoraId: typeof p.impresoraId === 'string' && MODELOS[p.impresoraId] ? p.impresoraId : base.perfil.impresoraId,
        hojasPorRollo: entero(p.hojasPorRollo, 0, 0, 9999),
        avisoRestantes: entero(p.avisoRestantes, base.perfil.avisoRestantes, 0, 999),
      };
    }
    if (esObjeto(crudo.simulacion)) r.simulacion = crudo.simulacion;
    if (Array.isArray(crudo.trabajos)) r.trabajos = crudo.trabajos.filter((t) => esObjeto(t) && typeof t.id === 'string');
    if (esObjeto(crudo.contadores)) {
      r.contadores = { porEvento: esObjeto(crudo.contadores.porEvento) ? crudo.contadores.porEvento : {}, porImpresora: esObjeto(crudo.contadores.porImpresora) ? crudo.contadores.porImpresora : {} };
    }
    r.pausa = esObjeto(crudo.pausa) ? crudo.pausa : null;
    r.arriendo = esObjeto(crudo.arriendo) ? crudo.arriendo : null;
    return r;
  }

  // ───────────── Servicio ─────────────

  function crearServicio(opciones) {
    const op = opciones || {};
    const almacen = op.almacenamiento || (typeof localStorage !== 'undefined' ? localStorage : almacenamientoEnMemoria());
    const reloj = op.reloj || RELOJ_REAL;
    const cfg = { ...CONFIG_BASE, ...(op.config || {}) };
    const resolverContenido = typeof op.resolverContenido === 'function' ? op.resolverContenido : async () => null;
    const pestana = idNuevo('pt');
    const oyentes = new Set();
    let errorDeGuardado = null;
    let ilegible = false; // el registro guardado no se pudo leer: se guardó una copia aparte y se partió de cero (se avisa)
    const topeDe = typeof op.topeDe === 'function' ? op.topeDe : null; // tope VIGENTE de un evento (si se da, manda siempre)
    let respaldoEnMemoria = null; // última versión que no se pudo guardar: si el almacenamiento falla, la cola sigue funcionando desde aquí
    let adaptador = null;
    let procesando = false;
    let temporizador = null;
    let procesarEnCurso = null;

    // ----- lectura y escritura -----
    function leer() {
      if (errorDeGuardado && respaldoEnMemoria) return normalizarRegistro(copiar(respaldoEnMemoria));
      let texto = null;
      try { texto = almacen.getItem(CLAVE); } catch (e) { texto = null; }
      if (texto) {
        try { return normalizarRegistro(JSON.parse(texto)); } catch (e) {
          if (!ilegible) {
            ilegible = true;
            try { almacen.setItem(CLAVE + '-ilegible', texto); } catch (x) { /* sin espacio para la copia */ }
          }
        }
      }
      return registroNuevo();
    }
    function escribir(r) {
      // Los trabajos ya terminados se podan (los contadores no dependen de ellos).
      const terminales = r.trabajos.filter((t) => !ESTADOS_ACTIVOS.includes(t.estado) && t.estado !== 'fallido' && t.estado !== 'retenido');
      if (terminales.length > cfg.maxHistorial) {
        const sobrantes = new Set(terminales.slice(0, terminales.length - cfg.maxHistorial).map((t) => t.id));
        r.trabajos = r.trabajos.filter((t) => !sobrantes.has(t.id));
      }
      try {
        almacen.setItem(CLAVE, JSON.stringify(r));
        errorDeGuardado = null;
        respaldoEnMemoria = null;
      } catch (e) {
        errorDeGuardado = { mensaje: 'No se pudo guardar la cola de impresión en este equipo (¿sin espacio?): sigue funcionando, pero si se cierra la página se pierde lo pendiente.' };
        respaldoEnMemoria = copiar(r);
      }
      return r;
    }
    function cambiar(fn) {
      const r = leer();
      const res = fn(r);
      escribir(r);
      return res;
    }
    function emitir(tipo, trabajo, extra) {
      const evento = { tipo, trabajo: trabajo ? copiar(trabajo) : null, en: ahoraIso(reloj.ahora()), ...(extra || {}) };
      oyentes.forEach((f) => { try { f(evento); } catch (e) { /* un oyente roto no frena la cola */ } });
    }

    // ----- adaptador -----
    function acceso(id) {
      return {
        leer: () => ({ ...SIM_BASE, ...(leer().simulacion[id] || {}) }),
        escribir: (parcial) => cambiar((r) => { r.simulacion[id] = { ...SIM_BASE, ...(r.simulacion[id] || {}), ...parcial }; }),
      };
    }
    function obtenerAdaptador() {
      const id = leer().perfil.impresoraId;
      if (op.adaptador && AdaptadorImpresora.cumple(op.adaptador)) return op.adaptador;
      if (!adaptador || adaptador.id !== id) adaptador = new ImpresoraSimulada(MODELOS[id] || MODELOS[IMPRESORA_POR_DEFECTO], acceso(id), reloj);
      return adaptador;
    }
    const esSimulada = () => !!obtenerAdaptador().simulada;

    // ----- cuentas -----
    function usadasDelEvento(r, eventoId, ignorarId) {
      const impresas = (r.contadores.porEvento[eventoId] && r.contadores.porEvento[eventoId].impresas) || 0;
      // Lo que está en cola, imprimiendo o retenido ya cuenta (puede haber salido); fallido y cancelado no.
      const enCurso = r.trabajos
        .filter((t) => t.eventoId === eventoId && t.id !== ignorarId && (ESTADOS_ACTIVOS.includes(t.estado) || t.estado === 'retenido'))
        .reduce((s, t) => s + t.hojas, 0);
      return { impresas, enCurso, usadas: impresas + enCurso };
    }

    // El tope que vale AHORA para un evento: si el servicio sabe preguntarlo (topeDe) manda eso; si no, el número que traiga quien llama.
    function topeVigente(eventoId, explicito) {
      if (!eventoId) return null;
      const v = topeDe ? topeDe(eventoId) : explicito;
      return esNumero(v) && v > 0 ? Math.round(v) : null;
    }

    function hojasDelEvento(eventoId, topeHojas) {
      const u = usadasDelEvento(leer(), eventoId);
      const tope = esNumero(topeHojas) && topeHojas > 0 ? Math.round(topeHojas) : null;
      return { ...u, tope, restantes: tope === null ? null : Math.max(0, tope - u.usadas) };
    }

    function contadores() {
      const c = leer().contadores;
      return copiar(c);
    }

    // ----- encolar -----
    // datos: { sesionId, eventoId, eventoNombre, copias, origen, topeHojas }
    // Devuelve { ok, trabajo, hojas, pedidas, parcial, restantes } o { ok: false, motivo: 'tope' | 'datos', restantes }.
    function encolar(datos) {
      const d = esObjeto(datos) ? datos : {};
      const pedidas = entero(d.copias, 1, 1, 99);
      const origen = ORIGENES.includes(d.origen) ? d.origen : 'invitado';
      const tope = origen !== 'prueba' ? topeVigente(d.eventoId, d.topeHojas) : null;
      return cambiar((r) => {
        let hojas = pedidas;
        let parcial = false;
        if (tope !== null) {
          const quedan = Math.max(0, tope - usadasDelEvento(r, d.eventoId).usadas);
          if (quedan <= 0) return { ok: false, motivo: 'tope', pedidas, restantes: 0 };
          if (pedidas > quedan) { hojas = quedan; parcial = true; }
        }
        const ahora = reloj.ahora();
        const trabajo = {
          version: 1,
          id: idNuevo('pj'),
          sesionId: d.sesionId || null,
          eventoId: d.eventoId || null,
          eventoNombre: d.eventoNombre || '',
          impresoraId: r.perfil.impresoraId,
          hojas,
          copiasPedidas: pedidas,
          origen,
          estado: 'en-cola',
          intentos: 0,
          ultimoError: null,
          proximoIntentoEn: null,
          creadoEn: ahoraIso(ahora),
          actualizadoEn: ahoraIso(ahora),
          terminadoEn: null,
          hojasImpresas: 0,
        };
        r.trabajos.push(trabajo);
        const restantes = tope === null ? null : Math.max(0, tope - usadasDelEvento(r, d.eventoId).usadas);
        // El aviso y el despertar van después de guardar, fuera de esta función.
        setTimeout(() => { emitir('impresion.encolada', trabajo, { parcial }); despertar(); }, 0);
        return { ok: true, trabajo: copiar(trabajo), hojas, pedidas, parcial, restantes };
      });
    }

    // ----- operaciones del operador sobre un trabajo -----
    function tocar(id, fn) {
      return cambiar((r) => {
        const t = r.trabajos.find((x) => x.id === id);
        if (!t) return null;
        fn(t, r);
        t.actualizadoEn = ahoraIso(reloj.ahora());
        return copiar(t);
      });
    }

    // Vuelve a poner en cola un trabajo fallido o retenido. Un fallido se vuelve a medir contra el tope (opciones.topeHojas).
    function reintentar(id, opciones2) {
      return cambiar((r) => {
        const t = r.trabajos.find((x) => x.id === id);
        if (!t || !['fallido', 'retenido', 'cancelado'].includes(t.estado)) return { ok: false, motivo: 'estado' };
        let recortado = false;
        const tope = topeVigente(t.eventoId, opciones2 && opciones2.topeHojas);
        if (t.estado !== 'retenido' && tope !== null && t.origen !== 'prueba') {
          const quedan = Math.max(0, tope - usadasDelEvento(r, t.eventoId, t.id).usadas);
          if (quedan <= 0) return { ok: false, motivo: 'tope', restantes: 0 };
          if (t.hojas > quedan) { t.hojas = quedan; recortado = true; }
        }
        t.estado = 'en-cola';
        t.intentos = 0;
        t.ultimoError = null;
        t.proximoIntentoEn = null;
        t.actualizadoEn = ahoraIso(reloj.ahora());
        r.pausa = null;
        const copia = copiar(t);
        setTimeout(() => { emitir('impresion.encolada', copia, { reintento: true }); despertar(); }, 0);
        return { ok: true, trabajo: copia, recortado };
      });
    }

    function reintentarFallidos(opciones2) {
      const ids = leer().trabajos.filter((t) => t.estado === 'fallido').map((t) => t.id);
      const resultados = ids.map((id) => reintentar(id, opciones2));
      return { reintentados: resultados.filter((x) => x.ok).length, sinTope: resultados.filter((x) => !x.ok && x.motivo === 'tope').length, recortados: resultados.filter((x) => x.ok && x.recortado).length };
    }

    function cancelar(id) {
      let cancelado = null;
      tocar(id, (t) => {
        if (!['en-cola', 'reintentando', 'fallido', 'retenido'].includes(t.estado)) return;
        t.estado = 'cancelado';
        t.terminadoEn = ahoraIso(reloj.ahora());
        cancelado = true;
      });
      if (cancelado) emitir('impresion.cancelada', leer().trabajos.find((t) => t.id === id));
      return !!cancelado;
    }

    function listar(filtro) {
      const f = esObjeto(filtro) ? filtro : {};
      return leer().trabajos
        .filter((t) => (!f.eventoId || t.eventoId === f.eventoId) && (!f.sesionId || t.sesionId === f.sesionId) && (!f.estados || f.estados.includes(t.estado)))
        .map(copiar);
    }

    function resumenCola() {
      const r = leer();
      const cuenta = (e) => r.trabajos.filter((t) => t.estado === e);
      const enCola = cuenta('en-cola'), imprimiendo = cuenta('imprimiendo'), reintentando = cuenta('reintentando');
      const fallidos = cuenta('fallido'), retenidos = cuenta('retenido');
      const pendientes = [...enCola, ...imprimiendo, ...reintentando];
      const hojasPendientes = pendientes.reduce((s, t) => s + t.hojas, 0);
      const seg = obtenerAdaptador().instantanea().segundosPorHoja;
      return {
        enCola: enCola.length, imprimiendo: imprimiendo.length, reintentando: reintentando.length,
        fallidos: fallidos.length, retenidos: retenidos.length,
        pendientes: pendientes.length, hojasPendientes,
        atrasoSeg: hojasPendientes * seg,
        pausada: !!r.pausa, motivoPausa: r.pausa ? r.pausa.motivo : null,
      };
    }

    // ----- rollo, perfil y simulación -----
    function perfil() { return copiar(leer().perfil); }
    function guardarPerfil(parcial) {
      const p = esObjeto(parcial) ? parcial : {};
      return cambiar((r) => {
        if (p.hojasPorRollo !== undefined) r.perfil.hojasPorRollo = entero(p.hojasPorRollo, 0, 0, 9999);
        if (p.avisoRestantes !== undefined) r.perfil.avisoRestantes = entero(p.avisoRestantes, 30, 0, 999);
        return copiar(r.perfil);
      });
    }

    function restantesRollo() {
      const r = leer();
      const total = r.perfil.hojasPorRollo;
      if (!total) return { configurado: false, total: 0, restantes: null, aviso: null, desdeCambio: 0 };
      const c = r.contadores.porImpresora[r.perfil.impresoraId];
      const desde = (c && c.desdeCambio) || 0;
      const restantes = Math.max(0, total - desde);
      const aviso = restantes <= 0 ? 'agotado' : (restantes <= r.perfil.avisoRestantes ? 'bajo' : null);
      return { configurado: true, total, restantes, aviso, desdeCambio: desde, cambioEn: (c && c.cambioEn) || null, rollos: (c && c.rollos) || 0 };
    }

    // "Rollo nuevo" (acción explícita del operador, con confirmación en C4): el conteo de ESTA impresora desde el último cambio vuelve a cero.
    // Es lo único que lo reinicia: empezar un evento nuevo no lo toca (un rollo alcanza para varios eventos) ni el tope por evento.
    function cambiarRollo() {
      const id = leer().perfil.impresoraId;
      cambiar((r) => {
        const c = r.contadores.porImpresora[id] || { impresas: 0, desdeCambio: 0, cambioEn: null };
        c.desdeCambio = 0;
        c.rollos = (c.rollos || 0) + 1;
        c.cambioEn = ahoraIso(reloj.ahora());
        r.contadores.porImpresora[id] = c;
        r.pausa = null;
        // En la simulada, el rollo simulado (si estaba activo) también se recarga.
        const sim = { ...SIM_BASE, ...(r.simulacion[id] || {}) };
        if (sim.rolloRestante !== null) r.simulacion[id] = { ...sim, rolloRestante: r.perfil.hojasPorRollo || sim.rolloRestante };
      });
      emitir('impresion.rollo-cambiado', null);
      despertar();
    }

    function simulacion() {
      const id = leer().perfil.impresoraId;
      return { ...SIM_BASE, ...(leer().simulacion[id] || {}), disponible: esSimulada() };
    }
    function configurarSimulacion(parcial) {
      if (!esSimulada()) return null;
      const p = esObjeto(parcial) ? parcial : {};
      const id = leer().perfil.impresoraId;
      const nuevo = {};
      if (p.estado !== undefined && ESTADOS_SIMULABLES.includes(p.estado)) nuevo.estado = p.estado;
      if (p.lenta !== undefined) nuevo.lenta = !!p.lenta;
      if (p.rolloRestante !== undefined) nuevo.rolloRestante = p.rolloRestante === null ? null : entero(p.rolloRestante, 0, 0, 9999);
      if (p.escalaTiempo !== undefined) nuevo.escalaTiempo = Math.min(1, Math.max(0, esNumero(p.escalaTiempo) ? p.escalaTiempo : 1));
      cambiar((r) => { r.simulacion[id] = { ...SIM_BASE, ...(r.simulacion[id] || {}), ...nuevo }; });
      emitir('impresora.estado', null);
      despertar();
      return simulacion();
    }

    function impresoras() {
      const actual = leer().perfil.impresoraId;
      return Object.values(MODELOS).map((m) => ({ id: m.id, nombre: m.nombre, simulada: true, medios: m.medios.map((x) => ({ ...x })), actual: m.id === actual }));
    }

    // Cambiar de impresora con trabajos sin imprimir: se pide una decisión ('trasladar' | 'retener' | 'cancelar').
    function cambiarImpresora(id, decision) {
      if (!MODELOS[id]) return { ok: false, motivo: 'desconocida' };
      const r0 = leer();
      if (r0.perfil.impresoraId === id) return { ok: true, sinCambio: true };
      const pendientes = r0.trabajos.filter((t) => ESTADOS_ACTIVOS.includes(t.estado) || t.estado === 'fallido' || t.estado === 'retenido');
      if (pendientes.length && !['trasladar', 'retener', 'cancelar'].includes(decision)) {
        return { ok: false, motivo: 'decision', pendientes: pendientes.length, hojas: pendientes.reduce((s, t) => s + t.hojas, 0) };
      }
      cambiar((r) => {
        r.perfil.impresoraId = id;
        r.pausa = null;
        r.trabajos.forEach((t) => {
          if (!ESTADOS_ACTIVOS.includes(t.estado) && t.estado !== 'fallido' && t.estado !== 'retenido') return;
          if (t.estado === 'imprimiendo' || decision === 'retener') {
            t.estado = 'retenido';
            t.ultimoError = { codigo: 'cambio-de-impresora', mensaje: 'Cambió la impresora: este trabajo espera tu decisión.' };
          } else if (decision === 'cancelar') {
            t.estado = 'cancelado';
            t.terminadoEn = ahoraIso(reloj.ahora());
          } else {
            t.impresoraId = id; // trasladar: sigue en cola, ahora para la nueva impresora
            if (t.estado === 'fallido') {
              // Un fallido vuelve a pedir hojas: se mide contra el tope vigente (recorta o se queda "fallido" si no hay).
              const tope = t.origen !== 'prueba' ? topeVigente(t.eventoId, null) : null;
              const quedan = tope === null ? Infinity : Math.max(0, tope - usadasDelEvento(r, t.eventoId, t.id).usadas);
              if (quedan <= 0) { t.ultimoError = { codigo: 'tope', mensaje: 'El evento ya usó todas sus hojas: no se pasó a la nueva impresora.' }; }
              else { if (t.hojas > quedan) t.hojas = quedan; t.estado = 'en-cola'; t.intentos = 0; t.ultimoError = null; }
            }
          }
          t.actualizadoEn = ahoraIso(reloj.ahora());
        });
      });
      adaptador = null;
      emitir('impresora.estado', null);
      despertar();
      return { ok: true, decision: decision || null, pendientes: pendientes.length };
    }

    // ----- estado para pantallas y validador -----
    function instantanea() { return obtenerAdaptador().instantanea(); }

    // Lo que pide el validador (`vivo.impresora`): null si no hay dato (nunca marca un bloqueo por falta de dato).
    function paraValidador() {
      const s = instantanea();
      if (!s || typeof s.estado !== 'string' || s.estado === 'desconocido') return null;
      const medios = (s.medios || []).map((m) => ({ anchoMm: m.anchoMm, altoMm: m.altoMm }));
      // Un fin de rollo según el conteo es solo un aviso; la impresora real es la que dice si no hay papel.
      return { estado: s.estado, segundosPorHoja: s.segundosPorHoja, medios };
    }

    // Semáforo y texto para la cabina del operador. `modo`: 'impresion' | 'digital' | 'ambos' (digital = no aplica).
    function estado(modo) {
      const s = instantanea();
      const cola = resumenCola();
      const rollo = restantesRollo();
      const sim = s.simulada ? 'Simulación: ' : '';
      let semaforo, texto;
      if (modo === 'digital') {
        semaforo = 'idle'; texto = 'Este evento no imprime';
      } else if (s.estado === 'desconocido') {
        semaforo = 'idle'; texto = 'Impresora sin comprobar';
      } else if (ESTADOS_PROBLEMA.includes(s.estado)) {
        semaforo = 'error';
        texto = `${sim}${s.estado === 'sin-papel' ? 'sin papel' : s.estado === 'sin-cinta' ? 'sin cinta' : s.estado === 'atascada' ? 'atascada' : s.estado === 'desconectada' ? 'desconectada' : s.estado === 'tapa-abierta' ? 'tapa abierta' : 'con error'}`;
      } else if (errorDeGuardado) {
        semaforo = 'error'; texto = `${sim}la fila no se puede guardar`;
      } else if (cola.fallidos > 0) {
        semaforo = 'error'; texto = `${sim}${cola.fallidos} ${cola.fallidos === 1 ? 'trabajo sin imprimir' : 'trabajos sin imprimir'}`;
      } else if (cola.retenidos > 0) {
        semaforo = 'warn'; texto = `${sim}${cola.retenidos} ${cola.retenidos === 1 ? 'trabajo' : 'trabajos'} por revisar`;
      } else if (rollo.aviso === 'agotado') {
        semaforo = 'warn'; texto = `${sim}rollo agotado (según el conteo)`;
      } else if (rollo.aviso === 'bajo') {
        semaforo = 'warn'; texto = `${sim}quedan ${rollo.restantes} ${rollo.restantes === 1 ? 'hoja' : 'hojas'} del rollo`;
      } else if (s.lenta) {
        semaforo = 'warn'; texto = `${sim}lenta`;
      } else if (cola.pendientes > 0) {
        semaforo = 'ready'; texto = `${sim}imprimiendo · ${cola.pendientes} en fila`;
      } else {
        semaforo = 'ready'; texto = `${sim}lista`;
      }
      return { impresora: s, semaforo, texto: s.simulada || semaforo === 'idle' ? texto : `Impresora ${texto}`, cola, rollo, errorDeGuardado, ilegible };
    }

    // Texto para el invitado: nada técnico. Cambia según el modo de entrega.
    function mensajeInvitado(modo) {
      if (modo === 'ambos') return 'La impresión se está demorando. Ya avisamos al equipo; mientras tanto puedes llevarte tus fotos de forma digital.';
      return 'La impresión se está demorando. Ya avisamos al equipo: tu tira queda guardada y se imprimirá en cuanto esté lista.';
    }

    // ----- arriendo: una sola pestaña procesa la cola -----
    function adquirirArriendo() {
      const ahora = reloj.ahora();
      const actual = leer().arriendo;
      // Si ya es mío y le queda más de la mitad, no se reescribe (evita una escritura por segundo y avisos entre pestañas).
      if (actual && actual.pestana === pestana && actual.hasta - ahora > cfg.arriendoMs / 2) return true;
      let mio = false;
      cambiar((r) => {
        const a = r.arriendo;
        if (!a || a.pestana === pestana || a.hasta <= ahora) {
          r.arriendo = { pestana, hasta: ahora + cfg.arriendoMs };
          mio = true;
        }
      });
      return mio;
    }

    // Renueva el arriendo si sigue siendo mío (latido durante una impresión larga).
    function renovarArriendo() {
      const ahora = reloj.ahora();
      cambiar((r) => { if (r.arriendo && r.arriendo.pestana === pestana) r.arriendo = { pestana, hasta: ahora + cfg.arriendoMs }; });
    }
    const arriendoEsMio = (r) => !!(r.arriendo && r.arriendo.pestana === pestana && r.arriendo.hasta > reloj.ahora());

    // Lo que figura "imprimiendo" y no es de esta instancia es de una carga anterior (recarga, cierre): no se sabe si salió.
    function retenerHuerfanos() {
      let n = 0;
      cambiar((r) => {
        if (!arriendoEsMio(r)) return;
        r.trabajos.forEach((t) => {
          if (t.estado !== 'imprimiendo' || t.dueno === pestana) return;
          t.estado = 'retenido';
          t.ultimoError = { codigo: 'interrumpido', mensaje: 'La cabina se cerró mientras imprimía: no se sabe si la hoja salió.' };
          t.actualizadoEn = ahoraIso(reloj.ahora());
          n += 1;
        });
      });
      if (n) emitir('alerta.abierta', null, { causa: 'interrumpido', gravedad: 'media', trabajos: n });
      return n;
    }

    // ----- procesar -----
    function registrarFallo(id, error, desdeImpresora) {
      const ahora = reloj.ahora();
      let resultado = null;
      cambiar((r) => {
        const t = r.trabajos.find((x) => x.id === id);
        // Si mientras imprimía lo retuvieron, cancelaron o terminaron (otra pestaña, cambio de impresora), el fallo tardío no lo revive.
        if (!t || t.estado === 'retenido' || t.estado === 'cancelado' || t.estado === 'hecho') return;
        t.ultimoError = { codigo: error.codigo || 'error', mensaje: error.message || 'No se pudo imprimir.' };
        t.actualizadoEn = ahoraIso(ahora);
        if (error.definitivo || t.intentos >= cfg.maxIntentos) {
          t.estado = 'fallido';
          t.proximoIntentoEn = null;
          t.terminadoEn = ahoraIso(ahora);
          // Si el problema es de la impresora, el resto de la cola espera sin gastar intentos hasta que se arregle.
          if (desdeImpresora && !error.definitivo) r.pausa = { motivo: t.ultimoError.codigo, desde: ahoraIso(ahora) };
          resultado = { estado: 'fallido', trabajo: copiar(t) };
        } else {
          t.estado = 'reintentando';
          t.proximoIntentoEn = ahora + (cfg.esperasMs[Math.min(t.intentos - 1, cfg.esperasMs.length - 1)] || 2000);
          resultado = { estado: 'reintentando', trabajo: copiar(t) };
        }
      });
      if (resultado) {
        emitir('impresion.error', resultado.trabajo, { definitivo: resultado.estado === 'fallido' });
        if (resultado.estado === 'fallido') emitir('alerta.abierta', resultado.trabajo, { causa: resultado.trabajo.ultimoError.codigo, gravedad: 'alta' });
      }
      return resultado;
    }

    // Un paso: toma el primer trabajo pendiente y lo intenta. Devuelve { estado, trabajo?, esperaMs? }.
    async function procesarUno() {
      if (!adquirirArriendo()) return { estado: 'otra-pestana' };
      retenerHuerfanos();
      const ahora = reloj.ahora();
      const r = leer();
      const cabeza = r.trabajos.find((t) => t.estado === 'en-cola' || t.estado === 'reintentando');
      if (!cabeza) return { estado: 'vacia' };
      if (cabeza.estado === 'reintentando' && (cabeza.proximoIntentoEn || 0) > ahora) return { estado: 'espera', esperaMs: cabeza.proximoIntentoEn - ahora, trabajo: copiar(cabeza) };

      const impresora = obtenerAdaptador();
      let snap;
      try { snap = await impresora.consultar(); } catch (e) { snap = { estado: 'error', detalle: 'No se pudo consultar la impresora.' }; }
      const problema = ESTADOS_PROBLEMA.includes(snap.estado);
      if (problema) {
        if (r.pausa) return { estado: 'pausada', trabajo: copiar(cabeza) }; // ya se avisó: espera sin gastar intentos
        let reclamado = false;
        cambiar((x) => {
          const t = x.trabajos.find((y) => y.id === cabeza.id);
          if (t && (t.estado === 'en-cola' || t.estado === 'reintentando') && arriendoEsMio(x)) { t.intentos += 1; reclamado = true; }
        });
        if (!reclamado) return { estado: 'perdido' };
        const res = registrarFallo(cabeza.id, errorDeImpresion('impresora-' + snap.estado, snap.detalle || MENSAJES_ESTADO[snap.estado] || 'La impresora no está lista.'), true);
        return res || { estado: 'vacia' };
      }
      if (r.pausa) cambiar((x) => { x.pausa = null; }); // la impresora volvió: se reanuda sola

      // Reclamar el trabajo es UN solo cambio que comprueba que sigue pendiente y que el arriendo sigue siendo mío.
      let reclamado = false;
      cambiar((x) => {
        const t = x.trabajos.find((y) => y.id === cabeza.id);
        if (!t || !(t.estado === 'en-cola' || t.estado === 'reintentando') || !arriendoEsMio(x)) return;
        t.impresoraId = x.perfil.impresoraId; // los contadores y el rollo son de la impresora que de verdad imprime
        t.estado = 'imprimiendo'; t.intentos += 1; t.dueno = pestana; t.actualizadoEn = ahoraIso(reloj.ahora());
        reclamado = true;
      });
      if (!reclamado) return { estado: 'perdido' };
      emitir('impresion.iniciada', leer().trabajos.find((t) => t.id === cabeza.id));
      let contenido = null;
      const latido = setInterval(renovarArriendo, Math.max(200, cfg.arriendoMs / 3));
      try {
        const actual = leer().trabajos.find((t) => t.id === cabeza.id);
        contenido = await resolverContenido(copiar(actual));
        await impresora.enviar(copiar(actual), contenido);
      } catch (e) {
        const desdeImpresora = !!(e && typeof e.codigo === 'string' && e.codigo.indexOf('impresora-') === 0);
        clearInterval(latido);
        const res = registrarFallo(cabeza.id, e && e.codigo ? e : errorDeImpresion('error', (e && e.message) || 'No se pudo imprimir.'), desdeImpresora);
        return res || { estado: 'vacia' };
      }
      clearInterval(latido);
      let hecho = null;
      cambiar((x) => {
        const t = x.trabajos.find((y) => y.id === cabeza.id);
        if (!t) return;
        t.estado = 'hecho';
        t.hojasImpresas = t.hojas;
        t.ultimoError = null;
        t.proximoIntentoEn = null;
        t.terminadoEn = ahoraIso(reloj.ahora());
        t.actualizadoEn = t.terminadoEn;
        if (t.eventoId) {
          const ce = x.contadores.porEvento[t.eventoId] || { impresas: 0 };
          ce.impresas += t.hojas;
          x.contadores.porEvento[t.eventoId] = ce;
        }
        const ci = x.contadores.porImpresora[t.impresoraId] || { impresas: 0, desdeCambio: 0, cambioEn: null };
        ci.impresas += t.hojas;
        ci.desdeCambio += t.hojas;
        x.contadores.porImpresora[t.impresoraId] = ci;
        hecho = copiar(t);
      });
      if (hecho) emitir('impresion.ok', hecho);
      return { estado: 'hecho', trabajo: hecho };
    }

    // Procesa hasta que no quede nada que hacer ahora. Nunca corren dos a la vez en esta pestaña.
    async function procesarTodo(limite) {
      if (procesando) return procesarEnCurso;
      procesando = true;
      procesarEnCurso = (async () => {
        let ultimo = { estado: 'vacia' };
        const tope = limite || 200;
        try {
          for (let i = 0; i < tope; i++) {
            ultimo = await procesarUno();
            if (!['hecho', 'reintentando', 'fallido', 'perdido'].includes(ultimo.estado)) break;
            if (ultimo.estado === 'reintentando') break; // espera su turno: se vuelve a llamar más tarde
          }
        } catch (e) {
          ultimo = { estado: 'error', error: e };
        } finally {
          procesando = false;
        }
        return ultimo;
      })();
      return procesarEnCurso;
    }

    function despertar() {
      if (temporizador === null || temporizador === 'detenido') return; // no iniciado (pruebas o página sin cola activa)
      clearTimeout(temporizador);
      temporizador = setTimeout(pulso, 0);
    }
    async function pulso() {
      temporizador = null;
      let res = null;
      try { res = await procesarTodo(); } catch (e) { /* el siguiente pulso vuelve a intentar */ }
      if (temporizador === 'detenido') return;
      let siguiente = cfg.pulsoMs;
      if (res && res.estado === 'espera' && res.esperaMs) siguiente = Math.min(cfg.pulsoMs, Math.max(50, res.esperaMs));
      temporizador = setTimeout(pulso, siguiente);
    }

    // Al abrir la cabina: lo que quedó "imprimiendo" no se sabe si salió → retenido (nunca se reimprime solo).
    function recuperar() {
      const ahora = reloj.ahora();
      let recuperados = 0;
      const r0 = leer();
      // Una pestaña DISTINTA y viva la está llevando: no se toca. El arriendo de una carga anterior de esta misma
      // página (recarga rápida) no cuenta como ajeno: lo limpia retenerHuerfanos() en cuanto se gana el arriendo.
      if (r0.arriendo && r0.arriendo.pestana !== pestana && r0.arriendo.hasta > ahora) return 0;
      cambiar((r) => {
        r.trabajos.forEach((t) => {
          if (t.estado !== 'imprimiendo' || t.dueno === pestana) return;
          t.estado = 'retenido';
          t.ultimoError = { codigo: 'interrumpido', mensaje: 'La cabina se cerró mientras imprimía: no se sabe si la hoja salió.' };
          t.actualizadoEn = ahoraIso(ahora);
          recuperados += 1;
        });
      });
      if (recuperados) emitir('alerta.abierta', null, { causa: 'interrumpido', gravedad: 'media', trabajos: recuperados });
      return recuperados;
    }

    function iniciar() {
      if (temporizador !== null && temporizador !== 'detenido') return;
      recuperar();
      temporizador = setTimeout(pulso, 0);
      // Al cerrar o recargar la página se suelta el arriendo para que la carga siguiente no espere a que venza.
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('pagehide', () => {
          try { cambiar((r) => { if (r.arriendo && r.arriendo.pestana === pestana) r.arriendo = null; }); } catch (e) { /* sin almacenamiento */ }
        });
      }
    }
    function detener() {
      if (temporizador !== null && temporizador !== 'detenido') clearTimeout(temporizador);
      temporizador = 'detenido';
    }

    function suscribir(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    }

    return {
      CLAVE,
      estado, instantanea, paraValidador, mensajeInvitado,
      perfil, guardarPerfil, impresoras, cambiarImpresora,
      simulacion, configurarSimulacion, esSimulada,
      encolar, reintentar, reintentarFallidos, cancelar, listar, resumenCola,
      hojasDelEvento, contadores, restantesRollo, cambiarRollo,
      procesar: procesarUno, procesarTodo, recuperar, iniciar, detener, suscribir,
      errorDeGuardado: () => errorDeGuardado,
    };
  }

  // ───────────── Espera de confirmación de la impresión automática (hito 3b) ─────────────
  // Con impresión automática, el trabajo NO entra a la cola hasta que el invitado confirma su resultado. Mientras espera no gasta
  // hoja ni cuenta para el tope; `descartar()` lo borra sin rastro (el invitado tocó "Borrar y empezar de nuevo"); `confirmar()` lo
  // entrega a `alLiberar(datos)` (que lo encola) y también lo hace sola tras `ms` (red de seguridad: nunca depende del ajuste de
  // inactividad). Una sola espera a la vez; armar otra suelta la anterior (no se pierde lo prometido).
  //   opciones: { ms, alLiberar(datos), temporizador: { poner(fn, ms), quitar(id) } }  (el temporizador se pasa en las pruebas)
  function crearEspera(opciones) {
    const op = opciones || {};
    const poner = (op.temporizador && op.temporizador.poner) || ((f, ms) => setTimeout(f, ms));
    const quitar = (op.temporizador && op.temporizador.quitar) || ((id) => clearTimeout(id));
    const ms = entero(op.ms, 20000, 0, 600000);
    let pendiente = null;
    function soltar() {
      const p = pendiente;
      if (!p) return false;
      quitar(p.id);
      pendiente = null;
      // Si entregar falla, el error no puede romper la salida de la pantalla ni impedir armar la espera siguiente.
      try { if (typeof op.alLiberar === 'function') op.alLiberar(p.datos); } catch (e) { if (typeof op.alFallar === 'function') op.alFallar(e, p.datos); }
      return true;
    }
    return {
      armar(datos) { soltar(); const p = { datos, id: null }; pendiente = p; p.id = poner(soltar, ms); },
      confirmar: soltar,
      descartar() { if (!pendiente) return false; quitar(pendiente.id); pendiente = null; return true; },
      enEspera(clave) { return !!pendiente && (clave === undefined || (pendiente.datos && pendiente.datos.sesionId === clave)); },
    };
  }

  // ───────────── Respaldo (hito 3b): los conteos de hojas viajan en el respaldo y en "Exportar evento" ─────────────
  // Funciones sueltas (no necesitan el servicio ni la cabina abierta): `respaldo.js` las usa por su puerta y la pantalla
  // de respaldo vive en otra página. Solo tocan `contadores` y el ajuste de rollo; NUNCA la cola, el arriendo, la impresora
  // elegida ni la simulación. `almacen` por defecto es localStorage (las pruebas pasan uno en memoria).
  //   Datos: { version: 1, porEvento: { eventoId: { impresas } }, porImpresora: { impresoraId: { impresas, desdeCambio, cambioEn, rollos } },
  //            rollo: { hojasPorRollo, avisoRestantes } }
  // Por qué existe: el tope de hojas es por evento y el rollo es por impresora y se traspasa entre eventos; si no entran al
  // respaldo, restaurar o mover un evento a otro equipo reiniciaría el tope y el aviso de fin de rollo.
  const almacenDe = (a) => a || (typeof localStorage !== 'undefined' ? localStorage : almacenamientoEnMemoria());
  const nat = (x) => entero(x, 0, 0, 9999999);

  function limpiarDatosRespaldo(crudo) {
    if (!esObjeto(crudo)) return null;
    const porEvento = {};
    if (esObjeto(crudo.porEvento)) Object.keys(crudo.porEvento).forEach((id) => { if (id !== '__proto__' && esObjeto(crudo.porEvento[id])) porEvento[id] = { impresas: nat(crudo.porEvento[id].impresas) }; });
    const porImpresora = {};
    if (esObjeto(crudo.porImpresora)) Object.keys(crudo.porImpresora).forEach((id) => {
      const c = crudo.porImpresora[id];
      if (!esObjeto(c) || id === '__proto__') return;
      porImpresora[id] = { impresas: nat(c.impresas), desdeCambio: nat(c.desdeCambio), cambioEn: typeof c.cambioEn === 'string' ? c.cambioEn : null, rollos: nat(c.rollos) };
    });
    const rollo = esObjeto(crudo.rollo) ? { hojasPorRollo: entero(crudo.rollo.hojasPorRollo, 0, 0, 9999), avisoRestantes: entero(crudo.rollo.avisoRestantes, 30, 0, 999) } : null;
    return { version: 1, porEvento, porImpresora, rollo };
  }

  // ¿Es un bloque de datos de respaldo bien formado? (lo usa el validador del paquete: un respaldo con esto mal formado se rechaza)
  function datosRespaldoValidos(x) {
    if (x === null) return true;
    if (!esObjeto(x) || !esObjeto(x.porEvento) || !esObjeto(x.porImpresora)) return false;
    const num = (v) => typeof v === 'number' && isFinite(v) && v >= 0;
    if (!Object.keys(x.porEvento).every((k) => esObjeto(x.porEvento[k]) && num(x.porEvento[k].impresas))) return false;
    if (!Object.keys(x.porImpresora).every((k) => esObjeto(x.porImpresora[k]) && num(x.porImpresora[k].impresas) && num(x.porImpresora[k].desdeCambio))) return false;
    return x.rollo === undefined || x.rollo === null || (esObjeto(x.rollo) && num(x.rollo.hojasPorRollo));
  }

  function leerRegistroParaRespaldo(a) {
    let texto = null;
    try { texto = a.getItem(CLAVE); } catch (e) { texto = null; }
    if (!texto) return { registro: registroNuevo(), existe: false, ilegible: false };
    try { return { registro: normalizarRegistro(JSON.parse(texto)), existe: true, ilegible: false }; } catch (e) { return { registro: registroNuevo(), existe: true, ilegible: true }; }
  }

  // opciones: { almacen, eventoId } — con `eventoId` solo sale el conteo de ese evento (paquete de un evento; el rollo es del equipo).
  // El respaldo completo SIEMPRE trae la estructura (aunque vacía): así "Reemplazar" distingue un respaldo sin conteos de uno antiguo que no tiene el archivo.
  // Con `eventoId`, `datos` es null si ese evento no tiene hojas. `ilegible: true` si el registro del equipo está dañado (el respaldo lo avisa).
  function exportarParaRespaldo(opciones) {
    const op = opciones || {};
    const { registro, ilegible } = leerRegistroParaRespaldo(almacenDe(op.almacen));
    if (ilegible) return { ilegible: true, datos: null };
    const c = registro.contadores;
    let datos;
    if (op.eventoId) {
      datos = esObjeto(c.porEvento[op.eventoId]) ? { porEvento: { [op.eventoId]: c.porEvento[op.eventoId] }, porImpresora: {}, rollo: null } : null;
    } else {
      datos = { porEvento: c.porEvento, porImpresora: c.porImpresora, rollo: { hojasPorRollo: registro.perfil.hojasPorRollo, avisoRestantes: registro.perfil.avisoRestantes } };
    }
    return { ilegible: false, datos: datos ? limpiarDatosRespaldo(datos) : null };
  }

  // Instantánea para deshacer una restauración (texto exacto del registro, o null si no existía).
  function tomarInstantanea(a) { const al = almacenDe(a); try { return al.getItem(CLAVE); } catch (e) { return null; } }
  function devolverInstantanea(texto, a) {
    const al = almacenDe(a);
    if (texto === null || texto === undefined) al.removeItem(CLAVE); else al.setItem(CLAVE, texto);
  }

  // Aplica los datos de un respaldo. opciones: { modo: 'sumar' | 'reemplazar', eventoOrigen, eventoDestino, almacen }
  //   · 'reemplazar': los conteos (por evento y por impresora) y el ajuste de rollo quedan exactamente como el respaldo.
  //   · 'sumar': por evento gana el MAYOR (nunca se subestima lo gastado del tope); por impresora y rollo gana lo que ya está
  //     (el rollo es una cosa física de este equipo) y solo se trae lo que falta.
  //   · con `eventoDestino` (importar un evento): solo el conteo de ese evento, con el id final (puede ser una copia), y gana el mayor.
  // Lanza si no se puede leer o guardar el registro (el llamador deshace con la instantánea). No toca la cola.
  function importarDesdeRespaldo(datos, opciones) {
    const op = opciones || {};
    const d = limpiarDatosRespaldo(datos);
    if (!d) return { aplicado: false };
    const a = almacenDe(op.almacen);
    const { registro: r, ilegible } = leerRegistroParaRespaldo(a);
    // Un registro dañado nunca se pisa; tampoco frena el resto de la restauración: se avisa que el conteo no se restauró.
    if (ilegible) return { aplicado: false, ilegible: true };
    let eventos = 0, impresoras = 0;
    if (op.eventoDestino) {
      const origen = d.porEvento[op.eventoOrigen || op.eventoDestino];
      if (origen) {
        const local = (r.contadores.porEvento[op.eventoDestino] && r.contadores.porEvento[op.eventoDestino].impresas) || 0;
        r.contadores.porEvento[op.eventoDestino] = { ...(r.contadores.porEvento[op.eventoDestino] || {}), impresas: Math.max(local, origen.impresas) };
        eventos = 1;
      }
    } else if (op.modo === 'reemplazar') {
      r.contadores = { porEvento: copiar(d.porEvento), porImpresora: copiar(d.porImpresora) };
      if (d.rollo) { r.perfil.hojasPorRollo = d.rollo.hojasPorRollo; r.perfil.avisoRestantes = d.rollo.avisoRestantes; }
      eventos = Object.keys(d.porEvento).length; impresoras = Object.keys(d.porImpresora).length;
    } else {
      Object.keys(d.porEvento).forEach((id) => {
        const local = (r.contadores.porEvento[id] && r.contadores.porEvento[id].impresas) || 0;
        if (d.porEvento[id].impresas > local) { r.contadores.porEvento[id] = { ...(r.contadores.porEvento[id] || {}), impresas: d.porEvento[id].impresas }; eventos += 1; }
      });
      Object.keys(d.porImpresora).forEach((id) => { if (!r.contadores.porImpresora[id]) { r.contadores.porImpresora[id] = d.porImpresora[id]; impresoras += 1; } });
      if (d.rollo && !r.perfil.hojasPorRollo) { r.perfil.hojasPorRollo = d.rollo.hojasPorRollo; r.perfil.avisoRestantes = d.rollo.avisoRestantes; }
    }
    a.setItem(CLAVE, JSON.stringify(r));
    return { aplicado: true, eventos, impresoras };
  }

  return {
    CLAVE, VERSION, ESTADOS_OK, ESTADOS_PROBLEMA, ESTADOS_SIMULABLES, ESTADOS_ACTIVOS, MENSAJES_ESTADO, MODELOS, ORIGENES, CONFIG_BASE,
    AdaptadorImpresora, ImpresoraSimulada, crearServicio, almacenamientoEnMemoria,
    crearEspera, exportarParaRespaldo, importarDesdeRespaldo, datosRespaldoValidos, tomarInstantanea, devolverInstantanea,
  };
})();

// Almacén compartido de eventos, en localStorage (sin backend todavía). Cualquier página
// del panel de operador (lista de eventos, cabina, editor de plantillas) lee y escribe acá
// para que el evento elegido en 04-lista-eventos viaje al resto de la app.
//
// FORMATO v2 (hito 0.1b, docs/ARQUITECTURA_FLUJO.md §5.3): cada evento guarda `version: 2`, un id
// estable de texto, estado en singular (proximo / en-curso / archivado), `entrega` (modo, copias,
// impresionAuto), `plantillas` ({ habilitadas, porDefecto }), `ritmo`, `preferenciasDeEquipo`
// y fechas ISO. NO se guarda lo que se puede calcular: ni el n.º de fotos, ni el nombre de la
// plantilla, ni el conteo de sesiones (se derivan de la plantilla y del almacén de sesiones).
// `congelado` es la copia liviana de lo que se lanzó (la plantilla completa vive en IndexedDB,
// ver 01-camera-flow/almacen-sesiones.js).
//
// MIGRACIÓN v1 -> v2: automática al leer. Antes de sobrescribir se guarda una copia exacta de
// la clave vieja en CLAVE_RESPALDO (solo se crea si no existe). Es idempotente (un registro v2 no
// se vuelve a tocar), no pierde eventos y tolera datos corruptos o parciales sin lanzar errores.
//
// La interfaz sigue siendo síncrona (la conversión a promesas de la regla 7 del contrato queda
// para otro hito; ver shared/README.md, hallazgos abiertos).
//
// Cuando exista una capa de datos real (Fase E, docs/DSLRBOOTH_PRODUCT_CONTEXT.md §5.1.1),
// este archivo es el punto único a reemplazar.
(function (raiz) {
  'use strict';

  const VERSION = 2;
  const CLAVE_EVENTOS = 'fotocabina-eventos';
  const CLAVE_RESPALDO = 'fotocabina-eventos-respaldo-v1';
  const CLAVE_ACTIVO = 'fotocabina-evento-activo';
  const CLAVE_CONTADORES = 'fotocabina-eventos-contadores';

  const ESTADOS = ['proximo', 'en-curso', 'archivado'];
  const MODOS_ENTREGA = ['impresion', 'digital', 'ambos'];
  const MENSAJE_PAUSA_BASE = '¡Cambia de pose!';

  // Ajustes sueltos (formato plano que usa la cabina por dentro y para la cabina sin evento).
  const AJUSTES_BASE = {
    fotos: 3,
    cuenta: 3,
    pausa: 3,
    mensajePausa: MENSAJE_PAUSA_BASE,
    volver: 30,
    espejo: true,
  };

  // Eventos de ejemplo (solo cuando todavía no hay nada guardado). Sin plantilla real: "Lanzar"
  // queda bloqueado hasta asignarles una (decisión 1A).
  const EVENTOS_DEMO = [
    { id: 'ev-demo-casamiento', nombre: 'Casamiento de Juli y Fran', fecha: '2026-10-03', estado: 'proximo' },
    { id: 'ev-demo-cumple', nombre: 'Cumpleaños 15 de Mora', fecha: '2026-09-17', estado: 'en-curso', ritmo: { cuentaSeg: 5 } },
    { id: 'ev-demo-corporativo', nombre: 'Evento corporativo Nexa', fecha: '2026-08-22', estado: 'archivado' },
    { id: 'ev-demo-aniversario', nombre: 'Aniversario Bar Rústico', fecha: '2026-11-14', estado: 'proximo' },
  ];

  // ---------- Utilidades ----------

  const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const clonar = (valor) => JSON.parse(JSON.stringify(valor));
  const ahoraIso = () => new Date().toISOString();

  function textoONulo(v) { return typeof v === 'string' && v.trim() ? v : null; }
  function entero(v, defecto, min, max) {
    const n = typeof v === 'string' ? Number(v) : v;
    if (typeof n !== 'number' || !isFinite(n)) return defecto;
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  function fechaIso(v, respaldo) {
    if (typeof v === 'string' && v && !isNaN(Date.parse(v))) return v;
    return respaldo;
  }

  function uuid() {
    try {
      if (raiz.crypto && typeof raiz.crypto.randomUUID === 'function') return raiz.crypto.randomUUID();
    } catch (e) { /* sin crypto */ }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function nuevoId() {
    return `ev-${uuid()}`;
  }

  // ---------- Normalización y migración ----------

  const ESTADO_V1 = { proximos: 'proximo', proximo: 'proximo', 'en-curso': 'en-curso', archivados: 'archivado', archivado: 'archivado' };

  // Campos del formato v1 que se absorben o se descartan al migrar; el resto de lo que traiga el
  // registro se conserva tal cual (regla 4 del contrato: un lector no destruye lo que no entiende).
  const CAMPOS_V1 = ['ajustes', 'plantilla', 'plantillaId', 'sesiones', 'copias', 'impresionAuto'];

  function listaDeTextos(v) {
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : [];
  }

  // Devuelve un evento v2 completo a partir de un registro v1, v2 o parcial. Null si no es un objeto.
  // `cambio.valor` pasa a true si hubo que cambiar algo respecto de lo recibido.
  function normalizar(crudo, cambio) {
    if (!esObjeto(crudo)) { cambio.valor = true; return null; }
    const marca = ahoraIso();
    const esV2 = crudo.version === VERSION;
    if (!esV2) cambio.valor = true;

    const aj = esObjeto(crudo.ajustes) ? crudo.ajustes : {};
    // Ajustes que esta versión no entiende: se conservan en `ajustesExtra` (regla 4 del contrato).
    const CONOCIDOS = ['pin', 'cuenta', 'pausa', 'mensajePausa', 'volver', 'espejo', 'camaraId', 'fotos'];
    const ajustesExtra = esObjeto(crudo.ajustesExtra) ? { ...crudo.ajustesExtra } : {};
    Object.keys(aj).forEach((k) => { if (!CONOCIDOS.includes(k) && !(k in ajustesExtra)) ajustesExtra[k] = aj[k]; });
    const resto = {};
    Object.keys(crudo).forEach((k) => { if (!CAMPOS_V1.includes(k)) resto[k] = crudo[k]; });
    delete resto.pin;

    let id = textoONulo(crudo.id);
    if (!id) {
      id = typeof crudo.id === 'number' && isFinite(crudo.id) ? `ev-${crudo.id}` : nuevoId();
      cambio.valor = true;
    }

    // Estado: los plurales del formato anterior pasan a singular.
    const estado = ESTADO_V1[crudo.estado] || 'proximo';
    if (estado !== crudo.estado) cambio.valor = true;

    // Entrega: en v1 `entrega` era un texto y `copias` / `impresionAuto` campos sueltos.
    const entregaCruda = esObjeto(crudo.entrega) ? crudo.entrega : {};
    const modoV1 = typeof crudo.entrega === 'string' ? crudo.entrega : null;
    const modo = [entregaCruda.modo, modoV1].find((m) => MODOS_ENTREGA.includes(m)) || 'ambos';
    const entrega = {
      ...entregaCruda,
      modo,
      copias: entero(entregaCruda.copias !== undefined ? entregaCruda.copias : crudo.copias, 1, 1, 20),
      impresionAuto: typeof entregaCruda.impresionAuto === 'boolean' ? entregaCruda.impresionAuto : crudo.impresionAuto === true,
    };
    // Tope de hojas (hito 1.2): opcional; un valor que no sea un entero positivo se descarta (= sin tope).
    if ('topeHojas' in entrega) {
      // Primero se valida y después se acota: 0, negativos, decimales y texto no numérico NO son un tope (se descartan).
      const crudoTope = typeof entrega.topeHojas === 'string' && entrega.topeHojas.trim() ? Number(entrega.topeHojas) : entrega.topeHojas;
      if (typeof crudoTope === 'number' && isFinite(crudoTope) && Number.isInteger(crudoTope) && crudoTope >= 1) entrega.topeHojas = Math.min(99999, crudoTope);
      else delete entrega.topeHojas;
    }

    // Plantillas: `plantillaId` pasa a { habilitadas, porDefecto }.
    const pl = esObjeto(crudo.plantillas) ? crudo.plantillas : {};
    let habilitadas = listaDeTextos(pl.habilitadas);
    let porDefecto = textoONulo(pl.porDefecto);
    const idV1 = textoONulo(crudo.plantillaId);
    if (!esV2 && idV1) { porDefecto = idV1; habilitadas = [idV1]; }
    if (!porDefecto && habilitadas.length) porDefecto = habilitadas[0];
    if (porDefecto && !habilitadas.includes(porDefecto)) habilitadas = [...habilitadas, porDefecto];

    // Ritmo: cuenta / pausa / mensaje / volver pasan a ritmo.
    const r = esObjeto(crudo.ritmo) ? crudo.ritmo : {};
    const ritmo = {
      ...r,
      cuentaSeg: entero(r.cuentaSeg !== undefined ? r.cuentaSeg : aj.cuenta, AJUSTES_BASE.cuenta, 0, 60),
      pausaSeg: entero(r.pausaSeg !== undefined ? r.pausaSeg : aj.pausa, AJUSTES_BASE.pausa, 0, 60),
      mensajePausa: typeof r.mensajePausa === 'string' && r.mensajePausa ? r.mensajePausa : (typeof aj.mensajePausa === 'string' && aj.mensajePausa ? aj.mensajePausa : MENSAJE_PAUSA_BASE),
      pacienciaSeg: entero(r.pacienciaSeg !== undefined ? r.pacienciaSeg : aj.volver, AJUSTES_BASE.volver, 0, 600),
    };
    if (ritmo.mensajePausa === '¡Cambiá de pose!') ritmo.mensajePausa = MENSAJE_PAUSA_BASE; // voseo antiguo

    // Preferencias de equipo: cámara y espejo.
    const pe = esObjeto(crudo.preferenciasDeEquipo) ? crudo.preferenciasDeEquipo : {};
    const cam = esObjeto(pe.camara) ? pe.camara : {};
    const preferenciasDeEquipo = {
      ...pe,
      camara: {
        ...cam,
        referencia: textoONulo(cam.referencia !== undefined ? cam.referencia : aj.camaraId),
        espejo: typeof cam.espejo === 'boolean' ? cam.espejo : (typeof aj.espejo === 'boolean' ? aj.espejo : true),
      },
    };

    const creadoEn = fechaIso(crudo.creadoEn, marca);
    const evento = {
      ...resto,
      version: VERSION,
      id,
      cuentaId: textoONulo(crudo.cuentaId),
      equipoOrigen: textoONulo(crudo.equipoOrigen),
      nombre: typeof crudo.nombre === 'string' && crudo.nombre.trim() ? crudo.nombre : 'Evento sin nombre',
      fecha: typeof crudo.fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(crudo.fecha) ? crudo.fecha.slice(0, 10) : marca.slice(0, 10),
      estado,
      entrega,
      plantillas: { habilitadas, porDefecto },
      ritmo,
      preferenciasDeEquipo,
      apariencia: esObjeto(crudo.apariencia) ? crudo.apariencia : {},
      conservacion: { purgarTrasDias: null, ...(esObjeto(crudo.conservacion) ? crudo.conservacion : {}) },
      creadoEn,
      actualizadoEn: fechaIso(crudo.actualizadoEn, creadoEn),
    };
    if (!esV2 || !fechaIso(crudo.creadoEn, null) || !fechaIso(crudo.actualizadoEn, null)) cambio.valor = true;
    if (Object.keys(ajustesExtra).length) evento.ajustesExtra = ajustesExtra;
    if (esObjeto(crudo.congelado)) evento.congelado = crudo.congelado; else delete evento.congelado;
    return evento;
  }

  // Alias de compatibilidad (transitorio) para 03-editor-plantillas, que todavía lee y escribe
  // `evento.plantillaId`. Se entrega en la copia que devuelve obtener()/listar() pero NUNCA se guarda:
  // al guardar, si el que llama lo cambió respecto de lo que se le entregó, pasa a `plantillas`.
  const instantaneas = new WeakMap();

  function vista(evento) {
    const v = clonar(evento);
    v.plantillaId = v.plantillas.porDefecto;
    instantaneas.set(v, v.plantillaId);
    return v;
  }

  function aplicarAlias(entrada, normalizado) {
    if (!esObjeto(entrada) || !('plantillaId' in entrada)) return;
    const instantanea = instantaneas.has(entrada) ? instantaneas.get(entrada) : undefined;
    const id = textoONulo(entrada.plantillaId);
    // Con instantánea: solo cuenta si el que llama lo modificó. Sin ella (objeto armado a mano
    // con el formato antiguo) y sin `plantillas`, el alias es la plantilla elegida.
    const cambioElAlias = instantaneas.has(entrada) ? id !== instantanea : !esObjeto(entrada.plantillas);
    if (!cambioElAlias) return;
    normalizado.plantillas = {
      habilitadas: id ? Array.from(new Set([...(normalizado.plantillas.habilitadas || []), id])) : [],
      porDefecto: id,
    };
  }

  // ---------- Lectura / escritura del almacén ----------

  // Eventos que NO se pudieron guardar en localStorage (cuota llena, respaldo sin confirmar...). Mientras
  // existan, las lecturas usan esta copia en memoria, para que el evento no desaparezca en silencio, y
  // cada lectura o escritura reintenta guardarla.
  let pendiente = null;
  let ultimoError = null;

  function leerCrudo() {
    try {
      return { texto: localStorage.getItem(CLAVE_EVENTOS), error: false };
    } catch (e) {
      return { texto: null, error: true };
    }
  }

  // Devuelve true solo si el respaldo quedó confirmado (ya existía, o se guardó y se pudo releer).
  function respaldar(texto, clave) {
    try {
      if (texto == null) return false;
      if (localStorage.getItem(clave) == null) localStorage.setItem(clave, texto);
      return localStorage.getItem(clave) != null;
    } catch (e) {
      return false;
    }
  }

  // Aviso para el operador cuando algo no se pudo guardar: null si todo bien, o { motivo, mensaje }.
  // Las pantallas lo consultan después de guardar() / eliminar() / congelar().
  function errorDeGuardado() {
    return ultimoError;
  }

  // Única puerta de escritura. Antes de tocar la clave de eventos comprueba que lo que hay guardado se
  // pueda sobrescribir sin perder nada: si es v1 exige el respaldo confirmado (lo reintenta), y si está
  // dañado exige la copia `-danado`. Si no, NO escribe: los eventos quedan en memoria (`pendiente`).
  function persistir(eventos) {
    const { texto, error } = leerCrudo();
    if (error) {
      pendiente = eventos;
      ultimoError = { motivo: 'espacio', mensaje: 'No se pudo guardar en este equipo. Los cambios valen hasta que cierres esta página.' };
      return false;
    }
    if (texto != null) {
      let datos;
      try { datos = JSON.parse(texto); } catch (e) { datos = undefined; }
      let respaldado = true;
      if (!Array.isArray(datos)) respaldado = respaldar(texto, `${CLAVE_RESPALDO}-danado`);
      else if (datos.some((x) => !esObjeto(x) || x.version !== VERSION)) respaldado = respaldar(texto, CLAVE_RESPALDO);
      if (!respaldado) {
        pendiente = eventos;
        ultimoError = { motivo: 'respaldo', mensaje: 'No se pudo guardar una copia de seguridad de tus eventos, así que no se guardaron los cambios. Libera espacio del navegador e inténtalo de nuevo.' };
        return false;
      }
    }
    try {
      localStorage.setItem(CLAVE_EVENTOS, JSON.stringify(eventos));
    } catch (e) {
      pendiente = eventos;
      ultimoError = { motivo: 'espacio', mensaje: 'No hay espacio para guardar el evento en este equipo. Libera espacio del navegador e inténtalo de nuevo.' };
      return false;
    }
    pendiente = null;
    ultimoError = null;
    return true;
  }

  function eventosDemo() {
    return EVENTOS_DEMO.map((d) => normalizar(d, { valor: false }));
  }

  // Devuelve los eventos ya en v2. Migra una sola vez si hace falta (solo si el respaldo se confirma).
  function leerTodos() {
    if (pendiente) { const guardados = pendiente; persistir(guardados); return guardados; }
    const { texto, error } = leerCrudo();
    if (error) return eventosDemo();
    if (texto == null) {
      const demo = eventosDemo();
      persistir(demo);
      return demo;
    }
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch (e) {
      datos = undefined;
    }
    if (!Array.isArray(datos)) {
      // Dañado: no se puede recuperar nada; el texto original se deja a un lado y no se sobrescribe sin esa copia.
      respaldar(texto, `${CLAVE_RESPALDO}-danado`);
      return [];
    }
    const cambio = { valor: false };
    const vistos = new Set();
    const eventos = [];
    datos.forEach((crudo) => {
      const e = normalizar(crudo, cambio);
      if (!e) return;
      if (vistos.has(e.id)) { e.id = nuevoId(); cambio.valor = true; } // id repetido: no se pierde ninguno
      vistos.add(e.id);
      eventos.push(e);
    });
    if (cambio.valor) persistir(eventos); // sin respaldo confirmado no escribe: quedan en memoria y se reintenta
    return eventos;
  }

  function listar() {
    return leerTodos().map(vista);
  }

  function obtener(id) {
    const e = leerTodos().find((x) => x.id === id);
    return e ? vista(e) : null;
  }

  // Guarda (o crea) un evento. Acepta el formato v2 y, mientras exista, el alias `plantillaId`.
  function guardar(evento) {
    const cambio = { valor: false };
    const e = normalizar(evento, cambio);
    if (!e) return null;
    aplicarAlias(evento, e);
    e.actualizadoEn = ahoraIso();
    const eventos = leerTodos();
    const indice = eventos.findIndex((x) => x.id === e.id);
    if (indice >= 0) eventos[indice] = e;
    else eventos.unshift(e);
    persistir(eventos);
    return vista(e);
  }

  // Borra el evento, su contador de sesiones y, si era el activo, lo suelta. Las sesiones y sus
  // archivos se borran aparte (AlmacenSesiones.borrarDeEvento, en IndexedDB): quien elimina un
  // evento debe llamar primero a esa función (04-lista-eventos lo hace).
  function eliminar(id) {
    persistir(leerTodos().filter((e) => e.id !== id));
    const c = leerContadores();
    if (id in c) { delete c[id]; guardarContadores(c); }
    try { if (localStorage.getItem(CLAVE_ACTIVO) === id) localStorage.removeItem(CLAVE_ACTIVO); } catch (e) { /* sin persistencia */ }
  }

  // ---------- Creación y duplicado ----------

  function entregaPorDefecto() {
    return { modo: 'impresion', copias: 1, impresionAuto: false };
  }

  // Arma un evento v2 nuevo (sin guardar). `datos` puede traer: nombre, fecha, plantillaId, entrega
  // ({ modo, copias, impresionAuto }), ritmo, preferenciasDeEquipo.
  function crear(datos) {
    const d = esObjeto(datos) ? datos : {};
    const base = {
      version: VERSION,
      id: nuevoId(),
      nombre: d.nombre,
      fecha: d.fecha,
      estado: 'proximo',
      entrega: { ...entregaPorDefecto(), ...(esObjeto(d.entrega) ? d.entrega : {}) },
      plantillas: { habilitadas: d.plantillaId ? [d.plantillaId] : [], porDefecto: d.plantillaId || null },
      ritmo: d.ritmo,
      preferenciasDeEquipo: d.preferenciasDeEquipo,
      creadoEn: ahoraIso(),
      actualizadoEn: ahoraIso(),
    };
    return normalizar(base, { valor: false });
  }

  // Copia completa de un evento (todo lo que lo define, incluida la entrega y las copias), con id
  // nuevo, estado "proximo" y sin lo que pertenece a un lanzamiento (congelado). Sin guardar.
  function duplicar(evento) {
    const origen = normalizar(evento, { valor: false });
    if (!origen) return null;
    aplicarAlias(evento, origen);
    const copia = clonar(origen);
    copia.id = nuevoId();
    copia.nombre = `${origen.nombre} (copia)`;
    copia.estado = 'proximo';
    delete copia.congelado;
    copia.creadoEn = ahoraIso();
    copia.actualizadoEn = copia.creadoEn;
    return copia;
  }

  // ---------- Ajustes en el formato plano de la cabina ----------

  function ajustesPorDefecto() {
    return { ...AJUSTES_BASE };
  }

  // Ritmo y preferencias del evento, en la forma plana que usa la cabina por dentro:
  // { cuenta, pausa, mensajePausa, volver, espejo, camaraId }.
  function ajustesDeEvento(evento) {
    const e = normalizar(evento, { valor: false });
    const cam = e.preferenciasDeEquipo.camara;
    return {
      cuenta: e.ritmo.cuentaSeg,
      pausa: e.ritmo.pausaSeg,
      mensajePausa: e.ritmo.mensajePausa,
      volver: e.ritmo.pacienciaSeg,
      espejo: cam.espejo,
      camaraId: cam.referencia,
    };
  }

  // Pasa los ajustes planos de la cabina al evento (sin guardar). Devuelve el mismo evento.
  function aplicarAjustes(evento, aj) {
    if (!esObjeto(evento) || !esObjeto(aj)) return evento;
    evento.ritmo = { ...(evento.ritmo || {}), cuentaSeg: aj.cuenta, pausaSeg: aj.pausa, mensajePausa: aj.mensajePausa, pacienciaSeg: aj.volver };
    const pe = evento.preferenciasDeEquipo || {};
    evento.preferenciasDeEquipo = { ...pe, camara: { ...(pe.camara || {}), referencia: aj.camaraId !== undefined ? (aj.camaraId || null) : ((pe.camara || {}).referencia || null), espejo: aj.espejo !== undefined ? !!aj.espejo : (pe.camara || {}).espejo !== false } };
    return evento;
  }

  // ---------- Congelado del lanzamiento ----------

  // Guarda en el evento la copia liviana de lo que se lanzó. Lee el evento fresco del almacén
  // (no pisa otros cambios). `congelado` = { plantilla: { id, huella, nombre }, config, congeladoEn }.
  function congelar(id, congelado) {
    const eventos = leerTodos();
    const e = eventos.find((x) => x.id === id);
    if (!e || !esObjeto(congelado)) return null;
    e.congelado = { ...clonar(congelado), congeladoEn: ahoraIso() };
    e.actualizadoEn = ahoraIso();
    persistir(eventos);
    return vista(e);
  }

  // ---------- Contador de sesiones por evento (nunca repite un número) ----------

  function leerContadores() {
    try {
      const c = JSON.parse(localStorage.getItem(CLAVE_CONTADORES) || '{}');
      return esObjeto(c) ? c : {};
    } catch (e) {
      return {};
    }
  }

  function guardarContadores(c) {
    try { localStorage.setItem(CLAVE_CONTADORES, JSON.stringify(c)); } catch (e) { /* sin persistencia */ }
  }

  // Entrega el próximo n.º de sesión del evento y lo deja anotado. `minimo` es el n.º más alto ya
  // visto en las sesiones guardadas (sirve la primera vez, con sesiones de antes de existir el
  // contador): el número entregado es siempre mayor que el contador y que `minimo`.
  function siguienteNumeroSesion(eventoId, minimo) {
    const c = leerContadores();
    const previo = Number.isFinite(c[eventoId]) ? c[eventoId] : 0;
    const base = Math.max(previo, Number.isFinite(minimo) ? minimo : 0);
    const n = base + 1;
    c[eventoId] = n;
    guardarContadores(c);
    return n;
  }

  // ---------- Respaldo: PIN del formato anterior ----------
  // Los eventos v1 podían traer un PIN propio. La cabina lo pasa al Equipo una vez; como la
  // migración a v2 lo quita de los eventos, se busca en el respaldo de la clave vieja.

  function pinAntiguoDelRespaldo() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_RESPALDO) || 'null');
      if (!Array.isArray(datos)) return null;
      for (const e of datos) {
        const pin = esObjeto(e) && esObjeto(e.ajustes) ? e.ajustes.pin : null;
        if (typeof pin === 'string' && /^\d{4}$/.test(pin) && pin !== '1234') return pin;
      }
    } catch (e) { /* respaldo ilegible */ }
    return null;
  }

  // Quita los PIN del respaldo (ya no deben quedar en claro); el resto del respaldo no se toca.
  function limpiarPinsDelRespaldo() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_RESPALDO) || 'null');
      if (!Array.isArray(datos)) return;
      let cambio = false;
      datos.forEach((e) => { if (esObjeto(e) && esObjeto(e.ajustes) && 'pin' in e.ajustes) { delete e.ajustes.pin; cambio = true; } });
      if (cambio) localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(datos));
    } catch (e) { /* respaldo ilegible */ }
  }

  // ---------- Evento activo ----------
  // El que se lanzó por última vez desde la lista de eventos. Otras páginas (hoy la cabina) lo
  // leen al abrir. Sin ninguno, esas páginas siguen con sus valores generales de siempre.

  function setActivo(id) {
    try {
      localStorage.setItem(CLAVE_ACTIVO, id);
    } catch (e) {
      // sin persistencia disponible
    }
  }

  function obtenerActivo() {
    let id = null;
    try {
      id = localStorage.getItem(CLAVE_ACTIVO);
    } catch (e) {
      return null;
    }
    if (!id) return null;
    return obtener(id);
  }

  function limpiarActivo() {
    try {
      localStorage.removeItem(CLAVE_ACTIVO);
    } catch (e) {
      // sin persistencia disponible
    }
  }

  raiz.AlmacenEventos = {
    VERSION,
    ESTADOS,
    MODOS_ENTREGA,
    listar,
    obtener,
    guardar,
    eliminar,
    crear,
    duplicar,
    nuevoId,
    ajustesPorDefecto,
    ajustesDeEvento,
    aplicarAjustes,
    congelar,
    siguienteNumeroSesion,
    pinAntiguoDelRespaldo,
    limpiarPinsDelRespaldo,
    errorDeGuardado,
    setActivo,
    obtenerActivo,
    limpiarActivo,
  };
})(window);

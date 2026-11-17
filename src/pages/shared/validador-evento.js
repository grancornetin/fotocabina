/*
  Validador de evento: "¿este evento está listo para lanzar?" (hito 0.3, docs/ARQUITECTURA_FLUJO.md §2.3, §2.4 y §2.5).

  Es una función PURA: no tiene pantalla, no toca el DOM ni el almacenamiento y NUNCA consulta hardware.
  Recibe una foto del estado ya resuelto y devuelve el veredicto. Si una regla cambia, se cambia aquí y en ningún otro lugar.

  Entrada de ValidadorEvento.validar(entrada):
    equipo : { pin: { definido: boolean }, servidorLocal: boolean }   (todo opcional; sin dato, la regla no se evalúa)
    evento : evento v2 de shared/almacen-eventos.js (un evento v1 sin migrar se bloquea)
    plantilla : la plantilla ya resuelta por quien llama
        - objeto = la plantilla que se leyó (se revisa con MotorPlantillas.validarPlantilla, no se duplica esa lógica)
        - null / undefined = no existe (o el evento no tiene ninguna asignada)
        - ValidadorEvento.ILEGIBLE = existe algo pero no se pudo leer (almacén dañado, error de lectura)
    vivo : foto del estado en vivo, ya resuelto por quien llama
        camaras : arreglo de { id, etiqueta, anchoPx, altoPx, activa } | null (null = no se pudo saber; [] = no hay ninguna)
        impresora : { estado, segundosPorHoja, medios: [{ anchoMm, altoMm }] } | null (null = no se puede detectar, caso del navegador)
        espacioLibreMB : número | null

  Salida: { listo, configuracion, bloqueos[], avisos[], ritmo }.
    Cada bloqueo/aviso: { codigo, gravedad: 'bloqueo' | 'aviso', grupo, mensaje, accion: { etiqueta, destino } }.
    Los códigos son estables (CODIGOS) y los destinos también (DESTINOS): las pantallas deciden cómo llevar a cada destino.

  Depende solo de MotorPlantillas (shared/motor-plantillas.js) para revisar la plantilla; si no está cargado, la plantilla
  se bloquea con un mensaje claro en vez de fallar.
*/
const ValidadorEvento = (() => {
  'use strict';

  const ILEGIBLE = Object.freeze({ ilegible: true });

  // Constantes del cálculo de ritmo (2.5). Son estimaciones: se ajustarán al medirlas en el ensayo real (hito 1.4).
  const RITMO = Object.freeze({
    REVISION_SEG: 10,   // el invitado revisa sus fotos antes de armar la tira
    COMPOSICION_SEG: 5, // armar la tira y el GIF
  });

  // Umbrales de disco (una sesión con fotos, tira y GIF pesa entre 5 y 15 MB).
  const UMBRALES = Object.freeze({
    DISCO_BLOQUEO_MB: 200,  // por debajo, caben unas pocas sesiones: no se lanza
    DISCO_AVISO_MB: 1000,   // por debajo, avisa para liberar espacio antes del evento
    MARGEN_MM: 1.5,         // tolerancia al comparar medidas de papel
  });

  const DESTINOS = Object.freeze({
    EDITOR: 'editor-plantillas',
    LISTA: 'lista-eventos',
    EDITAR_EVENTO: 'editar-evento',
    CAMARA: 'ajustes-camara',
    CONECTAR_CAMARA: 'conectar-camara',
    IMPRESORA: 'ajustes-impresora',
    PIN: 'crear-pin',
    EQUIPO: 'ajustes-equipo',
  });

  const CODIGOS = Object.freeze([
    'EVENTO_NO_VALIDO', 'EVENTO_FORMATO_ANTIGUO', 'EVENTO_ARCHIVADO',
    'PLANTILLA_SIN_ASIGNAR', 'PLANTILLA_NO_ENCONTRADA', 'PLANTILLA_ILEGIBLE', 'PLANTILLA_DANADA', 'PLANTILLA_SIN_FOTOS',
    'SIN_CAMARA', 'IMPRESORA_CON_PROBLEMA', 'DISCO_LLENO',
    'CAMARA_NO_COMPROBADA', 'IMPRESORA_NO_COMPROBABLE', 'PAPEL_DISTINTO', 'RESOLUCION_JUSTA', 'IMPRESION_MAS_LENTA_QUE_SESION',
    'PLANTILLA_SOLO_COPIA_CONGELADA', 'PIN_SIN_CREAR', 'DISCO_POCO', 'TOPE_NO_APLICA', 'DIGITAL_SIN_SERVIDOR',
  ]);

  const MODOS = ['impresion', 'digital', 'ambos'];
  const ESTADOS_IMPRESORA_OK = ['lista', 'ocupada', 'imprimiendo', 'ok'];
  // Estado que la impresora no sabe informar: es "no comprobable" (aviso), nunca un bloqueo.
  const ESTADOS_IMPRESORA_SIN_DATO = ['desconocido', 'unknown'];
  const MENSAJES_IMPRESORA = {
    'sin-papel': 'A la impresora se le acabó el papel.',
    'sin-cinta': 'A la impresora se le acabó la cinta.',
    'desconectada': 'La impresora está desconectada.',
    'tapa-abierta': 'La impresora tiene la tapa abierta.',
    'atascada': 'El papel de la impresora está atascado.',
    'error': 'La impresora informa un error.',
  };

  const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const esNumero = (x) => typeof x === 'number' && isFinite(x);
  const entero = (x, defecto) => (esNumero(x) ? Math.round(x) : defecto);
  const sinPunto = (t) => String(t || '').replace(/\.+$/, '');
  const enMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const enPulgadas = (mm) => String(Math.round((mm / 25.4) * 10) / 10).replace('.', ',');
  const medidas = (a, b) => `${enPulgadas(a)} × ${enPulgadas(b)} in`;

  function item(codigo, gravedad, grupo, mensaje, etiqueta, destino) {
    return { codigo, gravedad, grupo, mensaje, accion: { etiqueta, destino } };
  }
  const bloqueo = (codigo, grupo, mensaje, etiqueta, destino) => item(codigo, 'bloqueo', grupo, mensaje, etiqueta, destino);
  const aviso = (codigo, grupo, mensaje, etiqueta, destino) => item(codigo, 'aviso', grupo, mensaje, etiqueta, destino);

  // Hoja física que se imprime: una tira 2×6 que se duplica ocupa una hoja del doble de ancho (igual que MotorPlantillas.renderizarHoja).
  function hojaDe(papel) {
    if (!papel) return null;
    const vertical = papel.anchoMm <= 51 && papel.altoMm >= 150;
    const apaisada = papel.altoMm <= 51 && papel.anchoMm >= 150;
    const duplica = !!papel.duplicarEnHoja && (vertical || apaisada);
    if (!duplica) return { anchoMm: papel.anchoMm, altoMm: papel.altoMm, duplica: false };
    return { anchoMm: vertical ? papel.anchoMm * 2 : papel.anchoMm, altoMm: vertical ? papel.altoMm : papel.altoMm * 2, duplica: true };
  }

  const mismaMedida = (a, b) => Math.abs(a - b) <= UMBRALES.MARGEN_MM;
  const coincideMedio = (hoja, medio) =>
    esObjeto(medio) && ((mismaMedida(hoja.anchoMm, medio.anchoMm) && mismaMedida(hoja.altoMm, medio.altoMm)) ||
                        (mismaMedida(hoja.anchoMm, medio.altoMm) && mismaMedida(hoja.altoMm, medio.anchoMm)));

  // ---------- Reglas del evento ----------

  function revisarEvento(evento, bloqueos) {
    if (!esObjeto(evento)) { bloqueos.push(bloqueo('EVENTO_NO_VALIDO', 'evento', 'No se encontró el evento.', 'Volver a la lista', DESTINOS.LISTA)); return false; }
    if (evento.version !== 2) {
      bloqueos.push(bloqueo('EVENTO_FORMATO_ANTIGUO', 'evento', 'Este evento está en un formato antiguo: ábrelo desde la lista de eventos para que se actualice.', 'Ir a la lista', DESTINOS.LISTA));
      return false;
    }
    if (evento.estado === 'archivado') {
      bloqueos.push(bloqueo('EVENTO_ARCHIVADO', 'evento', 'Este evento está archivado: reábrelo para poder lanzarlo.', 'Ir a la lista', DESTINOS.LISTA));
    }
    return true;
  }

  // Devuelve la plantilla lista para usar (o null) y agrega el bloqueo que corresponda.
  function revisarPlantilla(evento, plantilla, bloqueos, avisos) {
    const asignada = !!(evento && evento.plantillas && evento.plantillas.porDefecto);
    const alEditor = 'Abrir el editor';
    if (plantilla === ILEGIBLE || (esObjeto(plantilla) && plantilla.ilegible === true)) {
      bloqueos.push(bloqueo('PLANTILLA_ILEGIBLE', 'plantilla', 'No se pudo leer la plantilla de este evento. Elige o crea una en el editor.', alEditor, DESTINOS.EDITOR));
      return null;
    }
    if (plantilla === null || plantilla === undefined) {
      const huella = evento && evento.congelado && evento.congelado.plantilla && evento.congelado.plantilla.huella;
      if (asignada && huella) {
        // El evento ya se lanzó y conserva su copia congelada: la cabina lo abre con esa copia, así que no se bloquea.
        avisos.push(aviso('PLANTILLA_SOLO_COPIA_CONGELADA', 'plantilla', 'La plantilla de este evento ya no existe en el editor: se usará la copia guardada al lanzarlo.', 'Abrir el editor', DESTINOS.EDITOR));
        return null;
      }
      if (asignada) bloqueos.push(bloqueo('PLANTILLA_NO_ENCONTRADA', 'plantilla', 'La plantilla de este evento ya no existe. Elige o crea una en el editor.', alEditor, DESTINOS.EDITOR));
      else bloqueos.push(bloqueo('PLANTILLA_SIN_ASIGNAR', 'plantilla', 'Este evento todavía no tiene una plantilla. Elige o crea una en el editor para poder lanzarlo.', alEditor, DESTINOS.EDITOR));
      return null;
    }
    const motor = (typeof MotorPlantillas !== 'undefined') ? MotorPlantillas : null;
    if (!esObjeto(plantilla) || !motor) {
      bloqueos.push(bloqueo('PLANTILLA_DANADA', 'plantilla', !motor ? 'No se pudo revisar la plantilla porque faltan componentes de la aplicación.' : 'La plantilla de este evento está dañada. Elige o crea una en el editor.', alEditor, DESTINOS.EDITOR));
      return null;
    }
    const v = motor.validarPlantilla(plantilla);
    if (v.valida) return plantilla;
    const sinFotos = Array.isArray(plantilla.elementos) && motor.contarFotos(plantilla) === 0 && v.motivos.length === 1;
    if (sinFotos) bloqueos.push(bloqueo('PLANTILLA_SIN_FOTOS', 'plantilla', 'La plantilla de este evento no tiene ningún espacio de foto. Agrégale uno en el editor.', alEditor, DESTINOS.EDITOR));
    else bloqueos.push(bloqueo('PLANTILLA_DANADA', 'plantilla', `Este evento no tiene una plantilla válida: ${enMinuscula(v.motivos.map(sinPunto).join('; '))}. Elige o crea una en el editor.`, alEditor, DESTINOS.EDITOR));
    return null;
  }

  // ---------- Configuración efectiva ----------

  function configuracionEfectiva(evento, plantilla) {
    const e = esObjeto(evento) ? evento : {};
    const entrega = esObjeto(e.entrega) ? e.entrega : {};
    const ritmo = esObjeto(e.ritmo) ? e.ritmo : {};
    const modo = MODOS.includes(entrega.modo) ? entrega.modo : 'ambos';
    const imprime = modo !== 'digital';
    const tope = esNumero(entrega.topeHojas) && entrega.topeHojas > 0 ? Math.round(entrega.topeHojas) : null;
    const papel = plantilla && esObjeto(plantilla.papel)
      ? { anchoMm: plantilla.papel.anchoMm, altoMm: plantilla.papel.altoMm, ppp: plantilla.papel.ppp || 300, duplicarEnHoja: !!plantilla.papel.duplicarEnHoja }
      : null;
    const fotos = plantilla && typeof MotorPlantillas !== 'undefined' ? MotorPlantillas.contarFotos(plantilla) : null;
    const cfg = {
      fotos,
      papel,
      modo,
      copias: Math.max(1, entero(entrega.copias, 1)),
      cuentaSeg: Math.max(0, entero(ritmo.cuentaSeg, 3)),
      pausaSeg: Math.max(0, entero(ritmo.pausaSeg, 3)),
      impresionAuto: imprime && entrega.impresionAuto === true,
      // El tope solo vale si el evento también entrega fotos digitales (respuesta del dueño, 2026-11-16).
      topeHojas: modo === 'ambos' ? tope : null,
      resumen: '',
    };
    cfg.resumen = textoResumen(cfg);
    return cfg;
  }

  function textoResumen(cfg) {
    const partes = [];
    if (cfg.fotos !== null) partes.push(`${cfg.fotos} ${cfg.fotos === 1 ? 'foto' : 'fotos'}`);
    if (cfg.modo === 'digital') { partes.push('solo entrega digital'); return partes.join(', ') || 'Sin plantilla'; }
    if (cfg.papel) {
      const hoja = hojaDe(cfg.papel);
      partes.push(hoja.duplica
        ? `tira ${medidas(cfg.papel.anchoMm, cfg.papel.altoMm)} duplicada en hoja ${medidas(hoja.anchoMm, hoja.altoMm)}`
        : `papel ${medidas(cfg.papel.anchoMm, cfg.papel.altoMm)}`);
    }
    partes.push(`${cfg.copias} ${cfg.copias === 1 ? 'copia' : 'copias'}`);
    partes.push(cfg.modo === 'ambos' ? 'impresión y digital' : 'solo impresión');
    return partes.join(', ');
  }

  // ---------- Ritmo (2.5) ----------

  // Segundos por sesión = fotos × cuenta + (fotos − 1) × pausa + revisión + composición.
  function calcularRitmo(cfg, impresora) {
    if (cfg.fotos === null || cfg.fotos < 1) {
      return { disponible: false, segundosPorSesion: null, sesionesPorHora: null, impresion: null, texto: 'Sin plantilla válida no se puede calcular el ritmo.' };
    }
    const segundosPorSesion = cfg.fotos * cfg.cuentaSeg + Math.max(0, cfg.fotos - 1) * cfg.pausaSeg + RITMO.REVISION_SEG + RITMO.COMPOSICION_SEG;
    if (!(segundosPorSesion > 0) || !isFinite(segundosPorSesion)) {
      return { disponible: false, segundosPorSesion: null, sesionesPorHora: null, impresion: null, texto: 'No se puede calcular el ritmo con estos valores.' };
    }
    const sesionesPorHora = Math.floor(3600 / segundosPorSesion);
    let impresion = null;
    let cola = '';
    if (cfg.modo !== 'digital') {
      const segHoja = impresora && esNumero(impresora.segundosPorHoja) && impresora.segundosPorHoja > 0 ? impresora.segundosPorHoja : null;
      if (segHoja === null) {
        impresion = { estado: 'sin-dato', segundosPorSesion: null, texto: 'sin dato de la impresora' };
        cola = 'sin dato de la impresora';
      } else {
        const seg = segHoja * cfg.copias;
        const masLenta = seg > segundosPorSesion;
        impresion = { estado: masLenta ? 'mas-lenta' : 'alcanza', segundosPorSesion: seg, texto: masLenta ? 'la impresora tarda más que la sesión' : 'la impresora alcanza' };
        cola = impresion.texto;
      }
    }
    const texto = `≈ ${segundosPorSesion} s por sesión · ≈ ${sesionesPorHora} sesiones por hora${cola ? ' · ' + cola : ''}`;
    return { disponible: true, segundosPorSesion, sesionesPorHora, impresion, texto };
  }

  // ---------- Avisos que dependen de datos en vivo ----------

  function revisarCamaras(vivo, plantilla, cfg, bloqueos, avisos) {
    const camaras = vivo.camaras;
    if (camaras === null || camaras === undefined) {
      avisos.push(aviso('CAMARA_NO_COMPROBADA', 'camara', 'Todavía no se comprobó la cámara: conéctala para confirmar que funciona.', 'Conectar la cámara', DESTINOS.CONECTAR_CAMARA));
      return;
    }
    if (!Array.isArray(camaras) || camaras.length === 0) {
      bloqueos.push(bloqueo('SIN_CAMARA', 'camara', 'No hay ninguna cámara conectada.', 'Conectar la cámara', DESTINOS.CONECTAR_CAMARA));
      return;
    }
    if (!plantilla || typeof MotorPlantillas === 'undefined' || !cfg.papel) return;
    // Resolución: solo si la cámara informa su tamaño. Se usa la cámara activa; sin una activa, la de mayor tamaño.
    const conDato = camaras.filter((c) => esObjeto(c) && esNumero(c.anchoPx) && esNumero(c.altoPx) && c.anchoPx > 0 && c.altoPx > 0);
    const cam = conDato.find((c) => c.activa) || conDato.sort((a, b) => b.anchoPx * b.altoPx - a.anchoPx * a.altoPx)[0];
    if (!cam) return;
    const espacios = MotorPlantillas.espaciosDeFoto(plantilla);
    if (!espacios.length) return;
    const grande = espacios.reduce((m, e) => (e.anchoMm * e.altoMm > m.anchoMm * m.altoMm ? e : m), espacios[0]);
    const ppp = cfg.papel.ppp;
    const needW = Math.round(grande.anchoMm / 25.4 * ppp);
    const needH = Math.round(grande.altoMm / 25.4 * ppp);
    // La cabina recorta la imagen de la cámara a la proporción del espacio de foto (sin estirar).
    const r = grande.proporcion > 0 ? grande.proporcion : 1;
    const util = (cam.anchoPx / cam.altoPx >= r) ? { w: cam.altoPx * r, h: cam.altoPx } : { w: cam.anchoPx, h: cam.anchoPx / r };
    if (util.w < needW || util.h < needH) {
      avisos.push(aviso('RESOLUCION_JUSTA', 'camara', `La cámara entrega unos ${Math.round(util.w)} × ${Math.round(util.h)} px para la foto más grande y la plantilla pide ${needW} × ${needH} px: puede verse con menos nitidez.`, 'Ajustes de cámara', DESTINOS.CAMARA));
    }
  }

  function revisarImpresora(vivo, cfg, ritmo, bloqueos, avisos) {
    if (cfg.modo === 'digital') return; // solo digital: ni la mira
    const imp = vivo.impresora;
    if (!esObjeto(imp) || typeof imp.estado !== 'string' || !imp.estado || ESTADOS_IMPRESORA_SIN_DATO.includes(imp.estado.toLowerCase())) {
      avisos.push(aviso('IMPRESORA_NO_COMPROBABLE', 'impresora', 'No se puede comprobar la impresora desde el navegador: revisa a mano que tenga papel y cinta antes de empezar.', 'Ajustes de impresora', DESTINOS.IMPRESORA));
      return;
    }
    if (!ESTADOS_IMPRESORA_OK.includes(imp.estado)) {
      // Decisión D2 del dueño: tanto "solo impresión" como "impresión y digital" bloquean si la impresora tiene un problema.
      bloqueos.push(bloqueo('IMPRESORA_CON_PROBLEMA', 'impresora', `${MENSAJES_IMPRESORA[imp.estado] || 'La impresora tiene un problema.'} Arréglalo antes de lanzar.`, 'Ajustes de impresora', DESTINOS.IMPRESORA));
      return;
    }
    if (cfg.papel && Array.isArray(imp.medios) && imp.medios.length) {
      const hoja = hojaDe(cfg.papel);
      if (!imp.medios.some((m) => coincideMedio(hoja, m))) {
        avisos.push(aviso('PAPEL_DISTINTO', 'impresora', `El papel de la plantilla (${medidas(hoja.anchoMm, hoja.altoMm)}) no está entre los que admite la impresora.`, 'Ajustes de impresora', DESTINOS.IMPRESORA));
      }
    }
    if (ritmo.impresion && ritmo.impresion.estado === 'mas-lenta') {
      avisos.push(aviso('IMPRESION_MAS_LENTA_QUE_SESION', 'impresora', `Imprimir ${cfg.copias} ${cfg.copias === 1 ? 'hoja' : 'hojas'} tarda más que una sesión: la fila de impresión va a crecer.`, 'Cambiar las copias', DESTINOS.EDITAR_EVENTO));
    }
  }

  function revisarDisco(vivo, bloqueos, avisos) {
    const mb = vivo.espacioLibreMB;
    if (!esNumero(mb)) return;
    if (mb < UMBRALES.DISCO_BLOQUEO_MB) {
      bloqueos.push(bloqueo('DISCO_LLENO', 'disco', `Queda muy poco espacio en el equipo (${Math.max(0, Math.round(mb))} MB): libera espacio antes de lanzar.`, 'Ajustes del equipo', DESTINOS.EQUIPO));
    } else if (mb < UMBRALES.DISCO_AVISO_MB) {
      avisos.push(aviso('DISCO_POCO', 'disco', `Queda poco espacio en el equipo (${Math.round(mb)} MB): conviene liberar espacio antes del evento.`, 'Ajustes del equipo', DESTINOS.EQUIPO));
    }
  }

  // ---------- Función principal ----------

  function validar(entrada) {
    const ent = esObjeto(entrada) ? entrada : {};
    const equipo = esObjeto(ent.equipo) ? ent.equipo : {};
    const vivo = esObjeto(ent.vivo) ? ent.vivo : {};
    const evento = ent.evento;
    const bloqueos = [];
    const avisos = [];

    const eventoUsable = revisarEvento(evento, bloqueos);
    const plantilla = eventoUsable ? revisarPlantilla(evento, ent.plantilla, bloqueos, avisos) : null;
    const cfg = configuracionEfectiva(eventoUsable ? evento : null, plantilla);
    const ritmo = calcularRitmo(cfg, esObjeto(vivo.impresora) ? vivo.impresora : null);

    if (eventoUsable) {
      revisarCamaras(vivo, plantilla, cfg, bloqueos, avisos);
      revisarImpresora(vivo, cfg, ritmo, bloqueos, avisos);
      revisarDisco(vivo, bloqueos, avisos);

      const entrega = esObjeto(evento.entrega) ? evento.entrega : {};
      const topeCrudo = esNumero(entrega.topeHojas) && entrega.topeHojas > 0;
      if (topeCrudo && cfg.modo === 'impresion') {
        avisos.push(aviso('TOPE_NO_APLICA', 'entrega', 'El tope de impresiones solo vale si el evento también entrega fotos digitales: en solo impresión no se aplica.', 'Cambiar la entrega', DESTINOS.EDITAR_EVENTO));
      } else if (topeCrudo && cfg.modo === 'digital') {
        avisos.push(aviso('TOPE_NO_APLICA', 'entrega', 'Este evento no imprime, así que el tope de impresiones no se aplica.', 'Cambiar la entrega', DESTINOS.EDITAR_EVENTO));
      }
      if (cfg.modo === 'digital' && equipo.servidorLocal !== true) {
        // Decisión de bajo riesgo: hoy el servidor local no existe; bloquear dejaría inservible el modo solo digital, así que solo avisa.
        avisos.push(aviso('DIGITAL_SIN_SERVIDOR', 'entrega', 'La entrega digital por QR todavía no está disponible en este equipo: las fotos quedan guardadas aquí y se descargan desde la cabina.', 'Ajustes del evento', DESTINOS.EDITAR_EVENTO));
      }
    }
    if (esObjeto(equipo.pin) && equipo.pin.definido === false) {
      avisos.push(aviso('PIN_SIN_CREAR', 'equipo', 'Aún no tienes un PIN de operador: se te pedirá crearlo al lanzar el evento.', 'Crear el PIN', DESTINOS.PIN));
    }

    return { listo: bloqueos.length === 0, configuracion: cfg, bloqueos, avisos, ritmo };
  }

  return { validar, ILEGIBLE, CODIGOS, DESTINOS, RITMO, UMBRALES };
})();

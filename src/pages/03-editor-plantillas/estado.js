const EditorEstado = (() => {
  const CLAVE = 'fotocabina-editor-v1';
  const LIMITE_HISTORIAL = 100;
  const PT_A_MM = 25.4 / 72;

  const PRESETS_PAPEL = {
    'tira-2x6': { nombre: 'Tira 2 × 6 in', anchoMm: 50.8, altoMm: 152.4, duplicarEnHoja: true },
    'hoja-4x6': { nombre: 'Hoja 4 × 6 in', anchoMm: 101.6, altoMm: 152.4, duplicarEnHoja: false },
    'libre': { nombre: 'Tamaño libre', anchoMm: 100, altoMm: 150, duplicarEnHoja: false },
  };

  const NOMBRES_TIPO = { foto: 'Foto', texto: 'Texto', forma: 'Forma', imagen: 'Imagen', dato: 'Dato del evento' };
  const NOMBRES_DATO = { fecha: 'Fecha', fechaHora: 'Fecha y hora', numeroSesion: 'N.º de sesión', nombreEvento: 'Nombre del evento' };
  const esTextual = (e) => !!e && (e.tipo === 'texto' || e.tipo === 'dato');

  // Esquemas en fracciones del papel (0–1): [x, y, ancho, alto]. Los textos llevan contenido y tamaño en pt.
  const T = (x, y, w, h, contenido, tamanoPt, peso, extra) => Object.assign({ x, y, w, h, contenido, tamanoPt, peso: peso || 600 }, extra || {});
  const F = (x, y, w, h) => Object.assign({ x, y, w, h }, { campo: 'fecha' });
  const PLANTILLAS_BASE = [
    { id: 'tira-3', nombre: 'Tira 2 × 6 · 3 fotos', preset: 'tira-2x6', orientacion: 'vertical', descripcion: 'La clásica: tres fotos apiladas, título arriba y fecha abajo.',
      fotos: [[0.079, 0.105, 0.842, 0.2106], [0.079, 0.3353, 0.842, 0.2106], [0.079, 0.5656, 0.842, 0.2106]],
      textos: [T(0.079, 0.033, 0.842, 0.052, 'NOCHE DE FOTOS', 10, 800), T(0.079, 0.8, 0.842, 0.05, 'Juli & Fran', 11, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.079, 0.86, 0.842, 0.04)] },
    { id: 'tira-4', nombre: 'Tira 2 × 6 · 4 fotos', preset: 'tira-2x6', orientacion: 'vertical', descripcion: 'Cuatro fotos más chicas, ideal para grupos.',
      fotos: [[0.079, 0.105, 0.842, 0.1844], [0.079, 0.3091, 0.842, 0.1844], [0.079, 0.5132, 0.842, 0.1844], [0.079, 0.7173, 0.842, 0.1844]],
      textos: [T(0.079, 0.033, 0.842, 0.052, 'NOCHE DE FOTOS', 10, 800)], datos: [F(0.079, 0.925, 0.842, 0.04)] },
    { id: 'tira-2', nombre: 'Tira 2 × 6 · 2 fotos', preset: 'tira-2x6', orientacion: 'vertical', descripcion: 'Dos fotos grandes y espacio generoso para nombres y fecha.',
      fotos: [[0.079, 0.05, 0.842, 0.31], [0.079, 0.39, 0.842, 0.31]],
      textos: [T(0.079, 0.75, 0.842, 0.08, 'Juli & Fran', 14, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.079, 0.84, 0.842, 0.04)] },
    { id: 'tira-3-titulo', nombre: 'Tira 2 × 6 · 3 fotos y nombres', preset: 'tira-2x6', orientacion: 'vertical', descripcion: 'Nombres del evento arriba, tres fotos y fecha al pie.',
      fotos: [[0.079, 0.13, 0.842, 0.2106], [0.079, 0.3603, 0.842, 0.2106], [0.079, 0.5906, 0.842, 0.2106]],
      textos: [T(0.079, 0.035, 0.842, 0.075, 'Juli & Fran', 13, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.079, 0.86, 0.842, 0.04)] },
    { id: 'postal-1', nombre: 'Postal 4 × 6 · 1 foto', preset: 'hoja-4x6', orientacion: 'vertical', descripcion: 'Una foto grande con marco, formato postal.',
      fotos: [[0.059, 0.039, 0.882, 0.8]], textos: [T(0.059, 0.86, 0.882, 0.06, 'Juli & Fran', 14, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.059, 0.92, 0.882, 0.04)] },
    { id: 'postal-2', nombre: 'Postal 4 × 6 · 2 fotos', preset: 'hoja-4x6', orientacion: 'vertical', descripcion: 'Dos fotos apiladas y pie con nombres y fecha.',
      fotos: [[0.08, 0.05, 0.84, 0.4], [0.08, 0.47, 0.84, 0.4]], textos: [T(0.08, 0.885, 0.5, 0.05, 'Juli & Fran', 11, 700, { alineacion: 'izquierda', fuente: 'Georgia', cursiva: true })], datos: [F(0.6, 0.885, 0.32, 0.05, { alineacion: 'derecha' })] },
    { id: 'postal-4', nombre: 'Postal 4 × 6 · 4 fotos', preset: 'hoja-4x6', orientacion: 'vertical', descripcion: 'Grilla de dos por dos con título.',
      fotos: [[0.039, 0.125, 0.446, 0.415], [0.5145, 0.125, 0.446, 0.415], [0.039, 0.5597, 0.446, 0.415], [0.5145, 0.5597, 0.446, 0.415]],
      textos: [T(0.039, 0.033, 0.921, 0.066, 'NOCHE DE FOTOS', 16, 800)], datos: [] },
    { id: 'apaisada-1', nombre: 'Apaisada 6 × 4 · 1 foto', preset: 'hoja-4x6', orientacion: 'horizontal', descripcion: 'Una foto grande horizontal con pie.',
      fotos: [[0.06, 0.07, 0.88, 0.72]], textos: [T(0.06, 0.83, 0.5, 0.09, 'Juli & Fran', 13, 700, { alineacion: 'izquierda', fuente: 'Georgia', cursiva: true })], datos: [F(0.6, 0.85, 0.34, 0.07, { alineacion: 'derecha' })] },
    { id: 'apaisada-2-pie', nombre: 'Apaisada 6 × 4 · 2 fotos', preset: 'hoja-4x6', orientacion: 'horizontal', descripcion: 'Dos fotos lado a lado y pie abajo.',
      fotos: [[0.06, 0.07, 0.42, 0.63], [0.52, 0.07, 0.42, 0.63]], textos: [T(0.06, 0.76, 0.88, 0.1, 'Juli & Fran', 13, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.06, 0.87, 0.88, 0.06)] },
    { id: 'apaisada-2-lado', nombre: 'Apaisada 6 × 4 · 2 fotos y texto', preset: 'hoja-4x6', orientacion: 'horizontal', descripcion: 'Dos fotos apiladas a la izquierda, nombres y fecha a la derecha.',
      fotos: [[0.05, 0.06, 0.55, 0.42], [0.05, 0.52, 0.55, 0.42]], textos: [T(0.64, 0.36, 0.31, 0.14, 'Juli & Fran', 14, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.64, 0.52, 0.31, 0.07)] },
    { id: 'apaisada-3', nombre: 'Apaisada 6 × 4 · 3 fotos', preset: 'hoja-4x6', orientacion: 'horizontal', descripcion: 'Tres fotos en grilla y un espacio para texto.',
      fotos: [[0.05, 0.06, 0.43, 0.42], [0.52, 0.06, 0.43, 0.42], [0.05, 0.52, 0.43, 0.42]], textos: [T(0.52, 0.6, 0.43, 0.14, 'Juli & Fran', 14, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.52, 0.76, 0.43, 0.07)] },
    { id: 'apaisada-1-2', nombre: 'Apaisada 6 × 4 · 1 grande + 2', preset: 'hoja-4x6', orientacion: 'horizontal', descripcion: 'Una foto principal y dos chicas al costado.',
      fotos: [[0.05, 0.06, 0.5, 0.88], [0.58, 0.06, 0.37, 0.41], [0.58, 0.53, 0.37, 0.41]], textos: [], datos: [] },
    { id: 'tira-apaisada', nombre: 'Tira apaisada 6 × 2 · 2 fotos', preset: 'tira-2x6', orientacion: 'horizontal', descripcion: 'Tira horizontal: dos fotos y texto a la derecha. Se duplica en la hoja 6 × 4.',
      fotos: [[0.03, 0.1, 0.36, 0.8], [0.41, 0.1, 0.36, 0.8]], textos: [T(0.79, 0.3, 0.19, 0.25, 'Juli & Fran', 10, 700, { fuente: 'Georgia', cursiva: true })], datos: [F(0.79, 0.58, 0.19, 0.14)] },
    { id: 'blanco-2x6', nombre: 'Tira 2 × 6 en blanco', preset: 'tira-2x6', orientacion: 'vertical', descripcion: 'Sin elementos. Para traer un diseño de Canva.', fotos: [], textos: [], datos: [] },
    { id: 'blanco-4x6', nombre: 'Hoja 4 × 6 en blanco', preset: 'hoja-4x6', orientacion: 'vertical', descripcion: 'Sin elementos, tamaño postal.', fotos: [], textos: [], datos: [] },
  ];

  let datos = { plantillas: [], ultimaAbierta: null };
  let plantilla = null;
  let historial = [];
  let futuro = [];
  let seleccion = [];
  let sucio = false;
  let temporizadorGuardado = null;
  const oyentes = {};

  const uid = () => Math.random().toString(36).slice(2, 10);
  const ahora = () => new Date().toISOString();
  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const redondear = (n, d = 1) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

  function suscribir(evento, fn) {
    (oyentes[evento] = oyentes[evento] || []).push(fn);
  }
  function emitir(evento, carga) {
    (oyentes[evento] || []).forEach((fn) => fn(carga));
  }

  function plantillaBase(baseId = 'tira-3') {
    const base = PLANTILLAS_BASE.find((b) => b.id === baseId) || PLANTILLAS_BASE[0];
    const medidas = PRESETS_PAPEL[base.preset];
    const horizontal = base.orientacion === 'horizontal';
    const papel = { preset: base.preset, anchoMm: horizontal ? medidas.altoMm : medidas.anchoMm, altoMm: horizontal ? medidas.anchoMm : medidas.altoMm, ppp: 300, orientacion: horizontal ? 'horizontal' : 'vertical', sangradoMm: 1.5, areaSeguraMm: 3, duplicarEnHoja: medidas.duplicarEnHoja };
    const elementos = [];
    let orden = 0;
    const caja = (f) => ({ xMm: redondear(f.x * papel.anchoMm, 2), yMm: redondear(f.y * papel.altoMm, 2), anchoMm: redondear(f.w * papel.anchoMm, 2), altoMm: redondear(f.h * papel.altoMm, 2) });
    (base.fotos || []).forEach((f, i) => elementos.push(Object.assign(nuevoElementoBase('foto'), { nombre: 'Foto ' + (i + 1), numero: i + 1, orden: ++orden }, caja({ x: f[0], y: f[1], w: f[2], h: f[3] }))));
    (base.textos || []).forEach((t, i) => {
      const { x, y, w, h, contenido, tamanoPt, peso, ...resto } = t;
      elementos.push(Object.assign(nuevoElementoBase('texto'), { nombre: i === 0 ? 'Título' : 'Texto ' + (i + 1), contenido, tamanoPt, peso, alineacion: 'centro', ajuste: 'reducir', orden: ++orden }, resto, caja({ x, y, w, h })));
    });
    (base.datos || []).forEach((d) => {
      const { x, y, w, h, campo, ...resto } = d;
      elementos.push(Object.assign(nuevoElementoBase('dato'), { nombre: NOMBRES_DATO[campo], campo, formato: 'corta', tamanoPt: 8, peso: 500, orden: ++orden }, resto, caja({ x, y, w, h })));
    });
    return {
      version: 1,
      id: uid(),
      nombre: base.nombre,
      creada: ahora(),
      modificada: ahora(),
      papel,
      fondo: { tipo: 'color', color: '#FFFFFF' },
      guiasPropias: [],
      asistencia: { iman: true, cuadricula: false, pasoCuadriculaMm: 5 },
      elementos,
      recursos: { fuentes: [] },
    };
  }

  function nuevoElementoBase(tipo) {
    const base = { id: uid(), tipo, nombre: NOMBRES_TIPO[tipo] || tipo, xMm: 0, yMm: 0, anchoMm: 20, altoMm: 20, rotacion: 0, opacidad: 100, visible: true, bloqueado: false, orden: 0 };
    if (tipo === 'foto') Object.assign(base, { numero: 1, encuadre: 'cubrir', focoX: 50, focoY: 50, radioMm: 0, borde: { anchoMm: 0, color: '#FFFFFF' }, filtro: 'ninguno', imagen: null });
    if (tipo === 'texto') Object.assign(base, { contenido: 'Escribí acá', fuente: 'Inter', peso: 600, cursiva: false, subrayado: false, tachado: false, mayusculas: 'original', tamanoPt: 12, interlineado: 1.15, espaciado: 0, alineacion: 'centro', alineacionVertical: 'centro', ajuste: 'fijo', color: '#111214' });
    if (tipo === 'forma') Object.assign(base, { figura: 'rectangulo', relleno: '#111214', radioMm: 0, trazo: { anchoMm: 0, color: '#111214' } });
    if (tipo === 'imagen') Object.assign(base, { origen: null, nombreArchivo: '', encuadre: 'contener', radioMm: 0 });
    if (tipo === 'dato') Object.assign(base, { campo: 'fecha', formato: 'corta', ejemplo: 'Mi evento', fuente: 'Inter', peso: 600, cursiva: false, subrayado: false, tachado: false, mayusculas: 'original', tamanoPt: 9, interlineado: 1.15, espaciado: 0, alineacion: 'centro', alineacionVertical: 'centro', ajuste: 'reducir', color: '#111214' });
    return base;
  }

  // Texto de muestra que se ve en el editor para un dato de sesión. En el evento, la cabina lo reemplaza por el valor real.
  function textoDeDato(e) {
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0'), mm = String(hoy.getMonth() + 1).padStart(2, '0'), aaaa = hoy.getFullYear();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hora = String(hoy.getHours()).padStart(2, '0') + ':' + String(hoy.getMinutes()).padStart(2, '0');
    const fecha = e.formato === 'larga' ? hoy.getDate() + ' de ' + meses[hoy.getMonth()] + ' de ' + aaaa : e.formato === 'anio' ? String(aaaa) : dd + '/' + mm + '/' + aaaa;
    if (e.campo === 'fecha') return fecha;
    if (e.campo === 'fechaHora') return fecha + ' · ' + hora;
    if (e.campo === 'numeroSesion') return (e.formato === 'simple' ? '' : e.formato === 'sesion' ? 'Sesión ' : '#') + '048';
    if (e.campo === 'nombreEvento') return e.ejemplo || 'Mi evento';
    return '';
  }

  function cargar() {
    try {
      const crudo = JSON.parse(localStorage.getItem(CLAVE));
      if (crudo && Array.isArray(crudo.plantillas) && crudo.plantillas.length) datos = crudo;
    } catch (e) { /* almacenamiento vacío o corrupto: se arranca de cero */ }
    if (!datos.plantillas.length) {
      const base = plantillaBase('tira-3');
      datos.plantillas = [base];
      datos.ultimaAbierta = base.id;
    }
    datos.plantillas.forEach(normalizar);
    const id = datos.plantillas.some((p) => p.id === datos.ultimaAbierta) ? datos.ultimaAbierta : datos.plantillas[0].id;
    abrirPlantilla(id);
  }

  function abrirPlantilla(id) {
    const p = datos.plantillas.find((x) => x.id === id);
    if (!p) return false;
    if (plantilla && sucio) persistir();
    plantilla = p;
    datos.ultimaAbierta = p.id;
    historial = [];
    futuro = [];
    seleccion = [];
    sucio = false;
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* sin espacio: se reintenta en el próximo guardado */ }
    emitir('cambio');
    emitir('seleccion');
    emitir('guardado', 'guardado');
    emitir('plantilla-abierta', p);
    return true;
  }

  const listarPlantillas = () => datos.plantillas.slice().sort((a, b) => (b.modificada || '').localeCompare(a.modificada || ''));

  function crearPlantilla(baseId) {
    const p = plantillaBase(baseId);
    datos.plantillas.push(p);
    abrirPlantilla(p.id);
    return p;
  }

  function incorporarPlantilla(p) {
    p = clonar(p);
    p.id = uid();
    p.creada = ahora();
    p.modificada = ahora();
    normalizar(p);
    datos.plantillas.push(p);
    abrirPlantilla(p.id);
    return p;
  }

  function duplicarPlantilla(id) {
    const origen = datos.plantillas.find((x) => x.id === id);
    if (!origen) return null;
    const copia = clonar(origen);
    copia.id = uid();
    copia.nombre = origen.nombre + ' copia';
    copia.creada = ahora();
    copia.modificada = ahora();
    datos.plantillas.push(copia);
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* idem */ }
    emitir('plantillas');
    return copia;
  }

  function eliminarPlantilla(id) {
    if (datos.plantillas.length <= 1) return false;
    datos.plantillas = datos.plantillas.filter((x) => x.id !== id);
    if (plantilla && plantilla.id === id) abrirPlantilla(datos.plantillas[0].id);
    else try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* idem */ }
    emitir('plantillas');
    return true;
  }

  function renombrarPlantilla(id, nombre) {
    const p = datos.plantillas.find((x) => x.id === id);
    const limpio = String(nombre || '').trim();
    if (!p || !limpio) return;
    p.nombre = limpio;
    p.modificada = ahora();
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* idem */ }
    if (plantilla && plantilla.id === id) emitir('cambio');
    emitir('plantillas');
  }

  function normalizar(p) {
    p.guiasPropias = p.guiasPropias || [];
    p.asistencia = p.asistencia || { iman: true, cuadricula: false, pasoCuadriculaMm: 5 };
    p.recursos = p.recursos || { fuentes: [] };
    p.fondo = p.fondo || { tipo: 'color', color: '#FFFFFF' };
    // El QR de entrega vive en la pantalla de la cabina, no en la plantilla: se descartan restos de versiones anteriores.
    p.elementos = (p.elementos || []).filter((e) => e.tipo !== 'qr');
    p.elementos.forEach((e, i) => { if (typeof e.orden !== 'number') e.orden = i; if (typeof e.visible !== 'boolean') e.visible = true; delete e.imprimir; });
    if (!p.id) p.id = uid();
    if (!p.nombre) p.nombre = 'Plantilla';
  }

  function persistir() {
    const i = datos.plantillas.findIndex((p) => p.id === plantilla.id);
    if (i >= 0) datos.plantillas[i] = plantilla; else datos.plantillas.push(plantilla);
    datos.ultimaAbierta = plantilla.id;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      sucio = false;
      emitir('guardado', 'guardado');
    } catch (e) {
      emitir('guardado', 'error');
    }
  }

  function programarGuardado() {
    clearTimeout(temporizadorGuardado);
    emitir('guardado', 'sucio');
    temporizadorGuardado = setTimeout(persistir, 700);
  }

  function guardarAhora() {
    clearTimeout(temporizadorGuardado);
    persistir();
  }

  // Guarda un cambio menor (por ejemplo, una caja de texto que creció sola) sin historial ni redibujo.
  function persistirSilencioso() {
    plantilla.modificada = ahora();
    programarGuardado();
  }

  function fotografiar() {
    historial.push(JSON.stringify(plantilla));
    if (historial.length > LIMITE_HISTORIAL) historial.shift();
    futuro = [];
  }

  function aplicar(fn) {
    fotografiar();
    fn(plantilla);
    notificar();
  }

  function iniciarTransaccion() {
    fotografiar();
  }

  function notificar() {
    plantilla.modificada = ahora();
    sucio = true;
    emitir('cambio');
    programarGuardado();
  }

  function restaurar(json) {
    plantilla = JSON.parse(json);
    const ids = new Set(plantilla.elementos.map((e) => e.id));
    seleccion = seleccion.filter((id) => ids.has(id));
    notificar();
    emitir('seleccion');
  }

  function deshacer() {
    if (!historial.length) return false;
    futuro.push(JSON.stringify(plantilla));
    restaurar(historial.pop());
    return true;
  }

  function rehacer() {
    if (!futuro.length) return false;
    historial.push(JSON.stringify(plantilla));
    restaurar(futuro.pop());
    return true;
  }

  const puedeDeshacer = () => historial.length > 0;
  const puedeRehacer = () => futuro.length > 0;

  const porId = (id) => plantilla.elementos.find((e) => e.id === id);
  const obtener = () => plantilla;
  const obtenerSeleccion = () => seleccion.slice();
  const seleccionados = () => seleccion.map(porId).filter(Boolean);
  const editables = () => seleccionados().filter((e) => !e.bloqueado && e.visible);

  function seleccionar(ids) {
    const nuevos = (Array.isArray(ids) ? ids : [ids]).filter((id) => porId(id));
    if (nuevos.length === seleccion.length && nuevos.every((id, i) => id === seleccion[i])) return;
    seleccion = nuevos;
    emitir('seleccion');
  }
  function alternarSeleccion(id) {
    seleccionar(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : seleccion.concat(id));
  }
  function limpiarSeleccion() { seleccionar([]); }
  function seleccionarTodo() { seleccionar(plantilla.elementos.filter((e) => e.visible && !e.bloqueado).map((e) => e.id)); }

  function limites(elementos) {
    if (!elementos.length) return null;
    const x1 = Math.min(...elementos.map((e) => e.xMm));
    const y1 = Math.min(...elementos.map((e) => e.yMm));
    const x2 = Math.max(...elementos.map((e) => e.xMm + e.anchoMm));
    const y2 = Math.max(...elementos.map((e) => e.yMm + e.altoMm));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  function ordenMaximo() { return plantilla.elementos.reduce((m, e) => Math.max(m, e.orden), 0); }
  function siguienteNumeroFoto() {
    const usados = plantilla.elementos.filter((e) => e.tipo === 'foto').map((e) => e.numero);
    let n = 1;
    while (usados.includes(n)) n++;
    return n;
  }
  const fotosPorSesion = () => new Set(plantilla.elementos.filter((e) => e.tipo === 'foto').map((e) => e.numero)).size;

  function posicionLibre(anchoMm, altoMm) {
    const p = plantilla.papel;
    const margen = 4;
    const fotos = plantilla.elementos.filter((e) => e.tipo === 'foto');
    let y = margen + 12;
    if (fotos.length) y = Math.max(...fotos.map((e) => e.yMm + e.altoMm)) + 3;
    if (y + altoMm > p.altoMm - margen) y = Math.max(margen, p.altoMm - margen - altoMm);
    return { xMm: Math.max(0, (p.anchoMm - anchoMm) / 2), yMm: redondear(y) };
  }

  function agregarElemento(tipo, extra = {}) {
    let creado = null;
    aplicar((p) => {
      const e = nuevoElementoBase(tipo);
      const margen = 4;
      const anchoUtil = p.papel.anchoMm - margen * 2;
      if (tipo === 'foto') {
        e.numero = siguienteNumeroFoto();
        e.nombre = 'Foto ' + e.numero;
        e.anchoMm = anchoUtil;
        e.altoMm = redondear(anchoUtil * 0.75);
        Object.assign(e, posicionLibre(e.anchoMm, e.altoMm));
        e.xMm = margen;
      } else if (tipo === 'texto') {
        e.anchoMm = anchoUtil;
        e.altoMm = 9;
        e.xMm = margen;
        e.yMm = redondear(p.papel.altoMm / 2 - 4.5);
      } else if (tipo === 'forma') {
        e.anchoMm = Math.min(30, anchoUtil);
        e.altoMm = extra.figura === 'linea' ? 0.6 : e.anchoMm;
        e.xMm = redondear((p.papel.anchoMm - e.anchoMm) / 2);
        e.yMm = redondear((p.papel.altoMm - e.altoMm) / 2);
      } else if (tipo === 'imagen') {
        e.anchoMm = Math.min(30, anchoUtil);
        e.altoMm = e.anchoMm;
        e.xMm = redondear((p.papel.anchoMm - e.anchoMm) / 2);
        e.yMm = redondear((p.papel.altoMm - e.altoMm) / 2);
      } else if (tipo === 'dato') {
        e.anchoMm = anchoUtil;
        e.altoMm = 7;
        e.xMm = margen;
        e.yMm = redondear(p.papel.altoMm - 20);
        e.nombre = NOMBRES_DATO[extra.campo || e.campo] || e.nombre;
      }
      Object.assign(e, extra);
      e.orden = ordenMaximo() + 1;
      p.elementos.push(e);
      creado = e;
    });
    seleccionar([creado.id]);
    return creado;
  }

  function duplicarSeleccion() {
    const origen = seleccionados();
    if (!origen.length) return;
    const nuevosIds = [];
    aplicar((p) => {
      let orden = ordenMaximo();
      origen.forEach((e) => {
        const copia = clonar(e);
        copia.id = uid();
        copia.nombre = e.nombre + ' copia';
        copia.xMm = Math.min(p.papel.anchoMm - e.anchoMm, e.xMm + 3);
        copia.yMm = Math.min(p.papel.altoMm - e.altoMm, e.yMm + 3);
        copia.orden = ++orden;
        copia.bloqueado = false;
        p.elementos.push(copia);
        nuevosIds.push(copia.id);
      });
    });
    seleccionar(nuevosIds);
  }

  function eliminarSeleccion() {
    const ids = seleccionados().filter((e) => !e.bloqueado).map((e) => e.id);
    if (!ids.length) return;
    aplicar((p) => { p.elementos = p.elementos.filter((e) => !ids.includes(e.id)); });
    seleccionar([]);
  }

  function eliminarElemento(id) {
    aplicar((p) => { p.elementos = p.elementos.filter((e) => e.id !== id); });
    seleccionar(seleccion.filter((x) => x !== id));
  }

  function ordenar(accion) {
    const sel = seleccionados();
    if (!sel.length) return;
    aplicar((p) => {
      const lista = p.elementos.slice().sort((a, b) => a.orden - b.orden);
      const ids = new Set(sel.map((e) => e.id));
      let resultado;
      if (accion === 'frente') resultado = lista.filter((e) => !ids.has(e.id)).concat(lista.filter((e) => ids.has(e.id)));
      else if (accion === 'fondo') resultado = lista.filter((e) => ids.has(e.id)).concat(lista.filter((e) => !ids.has(e.id)));
      else if (accion === 'subir') {
        resultado = lista.slice();
        for (let i = resultado.length - 2; i >= 0; i--) {
          if (ids.has(resultado[i].id) && !ids.has(resultado[i + 1].id)) { const t = resultado[i]; resultado[i] = resultado[i + 1]; resultado[i + 1] = t; }
        }
      } else if (accion === 'bajar') {
        resultado = lista.slice();
        for (let i = 1; i < resultado.length; i++) {
          if (ids.has(resultado[i].id) && !ids.has(resultado[i - 1].id)) { const t = resultado[i]; resultado[i] = resultado[i - 1]; resultado[i - 1] = t; }
        }
      } else return;
      resultado.forEach((e, i) => { e.orden = i; });
    });
  }

  function moverCapa(id, destinoId, antes) {
    aplicar((p) => {
      const lista = p.elementos.slice().sort((a, b) => b.orden - a.orden);
      const desde = lista.findIndex((e) => e.id === id);
      const [el] = lista.splice(desde, 1);
      let hasta = lista.findIndex((e) => e.id === destinoId);
      if (!antes) hasta += 1;
      lista.splice(hasta, 0, el);
      lista.forEach((e, i) => { e.orden = lista.length - 1 - i; });
    });
  }

  function alinear(modo) {
    const sel = editables();
    if (!sel.length) return;
    const p = plantilla.papel;
    const caja = sel.length === 1 ? { x: 0, y: 0, w: p.anchoMm, h: p.altoMm } : limites(sel);
    aplicar(() => {
      sel.forEach((e) => {
        if (modo === 'izquierda') e.xMm = caja.x;
        if (modo === 'centroH') e.xMm = redondear(caja.x + (caja.w - e.anchoMm) / 2, 2);
        if (modo === 'derecha') e.xMm = redondear(caja.x + caja.w - e.anchoMm, 2);
        if (modo === 'arriba') e.yMm = caja.y;
        if (modo === 'centroV') e.yMm = redondear(caja.y + (caja.h - e.altoMm) / 2, 2);
        if (modo === 'abajo') e.yMm = redondear(caja.y + caja.h - e.altoMm, 2);
      });
    });
  }

  function distribuir(eje) {
    const sel = editables();
    if (sel.length < 3) return;
    aplicar(() => {
      const pos = eje === 'x' ? 'xMm' : 'yMm';
      const tam = eje === 'x' ? 'anchoMm' : 'altoMm';
      const lista = sel.slice().sort((a, b) => a[pos] - b[pos]);
      const inicio = lista[0][pos];
      const fin = lista[lista.length - 1][pos] + lista[lista.length - 1][tam];
      const total = lista.reduce((s, e) => s + e[tam], 0);
      const hueco = (fin - inicio - total) / (lista.length - 1);
      let cursor = inicio;
      lista.forEach((e) => { e[pos] = redondear(cursor, 2); cursor += e[tam] + hueco; });
    });
  }

  function cambiarPapel(cambios) {
    aplicar((p) => {
      Object.assign(p.papel, cambios);
      if (cambios.preset && PRESETS_PAPEL[cambios.preset] && cambios.preset !== 'libre') {
        const base = PRESETS_PAPEL[cambios.preset];
        const horizontal = p.papel.orientacion === 'horizontal';
        p.papel.anchoMm = horizontal ? base.altoMm : base.anchoMm;
        p.papel.altoMm = horizontal ? base.anchoMm : base.altoMm;
        p.papel.duplicarEnHoja = base.duplicarEnHoja;
      }
      if (cambios.orientacion && !cambios.preset) {
        const ancho = p.papel.anchoMm, alto = p.papel.altoMm;
        const debeHorizontal = cambios.orientacion === 'horizontal';
        if ((debeHorizontal && ancho < alto) || (!debeHorizontal && ancho > alto)) { p.papel.anchoMm = alto; p.papel.altoMm = ancho; }
      }
    });
  }

  function renombrar(nombre) {
    const limpio = String(nombre || '').trim();
    if (!limpio || limpio === plantilla.nombre) return;
    aplicar((p) => { p.nombre = limpio; });
  }

  return {
    PRESETS_PAPEL, NOMBRES_TIPO, NOMBRES_DATO, PLANTILLAS_BASE, PT_A_MM,
    uid, redondear, clonar, esTextual, textoDeDato,
    suscribir, emitir,
    cargar, obtener, guardarAhora, persistirSilencioso, estaSucio: () => sucio,
    listarPlantillas, abrirPlantilla, crearPlantilla, incorporarPlantilla, duplicarPlantilla, eliminarPlantilla, renombrarPlantilla,
    aplicar, iniciarTransaccion, notificar,
    deshacer, rehacer, puedeDeshacer, puedeRehacer,
    porId, obtenerSeleccion, seleccionados, editables, seleccionar, alternarSeleccion, limpiarSeleccion, seleccionarTodo,
    limites, fotosPorSesion, siguienteNumeroFoto,
    agregarElemento, duplicarSeleccion, eliminarSeleccion, eliminarElemento, ordenar, moverCapa, alinear, distribuir,
    cambiarPapel, renombrar,
  };
})();

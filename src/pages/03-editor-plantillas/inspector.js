const EditorInspector = (() => {
  const E = EditorEstado;
  const I = EditorIconos;
  const ICONO_TIPO = { foto: 'foto', texto: 'texto', forma: 'forma', imagen: 'imagen', dato: 'dato' };

  let panelProps, listaCapas, contadorCapas, contextual, visor, inspector;
  let firmaActual = '';
  let enTransaccion = false;
  let arrastreCapa = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r1 = (n) => Math.round(n * 10) / 10;

  function iniciar() {
    panelProps = document.getElementById('ed-inspector-propiedades');
    listaCapas = document.getElementById('ed-capas-lista');
    contadorCapas = document.getElementById('ed-capas-contador');
    contextual = document.getElementById('ed-contextual');
    visor = document.getElementById('ed-visor');
    inspector = document.getElementById('ed-inspector');

    E.suscribir('cambio', () => { renderPropiedades(); renderCapas(); renderContextual(); });
    E.suscribir('seleccion', () => { firmaActual = ''; renderPropiedades(); renderCapas(); renderContextual(); });
    E.suscribir('seleccion-dibujada', posicionarContextual);
    E.suscribir('geometria', () => sincronizar(panelProps));
    E.suscribir('vista', () => posicionarContextual(EditorLienzo.cajaSeleccionEnVisor()));

    panelProps.addEventListener('change', alCambiarCampo);
    panelProps.addEventListener('input', alEntradaCampo);
    panelProps.addEventListener('click', alClicAccion);
    contextual.addEventListener('change', alCambiarCampo);
    contextual.addEventListener('input', alEntradaCampo);
    contextual.addEventListener('click', alClicAccion);
    contextual.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    listaCapas.addEventListener('click', alClicCapa);
    listaCapas.addEventListener('dblclick', alDobleClicCapa);
    listaCapas.addEventListener('pointerdown', alPresionarCapa);
    window.addEventListener('pointermove', alMoverCapa);
    window.addEventListener('pointerup', alSoltarCapa);
  }

  /* ---------- Campos reutilizables ---------- */

  function campoNum(etiqueta, prop, valor, unidad, extra = '') {
    return '<div class="ed-campo"><label>' + etiqueta + '</label><div class="ed-campo-unidad" data-unidad="' + unidad + '"><input class="ed-input" type="number" data-prop="' + prop + '" value="' + r1(valor) + '" ' + extra + '></div></div>';
  }
  function campoColor(etiqueta, prop, valor) {
    return '<div class="ed-campo"><label>' + etiqueta + '</label><div class="ed-color"><span class="ed-color-muestra" style="background:' + esc(valor) + '"><input type="color" data-prop="' + prop + '" value="' + esc(valor) + '"></span><input class="ed-input" type="text" data-prop="' + prop + '" data-texto-color value="' + esc(valor) + '" maxlength="7" spellcheck="false"></div></div>';
  }
  function segmentos(prop, valor, opciones) {
    return '<div class="ed-segmentos">' + opciones.map((o) => '<button type="button" class="ed-segmento" data-prop="' + prop + '" data-valor="' + o.v + '" aria-pressed="' + (o.v === String(valor)) + '" title="' + esc(o.t || o.l || '') + '">' + (o.i ? I.svg(o.i) : '') + (o.l ? '<span>' + o.l + '</span>' : '') + '</button>').join('') + '</div>';
  }
  function filaToggle(etiqueta, prop, valor, ayuda) {
    return '<div class="ed-fila-toggle"><span>' + etiqueta + (ayuda ? '<small>' + ayuda + '</small>' : '') + '</span><button type="button" class="ds-toggle" role="switch" data-prop="' + prop + '" aria-checked="' + (!!valor) + '"></button></div>';
  }
  function botonIcono(accion, icono, titulo, extra = '') {
    return '<button type="button" class="ed-boton-icono ' + extra + '" data-accion="' + accion + '" title="' + esc(titulo) + '">' + I.svg(icono) + '</button>';
  }

  const ALINEAR = [['izquierda', 'alinearIzquierda', 'Alinear a la izquierda'], ['centroH', 'alinearCentroH', 'Centrar horizontalmente'], ['derecha', 'alinearDerecha', 'Alinear a la derecha'], ['arriba', 'alinearArriba', 'Alinear arriba'], ['centroV', 'alinearCentroV', 'Centrar verticalmente'], ['abajo', 'alinearAbajo', 'Alinear abajo']];
  function gridAlinear(unico) {
    return '<div class="ed-bloque"><h3 class="ed-seccion-titulo">' + (unico ? 'Alinear al lienzo' : 'Alinear entre sí') + '</h3><div class="ed-acciones-grid">' + ALINEAR.map((a) => botonIcono('alinear:' + a[0], a[1], a[2])).join('') + '</div>' + (unico ? '' : '<div class="ed-acciones-grid">' + botonIcono('distribuir:x', 'distribuirH', 'Distribuir horizontalmente (mínimo 3)') + botonIcono('distribuir:y', 'distribuirV', 'Distribuir verticalmente (mínimo 3)') + '</div>') + '</div>';
  }

  /* ---------- Panel de propiedades ---------- */

  function renderPropiedades() {
    const sel = E.seleccionados();
    const firma = sel.map((e) => e.id + ':' + e.tipo).join('|') + '#' + (sel.length ? '' : E.obtener().id);
    if (firma === firmaActual && sel.length) { sincronizar(panelProps); return; }
    firmaActual = firma;
    if (!sel.length) { panelProps.innerHTML = htmlSinSeleccion(); return; }
    if (sel.length > 1) { panelProps.innerHTML = htmlMultiple(sel); return; }
    panelProps.innerHTML = htmlElemento(sel[0]);
  }

  function htmlSinSeleccion() {
    const p = E.obtener();
    const preset = E.PRESETS_PAPEL[p.papel.preset];
    return '<div class="ed-inspector-titulo"><span class="ed-tipo-icono">' + I.svg('papel') + '</span><div><h2>' + esc(p.nombre) + '</h2><p>' + esc(preset ? preset.nombre : 'Tamaño libre') + '</p></div></div>' +
      '<div class="ed-inspector-resumen"><div class="ed-dato"><small>Tamaño</small><b>' + r1(p.papel.anchoMm) + ' × ' + r1(p.papel.altoMm) + ' mm</b></div><div class="ed-dato"><small>Fotos por sesión</small><b>' + E.fotosPorSesion() + '</b></div><div class="ed-dato"><small>Elementos</small><b>' + p.elementos.length + '</b></div><div class="ed-dato"><small>Resolución</small><b>' + p.papel.ppp + ' ppp</b></div></div>' +
      '<div class="ed-inspector-vacio"><p>Tocá un elemento del lienzo para editarlo.</p><p><b>Shift</b> suma a la selección. <b>Alt</b> mide distancias. Arrastrá desde las reglas para crear una guía.</p></div>';
  }

  function htmlMultiple(sel) {
    return '<div class="ed-inspector-titulo"><span class="ed-tipo-icono">' + I.svg('capas') + '</span><div><h2>' + sel.length + ' elementos</h2><p>' + sel.map((e) => e.nombre).join(', ') + '</p></div></div>' +
      gridAlinear(false) +
      '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Acciones</h3><div class="ed-acciones-fila"><button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="duplicar">' + I.svg('duplicar') + 'Duplicar</button><button type="button" class="ds-btn ds-btn--destructive ds-btn--compact" data-accion="eliminar">' + I.svg('eliminar') + 'Eliminar</button></div></div>';
  }

  function htmlElemento(e) {
    let h = '<div class="ed-inspector-titulo"><span class="ed-tipo-icono">' + I.svg(ICONO_TIPO[e.tipo]) + '</span><div><h2>' + esc(e.nombre) + '</h2><p>' + E.NOMBRES_TIPO[e.tipo] + (e.tipo === 'foto' ? ' · espacio ' + e.numero : '') + '</p></div>' + botonIcono('bloquear', e.bloqueado ? 'candado' : 'candadoAbierto', e.bloqueado ? 'Desbloquear (Ctrl+L)' : 'Bloquear (Ctrl+L)', e.bloqueado ? 'activo' : '') + '</div>';
    h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Posición y tamaño</h3><div class="ed-campos-2">' + campoNum('X', 'xMm', e.xMm, 'mm', 'step="0.5"') + campoNum('Y', 'yMm', e.yMm, 'mm', 'step="0.5"') + campoNum('Ancho', 'anchoMm', e.anchoMm, 'mm', 'step="0.5" min="1"') + campoNum('Alto', 'altoMm', e.altoMm, 'mm', 'step="0.5" min="1"') + campoNum('Rotación', 'rotacion', e.rotacion, '°', 'step="1"') + campoNum('Opacidad', 'opacidad', e.opacidad, '%', 'step="5" min="0" max="100"') + '</div></div>';

    if (e.tipo === 'foto') {
      const total = Math.max(E.fotosPorSesion(), e.numero);
      const opciones = []; for (let i = 1; i <= total + 1; i++) opciones.push(i);
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Foto de la sesión</h3>' +
        '<div class="ed-campo"><label>Número de foto</label>' + segmentos('numero', e.numero, opciones.map((n) => ({ v: String(n), l: String(n), t: 'Foto ' + n }))) + '<p class="ed-panel-nota">La cabina rellena este espacio con la foto ' + e.numero + ' de la sesión. Dos espacios con el mismo número repiten la misma foto.</p></div>' +
        '<div class="ed-campo"><label>Encuadre</label>' + segmentos('encuadre', e.encuadre, [{ v: 'cubrir', l: 'Cubrir', i: 'cubrir', t: 'La foto llena el espacio y se recorta lo que sobra' }, { v: 'contener', l: 'Contener', i: 'contener', t: 'La foto entra completa, puede dejar bordes' }]) + '</div>' +
        '<div class="ed-campos-2">' + campoNum('Esquinas', 'radioMm', e.radioMm, 'mm', 'step="0.5" min="0"') + campoNum('Borde', 'borde.anchoMm', e.borde.anchoMm, 'mm', 'step="0.5" min="0"') + '</div>' +
        campoColor('Color del borde', 'borde.color', e.borde.color) +
        '<div class="ed-campo"><label>Filtro</label>' + segmentos('filtro', e.filtro, [{ v: 'ninguno', l: 'Color' }, { v: 'bn', l: 'B&N' }, { v: 'sepia', l: 'Sepia' }]) + '</div>' +
        '<div class="ed-acciones-fila"><button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="subir-imagen">' + I.svg('imagen') + (e.imagen ? 'Cambiar foto de prueba' : 'Foto de prueba') + '</button>' + (e.imagen ? '<button type="button" class="ds-btn ds-btn--ghost ds-btn--compact" data-accion="quitar-imagen">Quitar</button>' : '') + '</div></div>';
    }

    if (E.esTextual(e)) {
      const fuentes = EditorTipografia.listaFuentes();
      const cargadas = EditorTipografia.fuentesCargadas().map((f) => f.familia);
      const bloqueContenido = e.tipo === 'dato'
        ? '<div class="ed-campo"><label>Dato</label>' + segmentos('campo', e.campo, [{ v: 'fecha', l: 'Fecha' }, { v: 'fechaHora', l: 'Fecha y hora' }, { v: 'numeroSesion', l: 'N.º' }, { v: 'nombreEvento', l: 'Evento' }]) + '</div>' +
          (e.campo === 'fecha' || e.campo === 'fechaHora' ? '<div class="ed-campo"><label>Formato</label>' + segmentos('formato', e.formato, [{ v: 'corta', l: '16/09/2026' }, { v: 'larga', l: '16 de septiembre de 2026' }, { v: 'anio', l: 'Solo año' }]) + '</div>' : '') +
          (e.campo === 'numeroSesion' ? '<div class="ed-campo"><label>Formato</label>' + segmentos('formato', e.formato, [{ v: 'numeral', l: '#048' }, { v: 'sesion', l: 'Sesión 048' }, { v: 'simple', l: '048' }]) + '</div>' : '') +
          (e.campo === 'nombreEvento' ? '<div class="ed-campo"><label>Texto de muestra</label><input class="ed-input" type="text" data-prop="ejemplo" value="' + esc(e.ejemplo) + '" maxlength="60"><p class="ed-panel-nota">En el evento se reemplaza por el nombre real configurado en la cabina.</p></div>' : '')
        : '<div class="ed-campo"><label>Contenido</label><textarea class="ed-input" data-prop="contenido" rows="3">' + esc(e.contenido) + '</textarea><p class="ed-panel-nota">También podés editarlo directo en el lienzo con doble clic o Enter.</p></div>';
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">' + (e.tipo === 'dato' ? 'Dato del evento' : 'Texto') + '</h3>' + bloqueContenido +
        '<div class="ed-campo"><label>Fuente</label><select class="ed-input" data-prop="fuente">' + fuentes.map((f) => '<option value="' + esc(f) + '"' + (f === e.fuente ? ' selected' : '') + ' style="font-family:\'' + esc(f) + '\'">' + esc(f) + (cargadas.includes(f) ? ' · propia' : '') + '</option>').join('') + '</select></div>' +
        '<div class="ed-acciones-fila"><button type="button" class="ds-btn ds-btn--secondary ds-btn--compact ds-btn--bloque" data-accion="cargar-fuente">' + I.svg('subir') + 'Cargar fuente (.ttf, .otf, .woff)</button></div>' +
        '<div class="ed-campos-2">' + campoNum('Tamaño', 'tamanoPt', e.tamanoPt, 'pt', 'step="1" min="4"') + '<div class="ed-campo"><label>Peso</label><select class="ed-input" data-prop="peso">' + EditorTipografia.PESOS.map((p) => '<option value="' + p[0] + '"' + (p[0] === e.peso ? ' selected' : '') + '>' + p[1] + '</option>').join('') + '</select></div></div>' +
        '<div class="ed-campos-2"><div class="ed-campo"><label>Estilo</label><div class="ed-estilos">' +
          '<button type="button" class="ed-segmento" data-prop="cursiva" data-toggle aria-pressed="' + !!e.cursiva + '" title="Cursiva"><i>I</i></button>' +
          '<button type="button" class="ed-segmento" data-prop="subrayado" data-toggle aria-pressed="' + !!e.subrayado + '" title="Subrayado"><u>S</u></button>' +
          '<button type="button" class="ed-segmento" data-prop="tachado" data-toggle aria-pressed="' + !!e.tachado + '" title="Tachado"><s>T</s></button></div></div>' +
          '<div class="ed-campo"><label>Mayúsculas</label>' + segmentos('mayusculas', e.mayusculas, [{ v: 'original', l: 'Aa', t: 'Como está escrito' }, { v: 'mayusculas', l: 'AA', t: 'Todo en mayúsculas' }, { v: 'minusculas', l: 'aa', t: 'Todo en minúsculas' }]) + '</div></div>' +
        campoColor('Color', 'color', e.color) +
        '<div class="ed-campos-2">' + campoNum('Interlineado', 'interlineado', e.interlineado, '×', 'step="0.05" min="0.6" max="3"') + campoNum('Espaciado', 'espaciado', e.espaciado, 'em', 'step="0.01" min="-0.1" max="1"') + '</div>' +
        '<div class="ed-campo"><label>Alineación</label>' + segmentos('alineacion', e.alineacion, [{ v: 'izquierda', i: 'alineaTextoIzq', t: 'Izquierda' }, { v: 'centro', i: 'alineaTextoCentro', t: 'Centro' }, { v: 'derecha', i: 'alineaTextoDer', t: 'Derecha' }]) + '</div>' +
        '<div class="ed-campo"><label>Alineación vertical</label>' + segmentos('alineacionVertical', e.alineacionVertical, [{ v: 'arriba', i: 'alinearArriba', t: 'Arriba' }, { v: 'centro', i: 'alinearCentroV', t: 'Centro' }, { v: 'abajo', i: 'alinearAbajo', t: 'Abajo' }]) + '</div>' +
        '<div class="ed-campo"><label>Si el texto no entra en la caja</label>' + segmentos('ajuste', e.ajuste, [{ v: 'crecer', l: 'Crecer', t: 'La caja se alarga hasta que entra todo' }, { v: 'reducir', l: 'Reducir', t: 'La letra se achica hasta que entra' }, { v: 'fijo', l: 'Recortar', t: 'Se corta lo que sobra' }]) +
        '<p class="ed-panel-nota">' + (e.ajuste === 'crecer' ? 'La caja se alarga sola hacia abajo; nunca se achica.' : e.ajuste === 'reducir' ? 'La letra baja de tamaño solo en pantalla y en la impresión; el tamaño pedido se conserva.' : 'Lo que no entra se corta. Útil para cajas de tamaño exacto.') + '</p></div></div>';
    }

    if (e.tipo === 'forma') {
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Forma</h3>' +
        campoColor('Relleno', 'relleno', e.relleno) +
        (e.figura === 'rectangulo' ? campoNum('Esquinas', 'radioMm', e.radioMm, 'mm', 'step="0.5" min="0"') : '') +
        (e.figura !== 'linea' ? '<div class="ed-campos-2">' + campoNum('Trazo', 'trazo.anchoMm', e.trazo.anchoMm, 'mm', 'step="0.25" min="0"') + '</div>' + campoColor('Color del trazo', 'trazo.color', e.trazo.color) : '') + '</div>';
    }

    if (e.tipo === 'imagen') {
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Imagen</h3>' +
        (e.nombreArchivo ? '<p class="ed-panel-nota"><b>' + esc(e.nombreArchivo) + '</b></p>' : '<p class="ed-panel-nota">Todavía no cargaste una imagen. Los PNG con transparencia se ven sobre las fotos sin fondo.</p>') +
        '<div class="ed-campo"><label>Encuadre</label>' + segmentos('encuadre', e.encuadre, [{ v: 'contener', l: 'Contener', i: 'contener' }, { v: 'cubrir', l: 'Cubrir', i: 'cubrir' }]) + '</div>' +
        campoNum('Esquinas', 'radioMm', e.radioMm, 'mm', 'step="0.5" min="0"') +
        '<div class="ed-acciones-fila"><button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="subir-imagen">' + I.svg('imagen') + (e.origen ? 'Reemplazar' : 'Cargar imagen') + '</button>' + (e.origen ? '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="ajustar-lienzo" title="Ocupar todo el papel, borde a borde">' + I.svg('ajustar') + 'Al lienzo</button>' : '') + '</div>' +
        (e.origen ? '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact ds-btn--bloque" data-accion="ajustar-segura" title="Encoger hasta el área segura y pintar el fondo con el color del borde">' + I.svg('proporcion') + 'Al área segura + fondo automático</button><p class="ed-panel-nota"><b>Al lienzo</b>: el diseño llega al borde y la impresora recorta 1–2 mm. <b>Al área segura</b>: nada se corta; el fondo se pinta solo con el color del borde de la imagen (si es liso).</p>' : '') +
        (e.origen ? '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact ds-btn--bloque" data-accion="detectar-fotos">' + I.svg('foto') + 'Detectar espacios de foto</button><p class="ed-panel-nota">Busca rectángulos de un solo color (o agujeros transparentes) en la imagen y crea un espacio de foto en cada uno, con su misma proporción.</p>' : '') + '</div>';
    }

    h += gridAlinear(true);
    h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Orden de capas</h3><p class="ed-panel-nota">Qué queda por encima de qué. Las fotos suelen ir sobre el fondo y debajo de logos o marcos.</p><div class="ed-campos-2">' +
      '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="ordenar:frente" title="Ctrl+Shift+]">' + I.svg('alFrente') + 'Al frente</button>' +
      '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="ordenar:subir" title="Ctrl+]">' + I.svg('subir') + 'Subir</button>' +
      '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="ordenar:bajar" title="Ctrl+[">' + I.svg('bajar') + 'Bajar</button>' +
      '<button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="ordenar:fondo" title="Ctrl+Shift+[">' + I.svg('atras') + 'Al fondo</button></div></div>';
    h += '<div class="ed-bloque">' + filaToggle('Visible', 'visible', e.visible, 'Ocultarlo no lo borra: volvés a mostrarlo acá o con el ojo en Capas') + '<div class="ed-acciones-fila"><button type="button" class="ds-btn ds-btn--secondary ds-btn--compact" data-accion="duplicar">' + I.svg('duplicar') + 'Duplicar</button><button type="button" class="ds-btn ds-btn--destructive ds-btn--compact" data-accion="eliminar">' + I.svg('eliminar') + 'Eliminar</button></div></div>';
    return h;
  }

  function leerProp(e, ruta) { return ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), e); }
  function escribirProp(e, ruta, valor) {
    const partes = ruta.split('.');
    let o = e;
    for (let i = 0; i < partes.length - 1; i++) { if (o[partes[i]] == null) o[partes[i]] = {}; o = o[partes[i]]; }
    o[partes[partes.length - 1]] = valor;
  }

  function sincronizar(raiz) {
    const e = E.seleccionados()[0];
    if (!e) return;
    const escribiendo = (n) => n === document.activeElement && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT');
    raiz.querySelectorAll('[data-prop]').forEach((n) => {
      if (escribiendo(n)) return;
      const v = leerProp(e, n.dataset.prop);
      if (n.classList.contains('ed-segmento')) { n.setAttribute('aria-pressed', String(n.hasAttribute('data-toggle') ? !!v : n.dataset.valor === String(v))); return; }
      if (n.classList.contains('ds-toggle')) { n.setAttribute('aria-checked', String(!!v)); return; }
      if (n.type === 'number') n.value = r1(Number(v));
      else if (n.type === 'color' || n.hasAttribute('data-texto-color')) { n.value = v; const m = n.closest('.ed-color-muestra'); if (m) m.style.background = v; }
      else if (n.tagName === 'SELECT' || n.tagName === 'TEXTAREA' || n.type === 'text') n.value = v;
    });
  }

  const NUMERICAS = ['xMm', 'yMm', 'anchoMm', 'altoMm', 'rotacion', 'opacidad', 'tamanoPt', 'radioMm', 'borde.anchoMm', 'trazo.anchoMm', 'peso', 'numero', 'interlineado', 'espaciado'];

  function aplicarCampo(prop, valorCrudo, continuo) {
    const sel = E.seleccionados();
    if (!sel.length) return;
    let valor = valorCrudo;
    if (NUMERICAS.includes(prop)) {
      valor = Number(valorCrudo);
      if (!isFinite(valor)) return;
      if (prop === 'opacidad') valor = Math.max(0, Math.min(100, valor));
      if (prop === 'anchoMm' || prop === 'altoMm') valor = Math.max(1, valor);
      if (prop === 'tamanoPt') valor = Math.max(4, valor);
      if (prop === 'radioMm' || prop === 'borde.anchoMm' || prop === 'trazo.anchoMm') valor = Math.max(0, valor);
      if (prop === 'rotacion') valor = ((valor % 360) + 360) % 360;
      if (prop === 'numero') valor = Math.max(1, Math.round(valor));
      if (prop === 'interlineado') valor = Math.max(0.6, Math.min(3, valor));
      if (prop === 'espaciado') valor = Math.max(-0.1, Math.min(1, valor));
    }
    if (prop === 'campo') {
      const nombres = E.NOMBRES_DATO;
      const mutarCampo = () => sel.forEach((e) => { if (e.tipo === 'dato') { e.campo = valor; e.formato = valor === 'numeroSesion' ? 'numeral' : 'corta'; if (Object.values(nombres).includes(e.nombre)) e.nombre = nombres[valor]; } });
      E.aplicar(mutarCampo);
      firmaActual = '';
      renderPropiedades();
      return;
    }
    if (prop === 'color' || prop === 'relleno' || prop === 'borde.color' || prop === 'trazo.color') {
      if (!/^#[0-9a-fA-F]{6}$/.test(valor)) return;
      valor = valor.toUpperCase();
    }
    const mutar = (p) => sel.forEach((e) => {
      escribirProp(e, prop, valor);
      if (prop === 'numero' && e.tipo === 'foto') e.nombre = 'Foto ' + valor;
    });
    if (continuo) {
      if (!enTransaccion) { E.iniciarTransaccion(); enTransaccion = true; }
      mutar(E.obtener());
      E.notificar();
    } else {
      if (enTransaccion) { mutar(E.obtener()); E.notificar(); enTransaccion = false; }
      else E.aplicar(mutar);
    }
  }

  function alEntradaCampo(ev) {
    const n = ev.target;
    if (!n.dataset.prop) return;
    if (n.type === 'color') {
      const m = n.closest('.ed-color-muestra'); if (m) m.style.background = n.value;
      aplicarCampo(n.dataset.prop, n.value, true);
    } else if (n.type === 'range') aplicarCampo(n.dataset.prop, n.value, true);
    else if (n.tagName === 'TEXTAREA') aplicarCampo(n.dataset.prop, n.value, true);
  }

  function alCambiarCampo(ev) {
    const n = ev.target;
    if (!n.dataset.prop) return;
    if (n.type === 'checkbox') aplicarCampo(n.dataset.prop, n.checked, false);
    else aplicarCampo(n.dataset.prop, n.value, false);
  }

  function alClicAccion(ev) {
    const seg = ev.target.closest('.ed-segmento[data-prop]');
    if (seg) {
      if (seg.hasAttribute('data-toggle')) { const e = E.seleccionados()[0]; if (e) aplicarCampo(seg.dataset.prop, !leerProp(e, seg.dataset.prop), false); }
      else aplicarCampo(seg.dataset.prop, seg.dataset.valor, false);
      return;
    }
    const tg = ev.target.closest('.ds-toggle[data-prop]');
    if (tg) { aplicarCampo(tg.dataset.prop, tg.getAttribute('aria-checked') !== 'true', false); return; }
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    ejecutar(b.dataset.accion);
  }

  function ejecutar(accion) {
    const idx = accion.indexOf(':');
    const nombre = idx < 0 ? accion : accion.slice(0, idx);
    const arg = idx < 0 ? undefined : accion.slice(idx + 1);
    const sel = E.seleccionados();
    if (nombre === 'duplicar') { E.duplicarSeleccion(); EditorApp.aviso('Duplicado'); }
    else if (nombre === 'eliminar') E.eliminarSeleccion();
    else if (nombre === 'alinear') E.alinear(arg);
    else if (nombre === 'distribuir') { if (sel.length < 3) { EditorApp.aviso('Seleccioná al menos 3 elementos para distribuir'); return; } E.distribuir(arg); }
    else if (nombre === 'ordenar') E.ordenar(arg);
    else if (nombre === 'bloquear') { E.aplicar(() => sel.forEach((e) => { e.bloqueado = !e.bloqueado; })); E.emitir('seleccion'); }
    else if (nombre === 'subir-imagen') { if (sel[0]) EditorPaneles.subirImagenPara(sel[0].id); }
    else if (nombre === 'ajustar-lienzo') { if (sel[0]) EditorImagenes.ajustarAlLienzo(sel[0].id); }
    else if (nombre === 'ajustar-segura') { if (sel[0]) EditorImagenes.ajustarAlAreaSegura(sel[0].id); }
    else if (nombre === 'detectar-fotos') { if (sel[0]) EditorImagenes.detectarEspacios(sel[0].id); }
    else if (nombre === 'quitar-imagen') E.aplicar(() => sel.forEach((e) => { if (e.tipo === 'foto') e.imagen = null; }));
    else if (nombre === 'negrita') E.aplicar(() => sel.forEach((e) => { if (E.esTextual(e)) e.peso = e.peso >= 700 ? 500 : 700; }));
    else if (nombre === 'cursiva') E.aplicar(() => sel.forEach((e) => { if (E.esTextual(e)) e.cursiva = !e.cursiva; }));
    else if (nombre === 'mayusculas') E.aplicar(() => sel.forEach((e) => { if (E.esTextual(e)) e.mayusculas = e.mayusculas === 'mayusculas' ? 'original' : 'mayusculas'; }));
    else if (nombre === 'cargar-fuente') EditorTipografia.pedirFuente();
    else if (nombre === 'quitar-fuente') EditorTipografia.quitarFuente(arg);
    else if (nombre === 'editar-texto') { if (sel[0]) EditorTipografia.editarEnLienzo(sel[0]); }
    else if (nombre === 'encuadre') E.aplicar(() => sel.forEach((e) => { if (e.encuadre) e.encuadre = e.encuadre === 'cubrir' ? 'contener' : 'cubrir'; }));
  }

  /* ---------- Barra contextual flotante ---------- */

  function renderContextual() {
    const sel = E.seleccionados().filter((e) => e.visible);
    if (!sel.length) { contextual.hidden = true; return; }
    if (!contextual.hidden && contextual.contains(document.activeElement)) { sincronizar(contextual); return; }
    let h = '';
    if (sel.length > 1) {
      h += ALINEAR.map((a) => botonIcono('alinear:' + a[0], a[1], a[2])).join('') + botonIcono('distribuir:x', 'distribuirH', 'Distribuir horizontalmente') + botonIcono('distribuir:y', 'distribuirV', 'Distribuir verticalmente') + '<span class="ed-contextual-sep"></span>';
    } else {
      const e = sel[0];
      if (e.bloqueado) h += '<span class="ed-contextual-num" style="padding-right:8px">' + I.svg('candado') + ' Bloqueado</span>';
      else if (E.esTextual(e)) {
        h += '<select class="ed-contextual-select" data-prop="fuente" title="Fuente">' + EditorTipografia.listaFuentes().map((f) => '<option value="' + esc(f) + '"' + (f === e.fuente ? ' selected' : '') + '>' + esc(f) + '</option>').join('') + '</select>' +
          '<span class="ed-contextual-num" title="Tamaño en puntos"><input type="number" data-prop="tamanoPt" value="' + r1(e.tamanoPt) + '" min="4" step="1">pt</span>' +
          '<button type="button" class="ed-boton-icono' + (e.peso >= 700 ? ' activo' : '') + '" data-accion="negrita" title="Negrita"><b style="font-size:15px">N</b></button>' +
          '<button type="button" class="ed-boton-icono' + (e.cursiva ? ' activo' : '') + '" data-accion="cursiva" title="Cursiva"><i style="font-size:15px;font-family:Georgia,serif">I</i></button>' +
          '<button type="button" class="ed-boton-icono' + (e.mayusculas === 'mayusculas' ? ' activo' : '') + '" data-accion="mayusculas" title="Todo en mayúsculas"><b style="font-size:12px;letter-spacing:0.02em">AA</b></button>' +
          '<span class="ed-contextual-color" title="Color del texto" style="background:' + esc(e.color) + '"><input type="color" data-prop="color" value="' + esc(e.color) + '"></span>' +
          '<span class="ed-contextual-sep"></span>' +
          [['izquierda', 'alineaTextoIzq'], ['centro', 'alineaTextoCentro'], ['derecha', 'alineaTextoDer']].map((a) => '<button type="button" class="ed-boton-icono ed-segmento-ctx' + (e.alineacion === a[0] ? ' activo' : '') + '" data-prop="alineacion" data-valor="' + a[0] + '" title="Alinear ' + a[0] + '">' + I.svg(a[1]) + '</button>').join('') +
          '<span class="ed-contextual-sep"></span>';
      } else if (e.tipo === 'foto') {
        h += botonIcono('encuadre', e.encuadre === 'cubrir' ? 'cubrir' : 'contener', e.encuadre === 'cubrir' ? 'Encuadre: cubrir (tocá para contener)' : 'Encuadre: contener (tocá para cubrir)') +
          '<span class="ed-contextual-num" title="Esquinas redondeadas">' + I.svg('esquinas') + '<input type="number" data-prop="radioMm" value="' + r1(e.radioMm) + '" min="0" step="0.5">mm</span>' +
          '<span class="ed-contextual-num" title="Ancho del borde">' + I.svg('borde') + '<input type="number" data-prop="borde.anchoMm" value="' + r1(e.borde.anchoMm) + '" min="0" step="0.5">mm</span>' +
          botonIcono('subir-imagen', 'imagen', 'Foto de prueba') +
          '<span class="ed-contextual-sep"></span>';
      } else if (e.tipo === 'forma') {
        h += '<span class="ed-contextual-color" title="Relleno" style="background:' + esc(e.relleno) + '"><input type="color" data-prop="relleno" value="' + esc(e.relleno) + '"></span>' +
          (e.figura === 'rectangulo' ? '<span class="ed-contextual-num" title="Esquinas redondeadas">' + I.svg('esquinas') + '<input type="number" data-prop="radioMm" value="' + r1(e.radioMm) + '" min="0" step="0.5">mm</span>' : '') +
          '<span class="ed-contextual-sep"></span>';
      } else if (e.tipo === 'imagen') {
        h += botonIcono('subir-imagen', 'imagen', e.origen ? 'Reemplazar imagen' : 'Cargar imagen') +
          (e.origen ? botonIcono('ajustar-lienzo', 'ajustar', 'Ajustar al lienzo (ocupar todo el papel)') + botonIcono('detectar-fotos', 'foto', 'Detectar espacios de foto en esta imagen') : '') +
          botonIcono('encuadre', e.encuadre === 'cubrir' ? 'cubrir' : 'contener', 'Cambiar encuadre') +
          '<span class="ed-contextual-num" title="Esquinas redondeadas">' + I.svg('esquinas') + '<input type="number" data-prop="radioMm" value="' + r1(e.radioMm) + '" min="0" step="0.5">mm</span>' +
          '<span class="ed-contextual-sep"></span>';
      }
    }
    const unico = sel.length === 1 ? sel[0] : null;
    h += botonIcono('duplicar', 'duplicar', 'Duplicar (Ctrl+D)') +
      botonIcono('ordenar:subir', 'subir', 'Subir un nivel (Ctrl+])') +
      botonIcono('ordenar:bajar', 'bajar', 'Bajar un nivel (Ctrl+[)') +
      botonIcono('bloquear', unico && unico.bloqueado ? 'candado' : 'candadoAbierto', unico && unico.bloqueado ? 'Desbloquear (Ctrl+L)' : 'Bloquear (Ctrl+L)', unico && unico.bloqueado ? 'activo' : '') +
      botonIcono('eliminar', 'eliminar', 'Eliminar (Supr)', 'ed-boton-icono--peligro');
    contextual.innerHTML = h;
    contextual.hidden = false;
    contextual.querySelectorAll('.ed-segmento-ctx').forEach((b) => b.addEventListener('click', () => aplicarCampo(b.dataset.prop, b.dataset.valor, false)));
    posicionarContextual(EditorLienzo.cajaSeleccionEnVisor());
  }

  function posicionarContextual(caja) {
    if (!caja || contextual.hidden) { if (!caja) contextual.hidden = true; return; }
    const vw = visor.clientWidth, vh = visor.clientHeight;
    const w = contextual.offsetWidth, hgt = contextual.offsetHeight;
    let left = caja.left + caja.width / 2 - w / 2;
    let top = caja.top - hgt - 34;
    if (top < 30) top = caja.top + caja.height + 34;
    if (top + hgt > vh - 8) top = Math.max(30, vh - hgt - 8);
    left = Math.max(30, Math.min(vw - w - 8, left));
    contextual.style.left = Math.round(left) + 'px';
    contextual.style.top = Math.round(top) + 'px';
  }

  /* ---------- Capas ---------- */

  function renderCapas() {
    const p = E.obtener();
    const sel = E.obtenerSeleccion();
    const lista = p.elementos.slice().sort((a, b) => b.orden - a.orden);
    contadorCapas.textContent = lista.length;
    if (!lista.length) { listaCapas.innerHTML = '<div class="ed-capas-vacio">Todavía no hay capas. Cada elemento que agregues aparece acá; arrastrá para cambiar el orden.</div>'; return; }
    listaCapas.innerHTML = lista.map((e) => '<div class="ed-capa' + (sel.includes(e.id) ? ' activa' : '') + (e.visible ? '' : ' oculta') + (e.bloqueado ? ' bloqueada' : '') + '" data-id="' + e.id + '"><span class="ed-capa-icono">' + I.svg(ICONO_TIPO[e.tipo]) + '</span><span class="ed-capa-nombre" title="Doble clic para renombrar">' + esc(e.nombre) + '</span><span class="ed-capa-acciones">' + botonIcono('visible', e.visible ? 'ojo' : 'ojoCerrado', e.visible ? 'Ocultar' : 'Mostrar', e.visible ? '' : 'activo') + botonIcono('bloqueo', e.bloqueado ? 'candado' : 'candadoAbierto', e.bloqueado ? 'Desbloquear' : 'Bloquear', e.bloqueado ? 'activo' : '') + '</span></div>').join('');
  }

  function alClicCapa(ev) {
    const fila = ev.target.closest('.ed-capa');
    if (!fila) return;
    const id = fila.dataset.id;
    const b = ev.target.closest('[data-accion]');
    if (b) {
      if (b.dataset.accion === 'visible') E.aplicar(() => { const e = E.porId(id); e.visible = !e.visible; });
      if (b.dataset.accion === 'bloqueo') { E.aplicar(() => { const e = E.porId(id); e.bloqueado = !e.bloqueado; }); E.emitir('seleccion'); }
      return;
    }
    if (ev.target.classList.contains('ed-capa-nombre-input')) return;
    if (ev.shiftKey) E.alternarSeleccion(id); else E.seleccionar([id]);
  }

  function alDobleClicCapa(ev) {
    const fila = ev.target.closest('.ed-capa');
    if (!fila || ev.target.closest('[data-accion]')) return;
    const nombre = fila.querySelector('.ed-capa-nombre');
    if (!nombre) return;
    const e = E.porId(fila.dataset.id);
    const input = document.createElement('input');
    input.className = 'ed-capa-nombre-input';
    input.value = e.nombre;
    nombre.replaceWith(input);
    input.focus(); input.select();
    let listo = false;
    const confirmar = () => { if (listo) return; listo = true; const v = input.value.trim(); if (v && v !== e.nombre) E.aplicar(() => { e.nombre = v; }); else renderCapas(); firmaActual = ''; renderPropiedades(); };
    input.addEventListener('keydown', (k) => { if (k.key === 'Enter') confirmar(); if (k.key === 'Escape') { listo = true; renderCapas(); } k.stopPropagation(); });
    input.addEventListener('blur', confirmar);
  }

  function alPresionarCapa(ev) {
    const fila = ev.target.closest('.ed-capa');
    if (!fila || ev.button !== 0 || ev.target.closest('[data-accion], input')) return;
    arrastreCapa = { id: fila.dataset.id, fila, sy: ev.clientY, activo: false, destino: null, antes: true };
  }
  function alMoverCapa(ev) {
    if (!arrastreCapa) return;
    const a = arrastreCapa;
    if (!a.activo) { if (Math.abs(ev.clientY - a.sy) < 4) return; a.activo = true; a.fila.classList.add('arrastrando'); }
    listaCapas.querySelectorAll('.ed-capa').forEach((f) => f.classList.remove('destino-arriba', 'destino-abajo'));
    const bajo = document.elementFromPoint(ev.clientX, ev.clientY);
    const fila = bajo && bajo.closest ? bajo.closest('.ed-capa') : null;
    if (!fila || fila === a.fila) { a.destino = null; return; }
    const r = fila.getBoundingClientRect();
    a.antes = ev.clientY < r.top + r.height / 2;
    a.destino = fila.dataset.id;
    fila.classList.add(a.antes ? 'destino-arriba' : 'destino-abajo');
  }
  function alSoltarCapa() {
    if (!arrastreCapa) return;
    const a = arrastreCapa;
    arrastreCapa = null;
    a.fila.classList.remove('arrastrando');
    listaCapas.querySelectorAll('.ed-capa').forEach((f) => f.classList.remove('destino-arriba', 'destino-abajo'));
    if (a.activo && a.destino) E.moverCapa(a.id, a.destino, a.antes);
  }

  function enfocarContenido() {
    const ta = panelProps.querySelector('textarea[data-prop="contenido"]');
    if (ta) { ta.focus(); ta.select(); }
  }

  return { iniciar, enfocarContenido, ejecutar };
})();

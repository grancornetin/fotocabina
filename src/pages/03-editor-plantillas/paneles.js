const EditorPaneles = (() => {
  const E = EditorEstado;
  const I = EditorIconos;
  const TITULOS = { fotos: 'Fotos', texto: 'Texto', formas: 'Formas', imagenes: 'Imágenes', datos: 'Datos del evento', fondo: 'Fondo', papel: 'Papel' };
  const PALETA = ['#FFFFFF', '#F4F5F2', '#DCDEDA', '#8A8D91', '#3A3D42', '#111214', '#000000', '#C6FF3D', '#FFB13D', '#FF4D4D', '#FF7AB6', '#B48CFF', '#4DA3FF', '#35D0BA', '#2E8B57', '#F5E6C8'];

  let app, panel, titulo, cuerpo, rail, inputImagen;
  let abierto = null;
  let destinoImagen = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r1 = (n) => Math.round(n * 10) / 10;

  function iniciar() {
    app = document.getElementById('ed-app');
    panel = document.getElementById('ed-panel');
    titulo = document.getElementById('ed-panel-titulo');
    cuerpo = document.getElementById('ed-panel-cuerpo');
    rail = document.getElementById('ed-rail');
    inputImagen = document.getElementById('ed-subir-imagen');

    rail.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-panel]');
      if (!b) return;
      alternar(b.dataset.panel);
    });
    document.getElementById('ed-panel-cerrar').addEventListener('click', cerrar);
    cuerpo.addEventListener('click', alClic);
    cuerpo.addEventListener('change', alCambiar);
    cuerpo.addEventListener('input', alEntrada);
    inputImagen.addEventListener('change', alElegirArchivo);
    E.suscribir('cambio', () => { if (abierto && !cuerpo.contains(document.activeElement)) render(); });
    E.suscribir('seleccion', () => { if (abierto === 'fotos') render(); });
  }

  function alternar(nombre) {
    if (abierto === nombre) cerrar(); else abrir(nombre);
  }

  function abrir(nombre) {
    abierto = nombre;
    rail.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('activo', b.dataset.panel === nombre));
    titulo.textContent = TITULOS[nombre];
    panel.hidden = false;
    app.classList.add('panel-abierto');
    render();
  }

  function cerrar() {
    abierto = null;
    rail.querySelectorAll('[data-panel]').forEach((b) => b.classList.remove('activo'));
    panel.hidden = true;
    app.classList.remove('panel-abierto');
  }

  function tarjeta(accion, icono, etiqueta, ancha, sub, deshabilitada) {
    return '<button type="button" class="ed-tarjeta-agregar' + (ancha ? ' ed-tarjeta-agregar--ancha' : '') + '" data-accion="' + accion + '"' + (deshabilitada ? ' disabled' : '') + '>' + I.svg(icono) + (ancha ? '<span class="ed-tarjeta-texto"><span>' + etiqueta + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' : '<span>' + etiqueta + '</span>') + '</button>';
  }
  function segmentos(prop, valor, opciones) {
    return '<div class="ed-segmentos">' + opciones.map((o) => '<button type="button" class="ed-segmento" data-prop="' + prop + '" data-valor="' + o.v + '" aria-pressed="' + (String(o.v) === String(valor)) + '">' + (o.i ? I.svg(o.i) : '') + '<span>' + o.l + '</span></button>').join('') + '</div>';
  }
  function campoNum(etiqueta, prop, valor, unidad, extra = '') {
    return '<div class="ed-campo"><label>' + etiqueta + '</label><div class="ed-campo-unidad" data-unidad="' + unidad + '"><input class="ed-input" type="number" data-prop="' + prop + '" value="' + r1(valor) + '" ' + extra + '></div></div>';
  }
  function filaToggle(etiqueta, prop, valor, ayuda) {
    return '<div class="ed-fila-toggle"><span>' + etiqueta + (ayuda ? '<small>' + ayuda + '</small>' : '') + '</span><button type="button" class="ds-toggle" role="switch" data-prop="' + prop + '" aria-checked="' + (!!valor) + '"></button></div>';
  }

  function render() {
    const p = E.obtener();
    let h = '';
    if (abierto === 'fotos') {
      const fotos = p.elementos.filter((e) => e.tipo === 'foto').sort((a, b) => a.numero - b.numero || a.orden - b.orden);
      const sel = E.obtenerSeleccion();
      h += tarjeta('agregar:foto', 'foto', 'Agregar espacio de foto', true, 'Atajo: F');
      h += '<p class="ed-panel-nota">Cada espacio se rellena con una foto de la sesión, en orden. Esta plantilla pide <b>' + E.fotosPorSesion() + ' foto' + (E.fotosPorSesion() === 1 ? '' : 's') + '</b> por sesión.</p>';
      if (fotos.length) h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Espacios en el lienzo</h3><div class="ed-lista-fotos">' + fotos.map((f) => '<button type="button" class="ed-fila-foto' + (sel.includes(f.id) ? ' activa' : '') + '" data-accion="ir:' + f.id + '"><span class="ed-fila-foto-num">' + f.numero + '</span><span class="ed-fila-foto-nombre">' + esc(f.nombre) + '</span><span class="ed-fila-foto-medida">' + r1(f.anchoMm) + ' × ' + r1(f.altoMm) + ' mm</span></button>').join('') + '</div></div>';
    } else if (abierto === 'texto') {
      h += tarjeta('agregar:texto', 'texto', 'Agregar texto', true, 'Atajo: T');
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Estilos rápidos</h3><div class="ed-lista-agregar">' +
        '<button type="button" class="ed-tarjeta-agregar ed-tarjeta-agregar--ancha" data-accion="texto:titulo"><span class="ed-tarjeta-texto" style="font-size:1.25rem;font-weight:800;letter-spacing:-0.02em">Título</span></button>' +
        '<button type="button" class="ed-tarjeta-agregar ed-tarjeta-agregar--ancha" data-accion="texto:subtitulo"><span class="ed-tarjeta-texto" style="font-size:1rem;font-weight:600">Subtítulo</span></button>' +
        '<button type="button" class="ed-tarjeta-agregar ed-tarjeta-agregar--ancha" data-accion="texto:pie"><span class="ed-tarjeta-texto" style="font-size:0.8125rem;font-weight:500;color:var(--color-fog)">Pie de foto</span></button>' +
        '</div></div>';
      const familias = EditorTipografia.familiasCargadas();
      const nombrePeso = (p) => (EditorTipografia.PESOS.find((x) => x[0] === p) || [p, String(p)])[1];
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Fuentes propias</h3>' +
        tarjeta('cargar-fuente', 'subir', 'Cargar fuentes', true, '.ttf, .otf, .woff, .woff2 · podés elegir varios archivos a la vez') +
        (familias.length ? '<div class="ed-lista-fotos">' + familias.map((fam) => {
          const vars = EditorTipografia.variantesDe(fam).sort((a, b) => a.peso - b.peso || (a.cursiva ? 1 : -1));
          const detalle = vars.map((v) => nombrePeso(v.peso) + (v.cursiva ? ' cursiva' : '')).join(', ');
          return '<div class="ed-fuente-fila"><span><b style="font-family:\'' + esc(fam) + '\'">' + esc(fam) + '</b><br><small style="color:var(--color-fog)">' + esc(detalle) + '</small></span><button type="button" class="ed-boton-icono ed-boton-icono--peligro" data-accion="quitar-fuente:' + esc(fam) + '" title="Quitar la familia completa de la plantilla">' + I.svg('cerrar') + '</button></div>';
        }).join('') + '</div><p class="ed-panel-nota">Los archivos de una misma familia (Regular, Bold, Italic…) se agrupan: elegís la familia y después el peso o la cursiva.</p>' : '<p class="ed-panel-nota">Usá solo fuentes con licencia para tu negocio. Las de Google Fonts descargadas como .ttf sirven. Cargá juntos Regular, Bold e Italic para tener la familia completa.</p>') + '</div>';
    } else if (abierto === 'formas') {
      h += '<div class="ed-lista-agregar">' + tarjeta('forma:rectangulo', 'rectangulo', 'Rectángulo') + tarjeta('forma:circulo', 'circulo', 'Círculo') + tarjeta('forma:linea', 'linea', 'Línea') + '</div>';
      h += '<p class="ed-panel-nota">Las formas sirven de fondo para textos, separadores o marcos. Se colorean y redondean desde el inspector.</p>';
    } else if (abierto === 'imagenes') {
      h += tarjeta('agregar:imagen', 'imagen', 'Subir imagen', true, 'PNG, JPG, WebP o SVG · Atajo: I');
      h += '<p class="ed-panel-nota">También podés <b>arrastrar una imagen desde una carpeta</b> y soltarla sobre el lienzo (o sobre un espacio de foto, como foto de prueba).</p>';
      h += '<p class="ed-panel-nota">Si diseñaste la plantilla en Canva con rectángulos negros donde van las fotos: soltala, tocá <b>Al lienzo</b> y después <b>Detectar espacios de foto</b>. Un <b>PNG con transparencia</b> se apoya sobre las fotos sin fondo.</p>';
      const imgs = p.elementos.filter((e) => e.tipo === 'imagen');
      if (imgs.length) h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">En el lienzo</h3><div class="ed-lista-fotos">' + imgs.map((f) => '<button type="button" class="ed-fila-foto" data-accion="ir:' + f.id + '"><span class="ed-fila-foto-num">' + I.svg('imagen') + '</span><span class="ed-fila-foto-nombre">' + esc(f.nombre) + '</span><span class="ed-fila-foto-medida">' + (f.nombreArchivo ? esc(f.nombreArchivo) : 'sin archivo') + '</span></button>').join('') + '</div></div>';
    } else if (abierto === 'datos') {
      h += '<div class="ed-lista-agregar">' + tarjeta('dato:fecha', 'dato', 'Fecha') + tarjeta('dato:fechaHora', 'dato', 'Fecha y hora') + tarjeta('dato:numeroSesion', 'dato', 'N.º de sesión') + tarjeta('dato:nombreEvento', 'dato', 'Nombre del evento') + '</div>';
      h += '<p class="ed-panel-nota">Textos que la cabina completa sola en cada sesión. En el editor ves un valor de muestra (la fecha de hoy, "#048"). Se formatean igual que cualquier texto.</p>';
      h += '<p class="ed-panel-nota">El QR de entrega digital no va en la plantilla: lo muestra la cabina en una esquina de la pantalla final, y lleva a las fotos y a la copia digital de la tira.</p>';
    } else if (abierto === 'fondo') {
      h += '<div class="ed-campo"><label>Color de fondo</label><div class="ed-color"><span class="ed-color-muestra" style="background:' + esc(p.fondo.color) + '"><input type="color" data-prop="fondo.color" value="' + esc(p.fondo.color) + '"></span><input class="ed-input" type="text" data-prop="fondo.color" data-texto-color value="' + esc(p.fondo.color) + '" maxlength="7" spellcheck="false"></div></div>';
      h += '<div class="ed-campo"><label>Paleta</label><div class="ed-paleta">' + PALETA.map((c) => '<button type="button" class="ed-paleta-color' + (c.toUpperCase() === p.fondo.color.toUpperCase() ? ' activo' : '') + '" data-accion="fondo:' + c + '" style="background:' + c + '" title="' + c + '"></button>').join('') + '</div></div>';
      h += '<p class="ed-panel-nota">El fondo se imprime. Para impresoras de sublimación, el blanco puro es el papel sin tinta.</p>';
    } else if (abierto === 'papel') {
      const pp = p.papel;
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Formato</h3>' + segmentos('papel.preset', pp.preset, [{ v: 'tira-2x6', l: '2 × 6' }, { v: 'hoja-4x6', l: '4 × 6' }, { v: 'libre', l: 'Libre' }]) +
        segmentos('papel.orientacion', pp.orientacion, [{ v: 'vertical', l: 'Vertical' }, { v: 'horizontal', l: 'Horizontal' }]) +
        '<div class="ed-campos-2">' + campoNum('Ancho', 'papel.anchoMm', pp.anchoMm, 'mm', 'step="0.1" min="10"' + (pp.preset === 'libre' ? '' : ' disabled')) + campoNum('Alto', 'papel.altoMm', pp.altoMm, 'mm', 'step="0.1" min="10"' + (pp.preset === 'libre' ? '' : ' disabled')) + '</div>' +
        campoNum('Resolución', 'papel.ppp', pp.ppp, 'ppp', 'step="50" min="72" max="600"') +
        '<p class="ed-panel-nota">Salida a ' + pp.ppp + ' ppp: <b>' + Math.round(pp.anchoMm / 25.4 * pp.ppp) + ' × ' + Math.round(pp.altoMm / 25.4 * pp.ppp) + ' px</b>.</p></div>';
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Márgenes</h3><div class="ed-campos-2">' + campoNum('Sangrado', 'papel.sangradoMm', pp.sangradoMm, 'mm', 'step="0.5" min="0"') + campoNum('Área segura', 'papel.areaSeguraMm', pp.areaSeguraMm, 'mm', 'step="0.5" min="0"') + '</div>' +
        '<p class="ed-panel-nota">La línea gris marca el sangrado (lo que puede recortar la impresora); la roja, el área segura donde conviene mantener textos y logos.</p>' +
        filaToggle('Duplicar en hoja 4 × 6', 'papel.duplicarEnHoja', pp.duplicarEnHoja, 'Dos tiras iguales por hoja, con corte al medio') + '</div>';
      h += '<div class="ed-bloque"><h3 class="ed-seccion-titulo">Asistencia</h3>' + filaToggle('Imán a guías y bordes', 'asistencia.iman', p.asistencia.iman, 'Centros, bordes, guías y espaciado igual') + filaToggle('Cuadrícula', 'asistencia.cuadricula', p.asistencia.cuadricula, 'Ajusta la posición a pasos fijos') + (p.asistencia.cuadricula ? campoNum('Paso de cuadrícula', 'asistencia.pasoCuadriculaMm', p.asistencia.pasoCuadriculaMm, 'mm', 'step="1" min="1"') : '') + '</div>';
    }
    cuerpo.innerHTML = h;
  }

  function leer(o, ruta) { return ruta.split('.').reduce((x, k) => (x == null ? x : x[k]), o); }
  function escribir(o, ruta, v) { const ps = ruta.split('.'); let x = o; for (let i = 0; i < ps.length - 1; i++) x = x[ps[i]]; x[ps[ps.length - 1]] = v; }

  function aplicarProp(prop, valor) {
    const p = E.obtener();
    if (prop.startsWith('papel.')) {
      const clave = prop.slice(6);
      let v = valor;
      if (['anchoMm', 'altoMm', 'ppp', 'sangradoMm', 'areaSeguraMm'].includes(clave)) { v = Number(valor); if (!isFinite(v)) return; if (clave === 'anchoMm' || clave === 'altoMm') v = Math.max(10, v); if (clave === 'ppp') v = Math.max(72, Math.min(600, v)); else v = Math.max(0, v); }
      const cambios = {}; cambios[clave] = v;
      E.cambiarPapel(cambios);
      if (clave === 'preset' || clave === 'orientacion') EditorLienzo.ajustarAPantalla();
      return;
    }
    if (prop === 'fondo.color') {
      if (!/^#[0-9a-fA-F]{6}$/.test(valor)) return;
      E.aplicar((pl) => { pl.fondo.color = valor.toUpperCase(); });
      return;
    }
    if (prop.startsWith('asistencia.')) {
      let v = valor;
      if (prop === 'asistencia.pasoCuadriculaMm') { v = Math.max(1, Number(valor) || 5); }
      E.aplicar((pl) => escribir(pl, prop, v));
      return;
    }
  }

  function alClic(ev) {
    const seg = ev.target.closest('.ed-segmento[data-prop]');
    if (seg) { aplicarProp(seg.dataset.prop, seg.dataset.valor); return; }
    const tg = ev.target.closest('.ds-toggle[data-prop]');
    if (tg) { aplicarProp(tg.dataset.prop, tg.getAttribute('aria-checked') !== 'true'); return; }
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    const idx = b.dataset.accion.indexOf(':');
    const nombre = idx < 0 ? b.dataset.accion : b.dataset.accion.slice(0, idx);
    const arg = idx < 0 ? undefined : b.dataset.accion.slice(idx + 1);
    if (nombre === 'agregar') {
      if (arg === 'imagen') { const e = E.agregarElemento('imagen'); subirImagenPara(e.id); }
      else E.agregarElemento(arg);
      EditorApp.aviso(arg === 'foto' ? 'Espacio de foto agregado' : arg === 'texto' ? 'Texto agregado' : 'Imagen agregada');
    } else if (nombre === 'dato') {
      E.agregarElemento('dato', { campo: arg, formato: arg === 'numeroSesion' ? 'numeral' : 'corta' });
      EditorApp.aviso(E.NOMBRES_DATO[arg] + ' agregado · se completa en cada sesión');
    } else if (nombre === 'texto') {
      const presets = { titulo: { nombre: 'Título', contenido: 'TÍTULO', tamanoPt: 18, peso: 800, altoMm: 10 }, subtitulo: { nombre: 'Subtítulo', contenido: 'Subtítulo', tamanoPt: 12, peso: 600, altoMm: 8 }, pie: { nombre: 'Pie', contenido: 'Pie de foto', tamanoPt: 8, peso: 500, altoMm: 6 } };
      E.agregarElemento('texto', presets[arg]);
    } else if (nombre === 'forma') {
      const nombres = { rectangulo: 'Rectángulo', circulo: 'Círculo', linea: 'Línea' };
      E.agregarElemento('forma', { figura: arg, nombre: nombres[arg] });
    } else if (nombre === 'ir') {
      E.seleccionar([arg]);
      EditorLienzo.centrarEn(arg);
    } else if (nombre === 'fondo') {
      aplicarProp('fondo.color', arg);
    } else if (nombre === 'cargar-fuente') {
      EditorTipografia.pedirFuente();
    } else if (nombre === 'quitar-fuente') {
      EditorTipografia.quitarFuente(arg);
    }
  }

  function alCambiar(ev) {
    const n = ev.target;
    if (!n.dataset.prop) return;
    aplicarProp(n.dataset.prop, n.value);
  }
  function alEntrada(ev) {
    const n = ev.target;
    if (n.type === 'color' && n.dataset.prop === 'fondo.color') {
      const m = n.closest('.ed-color-muestra'); if (m) m.style.background = n.value;
      const texto = cuerpo.querySelector('[data-texto-color]'); if (texto) texto.value = n.value.toUpperCase();
      document.getElementById('ed-lienzo').style.background = n.value;
    }
  }

  /* ---------- Carga de imágenes ---------- */

  function subirImagenPara(id) {
    destinoImagen = id;
    inputImagen.value = '';
    inputImagen.click();
  }

  function alElegirArchivo() {
    const archivo = inputImagen.files && inputImagen.files[0];
    if (!archivo || !destinoImagen) return;
    EditorImagenes.aplicarArchivoA(destinoImagen, archivo);
  }

  return { iniciar, abrir, cerrar, alternar, subirImagenPara, estaAbierto: () => abierto };
})();

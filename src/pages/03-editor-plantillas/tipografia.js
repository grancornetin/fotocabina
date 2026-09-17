const EditorTipografia = (() => {
  const E = EditorEstado;
  const FUENTES_SISTEMA = ['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Tahoma', 'Courier New', 'Impact', 'Segoe UI', 'Palatino Linotype', 'Comic Sans MS'];
  const PESOS = [[300, 'Fina'], [400, 'Normal'], [500, 'Media'], [600, 'Seminegrita'], [700, 'Negrita'], [800, 'Extra'], [900, 'Negra']];
  const LIMITE_FUENTE = 6 * 1024 * 1024;
  const TAMANO_MIN_PT = 4;
  const registradas = new Map();
  let inputFuente;
  let editando = null;

  function iniciar() {
    inputFuente = document.getElementById('ed-subir-fuente');
    inputFuente.addEventListener('change', alElegirFuente);
    E.suscribir('cambio', registrarFuentes);
    document.fonts.ready.then(() => { if (E.obtener()) EditorLienzo.dibujar(); });
  }

  const fuentesCargadas = () => E.obtener().recursos.fuentes || [];
  const familiasCargadas = () => Array.from(new Set(fuentesCargadas().map((f) => f.familia)));
  const listaFuentes = () => FUENTES_SISTEMA.concat(familiasCargadas().filter((f) => !FUENTES_SISTEMA.includes(f)));

  // Variantes de una familia (peso y cursiva) según los archivos cargados.
  function variantesDe(familia) {
    return fuentesCargadas().filter((f) => f.familia === familia).map((f) => ({ peso: f.peso || 400, cursiva: !!f.cursiva, archivo: f.archivo }));
  }

  const PESOS_POR_NOMBRE = [
    ['extrablack', 950], ['ultrablack', 950], ['black', 900], ['heavy', 900],
    ['extrabold', 800], ['ultrabold', 800], ['bold', 700], ['semibold', 600], ['demibold', 600], ['demi', 600],
    ['medium', 500], ['regular', 400], ['normal', 400], ['book', 400], ['roman', 400], ['text', 400],
    ['light', 300], ['extralight', 200], ['ultralight', 200], ['thin', 100], ['hairline', 100],
  ];

  // "Montserrat-BoldItalic.otf" → { familia: "Montserrat", peso: 700, cursiva: true }
  function interpretarNombre(nombreArchivo) {
    let base = nombreArchivo.replace(/\.[^.]+$/, '');
    base = base.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();
    const crudos = base.split(' ');
    const tokens = [];
    for (let i = 0; i < crudos.length; i++) {
      const k = crudos[i].toLowerCase();
      if (['semi', 'demi', 'extra', 'ultra'].includes(k) && i + 1 < crudos.length) { tokens.push(crudos[i] + crudos[i + 1]); i++; }
      else tokens.push(crudos[i]);
    }
    let peso = 400, cursiva = false;
    const restantes = [];
    tokens.forEach((t) => {
      const k = t.toLowerCase();
      if (k === 'italic' || k === 'oblique' || k === 'ital' || k === 'it') { cursiva = true; return; }
      const compuesto = k.replace(/italic$|oblique$/, '');
      if (compuesto !== k) cursiva = true;
      const hallado = PESOS_POR_NOMBRE.find((p) => p[0] === compuesto);
      if (hallado) { peso = hallado[1]; return; }
      if (/^\d{3}$/.test(k) && Number(k) >= 100 && Number(k) <= 950) { peso = Number(k); return; }
      if (k === 'webfont' || k === 'web' || k === 'variablefont' || k === 'variable' || k === 'wght') return;
      restantes.push(t);
    });
    const familia = restantes.join(' ').trim().slice(0, 40) || 'Fuente';
    return { familia, peso, cursiva };
  }

  function registrarFuentes() {
    fuentesCargadas().forEach((f) => {
      const clave = f.familia + '|' + (f.peso || 400) + '|' + (f.cursiva ? 'i' : 'n');
      if (registradas.has(clave)) return;
      registradas.set(clave, 'cargando');
      const cara = new FontFace(f.familia, 'url(' + f.dataURL + ')', { weight: String(f.peso || 400), style: f.cursiva ? 'italic' : 'normal' });
      cara.load().then((c) => { document.fonts.add(c); registradas.set(clave, 'lista'); EditorLienzo.dibujar(); })
        .catch(() => { registradas.set(clave, 'error'); EditorApp.aviso('No se pudo usar el archivo "' + f.archivo + '"'); });
    });
  }

  function pedirFuente() {
    inputFuente.value = '';
    inputFuente.click();
  }

  function alElegirFuente() {
    const archivos = Array.from(inputFuente.files || []);
    if (!archivos.length) return;
    const validos = archivos.filter((a) => /\.(ttf|otf|woff2?)$/i.test(a.name) && a.size <= LIMITE_FUENTE);
    if (!validos.length) { EditorApp.aviso('Formatos aceptados: .ttf, .otf, .woff, .woff2 (hasta 6 MB)'); return; }
    Promise.all(validos.map((archivo) => new Promise((resolver) => {
      const lector = new FileReader();
      lector.onerror = () => resolver(null);
      lector.onload = () => resolver(Object.assign(interpretarNombre(archivo.name), { archivo: archivo.name, dataURL: lector.result }));
      lector.readAsDataURL(archivo);
    }))).then((leidas) => {
      const fuentes = leidas.filter(Boolean);
      if (!fuentes.length) { EditorApp.aviso('No se pudieron leer los archivos'); return; }
      const sel = E.seleccionados().filter((e) => e.tipo === 'texto');
      const familia = fuentes[0].familia;
      E.aplicar((p) => {
        fuentes.forEach((f) => {
          p.recursos.fuentes = p.recursos.fuentes.filter((x) => !(x.familia === f.familia && (x.peso || 400) === f.peso && !!x.cursiva === f.cursiva));
          p.recursos.fuentes.push(f);
        });
        sel.forEach((e) => { e.fuente = familia; });
      });
      E.emitir('seleccion');
      const familias = Array.from(new Set(fuentes.map((f) => f.familia)));
      EditorApp.aviso((fuentes.length === 1 ? 'Fuente "' + familia + '"' : fuentes.length + ' archivos de ' + familias.join(', ')) + ' · ' + (sel.length ? 'aplicada al texto' : 'lista para usar'));
    });
  }

  function quitarFuente(familia) {
    E.aplicar((p) => {
      p.recursos.fuentes = p.recursos.fuentes.filter((f) => f.familia !== familia);
      p.elementos.forEach((e) => { if (e.tipo === 'texto' && e.fuente === familia) e.fuente = 'Inter'; });
    });
    E.emitir('seleccion');
  }

  /* ---------- Ajuste del texto a su caja ---------- */

  // "crecer": la caja se alarga hasta que entra todo el texto (nunca se achica sola).
  // "reducir": el tamaño de letra baja hasta que el texto entra en la caja (solo en pantalla; el modelo guarda el tamaño pedido).
  // "fijo": se recorta lo que no entra.
  function ajustarNodo(n, e) {
    const c = n.firstChild;
    if (!c) return;
    const escala = EditorLienzo.obtenerEscala();
    const base = e.tamanoPt * E.PT_A_MM * escala;
    n.style.fontSize = base + 'px';
    n.dataset.reducido = '';
    const desborda = () => c.scrollHeight > n.clientHeight - EditorLienzo.mmAPx(1) + 0.5 || c.scrollWidth > n.clientWidth - EditorLienzo.mmAPx(1) + 0.5;
    if (e.ajuste === 'reducir') {
      let tam = base;
      let vueltas = 0;
      while (desborda() && tam > TAMANO_MIN_PT * E.PT_A_MM * escala && vueltas++ < 40) {
        tam *= 0.94;
        n.style.fontSize = tam + 'px';
      }
      if (tam < base) n.dataset.reducido = Math.round(tam / (E.PT_A_MM * escala)) + ' pt';
    } else if (e.ajuste === 'crecer') {
      const necesarioMm = EditorLienzo.pxAMm(c.scrollHeight) + 1;
      if (necesarioMm > e.altoMm + 0.05) {
        e.altoMm = E.redondear(Math.min(E.obtener().papel.altoMm - e.yMm, necesarioMm), 2);
        n.style.height = EditorLienzo.mmAPx(e.altoMm) + 'px';
        E.persistirSilencioso();
        return true;
      }
    }
    return false;
  }

  function ajustarTodos() {
    let cambio = false;
    E.obtener().elementos.filter((e) => E.esTextual(e) && e.visible).forEach((e) => {
      const n = EditorLienzo.nodo(e.id);
      if (n && ajustarNodo(n, e)) cambio = true;
    });
    if (cambio) EditorLienzo.dibujarSeleccion();
  }

  /* ---------- Edición directa sobre el lienzo ---------- */

  function editarEnLienzo(e) {
    if (!e || e.tipo !== 'texto' || e.bloqueado) return;
    terminarEdicion(true);
    const n = EditorLienzo.nodo(e.id);
    if (!n) return;
    const c = n.firstChild;
    E.seleccionar([e.id]);
    n.classList.add('editando');
    c.contentEditable = 'true';
    c.spellcheck = false;
    editando = { id: e.id, nodo: n, contenido: c, original: e.contenido };
    c.focus();
    const rango = document.createRange();
    rango.selectNodeContents(c);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rango);
    c.addEventListener('input', alEscribir);
    c.addEventListener('keydown', alTeclaEdicion);
    c.addEventListener('blur', () => terminarEdicion(true));
    EditorApp.pista('Escribiendo · Enter = nueva línea · Esc o clic afuera = terminar');
  }

  function alEscribir() {
    if (!editando) return;
    const e = E.porId(editando.id);
    if (!e) return;
    const n = editando.nodo;
    ajustarNodo(n, Object.assign({}, e, { contenido: editando.contenido.innerText }));
  }

  function alTeclaEdicion(ev) {
    ev.stopPropagation();
    if (ev.key === 'Escape') { ev.preventDefault(); terminarEdicion(false); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); terminarEdicion(true); }
  }

  function terminarEdicion(guardar) {
    if (!editando) return;
    const ed = editando;
    editando = null;
    const texto = ed.contenido.innerText.replace(/\n$/, '');
    ed.contenido.contentEditable = 'false';
    ed.nodo.classList.remove('editando');
    ed.contenido.removeEventListener('input', alEscribir);
    ed.contenido.removeEventListener('keydown', alTeclaEdicion);
    EditorApp.pista(null);
    const e = E.porId(ed.id);
    if (!e) return;
    if (guardar && texto !== ed.original) E.aplicar(() => { e.contenido = texto; });
    else EditorLienzo.dibujar();
  }

  const estaEditando = () => !!editando;

  return { iniciar, FUENTES_SISTEMA, PESOS, listaFuentes, fuentesCargadas, familiasCargadas, variantesDe, interpretarNombre, registrarFuentes, pedirFuente, quitarFuente, ajustarNodo, ajustarTodos, editarEnLienzo, terminarEdicion, estaEditando };
})();

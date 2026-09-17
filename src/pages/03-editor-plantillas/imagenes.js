const EditorImagenes = (() => {
  const E = EditorEstado;
  const TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
  const LIMITE_BYTES = 12 * 1024 * 1024;
  let visor;

  function iniciar() {
    visor = document.getElementById('ed-visor');
    ['dragenter', 'dragover'].forEach((t) => window.addEventListener(t, (ev) => { ev.preventDefault(); }));
    window.addEventListener('drop', (ev) => { ev.preventDefault(); visor.classList.remove('soltando'); });
    visor.addEventListener('dragenter', (ev) => { if (tieneArchivos(ev)) visor.classList.add('soltando'); });
    visor.addEventListener('dragover', (ev) => { ev.preventDefault(); if (tieneArchivos(ev)) { ev.dataTransfer.dropEffect = 'copy'; visor.classList.add('soltando'); } });
    visor.addEventListener('dragleave', (ev) => { if (!visor.contains(ev.relatedTarget)) visor.classList.remove('soltando'); });
    visor.addEventListener('drop', alSoltar);
  }

  function tieneArchivos(ev) {
    return ev.dataTransfer && Array.from(ev.dataTransfer.types || []).includes('Files');
  }

  function alSoltar(ev) {
    ev.preventDefault();
    visor.classList.remove('soltando');
    const archivos = Array.from(ev.dataTransfer.files || []).filter((f) => TIPOS.includes(f.type));
    if (!archivos.length) { EditorApp.aviso('Soltá una imagen PNG, JPG, WebP o SVG'); return; }
    const foto = ev.target.closest && ev.target.closest('.ed-el--foto');
    if (foto && archivos.length === 1) { aplicarArchivoA(foto.dataset.id, archivos[0]); return; }
    const lienzo = document.getElementById('ed-lienzo').getBoundingClientRect();
    const escala = EditorLienzo.obtenerEscala();
    const punto = { xMm: (ev.clientX - lienzo.left) / escala, yMm: (ev.clientY - lienzo.top) / escala };
    archivos.forEach((archivo, i) => agregarDesdeArchivo(archivo, { xMm: punto.xMm + i * 4, yMm: punto.yMm + i * 4 }));
  }

  function leerArchivo(archivo) {
    return new Promise((resolver, rechazar) => {
      if (archivo.size > LIMITE_BYTES) { rechazar(new Error('La imagen supera 12 MB; usá una más liviana')); return; }
      const lector = new FileReader();
      lector.onerror = () => rechazar(new Error('No se pudo leer el archivo'));
      lector.onload = () => {
        const im = new Image();
        im.onload = () => resolver({ dataURL: lector.result, ancho: im.naturalWidth, alto: im.naturalHeight, ratio: (im.naturalWidth / im.naturalHeight) || 1, nombre: archivo.name });
        im.onerror = () => rechazar(new Error('No se pudo leer esa imagen'));
        im.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  function coincideConPapel(ratio) {
    const p = E.obtener().papel;
    return Math.abs(ratio - p.anchoMm / p.altoMm) / (p.anchoMm / p.altoMm) < 0.03;
  }

  function medidasIniciales(ratio, punto) {
    const p = E.obtener().papel;
    if (coincideConPapel(ratio)) return { xMm: 0, yMm: 0, anchoMm: p.anchoMm, altoMm: p.altoMm, alLienzo: true };
    let anchoMm = p.anchoMm * 0.6;
    let altoMm = anchoMm / ratio;
    if (altoMm > p.altoMm * 0.6) { altoMm = p.altoMm * 0.6; anchoMm = altoMm * ratio; }
    const cx = punto ? punto.xMm : p.anchoMm / 2;
    const cy = punto ? punto.yMm : p.altoMm / 2;
    return { xMm: E.redondear(cx - anchoMm / 2, 2), yMm: E.redondear(cy - altoMm / 2, 2), anchoMm: E.redondear(anchoMm, 2), altoMm: E.redondear(altoMm, 2), alLienzo: false };
  }

  async function agregarDesdeArchivo(archivo, punto) {
    try {
      const info = await leerArchivo(archivo);
      const m = medidasIniciales(info.ratio, punto);
      E.agregarElemento('imagen', { origen: info.dataURL, nombreArchivo: info.nombre, nombre: nombreDesdeArchivo(info.nombre), xMm: m.xMm, yMm: m.yMm, anchoMm: m.anchoMm, altoMm: m.altoMm });
      if (m.alLienzo) { E.ordenar('fondo'); EditorApp.aviso('Imagen del tamaño del papel: se colocó al fondo, ocupando todo el lienzo'); }
      else EditorApp.aviso('Imagen agregada');
    } catch (err) { EditorApp.aviso(err.message); }
  }

  async function aplicarArchivoA(id, archivo) {
    const e = E.porId(id);
    if (!e) return;
    try {
      const info = await leerArchivo(archivo);
      E.aplicar(() => {
        if (e.tipo === 'imagen') {
          const primeraVez = !e.origen;
          e.origen = info.dataURL;
          e.nombreArchivo = info.nombre;
          e.nombre = nombreDesdeArchivo(info.nombre);
          if (primeraVez) {
            const m = medidasIniciales(info.ratio, { xMm: e.xMm + e.anchoMm / 2, yMm: e.yMm + e.altoMm / 2 });
            Object.assign(e, { xMm: m.xMm, yMm: m.yMm, anchoMm: m.anchoMm, altoMm: m.altoMm });
          } else e.altoMm = E.redondear(e.anchoMm / info.ratio, 2);
        } else if (e.tipo === 'foto') {
          e.imagen = info.dataURL;
        }
      });
      E.emitir('seleccion');
      EditorApp.aviso(e.tipo === 'foto' ? 'Foto de prueba colocada' : 'Imagen cargada');
    } catch (err) { EditorApp.aviso(err.message); }
  }

  function nombreDesdeArchivo(nombre) {
    return (nombre || '').replace(/\.[^.]+$/, '').slice(0, 40) || 'Imagen';
  }

  function ajustarAlLienzo(id) {
    const e = E.porId(id);
    if (!e) return;
    E.aplicar((p) => { e.xMm = 0; e.yMm = 0; e.anchoMm = p.papel.anchoMm; e.altoMm = p.papel.altoMm; e.rotacion = 0; e.encuadre = 'cubrir'; });
    E.emitir('seleccion');
    EditorApp.aviso('Imagen ajustada al lienzo');
  }

  // Encoge la imagen hasta el área segura y, si su borde es de un solo color, pinta el
  // fondo del papel con ese color para que el sangrado no quede blanco.
  function ajustarAlAreaSegura(id) {
    const e = E.porId(id);
    if (!e || e.tipo !== 'imagen' || !e.origen) return;
    const im = new Image();
    im.onload = () => {
      const p = E.obtener().papel;
      const margen = Math.max(0, p.areaSeguraMm || 0);
      const cajaW = p.anchoMm - margen * 2, cajaH = p.altoMm - margen * 2;
      const ratio = im.naturalWidth / im.naturalHeight || 1;
      let w = cajaW, h = w / ratio;
      if (h > cajaH) { h = cajaH; w = h * ratio; }
      const color = colorDelBorde(im);
      E.aplicar((pl) => {
        e.xMm = E.redondear(margen + (cajaW - w) / 2, 2);
        e.yMm = E.redondear(margen + (cajaH - h) / 2, 2);
        e.anchoMm = E.redondear(w, 2);
        e.altoMm = E.redondear(h, 2);
        e.rotacion = 0;
        e.encuadre = 'contener';
        if (color) pl.fondo.color = color;
      });
      E.emitir('seleccion');
      EditorApp.aviso(color ? 'Imagen dentro del área segura · fondo pintado de ' + color : 'Imagen dentro del área segura · el borde no es de un solo color, elegí el fondo a mano');
    };
    im.onerror = () => EditorApp.aviso('No se pudo leer la imagen');
    im.src = e.origen;
  }

  // Color dominante del anillo exterior de la imagen, o null si el borde no es uniforme o es transparente.
  function colorDelBorde(im) {
    const W = Math.min(400, im.naturalWidth);
    const H = Math.max(1, Math.round(im.naturalHeight * W / im.naturalWidth));
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(im, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const grosor = Math.max(2, Math.round(Math.min(W, H) * 0.015));
    const conteo = new Map();
    let total = 0, transparentes = 0;
    const sumar = (x, y) => {
      const i = (y * W + x) * 4;
      total++;
      if (d[i + 3] < 40) { transparentes++; return; }
      const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      const v = conteo.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      v.n++; v.r += d[i]; v.g += d[i + 1]; v.b += d[i + 2];
      conteo.set(k, v);
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (x < grosor || y < grosor || x >= W - grosor || y >= H - grosor) sumar(x, y);
    }
    if (!total || transparentes / total > 0.1) return null;
    let mejor = null;
    conteo.forEach((v) => { if (!mejor || v.n > mejor.n) mejor = v; });
    if (!mejor || mejor.n / total < 0.85) return null;
    const hex = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
    return '#' + hex(mejor.r / mejor.n) + hex(mejor.g / mejor.n) + hex(mejor.b / mejor.n);
  }

  /* ---------- Detección de espacios de foto ---------- */

  function detectarEspacios(id) {
    const e = E.porId(id);
    if (!e || e.tipo !== 'imagen' || !e.origen) return;
    if (e.rotacion % 360 !== 0) { EditorApp.aviso('Enderezá la imagen (rotación 0°) antes de detectar'); return; }
    EditorApp.aviso('Buscando espacios de foto…');
    const im = new Image();
    im.onload = () => {
      const rects = buscarRectangulos(im);
      if (!rects.length) { EditorApp.aviso('No se detectaron espacios. Usá rectángulos de un solo color o agujeros transparentes'); return; }
      crearEspacios(e, rects, im.naturalWidth / im.naturalHeight);
    };
    im.onerror = () => EditorApp.aviso('No se pudo leer la imagen');
    im.src = e.origen;
  }

  function buscarRectangulos(im) {
    const W = Math.min(720, im.naturalWidth);
    const H = Math.max(1, Math.round(im.naturalHeight * W / im.naturalWidth));
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(im, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const n = W * H;

    const pruebas = [
      { nombre: 'transparente', test: (i) => d[i + 3] < 40 },
      { nombre: 'negro', test: (i) => d[i + 3] > 200 && d[i] < 22 && d[i + 1] < 22 && d[i + 2] < 22 },
    ];
    for (const pr of pruebas) {
      const r = componentes(d, W, H, pr.test);
      if (r.length) return r;
    }

    // Tercer intento: el color sólido más frecuente que no sea el fondo (esquinas) ni blanco.
    const conteo = new Map();
    const clave = (i) => ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    for (let i = 0; i < n * 4; i += 16) { if (d[i + 3] > 200) conteo.set(clave(i), (conteo.get(clave(i)) || 0) + 1); }
    const esquinas = new Set([0, (W - 1) * 4, (H - 1) * W * 4, (n - 1) * 4].map(clave));
    const candidatos = Array.from(conteo.entries()).filter(([k, c]) => !esquinas.has(k) && c > n / 4 * 0.02).sort((a, b) => b[1] - a[1]);
    for (const [k] of candidatos.slice(0, 3)) {
      const r0 = ((k >> 8) & 15) * 16 + 8, g0 = ((k >> 4) & 15) * 16 + 8, b0 = (k & 15) * 16 + 8;
      if (r0 > 235 && g0 > 235 && b0 > 235) continue;
      const r = componentes(d, W, H, (i) => d[i + 3] > 200 && Math.abs(d[i] - r0) < 12 && Math.abs(d[i + 1] - g0) < 12 && Math.abs(d[i + 2] - b0) < 12);
      if (r.length) return r;
    }
    return [];
  }

  function componentes(d, W, H, test) {
    const n = W * H;
    const visitado = new Uint8Array(n);
    const pila = new Int32Array(n);
    const rects = [];
    const minW = Math.max(8, W * 0.06), minH = Math.max(8, H * 0.03);
    for (let p = 0; p < n; p++) {
      if (visitado[p] || !test(p * 4)) continue;
      let top = pila.length; let cuenta = 0;
      let x1 = W, y1 = H, x2 = 0, y2 = 0;
      let sp = 0; pila[sp++] = p; visitado[p] = 1;
      while (sp > 0) {
        const q = pila[--sp];
        const x = q % W, y = (q - x) / W;
        cuenta++;
        if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y;
        const vecinos = [q - 1, q + 1, q - W, q + W];
        if (x === 0) vecinos[0] = -1; if (x === W - 1) vecinos[1] = -1;
        for (let k = 0; k < 4; k++) { const v = vecinos[k]; if (v >= 0 && v < n && !visitado[v] && test(v * 4)) { visitado[v] = 1; pila[sp++] = v; } }
      }
      const w = x2 - x1 + 1, h = y2 - y1 + 1;
      const relleno = cuenta / (w * h);
      const esTodo = w > W * 0.97 && h > H * 0.97;
      if (w >= minW && h >= minH && relleno >= 0.86 && !esTodo) rects.push({ x: x1 / W, y: y1 / H, w: w / W, h: h / H });
      top = 0;
    }
    return rects.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }

  function crearEspacios(imagen, rects, ratioImagen) {
    // La imagen puede estar "contenida" en su caja: calcular el área realmente dibujada.
    const cajaRatio = imagen.anchoMm / imagen.altoMm;
    let dx = 0, dy = 0, dw = imagen.anchoMm, dh = imagen.altoMm;
    if (imagen.encuadre !== 'cubrir') {
      if (ratioImagen > cajaRatio) { dh = dw / ratioImagen; dy = (imagen.altoMm - dh) / 2; }
      else { dw = dh * ratioImagen; dx = (imagen.anchoMm - dw) / 2; }
    }
    // La detección trabaja sobre una imagen reducida: el borde queda medio píxel adentro y
    // se vería una línea del color del rectángulo en la impresión. Se compensa agrandando cada espacio.
    const SOBREPASO_MM = 0.5;
    const nuevos = [];
    E.aplicar((p) => {
      p.elementos = p.elementos.filter((el) => !(el.tipo === 'foto' && !el.imagen));
      let orden = p.elementos.reduce((m, el) => Math.max(m, el.orden), 0);
      rects.forEach((r, i) => {
        const x1 = Math.max(imagen.xMm + dx, imagen.xMm + dx + r.x * dw - SOBREPASO_MM);
        const y1 = Math.max(imagen.yMm + dy, imagen.yMm + dy + r.y * dh - SOBREPASO_MM);
        const x2 = Math.min(imagen.xMm + dx + dw, imagen.xMm + dx + (r.x + r.w) * dw + SOBREPASO_MM);
        const y2 = Math.min(imagen.yMm + dy + dh, imagen.yMm + dy + (r.y + r.h) * dh + SOBREPASO_MM);
        const e = { id: E.uid(), tipo: 'foto', nombre: 'Foto ' + (i + 1), numero: i + 1, encuadre: 'cubrir', focoX: 50, focoY: 50, radioMm: 0, borde: { anchoMm: 0, color: '#FFFFFF' }, filtro: 'ninguno', imagen: null, rotacion: 0, opacidad: 100, visible: true, bloqueado: false, orden: ++orden,
          xMm: E.redondear(x1, 2), yMm: E.redondear(y1, 2), anchoMm: E.redondear(x2 - x1, 2), altoMm: E.redondear(y2 - y1, 2) };
        p.elementos.push(e);
        nuevos.push(e.id);
      });
    });
    E.seleccionar(nuevos);
    const r0 = rects[0];
    const prop = proporcionLegible((r0.w * dw) / (r0.h * dh));
    EditorApp.aviso('Se detectaron ' + rects.length + ' espacio' + (rects.length === 1 ? '' : 's') + ' de foto · ' + prop + (E.obtener().elementos.some((el) => el.tipo === 'foto' && el.imagen) ? '' : ' · los espacios anteriores se reemplazaron (Ctrl+Z deshace)'));
  }

  function proporcionLegible(ratio) {
    const comunes = [[1, 1], [4, 3], [3, 2], [16, 9], [3, 4], [2, 3], [9, 16], [5, 4], [4, 5]];
    let mejor = null;
    comunes.forEach(([a, b]) => { const dif = Math.abs(ratio - a / b); if (!mejor || dif < mejor.dif) mejor = { dif, t: a + ':' + b }; });
    return mejor.dif < 0.04 ? mejor.t : (Math.round(ratio * 100) / 100) + ':1';
  }

  return { iniciar, agregarDesdeArchivo, aplicarArchivoA, ajustarAlLienzo, ajustarAlAreaSegura, detectarEspacios };
})();

const EditorRender = (() => {
  const E = EditorEstado;
  const TAMANO_MIN_PT = 4;
  const cacheImagenes = new Map();

  /* ---------- Utilidades ---------- */

  function cargarImagen(src) {
    if (cacheImagenes.has(src)) return cacheImagenes.get(src);
    const p = new Promise((resolver) => {
      const im = new Image();
      im.onload = () => resolver(im);
      im.onerror = () => resolver(null);
      im.src = src;
    });
    cacheImagenes.set(src, p);
    return p;
  }

  function caminoRedondeado(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function dibujarImagenEncuadrada(ctx, im, w, h, encuadre, focoX = 50, focoY = 50) {
    const ri = im.naturalWidth / im.naturalHeight, rc = w / h;
    if (encuadre === 'contener') {
      let dw = w, dh = w / ri;
      if (dh > h) { dh = h; dw = h * ri; }
      ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      let sw = im.naturalWidth, sh = im.naturalHeight;
      if (ri > rc) sw = sh * rc; else sh = sw / rc;
      const sx = (im.naturalWidth - sw) * (focoX / 100), sy = (im.naturalHeight - sh) * (focoY / 100);
      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    }
  }

  function transformarTexto(texto, modo) {
    if (modo === 'mayusculas') return texto.toUpperCase();
    if (modo === 'minusculas') return texto.toLowerCase();
    return texto;
  }

  function fuenteCss(e, px) {
    return (e.cursiva ? 'italic ' : '') + (e.peso || 500) + ' ' + px + 'px "' + (e.fuente || 'Inter') + '", sans-serif';
  }

  // Parte el texto en líneas que entren en anchoMax (en px) con la fuente ya aplicada al contexto.
  function partirLineas(ctx, texto, anchoMax) {
    const lineas = [];
    texto.split('\n').forEach((parrafo) => {
      const palabras = parrafo.split(' ');
      let actual = '';
      palabras.forEach((palabra) => {
        const prueba = actual ? actual + ' ' + palabra : palabra;
        if (ctx.measureText(prueba).width <= anchoMax || !actual) {
          if (ctx.measureText(prueba).width > anchoMax && !actual) {
            // palabra más larga que la caja: partir por letras
            let trozo = '';
            for (const ch of palabra) {
              if (ctx.measureText(trozo + ch).width > anchoMax && trozo) { lineas.push(trozo); trozo = ch; } else trozo += ch;
            }
            actual = trozo;
          } else actual = prueba;
        } else { lineas.push(actual); actual = palabra; }
      });
      lineas.push(actual);
    });
    return lineas;
  }

  function dibujarTexto(ctx, e, w, h, pxPorMm) {
    const contenido = transformarTexto(e.tipo === 'dato' ? E.textoDeDato(e) : (e.contenido || ''), e.mayusculas);
    const relleno = 0.5 * pxPorMm;
    const innerW = Math.max(1, w - relleno * 2), innerH = Math.max(1, h - relleno * 2);
    let px = e.tamanoPt * E.PT_A_MM * pxPorMm;
    const minPx = TAMANO_MIN_PT * E.PT_A_MM * pxPorMm;
    let lineas, altoLinea, altoTotal;
    const medir = () => {
      ctx.font = fuenteCss(e, px);
      if ('letterSpacing' in ctx) ctx.letterSpacing = ((e.espaciado || 0) * px) + 'px';
      lineas = partirLineas(ctx, contenido, innerW);
      altoLinea = (e.interlineado || 1.15) * px;
      altoTotal = altoLinea * lineas.length;
    };
    medir();
    if (e.ajuste === 'reducir') {
      let vueltas = 0;
      while ((altoTotal > innerH + 0.5 || lineas.some((l) => ctx.measureText(l).width > innerW + 0.5)) && px > minPx && vueltas++ < 40) { px *= 0.94; medir(); }
    }
    ctx.fillStyle = e.color || '#111214';
    ctx.textBaseline = 'alphabetic';
    const alineacion = e.alineacion || 'centro';
    ctx.textAlign = alineacion === 'izquierda' ? 'left' : alineacion === 'derecha' ? 'right' : 'center';
    const x = alineacion === 'izquierda' ? relleno : alineacion === 'derecha' ? relleno + innerW : relleno + innerW / 2;
    const vertical = e.alineacionVertical || 'centro';
    let y0 = relleno + (vertical === 'arriba' ? 0 : vertical === 'abajo' ? innerH - altoTotal : (innerH - altoTotal) / 2);
    const ascenso = px * 0.78;
    lineas.forEach((linea, i) => {
      const yBase = y0 + i * altoLinea + (altoLinea - px) / 2 + ascenso;
      ctx.fillText(linea, x, yBase);
      if (e.subrayado || e.tachado) {
        const ancho = ctx.measureText(linea).width;
        const xi = alineacion === 'izquierda' ? x : alineacion === 'derecha' ? x - ancho : x - ancho / 2;
        ctx.lineWidth = Math.max(1, px / 14);
        ctx.strokeStyle = ctx.fillStyle;
        if (e.subrayado) { ctx.beginPath(); ctx.moveTo(xi, yBase + px * 0.12); ctx.lineTo(xi + ancho, yBase + px * 0.12); ctx.stroke(); }
        if (e.tachado) { ctx.beginPath(); ctx.moveTo(xi, yBase - px * 0.28); ctx.lineTo(xi + ancho, yBase - px * 0.28); ctx.stroke(); }
      }
    });
  }

  // Guía para diseñar afuera (Canva): fondo transparente, espacios de foto en gris con número y medida, área segura punteada.
  function dibujarGuia(ctx, p, pxPorMm, W, H) {
    ctx.clearRect(0, 0, W, H);
    const segura = (p.papel.areaSeguraMm || 0) * pxPorMm;
    if (segura > 0) {
      ctx.setLineDash([6 * pxPorMm / 3, 4 * pxPorMm / 3]);
      ctx.strokeStyle = 'rgba(217,54,54,0.7)'; ctx.lineWidth = Math.max(1, pxPorMm * 0.15);
      ctx.strokeRect(segura, segura, W - segura * 2, H - segura * 2);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(217,54,54,0.8)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      textoQueEntra(ctx, 'ÁREA SEGURA · textos y logos adentro de esta línea', W - segura * 2 - pxPorMm * 2, 2 * pxPorMm, 600);
      ctx.fillText(ctx.textoAjustado, W - segura - pxPorMm, H - segura - pxPorMm * 0.6);
    }
    p.elementos.filter((e) => e.tipo === 'foto' && e.visible !== false).sort((a, b) => a.numero - b.numero).forEach((e) => {
      const x = e.xMm * pxPorMm, y = e.yMm * pxPorMm, w = e.anchoMm * pxPorMm, h = e.altoMm * pxPorMm;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      if (e.rotacion) ctx.rotate(e.rotacion * Math.PI / 180);
      ctx.translate(-w / 2, -h / 2);
      ctx.fillStyle = '#B9BCB6';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(17,18,20,0.55)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 ' + Math.min(w, h) * 0.38 + 'px Inter, sans-serif';
      ctx.fillText(String(e.numero), w / 2, h / 2 - Math.min(w, h) * 0.06);
      ctx.font = '600 ' + Math.max(2 * pxPorMm, Math.min(w, h) * 0.07) + 'px Inter, sans-serif';
      ctx.fillText('FOTO ' + e.numero + ' · ' + Math.round(e.anchoMm * 10) / 10 + ' × ' + Math.round(e.altoMm * 10) / 10 + ' mm', w / 2, h / 2 + Math.min(w, h) * 0.24);
      ctx.restore();
    });
    ctx.fillStyle = 'rgba(17,18,20,0.5)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    textoQueEntra(ctx, p.nombre + ' · ' + Math.round(p.papel.anchoMm * 10) / 10 + ' × ' + Math.round(p.papel.altoMm * 10) / 10 + ' mm · ' + W + ' × ' + H + ' px', W - segura * 2 - pxPorMm * 2, 2 * pxPorMm, 600);
    ctx.fillText(ctx.textoAjustado, segura + pxPorMm, segura + pxPorMm * 0.6);
  }

  // Elige el tamaño de letra (bajando desde `px`) para que `texto` entre en `anchoMax`; deja el texto en ctx.textoAjustado.
  function textoQueEntra(ctx, texto, anchoMax, px, peso) {
    let tam = px;
    ctx.font = peso + ' ' + tam + 'px Inter, sans-serif';
    while (ctx.measureText(texto).width > anchoMax && tam > px * 0.5) { tam *= 0.92; ctx.font = peso + ' ' + tam + 'px Inter, sans-serif'; }
    ctx.textoAjustado = texto;
    if (ctx.measureText(texto).width > anchoMax) {
      let corto = texto;
      while (corto.length > 3 && ctx.measureText(corto + '…').width > anchoMax) corto = corto.slice(0, -1);
      ctx.textoAjustado = corto + '…';
    }
  }

  /* ---------- Render de la plantilla ---------- */

  async function renderizar(plantilla, opciones = {}) {
    const p = plantilla;
    const ppp = opciones.ppp || p.papel.ppp || 300;
    const pxPorMm = ppp / 25.4;
    const W = Math.round(p.papel.anchoMm * pxPorMm), H = Math.round(p.papel.altoMm * pxPorMm);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = (p.fondo && p.fondo.color) || '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    try { await document.fonts.ready; } catch (err) { /* sin API de fuentes: se dibuja igual */ }

    if (opciones.modoGuia) { dibujarGuia(ctx, p, pxPorMm, W, H); return canvas; }

    const elementos = p.elementos.filter((e) => e.visible !== false).sort((a, b) => a.orden - b.orden);
    for (const e of elementos) {
      const x = e.xMm * pxPorMm, y = e.yMm * pxPorMm, w = Math.max(1, e.anchoMm * pxPorMm), h = Math.max(1, e.altoMm * pxPorMm);
      ctx.save();
      ctx.globalAlpha = (e.opacidad == null ? 100 : e.opacidad) / 100;
      ctx.translate(x + w / 2, y + h / 2);
      if (e.rotacion) ctx.rotate(e.rotacion * Math.PI / 180);
      ctx.translate(-w / 2, -h / 2);
      const radio = e.tipo === 'forma' && e.figura === 'circulo' ? Math.min(w, h) / 2 : (e.radioMm || 0) * pxPorMm;

      if (e.tipo === 'foto') {
        caminoRedondeado(ctx, 0, 0, w, h, radio);
        ctx.clip();
        if (e.filtro === 'bn') ctx.filter = 'grayscale(1)'; else if (e.filtro === 'sepia') ctx.filter = 'sepia(0.8)';
        const im = e.imagen ? await cargarImagen(e.imagen) : null;
        if (im) dibujarImagenEncuadrada(ctx, im, w, h, e.encuadre, e.focoX, e.focoY);
        else if (!opciones.fotosVacias) {
          ctx.fillStyle = '#E4E6E1'; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = 'rgba(17,18,20,0.28)';
          ctx.font = '800 ' + Math.min(w, h) * 0.4 + 'px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(e.numero), w / 2, h / 2);
        }
        ctx.filter = 'none';
        if (e.borde && e.borde.anchoMm > 0) {
          const b = e.borde.anchoMm * pxPorMm;
          ctx.lineWidth = b * 2; ctx.strokeStyle = e.borde.color || '#FFFFFF';
          caminoRedondeado(ctx, 0, 0, w, h, radio); ctx.stroke();
        }
      } else if (e.tipo === 'imagen') {
        const im = e.origen ? await cargarImagen(e.origen) : null;
        if (im) { caminoRedondeado(ctx, 0, 0, w, h, radio); ctx.clip(); dibujarImagenEncuadrada(ctx, im, w, h, e.encuadre); }
      } else if (e.tipo === 'forma') {
        caminoRedondeado(ctx, 0, 0, w, h, radio);
        ctx.fillStyle = e.relleno || '#111214';
        ctx.fill();
        if (e.trazo && e.trazo.anchoMm > 0 && e.figura !== 'linea') {
          ctx.save(); ctx.clip();
          ctx.lineWidth = e.trazo.anchoMm * pxPorMm * 2; ctx.strokeStyle = e.trazo.color || '#111214'; ctx.stroke();
          ctx.restore();
        }
      } else if (E.esTextual(e)) {
        ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
        dibujarTexto(ctx, e, w, h, pxPorMm);
      }
      ctx.restore();
    }
    return canvas;
  }

  // Hoja física: si la plantilla es una tira 2×6 que se duplica, dos copias lado a lado en 4×6.
  async function renderizarHoja(plantilla, opciones = {}) {
    const p = plantilla;
    const vertical = p.papel.anchoMm <= 51 && p.papel.altoMm >= 150;
    const apaisada = p.papel.altoMm <= 51 && p.papel.anchoMm >= 150;
    const duplicar = p.papel.duplicarEnHoja && (vertical || apaisada);
    const tira = await renderizar(p, opciones);
    if (!duplicar) return { canvas: tira, copias: 1, anchoMm: p.papel.anchoMm, altoMm: p.papel.altoMm };
    const hoja = document.createElement('canvas');
    hoja.width = vertical ? tira.width * 2 : tira.width;
    hoja.height = vertical ? tira.height : tira.height * 2;
    const ctx = hoja.getContext('2d');
    ctx.fillStyle = (p.fondo && p.fondo.color) || '#FFFFFF';
    ctx.fillRect(0, 0, hoja.width, hoja.height);
    ctx.drawImage(tira, 0, 0);
    ctx.drawImage(tira, vertical ? tira.width : 0, vertical ? 0 : tira.height);
    if (opciones.lineaCorte) {
      const paso = Math.max(2, Math.min(tira.width, tira.height) / 60);
      ctx.setLineDash([paso, paso]);
      ctx.strokeStyle = 'rgba(255,77,77,0.9)'; ctx.lineWidth = Math.max(1, Math.min(tira.width, tira.height) / 300);
      ctx.beginPath();
      if (vertical) { ctx.moveTo(tira.width, 0); ctx.lineTo(tira.width, hoja.height); } else { ctx.moveTo(0, tira.height); ctx.lineTo(hoja.width, tira.height); }
      ctx.stroke();
    }
    return { canvas: hoja, copias: 2, anchoMm: vertical ? p.papel.anchoMm * 2 : p.papel.anchoMm, altoMm: vertical ? p.papel.altoMm : p.papel.altoMm * 2 };
  }

  async function miniatura(plantilla, anchoPx = 240) {
    const ppp = (anchoPx / plantilla.papel.anchoMm) * 25.4;
    const c = await renderizar(plantilla, { ppp: Math.max(8, Math.min(ppp, 60)) });
    return c.toDataURL('image/png');
  }

  function descargarCanvas(canvas, nombreArchivo) {
    return new Promise((resolver) => {
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nombreArchivo;
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); resolver(); }, 800);
      }, 'image/png');
    });
  }

  return { renderizar, renderizarHoja, miniatura, descargarCanvas };
})();

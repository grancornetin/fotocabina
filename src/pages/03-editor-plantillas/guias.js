const EditorGuias = (() => {
  let capa = null;
  const r = (n) => Math.round(n * 10) / 10;
  const mm = (n) => r(n) + ' mm';

  function iniciar(capaGuias) {
    capa = capaGuias;
  }

  // Devuelve el ajuste (dx, dy) en mm para que la caja en movimiento se pegue a centros,
  // bordes, guías propias, cuadrícula o a un espaciado ya repetido entre otros elementos.
  function imantar(mov, otros, cfg) {
    const umbral = (cfg.umbralPx || 6) / cfg.escala;
    const resultado = { dx: 0, dy: 0, lineas: [], medidas: [] };
    if (!cfg.activo) return resultado;

    const ejes = [
      { eje: 'x', pos: 'x', tam: 'w', cruzPos: 'y', cruzTam: 'h', limite: cfg.anchoMm },
      { eje: 'y', pos: 'y', tam: 'h', cruzPos: 'x', cruzTam: 'w', limite: cfg.altoMm },
    ];

    ejes.forEach((a) => {
      const objetivos = [];
      objetivos.push({ v: 0, tipo: 'lienzo' }, { v: a.limite / 2, tipo: 'centro-lienzo' }, { v: a.limite, tipo: 'lienzo' });
      (cfg.guiasPropias || []).filter((g) => g.eje === a.eje).forEach((g) => objetivos.push({ v: g.mm, tipo: 'guia' }));
      otros.forEach((o) => {
        objetivos.push({ v: o[a.pos], tipo: 'el', o }, { v: o[a.pos] + o[a.tam] / 2, tipo: 'el-centro', o }, { v: o[a.pos] + o[a.tam], tipo: 'el', o });
      });
      const puntos = [
        { v: mov[a.pos], rol: 'inicio' },
        { v: mov[a.pos] + mov[a.tam] / 2, rol: 'centro' },
        { v: mov[a.pos] + mov[a.tam], rol: 'fin' },
      ];
      let mejor = null;
      puntos.forEach((p) => objetivos.forEach((t) => {
        const d = Math.abs(p.v - t.v);
        if (d <= umbral && (!mejor || d < mejor.d)) mejor = { d, delta: t.v - p.v, objetivo: t, punto: p };
      }));

      let mejorEspaciado = null;
      if (cfg.espaciadoIgual !== false) mejorEspaciado = espaciadoIgual(mov, otros, a, umbral);

      let usado = null;
      if (mejorEspaciado && (!mejor || mejorEspaciado.d <= mejor.d + 0.01)) usado = { delta: mejorEspaciado.delta, espaciado: mejorEspaciado };
      else if (mejor) usado = { delta: mejor.delta, iman: mejor };

      if (!usado && cfg.cuadricula) {
        const paso = cfg.pasoCuadriculaMm || 5;
        const ajustado = Math.round(mov[a.pos] / paso) * paso;
        if (Math.abs(ajustado - mov[a.pos]) <= umbral) usado = { delta: ajustado - mov[a.pos] };
      }
      if (!usado) return;

      resultado[a.eje === 'x' ? 'dx' : 'dy'] = usado.delta;
      const movAjustado = Object.assign({}, mov);
      movAjustado[a.pos] += usado.delta;

      if (usado.iman) {
        const t = usado.iman.objetivo;
        let desde = movAjustado[a.cruzPos], hasta = movAjustado[a.cruzPos] + movAjustado[a.cruzTam];
        if (t.o) { desde = Math.min(desde, t.o[a.cruzPos]); hasta = Math.max(hasta, t.o[a.cruzPos] + t.o[a.cruzTam]); }
        else { desde = 0; hasta = a.eje === 'x' ? cfg.altoMm : cfg.anchoMm; }
        resultado.lineas.push({ eje: a.eje, mm: t.v, desde, hasta, etiqueta: t.tipo === 'centro-lienzo' ? 'Centro' : null });
      }
      if (usado.espaciado) {
        const s = usado.espaciado;
        const cruce = movAjustado[a.cruzPos] + movAjustado[a.cruzTam] / 2;
        s.segmentos.forEach((seg) => resultado.medidas.push({ eje: a.eje, desde: seg.desde, hasta: seg.hasta, cruce, etiqueta: mm(s.hueco) }));
        // marcar también el hueco de referencia entre los otros dos
        resultado.medidas.push({ eje: a.eje, desde: s.refDesde, hasta: s.refHasta, cruce: s.refCruce, etiqueta: mm(s.hueco), tenue: true });
      }
    });
    return resultado;
  }

  function espaciadoIgual(mov, otros, a, umbral) {
    const solapa = (o) => o[a.cruzPos] < mov[a.cruzPos] + mov[a.cruzTam] && o[a.cruzPos] + o[a.cruzTam] > mov[a.cruzPos];
    const lista = otros.filter(solapa).sort((p, q) => p[a.pos] - q[a.pos]);
    let mejor = null;
    for (let i = 0; i < lista.length - 1; i++) {
      const p = lista[i], q = lista[i + 1];
      const hueco = q[a.pos] - p[a.pos] - p[a.tam];
      if (hueco < 0.3) continue;
      const candidatos = [
        { objetivo: q[a.pos] + q[a.tam] + hueco, desde: q[a.pos] + q[a.tam], hasta: q[a.pos] + q[a.tam] + hueco },
        { objetivo: p[a.pos] - hueco - mov[a.tam], desde: p[a.pos] - hueco, hasta: p[a.pos] },
      ];
      candidatos.forEach((c) => {
        const d = Math.abs(c.objetivo - mov[a.pos]);
        if (d <= umbral && (!mejor || d < mejor.d)) {
          mejor = { d, delta: c.objetivo - mov[a.pos], hueco, segmentos: [{ desde: c.desde, hasta: c.hasta }], refDesde: p[a.pos] + p[a.tam], refHasta: q[a.pos], refCruce: (Math.max(p[a.cruzPos], q[a.cruzPos]) + Math.min(p[a.cruzPos] + p[a.cruzTam], q[a.cruzPos] + q[a.cruzTam])) / 2 };
        }
      });
    }
    return mejor;
  }

  // Distancia desde la caja a sus vecinos más cercanos (o al borde del lienzo si no hay vecino).
  function medirVecinos(caja, otros, lienzo) {
    const medidas = [];
    const solapaY = (o) => o.y < caja.y + caja.h && o.y + o.h > caja.y;
    const solapaX = (o) => o.x < caja.x + caja.w && o.x + o.w > caja.x;
    const cruceY = (o) => (Math.max(caja.y, o.y) + Math.min(caja.y + caja.h, o.y + o.h)) / 2;
    const cruceX = (o) => (Math.max(caja.x, o.x) + Math.min(caja.x + caja.w, o.x + o.w)) / 2;

    const izq = otros.filter((o) => solapaY(o) && o.x + o.w <= caja.x + 0.01).sort((p, q) => (q.x + q.w) - (p.x + p.w))[0];
    const der = otros.filter((o) => solapaY(o) && o.x >= caja.x + caja.w - 0.01).sort((p, q) => p.x - q.x)[0];
    const arr = otros.filter((o) => solapaX(o) && o.y + o.h <= caja.y + 0.01).sort((p, q) => (q.y + q.h) - (p.y + p.h))[0];
    const aba = otros.filter((o) => solapaX(o) && o.y >= caja.y + caja.h - 0.01).sort((p, q) => p.y - q.y)[0];

    const cy = caja.y + caja.h / 2, cx = caja.x + caja.w / 2;
    if (izq) medidas.push({ eje: 'x', desde: izq.x + izq.w, hasta: caja.x, cruce: cruceY(izq), etiqueta: mm(caja.x - izq.x - izq.w) });
    else if (lienzo && caja.x > 0.05) medidas.push({ eje: 'x', desde: 0, hasta: caja.x, cruce: cy, etiqueta: mm(caja.x) });
    if (der) medidas.push({ eje: 'x', desde: caja.x + caja.w, hasta: der.x, cruce: cruceY(der), etiqueta: mm(der.x - caja.x - caja.w) });
    else if (lienzo && lienzo.anchoMm - caja.x - caja.w > 0.05) medidas.push({ eje: 'x', desde: caja.x + caja.w, hasta: lienzo.anchoMm, cruce: cy, etiqueta: mm(lienzo.anchoMm - caja.x - caja.w) });
    if (arr) medidas.push({ eje: 'y', desde: arr.y + arr.h, hasta: caja.y, cruce: cruceX(arr), etiqueta: mm(caja.y - arr.y - arr.h) });
    else if (lienzo && caja.y > 0.05) medidas.push({ eje: 'y', desde: 0, hasta: caja.y, cruce: cx, etiqueta: mm(caja.y) });
    if (aba) medidas.push({ eje: 'y', desde: caja.y + caja.h, hasta: aba.y, cruce: cruceX(aba), etiqueta: mm(aba.y - caja.y - caja.h) });
    else if (lienzo && lienzo.altoMm - caja.y - caja.h > 0.05) medidas.push({ eje: 'y', desde: caja.y + caja.h, hasta: lienzo.altoMm, cruce: cx, etiqueta: mm(lienzo.altoMm - caja.y - caja.h) });
    return medidas.filter((m) => m.hasta - m.desde > 0.05);
  }

  // Distancia entre dos cajas cualesquiera (medición con Alt).
  function medirEntre(a, b) {
    const medidas = [];
    const solapaY = a.y < b.y + b.h && a.y + a.h > b.y;
    const solapaX = a.x < b.x + b.w && a.x + a.w > b.x;
    const cy = solapaY ? (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2 : a.y + a.h / 2;
    const cx = solapaX ? (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2 : a.x + a.w / 2;
    if (b.x >= a.x + a.w) medidas.push({ eje: 'x', desde: a.x + a.w, hasta: b.x, cruce: cy, etiqueta: mm(b.x - a.x - a.w) });
    else if (b.x + b.w <= a.x) medidas.push({ eje: 'x', desde: b.x + b.w, hasta: a.x, cruce: cy, etiqueta: mm(a.x - b.x - b.w) });
    if (b.y >= a.y + a.h) medidas.push({ eje: 'y', desde: a.y + a.h, hasta: b.y, cruce: cx, etiqueta: mm(b.y - a.y - a.h) });
    else if (b.y + b.h <= a.y) medidas.push({ eje: 'y', desde: b.y + b.h, hasta: a.y, cruce: cx, etiqueta: mm(a.y - b.y - b.h) });
    if (!medidas.length) {
      // se solapan: medir desde los bordes interiores
      medidas.push({ eje: 'x', desde: Math.min(a.x, b.x), hasta: Math.max(a.x, b.x), cruce: cy, etiqueta: mm(Math.abs(a.x - b.x)) });
      medidas.push({ eje: 'y', desde: Math.min(a.y, b.y), hasta: Math.max(a.y, b.y), cruce: cx, etiqueta: mm(Math.abs(a.y - b.y)) });
    }
    return medidas.filter((m) => m.hasta - m.desde > 0.05);
  }

  function dibujar(datos, escala) {
    if (!capa) return;
    limpiar();
    const px = (v) => v * escala;
    (datos.lineas || []).forEach((l) => {
      const n = document.createElement('div');
      n.className = 'ed-guia ed-guia--' + l.eje;
      if (l.eje === 'x') Object.assign(n.style, { left: px(l.mm) + 'px', top: px(l.desde) + 'px', height: px(l.hasta - l.desde) + 'px' });
      else Object.assign(n.style, { top: px(l.mm) + 'px', left: px(l.desde) + 'px', width: px(l.hasta - l.desde) + 'px' });
      capa.append(n);
      if (l.etiqueta) {
        const e = document.createElement('span');
        e.className = 'ed-guia-etiqueta';
        e.textContent = l.etiqueta;
        if (l.eje === 'x') Object.assign(e.style, { left: px(l.mm) + 'px', top: (px(l.desde) - 12) + 'px' });
        else Object.assign(e.style, { top: px(l.mm) + 'px', left: (px(l.desde) - 26) + 'px' });
        capa.append(e);
      }
    });
    (datos.medidas || []).forEach((m) => {
      const n = document.createElement('div');
      n.className = 'ed-medida ed-medida--' + m.eje;
      if (m.tenue) n.style.opacity = '0.5';
      if (m.eje === 'x') Object.assign(n.style, { left: px(m.desde) + 'px', top: px(m.cruce) + 'px', width: px(m.hasta - m.desde) + 'px' });
      else Object.assign(n.style, { top: px(m.desde) + 'px', left: px(m.cruce) + 'px', height: px(m.hasta - m.desde) + 'px' });
      capa.append(n);
      const e = document.createElement('span');
      e.className = 'ed-guia-etiqueta';
      e.textContent = m.etiqueta;
      if (m.tenue) e.style.opacity = '0.7';
      if (m.eje === 'x') Object.assign(e.style, { left: px((m.desde + m.hasta) / 2) + 'px', top: (px(m.cruce) - 11) + 'px' });
      else Object.assign(e.style, { top: px((m.desde + m.hasta) / 2) + 'px', left: (px(m.cruce) + 18) + 'px' });
      capa.append(e);
    });
  }

  function limpiar() {
    if (capa) capa.innerHTML = '';
  }

  return { iniciar, imantar, medirVecinos, medirEntre, dibujar, limpiar };
})();

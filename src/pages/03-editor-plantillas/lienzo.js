const EditorLienzo = (() => {
  const E = EditorEstado;
  const REGLA = 24;
  const ESCALA_BASE = 4; // px por mm al 100 %
  const ESCALA_MIN = 0.5;
  const ESCALA_MAX = 40;

  let visor, mundo, lienzo, capaEl, capaRef, capaGuias, capaSel, reglaX, reglaY;
  let escala = ESCALA_BASE;
  let panX = 48;
  let panY = 48;
  let arrastre = null;
  let espacio = false;
  let alt = false;
  let hoverId = null;
  let nodos = new Map();
  let ultimoPuntero = { x: 0, y: 0 };

  const mmAPx = (mm) => mm * escala;
  const pxAMm = (px) => px / escala;
  const r2 = (n) => Math.round(n * 100) / 100;
  const r1 = (n) => Math.round(n * 10) / 10;

  function iniciar() {
    visor = document.getElementById('ed-visor');
    mundo = document.getElementById('ed-mundo');
    lienzo = document.getElementById('ed-lienzo');
    capaEl = document.getElementById('ed-capa-elementos');
    capaRef = document.getElementById('ed-capa-referencia');
    capaGuias = document.getElementById('ed-capa-guias');
    capaSel = document.getElementById('ed-capa-seleccion');
    reglaX = document.getElementById('ed-regla-x');
    reglaY = document.getElementById('ed-regla-y');
    EditorGuias.iniciar(capaGuias);

    E.suscribir('cambio', dibujar);
    E.suscribir('seleccion', () => { dibujarSeleccion(); dibujarReglas(); });

    lienzo.addEventListener('pointerdown', alPresionarLienzo);
    visor.addEventListener('pointerdown', alPresionarVisor);
    visor.addEventListener('wheel', alRueda, { passive: false });
    visor.addEventListener('pointermove', alMoverSobreVisor);
    visor.addEventListener('pointerleave', () => { if (!arrastre) { ponerHover(null); if (alt) EditorGuias.limpiar(); } });
    visor.addEventListener('dblclick', alDobleClic);
    reglaX.addEventListener('pointerdown', (ev) => iniciarGuiaDesdeRegla(ev, 'y'));
    reglaY.addEventListener('pointerdown', (ev) => iniciarGuiaDesdeRegla(ev, 'x'));
    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', alSoltar);
    window.addEventListener('pointercancel', alSoltar);
    window.addEventListener('keydown', alTecla);
    window.addEventListener('keyup', alSoltarTecla);
    window.addEventListener('blur', () => { espacio = false; alt = false; visor.classList.remove('panning', 'midiendo'); });
    new ResizeObserver(() => { dibujarReglas(); E.emitir('vista'); }).observe(visor);
  }

  /* ---------- Dibujo ---------- */

  function dibujar() {
    const p = E.obtener();
    lienzo.style.width = mmAPx(p.papel.anchoMm) + 'px';
    lienzo.style.height = mmAPx(p.papel.altoMm) + 'px';
    lienzo.style.background = p.fondo.color || '#FFFFFF';
    dibujarElementos();
    if (typeof EditorTipografia !== 'undefined') EditorTipografia.ajustarTodos();
    dibujarReferencia();
    dibujarGuiasPropias();
    dibujarSeleccion();
    dibujarReglas();
    aplicarPan();
    document.getElementById('ed-visor-vacio').hidden = p.elementos.length > 0;
    E.emitir('vista');
  }

  function dibujarElementos() {
    const p = E.obtener();
    capaEl.innerHTML = '';
    nodos = new Map();
    p.elementos.slice().sort((a, b) => a.orden - b.orden).forEach((e) => {
      const n = crearNodo(e);
      nodos.set(e.id, n);
      capaEl.append(n);
    });
  }

  function crearNodo(e) {
    const n = document.createElement('div');
    n.className = 'ed-el ed-el--' + e.tipo + (e.tipo === 'dato' ? ' ed-el--texto' : '');
    n.dataset.id = e.id;
    if (e.tipo === 'foto') {
      n.innerHTML = '<span class="ed-el-num">' + e.numero + '</span><span class="ed-el-tag">Foto</span>';
      if (e.imagen) { const im = new Image(); im.src = e.imagen; im.alt = e.nombre; n.append(im); n.classList.add('con-imagen'); }
      n.dataset.encuadre = e.encuadre;
    } else if (E.esTextual(e)) {
      const c = document.createElement('div');
      c.className = 'ed-el-contenido';
      c.textContent = e.tipo === 'dato' ? E.textoDeDato(e) : e.contenido;
      n.append(c);
    } else if (e.tipo === 'imagen') {
      if (e.origen) { const im = new Image(); im.src = e.origen; im.alt = e.nombre; n.append(im); }
      else n.classList.add('sin-imagen');
      n.dataset.encuadre = e.encuadre;
    }
    aplicarGeometria(n, e);
    aplicarEstilo(n, e);
    return n;
  }

  function aplicarGeometria(n, e) {
    n.style.left = mmAPx(e.xMm) + 'px';
    n.style.top = mmAPx(e.yMm) + 'px';
    n.style.width = mmAPx(e.anchoMm) + 'px';
    n.style.height = mmAPx(e.altoMm) + 'px';
    n.style.transform = e.rotacion ? 'rotate(' + e.rotacion + 'deg)' : '';
  }

  function aplicarEstilo(n, e) {
    n.style.zIndex = e.orden;
    n.style.opacity = e.opacidad / 100;
    n.classList.toggle('bloqueado', !!e.bloqueado);
    n.classList.toggle('oculto', !e.visible);
    if (e.tipo === 'foto') {
      n.style.borderRadius = mmAPx(e.radioMm || 0) + 'px';
      n.style.border = e.borde && e.borde.anchoMm > 0 ? mmAPx(e.borde.anchoMm) + 'px solid ' + e.borde.color : '';
      n.style.filter = e.filtro === 'bn' ? 'grayscale(1)' : e.filtro === 'sepia' ? 'sepia(0.8)' : '';
      n.dataset.encuadre = e.encuadre;
    } else if (E.esTextual(e)) {
      const c = n.firstChild;
      n.style.fontFamily = '"' + (e.fuente || 'Inter') + '", sans-serif';
      n.style.fontSize = (e.tamanoPt * E.PT_A_MM * escala) + 'px';
      n.style.fontWeight = e.peso || 500;
      n.style.fontStyle = e.cursiva ? 'italic' : 'normal';
      n.style.textDecoration = [e.subrayado ? 'underline' : '', e.tachado ? 'line-through' : ''].join(' ').trim() || 'none';
      n.style.textTransform = e.mayusculas === 'mayusculas' ? 'uppercase' : e.mayusculas === 'minusculas' ? 'lowercase' : 'none';
      n.style.lineHeight = e.interlineado || 1.15;
      n.style.letterSpacing = (e.espaciado || 0) + 'em';
      n.style.color = e.color || '#111214';
      n.style.textAlign = e.alineacion === 'izquierda' ? 'left' : e.alineacion === 'derecha' ? 'right' : 'center';
      n.style.alignItems = e.alineacionVertical === 'arriba' ? 'flex-start' : e.alineacionVertical === 'abajo' ? 'flex-end' : 'center';
      n.style.padding = mmAPx(0.5) + 'px';
      if (c) c.textContent = e.tipo === 'dato' ? E.textoDeDato(e) : e.contenido;
    } else if (e.tipo === 'forma') {
      n.style.background = e.figura === 'linea' ? e.relleno : e.relleno;
      n.style.borderRadius = e.figura === 'circulo' ? '50%' : mmAPx(e.radioMm || 0) + 'px';
      n.style.border = e.trazo && e.trazo.anchoMm > 0 ? mmAPx(e.trazo.anchoMm) + 'px solid ' + e.trazo.color : '';
    } else if (e.tipo === 'imagen') {
      n.style.borderRadius = mmAPx(e.radioMm || 0) + 'px';
      n.dataset.encuadre = e.encuadre;
    }
  }

  function actualizarNodos(ids) {
    ids.forEach((id) => {
      const e = E.porId(id), n = nodos.get(id);
      if (e && n) aplicarGeometria(n, e);
    });
  }

  function dibujarReferencia() {
    const p = E.obtener().papel;
    capaRef.innerHTML = '';
    if (p.sangradoMm > 0) {
      const s = document.createElement('div');
      s.className = 'ed-ref-sangrado';
      s.style.inset = mmAPx(p.sangradoMm) + 'px';
      capaRef.append(s);
    }
    if (p.areaSeguraMm > 0) {
      const a = document.createElement('div');
      a.className = 'ed-ref-segura';
      a.style.inset = mmAPx(p.areaSeguraMm) + 'px';
      capaRef.append(a);
      const et = document.createElement('span');
      et.className = 'ed-ref-etiqueta';
      et.textContent = 'Área segura';
      et.style.right = mmAPx(p.areaSeguraMm) + 'px';
      et.style.bottom = mmAPx(p.areaSeguraMm) + 'px';
      if (escala >= 2.5) capaRef.append(et);
    }
  }

  function dibujarGuiasPropias() {
    const p = E.obtener();
    capaRef.querySelectorAll('.ed-guia-propia').forEach((n) => n.remove());
    p.guiasPropias.forEach((g, i) => {
      const n = document.createElement('div');
      n.className = 'ed-guia-propia ed-guia-propia--' + g.eje;
      n.dataset.indice = i;
      if (g.eje === 'x') n.style.left = mmAPx(g.mm) + 'px'; else n.style.top = mmAPx(g.mm) + 'px';
      const et = document.createElement('span');
      et.className = 'ed-guia-etiqueta';
      et.textContent = r1(g.mm) + ' mm';
      if (g.eje === 'x') { et.style.left = '0'; et.style.top = '-12px'; } else { et.style.top = '0'; et.style.left = '-26px'; }
      n.append(et);
      n.addEventListener('pointerdown', (ev) => iniciarMoverGuia(ev, i));
      capaRef.append(n);
    });
  }

  function dibujarSeleccion() {
    capaSel.innerHTML = '';
    const sel = E.seleccionados().filter((e) => e.visible);
    if (!sel.length) { E.emitir('seleccion-dibujada', null); return; }
    const caja = document.createElement('div');
    caja.className = 'ed-sel';
    if (sel.length === 1) {
      const e = sel[0];
      Object.assign(caja.style, { left: mmAPx(e.xMm) + 'px', top: mmAPx(e.yMm) + 'px', width: mmAPx(e.anchoMm) + 'px', height: mmAPx(e.altoMm) + 'px', transform: e.rotacion ? 'rotate(' + e.rotacion + 'deg)' : '' });
      caja.innerHTML = '<div class="ed-sel-borde"></div>';
      if (!e.bloqueado) {
        ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach((dir) => {
          const h = document.createElement('div');
          h.className = 'ed-manija';
          h.dataset.dir = dir;
          const pos = { n: [50, 0], s: [50, 100], e: [100, 50], w: [0, 50], nw: [0, 0], ne: [100, 0], se: [100, 100], sw: [0, 100] }[dir];
          h.style.left = pos[0] + '%';
          h.style.top = pos[1] + '%';
          h.addEventListener('pointerdown', (ev) => iniciarRedimension(ev, e, dir));
          caja.append(h);
        });
        const rot = document.createElement('div');
        rot.className = 'ed-manija-rotar';
        rot.title = 'Rotar (Shift = pasos de 15°)';
        rot.addEventListener('pointerdown', (ev) => iniciarRotacion(ev, e));
        caja.append(rot);
      }
      const et = document.createElement('span');
      et.className = 'ed-sel-etiqueta';
      et.textContent = arrastre && arrastre.tipo === 'rotar' ? Math.round(e.rotacion) + '°' : e.nombre + (e.bloqueado ? ' · bloqueado' : '');
      caja.append(et);
      const tam = document.createElement('span');
      tam.className = 'ed-sel-tam';
      tam.textContent = r1(e.anchoMm) + ' × ' + r1(e.altoMm) + ' mm';
      caja.append(tam);
    } else {
      const l = E.limites(sel);
      caja.classList.add('multiple');
      Object.assign(caja.style, { left: mmAPx(l.x) + 'px', top: mmAPx(l.y) + 'px', width: mmAPx(l.w) + 'px', height: mmAPx(l.h) + 'px' });
      caja.innerHTML = '<div class="ed-sel-borde"></div><span class="ed-sel-etiqueta">' + sel.length + ' elementos</span>';
    }
    capaSel.append(caja);
    E.emitir('seleccion-dibujada', cajaSeleccionEnVisor());
  }

  function ponerHover(id) {
    if (id === hoverId) return;
    hoverId = id;
    capaSel.querySelectorAll('.ed-sel.hover').forEach((n) => n.remove());
    if (!id || E.obtenerSeleccion().includes(id)) return;
    const e = E.porId(id);
    if (!e || !e.visible) return;
    const caja = document.createElement('div');
    caja.className = 'ed-sel hover';
    Object.assign(caja.style, { left: mmAPx(e.xMm) + 'px', top: mmAPx(e.yMm) + 'px', width: mmAPx(e.anchoMm) + 'px', height: mmAPx(e.altoMm) + 'px', transform: e.rotacion ? 'rotate(' + e.rotacion + 'deg)' : '' });
    caja.innerHTML = '<div class="ed-sel-borde"></div>';
    capaSel.append(caja);
  }

  function cajaSeleccionEnVisor() {
    const sel = E.seleccionados().filter((e) => e.visible);
    if (!sel.length) return null;
    const l = E.limites(sel);
    const rv = visor.getBoundingClientRect();
    const rl = lienzo.getBoundingClientRect();
    return { left: rl.left - rv.left + mmAPx(l.x), top: rl.top - rv.top + mmAPx(l.y), width: mmAPx(l.w), height: mmAPx(l.h) };
  }

  /* ---------- Reglas ---------- */

  function pasoRegla() {
    const candidatos = [1, 2, 5, 10, 20, 50, 100];
    const menor = candidatos.find((c) => c * escala >= 6) || 100;
    const mayor = candidatos.find((c) => c * escala >= 48 && c % menor === 0) || menor * 10;
    return { menor, mayor };
  }

  function dibujarReglas() {
    if (!visor || !E.obtener()) return;
    const p = E.obtener();
    const dpr = window.devicePixelRatio || 1;
    const ancho = visor.clientWidth - REGLA;
    const alto = visor.clientHeight - REGLA;
    if (ancho <= 0 || alto <= 0) return;
    const estilo = getComputedStyle(document.documentElement);
    const colorTexto = estilo.getPropertyValue('--color-fog').trim();
    const colorLinea = estilo.getPropertyValue('--color-border').trim();
    const colorFondo = estilo.getPropertyValue('--color-surface').trim();
    const lima = estilo.getPropertyValue('--color-lime-rgb').trim();
    const { menor, mayor } = pasoRegla();
    const sel = E.seleccionados().filter((e) => e.visible);
    const l = sel.length ? E.limites(sel) : null;

    const preparar = (canvas, w, h) => {
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = colorFondo;
      ctx.fillRect(0, 0, w, h);
      ctx.font = '600 9px Inter, sans-serif';
      ctx.fillStyle = colorTexto;
      ctx.strokeStyle = colorLinea;
      ctx.lineWidth = 1;
      return ctx;
    };

    const cx = preparar(reglaX, ancho, REGLA);
    if (l) { cx.fillStyle = 'rgba(' + lima + ',0.18)'; cx.fillRect(panX + mmAPx(l.x), 0, mmAPx(l.w), REGLA); cx.fillStyle = colorTexto; }
    cx.fillStyle = 'rgba(' + lima + ',0.08)';
    cx.fillRect(panX, 0, mmAPx(p.papel.anchoMm), REGLA);
    cx.fillStyle = colorTexto;
    const desdeX = Math.floor(pxAMm(-panX) / menor) * menor;
    const hastaX = pxAMm(ancho - panX);
    cx.beginPath();
    for (let mm = desdeX; mm <= hastaX; mm += menor) {
      const x = Math.round(panX + mmAPx(mm)) + 0.5;
      const esMayor = Math.abs(mm % mayor) < 1e-6;
      cx.moveTo(x, REGLA); cx.lineTo(x, REGLA - (esMayor ? 10 : 4));
      if (esMayor) { cx.textAlign = 'left'; cx.fillText(String(Math.round(mm)), x + 3, 10); }
    }
    cx.stroke();

    const cy = preparar(reglaY, REGLA, alto);
    if (l) { cy.fillStyle = 'rgba(' + lima + ',0.18)'; cy.fillRect(0, panY + mmAPx(l.y), REGLA, mmAPx(l.h)); }
    cy.fillStyle = 'rgba(' + lima + ',0.08)';
    cy.fillRect(0, panY, REGLA, mmAPx(p.papel.altoMm));
    cy.fillStyle = colorTexto;
    const desdeY = Math.floor(pxAMm(-panY) / menor) * menor;
    const hastaY = pxAMm(alto - panY);
    cy.beginPath();
    for (let mm = desdeY; mm <= hastaY; mm += menor) {
      const y = Math.round(panY + mmAPx(mm)) + 0.5;
      const esMayor = Math.abs(mm % mayor) < 1e-6;
      cy.moveTo(REGLA, y); cy.lineTo(REGLA - (esMayor ? 10 : 4), y);
      if (esMayor) {
        cy.save(); cy.translate(9, y - 3); cy.rotate(-Math.PI / 2); cy.textAlign = 'left'; cy.fillText(String(Math.round(mm)), 0, 0); cy.restore();
      }
    }
    cy.stroke();
  }

  /* ---------- Zoom y desplazamiento ---------- */

  function aplicarPan() {
    mundo.style.transform = 'translate(' + Math.round(panX) + 'px,' + Math.round(panY) + 'px)';
  }

  function fijarEscala(nueva, clienteX, clienteY) {
    nueva = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nueva));
    if (nueva === escala) return;
    const rv = visor.getBoundingClientRect();
    const cx = clienteX == null ? rv.left + REGLA + (visor.clientWidth - REGLA) / 2 : clienteX;
    const cy = clienteY == null ? rv.top + REGLA + (visor.clientHeight - REGLA) / 2 : clienteY;
    const mmX = pxAMm(cx - rv.left - REGLA - panX);
    const mmY = pxAMm(cy - rv.top - REGLA - panY);
    escala = nueva;
    panX = cx - rv.left - REGLA - mmAPx(mmX);
    panY = cy - rv.top - REGLA - mmAPx(mmY);
    dibujar();
  }

  function zoomPaso(direccion, clienteX, clienteY) {
    const factor = direccion > 0 ? 1.2 : 1 / 1.2;
    fijarEscala(escala * factor, clienteX, clienteY);
  }

  function ajustarAPantalla() {
    const p = E.obtener().papel;
    const margen = 72;
    const w = visor.clientWidth - REGLA - margen * 2;
    const h = visor.clientHeight - REGLA - margen * 2;
    if (w <= 0 || h <= 0) return;
    escala = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, Math.min(w / p.anchoMm, h / p.altoMm)));
    panX = (visor.clientWidth - REGLA - mmAPx(p.anchoMm)) / 2;
    panY = (visor.clientHeight - REGLA - mmAPx(p.altoMm)) / 2;
    dibujar();
  }

  function zoomPorcentaje() { return Math.round(escala / ESCALA_BASE * 100); }

  function alRueda(ev) {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) {
      zoomPaso(ev.deltaY < 0 ? 1 : -1, ev.clientX, ev.clientY);
      return;
    }
    if (ev.shiftKey) panX -= ev.deltaY; else { panX -= ev.deltaX; panY -= ev.deltaY; }
    aplicarPan();
    dibujarReglas();
    E.emitir('seleccion-dibujada', cajaSeleccionEnVisor());
  }

  /* ---------- Puntero ---------- */

  function puntoMm(ev) {
    const r = lienzo.getBoundingClientRect();
    return { x: pxAMm(ev.clientX - r.left), y: pxAMm(ev.clientY - r.top) };
  }

  function cajaDe(e) { return { x: e.xMm, y: e.yMm, w: e.anchoMm, h: e.altoMm, id: e.id }; }
  function otrasCajas(excluir) {
    return E.obtener().elementos.filter((e) => e.visible && !excluir.includes(e.id)).map(cajaDe);
  }
  function configuracionIman() {
    const p = E.obtener();
    return { escala, anchoMm: p.papel.anchoMm, altoMm: p.papel.altoMm, guiasPropias: p.guiasPropias, activo: p.asistencia.iman, cuadricula: p.asistencia.cuadricula, pasoCuadriculaMm: p.asistencia.pasoCuadriculaMm };
  }

  function alPresionarLienzo(ev) {
    if (ev.button !== 0 || espacio) return;
    const nodo = ev.target.closest('.ed-el');
    if (!nodo) return;
    if (nodo.classList.contains('editando')) return;
    ev.stopPropagation();
    const e = E.porId(nodo.dataset.id);
    if (!e || alt) return;
    const sel = E.obtenerSeleccion();
    if (ev.shiftKey) E.alternarSeleccion(e.id);
    else if (!sel.includes(e.id)) E.seleccionar([e.id]);
    if (e.bloqueado) return;
    const editables = E.editables();
    if (!editables.length) return;
    arrastre = { tipo: 'mover', sx: ev.clientX, sy: ev.clientY, iniciado: false, inicios: editables.map((x) => ({ id: x.id, x: x.xMm, y: x.yMm })), caja0: E.limites(editables), otros: otrasCajas(editables.map((x) => x.id)), movido: false };
  }

  function alPresionarVisor(ev) {
    if (ev.button === 1 || (ev.button === 0 && espacio)) {
      ev.preventDefault();
      arrastre = { tipo: 'pan', sx: ev.clientX, sy: ev.clientY, px: panX, py: panY };
      visor.classList.add('panning-activo');
      return;
    }
    if (ev.button !== 0) return;
    if (ev.target.closest('.ed-el, .ed-manija, .ed-manija-rotar, .ed-guia-propia, .ed-regla, .ed-contextual, .ed-regla-esquina')) return;
    const base = ev.shiftKey ? E.obtenerSeleccion() : [];
    if (!ev.shiftKey) E.limpiarSeleccion();
    const caja = document.createElement('div');
    caja.className = 'ed-marquee';
    lienzo.append(caja);
    const p0 = puntoMm(ev);
    arrastre = { tipo: 'marquee', x0: p0.x, y0: p0.y, caja, base };
  }

  function iniciarRedimension(ev, e, dir) {
    ev.stopPropagation();
    ev.preventDefault();
    arrastre = { tipo: 'redimensionar', id: e.id, dir, sx: ev.clientX, sy: ev.clientY, iniciado: false, orig: { x: e.xMm, y: e.yMm, w: e.anchoMm, h: e.altoMm }, rot: e.rotacion || 0, otros: otrasCajas([e.id]) };
  }

  function iniciarRotacion(ev, e) {
    ev.stopPropagation();
    ev.preventDefault();
    const n = nodos.get(e.id);
    const r = n.getBoundingClientRect();
    arrastre = { tipo: 'rotar', id: e.id, cx: r.left + r.width / 2, cy: r.top + r.height / 2, iniciado: false };
  }

  function iniciarGuiaDesdeRegla(ev, eje) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const n = document.createElement('div');
    n.className = 'ed-guia-propia ed-guia-propia--' + eje + ' arrastrando';
    n.innerHTML = '<span class="ed-guia-etiqueta"></span>';
    capaRef.append(n);
    arrastre = { tipo: 'guia', eje, nodo: n, indice: null };
    moverGuia(ev);
  }

  function iniciarMoverGuia(ev, indice) {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    ev.preventDefault();
    const g = E.obtener().guiasPropias[indice];
    const n = ev.currentTarget;
    n.classList.add('arrastrando');
    arrastre = { tipo: 'guia', eje: g.eje, nodo: n, indice };
  }

  function moverGuia(ev) {
    const p = puntoMm(ev);
    const a = arrastre;
    const valor = r1(a.eje === 'x' ? p.x : p.y);
    a.valor = valor;
    if (a.eje === 'x') a.nodo.style.left = mmAPx(valor) + 'px'; else a.nodo.style.top = mmAPx(valor) + 'px';
    const et = a.nodo.querySelector('.ed-guia-etiqueta');
    if (et) {
      et.textContent = valor + ' mm';
      if (a.eje === 'x') { et.style.left = '0'; et.style.top = (Math.max(0, Math.min(mmAPx(E.obtener().papel.altoMm), ev.clientY - lienzo.getBoundingClientRect().top)) - 12) + 'px'; }
      else { et.style.top = '0'; et.style.left = (Math.max(0, Math.min(mmAPx(E.obtener().papel.anchoMm), ev.clientX - lienzo.getBoundingClientRect().left)) - 26) + 'px'; }
    }
    const papel = E.obtener().papel;
    const limite = a.eje === 'x' ? papel.anchoMm : papel.altoMm;
    a.fuera = valor < 0 || valor > limite;
    a.nodo.style.opacity = a.fuera ? '0.35' : '';
  }

  function alMoverSobreVisor(ev) {
    ultimoPuntero = { x: ev.clientX, y: ev.clientY };
    if (arrastre) return;
    const nodo = ev.target.closest('.ed-el');
    ponerHover(nodo ? nodo.dataset.id : null);
    if (alt) mostrarMedicion(nodo ? nodo.dataset.id : null);
  }

  function mostrarMedicion(idBajoCursor) {
    const sel = E.seleccionados().filter((e) => e.visible);
    if (!sel.length) { EditorGuias.limpiar(); return; }
    const caja = E.limites(sel);
    const p = E.obtener().papel;
    let medidas;
    if (idBajoCursor && !E.obtenerSeleccion().includes(idBajoCursor)) {
      const o = E.porId(idBajoCursor);
      medidas = EditorGuias.medirEntre(caja, cajaDe(o));
    } else {
      medidas = EditorGuias.medirVecinos(caja, [], { anchoMm: p.anchoMm, altoMm: p.altoMm });
    }
    EditorGuias.dibujar({ medidas }, escala);
  }

  function alMover(ev) {
    if (!arrastre) return;
    const a = arrastre;
    if (a.tipo === 'pan') {
      panX = a.px + (ev.clientX - a.sx);
      panY = a.py + (ev.clientY - a.sy);
      aplicarPan();
      dibujarReglas();
      E.emitir('seleccion-dibujada', cajaSeleccionEnVisor());
      return;
    }
    if (a.tipo === 'guia') { moverGuia(ev); return; }
    if (a.tipo === 'marquee') {
      const p = puntoMm(ev);
      const x = Math.min(a.x0, p.x), y = Math.min(a.y0, p.y), w = Math.abs(p.x - a.x0), h = Math.abs(p.y - a.y0);
      Object.assign(a.caja.style, { left: mmAPx(x) + 'px', top: mmAPx(y) + 'px', width: mmAPx(w) + 'px', height: mmAPx(h) + 'px' });
      const dentro = E.obtener().elementos.filter((e) => e.visible && !e.bloqueado && e.xMm < x + w && e.xMm + e.anchoMm > x && e.yMm < y + h && e.yMm + e.altoMm > y).map((e) => e.id);
      E.seleccionar(Array.from(new Set(a.base.concat(dentro))));
      return;
    }
    if (a.tipo === 'mover') {
      let dx = pxAMm(ev.clientX - a.sx), dy = pxAMm(ev.clientY - a.sy);
      if (!a.iniciado) { if (Math.abs(dx) * escala < 2 && Math.abs(dy) * escala < 2) return; E.iniciarTransaccion(); a.iniciado = true; visor.classList.add('arrastrando'); }
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      const cajaMov = { x: a.caja0.x + dx, y: a.caja0.y + dy, w: a.caja0.w, h: a.caja0.h };
      const ajuste = EditorGuias.imantar(cajaMov, a.otros, configuracionIman());
      dx += ajuste.dx; dy += ajuste.dy;
      a.inicios.forEach((s) => { const e = E.porId(s.id); e.xMm = r2(s.x + dx); e.yMm = r2(s.y + dy); });
      a.movido = true;
      actualizarNodos(a.inicios.map((s) => s.id));
      dibujarSeleccion();
      dibujarReglas();
      const cajaFinal = { x: a.caja0.x + dx, y: a.caja0.y + dy, w: a.caja0.w, h: a.caja0.h };
      const vecinos = EditorGuias.medirVecinos(cajaFinal, a.otros, null);
      EditorGuias.dibujar({ lineas: ajuste.lineas, medidas: ajuste.medidas.concat(vecinos) }, escala);
      E.emitir('geometria');
      return;
    }
    if (a.tipo === 'redimensionar') {
      const e = E.porId(a.id);
      if (!e) return;
      if (!a.iniciado) { E.iniciarTransaccion(); a.iniciado = true; visor.classList.add('arrastrando'); }
      let dx = pxAMm(ev.clientX - a.sx), dy = pxAMm(ev.clientY - a.sy);
      if (a.rot) {
        // El elemento gira sobre su propio centro (CSS transform-origin: center). Para que la
        // esquina/borde arrastrado siga al mouse, el arrastre se resuelve en el sistema de
        // coordenadas SIN rotar del elemento, y recién al final se convierte el centro nuevo
        // de vuelta al lienzo con el mismo ángulo — si no, el elemento "salta" al redimensionar.
        const rad = -a.rot * Math.PI / 180;
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
        dx = rx; dy = ry;
      }
      const o = a.orig;
      let x = o.x, y = o.y, w = o.w, h = o.h;
      const d = a.dir;
      if (d.includes('e')) w = o.w + dx;
      if (d.includes('w')) { x = o.x + dx; w = o.w - dx; }
      if (d.includes('s')) h = o.h + dy;
      if (d.includes('n')) { y = o.y + dy; h = o.h - dy; }
      const esEsquina = d.length === 2;
      // Las imágenes cargadas mantienen proporción por defecto; Shift invierte el comportamiento.
      const tieneImagen = (e.tipo === 'imagen' && !!e.origen) || (e.tipo === 'foto' && !!e.imagen);
      const mantieneProporcion = esEsquina && (ev.shiftKey !== tieneImagen);
      if (mantieneProporcion) {
        const ratio = o.w / o.h;
        if (Math.abs(w - o.w) >= Math.abs(h - o.h)) h = w / ratio; else w = h * ratio;
        if (d.includes('w')) x = o.x + o.w - w;
        if (d.includes('n')) y = o.y + o.h - h;
      }
      const min = 1;
      if (w < min) { if (d.includes('w')) x = o.x + o.w - min; w = min; }
      if (h < min) { if (d.includes('n')) y = o.y + o.h - min; h = min; }
      const lineas = [];
      if (E.obtener().asistencia.iman && !a.rot) {
        const cfg = configuracionIman();
        const umbral = 6 / escala;
        const objetivosX = [0, cfg.anchoMm / 2, cfg.anchoMm].concat(cfg.guiasPropias.filter((g) => g.eje === 'x').map((g) => g.mm)).concat(a.otros.flatMap((c) => [c.x, c.x + c.w / 2, c.x + c.w]));
        const objetivosY = [0, cfg.altoMm / 2, cfg.altoMm].concat(cfg.guiasPropias.filter((g) => g.eje === 'y').map((g) => g.mm)).concat(a.otros.flatMap((c) => [c.y, c.y + c.h / 2, c.y + c.h]));
        const cerca = (v, lista) => { let m = null; lista.forEach((t) => { const dd = Math.abs(t - v); if (dd <= umbral && (!m || dd < m.d)) m = { d: dd, t }; }); return m; };
        if (!mantieneProporcion) {
          if (d.includes('e')) { const m = cerca(x + w, objetivosX); if (m) { w = m.t - x; lineas.push({ eje: 'x', mm: m.t, desde: 0, hasta: cfg.altoMm }); } }
          if (d.includes('w')) { const m = cerca(x, objetivosX); if (m) { w = x + w - m.t; x = m.t; lineas.push({ eje: 'x', mm: m.t, desde: 0, hasta: cfg.altoMm }); } }
          if (d.includes('s')) { const m = cerca(y + h, objetivosY); if (m) { h = m.t - y; lineas.push({ eje: 'y', mm: m.t, desde: 0, hasta: cfg.anchoMm }); } }
          if (d.includes('n')) { const m = cerca(y, objetivosY); if (m) { h = y + h - m.t; y = m.t; lineas.push({ eje: 'y', mm: m.t, desde: 0, hasta: cfg.anchoMm }); } }
        }
      }
      w = Math.max(min, w); h = Math.max(min, h);
      if (a.rot) {
        // x,y,w,h están en el sistema local (sin rotar) del elemento. El centro local se
        // convierte a coordenadas del lienzo rotando alrededor del centro original, así el
        // punto fijo del redimensionado (la esquina/borde opuesto) queda donde corresponde.
        const cLocalX = x + w / 2, cLocalY = y + h / 2;
        const cOrigX = o.x + o.w / 2, cOrigY = o.y + o.h / 2;
        const rad = a.rot * Math.PI / 180;
        const dxc = cLocalX - cOrigX, dyc = cLocalY - cOrigY;
        const cx = cOrigX + (dxc * Math.cos(rad) - dyc * Math.sin(rad));
        const cy = cOrigY + (dxc * Math.sin(rad) + dyc * Math.cos(rad));
        x = cx - w / 2; y = cy - h / 2;
      }
      e.xMm = r2(x); e.yMm = r2(y); e.anchoMm = r2(w); e.altoMm = r2(h);
      actualizarNodos([e.id]);
      if (E.esTextual(e) && typeof EditorTipografia !== 'undefined') EditorTipografia.ajustarNodo(nodos.get(e.id), e);
      dibujarSeleccion();
      dibujarReglas();
      EditorGuias.dibujar({ lineas }, escala);
      E.emitir('geometria');
      return;
    }
    if (a.tipo === 'rotar') {
      const e = E.porId(a.id);
      if (!e) return;
      if (!a.iniciado) { E.iniciarTransaccion(); a.iniciado = true; visor.classList.add('arrastrando'); }
      let ang = Math.atan2(ev.clientY - a.cy, ev.clientX - a.cx) * 180 / Math.PI + 90;
      ang = ((ang % 360) + 360) % 360;
      if (ev.shiftKey) ang = Math.round(ang / 15) * 15;
      else { const cardinal = [0, 90, 180, 270, 360].find((c) => Math.abs(ang - c) <= 3); if (cardinal != null) ang = cardinal % 360; }
      e.rotacion = Math.round(ang * 10) / 10;
      actualizarNodos([e.id]);
      dibujarSeleccion();
      E.emitir('geometria');
    }
  }

  function alSoltar() {
    if (!arrastre) return;
    const a = arrastre;
    arrastre = null;
    visor.classList.remove('panning-activo', 'arrastrando');
    EditorGuias.limpiar();
    if (a.tipo === 'marquee') { a.caja.remove(); return; }
    if (a.tipo === 'guia') {
      a.nodo.classList.remove('arrastrando');
      if (a.indice == null) a.nodo.remove();
      if (a.valor == null) { dibujarGuiasPropias(); return; }
      E.aplicar((p) => {
        if (a.fuera) { if (a.indice != null) p.guiasPropias.splice(a.indice, 1); }
        else if (a.indice != null) p.guiasPropias[a.indice].mm = a.valor;
        else p.guiasPropias.push({ eje: a.eje, mm: a.valor });
      });
      return;
    }
    if (a.iniciado) { E.notificar(); E.emitir('seleccion'); }
  }

  function alDobleClic(ev) {
    const nodo = ev.target.closest('.ed-el');
    if (!nodo) return;
    const e = E.porId(nodo.dataset.id);
    if (e) E.emitir('doble-clic', e);
  }

  function alTecla(ev) {
    const tag = document.activeElement && document.activeElement.tagName;
    const escribiendo = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement && document.activeElement.isContentEditable);
    if (ev.key === 'Alt') { alt = true; visor.classList.add('midiendo'); if (!escribiendo) { ev.preventDefault(); mostrarMedicion(hoverId); } }
    if (ev.code === 'Space' && !escribiendo && !espacio) { espacio = true; visor.classList.add('panning'); ev.preventDefault(); }
  }
  function alSoltarTecla(ev) {
    if (ev.key === 'Alt') { alt = false; visor.classList.remove('midiendo'); if (!arrastre) EditorGuias.limpiar(); }
    if (ev.code === 'Space') { espacio = false; visor.classList.remove('panning'); }
  }

  function centrarEn(id) {
    const e = E.porId(id);
    if (!e) return;
    const rv = { w: visor.clientWidth - REGLA, h: visor.clientHeight - REGLA };
    panX = rv.w / 2 - mmAPx(e.xMm + e.anchoMm / 2);
    panY = rv.h / 2 - mmAPx(e.yMm + e.altoMm / 2);
    aplicarPan();
    dibujarReglas();
    E.emitir('seleccion-dibujada', cajaSeleccionEnVisor());
  }

  return {
    iniciar, dibujar, dibujarSeleccion, dibujarReglas,
    mmAPx, pxAMm, obtenerEscala: () => escala,
    zoomPaso, fijarEscala, ajustarAPantalla, zoomPorcentaje, centrarEn,
    cajaSeleccionEnVisor, nodo: (id) => nodos.get(id),
  };
})();

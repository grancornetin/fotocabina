const EditorGaleria = (() => {
  const E = EditorEstado;
  const I = EditorIconos;
  let capa, listaMias, listaBase;
  let abierta = false;
  const miniaturas = new Map();
  let pendienteEliminar = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r1 = (n) => Math.round(n * 10) / 10;

  function iniciar() {
    capa = document.getElementById('ed-galeria');
    listaMias = document.getElementById('ed-galeria-mias');
    listaBase = document.getElementById('ed-galeria-base');
    document.getElementById('ed-galeria-cerrar').addEventListener('click', cerrar);
    document.getElementById('ed-galeria-importar').addEventListener('click', () => EditorPaquete.importar());
    capa.addEventListener('click', alClic);
    capa.addEventListener('dblclick', alDobleClic);
    E.suscribir('plantillas', () => { if (abierta) render(); });
  }

  function abrir() {
    abierta = true;
    capa.hidden = false;
    pendienteEliminar = null;
    render();
  }

  function cerrar() {
    abierta = false;
    capa.hidden = true;
    E.emitir('vista');
  }

  const fecha = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  function render() {
    const actual = E.obtener();
    const lista = E.listarPlantillas();
    listaMias.innerHTML = lista.map((p) => {
      const fotos = new Set(p.elementos.filter((e) => e.tipo === 'foto').map((e) => e.numero)).size;
      const activa = actual && actual.id === p.id;
      const clave = p.id + '|' + p.modificada;
      const mini = miniaturas.get(clave);
      return '<article class="ed-tarjeta-plantilla' + (activa ? ' activa' : '') + '" data-id="' + p.id + '" tabindex="0">' +
        '<div class="ed-tarjeta-plantilla-mini" style="aspect-ratio:' + p.papel.anchoMm + '/' + p.papel.altoMm + '">' + (mini ? '<img src="' + mini + '" alt="">' : '<span class="ed-mini-cargando"></span>') + '</div>' +
        '<div class="ed-tarjeta-plantilla-info"><h3 title="Doble clic para renombrar">' + esc(p.nombre) + '</h3><p>' + r1(p.papel.anchoMm) + ' × ' + r1(p.papel.altoMm) + ' mm · ' + fotos + ' foto' + (fotos === 1 ? '' : 's') + '</p><p class="ed-tarjeta-plantilla-fecha">' + fecha(p.modificada) + '</p></div>' +
        '<div class="ed-tarjeta-plantilla-acciones">' +
          '<button type="button" class="ds-btn ds-btn--primary ds-btn--compact" data-accion="abrir:' + p.id + '">Abrir</button>' +
          '<button type="button" class="ed-boton-icono" data-accion="renombrar:' + p.id + '" title="Renombrar">' + I.svg('editar') + '</button>' +
          '<button type="button" class="ed-boton-icono" data-accion="duplicar:' + p.id + '" title="Duplicar">' + I.svg('duplicar') + '</button>' +
          '<button type="button" class="ed-boton-icono" data-accion="exportar:' + p.id + '" title="Exportar archivo de plantilla">' + I.svg('exportar') + '</button>' +
          '<span class="ed-confirmar-cont">' +
            '<button type="button" class="ed-boton-icono ed-boton-icono--peligro" data-accion="eliminar:' + p.id + '" title="Eliminar"' + (lista.length <= 1 ? ' disabled' : '') + '>' + I.svg('eliminar') + '</button>' +
            (pendienteEliminar === p.id ? '<span class="ed-confirmar-popover" role="dialog" aria-label="Confirmar eliminación"><p>¿Eliminar "' + esc(p.nombre) + '"?</p><div class="ed-confirmar-acciones"><button type="button" class="ds-btn ds-btn--ghost ds-btn--compact" data-accion="cancelar-eliminar">Cancelar</button><button type="button" class="ds-btn ds-btn--destructive ds-btn--compact" data-accion="confirmar-eliminar:' + p.id + '">Eliminar</button></div></span>' : '') +
          '</span>' +
        '</div></article>';
    }).join('');
    listaBase.innerHTML = E.PLANTILLAS_BASE.map((b) => {
      const m = E.PRESETS_PAPEL[b.preset];
      const horizontal = b.orientacion === 'horizontal';
      const ratio = horizontal ? m.altoMm + '/' + m.anchoMm : m.anchoMm + '/' + m.altoMm;
      return '<button type="button" class="ed-tarjeta-base" data-accion="crear:' + b.id + '"><span class="ed-tarjeta-base-icono' + (horizontal ? ' horizontal' : '') + '" style="aspect-ratio:' + ratio + '">' + esquemaBase(b) + '</span><span class="ed-tarjeta-base-texto"><b>' + esc(b.nombre) + '</b><small>' + esc(b.descripcion) + '</small></span></button>';
    }).join('');
    generarMiniaturas(lista);
  }

  function esquemaBase(b) {
    const pct = (v) => (v * 100).toFixed(1) + '%';
    let h = (b.fotos || []).map((f) => '<i style="left:' + pct(f[0]) + ';top:' + pct(f[1]) + ';width:' + pct(f[2]) + ';height:' + pct(f[3]) + '"></i>').join('');
    h += (b.textos || []).concat(b.datos || []).map((t) => '<i class="texto" style="left:' + pct(t.x) + ';top:' + pct(t.y) + ';width:' + pct(t.w) + ';height:' + pct(t.h) + '"></i>').join('');
    return h;
  }

  async function generarMiniaturas(lista) {
    for (const p of lista) {
      const clave = p.id + '|' + p.modificada;
      if (miniaturas.has(clave)) continue;
      try {
        const url = await EditorRender.miniatura(p, 260);
        miniaturas.set(clave, url);
        const cont = listaMias.querySelector('[data-id="' + p.id + '"] .ed-tarjeta-plantilla-mini');
        if (cont) cont.innerHTML = '<img src="' + url + '" alt="">';
      } catch (err) { /* una plantilla rota no debe frenar la galería */ }
    }
    if (miniaturas.size > 60) miniaturas.clear();
  }

  function alClic(ev) {
    const b = ev.target.closest('[data-accion]');
    if (!b) {
      if (ev.target === capa) return;
      if (pendienteEliminar && !ev.target.closest('.ed-confirmar-cont')) { pendienteEliminar = null; render(); }
      return;
    }
    const idx = b.dataset.accion.indexOf(':');
    const nombre = idx < 0 ? b.dataset.accion : b.dataset.accion.slice(0, idx);
    const id = idx < 0 ? undefined : b.dataset.accion.slice(idx + 1);
    if (nombre === 'abrir') { E.abrirPlantilla(id); cerrar(); requestAnimationFrame(() => EditorLienzo.ajustarAPantalla()); }
    else if (nombre === 'crear') { const p = E.crearPlantilla(id); cerrar(); requestAnimationFrame(() => EditorLienzo.ajustarAPantalla()); EditorApp.aviso('Plantilla nueva: ' + p.nombre); }
    else if (nombre === 'duplicar') { const c = E.duplicarPlantilla(id); if (c) EditorApp.aviso('Duplicada como "' + c.nombre + '"'); }
    else if (nombre === 'exportar') { EditorPaquete.exportarPlantilla(E.listarPlantillas().find((p) => p.id === id)); }
    else if (nombre === 'renombrar') renombrar(id);
    else if (nombre === 'eliminar') { pendienteEliminar = id; render(); }
    else if (nombre === 'cancelar-eliminar') { pendienteEliminar = null; render(); }
    else if (nombre === 'confirmar-eliminar') {
      pendienteEliminar = null;
      if (E.eliminarPlantilla(id)) EditorApp.aviso('Plantilla eliminada');
      render();
    }
  }

  function alDobleClic(ev) {
    const h3 = ev.target.closest('.ed-tarjeta-plantilla h3');
    if (!h3) return;
    renombrar(h3.closest('.ed-tarjeta-plantilla').dataset.id);
  }

  function renombrar(id) {
    const tarjeta = listaMias.querySelector('[data-id="' + id + '"]');
    const h3 = tarjeta && tarjeta.querySelector('h3');
    if (!h3) return;
    const p = E.listarPlantillas().find((x) => x.id === id);
    const input = document.createElement('input');
    input.className = 'ed-input ed-renombrar';
    input.value = p.nombre;
    input.maxLength = 80;
    h3.replaceWith(input);
    input.focus(); input.select();
    let listo = false;
    const fin = (guardar) => { if (listo) return; listo = true; if (guardar) E.renombrarPlantilla(id, input.value); render(); };
    input.addEventListener('keydown', (k) => { k.stopPropagation(); if (k.key === 'Enter') fin(true); if (k.key === 'Escape') fin(false); });
    input.addEventListener('blur', () => fin(true));
  }

  function alEscape() {
    if (pendienteEliminar) { pendienteEliminar = null; render(); return; }
    cerrar();
  }

  return { iniciar, abrir, cerrar, alEscape, estaAbierta: () => abierta };
})();

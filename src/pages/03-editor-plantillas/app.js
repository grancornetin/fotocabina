const EditorApp = (() => {
  const E = EditorEstado;
  let toastTimer = null;

  const ATAJOS = [
    ['Selección', null],
    ['Seleccionar todo', ['Ctrl', 'A']],
    ['Sumar a la selección', ['Shift', 'clic']],
    ['Quitar selección', ['Esc']],
    ['Medir distancias', ['Alt', 'mover']],
    ['Mover 1 mm / 10 mm', ['Flechas', 'Shift']],
    ['Mover el lienzo', ['Espacio', 'arrastrar']],
    ['Edición', null],
    ['Deshacer / Rehacer', ['Ctrl', 'Z', 'Y']],
    ['Duplicar', ['Ctrl', 'D']],
    ['Eliminar', ['Supr']],
    ['Bloquear / desbloquear', ['Ctrl', 'L']],
    ['Ocultar / mostrar', ['Ctrl', 'Shift', 'H']],
    ['Subir / bajar un nivel', ['Ctrl', ']', '[']],
    ['Al frente / al fondo', ['Ctrl', 'Shift', ']', '[']],
    ['Editar texto en el lienzo', ['Enter', 'o doble clic']],
    ['Terminar de editar texto', ['Esc', 'o Ctrl', 'Enter']],
    ['Mantener proporción', ['Shift', 'arrastrar esquina']],
    ['Rotar en pasos de 15°', ['Shift', 'rotar']],
    ['Agregar', null],
    ['Espacio de foto', ['F']],
    ['Texto', ['T']],
    ['Rectángulo / Círculo / Línea', ['R', 'O', 'L']],
    ['Imagen', ['I']],
    ['Vista', null],
    ['Acercar / alejar', ['Ctrl', '+', '−']],
    ['Zoom con la rueda', ['Ctrl', 'rueda']],
    ['Ajustar a pantalla', ['Ctrl', '0']],
    ['Guardar ahora', ['Ctrl', 'S']],
    ['Exportar imagen PNG', ['Ctrl', 'E']],
    ['Vista de hoja', ['Ctrl', 'P']],
    ['Mis plantillas', ['Ctrl', 'O']],
    ['Esta ayuda', ['?']],
  ];

  const CLAVE_TEMA = 'fotocabina-theme';

  function aplicarTema(eleccion) {
    const root = document.documentElement;
    if (eleccion === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', eleccion);
    document.querySelectorAll('.ed-tema-btn').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.tema === eleccion)));
  }

  function iniciarSwitchTema() {
    let guardado = 'dark';
    try { guardado = localStorage.getItem(CLAVE_TEMA) || 'dark'; } catch (e) { /* sin almacenamiento: se usa oscuro por defecto */ }
    aplicarTema(guardado);
    document.getElementById('ed-tema-switch').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tema]');
      if (!b) return;
      aplicarTema(b.dataset.tema);
      try { localStorage.setItem(CLAVE_TEMA, b.dataset.tema); } catch (e) { /* se aplica igual en esta sesión */ }
    });
  }

  function iniciar() {
    iniciarSwitchTema();
    EditorIconos.montar();
    EditorLienzo.iniciar();
    EditorImagenes.iniciar();
    EditorTipografia.iniciar();
    EditorInspector.iniciar();
    EditorPaneles.iniciar();
    EditorGaleria.iniciar();
    EditorPaquete.iniciar();
    E.suscribir('cambio', actualizarHistorial);
    E.suscribir('cambio', actualizarNombre);
    E.suscribir('guardado', actualizarGuardado);
    E.suscribir('vista', actualizarZoom);
    E.suscribir('doble-clic', (e) => { if (e.tipo === 'texto') EditorTipografia.editarEnLienzo(e); });
    E.cargar();
    enlazarBarra();
    enlazarTeclado();
    requestAnimationFrame(() => EditorLienzo.ajustarAPantalla());
    window.addEventListener('beforeunload', () => { if (E.estaSucio()) E.guardarAhora(); });
    EditorGaleria.abrir();
  }

  /* ---------- Barra superior ---------- */

  function enlazarBarra() {
    document.getElementById('ed-deshacer').addEventListener('click', () => E.deshacer());
    document.getElementById('ed-rehacer').addEventListener('click', () => E.rehacer());
    document.getElementById('ed-zoom-menos').addEventListener('click', () => EditorLienzo.zoomPaso(-1));
    document.getElementById('ed-zoom-mas').addEventListener('click', () => EditorLienzo.zoomPaso(1));
    document.getElementById('ed-zoom-valor').addEventListener('click', () => EditorLienzo.ajustarAPantalla());
    document.getElementById('ed-atajos').addEventListener('click', () => mostrarAtajos(true));
    document.getElementById('ed-inspector-toggle').addEventListener('click', () => mostrarInspector());
    document.getElementById('ed-abrir-galeria').addEventListener('click', () => EditorGaleria.abrir());
    document.getElementById('ed-vista-hoja').addEventListener('click', () => EditorPaquete.abrirHoja());
    const botonExportar = document.getElementById('ed-exportar');
    const menu = document.getElementById('ed-menu-exportar');
    const cerrarMenu = () => { menu.hidden = true; botonExportar.setAttribute('aria-expanded', 'false'); };
    botonExportar.addEventListener('click', (ev) => { ev.stopPropagation(); menu.hidden = !menu.hidden; botonExportar.setAttribute('aria-expanded', String(!menu.hidden)); });
    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('[data-exportar]');
      if (!item) return;
      cerrarMenu();
      const que = item.dataset.exportar;
      if (que === 'png') EditorPaquete.exportarPNG();
      else if (que === 'hoja') EditorPaquete.exportarHoja();
      else if (que === 'guia') EditorPaquete.exportarGuia();
      else if (que === 'archivo') EditorPaquete.exportarPlantilla();
      else if (que === 'importar') EditorPaquete.importar();
    });
    document.addEventListener('click', (ev) => { if (!menu.hidden && !ev.target.closest('.ed-menu-cont')) cerrarMenu(); });
    document.getElementById('ed-nombre').addEventListener('click', editarNombre);
    document.querySelectorAll('[data-cerrar-modal]').forEach((n) => n.addEventListener('click', () => mostrarAtajos(false)));
    const grid = document.getElementById('ed-atajos-grid');
    grid.innerHTML = ATAJOS.map((a) => a[1] ? '<div class="ed-atajo"><span>' + a[0] + '</span><span class="ed-atajo-teclas">' + a[1].map((k) => '<kbd>' + k + '</kbd>').join('') + '</span></div>' : '<h3 class="ed-seccion-titulo ed-atajos-seccion">' + a[0] + '</h3>').join('');
  }

  function actualizarHistorial() {
    document.getElementById('ed-deshacer').disabled = !E.puedeDeshacer();
    document.getElementById('ed-rehacer').disabled = !E.puedeRehacer();
  }
  function actualizarNombre() {
    document.getElementById('ed-nombre-texto').textContent = E.obtener().nombre;
    document.title = E.obtener().nombre + ' — Editor de plantillas · FotoCabina';
  }
  function actualizarGuardado(estado) {
    const n = document.getElementById('ed-guardado');
    n.dataset.estado = estado;
    n.textContent = estado === 'guardado' ? 'Guardado' : estado === 'sucio' ? 'Sin guardar' : estado === 'error' ? 'No se pudo guardar' : 'Guardando';
  }
  function actualizarZoom() {
    document.getElementById('ed-zoom-valor').textContent = EditorLienzo.zoomPorcentaje() + '%';
  }

  function editarNombre() {
    const boton = document.getElementById('ed-nombre');
    const input = document.createElement('input');
    input.className = 'ed-nombre-input';
    input.value = E.obtener().nombre;
    input.maxLength = 80;
    boton.replaceWith(input);
    input.focus(); input.select();
    let listo = false;
    const terminar = (guardar) => {
      if (listo) return;
      listo = true;
      if (guardar) E.renombrar(input.value);
      input.replaceWith(boton);
      actualizarNombre();
    };
    input.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') terminar(true); if (ev.key === 'Escape') terminar(false); });
    input.addEventListener('blur', () => terminar(true));
  }

  function mostrarInspector(forzar) {
    const app = document.getElementById('ed-app');
    const oculto = forzar === true ? false : forzar === false ? true : !app.classList.contains('inspector-oculto');
    app.classList.toggle('inspector-oculto', oculto);
    document.getElementById('ed-inspector-toggle').setAttribute('aria-pressed', String(!oculto));
    setTimeout(() => E.emitir('vista'), 240);
  }

  function mostrarAtajos(abrir) {
    document.getElementById('ed-modal-atajos').hidden = !abrir;
  }

  function exportar() {
    EditorPaquete.exportarPNG();
  }

  function aviso(texto) {
    const t = document.getElementById('ed-toast');
    clearTimeout(toastTimer);
    t.innerHTML = EditorIconos.svg('ok') + '<span>' + texto + '</span>';
    t.classList.remove('saliendo');
    t.hidden = false;
    toastTimer = setTimeout(() => { t.classList.add('saliendo'); setTimeout(() => { t.hidden = true; }, 140); }, 1800);
  }

  function pista(texto) {
    const n = document.getElementById('ed-pista');
    if (!texto) { n.hidden = true; return; }
    n.textContent = texto;
    n.hidden = false;
  }

  /* ---------- Teclado ---------- */

  function enlazarTeclado() {
    window.addEventListener('keydown', (ev) => {
      const activo = document.activeElement;
      const escribiendo = activo && (activo.tagName === 'INPUT' || activo.tagName === 'TEXTAREA' || activo.tagName === 'SELECT' || activo.isContentEditable);
      const ctrl = ev.ctrlKey || ev.metaKey;
      const k = ev.key;
      const modal = document.getElementById('ed-modal-atajos');
      const modalHoja = document.getElementById('ed-modal-hoja');

      if (k === 'Escape') {
        if (!modal.hidden) { mostrarAtajos(false); return; }
        if (!modalHoja.hidden) { EditorPaquete.cerrarHoja(); return; }
        if (EditorGaleria.estaAbierta()) { if (!escribiendo) EditorGaleria.alEscape(); return; }
        if (escribiendo) { activo.blur(); return; }
        if (E.obtenerSeleccion().length) { E.limpiarSeleccion(); return; }
        if (EditorPaneles.estaAbierto()) EditorPaneles.cerrar();
        return;
      }
      if (escribiendo) {
        if (ctrl && k.toLowerCase() === 's') { ev.preventDefault(); E.guardarAhora(); aviso('Guardado'); }
        if (k === 'Enter' && activo.tagName === 'INPUT' && activo.type === 'number') activo.blur();
        return;
      }
      if (k === 'Enter' && !ctrl) {
        const sel = E.seleccionados();
        if (sel.length === 1 && sel[0].tipo === 'texto') { ev.preventDefault(); EditorTipografia.editarEnLienzo(sel[0]); return; }
      }
      if (!modal.hidden || !modalHoja.hidden || EditorGaleria.estaAbierta()) return;

      if (ctrl && k.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? E.rehacer() : E.deshacer(); return; }
      if (ctrl && k.toLowerCase() === 'y') { ev.preventDefault(); E.rehacer(); return; }
      if (ctrl && k.toLowerCase() === 'd') { ev.preventDefault(); if (E.obtenerSeleccion().length) { E.duplicarSeleccion(); aviso('Duplicado'); } return; }
      if (ctrl && k.toLowerCase() === 'a') { ev.preventDefault(); E.seleccionarTodo(); return; }
      if (ctrl && k.toLowerCase() === 's') { ev.preventDefault(); E.guardarAhora(); aviso('Guardado'); return; }
      if (ctrl && k.toLowerCase() === 'e') { ev.preventDefault(); exportar(); return; }
      if (ctrl && k.toLowerCase() === 'p') { ev.preventDefault(); EditorPaquete.abrirHoja(); return; }
      if (ctrl && k.toLowerCase() === 'o') { ev.preventDefault(); EditorGaleria.abrir(); return; }
      if (ctrl && k.toLowerCase() === 'l') { ev.preventDefault(); const sel = E.seleccionados(); if (sel.length) { E.aplicar(() => sel.forEach((e) => { e.bloqueado = !e.bloqueado; })); E.emitir('seleccion'); } return; }
      if (ctrl && ev.shiftKey && k.toLowerCase() === 'h') { ev.preventDefault(); const sel = E.seleccionados(); if (sel.length) { E.aplicar(() => sel.forEach((e) => { e.visible = !e.visible; })); E.emitir('seleccion'); } return; }
      if (ctrl && (k === ']' || k === '}')) { ev.preventDefault(); E.ordenar(ev.shiftKey ? 'frente' : 'subir'); return; }
      if (ctrl && (k === '[' || k === '{')) { ev.preventDefault(); E.ordenar(ev.shiftKey ? 'fondo' : 'bajar'); return; }
      if (ctrl && (k === '=' || k === '+')) { ev.preventDefault(); EditorLienzo.zoomPaso(1); return; }
      if (ctrl && (k === '-' || k === '_')) { ev.preventDefault(); EditorLienzo.zoomPaso(-1); return; }
      if (ctrl && k === '0') { ev.preventDefault(); EditorLienzo.ajustarAPantalla(); return; }
      if (ctrl) return;

      if (k === 'Delete' || k === 'Backspace') { ev.preventDefault(); E.eliminarSeleccion(); return; }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
        const sel = E.editables();
        if (!sel.length) return;
        ev.preventDefault();
        const paso = ev.shiftKey ? 10 : 1;
        const dx = k === 'ArrowLeft' ? -paso : k === 'ArrowRight' ? paso : 0;
        const dy = k === 'ArrowUp' ? -paso : k === 'ArrowDown' ? paso : 0;
        E.aplicar(() => sel.forEach((e) => { e.xMm = E.redondear(e.xMm + dx, 2); e.yMm = E.redondear(e.yMm + dy, 2); }));
        return;
      }
      if (k === '?' || (k === '/' && ev.shiftKey)) { ev.preventDefault(); mostrarAtajos(true); return; }
      const letra = k.toLowerCase();
      if (letra === 'f') { E.agregarElemento('foto'); aviso('Espacio de foto agregado'); }
      else if (letra === 't') { E.agregarElemento('texto'); }
      else if (letra === 'r') { E.agregarElemento('forma', { figura: 'rectangulo', nombre: 'Rectángulo' }); }
      else if (letra === 'o') { E.agregarElemento('forma', { figura: 'circulo', nombre: 'Círculo' }); }
      else if (letra === 'l') { E.agregarElemento('forma', { figura: 'linea', nombre: 'Línea' }); }
      else if (letra === 'i') { const e = E.agregarElemento('imagen'); EditorPaneles.subirImagenPara(e.id); }
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  return { aviso, pista, mostrarInspector, mostrarAtajos, exportar };
})();

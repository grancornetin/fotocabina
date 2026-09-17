const EditorPaquete = (() => {
  const E = EditorEstado;
  let inputImportar, modalHoja, contHoja;
  let hojaActual = null;

  const nombreArchivo = (nombre, sufijo) => ((nombre || 'plantilla').replace(/[^a-z0-9áéíóúñü]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'plantilla') + sufijo;

  function iniciar() {
    inputImportar = document.getElementById('ed-importar-archivo');
    modalHoja = document.getElementById('ed-modal-hoja');
    contHoja = document.getElementById('ed-hoja-vista');
    inputImportar.addEventListener('change', alElegirArchivo);
    modalHoja.querySelectorAll('[data-cerrar-hoja]').forEach((n) => n.addEventListener('click', cerrarHoja));
    document.getElementById('ed-hoja-descargar').addEventListener('click', () => exportarHoja());
    document.getElementById('ed-hoja-imprimir').addEventListener('click', imprimirPrueba);
  }

  /* ---------- Archivo de plantilla (.fotocabina.json) ---------- */

  function exportarPlantilla(p) {
    p = p || E.obtener();
    E.guardarAhora();
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombreArchivo(p.nombre, '.fotocabina.json');
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    EditorApp.aviso('Archivo de plantilla descargado (lleva imágenes y fuentes adentro)');
  }

  function importar() {
    inputImportar.value = '';
    inputImportar.click();
  }

  function alElegirArchivo() {
    const archivos = Array.from(inputImportar.files || []);
    if (!archivos.length) return;
    archivos.forEach((archivo) => {
      const lector = new FileReader();
      lector.onerror = () => EditorApp.aviso('No se pudo leer ' + archivo.name);
      lector.onload = () => {
        let p;
        try { p = JSON.parse(lector.result); } catch (err) { EditorApp.aviso(archivo.name + ' no es un archivo de plantilla válido'); return; }
        if (!p || !p.papel || !Array.isArray(p.elementos)) { EditorApp.aviso(archivo.name + ' no tiene el formato de FotoCabina'); return; }
        const nueva = E.incorporarPlantilla(p);
        if (typeof EditorGaleria !== 'undefined' && EditorGaleria.estaAbierta()) EditorGaleria.cerrar();
        requestAnimationFrame(() => EditorLienzo.ajustarAPantalla());
        EditorApp.aviso('Plantilla importada: ' + nueva.nombre);
      };
      lector.readAsText(archivo);
    });
  }

  /* ---------- Imagen y hoja ---------- */

  async function exportarPNG() {
    const p = E.obtener();
    EditorApp.aviso('Generando imagen a ' + p.papel.ppp + ' ppp…');
    const canvas = await EditorRender.renderizar(p);
    await EditorRender.descargarCanvas(canvas, nombreArchivo(p.nombre, '-' + p.papel.ppp + 'ppp.png'));
    EditorApp.aviso('Imagen descargada: ' + canvas.width + ' × ' + canvas.height + ' px');
  }

  async function exportarGuia() {
    const p = E.obtener();
    const canvas = await EditorRender.renderizar(p, { modoGuia: true });
    await EditorRender.descargarCanvas(canvas, nombreArchivo(p.nombre, '-guia-canva.png'));
    EditorApp.aviso('Guía descargada. En Canva: "Tamaño personalizado" ' + canvas.width + ' × ' + canvas.height + ' px, subí la guía como capa y diseñá encima');
  }

  async function exportarHoja() {
    const p = E.obtener();
    EditorApp.aviso('Generando hoja a ' + p.papel.ppp + ' ppp…');
    const hoja = await EditorRender.renderizarHoja(p);
    await EditorRender.descargarCanvas(hoja.canvas, nombreArchivo(p.nombre, '-hoja-' + p.papel.ppp + 'ppp.png'));
    EditorApp.aviso('Hoja descargada: ' + hoja.canvas.width + ' × ' + hoja.canvas.height + ' px' + (hoja.copias === 2 ? ' · dos tiras' : ''));
  }

  async function abrirHoja() {
    const p = E.obtener();
    modalHoja.hidden = false;
    contHoja.innerHTML = '<p class="ed-hoja-cargando">Armando la hoja…</p>';
    const hoja = await EditorRender.renderizarHoja(p, { ppp: 72, lineaCorte: true });
    hojaActual = hoja;
    contHoja.innerHTML = '';
    hoja.canvas.className = 'ed-hoja-canvas';
    hoja.canvas.style.aspectRatio = hoja.anchoMm + '/' + hoja.altoMm;
    contHoja.append(hoja.canvas);
    const pxAncho = Math.round(hoja.anchoMm / 25.4 * p.papel.ppp), pxAlto = Math.round(hoja.altoMm / 25.4 * p.papel.ppp);
    document.getElementById('ed-hoja-detalle').textContent = (hoja.copias === 2 ? 'Hoja 4 × 6 in con dos tiras 2 × 6 · línea roja = corte' : 'Hoja ' + Math.round(hoja.anchoMm) + ' × ' + Math.round(hoja.altoMm) + ' mm') + ' · a ' + p.papel.ppp + ' ppp: ' + pxAncho + ' × ' + pxAlto + ' px';
  }

  function cerrarHoja() {
    modalHoja.hidden = true;
    hojaActual = null;
  }

  async function imprimirPrueba() {
    const p = E.obtener();
    EditorApp.aviso('Preparando copia de prueba…');
    const hoja = await EditorRender.renderizarHoja(p);
    const url = hoja.canvas.toDataURL('image/png');
    const anchoIn = hoja.anchoMm / 25.4, altoIn = hoja.altoMm / 25.4;
    const w = window.open('', '_blank');
    if (!w) { EditorApp.aviso('El navegador bloqueó la ventana de impresión; permití ventanas emergentes'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + p.nombre + ' — copia de prueba</title><style>@page{size:' + anchoIn + 'in ' + altoIn + 'in;margin:0}html,body{margin:0;padding:0}img{display:block;width:' + anchoIn + 'in;height:' + altoIn + 'in}</style></head><body><img src="' + url + '" alt=""></body></html>');
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  return { iniciar, exportarPlantilla, importar, exportarPNG, exportarHoja, exportarGuia, abrirHoja, cerrarHoja, imprimirPrueba };
})();

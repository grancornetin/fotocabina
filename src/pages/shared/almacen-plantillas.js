/*
  Almacén de plantillas: SOLO LECTURA (hito 0.2).
  El editor (03-editor-plantillas) es el único que escribe la clave 'fotocabina-editor-v1'.
  Aquí se lee y se entrega cada plantilla ya normalizada, siempre como copia: nunca se modifica lo guardado.
  La puerta es asíncrona (regla 7 de docs/ARQUITECTURA_FLUJO.md §5.1): hoy responde al instante,
  mañana puede venir de una base de datos o de la red sin tocar las pantallas.
  Sin lógica de dibujo: eso es de motor-plantillas.js.
*/
const AlmacenPlantillas = (() => {
  const CLAVE = 'fotocabina-editor-v1';

  // Lee y valida el contenedor guardado. null si no existe o está dañado.
  function leerContenedor() {
    let crudo;
    try { crudo = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return null; }
    if (!crudo || typeof crudo !== 'object' || !Array.isArray(crudo.plantillas)) return null;
    return crudo;
  }

  // Misma limpieza que hace el editor al abrir una plantilla, pero sobre una copia propia.
  function normalizar(original) {
    if (!original || typeof original !== 'object' || !original.papel || typeof original.papel !== 'object') return null;
    const p = JSON.parse(JSON.stringify(original));
    p.guiasPropias = p.guiasPropias || [];
    p.asistencia = p.asistencia || { iman: true, cuadricula: false, pasoCuadriculaMm: 5 };
    p.recursos = p.recursos || { fuentes: [] };
    if (!Array.isArray(p.recursos.fuentes)) p.recursos.fuentes = [];
    p.fondo = p.fondo || { tipo: 'color', color: '#FFFFFF' };
    p.elementos = (Array.isArray(p.elementos) ? p.elementos : []).filter((e) => e && e.tipo !== 'qr');
    p.elementos.forEach((e, i) => { if (typeof e.orden !== 'number') e.orden = i; if (typeof e.visible !== 'boolean') e.visible = true; delete e.imprimir; });
    if (!p.nombre) p.nombre = 'Plantilla';
    return p;
  }

  // Devuelve una promesa con la plantilla (copia normalizada), o null si no existe o el almacén está dañado.
  function obtener(id) {
    const contenedor = leerContenedor();
    if (!contenedor || !id) return Promise.resolve(null);
    const hallada = contenedor.plantillas.find((p) => p && p.id === id);
    return Promise.resolve(hallada ? normalizar(hallada) : null);
  }

  // Devuelve una promesa con la lista de plantillas (copias normalizadas), [] si no hay ninguna válida,
  // o null si el almacén no existe o está dañado.
  function listar() {
    const contenedor = leerContenedor();
    if (!contenedor) return Promise.resolve(null);
    // Una plantilla sin id recibe uno estable (según su posición) solo en la copia entregada; lo guardado no cambia.
    return Promise.resolve(contenedor.plantillas.map((p, i) => { const c = normalizar(p); if (c && !c.id) c.id = 'sin-id-' + i; return c; }).filter(Boolean));
  }

  return { obtener, listar };
})();

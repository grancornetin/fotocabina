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

  // ---------- Huella (identidad del diseño, hito 0.1b) ----------
  // Dos plantillas con el mismo diseño tienen la misma huella aunque se hayan guardado en distinto
  // momento: no entra la fecha de modificación ni el orden de las claves. Sirve para congelar una
  // copia por diseño (y no una por sesión) y para saber si la plantilla vigente cambió.

  function canonico(valor) {
    if (Array.isArray(valor)) return valor.map(canonico);
    if (valor && typeof valor === 'object') {
      const salida = {};
      Object.keys(valor).sort().forEach((k) => { if (k !== 'modificada') salida[k] = canonico(valor[k]); });
      return salida;
    }
    return valor;
  }

  // cyrb53: hash de 53 bits, síncrono, para cuando no hay crypto.subtle.
  function hash53(texto) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < texto.length; i++) {
      const c = texto.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  // Promesa con la huella ('h-…') de una plantilla ya normalizada. null si no es una plantilla.
  async function huella(plantilla) {
    if (!plantilla || typeof plantilla !== 'object') return null;
    const texto = JSON.stringify(canonico(plantilla));
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
        const resumen = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
        return 'h-' + Array.from(resumen.slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { /* sin crypto.subtle: se usa el hash simple */ }
    return 'h-' + hash53(texto) + texto.length.toString(36);
  }

  return { obtener, listar, huella };
})();

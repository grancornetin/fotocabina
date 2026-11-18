/*
  Almacén de plantillas: SOLO LECTURA (hito 0.2), con UNA excepción (hito 1.6): las funciones "...ParaRespaldo"
  / "...DesdeRespaldo" del final, que solo usa shared/respaldo.js para guardar y restaurar copias de seguridad.
  El editor (03-editor-plantillas) sigue siendo el dueño del formato y el único que escribe la clave
  'fotocabina-editor-v1' en el uso normal.
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


  // ---------- Respaldo y restauración (hito 1.6): ÚNICA excepción a "solo lectura" ----------
  // El editor guarda en 'fotocabina-editor-v1' un contenedor { plantillas: [...], ultimaAbierta, ... } y es
  // su dueño: aquí no se cambia su formato, solo se lee el contenedor tal cual y se reescribe como vino
  // en un respaldo. Quien llame (respaldo.js) debe pedir antes que se cierre el editor: el editor guarda
  // desde su memoria y podría pisar lo restaurado.

  // Copia del contenedor tal cual está guardado (sin normalizar). null si no existe o está dañado.
  function leerContenedorParaRespaldo() {
    const c = leerContenedor();
    return c ? JSON.parse(JSON.stringify(c)) : null;
  }

  // 'ausente' (no hay nada guardado), 'valido' o 'danado' (hay texto pero no se puede leer como contenedor). Sirve para que un
  // respaldo avise cuando no pudo leer las plantillas en vez de salir "completo" sin ellas.
  function estadoContenedorParaRespaldo() {
    let texto;
    try { texto = localStorage.getItem(CLAVE); } catch (e) { return 'danado'; }
    if (texto == null) return 'ausente';
    return leerContenedor() ? 'valido' : 'danado';
  }

  // Texto exacto guardado en la clave (o null si no hay), para poder devolverlo si la restauración falla.
  // Lanza si el almacenamiento no se puede leer.
  function instantaneaParaRespaldo() {
    return localStorage.getItem(CLAVE);
  }

  function devolverInstantaneaDeRespaldo(texto) {
    if (texto == null) localStorage.removeItem(CLAVE); else localStorage.setItem(CLAVE, texto);
  }

  // Misma limpieza que `obtener()`, sobre una copia: sirve para comparar plantillas de un respaldo con las guardadas.
  function copiaNormalizada(plantilla) {
    return normalizar(plantilla);
  }

  // Reemplaza todo el contenedor por el del respaldo (modo "Reemplazar todo"). null borra la clave. Lanza si no cabe.
  function reemplazarContenedorDesdeRespaldo(contenedor) {
    if (contenedor == null) { localStorage.removeItem(CLAVE); return; }
    if (typeof contenedor !== 'object' || !Array.isArray(contenedor.plantillas)) throw new Error('Contenedor de plantillas no válido');
    const nuevo = JSON.parse(JSON.stringify(contenedor));
    const ids = nuevo.plantillas.map((p) => p && p.id);
    if (!ids.includes(nuevo.ultimaAbierta)) nuevo.ultimaAbierta = ids.length ? ids[0] : null;
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  }

  // Suma plantillas al contenedor (modo "Sumar" y exportar/importar evento): las que ya existen por id se dejan como
  // están. Conserva `ultimaAbierta` si sigue siendo válida; si no, usa la de `opciones.ultimaAbierta` o la primera.
  // Devuelve { agregadas, omitidas }. Lanza si no cabe.
  function agregarPlantillasDesdeRespaldo(lista, opciones) {
    const actualLeido = leerContenedor();
    // Si hay algo guardado pero dañado, "Sumar" no lo pisa: se cancela y la restauración devuelve todo como estaba.
    if (!actualLeido && localStorage.getItem(CLAVE) != null) throw new Error('Las plantillas guardadas en este equipo están dañadas y «Sumar» no las pisa. No se cambió nada.');
    const actual = actualLeido || { plantillas: [], ultimaAbierta: null };
    const ids = new Set(actual.plantillas.map((p) => p && p.id));
    let agregadas = 0;
    let omitidas = 0;
    (Array.isArray(lista) ? lista : []).forEach((p) => {
      if (!p || typeof p !== 'object' || !p.id) return;
      if (ids.has(p.id)) { omitidas += 1; return; }
      ids.add(p.id);
      actual.plantillas.push(JSON.parse(JSON.stringify(p)));
      agregadas += 1;
    });
    if (!agregadas) return { agregadas, omitidas };
    const validas = actual.plantillas.map((p) => p && p.id);
    const pedida = opciones && opciones.ultimaAbierta;
    if (!validas.includes(actual.ultimaAbierta)) actual.ultimaAbierta = validas.includes(pedida) ? pedida : validas[0];
    localStorage.setItem(CLAVE, JSON.stringify(actual));
    return { agregadas, omitidas };
  }

  return {
    obtener,
    listar,
    huella,
    leerContenedorParaRespaldo,
    estadoContenedorParaRespaldo,
    instantaneaParaRespaldo,
    devolverInstantaneaDeRespaldo,
    copiaNormalizada,
    reemplazarContenedorDesdeRespaldo,
    agregarPlantillasDesdeRespaldo,
  };
})();

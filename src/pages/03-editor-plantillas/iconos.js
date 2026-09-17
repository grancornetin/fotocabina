const EditorIconos = (() => {
  const abrir = (extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>`;
  const cerrar = '</svg>';
  const trazo = (paths) => abrir() + paths + cerrar;

  const iconos = {
    marca: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="6" width="18" height="14" rx="4"/><circle cx="12" cy="13" r="3.5" fill="#0A0A0B"/></svg>',
    foto: trazo('<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/>'),
    texto: trazo('<path d="M5 6h14M12 6v13M9 19h6"/>'),
    forma: trazo('<rect x="3" y="3" width="8" height="8" rx="1.5"/><circle cx="17" cy="17" r="4"/><path d="M4 20l6-6"/>'),
    imagen: trazo('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 9"/>'),
    dato: trazo('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    qr: trazo('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M21 14v3M14 21h3M21 21h-1"/>'),
    fondo: trazo('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 5 5 4-4 4 4"/>'),
    papel: trazo('<path d="M6 3h8l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v5h5"/>'),
    capas: trazo('<path d="M12 4l9 5-9 5-9-5 9-5z"/><path d="M3 14l9 5 9-5"/>'),
    deshacer: trazo('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>'),
    rehacer: trazo('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>'),
    mas: trazo('<path d="M12 5v14M5 12h14"/>'),
    menos: trazo('<path d="M5 12h14"/>'),
    cerrar: trazo('<path d="M6 6l12 12M18 6L6 18"/>'),
    editar: trazo('<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M13 7l4 4"/>'),
    exportar: trazo('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M4 21h16"/>'),
    atajos: trazo('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>'),
    panelDerecho: trazo('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/>'),
    ojo: trazo('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    ojoCerrado: trazo('<path d="M3 3l18 18"/><path d="M10.6 5.3A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6C3.6 8.7 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/>'),
    candado: trazo('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 018 0v4"/>'),
    candadoAbierto: trazo('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 017.5-2"/>'),
    duplicar: trazo('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3"/>'),
    eliminar: trazo('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    alFrente: trazo('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke-dasharray="2 2"/>'),
    atras: trazo('<rect x="4" y="4" width="12" height="12" rx="2.5" stroke-dasharray="2 2"/><path d="M8 16v2a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-2"/>'),
    subir: trazo('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    bajar: trazo('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    alinearIzquierda: trazo('<path d="M4 3v18"/><rect x="7" y="6" width="12" height="4" rx="1.2"/><rect x="7" y="14" width="8" height="4" rx="1.2"/>'),
    alinearCentroH: trazo('<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1.2"/><rect x="8" y="14" width="8" height="4" rx="1.2"/>'),
    alinearDerecha: trazo('<path d="M20 3v18"/><rect x="5" y="6" width="12" height="4" rx="1.2"/><rect x="9" y="14" width="8" height="4" rx="1.2"/>'),
    alinearArriba: trazo('<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12" rx="1.2"/><rect x="14" y="7" width="4" height="8" rx="1.2"/>'),
    alinearCentroV: trazo('<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="8" width="4" height="8" rx="1.2"/>'),
    alinearAbajo: trazo('<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12" rx="1.2"/><rect x="14" y="9" width="4" height="8" rx="1.2"/>'),
    distribuirH: trazo('<path d="M3 4v16M21 4v16"/><rect x="8" y="8" width="3" height="8" rx="1"/><rect x="13" y="8" width="3" height="8" rx="1"/>'),
    distribuirV: trazo('<path d="M4 3h16M4 21h16"/><rect x="8" y="8" width="8" height="3" rx="1"/><rect x="8" y="13" width="8" height="3" rx="1"/>'),
    rectangulo: trazo('<rect x="4" y="5" width="16" height="14" rx="2.5"/>'),
    circulo: trazo('<circle cx="12" cy="12" r="8"/>'),
    linea: trazo('<path d="M4 18L20 6"/>'),
    ajustar: trazo('<path d="M4 9V6a2 2 0 012-2h3M15 4h3a2 2 0 012 2v3M20 15v3a2 2 0 01-2 2h-3M9 20H6a2 2 0 01-2-2v-3"/>'),
    cubrir: trazo('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 14l5-4 4 4 3-3 6 5"/>'),
    contener: trazo('<rect x="3" y="5" width="18" height="14" rx="2.5"/><rect x="7" y="8" width="10" height="8" rx="1.5"/>'),
    proporcion: trazo('<path d="M8 4H5a1 1 0 00-1 1v3M16 4h3a1 1 0 011 1v3M8 20H5a1 1 0 01-1-1v-3M16 20h3a1 1 0 001-1v-3"/><rect x="9" y="9" width="6" height="6" rx="1"/>'),
    iman: trazo('<path d="M6 3v8a6 6 0 0012 0V3"/><path d="M6 3h4v5H6zM14 3h4v5h-4z"/>'),
    cuadricula: trazo('<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
    regla: trazo('<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>'),
    chevron: trazo('<path d="M6 9l6 6 6-6"/>'),
    ok: trazo('<path d="M5 12l5 5 9-10"/>'),
    alineaTextoIzq: trazo('<path d="M4 6h16M4 12h10M4 18h14"/>'),
    alineaTextoCentro: trazo('<path d="M4 6h16M7 12h10M5 18h14"/>'),
    alineaTextoDer: trazo('<path d="M4 6h16M10 12h10M6 18h14"/>'),
    color: trazo('<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="10" r="1.2" fill="currentColor"/><path d="M12 21a3 3 0 010-6h1a2 2 0 002-2 3 3 0 013-3"/>'),
    esquinas: trazo('<path d="M4 12V8a4 4 0 014-4h4"/><path d="M20 12v4a4 4 0 01-4 4h-4"/>'),
    borde: trazo('<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1.5" stroke-dasharray="2 2"/>'),
    filtro: trazo('<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>'),
    temaOscuro: trazo('<path d="M20 14.5A8.5 8.5 0 1110.2 4a7 7 0 009.8 10.5z"/>'),
    temaClaro: trazo('<circle cx="12" cy="12" r="4.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'),
    temaSistema: trazo('<rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M8 21h8M12 17v4"/>'),
  };

  function svg(nombre) {
    return iconos[nombre] || '';
  }

  function montar(raiz = document) {
    raiz.querySelectorAll('[data-icono]').forEach((n) => {
      if (!n.innerHTML.trim()) n.innerHTML = svg(n.dataset.icono);
    });
  }

  return { svg, montar };
})();

/*
  Cámara Canon del programa de escritorio (docs/ARQUITECTURA_FLUJO.md §7.12). Sin dependencias.

  Solo existe cuando la pantalla corre dentro del programa de escritorio (src/escritorio/): ahí `window.fotocabinaEscritorio`
  habla con la cámara por el SDK de Canon. En un navegador `CamaraEscritorio.disponible` es false y la cabina sigue con la
  cámara web de siempre.

  Cómo encaja con la cabina (que trabaja con un <video> y recorta la foto desde él):
    · La vista previa en vivo (cuadros JPEG de la cámara) se dibuja en un canvas y su captureStream() se pone como
      srcObject del <video>: la cabina lo ve como cualquier cámara (mismo espejo, mismo marco, mismo recorte).
    · Al disparar, la cámara toma la FOTO COMPLETA (5184×3456 en la T5) y se recorta desde ella con la misma región que
      la cabina calculó sobre la vista previa (tienen la misma proporción), así la foto sale nítida y no del cuadro chico.

  Interfaz de la fuente (crearFuente):
    conectar()            async  abre la sesión con la cámara y espera el primer cuadro. Rechaza con Error({ codigo }):
                                 'sin-sdk' (faltan las DLL de Canon), 'sin-camara', 'camara-ocupada', 'camara-perdida'...
    disparar()            async  { imagen: ImageBitmap, ancho, alto } con la foto completa; rechaza si no llega.
    desconectar()         async  suelta la cámara.
    alCambiarEstado(fn)          fn({ estado: 'conectada'|'desconectada'|'durmiendo', detalle }) cuando la cámara se pierde.
    ancho / alto                 tamaño de la vista previa (lo que mide el <video>).
*/
const CamaraEscritorio = (() => {
  'use strict';

  const puente = (typeof window !== 'undefined' && window.fotocabinaEscritorio && window.fotocabinaEscritorio.esEscritorio) ? window.fotocabinaEscritorio : null;
  const API = puente ? puente.camara : null;
  const ID = 'escritorio:canon';
  const ETIQUETA = 'Cámara Canon (por cable)';
  const PRIMER_CUADRO_MS = 12000;

  // Mensajes para el operador, por causa (cada una pide una acción distinta).
  function mensajeDeError(e) {
    const c = e && e.codigo;
    if (c === 'sin-sdk') return 'Este equipo no tiene el SDK de Canon, así que no se puede usar la cámara Canon.';
    if (c === 'sin-camara') return 'No encontramos la cámara Canon. Enciéndela, revisa el cable USB y que no esté dormida.';
    if (c === 'camara-ocupada') return 'La cámara Canon la está usando otro programa (dslrBooth, EOS Utility). Ciérralo y reintenta.';
    if (c === 'camara-perdida' || c === 'camara-sin-respuesta') return 'Se perdió la conexión con la cámara Canon. Revisa el cable, que esté encendida y despierta, y reintenta.';
    if (c === 'foto-no-llego') return 'La cámara disparó pero la foto no llegó al equipo.';
    return 'No pudimos usar la cámara Canon' + (e && e.message ? ` (${e.message})` : '') + '.';
  }

  function crearFuente(video) {
    const lienzo = document.createElement('canvas');
    const ctx = lienzo.getContext('2d');
    let quitarCuadros = null;
    let quitarEstado = null;
    let oyentesEstado = [];
    let activa = false;
    let ocupadoDecodificando = false;
    let primerCuadro = null;
    let flujo = null;

    function tomarCuadro(datos) {
      if (!activa || ocupadoDecodificando) return; // si el anterior no terminó, se descarta (la vista previa nunca se atrasa)
      ocupadoDecodificando = true;
      createImageBitmap(new Blob([datos], { type: 'image/jpeg' })).then((bmp) => {
        if (lienzo.width !== bmp.width || lienzo.height !== bmp.height) { lienzo.width = bmp.width; lienzo.height = bmp.height; }
        ctx.drawImage(bmp, 0, 0);
        if (bmp.close) bmp.close();
        if (primerCuadro) { const r = primerCuadro; primerCuadro = null; r(); }
      }).catch(() => { /* un cuadro dañado se salta */ }).finally(() => { ocupadoDecodificando = false; });
    }

    const fuente = {
      id: ID,
      get ancho() { return lienzo.width; },
      get alto() { return lienzo.height; },

      async conectar() {
        if (!API) { const e = new Error('No disponible'); e.codigo = 'sin-sdk'; throw e; }
        quitarEstado = API.alEstado((e) => {
          if (!activa) return;
          if (e.estado === 'desconectada' || e.estado === 'durmiendo') { activa = false; oyentesEstado.forEach((f) => f(e)); }
        });
        try {
          const conexion = new Promise((res) => { primerCuadro = res; });
          quitarCuadros = API.alCuadro(tomarCuadro);
          activa = true;
          await API.conectar();
          await Promise.race([conexion, new Promise((_, rech) => setTimeout(() => rech(Object.assign(new Error('La vista previa no llegó.'), { codigo: 'camara-perdida' })), PRIMER_CUADRO_MS))]);
          flujo = lienzo.captureStream(30);
          video.srcObject = flujo;
          await video.play();
        } catch (e) {
          await fuente.desconectar();
          throw e;
        }
      },

      async disparar() {
        const r = await API.disparar();
        const imagen = await createImageBitmap(new Blob([r.jpeg], { type: 'image/jpeg' }));
        return { imagen, ancho: imagen.width, alto: imagen.height };
      },

      async desconectar() {
        activa = false;
        primerCuadro = null;
        if (quitarCuadros) { quitarCuadros(); quitarCuadros = null; }
        if (quitarEstado) { quitarEstado(); quitarEstado = null; }
        if (flujo) { flujo.getTracks().forEach((t) => t.stop()); flujo = null; }
        if (video.srcObject) video.srcObject = null;
        try { await API.desconectar(); } catch (e) { /* ya estaba suelta */ }
      },

      alCambiarEstado(fn) { oyentesEstado.push(fn); },
    };
    return fuente;
  }

  return { disponible: !!API, ID, ETIQUETA, crearFuente, mensajeDeError, informacion: puente ? () => puente.info() : null };
})();

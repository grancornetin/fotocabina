/*
  Alineación del corte (hito "Alinear el corte"). Las impresoras que cortan la hoja en dos tiras (HiTi, papel "Split")
  pueden dejar la imagen corrida unos milímetros respecto del papel, y eso cambia al sacar y poner la caja de papel,
  cambiar el rollo o cambiar de impresora. El operador lo corrige antes de cada evento:

    1. Se imprime una hoja de alineación (dibujarHoja): dos mitades de color con una escala en milímetros justo en la
       línea del centro, que la impresora corta.
    2. Mirando la tira de la IZQUIERDA, el operador anota el último número que se ve junto al corte (puede ser negativo).
       Ese número es dónde cayó el corte, en milímetros, respecto del centro del diseño.
    3. La corrección nueva = la vigente + ese número (si el corte cae 2 mm a la izquierda del centro, el diseño está 2 mm
       corrido a la derecha: hay que moverlo 2 mm a la izquierda). Se guarda aquí y viaja con cada impresión.

  La corrección se guarda por impresora Y tipo de papel ('corte' = papel Split, 'normal' = hoja entera), en este equipo
  (localStorage). Sin corrección guardada, el programa de escritorio usa el valor de fábrica (escritorio/config.js).
  Sin dependencias: solo localStorage y un canvas.
*/
const AlineacionImpresion = (() => {
  const CLAVE = 'fotocabina-alineacion-impresion';
  const LIMITE_MM = 15;          // más que esto no es una corrección, es otro problema
  const ESCALA_MM = 8;           // la hoja muestra la escala de −8 a +8 mm alrededor del corte

  const tipoDe = (modo) => (modo === 'corte' ? 'corte' : 'normal');
  const clave = (impresoraId, modo) => `${impresoraId}|${tipoDe(modo)}`;
  const finito = (n) => typeof n === 'number' && Number.isFinite(n);
  const redondear = (n) => Math.round(n * 10) / 10;

  function leerTodo() {
    try {
      const o = JSON.parse(localStorage.getItem(CLAVE));
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch (e) { return {}; }
  }

  function escribirTodo(o) {
    try { localStorage.setItem(CLAVE, JSON.stringify(o)); return true; } catch (e) { return false; }
  }

  // { xMm, yMm, fecha } guardado para esa impresora y tipo de papel, o null.
  function leer(impresoraId, modo) {
    const v = leerTodo()[clave(impresoraId, modo)];
    if (!v || !finito(v.xMm)) return null;
    return { xMm: v.xMm, yMm: finito(v.yMm) ? v.yMm : 0, fecha: typeof v.fecha === 'string' ? v.fecha : null };
  }

  // Guarda la corrección (mm). Devuelve { ok, ajuste } o { ok: false, motivo } ('rango' | 'dato' | 'almacen').
  function guardar(impresoraId, modo, ajuste, ahora) {
    if (!impresoraId || !ajuste || !finito(ajuste.xMm)) return { ok: false, motivo: 'dato' };
    const xMm = redondear(ajuste.xMm);
    const yMm = finito(ajuste.yMm) ? redondear(ajuste.yMm) : 0;
    if (Math.abs(xMm) > LIMITE_MM || Math.abs(yMm) > LIMITE_MM) return { ok: false, motivo: 'rango' };
    const todo = leerTodo();
    const registro = { xMm, yMm, fecha: (ahora instanceof Date ? ahora : new Date()).toISOString() };
    todo[clave(impresoraId, modo)] = registro;
    if (!escribirTodo(todo)) return { ok: false, motivo: 'almacen' };
    return { ok: true, ajuste: registro };
  }

  function borrar(impresoraId, modo) {
    const todo = leerTodo();
    delete todo[clave(impresoraId, modo)];
    return escribirTodo(todo);
  }

  // Calcula la corrección nueva a partir de la vigente y del número que leyó el operador. Función pura.
  //   vigente: { xMm } (la guardada o la de fábrica); leido: número en mm (con signo).
  function corregir(vigente, leido) {
    const actual = vigente && finito(vigente.xMm) ? vigente.xMm : 0;
    if (!finito(leido)) return null;
    const xMm = redondear(actual + leido);
    return { xMm, yMm: vigente && finito(vigente.yMm) ? vigente.yMm : 0, fuera: Math.abs(xMm) > LIMITE_MM };
  }

  // ¿Ya se alineó hoy esta impresora y tipo de papel? (para el aviso suave al lanzar el evento)
  function alineadoHoy(impresoraId, modo, ahora) {
    const v = leer(impresoraId, modo);
    if (!v || !v.fecha) return false;
    const a = new Date(v.fecha), b = ahora instanceof Date ? ahora : new Date();
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // Hoja de alineación: un canvas de 1200 x 1800 px (4x6 pulgadas a 300 ppp) pensado para el papel con corte.
  // `lienzo` = { anchoMm, altoMm }: el tamaño real del papel Split según el driver (la imagen se estira a ese lienzo, así
  // que 1 mm de la escala es 1 mm sobre el papel). Sin dato, 105,4 x 156,5 mm (HiTi P510L).
  function dibujarHoja(lienzo) {
    const anchoMm = lienzo && lienzo.anchoMm > 0 ? lienzo.anchoMm : 105.4;
    const altoMm = lienzo && lienzo.altoMm > 0 ? lienzo.altoMm : 156.5;
    const W = 1200, H = 1800, px = W / anchoMm, py = H / altoMm, cx = W / 2;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#FBE3E8'; g.fillRect(0, 0, cx, H);          // izquierda: rosado
    g.fillStyle = '#DDEBFA'; g.fillRect(cx, 0, W - cx, H);     // derecha: celeste
    g.fillStyle = '#0A0A0B'; g.strokeStyle = '#0A0A0B';
    g.font = '700 22px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';

    // Escala en milímetros junto a la línea del corte, arriba, al medio y abajo (así se lee aunque la hoja salga algo torcida).
    [90, Math.round(H / 2 - 70), H - 220].forEach((y) => {
      for (let k = -ESCALA_MM; k <= ESCALA_MM; k++) {
        const x = Math.round(cx + k * px);
        const largo = k === 0 ? 130 : (k % 2 === 0 ? 90 : 55);
        g.lineWidth = k === 0 ? 4 : 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + largo); g.stroke();
        if (k % 2 === 0) g.fillText(k > 0 ? '+' + k : String(k), x, y + largo + 6);
      }
    });
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();

    // Instrucciones, cada una dentro de su tira (lejos del corte para que no se pierdan).
    g.textAlign = 'left'; g.font = '700 40px Arial, sans-serif';
    g.fillText('ALINEAR EL CORTE', 90, 340);
    g.font = '400 26px Arial, sans-serif';
    ['Mira ESTA tira (la de la izquierda).', 'Busca junto al corte el último', 'número que se ve completo.', 'Escríbelo en la cabina, con su signo.'].forEach((t, i) => g.fillText(t, 90, 410 + i * 40));
    g.fillText('Tira de la derecha: sirve para comprobar.', 640, 340);
    g.fillText('Con la alineación bien hecha, el corte', 640, 380);
    g.fillText('cae en el 0 y no hay franja de otro color.', 640, 420);
    return c;
  }

  return { LIMITE_MM, ESCALA_MM, clave, leer, guardar, borrar, corregir, alineadoHoy, dibujarHoja };
})();

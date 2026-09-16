// Codificador GIF89a sin dependencias: paleta global por corte mediano, dithering
// Floyd–Steinberg y compresión LZW. Pensado para GIFs cortos de 2 a 5 fotos.
(function (raiz) {
  'use strict';

  // ---------- Paleta: corte mediano sobre una muestra de píxeles ----------

  function construirPaleta(cuadros, maxColores, muestreo) {
    const puntos = [];
    for (const cuadro of cuadros) {
      const d = cuadro.data;
      for (let i = 0; i < d.length; i += 4 * muestreo) {
        puntos.push((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      }
    }

    const cajas = [{ puntos, fija: false }];
    while (cajas.length < maxColores) {
      let mejor = -1;
      for (let i = 0; i < cajas.length; i++) {
        if (!cajas[i].fija && cajas[i].puntos.length > 1 && (mejor < 0 || cajas[i].puntos.length > cajas[mejor].puntos.length)) {
          mejor = i;
        }
      }
      if (mejor < 0) break;

      const caja = cajas[mejor];
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
      for (const p of caja.puntos) {
        const r = p >> 16, g = (p >> 8) & 255, b = p & 255;
        if (r < minR) minR = r; if (r > maxR) maxR = r;
        if (g < minG) minG = g; if (g > maxG) maxG = g;
        if (b < minB) minB = b; if (b > maxB) maxB = b;
      }
      const rangoR = maxR - minR, rangoG = maxG - minG, rangoB = maxB - minB;
      if (rangoR === 0 && rangoG === 0 && rangoB === 0) {
        caja.fija = true;
        continue;
      }

      let desplazamiento = 16;
      if (rangoG >= rangoR && rangoG >= rangoB) desplazamiento = 8;
      else if (rangoB >= rangoR && rangoB >= rangoG) desplazamiento = 0;

      caja.puntos.sort((a, b) => ((a >> desplazamiento) & 255) - ((b >> desplazamiento) & 255));
      const mitad = caja.puntos.length >> 1;
      cajas.splice(mejor, 1,
        { puntos: caja.puntos.slice(0, mitad), fija: false },
        { puntos: caja.puntos.slice(mitad), fija: false });
    }

    const paleta = new Uint8Array(256 * 3);
    cajas.forEach((caja, i) => {
      let sr = 0, sg = 0, sb = 0;
      for (const p of caja.puntos) { sr += p >> 16; sg += (p >> 8) & 255; sb += p & 255; }
      const n = caja.puntos.length || 1;
      paleta[i * 3] = Math.round(sr / n);
      paleta[i * 3 + 1] = Math.round(sg / n);
      paleta[i * 3 + 2] = Math.round(sb / n);
    });
    return { paleta, cantidad: cajas.length };
  }

  // ---------- Indexado con dithering Floyd–Steinberg ----------

  function crearBuscador(paleta, cantidad) {
    const cache = new Map();
    return function masCercano(r, g, b) {
      const clave = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const hit = cache.get(clave);
      if (hit !== undefined) return hit;
      let mejor = 0, mejorDist = Infinity;
      for (let i = 0; i < cantidad; i++) {
        const dr = r - paleta[i * 3], dg = g - paleta[i * 3 + 1], db = b - paleta[i * 3 + 2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < mejorDist) { mejorDist = dist; mejor = i; }
      }
      cache.set(clave, mejor);
      return mejor;
    };
  }

  function indexarCuadro(cuadro, paleta, buscador) {
    const ancho = cuadro.width, alto = cuadro.height, d = cuadro.data;
    const indices = new Uint8Array(ancho * alto);
    let errorFila = new Float32Array((ancho + 2) * 3);
    let errorSiguiente = new Float32Array((ancho + 2) * 3);

    for (let y = 0; y < alto; y++) {
      errorSiguiente.fill(0);
      for (let x = 0; x < ancho; x++) {
        const i = (y * ancho + x) * 4;
        const e = (x + 1) * 3;
        const r = clamp(d[i] + errorFila[e]);
        const g = clamp(d[i + 1] + errorFila[e + 1]);
        const b = clamp(d[i + 2] + errorFila[e + 2]);
        const idx = buscador(r, g, b);
        indices[y * ancho + x] = idx;

        const er = r - paleta[idx * 3], eg = g - paleta[idx * 3 + 1], eb = b - paleta[idx * 3 + 2];
        errorFila[e + 3] += er * 7 / 16; errorFila[e + 4] += eg * 7 / 16; errorFila[e + 5] += eb * 7 / 16;
        errorSiguiente[e - 3] += er * 3 / 16; errorSiguiente[e - 2] += eg * 3 / 16; errorSiguiente[e - 1] += eb * 3 / 16;
        errorSiguiente[e] += er * 5 / 16; errorSiguiente[e + 1] += eg * 5 / 16; errorSiguiente[e + 2] += eb * 5 / 16;
        errorSiguiente[e + 3] += er / 16; errorSiguiente[e + 4] += eg / 16; errorSiguiente[e + 5] += eb / 16;
      }
      const tmp = errorFila; errorFila = errorSiguiente; errorSiguiente = tmp;
    }
    return indices;
  }

  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  // ---------- Escritura de bytes ----------

  class Escritor {
    constructor() { this.buf = new Uint8Array(1 << 16); this.pos = 0; }
    asegurar(n) {
      if (this.pos + n <= this.buf.length) return;
      let nuevo = this.buf.length * 2;
      while (nuevo < this.pos + n) nuevo *= 2;
      const b = new Uint8Array(nuevo); b.set(this.buf); this.buf = b;
    }
    byte(v) { this.asegurar(1); this.buf[this.pos++] = v & 255; }
    corto(v) { this.byte(v & 255); this.byte((v >> 8) & 255); }
    bytes(arr) { this.asegurar(arr.length); this.buf.set(arr, this.pos); this.pos += arr.length; }
    texto(s) { for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); }
    resultado() { return this.buf.slice(0, this.pos); }
  }

  // ---------- LZW (esquema clásico de GIF, códigos de hasta 12 bits) ----------

  function escribirLzw(escritor, indices, tamanoMinimo) {
    const codigoLimpiar = 1 << tamanoMinimo;
    const codigoFin = codigoLimpiar + 1;
    let tamanoCodigo = tamanoMinimo + 1;
    let siguienteCodigo = codigoFin + 1;
    let tabla = new Map();

    let acumulador = 0, bitsAcumulados = 0;
    let bloque = new Uint8Array(255), enBloque = 0;

    function volcarBloque() {
      if (enBloque === 0) return;
      escritor.byte(enBloque);
      escritor.bytes(bloque.subarray(0, enBloque));
      enBloque = 0;
    }
    function emitir(codigo) {
      acumulador |= codigo << bitsAcumulados;
      bitsAcumulados += tamanoCodigo;
      while (bitsAcumulados >= 8) {
        bloque[enBloque++] = acumulador & 255;
        if (enBloque === 255) volcarBloque();
        acumulador >>>= 8;
        bitsAcumulados -= 8;
      }
    }

    emitir(codigoLimpiar);
    let prefijo = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const clave = (prefijo << 8) | k;
      const existente = tabla.get(clave);
      if (existente !== undefined) {
        prefijo = existente;
        continue;
      }
      emitir(prefijo);
      if (siguienteCodigo === 4096) {
        emitir(codigoLimpiar);
        tabla = new Map();
        siguienteCodigo = codigoFin + 1;
        tamanoCodigo = tamanoMinimo + 1;
      } else {
        if (siguienteCodigo >= (1 << tamanoCodigo)) tamanoCodigo++;
        tabla.set(clave, siguienteCodigo++);
      }
      prefijo = k;
    }
    emitir(prefijo);
    emitir(codigoFin);
    if (bitsAcumulados > 0) {
      bloque[enBloque++] = acumulador & 255;
      if (enBloque === 255) volcarBloque();
    }
    volcarBloque();
    escritor.byte(0);
  }

  // ---------- Armado del archivo ----------

  // cuadros: array de ImageData (o {data, width, height}) del mismo tamaño.
  // retardoMs: tiempo que se muestra cada cuadro. Devuelve Uint8Array con el GIF completo.
  function crearGif(opciones) {
    const cuadros = opciones.cuadros;
    const retardo = Math.max(2, Math.round((opciones.retardoMs || 500) / 10));
    const maxColores = Math.min(256, opciones.maxColores || 256);
    const muestreo = opciones.muestreo || 3;
    const ancho = cuadros[0].width, alto = cuadros[0].height;

    const { paleta, cantidad } = construirPaleta(cuadros, maxColores, muestreo);
    const buscador = crearBuscador(paleta, cantidad);

    const w = new Escritor();
    w.texto('GIF89a');
    w.corto(ancho); w.corto(alto);
    w.byte(0xF7); // tabla global de 256 colores, 8 bits por canal
    w.byte(0); w.byte(0);
    w.bytes(paleta);

    // Bucle infinito (extensión NETSCAPE2.0)
    w.byte(0x21); w.byte(0xFF); w.byte(0x0B);
    w.texto('NETSCAPE2.0');
    w.byte(0x03); w.byte(0x01); w.corto(0); w.byte(0);

    for (const cuadro of cuadros) {
      const indices = indexarCuadro(cuadro, paleta, buscador);
      w.byte(0x21); w.byte(0xF9); w.byte(0x04);
      w.byte(0x04); // sin transparencia, no descartar el cuadro anterior
      w.corto(retardo);
      w.byte(0); w.byte(0);
      w.byte(0x2C);
      w.corto(0); w.corto(0); w.corto(ancho); w.corto(alto);
      w.byte(0);
      w.byte(8);
      escribirLzw(w, indices, 8);
    }
    w.byte(0x3B);
    return w.resultado();
  }

  const api = { crearGif };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.CodificadorGif = api;
})(typeof window !== 'undefined' ? window : globalThis);

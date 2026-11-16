// Ajustes del EQUIPO (capa "Equipo" de docs/ARQUITECTURA_FLUJO.md §2.1): lo que pertenece a este
// computador o iPad y vale para todos los eventos. Hoy guarda solo el PIN de operador y su
// bloqueo por intentos fallidos; más adelante vivirán aquí impresoras, red, tema y licencia.
//
// El PIN es un candado de cortesía contra el invitado, no seguridad fuerte (ARQUITECTURA_FLUJO.md
// §5.6): se guarda con hash y sal (nunca en claro), y el conteo de intentos fallidos persiste
// para que recargar la página no reinicie el bloqueo. No existe PIN de fábrica: mientras el
// equipo no tenga uno, la cabina pide crearlo antes de lanzar el primer evento.
//
// Interfaz asíncrona desde ya (ARQUITECTURA_FLUJO.md §5.1, regla 7): cuando el equipo sea una
// app de escritorio, este archivo es el único punto a reemplazar.
(function (raiz) {
  'use strict';

  const CLAVE = 'fotocabina-equipo';
  const VERSION = 1;
  const MAX_INTENTOS = 5;
  const BLOQUEO_MS = 5 * 60 * 1000;
  const ITERACIONES = 100000;
  // Estos valores están escritos en el repositorio público: no se aceptan como PIN.
  const PINES_PROHIBIDOS = ['1234'];

  // ---------- Lectura y escritura del registro del equipo ----------

  function nuevoRegistro() {
    return {
      version: VERSION,
      id: `eq-${Math.random().toString(36).slice(2, 8)}`,
      pin: null,
      intentos: { fallidos: 0, bloqueadoHasta: null },
    };
  }

  function leer() {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) {
        const registro = JSON.parse(guardado);
        if (registro && typeof registro === 'object') {
          // Se agregan campos, no se renombran: un registro con campos faltantes se completa.
          const base = nuevoRegistro();
          return { ...base, ...registro, intentos: { ...base.intentos, ...(registro.intentos || {}) } };
        }
      }
    } catch (e) {
      // registro ilegible: se parte de cero
    }
    return nuevoRegistro();
  }

  function guardar(registro) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(registro));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- Hash del PIN ----------

  function aHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  function deHex(texto) {
    const bytes = new Uint8Array(texto.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(texto.substr(i * 2, 2), 16);
    return bytes;
  }

  // SHA-256 en JavaScript puro, solo como respaldo para navegadores sin crypto.subtle
  // (por ejemplo, una página abierta fuera de contexto seguro).
  const K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  function sha256(datos) {
    const largo = datos.length;
    const total = ((largo + 9 + 63) >> 6) << 6;
    const m = new Uint8Array(total);
    m.set(datos);
    m[largo] = 0x80;
    const vista = new DataView(m.buffer);
    vista.setUint32(total - 4, (largo * 8) >>> 0);
    vista.setUint32(total - 8, Math.floor((largo * 8) / 4294967296));
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Array(64);
    const rot = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = vista.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K256[i] + w[i]) | 0;
        const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    const salida = new Uint8Array(32);
    const vs = new DataView(salida.buffer);
    h.forEach((v, i) => vs.setUint32(i * 4, v >>> 0));
    return salida;
  }

  async function calcularHash(pin, sal, iteraciones, algoritmo) {
    const texto = new TextEncoder().encode(pin);
    if (algoritmo === 'pbkdf2-sha256' && raiz.crypto && raiz.crypto.subtle) {
      const llave = await raiz.crypto.subtle.importKey('raw', texto, 'PBKDF2', false, ['deriveBits']);
      const bits = await raiz.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones }, llave, 256);
      return aHex(new Uint8Array(bits));
    }
    // Respaldo: SHA-256 encadenado (menos robusto, pero nunca se guarda el PIN en claro).
    let estado = new Uint8Array([...sal, ...texto]);
    for (let i = 0; i < 2000; i++) estado = sha256(i === 0 ? estado : new Uint8Array([...estado, ...sal]));
    return aHex(estado);
  }

  async function crearRegistroPin(pin) {
    const sal = raiz.crypto.getRandomValues(new Uint8Array(16));
    const usaSubtle = !!(raiz.crypto.subtle);
    const algoritmo = usaSubtle ? 'pbkdf2-sha256' : 'sha256-encadenado';
    const hash = await calcularHash(pin, sal, ITERACIONES, algoritmo);
    return { algoritmo, iteraciones: ITERACIONES, sal: aHex(sal), hash, cambiadoEn: new Date().toISOString() };
  }

  // ---------- Estado de bloqueo ----------

  function estadoDeBloqueo(registro) {
    const hasta = registro.intentos.bloqueadoHasta;
    const restanteMs = hasta ? Math.max(0, hasta - Date.now()) : 0;
    return {
      bloqueado: restanteMs > 0,
      restanteMs,
      intentosRestantes: Math.max(0, MAX_INTENTOS - registro.intentos.fallidos),
    };
  }

  // Si el bloqueo ya venció, el conteo de fallos vuelve a cero (se guarda al consultar).
  function liberarSiVencio(registro) {
    const hasta = registro.intentos.bloqueadoHasta;
    if (hasta && hasta <= Date.now()) {
      registro.intentos = { fallidos: 0, bloqueadoHasta: null };
      guardar(registro);
    }
    return registro;
  }

  // ---------- Interfaz pública ----------

  function estadoPin() {
    const registro = liberarSiVencio(leer());
    return { definido: !!registro.pin, ...estadoDeBloqueo(registro) };
  }

  function pinValido(pin) {
    return typeof pin === 'string' && /^\d{4}$/.test(pin);
  }

  // Motivo por el que un PIN nuevo no se acepta, o null si sirve.
  function problemaConPin(pin) {
    if (!pinValido(pin)) return 'El PIN debe tener 4 dígitos.';
    if (PINES_PROHIBIDOS.includes(pin) || /^(\d)\1{3}$/.test(pin)) return 'Ese PIN es muy fácil de adivinar. Elige otro.';
    return null;
  }

  async function verificarPin(pin) {
    const registro = liberarSiVencio(leer());
    const antes = estadoDeBloqueo(registro);
    if (antes.bloqueado) return { ok: false, ...antes };
    if (!registro.pin || !pinValido(pin)) return { ok: false, ...antes, sinPin: !registro.pin };

    const calculado = await calcularHash(pin, deHex(registro.pin.sal), registro.pin.iteraciones, registro.pin.algoritmo);
    // Se relee: otra pestaña pudo haber registrado intentos mientras se calculaba el hash.
    const actual = leer();
    if (calculado === registro.pin.hash) {
      actual.intentos = { fallidos: 0, bloqueadoHasta: null };
      guardar(actual);
      return { ok: true, bloqueado: false, restanteMs: 0, intentosRestantes: MAX_INTENTOS };
    }
    actual.intentos.fallidos += 1;
    if (actual.intentos.fallidos >= MAX_INTENTOS) actual.intentos.bloqueadoHasta = Date.now() + BLOQUEO_MS;
    guardar(actual);
    return { ok: false, ...estadoDeBloqueo(actual) };
  }

  // Define o cambia el PIN. Quien llama debe haber verificado el PIN actual antes (si había uno).
  // Con { soloSiNoHay: true } (migración) no pisa un PIN que el operador creó mientras tanto.
  async function definirPin(pin, opciones = {}) {
    const problema = problemaConPin(pin);
    if (problema) return { ok: false, motivo: problema };
    const nuevoPin = await crearRegistroPin(pin);
    const registro = leer();
    if (opciones.soloSiNoHay && registro.pin) return { ok: false, motivo: 'Ya hay un PIN.' };
    registro.pin = nuevoPin;
    registro.intentos = { fallidos: 0, bloqueadoHasta: null };
    return guardar(registro) ? { ok: true } : { ok: false, motivo: 'No se pudo guardar el PIN en este equipo.' };
  }

  // Migración desde el formato antiguo (el PIN viajaba dentro de los ajustes de cada evento):
  // si el operador ya había elegido uno propio, se conserva; el de fábrica (1234) se descarta.
  async function migrarPinAntiguo(pinViejo) {
    if (leer().pin) return false;
    if (!pinValido(pinViejo) || problemaConPin(pinViejo)) return false;
    return (await definirPin(pinViejo, { soloSiNoHay: true })).ok;
  }

  raiz.AjustesEquipo = {
    MAX_INTENTOS,
    BLOQUEO_MS,
    estadoPin,
    problemaConPin,
    verificarPin,
    definirPin,
    migrarPinAntiguo,
  };
})(window);

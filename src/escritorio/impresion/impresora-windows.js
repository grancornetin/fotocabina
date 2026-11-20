/*
  Impresión silenciosa por el driver normal de Windows (sin diálogo). Habla con servidor.ps1, un PowerShell que queda
  abierto y atiende: listar impresoras, ver el estado de una e imprimir una imagen.

  El estado que llega es el que Windows conoce por el spooler: si el driver no cuenta "sin papel", nadie lo sabe hasta
  que se intenta imprimir (límite conocido). Cuando un trabajo falla, el trabajo se saca del spooler y el error vuelve
  con un código 'impresora-...' para que la cola persistente de la cabina lo reintente sin imprimir doble.

  Reglas para no imprimir doble (revisión de código 2026-11-19):
    · Las órdenes se mandan de a UNA y el tiempo límite cuenta desde que PowerShell la recibe (no desde que se encola).
    · Mientras se imprime, las consultas de estado no molestan: devuelven el último estado conocido.
    · Un tiempo agotado solo cierra el PowerShell con el que se mandó esa orden, nunca uno nuevo.
*/
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SERVIDOR = path.join(__dirname, 'servidor.ps1');
const ARRANQUE_MS = 20000;
const ESPERA_OPERADOR_SEG = 900; // debe coincidir con $EsperaOperadorSeg de servidor.ps1

class ImpresoraWindows {
  constructor() {
    this._proceso = null;
    this._pendientes = new Map();
    this._siguiente = 1;
    this._buffer = '';
    this._listo = null;
    this._cola = Promise.resolve();
    this._imprimiendo = 0;
    this._ultimoEstado = new Map();
    this._carpetaTemporal = path.join(os.tmpdir(), 'fotocabina-impresion');
  }

  _arrancar() {
    if (this._proceso && this._listo) return this._listo;
    const p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SERVIDOR], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    this._proceso = p;
    let alListo, alFallar;
    const listo = new Promise((resolver, rechazar) => { alListo = resolver; alFallar = rechazar; });
    this._listo = listo;
    p._alListo = alListo;
    const temporizador = setTimeout(() => { alFallar(Object.assign(new Error('El servidor de impresión no arrancó a tiempo.'), { codigo: 'servidor' })); this._cerrarProceso(p); }, ARRANQUE_MS);
    listo.then(() => clearTimeout(temporizador), () => clearTimeout(temporizador));
    let buffer = '';
    p.stdout.setEncoding('utf8');
    p.stdout.on('data', (d) => {
      buffer += d;
      let i;
      while ((i = buffer.indexOf('\n')) >= 0) {
        const linea = buffer.slice(0, i).trim();
        buffer = buffer.slice(i + 1);
        if (linea) this._linea(p, linea);
      }
    });
    p.stderr.on('data', () => { /* los errores de PowerShell llegan como respuesta con codigo 'servidor' */ });
    p.stdin.on('error', () => { /* escribir en un proceso que ya murió: lo maneja 'exit' */ });
    const caer = (motivo) => {
      alFallar(Object.assign(new Error(motivo), { codigo: 'servidor' }));
      this._cerrarProceso(p);
    };
    p.on('exit', () => caer('El servidor de impresión se cerró.'));
    p.on('error', (e) => caer('No se pudo abrir PowerShell: ' + e.message));
    return listo;
  }

  _linea(p, texto) {
    let m;
    try { m = JSON.parse(texto); } catch (e) { return; }
    if (m.evento === 'listo') { if (p._alListo) p._alListo(); return; }
    const q = this._pendientes.get(m.id);
    if (!q || q.proceso !== p) return;
    this._pendientes.delete(m.id);
    clearTimeout(q.t);
    q.resolver(m);
  }

  // Cierra EL proceso dado y rechaza lo que esperaba respuesta de él; si era el vigente, el próximo pedido abre uno nuevo.
  _cerrarProceso(p) {
    if (!p) return;
    if (this._proceso === p) { this._proceso = null; this._listo = null; }
    for (const [id, q] of this._pendientes) {
      if (q.proceso !== p) continue;
      this._pendientes.delete(id);
      clearTimeout(q.t);
      q.rechazar(Object.assign(new Error('El servidor de impresión se cerró.'), { codigo: 'servidor' }));
    }
    try { p.stdin.write('{"accion":"salir"}\n'); } catch (e) { /* ya cerrado */ }
    setTimeout(() => { try { p.kill(); } catch (e) { /* ya cerrado */ } }, 500);
  }

  // Una orden a la vez; el tiempo límite empieza cuando PowerShell la recibe.
  _pedir(orden, tiempoMs) {
    const turno = this._cola.then(() => this._pedirYa(orden, tiempoMs));
    this._cola = turno.catch(() => {});
    return turno;
  }

  async _pedirYa(orden, tiempoMs) {
    await this._arrancar();
    const p = this._proceso;
    return new Promise((resolver, rechazar) => {
      if (!p) { rechazar(Object.assign(new Error('El servidor de impresión no está activo.'), { codigo: 'servidor' })); return; }
      const id = this._siguiente++;
      const t = setTimeout(() => {
        const q = this._pendientes.get(id);
        if (!q) return;
        this._pendientes.delete(id);
        rechazar(Object.assign(new Error('Windows no respondió a tiempo.'), { codigo: 'servidor' }));
        this._cerrarProceso(p); // solo ESE proceso; el próximo pedido abre uno nuevo
      }, tiempoMs);
      this._pendientes.set(id, { resolver, rechazar, t, proceso: p });
      try { p.stdin.write(JSON.stringify({ id, ...orden }) + '\n', 'utf8'); }
      catch (e) { this._pendientes.delete(id); clearTimeout(t); rechazar(Object.assign(new Error('No se pudo hablar con el servidor de impresión.'), { codigo: 'servidor' })); }
    });
  }

  async listar() {
    const r = await this._pedir({ accion: 'listar' }, 60000);
    return (r.impresoras || []).map((i) => ({ ...i, medios: Array.isArray(i.medios) ? i.medios : [] }));
  }

  async estado(nombre) {
    // Imprimiendo, PowerShell está ocupado esperando al spooler: no se le pregunta (se devuelve lo último que se supo).
    if (this._imprimiendo > 0) {
      const previo = this._ultimoEstado.get(nombre);
      return previo ? { ...previo, desdeCache: true } : { ok: true, existe: true, estado: 'imprimiendo', detalle: '', trabajosEnCola: 0, trabajosConError: 0, desdeCache: true };
    }
    const r = await this._pedir({ accion: 'estado', impresora: nombre }, 30000);
    this._ultimoEstado.set(nombre, r);
    return r;
  }

  // datos: { nombre, hojas, anchoMm, altoMm, imagen: Buffer, trabajoId }. Resuelve { ok, estado, codigo, detalle, papel }.
  async imprimir(datos) {
    fs.mkdirSync(this._carpetaTemporal, { recursive: true });
    const archivo = path.join(this._carpetaTemporal, `hoja-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.img`);
    fs.writeFileSync(archivo, datos.imagen);
    const hojas = Math.min(99, Math.max(1, Math.round(datos.hojas || 1)));
    this._imprimiendo += 1;
    try {
      return await this._pedir({
        accion: 'imprimir',
        impresora: datos.nombre,
        archivo,
        copias: hojas,
        anchoMm: datos.anchoMm,
        altoMm: datos.altoMm,
        partir: !!datos.partir, // la hoja lleva dos tiras: si el driver tiene papel "Split" (HiTi), la impresora corta al medio
        ajusteXMm: Number(datos.ajusteXMm) || 0, // calibración por impresora (config.js): corrimiento fino de la imagen en mm
        ajusteYMm: Number(datos.ajusteYMm) || 0,
        // Sufijo único por intento: un trabajo viejo pegado en el spooler nunca se confunde con el de este intento.
        documento: 'FotoCabina-' + String(datos.trabajoId || Date.now()).replace(/[^\w-]/g, '') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        salidaArchivo: datos.salidaArchivo || null, // solo pruebas: guarda el trabajo en un archivo en vez de imprimir
        esperaSeg: Math.min(900, 60 + hojas * 60),
      }, (60 + hojas * 60 + 30 + ESPERA_OPERADOR_SEG + 30) * 1000); // incluye el tiempo que el operador tiene para decidir en el aviso del driver (servidor.ps1)
    } finally {
      this._imprimiendo -= 1;
      try { fs.unlinkSync(archivo); } catch (e) { /* ya no estaba */ }
    }
  }

  cerrar() { this._cerrarProceso(this._proceso); }
}

module.exports = { ImpresoraWindows };

/*
  Cliente de la cámara Canon, del lado del programa. Lanza el puente (puente-camara.js) como proceso aparte y le habla
  por mensajes. Si el puente se cae o se cuelga, lo mata y avisa "desconectada"; reconectar lo vuelve a lanzar.

  Eventos: 'cuadro' (Buffer JPEG de la vista previa), 'estado' ({ estado, detalle }), 'aviso' ({ codigo, detalle }).
  Estados: desconectada · conectando · conectada · durmiendo (la cámara se apagó/durmió) · sin-sdk (faltan las DLL de Canon).
*/
'use strict';

const { fork } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');

const PUENTE = path.join(__dirname, 'puente-camara.js');
const TIEMPOS = { conectar: 25000, disparar: 30000, desconectar: 8000, estado: 3000 };

class CamaraCanon extends EventEmitter {
  constructor(opciones) {
    super();
    this._carpetaDll = opciones && opciones.carpetaDll;
    this._hijo = null;
    this._pendientes = new Map();
    this._siguiente = 1;
    this.estado = this._carpetaDll ? 'desconectada' : 'sin-sdk';
    this.detalle = this._carpetaDll ? '' : 'No se encontró el SDK de Canon (EDSDK.dll) en este equipo.';
    this.nombre = '';
  }

  _poner(estado, detalle) {
    if (this.estado === estado && (detalle || '') === this.detalle) return;
    this.estado = estado; this.detalle = detalle || '';
    this.emit('estado', { estado, detalle: this.detalle, nombre: this.nombre });
  }

  _lanzar() {
    if (this._hijo) return;
    const hijo = fork(PUENTE, [], {
      execPath: process.execPath,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      serialization: 'advanced',
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'], // la salida normal no se usa (si nadie la lee, se llena y bloquea)
    });
    this._hijo = hijo;
    hijo.stderr && hijo.stderr.on('data', (d) => this.emit('aviso', { codigo: 'puente-stderr', detalle: String(d).slice(0, 400) }));
    hijo.on('message', (m) => this._mensaje(m));
    hijo.on('exit', (codigo) => {
      if (this._hijo !== hijo) return;
      this._hijo = null;
      this._rechazarTodo(Object.assign(new Error('El proceso de la cámara se cerró (código ' + codigo + ').'), { codigo: 'camara-perdida' }));
      if (this.estado !== 'desconectada' && this.estado !== 'sin-sdk') this._poner('desconectada', 'Se perdió la conexión con la cámara. Revisa el cable y reconecta.');
    });
    hijo.on('error', (e) => this.emit('aviso', { codigo: 'puente-error', detalle: String(e.message) }));
  }

  _mensaje(m) {
    if (!m) return;
    if (m.evento === 'cuadro') { this.emit('cuadro', Buffer.from(m.jpeg)); return; }
    if (m.evento === 'estado') { if (m.estado === 'conectada' || m.estado === 'conectando') { /* lo fija conectar() con el nombre */ } this._poner(m.estado, m.detalle); return; }
    if (m.evento === 'aviso') { this.emit('aviso', { codigo: m.codigo, detalle: m.detalle }); return; }
    if (m.id && this._pendientes.has(m.id)) {
      const p = this._pendientes.get(m.id);
      this._pendientes.delete(m.id);
      clearTimeout(p.temporizador);
      if (m.ok) p.resolver(m);
      else p.rechazar(Object.assign(new Error(m.mensaje || 'Error de la cámara'), { codigo: m.codigo, codigoSdk: m.codigoSdk }));
    }
  }

  _rechazarTodo(error) {
    for (const p of this._pendientes.values()) { clearTimeout(p.temporizador); p.rechazar(error); }
    this._pendientes.clear();
  }

  _pedir(cmd, datos) {
    return new Promise((resolver, rechazar) => {
      if (!this._hijo) { rechazar(Object.assign(new Error('El puente de la cámara no está activo.'), { codigo: 'camara-perdida' })); return; }
      const id = this._siguiente++;
      const temporizador = setTimeout(() => {
        this._pendientes.delete(id);
        rechazar(Object.assign(new Error('La cámara no respondió a tiempo.'), { codigo: 'camara-sin-respuesta' }));
        this._matar('La cámara dejó de responder.');
      }, TIEMPOS[cmd] || 20000);
      this._pendientes.set(id, { resolver, rechazar, temporizador });
      try { this._hijo.send({ id, cmd, ...(datos || {}) }); }
      catch (e) { clearTimeout(temporizador); this._pendientes.delete(id); rechazar(Object.assign(new Error('No se pudo hablar con el puente de la cámara.'), { codigo: 'camara-perdida' })); }
    });
  }

  _matar(detalle) {
    const h = this._hijo;
    this._hijo = null;
    if (h) { try { h.kill(); } catch (e) { /* ya estaba muerto */ } }
    this._rechazarTodo(Object.assign(new Error(detalle || 'Puente cerrado.'), { codigo: 'camara-perdida' }));
    this._poner('desconectada', detalle || '');
  }

  // conectar y desconectar nunca se pisan: van en fila (al navegar, la pantalla vieja suelta la cámara mientras la nueva la pide).
  _serie(fn) {
    const turno = (this._turno || Promise.resolve()).then(fn, fn);
    this._turno = turno.catch(() => {});
    return turno;
  }

  conectar() { return this._serie(() => this._conectar()); }
  desconectar() { return this._serie(() => this._desconectar()); }

  async _conectar() {
    if (!this._carpetaDll) throw Object.assign(new Error(this.detalle), { codigo: 'sin-sdk' });
    if (this.estado === 'conectada' && this._hijo) return { nombre: this.nombre };
    if (this._hijo) this._matar('Se reinicia la conexión con la cámara.');
    this._lanzar();
    this._poner('conectando', '');
    try {
      const r = await this._pedir('conectar', { carpetaDll: this._carpetaDll });
      this.nombre = r.nombre || 'Canon EOS';
      this._poner('conectada', '');
      this.emit('estado', { estado: 'conectada', detalle: '', nombre: this.nombre });
      return { nombre: this.nombre };
    } catch (e) {
      this._matar(e.message);
      throw e;
    }
  }

  async disparar() {
    const r = await this._pedir('disparar');
    return { jpeg: Buffer.from(r.jpeg), ms: r.ms };
  }

  async _desconectar() {
    if (!this._hijo) { this._poner(this._carpetaDll ? 'desconectada' : 'sin-sdk', ''); return; }
    try { await this._pedir('desconectar'); } catch (e) { /* se mata igual */ }
    this._matar('');
    this._poner('desconectada', '');
  }

  instantanea() { return { estado: this.estado, detalle: this.detalle, nombre: this.nombre, hayHijo: !!this._hijo }; }
}

module.exports = { CamaraCanon };

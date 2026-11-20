/*
  Configuración del programa de escritorio.

  La ruta del SDK de Canon (EDSDK) NO está en el repositorio: la licencia de Canon no permite repartir sus archivos y el
  repositorio es público. Se busca, en este orden:
    1. la variable de entorno FOTOCABINA_EDSDK
    2. "rutaEdsdk" en configuracion.local.json (junto a este archivo; está en .gitignore)
    3. "rutaEdsdk" en la carpeta de datos del programa (configuracion.json)
    4. una carpeta "edsdk" junto al programa (también en .gitignore)
    5. C:\SDK-Canon\v13.21.10 (donde el dueño dejó el SDK en este equipo)
  La ruta puede apuntar a la carpeta de las DLL (EDSDK_64\Dll), a EDSDK_64, o a la carpeta raíz del SDK.
*/
'use strict';

const fs = require('fs');
const path = require('path');

const SUBRUTAS = ['', 'Dll', path.join('EDSDK_64', 'Dll'), path.join('EDSDK', 'Dll'), 'EDSDK_64'];
const RUTA_POR_DEFECTO = 'C:\\SDK-Canon\\v13.21.10';

function leerJson(ruta) {
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch (e) { return null; }
}

function carpetaConDll(base) {
  if (!base) return null;
  for (const sub of SUBRUTAS) {
    const c = path.join(base, sub);
    if (fs.existsSync(path.join(c, 'EDSDK.dll'))) return c;
  }
  return null;
}

// Devuelve { carpeta, origen } o { carpeta: null, intentadas: [...] }.
function buscarEdsdk(carpetaDatos) {
  const candidatos = [];
  const entorno = process['env'];
  if (entorno.FOTOCABINA_EDSDK) candidatos.push({ base: entorno.FOTOCABINA_EDSDK, origen: 'variable FOTOCABINA_EDSDK' });
  const local = leerJson(path.join(__dirname, 'configuracion.local.json'));
  if (local && local.rutaEdsdk) candidatos.push({ base: local.rutaEdsdk, origen: 'configuracion.local.json' });
  if (carpetaDatos) {
    const datos = leerJson(path.join(carpetaDatos, 'configuracion.json'));
    if (datos && datos.rutaEdsdk) candidatos.push({ base: datos.rutaEdsdk, origen: 'configuracion.json de los datos del programa' });
  }
  candidatos.push({ base: path.join(__dirname, 'edsdk'), origen: 'carpeta edsdk junto al programa' });
  candidatos.push({ base: RUTA_POR_DEFECTO, origen: 'ruta de este equipo' });
  for (const c of candidatos) {
    const carpeta = carpetaConDll(c.base);
    if (carpeta) return { carpeta, origen: c.origen };
  }
  return { carpeta: null, intentadas: candidatos.map((c) => c.base) };
}

// Calibración de impresión por impresora: cuántos mm hay que correr la imagen (+X a la derecha, +Y hacia abajo) para que el
// recorte quede parejo. Medida con una hoja de calibración real. Se puede cambiar sin tocar el código poniendo
// "ajusteImpresoras": { "<nombre de la impresora en Windows>": { "xMm": 0, "yMm": 0 } } en configuracion.json de los datos del programa.
// Valores de fábrica por impresora y tipo de papel ('normal' = hoja 4x6 entera; 'corte' = papel "Split": la impresora corta la
// hoja en dos tiras). Son un punto de partida: el operador los afina con "Alinear el corte" en Ajustes de la cabina, y esa
// corrección (guardada por impresora y tipo de papel) manda sobre estos valores.
const AJUSTE_POR_DEFECTO = {
  // 2026-11-20: sin ajuste la imagen salía 2,6 mm corrida a la izquierda (el driver informa márgenes 0). Para el papel Split
  // se midió entre 0,8 mm (queda 1 mm corrida a la izquierda) y 2,6 mm (2 mm a la derecha): ~1,5 mm.
  'HiTi P510L': { normal: { xMm: 2.6, yMm: 0 }, corte: { xMm: 1.5, yMm: 0 } },
};

function ajusteDeImpresora(nombre, carpetaDatos, modo) {
  const tipo = modo === 'corte' ? 'corte' : 'normal';
  const propio = carpetaDatos && leerJson(path.join(carpetaDatos, 'configuracion.json'));
  const tabla = (propio && propio.ajusteImpresoras) || {};
  const a = (tabla[nombre] && (tabla[nombre][tipo] || (tabla[nombre].xMm !== undefined ? tabla[nombre] : null)))
    || (AJUSTE_POR_DEFECTO[nombre] && AJUSTE_POR_DEFECTO[nombre][tipo]) || {};
  return { xMm: Number(a.xMm) || 0, yMm: Number(a.yMm) || 0 };
}

module.exports = { buscarEdsdk, carpetaConDll, ajusteDeImpresora };

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

module.exports = { buscarEdsdk, carpetaConDll };

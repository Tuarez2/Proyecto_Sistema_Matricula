import { existsSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import process from 'node:process';

const VERSION_MINIMA = '25.0.0';
const VERSION_MAXIMA_INCLUSIVA = '25.99.99';
const RANGO_REQUERIDO = '>=25.0.0 <=25.99.99';

function obtenerVersionNode() {
  return process.version;
}

function normalizarVersion(version) {
  return version.replace(/^v/, '').split('.').map((parte) => Number.parseInt(parte, 10));
}

function compararVersiones(versionActual, versionReferencia) {
  const actual = normalizarVersion(versionActual);
  const referencia = normalizarVersion(versionReferencia);

  for (let indice = 0; indice < 3; indice += 1) {
    const valorActual = actual[indice] ?? 0;
    const valorReferencia = referencia[indice] ?? 0;

    if (valorActual > valorReferencia) {
      return 1;
    }

    if (valorActual < valorReferencia) {
      return -1;
    }
  }

  return 0;
}

function mostrarError(mensaje, detalles = []) {
  console.error(mensaje);

  for (const detalle of detalles) {
    console.error(detalle);
  }

  process.exit(1);
}

function verificarVersionNode() {
  const versionDetectada = obtenerVersionNode();
  const normalizada = normalizarVersion(versionDetectada);
  const [mayor, minor, patch] = normalizada;

  const cumpleMinima = compararVersiones(versionDetectada, VERSION_MINIMA) >= 0;
  const cumpleMaxima = compararVersiones(versionDetectada, VERSION_MAXIMA_INCLUSIVA) <= 0;

  if (cumpleMinima && cumpleMaxima) {
    return;
  }

  mostrarError('Version de Node no compatible.', [
    `Detectada: ${versionDetectada}`,
    `Requerida: ${RANGO_REQUERIDO}`,
  ]);
}

function verificarArchivo(rutaRelativa) {
  const ruta = join(process.cwd(), rutaRelativa);

  if (!existsSync(ruta) || !statSync(ruta).isFile()) {
    mostrarError('Archivo requerido no encontrado.', [`Falta: ${rutaRelativa}`]);
  }
}

function verificarAusencia(rutaRelativa) {
  const ruta = join(process.cwd(), rutaRelativa);

  if (existsSync(ruta)) {
    mostrarError('Repositorio Git anidado no permitido.', [`Existe: ${rutaRelativa}`]);
  }
}

function verificarDirectorio(rutaRelativa) {
  const ruta = join(process.cwd(), rutaRelativa);

  if (!existsSync(ruta) || !statSync(ruta).isDirectory()) {
    mostrarError('Directorio requerido no encontrado.', [`Falta: ${rutaRelativa}`]);
  }
}

function verificarRepositorio() {
  verificarDirectorio('.git');
  verificarArchivo('backend/package.json');
  verificarArchivo('frontend/package.json');
  verificarAusencia('backend/.git');
  verificarAusencia('frontend/.git');

  if (!['Proyecto_Desarrollo_Web', 'Proyecto_Sistema_Matricula'].includes(basename(process.cwd()))) {
    mostrarError('Directorio de monorepositorio no reconocido.', [
      `Actual: ${process.cwd()}`,
      'Ejecuta este comando desde la raiz del monorepositorio.',
    ]);
  }
}

verificarVersionNode();
verificarRepositorio();

console.log('Entorno verificado correctamente.');
console.log(`Node: ${obtenerVersionNode()}`);
console.log(`Requerida: ${RANGO_REQUERIDO}`);

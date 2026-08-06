import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const raizScript = dirname(fileURLToPath(import.meta.url));
const archivo = resolve(raizScript, '..', 'src', 'app', 'core', 'config', 'configuracion-api.ts');
const MARCADOR = '__URL_API_DESPLIEGUE__';

if (!existsSync(archivo)) {
  console.error(`[configurar-api] No se encontró: ${archivo}`);
  process.exit(1);
}

const apiUrl = (process.env.NG_APP_API_URL || '').trim();
const contenido = readFileSync(archivo, 'utf8');

if (apiUrl) {
  if (!contenido.includes(MARCADOR)) {
    console.error(`[configurar-api] No se encontró el marcador ${MARCADOR}`);
    process.exit(1);
  }
  writeFileSync(archivo, contenido.replaceAll(MARCADOR, apiUrl), 'utf8');
  console.log(`[configurar-api] URL del API configurada en producción: ${apiUrl}`);
} else {
  console.log('[configurar-api] Sin NG_APP_API_URL; se usa la URL local por defecto.');
}
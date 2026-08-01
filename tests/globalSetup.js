import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mysql from 'mysql2/promise';

import { configurarEntornoPruebas, obtenerNombreBaseDatosPruebas } from './helpers/entorno.js';

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliSequelize = path.join(raizBackend, 'node_modules', 'sequelize-cli', 'lib', 'sequelize');
const escaparIdentificador = (valor) => `\`${String(valor).replaceAll('`', '``')}\``;

const ejecutarSequelizeCli = (argumentos) => {
  execFileSync(process.execPath, [cliSequelize, ...argumentos], {
    cwd: raizBackend,
    env: {
      ...process.env,
      NODE_ENV: 'test'
    },
    stdio: 'inherit'
  });
};

export default async () => {
  configurarEntornoPruebas();

  const baseDatosPruebas = obtenerNombreBaseDatosPruebas();
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: false
  });

  await conexion.query(`CREATE DATABASE IF NOT EXISTS ${escaparIdentificador(baseDatosPruebas)}`);
  await conexion.end();

  ejecutarSequelizeCli([
    'db:migrate',
    '--env',
    'test',
    '--config',
    'src/config/sequelize-cli.cjs',
    '--migrations-path',
    'migrations'
  ]);
  ejecutarSequelizeCli([
    'db:seed:all',
    '--env',
    'test',
    '--config',
    'src/config/sequelize-cli.cjs',
    '--seeders-path',
    'seeders'
  ]);
};

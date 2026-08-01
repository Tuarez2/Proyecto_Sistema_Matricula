import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Sesion } from '../../src/models/index.js';

const clavesEntornoSeguridad = [
  'CORS_ORIGINS',
  'CORS_CREDENTIALS',
  'TRUST_PROXY',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'AUTH_RATE_LIMIT_WINDOW_MS',
  'AUTH_RATE_LIMIT_MAX'
];

let respaldoEntorno;

const cargarAppAislada = async (variables = {}) => {
  Object.entries(variables).forEach(([clave, valor]) => {
    process.env[clave] = valor;
  });

  vi.resetModules();
  const modulo = await import('../../src/app.js');

  return modulo.default;
};

describe('Seguridad HTTP', () => {
  beforeEach(() => {
    respaldoEntorno = Object.fromEntries(clavesEntornoSeguridad.map((clave) => [clave, process.env[clave]]));
  });

  afterEach(() => {
    clavesEntornoSeguridad.forEach((clave) => {
      if (respaldoEntorno[clave] === undefined) {
        delete process.env[clave];
      } else {
        process.env[clave] = respaldoEntorno[clave];
      }
    });

    vi.resetModules();
  });

  afterAll(async () => {
    await Sesion.destroy({ where: {} });
  });

  it('permite peticiones sin Origin y responde CORS para origen permitido', async () => {
    const app = await cargarAppAislada({
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173',
      CORS_CREDENTIALS: 'false',
      RATE_LIMIT_MAX: '10000',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const sinOrigen = await request(app).get('/health');
    const permitido = await request(app).get('/health').set('Origin', 'http://localhost:5173');

    expect(sinOrigen.status).toBe(200);
    expect(permitido.status).toBe(200);
    expect(permitido.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('rechaza origen no permitido con respuesta controlada', async () => {
    const app = await cargarAppAislada({
      CORS_ORIGINS: 'http://localhost:3000',
      RATE_LIMIT_MAX: '10000',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const respuesta = await request(app).get('/health').set('Origin', 'https://malicioso.example');

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toMatchObject({
      success: false,
      code: 'CORS_ORIGIN_NOT_ALLOWED'
    });
    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde preflight para origen permitido con Authorization habilitado', async () => {
    const app = await cargarAppAislada({
      CORS_ORIGINS: 'http://localhost:3000',
      RATE_LIMIT_MAX: '10000',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const respuesta = await request(app)
      .options('/api/v1/facultades')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization,Content-Type');

    expect([200, 204]).toContain(respuesta.status);
    expect(respuesta.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(respuesta.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('no devuelve comodin cuando las credenciales CORS estan activas', async () => {
    const app = await cargarAppAislada({
      CORS_ORIGINS: 'http://localhost:3000',
      CORS_CREDENTIALS: 'true',
      RATE_LIMIT_MAX: '10000',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const respuesta = await request(app).get('/health').set('Origin', 'http://localhost:3000');

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(respuesta.headers['access-control-allow-origin']).not.toBe('*');
    expect(respuesta.headers['access-control-allow-credentials']).toBe('true');
  });

  it('/health no queda sujeto al limitador general', async () => {
    const app = await cargarAppAislada({
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '1',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const respuestas = await Promise.all([request(app).get('/health'), request(app).get('/health'), request(app).get('/health')]);

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([200, 200, 200]);
  });

  it('limita login con 429 y formato JSON seguro', async () => {
    const app = await cargarAppAislada({
      RATE_LIMIT_MAX: '10000',
      AUTH_RATE_LIMIT_WINDOW_MS: '60000',
      AUTH_RATE_LIMIT_MAX: '2'
    });
    const cuerpo = {
      correo: 'limite.login@codex.test',
      password: 'PasswordIncorrecta123!'
    };

    const primera = await request(app).post('/api/v1/auth/login').send(cuerpo);
    await request(app).post('/api/v1/auth/login').send(cuerpo);
    const limitada = await request(app).post('/api/v1/auth/login').send(cuerpo);

    expect(primera.status).toBe(401);
    expect(limitada.status).toBe(429);
    expect(limitada.body).toMatchObject({
      success: false,
      code: 'TOO_MANY_REQUESTS'
    });
    expect(limitada.headers['retry-after']).toBeTruthy();
  });

  it('aplica limite general a rutas API sin afectar /health', async () => {
    const app = await cargarAppAislada({
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '2',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const primera = await request(app).get('/api/v1/facultades');
    await request(app).get('/api/v1/facultades');
    const limitada = await request(app).get('/api/v1/facultades');
    const health = await request(app).get('/health');

    expect(primera.status).toBe(401);
    expect(limitada.status).toBe(429);
    expect(limitada.body.code).toBe('TOO_MANY_REQUESTS');
    expect(health.status).toBe(200);
  });

  it('separa contadores por IP cuando trust proxy esta configurado', async () => {
    const app = await cargarAppAislada({
      TRUST_PROXY: '1',
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '1',
      AUTH_RATE_LIMIT_MAX: '10000'
    });

    const primeraIp = await request(app).get('/api/v1/facultades').set('X-Forwarded-For', '203.0.113.10');
    const primeraIpLimitada = await request(app).get('/api/v1/facultades').set('X-Forwarded-For', '203.0.113.10');
    const segundaIp = await request(app).get('/api/v1/facultades').set('X-Forwarded-For', '203.0.113.11');

    expect(primeraIp.status).toBe(401);
    expect(primeraIpLimitada.status).toBe(429);
    expect(segundaIp.status).toBe(401);
  });
});

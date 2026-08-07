import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app.js';

describe('Health check', () => {
  it('responde estado operativo', async () => {
    const respuesta = await request(app).get('/health');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      success: true,
      status: 'ok'
    });
  });
});

import { TestBed } from '@angular/core/testing';

import type { DatosAutenticacion } from '../models/autenticacion.model';
import { AlmacenamientoSesionService } from './almacenamiento-sesion.service';

const CLAVE_SESION_PRUEBA = 'sistema_matricula_sesion';

function crearDatosSesion(): DatosAutenticacion {
  return {
    user: {
      id: 1,
      nombres: 'Persona',
      apellidos: 'Prueba',
      correo: 'persona.prueba@universidad.edu',
      estado: 'ACTIVO',
      debe_cambiar_password: false,
      rol: {
        id: 2,
        codigo: 'DOCENTE',
        nombre: 'Docente',
      },
    },
    tokens: {
      accessToken: 'token-acceso-ficticio',
      refreshToken: 'token-renovacion-ficticio',
      accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
      refreshTokenExpiresAt: '2026-08-03T11:00:00.000Z',
    },
  };
}

describe('AlmacenamientoSesionService', () => {
  let servicio: AlmacenamientoSesionService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({});
    servicio = TestBed.inject(AlmacenamientoSesionService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('crea el servicio', () => {
    expect(servicio).toBeTruthy();
  });

  it('guarda una sesion completa', () => {
    const datosSesion = crearDatosSesion();

    servicio.guardarSesion(datosSesion);

    expect(sessionStorage.getItem(CLAVE_SESION_PRUEBA)).toBeTruthy();
  });

  it('recupera una sesion guardada', () => {
    const datosSesion = crearDatosSesion();

    servicio.guardarSesion(datosSesion);

    expect(servicio.obtenerSesion()).toEqual(datosSesion);
  });

  it('obtiene el access token', () => {
    const datosSesion = crearDatosSesion();

    servicio.guardarSesion(datosSesion);

    expect(servicio.obtenerTokenAcceso()).toBe(datosSesion.tokens.accessToken);
  });

  it('obtiene el refresh token', () => {
    const datosSesion = crearDatosSesion();

    servicio.guardarSesion(datosSesion);

    expect(servicio.obtenerTokenRenovacion()).toBe(datosSesion.tokens.refreshToken);
  });

  it('elimina la sesion', () => {
    servicio.guardarSesion(crearDatosSesion());

    servicio.eliminarSesion();

    expect(servicio.obtenerSesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION_PRUEBA)).toBeNull();
  });

  it('devuelve null cuando no hay sesion', () => {
    expect(servicio.obtenerSesion()).toBeNull();
    expect(servicio.obtenerTokenAcceso()).toBeNull();
    expect(servicio.obtenerTokenRenovacion()).toBeNull();
  });

  it('elimina y devuelve null ante JSON corrupto', () => {
    sessionStorage.setItem(CLAVE_SESION_PRUEBA, 'contenido-no-json');

    expect(servicio.obtenerSesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION_PRUEBA)).toBeNull();
  });

  it('elimina y devuelve null ante una estructura invalida', () => {
    sessionStorage.setItem(
      CLAVE_SESION_PRUEBA,
      JSON.stringify({ user: {}, tokens: {} }),
    );

    expect(servicio.obtenerSesion()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION_PRUEBA)).toBeNull();
  });

  it('no almacena credenciales ni password', () => {
    servicio.guardarSesion(crearDatosSesion());

    const valorGuardado = sessionStorage.getItem(CLAVE_SESION_PRUEBA);

    expect(valorGuardado).not.toContain('"password"');
    expect(valorGuardado).not.toContain('clave-ficticia');
  });
});

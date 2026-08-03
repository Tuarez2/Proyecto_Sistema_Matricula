import { TestBed } from '@angular/core/testing';

import type { ErrorHttpGlobal } from '../models/error-http-global.model';
import { ManejadorErroresHttpService } from './manejador-errores-http.service';

function crearErrorGlobal(mensaje = 'Error de prueba.'): ErrorHttpGlobal {
  return {
    tipo: 'SESION_NO_AUTORIZADA',
    estadoHttp: 401,
    mensaje,
    codigo: 'INVALID_TOKEN',
    detalles: null,
    reintentarDespuesSegundos: null,
    marcaTiempo: Date.now(),
  };
}

describe('ManejadorErroresHttpService', () => {
  let servicio: ManejadorErroresHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(ManejadorErroresHttpService);
  });

  it('crea el servicio', () => {
    expect(servicio).toBeTruthy();
  });

  it('inicia con ultimoError en null', () => {
    expect(servicio.ultimoError()).toBeNull();
  });

  it('registrarError almacena el error', () => {
    const errorGlobal = crearErrorGlobal();

    servicio.registrarError(errorGlobal);

    expect(servicio.ultimoError()).toEqual(errorGlobal);
  });

  it('un nuevo error reemplaza al anterior', () => {
    const errorAnterior = crearErrorGlobal('Error anterior.');
    const errorNuevo = crearErrorGlobal('Error nuevo.');

    servicio.registrarError(errorAnterior);
    servicio.registrarError(errorNuevo);

    expect(servicio.ultimoError()).toEqual(errorNuevo);
  });

  it('limpiarError devuelve el estado a null', () => {
    servicio.registrarError(crearErrorGlobal());

    servicio.limpiarError();

    expect(servicio.ultimoError()).toBeNull();
  });

  it('el estado expuesto no puede modificarse directamente', () => {
    expect('set' in servicio.ultimoError).toBe(false);
    expect('update' in servicio.ultimoError).toBe(false);
  });
});

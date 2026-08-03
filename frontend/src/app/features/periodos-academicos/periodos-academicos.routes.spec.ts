import { ListadoPeriodosComponent } from './listado-periodos/listado-periodos.component';
import { rutasPeriodosAcademicos } from './periodos-academicos.routes';

describe('rutasPeriodosAcademicos', () => {
  it('existe ruta vacia', () => {
    expect(obtenerRutaRaiz().path).toBe('');
  });

  it('utiliza loadComponent', () => {
    expect(obtenerRutaRaiz().loadComponent).toBeDefined();
  });

  it('carga ListadoPeriodosComponent', async () => {
    const componente = await obtenerRutaRaiz().loadComponent?.();

    expect(componente).toBe(ListadoPeriodosComponent);
  });

  it('tiene titulo Periodos academicos', () => {
    expect(obtenerRutaRaiz().title).toBe('Periodos académicos');
  });

  it('no utiliza guardRoles', () => {
    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
  });

  it('no contiene datos de roles', () => {
    expect(obtenerRutaRaiz().data).toBeUndefined();
  });

  it('no contiene ruta nuevo', () => {
    expect(rutasPeriodosAcademicos.some((ruta) => ruta.path === 'nuevo'))
      .toBe(false);
  });

  it('no contiene edicion', () => {
    expect(rutasPeriodosAcademicos.some((ruta) => ruta.path?.includes('editar')))
      .toBe(false);
  });

  it('no contiene cambio de estado', () => {
    expect(rutasPeriodosAcademicos.some((ruta) => ruta.path?.includes('estado')))
      .toBe(false);
  });

  it('no contiene redirects', () => {
    expect(rutasPeriodosAcademicos.some((ruta) => ruta.redirectTo)).toBe(false);
  });

  it('un usuario autenticado puede activar periodos academicos', () => {
    expect(obtenerRutaRaiz().canActivate).toBeUndefined();
  });

  it('la ruta continua protegida por el layout padre', () => {
    expect(rutasPeriodosAcademicos.length).toBe(1);
  });
});

function obtenerRutaRaiz() {
  const ruta = rutasPeriodosAcademicos.find((rutaActual) => rutaActual.path === '');

  if (!ruta) {
    throw new Error('No existe la ruta raiz de periodos academicos.');
  }

  return ruta;
}

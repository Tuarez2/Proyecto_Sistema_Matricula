import { CLAVE_ROLES_PERMITIDOS, CODIGOS_ROL } from '../../core/config/codigos-rol';
import { guardRoles } from '../../core/guards/roles.guard';
import { ListadoUsuariosComponent } from './listado-usuarios/listado-usuarios.component';
import { rutasUsuarios } from './usuarios.routes';

describe('rutasUsuarios', () => {
  it('existe una ruta raiz', () => {
    expect(obtenerRutaRaiz().path).toBe('');
  });

  it('utiliza loadComponent', () => {
    expect(obtenerRutaRaiz().loadComponent).toBeDefined();
  });

  it('carga ListadoUsuariosComponent', async () => {
    const componente = await obtenerRutaRaiz().loadComponent?.();

    expect(componente).toBe(ListadoUsuariosComponent);
  });

  it('tiene titulo Usuarios', () => {
    expect(obtenerRutaRaiz().title).toBe('Usuarios');
  });

  it('utiliza guardRoles', () => {
    expect(obtenerRutaRaiz().canActivate).toEqual([guardRoles]);
  });

  it('permite unicamente ADMIN', () => {
    expect(obtenerRutaRaiz().data?.[CLAVE_ROLES_PERMITIDOS]).toEqual([
      CODIGOS_ROL.ADMIN,
    ]);
  });

  it('usa CLAVE_ROLES_PERMITIDOS', () => {
    expect(Object.keys(obtenerRutaRaiz().data ?? {})).toContain(
      CLAVE_ROLES_PERMITIDOS,
    );
  });

  it('no contiene rutas de creacion', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('crear'))).toBe(false);
  });

  it('no contiene rutas de edicion', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('editar'))).toBe(false);
  });

  it('no contiene rutas de contrasena', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('password'))).toBe(false);
  });

  it('no contiene rutas de estado', () => {
    expect(rutasUsuarios.some((ruta) => ruta.path?.includes('estado'))).toBe(false);
  });

  it('no contiene redirects', () => {
    expect(rutasUsuarios.some((ruta) => ruta.redirectTo)).toBe(false);
  });
});

function obtenerRutaRaiz() {
  const ruta = rutasUsuarios.find((rutaActual) => rutaActual.path === '');

  if (!ruta) {
    throw new Error('No existe la ruta raiz de usuarios.');
  }

  return ruta;
}

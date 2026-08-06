import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { guardAutenticacion } from './core/guards/autenticacion.guard';
import { guardRoles } from './core/guards/roles.guard';
import { guardRutaInicial } from './core/guards/ruta-inicial.guard';
import type {
  CredencialesInicioSesion,
  RespuestaInicioSesion,
  UsuarioAutenticado,
} from './core/models/autenticacion.model';
import { AutenticacionService } from './core/services/autenticacion.service';
import { MatriculasService } from './features/matriculas/services/matriculas.service';
import { routes } from './app.routes';

interface AutenticacionServiceMock {
  estaAutenticado: Signal<boolean>;
  usuarioActual: Signal<UsuarioAutenticado | null>;
  iniciarSesion: ReturnType<
    typeof vi.fn<(credenciales: CredencialesInicioSesion) => Observable<RespuestaInicioSesion>>
  >;
}

describe('routes', () => {
  let estadoAutenticacion: ReturnType<typeof signal<boolean>>;
  let estadoUsuario: ReturnType<typeof signal<UsuarioAutenticado | null>>;

  beforeEach(() => {
    estadoAutenticacion = signal(false);
    estadoUsuario = signal<UsuarioAutenticado | null>(null);
  });

  it('la ruta del layout principal contiene guardAutenticacion', () => {
    expect(obtenerRutaLayout().canActivate).toContain(guardAutenticacion);
  });

  it('la ruta de autenticacion continua antes del layout', () => {
    expect(routes.indexOf(obtenerRutaAutenticacion())).toBeLessThan(
      routes.indexOf(obtenerRutaLayout()),
    );
  });

  it('un usuario no autenticado que navega a raiz termina en iniciar-sesion', async () => {
    const harness = await crearHarness(false, '/');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Iniciar sesión',
    );
  });

  it('la URL incluye el parametro de retorno raiz', async () => {
    await crearHarness(false, '/');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/iniciar-sesion?retorno=%2F');
  });

  it('un usuario autenticado puede navegar a raiz', async () => {
    const harness = await crearHarness(true, '/');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('un usuario autenticado que navega a iniciar-sesion es redirigido a raiz', async () => {
    const harness = await crearHarness(true, '/iniciar-sesion');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('la ruta comodin sigue existiendo', () => {
    expect(routes.some((ruta) => ruta.path === '**')).toBe(true);
  });

  it('no se agrego guardRoles al layout', () => {
    expect(obtenerRutaLayout().canActivate).not.toContain(guardRoles);
  });

  it('no se agregaron datos de roles al layout', () => {
    expect(obtenerRutaLayout().data).toBeUndefined();
  });

  it('la ruta usuarios esta dentro del layout', () => {
    expect(obtenerRutaUsuarios()).toBeTruthy();
  });

  it('la ruta usuarios utiliza carga diferida', () => {
    expect(obtenerRutaUsuarios().loadChildren).toBeDefined();
  });

  it('la ruta usuarios no altera la ruta de inicio', () => {
    expect(obtenerRutaLayout().children?.some((ruta) => ruta.path === '')).toBe(true);
  });

  it('existe la ruta hija periodos-academicos', () => {
    expect(obtenerRutaPeriodosAcademicos()).toBeTruthy();
  });

  it('la ruta periodos-academicos usa loadChildren', () => {
    expect(obtenerRutaPeriodosAcademicos().loadChildren).toBeDefined();
  });

  it('la ruta periodos-academicos se encuentra dentro del layout', () => {
    expect(obtenerRutaLayout().children).toContain(obtenerRutaPeriodosAcademicos());
  });

  it('la ruta periodos-academicos no altera rutas existentes', () => {
    expect(obtenerRutaUsuarios()).toBeTruthy();
    expect(obtenerRutaLayout().children?.some((ruta) => ruta.path === '')).toBe(true);
  });

  it('la integracion central de periodos no agrega roles', () => {
    expect(obtenerRutaPeriodosAcademicos().canActivate).toBeUndefined();
    expect(obtenerRutaPeriodosAcademicos().data).toBeUndefined();
  });

  it('no se crearon ciclos de redireccion', async () => {
    await crearHarness(false, '/');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/iniciar-sesion?retorno=%2F');
  });

  it('la ruta hija raiz contiene guardRutaInicial', () => {
    expect(obtenerRutaInicio().canActivate).toContain(guardRutaInicial);
  });

  it('existe la ruta hija dashboard-gestor', () => {
    expect(obtenerRutaDashboardGestor()).toBeTruthy();
  });

  it('dashboard-gestor protege por roles de admin y gestor', () => {
    const ruta = obtenerRutaDashboardGestor();

    expect(ruta.canActivate).toContain(guardRoles);
    expect(ruta.data?.['rolesPermitidos']).toEqual([
      'ADMIN',
      'GESTOR_MATRICULA',
    ]);
  });

  it('existe la ruta hija portal-estudiante', () => {
    expect(obtenerRutaPortalEstudiante()).toBeTruthy();
  });

  it('portal-estudiante protege unicamente por rol de estudiante', () => {
    const ruta = obtenerRutaPortalEstudiante();

    expect(ruta.canActivate).toContain(guardRoles);
    expect(ruta.data?.['rolesPermitidos']).toEqual(['ESTUDIANTE']);
  });

  it('existe la ruta hija acceso-denegado', () => {
    expect(obtenerRutaAccesoDenegado()).toBeTruthy();
  });

  it('un GESTOR_MATRICULA autenticado que navega a raiz llega a su dashboard', async () => {
    estadoUsuario.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    const harness = await crearHarness(true, '/');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Resumen de matrículas',
    );
  });

  it('un ESTUDIANTE autenticado que navega a raiz llega a su portal', async () => {
    estadoUsuario.set(crearUsuarioConRol('ESTUDIANTE'));
    const harness = await crearHarness(true, '/');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Mi matrícula',
    );
  });

  it('un DOCENTE autenticado permanece en la raiz', async () => {
    estadoUsuario.set(crearUsuarioConRol('DOCENTE'));
    const harness = await crearHarness(true, '/');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('un ESTUDIANTE no puede abrir el dashboard del gestor', async () => {
    estadoUsuario.set(crearUsuarioConRol('ESTUDIANTE'));
    const harness = await crearHarness(true, '/dashboard-gestor');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Acceso denegado',
    );
  });

  it('un GESTOR_MATRICULA no puede abrir el portal del estudiante', async () => {
    estadoUsuario.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    const harness = await crearHarness(true, '/portal-estudiante');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Acceso denegado',
    );
  });

  it('un GESTOR_MATRICULA autenticado que navega a iniciar-sesion es redirigido a su dashboard', async () => {
    estadoUsuario.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    const harness = await crearHarness(true, '/iniciar-sesion');

    expect(harness.routeNativeElement?.textContent).toContain(
      'Resumen de matrículas',
    );
  });

  async function crearHarness(
    estaAutenticado: boolean,
    urlInicial: string,
  ): Promise<RouterTestingHarness> {
    const autenticacionService: AutenticacionServiceMock = {
      estaAutenticado: estadoAutenticacion.asReadonly(),
      usuarioActual: estadoUsuario.asReadonly(),
      iniciarSesion: vi.fn(),
    };

    estadoAutenticacion.set(estaAutenticado);

    if (estaAutenticado && !estadoUsuario()) {
      estadoUsuario.set(crearUsuarioConRol('ADMIN'));
    }

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
        {
          provide: MatriculasService,
          useValue: {
            obtenerResumenMatriculas: () => of({ success: true, data: null }),
            listarMatriculas: () => of({ success: true, data: [] }),
          },
        },
      ],
    });

    return RouterTestingHarness.create(urlInicial);
  }

  function obtenerRutaAutenticacion() {
    const ruta = routes.find((rutaActual) => rutaActual.loadChildren);

    if (!ruta) {
      throw new Error('No existe ruta de autenticacion.');
    }

    return ruta;
  }

  function obtenerRutaLayout() {
    const ruta = routes.find((rutaActual) => rutaActual.loadComponent);

    if (!ruta) {
      throw new Error('No existe ruta de layout.');
    }

    return ruta;
  }

  function obtenerRutaUsuarios() {
    const ruta = obtenerRutaLayout().children?.find(
      (rutaActual) => rutaActual.path === 'usuarios',
    );

    if (!ruta) {
      throw new Error('No existe ruta de usuarios.');
    }

    return ruta;
  }

  function obtenerRutaPeriodosAcademicos() {
    const ruta = obtenerRutaLayout().children?.find(
      (rutaActual) => rutaActual.path === 'periodos-academicos',
    );

    if (!ruta) {
      throw new Error('No existe ruta de periodos academicos.');
    }

    return ruta;
  }

  function obtenerRutaInicio() {
    const ruta = obtenerRutaLayout().children?.find(
      (rutaActual) => rutaActual.path === '',
    );

    if (!ruta) {
      throw new Error('No existe ruta de inicio.');
    }

    return ruta;
  }

  function obtenerRutaDashboardGestor() {
    const ruta = obtenerRutaLayout().children?.find(
      (rutaActual) => rutaActual.path === 'dashboard-gestor',
    );

    if (!ruta) {
      throw new Error('No existe ruta de dashboard del gestor.');
    }

    return ruta;
  }

  function obtenerRutaPortalEstudiante() {
    const ruta = obtenerRutaLayout().children?.find(
      (rutaActual) => rutaActual.path === 'portal-estudiante',
    );

    if (!ruta) {
      throw new Error('No existe ruta del portal del estudiante.');
    }

    return ruta;
  }

  function obtenerRutaAccesoDenegado() {
    const ruta = obtenerRutaLayout().children?.find(
      (rutaActual) => rutaActual.path === 'acceso-denegado',
    );

    if (!ruta) {
      throw new Error('No existe ruta de acceso denegado.');
    }

    return ruta;
  }
});

function crearUsuarioConRol(codigoRol: string): UsuarioAutenticado {
  return {
    id: 1,
    nombres: 'Persona',
    apellidos: 'Prueba',
    correo: 'persona.prueba@universidad.edu',
    estado: 'ACTIVO',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  };
}

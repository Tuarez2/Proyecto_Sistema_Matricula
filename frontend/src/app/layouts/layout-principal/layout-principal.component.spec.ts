import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';

import type {
  RespuestaCierreSesion,
  UsuarioAutenticado,
} from '../../core/models/autenticacion.model';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { PreferenciasService } from '../../core/services/preferencias.service';
import { LayoutPrincipalComponent } from './layout-principal.component';

interface AutenticacionServiceMock {
  usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  cerrarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaCierreSesion>>>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
  obtenerTokenAcceso: ReturnType<typeof vi.fn<() => string | null>>;
  obtenerTokenRenovacion: ReturnType<typeof vi.fn<() => string | null>>;
}

describe('LayoutPrincipalComponent', () => {
  let fixture: ComponentFixture<LayoutPrincipalComponent>;
  let componente: LayoutPrincipalComponent;
  let usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let autenticacionService: AutenticacionServiceMock;
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    usuarioActual = signal<UsuarioAutenticado | null>(crearUsuario());
    autenticacionService = {
      usuarioActual,
      cerrarSesion: vi.fn(() => crearRespuestaCierrePendiente().asObservable()),
      limpiarSesion: vi.fn(),
      obtenerTokenAcceso: vi.fn(),
      obtenerTokenRenovacion: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [LayoutPrincipalComponent],
      providers: [
        provideRouter([]),
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
        PreferenciasService,
      ],
    }).compileComponents();

    const enrutador = TestBed.inject(Router);
    navegarPorUrl = vi
      .spyOn(enrutador, 'navigateByUrl')
      .mockImplementation(() => Promise.resolve(true));
    fixture = TestBed.createComponent(LayoutPrincipalComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('existe un header', () => {
    expect(obtenerElemento('header')).toBeTruthy();
  });

  it('existe un nav', () => {
    expect(obtenerElemento('nav')).toBeTruthy();
  });

  it('la marca se muestra una sola vez, en el encabezado', () => {
    expect(fixture.nativeElement.querySelectorAll('.marca').length).toBe(1);
    expect(obtenerElementoOpcional('.panel-navegacion .marca')).toBeNull();
    expect(obtenerElementoOpcional('.panel-navegacion__marca')).toBeNull();
  });

  it('el encabezado conserva el nombre del sistema', () => {
    expect(obtenerElemento('.marca__nombre')?.textContent).toContain(
      'Sistema de Matrícula Universitaria',
    );
  });

  it('el nav tiene aria-label de navegacion principal', () => {
    expect(obtenerElemento('nav')?.getAttribute('aria-label')).toBe(
      'Navegación principal',
    );
  });

  it('existe un enlace hacia raiz', () => {
    const enlace = obtenerElemento<HTMLAnchorElement>('a');

    expect(enlace?.getAttribute('href')).toBe('/');
  });

  it('el enlace muestra Inicio', () => {
    expect(obtenerElemento('a')?.textContent?.trim()).toBe('Inicio');
  });

  it('un administrador ve el enlace Usuarios', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeTruthy();
  });

  it('existe enlace Periodos', () => {
    fixture.detectChanges();

    expect(obtenerEnlaces('Periodos')).toHaveLength(1);
  });

  it('el enlace Periodos apunta a /periodos-academicos', () => {
    fixture.detectChanges();

    expect(obtenerEnlace('Periodos')?.getAttribute('href')).toBe(
      '/periodos-academicos',
    );
  });

  it.each([
    'ADMIN',
    'GESTOR_MATRICULA',
    'DOCENTE',
  ])('%s puede ver Periodos', (codigoRol) => {
    usuarioActual.set(crearUsuarioConRol(codigoRol));
    fixture.detectChanges();

    expect(obtenerEnlace('Periodos')).toBeTruthy();
  });

  it('ESTUDIANTE no ve Periodos', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Periodos')).toBeNull();
  });

  it('un GESTOR_MATRICULA ve Dashboard', () => {
    usuarioActual.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    fixture.detectChanges();

    expect(obtenerEnlace('Dashboard')).toBeTruthy();
  });

  it('un ADMIN ve Dashboard', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Dashboard')).toBeTruthy();
  });

  it('DOCENTE no ve Dashboard', () => {
    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Dashboard')).toBeNull();
  });

  it('ESTUDIANTE no ve Dashboard', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Dashboard')).toBeNull();
  });

  it('un GESTOR_MATRICULA ve el enlace Listado', () => {
    usuarioActual.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    fixture.detectChanges();

    expect(obtenerEnlace('Listado')).toBeTruthy();
  });

  it('DOCENTE no ve Listado', () => {
    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Listado')).toBeNull();
  });

  it('ESTUDIANTE no ve Listado', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Listado')).toBeNull();
  });

  it('un GESTOR_MATRICULA ve Nueva matrícula y Renovación', () => {
    usuarioActual.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    fixture.detectChanges();

    expect(obtenerEnlace('Nueva matrícula')).toBeTruthy();
    expect(obtenerEnlace('Renovación')).toBeTruthy();
  });

  it('un ESTUDIANTE ve Portal del estudiante', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Portal del estudiante')).toBeTruthy();
  });

  it('el enlace Portal del estudiante apunta a /portal-estudiante', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Portal del estudiante')?.getAttribute('href')).toBe(
      '/portal-estudiante',
    );
  });

  it('un ADMIN no ve Portal del estudiante', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Portal del estudiante')).toBeNull();
  });

  it('un DOCENTE no ve Portal del estudiante', () => {
    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Portal del estudiante')).toBeNull();
  });

  it('un ESTUDIANTE no ve Inicio', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Inicio')).toBeNull();
  });

  it('un ESTUDIANTE no ve Facultades ni Carreras', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Facultades')).toBeNull();
    expect(obtenerEnlace('Carreras')).toBeNull();
  });

  it('un DOCENTE ve Inicio', () => {
    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Inicio')).toBeTruthy();
  });

  it('un ESTUDIANTE solo ve Portal del estudiante', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    const enlaces = obtenerEnlacesSinIconos();

    expect(enlaces).toEqual(['Portal del estudiante']);
  });

  it('el enlace Usuarios apunta a /usuarios', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')?.getAttribute('href')).toBe('/usuarios');
  });

  it('GESTOR_MATRICULA no ve Usuarios', () => {
    usuarioActual.set(crearUsuarioConRol('GESTOR_MATRICULA'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('ESTUDIANTE no ve Usuarios', () => {
    usuarioActual.set(crearUsuarioConRol('ESTUDIANTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('DOCENTE no ve Usuarios', () => {
    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('usuario sin rol no ve Usuarios', () => {
    usuarioActual.set(crearUsuario({ rol: null }));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('sin usuario no se muestra Usuarios', () => {
    usuarioActual.set(null);
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('el enlace aparece si la señal cambia a administrador', () => {
    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();
    expect(obtenerEnlace('Usuarios')).toBeNull();

    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeTruthy();
  });

  it('el enlace desaparece si cambia a otro rol', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();
    expect(obtenerEnlace('Usuarios')).toBeTruthy();

    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('el enlace Inicio continua existiendo', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    expect(obtenerEnlace('Inicio')).toBeTruthy();
  });

  it('el comportamiento del enlace Usuarios continua igual', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();
    expect(obtenerEnlace('Usuarios')).toBeTruthy();

    usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    fixture.detectChanges();

    expect(obtenerEnlace('Usuarios')).toBeNull();
  });

  it('no existen enlaces de creacion de periodos', () => {
    fixture.detectChanges();

    expect(obtenerEnlace('Crear periodo')).toBeNull();
  });

  it('no existen enlaces de transicion de periodos', () => {
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeNull();
  });

  it('existe un main', () => {
    expect(obtenerElemento('main')).toBeTruthy();
  });

  it('existe router-outlet dentro de main', () => {
    expect(obtenerElemento('main router-outlet')).toBeTruthy();
  });

  it('muestra nombres y apellidos del usuario', () => {
    usuarioActual.set(crearUsuario({
      nombres: 'Persona',
      apellidos: 'Prueba',
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Persona Prueba');
  });

  it('elimina espacios exteriores al construir el nombre', () => {
    usuarioActual.set(crearUsuario({
      nombres: '  Persona  ',
      apellidos: '  Prueba  ',
    }));
    fixture.detectChanges();

    expect(componente.nombreCompletoUsuario()).toBe('Persona Prueba');
  });

  it('no produce espacios incorrectos cuando falta el apellido', () => {
    usuarioActual.set(crearUsuario({
      nombres: 'Persona',
      apellidos: '',
    }));
    fixture.detectChanges();

    expect(componente.nombreCompletoUsuario()).toBe('Persona');
  });

  it('muestra Usuario cuando no existe usuario', () => {
    usuarioActual.set(null);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Usuario');
  });

  it('muestra el nombre del rol', () => {
    usuarioActual.set(crearUsuario({
      rol: {
        id: 1,
        codigo: 'ADMIN',
        nombre: 'Administrador',
      },
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Administrador');
  });

  it('usa el codigo del rol cuando el nombre esta vacio', () => {
    usuarioActual.set(crearUsuario({
      rol: {
        id: 1,
        codigo: 'ADMIN',
        nombre: '   ',
      },
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('ADMIN');
  });

  it('muestra Sin rol asignado cuando rol es null', () => {
    usuarioActual.set(crearUsuario({ rol: null }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Sin rol asignado');
  });

  it('se actualiza cuando cambia la señal usuarioActual', () => {
    usuarioActual.set(crearUsuario({
      nombres: 'Primera',
      apellidos: 'Persona',
    }));
    fixture.detectChanges();
    expect(obtenerTexto()).toContain('Primera Persona');

    usuarioActual.set(crearUsuario({
      nombres: 'Segunda',
      apellidos: 'Persona',
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Segunda Persona');
  });

  it('no modifica el objeto original del usuario', () => {
    const usuario = crearUsuario({
      nombres: '  Persona  ',
      apellidos: '  Prueba  ',
    });

    usuarioActual.set(usuario);
    fixture.detectChanges();

    expect(usuario.nombres).toBe('  Persona  ');
    expect(usuario.apellidos).toBe('  Prueba  ');
  });

  it('existe un boton para abrir el menu de usuario', () => {
    const boton = obtenerElemento<HTMLButtonElement>('.boton-menu-usuario');

    expect(boton).toBeTruthy();
    expect(boton?.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('el menu de usuario se cierra con Escape', () => {
    componente.alternarMenuUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('.menu-usuario')).toBeTruthy();

    componente.manejarTecladoMenuUsuario({ key: 'Escape' } as KeyboardEvent);
    fixture.detectChanges();

    expect(componente.menuUsuarioAbierto()).toBe(false);
    expect(obtenerElemento('.menu-usuario')).toBeNull();
  });

  it('cerrar el menu de usuario devuelve el foco al boton', () => {
    componente.alternarMenuUsuario();
    fixture.detectChanges();
    componente.cerrarMenuUsuario();
    fixture.detectChanges();

    const boton = obtenerElemento<HTMLButtonElement>('.boton-menu-usuario');

    expect(componente.menuUsuarioAbierto()).toBe(false);
    expect(document.activeElement).toBe(boton);
  });

  it('abrir preferencias muestra el panel', () => {
    componente.abrirPanel('preferencias');
    fixture.detectChanges();

    expect(obtenerElemento('.panel-flotante')).toBeTruthy();
    expect(obtenerElemento('.panel-preferencias')).toBeTruthy();
  });

  it('cerrar el panel quita el dialogo', () => {
    componente.abrirPanel('accesibilidad');
    fixture.detectChanges();
    expect(obtenerElemento('.panel-flotante')).toBeTruthy();

    componente.cerrarPanel();
    fixture.detectChanges();

    expect(obtenerElemento('.panel-flotante')).toBeNull();
  });

  it('los grupos de navegacion agrupan los enlaces por rol', () => {
    usuarioActual.set(crearUsuarioConRol('ADMIN'));
    fixture.detectChanges();

    const titulos = Array.from(
      fixture.nativeElement.querySelectorAll('.grupo-navegacion__titulo'),
    ).map((elemento) => (elemento as HTMLElement).textContent?.trim());

    expect(titulos).toEqual(['GENERAL', 'PERSONAS', 'GESTIÓN ACADÉMICA', 'MATRÍCULAS']);
  });

  it('el sidebar se puede contraer', () => {
    expect(componente.sidebarContraido()).toBe(false);

    componente.alternarSidebar();

    expect(componente.sidebarContraido()).toBe(true);
  });

  it('al presionar cerrar sesion llama una vez a cerrarSesion', () => {
    abrirMenuUsuario();
    obtenerBotonCierre()?.click();

    expect(autenticacionService.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('activa cerrandoSesion mientras el observable esta pendiente', () => {
    prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    fixture.detectChanges();

    expect(componente.cerrandoSesion()).toBe(true);
  });

  it('deshabilita el boton durante el cierre', () => {
    prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    fixture.detectChanges();

    expect(obtenerBotonCierre()?.disabled).toBe(true);
  });

  it('muestra Cerrando sesion durante el cierre', () => {
    prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    fixture.detectChanges();

    expect(obtenerBotonCierre()?.textContent).toContain('Cerrando sesión...');
  });

  it('al completarse vuelve a habilitar el estado', () => {
    const solicitud = prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    solicitud.next(crearRespuestaCierre());
    solicitud.complete();
    fixture.detectChanges();

    expect(componente.cerrandoSesion()).toBe(false);
  });

  it('al completarse navega a iniciar-sesion', () => {
    const solicitud = prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    solicitud.next(crearRespuestaCierre());
    solicitud.complete();

    expect(navegarPorUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });

  it('la navegacion correcta ocurre una sola vez', () => {
    const solicitud = prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    solicitud.next(crearRespuestaCierre());
    solicitud.complete();

    expect(navegarPorUrl).toHaveBeenCalledTimes(1);
  });

  it('dos clics pendientes generan una sola llamada', () => {
    prepararCierrePendiente();
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    obtenerBotonCierre()?.click();

    expect(autenticacionService.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('despues de finalizar permite un nuevo intento', () => {
    const primeraSolicitud = new Subject<RespuestaCierreSesion>();
    const segundaSolicitud = new Subject<RespuestaCierreSesion>();

    autenticacionService.cerrarSesion
      .mockReturnValueOnce(primeraSolicitud.asObservable())
      .mockReturnValueOnce(segundaSolicitud.asObservable());

    abrirMenuUsuario();
    obtenerBotonCierre()?.click();
    primeraSolicitud.next(crearRespuestaCierre());
    primeraSolicitud.complete();
    abrirMenuUsuario();
    obtenerBotonCierre()?.click();

    expect(autenticacionService.cerrarSesion).toHaveBeenCalledTimes(2);
  });

  it('ante error tambien navega a iniciar-sesion', () => {
    autenticacionService.cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error de cierre')),
    );
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();

    expect(navegarPorUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });

  it('ante error vuelve a colocar cerrandoSesion en false', () => {
    autenticacionService.cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error de cierre')),
    );
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();

    expect(componente.cerrandoSesion()).toBe(false);
  });

  it('ante error no queda bloqueado el boton', () => {
    autenticacionService.cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error de cierre')),
    );
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    fixture.detectChanges();

    expect(obtenerBotonCierre()?.disabled).toBe(false);
  });

  it('ante error no muestra detalles tecnicos', () => {
    autenticacionService.cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Detalle tecnico')),
    );
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Detalle tecnico');
  });

  it('no necesita llamar manualmente a limpiarSesion', () => {
    autenticacionService.cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error de cierre')),
    );
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('la navegacion ante error ocurre una sola vez', () => {
    autenticacionService.cerrarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error de cierre')),
    );
    abrirMenuUsuario();

    obtenerBotonCierre()?.click();

    expect(navegarPorUrl).toHaveBeenCalledTimes(1);
  });

  it('no accede a almacenamiento', () => {
    abrirMenuUsuario();
    obtenerBotonCierre()?.click();

    expect(autenticacionService.obtenerTokenAcceso).not.toHaveBeenCalled();
    expect(autenticacionService.obtenerTokenRenovacion).not.toHaveBeenCalled();
  });

  it('no utiliza cliente HTTP directamente', () => {
    expect(Object.keys(componente)).not.toContain('http');
  });

  it('no decodifica tokens', () => {
    expect(autenticacionService.obtenerTokenAcceso).not.toHaveBeenCalled();
  });

  it('no necesita conocer el refresh token', () => {
    expect(autenticacionService.obtenerTokenRenovacion).not.toHaveBeenCalled();
  });

  it('el logout depende exclusivamente de AutenticacionService', () => {
    abrirMenuUsuario();
    obtenerBotonCierre()?.click();

    expect(autenticacionService.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('el boton cerrar sesion no es la accion mas prominente del header', () => {
    abrirMenuUsuario();

    const botonSalir = obtenerBotonCierre();
    const controlesDirectos = fixture.nativeElement.querySelectorAll(
      '.barra-superior > a, .barra-superior > .btn-cerrar-sesion, .barra-superior > .boton-menu-usuario',
    );

    expect(botonSalir).toBeTruthy();
    expect(controlesDirectos.length).toBe(0);
    expect(obtenerElemento('.menu-usuario')).toBeTruthy();
  });

  function abrirMenuUsuario(): void {
    if (!componente.menuUsuarioAbierto()) {
      componente.alternarMenuUsuario();
      fixture.detectChanges();
    }
  }

  function obtenerElemento<T extends Element = Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function obtenerElementoOpcional<T extends Element = Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function obtenerBotonCierre(): HTMLButtonElement | null {
    return obtenerElemento<HTMLButtonElement>('.menu-usuario__opcion--salir');
  }

  function obtenerEnlace(texto: string): HTMLAnchorElement | null {
    return obtenerEnlaces(texto)[0] ?? null;
  }

  function obtenerEnlaces(texto: string): HTMLAnchorElement[] {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.filter((enlace) => enlace.textContent?.includes(texto));
  }

  function obtenerEnlacesSinIconos(): string[] {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.enlace-navegacion'),
    ) as HTMLAnchorElement[];

    return enlaces.map((enlace) => enlace.textContent?.trim() ?? '');
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function prepararCierrePendiente(): Subject<RespuestaCierreSesion> {
    const solicitud = new Subject<RespuestaCierreSesion>();

    autenticacionService.cerrarSesion.mockReturnValueOnce(solicitud.asObservable());

    return solicitud;
  }
});

function crearUsuario(
  usuarioParcial: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
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
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
    ...usuarioParcial,
  };
}

function crearUsuarioConRol(codigoRol: string): UsuarioAutenticado {
  return crearUsuario({
    rol: {
      id: 1,
      codigo: codigoRol,
      nombre: codigoRol,
    },
  });
}

function crearRespuestaCierrePendiente(): Subject<RespuestaCierreSesion> {
  return new Subject<RespuestaCierreSesion>();
}

function crearRespuestaCierre(): RespuestaCierreSesion {
  return {
    success: true,
    message: 'Sesion cerrada correctamente.',
  };
}

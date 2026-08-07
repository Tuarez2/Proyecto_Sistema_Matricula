import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type { RespuestaRoles, Rol } from '../models/rol.model';
import type {
  FiltrosListadoUsuarios,
  RespuestaListadoUsuarios,
  Usuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';
import { ListadoUsuariosComponent } from './listado-usuarios.component';

interface UsuariosServiceMock {
  listarUsuarios: ReturnType<
    typeof vi.fn<(filtros?: FiltrosListadoUsuarios) => Observable<RespuestaListadoUsuarios>>
  >;
}

interface RolesServiceMock {
  listarRoles: ReturnType<typeof vi.fn<() => Observable<RespuestaRoles>>>;
}

describe('ListadoUsuariosComponent', () => {
  let fixture: ComponentFixture<ListadoUsuariosComponent>;
  let componente: ListadoUsuariosComponent;
  let usuariosService: UsuariosServiceMock;
  let rolesService: RolesServiceMock;
  let solicitudesUsuarios: Subject<RespuestaListadoUsuarios>[];
  let solicitudesRoles: Subject<RespuestaRoles>[];

  beforeEach(async () => {
    solicitudesUsuarios = [];
    solicitudesRoles = [];
    usuariosService = {
      listarUsuarios: vi.fn(() => {
        const solicitud = new Subject<RespuestaListadoUsuarios>();
        solicitudesUsuarios.push(solicitud);
        return solicitud.asObservable();
      }),
    };
    rolesService = {
      listarRoles: vi.fn(() => {
        const solicitud = new Subject<RespuestaRoles>();
        solicitudesRoles.push(solicitud);
        return solicitud.asObservable();
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoUsuariosComponent],
      providers: [
        provideRouter([]),
        {
          provide: UsuariosService,
          useValue: usuariosService,
        },
        {
          provide: RolesService,
          useValue: rolesService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoUsuariosComponent);
    componente = fixture.componentInstance;
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('al iniciar consulta roles', () => {
    iniciarComponente();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('al iniciar consulta usuarios', () => {
    iniciarComponente();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(1);
  });

  it('las consultas iniciales son independientes', () => {
    iniciarComponente();
    solicitudesRoles[0].error(new Error('Error de roles'));

    expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(1);
    expect(componente.cargandoUsuarios()).toBe(true);
  });

  it('utiliza pagina 1 y limite 10 al iniciar', () => {
    iniciarComponente();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('el formulario comienza vacio', () => {
    expect(componente.formularioFiltros.getRawValue()).toEqual({
      correo: '',
      estado: '',
      codigoRol: '',
    });
  });

  it('buscar reinicia la pagina a 1', () => {
    iniciarYCompletar();
    prepararPagina(2, 3);
    usuariosService.listarUsuarios.mockClear();

    componente.buscarUsuarios();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('envia el correo sin espacios exteriores', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();
    componente.formularioFiltros.patchValue({ correo: '  admin  ' }, { emitEvent: false });

    componente.buscarUsuarios();

    expect(obtenerUltimosFiltros()?.correo).toBe('admin');
  });

  it('envia estado', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();
    componente.formularioFiltros.patchValue({ estado: 'activo' }, { emitEvent: false });

    componente.buscarUsuarios();

    expect(obtenerUltimosFiltros()?.estado).toBe('activo');
  });

  it('envia codigo de rol', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();
    componente.formularioFiltros.patchValue({ codigoRol: 'ADMIN' }, { emitEvent: false });

    componente.buscarUsuarios();

    expect(obtenerUltimosFiltros()?.codigoRol).toBe('ADMIN');
  });

  it('omite filtros vacios', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();
    componente.formularioFiltros.patchValue({
      correo: '   ',
      estado: '',
      codigoRol: '',
    }, { emitEvent: false });

    componente.buscarUsuarios();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledWith({
      pagina: 1,
      limite: 10,
    });
  });

  it('correo de mas de 150 caracteres no consulta', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();
    componente.formularioFiltros.patchValue({ correo: 'a'.repeat(151) }, { emitEvent: false });

    componente.buscarUsuarios();

    expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();
    expect(componente.formularioFiltros.controls.correo.touched).toBe(true);
  });

  it('limpiar restablece los filtros', () => {
    iniciarYCompletar();
    componente.formularioFiltros.patchValue({
      correo: 'admin',
      estado: 'activo',
      codigoRol: 'ADMIN',
    }, { emitEvent: false });

    componente.limpiarFiltros();

    expect(componente.formularioFiltros.getRawValue()).toEqual({
      correo: '',
      estado: '',
      codigoRol: '',
    });
  });

  it('limpiar vuelve a consultar', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();

    componente.limpiarFiltros();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(1);
  });

  it('limpiar conserva el limite', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();

    componente.limpiarFiltros();

    expect(obtenerUltimosFiltros()?.limite).toBe(10);
  });

  it('guarda la lista devuelta', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({ data: [crearUsuario({ id: 2 })] }));

    expect(componente.usuarios()[0]?.id).toBe(2);
  });

  it('guarda pagina limite total y total de paginas', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({
      page: 2,
      limit: 10,
      total: 11,
      totalPages: 2,
    }));

    expect(componente.paginaActual()).toBe(2);
    expect(componente.limitePorPagina()).toBe(10);
    expect(componente.totalUsuarios()).toBe(11);
    expect(componente.totalPaginas()).toBe(2);
  });

  it('conserva el orden recibido', () => {
    const primerUsuario = crearUsuario({ id: 2, apellidos: 'B' });
    const segundoUsuario = crearUsuario({ id: 1, apellidos: 'A' });

    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({
      data: [primerUsuario, segundoUsuario],
    }));

    expect(componente.usuarios().map((usuario) => usuario.id)).toEqual([2, 1]);
  });

  it('muestra los usuarios en la tabla', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('admin@universidad.edu');
  });

  it('muestra nombre completo', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({
      data: [crearUsuario({ nombres: 'Ana', apellidos: 'Perez' })],
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Ana Perez');
  });

  it('muestra Sin rol para rol nulo', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({
      data: [crearUsuario({ rol: null })],
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Sin rol');
  });

  it('muestra correctamente el cambio de contrasena pendiente', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({
      data: [
        crearUsuario({ id: 1, debe_cambiar_password: true }),
        crearUsuario({ id: 2, debe_cambiar_password: false }),
      ],
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Sí');
    expect(obtenerTexto()).toContain('No');
  });

  it('muestra mensaje cuando no hay resultados', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({ data: [], total: 0, totalPages: 0 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('No se encontraron usuarios.');
  });

  it('anterior esta deshabilitado en pagina 1', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Anterior')?.disabled).toBe(true);
  });

  it('siguiente esta deshabilitado en la ultima pagina', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 1 }));
    fixture.detectChanges();

    expect(obtenerBoton('Siguiente')?.disabled).toBe(true);
  });

  it('pagina siguiente incrementa y consulta', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 2 }));
    usuariosService.listarUsuarios.mockClear();

    componente.paginaSiguiente();

    expect(obtenerUltimosFiltros()?.pagina).toBe(2);
  });

  it('pagina anterior decrementa y consulta', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 2, totalPages: 3 }));
    usuariosService.listarUsuarios.mockClear();

    componente.paginaAnterior();

    expect(obtenerUltimosFiltros()?.pagina).toBe(1);
  });

  it('nunca baja de la pagina 1', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 3 }));
    usuariosService.listarUsuarios.mockClear();

    componente.paginaAnterior();

    expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();
    expect(componente.paginaActual()).toBe(1);
  });

  it('nunca supera totalPaginas', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 2, totalPages: 2 }));
    usuariosService.listarUsuarios.mockClear();

    componente.paginaSiguiente();

    expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();
    expect(componente.paginaActual()).toBe(2);
  });

  it('no pagina durante una solicitud activa', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 2 }));
    componente.paginaSiguiente();
    usuariosService.listarUsuarios.mockClear();

    componente.paginaSiguiente();

    expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();
  });

  it('activa y desactiva cargandoUsuarios', () => {
    iniciarComponente();
    expect(componente.cargandoUsuarios()).toBe(true);

    completarUsuarios();

    expect(componente.cargandoUsuarios()).toBe(false);
  });

  it('activa y desactiva cargandoRoles', () => {
    iniciarComponente();
    expect(componente.cargandoRoles()).toBe(true);

    completarRoles();

    expect(componente.cargandoRoles()).toBe(false);
  });

  it('evita consultas duplicadas de roles durante carga', () => {
    iniciarComponente();

    componente.ngOnInit();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('ignora resultados obsoletos de una consulta anterior', () => {
    iniciarComponente();
    const consultaAnterior = solicitudesUsuarios[solicitudesUsuarios.length - 1];
    const consultaNueva = new Subject<RespuestaListadoUsuarios>();
    usuariosService.listarUsuarios.mockImplementationOnce(() => consultaNueva.asObservable());

    componente.buscarUsuarios();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(2);

    consultaNueva.next(
      crearRespuestaListado({ data: [crearUsuario({ id: 77 })] }),
    );
    consultaNueva.complete();
    consultaAnterior.next(
      crearRespuestaListado({ data: [crearUsuario({ id: 1 })] }),
    );
    consultaAnterior.complete();

    expect(componente.usuarios()[0]?.id).toBe(77);
  });

  it('al cambiar el select estado consulta inmediatamente', () => {
    iniciarYCompletar();
    usuariosService.listarUsuarios.mockClear();

    componente.formularioFiltros.controls.estado.setValue('bloqueado');

    expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(1);
    expect(obtenerUltimosFiltros()).toMatchObject({
      estado: 'bloqueado',
      pagina: 1,
      limite: 10,
    });
  });

  it('la busqueda por correo emite una sola consulta con debounce', () => {
    vi.useFakeTimers();
    try {
      iniciarYCompletar();
      usuariosService.listarUsuarios.mockClear();

      componente.formularioFiltros.controls.correo.setValue('anuor');
      vi.advanceTimersByTime(100);
      expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();

      componente.formularioFiltros.controls.correo.setValue('admin');
      vi.advanceTimersByTime(400);

      expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(1);
      expect(obtenerUltimosFiltros()).toMatchObject({
        correo: 'admin',
        pagina: 1,
        limite: 10,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('informa cuantos filtros están activos', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(0);
    expect(obtenerTexto()).toContain('Filtros activos: 0');

    componente.formularioFiltros.controls.estado.setValue('activo');
    fixture.detectChanges();

    expect(componente.filtrosActivos()).toBe(1);
    expect(obtenerTexto()).toContain('Filtros activos: 1');
  });

  it('no existe boton Buscar en el filtro', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  it('error de usuarios no elimina los roles ya cargados', () => {
    iniciarComponente();
    completarRoles(crearRespuestaRoles([crearRol({ codigo: 'ADMIN' })]));
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.roles().length).toBe(1);
  });

  it('error de roles no impide cargar usuarios', () => {
    iniciarComponente();
    solicitudesRoles[0].error(new HttpErrorResponse({ status: 500 }));
    completarUsuarios();

    expect(componente.usuarios().length).toBe(1);
  });

  it('error de conexion muestra mensaje seguro', () => {
    iniciarComponente();
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeErrorUsuarios()).toBe(
      'No fue posible conectar con el servidor.',
    );
  });

  it('error 403 muestra mensaje de permisos', () => {
    iniciarComponente();
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 403 }));

    expect(componente.mensajeErrorUsuarios()).toBe(
      'No tiene permisos para consultar usuarios.',
    );
  });

  it('error 429 muestra mensaje seguro', () => {
    iniciarComponente();
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 429 }));

    expect(componente.mensajeErrorUsuarios()).toBe(
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    );
  });

  it('error 500 muestra mensaje de servidor', () => {
    iniciarComponente();
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeErrorUsuarios()).toBe(
      'Ocurrió un error en el servidor al consultar los datos.',
    );
  });

  it('error desconocido no lanza excepciones', () => {
    iniciarComponente();

    expect(() => solicitudesUsuarios[0].error(new Error('Desconocido'))).not.toThrow();
    expect(componente.mensajeErrorUsuarios()).toBe(
      'No fue posible consultar los datos.',
    );
  });

  it('despues de un error se desactiva el estado de carga', () => {
    iniciarComponente();
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.cargandoUsuarios()).toBe(false);
  });

  it('permite reintentar despues de un error', () => {
    iniciarComponente();
    solicitudesUsuarios[0].error(new HttpErrorResponse({ status: 500 }));
    usuariosService.listarUsuarios.mockClear();

    componente.buscarUsuarios();

    expect(usuariosService.listarUsuarios).toHaveBeenCalledTimes(1);
  });

  it('existe un h1 Usuarios', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain('Usuarios');
  });

  it('existe enlace Nuevo usuario', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo usuario')).toBeTruthy();
  });

  it('el enlace Nuevo usuario apunta a usuarios nuevo', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo usuario')?.getAttribute('href')).toBe(
      '/usuarios/nuevo',
    );
  });

  it('existe formulario de filtros', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('form')).toBeTruthy();
  });

  it('existe campo de correo', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="correo"]')).toBeTruthy();
  });

  it('existe select de estado', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('select[formControlName="estado"]')).toBeTruthy();
  });

  it('existe select de rol', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('select[formControlName="codigoRol"]')).toBeTruthy();
  });

  it('el filtro no contiene boton Buscar', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Buscar')).toBeNull();
  });

  it('existe boton Limpiar filtros', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Limpiar filtros')).toBeTruthy();
  });

  it('existe una tabla cuando hay resultados', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('table')).toBeTruthy();
  });

  it('la tabla tiene caption', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('caption')?.textContent).toContain('Listado de usuarios');
  });

  it('existe columna Acciones', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Acciones');
  });

  it('cada usuario tiene enlace Editar', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlaces('Editar').length).toBe(1);
  });

  it('cada usuario tiene enlace Cambiar estado', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlaces('Cambiar estado').length).toBe(1);
  });

  it('cada usuario tiene enlace Cambiar contraseña', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerEnlaces('Cambiar contraseña').length).toBe(1);
  });

  it('el enlace Editar incluye el identificador', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Editar')?.getAttribute('href')).toContain('/usuarios/15');
  });

  it('el enlace Editar apunta a usuarios id editar', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Editar')?.getAttribute('href')).toBe(
      '/usuarios/15/editar',
    );
  });

  it('el enlace Cambiar estado incluye el identificador', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')?.getAttribute('href')).toContain(
      '/usuarios/15',
    );
  });

  it('el enlace Cambiar estado apunta a usuarios id estado', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')?.getAttribute('href')).toBe(
      '/usuarios/15/estado',
    );
  });

  it('el enlace Cambiar contraseña incluye el identificador', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar contraseña')?.getAttribute('href')).toContain(
      '/usuarios/15',
    );
  });

  it('el enlace Cambiar contraseña apunta a usuarios id contrasena', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar contraseña')?.getAttribute('href')).toBe(
      '/usuarios/15/contrasena',
    );
  });

  it('el enlace Cambiar contraseña no apunta a password', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario({ id: 15 })] }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar contraseña')?.getAttribute('href')).not.toContain(
      '/password',
    );
  });

  it('no existen botones de estado', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Cambiar estado')).toBeNull();
  });

  it('no existen botones de contrasena', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Cambiar contraseña')).toBeNull();
  });

  it('no existen botones Eliminar', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Eliminar')).toBeNull();
  });

  it('el enlace Nuevo usuario se mantiene visible sin resultados', () => {
    iniciarComponente();
    completarRoles();
    completarUsuarios(crearRespuestaListado({ data: [], total: 0, totalPages: 0 }));
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo usuario')).toBeTruthy();
  });

  it('los enlaces usan el identificador correcto con varios usuarios', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearUsuario({ id: 15 }),
        crearUsuario({ id: 22, correo: 'otro@universidad.edu' }),
      ],
    }));
    fixture.detectChanges();

    expect(obtenerEnlaces('Editar').map((enlace) => enlace.getAttribute('href')))
      .toEqual(['/usuarios/15/editar', '/usuarios/22/editar']);
  });

  it('los enlaces de estado usan identificadores correctos con varios usuarios', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearUsuario({ id: 15 }),
        crearUsuario({ id: 22, correo: 'otro@universidad.edu' }),
      ],
    }));
    fixture.detectChanges();

    expect(obtenerEnlaces('Cambiar estado').map((enlace) => enlace.getAttribute('href')))
      .toEqual(['/usuarios/15/estado', '/usuarios/22/estado']);
  });

  it('los enlaces de contrasena usan identificadores correctos con varios usuarios', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [
        crearUsuario({ id: 15 }),
        crearUsuario({ id: 22, correo: 'otro@universidad.edu' }),
      ],
    }));
    fixture.detectChanges();

    expect(obtenerEnlaces('Cambiar contraseña').map(
      (enlace) => enlace.getAttribute('href'),
    )).toEqual(['/usuarios/15/contrasena', '/usuarios/22/contrasena']);
  });

  it('la tabla continua siendo semantica', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerElemento('table')).toBeTruthy();
    expect(obtenerElemento('caption')?.textContent).toContain('Listado de usuarios');
    expect(obtenerElemento('th[scope="col"]')).toBeTruthy();
  });

  it('el enlace Nuevo usuario se mantiene visible durante la carga', () => {
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerEnlace('Nuevo usuario')).toBeTruthy();
  });

  it('el enlace de estado existe para usuarios activos', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'activo' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('el enlace de contrasena existe para usuarios activos', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'activo' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar contraseña')).toBeTruthy();
  });

  it('el enlace de estado existe para usuarios bloqueados', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'bloqueado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('el enlace de contrasena existe para usuarios bloqueados', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'bloqueado' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar contraseña')).toBeTruthy();
  });

  it('el enlace de estado existe para usuarios inactivos', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'inactivo' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar estado')).toBeTruthy();
  });

  it('el enlace de contrasena existe para usuarios inactivos', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'inactivo' })],
    }));
    fixture.detectChanges();

    expect(obtenerEnlace('Cambiar contraseña')).toBeTruthy();
  });

  it('existen botones Anterior y Siguiente', () => {
    iniciarYCompletar();
    fixture.detectChanges();

    expect(obtenerBoton('Anterior')).toBeTruthy();
    expect(obtenerBoton('Siguiente')).toBeTruthy();
  });

  it('se muestra la informacion de paginacion', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, total: 1, totalPages: 1 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Página 1 de 1');
    expect(obtenerTexto()).toContain('1 resultado');
  });

  it('muestra badge de estado Activo', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'activo' })],
    }));
    fixture.detectChanges();

    expect(obtenerElemento('.estado-badge--success')?.textContent).toContain('Activo');
  });

  it('muestra badge de estado Bloqueado', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'bloqueado' })],
    }));
    fixture.detectChanges();

    expect(obtenerElemento('.estado-badge--danger')?.textContent).toContain('Bloqueado');
  });

  it('muestra badge de estado Inactivo', () => {
    iniciarYCompletar(crearRespuestaListado({
      data: [crearUsuario({ estado: 'inactivo' })],
    }));
    fixture.detectChanges();

    expect(obtenerElemento('.estado-badge--neutral')?.textContent).toContain('Inactivo');
  });

  it('cambiarPagina consulta la pagina indicada', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 3 }));
    usuariosService.listarUsuarios.mockClear();

    componente.cambiarPagina(2);

    expect(obtenerUltimosFiltros()?.pagina).toBe(2);
  });

  it('cambiarPagina no consulta si la pagina no cambia', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 3 }));
    usuariosService.listarUsuarios.mockClear();

    componente.cambiarPagina(1);

    expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();
  });

  it('muestra el conteo de resultados', () => {
    iniciarYCompletar(crearRespuestaListado({ data: [crearUsuario()], total: 1 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Se encontraron');
    expect(obtenerTexto()).toContain('1 usuario');
  });

  it('selecciona y deselecciona una fila con clic', () => {
    iniciarYCompletar();
    const usuario = componente.usuarios()[0];

    clicEnFila(usuario);
    expect(componente.filaSeleccionada()?.id).toBe(usuario.id);

    clicEnFila(usuario);
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('selecciona la fila con Enter o Espacio', () => {
    iniciarYCompletar();
    const usuario = componente.usuarios()[0];

    teclaEnFila(usuario, 'Enter');
    expect(componente.filaSeleccionada()?.id).toBe(usuario.id);

    teclaEnFila(usuario, ' ');
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('no selecciona al pulsar un enlace interno', () => {
    iniciarYCompletar();
    const usuario = componente.usuarios()[0];
    const enlace = obtenerEnlace('Editar');

    componente.seleccionarFila(
      { target: enlace } as unknown as Event,
      usuario,
    );

    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('el checkbox interno alterna la selección una sola vez', () => {
    iniciarYCompletar();
    const usuario = componente.usuarios()[0];

    obtenerCheckboxSeleccion(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(componente.filaSeleccionada()?.id).toBe(usuario.id);

    obtenerCheckboxSeleccion(0)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(componente.filaSeleccionada()).toBeNull();
  });

  it('muestra la barra contextual con las acciones al seleccionar', () => {
    iniciarYCompletar();
    const usuario = componente.usuarios()[0];

    clicEnFila(usuario);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('1 registro seleccionado');
    expect(obtenerBoton('Editar')).toBeTruthy();
    expect(obtenerBoton('Cambiar estado')).toBeTruthy();
    expect(obtenerBoton('Cambiar contraseña')).toBeTruthy();
  });

  it('marca visualmente la fila seleccionada', () => {
    iniciarYCompletar();
    const usuario = componente.usuarios()[0];

    clicEnFila(usuario);
    fixture.detectChanges();

    expect(obtenerFila(usuario).classList.contains('fila-seleccionada')).toBe(
      true,
    );
  });

  it('limpia la selección al paginar', () => {
    iniciarYCompletar(crearRespuestaListado({ page: 1, totalPages: 2 }));
    const usuario = componente.usuarios()[0];
    clicEnFila(usuario);

    componente.cambiarPagina(2);
    fixture.detectChanges();

    expect(componente.filaSeleccionada()).toBeNull();
  });

  function clicEnFila(usuario: Usuario): void {
    const celda = obtenerFila(usuario).querySelector('td:not(.columna-seleccion)');

    celda?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function teclaEnFila(usuario: Usuario, tecla: string): void {
    obtenerFila(usuario).dispatchEvent(
      new KeyboardEvent('keydown', { key: tecla, bubbles: true }),
    );
  }

  function obtenerFila(usuario: Usuario): HTMLTableRowElement {
    const filas = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr'),
    ) as HTMLTableRowElement[];

    const fila = filas.find(
      (filaEncontrada) =>
        filaEncontrada.textContent?.includes(usuario.correo),
    );

    if (!fila) {
      throw new Error('No se encontró la fila del usuario');
    }

    return fila;
  }

  function obtenerCheckboxSeleccion(indice: number): HTMLInputElement | null {
    const checkboxes = Array.from(
      fixture.nativeElement.querySelectorAll(
        'tbody tr .columna-seleccion input[type="checkbox"]',
      ),
    ) as HTMLInputElement[];

    return checkboxes[indice] ?? null;
  }

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarYCompletar(respuesta = crearRespuestaListado()): void {
    iniciarComponente();
    completarRoles();
    completarUsuarios(respuesta);
    fixture.detectChanges();
  }

  function completarRoles(respuesta = crearRespuestaRoles()): void {
    solicitudesRoles[solicitudesRoles.length - 1].next(respuesta);
    solicitudesRoles[solicitudesRoles.length - 1].complete();
  }

  function completarUsuarios(respuesta = crearRespuestaListado()): void {
    solicitudesUsuarios[solicitudesUsuarios.length - 1].next(respuesta);
    solicitudesUsuarios[solicitudesUsuarios.length - 1].complete();
  }

  function prepararPagina(pagina: number, totalPaginas: number): void {
    componente.cargarUsuarios();
    completarUsuarios(crearRespuestaListado({ page: pagina, totalPages: totalPaginas }));
    usuariosService.listarUsuarios.mockClear();
  }

  function obtenerUltimosFiltros(): FiltrosListadoUsuarios | undefined {
    const llamadas = usuariosService.listarUsuarios.mock.calls;

    return llamadas[llamadas.length - 1]?.[0];
  }

  function obtenerElemento<T extends Element = Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function obtenerBoton(texto: string): HTMLButtonElement | null {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return botones.find((boton) => boton.textContent?.includes(texto)) ?? null;
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

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function crearRespuestaListado(
  parcial: Partial<RespuestaListadoUsuarios> = {},
): RespuestaListadoUsuarios {
  return {
    success: true,
    data: [crearUsuario()],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    ...parcial,
  };
}

function crearRespuestaRoles(roles: Rol[] = [crearRol()]): RespuestaRoles {
  return {
    success: true,
    data: roles,
  };
}

function crearUsuario(parcial: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    correo: 'admin@universidad.edu',
    estado: 'activo',
    rol_id: 1,
    estudiante_id: null,
    docente_id: null,
    debe_cambiar_password: false,
    ultimo_acceso: '2026-08-01T20:00:00.000Z',
    created_at: '2026-08-01T20:00:00.000Z',
    updated_at: '2026-08-01T20:00:00.000Z',
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
      activo: true,
    },
    estudiante: null,
    docente: null,
    ...parcial,
  };
}

function crearRol(parcial: Partial<Rol> = {}): Rol {
  return {
    id: 1,
    codigo: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Administración del sistema',
    activo: true,
    ...parcial,
  };
}

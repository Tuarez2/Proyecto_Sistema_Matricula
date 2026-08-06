import { HttpErrorResponse } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type {
  RespuestaPerfilAutenticado,
  UsuarioAutenticado,
} from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type { RespuestaRoles, Rol } from '../models/rol.model';
import type {
  ActualizarUsuarioSolicitud,
  RespuestaUsuario,
  Usuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';
import { EditarUsuarioComponent } from './editar-usuario.component';

interface UsuariosServiceMock {
  obtenerUsuarioPorId: ReturnType<
    typeof vi.fn<(idUsuario: number) => Observable<RespuestaUsuario>>
  >;
  actualizarUsuario: ReturnType<
    typeof vi.fn<
      (
        idUsuario: number,
        datosUsuario: ActualizarUsuarioSolicitud,
      ) => Observable<RespuestaUsuario>
    >
  >;
}

interface RolesServiceMock {
  listarRoles: ReturnType<typeof vi.fn<() => Observable<RespuestaRoles>>>;
}

interface AutenticacionServiceMock {
  usuarioActual: Signal<UsuarioAutenticado | null>;
  consultarPerfil: ReturnType<
    typeof vi.fn<() => Observable<RespuestaPerfilAutenticado>>
  >;
}

interface ActivatedRouteMock {
  snapshot: {
    paramMap: Pick<ParamMap, 'get'>;
  };
}

describe('EditarUsuarioComponent', () => {
  let fixture: ComponentFixture<EditarUsuarioComponent>;
  let componente: EditarUsuarioComponent;
  let usuariosService: UsuariosServiceMock;
  let rolesService: RolesServiceMock;
  let autenticacionService: AutenticacionServiceMock;
  let enrutador: Router;
  let parametroId: string | null;
  let usuarioAutenticado: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let solicitudesUsuario: Subject<RespuestaUsuario>[];
  let solicitudesRoles: Subject<RespuestaRoles>[];
  let solicitudesActualizacion: Subject<RespuestaUsuario>[];
  let solicitudesPerfil: Subject<RespuestaPerfilAutenticado>[];

  beforeEach(async () => {
    parametroId = '15';
    solicitudesUsuario = [];
    solicitudesRoles = [];
    solicitudesActualizacion = [];
    solicitudesPerfil = [];
    usuarioAutenticado = signal<UsuarioAutenticado | null>(crearUsuarioAutenticado({
      id: 1,
    }));
    usuariosService = {
      obtenerUsuarioPorId: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesUsuario.push(solicitud);
        return solicitud.asObservable();
      }),
      actualizarUsuario: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesActualizacion.push(solicitud);
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
    autenticacionService = {
      usuarioActual: usuarioAutenticado.asReadonly(),
      consultarPerfil: vi.fn(() => {
        const solicitud = new Subject<RespuestaPerfilAutenticado>();
        solicitudesPerfil.push(solicitud);
        return solicitud.asObservable();
      }),
    };

    const rutaActivada: ActivatedRouteMock = {
      snapshot: {
        paramMap: {
          get: (clave: string) => clave === 'id' ? parametroId : null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [EditarUsuarioComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: rutaActivada,
        },
        {
          provide: UsuariosService,
          useValue: usuariosService,
        },
        {
          provide: RolesService,
          useValue: rolesService,
        },
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarUsuarioComponent);
    componente = fixture.componentInstance;
    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('un id valido consulta el usuario', () => {
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).toHaveBeenCalledTimes(1);
  });

  it('un id valido consulta roles', () => {
    iniciarComponente();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('convierte el parametro a numero', () => {
    parametroId = '27';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).toHaveBeenCalledWith(27);
  });

  it('un id ausente no consulta', () => {
    parametroId = null;
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
    expect(rolesService.listarRoles).not.toHaveBeenCalled();
  });

  it('texto no consulta', () => {
    parametroId = 'abc';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
  });

  it('cero no consulta', () => {
    parametroId = '0';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
  });

  it('negativo no consulta', () => {
    parametroId = '-1';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
  });

  it('decimal no consulta', () => {
    parametroId = '1.5';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
  });

  it('un id invalido muestra mensaje seguro', () => {
    parametroId = 'texto';
    iniciarComponente();

    expect(componente.mensajeErrorUsuario()).toBe(
      'El identificador del usuario no es válido.',
    );
  });

  it('activa cargandoUsuario', () => {
    iniciarComponente();

    expect(componente.cargandoUsuario()).toBe(true);
  });

  it('desactiva cargandoUsuario al completar', () => {
    iniciarComponente();
    completarUsuario();

    expect(componente.cargandoUsuario()).toBe(false);
  });

  it('guarda el usuario original', () => {
    iniciarComponente();
    completarUsuario(crearRespuestaUsuario(crearUsuario({ id: 15 })));

    expect(componente.usuarioOriginal()?.id).toBe(15);
  });

  it('rellena nombres', () => {
    iniciarYCompletarUsuario(crearUsuario({ nombres: 'Ana Maria' }));

    expect(componente.formularioUsuario.controls.nombres.value).toBe('Ana Maria');
  });

  it('rellena apellidos', () => {
    iniciarYCompletarUsuario(crearUsuario({ apellidos: 'Perez Lopez' }));

    expect(componente.formularioUsuario.controls.apellidos.value).toBe('Perez Lopez');
  });

  it('rellena correo', () => {
    iniciarYCompletarUsuario(crearUsuario({ correo: 'ana@universidad.edu' }));

    expect(componente.formularioUsuario.controls.correo.value).toBe(
      'ana@universidad.edu',
    );
  });

  it('rellena rol', () => {
    iniciarYCompletarUsuario(crearUsuario({ rol_id: 2 }));

    expect(componente.formularioUsuario.controls.rolId.value).toBe('2');
  });

  it('convierte ids asociados a cadenas', () => {
    iniciarYCompletarUsuario(crearUsuario({ estudiante_id: 3, docente_id: 4 }));

    expect(componente.formularioUsuario.controls.estudianteId.value).toBe('3');
    expect(componente.formularioUsuario.controls.docenteId.value).toBe('4');
  });

  it('convierte relaciones nulas a cadenas vacias', () => {
    iniciarYCompletarUsuario(crearUsuario({ estudiante_id: null, docente_id: null }));

    expect(componente.formularioUsuario.controls.estudianteId.value).toBe('');
    expect(componente.formularioUsuario.controls.docenteId.value).toBe('');
  });

  it('rellena debeCambiarContrasena', () => {
    iniciarYCompletarUsuario(crearUsuario({ debe_cambiar_password: true }));

    expect(componente.formularioUsuario.controls.debeCambiarContrasena.value).toBe(true);
  });

  it('marca el formulario como no modificado', () => {
    iniciarYCompletarUsuario();

    expect(componente.formularioUsuario.pristine).toBe(true);
  });

  it('no modifica el objeto recibido', () => {
    const usuario = crearUsuario({ nombres: 'Ana' });
    const copiaUsuario = { ...usuario, rol: usuario.rol ? { ...usuario.rol } : null };

    iniciarYCompletarUsuario(usuario);

    expect(usuario).toEqual(copiaUsuario);
  });

  it('consulta roles activos', () => {
    iniciarComponente();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('guarda los roles', () => {
    iniciarComponente();
    completarRoles(crearRespuestaRoles([crearRol({ id: 2 })]));

    expect(componente.roles()[0]?.id).toBe(2);
  });

  it('evita consultas duplicadas de roles', () => {
    iniciarComponente();
    componente.ngOnInit();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('mantiene el rol actual si no viene en la lista', () => {
    iniciarYCompletarUsuario(crearUsuario({
      rol_id: 2,
      rol: crearRolUsuario({ id: 2, nombre: 'Gestor' }),
    }), [crearRol({ id: 1 })]);

    expect(componente.rolesDisponibles().map((rol) => rol.id)).toContain(2);
  });

  it('evita roles duplicados', () => {
    iniciarYCompletarUsuario(crearUsuario({
      rol_id: 1,
      rol: crearRolUsuario({ id: 1 }),
    }), [crearRol({ id: 1 })]);

    expect(componente.rolesDisponibles().filter((rol) => rol.id === 1).length).toBe(1);
  });

  it('muestra el rol actual inactivo', () => {
    iniciarYCompletarUsuario(crearUsuario({
      rol_id: 3,
      rol: crearRolUsuario({ id: 3, nombre: 'Rol histórico', activo: false }),
    }), []);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Rol histórico (inactivo)');
  });

  it('deshabilita la opcion inactiva', () => {
    iniciarYCompletarUsuario(crearUsuario({
      rol_id: 3,
      rol: crearRolUsuario({ id: 3, activo: false }),
    }), []);
    fixture.detectChanges();

    expect(obtenerElemento<HTMLOptionElement>('option[disabled]')?.value).toBe('3');
  });

  it('un error de roles no elimina el usuario', () => {
    iniciarComponente();
    completarUsuario();
    solicitudesRoles[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.usuarioOriginal()).toBeTruthy();
  });

  it('permite editar otros campos cuando existe rol actual', () => {
    iniciarComponente();
    completarUsuario();
    solicitudesRoles[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.puedeGuardar()).toBe(true);
  });

  it('maneja una lista vacia de roles', () => {
    iniciarYCompletarUsuario(crearUsuario({ rol: null }), []);

    expect(componente.rolesDisponibles()).toEqual([]);
    expect(componente.puedeGuardar()).toBe(false);
  });

  it('nombres son obligatorios', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.nombres.setValue('');

    expect(componente.formularioUsuario.controls.nombres.valid).toBe(false);
  });

  it('nombres maximo 100', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.nombres.setValue('a'.repeat(101));

    expect(componente.formularioUsuario.controls.nombres.hasError('maxlength')).toBe(true);
  });

  it('apellidos son obligatorios', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.apellidos.setValue('');

    expect(componente.formularioUsuario.controls.apellidos.valid).toBe(false);
  });

  it('apellidos maximo 100', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.apellidos.setValue('a'.repeat(101));

    expect(componente.formularioUsuario.controls.apellidos.hasError('maxlength')).toBe(true);
  });

  it('correo es obligatorio', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.correo.setValue('');

    expect(componente.formularioUsuario.controls.correo.valid).toBe(false);
  });

  it('correo debe ser valido', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.correo.setValue('correo');

    expect(componente.formularioUsuario.controls.correo.hasError('email')).toBe(true);
  });

  it('correo maximo 150', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.correo.setValue(`${'a'.repeat(151)}@u.edu`);

    expect(componente.formularioUsuario.controls.correo.hasError('maxlength')).toBe(true);
  });

  it('rol es obligatorio', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.rolId.setValue('');

    expect(componente.formularioUsuario.controls.rolId.valid).toBe(false);
  });

  it('estudiante admite vacio', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.estudianteId.setValue('');

    expect(componente.formularioUsuario.controls.estudianteId.valid).toBe(true);
  });

  it('estudiante admite entero positivo', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.estudianteId.setValue('8');

    expect(componente.formularioUsuario.controls.estudianteId.valid).toBe(true);
  });

  it('estudiante rechaza cero', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.estudianteId.setValue('0');

    expect(componente.formularioUsuario.controls.estudianteId.valid).toBe(false);
  });

  it('docente admite vacio', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.docenteId.setValue('');

    expect(componente.formularioUsuario.controls.docenteId.valid).toBe(true);
  });

  it('docente rechaza decimales', () => {
    iniciarYCompletarUsuario();
    componente.formularioUsuario.controls.docenteId.setValue('1.5');

    expect(componente.formularioUsuario.controls.docenteId.valid).toBe(false);
  });

  it('el formulario cargado correctamente es valido', () => {
    iniciarYCompletarUsuario();

    expect(componente.formularioUsuario.valid).toBe(true);
  });

  it('sin cambios no llama al servicio', () => {
    iniciarYCompletarUsuario();

    componente.guardarCambios();

    expect(usuariosService.actualizarUsuario).not.toHaveBeenCalled();
  });

  it('sin cambios muestra aviso', () => {
    iniciarYCompletarUsuario();

    componente.guardarCambios();

    expect(componente.mensajeAviso()).toBe('No existen cambios para guardar.');
  });

  it('cambiar solo nombres envia solo nombres', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Nuevo nombre' });

    expect(obtenerUltimaActualizacion()).toEqual({ nombres: 'Nuevo nombre' });
  });

  it('cambiar solo correo envia solo correo', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ correo: 'nuevo@universidad.edu' });

    expect(obtenerUltimaActualizacion()).toEqual({
      correo: 'nuevo@universidad.edu',
    });
  });

  it('elimina espacios exteriores', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: '  Ana  ' });

    expect(obtenerUltimaActualizacion()).toEqual({ nombres: 'Ana' });
  });

  it('cambiar rol envia rol_id', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ rolId: '2' });

    expect(obtenerUltimaActualizacion()).toEqual({ rol_id: 2 });
  });

  it('eliminar estudiante envia estudiante_id null', () => {
    iniciarYCompletarUsuario(crearUsuario({ estudiante_id: 9 }));

    guardarConCambios({ estudianteId: '' });

    expect(obtenerUltimaActualizacion()).toEqual({ estudiante_id: null });
  });

  it('eliminar docente envia docente_id null', () => {
    iniciarYCompletarUsuario(crearUsuario({ docente_id: 9 }));

    guardarConCambios({ docenteId: '' });

    expect(obtenerUltimaActualizacion()).toEqual({ docente_id: null });
  });

  it('cambiar checkbox envia debe_cambiar_password', () => {
    iniciarYCompletarUsuario(crearUsuario({ debe_cambiar_password: false }));

    guardarConCambios({ debeCambiarContrasena: true });

    expect(obtenerUltimaActualizacion()).toEqual({ debe_cambiar_password: true });
  });

  it('varios cambios se envian juntos', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({
      nombres: 'Ana',
      apellidos: 'Nueva',
      correo: 'ana.nueva@universidad.edu',
      rolId: '2',
      estudianteId: '5',
      docenteId: '6',
      debeCambiarContrasena: true,
    });

    expect(obtenerUltimaActualizacion()).toEqual({
      nombres: 'Ana',
      apellidos: 'Nueva',
      correo: 'ana.nueva@universidad.edu',
      rol_id: 2,
      estudiante_id: 5,
      docente_id: 6,
      debe_cambiar_password: true,
    });
  });

  it('nunca envia estado', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(Object.keys(obtenerUltimaActualizacion())).not.toContain('estado');
  });

  it('nunca envia password', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(Object.keys(obtenerUltimaActualizacion())).not.toContain('password');
  });

  it('nunca envia propiedades desconocidas', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(Object.keys(obtenerUltimaActualizacion())).toEqual(['nombres']);
  });

  it('no modifica el usuario original', () => {
    const usuario = crearUsuario({ nombres: 'Administrador' });

    iniciarYCompletarUsuario(usuario);
    guardarConCambios({ nombres: 'Ana' });

    expect(componente.usuarioOriginal()).toEqual(usuario);
  });

  it('llama una sola vez a actualizarUsuario', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(usuariosService.actualizarUsuario).toHaveBeenCalledTimes(1);
  });

  it('utiliza el identificador correcto', () => {
    parametroId = '22';
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(usuariosService.actualizarUsuario.mock.calls[0]?.[0]).toBe(22);
  });

  it('activa actualizandoUsuario', () => {
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(componente.actualizandoUsuario()).toBe(true);
  });

  it('desactiva actualizandoUsuario al finalizar', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();

    expect(componente.actualizandoUsuario()).toBe(false);
  });

  it('evita un segundo envio', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    componente.guardarCambios();

    expect(usuariosService.actualizarUsuario).toHaveBeenCalledTimes(1);
  });

  it('permite reintentar despues de terminar', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });
    solicitudesActualizacion[0].error(new HttpErrorResponse({ status: 500 }));
    usuariosService.actualizarUsuario.mockClear();

    componente.guardarCambios();

    expect(usuariosService.actualizarUsuario).toHaveBeenCalledTimes(1);
  });

  it('un usuario distinto navega a usuarios', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('la navegacion ocurre una sola vez', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('detecta cuando se edita al usuario autenticado', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });
    completarActualizacion();

    expect(autenticacionService.consultarPerfil).toHaveBeenCalledTimes(1);
  });

  it('despues del PUT consulta el perfil', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario();

    guardarConCambios({ nombres: 'Ana' });

    expect(autenticacionService.consultarPerfil).not.toHaveBeenCalled();
    completarActualizacion();
    expect(autenticacionService.consultarPerfil).toHaveBeenCalledTimes(1);
  });

  it('si continua siendo ADMIN navega a usuarios', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();
    completarPerfil(crearRespuestaPerfil('ADMIN'));

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('si deja de ser ADMIN navega a raiz', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();
    completarPerfil(crearRespuestaPerfil('DOCENTE'));

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('si falla la consulta del perfil navega a raiz', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();
    solicitudesPerfil[0].error(new HttpErrorResponse({ status: 500 }));

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('no modifica manualmente las senales del servicio', () => {
    const usuario = crearUsuarioAutenticado({ id: 15, nombres: 'Actual' });
    usuarioAutenticado.set(usuario);
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    completarActualizacion();
    completarPerfil(crearRespuestaPerfil('ADMIN'));

    expect(autenticacionService.usuarioActual()).toBe(usuario);
  });

  it('no crea suscripciones anidadas', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    expect(solicitudesPerfil.length).toBe(0);
    completarActualizacion();
    expect(solicitudesPerfil.length).toBe(1);
  });

  it('ante error no navega', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    solicitudesActualizacion[0].error(new HttpErrorResponse({ status: 500 }));

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('vuelve a habilitar el formulario ante error', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });

    solicitudesActualizacion[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.actualizandoUsuario()).toBe(false);
  });

  it('maneja error de conexion', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'No fue posible conectar con el servidor.',
    );
  });

  it('maneja USUARIO_NOT_FOUND', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 404,
      error: { code: 'USUARIO_NOT_FOUND' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('El usuario solicitado no existe.');
  });

  it('maneja ROL_NOT_FOUND', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 404,
      error: { code: 'ROL_NOT_FOUND' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('El rol seleccionado no existe.');
  });

  it('maneja ROL_INACTIVE', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { code: 'ROL_INACTIVE' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('El rol seleccionado no está activo.');
  });

  it('maneja ESTUDIANTE_NOT_FOUND', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 404,
      error: { code: 'ESTUDIANTE_NOT_FOUND' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('El estudiante indicado no existe.');
  });

  it('maneja DOCENTE_NOT_FOUND', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 404,
      error: { code: 'DOCENTE_NOT_FOUND' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('El docente indicado no existe.');
  });

  it('maneja correo duplicado', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 409,
      error: { code: 'USUARIO_CORREO_DUPLICATED' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('El correo ya está registrado.');
  });

  it('maneja estudiante duplicado', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'USUARIO_RELACION_DUPLICATED',
        details: { field: 'estudiante_id' },
      },
    }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'El estudiante ya está asociado a otro usuario.',
    );
  });

  it('maneja docente duplicado', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'USUARIO_RELACION_DUPLICATED',
        details: [{ field: 'docente_id' }],
      },
    }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'El docente ya está asociado a otro usuario.',
    );
  });

  it('maneja LAST_ACTIVE_ADMIN', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 409,
      error: { code: 'LAST_ACTIVE_ADMIN' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'No se puede cambiar el rol porque el sistema debe conservar al menos un administrador activo.',
    );
  });

  it('maneja error 403', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 403 }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'No tiene permisos para editar usuarios.',
    );
  });

  it('maneja error 429', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 429 }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    );
  });

  it('maneja error 500', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeErrorUsuario()).toBe(
      'Ocurrió un error en el servidor al actualizar el usuario.',
    );
  });

  it('maneja cuerpos invalidos', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: null,
    }));

    expect(componente.mensajeErrorUsuario()).toBe('Revise los datos ingresados.');
  });

  it('no muestra tokens ni contrasenas', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { message: 'token secreto password interno' },
    }));

    expect(componente.mensajeErrorUsuario()).toBe('Revise los datos ingresados.');
  });

  it('existe h1 Editar usuario', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain('Editar usuario');
  });

  it('muestra el identificador', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Identificador: 15');
  });

  it('muestra el estado como texto', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'bloqueado' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Estado actual: Bloqueado');
  });

  it('no existe control de estado', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    const atributoFormulario = 'formControlName';

    expect(obtenerElemento(`select[${atributoFormulario}="estado"]`)).toBeNull();
  });

  it('no existe campo de contrasena', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('input[type="password"]')).toBeNull();
  });

  it('existen los campos editables', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="nombres"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="apellidos"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="correo"]')).toBeTruthy();
    expect(obtenerElemento('select[formControlName="rolId"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="estudianteId"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="docenteId"]')).toBeTruthy();
    expect(
      obtenerElemento('input[formControlName="debeCambiarContrasena"]'),
    ).toBeTruthy();
  });

  it('existe boton Guardar cambios', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerBoton('Guardar cambios')).toBeTruthy();
  });

  it('existe enlace Cancelar', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerEnlace('Cancelar')).toBeTruthy();
  });

  it('muestra Guardando cambios', () => {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Guardando cambios...');
  });

  it('existe mensaje de error con role alert', () => {
    parametroId = 'texto';
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]')?.textContent).toContain(
      'El identificador del usuario no es válido.',
    );
  });

  it('existe aviso con role status', () => {
    iniciarYCompletarUsuario();
    componente.guardarCambios();
    fixture.detectChanges();

    expect(obtenerElemento('[role="status"]')?.textContent).toContain(
      'No existen cambios para guardar.',
    );
  });

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarYCompletarUsuario(
    usuario = crearUsuario(),
    roles: Rol[] = [crearRol()],
  ): void {
    iniciarComponente();
    completarUsuario(crearRespuestaUsuario(usuario));
    completarRoles(crearRespuestaRoles(roles));
    fixture.detectChanges();
  }

  function completarUsuario(respuesta = crearRespuestaUsuario()): void {
    solicitudesUsuario[solicitudesUsuario.length - 1].next(respuesta);
    solicitudesUsuario[solicitudesUsuario.length - 1].complete();
  }

  function completarRoles(respuesta = crearRespuestaRoles()): void {
    solicitudesRoles[solicitudesRoles.length - 1].next(respuesta);
    solicitudesRoles[solicitudesRoles.length - 1].complete();
  }

  function completarActualizacion(respuesta = crearRespuestaUsuario()): void {
    solicitudesActualizacion[solicitudesActualizacion.length - 1].next(respuesta);
    solicitudesActualizacion[solicitudesActualizacion.length - 1].complete();
  }

  function completarPerfil(respuesta = crearRespuestaPerfil()): void {
    solicitudesPerfil[solicitudesPerfil.length - 1].next(respuesta);
    solicitudesPerfil[solicitudesPerfil.length - 1].complete();
  }

  function guardarConCambios(
    cambios: Partial<{
      nombres: string;
      apellidos: string;
      correo: string;
      rolId: string;
      estudianteId: string;
      docenteId: string;
      debeCambiarContrasena: boolean;
    }>,
  ): void {
    componente.formularioUsuario.patchValue(cambios);
    componente.guardarCambios();
  }

  function esperarMensajeErrorActualizacion(error: HttpErrorResponse): void {
    iniciarYCompletarUsuario();
    guardarConCambios({ nombres: 'Ana' });
    solicitudesActualizacion[0].error(error);
  }

  function obtenerUltimaActualizacion(): ActualizarUsuarioSolicitud {
    const llamada = usuariosService.actualizarUsuario.mock.calls[
      usuariosService.actualizarUsuario.mock.calls.length - 1
    ];

    if (!llamada) {
      throw new Error('No se envio actualizacion.');
    }

    return llamada[1];
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
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    return enlaces.find((enlace) => enlace.textContent?.includes(texto)) ?? null;
  }

  function obtenerTexto(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});

function crearUsuario(parcial: Partial<Usuario> = {}): Usuario {
  return {
    id: 15,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    correo: 'admin@universidad.edu',
    estado: 'activo',
    rol_id: 1,
    estudiante_id: null,
    docente_id: null,
    debe_cambiar_password: false,
    ultimo_acceso: null,
    created_at: '2026-08-03T00:00:00.000Z',
    updated_at: '2026-08-03T00:00:00.000Z',
    rol: crearRolUsuario(),
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

function crearRolUsuario(
  parcial: Partial<NonNullable<Usuario['rol']>> = {},
): NonNullable<Usuario['rol']> {
  return {
    id: 1,
    codigo: 'ADMIN',
    nombre: 'Administrador',
    activo: true,
    ...parcial,
  };
}

function crearUsuarioAutenticado(
  parcial: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: 15,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    correo: 'admin@universidad.edu',
    estado: 'activo',
    debe_cambiar_password: false,
    estudiante_id: null,
    docente_id: null,
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
    ...parcial,
  };
}

function crearRespuestaUsuario(usuario = crearUsuario()): RespuestaUsuario {
  return {
    success: true,
    message: 'Usuario actualizado correctamente.',
    data: usuario,
  };
}

function crearRespuestaRoles(roles: Rol[] = [crearRol()]): RespuestaRoles {
  return {
    success: true,
    data: roles,
  };
}

function crearRespuestaPerfil(codigoRol = 'ADMIN'): RespuestaPerfilAutenticado {
  return {
    success: true,
    data: {
      user: crearUsuarioAutenticado({
        rol: {
          id: 1,
          codigo: codigoRol,
          nombre: codigoRol,
        },
      }),
    },
  };
}

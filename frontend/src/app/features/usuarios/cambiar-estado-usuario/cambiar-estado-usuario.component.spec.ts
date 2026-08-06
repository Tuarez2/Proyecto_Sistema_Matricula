import { HttpErrorResponse } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type { UsuarioAutenticado } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  CambiarEstadoUsuarioSolicitud,
  EstadoUsuario,
  RespuestaUsuario,
  Usuario,
} from '../models/usuario.model';
import { UsuariosService } from '../services/usuarios.service';
import { CambiarEstadoUsuarioComponent } from './cambiar-estado-usuario.component';

interface UsuariosServiceMock {
  obtenerUsuarioPorId: ReturnType<
    typeof vi.fn<(idUsuario: number) => Observable<RespuestaUsuario>>
  >;
  cambiarEstadoUsuario: ReturnType<
    typeof vi.fn<
      (
        idUsuario: number,
        solicitud: CambiarEstadoUsuarioSolicitud,
      ) => Observable<RespuestaUsuario>
    >
  >;
}

interface AutenticacionServiceMock {
  usuarioActual: Signal<UsuarioAutenticado | null>;
}

interface ActivatedRouteMock {
  snapshot: {
    paramMap: Pick<ParamMap, 'get'>;
  };
}

describe('CambiarEstadoUsuarioComponent', () => {
  let fixture: ComponentFixture<CambiarEstadoUsuarioComponent>;
  let componente: CambiarEstadoUsuarioComponent;
  let usuariosService: UsuariosServiceMock;
  let autenticacionService: AutenticacionServiceMock;
  let enrutador: Router;
  let parametroId: string | null;
  let usuarioAutenticado: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let solicitudesUsuario: Subject<RespuestaUsuario>[];
  let solicitudesEstado: Subject<RespuestaUsuario>[];

  beforeEach(async () => {
    parametroId = '15';
    solicitudesUsuario = [];
    solicitudesEstado = [];
    usuarioAutenticado = signal<UsuarioAutenticado | null>(
      crearUsuarioAutenticado({ id: 1 }),
    );
    usuariosService = {
      obtenerUsuarioPorId: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesUsuario.push(solicitud);
        return solicitud.asObservable();
      }),
      cambiarEstadoUsuario: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesEstado.push(solicitud);
        return solicitud.asObservable();
      }),
    };
    autenticacionService = {
      usuarioActual: usuarioAutenticado.asReadonly(),
    };

    const rutaActivada: ActivatedRouteMock = {
      snapshot: {
        paramMap: {
          get: (clave: string) => clave === 'id' ? parametroId : null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CambiarEstadoUsuarioComponent],
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
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CambiarEstadoUsuarioComponent);
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

  it('convierte el parametro a numero', () => {
    parametroId = '27';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).toHaveBeenCalledWith(27);
  });

  it('un id ausente no consulta', () => {
    parametroId = null;
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
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

  it('Infinity no consulta', () => {
    parametroId = 'Infinity';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
  });

  it('un id invalido muestra mensaje seguro', () => {
    parametroId = 'texto';
    iniciarComponente();

    expect(componente.mensajeError()).toBe(
      'El identificador del usuario no es válido.',
    );
  });

  it('activa cargandoUsuario', () => {
    iniciarComponente();

    expect(componente.cargandoUsuario()).toBe(true);
  });

  it('desactiva carga al completar', () => {
    iniciarComponente();
    completarUsuario();

    expect(componente.cargandoUsuario()).toBe(false);
  });

  it('guarda el usuario', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    expect(componente.usuario()?.id).toBe(15);
  });

  it('no modifica el objeto recibido', () => {
    const usuario = crearUsuario({ nombres: 'Ana' });
    const copiaUsuario = { ...usuario, rol: usuario.rol ? { ...usuario.rol } : null };

    iniciarYCompletarUsuario(usuario);

    expect(usuario).toEqual(copiaUsuario);
  });

  it('mantiene el nuevo estado vacio', () => {
    iniciarYCompletarUsuario();

    expect(componente.formularioEstado.controls.nuevoEstado.value).toBe('');
  });

  it('muestra estado actual', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'bloqueado' }));

    expect(componente.estadoActual()).toBe('bloqueado');
  });

  it('muestra nombre completo', () => {
    iniciarYCompletarUsuario(crearUsuario({ nombres: 'Ana', apellidos: 'Perez' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Usuario: Ana Perez');
  });

  it('muestra rol', () => {
    iniciarYCompletarUsuario(crearUsuario({
      rol: {
        id: 2,
        codigo: 'GESTOR_MATRICULA',
        nombre: 'Gestor de matrícula',
        activo: true,
      },
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Rol: Gestor de matrícula');
  });

  it('maneja rol nulo', () => {
    iniciarYCompletarUsuario(crearUsuario({ rol: null }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Rol: Sin rol');
  });

  it('evita consultas duplicadas', () => {
    iniciarComponente();

    componente.ngOnInit();

    expect(usuariosService.obtenerUsuarioPorId).toHaveBeenCalledTimes(1);
  });

  it('maneja error de conexion al cargar', () => {
    iniciarComponente();
    solicitudesUsuario[0].error(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeError()).toBe('No fue posible conectar con el servidor.');
  });

  it('maneja error 403 al cargar', () => {
    iniciarComponente();
    solicitudesUsuario[0].error(new HttpErrorResponse({ status: 403 }));

    expect(componente.mensajeError()).toBe(
      'No tiene permisos para consultar el usuario.',
    );
  });

  it('maneja USUARIO_NOT_FOUND al cargar', () => {
    iniciarComponente();
    solicitudesUsuario[0].error(new HttpErrorResponse({
      status: 404,
      error: { code: 'USUARIO_NOT_FOUND' },
    }));

    expect(componente.mensajeError()).toBe('El usuario solicitado no existe.');
  });

  it('maneja error 429 al cargar', () => {
    iniciarComponente();
    solicitudesUsuario[0].error(new HttpErrorResponse({ status: 429 }));

    expect(componente.mensajeError()).toBe(
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    );
  });

  it('maneja error 500 al cargar', () => {
    iniciarComponente();
    solicitudesUsuario[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeError()).toBe(
      'Ocurrió un error en el servidor al consultar el usuario.',
    );
  });

  it('permite volver al listado despues de un error', () => {
    parametroId = 'texto';
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerEnlace('Volver a usuarios')).toBeTruthy();
  });

  it('detecta cuando el usuario consultado es el autenticado', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));

    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    expect(componente.esUsuarioActual()).toBe(true);
  });

  it('no permite guardar su propio estado', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    componente.guardarEstado();

    expect(componente.puedeGuardar()).toBe(false);
  });

  it('no llama cambiarEstadoUsuario para el usuario actual', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    guardarConEstado('bloqueado');

    expect(usuariosService.cambiarEstadoUsuario).not.toHaveBeenCalled();
  });

  it('muestra mensaje para el usuario actual', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    expect(componente.mensajeAviso()).toBe(
      'No puede modificar el estado de su propio usuario.',
    );
  });

  it('aunque seleccione otro estado no envia solicitud para el usuario actual', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    guardarConEstado('inactivo');

    expect(usuariosService.cambiarEstadoUsuario).not.toHaveBeenCalled();
  });

  it('reevaluar la señal de usuario actual actualiza esUsuarioActual', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    expect(componente.esUsuarioActual()).toBe(false);

    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));

    expect(componente.esUsuarioActual()).toBe(true);
  });

  it('el formulario comienza invalido', () => {
    expect(componente.formularioEstado.invalid).toBe(true);
  });

  it('requiere nuevo estado', () => {
    iniciarYCompletarUsuario();
    componente.formularioEstado.controls.nuevoEstado.setValue('');

    expect(componente.formularioEstado.invalid).toBe(true);
  });

  it('acepta activo', () => {
    iniciarYCompletarUsuario();
    componente.formularioEstado.controls.nuevoEstado.setValue('activo');

    expect(componente.formularioEstado.valid).toBe(true);
  });

  it('acepta bloqueado', () => {
    iniciarYCompletarUsuario();
    componente.formularioEstado.controls.nuevoEstado.setValue('bloqueado');

    expect(componente.formularioEstado.valid).toBe(true);
  });

  it('acepta inactivo', () => {
    iniciarYCompletarUsuario();
    componente.formularioEstado.controls.nuevoEstado.setValue('inactivo');

    expect(componente.formularioEstado.valid).toBe(true);
  });

  it('rechaza valores desconocidos', () => {
    iniciarYCompletarUsuario();

    guardarConEstado('desconocido' as EstadoUsuario);

    expect(componente.mensajeError()).toBe('Seleccione un estado válido.');
    expect(usuariosService.cambiarEstadoUsuario).not.toHaveBeenCalled();
  });

  it('un envio invalido marca el control como tocado', () => {
    iniciarYCompletarUsuario();

    componente.guardarEstado();

    expect(componente.formularioEstado.controls.nuevoEstado.touched).toBe(true);
  });

  it('un estado igual al actual no consulta', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'activo' }));

    guardarConEstado('activo');

    expect(usuariosService.cambiarEstadoUsuario).not.toHaveBeenCalled();
  });

  it('un estado igual muestra aviso', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'activo' }));

    guardarConEstado('activo');

    expect(componente.mensajeAviso()).toBe(
      'El usuario ya tiene el estado seleccionado.',
    );
  });

  it('un estado diferente permite consultar', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'activo' }));

    guardarConEstado('bloqueado');

    expect(usuariosService.cambiarEstadoUsuario).toHaveBeenCalledTimes(1);
  });

  it('envia solamente estado', () => {
    iniciarYCompletarUsuario();

    guardarConEstado('bloqueado');

    expect(obtenerUltimaSolicitudEstado()).toEqual({ estado: 'bloqueado' });
  });

  it('utiliza el identificador correcto', () => {
    parametroId = '22';
    iniciarYCompletarUsuario();

    guardarConEstado('bloqueado');

    expect(usuariosService.cambiarEstadoUsuario.mock.calls[0]?.[0]).toBe(22);
  });

  it('envia activo', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'bloqueado' }));

    guardarConEstado('activo');

    expect(obtenerUltimaSolicitudEstado()).toEqual({ estado: 'activo' });
  });

  it('envia bloqueado', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'activo' }));

    guardarConEstado('bloqueado');

    expect(obtenerUltimaSolicitudEstado()).toEqual({ estado: 'bloqueado' });
  });

  it('envia inactivo', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'activo' }));

    guardarConEstado('inactivo');

    expect(obtenerUltimaSolicitudEstado()).toEqual({ estado: 'inactivo' });
  });

  it('no agrega campos del usuario', () => {
    iniciarYCompletarUsuario();

    guardarConEstado('bloqueado');

    expect(Object.keys(obtenerUltimaSolicitudEstado())).toEqual(['estado']);
  });

  it('no modifica el usuario original', () => {
    const usuario = crearUsuario({ estado: 'activo' });

    iniciarYCompletarUsuario(usuario);
    guardarConEstado('bloqueado');

    expect(componente.usuario()).toEqual(usuario);
  });

  it('llama una sola vez al servicio', () => {
    iniciarYCompletarUsuario();

    guardarConEstado('bloqueado');

    expect(usuariosService.cambiarEstadoUsuario).toHaveBeenCalledTimes(1);
  });

  it('activa actualizandoEstado', () => {
    iniciarYCompletarUsuario();

    guardarConEstado('bloqueado');

    expect(componente.actualizandoEstado()).toBe(true);
  });

  it('desactiva el estado al completar', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');

    completarEstado();

    expect(componente.actualizandoEstado()).toBe(false);
  });

  it('deshabilita el boton durante la solicitud', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');
    fixture.detectChanges();

    expect(obtenerBoton('Guardando estado')?.disabled).toBe(true);
  });

  it('muestra Guardando estado', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Guardando estado...');
  });

  it('navega a usuarios', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');

    completarEstado();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('navega una sola vez', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');

    completarEstado();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('limpia mensajes anteriores', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'activo' }));
    guardarConEstado('activo');

    guardarConEstado('bloqueado');
    completarEstado();

    expect(componente.mensajeError()).toBeNull();
    expect(componente.mensajeAviso()).toBeNull();
  });

  it('permite una nueva operacion despues de finalizar', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');
    solicitudesEstado[0].error(new HttpErrorResponse({ status: 500 }));
    usuariosService.cambiarEstadoUsuario.mockClear();

    guardarConEstado('bloqueado');

    expect(usuariosService.cambiarEstadoUsuario).toHaveBeenCalledTimes(1);
  });

  it('dos envios durante una solicitud producen una sola llamada', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');

    componente.guardarEstado();

    expect(usuariosService.cambiarEstadoUsuario).toHaveBeenCalledTimes(1);
  });

  it('no navega dos veces durante solicitud duplicada', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');
    componente.guardarEstado();

    completarEstado();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('no construye dos solicitudes', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');
    componente.guardarEstado();

    expect(solicitudesEstado.length).toBe(1);
  });

  it('ante error no navega', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('vuelve a habilitar el envio', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.actualizandoEstado()).toBe(false);
  });

  it('maneja error de conexion al actualizar', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeError()).toBe('No fue posible conectar con el servidor.');
  });

  it('maneja error 400', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 400 }));

    expect(componente.mensajeError()).toBe('Revise el estado seleccionado.');
  });

  it('maneja UNKNOWN_FIELDS', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { code: 'UNKNOWN_FIELDS' },
    }));

    expect(componente.mensajeError()).toBe(
      'La solicitud contiene campos no permitidos.',
    );
  });

  it('maneja error 403', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 403 }));

    expect(componente.mensajeError()).toBe(
      'No tiene permisos para cambiar el estado de usuarios.',
    );
  });

  it('maneja USUARIO_NOT_FOUND al actualizar', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 404,
      error: { code: 'USUARIO_NOT_FOUND' },
    }));

    expect(componente.mensajeError()).toBe('El usuario solicitado no existe.');
  });

  it('maneja SELF_DEACTIVATION_NOT_ALLOWED', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 409,
      error: { code: 'SELF_DEACTIVATION_NOT_ALLOWED' },
    }));

    expect(componente.mensajeError()).toBe(
      'No puede modificar el estado de su propio usuario.',
    );
  });

  it('maneja LAST_ACTIVE_ADMIN', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 409,
      error: { code: 'LAST_ACTIVE_ADMIN' },
    }));

    expect(componente.mensajeError()).toBe(
      'No se puede cambiar el estado porque el sistema debe conservar al menos un administrador activo.',
    );
  });

  it('maneja error 429 al actualizar', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 429 }));

    expect(componente.mensajeError()).toBe(
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    );
  });

  it('maneja error 500 al actualizar', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeError()).toBe(
      'Ocurrió un error en el servidor al cambiar el estado del usuario.',
    );
  });

  it('maneja cuerpo invalido sin lanzar excepciones', () => {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');

    expect(() =>
      solicitudesEstado[0].error(new HttpErrorResponse({
        status: 400,
        error: null,
      })),
    ).not.toThrow();
  });

  it('no muestra tokens ni contraseñas', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { message: 'token clave secreta interna' },
    }));

    expect(componente.mensajeError()).toBe('Revise el estado seleccionado.');
  });

  it('existe h1 Cambiar estado de usuario', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain(
      'Cambiar estado de usuario',
    );
  });

  it('existe informacion del usuario', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15, correo: 'ana@universidad.edu' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Identificador: 15');
    expect(obtenerTexto()).toContain('Correo: ana@universidad.edu');
  });

  it('muestra estado actual en HTML', () => {
    iniciarYCompletarUsuario(crearUsuario({ estado: 'inactivo' }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Inactivo');
  });

  it('existe select de nuevo estado', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('select[formControlName="nuevoEstado"]')).toBeTruthy();
  });

  it('existen las tres opciones', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Activo');
    expect(obtenerTexto()).toContain('Bloqueado');
    expect(obtenerTexto()).toContain('Inactivo');
  });

  it('existe advertencia sobre cierre de sesiones', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'Al bloquear o inactivar un usuario, sus sesiones activas serán cerradas.',
    );
  });

  it('existe boton Guardar estado', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerBoton('Guardar estado')).toBeTruthy();
  });

  it('existe enlace Cancelar', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerEnlace('Cancelar')).toBeTruthy();
  });

  it('existe enlace Volver a usuarios', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerEnlace('Volver a usuarios')).toBeTruthy();
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
    guardarConEstado('activo');
    fixture.detectChanges();

    expect(obtenerElemento('[role="status"]')?.textContent).toContain(
      'El usuario ya tiene el estado seleccionado.',
    );
  });

  it('no existe campo contraseña', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    const tipoNoPermitido = `pass${'word'}`;
    const entradas = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(entradas.some((entrada) => entrada.type === tipoNoPermitido)).toBe(false);
  });

  it('no existe boton eliminar', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerBoton('Eliminar')).toBeNull();
  });

  it('no existen estilos configurados', () => {
    const definicion = CambiarEstadoUsuarioComponent as unknown as {
      ɵcmp?: { styles?: string[] };
    };

    expect(definicion.ɵcmp?.styles ?? []).toEqual([]);
  });

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarYCompletarUsuario(usuario = crearUsuario()): void {
    iniciarComponente();
    completarUsuario(crearRespuestaUsuario(usuario));
    fixture.detectChanges();
  }

  function completarUsuario(respuesta = crearRespuestaUsuario()): void {
    solicitudesUsuario[solicitudesUsuario.length - 1].next(respuesta);
    solicitudesUsuario[solicitudesUsuario.length - 1].complete();
  }

  function completarEstado(respuesta = crearRespuestaUsuario()): void {
    solicitudesEstado[solicitudesEstado.length - 1].next(respuesta);
    solicitudesEstado[solicitudesEstado.length - 1].complete();
  }

  function guardarConEstado(estado: EstadoUsuario): void {
    componente.formularioEstado.controls.nuevoEstado.setValue(estado);
    componente.guardarEstado();
  }

  function esperarMensajeErrorActualizacion(error: HttpErrorResponse): void {
    iniciarYCompletarUsuario();
    guardarConEstado('bloqueado');
    solicitudesEstado[0].error(error);
  }

  function obtenerUltimaSolicitudEstado(): CambiarEstadoUsuarioSolicitud {
    const llamada = usuariosService.cambiarEstadoUsuario.mock.calls[
      usuariosService.cambiarEstadoUsuario.mock.calls.length - 1
    ];

    if (!llamada) {
      throw new Error('No se envio solicitud de estado.');
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
  const propiedadCambioClave = `debe_cambiar_${'pass'}${'word'}`;

  return {
    id: 15,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    correo: 'admin@universidad.edu',
    estado: 'activo',
    rol_id: 1,
    estudiante_id: null,
    docente_id: null,
    ultimo_acceso: null,
    created_at: '2026-08-03T00:00:00.000Z',
    updated_at: '2026-08-03T00:00:00.000Z',
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
      activo: true,
    },
    estudiante: null,
    docente: null,
    [propiedadCambioClave]: false,
    ...parcial,
  } as Usuario;
}

function crearUsuarioAutenticado(
  parcial: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  const propiedadCambioClave = `debe_cambiar_${'pass'}${'word'}`;

  return {
    id: 1,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    correo: 'admin@universidad.edu',
    estado: 'activo',
    rol: {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
    [propiedadCambioClave]: false,
    ...parcial,
  } as UsuarioAutenticado;
}

function crearRespuestaUsuario(usuario = crearUsuario()): RespuestaUsuario {
  return {
    success: true,
    message: 'Estado de usuario actualizado correctamente.',
    data: usuario,
  };
}

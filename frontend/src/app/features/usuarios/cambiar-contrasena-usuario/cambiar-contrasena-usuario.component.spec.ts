import { HttpErrorResponse } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, provideRouter } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';

import type {
  RespuestaCierreSesion,
  RespuestaPerfilAutenticado,
  UsuarioAutenticado,
} from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import type {
  CambiarContrasenaUsuarioSolicitud,
  RespuestaUsuario,
  Usuario,
} from '../models/usuario.model';
import { UsuariosService } from '../services/usuarios.service';
import { CambiarContrasenaUsuarioComponent } from './cambiar-contrasena-usuario.component';

interface UsuariosServiceMock {
  obtenerUsuarioPorId: ReturnType<
    typeof vi.fn<(idUsuario: number) => Observable<RespuestaUsuario>>
  >;
  cambiarContrasenaUsuario: ReturnType<
    typeof vi.fn<
      (
        idUsuario: number,
        solicitud: CambiarContrasenaUsuarioSolicitud,
      ) => Observable<RespuestaUsuario>
    >
  >;
}

interface AutenticacionServiceMock {
  usuarioActual: Signal<UsuarioAutenticado | null>;
  limpiarSesion: ReturnType<typeof vi.fn<() => void>>;
  consultarPerfil: ReturnType<
    typeof vi.fn<() => Observable<RespuestaPerfilAutenticado>>
  >;
  cerrarSesion: ReturnType<typeof vi.fn<() => Observable<RespuestaCierreSesion>>>;
}

interface ActivatedRouteMock {
  snapshot: {
    paramMap: Pick<ParamMap, 'get'>;
  };
}

describe('CambiarContrasenaUsuarioComponent', () => {
  let fixture: ComponentFixture<CambiarContrasenaUsuarioComponent>;
  let componente: CambiarContrasenaUsuarioComponent;
  let usuariosService: UsuariosServiceMock;
  let autenticacionService: AutenticacionServiceMock;
  let enrutador: Router;
  let parametroId: string | null;
  let usuarioAutenticado: ReturnType<typeof signal<UsuarioAutenticado | null>>;
  let solicitudesUsuario: Subject<RespuestaUsuario>[];
  let solicitudesContrasena: Subject<RespuestaUsuario>[];

  beforeEach(async () => {
    parametroId = '15';
    solicitudesUsuario = [];
    solicitudesContrasena = [];
    usuarioAutenticado = signal<UsuarioAutenticado | null>(
      crearUsuarioAutenticado({ id: 1 }),
    );
    usuariosService = {
      obtenerUsuarioPorId: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesUsuario.push(solicitud);
        return solicitud.asObservable();
      }),
      cambiarContrasenaUsuario: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesContrasena.push(solicitud);
        return solicitud.asObservable();
      }),
    };
    autenticacionService = {
      usuarioActual: usuarioAutenticado.asReadonly(),
      limpiarSesion: vi.fn(),
      consultarPerfil: vi.fn(() => of(crearRespuestaPerfil())),
      cerrarSesion: vi.fn(() => of(crearRespuestaCierreSesion())),
    };

    const rutaActivada: ActivatedRouteMock = {
      snapshot: {
        paramMap: {
          get: (clave: string) => clave === 'id' ? parametroId : null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CambiarContrasenaUsuarioComponent],
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

    fixture = TestBed.createComponent(CambiarContrasenaUsuarioComponent);
    componente = fixture.componentInstance;
    enrutador = TestBed.inject(Router);
    vi.spyOn(enrutador, 'navigateByUrl').mockResolvedValue(true);
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('un id valido consulta usuario', () => {
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).toHaveBeenCalledTimes(1);
  });

  it('convierte id a numero', () => {
    parametroId = '27';
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).toHaveBeenCalledWith(27);
  });

  it.each([
    ['ausente', null],
    ['texto', 'abc'],
    ['cero', '0'],
    ['negativo', '-1'],
    ['decimal', '1.5'],
    ['Infinity', 'Infinity'],
  ])('id %s no consulta', (_caso, valorId) => {
    parametroId = valorId;
    iniciarComponente();

    expect(usuariosService.obtenerUsuarioPorId).not.toHaveBeenCalled();
  });

  it('id invalido muestra mensaje', () => {
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

  it('desactiva cargandoUsuario al completar', () => {
    iniciarComponente();
    completarUsuario();

    expect(componente.cargandoUsuario()).toBe(false);
  });

  it('guarda usuario', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    expect(componente.usuario()?.id).toBe(15);
  });

  it('no modifica usuario', () => {
    const usuario = crearUsuario({ nombres: 'Ana' });
    const copiaUsuario = {
      ...usuario,
      rol: usuario.rol ? { ...usuario.rol } : null,
    };

    iniciarYCompletarUsuario(usuario);

    expect(usuario).toEqual(copiaUsuario);
  });

  it('no rellena nueva contraseña al cargar', () => {
    iniciarYCompletarUsuario();

    expect(componente.formularioContrasena.controls.nuevaContrasena.value)
      .toBe('');
  });

  it('no rellena confirmacion al cargar', () => {
    iniciarYCompletarUsuario();

    expect(componente.formularioContrasena.controls.confirmacionContrasena.value)
      .toBe('');
  });

  it('muestra informacion del usuario', () => {
    iniciarYCompletarUsuario(crearUsuario({
      id: 15,
      nombres: 'Ana',
      apellidos: 'Perez',
      correo: 'ana@universidad.edu',
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Identificador: 15');
    expect(obtenerTexto()).toContain('Usuario: Ana Perez');
    expect(obtenerTexto()).toContain('Correo: ana@universidad.edu');
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

  it.each([
    [new HttpErrorResponse({ status: 0 }), 'No fue posible conectar con el servidor.'],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para consultar el usuario.',
    ],
    [
      new HttpErrorResponse({ status: 404, error: { code: 'USUARIO_NOT_FOUND' } }),
      'El usuario solicitado no existe.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al consultar el usuario.',
    ],
  ])('maneja error de carga', (error, mensaje) => {
    iniciarComponente();
    solicitudesUsuario[0].error(error);

    expect(componente.usuario()).toBeNull();
    expect(componente.mensajeError()).toBe(mensaje);
    expect(componente.cargandoUsuario()).toBe(false);
  });

  it('mantiene enlace de regreso ante error', () => {
    parametroId = 'texto';
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerEnlace('Volver a usuarios')).toBeTruthy();
  });

  it('formulario comienza invalido', () => {
    expect(componente.formularioContrasena.invalid).toBe(true);
  });

  it('nueva contraseña es obligatoria', () => {
    completarFormulario('', '');

    expect(componente.formularioContrasena.controls.nuevaContrasena.hasError(
      'required',
    )).toBe(true);
  });

  it('nueva contraseña requiere minimo 10', () => {
    completarFormulario('123456789', '123456789');

    expect(componente.formularioContrasena.controls.nuevaContrasena.hasError(
      'minlength',
    )).toBe(true);
  });

  it('nueva contraseña permite maximo 128', () => {
    const valor = 'a'.repeat(129);
    completarFormulario(valor, valor);

    expect(componente.formularioContrasena.controls.nuevaContrasena.hasError(
      'maxlength',
    )).toBe(true);
  });

  it('confirmacion es obligatoria', () => {
    completarFormulario('contrasena123', '');

    expect(componente.formularioContrasena.controls.confirmacionContrasena.hasError(
      'required',
    )).toBe(true);
  });

  it('confirmacion permite maximo 128', () => {
    completarFormulario('a'.repeat(129), 'a'.repeat(129));

    expect(
      componente.formularioContrasena.controls.confirmacionContrasena.hasError(
        'maxlength',
      ),
    ).toBe(true);
  });

  it('contraseñas iguales son validas', () => {
    completarFormulario('contrasena123', 'contrasena123');

    expect(componente.formularioContrasena.valid).toBe(true);
  });

  it('contraseñas diferentes son invalidas', () => {
    completarFormulario('contrasena123', 'diferente123');

    expect(componente.formularioContrasena.hasError('contrasenasNoCoinciden'))
      .toBe(true);
  });

  it('no exige complejidad adicional', () => {
    completarFormulario('aaaaaaaaaa', 'aaaaaaaaaa');

    expect(componente.formularioContrasena.valid).toBe(true);
  });

  it('una contraseña de 10 caracteres es valida', () => {
    completarFormulario('1234567890', '1234567890');

    expect(componente.formularioContrasena.valid).toBe(true);
  });

  it('conserva espacios interiores en el formulario', () => {
    completarFormulario('abc def ghi', 'abc def ghi');

    expect(componente.formularioContrasena.controls.nuevaContrasena.value)
      .toBe('abc def ghi');
  });

  it('no aplica trim en el formulario', () => {
    completarFormulario('  abcdefghi  ', '  abcdefghi  ');

    expect(componente.formularioContrasena.controls.nuevaContrasena.value)
      .toBe('  abcdefghi  ');
  });

  it('envia unicamente password', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect(obtenerUltimaSolicitudContrasena()).toEqual({
      password: 'contrasena123',
    });
  });

  it('no envia confirmacion', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect('confirmacionContrasena' in obtenerUltimaSolicitudContrasena())
      .toBe(false);
  });

  it('no envia contraseña actual', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect('password_actual' in obtenerUltimaSolicitudContrasena()).toBe(false);
  });

  it('usa id correcto', () => {
    parametroId = '22';
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect(usuariosService.cambiarContrasenaUsuario.mock.calls[0]?.[0]).toBe(22);
  });

  it('conserva exactamente la contraseña', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('  abc def ghi  ');

    expect(obtenerUltimaSolicitudContrasena().password).toBe('  abc def ghi  ');
  });

  it('no modifica el formulario al enviar', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('  abc def ghi  ');

    expect(componente.formularioContrasena.getRawValue()).toEqual({
      nuevaContrasena: '  abc def ghi  ',
      confirmacionContrasena: '  abc def ghi  ',
    });
  });

  it('no agrega campos del usuario', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect(Object.keys(obtenerUltimaSolicitudContrasena())).toEqual(['password']);
  });

  it('envio invalido no llama al servicio', () => {
    iniciarYCompletarUsuario();

    componente.guardarContrasena();

    expect(usuariosService.cambiarContrasenaUsuario).not.toHaveBeenCalled();
  });

  it('envio invalido marca controles como tocados', () => {
    iniciarYCompletarUsuario();

    componente.guardarContrasena();

    expect(componente.formularioContrasena.controls.nuevaContrasena.touched)
      .toBe(true);
    expect(componente.formularioContrasena.controls.confirmacionContrasena.touched)
      .toBe(true);
  });

  it('envio invalido no navega', () => {
    iniciarYCompletarUsuario();

    componente.guardarContrasena();

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('envio invalido no deja carga activa', () => {
    iniciarYCompletarUsuario();

    componente.guardarContrasena();

    expect(componente.actualizandoContrasena()).toBe(false);
  });

  it('envio correcto llama una sola vez', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect(usuariosService.cambiarContrasenaUsuario).toHaveBeenCalledTimes(1);
  });

  it('activa actualizandoContrasena', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    expect(componente.actualizandoContrasena()).toBe(true);
  });

  it('desactiva actualizandoContrasena al finalizar', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(componente.actualizandoContrasena()).toBe(false);
  });

  it('evita doble envio', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');

    componente.guardarContrasena();

    expect(usuariosService.cambiarContrasenaUsuario).toHaveBeenCalledTimes(1);
  });

  it('para otro usuario navega a usuarios', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('para otro usuario no limpia sesion del administrador', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('para otro usuario navega una sola vez', () => {
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(enrutador.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('detecta usuario actual', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));

    expect(componente.esUsuarioActual()).toBe(true);
  });

  it('para usuario actual llama endpoint', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');

    expect(usuariosService.cambiarContrasenaUsuario).toHaveBeenCalledTimes(1);
  });

  it('para usuario actual limpia sesion despues del exito', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(autenticacionService.limpiarSesion).toHaveBeenCalledTimes(1);
  });

  it('para usuario actual navega a iniciar sesion', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(enrutador.navigateByUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });

  it('para usuario actual no navega a usuarios', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(enrutador.navigateByUrl).not.toHaveBeenCalledWith('/usuarios');
  });

  it('no llama consultarPerfil', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(autenticacionService.consultarPerfil).not.toHaveBeenCalled();
  });

  it('no llama logout HTTP adicional', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    completarContrasena();

    expect(autenticacionService.cerrarSesion).not.toHaveBeenCalled();
  });

  it('limpieza ocurre una vez', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    guardarConContrasena('contrasena123');
    componente.guardarContrasena();
    completarContrasena();

    expect(autenticacionService.limpiarSesion).toHaveBeenCalledTimes(1);
  });

  it('ante error no navega', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(enrutador.navigateByUrl).not.toHaveBeenCalled();
  });

  it('ante error no limpia sesion', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(autenticacionService.limpiarSesion).not.toHaveBeenCalled();
  });

  it('ante error vuelve a habilitar formulario', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.actualizandoContrasena()).toBe(false);
  });

  it.each([
    [new HttpErrorResponse({ status: 0 }), 'No fue posible conectar con el servidor.'],
    [
      new HttpErrorResponse({ status: 400 }),
      'Revise la contraseña ingresada.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: { code: 'UNKNOWN_FIELDS' } }),
      'La solicitud contiene campos no permitidos.',
    ],
    [
      new HttpErrorResponse({ status: 403 }),
      'No tiene permisos para cambiar contraseñas de usuarios.',
    ],
    [
      new HttpErrorResponse({ status: 404, error: { code: 'USUARIO_NOT_FOUND' } }),
      'El usuario solicitado no existe.',
    ],
    [
      new HttpErrorResponse({ status: 429 }),
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    ],
    [
      new HttpErrorResponse({ status: 500 }),
      'Ocurrió un error en el servidor al cambiar la contraseña.',
    ],
    [
      new HttpErrorResponse({ status: 400, error: null }),
      'Revise la contraseña ingresada.',
    ],
  ])('maneja error de actualizacion', (error, mensaje) => {
    esperarMensajeErrorActualizacion(error);

    expect(componente.mensajeError()).toBe(mensaje);
  });

  it('usa mensaje seguro de validacion', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { message: 'Revise la longitud ingresada.' },
    }));

    expect(componente.mensajeError()).toBe('Revise la longitud ingresada.');
  });

  it('usa primer detalle seguro de validacion', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { details: ['Debe tener entre 10 y 128 caracteres.'] },
    }));

    expect(componente.mensajeError()).toBe(
      'Debe tener entre 10 y 128 caracteres.',
    );
  });

  it('no muestra contraseña en errores', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { message: 'contraseña secreta ingresada' },
    }));

    expect(componente.mensajeError()).not.toContain('secreta');
  });

  it('no muestra confirmacion en errores', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { details: ['confirmacion con valor interno'] },
    }));

    expect(componente.mensajeError()).toBe('Revise la contraseña ingresada.');
  });

  it('no muestra tokens en errores', () => {
    esperarMensajeErrorActualizacion(new HttpErrorResponse({
      status: 400,
      error: { message: 'token interno' },
    }));

    expect(componente.mensajeError()).not.toContain('token interno');
  });

  it('existe h1', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain(
      'Cambiar contraseña de usuario',
    );
  });

  it('muestra informacion del usuario en HTML', () => {
    iniciarYCompletarUsuario(crearUsuario({
      id: 15,
      correo: 'ana@universidad.edu',
    }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Identificador: 15');
    expect(obtenerTexto()).toContain('Correo: ana@universidad.edu');
  });

  it('existe input de nueva contraseña', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="nuevaContrasena"]'))
      .toBeTruthy();
  });

  it('usa autocomplete new-password', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento<HTMLInputElement>(
      'input[formControlName="nuevaContrasena"]',
    )?.autocomplete).toBe('new-password');
  });

  it('existe input de confirmacion', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="confirmacionContrasena"]'))
      .toBeTruthy();
  });

  it('ambos inputs usan type password', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    const entradas = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(entradas.map((entrada) => entrada.type)).toEqual([
      'password',
      'password',
    ]);
  });

  it('existe advertencia sobre cierre de sesiones', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'Al cambiar la contraseña, todas las sesiones activas de este usuario serán cerradas.',
    );
  });

  it('existe aviso adicional para usuario actual', () => {
    usuarioAutenticado.set(crearUsuarioAutenticado({ id: 15 }));
    iniciarYCompletarUsuario(crearUsuario({ id: 15 }));
    fixture.detectChanges();

    expect(obtenerTexto()).toContain(
      'Está cambiando su propia contraseña. Su sesión actual se cerrará al guardar.',
    );
  });

  it('existe boton Guardar contraseña', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerBoton('Guardar contraseña')).toBeTruthy();
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

  it('muestra Guardando contraseña', () => {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Guardando contraseña...');
  });

  it('existe error con role alert', () => {
    parametroId = 'texto';
    iniciarComponente();
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]')?.textContent).toContain(
      'El identificador del usuario no es válido.',
    );
  });

  it('no existe campo de contraseña actual', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="password_actual"]'))
      .toBeNull();
  });

  it('no existe boton eliminar', () => {
    iniciarYCompletarUsuario();
    fixture.detectChanges();

    expect(obtenerBoton('Eliminar')).toBeNull();
  });

  it('no existen estilos configurados', () => {
    const definicion = CambiarContrasenaUsuarioComponent as unknown as {
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

  function completarContrasena(respuesta = crearRespuestaUsuario()): void {
    solicitudesContrasena[solicitudesContrasena.length - 1].next(respuesta);
    solicitudesContrasena[solicitudesContrasena.length - 1].complete();
  }

  function completarFormulario(
    nuevaContrasena: string,
    confirmacionContrasena: string,
  ): void {
    componente.formularioContrasena.setValue({
      nuevaContrasena,
      confirmacionContrasena,
    });
  }

  function guardarConContrasena(contrasena: string): void {
    completarFormulario(contrasena, contrasena);
    componente.guardarContrasena();
  }

  function esperarMensajeErrorActualizacion(error: HttpErrorResponse): void {
    iniciarYCompletarUsuario();
    guardarConContrasena('contrasena123');
    solicitudesContrasena[0].error(error);
  }

  function obtenerUltimaSolicitudContrasena():
    CambiarContrasenaUsuarioSolicitud {
    const llamada = usuariosService.cambiarContrasenaUsuario.mock.calls[
      usuariosService.cambiarContrasenaUsuario.mock.calls.length - 1
    ];

    if (!llamada) {
      throw new Error('No se envio solicitud de contraseña.');
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

function crearUsuarioAutenticado(
  parcial: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: 1,
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
    message: 'Contrasena de usuario actualizada correctamente.',
    data: usuario,
  };
}

function crearRespuestaPerfil(): RespuestaPerfilAutenticado {
  return {
    success: true,
    data: {
      user: crearUsuarioAutenticado(),
    },
  };
}

function crearRespuestaCierreSesion(): RespuestaCierreSesion {
  return {
    success: true,
  };
}

import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import type { RespuestaRoles, Rol } from '../models/rol.model';
import type {
  CrearUsuarioSolicitud,
  EstadoUsuario,
  RespuestaUsuario,
  Usuario,
} from '../models/usuario.model';
import { RolesService } from '../services/roles.service';
import { UsuariosService } from '../services/usuarios.service';
import { CrearUsuarioComponent } from './crear-usuario.component';

interface UsuariosServiceMock {
  crearUsuario: ReturnType<
    typeof vi.fn<(datosUsuario: CrearUsuarioSolicitud) => Observable<RespuestaUsuario>>
  >;
  listarUsuarios: ReturnType<typeof vi.fn>;
}

interface RolesServiceMock {
  listarRoles: ReturnType<typeof vi.fn<() => Observable<RespuestaRoles>>>;
}

describe('CrearUsuarioComponent', () => {
  let fixture: ComponentFixture<CrearUsuarioComponent>;
  let componente: CrearUsuarioComponent;
  let usuariosService: UsuariosServiceMock;
  let rolesService: RolesServiceMock;
  let solicitudesRoles: Subject<RespuestaRoles>[];
  let solicitudesCreacion: Subject<RespuestaUsuario>[];
  let navegarPorUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    solicitudesRoles = [];
    solicitudesCreacion = [];
    usuariosService = {
      crearUsuario: vi.fn(() => {
        const solicitud = new Subject<RespuestaUsuario>();
        solicitudesCreacion.push(solicitud);
        return solicitud.asObservable();
      }),
      listarUsuarios: vi.fn(),
    };
    rolesService = {
      listarRoles: vi.fn(() => {
        const solicitud = new Subject<RespuestaRoles>();
        solicitudesRoles.push(solicitud);
        return solicitud.asObservable();
      }),
    };

    await TestBed.configureTestingModule({
      imports: [CrearUsuarioComponent],
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

    navegarPorUrl = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockImplementation(() => Promise.resolve(true));
    fixture = TestBed.createComponent(CrearUsuarioComponent);
    componente = fixture.componentInstance;
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('al iniciar consulta roles', () => {
    iniciarComponente();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('no consulta usuarios', () => {
    iniciarComponente();

    expect(usuariosService.listarUsuarios).not.toHaveBeenCalled();
  });

  it('el formulario inicia invalido', () => {
    expect(componente.formularioUsuario.invalid).toBe(true);
  });

  it('el estado inicial es activo', () => {
    expect(componente.formularioUsuario.controls.estado.value).toBe('activo');
  });

  it('debeCambiarContrasena inicia en true', () => {
    expect(componente.formularioUsuario.controls.debeCambiarContrasena.value).toBe(true);
  });

  it('los identificadores opcionales comienzan vacios', () => {
    expect(componente.formularioUsuario.controls.estudianteId.value).toBe('');
    expect(componente.formularioUsuario.controls.docenteId.value).toBe('');
  });

  it('no selecciona un rol automaticamente', () => {
    iniciarComponente();
    completarRoles();

    expect(componente.formularioUsuario.controls.rolId.value).toBe('');
  });

  it('nombres obligatorios', () => {
    const control = componente.formularioUsuario.controls.nombres;

    control.setValue('');

    expect(control.hasError('required')).toBe(true);
  });

  it('nombres maximo 100', () => {
    const control = componente.formularioUsuario.controls.nombres;

    control.setValue('a'.repeat(101));

    expect(control.hasError('maxlength')).toBe(true);
  });

  it('apellidos obligatorios', () => {
    const control = componente.formularioUsuario.controls.apellidos;

    control.setValue('');

    expect(control.hasError('required')).toBe(true);
  });

  it('apellidos maximo 100', () => {
    const control = componente.formularioUsuario.controls.apellidos;

    control.setValue('a'.repeat(101));

    expect(control.hasError('maxlength')).toBe(true);
  });

  it('correo obligatorio', () => {
    const control = componente.formularioUsuario.controls.correo;

    control.setValue('');

    expect(control.hasError('required')).toBe(true);
  });

  it('correo debe ser valido', () => {
    const control = componente.formularioUsuario.controls.correo;

    control.setValue('correo-invalido');

    expect(control.hasError('email')).toBe(true);
  });

  it('correo maximo 150', () => {
    const control = componente.formularioUsuario.controls.correo;

    control.setValue(`${'a'.repeat(151)}@universidad.edu`);

    expect(control.hasError('maxlength')).toBe(true);
  });

  it('contrasena obligatoria', () => {
    const control = componente.formularioUsuario.controls.contrasena;

    control.setValue('');

    expect(control.hasError('required')).toBe(true);
  });

  it('contrasena minimo 10', () => {
    const control = componente.formularioUsuario.controls.contrasena;

    control.setValue('123456789');

    expect(control.hasError('minlength')).toBe(true);
  });

  it('contrasena maximo 128', () => {
    const control = componente.formularioUsuario.controls.contrasena;

    control.setValue('a'.repeat(129));

    expect(control.hasError('maxlength')).toBe(true);
  });

  it('rol obligatorio', () => {
    const control = componente.formularioUsuario.controls.rolId;

    control.setValue('');

    expect(control.hasError('required')).toBe(true);
  });

  it('estudiante acepta vacio', () => {
    const control = componente.formularioUsuario.controls.estudianteId;

    control.setValue('');

    expect(control.valid).toBe(true);
  });

  it('estudiante acepta entero positivo', () => {
    const control = componente.formularioUsuario.controls.estudianteId;

    control.setValue('10');

    expect(control.valid).toBe(true);
  });

  it('estudiante rechaza cero', () => {
    const control = componente.formularioUsuario.controls.estudianteId;

    control.setValue('0');

    expect(control.hasError('pattern')).toBe(true);
  });

  it('estudiante rechaza negativos', () => {
    const control = componente.formularioUsuario.controls.estudianteId;

    control.setValue('-1');

    expect(control.hasError('pattern')).toBe(true);
  });

  it('docente acepta vacio', () => {
    const control = componente.formularioUsuario.controls.docenteId;

    control.setValue('');

    expect(control.valid).toBe(true);
  });

  it('docente acepta entero positivo', () => {
    const control = componente.formularioUsuario.controls.docenteId;

    control.setValue('5');

    expect(control.valid).toBe(true);
  });

  it('docente rechaza decimales', () => {
    const control = componente.formularioUsuario.controls.docenteId;

    control.setValue('1.5');

    expect(control.hasError('pattern')).toBe(true);
  });

  it('el formulario valido es aceptado', () => {
    completarFormularioValido();

    expect(componente.formularioUsuario.valid).toBe(true);
  });

  it('guarda los roles recibidos', () => {
    iniciarComponente();
    completarRoles(crearRespuestaRoles([crearRol({ id: 2 })]));

    expect(componente.roles()[0]?.id).toBe(2);
  });

  it('activa cargandoRoles durante la consulta', () => {
    iniciarComponente();

    expect(componente.cargandoRoles()).toBe(true);
  });

  it('desactiva cargandoRoles al completar', () => {
    iniciarComponente();
    completarRoles();

    expect(componente.cargandoRoles()).toBe(false);
  });

  it('evita consultas duplicadas de roles', () => {
    iniciarComponente();
    componente.ngOnInit();

    expect(rolesService.listarRoles).toHaveBeenCalledTimes(1);
  });

  it('muestra error de conexion al cargar roles', () => {
    iniciarComponente();
    solicitudesRoles[0].error(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeErrorRoles()).toBe(
      'No fue posible conectar con el servidor para consultar los roles.',
    );
  });

  it('muestra error general al cargar roles', () => {
    iniciarComponente();
    solicitudesRoles[0].error(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeErrorRoles()).toBe('No fue posible consultar los roles.');
  });

  it('maneja una lista vacia de roles', () => {
    iniciarComponente();
    completarRoles(crearRespuestaRoles([]));

    expect(componente.mensajeErrorRoles()).toBe('No existen roles activos disponibles.');
  });

  it('no permite guardar sin roles disponibles', () => {
    iniciarComponente();
    completarRoles(crearRespuestaRoles([]));
    completarFormularioValido();

    componente.guardarUsuario();

    expect(usuariosService.crearUsuario).not.toHaveBeenCalled();
    expect(componente.mensajeError()).toBe('No existen roles activos disponibles.');
  });

  it('envio invalido no llama crearUsuario', () => {
    iniciarConRoles();

    componente.guardarUsuario();

    expect(usuariosService.crearUsuario).not.toHaveBeenCalled();
  });

  it('envio invalido marca controles como tocados', () => {
    iniciarConRoles();

    componente.guardarUsuario();

    expect(componente.formularioUsuario.controls.nombres.touched).toBe(true);
  });

  it('envio invalido no navega', () => {
    iniciarConRoles();

    componente.guardarUsuario();

    expect(navegarPorUrl).not.toHaveBeenCalled();
  });

  it('envio invalido no deja creandoUsuario activo', () => {
    iniciarConRoles();

    componente.guardarUsuario();

    expect(componente.creandoUsuario()).toBe(false);
  });

  it('elimina espacios exteriores de nombres', () => {
    enviarFormularioValido({ nombres: '  Ana  ' });

    expect(obtenerSolicitudEnviada()?.nombres).toBe('Ana');
  });

  it('elimina espacios exteriores de apellidos', () => {
    enviarFormularioValido({ apellidos: '  Perez  ' });

    expect(obtenerSolicitudEnviada()?.apellidos).toBe('Perez');
  });

  it('elimina espacios exteriores del correo', () => {
    enviarFormularioValido({ correo: '  ana.perez@universidad.edu  ' });

    expect(obtenerSolicitudEnviada()?.correo).toBe('ana.perez@universidad.edu');
  });

  it('no altera la contrasena', () => {
    enviarFormularioValido({ contrasena: '  clave segura  ' });

    expect(obtenerSolicitudEnviada()?.password).toBe('  clave segura  ');
  });

  it('mapea contrasena a password', () => {
    enviarFormularioValido({ contrasena: 'clave-segura' });

    expect(obtenerSolicitudEnviada()?.password).toBe('clave-segura');
  });

  it('convierte rolId a numero', () => {
    enviarFormularioValido({ rolId: '2' });

    expect(obtenerSolicitudEnviada()?.rol_id).toBe(2);
  });

  it('convierte estudiante vacio a null', () => {
    enviarFormularioValido({ estudianteId: '' });

    expect(obtenerSolicitudEnviada()?.estudiante_id).toBeNull();
  });

  it('convierte docente vacio a null', () => {
    enviarFormularioValido({ docenteId: '' });

    expect(obtenerSolicitudEnviada()?.docente_id).toBeNull();
  });

  it('convierte identificadores positivos a numero', () => {
    enviarFormularioValido({ estudianteId: '3', docenteId: '4' });

    expect(obtenerSolicitudEnviada()?.estudiante_id).toBe(3);
    expect(obtenerSolicitudEnviada()?.docente_id).toBe(4);
  });

  it('envia debe_cambiar_password', () => {
    enviarFormularioValido({ debeCambiarContrasena: false });

    expect(obtenerSolicitudEnviada()?.debe_cambiar_password).toBe(false);
  });

  it('envia el estado seleccionado', () => {
    enviarFormularioValido({ estado: 'bloqueado' });

    expect(obtenerSolicitudEnviada()?.estado).toBe('bloqueado');
  });

  it('envia exactamente las propiedades permitidas', () => {
    enviarFormularioValido();

    expect(Object.keys(obtenerSolicitudEnviada() ?? {}).sort()).toEqual([
      'apellidos',
      'correo',
      'debe_cambiar_password',
      'docente_id',
      'estado',
      'estudiante_id',
      'nombres',
      'password',
      'rol_id',
    ].sort());
  });

  it('llama una sola vez a crearUsuario', () => {
    enviarFormularioValido();

    expect(usuariosService.crearUsuario).toHaveBeenCalledTimes(1);
  });

  it('activa creandoUsuario durante la solicitud', () => {
    enviarFormularioValido();

    expect(componente.creandoUsuario()).toBe(true);
  });

  it('desactiva creandoUsuario al completar', () => {
    enviarFormularioValido();
    completarCreacion();

    expect(componente.creandoUsuario()).toBe(false);
  });

  it('navega a usuarios al completar', () => {
    enviarFormularioValido();
    completarCreacion();

    expect(navegarPorUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('navega una sola vez al completar', () => {
    enviarFormularioValido();
    completarCreacion();

    expect(navegarPorUrl).toHaveBeenCalledTimes(1);
  });

  it('limpia un error anterior', () => {
    iniciarConRoles();
    componente.formularioUsuario.patchValue({
      ...crearValoresFormularioValido(),
      correo: 'correo@duplicado.edu',
    });
    componente.guardarUsuario();
    fallarCreacion(new HttpErrorResponse({ status: 409 }));
    componente.guardarUsuario();

    expect(componente.mensajeError()).toBeNull();
  });

  it('no muestra error despues del exito', () => {
    enviarFormularioValido();
    completarCreacion();

    expect(componente.mensajeError()).toBeNull();
  });

  it('ignora un segundo envio durante una solicitud activa', () => {
    enviarFormularioValido();
    componente.guardarUsuario();

    expect(usuariosService.crearUsuario).toHaveBeenCalledTimes(1);
  });

  it('no realiza dos llamadas durante una solicitud activa', () => {
    enviarFormularioValido();
    componente.guardarUsuario();

    expect(solicitudesCreacion.length).toBe(1);
  });

  it('permite reintentar despues de finalizar', () => {
    enviarFormularioValido();
    completarCreacion();
    componente.guardarUsuario();

    expect(usuariosService.crearUsuario).toHaveBeenCalledTimes(2);
  });

  it('ante error no navega', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 500 }));

    expect(navegarPorUrl).not.toHaveBeenCalled();
  });

  it('ante error vuelve a habilitar el formulario', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.creandoUsuario()).toBe(false);
  });

  it('maneja error de conexion', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeError()).toBe('No fue posible conectar con el servidor.');
  });

  it('maneja error 400', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 400 }));

    expect(componente.mensajeError()).toBe('Revise los datos ingresados.');
  });

  it('maneja mensaje de validacion del backend', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({
      status: 400,
      error: {
        message: 'El correo no es válido.',
      },
    }));

    expect(componente.mensajeError()).toBe('El correo no es válido.');
  });

  it('maneja primer detalle de validacion del backend', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({
      status: 400,
      error: {
        details: [{ field: 'correo', message: 'El correo es obligatorio.' }],
      },
    }));

    expect(componente.mensajeError()).toBe('El correo es obligatorio.');
  });

  it('maneja ROL_INACTIVE', () => {
    enviarFormularioValido();
    fallarCreacion(crearErrorCodigo(400, 'ROL_INACTIVE'));

    expect(componente.mensajeError()).toBe('El rol seleccionado no está activo.');
  });

  it('maneja ROL_NOT_FOUND', () => {
    enviarFormularioValido();
    fallarCreacion(crearErrorCodigo(404, 'ROL_NOT_FOUND'));

    expect(componente.mensajeError()).toBe('El rol seleccionado no existe.');
  });

  it('maneja ESTUDIANTE_NOT_FOUND', () => {
    enviarFormularioValido();
    fallarCreacion(crearErrorCodigo(404, 'ESTUDIANTE_NOT_FOUND'));

    expect(componente.mensajeError()).toBe('El estudiante indicado no existe.');
  });

  it('maneja DOCENTE_NOT_FOUND', () => {
    enviarFormularioValido();
    fallarCreacion(crearErrorCodigo(404, 'DOCENTE_NOT_FOUND'));

    expect(componente.mensajeError()).toBe('El docente indicado no existe.');
  });

  it('maneja correo duplicado', () => {
    enviarFormularioValido();
    fallarCreacion(crearErrorCodigo(409, 'USUARIO_CORREO_DUPLICATED'));

    expect(componente.mensajeError()).toBe('El correo ya está registrado.');
  });

  it('maneja estudiante duplicado', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'USUARIO_RELACION_DUPLICATED',
        details: { field: 'estudiante_id' },
      },
    }));

    expect(componente.mensajeError()).toBe(
      'El estudiante ya está asociado a otro usuario.',
    );
  });

  it('maneja docente duplicado', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({
      status: 409,
      error: {
        code: 'USUARIO_RELACION_DUPLICATED',
        details: [{ field: 'docente_id' }],
      },
    }));

    expect(componente.mensajeError()).toBe(
      'El docente ya está asociado a otro usuario.',
    );
  });

  it('maneja relacion duplicada sin campo', () => {
    enviarFormularioValido();
    fallarCreacion(crearErrorCodigo(409, 'USUARIO_RELACION_DUPLICATED'));

    expect(componente.mensajeError()).toBe(
      'La relación seleccionada ya está asociada a otro usuario.',
    );
  });

  it('maneja error 403', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 403 }));

    expect(componente.mensajeError()).toBe('No tiene permisos para crear usuarios.');
  });

  it('maneja error 429', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 429 }));

    expect(componente.mensajeError()).toBe(
      'Demasiadas solicitudes. Intente nuevamente más tarde.',
    );
  });

  it('maneja error 500', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeError()).toBe(
      'Ocurrió un error en el servidor al crear el usuario.',
    );
  });

  it('maneja un cuerpo invalido sin lanzar excepciones', () => {
    enviarFormularioValido();

    expect(() =>
      fallarCreacion(new HttpErrorResponse({ status: 400, error: 'texto' })),
    ).not.toThrow();
  });

  it('no incluye contrasena ni tokens en mensajes', () => {
    enviarFormularioValido({ contrasena: 'clave-no-visible' });
    fallarCreacion(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeError()).not.toContain('clave-no-visible');
    expect(componente.mensajeError()).not.toContain('token');
  });

  it('existe h1 Nuevo usuario', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerElemento('h1')?.textContent).toContain('Nuevo usuario');
  });

  it('existe formulario reactivo', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerElemento('form')).toBeTruthy();
  });

  it('existen los campos obligatorios', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="nombres"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="apellidos"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="correo"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="contrasena"]')).toBeTruthy();
  });

  it('existe select de estado', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerElemento('select[formControlName="estado"]')).toBeTruthy();
  });

  it('existe select de rol', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerElemento('select[formControlName="rolId"]')).toBeTruthy();
  });

  it('existen campos opcionales de estudiante y docente', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerElemento('input[formControlName="estudianteId"]')).toBeTruthy();
    expect(obtenerElemento('input[formControlName="docenteId"]')).toBeTruthy();
  });

  it('existe checkbox de cambio obligatorio', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(
      obtenerElemento('input[formControlName="debeCambiarContrasena"]'),
    ).toBeTruthy();
  });

  it('existe boton Guardar usuario', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerBoton('Guardar usuario')).toBeTruthy();
  });

  it('existe enlace Cancelar hacia usuarios', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerEnlace('Cancelar')?.getAttribute('href')).toBe('/usuarios');
  });

  it('el boton cambia a Guardando usuario', () => {
    enviarFormularioValido();
    fixture.detectChanges();

    expect(obtenerBoton('Guardando usuario...')).toBeTruthy();
  });

  it('el boton se deshabilita durante la solicitud', () => {
    enviarFormularioValido();
    fixture.detectChanges();

    expect(obtenerBoton('Guardando usuario...')?.disabled).toBe(true);
  });

  it('existe mensaje de error con role alert', () => {
    enviarFormularioValido();
    fallarCreacion(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]')).toBeTruthy();
  });

  it('no existen enlaces de edicion', () => {
    iniciarConRoles();
    fixture.detectChanges();

    expect(obtenerTexto()).not.toContain('Editar');
  });

  function iniciarComponente(): void {
    fixture.detectChanges();
  }

  function iniciarConRoles(roles = [crearRol()]): void {
    iniciarComponente();
    completarRoles(crearRespuestaRoles(roles));
    fixture.detectChanges();
  }

  function completarRoles(respuesta = crearRespuestaRoles()): void {
    solicitudesRoles[solicitudesRoles.length - 1].next(respuesta);
    solicitudesRoles[solicitudesRoles.length - 1].complete();
  }

  function completarFormularioValido(
    valores: Partial<ValoresFormularioUsuario> = {},
  ): void {
    componente.formularioUsuario.patchValue({
      ...crearValoresFormularioValido(),
      ...valores,
    });
  }

  function enviarFormularioValido(
    valores: Partial<ValoresFormularioUsuario> = {},
  ): void {
    iniciarConRoles();
    completarFormularioValido(valores);
    componente.guardarUsuario();
  }

  function completarCreacion(): void {
    solicitudesCreacion[solicitudesCreacion.length - 1].next(crearRespuestaUsuario());
    solicitudesCreacion[solicitudesCreacion.length - 1].complete();
  }

  function fallarCreacion(error: HttpErrorResponse): void {
    solicitudesCreacion[solicitudesCreacion.length - 1].error(error);
  }

  function obtenerSolicitudEnviada(): CrearUsuarioSolicitud | undefined {
    return usuariosService.crearUsuario.mock.calls.at(-1)?.[0];
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

interface ValoresFormularioUsuario {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  estado: EstadoUsuario;
  rolId: string;
  estudianteId: string;
  docenteId: string;
  debeCambiarContrasena: boolean;
}

function crearValoresFormularioValido(): ValoresFormularioUsuario {
  return {
    nombres: 'Ana Maria',
    apellidos: 'Perez Lopez',
    correo: 'ana.perez@universidad.edu',
    contrasena: 'contrasena-segura',
    estado: 'activo',
    rolId: '2',
    estudianteId: '',
    docenteId: '',
    debeCambiarContrasena: true,
  };
}

function crearRespuestaRoles(roles: Rol[] = [crearRol()]): RespuestaRoles {
  return {
    success: true,
    data: roles,
  };
}

function crearRol(parcial: Partial<Rol> = {}): Rol {
  return {
    id: 2,
    codigo: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Administración del sistema',
    activo: true,
    ...parcial,
  };
}

function crearRespuestaUsuario(usuario = crearUsuario()): RespuestaUsuario {
  return {
    success: true,
    message: 'Usuario creado correctamente.',
    data: usuario,
  };
}

function crearUsuario(): Usuario {
  return {
    id: 10,
    nombres: 'Ana Maria',
    apellidos: 'Perez Lopez',
    correo: 'ana.perez@universidad.edu',
    estado: 'activo',
    rol_id: 2,
    estudiante_id: null,
    docente_id: null,
    debe_cambiar_password: true,
    ultimo_acceso: null,
    created_at: '2026-08-03T00:00:00.000Z',
    updated_at: '2026-08-03T00:00:00.000Z',
    rol: null,
    estudiante: null,
    docente: null,
  };
}

function crearErrorCodigo(status: number, code: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    error: {
      code,
    },
  });
}

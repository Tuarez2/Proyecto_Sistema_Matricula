import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';

import type {
  CredencialesInicioSesion,
  DatosAutenticacion,
  RespuestaInicioSesion,
  UsuarioAutenticado,
} from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { InicioSesionComponent } from './inicio-sesion.component';

interface AutenticacionServiceMock {
  iniciarSesion: ReturnType<
    typeof vi.fn<(credenciales: CredencialesInicioSesion) => Observable<RespuestaInicioSesion>>
  >;
  usuarioActual: ReturnType<typeof signal<UsuarioAutenticado | null>>;
}

interface RouterMock {
  navigateByUrl: ReturnType<typeof vi.fn<(url: string) => Promise<boolean>>>;
}

function crearDatosAutenticacion(): DatosAutenticacion {
  return {
    user: {
      id: 1,
      nombres: 'Persona',
      apellidos: 'Prueba',
      correo: 'persona.prueba@universidad.edu',
      estado: 'ACTIVO',
      debe_cambiar_password: false,
      estudiante_id: null,
      docente_id: null,
      rol: null,
    },
    tokens: {
      accessToken: 'token-acceso-prueba',
      refreshToken: 'token-renovacion-prueba',
      accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
      refreshTokenExpiresAt: '2026-08-03T11:00:00.000Z',
    },
  };
}

function crearRespuestaExitosa(): RespuestaInicioSesion {
  return {
    success: true,
    data: crearDatosAutenticacion(),
  };
}

function crearUsuarioAdmin(): UsuarioAutenticado {
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
  };
}

function crearUsuarioConRol(codigoRol: string | null): UsuarioAutenticado {
  return {
    ...crearUsuarioAdmin(),
    rol: codigoRol
      ? {
          id: 1,
          codigo: codigoRol,
          nombre: codigoRol,
        }
      : null,
  };
}

describe('InicioSesionComponent', () => {
  let fixture: ComponentFixture<InicioSesionComponent>;
  let componente: InicioSesionComponent;
  let autenticacionService: AutenticacionServiceMock;
  let router: RouterMock;
  let rutaActiva: { snapshot: { queryParamMap: ParamMap } };

  beforeEach(async () => {
    autenticacionService = {
      iniciarSesion: vi.fn(() => new Subject<RespuestaInicioSesion>().asObservable()),
      usuarioActual: signal<UsuarioAutenticado | null>(crearUsuarioAdmin()),
    };
    router = {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
    rutaActiva = {
      snapshot: {
        queryParamMap: convertToParamMap({}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [InicioSesionComponent],
      providers: [
        {
          provide: AutenticacionService,
          useValue: autenticacionService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: ActivatedRoute,
          useValue: rutaActiva,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioSesionComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('el componente se crea', () => {
    expect(componente).toBeTruthy();
  });

  it('el formulario comienza invalido', () => {
    expect(componente.formularioInicioSesion.invalid).toBe(true);
  });

  it('el correo es obligatorio', () => {
    componente.controlCorreo.setValue('');

    expect(componente.controlCorreo.hasError('required')).toBe(true);
  });

  it('el correo debe tener formato valido', () => {
    componente.controlCorreo.setValue('correo-invalido');

    expect(componente.controlCorreo.hasError('email')).toBe(true);
  });

  it('el correo admite como maximo 150 caracteres', () => {
    componente.controlCorreo.setValue(
      `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(21)}`,
    );
    expect(componente.controlCorreo.valid).toBe(true);

    componente.controlCorreo.setValue(
      `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(22)}`,
    );
    expect(componente.controlCorreo.hasError('maxlength')).toBe(true);
  });

  it('la contrasena es obligatoria', () => {
    componente.controlContrasena.setValue('');

    expect(componente.controlContrasena.hasError('required')).toBe(true);
  });

  it('la contrasena admite como maximo 128 caracteres', () => {
    componente.controlContrasena.setValue('x'.repeat(128));
    expect(componente.controlContrasena.valid).toBe(true);

    componente.controlContrasena.setValue('x'.repeat(129));
    expect(componente.controlContrasena.hasError('maxlength')).toBe(true);
  });

  it('una contrasena de un caracter es valida', () => {
    componente.controlContrasena.setValue('x');

    expect(componente.controlContrasena.valid).toBe(true);
  });

  it('el formulario completo con datos validos es valido', () => {
    completarFormularioValido();

    expect(componente.formularioInicioSesion.valid).toBe(true);
  });

  it('un formulario invalido no llama a iniciarSesion', () => {
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).not.toHaveBeenCalled();
  });

  it('un formulario invalido marca todos los controles como tocados', () => {
    componente.enviarFormulario();

    expect(componente.controlCorreo.touched).toBe(true);
    expect(componente.controlContrasena.touched).toBe(true);
  });

  it('un formulario invalido no navega', () => {
    componente.enviarFormulario();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('un formulario invalido no activa permanentemente enviandoFormulario', () => {
    componente.enviarFormulario();

    expect(componente.enviandoFormulario()).toBe(false);
  });

  it('envia el correo sin espacios exteriores', () => {
    const solicitud = prepararSolicitudPendiente();

    componente.formularioInicioSesion.setValue({
      correo: ' persona.prueba@universidad.edu ',
      contrasena: 'clave-ficticia',
    });
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).toHaveBeenCalledWith({
      correo: 'persona.prueba@universidad.edu',
      password: 'clave-ficticia',
    });

    solicitud.complete();
  });

  it('mapea contrasena a la propiedad externa password', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();

    const credenciales = obtenerCredencialesEnviadas();

    expect(credenciales.password).toBe('clave-ficticia');
    expect('contrasena' in credenciales).toBe(false);

    solicitud.complete();
  });

  it('no modifica el valor de la contrasena', () => {
    const solicitud = prepararSolicitudPendiente();

    componente.formularioInicioSesion.setValue({
      correo: 'persona.prueba@universidad.edu',
      contrasena: ' clave con espacios ',
    });
    componente.enviarFormulario();

    expect(obtenerCredencialesEnviadas().password).toBe(' clave con espacios ');

    solicitud.complete();
  });

  it('llama una sola vez a iniciarSesion', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).toHaveBeenCalledTimes(1);

    solicitud.complete();
  });

  it('activa enviandoFormulario mientras la solicitud esta pendiente', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();

    expect(componente.enviandoFormulario()).toBe(true);

    solicitud.complete();
  });

  it('desactiva enviandoFormulario al completarse', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(componente.enviandoFormulario()).toBe(false);
  });

  it('limpia un error anterior antes de enviar', () => {
    const solicitud = prepararSolicitudPendiente();

    componente.mensajeError.set('Error anterior.');
    completarFormularioValido();
    componente.enviarFormulario();

    expect(componente.mensajeError()).toBeNull();

    solicitud.complete();
  });

  it('navega a raiz al iniciar sesion correctamente', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('sin parametro retorno navega a raiz', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('con retorno usuarios navega a usuarios', () => {
    cambiarRetorno('/usuarios');
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('conserva query params internos en retorno', () => {
    cambiarRetorno('/usuarios?pagina=2');
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios?pagina=2');
  });

  it.each([
    'https://sitio-externo.com',
    'http://sitio-externo.com',
    '//sitio-externo.com',
    'iniciar-sesion',
    '/iniciar-sesion',
    '/iniciar-sesion?retorno=/',
  ])('rechaza retorno invalido %s y navega a raiz', (retornoInvalido) => {
    cambiarRetorno(retornoInvalido);
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('no navega a una URL externa', () => {
    cambiarRetorno('https://sitio-externo.com');
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).not.toHaveBeenCalledWith('https://sitio-externo.com');
  });

  it('no utiliza el correo rol ni datos del backend para construir el retorno', () => {
    cambiarRetorno('/usuarios');
    const solicitud = prepararSolicitudPendiente();
    const datosAutenticacion = crearDatosAutenticacion();
    const respuesta: RespuestaInicioSesion = {
      success: true,
      data: datosAutenticacion,
    };

    datosAutenticacion.user.correo = 'otra.persona@universidad.edu';
    datosAutenticacion.user.rol = {
      id: 1,
      codigo: 'ADMIN',
      nombre: 'Administrador',
    };

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(respuesta);
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
  });

  it('sin retorno un GESTOR_MATRICULA navega a su dashboard', () => {
    autenticacionService.usuarioActual.set(
      crearUsuarioConRol('GESTOR_MATRICULA'),
    );
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard-gestor');
  });

  it('sin retorno un ESTUDIANTE navega a su portal', () => {
    autenticacionService.usuarioActual.set(
      crearUsuarioConRol('ESTUDIANTE'),
    );
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/portal-estudiante');
  });

  it('sin retorno un DOCENTE navega a la raiz', () => {
    autenticacionService.usuarioActual.set(crearUsuarioConRol('DOCENTE'));
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('sin retorno un usuario sin rol navega a acceso denegado', () => {
    autenticacionService.usuarioActual.set(crearUsuarioConRol(null));
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/acceso-denegado');
  });

  it('un retorno valido tiene prioridad sobre la ruta inicial del rol', () => {
    autenticacionService.usuarioActual.set(
      crearUsuarioConRol('ESTUDIANTE'),
    );
    cambiarRetorno('/estudiantes');
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/estudiantes');
  });

  it('no muestra error despues de una respuesta correcta', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    solicitud.next(crearRespuestaExitosa());
    solicitud.complete();

    expect(componente.mensajeError()).toBeNull();
  });

  it('ignora un segundo envio mientras existe una solicitud activa', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).toHaveBeenCalledTimes(1);

    solicitud.complete();
  });

  it('no crea dos llamadas a iniciarSesion durante un envio pendiente', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).toHaveBeenCalledTimes(1);

    solicitud.complete();
  });

  it('la prevencion de doble envio continua funcionando con retorno configurado', () => {
    cambiarRetorno('/usuarios');
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).toHaveBeenCalledTimes(1);

    solicitud.complete();
  });

  it('permite un nuevo intento despues de finalizar la solicitud anterior', () => {
    const primeraSolicitud = new Subject<RespuestaInicioSesion>();
    const segundaSolicitud = new Subject<RespuestaInicioSesion>();

    autenticacionService.iniciarSesion
      .mockReturnValueOnce(primeraSolicitud.asObservable())
      .mockReturnValueOnce(segundaSolicitud.asObservable());

    completarFormularioValido();
    componente.enviarFormulario();
    primeraSolicitud.complete();
    componente.enviarFormulario();

    expect(autenticacionService.iniciarSesion).toHaveBeenCalledTimes(2);

    segundaSolicitud.complete();
  });

  it('ante error no navega', () => {
    prepararError(new HttpErrorResponse({ status: 401 }));

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('los errores de login continuan sin navegar con retorno configurado', () => {
    cambiarRetorno('/usuarios');

    prepararError(new HttpErrorResponse({ status: 401 }));

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('ante error vuelve a habilitar el envio', () => {
    prepararError(new HttpErrorResponse({ status: 401 }));

    expect(componente.enviandoFormulario()).toBe(false);
  });

  it('un error de conexion muestra el mensaje correspondiente', () => {
    prepararError(new HttpErrorResponse({ status: 0 }));

    expect(componente.mensajeError()).toBe(
      'No fue posible conectar con el servidor. Verifique que el backend esté disponible.',
    );
  });

  it('un 401 muestra Correo o contraseña incorrectos', () => {
    prepararError(
      new HttpErrorResponse({
        status: 401,
        error: {
          success: false,
          message: 'Token invalido.',
          code: 'INVALID_CREDENTIALS',
        },
      }),
    );

    expect(componente.mensajeError()).toBe('Correo o contraseña incorrectos.');
  });

  it('un 429 sin Retry-After muestra el mensaje predeterminado', () => {
    prepararError(new HttpErrorResponse({ status: 429 }));

    expect(componente.mensajeError()).toBe(
      'Demasiados intentos. Intente nuevamente más tarde.',
    );
  });

  it('un 429 con Retry-After 30 incluye los 30 segundos', () => {
    prepararError(
      new HttpErrorResponse({
        status: 429,
        headers: new HttpHeaders({ 'Retry-After': '30' }),
      }),
    );

    expect(componente.mensajeError()).toBe(
      'Demasiados intentos. Intente nuevamente en 30 segundos.',
    );
  });

  it('un Retry-After invalido no produce NaN', () => {
    prepararError(
      new HttpErrorResponse({
        status: 429,
        headers: new HttpHeaders({ 'Retry-After': 'texto' }),
      }),
    );

    expect(componente.mensajeError()).toBe(
      'Demasiados intentos. Intente nuevamente más tarde.',
    );
    expect(componente.mensajeError()).not.toContain('NaN');
  });

  it('un error 500 muestra el mensaje de servidor', () => {
    prepararError(new HttpErrorResponse({ status: 500 }));

    expect(componente.mensajeError()).toBe(
      'Ocurrió un error en el servidor. Intente nuevamente más tarde.',
    );
  });

  it('un error desconocido muestra el mensaje general', () => {
    autenticacionService.iniciarSesion.mockReturnValueOnce(
      throwError(() => new Error('Error desconocido.')),
    );

    completarFormularioValido();
    componente.enviarFormulario();

    expect(componente.mensajeError()).toBe('No fue posible iniciar sesión.');
  });

  it('un cuerpo de error invalido no lanza excepciones', () => {
    expect(() =>
      prepararError(new HttpErrorResponse({ status: 400, error: 'error' })),
    ).not.toThrow();
  });

  it('puede utilizar un mensaje valido de validacion del backend para un 400', () => {
    prepararError(
      new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          message: 'El correo es obligatorio.',
        },
      }),
    );

    expect(componente.mensajeError()).toBe('El correo es obligatorio.');
  });

  it('puede utilizar el primer detalle valido de validacion para un 400', () => {
    prepararError(
      new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          details: [{ field: 'correo', message: 'Correo inválido.' }],
        },
      }),
    );

    expect(componente.mensajeError()).toBe('Correo inválido.');
  });

  it('no incluye tokens ni contrasena en los mensajes', () => {
    prepararError(
      new HttpErrorResponse({
        status: 400,
        error: {
          success: false,
          details: [{ message: '' }],
        },
      }),
    );

    expect(componente.mensajeError()).not.toContain('token');
    expect(componente.mensajeError()).not.toContain('clave-ficticia');
  });

  it('existe un h1 con el texto Iniciar sesión', () => {
    expect(obtenerElemento('h1').textContent).toContain('Iniciar sesión');
  });

  it('existe un formulario reactivo', () => {
    const formulario = obtenerElemento('form');

    expect(formulario).toBeTruthy();
  });

  it('el campo correo utiliza type email', () => {
    expect(obtenerInput('#correo').type).toBe('email');
  });

  it('el campo correo utiliza autocomplete username', () => {
    expect(obtenerInput('#correo').autocomplete).toBe('username');
  });

  it('el campo contrasena utiliza type password', () => {
    expect(obtenerInput('#contrasena').type).toBe('password');
  });

  it('el campo contrasena utiliza autocomplete current-password', () => {
    expect(obtenerInput('#contrasena').autocomplete).toBe('current-password');
  });

  it('ambos campos tienen etiquetas asociadas', () => {
    expect(obtenerElemento('label[for="correo"]').textContent).toContain('Correo');
    expect(obtenerElemento('label[for="contrasena"]').textContent).toContain(
      'Contraseña',
    );
  });

  it('el boton es de tipo submit', () => {
    expect(obtenerElemento('.boton-iniciar-sesion').getAttribute('type')).toBe('submit');
  });

  it('el boton se deshabilita durante el envio', () => {
    const solicitud = prepararSolicitudPendiente();

    completarFormularioValido();
    componente.enviarFormulario();
    fixture.detectChanges();

    expect((obtenerElemento('.boton-iniciar-sesion') as HTMLButtonElement).disabled).toBe(true);

    solicitud.complete();
  });

  it('existe un boton para mostrar u ocultar la contrasena', () => {
    expect(obtenerElemento('.boton-mostrar-contrasena').getAttribute('type')).toBe(
      'button',
    );
  });

  it('mostrar la contrasena cambia el tipo del campo a text', () => {
    expect(obtenerInput('#contrasena').type).toBe('password');

    componente.alternarVisibilidadContrasena();
    fixture.detectChanges();

    expect(obtenerInput('#contrasena').type).toBe('text');
  });

  it('ocultar la contrasena vuelve el tipo a password', () => {
    componente.alternarVisibilidadContrasena();
    componente.alternarVisibilidadContrasena();
    fixture.detectChanges();

    expect(obtenerInput('#contrasena').type).toBe('password');
  });

  it('alternar la contrasena no modifica su valor', () => {
    completarFormularioValido();
    componente.alternarVisibilidadContrasena();

    expect(componente.controlContrasena.value).toBe('clave-ficticia');
  });

  it('el selector de perfil no forma parte del request', () => {
    const solicitud = prepararSolicitudPendiente();

    componente.seleccionarPerfil('ESTUDIANTE');
    completarFormularioValido();
    componente.enviarFormulario();

    const credenciales = obtenerCredencialesEnviadas();

    expect(credenciales).toEqual({
      correo: 'persona.prueba@universidad.edu',
      password: 'clave-ficticia',
    });
    expect('perfil' in credenciales).toBe(false);
    expect('tipo' in credenciales).toBe(false);

    solicitud.complete();
  });

  it('seleccionar el mismo perfil nuevamente lo deselecciona', () => {
    componente.seleccionarPerfil('GESTOR');
    expect(componente.perfilSeleccionado()).toBe('GESTOR');

    componente.seleccionarPerfil('GESTOR');
    expect(componente.perfilSeleccionado()).toBeNull();
  });

  it('el selector de perfil incluye la nota de deteccion automatica', () => {
    expect(obtenerTexto()).toContain(
      'El sistema identificará automáticamente su perfil',
    );
  });

  it('el campo contrasena detecta el bloqueo de mayusculas', () => {
    const evento = new KeyboardEvent('keydown', { key: 'a' });

    Object.defineProperty(evento, 'getModifierState', {
      value: () => true,
    });

    componente.detectarBloqMayus(evento);

    expect(componente.bloqMayusActivo()).toBe(true);
  });

  it('el aviso de bloqueo de mayusculas se muestra cuando esta activo', () => {
    componente.bloqMayusActivo.set(true);
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('bloqueo de mayúsculas está activado');
  });

  it('la pagina incluye ayuda para problemas de acceso', () => {
    expect(obtenerTexto()).toContain('¿Problemas para acceder?');
  });

  it('el error general utiliza role alert', () => {
    componente.mensajeError.set('Error de prueba.');
    fixture.detectChanges();

    expect(obtenerElemento('[role="alert"]').textContent).toContain('Error de prueba.');
  });

  it('se muestran mensajes de validacion despues de intentar enviar datos vacios', () => {
    componente.enviarFormulario();
    fixture.detectChanges();

    expect(obtenerTexto()).toContain('Correo obligatorio.');
    expect(obtenerTexto()).toContain('Contraseña obligatoria.');
  });

  function completarFormularioValido(): void {
    componente.formularioInicioSesion.setValue({
      correo: 'persona.prueba@universidad.edu',
      contrasena: 'clave-ficticia',
    });
  }

  function prepararSolicitudPendiente(): Subject<RespuestaInicioSesion> {
    const solicitud = new Subject<RespuestaInicioSesion>();
    autenticacionService.iniciarSesion.mockReturnValueOnce(solicitud.asObservable());

    return solicitud;
  }

  function prepararError(error: unknown): void {
    autenticacionService.iniciarSesion.mockReturnValueOnce(throwError(() => error));
    completarFormularioValido();
    componente.enviarFormulario();
  }

  function cambiarRetorno(retorno: string): void {
    rutaActiva.snapshot.queryParamMap = convertToParamMap({ retorno });
  }

  function obtenerCredencialesEnviadas(): CredencialesInicioSesion {
    const primeraLlamada = autenticacionService.iniciarSesion.mock.calls[0];

    if (!primeraLlamada) {
      throw new Error('No se llamo iniciarSesion.');
    }

    return primeraLlamada[0];
  }

  function obtenerElemento(selector: string): HTMLElement {
    const elemento = fixture.nativeElement.querySelector(selector) as HTMLElement | null;

    if (!elemento) {
      throw new Error(`No se encontro el elemento ${selector}.`);
    }

    return elemento;
  }

  function obtenerInput(selector: string): HTMLInputElement {
    const elemento = obtenerElemento(selector);

    if (!(elemento instanceof HTMLInputElement)) {
      throw new Error(`El elemento ${selector} no es un input.`);
    }

    return elemento;
  }

  function obtenerTexto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, finalize } from 'rxjs';

import { CODIGOS_ROL, type CodigoRol } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { PreferenciasPanelComponent } from '../../shared/components/preferencias-panel/preferencias-panel.component';

interface ItemNavegacion {
  ruta: string;
  etiqueta: string;
  icono: string;
  roles: CodigoRol[];
}

interface GrupoNavegacion {
  nombre: string;
  items: ItemNavegacion[];
}

const GRUPOS_NAVEGACION: GrupoNavegacion[] = [
  {
    nombre: 'GENERAL',
    items: [
      { ruta: '/', etiqueta: 'Inicio', icono: 'M4 10.5 12 3l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE] },
      { ruta: '/dashboard-gestor', etiqueta: 'Dashboard', icono: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M7 8h2M7 12h2M7 16h2M15 8h2M15 12h2M15 16h2', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA] },
    ],
  },
  {
    nombre: 'PERSONAS',
    items: [
      { ruta: '/estudiantes', etiqueta: 'Estudiantes', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA] },
      { ruta: '/docentes', etiqueta: 'Docentes', icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE] },
      { ruta: '/usuarios', etiqueta: 'Usuarios', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 12l2 2 4-4', roles: [CODIGOS_ROL.ADMIN] },
    ],
  },
  {
    nombre: 'GESTIÓN ACADÉMICA',
    items: [
      { ruta: '/periodos-academicos', etiqueta: 'Periodos', icono: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA, CODIGOS_ROL.DOCENTE] },
      { ruta: '/facultades', etiqueta: 'Facultades', icono: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M9 8h6M9 12h6M9 16h6', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE] },
      { ruta: '/carreras', etiqueta: 'Carreras', icono: 'M22 9 12 4 2 9l10 5 10-5ZM6 11.5V16c3 2 9 2 12 0v-4.5', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE] },
      { ruta: '/asignaturas', etiqueta: 'Asignaturas', icono: 'M12 7c-2-2-4-2-6-2H3v13h3c2 0 4 0 6 2 2-2 4-2 6-2h3V5h-3c-2 0-4 0-6 2ZM12 7v13', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE] },
      { ruta: '/malla-curricular', etiqueta: 'Malla curricular', icono: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.DOCENTE] },
      { ruta: '/cursos', etiqueta: 'Cursos', icono: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA, CODIGOS_ROL.DOCENTE] },
    ],
  },
  {
    nombre: 'MATRÍCULAS',
    items: [
      { ruta: '/matriculas', etiqueta: 'Listado', icono: 'M9 11l2 2 4-4M12 3l9 5-9 5-9-5 9-5ZM3 17l9 5 9-5', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA] },
      { ruta: '/matriculas/nueva', etiqueta: 'Nueva matrícula', icono: 'M12 5v14M5 12h14', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA] },
      { ruta: '/matriculas/renovar', etiqueta: 'Renovación', icono: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', roles: [CODIGOS_ROL.ADMIN, CODIGOS_ROL.GESTOR_MATRICULA] },
    ],
  },
  {
    nombre: 'MI ESPACIO',
    items: [
      { ruta: '/portal-estudiante', etiqueta: 'Portal del estudiante', icono: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9c-2.5-3-4-5.5-4-9s1.5-6 4-9Z', roles: [CODIGOS_ROL.ESTUDIANTE] },
    ],
  },
];

@Component({
  selector: 'app-layout-principal',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    PreferenciasPanelComponent,
  ],
  templateUrl: './layout-principal.component.html',
  styleUrl: './layout-principal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPrincipalComponent {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly elementoRef = inject(ElementRef<HTMLElement>);
  private readonly estadoCerrandoSesion = signal(false);
  private readonly estadoMenuMovil = signal(false);
  private readonly estadoSidebarContraido = signal(false);
  private readonly estadoMenuUsuario = signal(false);
  private readonly estadoPanelAbierto = signal(false);
  private readonly estadoTituloPagina = signal('Inicio');

  readonly usuarioActual = this.autenticacionService.usuarioActual;
  readonly cerrandoSesion = this.estadoCerrandoSesion.asReadonly();
  readonly menuMovilAbierto = this.estadoMenuMovil.asReadonly();
  readonly sidebarContraido = this.estadoSidebarContraido.asReadonly();
  readonly menuUsuarioAbierto = this.estadoMenuUsuario.asReadonly();
  readonly panelAbierto = this.estadoPanelAbierto.asReadonly();
  readonly tituloPagina = this.estadoTituloPagina.asReadonly();

  readonly nombreCompletoUsuario = computed(() => {
    const usuario = this.usuarioActual?.() ?? null;

    if (!usuario) {
      return 'Usuario';
    }

    const nombreCompleto = [
      usuario.nombres.trim(),
      usuario.apellidos.trim(),
    ]
      .filter((parteNombre) => parteNombre.length > 0)
      .join(' ');

    return nombreCompleto || 'Usuario';
  });
  readonly inicialesUsuario = computed(() => {
    const usuario = this.usuarioActual?.() ?? null;

    if (!usuario) {
      return 'US';
    }

    const iniciales = [
      usuario.nombres.trim(),
      usuario.apellidos.trim(),
    ]
      .map((parte) => parte.charAt(0).toUpperCase())
      .filter((letra) => letra.length > 0)
      .join('');

    return iniciales || 'US';
  });
  readonly nombreRolUsuario = computed(() => {
    const rol = this.usuarioActual?.()?.rol;

    if (!rol) {
      return 'Sin rol asignado';
    }

    const nombreRol = rol.nombre.trim();

    if (nombreRol) {
      return nombreRol;
    }

    return rol.codigo.trim() || 'Sin rol asignado';
  });
  readonly gruposNavegacion = computed<GrupoNavegacion[]>(() => {
    const codigoRol = this.usuarioActual?.()?.rol?.codigo;

    return GRUPOS_NAVEGACION.map((grupo) => ({
      ...grupo,
      items: grupo.items.filter(
        (item) => item.roles.includes(codigoRol as CodigoRol),
      ),
    })).filter((grupo) => grupo.items.length > 0);
  });

  constructor() {
    this.enrutador.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe(() => this.actualizarTituloPagina());

    this.referenciaDestruccion.onDestroy(() => {
      this.liberarListaKeydown();
    });
  }

  abrirMenuMovil(): void {
    this.estadoMenuMovil.set(true);
  }

  cerrarMenuMovil(): void {
    this.estadoMenuMovil.set(false);
  }

  alternarSidebar(): void {
    this.estadoSidebarContraido.update((contraido) => !contraido);
  }

  alternarMenuUsuario(): void {
    this.estadoMenuUsuario.update((abierto) => {
      const nuevoEstado = !abierto;
      this.gestionarEnfoqueMenuUsuario(nuevoEstado);
      return nuevoEstado;
    });
  }

  abrirPanel(): void {
    this.estadoPanelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.estadoPanelAbierto.set(false);
  }

  alternarPanel(): void {
    if (this.panelAbierto()) {
      this.estadoPanelAbierto.set(false);
      this.devolverFocoAlBotonUsuario();
      return;
    }

    this.estadoPanelAbierto.set(true);
  }

  cerrarMenuUsuario(): void {
    if (this.estadoMenuUsuario()) {
      this.estadoMenuUsuario.set(false);
      this.devolverFocoAlBotonUsuario();
    }
  }

  cerrarSesion(): void {
    if (this.cerrandoSesion()) {
      return;
    }

    this.estadoCerrandoSesion.set(true);
    this.autenticacionService.cerrarSesion()
      .pipe(
        takeUntilDestroyed(this.referenciaDestruccion),
        finalize(() => this.estadoCerrandoSesion.set(false)),
      )
      .subscribe({
        next: () => this.completarCierreSesion(),
        error: () => this.completarCierreSesion(),
      });
  }

  manejarTecladoMenuUsuario(evento: Event): void {
    const eventoTeclado = evento as KeyboardEvent;

    if (eventoTeclado.key === 'Escape') {
      this.cerrarMenuUsuario();
    }
  }

  private completarCierreSesion(): void {
    this.estadoMenuMovil.set(false);
    void this.enrutador.navigateByUrl('/iniciar-sesion');
  }

  private gestionarEnfoqueMenuUsuario(abierto: boolean): void {
    if (!abierto) {
      return;
    }

    this.referenciaDestruccion.onDestroy(() => {
      this.liberarListaKeydown();
    });

    setTimeout(() => {
      this.obtenerPrimerElementoMenu()?.focus();
    });
  }

  private obtenerPrimerElementoMenu(): HTMLElement | null {
    const elementoRaiz = this.elementoRef.nativeElement as HTMLElement;
    const menu = elementoRaiz.querySelector('.menu-usuario');

    if (!menu) {
      return null;
    }

    const primerElementoEnfocable = menu.querySelector<HTMLElement>(
      'button:not([disabled]), a[href]',
    );

    return primerElementoEnfocable;
  }
  private liberarListaKeydown(): void {
    // Reservado: se puede ampliar el ciclo de vida si se agregan más elementos.
  }

  private devolverFocoAlBotonUsuario(): void {
    const boton = this.elementoRef.nativeElement.querySelector(
      '.boton-menu-usuario',
    ) as HTMLElement | null;

    boton?.focus();
  }

  private actualizarTituloPagina(): void {
    const titulos = this.obtenerTitulosDeRuta();
    this.estadoTituloPagina.set(titulos.length > 0 ? titulos[titulos.length - 1] : 'Inicio');
  }

  private obtenerTitulosDeRuta(): string[] {
    const titulos: string[] = [];
    let ruta: ActivatedRouteSnapshot | null = this.enrutador.routerState.root.snapshot;

    while (ruta) {
      const titulo = ruta.data?.['title'];

      if (typeof titulo === 'string' && titulo.length > 0) {
        titulos.push(titulo);
      }

      ruta = ruta.firstChild;
    }

    return titulos;
  }
}

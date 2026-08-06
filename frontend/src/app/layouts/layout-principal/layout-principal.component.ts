import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';

interface ItemNavegacion {
  ruta: string;
  etiqueta: string;
  icono: string;
  soloAdministrador?: boolean;
}

@Component({
  selector: 'app-layout-principal',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout-principal.component.html',
  styleUrl: './layout-principal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPrincipalComponent {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly enrutador = inject(Router);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly estadoCerrandoSesion = signal(false);
  private readonly estadoMenuMovil = signal(false);
  private readonly estadoTituloPagina = signal('Inicio');

  readonly usuarioActual = this.autenticacionService.usuarioActual;
  readonly cerrandoSesion = this.estadoCerrandoSesion.asReadonly();
  readonly menuMovilAbierto = this.estadoMenuMovil.asReadonly();
  readonly tituloPagina = this.estadoTituloPagina.asReadonly();
  readonly esAdministrador = computed(
    () => this.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
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
      return 'SM';
    }

    const iniciales = [
      usuario.nombres.trim().charAt(0),
      usuario.apellidos.trim().charAt(0),
    ].join('').toUpperCase();

    return iniciales || 'SM';
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
  readonly itemsNavegacion: ItemNavegacion[] = [
    { ruta: '/', etiqueta: 'Inicio', icono: 'M4 10.5 12 3l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z' },
    { ruta: '/periodos-academicos', etiqueta: 'Periodos académicos', icono: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' },
    { ruta: '/facultades', etiqueta: 'Facultades', icono: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M9 8h6M9 12h6M9 16h6' },
    { ruta: '/carreras', etiqueta: 'Carreras', icono: 'M22 9 12 4 2 9l10 5 10-5ZM6 11.5V16c3 2 9 2 12 0v-4.5' },
    { ruta: '/asignaturas', etiqueta: 'Asignaturas', icono: 'M12 7c-2-2-4-2-6-2H3v13h3c2 0 4 0 6 2 2-2 4-2 6-2h3V5h-3c-2 0-4 0-6 2ZM12 7v13' },
    { ruta: '/malla-curricular', etiqueta: 'Malla curricular', icono: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5' },
    { ruta: '/cursos', etiqueta: 'Cursos', icono: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5' },
    { ruta: '/estudiantes', etiqueta: 'Estudiantes', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { ruta: '/docentes', etiqueta: 'Docentes', icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
    { ruta: '/matriculas', etiqueta: 'Matrículas', icono: 'M9 11l2 2 4-4M12 3l9 5-9 5-9-5 9-5ZM3 17l9 5 9-5' },
    { ruta: '/usuarios', etiqueta: 'Usuarios', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 12l2 2 4-4', soloAdministrador: true },
  ];
  readonly itemsNavegacionVisibles = computed(
    () => this.itemsNavegacion.filter((item) => !item.soloAdministrador || this.esAdministrador()),
  );

  constructor() {
    this.enrutador.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.referenciaDestruccion),
      )
      .subscribe(() => this.actualizarTituloPagina());
  }

  abrirMenuMovil(): void {
    this.estadoMenuMovil.set(true);
  }

  cerrarMenuMovil(): void {
    this.estadoMenuMovil.set(false);
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

  private completarCierreSesion(): void {
    this.estadoMenuMovil.set(false);
    void this.enrutador.navigateByUrl('/iniciar-sesion');
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

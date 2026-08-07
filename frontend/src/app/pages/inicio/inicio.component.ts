import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CODIGOS_ROL } from '../../core/config/codigos-rol';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';

interface ModuloAcceso {
  ruta: string;
  titulo: string;
  descripcion: string;
  icono: string;
  soloAdministrador?: boolean;
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, FechaPipe],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent {
  private readonly autenticacionService = inject(AutenticacionService);

  private readonly usuarioActual = this.autenticacionService.usuarioActual;
  readonly nombreUsuario = computed(() => {
    const usuario = this.usuarioActual?.() ?? null;

    if (!usuario) {
      return '';
    }

    return [
      usuario.nombres.trim(),
      usuario.apellidos.trim(),
    ]
      .filter((parteNombre) => parteNombre.length > 0)
      .join(' ')
      .trim();
  });
  readonly nombreRolUsuario = computed(() => {
    const rol = this.usuarioActual?.()?.rol;

    if (!rol) {
      return null;
    }

    const nombreRol = rol.nombre.trim();

    if (nombreRol) {
      return nombreRol;
    }

    return rol.codigo.trim() || null;
  });
  readonly esAdministrador = computed(
    () => this.usuarioActual?.()?.rol?.codigo === CODIGOS_ROL.ADMIN,
  );
  readonly fechaHoy = new Date();
  readonly fechaHoyDatetime = this.fechaHoy.toLocaleDateString('en-CA');

  private readonly modulos: ModuloAcceso[] = [
    { ruta: '/periodos-academicos', titulo: 'Periodos académicos', descripcion: 'Gestiona los periodos del calendario académico.', icono: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' },
    { ruta: '/facultades', titulo: 'Facultades', descripcion: 'Consulta y administra las facultades.', icono: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M9 8h6M9 12h6M9 16h6' },
    { ruta: '/carreras', titulo: 'Carreras', descripcion: 'Revisa las carreras ofertadas.', icono: 'M22 9 12 4 2 9l10 5 10-5ZM6 11.5V16c3 2 9 2 12 0v-4.5' },
    { ruta: '/asignaturas', titulo: 'Asignaturas', descripcion: 'Consulta las asignaturas disponibles.', icono: 'M12 7c-2-2-4-2-6-2H3v13h3c2 0 4 0 6 2 2-2 4-2 6-2h3V5h-3c-2 0-4 0-6 2ZM12 7v13' },
    { ruta: '/malla-curricular', titulo: 'Malla curricular', descripcion: 'Explora las mallas por carrera.', icono: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5' },
    { ruta: '/cursos', titulo: 'Cursos', descripcion: 'Gestiona cursos y su oferta.', icono: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5' },
    { ruta: '/estudiantes', titulo: 'Estudiantes', descripcion: 'Consulta la información de estudiantes.', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { ruta: '/docentes', titulo: 'Docentes', descripcion: 'Consulta la información de docentes.', icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
    { ruta: '/matriculas', titulo: 'Matrículas', descripcion: 'Administra el proceso de matrícula.', icono: 'M9 11l2 2 4-4M12 3l9 5-9 5-9-5 9-5ZM3 17l9 5 9-5' },
    { ruta: '/usuarios', titulo: 'Usuarios', descripcion: 'Administra los usuarios del sistema.', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 12l2 2 4-4', soloAdministrador: true },
  ];
  readonly modulosVisibles = computed(
    () => this.modulos.filter((modulo) => !modulo.soloAdministrador || this.esAdministrador()),
  );
}
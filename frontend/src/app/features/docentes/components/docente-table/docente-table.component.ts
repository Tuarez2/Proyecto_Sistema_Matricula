import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import type { Docente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docente-table.component.html',
  styleUrl: './docente-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocenteTableComponent {
  @Input() docentes: Docente[] = [];
  @Input() esAdministrador = false;
  @Input() idDocenteProcesando: number | null = null;

  @Output() editarDocente = new EventEmitter<Docente>();
  @Output() cambiarEstadoDocente = new EventEmitter<Docente>();

  obtenerNombreCompleto(docente: Docente): string {
    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  obtenerEtiquetaEstado(docente: Docente): string {
    return docente.activo ? 'Activo' : 'Inactivo';
  }
}

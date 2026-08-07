import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { esElementoInteractivo } from '../../../../shared/components/barra-acciones-contextuales/barra-acciones-contextuales.component';
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
  @Input() filaSeleccionadaId: number | null = null;

  @Output() editarDocente = new EventEmitter<Docente>();
  @Output() cambiarEstadoDocente = new EventEmitter<Docente>();
  @Output() seleccionarFila = new EventEmitter<Docente>();
  @Output() seleccionarFilaTeclado = new EventEmitter<Docente>();
  @Output() alternarSeleccion = new EventEmitter<Docente>();

  manejarClicFila(evento: MouseEvent, docente: Docente): void {
    if (esElementoInteractivo(evento.target)) {
      return;
    }

    this.seleccionarFila.emit(docente);
  }

  manejarTecladoFila(evento: KeyboardEvent, docente: Docente): void {
    if (esElementoInteractivo(evento.target)) {
      return;
    }

    if (evento.key !== 'Enter' && evento.key !== ' ') {
      return;
    }

    evento.preventDefault();
    this.seleccionarFilaTeclado.emit(docente);
  }

  obtenerNombreCompleto(docente: Docente): string {
    return `${docente.nombres} ${docente.apellidos}`.trim();
  }

  obtenerEtiquetaEstado(docente: Docente): string {
    return docente.activo ? 'Activo' : 'Inactivo';
  }

  obtenerClaseEstado(docente: Docente): string {
    return docente.activo ? 'estado-badge--success' : 'estado-badge--neutral';
  }
}

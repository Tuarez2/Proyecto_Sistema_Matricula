import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatriculasService } from '../../services/matriculas.service';
import { Matricula } from '../../models/matricula.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-listar-matriculas',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './listar-matriculas.component.html'
})
export class ListarMatriculasComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  matriculas: Matricula[] = [];

  // Control del modal
  showConfirmModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalBtnClass = 'btn-primary';

  private idSeleccionado?: number;
  private nuevoEstadoSeleccionado?: 'REGISTRADA' | 'ANULADA' | 'FINALIZADA';

  ngOnInit(): void {
    this.cargarMatriculas();
  }

  cargarMatriculas(): void {
    this.matriculasService.getMatriculas().subscribe({
      next: (data) => this.matriculas = data,
      error: (err) => console.error('Error al obtener matrículas', err)
    });
  }

  solicitarCambioEstado(id?: number, nuevoEstado?: 'REGISTRADA' | 'ANULADA' | 'FINALIZADA'): void {
    if (!id || !nuevoEstado) return;

    this.idSeleccionado = id;
    this.nuevoEstadoSeleccionado = nuevoEstado;
    this.modalTitulo = 'Cambiar Estado de Matrícula';
    this.modalMensaje = `¿Desea cambiar el estado de la matrícula a ${nuevoEstado}?`;
    this.modalBtnClass = nuevoEstado === 'ANULADA' ? 'btn-danger' : 'btn-warning';
    this.showConfirmModal = true;
  }

  confirmarCambioEstado(): void {
    if (this.idSeleccionado && this.nuevoEstadoSeleccionado) {
      this.matriculasService.cambiarEstado(this.idSeleccionado, this.nuevoEstadoSeleccionado).subscribe({
        next: () => {
          this.showConfirmModal = false;
          this.cargarMatriculas();
        },
        error: (err) => {
          this.showConfirmModal = false;
          console.error('Error al actualizar estado', err);
        }
      });
    }
  }

  cancelarCambioEstado(): void {
    this.showConfirmModal = false;
    this.idSeleccionado = undefined;
    this.nuevoEstadoSeleccionado = undefined;
  }
}
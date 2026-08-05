import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatriculasService } from '../../services/matriculas.service';
import { Matricula } from '../../models/matricula.model';

@Component({
  selector: 'app-listar-matriculas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listar-matriculas.component.html'
})
export class ListarMatriculasComponent implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  matriculas: Matricula[] = [];

  ngOnInit(): void {
    this.cargarMatriculas();
  }

  cargarMatriculas(): void {
    this.matriculasService.getMatriculas().subscribe({
      next: (data) => this.matriculas = data,
      error: (err) => console.error('Error al obtener matrículas', err)
    });
  }

  cambiarEstado(id?: number, nuevoEstado?: 'REGISTRADA' | 'ANULADA' | 'FINALIZADA'): void {
    if (id && nuevoEstado && confirm(`¿Desea cambiar el estado de la matrícula a ${nuevoEstado}?`)) {
      this.matriculasService.cambiarEstado(id, nuevoEstado).subscribe({
        next: () => this.cargarMatriculas(),
        error: (err) => console.error('Error al actualizar estado', err)
      });
    }
  }
}

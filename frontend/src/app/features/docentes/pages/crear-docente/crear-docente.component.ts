import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DocenteFormComponent } from '../../components/docente-form/docente-form.component';
import { Docente } from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';

@Component({
  selector: 'app-crear-docente',
  imports: [DocenteFormComponent],
  templateUrl: './crear-docente.component.html',
  styleUrl: './crear-docente.component.css',
})
export class CrearDocenteComponent {
  private readonly docentesService = inject(DocentesService);
  private readonly enrutador = inject(Router);

  guardar(docente: Docente): void {
    this.docentesService.crearDocente(docente).subscribe({
      next: () => this.volverAlListado(),
    });
  }

  cancelar(): void {
    this.volverAlListado();
  }

  private volverAlListado(): void {
    void this.enrutador.navigateByUrl('/docentes');
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DocenteFormComponent } from '../../components/docente-form/docente-form.component';
import { Docente } from '../../models/docente.model';
import { DocentesService } from '../../services/docentes.service';

@Component({
  selector: 'app-editar-docente',
  imports: [DocenteFormComponent],
  templateUrl: './editar-docente.component.html',
  styleUrl: './editar-docente.component.css',
})
export class EditarDocenteComponent implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly docentesService = inject(DocentesService);
  private readonly enrutador = inject(Router);

  docente?: Docente;
  docenteNoEncontrado = false;
  private docenteId = 0;

  ngOnInit(): void {
    this.docenteId = Number(this.rutaActiva.snapshot.paramMap.get('id'));

    if (!this.docenteId) {
      this.docenteNoEncontrado = true;
      return;
    }

    this.docentesService.getDocenteById(this.docenteId).subscribe({
      next: (docente) => {
        this.docente = docente;
        this.docenteNoEncontrado = !docente;
      },
      error: () => {
        this.docenteNoEncontrado = true;
      },
    });
  }

  guardar(docente: Docente): void {
    this.docentesService.actualizarDocente(this.docenteId, docente).subscribe({
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

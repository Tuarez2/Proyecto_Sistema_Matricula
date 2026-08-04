import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading" class="d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <span class="ms-3 text-muted fw-semibold">{{ text }}</span>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() isLoading: boolean = false;
  @Input() text: string = 'Cargando datos...';
}

import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading" class="d-flex justify-content-center align-items-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <span class="ms-2 text-secondary">{{ mensaje }}</span>
    </div>
  `
})
export class SpinnerComponent {
  @Input() isLoading = false;
  @Input() mensaje = 'Cargando datos...';}
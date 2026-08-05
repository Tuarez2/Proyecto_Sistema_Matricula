import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="mensaje" class="alert alert-dismissible fade show" [ngClass]="'alert-' + tipo" role="alert">
      <strong>{{ titulo }}:</strong> {{ mensaje }}
      <ul *ngIf="detalles.length > 0" class="mb-0 mt-2">
        <li *ngFor="let d of detalles">{{ d }}</li>
      </ul>
    </div>
  `
})
export class AlertComponent {
  @Input() tipo: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  @Input() titulo = 'Error';
  @Input() mensaje: string | null = null;
  @Input() detalles: string[] = [];
}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="totalPages > 1">
      <small class="text-muted">Página {{ currentPage }} de {{ totalPages }}</small>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="currentPage === 1">
            <button class="page-link" (click)="changePage(currentPage - 1)">Anterior</button>
          </li>
          <li 
            *ngFor="let page of pages" 
            class="page-item" 
            [class.active]="page === currentPage">
            <button class="page-link" (click)="changePage(page)">{{ page }}</button>
          </li>
          <li class="page-item" [class.disabled]="currentPage === totalPages">
            <button class="page-link" (click)="changePage(currentPage + 1)">Siguiente</button>
          </li>
        </ul>
      </nav>
    </div>
  `
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
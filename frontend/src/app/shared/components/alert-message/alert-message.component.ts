import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-message.component.html'
})
export class AlertMessageComponent {
  @Input() type: 'danger' | 'warning' | 'success' | 'info' = 'danger';
  @Input() title: string = '';
  @Input() message: string | null = null;
  @Input() dismissible: boolean = true;

  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.message = null;
    this.onClose.emit();
  }
}

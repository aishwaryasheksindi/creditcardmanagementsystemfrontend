import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.component.html',
  styleUrls: ['./error-state.component.scss'],
  standalone: false
})
export class ErrorStateComponent {
  @Input() title: string = 'Unable to load information';
  @Input() message: string = 'An unexpected error occurred while communicating with the server.';
  @Input() retryLabel: string = 'Try Again';
  @Output() retryClicked = new EventEmitter<void>();

  onRetry(): void {
    this.retryClicked.emit();
  }
}

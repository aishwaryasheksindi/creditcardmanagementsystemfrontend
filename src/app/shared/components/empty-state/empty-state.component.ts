import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: false
})
export class EmptyStateComponent {
  @Input() title: string = 'No records found';
  @Input() message: string = 'There are currently no items to display.';
  @Input() actionLabel?: string;
  @Output() actionClicked = new EventEmitter<void>();

  onAction(): void {
    this.actionClicked.emit();
  }
}

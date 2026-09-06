import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'info' | 'warning';
}

@Component({
  selector: 'app-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
  standalone: false
})
export class NotificationPanelComponent {
  @Input() isOpen: boolean = false;
  @Output() closePanel = new EventEmitter<void>();

  notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'AI Anomaly Detection Online',
      message: 'Real-time transaction pattern analysis engine is active.',
      time: 'Just now',
      type: 'info'
    },
    {
      id: '2',
      title: 'Risk Profile Scanned',
      message: 'Portfolio vulnerability scan completed with 0 critical flags.',
      time: '12m ago',
      type: 'warning'
    },
    {
      id: '3',
      title: 'Settlement Engine Ready',
      message: 'Scheduled billing cycle calculation completed.',
      time: '1h ago',
      type: 'info'
    }
  ];

  onClose(): void {
    this.closePanel.emit();
  }
}

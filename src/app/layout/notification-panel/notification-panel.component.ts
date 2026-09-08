import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';

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
export class NotificationPanelComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Output() closePanel = new EventEmitter<void>();

  notifications: NotificationItem[] = [];
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    const isCustomer = this.authService.hasRole('CUSTOMER');
    this.isLoading = true;

    if (isCustomer) {
      this.customerService.getMyProfile().pipe(
        switchMap(customer => {
          if (!customer?.customerId) {
            return of([] as Notification[]);
          }
          return this.notificationService.getNotificationsByCustomerId(customer.customerId).pipe(
            catchError(() => of([] as Notification[]))
          );
        }),
        catchError(() => of([] as Notification[]))
      ).subscribe({
        next: (items) => {
          this.mapAndSetNotifications(items);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.notificationService.getAllNotifications().pipe(
        catchError(() => of([] as Notification[]))
      ).subscribe({
        next: (items) => {
          this.mapAndSetNotifications(items);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  private mapAndSetNotifications(items: Notification[]): void {
    if (items && items.length > 0) {
      this.notifications = items.map(n => {
        let type: 'alert' | 'info' | 'warning' = 'info';
        const typeStr = n.type ? n.type.toUpperCase() : '';
        if (typeStr.includes('FRAUD') || typeStr.includes('ALERT') || typeStr.includes('SUSPICIOUS')) {
          type = 'alert';
        } else if (typeStr.includes('PAYMENT') || typeStr.includes('SUCCESS') || typeStr.includes('STATEMENT')) {
          type = 'info';
        } else {
          type = 'warning';
        }

        let timeStr = 'Recently';
        if (n.createdAt) {
          try {
            const date = new Date(n.createdAt);
            timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch {
            timeStr = 'Recently';
          }
        }

        return {
          id: n.notificationId,
          title: n.type ? `${n.type.replace(/_/g, ' ')} Alert` : 'System Notification',
          message: n.message,
          time: timeStr,
          type: type
        };
      });
    } else {
      // Default initial notifications if none returned from backend
      this.notifications = [
        {
          id: '1',
          title: 'Account Security Active',
          message: 'Real-time card monitoring and 2FA fraud shield is active.',
          time: 'Just now',
          type: 'info'
        },
        {
          id: '2',
          title: 'Billing Cycle Notice',
          message: 'Automated billing and statement generation runs monthly.',
          time: '1h ago',
          type: 'info'
        }
      ];
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }
}

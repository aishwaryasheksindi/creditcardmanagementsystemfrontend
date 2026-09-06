import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false
})
export class NavbarComponent {
  @Input() isSidebarOpen: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();

  unreadNotificationCount = 3;

  constructor(public authService: AuthService) {}

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleNotifications(): void {
    this.toggleNotifications.emit();
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false
})
export class NavbarComponent implements OnInit {
  @Input() isSidebarOpen: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();

  unreadNotificationCount = 3;

  constructor(
    public authService: AuthService,
    public profileService: ProfileService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.profileService.loadMyProfile().subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleNotifications(): void {
    this.toggleNotifications.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }
}

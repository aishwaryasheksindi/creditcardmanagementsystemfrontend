import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: false
})
export class MainLayoutComponent {
  isSidebarCollapsed: boolean = false;
  isMobileSidebarOpen: boolean = false;
  isNotificationsOpen: boolean = false;

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth > 992 && this.isMobileSidebarOpen) {
      this.isMobileSidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 992) {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }
}

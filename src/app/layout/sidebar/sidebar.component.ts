import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NAVIGATION_ITEMS } from '../../core/constants/navigation.constants';
import { NavItem } from '../../core/models/nav-item.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})
export class SidebarComponent {
  @Input() isCollapsed: boolean = false;
  @Output() navItemClicked = new EventEmitter<void>();

  navItems: NavItem[] = NAVIGATION_ITEMS;

  constructor(private authService: AuthService) {}

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter((item) => this.authService.hasAnyRole(item.roles));
  }

  onNavClick(): void {
    this.navItemClicked.emit();
  }
}

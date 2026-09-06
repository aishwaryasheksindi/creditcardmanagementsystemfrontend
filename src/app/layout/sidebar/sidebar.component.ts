import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NAVIGATION_ITEMS } from '../../core/constants/navigation.constants';
import { NavItem } from '../../core/models/nav-item.model';

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

  onNavClick(): void {
    this.navItemClicked.emit();
  }
}

import { Component, OnInit } from '@angular/core';
import { Staff } from '../../../../core/models/staff.model';
import { StaffService } from '../../../../core/services/staff.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-staff-list',
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss'],
  standalone: false
})
export class StaffListComponent implements OnInit {
  staffList: Staff[] = [];
  filteredStaff: Staff[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  searchName: string = '';
  searchPhone: string = '';
  selectedRoleFilter: string = 'ALL';

  constructor(
    private staffService: StaffService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.staffService.getAllStaff().subscribe({
      next: (staff) => {
        const userIds = staff.map(s => s.userId).filter(id => !!id);
        if (userIds.length > 0) {
          this.userService.resolveUserRoles(userIds).subscribe({
            next: (roleMap) => {
              this.staffList = staff.map(s => ({
                ...s,
                roleName: roleMap.get(s.userId) || s.empDesignation || 'STAFF'
              }));
              this.applyClientFilters();
              this.isLoading = false;
            },
            error: () => {
              // Gracefully fall back to designations if user lookup has an issue
              this.staffList = staff.map(s => ({
                ...s,
                roleName: s.empDesignation || 'STAFF'
              }));
              this.applyClientFilters();
              this.isLoading = false;
            }
          });
        } else {
          this.staffList = staff;
          this.applyClientFilters();
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to load staff directory. Please verify your connection.';
      }
    });
  }

  onSearch(): void {
    if (!this.searchName.trim() && !this.searchPhone.trim()) {
      this.applyClientFilters();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.staffService.searchStaff(this.searchName, this.searchPhone).subscribe({
      next: (staff) => {
        const userIds = staff.map(s => s.userId).filter(id => !!id);
        this.userService.resolveUserRoles(userIds).subscribe({
          next: (roleMap) => {
            this.staffList = staff.map(s => ({
              ...s,
              roleName: roleMap.get(s.userId) || s.empDesignation || 'STAFF'
            }));
            this.applyClientFilters();
            this.isLoading = false;
          },
          error: () => {
            this.staffList = staff.map(s => ({
              ...s,
              roleName: s.empDesignation || 'STAFF'
            }));
            this.applyClientFilters();
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed searching staff records.';
      }
    });
  }

  onClearSearch(): void {
    this.searchName = '';
    this.searchPhone = '';
    this.selectedRoleFilter = 'ALL';
    this.loadStaff();
  }

  onRoleFilterChange(role: string): void {
    this.selectedRoleFilter = role;
    this.applyClientFilters();
  }

  applyClientFilters(): void {
    let result = [...this.staffList];

    if (this.selectedRoleFilter !== 'ALL') {
      result = result.filter(s => {
        const role = (s.roleName || '').toUpperCase();
        return role.includes(this.selectedRoleFilter.toUpperCase());
      });
    }

    if (this.searchName.trim()) {
      const q = this.searchName.trim().toLowerCase();
      result = result.filter(s =>
        (s.empName && s.empName.toLowerCase().includes(q)) ||
        (s.staffId && s.staffId.toLowerCase().includes(q)) ||
        (s.empDesignation && s.empDesignation.toLowerCase().includes(q))
      );
    }

    if (this.searchPhone.trim()) {
      const q = this.searchPhone.trim().toLowerCase();
      result = result.filter(s => s.empPhone && s.empPhone.toLowerCase().includes(q));
    }

    this.filteredStaff = result;
  }

  getRoleBadgeClass(roleName?: string): string {
    const role = (roleName || '').toUpperCase();
    if (role.includes('ADMIN')) return 'badge-role-admin';
    if (role.includes('BANK_OFFICER') || role.includes('OFFICER')) return 'badge-role-officer';
    if (role.includes('FRAUD')) return 'badge-role-fraud';
    if (role.includes('CUSTOMER_SERVICE') || role.includes('AGENT')) return 'badge-role-agent';
    return 'badge-role-default';
  }

  formatRoleLabel(roleName?: string): string {
    if (!roleName) return 'Staff';
    const role = roleName.toUpperCase();
    if (role === 'ADMIN') return 'Administrator';
    if (role === 'BANK_OFFICER') return 'Bank Officer';
    if (role === 'FRAUD_ANALYST') return 'Fraud Analyst';
    if (role === 'CUSTOMER_SERVICE_AGENT') return 'Customer Service Agent';
    return roleName;
  }
}

import { Component, OnInit } from '@angular/core';
import { AuditLog } from '../../../core/models/audit-log.model';
import { AuditLogService } from '../../../core/services/audit-log.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  standalone: false
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  filterEntityType: string = '';
  filterEntityId: string = '';
  searchTerm: string = '';
  selectedActionFilter: string = 'ALL';

  readonly commonEntityTypes: string[] = [
    'Staff',
    'User',
    'Customer',
    'Card',
    'CardApplication',
    'Transaction',
    'Payment'
  ];

  readonly actionFilters: string[] = [
    'ALL',
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT'
  ];

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.auditLogService.getAllAuditLogs(this.filterEntityType, this.filterEntityId).subscribe({
      next: (logs) => {
        // Sort descending by timestamp (newest records first)
        this.auditLogs = [...logs].sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
        this.applyClientFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to retrieve audit log entries. Please try again.';
      }
    });
  }

  onFilterSubmit(): void {
    this.loadAuditLogs();
  }

  onResetFilters(): void {
    this.filterEntityType = '';
    this.filterEntityId = '';
    this.searchTerm = '';
    this.selectedActionFilter = 'ALL';
    this.loadAuditLogs();
  }

  applyClientFilters(): void {
    let result = [...this.auditLogs];

    if (this.selectedActionFilter !== 'ALL') {
      result = result.filter(log =>
        (log.action || '').toUpperCase() === this.selectedActionFilter
      );
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      result = result.filter(log =>
        (log.description && log.description.toLowerCase().includes(q)) ||
        (log.performedByUserId && log.performedByUserId.toLowerCase().includes(q)) ||
        (log.entityId && log.entityId.toLowerCase().includes(q)) ||
        (log.auditLogId && log.auditLogId.toLowerCase().includes(q))
      );
    }

    this.filteredLogs = result;
  }

  getActionBadgeClass(action?: string): string {
    const act = (action || '').toUpperCase();
    switch (act) {
      case 'CREATE':
        return 'badge-action-create';
      case 'UPDATE':
        return 'badge-action-update';
      case 'DELETE':
        return 'badge-action-delete';
      case 'LOGIN':
      case 'LOGOUT':
        return 'badge-action-auth';
      default:
        return 'badge-action-default';
    }
  }
}

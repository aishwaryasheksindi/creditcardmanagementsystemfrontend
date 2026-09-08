import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StaffService } from '../../core/services/staff.service';
import { AuditLogService } from '../../core/services/audit-log.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: false
})
export class AdminComponent implements OnInit {
  totalStaff: number | null = null;
  totalAuditLogs: number | null = null;
  isLoading: boolean = false;
  hasError: boolean = false;

  constructor(
    private staffService: StaffService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit(): void {
    this.loadAdminStats();
  }

  loadAdminStats(): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      staff: this.staffService.getAllStaff().pipe(catchError(() => of([]))),
      logs: this.auditLogService.getAllAuditLogs().pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.totalStaff = res.staff.length;
        this.totalAuditLogs = res.logs.length;
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }
}

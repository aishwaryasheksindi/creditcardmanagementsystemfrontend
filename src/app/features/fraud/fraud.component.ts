import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FraudService } from '../../core/services/fraud.service';
import { ApiService } from '../../core/services/api.service';
import { FraudAlert, RiskScore } from '../../core/models/fraud.model';

@Component({
  selector: 'app-fraud',
  templateUrl: './fraud.component.html',
  styleUrls: ['./fraud.component.scss'],
  standalone: false
})
export class FraudComponent implements OnInit {
  activeTab: 'alerts' | 'riskScores' = 'alerts';

  fraudAlerts: FraudAlert[] = [];
  filteredAlerts: FraudAlert[] = [];
  riskScores: RiskScore[] = [];
  filteredScores: RiskScore[] = [];

  isLoading: boolean = false;
  errorMessage: string | null = null;
  actionMessage: string | null = null;
  currentStaffId: string | null = null;

  // Filters
  selectedStatusFilter: string = 'ALL';
  searchQuery: string = '';

  // Metrics
  totalAlertsCount: number = 0;
  openAlertsCount: number = 0;
  investigatingCount: number = 0;
  confirmedCount: number = 0;
  highRiskCount: number = 0;

  constructor(
    private fraudService: FraudService,
    private apiService: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.apiService.get<any>('/users/me').pipe(catchError(() => of(null))).subscribe({
      next: (user) => {
        if (user && user.staffId) {
          this.currentStaffId = user.staffId;
        }
      }
    });
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      alerts: this.fraudService.getAllFraudAlerts().pipe(catchError(() => of([]))),
      scores: this.fraudService.getAllRiskScores().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ alerts, scores }) => {
        this.ngZone.run(() => {
          this.fraudAlerts = alerts || [];
          this.riskScores = scores || [];

          this.totalAlertsCount = this.fraudAlerts.length;
          this.openAlertsCount = this.fraudAlerts.filter(a => a.status === 'OPEN' || a.status === 'PENDING').length;
          this.investigatingCount = this.fraudAlerts.filter(a => a.status === 'INVESTIGATING').length;
          this.confirmedCount = this.fraudAlerts.filter(a => a.status === 'CONFIRMED').length;
          this.highRiskCount = this.riskScores.filter(s => s.riskLevel === 'HIGH' || (Number(s.score) || 0) >= 75).length;

          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load fraud monitoring telemetry. Please try again.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  applyFilters(): void {
    if (this.activeTab === 'alerts') {
      let result = [...this.fraudAlerts];
      if (this.selectedStatusFilter !== 'ALL') {
        result = result.filter(a => a.status === this.selectedStatusFilter || (this.selectedStatusFilter === 'OPEN' && a.status === 'PENDING'));
      }
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        result = result.filter(a =>
          a.fraudAlertId.toLowerCase().includes(q) ||
          a.transactionId.toLowerCase().includes(q) ||
          (a.reason && a.reason.toLowerCase().includes(q))
        );
      }
      this.filteredAlerts = result;
    } else {
      let result = [...this.riskScores];
      if (this.selectedStatusFilter !== 'ALL') {
        result = result.filter(s => s.riskLevel === this.selectedStatusFilter);
      }
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        result = result.filter(s =>
          s.riskScoreId.toLowerCase().includes(q) ||
          s.transactionId.toLowerCase().includes(q) ||
          (s.riskFactors && s.riskFactors.toLowerCase().includes(q))
        );
      }
      this.filteredScores = result;
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  setTab(tab: 'alerts' | 'riskScores'): void {
    this.activeTab = tab;
    this.selectedStatusFilter = 'ALL';
    this.searchQuery = '';
    this.applyFilters();
  }

  updateAlertStatus(alert: FraudAlert, newStatus: 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED'): void {
    const investigatorId = this.currentStaffId || alert.investigatorStaffId || 'STF7341';
    const isClosing = (newStatus === 'CONFIRMED' || newStatus === 'FALSE_POSITIVE' || newStatus === 'CLOSED');
    const updatePayload = {
      ...alert,
      status: newStatus,
      investigatorStaffId: investigatorId,
      closedAt: isClosing ? new Date().toISOString() : undefined
    };

    this.fraudService.updateFraudAlert(alert.fraudAlertId, updatePayload).subscribe({
      next: () => {
        this.actionMessage = `Alert ${alert.fraudAlertId} status updated to ${newStatus}.`;
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || `Failed to update alert ${alert.fraudAlertId}.`;
      }
    });
  }

  getAlertBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN':
      case 'PENDING':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'INVESTIGATING':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'CONFIRMED':
        return 'bg-danger text-white';
      case 'FALSE_POSITIVE':
        return 'bg-secondary-subtle text-secondary border';
      case 'CLOSED':
      case 'RESOLVED':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'DISMISSED':
        return 'bg-secondary-subtle text-secondary border';
      default:
        return 'bg-light text-dark border';
    }
  }

  getRiskScoreBadgeClass(level: string): string {
    switch (level) {
      case 'HIGH':
        return 'bg-danger text-white';
      case 'MEDIUM':
        return 'bg-warning text-dark';
      case 'LOW':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }
}

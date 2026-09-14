import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { TransactionService } from '../../core/services/transaction.service';
import { EmiService } from '../../core/services/emi.service';
import { PaymentService } from '../../core/services/payment.service';
import { FraudService } from '../../core/services/fraud.service';
import { DisputeService } from '../../core/services/dispute.service';

interface TierSummary {
  tierName: string;
  cardCount: number;
  totalLimit: number;
  activeCount: number;
}

interface TypeSummary {
  type: string;
  count: number;
  totalVolume: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: false
})
export class ReportsComponent implements OnInit {
  isLoading: boolean = false;
  errorMessage: string | null = null;
  reportGeneratedAt: string | null = null;

  // Portfolio Totals
  totalCreditAllocated: number = 0;
  totalAvailableCredit: number = 0;
  totalUtilizedCredit: number = 0;
  utilizationRate: number = 0;

  totalCustomersCount: number = 0;
  verifiedCustomersCount: number = 0;
  totalCardsCount: number = 0;
  activeCardsCount: number = 0;
  blockedCardsCount: number = 0;

  totalTransactionsCount: number = 0;
  totalTransactionVolume: number = 0;
  totalPaymentsVolume: number = 0;
  totalEmiOutstanding: number = 0;
  activeFraudAlertsCount: number = 0;
  unresolvedDisputesCount: number = 0;

  // Breakdown tables
  tierSummaries: TierSummary[] = [];
  typeSummaries: TypeSummary[] = [];

  // Raw data store for export
  private rawReportData: any = null;

  constructor(
    private customerService: CustomerService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private emiService: EmiService,
    private paymentService: PaymentService,
    private fraudService: FraudService,
    private disputeService: DisputeService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      customers: this.customerService.getAllCustomers().pipe(catchError(() => of([]))),
      cards: this.cardService.getAllCards().pipe(catchError(() => of([]))),
      transactions: this.transactionService.getAllTransactions().pipe(catchError(() => of([]))),
      emis: this.emiService.getAllEmiPlans().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAllPayments().pipe(catchError(() => of([]))),
      fraudAlerts: this.fraudService.getAllFraudAlerts().pipe(catchError(() => of([]))),
      disputes: this.disputeService.getAllDisputes().pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.reportGeneratedAt = new Date().toISOString();
          this.rawReportData = res;

          const customers = res.customers || [];
          const cards = res.cards || [];
          const txns = res.transactions || [];
          const emis = res.emis || [];
          const payments = res.payments || [];
          const alerts = res.fraudAlerts || [];
          const disputes = res.disputes || [];

          // Customers
          this.totalCustomersCount = customers.length;
          this.verifiedCustomersCount = customers.filter(c => c.kycStatus === 'VERIFIED').length;

          // Cards & Limits
          this.totalCardsCount = cards.length;
          this.activeCardsCount = cards.filter(c => c.cardStatus === 'ACTIVE').length;
          this.blockedCardsCount = cards.filter(c => c.cardStatus === 'BLOCKED').length;
          this.totalCreditAllocated = cards.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
          this.totalAvailableCredit = cards.reduce((sum, c) => sum + (Number(c.availableLimit) || 0), 0);
          this.totalUtilizedCredit = Math.max(0, this.totalCreditAllocated - this.totalAvailableCredit);
          this.utilizationRate = this.totalCreditAllocated > 0
            ? Math.round((this.totalUtilizedCredit / this.totalCreditAllocated) * 100)
            : 0;

          // Transactions
          this.totalTransactionsCount = txns.length;
          this.totalTransactionVolume = txns
            .filter(t => t.transactionStatus === 'COMPLETED' || t.transactionStatus === 'SUCCESS')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

          // Payments & EMIs
          this.totalPaymentsVolume = payments
            .filter(p => p.paymentStatus === 'SUCCESS')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          this.totalEmiOutstanding = emis
            .filter(e => !e.status || e.status.toUpperCase() === 'ACTIVE')
            .reduce((sum, e) => sum + (Number(e.outstandingAmount) || 0), 0);

          // Risk & Compliance
          this.activeFraudAlertsCount = alerts.filter(a => a.status === 'PENDING' || a.status === 'INVESTIGATING').length;
          this.unresolvedDisputesCount = disputes.filter(d => d.status === 'RAISED' || d.status === 'UNDER_REVIEW').length;

          // Breakdown: Tiers
          const tierMap = new Map<string, TierSummary>();
          cards.forEach(c => {
            const tier = c.cardTypeId || 'STANDARD';
            const cur = tierMap.get(tier) || { tierName: tier, cardCount: 0, totalLimit: 0, activeCount: 0 };
            cur.cardCount++;
            cur.totalLimit += Number(c.creditLimit) || 0;
            if (c.cardStatus === 'ACTIVE') cur.activeCount++;
            tierMap.set(tier, cur);
          });
          this.tierSummaries = Array.from(tierMap.values());

          // Breakdown: Transaction Types
          const typeMap = new Map<string, TypeSummary>();
          txns.forEach(t => {
            const type = t.transactionType || 'PURCHASE';
            const cur = typeMap.get(type) || { type: type, count: 0, totalVolume: 0 };
            cur.count++;
            cur.totalVolume += Number(t.amount) || 0;
            typeMap.set(type, cur);
          });
          this.typeSummaries = Array.from(typeMap.values());

          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = 'Failed to generate financial and compliance report. Please try again.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  exportReport(): void {
    if (!this.rawReportData) return;

    const exportPayload = {
      reportTitle: 'CardNest Executive Portfolio & Compliance Report',
      generatedAt: this.reportGeneratedAt,
      summary: {
        totalCustomers: this.totalCustomersCount,
        verifiedKycCustomers: this.verifiedCustomersCount,
        totalCards: this.totalCardsCount,
        activeCards: this.activeCardsCount,
        blockedCards: this.blockedCardsCount,
        totalCreditLimit: this.totalCreditAllocated,
        totalUtilizedCredit: this.totalUtilizedCredit,
        portfolioUtilizationRate: `${this.utilizationRate}%`,
        totalTransactionVolume: this.totalTransactionVolume,
        totalPaymentsVolume: this.totalPaymentsVolume,
        totalEmiOutstanding: this.totalEmiOutstanding,
        openFraudAlerts: this.activeFraudAlertsCount,
        unresolvedDisputes: this.unresolvedDisputesCount
      },
      tierBreakdown: this.tierSummaries,
      transactionTypeBreakdown: this.typeSummaries
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CardNest_Portfolio_Report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

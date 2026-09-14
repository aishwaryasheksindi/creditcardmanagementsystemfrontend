import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { TransactionService } from '../../core/services/transaction.service';
import { RewardService } from '../../core/services/reward.service';
import { StatementService } from '../../core/services/statement.service';
import { EmiService } from '../../core/services/emi.service';
import { Customer } from '../../core/models/customer.model';
import { Card, CardStatus } from '../../core/models/card.model';
import { Transaction } from '../../core/models/transaction.model';
import { Statement } from '../../core/models/statement.model';

import { StaffService } from '../../core/services/staff.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { FraudService } from '../../core/services/fraud.service';
import { DisputeService } from '../../core/services/dispute.service';
import { Staff } from '../../core/models/staff.model';
import { AuditLog } from '../../core/models/audit-log.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  customer: Customer | null = null;
  cards: Card[] = [];
  recentTransactions: Transaction[] = [];
  selectedCard: Card | null = null;

  // Real-time metric computations (Customer)
  totalCreditLimit: number = 0;
  availableCredit: number = 0;
  totalOutstanding: number = 0;
  paymentDueAmount: number = 0;
  paymentDueDate: string | null = null;
  rewardPoints: number = 0;
  activeEmisCount: number = 0;

  // Staff Executive Dashboard State
  staffStats = {
    totalCustomers: 0,
    verifiedCustomers: 0,
    totalCards: 0,
    activeCards: 0,
    inactiveCards: 0,
    blockedCards: 0,
    totalTransactions: 0,
    totalSettledVolume: 0,
    totalStaff: 0,
    activeFraudAlerts: 0,
    openDisputes: 0,
    raisedDisputes: 0,
    underReviewDisputes: 0,
    resolvedDisputes: 0,
    activeEmis: 0,
    totalEmiOutstanding: 0,
    branchCustomers: 0,
    branchVerifiedCustomers: 0,
    branchPendingKyc: 0,
    branchCards: 0,
    branchActiveCards: 0,
    branchSettledVolume: 0,
    monitoredTransactionsCount: 0,
    monitoredTotalVolume: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    openAlertsCount: 0,
    investigatingAlertsCount: 0,
    confirmedAlertsCount: 0,
    falsePositiveAlertsCount: 0,
    closedAlertsCount: 0
  };
  staffRecentTransactions: Transaction[] = [];
  staffRecentAuditLogs: AuditLog[] = [];
  staffRecentFraudAlerts: any[] = [];
  staffRecentDisputes: any[] = [];
  staffRiskScores: any[] = [];
  staffCardsMap: Map<string, string> = new Map();

  isLoading: boolean = false;
  isCustomer: boolean = false;
  isBankOfficer: boolean = false;
  isFraudAnalyst: boolean = false;
  isAdmin: boolean = false;
  isCustomerServiceAgent: boolean = false;
  officerBranchCode: string = 'CN8080';
  officerDisplayName: string = 'Bank Officer';
  analystDisplayName: string = 'Senior Fraud Analyst';
  csaDisplayName: string = 'Customer Service Agent';
  errorMessage: string | null = null;
  isLoadingTransactions: boolean = false;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private rewardService: RewardService,
    private statementService: StatementService,
    private emiService: EmiService,
    private staffService: StaffService,
    private auditLogService: AuditLogService,
    private fraudService: FraudService,
    private disputeService: DisputeService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.isBankOfficer = this.authService.hasRole('BANK_OFFICER');
    this.isFraudAnalyst = this.authService.hasRole('FRAUD_ANALYST');
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.isCustomerServiceAgent = this.authService.hasRole('CUSTOMER_SERVICE_AGENT');

    if (this.isBankOfficer) {
      const user = this.authService.currentUserValue;
      if (user?.username) {
        this.officerDisplayName = user.username;
      }
    }

    if (this.isFraudAnalyst) {
      const user = this.authService.currentUserValue;
      if (user?.username) {
        this.analystDisplayName = user.username === 'rohan_fraudanalyst' ? 'Rohan Verma' : user.username;
      }
    }

    if (this.isCustomerServiceAgent) {
      const user = this.authService.currentUserValue;
      if (user?.username) {
        this.csaDisplayName = user.username === 'sneha_csa' ? 'Sneha Kulkarni' : user.username;
      }
    }

    if (this.isCustomer) {
      this.loadCustomerDashboard();
    } else {
      this.loadStaffDashboard();
    }
  }

  loadStaffDashboard(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    const sources: any = {
      customers: this.customerService.getAllCustomers().pipe(catchError(() => of([]))),
      cards: this.cardService.getAllCards().pipe(catchError(() => of([]))),
      transactions: this.transactionService.getAllTransactions().pipe(catchError(() => of([]))),
      auditLogs: this.auditLogService.getAllAuditLogs().pipe(catchError(() => of([]))),
      fraudAlerts: this.fraudService.getAllFraudAlerts().pipe(catchError(() => of([]))),
      riskScores: this.fraudService.getAllRiskScores().pipe(catchError(() => of([]))),
      disputes: this.isFraudAnalyst ? of([]) : this.disputeService.getAllDisputes().pipe(catchError(() => of([]))),
      emiPlans: this.emiService.getAllEmiPlans().pipe(catchError(() => of([]))),
      kycDocs: this.customerService.getAllKycDocuments().pipe(catchError(() => of([])))
    };

    if (this.isAdmin) {
      sources.staff = this.staffService.getAllStaff().pipe(catchError(() => of([])));
    } else {
      sources.staff = of([]);
    }

    forkJoin(sources).pipe(
      finalize(() => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      })
    ).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          const customers: Customer[] = res.customers || [];
          const cards: Card[] = res.cards || [];
          const transactions: Transaction[] = res.transactions || [];
          const staff: any[] = res.staff || [];
          const auditLogs: any[] = res.auditLogs || [];
          const fraudAlerts: any[] = res.fraudAlerts || [];
          const riskScores: any[] = res.riskScores || [];
          const disputes: any[] = res.disputes || [];
          const emiPlans: any[] = res.emiPlans || [];
          const kycDocs: any[] = res.kycDocs || [];

          cards.forEach(c => this.staffCardsMap.set(c.cardId, c.cardReference));
          this.staffRiskScores = riskScores;

          // Branch-scoped calculations (Branch CN8080)
          const branchCode = this.officerBranchCode;
          const branchCustomers = customers.filter(c => c.branchCode?.toUpperCase() === branchCode);
          const branchCustIds = new Set(branchCustomers.map(c => c.customerId));
          const branchCards = cards.filter(c => branchCustIds.has(c.customerId));
          const branchCardIds = new Set(branchCards.map(c => c.cardId));
          const branchTransactions = transactions.filter(t => branchCardIds.has(t.cardId));
          const branchKycDocs = kycDocs.filter(d => branchCustIds.has(d.customerId));

          // Fraud-monitoring telemetry
          const openAlerts = fraudAlerts.filter((a: any) => a.status === 'OPEN' || a.status === 'PENDING').length;
          const investigatingAlerts = fraudAlerts.filter((a: any) => a.status === 'INVESTIGATING').length;
          const confirmedAlerts = fraudAlerts.filter((a: any) => a.status === 'CONFIRMED').length;
          const falsePositiveAlerts = fraudAlerts.filter((a: any) => a.status === 'FALSE_POSITIVE').length;
          const closedAlerts = fraudAlerts.filter((a: any) => a.status === 'CLOSED').length;
          const highRisk = riskScores.filter((s: any) => s.riskLevel === 'HIGH' || (Number(s.score) || 0) >= 75).length;
          const mediumRisk = riskScores.filter((s: any) => s.riskLevel === 'MEDIUM' || ((Number(s.score) || 0) >= 40 && (Number(s.score) || 0) < 75)).length;
          const lowRisk = riskScores.filter((s: any) => s.riskLevel === 'LOW' || (Number(s.score) || 0) < 40).length;
          const monitoredVolume = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

          this.staffStats = {
            totalCustomers: customers.length,
            verifiedCustomers: customers.filter(c => c.kycStatus === 'VERIFIED').length,
            totalCards: cards.length,
            activeCards: cards.filter(c => c.cardStatus === 'ACTIVE').length,
            inactiveCards: cards.filter(c => c.cardStatus === 'INACTIVE').length,
            blockedCards: cards.filter(c => c.cardStatus === 'BLOCKED').length,
            totalTransactions: transactions.length,
            totalSettledVolume: transactions
              .filter(t => t.transactionStatus?.toUpperCase() === 'COMPLETED' || t.transactionStatus?.toUpperCase() === 'SUCCESS')
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
            totalStaff: staff.length,
            activeFraudAlerts: openAlerts + investigatingAlerts,
            openDisputes: disputes.filter((d: any) => d.status === 'RAISED' || d.status === 'UNDER_REVIEW').length,
            raisedDisputes: disputes.filter((d: any) => d.status === 'RAISED').length,
            underReviewDisputes: disputes.filter((d: any) => d.status === 'UNDER_REVIEW').length,
            resolvedDisputes: disputes.filter((d: any) => d.status === 'RESOLVED').length,
            activeEmis: emiPlans.filter((e: any) => !e.status || e.status.toUpperCase() === 'ACTIVE').length,
            totalEmiOutstanding: emiPlans
              .filter((e: any) => !e.status || e.status.toUpperCase() === 'ACTIVE')
              .reduce((sum: number, e: any) => sum + (Number(e.outstandingAmount) || 0), 0),
            branchCustomers: branchCustomers.length,
            branchVerifiedCustomers: branchCustomers.filter(c => c.kycStatus === 'VERIFIED').length,
            branchPendingKyc: branchKycDocs.filter((d: any) => d.status === 'PENDING').length || branchCustomers.filter(c => c.kycStatus === 'PENDING').length,
            branchCards: branchCards.length,
            branchActiveCards: branchCards.filter(c => c.cardStatus === 'ACTIVE').length,
            branchSettledVolume: branchTransactions
              .filter(t => t.transactionStatus?.toUpperCase() === 'COMPLETED' || t.transactionStatus?.toUpperCase() === 'SUCCESS')
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
            monitoredTransactionsCount: transactions.length,
            monitoredTotalVolume: monitoredVolume,
            highRiskCount: highRisk,
            mediumRiskCount: mediumRisk,
            lowRiskCount: lowRisk,
            openAlertsCount: openAlerts,
            investigatingAlertsCount: investigatingAlerts,
            confirmedAlertsCount: confirmedAlerts,
            falsePositiveAlertsCount: falsePositiveAlerts,
            closedAlertsCount: closedAlerts
          };

          this.staffRecentTransactions = transactions.slice(0, 6);
          this.staffRecentAuditLogs = auditLogs.slice(0, 5);
          this.staffRecentFraudAlerts = fraudAlerts.slice(0, 6);
          this.staffRecentDisputes = disputes.slice(0, 6);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.errorMessage = 'Failed to load staff executive dashboard. Please try again.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  loadCustomerDashboard(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.customerService.getMyProfile(forceRefresh).pipe(
      switchMap((customer) => {
        this.customer = customer;
        const customerId = customer.customerId;

        return forkJoin({
          cards: this.cardService.getCardsByCustomer(customerId).pipe(catchError(() => of([]))),
          reward: this.rewardService.getRewardByCustomerId(customerId).pipe(catchError(() => of(null))),
          emiPlans: this.emiService.getAllEmiPlans().pipe(catchError(() => of([])))
        });
      }),
      switchMap(({ cards, reward, emiPlans }) => {
        this.cards = cards || [];
        this.rewardPoints = reward?.balancePoints ?? 0;

        // Calculate card credit totals
        this.totalCreditLimit = this.cards.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
        this.availableCredit = this.cards.reduce((sum, c) => sum + (Number(c.availableLimit) || 0), 0);
        this.totalOutstanding = Math.max(0, this.totalCreditLimit - this.availableCredit);

        // Calculate active EMIs
        this.activeEmisCount = (emiPlans || []).filter(p => !p.status || p.status.toUpperCase() === 'ACTIVE').length;

        // Fetch statements for cards to determine upcoming payment due
        if (this.cards.length > 0) {
          const statementObservables = this.cards.map(c =>
            this.statementService.getStatementsByCardId(c.cardId).pipe(catchError(() => of([])))
          );
          return forkJoin(statementObservables).pipe(
            map((statementsArr: Statement[][]) => {
              const allStatements: Statement[] = statementsArr.flat();
              this.calculatePaymentDue(allStatements);
              return this.cards;
            })
          );
        } else {
          this.paymentDueAmount = 0;
          this.paymentDueDate = null;
          return of(this.cards);
        }
      }),
      finalize(() => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      })
    ).subscribe({
      next: (cards) => {
        this.ngZone.run(() => {
          if (cards.length > 0) {
            if (!this.selectedCard || !cards.some(c => c.cardId === this.selectedCard?.cardId)) {
              this.selectedCard = cards[0];
            }
            if (this.selectedCard) {
              this.loadRecentTransactions(this.selectedCard.cardId);
            }
          } else {
            this.selectedCard = null;
            this.recentTransactions = [];
          }
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          if (err.status === 404) {
            this.errorMessage = 'No customer account linked to your profile.';
          } else {
            this.errorMessage = 'Failed to load your account dashboard. Please try again.';
          }
          this.cdr.markForCheck();
        });
      }
    });
  }

  private calculatePaymentDue(statements: Statement[]): void {
    if (!statements || statements.length === 0) {
      this.paymentDueDate = null;
      this.paymentDueAmount = 0;
      return;
    }

    // Sort statements descending by date to find the most recent
    const sorted = [...statements].sort((a, b) => {
      const dateA = new Date(a.dueDate || a.statementDate).getTime();
      const dateB = new Date(b.dueDate || b.statementDate).getTime();
      return dateB - dateA;
    });

    const latest = sorted[0];
    this.paymentDueDate = latest.dueDate;
    this.paymentDueAmount = latest.minimumDue || latest.closingBalance || 0;
  }

  onSelectCard(cardId: string): void {
    const card = this.cards.find(c => c.cardId === cardId);
    if (card) {
      this.selectedCard = card;
      this.loadRecentTransactions(card.cardId);
    }
  }

  private loadRecentTransactions(cardId: string): void {
    this.isLoadingTransactions = true;
    this.transactionService.getTransactionsByCard(cardId).subscribe({
      next: (transactions) => {
        this.recentTransactions = (transactions || []).slice(0, 5);
        this.isLoadingTransactions = false;
      },
      error: () => {
        this.recentTransactions = [];
        this.isLoadingTransactions = false;
      }
    });
  }

  get welcomeName(): string {
    if (this.customer?.name) {
      return this.customer.name;
    }
    const currentUser = this.authService.currentUserValue;
    return currentUser?.username || 'Cardholder';
  }

  get activeCardsCount(): number {
    return this.cards.filter(c => c.cardStatus === 'ACTIVE').length;
  }

  getCardStatusBadge(status: CardStatus | string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success text-white';
      case 'BLOCKED':
        return 'bg-danger text-white';
      case 'EXPIRED':
        return 'bg-secondary text-white';
      case 'CLOSED':
        return 'bg-dark text-white';
      case 'LOST':
      case 'STOLEN':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getTransactionStatusBadge(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'PENDING':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'FAILED':
      case 'DECLINED':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }

  navigateToCards(): void {
    this.router.navigate(['/app/cards']);
  }

  viewCardDetails(cardId: string): void {
    this.router.navigate(['/app/cards', cardId]);
  }

  get hasVerifiedKyc(): boolean {
    return this.customer?.kycStatus === 'VERIFIED';
  }

  get hasCards(): boolean {
    return this.cards.length > 0;
  }

  get firstInactiveCard(): Card | undefined {
    return this.cards.find(c => c.cardStatus === 'INACTIVE');
  }

  get firstActiveCard(): Card | undefined {
    return this.cards.find(c => c.cardStatus === 'ACTIVE');
  }

  navigateToKyc(): void {
    this.router.navigate(['/app/kyc']);
  }

  navigateToPayments(): void {
    this.router.navigate(['/app/payments']);
  }

  navigateToEmi(): void {
    this.router.navigate(['/app/emi']);
  }

  navigateToRewards(): void {
    this.router.navigate(['/app/rewards']);
  }

  navigateToDisputes(): void {
    this.router.navigate(['/app/disputes']);
  }

  navigateToCustomer(): void {
    this.router.navigate(['/app/customer']);
  }

  getDisputeStatusBadge(status: string): string {
    switch (status?.toUpperCase()) {
      case 'RAISED':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'UNDER_REVIEW':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'RESOLVED':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'REJECTED':
      case 'CLOSED':
        return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default:
        return 'bg-light text-dark border';
    }
  }
}
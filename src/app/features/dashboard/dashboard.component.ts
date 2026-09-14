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

  // Real-time metric computations
  totalCreditLimit: number = 0;
  availableCredit: number = 0;
  totalOutstanding: number = 0;
  paymentDueAmount: number = 0;
  paymentDueDate: string | null = null;
  rewardPoints: number = 0;
  activeEmisCount: number = 0;

  isLoading: boolean = false;
  isCustomer: boolean = false;
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
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');

    if (this.isCustomer) {
      this.loadCustomerDashboard();
    }
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
}
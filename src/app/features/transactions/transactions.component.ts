import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { of, forkJoin } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Card } from '../../core/models/card.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone: false
})
export class TransactionsComponent implements OnInit {
  cards: Card[] = [];
  allTransactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  isLoading: boolean = false;
  errorMessage: string | null = null;
  isCustomer: boolean = false;

  // Filters
  selectedCardId: string = 'ALL';
  selectedStatus: string = 'ALL';
  selectedType: string = 'ALL';
  searchQuery: string = '';

  // Ledger stats
  totalSettledAmount: number = 0;
  emiEligibleCount: number = 0;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadTransactions();
  }

  loadTransactions(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(forceRefresh).pipe(
        switchMap((customer) => {
          return this.cardService.getCardsByCustomer(customer.customerId).pipe(
            catchError(() => of([]))
          );
        }),
        switchMap((cards) => {
          this.cards = cards || [];
          if (this.cards.length === 0) {
            return of([] as Transaction[]);
          }
          const cardIds = this.cards.map(c => c.cardId);
          return this.transactionService.getTransactionsForCards(cardIds);
        }),
        finalize(() => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        })
      ).subscribe({
        next: (transactions) => {
          this.ngZone.run(() => {
            this.allTransactions = transactions || [];
            this.applyFilters();
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.errorMessage = 'Failed to load transaction history. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      forkJoin({
        cards: this.cardService.getAllCards().pipe(catchError(() => of([]))),
        transactions: this.transactionService.getAllTransactions().pipe(catchError(() => of([])))
      }).pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        })
      ).subscribe({
        next: ({ cards, transactions }) => {
          this.ngZone.run(() => {
            this.cards = cards || [];
            this.allTransactions = transactions || [];
            this.applyFilters();
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.errorMessage = 'Failed to load transaction ledger. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allTransactions];

    // Card filter
    if (this.selectedCardId !== 'ALL') {
      result = result.filter(t => t.cardId === this.selectedCardId);
    }

    // Status filter
    if (this.selectedStatus !== 'ALL') {
      result = result.filter(t => t.transactionStatus?.toUpperCase() === this.selectedStatus.toUpperCase());
    }

    // Type filter
    if (this.selectedType !== 'ALL') {
      result = result.filter(t => t.transactionType?.toUpperCase() === this.selectedType.toUpperCase());
    }

    // Search query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(t =>
        (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
        (t.transactionLocation && t.transactionLocation.toLowerCase().includes(q)) ||
        (t.transactionType && t.transactionType.toLowerCase().includes(q)) ||
        (t.merchantId && t.merchantId.toLowerCase().includes(q))
      );
    }

    this.filteredTransactions = result;
    this.calculateStats();
  }

  calculateStats(): void {
    this.totalSettledAmount = this.filteredTransactions
      .filter(t => {
        const s = t.transactionStatus?.toUpperCase();
        return s === 'COMPLETED' || s === 'SUCCESS';
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    this.emiEligibleCount = this.filteredTransactions
      .filter(t => this.isEmiEligible(t))
      .length;
  }

  isEmiEligible(txn: Transaction): boolean {
    const status = txn.transactionStatus?.toUpperCase();
    return (status === 'COMPLETED' || status === 'SUCCESS') && Number(txn.amount) >= 3000;
  }

  getCardReference(cardId: string): string {
    const card = this.cards.find(c => c.cardId === cardId);
    return card ? card.cardReference : cardId;
  }

  convertToEmi(transactionId: string): void {
    this.router.navigate(['/app/emi'], { queryParams: { transactionId } });
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
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Customer } from '../../core/models/customer.model';
import { Card, CardStatus } from '../../core/models/card.model';
import { Transaction } from '../../core/models/transaction.model';

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

  isLoading: boolean = false;
  isCustomer: boolean = false;
  errorMessage: string | null = null;
  isLoadingTransactions: boolean = false;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private router: Router
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

    this.customerService.getMyProfile(forceRefresh).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.loadCustomerCards(customer.customerId);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.errorMessage = 'No customer account linked to your profile.';
        } else {
          this.errorMessage = 'Failed to load your customer profile. Please try again.';
        }
      }
    });
  }

  private loadCustomerCards(customerId: string): void {
    this.cardService.getCardsByCustomer(customerId).subscribe({
      next: (cards) => {
        this.cards = cards || [];
        this.isLoading = false;

        if (this.cards.length > 0) {
          // If a card was previously selected and still exists, keep it; otherwise default preview to first available card
          if (!this.selectedCard || !this.cards.some(c => c.cardId === this.selectedCard?.cardId)) {
            this.selectedCard = this.cards[0];
          }
          if (this.selectedCard) {
            this.loadRecentTransactions(this.selectedCard.cardId);
          }
        } else {
          this.selectedCard = null;
          this.recentTransactions = [];
        }
      },
      error: () => {
        this.cards = [];
        this.isLoading = false;
        this.errorMessage = 'Failed to load credit cards. Please try again.';
      }
    });
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
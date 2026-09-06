import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { Card, CardStatus } from '../../core/models/card.model';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  standalone: false
})
export class CardsComponent implements OnInit {
  cards: Card[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  customerId: string | null = null;
  isCustomer: boolean = false;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadCards();
  }

  loadCards(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      const cachedCustomer = this.customerService.currentCustomer;
      if (cachedCustomer?.customerId) {
        this.customerId = cachedCustomer.customerId;
        this.fetchCardsForCustomer(this.customerId);
      } else {
        this.customerService.getMyProfile().subscribe({
          next: (customer) => {
            this.customerId = customer.customerId;
            this.fetchCardsForCustomer(customer.customerId);
          },
          error: (err) => {
            this.isLoading = false;
            if (err.status === 404) {
              this.errorMessage = 'No customer profile found for your account.';
            } else {
              this.errorMessage = 'Failed to load customer profile. Please try again.';
            }
          }
        });
      }
    } else {
      this.isLoading = false;
    }
  }

  private fetchCardsForCustomer(customerId: string): void {
    this.cardService.getCardsByCustomer(customerId).subscribe({
      next: (cards) => {
        this.cards = cards || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load credit cards. Please try again.';
      }
    });
  }

  viewCardDetails(cardId: string): void {
    this.router.navigate(['/app/cards', cardId]);
  }

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
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
}
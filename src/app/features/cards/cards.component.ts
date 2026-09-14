import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
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
  filteredCards: Card[] = [];
  cardTypes: any[] = [];
  customerMap: Map<string, string> = new Map();

  isLoading: boolean = false;
  errorMessage: string | null = null;
  applicationMessage: string | null = null;
  customerId: string | null = null;
  isCustomer: boolean = false;

  // Staff Filters
  selectedStatusFilter: string = 'ALL';
  searchQuery: string = '';

  // Staff Metrics
  totalCardsCount: number = 0;
  activeCardsCount: number = 0;
  inactiveCardsCount: number = 0;
  blockedCardsCount: number = 0;
  totalCreditAllocated: number = 0;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadCards();
  }

  loadCards(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(forceRefresh).pipe(
        switchMap((customer) => {
          this.customerId = customer.customerId;
          return this.cardService.getCardsByCustomer(customer.customerId);
        })
      ).subscribe({
        next: (cards) => {
          this.ngZone.run(() => {
            this.cards = cards || [];
            this.filteredCards = this.cards;
            this.isLoading = false;
            if (this.cards.length === 0) {
              this.loadAvailableCardTypes();
            }
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.cards = [];
            this.filteredCards = [];
            this.isLoading = false;
            if (err.status === 404) {
              this.errorMessage = 'No customer profile or cards found for your account.';
            } else {
              this.errorMessage = 'Failed to load credit cards. Please try again.';
            }
            this.loadAvailableCardTypes();
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      // Staff / Admin Management View
      forkJoin({
        cards: this.cardService.getAllCards().pipe(catchError(() => of([]))),
        customers: this.customerService.getAllCustomers().pipe(catchError(() => of([]))),
        types: this.cardService.getCardTypes().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ cards, customers, types }) => {
          this.ngZone.run(() => {
            this.cards = cards || [];
            this.cardTypes = types || [];
            this.customerMap.clear();
            (customers || []).forEach(c => this.customerMap.set(c.customerId, c.name));

            this.totalCardsCount = this.cards.length;
            this.activeCardsCount = this.cards.filter(c => c.cardStatus === 'ACTIVE').length;
            this.inactiveCardsCount = this.cards.filter(c => c.cardStatus === 'INACTIVE').length;
            this.blockedCardsCount = this.cards.filter(c => c.cardStatus === 'BLOCKED').length;
            this.totalCreditAllocated = this.cards.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);

            this.applyStaffFilters();
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Failed to load credit cards portfolio. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  applyStaffFilters(): void {
    let result = [...this.cards];

    if (this.selectedStatusFilter !== 'ALL') {
      result = result.filter(c => c.cardStatus === this.selectedStatusFilter);
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(c => {
        const custName = this.customerMap.get(c.customerId)?.toLowerCase() || '';
        const idMatch = c.cardId.toLowerCase().includes(q);
        const refMatch = c.cardReference.toLowerCase().includes(q);
        const custIdMatch = c.customerId.toLowerCase().includes(q);
        const typeMatch = c.cardTypeId.toLowerCase().includes(q);
        return idMatch || refMatch || custIdMatch || custName.includes(q) || typeMatch;
      });
    }

    this.filteredCards = result;
  }

  onFilterChange(): void {
    this.applyStaffFilters();
  }

  getCustomerName(customerId: string): string {
    return this.customerMap.get(customerId) || customerId;
  }

  private loadAvailableCardTypes(): void {
    this.cardService.getCardTypes().subscribe({
      next: (types) => {
        this.ngZone.run(() => {
          this.cardTypes = types || [];
          this.cdr.markForCheck();
        });
      },
      error: () => {}
    });
  }

  applyForCard(type: any): void {
    this.applicationMessage = `Your application for the ${type.typeName} Credit Card (?${type.creditLimit.toLocaleString('en-IN')} Limit) has been registered. Authorized Bank Officers can now review and approve issuance.`;
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
      case 'INACTIVE':
        return 'bg-warning text-dark';
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

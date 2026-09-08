import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { PaymentService } from '../../core/services/payment.service';
import { Payment, PaymentRequest, PaymentStatus } from '../../core/models/payment.model';
import { Card } from '../../core/models/card.model';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  standalone: false
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  cards: Card[] = [];
  cardMap: Map<string, Card> = new Map();
  currentCustomer: Customer | null = null;

  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Role
  isCustomer: boolean = false;

  // Filter state
  selectedCardFilter: string = 'ALL';
  selectedStatusFilter: string = 'ALL';

  // Modal state
  @ViewChild('makePaymentModal') makePaymentModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;

  // Form state
  selectedCardId: string = '';
  paymentAmount: number | null = null;
  paymentType: 'minimum' | 'full' | 'partial' | 'custom' = 'full';
  paymentMethod: string = 'UPI';
  referenceNumber: string = '';
  isSubmittingPayment: boolean = false;
  formErrorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private paymentService: PaymentService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile().pipe(
        switchMap(customer => {
          this.currentCustomer = customer;
          if (!customer?.customerId) {
            return of({ cards: [] as Card[], payments: [] as Payment[] });
          }
          return forkJoin({
            cards: this.cardService.getCardsByCustomer(customer.customerId).pipe(
              catchError(() => of([] as Card[]))
            ),
            payments: this.paymentService.getPaymentsByCustomerId(customer.customerId).pipe(
              catchError(() => of([] as Payment[]))
            )
          });
        }),
        catchError(err => {
          this.errorMessage = 'Failed to load customer profile or payments.';
          return of({ cards: [] as Card[], payments: [] as Payment[] });
        })
      ).subscribe({
        next: (result) => {
          this.cards = result.cards;
          this.cardMap.clear();
          this.cards.forEach(c => this.cardMap.set(c.cardId, c));

          this.payments = result.payments.sort((a, b) => 
            new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          );

          // Handle query param pre-selection
          this.route.queryParams.subscribe(params => {
            if (params['cardId'] && this.cardMap.has(params['cardId'])) {
              this.selectedCardFilter = params['cardId'];
            }
            this.applyFilters();
          });

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load payments data.';
        }
      });
    } else {
      // Admin / Staff View
      this.paymentService.getAllPayments().pipe(
        catchError(() => of([] as Payment[]))
      ).subscribe({
        next: (payments) => {
          this.payments = payments.sort((a, b) => 
            new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          );
          this.applyFilters();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load payments data.';
        }
      });
    }
  }

  applyFilters(): void {
    let result = [...this.payments];

    if (this.selectedCardFilter !== 'ALL') {
      result = result.filter(p => p.cardId === this.selectedCardFilter);
    }

    if (this.selectedStatusFilter !== 'ALL') {
      result = result.filter(p => p.paymentStatus === this.selectedStatusFilter);
    }

    this.filteredPayments = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // --- Make Payment Flow ---
  openMakePaymentModal(preselectedCardId?: string): void {
    this.formErrorMessage = null;
    this.isSubmittingPayment = false;

    // Pick card
    if (preselectedCardId && this.cardMap.has(preselectedCardId)) {
      this.selectedCardId = preselectedCardId;
    } else if (this.cards.length > 0) {
      this.selectedCardId = this.cards[0].cardId;
    } else {
      this.selectedCardId = '';
    }

    this.paymentType = 'full';
    this.paymentMethod = 'UPI';
    this.generateReferenceNumber();
    this.onCardOrTypeChange();

    this.activeModal = this.modalService.open(this.makePaymentModalRef, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
  }

  generateReferenceNumber(): void {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.referenceNumber = `PAY-${timestamp}-${random}`;
  }

  get selectedCard(): Card | undefined {
    return this.cardMap.get(this.selectedCardId);
  }

  get outstandingBalance(): number {
    if (!this.selectedCard) return 0;
    const diff = this.selectedCard.creditLimit - this.selectedCard.availableLimit;
    return diff > 0 ? diff : 0;
  }

  get minimumDueAmount(): number {
    if (this.outstandingBalance <= 0) return 0;
    // Standard 5% of outstanding, minimum 500 or outstanding if smaller
    const fivePercent = Math.round(this.outstandingBalance * 0.05);
    const minCalculated = Math.max(500, fivePercent);
    return Math.min(this.outstandingBalance, minCalculated);
  }

  onCardOrTypeChange(): void {
    if (this.paymentType === 'full') {
      this.paymentAmount = this.outstandingBalance;
    } else if (this.paymentType === 'minimum') {
      this.paymentAmount = this.minimumDueAmount;
    } else if (this.paymentType === 'custom' || this.paymentType === 'partial') {
      if (this.paymentAmount === null || this.paymentAmount === 0) {
        this.paymentAmount = this.minimumDueAmount > 0 ? this.minimumDueAmount : 500;
      }
    }
  }

  confirmMakePayment(): void {
    if (!this.selectedCardId) {
      this.formErrorMessage = 'Please select a card to make payment.';
      return;
    }

    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.formErrorMessage = 'Please enter a valid payment amount greater than zero.';
      return;
    }

    if (!this.currentCustomer?.customerId) {
      this.formErrorMessage = 'Customer profile not found.';
      return;
    }

    this.isSubmittingPayment = true;
    this.formErrorMessage = null;

    const request: PaymentRequest = {
      cardId: this.selectedCardId,
      customerId: this.currentCustomer.customerId,
      amount: Number(this.paymentAmount),
      paymentDate: new Date().toISOString(),
      paymentType: this.paymentType,
      paymentStatus: 'SUCCESS',
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber
    };

    this.paymentService.addPayment(request).subscribe({
      next: (res) => {
        this.isSubmittingPayment = false;
        this.successMessage = `Payment of ₹${res.amount} successfully processed with reference ${res.referenceNumber || res.paymentId}! Card limit has been replenished.`;
        this.dismissModal();
        // Refresh data so cards limit & payments list reflect the update
        this.loadData();
      },
      error: (err) => {
        this.isSubmittingPayment = false;
        this.formErrorMessage = err.error?.message || 'Payment processing failed. Please verify the amount and try again.';
      }
    });
  }

  dismissModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
      this.activeModal = null;
    }
  }

  // --- Metrics Getters ---
  get totalPaymentsCount(): number {
    return this.filteredPayments.length;
  }

  get totalAmountPaid(): number {
    return this.filteredPayments
      .filter(p => p.paymentStatus === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  get totalCustomerOutstanding(): number {
    return this.cards.reduce((sum, c) => {
      const diff = c.creditLimit - c.availableLimit;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
  }

  getCardReference(cardId: string): string {
    const card = this.cardMap.get(cardId);
    return card ? card.cardReference : cardId;
  }

  getStatusBadgeClass(status: PaymentStatus | string): string {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-success text-white';
      case 'PROCESSING':
      case 'INITIATED':
        return 'bg-warning text-dark';
      case 'FAILED':
        return 'bg-danger text-white';
      case 'REVERSED':
      case 'REFUNDED':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary text-white';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'FULL':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'MINIMUM':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'PARTIAL':
      case 'CUSTOM':
        return 'bg-info-subtle text-info border border-info-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }
}

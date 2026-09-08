import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { CardService } from '../../../core/services/card.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Card, CardStatus } from '../../../core/models/card.model';
import { Transaction } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-card-details',
  templateUrl: './card-details.component.html',
  styleUrls: ['./card-details.component.scss'],
  standalone: false
})
export class CardDetailsComponent implements OnInit {
  cardId: string | null = null;
  card: Card | null = null;
  transactions: Transaction[] = [];

  isLoadingCard: boolean = false;
  isLoadingTransactions: boolean = false;
  cardErrorMessage: string | null = null;
  transactionErrorMessage: string | null = null;

  isCustomer: boolean = false;

  // Modals state
  @ViewChild('blockModal') blockModalRef!: TemplateRef<unknown>;
  @ViewChild('setPinModal') setPinModalRef!: TemplateRef<unknown>;
  @ViewChild('verifyPinModal') verifyPinModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;

  // Block Card state
  blockReason: string = 'Suspected unauthorized activity';
  customReason: string = '';
  isBlocking: boolean = false;
  blockErrorMessage: string | null = null;
  blockSuccessMessage: string | null = null;

  // PIN state
  pinInput: string = '';
  pinConfirmInput: string = '';
  verifyPinInput: string = '';
  isSubmittingPin: boolean = false;
  pinErrorMessage: string | null = null;
  pinSuccessMessage: string | null = null;
  pinVerificationResult: boolean | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.route.paramMap.subscribe((params) => {
      const id = params.get('cardId');
      if (id) {
        this.cardId = id;
        this.loadCardDetails(id);
        this.loadRecentActivity(id);
      } else {
        this.cardErrorMessage = 'No Card ID provided.';
      }
    });
  }

  loadCardDetails(cardId: string): void {
    this.isLoadingCard = true;
    this.cardErrorMessage = null;

    this.cardService.getCardById(cardId).subscribe({
      next: (card) => {
        this.card = card;
        this.isLoadingCard = false;
      },
      error: (err) => {
        this.isLoadingCard = false;
        if (err.status === 403) {
          this.cardErrorMessage = 'You do not have permission to view this card.';
        } else if (err.status === 404) {
          this.cardErrorMessage = 'Card not found.';
        } else {
          this.cardErrorMessage = 'Failed to load card details. Please try again.';
        }
      }
    });
  }

  loadRecentActivity(cardId: string): void {
    this.isLoadingTransactions = true;
    this.transactionErrorMessage = null;

    this.transactionService.getTransactionsByCard(cardId).subscribe({
      next: (transactions) => {
        this.transactions = transactions || [];
        this.isLoadingTransactions = false;
      },
      error: (err) => {
        this.isLoadingTransactions = false;
        if (err.status === 403) {
          this.transactionErrorMessage = 'You do not have permission to view activity for this card.';
        } else {
          this.transactionErrorMessage = 'Failed to load card transactions.';
        }
      }
    });
  }

  // --- Block Card Modal ---
  openBlockModal(): void {
    this.blockReason = 'Suspected unauthorized activity';
    this.customReason = '';
    this.blockErrorMessage = null;
    this.activeModal = this.modalService.open(this.blockModalRef, {
      centered: true,
      backdrop: 'static'
    });
  }

  confirmBlock(): void {
    if (!this.cardId) return;

    let finalReason = this.blockReason;
    if (this.blockReason === 'Other' && this.customReason.trim()) {
      finalReason = this.customReason.trim();
    }

    if (!finalReason || !finalReason.trim()) {
      this.blockErrorMessage = 'A reason is required to block this card.';
      return;
    }

    this.isBlocking = true;
    this.blockErrorMessage = null;

    this.cardService.blockCard(this.cardId, finalReason).subscribe({
      next: (updatedCard) => {
        this.isBlocking = false;
        this.card = updatedCard;
        this.blockSuccessMessage = 'Card ' + updatedCard.cardReference + ' has been successfully blocked.';
        this.dismissModal();
      },
      error: (err) => {
        this.isBlocking = false;
        if (err.error?.message) {
          this.blockErrorMessage = err.error.message;
        } else if (err.status === 403) {
          this.blockErrorMessage = 'You do not have permission to block this card.';
        } else {
          this.blockErrorMessage = 'Failed to block card. Please try again.';
        }
      }
    });
  }

  // --- Set PIN Modal ---
  openSetPinModal(): void {
    this.pinInput = '';
    this.pinConfirmInput = '';
    this.pinErrorMessage = null;
    this.pinSuccessMessage = null;
    this.activeModal = this.modalService.open(this.setPinModalRef, {
      centered: true,
      backdrop: 'static'
    });
  }

  confirmSetPin(): void {
    if (!this.cardId) return;

    const pinPattern = /^\d{4}$/;
    if (!pinPattern.test(this.pinInput)) {
      this.pinErrorMessage = 'PIN must be exactly 4 numeric digits.';
      return;
    }

    if (this.pinInput !== this.pinConfirmInput) {
      this.pinErrorMessage = 'PIN confirmation does not match.';
      return;
    }

    this.isSubmittingPin = true;
    this.pinErrorMessage = null;

    this.cardService.setPin(this.cardId, this.pinInput).subscribe({
      next: (res) => {
        this.isSubmittingPin = false;
        this.pinSuccessMessage = res.message || 'Card PIN set successfully.';
        this.dismissModal();
      },
      error: (err) => {
        this.isSubmittingPin = false;
        this.pinErrorMessage = err.error?.message || 'Failed to set card PIN. Please try again.';
      }
    });
  }

  // --- Verify PIN Modal ---
  openVerifyPinModal(): void {
    this.verifyPinInput = '';
    this.pinErrorMessage = null;
    this.pinVerificationResult = null;
    this.activeModal = this.modalService.open(this.verifyPinModalRef, {
      centered: true,
      backdrop: 'static'
    });
  }

  confirmVerifyPin(): void {
    if (!this.cardId) return;

    const pinPattern = /^\d{4}$/;
    if (!pinPattern.test(this.verifyPinInput)) {
      this.pinErrorMessage = 'PIN must be exactly 4 numeric digits.';
      return;
    }

    this.isSubmittingPin = true;
    this.pinErrorMessage = null;
    this.pinVerificationResult = null;

    this.cardService.verifyPin(this.cardId, this.verifyPinInput).subscribe({
      next: (res) => {
        this.isSubmittingPin = false;
        this.pinVerificationResult = res.verified;
        if (res.verified) {
          this.pinSuccessMessage = 'Card PIN successfully verified!';
          setTimeout(() => this.dismissModal(), 1500);
        } else {
          this.pinErrorMessage = 'Incorrect PIN entered. Please try again.';
        }
      },
      error: (err) => {
        this.isSubmittingPin = false;
        this.pinErrorMessage = err.error?.message || 'Failed to verify PIN.';
      }
    });
  }

  dismissModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
      this.activeModal = null;
    }
  }

  goBack(): void {
    this.router.navigate(['/app/cards']);
  }

  get isCardBlocked(): boolean {
    return this.card?.cardStatus === 'BLOCKED' ||
           this.card?.cardStatus === 'CLOSED' ||
           this.card?.cardStatus === 'EXPIRED';
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
}
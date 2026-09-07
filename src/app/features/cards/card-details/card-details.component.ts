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

  // Block Card Modal state
  @ViewChild('blockModal') blockModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;
  blockReason: string = 'Suspected unauthorized activity';
  customReason: string = '';
  isBlocking: boolean = false;
  blockErrorMessage: string | null = null;
  blockSuccessMessage: string | null = null;

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
        if (this.activeModal) {
          this.activeModal.close();
          this.activeModal = null;
        }
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
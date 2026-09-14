import { Component, OnInit, TemplateRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { TransactionService } from '../../core/services/transaction.service';
import { DisputeService } from '../../core/services/dispute.service';
import { Dispute, DisputeRequest, DisputeType, DisputeClassificationResponse } from '../../core/models/dispute.model';
import { Customer } from '../../core/models/customer.model';
import { Card } from '../../core/models/card.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-disputes',
  templateUrl: './disputes.component.html',
  styleUrls: ['./disputes.component.scss'],
  standalone: false
})
export class DisputesComponent implements OnInit {
  disputes: Dispute[] = [];
  filteredDisputes: Dispute[] = [];
  transactions: Transaction[] = [];
  currentCustomer: Customer | null = null;
  cards: Card[] = [];

  isLoading: boolean = false;
  isCustomer: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  selectedStatusFilter: string = 'ALL';

  // Raise Dispute Modal
  @ViewChild('raiseDisputeModal') raiseDisputeModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;
  disputeForm!: FormGroup;
  isSubmittingDispute: boolean = false;
  isClassifying: boolean = false;
  aiClassification: DisputeClassificationResponse | null = null;
  formErrorMessage: string | null = null;

  disputeTypes: { value: DisputeType; label: string }[] = [
    { value: 'UNAUTHORIZED_TRANSACTION', label: 'Unauthorized / Fraudulent Transaction' },
    { value: 'WRONG_AMOUNT', label: 'Incorrect Amount Billed' },
    { value: 'DUPLICATE_TRANSACTION', label: 'Duplicate Transaction' },
    { value: 'REFUND_NOT_RECEIVED', label: 'Refund Not Received' },
    { value: 'MERCHANT_DISPUTE', label: 'Merchant Dispute / Goods Not Received' },
    { value: 'OTHER', label: 'Other Claim' }
  ];

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private disputeService: DisputeService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadDisputesData();
  }

  private initForm(): void {
    this.disputeForm = this.fb.group({
      transactionId: ['', [Validators.required]],
      disputeType: ['UNAUTHORIZED_TRANSACTION', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      evidenceReference: ['']
    });
  }

  loadDisputesData(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(forceRefresh).pipe(
        switchMap((customer) => {
          this.currentCustomer = customer;
          if (!customer?.customerId) {
            return of({ disputes: [], cards: [] });
          }

          return forkJoin({
            disputes: this.disputeService.getDisputesByCustomer(customer.customerId).pipe(catchError(() => of([]))),
            cards: this.cardService.getCardsByCustomer(customer.customerId).pipe(catchError(() => of([])))
          });
        }),
        switchMap(({ disputes, cards }) => {
          this.disputes = disputes || [];
          this.cards = cards || [];
          this.applyFilter();

          // Load transactions from all cards for the dispute picker
          if (this.cards.length > 0) {
            const txnObs = this.cards.map(c =>
              this.transactionService.getTransactionsByCard(c.cardId).pipe(catchError(() => of([])))
            );
            return forkJoin(txnObs);
          }
          return of([]);
        })
      ).subscribe({
        next: (txnArrays: Transaction[][]) => {
          this.ngZone.run(() => {
            this.transactions = txnArrays.flat();
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Failed to load disputes data. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      // Staff / Admin Management View
      forkJoin({
        disputes: this.disputeService.getAllDisputes().pipe(catchError(() => of([]))),
        transactions: this.transactionService.getAllTransactions().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ disputes, transactions }) => {
          this.ngZone.run(() => {
            this.disputes = disputes || [];
            this.transactions = transactions || [];
            this.applyFilter();
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Failed to load platform disputes. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  updateStatus(disputeId: string, status: string): void {
    const notes = status === 'RESOLVED' ? 'Claim verified and resolved in customer favor.' : (status === 'REJECTED' ? 'Claim investigated and denied.' : 'Investigation initiated with merchant.');
    this.disputeService.updateDispute(disputeId, { status, resolutionNotes: notes }).subscribe({
      next: () => {
        this.successMessage = `Dispute ${disputeId} status updated to ${status}.`;
        this.loadDisputesData(true);
      },
      error: () => {
        this.errorMessage = `Failed to update dispute ${disputeId}.`;
      }
    });
  }

  applyFilter(): void {
    if (this.selectedStatusFilter === 'ALL') {
      this.filteredDisputes = [...this.disputes];
    } else {
      this.filteredDisputes = this.disputes.filter(
        d => d.status.toUpperCase() === this.selectedStatusFilter.toUpperCase()
      );
    }
  }

  onFilterChange(status: string): void {
    this.selectedStatusFilter = status;
    this.applyFilter();
  }

  openRaiseDisputeModal(preselectedTransactionId?: string): void {
    this.formErrorMessage = null;
    this.aiClassification = null;
    this.initForm();

    if (preselectedTransactionId) {
      this.disputeForm.patchValue({ transactionId: preselectedTransactionId });
    } else if (this.transactions.length > 0) {
      this.disputeForm.patchValue({ transactionId: this.transactions[0].transactionId });
    }

    this.activeModal = this.modalService.open(this.raiseDisputeModalRef, {
      backdrop: 'static',
      size: 'lg'
    });
  }

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
      this.activeModal = null;
    }
  }

  classifyWithAi(): void {
    const description = this.disputeForm.get('description')?.value;
    const transactionId = this.disputeForm.get('transactionId')?.value;

    if (!description || description.trim().length < 5) {
      this.formErrorMessage = 'Please enter a description before requesting AI classification.';
      return;
    }

    if (!this.currentCustomer?.customerId || !transactionId) {
      this.formErrorMessage = 'Please select a transaction.';
      return;
    }

    this.isClassifying = true;
    this.formErrorMessage = null;

    this.disputeService.classifyDispute({
      customerId: this.currentCustomer.customerId,
      transactionId: transactionId,
      description: description.trim()
    }).subscribe({
      next: (resp) => {
        this.ngZone.run(() => {
          this.aiClassification = resp;
          this.isClassifying = false;
          if (resp && resp.suggestedType) {
            this.disputeForm.patchValue({ disputeType: resp.suggestedType });
          }
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isClassifying = false;
          this.formErrorMessage = 'AI classification service unavailable. You may proceed manually.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  onSubmitDispute(): void {
    if (this.disputeForm.invalid) {
      this.disputeForm.markAllAsTouched();
      return;
    }

    if (!this.currentCustomer?.customerId) {
      this.formErrorMessage = 'Customer profile required to file a dispute.';
      return;
    }

    this.isSubmittingDispute = true;
    this.formErrorMessage = null;

    const request: DisputeRequest = {
      customerId: this.currentCustomer.customerId,
      transactionId: this.disputeForm.value.transactionId,
      disputeType: this.disputeForm.value.disputeType,
      description: this.disputeForm.value.description.trim(),
      evidenceReference: this.disputeForm.value.evidenceReference?.trim() || undefined
    };

    this.disputeService.raiseDispute(request).subscribe({
      next: (savedDispute) => {
        this.ngZone.run(() => {
          this.isSubmittingDispute = false;
          this.successMessage = `Dispute ${savedDispute.disputeId} submitted successfully with status ${savedDispute.status}.`;
          this.closeModal();
          this.loadDisputesData(true);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isSubmittingDispute = false;
          this.formErrorMessage = err.error?.message || 'Failed to submit dispute. Please check your transaction selection.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  getStatusBadgeClass(status: string): string {
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

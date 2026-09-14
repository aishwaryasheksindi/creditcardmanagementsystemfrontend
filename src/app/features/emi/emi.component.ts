import { Component, OnInit, TemplateRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { TransactionService } from '../../core/services/transaction.service';
import { EmiService } from '../../core/services/emi.service';
import { Card } from '../../core/models/card.model';
import { Transaction } from '../../core/models/transaction.model';
import { EmiPlan, EmiPlanRequest, AiEmiRecommendation, EmiTenureOption } from '../../core/models/emi.model';

@Component({
  selector: 'app-emi',
  templateUrl: './emi.component.html',
  styleUrls: ['./emi.component.scss'],
  standalone: false
})
export class EmiComponent implements OnInit {
  activeTab: 'plans' | 'eligible' = 'plans';

  cards: Card[] = [];
  transactions: Transaction[] = [];
  emiPlans: EmiPlan[] = [];
  eligibleTransactions: Transaction[] = [];

  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isCustomer: boolean = false;

  // Stats
  totalOutstandingEmi: number = 0;
  activePlansCount: number = 0;
  nextMonthEmiDue: number = 0;

  // Recommendation & Modal State
  @ViewChild('emiModal') emiModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;

  selectedTxn: Transaction | null = null;
  recommendation: AiEmiRecommendation | null = null;
  selectedOption: EmiTenureOption | null = null;
  isLoadingRecommendation: boolean = false;
  isSubmittingPlan: boolean = false;
  modalErrorMessage: string | null = null;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private transactionService: TransactionService,
    private emiService: EmiService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadData();
  }

  loadData(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(forceRefresh).pipe(
        switchMap((customer) => {
          return forkJoin({
            cards: this.cardService.getCardsByCustomer(customer.customerId).pipe(catchError(() => of([]))),
            allPlans: this.emiService.getAllEmiPlans().pipe(catchError(() => of([])))
          });
        }),
        switchMap(({ cards, allPlans }) => {
          this.cards = cards || [];
          this.emiPlans = allPlans || [];

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
            this.transactions = transactions || [];
            this.computeMetrics();
            this.filterEligibleTransactions();
            this.checkQueryParams();
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.errorMessage = 'Failed to load EMI management data. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  private computeMetrics(): void {
    const active = this.emiPlans.filter(p => !p.status || p.status.toUpperCase() === 'ACTIVE');
    this.activePlansCount = active.length;
    this.totalOutstandingEmi = active.reduce((sum, p) => sum + (Number(p.outstandingAmount) || 0), 0);
    this.nextMonthEmiDue = active.reduce((sum, p) => sum + (Number(p.emiAmount) || 0), 0);
  }

  private filterEligibleTransactions(): void {
    const convertedTxnIds = new Set(this.emiPlans.map(p => p.transactionId));

    this.eligibleTransactions = this.transactions.filter(t => {
      const status = t.transactionStatus?.toUpperCase();
      const isCompleted = status === 'COMPLETED' || status === 'SUCCESS';
      const isEligibleAmount = Number(t.amount) >= 3000;
      const notAlreadyConverted = !convertedTxnIds.has(t.transactionId);
      return isCompleted && isEligibleAmount && notAlreadyConverted;
    });
  }

  private checkQueryParams(): void {
    const txnId = this.route.snapshot.queryParams['transactionId'];
    if (txnId) {
      const found = this.transactions.find(t => t.transactionId === txnId);
      if (found) {
        this.openConversionModal(found);
      } else {
        this.transactionService.getTransactionById(txnId).subscribe({
          next: (txn) => {
            if (txn) {
              this.openConversionModal(txn);
            }
          }
        });
      }
    }
  }

  openConversionModal(txn: Transaction): void {
    this.selectedTxn = txn;
    this.recommendation = null;
    this.selectedOption = null;
    this.modalErrorMessage = null;
    this.isLoadingRecommendation = true;

    this.activeModal = this.modalService.open(this.emiModalRef, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });

    this.emiService.getAiEmiRecommendation(txn.transactionId).subscribe({
      next: (rec) => {
        this.ngZone.run(() => {
          this.isLoadingRecommendation = false;
          this.recommendation = rec;
          if (rec.availableOptions && rec.availableOptions.length > 0) {
            const matched = rec.availableOptions.find(o => o.tenureMonths === rec.recommendedTenureMonths);
            this.selectedOption = matched || rec.availableOptions[0];
          }
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isLoadingRecommendation = false;
          this.modalErrorMessage = err.error?.message || 'Failed to generate AI EMI recommendation.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  selectOption(opt: EmiTenureOption): void {
    this.selectedOption = opt;
  }

  confirmCreatePlan(): void {
    if (!this.selectedTxn || !this.recommendation || !this.selectedOption) return;

    this.isSubmittingPlan = true;
    this.modalErrorMessage = null;

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    const endDateObj = new Date(today);
    endDateObj.setMonth(endDateObj.getMonth() + this.selectedOption.tenureMonths);
    const endDate = endDateObj.toISOString().split('T')[0];

    const nextDueDateObj = new Date(today);
    nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 1);
    const nextDueDate = nextDueDateObj.toISOString().split('T')[0];

    const planRequest: EmiPlanRequest = {
      transactionId: this.selectedTxn.transactionId,
      principal: Number(this.selectedTxn.amount),
      interestRate: this.selectedOption.interestRate ?? this.recommendation.annualInterestRate ?? 14.0,
      tenureMonths: this.selectedOption.tenureMonths,
      emiAmount: this.selectedOption.monthlyEmi,
      processingFee: this.selectedOption.processingFee ?? this.recommendation.processingFee ?? 100,
      startDate: startDate,
      endDate: endDate,
      outstandingAmount: this.selectedOption.totalPayable,
      status: 'ACTIVE',
      nextDueDate: nextDueDate
    };

    this.emiService.createEmiPlan(planRequest).subscribe({
      next: (created) => {
        this.ngZone.run(() => {
          this.isSubmittingPlan = false;
          this.successMessage = `EMI Plan #${created.emiPlanId} created successfully for ${this.selectedOption?.tenureMonths} months!`;
          this.dismissModal();
          this.activeTab = 'plans';
          this.loadData(true);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isSubmittingPlan = false;
          this.modalErrorMessage = err.error?.message || 'Failed to create EMI plan. Please try again.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  dismissModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
      this.activeModal = null;
    }
    if (this.route.snapshot.queryParams['transactionId']) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    }
  }

  getEmiStatusBadge(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'COMPLETED':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'CANCELLED':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }
}

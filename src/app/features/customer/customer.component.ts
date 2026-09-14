import { Component, OnInit, TemplateRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer, KycDocument } from '../../core/models/customer.model';
import { Card } from '../../core/models/card.model';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss'],
  standalone: false
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  customerCardsMap: Map<string, Card[]> = new Map();

  isLoading: boolean = false;
  errorMessage: string | null = null;
  actionMessage: string | null = null;

  // Filters
  searchQuery: string = '';
  selectedKycStatus: string = 'ALL';
  selectedBranchFilter: string = 'ALL';

  isBankOfficer: boolean = false;
  officerBranch: string = 'CN8080';

  // Metrics
  totalCustomers: number = 0;
  verifiedCount: number = 0;
  pendingCount: number = 0;
  activeAccountsCount: number = 0;

  // Details Modal
  @ViewChild('customerDetailsModal') customerDetailsModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;
  selectedCustomer: Customer | null = null;
  selectedCustomerDocs: KycDocument[] = [];
  selectedCustomerCards: Card[] = [];
  isLoadingDetails: boolean = false;

  constructor(
    private customerService: CustomerService,
    private cardService: CardService,
    public authService: AuthService,
    private modalService: NgbModal,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isBankOfficer = this.authService.hasRole('BANK_OFFICER');
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      customers: this.customerService.getAllCustomers().pipe(catchError(() => of([]))),
      cards: this.cardService.getAllCards().pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.customers = res.customers || [];
          const cards = res.cards || [];

          // Map cards per customer
          this.customerCardsMap.clear();
          cards.forEach(c => {
            const list = this.customerCardsMap.get(c.customerId) || [];
            list.push(c);
            this.customerCardsMap.set(c.customerId, list);
          });

          this.calculateMetrics();
          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load customer directory. Please try again.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  calculateMetrics(): void {
    this.totalCustomers = this.customers.length;
    this.verifiedCount = this.customers.filter(c => c.kycStatus === 'VERIFIED').length;
    this.pendingCount = this.customers.filter(c => c.kycStatus === 'PENDING').length;
    this.activeAccountsCount = this.customers.filter(c => c.customerStatus === 'ACTIVE').length;
  }

  applyFilters(): void {
    let list = [...this.customers];

    if (this.selectedKycStatus !== 'ALL') {
      list = list.filter(c => c.kycStatus?.toUpperCase() === this.selectedKycStatus.toUpperCase());
    }

    if (this.selectedBranchFilter === 'MY_BRANCH') {
      list = list.filter(c => c.branchCode?.toUpperCase() === this.officerBranch);
    } else if (this.selectedBranchFilter !== 'ALL') {
      list = list.filter(c => c.branchCode?.toUpperCase() === this.selectedBranchFilter.toUpperCase());
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.customerId && c.customerId.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q)) ||
        (c.branchCode && c.branchCode.toLowerCase().includes(q))
      );
    }

    this.filteredCustomers = list;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openDetails(customer: Customer): void {
    this.selectedCustomer = customer;
    this.selectedCustomerDocs = [];
    this.selectedCustomerCards = this.customerCardsMap.get(customer.customerId) || [];
    this.isLoadingDetails = true;

    this.activeModal = this.modalService.open(this.customerDetailsModalRef, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    this.customerService.getKycDocuments(customer.customerId).pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (docs) => {
        this.ngZone.run(() => {
          this.selectedCustomerDocs = docs || [];
          this.isLoadingDetails = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoadingDetails = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
      this.activeModal = null;
    }
  }

  verifyKyc(docId: string): void {
    this.customerService.verifyKycDocument(docId).subscribe({
      next: () => {
        this.actionMessage = `Document ${docId} has been verified successfully.`;
        this.loadCustomers();
        if (this.selectedCustomer) {
          this.customerService.getKycDocuments(this.selectedCustomer.customerId).subscribe(docs => {
            this.selectedCustomerDocs = docs;
            this.cdr.markForCheck();
          });
        }
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.actionMessage = err?.error?.message || err?.message || `Failed to verify document ${docId}.`;
          this.cdr.markForCheck();
        });
      }
    });
  }

  getKycBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'PENDING':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'REJECTED':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }
}

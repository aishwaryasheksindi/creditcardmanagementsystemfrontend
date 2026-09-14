import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer, KycDocument } from '../../core/models/customer.model';

@Component({
  selector: 'app-kyc',
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.scss'],
  standalone: false
})
export class KycComponent implements OnInit {
  // Customer State
  customer: Customer | null = null;
  documents: KycDocument[] = [];
  primaryDocument: KycDocument | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  actionSuccessMessage: string | null = null;
  isCustomer: boolean = false;

  // Staff / Admin KYC Queue State
  staffDocs: KycDocument[] = [];
  filteredStaffDocs: KycDocument[] = [];
  customerMap: Map<string, Customer> = new Map();
  selectedStatusFilter: string = 'ALL';
  selectedBranchFilter: string = 'ALL';
  searchQuery: string = '';

  isBankOfficer: boolean = false;
  officerBranch: string = 'CN8080';

  // Staff Metrics
  totalDocsCount: number = 0;
  pendingDocsCount: number = 0;
  verifiedDocsCount: number = 0;
  rejectedDocsCount: number = 0;

  constructor(
    private customerService: CustomerService,
    public authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.isBankOfficer = this.authService.hasRole('BANK_OFFICER');
    this.loadKycDetails();
  }

  loadKycDetails(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(forceRefresh).pipe(
        switchMap((cust) => {
          this.customer = cust;
          if (!cust?.customerId) {
            return of([]);
          }
          return this.customerService.getKycDocuments(cust.customerId);
        })
      ).subscribe({
        next: (docs) => {
          this.ngZone.run(() => {
            this.documents = docs || [];
            this.primaryDocument = this.documents.length > 0 ? this.documents[0] : null;
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.isLoading = false;
            if (err.status === 404) {
              this.errorMessage = 'Customer profile not found.';
            } else {
              this.errorMessage = 'Failed to load KYC verification records. Please try again.';
            }
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      // Staff / Admin Review Flow
      forkJoin({
        docs: this.customerService.getAllKycDocuments().pipe(catchError(() => of([]))),
        customers: this.customerService.getAllCustomers().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ docs, customers }) => {
          this.ngZone.run(() => {
            this.staffDocs = docs || [];
            this.customerMap.clear();
            (customers || []).forEach(c => this.customerMap.set(c.customerId, c));

            this.totalDocsCount = this.staffDocs.length;
            this.pendingDocsCount = this.staffDocs.filter(d => d.status === 'PENDING').length;
            this.verifiedDocsCount = this.staffDocs.filter(d => d.status === 'VERIFIED').length;
            this.rejectedDocsCount = this.staffDocs.filter(d => d.status === 'REJECTED').length;

            this.applyStaffFilters();
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Failed to load compliance KYC queue. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  applyStaffFilters(): void {
    let result = [...this.staffDocs];

    if (this.selectedStatusFilter !== 'ALL') {
      result = result.filter(d => d.status === this.selectedStatusFilter);
    }

    if (this.selectedBranchFilter === 'MY_BRANCH') {
      result = result.filter(d => {
        const cust = this.customerMap.get(d.customerId);
        return cust?.branchCode?.toUpperCase() === this.officerBranch;
      });
    } else if (this.selectedBranchFilter !== 'ALL') {
      result = result.filter(d => {
        const cust = this.customerMap.get(d.customerId);
        return cust?.branchCode?.toUpperCase() === this.selectedBranchFilter.toUpperCase();
      });
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(d => {
        const cust = this.customerMap.get(d.customerId);
        const nameMatch = cust?.name?.toLowerCase().includes(q) || false;
        const idMatch = d.customerId.toLowerCase().includes(q);
        const docNumMatch = d.documentNumber?.toLowerCase().includes(q) || false;
        const typeMatch = d.documentType?.toLowerCase().includes(q) || false;
        const branchMatch = cust?.branchCode?.toLowerCase().includes(q) || false;
        return nameMatch || idMatch || docNumMatch || typeMatch || branchMatch;
      });
    }

    this.filteredStaffDocs = result;
  }

  onFilterChange(): void {
    this.applyStaffFilters();
  }

  verifyDoc(docId: string): void {
    this.actionSuccessMessage = null;
    this.errorMessage = null;
    this.customerService.verifyKycDocument(docId).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.actionSuccessMessage = `Document ${docId} verified successfully. Card eligibility updated.`;
          this.loadKycDetails(true);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorMessage = err?.error?.message || err?.message || `Failed to verify document ${docId}.`;
          this.cdr.markForCheck();
        });
      }
    });
  }

  rejectDoc(docId: string): void {
    const reason = window.prompt('Enter rejection reason for this document:', 'Identity details mismatch or illegible copy');
    if (reason === null) return; // User cancelled

    this.actionSuccessMessage = null;
    this.errorMessage = null;
    this.customerService.rejectKycDocument(docId, reason || 'Compliance standards not met').subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.actionSuccessMessage = `Document ${docId} has been rejected.`;
          this.loadKycDetails(true);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorMessage = err?.error?.message || err?.message || `Failed to reject document ${docId}.`;
          this.cdr.markForCheck();
        });
      }
    });
  }

  getCustomerName(customerId: string): string {
    return this.customerMap.get(customerId)?.name || customerId;
  }

  getCustomerBranch(customerId: string): string {
    return this.customerMap.get(customerId)?.branchCode || 'N/A';
  }

  isOfficerBranch(customerId: string): boolean {
    const branch = this.customerMap.get(customerId)?.branchCode;
    return branch?.toUpperCase() === this.officerBranch;
  }

  maskDocumentNumber(docNum: string | null | undefined): string {
    if (!docNum) return '���� ���� ����';
    const trimmed = docNum.trim();
    if (trimmed.length <= 4) return trimmed;
    const last4 = trimmed.slice(-4);
    return '���� ���� ' + last4;
  }

  goToCards(): void {
    this.router.navigate(['/app/cards']);
  }

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }
}

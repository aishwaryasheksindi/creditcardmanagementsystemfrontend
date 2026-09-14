import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer } from '../../core/models/customer.model';
import { UserProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false
})
export class ProfileComponent implements OnInit {
  customer: Customer | null = null;
  userProfile: UserProfile | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isCustomer: boolean = false;

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private profileService: ProfileService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadProfile(true);
  }

  loadProfile(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(forceRefresh).subscribe({
        next: (customer) => {
          this.ngZone.run(() => {
            this.customer = customer;
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.isLoading = false;
            if (err.status === 404) {
              this.errorMessage = 'No customer profile record found for your account.';
            } else {
              this.errorMessage = 'Failed to load customer profile details. Please try again.';
            }
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      this.profileService.loadMyProfile().subscribe({
        next: (profile) => {
          this.ngZone.run(() => {
            this.userProfile = profile;
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Failed to load staff profile details.';
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  goToEditProfile(): void {
    this.router.navigate(['/app/profile/edit']);
  }

  getKycBadgeClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
        return 'bg-success text-white';
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'REJECTED':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'INACTIVE':
      case 'SUSPENDED':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }
}
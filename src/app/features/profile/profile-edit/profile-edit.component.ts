import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { Customer } from '../../../core/models/customer.model';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../../../core/models/user-profile.model';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmNewPassword = control.get('confirmNewPassword')?.value;
  if (!confirmNewPassword) {
    return null;
  }
  return newPassword === confirmNewPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
  standalone: false
})
export class ProfileEditComponent implements OnInit {
  customer: Customer | null = null;
  userProfile: UserProfile | null = null;
  isCustomer: boolean = false;
  isLoading: boolean = false;
  loadErrorMessage: string | null = null;

  // Contact form
  contactForm!: FormGroup;
  isUpdatingContact: boolean = false;
  contactSuccessMessage: string | null = null;
  contactErrorMessage: string | null = null;

  // Password form
  passwordForm!: FormGroup;
  isChangingPassword: boolean = false;
  passwordSuccessMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private customerService: CustomerService,
    public authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.initForms();
    this.loadData();
  }

  private initForms(): void {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]]
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(50),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).*$/)
          ]
        ],
        confirmNewPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  loadData(): void {
    this.isLoading = true;
    this.loadErrorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile(true).subscribe({
        next: (customer) => {
          this.ngZone.run(() => {
            this.customer = customer;
            this.contactForm.patchValue({
              email: customer.email || '',
              phoneNumber: customer.phoneNumber || ''
            });
            this.contactForm.markAsPristine();
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.loadErrorMessage = 'Unable to load profile details. Please try again.';
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      this.profileService.loadMyProfile().subscribe({
        next: (profile) => {
          this.ngZone.run(() => {
            this.userProfile = profile;
            this.contactForm.patchValue({
              email: profile.email || '',
              phoneNumber: profile.phoneNumber || ''
            });
            this.contactForm.markAsPristine();
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.loadErrorMessage = 'Unable to load profile details.';
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  onUpdateContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isUpdatingContact = true;
    this.contactSuccessMessage = null;
    this.contactErrorMessage = null;

    const request: UpdateProfileRequest = {
      email: this.contactForm.value.email.trim(),
      phoneNumber: this.contactForm.value.phoneNumber.trim()
    };

    this.profileService.updateMyProfile(request).subscribe({
      next: (updatedProfile) => {
        this.ngZone.run(() => {
          this.isUpdatingContact = false;
          this.contactSuccessMessage = 'Contact information updated successfully.';
          this.userProfile = updatedProfile;
          if (this.customer) {
            this.customer.email = updatedProfile.email;
            this.customer.phoneNumber = updatedProfile.phoneNumber || '';
          }
          // Refresh customer service cache
          this.customerService.getMyProfile(true).subscribe();
          this.contactForm.markAsPristine();
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isUpdatingContact = false;
          this.contactErrorMessage = this.parseError(err);
          this.cdr.markForCheck();
        });
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword = true;
    this.passwordSuccessMessage = null;
    this.passwordErrorMessage = null;

    const request: ChangePasswordRequest = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.profileService.changeMyPassword(request).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isChangingPassword = false;
          this.passwordSuccessMessage = 'Password changed successfully.';
          this.passwordForm.reset();
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isChangingPassword = false;
          this.passwordErrorMessage = this.parseError(err);
          this.cdr.markForCheck();
        });
      }
    });
  }

  goToViewProfile(): void {
    this.router.navigate(['/app/profile']);
  }

  get contactControls() {
    return this.contactForm.controls;
  }

  get passwordControls() {
    return this.passwordForm.controls;
  }

  get hasPasswordMismatch(): boolean {
    return (
      !!this.passwordForm.hasError('passwordMismatch') &&
      !!this.passwordForm.get('confirmNewPassword')?.touched
    );
  }

  private parseError(error: any): string {
    if (error.status === 0) {
      return 'Cannot connect to backend server. Please verify the connection.';
    }
    if (error.status === 400 && error.error?.validationErrors) {
      return Object.values(error.error.validationErrors).join(', ');
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return 'An error occurred while updating profile. Please try again.';
  }
}

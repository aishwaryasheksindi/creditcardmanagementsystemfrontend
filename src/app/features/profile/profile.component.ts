import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../../core/models/user-profile.model';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmNewPassword = control.get('confirmNewPassword')?.value;
  if (!confirmNewPassword) {
    return null;
  }
  return newPassword === confirmNewPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  isLoadingProfile: boolean = false;
  profileErrorMessage: string | null = null;

  editDetailsForm!: FormGroup;
  isUpdatingDetails: boolean = false;
  detailsSuccessMessage: string | null = null;
  detailsErrorMessage: string | null = null;

  passwordForm!: FormGroup;
  isChangingPassword: boolean = false;
  passwordSuccessMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  private profileSub?: Subscription;

  constructor(
    public profileService: ProfileService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();

    // Check if navbar already loaded profile
    const cachedProfile = this.profileService.currentProfile;
    if (cachedProfile) {
      this.setProfile(cachedProfile);
    } else {
      this.loadProfile();
    }

    // Subscribe to profile updates to keep views synchronized
    this.profileSub = this.profileService.profile$.subscribe((p) => {
      if (p) {
        this.setProfile(p);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }

  private initForms(): void {
    this.editDetailsForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.maxLength(20)]]
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
        confirmNewPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    this.profileErrorMessage = null;

    this.profileService.loadMyProfile().subscribe({
      next: (profile) => {
        this.isLoadingProfile = false;
        this.setProfile(profile);
      },
      error: (error) => {
        this.isLoadingProfile = false;
        this.profileErrorMessage = this.parseBackendError(error);
      }
    });
  }

  private setProfile(profile: UserProfile): void {
    this.profile = profile;
    this.editDetailsForm.patchValue({
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || ''
    });
    this.editDetailsForm.markAsPristine();
  }

  onUpdateDetails(): void {
    if (this.editDetailsForm.invalid) {
      this.editDetailsForm.markAllAsTouched();
      return;
    }

    this.isUpdatingDetails = true;
    this.detailsSuccessMessage = null;
    this.detailsErrorMessage = null;

    const request: UpdateProfileRequest = {
      email: this.editDetailsForm.value.email?.trim(),
      phoneNumber: this.editDetailsForm.value.phoneNumber?.trim() || ''
    };

    this.profileService.updateMyProfile(request).subscribe({
      next: (updatedProfile) => {
        this.isUpdatingDetails = false;
        this.detailsSuccessMessage = 'Contact information updated successfully.';
        this.setProfile(updatedProfile);
      },
      error: (error) => {
        this.isUpdatingDetails = false;
        this.detailsErrorMessage = this.parseBackendError(error);
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
        this.isChangingPassword = false;
        this.passwordSuccessMessage = 'Password changed successfully.';
        this.passwordForm.reset();
      },
      error: (error) => {
        this.isChangingPassword = false;
        this.passwordErrorMessage = this.parseBackendError(error);
      }
    });
  }

  get detailsControls() {
    return this.editDetailsForm.controls;
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

  getAccountTypeLabel(): string {
    if (this.profile?.accountType === 'STAFF') {
      return 'Staff Personnel';
    }
    if (this.profile?.accountType === 'CUSTOMER') {
      return 'Cardholder Account';
    }
    return 'Standard Account';
  }

  private parseBackendError(error: any): string {
    if (error.status === 0) {
      return 'Cannot connect to backend server. Please verify that the server is running.';
    }

    if (error.status === 400) {
      if (error.error && error.error.validationErrors) {
        const messages = Object.values(error.error.validationErrors).join(', ');
        return messages || 'Invalid input provided.';
      }
      if (error.error && error.error.message) {
        return error.error.message;
      }
      return 'Invalid request. Please check your submission.';
    }

    if (error.status === 401) {
      return 'Session expired or unauthorized. Please log in again to continue.';
    }

    if (error.error && error.error.message) {
      return error.error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
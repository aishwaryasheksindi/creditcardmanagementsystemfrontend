import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StaffService } from '../../../../core/services/staff.service';
import { StaffType } from '../../../../core/models/staff.model';

@Component({
  selector: 'app-staff-create',
  templateUrl: './staff-create.component.html',
  styleUrls: ['./staff-create.component.scss'],
  standalone: false
})
export class StaffCreateComponent implements OnInit {
  staffForm!: FormGroup;
  isSubmitting: boolean = false;
  serverError: string | null = null;
  successMessage: string | null = null;

  readonly staffTypes: { value: StaffType; label: string; description: string }[] = [
    { value: 'BANK_OFFICER', label: 'Bank Officer', description: 'Handles card approvals, limit increases, and daily branch banking ops' },
    { value: 'ADMIN', label: 'Administrator', description: 'Full administrative access to personnel, audit logs, and platform settings' },
    { value: 'FRAUD_ANALYST', label: 'Fraud Analyst', description: 'Monitors suspicious transactions, risk flags, and fraud incident queues' },
    { value: 'CUSTOMER_SERVICE_AGENT', label: 'Customer Service Agent', description: 'Assists cardholders with account inquiries, disputes, and card issues' }
  ];

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.staffForm = this.fb.group({
      staffType: ['BANK_OFFICER', [Validators.required]],
      userId: ['', [Validators.required]],
      empName: ['', [Validators.required, Validators.maxLength(100)]],
      empPhone: ['', [Validators.required, Validators.maxLength(20)]],
      empDob: ['', [Validators.required]],
      empAddress: ['', [Validators.required, Validators.maxLength(255)]],
      empDesignation: ['', [Validators.required, Validators.maxLength(100)]],
      empJoiningDate: [today, [Validators.required]],
      empStatus: ['ACTIVE', [Validators.required, Validators.maxLength(50)]],
      branchCode: ['', [Validators.required, Validators.maxLength(50)]]
    });

    this.staffForm.get('staffType')?.valueChanges.subscribe(type => {
      this.onStaffTypeChanged(type);
    });
  }

  onStaffTypeChanged(type: StaffType): void {
    const branchCodeControl = this.staffForm.get('branchCode');
    if (type === 'BANK_OFFICER') {
      branchCodeControl?.setValidators([Validators.required, Validators.maxLength(50)]);
    } else {
      branchCodeControl?.clearValidators();
      branchCodeControl?.setValue('');
    }
    branchCodeControl?.updateValueAndValidity();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.staffForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;
    this.successMessage = null;

    const formValue = this.staffForm.value;

    this.staffService.createStaff(formValue).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.successMessage = `Staff member ${created.empName} (ID: ${created.staffId}) registered successfully!`;
        setTimeout(() => {
          this.router.navigate(['/app/admin/staff']);
        }, 1200);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err?.error?.message) {
          this.serverError = err.error.message;
        } else if (err?.status === 404) {
          this.serverError = 'User not found. Please ensure the User ID exists in the system before creating staff profile.';
        } else if (err?.status === 400 && err?.error?.errors) {
          const details = Object.values(err.error.errors).join(', ');
          this.serverError = `Validation failed: ${details}`;
        } else {
          this.serverError = 'An error occurred while creating the staff record. Please try again.';
        }
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/app/admin/staff']);
  }
}

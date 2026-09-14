import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerRegistrationRequest } from '../../../core/models/customer.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  branchCodes: string[] = ['CN8080', 'CN4200'];
  incomeRanges: string[] = [
    'Below ₹3,00,000',
    '₹3,00,000 - ₹5,00,000',
    '₹5,00,000 - ₹10,00,000',
    '₹10,00,000 - ₹15,00,000',
    'Above ₹15,00,000'
  ];
  employmentTypes: string[] = [
    'Salaried Employee',
    'Software Engineer',
    'Business / Self-Employed',
    'Chartered Accountant',
    'Doctor / Healthcare',
    'Civil Services / Government',
    'Other Professional'
  ];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  get f() {
    return this.registerForm.controls;
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z0-9_]+$/)
        ]
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(50),
          Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).*$/)
        ]
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
        ]
      ],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[6-9][0-9]{9}$/)
        ]
      ],
      address: ['', [Validators.required, Validators.minLength(5)]],
      dateOfBirth: ['', [Validators.required]],
      employment: ['Salaried Employee', [Validators.required]],
      incomeRange: ['₹5,00,000 - ₹10,00,000', [Validators.required]],
      branchCode: ['CN8080', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValues = this.registerForm.value;
    const request: CustomerRegistrationRequest = {
      username: formValues.username.trim(),
      email: formValues.email.trim(),
      password: formValues.password,
      name: formValues.name.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      address: formValues.address.trim(),
      dateOfBirth: formValues.dateOfBirth,
      employment: formValues.employment,
      incomeRange: formValues.incomeRange,
      branchCode: formValues.branchCode
    };

    this.customerService.registerCustomer(request).subscribe({
      next: (created) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.successMessage = `Registration successful! Welcome to CardNest, ${created.name}. You may now sign in.`;
          this.registerForm.reset();
          this.cdr.markForCheck();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = this.parseError(error);
          this.cdr.markForCheck();
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private parseError(error: any): string {
    if (error.status === 0) {
      return 'Cannot connect to backend server. Please verify the connection.';
    }
    if (error.status === 409) {
      return error.error?.message || 'A user or customer with this username, email, or phone number already exists.';
    }
    if (error.status === 400 && error.error?.validationErrors) {
      return Object.values(error.error.validationErrors).join(', ');
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return 'Customer registration failed. Please check all fields and try again.';
  }
}

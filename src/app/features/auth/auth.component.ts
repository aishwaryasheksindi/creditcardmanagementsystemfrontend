import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: false
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  private returnUrl: string = '/app/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // If already authenticated, navigate directly to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app/dashboard']);
      return;
    }

    this.initForm();

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';
    if (this.route.snapshot.queryParams['sessionExpired']) {
      this.infoMessage = 'Your session has expired. Please log in again to continue.';
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.infoMessage = null;

    const credentials = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.isLoading = false;
        this.parseBackendError(error);
      }
    });
  }

  private parseBackendError(error: any): void {
    if (error.status === 0) {
      this.errorMessage = 'Cannot connect to authentication service. Please verify that the backend server is running.';
      return;
    }

    if (error.status === 401) {
      // Check backend GlobalExceptionHandler message
      if (error.error && error.error.message) {
        this.errorMessage = error.error.message;
      } else {
        this.errorMessage = 'Invalid username or password. Please check your credentials.';
      }
      return;
    }

    if (error.status === 423) {
      this.errorMessage = error.error?.message || 'Account temporarily locked due to multiple failed login attempts. Please try again later.';
      return;
    }

    if (error.status === 400 && error.error?.validationErrors) {
      const messages = Object.values(error.error.validationErrors).join(', ');
      this.errorMessage = messages || 'Invalid input provided.';
      return;
    }

    if (error.error && error.error.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'Authentication error encountered. Please try again.';
    }
  }
}

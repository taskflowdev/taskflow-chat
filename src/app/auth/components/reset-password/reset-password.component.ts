import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PasswordStrengthComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  isValidatingToken = true;
  tokenValid = false;
  showPassword = false;
  showConfirmPassword = false;
  email: string = '';
  token: string = '';
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Extract email and token from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';

      if (!this.email || !this.token) {
        this.isValidatingToken = false;
        this.tokenValid = false;
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
        return;
      }

      // Validate the token
      this.validateToken();
    });
  }

  private validateToken(): void {
    this.authService.validateResetToken(this.email, this.token).subscribe({
      next: (result) => {
        this.isValidatingToken = false;
        this.tokenValid = result.valid;
        if (!result.valid) {
          this.errorMessage = result.message || 'Invalid or expired reset token.';
        }
      },
      error: (error) => {
        this.isValidatingToken = false;
        this.tokenValid = false;
        this.errorMessage = 'Unable to validate reset token. Please try again.';
        console.error('Token validation error:', error);
      }
    });
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) {
      return null;
    }

    const errors: ValidationErrors = {};
    
    if (!/[A-Z]/.test(password)) {
      errors['requireUpper'] = true;
    }
    if (!/[a-z]/.test(password)) {
      errors['requireLower'] = true;
    }
    if (!/[0-9]/.test(password)) {
      errors['requireNumber'] = true;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors['requireSymbol'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.resetPasswordForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return null;
  }

  getFormError(): string | null {
    if (this.resetPasswordForm.errors?.['passwordMismatch']) {
      const confirmField = this.resetPasswordForm.get('confirmPassword');
      if (confirmField?.touched) {
        return 'Passwords do not match';
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      newPassword: 'New password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      this.toastService.showError('Please fix all form errors');
      return;
    }

    this.isLoading = true;
    const { newPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword
    }).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.toastService.showSuccess('Password reset successfully!', 'Success');
          // Redirect to login after a short delay
          setTimeout(() => {
            this.router.navigate(['/auth/signin']);
          }, 1500);
        } else {
          this.toastService.showError(result.message || 'Failed to reset password');
          this.errorMessage = result.message || 'Failed to reset password. The link may have expired.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Failed to reset password. Please try again.');
        this.errorMessage = 'An error occurred. Please try requesting a new reset link.';
        console.error('Password reset error:', error);
      }
    });
  }

  onResendEmail(): void {
    if (!this.email) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.authService.resendResetLink(this.email).subscribe({
      next: (result) => {
        this.toastService.showSuccess('New reset link sent to your email');
        this.router.navigate(['/auth/forgot-password']);
      },
      error: (error) => {
        this.toastService.showError('Failed to resend reset link');
      }
    });
  }
}

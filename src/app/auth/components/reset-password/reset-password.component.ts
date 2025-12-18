import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  isSuccess = false;
  isValidatingToken = true;
  tokenValid = false;
  errorMessage: string | null = null;
  
  email: string = '';
  token: string = '';
  
  showPassword = false;
  showConfirmPassword = false;

  // Password policy configuration
  passwordPolicy = {
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSymbol: true
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, this.passwordStrengthValidator.bind(this)]],
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
        this.errorMessage = 'Invalid or missing reset link. Please request a new password reset.';
        return;
      }

      // Validate the token
      this.validateToken();
    });
  }

  validateToken(): void {
    this.authService.validateResetToken(this.email, this.token).subscribe({
      next: (isValid) => {
        this.isValidatingToken = false;
        this.tokenValid = isValid;
        if (!isValid) {
          this.errorMessage = 'This password reset link has expired or is invalid. Please request a new one.';
        }
      },
      error: (error) => {
        console.error('Token validation error:', error);
        this.isValidatingToken = false;
        this.tokenValid = false;
        this.errorMessage = 'Unable to validate reset link. Please try again or request a new link.';
      }
    });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const errors: ValidationErrors = {};

    if (password.length < this.passwordPolicy.minLength) {
      errors['minLength'] = true;
    }
    if (this.passwordPolicy.requireUpper && !/[A-Z]/.test(password)) {
      errors['requireUpper'] = true;
    }
    if (this.passwordPolicy.requireLower && !/[a-z]/.test(password)) {
      errors['requireLower'] = true;
    }
    if (this.passwordPolicy.requireNumber && !/[0-9]/.test(password)) {
      errors['requireNumber'] = true;
    }
    if (this.passwordPolicy.requireSymbol && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors['requireSymbol'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  getPasswordStrength(): { strength: number; label: string; color: string } {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (password.length >= this.passwordPolicy.minLength) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const strengthMap = [
      { strength: 0, label: 'Very Weak', color: '#e74c3c' },
      { strength: 1, label: 'Weak', color: '#e67e22' },
      { strength: 2, label: 'Fair', color: '#f39c12' },
      { strength: 3, label: 'Good', color: '#3498db' },
      { strength: 4, label: 'Strong', color: '#2ecc71' },
      { strength: 5, label: 'Very Strong', color: '#27ae60' }
    ];

    return strengthMap[strength];
  }

  getFieldError(fieldName: string): string | null {
    const field = this.resetPasswordForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minLength']) {
        return `Password must be at least ${this.passwordPolicy.minLength} characters`;
      }
      if (field.errors['requireUpper']) {
        return 'Password must contain at least one uppercase letter';
      }
      if (field.errors['requireLower']) {
        return 'Password must contain at least one lowercase letter';
      }
      if (field.errors['requireNumber']) {
        return 'Password must contain at least one number';
      }
      if (field.errors['requireSymbol']) {
        return 'Password must contain at least one special character';
      }
      if (field.errors['passwordMismatch']) {
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

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
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
      this.toastService.showError('Please fix the errors in the form');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const newPassword = this.resetPasswordForm.value.newPassword;

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: newPassword
    }).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.isSuccess = true;
          this.toastService.showSuccess('Your password has been reset successfully!', 'Success');
          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/auth/signin'], { replaceUrl: true });
          }, 2000);
        } else {
          this.errorMessage = result.error || 'Password reset failed. Please try again.';
          this.toastService.showError(this.errorMessage, 'Reset Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An unexpected error occurred. Please try again.';
        this.toastService.showError(this.errorMessage);
        console.error('Password reset error:', error);
      }
    });
  }

  requestNewResetLink(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/signin']);
  }

  // Helper methods for template to avoid complex regex in HTML
  hasMinLength(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    return password.length >= this.passwordPolicy.minLength;
  }

  hasUpperCase(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[0-9]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }
}

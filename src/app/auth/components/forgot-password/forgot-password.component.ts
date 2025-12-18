import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isEmailSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return 'Email is required';
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
      this.toastService.showError('Please enter a valid email address');
      return;
    }

    this.isLoading = true;
    const email = this.forgotPasswordForm.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.isEmailSent = true;
          this.toastService.showSuccess('Password reset instructions sent to your email');
        } else {
          // Always show generic success message for security (don't reveal if email exists)
          this.isEmailSent = true;
          this.toastService.showSuccess('If an account exists with this email, you will receive reset instructions');
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Always show generic success message for security
        this.isEmailSent = true;
        this.toastService.showSuccess('If an account exists with this email, you will receive reset instructions');
        console.error('Password reset request error:', error);
      }
    });
  }

  onTryAgain(): void {
    this.isEmailSent = false;
    this.forgotPasswordForm.reset();
  }
}

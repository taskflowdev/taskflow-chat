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
        this.isEmailSent = true;
        // Always show success message for security (no email disclosure)
        this.toastService.showSuccess(result.message || 'Password reset instructions sent!', 'Check Your Email');
      },
      error: (error) => {
        this.isLoading = false;
        // Still show success for security, but log error
        console.error('Password reset request error:', error);
        this.isEmailSent = true;
        this.toastService.showSuccess('If an account exists with this email, you will receive password reset instructions.', 'Request Sent');
      }
    });
  }

  tryAgain(): void {
    this.isEmailSent = false;
    this.forgotPasswordForm.reset();
  }
}

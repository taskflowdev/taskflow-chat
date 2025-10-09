import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Redirect if already logged in
    const currentUser = this.authService.getCurrentUser();
    if (this.authService.isAuthenticated() && currentUser) {
      this.router.navigate(['/chats'], { replaceUrl: true });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
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

  getFieldError(fieldName: string): string | null {
    const field = this.signupForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full name',
      userName: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });

      // Show validation error in toast
      this.toastService.showError('Please fill in all required fields correctly');
      return;
    }

    this.isLoading = true;

    const { fullName, userName, email, password } = this.signupForm.value;

    this.authService.register({ fullName, userName, email, password }).subscribe({
      next: (result) => {
        if (result.success) {
          // Wait for currentUser$ to emit before navigating
          // This ensures the user data is loaded before redirecting
          this.authService.currentUser$.subscribe(user => {
            if (user) {
              this.isLoading = false;
              this.toastService.showSuccess('Account created successfully! Welcome to TaskFlow Chat.', 'Registration Successful');
              // Use replaceUrl to prevent back button returning to signup
              this.router.navigate(['/chats'], { replaceUrl: true });
            }
          });
        } else {
          this.isLoading = false;
          this.toastService.showError(result.error || 'Registration failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('An unexpected error occurred. Please try again.');
        console.error('Registration error:', error);
      }
    });
  }
}

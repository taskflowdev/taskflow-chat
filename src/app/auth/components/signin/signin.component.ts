import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent implements OnInit {
  signinForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.signinForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // Redirect if already logged in
    const currentUser = this.authService.getCurrentUser();
    if (this.authService.isAuthenticated() && currentUser) {
      this.router.navigate(['/chats'], { replaceUrl: true });
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.signinForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      userName: 'Username',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.signinForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signinForm.controls).forEach(key => {
        this.signinForm.get(key)?.markAsTouched();
      });

      // Show validation error in toast
      this.toastService.showError('Please fill in all required fields correctly');
      return;
    }

    this.isLoading = true;

    const { userName, password } = this.signinForm.value;

    this.authService.login({ userName, password }).subscribe({
      next: (result) => {
        if (result.success) {
          // Wait for currentUser$ to emit before navigating
          // This ensures the user data is loaded before redirecting
          this.authService.currentUser$.subscribe(user => {
            if (user) {
              this.isLoading = false;
              this.toastService.showSuccess('Welcome back!', 'Login Successful');
              // Use replaceUrl to prevent back button returning to login
              this.router.navigate(['/chats'], { replaceUrl: true });
            }
          });
        } else {
          this.isLoading = false;
          this.toastService.showError(result.error || 'Login failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('An unexpected error occurred. Please try again.');
        console.error('Login error:', error);
      }
    });
  }
}

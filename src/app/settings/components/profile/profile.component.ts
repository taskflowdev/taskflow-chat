import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '../../../core/i18n';
import { getUserInitials } from '../../../shared/utils/user.utils';
import { CommonInputComponent } from '../../../shared/components/common-form-controls/common-input.component';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    SkeletonLoaderComponent, 
    TranslatePipe,
    CommonInputComponent,
    CommonButtonComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  currentUser$: Observable<AuthUser | null>;
  profileForm!: FormGroup;
  isEditing = false;
  isSaving = false;
  
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Initialize form
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['', [Validators.maxLength(500)]],
      url: ['', [Validators.pattern('https?://.+')]]
    });

    // Load user data into form
    this.currentUser$.subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          fullName: user.fullName || '',
          email: user.email || '',
          bio: '',
          url: ''
        });
      }
    });
  }

  /**
   * Get user initials for avatar display
   */
  getUserInitials(user: AuthUser): string {
    return getUserInitials(user);
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.profileForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      // TODO: Implement API call to update profile
      // For now, just simulate saving
      setTimeout(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
        console.log('Profile updated:', this.profileForm.value);
      }, 1000);
    }
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['minlength']) {
      return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['pattern']) {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }

    return 'Invalid value';
  }
}

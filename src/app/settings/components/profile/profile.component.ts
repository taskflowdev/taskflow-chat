import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '../../../core/i18n';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  currentUser$: Observable<AuthUser | null>;
  
  constructor(
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // User data is already loaded from AuthService
  }

  /**
   * Get user initials for avatar display
   */
  getUserInitials(user: AuthUser): string {
    if (user.fullName) {
      const names = user.fullName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return user.fullName.substring(0, 2).toUpperCase();
    }
    return user.userName?.substring(0, 2).toUpperCase() || 'U';
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
}

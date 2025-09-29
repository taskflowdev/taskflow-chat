import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ThemeService } from '../services/theme.service';

/**
 * Guard that applies themes to authenticated routes only
 * Ensures login and signup pages remain neutral-themed
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeGuard implements CanActivate {
  private themeService = inject(ThemeService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Check if this is an auth route (login/signup)
    if (state.url.includes('/auth/')) {
      // Apply neutral theme for auth pages
      this.applyNeutralTheme();
      return true;
    }

    // For all other routes, apply user's selected theme
    if (this.themeService.shouldApplyTheme()) {
      this.themeService.applyCurrentTheme();
    }

    return true;
  }

  /**
   * Apply a neutral theme for login/signup pages
   */
  private applyNeutralTheme(): void {
    const root = document.documentElement;
    
    // Reset any existing theme variables to neutral values
    root.style.setProperty('--theme-bg-primary', '#ffffff');
    root.style.setProperty('--theme-bg-secondary', '#f8f9fa');
    root.style.setProperty('--theme-text-primary', '#212529');
    root.style.setProperty('--theme-text-secondary', '#6c757d');
    root.style.setProperty('--theme-border', '#dee2e6');
    root.style.setProperty('--theme-accent', '#0d6efd');
    root.style.setProperty('--theme-icon', '#495057');
    root.style.setProperty('--theme-success', '#198754');
    root.style.setProperty('--theme-warning', '#fd7e14');
    root.style.setProperty('--theme-error', '#dc3545');

    // Remove any theme classes and apply neutral
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add('theme-neutral');
  }
}
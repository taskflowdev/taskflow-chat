import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ThemeService } from '../services/theme.service';

/**
 * Guard that applies neutral theme to login/signup pages
 * and allows theme application to all other pages
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  private readonly neutralRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ];

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url = state.url;
    const isNeutralRoute = this.neutralRoutes.some(neutralRoute => 
      url.startsWith(neutralRoute)
    );

    if (isNeutralRoute) {
      this.applyNeutralTheme();
    } else {
      this.removeNeutralTheme();
    }

    return true;
  }

  private applyNeutralTheme(): void {
    if (typeof document === 'undefined') return;

    // Add neutral theme class
    document.documentElement.classList.add('neutral-theme');
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    
    // Apply neutral theme colors
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', '#6c757d');
    root.style.setProperty('--theme-secondary', '#adb5bd');
    root.style.setProperty('--theme-success', '#198754');
    root.style.setProperty('--theme-danger', '#dc3545');
    root.style.setProperty('--theme-warning', '#ffc107');
    root.style.setProperty('--theme-info', '#0dcaf0');
    root.style.setProperty('--theme-light', '#f8f9fa');
    root.style.setProperty('--theme-dark', '#212529');
    
    document.documentElement.setAttribute('data-theme-variant', 'neutral');
  }

  private removeNeutralTheme(): void {
    if (typeof document === 'undefined') return;
    
    document.documentElement.classList.remove('neutral-theme');
    // The ThemeService will handle reapplying the user's theme
  }
}
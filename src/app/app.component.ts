import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeService } from './shared/services/theme.service';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'taskflow-chat';
  
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Initialize theme based on authentication status
    this.initializeTheme();

    // Listen for navigation changes to handle theme application
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.handleRouteChange();
    });

    // Listen for authentication changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // User logged in - load their theme
        this.themeService.loadUserTheme().subscribe();
      }
    });
  }

  private initializeTheme(): void {
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      // Apply default theme for unauthenticated users
      this.themeService.applyDefaultTheme();
    } else {
      // Load user theme from API/cache
      this.themeService.loadUserTheme().subscribe();
      // Also initialize the settings theme service
      this.themeService.loadThemes().subscribe();
      this.themeService.loadUserPreferences().subscribe();
    }
  }

  private handleRouteChange(): void {
    const currentUrl = this.router.url;
    const isAuthRoute = currentUrl.startsWith('/auth/login') || 
                       currentUrl.startsWith('/auth/signup') || 
                       currentUrl.startsWith('/auth/forgot-password');
    
    if (isAuthRoute) {
      // Auth routes should not have theme applied
      // The default theme will be shown (handled by CSS)
    } else {
      // Re-apply theme for non-auth routes
      const isAuthenticated = this.authService.isAuthenticated();
      if (isAuthenticated) {
        this.themeService.loadUserTheme().subscribe();
      } else {
        this.themeService.applyDefaultTheme();
      }
    }
  }
}

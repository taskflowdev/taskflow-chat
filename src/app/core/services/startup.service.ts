import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of, catchError, tap, map, switchMap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { UserSettingsService } from './user-settings.service';

/**
 * StartupService - Centralized application startup initialization
 * 
 * This service runs during APP_INITIALIZER and handles:
 * 1. Token verification and /me profile fetch
 * 2. User settings load
 * 3. Theme initialization
 * 4. Proper error handling with redirect to login
 * 
 * Creates a startup flow similar to Teams/Gmail/Slack where:
 * - User sees splash screen immediately
 * - All initialization happens in background
 * - Main UI only renders after everything is ready
 */
@Injectable({
  providedIn: 'root'
})
export class StartupService {
  private readonly MIN_SPLASH_DURATION = 800; // Minimum splash screen duration in ms
  private initStartTime: number = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private userSettingsService: UserSettingsService,
    private router: Router
  ) {}

  /**
   * Initialize the application
   * Called by APP_INITIALIZER to ensure proper startup sequence
   * 
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void> {
    return new Promise((resolve) => {
      // Skip initialization during SSR
      if (!isPlatformBrowser(this.platformId)) {
        this.authService.setInitialized();
        resolve();
        return;
      }

      // Record start time for minimum splash screen duration
      this.initStartTime = Date.now();

      // Run initialization pipeline
      this.runInitializationPipeline().subscribe({
        next: () => {
          this.completeInitialization(resolve);
        },
        error: (err) => {
          console.error('Startup initialization error:', err);
          // Even on error, complete initialization to not block the app
          this.completeInitialization(resolve);
        }
      });
    });
  }

  /**
   * Run the complete initialization pipeline
   * 1. Verify authentication (fetch /me if token exists)
   * 2. Load user settings (if authenticated)
   * 3. Apply theme
   */
  private runInitializationPipeline(): Observable<void> {
    const token = this.authService.getToken();

    // If no token, initialize default theme and allow navigation to login
    if (!token) {
      console.log('Startup: No token found, initializing defaults');
      this.userSettingsService.initializeDefaultTheme();
      return of(void 0);
    }

    // Have token - verify with server by fetching /me
    console.log('Startup: Token found, verifying with /me');
    return this.verifyAuthenticationAndLoadProfile().pipe(
      switchMap((authenticated) => {
        if (!authenticated) {
          // Auth failed, clear token and initialize defaults
          console.log('Startup: Authentication failed, clearing session');
          this.authService.logout();
          this.userSettingsService.initializeDefaultTheme();
          return of(void 0);
        }

        // Auth successful, load user settings
        console.log('Startup: Authentication successful, loading settings');
        return this.userSettingsService.loadUserSettings().pipe(
          map(() => void 0),
          catchError(err => {
            console.error('Startup: Failed to load user settings:', err);
            // Initialize default theme even if settings fail
            this.userSettingsService.initializeDefaultTheme();
            return of(void 0);
          })
        );
      }),
      catchError(err => {
        console.error('Startup: Pipeline error:', err);
        // Clean up and initialize defaults
        this.authService.logout();
        this.userSettingsService.initializeDefaultTheme();
        return of(void 0);
      })
    );
  }

  /**
   * Verify authentication by fetching user profile from /me endpoint
   * Returns true if authenticated, false otherwise
   */
  private verifyAuthenticationAndLoadProfile(): Observable<boolean> {
    // Use the private getUserProfile method via the auth service's public API
    // We'll call the API service directly to get /me
    return this.authService.verifyAuthenticationWithServer().pipe(
      map((authenticated) => {
        if (authenticated) {
          console.log('Startup: /me verification successful');
          return true;
        }
        console.log('Startup: /me verification failed');
        return false;
      }),
      catchError(err => {
        console.error('Startup: /me verification error:', err);
        return of(false);
      })
    );
  }

  /**
   * Complete initialization with minimum splash screen duration
   * Ensures smooth UX by not hiding splash too quickly
   */
  private completeInitialization(resolve: () => void): void {
    const elapsedTime = Date.now() - this.initStartTime;
    const remainingTime = Math.max(0, this.MIN_SPLASH_DURATION - elapsedTime);

    setTimeout(() => {
      this.authService.setInitialized();
      resolve();
    }, remainingTime);
  }
}

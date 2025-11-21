import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, forkJoin, timer, catchError, tap } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { UserSettingsService } from './user-settings.service';

/**
 * AppInitService
 * 
 * Manages the application initialization pipeline:
 * 1. Wait for authentication to complete
 * 2. Load user settings (if authenticated)
 * 3. Apply theme from settings
 * 4. Ensure minimum splash screen duration for smooth UX
 * 
 * This creates a professional startup flow similar to Microsoft Teams, Slack, or Discord.
 */
@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  private readonly MIN_SPLASH_DURATION = 800; // Minimum splash screen duration in ms
  private initStartTime: number = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {}

  /**
   * Initialize the application
   * This is called by APP_INITIALIZER to ensure proper startup sequence
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

      // Record start time for splash screen duration calculation
      this.initStartTime = Date.now();

      // Start initialization pipeline
      this.runInitializationPipeline().subscribe({
        next: () => {
          this.completeInitialization(resolve);
        },
        error: (err) => {
          console.error('App initialization error:', err);
          // Even on error, complete initialization to not block the app
          this.completeInitialization(resolve);
        }
      });
    });
  }

  /**
   * Run the initialization pipeline
   * Loads all required data and applies configurations
   */
  private runInitializationPipeline(): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    const token = this.authService.getToken();

    // If user is authenticated, load their settings
    if (currentUser && token) {
      return this.userSettingsService.loadUserSettings().pipe(
        map(() => void 0),
        catchError(err => {
          console.error('Failed to load user settings during init:', err);
          // Initialize default theme even if settings fail
          this.userSettingsService.initializeDefaultTheme();
          return of(void 0);
        })
      );
    } else {
      // For unauthenticated users, just initialize default theme
      this.userSettingsService.initializeDefaultTheme();
      return of(void 0);
    }
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

  /**
   * Reload user settings
   * Can be called manually to refresh settings from the server
   */
  reloadSettings(): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      return this.userSettingsService.loadUserSettings().pipe(
        map(() => void 0),
        catchError(err => {
          console.error('Failed to reload settings:', err);
          return of(void 0);
        })
      );
    }
    
    return of(void 0);
  }
}

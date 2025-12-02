import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of, catchError, tap, map, switchMap, forkJoin } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { UserSettingsService, LANGUAGE_SETTING_CATEGORY, LANGUAGE_SETTING_KEY } from './user-settings.service';
import { I18nService, DEFAULT_LANGUAGE } from '../i18n/i18n.service';

/**
 * StartupService - Centralized application startup initialization
 *
 * This service runs during APP_INITIALIZER and handles:
 * 1. Token verification and /me profile fetch
 * 2. User settings load
 * 3. Theme initialization
 * 4. Translation loading (i18n)
 * 5. Proper error handling with redirect to login
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
    private i18nService: I18nService,
    private router: Router
  ) {
    // Register I18nService with UserSettingsService to break circular dependency
    this.userSettingsService.setI18nService(this.i18nService);
  }

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
   * 1. Load default translations (in parallel with auth check)
   * 2. Verify authentication (fetch /me if token exists)
   * 3. Load user settings (if authenticated)
   * 4. Apply theme and language from settings
   */
  private runInitializationPipeline(): Observable<void> {
    const token = this.authService.getToken();

    // If no token, initialize defaults (theme + translations)
    if (!token) {
      console.log('Startup: No token found, initializing defaults');
      return this.initializeDefaults();
    }

    // Have token - verify with server by fetching /me
    console.log('Startup: Token found, verifying with /me');
    return this.verifyAuthenticationAndLoadProfile().pipe(
      switchMap((authenticated) => {
        if (!authenticated) {
          // Auth failed, clear token and initialize defaults
          console.log('Startup: Authentication failed, clearing session');
          this.authService.logout();
          return this.initializeDefaults();
        }

        // Auth successful, load user settings and translations
        console.log('Startup: Authentication successful, loading settings and translations');
        return this.loadSettingsAndTranslations();
      }),
      catchError(err => {
        console.error('Startup: Pipeline error:', err);
        // Clean up and initialize defaults
        this.authService.logout();
        return this.initializeDefaults();
      })
    );
  }

  /**
   * Initialize default settings when user is not authenticated
   * Loads default theme and default language translations
   */
  private initializeDefaults(): Observable<void> {
    this.userSettingsService.initializeDefaultTheme();

    // Load default language translations
    return new Observable(observer => {
      this.i18nService.initialize(DEFAULT_LANGUAGE).then(() => {
        console.log('Startup: Default translations loaded');
        observer.next();
        observer.complete();
      }).catch(err => {
        console.error('Startup: Failed to load default translations:', err);
        observer.next(); // Continue even if translations fail
        observer.complete();
      });
    });
  }

  /**
   * Load user settings and translations
   * Settings are loaded first to get user's language preference,
   * then translations are loaded for that language
   */
  private loadSettingsAndTranslations(): Observable<void> {
    return this.userSettingsService.loadUserSettings().pipe(
      switchMap(settings => {
        // Get user's language preference from settings
        const languageSettings = settings?.settings?.[LANGUAGE_SETTING_CATEGORY];
        const userLanguage = languageSettings?.[LANGUAGE_SETTING_KEY] || DEFAULT_LANGUAGE;

        console.log(`Startup: Loading translations for language: ${userLanguage}`);

        // Load translations for user's preferred language
        return new Observable<void>(observer => {
          this.i18nService.initialize(userLanguage).then(() => {
            console.log('Startup: Translations loaded successfully');
            observer.next();
            observer.complete();
          }).catch(err => {
            console.error('Startup: Failed to load translations:', err);
            observer.next(); // Continue even if translations fail
            observer.complete();
          });
        });
      }),
      catchError(err => {
        console.error('Startup: Failed to load user settings:', err);
        // Initialize defaults if settings fail
        this.userSettingsService.initializeDefaultTheme();
        return this.initializeDefaults();
      })
    );
  }

  /**
   * Verify authentication by fetching user profile from /me endpoint
   * Returns true if authenticated, false otherwise
   */
  private verifyAuthenticationAndLoadProfile(): Observable<boolean> {
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

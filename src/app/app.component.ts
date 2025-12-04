import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';
import { KeyboardShortcutService } from './shared/services/keyboard-shortcut.service';
import { AuthService } from './auth/services/auth.service';
import { UserSettingsService } from './core/services/user-settings.service';
import { I18nService } from './core/i18n';
import { RtlDirective } from './core/i18n';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, LoadingScreenComponent, CommonModule, RtlDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'taskflow-chat';
  
  // Observable to track if app is still initializing (auth + settings + i18n)
  isAppInitializing$: Observable<boolean>;
  
  // Observable for loading message to show different messages for different states
  loadingMessage$: Observable<string>;

  /**
   * Inject KeyboardShortcutService to ensure it's initialized at app startup
   * This activates the global keyboard event listener
   * 
   * Note: App initialization (auth + theme + settings) is now handled by StartupService
   * via APP_INITIALIZER, ensuring everything is ready before the app renders
   */
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService,
    private i18nService: I18nService
  ) {
    // Service is now initialized and listening for keyboard events
    
    // Combine auth, settings, and i18n loading states for loading screen
    this.isAppInitializing$ = combineLatest([
      this.authService.authInitializing$,
      this.userSettingsService.loading$,
      this.i18nService.loading$
    ]).pipe(
      map(([authLoading, settingsLoading, i18nLoading]) => 
        authLoading || settingsLoading || i18nLoading
      )
    );

    // Dynamic loading message based on what's loading
    this.loadingMessage$ = combineLatest([
      this.authService.authInitializing$,
      this.i18nService.loading$
    ]).pipe(
      map(([authLoading, i18nLoading]) => {
        if (i18nLoading) {
          return 'Setting up language for you...';
        }
        if (authLoading) {
          return 'Preparing your workspace...';
        }
        return 'Preparing your workspace...';
      })
    );

    // Hide the initial loader from index.html after Angular bootstrap
    // We do this immediately since APP_INITIALIZER has already completed
    if (typeof document !== 'undefined') {
      document.body.classList.add('app-loaded');
    }
  }
}

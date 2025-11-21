import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';
import { KeyboardShortcutService } from './shared/services/keyboard-shortcut.service';
import { AuthService } from './auth/services/auth.service';
import { UserSettingsService } from './core/services/user-settings.service';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, LoadingScreenComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'taskflow-chat';
  
  // Observable to track if app is still initializing (auth + settings)
  isAppInitializing$: Observable<boolean>;

  /**
   * Inject KeyboardShortcutService to ensure it's initialized at app startup
   * This activates the global keyboard event listener
   * 
   * Inject UserSettingsService to load and apply user preferences
   * This ensures theme and other settings are loaded before app renders
   */
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {
    // Service is now initialized and listening for keyboard events
    
    // Combine auth and settings loading states
    this.isAppInitializing$ = combineLatest([
      this.authService.authInitializing$,
      this.userSettingsService.loading$
    ]).pipe(
      map(([authLoading, settingsLoading]) => authLoading || settingsLoading)
    );
  }

  ngOnInit(): void {
    // Load user settings (which will initialize theme with user preferences)
    // Only load if user is authenticated
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userSettingsService.loadUserSettings().subscribe({
        error: (err) => {
          console.error('Failed to load user settings on app init:', err);
          // Even if settings fail to load, don't block the app
        }
      });
    }
  }
}

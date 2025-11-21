import { Component } from '@angular/core';
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
export class AppComponent {
  title = 'taskflow-chat';
  
  // Observable to track if app is still initializing (auth + settings)
  isAppInitializing$: Observable<boolean>;

  /**
   * Inject KeyboardShortcutService to ensure it's initialized at app startup
   * This activates the global keyboard event listener
   * 
   * Note: App initialization (auth + theme + settings) is now handled by AppInitService
   * via APP_INITIALIZER, ensuring everything is ready before the app renders
   */
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {
    // Service is now initialized and listening for keyboard events
    
    // Combine auth and settings loading states for loading screen
    this.isAppInitializing$ = combineLatest([
      this.authService.authInitializing$,
      this.userSettingsService.loading$
    ]).pipe(
      map(([authLoading, settingsLoading]) => authLoading || settingsLoading)
    );
  }
}

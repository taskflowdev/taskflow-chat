import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';
import { KeyboardShortcutService } from './shared/services/keyboard-shortcut.service';
import { AuthService } from './auth/services/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, LoadingScreenComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'taskflow-chat';
  
  // Observable to track if app is still initializing
  isAppInitializing$: Observable<boolean>;

  /**
   * Inject KeyboardShortcutService to ensure it's initialized at app startup
   * This activates the global keyboard event listener
   * 
   * Inject ThemeService to ensure theme is initialized at app startup
   * This applies the correct theme on page load based on user preference or system setting
   */
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    // Services are now initialized and listening for events
    this.isAppInitializing$ = this.authService.authInitializing$;
  }
}

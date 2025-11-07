import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';
import { KeyboardShortcutService } from './shared/services/keyboard-shortcut.service';
import { AuthService } from './auth/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, LoadingScreenComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'taskflow-chat';
  
  // Observable to track if app is still initializing
  isAppInitializing$: Observable<boolean>;

  /**
   * Inject KeyboardShortcutService to ensure it's initialized at app startup
   * This activates the global keyboard event listener
   * 
   * Inject ThemeService to initialize theme tokens on app startup
   * This ensures CSS custom properties are set before any component renders
   */
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    // Service is now initialized and listening for keyboard events
    this.isAppInitializing$ = this.authService.authInitializing$;
  }

  ngOnInit(): void {
    // Initialize theme with default values immediately
    // This sets up CSS custom properties at :root before any content loads
    // User settings will override these defaults when loaded
    this.themeService.initialize('system', 'medium');
  }
}

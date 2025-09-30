import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeService } from './shared/services/theme.service';
import { AuthService } from './auth/services/auth.service';
import { filter } from 'rxjs/operators';

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

  ngOnInit(): void {
    // Load themes (works for both authenticated and unauthenticated users)
    this.themeService.loadThemes().subscribe();

    // Load user preferences only when authenticated
    this.authService.currentUser$
      .pipe(filter(user => user !== null))
      .subscribe(() => {
        this.themeService.loadUserPreferences().subscribe();
      });
  }
}

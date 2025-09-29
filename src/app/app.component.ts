import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'taskflow-chat';
  
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    // Initialize theme service - this will load user preferences and apply theme
    this.themeService.loadThemes().subscribe();
    this.themeService.loadUserPreferences().subscribe();
  }
}

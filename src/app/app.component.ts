import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeManagementService } from './shared/services/theme-management.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'taskflow-chat';
  
  private readonly themeService = inject(ThemeManagementService);

  ngOnInit(): void {
    // Initialize theme service - this will load user preferences and apply theme
    // The service handles lazy initialization automatically with fallback support
    this.themeService.lazyInitialize().subscribe({
      next: (success) => {
        if (success) {
          console.log('Theme service initialized successfully');
        } else {
          console.log('Theme service initialized with fallback theme');
        }
      },
      error: (error) => {
        console.warn('Theme service initialization failed, using fallback', error);
      }
    });
  }
}

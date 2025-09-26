import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeService } from './settings/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'taskflow-chat';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Initialize theme service to apply themes automatically
    this.themeService.currentThemeMode$.subscribe();
  }
}

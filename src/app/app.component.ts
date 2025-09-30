import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeProviderComponent } from './shared/components/theme/theme-provider.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, ThemeProviderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'taskflow-chat';
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { KeyboardShortcutService } from './shared/services/keyboard-shortcut.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'taskflow-chat';

  /**
   * Inject KeyboardShortcutService to ensure it's initialized at app startup
   * This activates the global keyboard event listener
   */
  constructor(private keyboardShortcutService: KeyboardShortcutService) {
    // Service is now initialized and listening for keyboard events
  }
}

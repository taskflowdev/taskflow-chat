import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-mode-selector',
  templateUrl: './theme-mode-selector.component.html',
  styleUrls: ['./theme-mode-selector.component.scss']
})
export class ThemeModeSelector {
  @Input() syncWithSystem = false;
  @Input() currentMode: ThemeMode | null = null;
  @Output() syncToggle = new EventEmitter<boolean>();

  onSyncToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.syncToggle.emit(target.checked);
  }

  get currentModeDisplay(): string {
    if (!this.currentMode) return 'Unknown';
    
    switch (this.currentMode.mode) {
      case 'system':
        return `System (${this.currentMode.isDarkTheme ? 'Dark' : 'Light'})`;
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Unknown';
    }
  }

  get currentModeIcon(): string {
    if (!this.currentMode) return 'bi-question-circle';
    
    if (this.currentMode.mode === 'system') {
      return this.currentMode.isDarkTheme ? 'bi-moon' : 'bi-sun';
    }
    
    return this.currentMode.isDarkTheme ? 'bi-moon' : 'bi-sun';
  }
}
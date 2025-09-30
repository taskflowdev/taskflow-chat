import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme-mode-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-mode-selector.component.html',
  styleUrls: ['./theme-mode-selector.component.scss']
})
export class ThemeModeSelectorsComponent {
  @Input() currentMode: 'light' | 'dark' | 'system' = 'system';
  @Input() syncWithSystem: boolean = true;
  @Input() systemPrefersDark: boolean = false;

  @Output() modeChange = new EventEmitter<'light' | 'dark' | 'system'>();
  @Output() systemSyncToggle = new EventEmitter<boolean>();

  onModeSelect(mode: 'light' | 'dark' | 'system'): void {
    this.modeChange.emit(mode);
  }

  onSystemSyncChange(enabled: boolean): void {
    this.systemSyncToggle.emit(enabled);
  }

  get effectiveMode(): string {
    if (this.syncWithSystem) {
      return this.systemPrefersDark ? 'Dark' : 'Light';
    }
    return this.currentMode === 'system' ? (this.systemPrefersDark ? 'Dark' : 'Light') : this.currentMode;
  }
}

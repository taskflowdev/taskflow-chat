import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeMode } from '../../../shared/models/theme.models';

@Component({
  selector: 'app-theme-mode-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-mode-selector.component.html',
  styleUrls: ['./theme-mode-selector.component.scss']
})
export class ThemeModeSelectorsComponent {
  @Input() currentMode: ThemeMode = ThemeMode.SYSTEM;
  @Input() syncWithSystem: boolean = true;
  @Input() systemPrefersDark: boolean = false;

  @Output() modeChange = new EventEmitter<ThemeMode>();
  @Output() systemSyncToggle = new EventEmitter<boolean>();

  public readonly ThemeMode = ThemeMode;

  onModeSelect(mode: ThemeMode): void {
    this.modeChange.emit(mode);
  }

  onSystemSyncChange(enabled: boolean): void {
    this.systemSyncToggle.emit(enabled);
  }

  get effectiveMode(): string {
    if (this.syncWithSystem) {
      return this.systemPrefersDark ? 'dark' : 'light';
    }
    return this.currentMode;
  }
}
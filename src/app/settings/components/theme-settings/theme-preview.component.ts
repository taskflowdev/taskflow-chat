import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeVariant, ThemeMode } from '../../../shared/models/theme.models';

@Component({
  selector: 'app-theme-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-preview.component.html',
  styleUrls: ['./theme-preview.component.scss']
})
export class ThemePreviewComponent {
  @Input() currentTheme!: ThemeVariant;
  @Input() effectiveMode: ThemeMode = ThemeMode.LIGHT;

  public readonly ThemeMode = ThemeMode;

  get previewModeText(): string {
    return this.effectiveMode === ThemeMode.DARK ? 'Dark Mode' : 'Light Mode';
  }

  get previewModeIcon(): string {
    return this.effectiveMode === ThemeMode.DARK ? 'bi-moon-fill' : 'bi-sun-fill';
  }
}
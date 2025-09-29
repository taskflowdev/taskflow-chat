import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccentColors } from '../../../shared/models/theme.models';

@Component({
  selector: 'app-accent-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accent-selector.component.html',
  styleUrls: ['./accent-selector.component.scss']
})
export class AccentSelectorComponent {
  @Input() accentColors!: AccentColors;
  @Input() readonly: boolean = false;
  @Input() compact: boolean = false;

  @Output() colorChange = new EventEmitter<{ colorType: string; color: string }>();

  public readonly colorLabels = {
    primary: 'Primary',
    secondary: 'Secondary',
    success: 'Success',
    danger: 'Danger',
    warning: 'Warning',
    info: 'Info',
    light: 'Light',
    dark: 'Dark'
  };

  public readonly displayOrder = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];

  onColorClick(colorType: string): void {
    if (this.readonly) return;
    
    // In a real app, this might open a color picker
    // For now, we'll just emit the current color
    const color = this.accentColors[colorType as keyof AccentColors];
    this.colorChange.emit({ colorType, color });
  }

  onColorKeyDown(event: KeyboardEvent, colorType: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onColorClick(colorType);
    }
  }

  getColorValue(colorType: string): string {
    return this.accentColors[colorType as keyof AccentColors];
  }

  getColorLabel(colorType: string): string {
    return this.colorLabels[colorType as keyof typeof this.colorLabels] || colorType;
  }
}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccentColors, ThemeVariant } from '../../../shared/models/theme.models';

@Component({
  selector: 'app-accent-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accent-selector.component.html',
  styleUrls: ['./accent-selector.component.scss']
})
export class AccentSelectorComponent {
  @Input() accentColors!: AccentColors;
  @Input() availableVariants: ThemeVariant[] = [];
  @Input() selectedVariantId: string = '';
  @Input() readonly: boolean = false;
  @Input() compact: boolean = false;
  @Input() mode: 'light' | 'dark' = 'light';

  @Output() variantChange = new EventEmitter<string>();

  hoveredVariantId: string | null = null;

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

  onVariantSelect(variantId: string): void {
    if (this.readonly) return;
    this.variantChange.emit(variantId);
  }

  onVariantHover(variantId: string | null): void {
    if (this.readonly) return;
    this.hoveredVariantId = variantId;
  }

  onColorClick(colorType: string): void {
    // Legacy method for backward compatibility
    if (this.readonly) return;
  }

  onColorKeyDown(event: KeyboardEvent, variantId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onVariantSelect(variantId);
    }
  }

  getColorValue(colorType: string): string {
    return this.accentColors[colorType as keyof AccentColors];
  }

  getColorLabel(colorType: string): string {
    return this.colorLabels[colorType as keyof typeof this.colorLabels] || colorType;
  }

  getVariantPreviewColors(variant: ThemeVariant): { primary: string; secondary: string } {
    return {
      primary: variant.accentColors.primary,
      secondary: variant.accentColors.secondary
    };
  }
}
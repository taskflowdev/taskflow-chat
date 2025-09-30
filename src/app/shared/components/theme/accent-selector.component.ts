import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicThemeVariantDto } from '../../../api/models';

@Component({
  selector: 'app-accent-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accent-selector">
      <label class="accent-label" *ngIf="label">{{ label }}</label>
      <div class="accent-swatches">
        <button
          *ngFor="let variant of variants"
          class="accent-swatch"
          [class.selected]="selectedVariantId === variant.id"
          [style.background]="getVariantColor(variant)"
          [attr.aria-label]="variant.name"
          [title]="variant.name"
          (click)="selectVariant(variant)">
          <i class="bi bi-check" *ngIf="selectedVariantId === variant.id"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .accent-selector {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .accent-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--TextColor, #0f172a);
      margin: 0;
    }

    .accent-swatches {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .accent-swatch {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .accent-swatch:hover {
      transform: scale(1.1);
      border-color: var(--TextColor, #0f172a);
    }

    .accent-swatch.selected {
      border-color: var(--TextColor, #0f172a);
      box-shadow: 0 0 0 3px var(--BackgroundColor, #fff);
    }

    .accent-swatch i {
      color: white;
      font-size: 1.25rem;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  `]
})
export class AccentSelectorComponent {
  @Input() variants: DynamicThemeVariantDto[] = [];
  @Input() selectedVariantId: string | null = null;
  @Input() label: string = '';
  @Output() variantSelected = new EventEmitter<DynamicThemeVariantDto>();

  selectVariant(variant: DynamicThemeVariantDto): void {
    this.variantSelected.emit(variant);
  }

  getVariantColor(variant: DynamicThemeVariantDto): string {
    // Use the primary color token from the variant if available
    if (variant.tokens && variant.tokens['ButtonPrimary']) {
      return variant.tokens['ButtonPrimary'];
    }
    
    // Fallback colors based on variant name
    const colorMap: { [key: string]: string } = {
      'default': '#22c55e',
      'blue': '#3b82f6',
      'green': '#10b981',
      'purple': '#8b5cf6',
      'red': '#ef4444',
      'orange': '#f97316',
      'pink': '#ec4899',
      'teal': '#14b8a6',
      'indigo': '#6366f1',
      'amber': '#f59e0b'
    };

    const variantName = variant.name?.toLowerCase() || 'default';
    return colorMap[variantName] || '#22c55e';
  }
}

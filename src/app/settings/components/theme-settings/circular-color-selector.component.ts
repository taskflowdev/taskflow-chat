import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeVariant } from '../../../shared/models/theme.models';

@Component({
  selector: 'app-circular-color-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="circular-color-grid">
      <div
        *ngFor="let variant of variants"
        class="color-circle-wrapper"
        [class.selected]="variant.id === selectedVariantId"
        [class.is-default]="isDefaultVariant(variant)"
        (click)="onSelect(variant.id)"
        (mouseenter)="onHover(variant)"
        (mouseleave)="onHover(null)"
        role="button"
        tabindex="0"
        [attr.aria-label]="'Select ' + variant.name + ' color theme'">

        <div
          class="color-circle split"
          [title]="variant.name">
          <div class="color-half top-left"
               [style.background]="isDarkMode ? 'black' : 'white'">
          </div>
          <div class="color-half bottom-right"
               [style.background]="variant.accentColors.primary">
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './circular-color-selector.component.scss'
})
export class CircularColorSelectorComponent {
  @Input() variants: ThemeVariant[] = [];
  @Input() selectedVariantId: string = '';
  @Input() hoveredVariantId: string | null = null;
  @Input() isDarkMode: boolean = false;

  @Output() variantSelect = new EventEmitter<string>();
  @Output() variantHover = new EventEmitter<ThemeVariant | null>();

  onSelect(variantId: string) {
    this.variantSelect.emit(variantId);
  }

  onHover(variant: ThemeVariant | null) {
    this.variantHover.emit(variant);
  }

  isDefaultVariant(variant: ThemeVariant): boolean {
    return variant.description.includes('default');
  }
}

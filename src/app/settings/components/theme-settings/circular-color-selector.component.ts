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
        class="color-circle"
        [class.selected]="variant.id === selectedVariantId"
        [class.hovered]="variant.id === hoveredVariantId"
        [style.background]="'linear-gradient(135deg, ' + variant.accentColors.primary + ' 0%, ' + variant.accentColors.secondary + ' 100%)'"
        [title]="variant.name"
        (click)="onSelect(variant.id)"
        (mouseenter)="onHover(variant)"
        (mouseleave)="onHover(null)"
        role="button"
        tabindex="0"
        [attr.aria-label]="'Select ' + variant.name + ' color theme'">
        
        <div class="selection-indicator" *ngIf="variant.id === selectedVariantId">
          <i class="bi bi-check"></i>
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
  
  @Output() variantSelect = new EventEmitter<string>();
  @Output() variantHover = new EventEmitter<ThemeVariant | null>();

  onSelect(variantId: string) {
    this.variantSelect.emit(variantId);
  }

  onHover(variant: ThemeVariant | null) {
    this.variantHover.emit(variant);
  }
}
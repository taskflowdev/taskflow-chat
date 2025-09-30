import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
        [class.hovered]="variant.id === hoveredVariantId"
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
               [style.background]="isDarkMode ? '#212529' : '#ffffff'">
          </div>
          <div class="color-half bottom-right"
               [style.background]="variant.primaryColor">
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './circular-color-selector.component.scss'
})
export class CircularColorSelectorComponent {
  @Input() variants: Array<{id: string, name: string, primaryColor: string}> = [];
  @Input() selectedVariantId: string = '';
  @Input() hoveredVariantId: string | null = null;
  @Input() isDarkMode: boolean = false;

  @Output() variantSelect = new EventEmitter<string>();
  @Output() variantHover = new EventEmitter<{id: string, name: string, primaryColor: string} | null>();

  onSelect(variantId: string) {
    this.variantSelect.emit(variantId);
  }

  onHover(variant: {id: string, name: string, primaryColor: string} | null) {
    this.variantHover.emit(variant);
  }
}

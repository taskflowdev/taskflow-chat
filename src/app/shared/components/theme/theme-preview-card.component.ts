import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicThemeDto, DynamicThemeVariantDto } from '../../../api/models';
import { AccentSelectorComponent } from './accent-selector.component';

@Component({
  selector: 'app-theme-preview-card',
  standalone: true,
  imports: [CommonModule, AccentSelectorComponent],
  template: `
    <div class="theme-preview-card" [class.selected]="isSelected">
      <div class="preview-content" [style.background]="getBackgroundColor()" [style.color]="getTextColor()">
        <div class="preview-header">
          <h4>{{ theme.name }}</h4>
          <i class="bi bi-check-circle-fill check-icon" *ngIf="isSelected"></i>
        </div>
        <div class="preview-body">
          <div class="preview-element" [style.background]="getSecondaryBackgroundColor()">
            <div class="preview-text">Card</div>
          </div>
          <button class="preview-button" [style.background]="getButtonColor()" [style.color]="getButtonTextColor()">
            Button
          </button>
        </div>
      </div>
      
      <div class="theme-actions">
        <app-accent-selector
          [variants]="theme.variants || []"
          [selectedVariantId]="selectedVariantId"
          [label]="'Accent'"
          (variantSelected)="onVariantSelected($event)">
        </app-accent-selector>
        
        <button 
          class="apply-btn"
          [class.active]="isSelected"
          (click)="applyTheme()">
          {{ isSelected ? 'Applied' : 'Apply' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .theme-preview-card {
      border: 2px solid var(--SecondaryBackgroundColor, #e5e7eb);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      background: var(--BackgroundColor, #fff);
    }

    .theme-preview-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .theme-preview-card.selected {
      border-color: var(--ButtonPrimary, #22c55e);
      box-shadow: 0 0 0 3px var(--ButtonPrimary, rgba(34, 197, 94, 0.2));
    }

    .preview-content {
      padding: 1.5rem;
      min-height: 150px;
      position: relative;
      transition: all 0.3s ease;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .preview-header h4 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .check-icon {
      color: var(--ButtonPrimary, #22c55e);
      font-size: 1.5rem;
    }

    .preview-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .preview-element {
      padding: 0.75rem;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .preview-text {
      font-size: 0.875rem;
    }

    .preview-button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: not-allowed;
      transition: all 0.3s ease;
      align-self: flex-start;
    }

    .theme-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--SecondaryBackgroundColor, #e5e7eb);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .apply-btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      border: 2px solid var(--ButtonPrimary, #22c55e);
      background: transparent;
      color: var(--ButtonPrimary, #22c55e);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .apply-btn:hover {
      background: var(--ButtonPrimary, #22c55e);
      color: white;
    }

    .apply-btn.active {
      background: var(--ButtonPrimary, #22c55e);
      color: white;
      cursor: default;
    }
  `]
})
export class ThemePreviewCardComponent {
  @Input() theme!: DynamicThemeDto;
  @Input() selectedVariantId: string | null = null;
  @Input() isSelected: boolean = false;
  @Output() themeApplied = new EventEmitter<{ themeId: string, variantId: string }>();
  @Output() variantChanged = new EventEmitter<DynamicThemeVariantDto>();

  onVariantSelected(variant: DynamicThemeVariantDto): void {
    this.variantChanged.emit(variant);
  }

  applyTheme(): void {
    const variantId = this.selectedVariantId || this.getDefaultVariantId();
    this.themeApplied.emit({ 
      themeId: this.theme.id || '', 
      variantId: variantId 
    });
  }

  getDefaultVariantId(): string {
    const defaultVariant = this.theme.variants?.find(v => v.isDefault);
    return defaultVariant?.id || this.theme.variants?.[0]?.id || '';
  }

  getBackgroundColor(): string {
    const currentVariant = this.getCurrentVariant();
    return currentVariant?.tokens?.['BackgroundColor'] || 
           this.theme.tokens?.['BackgroundColor'] || 
           '#ffffff';
  }

  getTextColor(): string {
    const currentVariant = this.getCurrentVariant();
    return currentVariant?.tokens?.['TextColor'] || 
           this.theme.tokens?.['TextColor'] || 
           '#0f172a';
  }

  getSecondaryBackgroundColor(): string {
    const currentVariant = this.getCurrentVariant();
    return currentVariant?.tokens?.['SecondaryBackgroundColor'] || 
           this.theme.tokens?.['SecondaryBackgroundColor'] || 
           '#f8fafc';
  }

  getButtonColor(): string {
    const currentVariant = this.getCurrentVariant();
    return currentVariant?.tokens?.['ButtonPrimary'] || 
           this.theme.tokens?.['ButtonPrimary'] || 
           '#22c55e';
  }

  getButtonTextColor(): string {
    const currentVariant = this.getCurrentVariant();
    return currentVariant?.tokens?.['ButtonPrimaryText'] || 
           this.theme.tokens?.['ButtonPrimaryText'] || 
           '#ffffff';
  }

  private getCurrentVariant(): DynamicThemeVariantDto | undefined {
    if (!this.selectedVariantId) return undefined;
    return this.theme.variants?.find(v => v.id === this.selectedVariantId);
  }
}

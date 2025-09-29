import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeDto } from '../../../../api/models/theme-dto';
import { ThemePreview } from '../theme-preview/theme-preview.component';

/**
 * Individual theme card with preview and selection
 * Displays theme name, preview, and accent colors
 */
@Component({
  selector: 'app-theme-card',
  standalone: true,
  imports: [CommonModule, ThemePreview],
  template: `
    <div 
      class="theme-card" 
      [class.selected]="isSelected"
      [class.active]="isActive"
      (click)="onSelect()"
      [attr.aria-selected]="isSelected"
      [attr.aria-label]="'Select ' + theme.name + ' theme'"
      tabindex="0"
      (keydown.enter)="onSelect()"
      (keydown.space)="onSelect()">
      
      <!-- Selection Indicator -->
      <div class="selection-indicator" *ngIf="isSelected">
        <i class="bi bi-check-circle-fill"></i>
      </div>

      <!-- Theme Preview -->
      <div class="theme-preview-container">
        <app-theme-preview [theme]="theme"></app-theme-preview>
      </div>

      <!-- Theme Info -->
      <div class="theme-info">
        <h6 class="theme-name">{{ theme.name }}</h6>
        <div class="theme-colors">
          <div 
            class="color-swatch" 
            [style.background-color]="theme.highlightColor"
            [title]="'Accent: ' + theme.highlightColor"
            *ngIf="theme.highlightColor">
          </div>
          <div 
            class="color-swatch" 
            [style.background-color]="theme.successColor"
            [title]="'Success: ' + theme.successColor"
            *ngIf="theme.successColor">
          </div>
          <div 
            class="color-swatch" 
            [style.background-color]="theme.warningColor"
            [title]="'Warning: ' + theme.warningColor"
            *ngIf="theme.warningColor">
          </div>
          <div 
            class="color-swatch" 
            [style.background-color]="theme.errorColor"
            [title]="'Error: ' + theme.errorColor"
            *ngIf="theme.errorColor">
          </div>
        </div>
      </div>

      <!-- Built-in Badge -->
      <div class="builtin-badge" *ngIf="theme.isBuiltIn">
        <span class="badge bg-secondary">Built-in</span>
      </div>
    </div>
  `,
  styleUrls: ['./theme-card.component.scss']
})
export class ThemeCard {
  @Input() theme!: ThemeDto;
  @Input() isSelected: boolean = false;
  @Input() isActive: boolean = false;

  @Output() select = new EventEmitter<void>();

  onSelect(): void {
    this.select.emit();
  }
}
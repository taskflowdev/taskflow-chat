import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeVariant, ThemeMode } from '../../../shared/models/theme.models';

@Component({
  selector: 'app-theme-preview-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-preview-card" [attr.data-theme]="mode">
      <div class="card-header">
        <div class="mode-indicator">
          <i class="bi" [class]="mode === 'light' ? 'bi-sun-fill' : 'bi-moon-fill'"></i>
          <span>{{ mode === 'light' ? 'Light' : 'Dark' }} theme</span>
        </div>
      </div>
      
      <div class="card-preview">
        <!-- Minimal mockup -->
        <div class="mock-window" [style.background-color]="getBackgroundColor()">
          <div class="mock-header" [style.background-color]="currentVariant.accentColors.primary">
            <div class="mock-controls">
              <div class="control" style="background-color: #ff5f56;"></div>
              <div class="control" style="background-color: #ffbd2e;"></div>
              <div class="control" style="background-color: #27ca3f;"></div>
            </div>
            <div class="mock-title">TaskFlow</div>
          </div>
          
          <div class="mock-content">
            <div class="mock-sidebar" [style.background-color]="getSidebarColor()">
              <div class="mock-nav-item active" [style.background-color]="currentVariant.accentColors.primary"></div>
              <div class="mock-nav-item"></div>
              <div class="mock-nav-item"></div>
            </div>
            
            <div class="mock-main">
              <div class="mock-card" [style.background-color]="getCardColor()">
                <div class="mock-text-line" [style.background-color]="getTextColor()"></div>
                <div class="mock-text-line" [style.background-color]="getTextColor()" style="width: 60%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './theme-preview-card.component.scss'
})
export class ThemePreviewCardComponent {
  @Input() mode: 'light' | 'dark' = 'light';
  @Input() currentVariant!: ThemeVariant;
  @Input() isHovered = false;

  getBackgroundColor(): string {
    return this.mode === 'light' ? '#ffffff' : '#1a1d29';
  }

  getSidebarColor(): string {
    return this.mode === 'light' ? '#f8f9fa' : '#2a2d39';
  }

  getCardColor(): string {
    return this.mode === 'light' ? '#ffffff' : '#2a2d39';
  }

  getTextColor(): string {
    return this.mode === 'light' ? '#e9ecef' : '#495057';
  }
}
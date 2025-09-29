import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeDto } from '../../../../api/models/theme-dto';

/**
 * Mini UI preview component showing how the theme looks
 * Displays a small mock interface with theme colors applied
 */
@Component({
  selector: 'app-theme-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-preview" 
         [style.--preview-bg-primary]="theme.backgroundColor"
         [style.--preview-bg-secondary]="theme.secondaryBackgroundColor"
         [style.--preview-text-primary]="theme.textColor"
         [style.--preview-text-secondary]="theme.secondaryTextColor"
         [style.--preview-accent]="theme.highlightColor"
         [style.--preview-border]="theme.borderColor"
         [style.--preview-icon]="theme.iconColor"
         [style.--preview-success]="theme.successColor"
         [style.--preview-error]="theme.errorColor">
      
      <!-- Mock Header -->
      <div class="preview-header">
        <div class="preview-title">TaskFlow Chat</div>
        <div class="preview-nav">
          <div class="preview-nav-item active">
            <i class="bi bi-chat-quote"></i>
          </div>
          <div class="preview-nav-item">
            <i class="bi bi-gear"></i>
          </div>
        </div>
      </div>

      <!-- Mock Content -->
      <div class="preview-content">
        <div class="preview-card">
          <div class="preview-card-header">
            <div class="preview-avatar"></div>
            <div class="preview-text">
              <div class="preview-name">John Doe</div>
              <div class="preview-status online">Online</div>
            </div>
          </div>
          <div class="preview-message">
            Hey! How's the new theme looking?
          </div>
        </div>

        <!-- Mock Action Buttons -->
        <div class="preview-actions">
          <button class="preview-btn primary">
            <i class="bi bi-check"></i>
          </button>
          <button class="preview-btn secondary">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./theme-preview.component.scss']
})
export class ThemePreview {
  @Input() theme!: ThemeDto;
}
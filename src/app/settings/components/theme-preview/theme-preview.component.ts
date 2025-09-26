import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeDto } from '../../../api/models';

@Component({
  selector: 'app-theme-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-preview.component.html',
  styleUrls: ['./theme-preview.component.scss']
})
export class ThemePreviewComponent {
  @Input() theme: ThemeDto | null = null;

  get previewStyles(): { [key: string]: string } {
    if (!this.theme) return {};

    return {
      '--preview-bg-primary': this.theme.backgroundColor || '#ffffff',
      '--preview-bg-secondary': this.theme.secondaryBackgroundColor || '#f8fafc',
      '--preview-text-primary': this.theme.textColor || '#0f172a',
      '--preview-text-secondary': this.theme.secondaryTextColor || '#64748b',
      '--preview-highlight': this.theme.highlightColor || '#22c55e',
      '--preview-border': this.theme.borderColor || '#e2e8f0',
      '--preview-icon': this.theme.iconColor || '#64748b',
      '--preview-success': this.theme.successColor || '#10b981',
      '--preview-warning': this.theme.warningColor || '#f59e0b',
      '--preview-error': this.theme.errorColor || '#ef4444'
    };
  }
}
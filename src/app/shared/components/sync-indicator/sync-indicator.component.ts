import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonTooltipDirective, TooltipPosition } from '../common-tooltip';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Production-grade sync indicator component
 * Displays real-time sync status with smooth animations
 *
 * Usage:
 * ```html
 * <app-sync-indicator
 *   [status]="syncStatus"
 *   [errorMessage]="errorMessage">
 * </app-sync-indicator>
 * ```
 *
 * @status idle - No sync activity (hidden)
 * @status saving - Currently saving (spinning animation)
 * @status saved - Successfully saved (checkmark with fade out)
 * @status error - Save failed (error icon)
 */
@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule, CommonTooltipDirective],
  templateUrl: './sync-indicator.component.html',
  styleUrls: ['./sync-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyncIndicatorComponent {
  /**
   * Current sync status
   */
  @Input() status: SyncStatus = 'idle';

  /**
   * Error message to display on error status
   */
  @Input() errorMessage: string = 'Failed to save';

  /**
   * Expose TooltipPosition enum for template
   */
  readonly TooltipPosition = TooltipPosition;

  /**
   * Get tooltip text based on status
   */
  getTooltipText(): string {
    switch (this.status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return this.errorMessage;
      case 'idle':
      default:
        return '';
    }
  }

  /**
   * Get icon class based on status
   */
  getIconClass(): string {
    switch (this.status) {
      case 'saving':
        return 'icon-loader';
      case 'saved':
        return 'bi bi-check-lg';
      case 'error':
        return 'bi bi-exclamation-circle-fill';
      case 'idle':
      default:
        return '';
    }
  }

  /**
   * Get status class for styling
   */
  getStatusClass(): string {
    return `sync-indicator--${this.status}`;
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonButtonComponent } from '../common-form-controls/common-button.component';

/**
 * Enterprise-level reusable confirmation dialog component
 * 
 * Use cases:
 * - Delete confirmations
 * - Discard changes warnings
 * - Destructive action confirmations
 * - Any yes/no decision prompts
 * 
 * @example
 * ```typescript
 * <app-confirmation-dialog
 *   [isVisible]="showDeleteConfirm"
 *   [title]="'Delete Group?'"
 *   [message]="'This action cannot be undone. All messages and data will be permanently deleted.'"
 *   [confirmText]="'Delete'"
 *   [cancelText]="'Cancel'"
 *   [variant]="'danger'"
 *   [loading]="isDeleting"
 *   (confirmed)="onDeleteConfirmed()"
 *   (cancelled)="onDeleteCancelled()">
 * </app-confirmation-dialog>
 * ```
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, CommonButtonComponent],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  /**
   * Controls dialog visibility
   */
  @Input() isVisible: boolean = false;

  /**
   * Dialog title (e.g., "Delete Group?", "Discard Changes?")
   */
  @Input() title: string = 'Confirm Action';

  /**
   * Main message describing the action and consequences
   */
  @Input() message: string = 'Are you sure you want to proceed with this action?';

  /**
   * Optional secondary message for additional context
   */
  @Input() secondaryMessage?: string;

  /**
   * Text for the confirm button
   */
  @Input() confirmText: string = 'Confirm';

  /**
   * Text for the cancel button
   */
  @Input() cancelText: string = 'Cancel';

  /**
   * Visual variant for the confirm button
   * - 'danger': Red for destructive actions (delete, remove)
   * - 'warning': Yellow for caution actions (discard, reset)
   * - 'primary': Blue for regular confirmations
   */
  @Input() variant: 'danger' | 'warning' | 'primary' = 'danger';

  /**
   * Icon to display in the dialog header
   * Uses Bootstrap Icons class names (e.g., 'bi-trash', 'bi-exclamation-triangle')
   */
  @Input() icon?: string;

  /**
   * Loading state for async operations
   */
  @Input() loading: boolean = false;

  /**
   * Emitted when user confirms the action
   */
  @Output() confirmed = new EventEmitter<void>();

  /**
   * Emitted when user cancels or closes the dialog
   */
  @Output() cancelled = new EventEmitter<void>();

  /**
   * Handle confirm button click
   */
  onConfirm(): void {
    if (!this.loading) {
      this.confirmed.emit();
    }
  }

  /**
   * Handle cancel button click or backdrop click
   */
  onCancel(): void {
    if (!this.loading) {
      this.cancelled.emit();
    }
  }

  /**
   * Get the appropriate icon based on variant if no custom icon provided
   */
  getDefaultIcon(): string {
    if (this.icon) {
      return this.icon;
    }

    switch (this.variant) {
      case 'danger':
        return 'bi-exclamation-circle';
      case 'warning':
        return 'bi-exclamation-triangle';
      case 'primary':
        return 'bi-question-circle';
      default:
        return 'bi-info-circle';
    }
  }
}

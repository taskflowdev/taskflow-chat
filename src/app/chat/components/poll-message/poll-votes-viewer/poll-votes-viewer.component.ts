import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollResultsDto } from '../../../../api/models';

/**
 * Poll votes viewer off-canvas component
 *
 * @remarks
 * Displays detailed voter information per option in an off-canvas panel.
 * Shows voter avatars and names organized by option.
 * Used in poll messages to allow users to see who voted for each option.
 *
 * Usage:
 * ```html
 * <app-poll-votes-viewer
 *   [pollResults]="pollState.pollResults"
 *   [isOpen]="showVotesViewer"
 *   (close)="showVotesViewer = false">
 * </app-poll-votes-viewer>
 * ```
 */
@Component({
  selector: 'app-poll-votes-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-votes-viewer.component.html',
  styleUrl: './poll-votes-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollVotesViewerComponent {
  /**
   * Poll results data containing options and voter details
   */
  @Input() pollResults: PollResultsDto | null = null;

  /**
   * Whether the off-canvas is open
   */
  @Input() isOpen: boolean = false;

  /**
   * Event emitted when close button is clicked
   */
  @Output() close = new EventEmitter<void>();

  /**
   * Options sorted by votes (desc)
   */
  get sortedOptions(): NonNullable<PollResultsDto['options']> {
    const options = this.pollResults?.options;
    if (!options) return [];

    return [...options].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  }

  /**
   * Get initials from full name
   */
  getInitials(fullName?: string | null): string {
    if (!fullName) return '?';

    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return parts[0].substring(0, 2).toUpperCase();
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('offcanvas-backdrop')) {
      this.onClose();
    }
  }

  /**
   * Track by function for option list
   */
  trackByOptionId(index: number, option: any): string {
    return option.id ?? index;
  }

  /**
   * Track by function for voter list
   */
  trackByVoterId(index: number, voter: any): string {
    return voter.userId ?? index;
  }
}

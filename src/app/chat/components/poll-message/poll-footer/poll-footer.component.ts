import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Poll footer component displaying vote statistics
 *
 * @remarks
 * Pure presentation component (Dumb component):
 * - Zero business logic
 * - Only @Input for data and @Output for events
 * - OnPush change detection
 * - Displays total votes and voters
 * - Provides button to view detailed voter information
 * - Reusable for any poll context
 *
 * Usage:
 * ```html
 * <app-poll-footer
 *   [totalVotes]="42"
 *   [totalVoters]="35"
 *   [allowMultipleAnswers]="true"
 *   (viewVotes)="showVotesViewer = true">
 * </app-poll-footer>
 * ```
 */
@Component({
  selector: 'app-poll-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-footer.component.html',
  styleUrl: './poll-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollFooterComponent {
  /**
   * Total number of votes cast
   */
  @Input() totalVotes: number = 0;

  /**
   * Total number of unique voters
   */
  @Input() totalVoters: number = 0;

  /**
   * Total number of members in the group
   */
  @Input() groupMemberCount: number = 0;

  /**
   * Voting progress percentage (0-100)
   */
  @Input() votingProgressPercentage: number = 0;

  /**
   * Whether the poll allows multiple answers
   */
  @Input() allowMultipleAnswers: boolean = false;

  /**
   * Event emitted when view votes button is clicked
   */
  @Output() viewVotes = new EventEmitter<void>();

  /**
   * Handle view votes button click
   */
  onViewVotes(): void {
    this.viewVotes.emit();
  }
}

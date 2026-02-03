import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable progress bar component for polls
 *
 * @remarks
 * This is a pure presentation component (Dumb component):
 * - No business logic
 * - Only @Input for data
 * - OnPush change detection for performance
 * - Reusable across any context needing progress visualization
 * - Smooth animation via CSS transitions
 *
 * Usage:
 * ```html
 * <app-poll-progress-bar
 *   [percentage]="75"
 *   [showLabel]="true">
 * </app-poll-progress-bar>
 * ```
 */
@Component({
  selector: 'app-poll-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-progress-bar.component.html',
  styleUrl: './poll-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollProgressBarComponent {
  /**
   * Progress percentage (0-100)
   */
  @Input() percentage: number = 0;

  /**
   * Whether to show percentage label
   */
  @Input() showLabel: boolean = true;

  /**
   * ARIA label for accessibility
   */
  @Input() ariaLabel: string = 'Poll progress';
}

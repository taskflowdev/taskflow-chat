import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollProgressBarComponent } from '../poll-progress-bar/poll-progress-bar.component';

/**
 * Poll option data interface
 */
export interface PollOptionData {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  voters: string[];
}

/**
 * Poll option component - individual selectable option
 *
 * @remarks
 * Pure presentation component (Dumb component):
 * - ZERO business logic
 * - Only @Input/@Output
 * - OnPush change detection
 * - Emits events for parent to handle
 * - Supports both radio and checkbox modes
 * - Accessible keyboard navigation
 *
 * Usage:
 * ```html
 * <app-poll-option
 *   [option]="optionData"
 *   [isSelected]="false"
 *   [allowMultipleAnswers]="false"
 *   [disabled]="false"
 *   (optionSelected)="onOptionSelected($event)">
 * </app-poll-option>
 * ```
 */
@Component({
  selector: 'app-poll-option',
  imports: [CommonModule, PollProgressBarComponent],
  templateUrl: './poll-option.component.html',
  styleUrl: './poll-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollOptionComponent {
  /**
   * Poll option data
   */
  @Input() option!: PollOptionData;

  /**
   * Whether this option is currently selected
   */
  @Input() isSelected: boolean = false;

  /**
   * Whether multiple answers are allowed (checkbox vs radio)
   */
  @Input() allowMultipleAnswers: boolean = false;

  /**
   * Whether the option is disabled
   */
  @Input() disabled: boolean = false;

  /**
   * Event emitted when option is selected
   * Parent component handles the business logic
   */
  @Output() optionSelected = new EventEmitter<string>();

  /**
   * Handles option click
   */
  onOptionClick(): void {
    if (!this.disabled) {
      this.optionSelected.emit(this.option.id);
    }
  }

  /**
   * Handles keyboard interaction
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onOptionClick();
    }
  }
}

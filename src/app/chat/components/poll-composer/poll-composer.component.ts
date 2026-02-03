import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleControlComponent } from '../../../settings/components/controls/toggle-control/toggle-control.component';

export interface PollData {
  question: string;
  options: string[];
  allowMultipleAnswers: boolean;
}

@Component({
  selector: 'app-poll-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleControlComponent],
  templateUrl: './poll-composer.component.html',
  styleUrl: './poll-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollComposerComponent {
  @Output() pollCreated = new EventEmitter<PollData>();
  @Output() cancelled = new EventEmitter<void>();

  question = '';
  options: string[] = ['', ''];
  allowMultipleAnswers = false;

  /**
   * Adds a new option to the poll
   */
  addOption(): void {
    if (this.options.length < 10) { // Limit to 10 options
      this.options.push('');
    }
  }

  /**
   * Removes an option from the poll
   */
  removeOption(index: number): void {
    if (this.options.length > 2) { // Minimum 2 options
      this.options.splice(index, 1);
    }
  }

  /**
   * Checks if the poll can be sent
   */
  canSend(): boolean {
    // Question must be filled
    if (!this.question.trim()) return false;

    // At least 2 options must be filled
    const filledOptions = this.options.filter(opt => opt.trim()).length;
    return filledOptions >= 2;
  }

  /**
   * Sends the poll
   */
  sendPoll(): void {
    if (!this.canSend()) return;

    const pollData: PollData = {
      question: this.question.trim(),
      options: this.options.filter(opt => opt.trim()).map(opt => opt.trim()),
      allowMultipleAnswers: this.allowMultipleAnswers
    };

    this.pollCreated.emit(pollData);
    this.reset();
  }

  /**
   * Cancels poll creation
   */
  cancel(): void {
    this.reset();
    this.cancelled.emit();
  }

  /**
   * Resets the form
   */
  private reset(): void {
    this.question = '';
    this.options = ['', ''];
    this.allowMultipleAnswers = false;
  }

  /**
   * Track by function for ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}

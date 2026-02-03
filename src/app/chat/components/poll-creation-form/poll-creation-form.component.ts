import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Poll data structure for creation
 */
export interface PollCreationData {
  question: string;
  options: string[];
  allowMultipleAnswers: boolean;
}

/**
 * Inline poll creation form component
 * Appears above the message input without overlay
 */
@Component({
  selector: 'app-poll-creation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-creation-form.component.html',
  styleUrl: './poll-creation-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollCreationFormComponent {
  @Output() pollCreated = new EventEmitter<PollCreationData>();
  @Output() cancelled = new EventEmitter<void>();

  question = '';
  options: string[] = ['', ''];
  allowMultipleAnswers = false;

  /**
   * Add a new option to the poll
   */
  addOption(): void {
    if (this.options.length < 10) {
      this.options.push('');
    }
  }

  /**
   * Remove an option from the poll
   */
  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.splice(index, 1);
    }
  }

  /**
   * Check if the form is valid
   */
  isValid(): boolean {
    if (!this.question.trim()) {
      return false;
    }

    const filledOptions = this.options.filter(opt => opt.trim().length > 0);
    return filledOptions.length >= 2;
  }

  /**
   * Create the poll
   */
  createPoll(): void {
    if (!this.isValid()) {
      return;
    }

    const pollData: PollCreationData = {
      question: this.question.trim(),
      options: this.options.filter(opt => opt.trim().length > 0).map(opt => opt.trim()),
      allowMultipleAnswers: this.allowMultipleAnswers
    };

    this.pollCreated.emit(pollData);
    this.reset();
  }

  /**
   * Cancel poll creation
   */
  cancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  /**
   * Reset the form
   */
  private reset(): void {
    this.question = '';
    this.options = ['', ''];
    this.allowMultipleAnswers = false;
  }

  /**
   * Track by function for options list
   */
  trackByIndex(index: number): number {
    return index;
  }
}

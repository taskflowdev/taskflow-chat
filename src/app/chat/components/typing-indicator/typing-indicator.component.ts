import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Typing Indicator Component
 * 
 * Displays a typing indicator with animated dots and user text.
 * Shows when other users are typing in the chat.
 * 
 * Features:
 * - Animated typing dots
 * - Smart text formatting for 1, 2, or 3+ users
 * - Minimal design matching chat UI
 * - OnPush change detection for performance
 * 
 * @example
 * ```typescript
 * <app-typing-indicator [typingUsers]="['John', 'Jane']"></app-typing-indicator>
 * ```
 */
@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typing-indicator.component.html',
  styleUrls: ['./typing-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypingIndicatorComponent {
  /**
   * Array of user names who are currently typing
   */
  @Input() typingUsers: string[] = [];

  /**
   * Get formatted typing text based on number of users
   * @returns Formatted string or empty if no users typing
   */
  get typingText(): string {
    if (!this.typingUsers || this.typingUsers.length === 0) {
      return '';
    }

    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0]} is typing...`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    } else {
      return `${this.typingUsers[0]} and ${this.typingUsers.length - 1} others are typing...`;
    }
  }

  /**
   * Check if indicator should be visible
   */
  get isVisible(): boolean {
    return this.typingUsers && this.typingUsers.length > 0;
  }
}

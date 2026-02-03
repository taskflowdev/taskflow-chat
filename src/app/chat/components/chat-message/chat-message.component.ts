import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";
import { DateTimeFormatService } from '../../../core/services/datetime-format.service';

export interface ChatMessageData {
  messageId: string;
  senderId?: string;
  senderName?: string;
  content: string;
  contentType?: 'text' | 'image' | 'video' | 'poll' | 'file';
  contentData?: any; // Raw content object for rendering different types
  createdAt: string;
  isOwn: boolean;
  isSystemMessage?: boolean; // Flag to identify system messages
  messageType?: string; // Type of system message (e.g., 'groupCreated', 'userJoined')
  isConsecutive?: boolean; // True when this message follows the same sender consecutively
}

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule, CommonTooltipDirective],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  @Input() message!: ChatMessageData;

  constructor(private dateTimeFormatService: DateTimeFormatService) { }

  /**
   * Get the initials from a user's name for avatar display
   */
  getInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getTimeDisplay(timeString: string): string {
    return this.dateTimeFormatService.formatTime(timeString);
  }

  getDateDisplay(timeString: string): string {
    return this.dateTimeFormatService.formatDate(timeString);
  }

  /**
   * Formats duration in seconds to MM:SS format
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Formats file size in bytes to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Formats a given date-time string into a professional tooltip with user's time format
   *
   * @param {string} [timeString] - The ISO 8601 date-time string (e.g., "2025-10-29T14:30:00").
   *                                If no string is provided, returns an empty string.
   *
   * @returns {string} A formatted string for display in a tooltip.
   *                   Example: "Wednesday 29 October 2025 at 6:46 PM" (12h format)
   *                            "Wednesday 29 October 2025 at 18:46" (24h format)
   */
  getDateTimeTooltip(timeString?: string): string {
    if (!timeString) return '';
    return this.dateTimeFormatService.formatDateTimeTooltip(timeString);
  }
}

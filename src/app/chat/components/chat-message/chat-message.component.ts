import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";

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
}

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule, CommonTooltipDirective],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  @Input() message!: ChatMessageData;

  getTimeDisplay(timeString: string): string {
    const messageTime = new Date(timeString);
    return messageTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
      .replace('am', 'AM')
      .replace('pm', 'PM');
  }

  getDateDisplay(timeString: string): string {
    const messageTime = new Date(timeString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return messageTime.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
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
   * Formats a given date-time string into a professional tooltip with:
   * - Day of the week (e.g., "Monday")
   * - Day of the month (e.g., 29)
   * - Full month name (e.g., "October")
   * - Full year (e.g., 2025)
   * - Time in 12-hour format with AM/PM in a concise style (e.g., "6:46 PM")
   *
   * @param {string} [timeString] - The ISO 8601 date-time string (e.g., "2025-10-29T14:30:00").
   *                                If no string is provided, returns an empty string.
   *
   * @returns {string} A formatted string for display in a tooltip.
   *                   Example: "Wednesday 29 October 2025 at 6:46 PM"
   */
  getDateTimeTooltip(timeString?: string): string {
    if (!timeString) return '';

    const messageTime = new Date(timeString);

    // Format date components
    const weekday = messageTime.toLocaleString([], { weekday: 'long' });
    const day = messageTime.getDate();
    const month = messageTime.toLocaleString([], { month: 'long' });
    const year = messageTime.getFullYear();

    // Format time in 12-hour format with concise AM/PM (e.g., "6:46 PM")
    const time = messageTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    // Return formatted string
    return `${weekday} ${day} ${month} ${year} at ${time}`;
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDto } from '../../../api/models/group-dto';
import { MessageDisplayServiceProxy } from '../../services';
import { MessageDto } from '../../../api/models/message-dto';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";

export interface ChatItemData {
  groupId: string;
  name: string;
  lastMessage?: MessageDto; // Changed from string to MessageDto
  lastMessageTime?: string;
  unreadCount?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-chat-item',
  imports: [CommonModule, CommonTooltipDirective],
  templateUrl: './chat-item.component.html',
  styleUrl: './chat-item.component.scss'
})
export class ChatItemComponent {
  @Input() chat!: ChatItemData;
  @Input() isActive = false;
  @Output() chatSelect = new EventEmitter<string>();

  constructor(private messageDisplayService: MessageDisplayServiceProxy) {}

  onChatClick(): void {
    this.chatSelect.emit(this.chat.groupId);
  }

  /**
   * Gets the message preview text with appropriate icon and formatting.
   * Supports WhatsApp-style display for different message types.
   */
  getLastMessagePreview(): string {
    if (!this.chat.lastMessage) {
      return 'No messages yet';
    }

    return this.messageDisplayService.getCompleteMessagePreview(this.chat.lastMessage, true);
  }

  /**
   * Gets the Bootstrap icon class for the last message type.
   */
  getLastMessageIcon(): string | undefined {
    if (!this.chat.lastMessage) {
      return undefined;
    }

    return this.messageDisplayService.getMessageIcon(this.chat.lastMessage);
  }

  /**
   * Determines if an icon should be displayed for the last message.
   */
  hasLastMessageIcon(): boolean {
    return this.getLastMessageIcon() !== undefined;
  }

  /**
   * Gets the display text for the message timestamp.
   */
  getTimeDisplay(timeString?: string): string {
    if (!timeString) return '';

    const messageTime = new Date(timeString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace('am', 'AM').replace('pm', 'PM');
    } else {
      return messageTime.toLocaleDateString([], { month: 'long', day: 'numeric' });
    }
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

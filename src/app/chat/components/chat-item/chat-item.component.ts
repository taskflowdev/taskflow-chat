import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDto } from '../../../api/models/group-dto';
import { MessageDisplayServiceProxy } from '../../services';
import { MessageDto } from '../../../api/models/message-dto';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";
import { DateTimeFormatService } from '../../../core/services/datetime-format.service';

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

  constructor(
    private messageDisplayService: MessageDisplayServiceProxy,
    private dateTimeFormatService: DateTimeFormatService
  ) {}

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
    return this.dateTimeFormatService.formatChatTime(timeString);
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

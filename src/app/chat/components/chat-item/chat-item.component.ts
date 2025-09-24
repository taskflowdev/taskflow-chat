import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDto } from '../../../api/models/group-dto';
import { MessageDisplayServiceProxy } from '../../services/message-display-service-proxy';
import { MessageDto } from '../../../api/models/message-dto';

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
  imports: [CommonModule],
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

  getTimeDisplay(timeString?: string): string {
    if (!timeString) return '';
    
    const messageTime = new Date(timeString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDto, MessageDto } from '../../../api/models';
import { MessageContentServiceProxy } from '../../../services/message-content.service.proxy';

export interface ChatItemData {
  groupId: string;
  name: string;
  lastMessage?: MessageDto; // Changed to MessageDto for rich content support
  lastMessageTime?: string;
  unreadCount?: number;
  isActive?: boolean;
}

/**
 * Chat list item component that displays group information with WhatsApp-style
 * message previews. Supports all message content types with appropriate icons
 * and formatted text previews.
 */
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

  constructor(private messageContentService: MessageContentServiceProxy) {}

  onChatClick(): void {
    this.chatSelect.emit(this.chat.groupId);
  }

  /**
   * Get formatted message preview for display in chat list
   * Uses WhatsApp-style formatting with icons for media content
   */
  getMessagePreview(): string {
    if (!this.chat.lastMessage) {
      return 'No messages yet';
    }
    return this.messageContentService.getMessagePreview(this.chat.lastMessage);
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

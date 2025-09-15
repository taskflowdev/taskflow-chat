import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChatItemData {
  groupId: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageType?: 'text' | 'image' | 'video' | 'poll';
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

  onChatClick(): void {
    this.chatSelect.emit(this.chat.groupId);
  }

  /**
   * Gets Bootstrap icon class based on last message type
   */
  getMessageIcon(): string {
    switch (this.chat.lastMessageType) {
      case 'image':
        return 'bi-image';
      case 'video':
        return 'bi-play-circle';
      case 'poll':
        return 'bi-bar-chart';
      default:
        return '';
    }
  }

  /**
   * Checks if message has an icon to display
   */
  hasMessageIcon(): boolean {
    return this.chat.lastMessageType !== 'text' && !!this.chat.lastMessageType;
  }

  /**
   * Gets formatted last message display text
   */
  getLastMessageDisplay(): string {
    if (!this.chat.lastMessage) {
      return 'No messages yet';
    }

    // For non-text messages, the lastMessage already contains the formatted preview
    // e.g., "📷 Photo", "🎥 Video", "📊 Poll Question"
    return this.chat.lastMessage;
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

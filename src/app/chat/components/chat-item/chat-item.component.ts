import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDto } from '../../../api/model/groupDto';

export interface ChatItemData {
  groupId: string;
  name: string;
  lastMessage?: string;
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

  onChatClick(): void {
    this.chatSelect.emit(this.chat.groupId);
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

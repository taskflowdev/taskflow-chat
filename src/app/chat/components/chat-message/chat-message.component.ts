import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageDto } from '../../../api/model/messageDto';

export interface ChatMessageData {
  messageId: string;
  senderId?: string;
  senderName?: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  @Input() message!: ChatMessageData;

  getTimeDisplay(timeString: string): string {
    const messageTime = new Date(timeString);
    return messageTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
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
}

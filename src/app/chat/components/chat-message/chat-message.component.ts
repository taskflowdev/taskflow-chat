import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnhancedMessageDto } from '../../../api/message-proxy.service';

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  @Input() message!: EnhancedMessageDto;

  get displayTime(): string {
    return this.message.formattedTime || this.getTimeDisplay(this.message.createdAt || '');
  }

  get displayName(): string {
    return this.message.senderDisplayName || this.message.senderName || 'Unknown User';
  }

  get messageContent(): string {
    if (typeof this.message.content === 'string') {
      return this.message.content;
    }
    if (this.message.content && typeof this.message.content === 'object') {
      // Handle object content - look for common text properties
      const contentObj = this.message.content as any;
      if (contentObj.text) return contentObj.text;
      if (contentObj.message) return contentObj.message;
      if (contentObj.content) return contentObj.content;
      // Fallback to JSON string representation
      return JSON.stringify(this.message.content);
    }
    return '';
  }

  private getTimeDisplay(timeString: string): string {
    if (!timeString) return '';
    
    const messageTime = new Date(timeString);
    return messageTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  getDateDisplay(timeString: string): string {
    if (!timeString) return '';
    
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

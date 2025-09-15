import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageContentUtilityService, SimpleMessageDto } from '../../../shared/services/message-content-utility.service';

export interface ChatMessageData {
  messageId: string;
  senderId?: string;
  senderName?: string;
  content: string;
  contentType?: 'text' | 'image' | 'video' | 'poll';
  messageContent?: any;
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

  constructor(private messageContentUtility: MessageContentUtilityService) { }

  /**
   * Gets display text based on content type
   */
  getContentText(): string {
    if (!this.message.messageContent) {
      return this.message.content;
    }

    // Create a mock SimpleMessageDto to use the utility service
    const mockMessage: SimpleMessageDto = {
      content: this.message.messageContent,
      contentType: this.message.contentType
    };

    return this.messageContentUtility.getContentDisplayText(mockMessage);
  }

  /**
   * Gets Bootstrap icon class for message content type
   */
  getContentIcon(): string {
    return this.messageContentUtility.getContentTypeIcon(this.message.contentType);
  }

  /**
   * Checks if message has media content (image or video)
   */
  hasMediaContent(): boolean {
    return this.messageContentUtility.hasMediaContent(this.message.contentType);
  }

  /**
   * Gets media URL for image or video content
   */
  getMediaUrl(): string | null {
    if (!this.message.messageContent) {
      return null;
    }

    // Create a mock SimpleMessageDto to use the utility service
    const mockMessage: SimpleMessageDto = {
      content: this.message.messageContent,
      contentType: this.message.contentType
    };

    return this.messageContentUtility.getMediaUrl(mockMessage);
  }

  /**
   * Gets poll options for poll content
   */
  getPollOptions(): string[] {
    if (!this.message.messageContent) {
      return [];
    }

    // Create a mock SimpleMessageDto to use the utility service
    const mockMessage: SimpleMessageDto = {
      content: this.message.messageContent,
      contentType: this.message.contentType
    };

    return this.messageContentUtility.getPollOptions(mockMessage);
  }

  /**
   * Checks if poll allows multiple selections
   */
  isPollMultiSelect(): boolean {
    if (!this.message.messageContent) {
      return false;
    }

    // Create a mock SimpleMessageDto to use the utility service
    const mockMessage: SimpleMessageDto = {
      content: this.message.messageContent,
      contentType: this.message.contentType
    };

    return this.messageContentUtility.isPollMultiSelect(mockMessage);
  }

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

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleMessageDto } from '../../../shared/models/simple-chat.models';
import { MessageContentServiceProxy } from '../../../services/message-content.service.proxy';

export interface ChatMessageData {
  messageId: string;
  senderId?: string;
  senderName?: string;
  content: string; // Keep as string for backward compatibility
  contentType?: string; // Add content type
  messageDto?: SimpleMessageDto; // Optional full message DTO for rich content
  createdAt: string;
  isOwn: boolean;
}

/**
 * Chat message component that displays individual messages with support for
 * all content types including text, images, files, audio, video, and polls.
 * Renders appropriate UI for each content type following MNC standards.
 */
@Component({
  selector: 'app-chat-message',
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  @Input() message!: ChatMessageData;

  constructor(private messageContentService: MessageContentServiceProxy) {}

  /**
   * Get the display content for the message based on content type
   */
  getMessageContent(): string {
    if (this.message.messageDto) {
      return this.messageContentService.getContentDescription(this.message.messageDto);
    }
    return this.message.content || 'No content';
  }

  /**
   * Check if message requires special rendering (non-text content)
   */
  requiresSpecialRendering(): boolean {
    if (this.message.messageDto?.contentType) {
      return this.messageContentService.requiresSpecialRendering(this.message.messageDto.contentType);
    }
    return this.message.contentType ? this.messageContentService.requiresSpecialRendering(this.message.contentType) : false;
  }

  /**
   * Get the Bootstrap icon class for the content type
   */
  getContentTypeIcon(): string {
    const contentType = this.message.messageDto?.contentType || this.message.contentType || 'text';
    return this.messageContentService.getContentTypeIcon(contentType);
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

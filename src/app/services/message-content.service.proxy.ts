import { Injectable } from '@angular/core';
// Using any types temporarily to work around circular reference issues in generated API
import { 
  MessageDto 
} from '../api/models';

// Temporary interfaces to work around API type issues
interface SimpleMessageContent {
  $type: string;
  text?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

/**
 * Utility service for handling message content types and display formatting.
 * Provides methods for creating message previews in WhatsApp style and 
 * handling different content types according to MNC coding standards.
 */
@Injectable({
  providedIn: 'root'
})
export class MessageContentServiceProxy {

  constructor() { }

  /**
   * Get a WhatsApp-style preview text for a message based on its content type
   * 
   * @param message - The message DTO to generate preview for
   * @returns string - Formatted preview text with icons for non-text content
   */
  getMessagePreview(message: MessageDto): string {
    if (!message.content || !message.contentType) {
      return 'No content';
    }

    switch (message.contentType) {
      case 'text':
        const textContent = message.content as SimpleMessageContent;
        return textContent.text || 'Text message';

      case 'image':
        return '📷 Photo';

      case 'file':
        const fileContent = message.content as SimpleMessageContent;
        const fileName = fileContent.fileName || 'file';
        return `📄 ${fileName}`;

      case 'audio':
        return '🎵 Audio';

      case 'video':
        return '🎬 Video';

      case 'poll':
        return '📊 Poll';

      default:
        return 'Message';
    }
  }

  /**
   * Get a detailed content description for displaying in the message list
   * 
   * @param message - The message DTO to get content description for
   * @returns string - Detailed content description
   */
  getContentDescription(message: MessageDto): string {
    if (!message.content || !message.contentType) {
      return 'No content available';
    }

    switch (message.contentType) {
      case 'text':
        const textContent = message.content as SimpleMessageContent;
        return textContent.text || '';

      case 'image':
        const imageContent = message.content as SimpleMessageContent;
        const imageName = imageContent.fileName || 'image';
        const dimensions = imageContent.width && imageContent.height 
          ? ` (${imageContent.width}×${imageContent.height})`
          : '';
        return `Image: ${imageName}${dimensions}`;

      case 'file':
        const fileContent = message.content as SimpleMessageContent;
        const fileName = fileContent.fileName || 'Unknown file';
        const fileSize = fileContent.fileSize 
          ? ` (${this.formatFileSize(fileContent.fileSize)})`
          : '';
        return `File: ${fileName}${fileSize}`;

      case 'audio':
        const audioContent = message.content as SimpleMessageContent;
        const audioName = audioContent.fileName || 'audio';
        const audioDuration = audioContent.durationSeconds 
          ? ` (${this.formatDuration(audioContent.durationSeconds)})`
          : '';
        return `Audio: ${audioName}${audioDuration}`;

      case 'video':
        const videoContent = message.content as SimpleMessageContent;
        const videoName = videoContent.fileName || 'video';
        const videoDuration = videoContent.durationSeconds 
          ? ` (${this.formatDuration(videoContent.durationSeconds)})`
          : '';
        const videoDimensions = videoContent.width && videoContent.height 
          ? ` [${videoContent.width}×${videoContent.height}]`
          : '';
        return `Video: ${videoName}${videoDuration}${videoDimensions}`;

      case 'poll':
        return 'Poll message';

      default:
        return 'Unknown message type';
    }
  }

  /**
   * Check if a message content type requires special rendering
   * 
   * @param contentType - The content type to check
   * @returns boolean - True if special rendering is required
   */
  requiresSpecialRendering(contentType: string): boolean {
    return ['image', 'video', 'audio', 'file', 'poll'].includes(contentType);
  }

  /**
   * Get the appropriate Bootstrap icon class for a content type
   * 
   * @param contentType - The content type to get icon for
   * @returns string - Bootstrap icon class name
   */
  getContentTypeIcon(contentType: string): string {
    switch (contentType) {
      case 'image':
        return 'bi-image';
      case 'file':
        return 'bi-file-earmark';
      case 'audio':
        return 'bi-music-note';
      case 'video':
        return 'bi-play-btn';
      case 'poll':
        return 'bi-bar-chart';
      case 'text':
      default:
        return 'bi-chat-text';
    }
  }

  /**
   * Create a text content object for sending messages
   * 
   * @param text - The text content to wrap
   * @returns SimpleMessageContent - Formatted text content object
   */
  createTextContent(text: string): SimpleMessageContent {
    return {
      $type: 'text',
      text: text
    };
  }

  /**
   * Format file size in human readable format
   * 
   * @param bytes - File size in bytes
   * @returns string - Formatted file size (e.g., "1.5 MB")
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration in human readable format
   * 
   * @param seconds - Duration in seconds
   * @returns string - Formatted duration (e.g., "2:35")
   */
  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
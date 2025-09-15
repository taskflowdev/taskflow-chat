/**
 * Utility service for handling message content types and formatting
 * This service provides helper methods to work with different message content types
 * and format them for display in the UI
 */
import { Injectable } from '@angular/core';

/**
 * Simplified message DTO interface to avoid circular reference issues
 */
export interface SimpleMessageDto {
  content?: any;
  contentType?: 'text' | 'image' | 'video' | 'poll';
  messageId?: string;
  senderId?: string;
  senderName?: string;
  createdAt?: string;
}

/**
 * Simplified content type interface to avoid circular reference issues
 */
export interface SimpleTextContent {
  $type: 'text';
  text?: string;
}

export interface SimpleImageContent {
  $type: 'image';
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface SimpleVideoContent {
  $type: 'video';
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface SimplePollContent {
  $type: 'poll';
  question?: string;
  options?: string[];
  allowMultipleSelections?: boolean;
}

export type SimpleMessageContent = SimpleTextContent | SimpleImageContent | SimpleVideoContent | SimplePollContent;

@Injectable({
  providedIn: 'root'
})
export class MessageContentUtilityService {

  /**
   * Gets a preview text for display in chat list based on message content
   * @param message SimpleMessageDto to generate preview for
   * @returns Formatted preview string
   */
  getMessagePreview(message: SimpleMessageDto): string {
    if (!message.content) {
      return 'No content';
    }

    try {
      const content = message.content as any;
      
      switch (message.contentType) {
        case 'text':
          return content.text || 'Text message';
        
        case 'image':
          return `📷 ${content.fileName || 'Photo'}`;
        
        case 'video':
          return `🎥 ${content.fileName || 'Video'}`;
        
        case 'poll':
          return `📊 ${content.question || 'Poll'}`;
        
        default:
          // Fallback: try to extract text from content
          if (typeof content === 'string') {
            return content;
          } else if (content && typeof content === 'object') {
            // Try common text properties
            return content.text || content.question || content.fileName || 'Message';
          }
          return 'Message';
      }
    } catch (error) {
      console.warn('Error parsing message content:', error);
      return 'Message';
    }
  }

  /**
   * Gets display text for a message content
   * @param message SimpleMessageDto to get display text for
   * @returns Display text
   */
  getContentDisplayText(message: SimpleMessageDto): string {
    if (!message.content) {
      return '';
    }

    try {
      const content = message.content as any;
      
      switch (message.contentType) {
        case 'text':
          return content.text || '';
        
        case 'image':
          return content.fileName || 'Image';
        
        case 'video':
          return content.fileName || 'Video';
        
        case 'poll':
          return content.question || 'Poll';
        
        default:
          if (typeof content === 'string') {
            return content;
          } else if (content && typeof content === 'object') {
            return content.text || content.question || content.fileName || '';
          }
          return '';
      }
    } catch (error) {
      console.warn('Error parsing message content:', error);
      return '';
    }
  }

  /**
   * Gets media URL from image or video content
   * @param message SimpleMessageDto to get media URL from
   * @returns Media URL or null if not available
   */
  getMediaUrl(message: SimpleMessageDto): string | null {
    if (!message.content || (message.contentType !== 'image' && message.contentType !== 'video')) {
      return null;
    }

    try {
      const content = message.content as any;
      return content.url || null;
    } catch (error) {
      console.warn('Error extracting media URL:', error);
      return null;
    }
  }

  /**
   * Gets poll options from poll content
   * @param message SimpleMessageDto to get poll options from
   * @returns Array of poll options
   */
  getPollOptions(message: SimpleMessageDto): string[] {
    if (!message.content || message.contentType !== 'poll') {
      return [];
    }

    try {
      const content = message.content as any;
      return content.options || [];
    } catch (error) {
      console.warn('Error extracting poll options:', error);
      return [];
    }
  }

  /**
   * Checks if poll allows multiple selections
   * @param message SimpleMessageDto to check
   * @returns Whether poll allows multiple selections
   */
  isPollMultiSelect(message: SimpleMessageDto): boolean {
    if (!message.content || message.contentType !== 'poll') {
      return false;
    }

    try {
      const content = message.content as any;
      return content.allowMultipleSelections || false;
    } catch (error) {
      console.warn('Error checking poll multi-select:', error);
      return false;
    }
  }

  /**
   * Gets Bootstrap icon class for message content type
   * @param contentType Message content type
   * @returns Bootstrap icon class
   */
  getContentTypeIcon(contentType?: string): string {
    switch (contentType) {
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
   * Checks if message has media content (image or video)
   * @param contentType Message content type
   * @returns Whether message has media content
   */
  hasMediaContent(contentType?: string): boolean {
    return contentType === 'image' || contentType === 'video';
  }

  /**
   * Creates a simple text content object for sending messages
   * @param text Text content
   * @returns SimpleTextContent object
   */
  createTextContent(text: string): SimpleTextContent {
    return {
      $type: 'text',
      text
    };
  }

  /**
   * Creates a simple image content object for sending messages
   * @param url Image URL
   * @param fileName Optional file name
   * @param fileSize Optional file size
   * @param mimeType Optional MIME type
   * @param width Optional image width
   * @param height Optional image height
   * @returns SimpleImageContent object
   */
  createImageContent(
    url: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    width?: number,
    height?: number
  ): SimpleImageContent {
    return {
      $type: 'image',
      url,
      fileName,
      fileSize,
      mimeType,
      width,
      height
    };
  }

  /**
   * Creates a simple video content object for sending messages
   * @param url Video URL
   * @param fileName Optional file name
   * @param fileSize Optional file size
   * @param mimeType Optional MIME type
   * @param width Optional video width
   * @param height Optional video height
   * @param durationSeconds Optional duration in seconds
   * @returns SimpleVideoContent object
   */
  createVideoContent(
    url: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    width?: number,
    height?: number,
    durationSeconds?: number
  ): SimpleVideoContent {
    return {
      $type: 'video',
      url,
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      durationSeconds
    };
  }

  /**
   * Creates a simple poll content object for sending messages
   * @param question Poll question
   * @param options Poll options
   * @param allowMultipleSelections Whether to allow multiple selections
   * @returns SimplePollContent object
   */
  createPollContent(
    question: string,
    options: string[],
    allowMultipleSelections: boolean = false
  ): SimplePollContent {
    return {
      $type: 'poll',
      question,
      options,
      allowMultipleSelections
    };
  }
}
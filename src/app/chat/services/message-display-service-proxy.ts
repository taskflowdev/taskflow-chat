import { Injectable } from '@angular/core';
import { MessageDto } from '../../api/models/message-dto';
import { TextContent } from '../../api/models/text-content';
import { ImageContent } from '../../api/models/image-content';
import { VideoContent } from '../../api/models/video-content';
import { PollContent } from '../../api/models/poll-content';
import { GeneralFileContent } from '../../api/models/general-file-content';

/**
 * Result interface for message preview display
 */
export interface MessagePreview {
  text: string;
  icon?: string; // Bootstrap icon class
  hasIcon: boolean;
}

/**
 * Type guard for TextContent
 */
export function isTextContent(content: any): content is TextContent {
  return content && content.contentType === 'text';
}

/**
 * Type guard for ImageContent
 */
export function isImageContent(content: any): content is ImageContent {
  return content && content.contentType === 'image';
}

/**
 * Type guard for VideoContent
 */
export function isVideoContent(content: any): content is VideoContent {
  return content && content.contentType === 'video';
}

/**
 * Type guard for PollContent
 */
export function isPollContent(content: any): content is PollContent {
  return content && content.contentType === 'poll';
}

/**
 * Type guard for GeneralFileContent
 */
export function isGeneralFileContent(content: any): content is GeneralFileContent {
  return content && content.contentType && !['text', 'image', 'video', 'poll'].includes(content.contentType);
}

/**
 * Utility service for handling message content types and display logic.
 * Provides WhatsApp-style message previews for the chat list.
 * Follows MNC coding standards with comprehensive documentation.
 */
@Injectable({
  providedIn: 'root'
})
export class MessageDisplayServiceProxy {

  constructor() { }

  /**
   * Generates a WhatsApp-style message preview for chat list display.
   * Returns appropriate text and icon based on message content type.
   *
   * @param message - The message to generate preview for
   * @returns MessagePreview Display information for the message
   */
  getMessagePreview(message: MessageDto): MessagePreview {
    if (!message) {
      return { text: '', hasIcon: false };
    }

    // Handle system messages
    if (message.sourceType === 'system') {
      return this.getSystemMessagePreview(message);
    }

    // Handle user messages based on content type
    return this.getUserMessagePreview(message);
  }

  /**
   * Generates preview for system messages.
   *
   * @param message - The system message
   * @returns MessagePreview System message display information
   */
  private getSystemMessagePreview(message: MessageDto): MessagePreview {
    switch (message.messageType) {
      case 'userJoined':
        return {
          text: `Someone joined the group`,
          icon: 'person-plus',
          hasIcon: true
        };
      case 'userLeft':
        return {
          text: `Someone left the group`,
          icon: 'person-dash',
          hasIcon: true
        };
      case 'userRemoved':
        return {
          text: `Someone was removed from the group`,
          icon: 'person-x',
          hasIcon: true
        };
      case 'groupCreated':
        return {
          text: 'Group created',
          icon: 'people',
          hasIcon: true
        };
      case 'groupUpdated':
        return {
          text: 'Group updated',
          icon: 'pencil',
          hasIcon: true
        };
      case 'groupDeleted':
        return {
          text: 'Group deleted',
          icon: 'trash',
          hasIcon: true
        };
      case 'memberRoleChanged':
        return {
          text: 'Member role changed',
          icon: 'person-gear',
          hasIcon: true
        };
      case 'inviteCodeRegenerated':
        return {
          text: 'Invite code regenerated',
          icon: 'link-45deg',
          hasIcon: true
        };
      default:
        return {
          text: 'System message',
          icon: 'info-circle',
          hasIcon: true
        };
    }
  }

  /**
   * Generates preview for user messages based on content type.
   *
   * @param message - The user message
   * @returns MessagePreview User message display information
   */
  private getUserMessagePreview(message: MessageDto): MessagePreview {
    if (!message.content) {
      return { text: 'Message', hasIcon: false };
    }

    switch (message.contentType) {
      case 'text':
        return this.getTextContentPreview(message.content);
      case 'image':
        return this.getImageContentPreview(message.content);
      case 'video':
        return this.getVideoContentPreview(message.content);
      case 'poll':
        return this.getPollContentPreview(message.content);
      default:
        return this.getGeneralFileContentPreview(message.content);
    }
  }

  /**
   * Generates preview for text content.
   *
   * @param content - The text content
   * @returns MessagePreview Text message display information
   */
  private getTextContentPreview(content: any): MessagePreview {
    // Check if content is our extended TextContent with text property
    if (content && typeof content.text === 'string') {
      const truncatedText = content.text.length > 50
        ? content.text.substring(0, 47) + '...'
        : content.text;
      return { text: truncatedText, hasIcon: false };
    }

    // If content is a string (fallback for legacy data)
    if (typeof content === 'string') {
      const truncatedText = content.length > 50
        ? content.substring(0, 47) + '...'
        : content;
      return { text: truncatedText, hasIcon: false };
    }

    // Handle basic TextContent (which only has contentType)
    if (isTextContent(content)) {
      return { text: 'Text message', hasIcon: false };
    }

    return { text: 'Text message', hasIcon: false };
  }

  /**
   * Generates preview for image content.
   *
   * @param content - The image content
   * @returns MessagePreview Image message display information
   */
  private getImageContentPreview(content: any): MessagePreview {
    // Check if it's an extended image content with filename
    if (content && content.fileName) {
      return {
        text: `📷 ${content.fileName}`,
        icon: 'image',
        hasIcon: true
      };
    }

    return {
      text: '📷 Photo',
      icon: 'image',
      hasIcon: true
    };
  }

  /**
   * Generates preview for video content.
   *
   * @param content - The video content
   * @returns MessagePreview Video message display information
   */
  private getVideoContentPreview(content: any): MessagePreview {
    // Check if it's an extended video content with filename and duration
    if (content && content.fileName) {
      let previewText = `🎥 ${content.fileName}`;
      if (content.duration) {
        const minutes = Math.floor(content.duration / 60);
        const seconds = Math.floor(content.duration % 60);
        previewText += ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
      }

      return {
        text: previewText,
        icon: 'play-circle',
        hasIcon: true
      };
    }

    return {
      text: '🎥 Video',
      icon: 'play-circle',
      hasIcon: true
    };
  }

  /**
   * Generates preview for poll content.
   *
   * @param content - The poll content
   * @returns MessagePreview Poll message display information
   */
  private getPollContentPreview(content: any): MessagePreview {
    // Check if it's an extended poll content with question
    if (content && content.question) {
      const truncatedQuestion = content.question.length > 30
        ? content.question.substring(0, 27) + '...'
        : content.question;

      return {
        text: `${truncatedQuestion}`,
        icon: 'bar-chart',
        hasIcon: true
      };
    }

    return {
      text: 'Poll',
      icon: 'bar-chart',
      hasIcon: true
    };
  }

  /**
   * Generates preview for general file content.
   *
   * @param content - The file content
   * @returns MessagePreview File message display information
   */
  private getGeneralFileContentPreview(content: any): MessagePreview {
    // Check if it's an extended file content with filename
    if (content && content.fileName) {
      return {
        text: `📎 ${content.fileName}`,
        icon: 'file-earmark',
        hasIcon: true
      };
    }

    return {
      text: '📎 File',
      icon: 'file-earmark',
      hasIcon: true
    };
  }

  /**
   * Determines if a message should display the sender's name in the preview.
   * Useful for group chats where sender identification is important.
   *
   * @param message - The message to check
   * @param isGroupChat - Whether this is a group chat context
   * @returns boolean True if sender name should be displayed
   */
  shouldDisplaySenderName(message: MessageDto, isGroupChat: boolean = true): boolean {
    // Don't show sender name for system messages
    if (message.sourceType === 'system') {
      return false;
    }

    // Always show sender name in group chats for user messages
    return isGroupChat;
  }

  /**
   * Gets the complete message preview text including sender name if appropriate.
   *
   * @param message - The message to generate preview for
   * @param isGroupChat - Whether this is a group chat context
   * @returns string Complete preview text
   */
  getCompleteMessagePreview(message: MessageDto, isGroupChat: boolean = true): string {
    const preview = this.getMessagePreview(message);

    if (this.shouldDisplaySenderName(message, isGroupChat) && message.senderName) {
      return `${message.senderName}: ${preview.text}`;
    }

    return preview.text;
  }

  /**
   * Gets the Bootstrap icon class for a message.
   *
   * @param message - The message to get icon for
   * @returns string | undefined Bootstrap icon class or undefined if no icon
   */
  getMessageIcon(message: MessageDto): string | undefined {
    const preview = this.getMessagePreview(message);
    return preview.hasIcon ? preview.icon : undefined;
  }
}

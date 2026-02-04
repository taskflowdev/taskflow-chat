import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SendMessageDto } from '../../api/models/send-message-dto';
import { TextContent } from '../../api/models/text-content';
import { ImageContent } from '../../api/models/image-content';
import { VideoContent } from '../../api/models/video-content';
import { PollContent } from '../../api/models/poll-content';
import { GeneralFileContent } from '../../api/models/general-file-content';
import { MessageMetadata } from '../../api/models/message-metadata';
import { GroupsServiceProxy } from './groups-service-proxy';

/**
 * Extended TextContent with text property for actual message content
 */
export interface ExtendedTextContent extends TextContent {
  text: string;
}

/**
 * Extended ImageContent with file properties
 */
export interface ExtendedImageContent extends ImageContent {
  url: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/**
 * Extended VideoContent with file properties
 */
export interface ExtendedVideoContent extends VideoContent {
  url: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/**
 * Poll option interface
 */
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

/**
 * Extended PollContent with poll data
 */
export interface ExtendedPollContent extends PollContent {
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
  expiresAt?: string;
  createdBy: string;
}

/**
 * Extended GeneralFileContent with file properties
 */
export interface ExtendedGeneralFileContent extends GeneralFileContent {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Service for creating and sending different types of messages.
 * Provides factory methods for each message content type and handles message composition.
 * Follows MNC coding standards with comprehensive documentation and error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class MessageFactoryServiceProxy {

  constructor(private groupsServiceProxy: GroupsServiceProxy) { }

  /**
   * Sends a text message to a group.
   *
   * @param groupId - Target group ID
   * @param text - Message text content
   * @param metadata - Optional message metadata
   * @returns Observable with the sent message or null if failed
   */
  sendTextMessage(
    groupId: string,
    text: string,
    metadata?: MessageMetadata
  ): Observable<any> {
    const textContent: ExtendedTextContent = {
      contentType: 'text',
      text: text.trim()
    };

    return this.groupsServiceProxy.sendTypedMessage(
      groupId,
      'text',
      textContent,
      'userMessage'
    );
  }

  /**
   * Sends an image message to a group.
   *
   * @param groupId - Target group ID
   * @param imageData - Image content data
   * @param metadata - Optional message metadata
   * @returns Observable with the sent message or null if failed
   */
  sendImageMessage(
    groupId: string,
    imageData: {
      url: string;
      fileName: string;
      fileSize: number;
      width?: number;
      height?: number;
      thumbnailUrl?: string;
    },
    metadata?: MessageMetadata
  ): Observable<any> {
    const imageContent: ExtendedImageContent = {
      contentType: 'image',
      ...imageData
    };

    return this.groupsServiceProxy.sendTypedMessage(
      groupId,
      'image',
      imageContent,
      'userMessage'
    );
  }

  /**
   * Sends a video message to a group.
   *
   * @param groupId - Target group ID
   * @param videoData - Video content data
   * @param metadata - Optional message metadata
   * @returns Observable with the sent message or null if failed
   */
  sendVideoMessage(
    groupId: string,
    videoData: {
      url: string;
      fileName: string;
      fileSize: number;
      duration?: number;
      width?: number;
      height?: number;
      thumbnailUrl?: string;
    },
    metadata?: MessageMetadata
  ): Observable<any> {
    const videoContent: ExtendedVideoContent = {
      contentType: 'video',
      ...videoData
    };

    return this.groupsServiceProxy.sendTypedMessage(
      groupId,
      'video',
      videoContent,
      'userMessage'
    );
  }

  /**
   * Sends a poll message to a group.
   *
   * @param groupId - Target group ID
   * @param pollData - Poll content data
   * @param userId - ID of the user creating the poll
   * @param metadata - Optional message metadata
   * @returns Observable with the sent message or null if failed
   */
  sendPollMessage(
    groupId: string,
    pollData: {
      question: string;
      options: string[];
      allowMultipleAnswers?: boolean;
      expiresAt?: string;
    },
    userId?: string,
    metadata?: MessageMetadata,
  ): Observable<any> {
    const pollOptions: PollOption[] = pollData.options.map((optionText, index) => ({
      id: `option_${index + 1}`,
      text: optionText,
      votes: 0,
      voters: []
    }));

    const pollContent: ExtendedPollContent = {
      contentType: 'poll',
      question: pollData.question,
      options: pollOptions,
      allowMultipleAnswers: pollData.allowMultipleAnswers || false,
      expiresAt: pollData.expiresAt,
      createdBy: userId || ''
    };

    return this.groupsServiceProxy.sendTypedMessage(
      groupId,
      'poll',
      pollContent,
      'userMessage'
    );
  }

  /**
   * Sends a file message to a group.
   *
   * @param groupId - Target group ID
   * @param fileData - File content data
   * @param metadata - Optional message metadata
   * @returns Observable with the sent message or null if failed
   */
  sendFileMessage(
    groupId: string,
    fileData: {
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
    metadata?: MessageMetadata
  ): Observable<any> {
    const fileContent: ExtendedGeneralFileContent = {
      contentType: 'file', // Custom content type for general files
      ...fileData
    };

    // For now, use 'text' as the contentType since 'file' is not in the API enum
    // In a real implementation, this would be extended to support file types
    return this.groupsServiceProxy.sendTypedMessage(
      groupId,
      'text', // Fallback to text type
      fileContent,
      'userMessage'
    );
  }

  /**
   * Creates a system message for group events.
   *
   * @param groupId - Target group ID
   * @param messageType - Type of system message
   * @param content - Message content (usually empty for system messages)
   * @param metadata - Optional message metadata
   * @returns Observable with the sent message or null if failed
   */
  sendSystemMessage(
    groupId: string,
    messageType: 'userJoined' | 'userLeft' | 'groupCreated' | 'groupUpdated' | 'groupDeleted' | 'memberRoleChanged' | 'inviteCodeRegenerated',
    content: any = '',
    metadata?: MessageMetadata
  ): Observable<any> {
    // System messages typically use text content type with empty content
    const textContent: ExtendedTextContent = {
      contentType: 'text',
      text: ''
    };

    return this.groupsServiceProxy.sendTypedMessage(
      groupId,
      'text',
      textContent,
      messageType
    );
  }

  /**
   * Validates message content before sending.
   *
   * @param contentType - Type of message content
   * @param content - Message content to validate
   * @returns Object with validation result and error message if invalid
   */
  validateMessageContent(
    contentType: 'text' | 'image' | 'video' | 'poll',
    content: any
  ): { isValid: boolean; error?: string } {
    switch (contentType) {
      case 'text':
        return this.validateTextContent(content);
      case 'image':
        return this.validateImageContent(content);
      case 'video':
        return this.validateVideoContent(content);
      case 'poll':
        return this.validatePollContent(content);
      default:
        return { isValid: false, error: 'Unsupported content type' };
    }
  }

  /**
   * Validates text content.
   */
  private validateTextContent(content: any): { isValid: boolean; error?: string } {
    if (typeof content === 'string') {
      const text = content.trim();
      if (text.length === 0) {
        return { isValid: false, error: 'Message cannot be empty' };
      }
      if (text.length > 4000) {
        return { isValid: false, error: 'Message is too long (max 4000 characters)' };
      }
      return { isValid: true };
    }

    if (content && typeof content.text === 'string') {
      return this.validateTextContent(content.text);
    }

    return { isValid: false, error: 'Invalid text content' };
  }

  /**
   * Validates image content.
   */
  private validateImageContent(content: any): { isValid: boolean; error?: string } {
    if (!content.url || typeof content.url !== 'string') {
      return { isValid: false, error: 'Image URL is required' };
    }

    if (!content.fileName || typeof content.fileName !== 'string') {
      return { isValid: false, error: 'Image file name is required' };
    }

    if (typeof content.fileSize !== 'number' || content.fileSize <= 0) {
      return { isValid: false, error: 'Valid file size is required' };
    }

    // Check file size limit (10MB)
    if (content.fileSize > 10 * 1024 * 1024) {
      return { isValid: false, error: 'Image file is too large (max 10MB)' };
    }

    return { isValid: true };
  }

  /**
   * Validates video content.
   */
  private validateVideoContent(content: any): { isValid: boolean; error?: string } {
    if (!content.url || typeof content.url !== 'string') {
      return { isValid: false, error: 'Video URL is required' };
    }

    if (!content.fileName || typeof content.fileName !== 'string') {
      return { isValid: false, error: 'Video file name is required' };
    }

    if (typeof content.fileSize !== 'number' || content.fileSize <= 0) {
      return { isValid: false, error: 'Valid file size is required' };
    }

    // Check file size limit (100MB)
    if (content.fileSize > 100 * 1024 * 1024) {
      return { isValid: false, error: 'Video file is too large (max 100MB)' };
    }

    return { isValid: true };
  }

  /**
   * Validates poll content.
   */
  private validatePollContent(content: any): { isValid: boolean; error?: string } {
    if (!content.question || typeof content.question !== 'string' || content.question.trim().length === 0) {
      return { isValid: false, error: 'Poll question is required' };
    }

    if (!Array.isArray(content.options) || content.options.length < 2) {
      return { isValid: false, error: 'Poll must have at least 2 options' };
    }

    if (content.options.length > 10) {
      return { isValid: false, error: 'Poll cannot have more than 10 options' };
    }

    for (const option of content.options) {
      if (typeof option !== 'string' || option.trim().length === 0) {
        return { isValid: false, error: 'All poll options must be non-empty strings' };
      }
    }

    return { isValid: true };
  }

  /**
   * Creates a SendMessageDto for a text message without sending it.
   * This is useful for SignalR hub methods that expect SendMessageDto.
   *
   * @param text - Message text content
   * @param metadata - Optional message metadata
   * @returns Properly formatted SendMessageDto
   */
  createTextMessageDto(text: string, metadata?: MessageMetadata): SendMessageDto {
    const textContent: ExtendedTextContent = {
      contentType: 'text',
      text: text.trim()
    };

    return {
      content: textContent as any,
      contentType: 'text',
      messageType: 'userMessage',
      metadata: metadata || null
    };
  }

  /**
   * Creates a SendMessageDto for an image message without sending it.
   *
   * @param imageData - Image content data
   * @param metadata - Optional message metadata
   * @returns Properly formatted SendMessageDto
   */
  createImageMessageDto(imageData: {
    url: string;
    fileName: string;
    fileSize: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string;
  }, metadata?: MessageMetadata): SendMessageDto {
    const imageContent: ExtendedImageContent = {
      contentType: 'image',
      ...imageData
    };

    return {
      content: imageContent as any,
      contentType: 'image',
      messageType: 'userMessage',
      metadata: metadata || null
    };
  }

  /**
   * Creates a SendMessageDto for a poll message without sending it.
   *
   * @param pollData - Poll content data
   * @param metadata - Optional message metadata
   * @returns Properly formatted SendMessageDto
   */
  createPollMessageDto(pollData: {
    question: string;
    options: PollOption[];
    allowMultipleAnswers: boolean;
    expiresAt?: string;
    createdBy: string;
  }, metadata?: MessageMetadata): SendMessageDto {
    const pollContent: ExtendedPollContent = {
      contentType: 'poll',
      ...pollData
    };

    return {
      content: pollContent as any,
      contentType: 'poll',
      messageType: 'userMessage',
      metadata: metadata || null
    };
  }
}

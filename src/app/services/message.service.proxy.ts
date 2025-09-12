import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { MessagesService } from '../api/services/messages.service';
import { 
  MessageDto, 
  SendMessageDto
} from '../api/models';
import { MessageContentServiceProxy } from './message-content.service.proxy';

// Temporary interfaces to work around API circular reference issues
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
 * Options for sending different types of messages
 */
export interface SendTextMessageOptions {
  text: string;
}

export interface SendImageMessageOptions {
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface SendFileMessageOptions {
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface SendAudioMessageOptions {
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  durationSeconds?: number;
}

export interface SendVideoMessageOptions {
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

export interface SendPollMessageOptions {
  question: string;
  options: string[];
  allowMultipleAnswers?: boolean;
}

/**
 * Proxy service for Messages API that provides comprehensive message sending
 * capabilities for all supported content types. Follows MNC coding standards
 * and provides a clean interface for sending different types of messages.
 */
@Injectable({
  providedIn: 'root'
})
export class MessageServiceProxy {

  constructor(
    private messagesService: MessagesService,
    private messageContentService: MessageContentServiceProxy
  ) { }

  /**
   * Send a text message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param options - Text message options
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendTextMessage(groupId: string, options: SendTextMessageOptions): Observable<MessageDto | null> {
    const textContent: SimpleMessageContent = {
      $type: 'text',
      text: options.text
    };

    return this.sendMessageWithContent(groupId, textContent, 'text');
  }

  /**
   * Send an image message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param options - Image message options
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendImageMessage(groupId: string, options: SendImageMessageOptions): Observable<MessageDto | null> {
    const imageContent: SimpleMessageContent = {
      $type: 'image',
      url: options.url,
      fileName: options.fileName,
      fileSize: options.fileSize,
      mimeType: options.mimeType,
      width: options.width,
      height: options.height
    };

    return this.sendMessageWithContent(groupId, imageContent, 'image');
  }

  /**
   * Send a file message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param options - File message options
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendFileMessage(groupId: string, options: SendFileMessageOptions): Observable<MessageDto | null> {
    const fileContent: SimpleMessageContent = {
      $type: 'file',
      url: options.url,
      fileName: options.fileName,
      fileSize: options.fileSize,
      mimeType: options.mimeType
    };

    return this.sendMessageWithContent(groupId, fileContent, 'file');
  }

  /**
   * Send an audio message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param options - Audio message options
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendAudioMessage(groupId: string, options: SendAudioMessageOptions): Observable<MessageDto | null> {
    const audioContent: SimpleMessageContent = {
      $type: 'audio',
      url: options.url,
      fileName: options.fileName,
      fileSize: options.fileSize,
      mimeType: options.mimeType,
      durationSeconds: options.durationSeconds
    };

    return this.sendMessageWithContent(groupId, audioContent, 'audio');
  }

  /**
   * Send a video message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param options - Video message options
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendVideoMessage(groupId: string, options: SendVideoMessageOptions): Observable<MessageDto | null> {
    const videoContent: SimpleMessageContent = {
      $type: 'video',
      url: options.url,
      fileName: options.fileName,
      fileSize: options.fileSize,
      mimeType: options.mimeType,
      durationSeconds: options.durationSeconds,
      width: options.width,
      height: options.height
    };

    return this.sendMessageWithContent(groupId, videoContent, 'video');
  }

  /**
   * Send a poll message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param options - Poll message options
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendPollMessage(groupId: string, options: SendPollMessageOptions): Observable<MessageDto | null> {
    const pollContent: SimpleMessageContent = {
      $type: 'poll'
      // Note: Actual poll structure would depend on the API definition
      // This is a placeholder for the poll content structure
    };

    return this.sendMessageWithContent(groupId, pollContent, 'poll');
  }

  /**
   * Get messages for a specific group
   * 
   * @param groupId - The ID of the group to fetch messages for
   * @param before - Get messages before this timestamp (optional)
   * @param limit - Maximum number of messages to return (optional, default: 20)
   * @returns Observable<MessageDto[]> - List of messages
   */
  getGroupMessages(groupId: string, before?: string, limit: number = 20): Observable<MessageDto[]> {
    return this.messagesService.apiGroupsGroupIdMessagesGet$Json({
      groupId,
      before,
      limit
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error(`Error fetching messages for group ${groupId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific message by ID
   * 
   * @param groupId - The ID of the group containing the message
   * @param messageId - The ID of the message to fetch
   * @returns Observable<MessageDto | null> - The message or null if not found
   */
  getMessage(groupId: string, messageId: string): Observable<MessageDto | null> {
    return this.messagesService.apiGroupsGroupIdMessagesMessageIdGet$Json({
      groupId,
      messageId
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Error fetching message ${messageId} from group ${groupId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Private helper method to send a message with specific content
   * 
   * @param groupId - The ID of the group to send message to
   * @param content - The message content
   * @param contentType - The type of content
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  private sendMessageWithContent(
    groupId: string, 
    content: SimpleMessageContent, 
    contentType: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll'
  ): Observable<MessageDto | null> {
    const sendMessageDto: SendMessageDto = {
      content: content as any,
      contentType: contentType,
      messageType: 'userMessage',
      metadata: null
    };

    return this.messagesService.apiGroupsGroupIdMessagesPost$Json({
      groupId,
      body: sendMessageDto
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Error sending ${contentType} message to group ${groupId}:`, error);
        return of(null);
      })
    );
  }
}
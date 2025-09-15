import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { MessagesService } from '../../api/services/messages.service';
import { GroupsService } from '../../api/services/groups.service';
import { MessageContentUtilityService, SimpleTextContent, SimpleImageContent, SimpleVideoContent, SimplePollContent, SimpleMessageDto } from './message-content-utility.service';

// Import types individually to avoid circular reference issues
type MessageDto = {
  messageId?: string;
  groupId?: string;
  senderId?: string | null;
  senderName?: string | null;
  sourceType?: 'user' | 'system';
  messageType?: 'userMessage' | 'userJoined' | 'userLeft' | 'groupCreated' | 'groupUpdated' | 'groupDeleted' | 'memberRoleChanged' | 'inviteCodeRegenerated';
  contentType?: 'text' | 'image' | 'video' | 'poll';
  content?: any;
  metadata?: any;
  createdAt?: string;
};

type SendMessageDto = {
  messageType?: 'userMessage' | 'userJoined' | 'userLeft' | 'groupCreated' | 'groupUpdated' | 'groupDeleted' | 'memberRoleChanged' | 'inviteCodeRegenerated';
  contentType?: 'text' | 'image' | 'video' | 'poll';
  content: any;
  metadata?: any | null;
};

type GroupDto = {
  createdAt?: string;
  createdBy?: string;
  groupId?: string;
  inviteCode?: string;
  inviteLink?: string;
  isPublic?: boolean;
  lastMessage?: MessageDto | null;
  memberCount?: number;
  name?: string;
};

/**
 * Extended group data with message information for chat UI
 */
export interface GroupWithMessages {
  groupId?: string;
  name?: string;
  memberCount?: number;
  lastMessage?: MessageDto;
  unreadCount?: number;
}

/**
 * Proxy service for messages and groups operations
 * Wraps the auto-generated API services to provide business logic and error handling
 * Following MNC coding standards with proper separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class MessagesServiceProxy {

  constructor(
    private messagesService: MessagesService,
    private groupsService: GroupsService,
    private messageContentUtility: MessageContentUtilityService
  ) { }

  /**
   * Gets messages for a specific group
   * @param groupId Group identifier
   * @param before Optional cursor for pagination
   * @param limit Optional limit for number of messages
   * @returns Observable with messages array
   */
  getGroupMessages(groupId: string, before?: string, limit?: number): Observable<MessageDto[]> {
    return this.messagesService.apiGroupsGroupIdMessagesGet$Json({
      groupId,
      before,
      limit
    }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('MessagesServiceProxy - Get group messages error:', error);
        return of([]);
      })
    );
  }

  /**
   * Gets a specific message by ID
   * @param groupId Group identifier
   * @param messageId Message identifier
   * @returns Observable with message data
   */
  getMessage(groupId: string, messageId: string): Observable<MessageDto | null> {
    return this.messagesService.apiGroupsGroupIdMessagesMessageIdGet$Json({
      groupId,
      messageId
    }).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('MessagesServiceProxy - Get message error:', error);
        return of(null);
      })
    );
  }

  /**
   * Sends a message to a group
   * @param groupId Group identifier
   * @param messageDto Message data to send
   * @returns Observable with sent message data
   */
  sendMessage(groupId: string, messageDto: SendMessageDto): Observable<MessageDto | null> {
    return this.messagesService.apiGroupsGroupIdMessagesPost$Json({
      groupId,
      body: messageDto
    }).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('MessagesServiceProxy - Send message error:', error);
        return of(null);
      })
    );
  }

  /**
   * Sends a text message to a group
   * @param groupId Group identifier
   * @param text Text content
   * @returns Observable with sent message data
   */
  sendTextMessage(groupId: string, text: string): Observable<MessageDto | null> {
    const textContent = this.messageContentUtility.createTextContent(text);

    const messageDto: SendMessageDto = {
      messageType: 'userMessage',
      contentType: 'text',
      content: textContent as any
    };

    return this.sendMessage(groupId, messageDto);
  }

  /**
   * Sends an image message to a group
   * @param groupId Group identifier
   * @param url Image URL
   * @param fileName Original file name
   * @param fileSize File size in bytes
   * @param mimeType MIME type
   * @param width Image width
   * @param height Image height
   * @returns Observable with sent message data
   */
  sendImageMessage(
    groupId: string,
    url: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    width?: number,
    height?: number
  ): Observable<MessageDto | null> {
    const imageContent = this.messageContentUtility.createImageContent(
      url, fileName, fileSize, mimeType, width, height
    );

    const messageDto: SendMessageDto = {
      messageType: 'userMessage',
      contentType: 'image',
      content: imageContent as any
    };

    return this.sendMessage(groupId, messageDto);
  }

  /**
   * Sends a video message to a group
   * @param groupId Group identifier
   * @param url Video URL
   * @param fileName Original file name
   * @param fileSize File size in bytes
   * @param mimeType MIME type
   * @param width Video width
   * @param height Video height
   * @param durationSeconds Duration in seconds
   * @returns Observable with sent message data
   */
  sendVideoMessage(
    groupId: string,
    url: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    width?: number,
    height?: number,
    durationSeconds?: number
  ): Observable<MessageDto | null> {
    const videoContent = this.messageContentUtility.createVideoContent(
      url, fileName, fileSize, mimeType, width, height, durationSeconds
    );

    const messageDto: SendMessageDto = {
      messageType: 'userMessage',
      contentType: 'video',
      content: videoContent as any
    };

    return this.sendMessage(groupId, messageDto);
  }

  /**
   * Sends a poll message to a group
   * @param groupId Group identifier
   * @param question Poll question
   * @param options Poll options
   * @param allowMultipleSelections Whether multiple selections are allowed
   * @returns Observable with sent message data
   */
  sendPollMessage(
    groupId: string,
    question: string,
    options: string[],
    allowMultipleSelections: boolean = false
  ): Observable<MessageDto | null> {
    const pollContent = this.messageContentUtility.createPollContent(
      question, options, allowMultipleSelections
    );

    const messageDto: SendMessageDto = {
      messageType: 'userMessage',
      contentType: 'poll',
      content: pollContent as any
    };

    return this.sendMessage(groupId, messageDto);
  }

  /**
   * Gets user groups with last message information
   * @returns Observable with groups array
   */
  getUserGroups(): Observable<GroupWithMessages[]> {
    return this.groupsService.apiGroupsGet$Json().pipe(
      map(response => {
        const groups = response.data || [];
        // Transform basic GroupDto to GroupWithMessages
        return groups.map(group => ({
          groupId: group.groupId,
          name: group.name,
          memberCount: group.memberCount,
          lastMessage: group.lastMessage || undefined,
          unreadCount: 0 // Will be calculated based on user's last read timestamp
        }));
      }),
      catchError(error => {
        console.error('MessagesServiceProxy - Get user groups error:', error);
        return of([]);
      })
    );
  }

  /**
   * Gets group details
   * @param groupId Group identifier
   * @returns Observable with group data
   */
  getGroupDetails(groupId: string): Observable<GroupDto | null> {
    return this.groupsService.apiGroupsIdGet$Json({ id: groupId }).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('MessagesServiceProxy - Get group details error:', error);
        return of(null);
      })
    );
  }

  /**
   * Gets formatted message preview for chat list display
   * @param message Message to get preview for
   * @returns String representation of message for chat list
   */
  getMessagePreview(message: MessageDto): string {
    return this.messageContentUtility.getMessagePreview(message as SimpleMessageDto);
  }
}
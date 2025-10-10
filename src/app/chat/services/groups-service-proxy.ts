import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { GroupsService } from '../../api/services/groups.service';
import { MessagesService } from '../../api/services/messages.service';
import { GroupDto } from '../../api/models/group-dto';
import { MessageDto } from '../../api/models/message-dto';
import { SendMessageDto } from '../../api/models/send-message-dto';
import { TextContent } from '../../api/models/text-content';

/**
 * Extended group information with the last message details
 */
export interface GroupWithMessages {
  groupId?: string;
  name?: string;
  memberCount?: number;
  lastMessage?: MessageDto;
  unreadCount?: number;
}

/**
 * Proxy service for Groups API operations.
 * Provides a simplified, application-specific interface over the auto-generated API services.
 * Follows MNC coding standards with comprehensive documentation and error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class GroupsServiceProxy {

  constructor(
    private groupsService: GroupsService,
    private messagesService: MessagesService
  ) {}

  /**
   * Retrieves all groups for the current user with last message information.
   * Combines group data with recent message information for chat list display.
   * 
   * @returns Observable<GroupWithMessages[]> Array of groups with last message details
   */
  getUserGroups(): Observable<GroupWithMessages[]> {
    return this.groupsService.apiGroupsGet$Json().pipe(
      map(response => {
        if (response.success && response.data) {
          // For now, return groups with placeholder last message
          // In a real implementation, this would fetch the latest message for each group
          return response.data.map(group => this.mapGroupToGroupWithMessages(group));
        }
        return [];
      })
    );
  }

  /**
   * Retrieves detailed information for a specific group.
   * 
   * @param groupId - The ID of the group to retrieve
   * @returns Observable<GroupDto | null> Group details or null if not found
   */
  getGroupDetails(groupId: string): Observable<GroupDto | null> {
    return this.groupsService.apiGroupsIdGet$Json({ id: groupId }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Retrieves messages for a specific group with pagination support.
   * 
   * @param groupId - The ID of the group
   * @param before - Optional cursor for pagination (messages before this point)
   * @param limit - Maximum number of messages to retrieve (default: 50)
   * @returns Observable<MessageDto[]> Array of messages
   */
  getGroupMessages(groupId: string, before?: string, limit: number = 50): Observable<MessageDto[]> {
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
      })
    );
  }

  /**
   * Sends a text message to a specific group.
   * 
   * @param groupId - The ID of the target group
   * @param content - The text content of the message
   * @returns Observable<MessageDto | null> The sent message or null if failed
   */
  sendMessage(groupId: string, content: string): Observable<MessageDto | null> {
    const textContent: TextContent = {
      contentType: 'text'
    };

    const messageDto: SendMessageDto = {
      messageType: 'userMessage',
      contentType: 'text',
      content: textContent,
      metadata: null
    };

    return this.messagesService.apiGroupsGroupIdMessagesPost$Json({
      groupId,
      body: messageDto
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Sends a message with specified content type to a group.
   * Supports all message content types: text, image, video, poll.
   * 
   * @param groupId - The ID of the target group
   * @param contentType - Type of message content
   * @param content - The message content object
   * @param messageType - Type of message (defaults to 'userMessage')
   * @returns Observable<MessageDto | null> The sent message or null if failed
   */
  sendTypedMessage(
    groupId: string,
    contentType: 'text' | 'image' | 'video' | 'poll',
    content: any,
    messageType: 'userMessage' | 'userJoined' | 'userLeft' | 'groupCreated' | 'groupUpdated' | 'groupDeleted' | 'memberRoleChanged' | 'inviteCodeRegenerated' = 'userMessage'
  ): Observable<MessageDto | null> {
    const messageDto: SendMessageDto = {
      messageType,
      contentType,
      content,
      metadata: null
    };

    return this.messagesService.apiGroupsGroupIdMessagesPost$Json({
      groupId,
      body: messageDto
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Creates a new group with the specified name.
   * 
   * @param name - Name of the new group
   * @param visibility - Visibility setting for the group ('Public' or 'Private', default: 'Private')
   * @returns Observable<GroupDto | null> Created group or null if failed
   */
  createGroup(name: string, visibility: string = 'Private'): Observable<GroupDto | null> {
    return this.groupsService.apiGroupsPost$Json({
      body: { name, visibility }
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Maps a GroupDto to GroupWithMessages format.
   * Private helper method to transform API response data.
   * 
   * @param group - The group data from API
   * @returns GroupWithMessages Extended group information
   */
  private mapGroupToGroupWithMessages(group: GroupDto): GroupWithMessages {
    return {
      groupId: group.groupId,
      name: group.name,
      memberCount: group.memberCount,
      lastMessage: group.lastMessage || undefined, // Use existing lastMessage if available
      unreadCount: 0 // Will be calculated when message read status is available
    };
  }
}
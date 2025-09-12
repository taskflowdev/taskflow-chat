import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { GroupsService } from '../api/services/groups.service';
import { MessagesService } from '../api/services/messages.service';
import { 
  GroupDto, 
  MessageDto, 
  SendMessageDto,
  CreateGroupDto,
  JoinGroupDto,
  UpdateGroupNameDto 
} from '../api/models';

// Temporary interfaces to work around API circular reference issues
interface SimpleMessageContent {
  $type: string;
  text?: string;
}

/**
 * Extended interface for GroupDto with additional message information
 * Used for displaying chat list with last message preview
 */
export interface GroupWithMessages extends GroupDto {
  lastMessage?: MessageDto;
  unreadCount?: number;
}

/**
 * Proxy service for Groups API that provides higher-level business logic
 * and wraps the auto-generated GroupsService and MessagesService
 * 
 * This service follows MNC coding standards and provides a clean interface
 * for the chat components to interact with group-related functionality.
 */
@Injectable({
  providedIn: 'root'
})
export class GroupServiceProxy {

  constructor(
    private groupsService: GroupsService,
    private messagesService: MessagesService
  ) { }

  /**
   * Gets all user groups with their latest message information
   * 
   * @returns Observable<GroupWithMessages[]> - List of groups with message info
   */
  getUserGroups(): Observable<GroupWithMessages[]> {
    return this.groupsService.apiGroupsGet$Json({}).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(group => this.enrichGroupWithMessageInfo(group));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching user groups:', error);
        return of([]);
      })
    );
  }

  /**
   * Gets details of a specific group
   * 
   * @param groupId - The ID of the group to fetch
   * @returns Observable<GroupDto | null> - Group details or null if not found
   */
  getGroupDetails(groupId: string): Observable<GroupDto | null> {
    return this.groupsService.apiGroupsIdGet$Json({ id: groupId }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Error fetching group details for ${groupId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Gets messages for a specific group
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
   * Sends a text message to a group
   * 
   * @param groupId - The ID of the group to send message to
   * @param messageText - The text content of the message
   * @returns Observable<MessageDto | null> - The sent message or null if failed
   */
  sendMessage(groupId: string, messageText: string): Observable<MessageDto | null> {
    const textContent: SimpleMessageContent = {
      $type: 'text',
      text: messageText
    };

    const sendMessageDto: SendMessageDto = {
      content: textContent as any,
      contentType: 'text',
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
        console.error(`Error sending message to group ${groupId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Creates a new group
   * 
   * @param groupName - Name of the new group
   * @returns Observable<GroupDto | null> - Created group or null if failed
   */
  createGroup(groupName: string): Observable<GroupDto | null> {
    const createGroupDto: CreateGroupDto = {
      name: groupName
    };

    return this.groupsService.apiGroupsPost$Json({
      body: createGroupDto
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error creating group:', error);
        return of(null);
      })
    );
  }

  /**
   * Join a group using invite code
   * 
   * @param inviteCode - The invite code for the group
   * @returns Observable<GroupDto | null> - Joined group or null if failed
   */
  joinGroup(inviteCode: string): Observable<GroupDto | null> {
    const joinGroupDto: JoinGroupDto = {
      inviteCode: inviteCode
    };

    return this.groupsService.apiGroupsJoinPost$Json({
      body: joinGroupDto
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error joining group:', error);
        return of(null);
      })
    );
  }

  /**
   * Update group name
   * 
   * @param groupId - The ID of the group to update
   * @param newName - New name for the group
   * @returns Observable<boolean> - Success status
   */
  updateGroupName(groupId: string, newName: string): Observable<boolean> {
    const updateDto: UpdateGroupNameDto = {
      name: newName
    };

    return this.groupsService.apiGroupsIdNamePut$Json({
      id: groupId,
      body: updateDto
    }).pipe(
      map(response => response.success || false),
      catchError(error => {
        console.error(`Error updating group name for ${groupId}:`, error);
        return of(false);
      })
    );
  }

  /**
   * Leave a group
   * 
   * @param groupId - The ID of the group to leave
   * @returns Observable<boolean> - Success status
   */
  leaveGroup(groupId: string): Observable<boolean> {
    return this.groupsService.apiGroupsIdLeavePost$Json({ id: groupId }).pipe(
      map(response => response.success || false),
      catchError(error => {
        console.error(`Error leaving group ${groupId}:`, error);
        return of(false);
      })
    );
  }

  /**
   * Delete a group (admin only)
   * 
   * @param groupId - The ID of the group to delete
   * @returns Observable<boolean> - Success status
   */
  deleteGroup(groupId: string): Observable<boolean> {
    return this.groupsService.apiGroupsIdDelete$Json({ id: groupId }).pipe(
      map(response => response.success || false),
      catchError(error => {
        console.error(`Error deleting group ${groupId}:`, error);
        return of(false);
      })
    );
  }

  /**
   * Private helper method to enrich group data with message information
   * In a real implementation, this would fetch the latest message for each group
   * For now, it returns the group as-is with default message info
   * 
   * @param group - The group to enrich
   * @returns GroupWithMessages - Enriched group data
   */
  private enrichGroupWithMessageInfo(group: GroupDto): GroupWithMessages {
    return {
      ...group,
      lastMessage: undefined, // TODO: Fetch actual last message
      unreadCount: 0 // TODO: Calculate actual unread count
    };
  }
}
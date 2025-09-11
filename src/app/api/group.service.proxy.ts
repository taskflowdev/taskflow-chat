import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { GroupsService } from './api/groups.service';
import { MessagesService } from './api/messages.service';
import { GroupDto } from './model/groupDto';
import { MessageDto } from './model/messageDto';
import { GroupDtoIEnumerableApiResponse } from './model/groupDtoIEnumerableApiResponse';
import { MessageDtoIEnumerableApiResponse } from './model/messageDtoIEnumerableApiResponse';

export interface GroupWithMessages extends GroupDto {
  lastMessage?: MessageDto;
  unreadCount?: number;
}

/**
 * Service proxy that provides a clean interface for group and message operations
 * Follows the service-proxy pattern for better separation of concerns
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
   * Fetches all groups for the current user with their last messages
   * @returns Observable of groups with last message info
   */
  getUserGroups(): Observable<GroupWithMessages[]> {
    return this.groupsService.apiGroupsGet().pipe(
      map((response: GroupDtoIEnumerableApiResponse) => {
        if (response.success && response.data) {
          return response.data.map(group => ({
            ...group,
            unreadCount: 0 // TODO: Implement unread count logic when available
          }));
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
   * Fetches messages for a specific group
   * @param groupId The ID of the group
   * @param before Optional: Get messages before this timestamp
   * @param limit Optional: Maximum number of messages to fetch
   * @returns Observable of messages
   */
  getGroupMessages(groupId: string, before?: string, limit?: number): Observable<MessageDto[]> {
    return this.messagesService.apiGroupsGroupIdMessagesGet(groupId, before, limit).pipe(
      map((response: MessageDtoIEnumerableApiResponse) => {
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
   * Gets details for a specific group
   * @param groupId The ID of the group
   * @returns Observable of group details
   */
  getGroupDetails(groupId: string): Observable<GroupDto | null> {
    return this.groupsService.apiGroupsIdGet(groupId).pipe(
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
   * Sends a message to a group
   * @param groupId The ID of the group
   * @param content The message content
   * @returns Observable of the sent message
   */
  sendMessage(groupId: string, content: string): Observable<MessageDto | null> {
    const sendMessageDto = {
      groupId,
      content: { text: content }, // Assuming text content type
      messageType: 'Text' as any, // TODO: Use proper enum when available
      contentType: 'Text' as any
    };

    // Note: Using MessagesService for sending - assuming there's a send method
    // If not available, this would need to be implemented via the API
    return of(null); // Placeholder - implement when send message API is available
  }
}
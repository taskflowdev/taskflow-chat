/**
 * Group Service Proxy
 * 
 * Provides a clean interface to group-related operations,
 * wrapping the generated GroupsService with business logic and error handling.
 */
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { GroupsService } from './api/groups.service';
import { MessagesService } from './api/messages.service';
import { GroupDto } from './model/groupDto';
import { MessageDto } from './model/messageDto';
import { CreateGroupDto } from './model/createGroupDto';
import { JoinGroupDto } from './model/joinGroupDto';
import { GroupDtoIEnumerableApiResponse } from './model/groupDtoIEnumerableApiResponse';
import { MessageDtoIEnumerableApiResponse } from './model/messageDtoIEnumerableApiResponse';

export interface GroupWithLastMessage extends GroupDto {
  lastMessageContent?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface GroupListLoadingState {
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GroupProxyService {
  private loadingState: GroupListLoadingState = {
    isLoading: false,
    error: null
  };

  constructor(
    private groupsService: GroupsService,
    private messagesService: MessagesService
  ) {}

  /**
   * Get all groups for the current user
   * @returns Observable of groups with enhanced data
   */
  getGroups(): Observable<GroupWithLastMessage[]> {
    this.setLoadingState(true, null);
    
    return this.groupsService.apiGroupsGet().pipe(
      map((response: GroupDtoIEnumerableApiResponse) => {
        if (!response.data) {
          return [];
        }
        
        return response.data.map(group => this.enhanceGroupData(group));
      }),
      catchError((error) => {
        const errorMessage = this.extractErrorMessage(error);
        this.setLoadingState(false, errorMessage);
        return throwError(() => errorMessage);
      }),
      finalize(() => {
        this.setLoadingState(false, null);
      })
    );
  }

  /**
   * Get messages for a specific group
   * @param groupId The group ID
   * @param limit Number of messages to fetch (default: 50)
   * @param before Pagination cursor for loading older messages
   * @returns Observable of messages
   */
  getGroupMessages(groupId: string, limit: number = 50, before?: string): Observable<MessageDto[]> {
    return this.messagesService.apiGroupsGroupIdMessagesGet(groupId, before, limit).pipe(
      map((response: MessageDtoIEnumerableApiResponse) => {
        return response.data || [];
      }),
      catchError((error) => {
        const errorMessage = this.extractErrorMessage(error);
        return throwError(() => errorMessage);
      })
    );
  }

  /**
   * Create a new group
   * @param createGroupData Group creation data
   * @returns Observable of created group
   */
  createGroup(createGroupData: CreateGroupDto): Observable<GroupDto> {
    return this.groupsService.apiGroupsPost(createGroupData).pipe(
      map((response) => {
        return response.data || {} as GroupDto;
      }),
      catchError((error) => {
        const errorMessage = this.extractErrorMessage(error);
        return throwError(() => errorMessage);
      })
    );
  }

  /**
   * Join a group using invite code
   * @param joinGroupData Join group data containing invite code
   * @returns Observable of joined group
   */
  joinGroup(joinGroupData: JoinGroupDto): Observable<GroupDto> {
    return this.groupsService.apiGroupsJoinPost(joinGroupData).pipe(
      map((response) => {
        return response.data || {} as GroupDto;
      }),
      catchError((error) => {
        const errorMessage = this.extractErrorMessage(error);
        return throwError(() => errorMessage);
      })
    );
  }

  /**
   * Get current loading state
   * @returns Current loading state
   */
  getLoadingState(): GroupListLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Get loading state as observable for reactive updates
   * @returns Observable of loading state
   */
  getLoadingState$(): Observable<GroupListLoadingState> {
    return of(this.getLoadingState());
  }

  /**
   * Enhanced group data with additional calculated fields
   * @private
   */
  private enhanceGroupData(group: GroupDto): GroupWithLastMessage {
    const enhanced: GroupWithLastMessage = {
      ...group,
      lastMessageContent: group.lastMessage?.content?.toString() || '',
      lastMessageTime: group.lastMessage?.createdAt || '',
      unreadCount: 0 // This would need to be calculated based on read receipts in a real implementation
    };

    return enhanced;
  }

  /**
   * Set internal loading state
   * @private
   */
  private setLoadingState(isLoading: boolean, error: string | null): void {
    this.loadingState = {
      isLoading,
      error
    };
  }

  /**
   * Extract user-friendly error message from API error
   * @private
   */
  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred while loading groups';
  }
}
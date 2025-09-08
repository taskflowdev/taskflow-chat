/**
 * Message Service Proxy
 * 
 * Provides a clean interface to message-related operations,
 * wrapping the generated MessagesService with business logic and error handling.
 */
import { Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { MessagesService } from './api/messages.service';
import { MessageDto } from './model/messageDto';
import { SendMessageDto } from './model/sendMessageDto';
import { MessageDtoIEnumerableApiResponse } from './model/messageDtoIEnumerableApiResponse';

export interface EnhancedMessageDto extends MessageDto {
  isOwn?: boolean;
  formattedTime?: string;
  senderDisplayName?: string;
}

export interface MessageLoadingState {
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export interface ConversationData {
  groupId: string;
  groupName: string;
  memberCount: number;
  messages: EnhancedMessageDto[];
  loadingState: MessageLoadingState;
}

@Injectable({
  providedIn: 'root'
})
export class MessageProxyService {
  private conversationsSubject = new BehaviorSubject<{ [groupId: string]: ConversationData }>({});
  private currentUserId: string | null = null;

  public conversations$ = this.conversationsSubject.asObservable();

  constructor(private messagesService: MessagesService) {
    // In a real implementation, get this from AuthService
    this.currentUserId = 'current-user-id';
  }

  /**
   * Load messages for a specific group
   * @param groupId The group ID
   * @param groupName The group name for display
   * @param memberCount The number of members in the group
   * @param limit Number of messages to fetch (default: 50)
   * @param before Pagination cursor for loading older messages
   * @returns Observable of conversation data
   */
  loadGroupMessages(
    groupId: string, 
    groupName: string, 
    memberCount: number = 0,
    limit: number = 50, 
    before?: string
  ): Observable<ConversationData> {
    this.setLoadingState(groupId, { isLoading: true, isSending: false, error: null });

    return this.messagesService.apiGroupsGroupIdMessagesGet(groupId, before, limit).pipe(
      map((response: MessageDtoIEnumerableApiResponse) => {
        const messages = (response.data || []).map(message => this.enhanceMessageData(message));
        
        const conversationData: ConversationData = {
          groupId,
          groupName,
          memberCount,
          messages,
          loadingState: { isLoading: false, isSending: false, error: null }
        };

        this.updateConversation(groupId, conversationData);
        return conversationData;
      }),
      catchError((error) => {
        const errorMessage = this.extractErrorMessage(error);
        const errorConversation: ConversationData = {
          groupId,
          groupName,
          memberCount,
          messages: [],
          loadingState: { isLoading: false, isSending: false, error: errorMessage }
        };

        this.updateConversation(groupId, errorConversation);
        return throwError(() => errorMessage);
      }),
      finalize(() => {
        this.setLoadingState(groupId, { isLoading: false, isSending: false, error: null });
      })
    );
  }

  /**
   * Send a message to a group
   * @param groupId The group ID
   * @param content The message content
   * @returns Observable of the sent message
   */
  sendMessage(groupId: string, content: string): Observable<MessageDto> {
    this.setLoadingState(groupId, { isLoading: false, isSending: true, error: null });

    const sendMessageDto: SendMessageDto = {
      content: { text: content } // Wrap string content in an object
    };

    return this.messagesService.apiGroupsGroupIdMessagesPost(groupId, sendMessageDto).pipe(
      map((response) => {
        const sentMessage = response.data;
        if (sentMessage) {
          // Add the sent message to the local conversation
          this.addMessageToConversation(groupId, sentMessage);
        }
        return sentMessage || {} as MessageDto;
      }),
      catchError((error) => {
        const errorMessage = this.extractErrorMessage(error);
        this.setLoadingState(groupId, { isLoading: false, isSending: false, error: errorMessage });
        return throwError(() => errorMessage);
      }),
      finalize(() => {
        this.setLoadingState(groupId, { isLoading: false, isSending: false, error: null });
      })
    );
  }

  /**
   * Get conversation data for a specific group
   * @param groupId The group ID
   * @returns ConversationData or null if not found
   */
  getConversation(groupId: string): ConversationData | null {
    const conversations = this.conversationsSubject.getValue();
    return conversations[groupId] || null;
  }

  /**
   * Get all conversations
   * @returns Object containing all conversations by group ID
   */
  getAllConversations(): { [groupId: string]: ConversationData } {
    return this.conversationsSubject.getValue();
  }

  /**
   * Clear conversation data for a specific group
   * @param groupId The group ID
   */
  clearConversation(groupId: string): void {
    const conversations = { ...this.conversationsSubject.getValue() };
    delete conversations[groupId];
    this.conversationsSubject.next(conversations);
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    this.conversationsSubject.next({});
  }

  /**
   * Set current user ID for message ownership determination
   * @param userId The current user ID
   */
  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Enhanced message data with additional calculated fields
   * @private
   */
  private enhanceMessageData(message: MessageDto): EnhancedMessageDto {
    const isOwn = message.senderId === this.currentUserId;
    
    return {
      ...message,
      isOwn,
      formattedTime: this.formatMessageTime(message.createdAt),
      senderDisplayName: isOwn ? 'You' : (message.senderName || 'Unknown User')
    };
  }

  /**
   * Format message timestamp for display
   * @private
   */
  private formatMessageTime(timestamp: string | undefined): string {
    if (!timestamp) return '';

    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / 36e5;

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Update conversation in the subject
   * @private
   */
  private updateConversation(groupId: string, conversationData: ConversationData): void {
    const conversations = { ...this.conversationsSubject.getValue() };
    conversations[groupId] = conversationData;
    this.conversationsSubject.next(conversations);
  }

  /**
   * Add a new message to an existing conversation
   * @private
   */
  private addMessageToConversation(groupId: string, message: MessageDto): void {
    const conversations = { ...this.conversationsSubject.getValue() };
    const conversation = conversations[groupId];
    
    if (conversation) {
      const enhancedMessage = this.enhanceMessageData(message);
      conversation.messages.push(enhancedMessage);
      this.conversationsSubject.next(conversations);
    }
  }

  /**
   * Set loading state for a specific conversation
   * @private
   */
  private setLoadingState(groupId: string, loadingState: MessageLoadingState): void {
    const conversations = { ...this.conversationsSubject.getValue() };
    const conversation = conversations[groupId];
    
    if (conversation) {
      conversation.loadingState = loadingState;
      this.conversationsSubject.next(conversations);
    }
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
    return 'An unexpected error occurred while processing messages';
  }
}
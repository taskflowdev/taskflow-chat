import { Injectable, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MessageDto, GroupDto, SendMessageDto, PresenceDto } from '../../../api/models';
import { GroupsService, MessagesService } from '../../../api/services';
import { TypingDto, GroupMembershipChangedDto } from '../models';
import { ChatRealtimeStore } from '../stores/chat-realtime.store';

/**
 * Connection state interface
 */
export interface ConnectionState {
  state: HubConnectionState;
  error?: string;
}

/**
 * Enterprise-grade SignalR chat service with real-time capabilities
 * 
 * @remarks
 * This service provides:
 * - Automatic reconnection with exponential backoff
 * - Connection lifecycle management
 * - Type-safe event streams
 * - Seamless integration with REST API for history/pagination
 * - OnPush change detection compatibility
 * - Production-ready error handling
 * 
 * Architecture follows strict SRP (Single Responsibility Principle):
 * - SignalR connection management
 * - Event handling and routing
 * - State coordination with ChatRealtimeStore
 * - Minimal public API surface
 */
@Injectable({
  providedIn: 'root'
})
export class ChatRealtimeService implements OnDestroy {
  private hubConnection?: HubConnection;
  private reconnectDelay = 2000; // Start with 2 seconds
  
  // Observables for real-time events
  private readonly messageReceived$ = new Subject<MessageDto>();
  private readonly systemMessageReceived$ = new Subject<MessageDto>();
  private readonly presenceUpdated$ = new Subject<{ groupId: string; presence: PresenceDto[] }>();
  private readonly userTyping$ = new Subject<TypingDto>();
  private readonly groupMembershipChanged$ = new Subject<GroupMembershipChangedDto>();
  private readonly connectionState$ = new BehaviorSubject<ConnectionState>({ 
    state: HubConnectionState.Disconnected 
  });

  constructor(
    private readonly groupsService: GroupsService,
    private readonly messagesService: MessagesService,
    private readonly store: ChatRealtimeStore
  ) {}

  /**
   * Initializes SignalR connection with automatic reconnection
   * 
   * @param apiUrl - Base API URL (e.g., 'https://api.example.com')
   * @param accessToken - JWT access token for authentication
   */
  async connect(apiUrl: string, accessToken: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      console.log('[ChatRealtimeService] Already connected');
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/chathub`, {
        accessTokenFactory: () => accessToken
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s, max 60s
          const delay = Math.min(
            this.reconnectDelay * Math.pow(2, retryContext.previousRetryCount),
            60000
          );
          console.log(`[ChatRealtimeService] Reconnect attempt ${retryContext.previousRetryCount + 1}, waiting ${delay}ms`);
          return delay;
        }
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();
    
    try {
      await this.hubConnection.start();
      console.log('[ChatRealtimeService] SignalR connected successfully');
      this.store.setConnectionStatus(true);
      this.connectionState$.next({ state: HubConnectionState.Connected });
    } catch (error) {
      console.error('[ChatRealtimeService] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.store.setConnectionStatus(false, errorMessage);
      this.connectionState$.next({ 
        state: HubConnectionState.Disconnected,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Disconnects from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      console.log('[ChatRealtimeService] SignalR disconnected');
      this.store.setConnectionStatus(false);
      this.connectionState$.next({ state: HubConnectionState.Disconnected });
    }
  }

  /**
   * Sets up event handlers for SignalR messages
   * Private method - internal connection management
   */
  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Handle incoming messages
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      console.log('[ChatRealtimeService] Message received:', message);
      
      // Add to store
      if (message.groupId) {
        this.store.addMessage(message.groupId, message);
      }
      
      // Emit through appropriate observable
      if (message.sourceType === 'system') {
        this.systemMessageReceived$.next(message);
      } else {
        this.messageReceived$.next(message);
      }
    });

    // Handle presence updates
    this.hubConnection.on('PresenceUpdate', (presenceList: PresenceDto[]) => {
      console.log('[ChatRealtimeService] Presence updated:', presenceList);
      
      // Note: Backend should send groupId with presence updates
      // For now, we emit the event and let components handle context
      // Components should call this when they need presence for a specific group
      this.presenceUpdated$.next({ groupId: '', presence: presenceList });
    });

    // Handle typing indicators
    this.hubConnection.on('UserTyping', (typingInfo: TypingDto) => {
      console.log('[ChatRealtimeService] User typing:', typingInfo);
      this.store.updateTyping(typingInfo);
      this.userTyping$.next(typingInfo);
    });

    // Handle group membership changes
    this.hubConnection.on('GroupMembershipChanged', (membershipChange: GroupMembershipChangedDto) => {
      console.log('[ChatRealtimeService] Group membership changed:', membershipChange);
      this.groupMembershipChanged$.next(membershipChange);
    });

    // Handle reconnection
    this.hubConnection.onreconnecting((error) => {
      console.log('[ChatRealtimeService] Reconnecting...', error);
      this.store.setConnectionStatus(false, error?.message);
      this.connectionState$.next({ 
        state: HubConnectionState.Reconnecting,
        error: error?.message 
      });
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('[ChatRealtimeService] Reconnected:', connectionId);
      this.store.setConnectionStatus(true);
      this.connectionState$.next({ state: HubConnectionState.Connected });
      
      // Rejoin all groups after reconnection
      this.rejoinGroups();
    });

    this.hubConnection.onclose((error) => {
      console.log('[ChatRealtimeService] Connection closed', error);
      this.store.setConnectionStatus(false, error?.message);
      this.connectionState$.next({ 
        state: HubConnectionState.Disconnected,
        error: error?.message 
      });
    });
  }

  /**
   * Rejoins all active groups after reconnection
   * Uses store to track joined groups
   */
  private async rejoinGroups(): Promise<void> {
    const joinedGroups = this.store.getJoinedGroups();
    console.log('[ChatRealtimeService] Rejoining groups:', joinedGroups);
    
    for (const groupId of joinedGroups) {
      try {
        await this.joinGroup(groupId);
      } catch (error) {
        console.error(`[ChatRealtimeService] Failed to rejoin group ${groupId}:`, error);
      }
    }
  }

  /**
   * Joins a SignalR group by group ID or invite code
   * 
   * @param groupIdOrInviteCode - Group ID or invite code to join
   */
  async joinGroup(groupIdOrInviteCode: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }
    
    try {
      await this.hubConnection.invoke('JoinGroup', groupIdOrInviteCode);
      console.log('[ChatRealtimeService] Joined group:', groupIdOrInviteCode);
      this.store.addJoinedGroup(groupIdOrInviteCode);
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to join group:', error);
      throw error;
    }
  }

  /**
   * Leaves a SignalR group
   * 
   * @param groupId - Group ID to leave
   */
  async leaveGroup(groupId: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }
    
    try {
      await this.hubConnection.invoke('LeaveGroup', groupId);
      console.log('[ChatRealtimeService] Left group:', groupId);
      this.store.removeJoinedGroup(groupId);
      this.store.clearGroupMessages(groupId);
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to leave group:', error);
      throw error;
    }
  }

  /**
   * Sends a message to a group via SignalR
   * Real-time message sending - no REST API involved
   * 
   * @param groupId - Target group ID
   * @param message - Message to send
   */
  async sendMessage(groupId: string, message: SendMessageDto): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }
    
    try {
      await this.hubConnection.invoke('SendMessage', groupId, message);
      console.log('[ChatRealtimeService] Message sent to group:', groupId);
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Sends typing indicator to group members
   * Fails silently to avoid disrupting user experience
   * 
   * @param groupId - Target group ID
   * @param isTyping - Whether user is typing
   */
  async sendTypingIndicator(groupId: string, isTyping: boolean): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      return; // Silently fail for typing indicators
    }
    
    try {
      await this.hubConnection.invoke('SendTypingIndicator', groupId, isTyping);
    } catch (error) {
      console.debug('[ChatRealtimeService] Failed to send typing indicator:', error);
      // Don't throw - typing indicators should fail silently
    }
  }

  /**
   * Requests presence information for a group
   * Response will be received via presenceUpdated$ observable
   * 
   * @param groupId - Target group ID
   */
  async getGroupPresence(groupId: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }
    
    try {
      await this.hubConnection.invoke('GetGroupPresence', groupId);
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to get group presence:', error);
      throw error;
    }
  }

  // ==================== REST API Methods for History/Pagination ====================
  
  /**
   * Fetches message history via REST API (with pagination)
   * Use this for initial load and pagination, not for real-time updates
   * 
   * @param groupId - Group ID
   * @param before - Optional timestamp to fetch messages before
   * @param limit - Number of messages to fetch (default: 20)
   */
  async getMessageHistory(
    groupId: string, 
    before?: Date, 
    limit: number = 20
  ): Promise<MessageDto[]> {
    try {
      const response = await this.messagesService.apiGroupsGroupIdMessagesGet$Json({
        groupId,
        before: before?.toISOString(),
        limit
      }).toPromise();
      
      const messages = response?.data || [];
      
      // Store messages in state for consistency
      if (messages.length > 0) {
        this.store.setGroupMessages(groupId, messages);
      }
      
      return messages;
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to fetch message history:', error);
      throw error;
    }
  }

  /**
   * Fetches group list via REST API
   * Use this for initial load only
   */
  async getGroups(): Promise<GroupDto[]> {
    try {
      const response = await this.groupsService.apiGroupsGet$Json().toPromise();
      return response?.data || [];
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to fetch groups:', error);
      throw error;
    }
  }

  /**
   * Fetches presence info via REST API
   * Use SignalR getGroupPresence() for real-time presence instead
   * 
   * @param groupId - Group ID
   */
  async getPresenceViaREST(groupId: string): Promise<PresenceDto[]> {
    try {
      const response = await this.groupsService.apiGroupsIdPresenceGet$Json({ id: groupId }).toPromise();
      const presence = response?.data || [];
      
      // Update store
      if (presence.length > 0) {
        this.store.updatePresence(groupId, presence);
      }
      
      return presence;
    } catch (error) {
      console.error('[ChatRealtimeService] Failed to fetch presence:', error);
      throw error;
    }
  }

  // ==================== Observable Getters ====================
  
  /**
   * Observable for new user messages
   */
  get onMessageReceived(): Observable<MessageDto> {
    return this.messageReceived$.asObservable();
  }

  /**
   * Observable for system messages
   */
  get onSystemMessageReceived(): Observable<MessageDto> {
    return this.systemMessageReceived$.asObservable();
  }

  /**
   * Observable for presence updates
   */
  get onPresenceUpdated(): Observable<{ groupId: string; presence: PresenceDto[] }> {
    return this.presenceUpdated$.asObservable();
  }

  /**
   * Observable for typing indicators
   */
  get onUserTyping(): Observable<TypingDto> {
    return this.userTyping$.asObservable();
  }

  /**
   * Observable for group membership changes
   * Emitted when users are added, removed, or roles change
   */
  get onGroupMembershipChanged(): Observable<GroupMembershipChangedDto> {
    return this.groupMembershipChanged$.asObservable();
  }

  /**
   * Observable for connection state changes
   */
  get connectionState(): Observable<ConnectionState> {
    return this.connectionState$.asObservable();
  }

  /**
   * Current connection status
   */
  get isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.messageReceived$.complete();
    this.systemMessageReceived$.complete();
    this.presenceUpdated$.complete();
    this.userTyping$.complete();
    this.groupMembershipChanged$.complete();
    this.connectionState$.complete();
  }
}

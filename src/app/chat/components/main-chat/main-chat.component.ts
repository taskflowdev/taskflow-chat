import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatConversationComponent, ConversationData } from '../chat-conversation/chat-conversation.component';
import { ChatItemData } from '../chat-item/chat-item.component';
import { ChatMessageData } from '../chat-message/chat-message.component';
import { GroupsServiceProxy, MessageFactoryServiceProxy } from '../../services';
import type { GroupWithMessages } from '../../services';
import { MessageDto } from '../../../api/models/message-dto';
import { CreateGroupDialogComponent } from '../create-group-dialog/create-group-dialog.component';
import { GroupSearchDialogComponent } from '../group-search-dialog/group-search-dialog.component';
import { KeyboardShortcutsDialogComponent } from '../keyboard-shortcuts-dialog/keyboard-shortcuts-dialog.component';
import { GroupInfoDialogComponent } from '../group-info-dialog/group-info-dialog.component';
import { ShortcutHandlerService } from '../../../shared/services/shortcut-handler.service';
import { ShortcutActionTypes, ShortcutContext } from '../../../shared/models/keyboard-shortcut.model';
import { Subscription } from 'rxjs';
import { KeyboardShortcutService } from '../../../shared/services/keyboard-shortcut.service';
import { ChatRealtimeService } from '../../../core/realtime';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatSidebarComponent,
    ChatConversationComponent,
    CreateGroupDialogComponent,
    GroupSearchDialogComponent,
    KeyboardShortcutsDialogComponent,
    GroupInfoDialogComponent
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss'
})
export class MainChatComponent implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  selectedChatId: string | null = null;
  currentConversation: ConversationData | null = null;
  chats: ChatItemData[] = [];
  loading: boolean = true;
  loadingMessages: boolean = false;
  currentTypingUsers: string[] = []; // Users currently typing in the selected group

  // Mobile responsiveness state
  isMobileView: boolean = false;
  showSidebar: boolean = true; // On mobile, false when conversation is open

  // Dialog state
  showCreateGroupDialog: boolean = false;
  showSearchGroupDialog: boolean = false;
  showKeyboardShortcutsDialog: boolean = false;
  showGroupInfoDialog: boolean = false;

  // Track if groups have been loaded to prevent duplicate API calls
  private groupsLoaded: boolean = false;

  // Subscriptions
  private shortcutSubscription?: Subscription;
  private messageReceivedSubscription?: Subscription;
  private systemMessageSubscription?: Subscription;
  private typingSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private groupsServiceProxy: GroupsServiceProxy,
    private messageFactoryService: MessageFactoryServiceProxy,
    private keyboardShortcutService: KeyboardShortcutService,
    private shortcutHandlerService: ShortcutHandlerService,
    private chatRealtimeService: ChatRealtimeService,
    private appConfigService: AppConfigService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();

    // Check if mobile view initially
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      window.addEventListener('resize', () => this.checkMobileView());
      
      // Initialize SignalR connection
      this.initializeRealtimeConnection();
    }

    // Subscribe to user changes only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        if (!user) {
          this.router.navigate(['/auth/login']);
        } else if (!this.groupsLoaded) {
          // Only load groups if they haven't been loaded yet
          this.loadUserGroups();
        }
      });

      // Load initial data if user is already authenticated
      // Only load if chats haven't been loaded yet
      if (this.user && !this.groupsLoaded && this.chats.length === 0) {
        this.loadUserGroups();
      }

      // Listen to URL fragment changes for dialogs
      this.route.fragment.subscribe(fragment => {
        this.showCreateGroupDialog = fragment === 'new-group';
        this.showSearchGroupDialog = fragment === 'search-groups';
        this.showKeyboardShortcutsDialog = fragment === 'keyboard-shortcuts';
        this.showGroupInfoDialog = fragment === 'group-info';

        // Update shortcut context based on dialog state
        this.updateShortcutContext();
      });

      // Listen to route parameters for group selection
      this.route.params.subscribe(params => {
        const groupId = params['groupId'];
        if (groupId && this.chats.length > 0) {
          // Only load if we have chats loaded and groupId exists in the list
          // Also check if this is a different chat to avoid reloading the same chat
          const chatExists = this.chats.some(chat => chat.groupId === groupId);
          if (chatExists && this.selectedChatId !== groupId) {
            this.selectChatById(groupId);
          }
        }
      });

      // Subscribe to keyboard shortcuts
      this.shortcutSubscription = this.shortcutHandlerService.actionRequested$.subscribe(action => {
        this.handleShortcutAction(action);
      });

      // Set initial context
      this.updateShortcutContext();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.shortcutSubscription) {
      this.shortcutSubscription.unsubscribe();
    }
    if (this.messageReceivedSubscription) {
      this.messageReceivedSubscription.unsubscribe();
    }
    if (this.systemMessageSubscription) {
      this.systemMessageSubscription.unsubscribe();
    }
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }
  }

  /**
   * Initialize SignalR real-time connection
   * Connects to chat hub and subscribes to real-time events
   */
  private async initializeRealtimeConnection(): Promise<void> {
    try {
      const apiUrl = this.appConfigService.getApiUrl();
      const token = this.authService.getToken();

      if (!token) {
        console.log('[MainChat] No auth token available, skipping SignalR connection');
        return;
      }

      console.log('[MainChat] Initializing SignalR connection...');
      await this.chatRealtimeService.connect(apiUrl, token);
      console.log('[MainChat] SignalR connected successfully');

      // Subscribe to real-time message events
      this.subscribeToRealtimeEvents();
    } catch (error) {
      console.error('[MainChat] Failed to initialize SignalR:', error);
      // App continues to work with REST API only
    }
  }

  /**
   * Subscribe to real-time events from SignalR
   */
  private subscribeToRealtimeEvents(): void {
    // Subscribe to new messages
    this.messageReceivedSubscription = this.chatRealtimeService.onMessageReceived.subscribe(message => {
      this.handleRealtimeMessage(message);
    });

    // Subscribe to system messages
    this.systemMessageSubscription = this.chatRealtimeService.onSystemMessageReceived.subscribe(message => {
      this.handleRealtimeMessage(message);
    });

    // Subscribe to typing indicators
    this.typingSubscription = this.chatRealtimeService.onUserTyping.subscribe(typingInfo => {
      this.handleTypingIndicator(typingInfo);
    });
  }

  /**
   * Handle real-time message received from SignalR
   */
  private handleRealtimeMessage(message: MessageDto): void {
    if (!message.groupId) return;

    // Update the chat list with the new message
    const chat = this.chats.find(c => c.groupId === message.groupId);
    if (chat) {
      chat.lastMessage = message;
      chat.lastMessageTime = message.createdAt || new Date().toISOString();
      
      // If this is not the currently selected chat, increment unread count
      if (message.groupId !== this.selectedChatId) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
      
      // Move chat to top of list
      this.chats = [chat, ...this.chats.filter(c => c.groupId !== message.groupId)];
    }

    // If this message belongs to the currently open conversation, handle it
    if (this.currentConversation && message.groupId === this.currentConversation.groupId) {
      const chatMessage = this.mapMessageToChatMessage(message);
      
      // Check for exact duplicate by messageId
      const existsByMessageId = this.currentConversation.messages.some(m => m.messageId === chatMessage.messageId);
      
      if (!existsByMessageId) {
        // Check if this is replacing an optimistic message (own message from this user)
        if (message.senderId === this.user?.id) {
          // Find and remove optimistic message that matches this real message
          // Match by: same sender, similar timestamp (within 5 seconds), and starts with 'temp-'
          const messageTimestamp = new Date(message.createdAt || '').getTime();
          const optimisticIndex = this.currentConversation.messages.findIndex(m => {
            if (!m.messageId.startsWith('temp-')) return false;
            if (m.senderId !== message.senderId) return false;
            
            // Check if timestamps are close (within 5 seconds)
            const optimisticTimestamp = new Date(m.createdAt).getTime();
            const timeDiff = Math.abs(messageTimestamp - optimisticTimestamp);
            return timeDiff < 5000; // 5 seconds tolerance
          });
          
          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one at the same position to maintain order
            this.currentConversation.messages[optimisticIndex] = chatMessage;
            console.log('[MainChat] Replaced optimistic message with real message');
            return;
          }
        }
        
        // No optimistic message found, just add the new message
        this.currentConversation.messages.push(chatMessage);
      }
    }
  }

  /**
   * Handle typing indicator from SignalR
   */
  private handleTypingIndicator(typingInfo: { groupId: string; userId: string; userName: string; isTyping: boolean }): void {
    // Only process if it's for the currently selected chat and not from current user
    if (typingInfo.groupId !== this.selectedChatId || typingInfo.userId === this.user?.id) {
      return;
    }

    if (typingInfo.isTyping) {
      // Add user to typing list if not already present
      if (!this.currentTypingUsers.includes(typingInfo.userName)) {
        this.currentTypingUsers = [...this.currentTypingUsers, typingInfo.userName];
      }
    } else {
      // Remove user from typing list
      this.currentTypingUsers = this.currentTypingUsers.filter(name => name !== typingInfo.userName);
    }
  }

  /**
   * Handle user typing event from chat conversation component
   */
  async onUserTyping(isTyping: boolean): Promise<void> {
    if (!this.selectedChatId || !this.chatRealtimeService.isConnected) {
      return;
    }

    try {
      await this.chatRealtimeService.sendTypingIndicator(this.selectedChatId, isTyping);
    } catch (error) {
      // Silently fail - typing indicators are not critical
      console.debug('[MainChat] Failed to send typing indicator:', error);
    }
  }

  /**
   * Update shortcut context based on current UI state
   * This ensures shortcuts work correctly in different contexts
   * Enterprise-level context management with granular control
   */
  private updateShortcutContext(): void {
    // Priority 1: Dialog contexts (most specific)
    if (this.showSearchGroupDialog) {
      // In search dialog - enable search-specific shortcuts
      this.keyboardShortcutService.setContext(ShortcutContext.SEARCH_DIALOG);
      return;
    }

    if (this.showCreateGroupDialog || this.showKeyboardShortcutsDialog || this.showGroupInfoDialog) {
      // In other dialogs - general dialog context
      this.keyboardShortcutService.setContext(ShortcutContext.DIALOG_OPEN);
      return;
    }

    // Priority 2: Chat-related contexts
    if (this.selectedChatId) {
      // A specific chat is selected - enable chat-specific shortcuts
      this.keyboardShortcutService.setContext(ShortcutContext.CHAT_SELECTED);
      return;
    }

    // Priority 3: Check if we're in chat view but no chat selected
    // This allows navigation shortcuts (Alt+Up/Down) to work
    if (this.chats.length > 0) {
      this.keyboardShortcutService.setContext(ShortcutContext.CHAT_VIEW);
      return;
    }

    // Priority 4: Global context (fallback)
    this.keyboardShortcutService.setContext(ShortcutContext.GLOBAL);
  }

  /**
   * Handle keyboard shortcut actions
   * Now only handles actions that are specific to this component
   * General navigation actions are handled by ShortcutHandlerService
   */
  private handleShortcutAction(action: ShortcutActionTypes): void {
    switch (action) {
      case ShortcutActionTypes.PREV_CHAT:
        this.navigateToPreviousChat();
        break;
      case ShortcutActionTypes.NEXT_CHAT:
        this.navigateToNextChat();
        break;
      case ShortcutActionTypes.BACK_TO_LIST:
        if (this.isMobileView) {
          this.onBackToChats();
        }
        break;
      case ShortcutActionTypes.GROUP_INFO:
        // Only open if a chat is selected
        if (this.selectedChatId) {
          this.openGroupInfo();
        }
        break;
      case ShortcutActionTypes.FOCUS_SEARCH:
        // Only focus search input if in search dialog
        if (this.showSearchGroupDialog) {
          this.focusSearchInput();
        }
        break;
      case ShortcutActionTypes.CLOSE_DIALOG:
        this.closeAllDialogs();
        break;
      // Other actions are handled by ShortcutHandlerService
    }
  }

  /**
   * Navigate to previous chat
   * Enterprise-level navigation with edge case handling
   */
  private navigateToPreviousChat(): void {
    if (this.chats.length === 0) return;

    // If no chat is selected, select the last chat
    if (!this.selectedChatId) {
      const lastChat = this.chats[this.chats.length - 1];
      if (lastChat) {
        this.onChatSelect(lastChat.groupId);
      }
      return;
    }

    const currentIndex = this.chats.findIndex(chat => chat.groupId === this.selectedChatId);
    if (currentIndex === -1) return;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : this.chats.length - 1;
    const prevChat = this.chats[prevIndex];

    if (prevChat) {
      this.onChatSelect(prevChat.groupId);
    }
  }

  /**
   * Navigate to next chat
   * Enterprise-level navigation with edge case handling
   */
  private navigateToNextChat(): void {
    if (this.chats.length === 0) return;

    // If no chat is selected, select the first chat
    if (!this.selectedChatId) {
      const firstChat = this.chats[0];
      if (firstChat) {
        this.onChatSelect(firstChat.groupId);
      }
      return;
    }

    const currentIndex = this.chats.findIndex(chat => chat.groupId === this.selectedChatId);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex < this.chats.length - 1 ? currentIndex + 1 : 0;
    const nextChat = this.chats[nextIndex];

    if (nextChat) {
      this.onChatSelect(nextChat.groupId);
    }
  }

  /**
   * Close all open dialogs
   */
  private closeAllDialogs(): void {
    if (this.showCreateGroupDialog || this.showSearchGroupDialog || this.showGroupInfoDialog) {
      this.router.navigate([], { fragment: undefined, queryParamsHandling: 'preserve' });
    }
    if (this.showKeyboardShortcutsDialog) {
      this.showKeyboardShortcutsDialog = false;
    }
  }

  /**
   * Open group info dialog for the currently selected chat
   * Only works when a chat is selected (CHAT_SELECTED context)
   */
  private openGroupInfo(): void {
    if (this.selectedChatId) {
      this.router.navigate([], { fragment: 'group-info', queryParamsHandling: 'preserve' });
    }
  }

  /**
   * Focus the search input in the search dialog
   * Only works in SEARCH_DIALOG context
   */
  private focusSearchInput(): void {
    // This method can be enhanced to actually focus the search input
    // For now, it's handled by the search dialog component itself
    // The shortcut ensures it's only triggered in the right context
  }

  /**
   * Handle group deletion
   * 
   * This method:
   * 1. Removes the deleted group from the chat list
   * 2. Clears the selected chat
   * 3. Navigates back to the chat list
   * 4. Updates the UI state
   * 
   * @param deletedGroupId - ID of the deleted group
   */
  onGroupDeleted(deletedGroupId: string): void {
    // Remove the deleted group from the chats list using groupId property
    this.chats = this.chats.filter(chat => chat.groupId !== deletedGroupId);
    
    // Clear selected chat and conversation
    this.selectedChatId = null;
    this.currentConversation = null;
    
    // Show sidebar in mobile view
    if (this.isMobileView) {
      this.showSidebar = true;
    }
    
    // Update context to CHAT_VIEW
    this.updateShortcutContext();
    
    // Navigate to chat list (clear fragment)
    this.router.navigate(['/chat'], {
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Close keyboard shortcuts dialog
   */
  onKeyboardShortcutsClosed(): void {
    this.showKeyboardShortcutsDialog = false;
  }

  /**
   * Check if current viewport is mobile
   */
  private checkMobileView(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth <= 768;

      // Reset sidebar visibility when switching from mobile to desktop
      if (!this.isMobileView) {
        this.showSidebar = true;
      }
    }
  }

  /**
   * Loads user groups from API
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   */
  private loadUserGroups(forceRefresh: boolean = false): void {
    this.loading = true;
    this.groupsServiceProxy.getUserGroups(forceRefresh).subscribe({
      next: (groups: GroupWithMessages[]) => {
        this.chats = groups.map(group => this.mapGroupToChatItem(group));
        this.loading = false;
        this.groupsLoaded = true; // Mark groups as loaded

        // After loading groups, check if there's a groupId in the route
        if (isPlatformBrowser(this.platformId)) {
          const groupId = this.route.snapshot.params['groupId'];
          if (groupId) {
            const chatExists = this.chats.some(chat => chat.groupId === groupId);
            if (chatExists) {
              this.selectChatById(groupId);
            }
          }
        }
      },
      error: (error) => {
        console.error('Failed to load user groups:', error);
        this.loading = false;
        this.groupsLoaded = true; // Mark as loaded even on error to prevent infinite retries
      }
    });
  }

  /**
   * Maps a GroupWithMessages to ChatItemData format
   */
  private mapGroupToChatItem(group: GroupWithMessages): ChatItemData {
    return {
      groupId: group.groupId || '',
      name: group.name || 'Unnamed Group',
      lastMessage: group.lastMessage, // Now passing MessageDto instead of string
      lastMessageTime: group.lastMessage?.createdAt || new Date().toISOString(),
      unreadCount: group.unreadCount || 0
    };
  }

  onChatSelect(groupId: string): void {
    // Navigate to the group URL
    // The route params subscription will handle loading the chat
    this.router.navigate(['/chats/group', groupId], {
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Selects a chat by ID and loads its messages
   */
  private async selectChatById(groupId: string): Promise<void> {
    this.selectedChatId = groupId;
    this.loadGroupMessages(groupId);

    // Join SignalR group for real-time updates
    if (this.chatRealtimeService.isConnected) {
      try {
        await this.chatRealtimeService.joinGroup(groupId);
        console.log('[MainChat] Joined SignalR group:', groupId);
      } catch (error) {
        console.error('[MainChat] Failed to join SignalR group:', error);
        // Continue with REST API only
      }
    }

    // On mobile, hide sidebar when a chat is selected
    if (this.isMobileView) {
      this.showSidebar = false;
    }

    // Mark chat as read (update unread count)
    const chat = this.chats.find(c => c.groupId === groupId);
    if (chat) {
      chat.unreadCount = 0;
    }

    // Update shortcut context
    this.updateShortcutContext();
  }

  /**
   * Go back to chat list (mobile only)
   */
  onBackToChats(): void {
    if (this.isMobileView) {
      this.showSidebar = true;
      this.selectedChatId = null;
      this.currentConversation = null;
      // Navigate back to chats list
      this.router.navigate(['/chats']);

      // Update shortcut context
      this.updateShortcutContext();
    }
  }

  /**
   * Handles group creation event - refreshes chat list instead of full page reload
   */
  onGroupCreated(): void {
    this.loadUserGroups(true); // Force refresh after creating a group
  }

  /**
   * Handles group update event - refreshes chat list and current conversation
   */
  onGroupUpdated(): void {
    this.loadUserGroups(true); // Force refresh after updating a group
    // Reload current conversation to get updated details
    if (this.selectedChatId) {
      this.loadGroupMessages(this.selectedChatId);
    }
  }

  /**
   * Loads messages for a specific group
   */
  private loadGroupMessages(groupId: string): void {
    this.loadingMessages = true;
    this.currentConversation = null;

    // Load group details and messages in parallel
    const groupDetails$ = this.groupsServiceProxy.getGroupDetails(groupId);
    const messages$ = this.groupsServiceProxy.getGroupMessages(groupId);

    groupDetails$.subscribe({
      next: (groupDetails) => {
        if (groupDetails) {
          messages$.subscribe({
            next: (messages) => {
              this.currentConversation = {
                groupId: groupDetails.groupId || '',
                groupName: groupDetails.name || 'Unnamed Group',
                memberCount: groupDetails.memberCount || 0,
                messages: messages.map(msg => this.mapMessageToChatMessage(msg))
              };
              this.loadingMessages = false;
            },
            error: (error) => {
              console.error('Failed to load group messages:', error);
              this.loadingMessages = false;
            }
          });
        } else {
          this.loadingMessages = false;
        }
      },
      error: (error) => {
        console.error('Failed to load group details:', error);
        this.loadingMessages = false;
      }
    });
  }

  /**
   * Extracts displayable text from message content based on content type
   */
  private extractContentText(content: any, contentType?: string): string {
    if (!content) return '';
    
    // If content is already a string, return it
    if (typeof content === 'string') return content;
    
    // Extract based on content type
    switch (contentType) {
      case 'text':
        return content.text || '';
      case 'image':
        return content.fileName || 'Image';
      case 'video':
        return content.fileName || 'Video';
      case 'poll':
        return content.question || 'Poll';
      case 'file':
        return content.fileName || 'File';
      default:
        // Fallback: try common properties
        return content.text || content.fileName || content.question || '';
    }
  }

  /**
   * Formats system message content based on message type
   */
  private formatSystemMessage(message: MessageDto): string {
    const senderName = message.senderName || 'Someone';
    
    // Try to extract text from content if available
    const contentText = this.extractContentText(message.content, message.contentType);
    
    // If content has text, use it; otherwise format based on message type
    if (contentText) {
      return contentText;
    }
    
    switch (message.messageType) {
      case 'groupCreated':
        return `Group was created by ${senderName}`;
      case 'groupUpdated':
        return `Group was updated by ${senderName}`;
      case 'userJoined':
        return `${senderName} joined the group`;
      case 'userLeft':
        return `${senderName} left the group`;
      case 'memberRoleChanged':
        return `Member role was changed by ${senderName}`;
      case 'inviteCodeRegenerated':
        return `Group invite code was regenerated by ${senderName}`;
      case 'groupDeleted':
        return `Group was deleted by ${senderName}`;
      default:
        return 'System message';
    }
  }

  /**
   * Maps a MessageDto to ChatMessageData format
   */
  private mapMessageToChatMessage(message: MessageDto): ChatMessageData {
    const isSystemMessage = message.sourceType === 'system';
    
    return {
      messageId: message.messageId || '',
      senderId: message.senderId || '',
      senderName: message.senderName || 'Unknown',
      content: isSystemMessage 
        ? this.formatSystemMessage(message)
        : this.extractContentText(message.content, message.contentType),
      contentType: message.contentType,
      contentData: message.content,
      createdAt: message.createdAt || new Date().toISOString(),
      isOwn: message.senderId === this.user?.id,
      isSystemMessage: isSystemMessage,
      messageType: message.messageType
    };
  }

  /**
   * Handles sending messages with proper validation and type handling.
   * Uses SignalR for real-time message delivery.
   * Falls back to REST API if SignalR is not connected.
   */
  async onSendMessage(messageContent: string): Promise<void> {
    if (!this.currentConversation || !this.user || !messageContent.trim()) return;

    // Validate message content
    const validation = this.messageFactoryService.validateMessageContent('text', messageContent);
    if (!validation.isValid) {
      console.error('Message validation failed:', validation.error);
      return;
    }

    // Optimistically add message to UI
    const optimisticMessage: ChatMessageData = {
      messageId: 'temp-' + Date.now().toString(),
      senderId: this.user.id,
      senderName: 'You',
      content: messageContent,
      createdAt: new Date().toISOString(),
      isOwn: true
    };

    this.currentConversation.messages.push(optimisticMessage);

    // Update last message in chat list
    const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
    if (chat) {
      // Create a temporary MessageDto for the optimistic update
      const tempMessageDto: MessageDto = {
        messageId: optimisticMessage.messageId,
        senderId: optimisticMessage.senderId,
        senderName: optimisticMessage.senderName,
        content: { contentType: 'text' }, // Use basic TextContent structure
        createdAt: optimisticMessage.createdAt,
        contentType: 'text',
        messageType: 'userMessage',
        sourceType: 'user'
      };
      chat.lastMessage = tempMessageDto;
      chat.lastMessageTime = new Date().toISOString();
    }

    // Send message via SignalR if connected, otherwise use REST API
    if (this.chatRealtimeService.isConnected) {
      try {
        // Use message factory to create properly formatted SendMessageDto
        const messageDto = this.messageFactoryService.createTextMessageDto(messageContent);
        
        await this.chatRealtimeService.sendMessage(this.currentConversation.groupId, messageDto);
        console.log('[MainChat] Message sent via SignalR');
        
        // The real message will arrive via SignalR event and replace the optimistic one
        // in handleRealtimeMessage() by matching sender and timestamp
      } catch (error) {
        console.error('[MainChat] Failed to send via SignalR, falling back to REST:', error);
        this.sendMessageViaREST(messageContent, optimisticMessage);
      }
    } else {
      // SignalR not connected, use REST API
      this.sendMessageViaREST(messageContent, optimisticMessage);
    }
  }

  /**
   * Sends message via REST API (fallback)
   */
  private sendMessageViaREST(messageContent: string, optimisticMessage: ChatMessageData): void {
    this.messageFactoryService.sendTextMessage(this.currentConversation!.groupId, messageContent).subscribe({
      next: (sentMessage) => {
        // Replace optimistic message with real one if API returns it
        if (sentMessage && this.currentConversation) {
          const index = this.currentConversation.messages.findIndex(
            msg => msg.messageId === optimisticMessage.messageId
          );
          if (index !== -1) {
            this.currentConversation.messages[index] = this.mapMessageToChatMessage(sentMessage);
          }

          // Update the chat list with the real message
          const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
          if (chat) {
            chat.lastMessage = sentMessage;
          }
        }
      },
      error: (error) => {
        console.error('Failed to send message via REST:', error);
        // Remove optimistic message on error
        if (this.currentConversation) {
          const index = this.currentConversation.messages.findIndex(
            msg => msg.messageId === optimisticMessage.messageId
          );
          if (index !== -1) {
            this.currentConversation.messages.splice(index, 1);
          }
        }
      }
    });
  }

  /**
   * Sends an image message to the current conversation.
   * Future enhancement for file upload functionality.
   */
  onSendImageMessage(imageData: { url: string; fileName: string; fileSize: number }): void {
    if (!this.currentConversation || !this.user) return;

    this.messageFactoryService.sendImageMessage(this.currentConversation.groupId, imageData).subscribe({
      next: (sentMessage) => {
        if (sentMessage && this.currentConversation) {
          this.currentConversation.messages.push(this.mapMessageToChatMessage(sentMessage));

          // Update chat list
          const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
          if (chat) {
            chat.lastMessage = sentMessage;
            chat.lastMessageTime = new Date().toISOString();
          }
        }
      },
      error: (error) => {
        console.error('Failed to send image message:', error);
      }
    });
  }

  /**
   * Sends a poll message to the current conversation.
   * Future enhancement for poll creation functionality.
   */
  onSendPollMessage(pollData: { question: string; options: string[] }): void {
    if (!this.currentConversation || !this.user) return;

    this.messageFactoryService.sendPollMessage(this.currentConversation.groupId, pollData).subscribe({
      next: (sentMessage) => {
        if (sentMessage && this.currentConversation) {
          this.currentConversation.messages.push(this.mapMessageToChatMessage(sentMessage));

          // Update chat list
          const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
          if (chat) {
            chat.lastMessage = sentMessage;
            chat.lastMessageTime = new Date().toISOString();
          }
        }
      },
      error: (error) => {
        console.error('Failed to send poll message:', error);
      }
    });
  }

  /**
   * Handle search group dialog result
   */
  onGroupFromSearchSelected(groupId: string): void {
    // Navigate to the selected group
    this.router.navigate(['/chat/group', groupId]);
  }

  /**
   * Handle when a user joins a group from search dialog
   * Reload the groups list to include the newly joined group
   */
  onGroupJoined(): void {
    this.loadUserGroups(true); // Force refresh after joining a group
  }
}

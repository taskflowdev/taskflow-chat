import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
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

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatSidebarComponent,
    ChatConversationComponent,
    CreateGroupDialogComponent,
    GroupSearchDialogComponent
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss'
})
export class MainChatComponent implements OnInit {
  user: AuthUser | null = null;
  selectedChatId: string | null = null;
  currentConversation: ConversationData | null = null;
  chats: ChatItemData[] = [];
  loading: boolean = true;
  loadingMessages: boolean = false;

  // Mobile responsiveness state
  isMobileView: boolean = false;
  showSidebar: boolean = true; // On mobile, false when conversation is open

  // Dialog state
  showCreateGroupDialog: boolean = false;
  showSearchGroupDialog: boolean = false;



  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private groupsServiceProxy: GroupsServiceProxy,
    private messageFactoryService: MessageFactoryServiceProxy,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();

    // Check if mobile view initially
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      window.addEventListener('resize', () => this.checkMobileView());
    }

    // Subscribe to user changes only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        if (!user) {
          this.router.navigate(['/auth/login']);
        } else {
          this.loadUserGroups();
        }
      });

      // Load initial data if user is already authenticated
      if (this.user) {
        this.loadUserGroups();
      }

      // Listen to URL fragment changes for dialogs
      this.route.fragment.subscribe(fragment => {
        this.showCreateGroupDialog = fragment === 'new-group';
        this.showSearchGroupDialog = fragment === 'search-groups';
      });

      // Listen to route parameters for group selection
      this.route.params.subscribe(params => {
        const groupId = params['groupId'];
        if (groupId && this.chats.length > 0) {
          // Only load if we have chats loaded and groupId exists in the list
          const chatExists = this.chats.some(chat => chat.groupId === groupId);
          if (chatExists) {
            this.selectChatById(groupId);
          }
        }
      });
    }
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
   */
  private loadUserGroups(): void {
    this.loading = true;
    this.groupsServiceProxy.getUserGroups().subscribe({
      next: (groups: GroupWithMessages[]) => {
        this.chats = groups.map(group => this.mapGroupToChatItem(group));
        this.loading = false;
        
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
    this.router.navigate(['/chats/group', groupId], { 
      queryParamsHandling: 'preserve' 
    });
    
    this.selectChatById(groupId);
  }

  /**
   * Selects a chat by ID and loads its messages
   */
  private selectChatById(groupId: string): void {
    this.selectedChatId = groupId;
    this.loadGroupMessages(groupId);

    // On mobile, hide sidebar when a chat is selected
    if (this.isMobileView) {
      this.showSidebar = false;
    }

    // Mark chat as read (update unread count)
    const chat = this.chats.find(c => c.groupId === groupId);
    if (chat) {
      chat.unreadCount = 0;
    }
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
    }
  }

  /**
   * Handles group creation event - refreshes chat list instead of full page reload
   */
  onGroupCreated(): void {
    this.loadUserGroups();
  }

  /**
   * Handles group update event - refreshes chat list and current conversation
   */
  onGroupUpdated(): void {
    this.loadUserGroups();
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
   * Maps a MessageDto to ChatMessageData format
   */
  private mapMessageToChatMessage(message: MessageDto): ChatMessageData {
    return {
      messageId: message.messageId || '',
      senderId: message.senderId || '',
      senderName: message.senderName || 'Unknown',
      content: message.content?.toString() || '',
      createdAt: message.createdAt || new Date().toISOString(),
      isOwn: message.senderId === this.user?.id
    };
  }

  /**
   * Handles sending messages with proper validation and type handling.
   * Supports text messages and can be extended for other content types.
   */
  onSendMessage(messageContent: string): void {
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

    // Send message via the message factory service
    this.messageFactoryService.sendTextMessage(this.currentConversation.groupId, messageContent).subscribe({
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
        console.error('Failed to send message:', error);
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
    this.router.navigate(['/chats/group', groupId]);
  }
}

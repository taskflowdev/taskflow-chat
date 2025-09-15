import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatConversationComponent, ConversationData } from '../chat-conversation/chat-conversation.component';
import { ChatItemData } from '../chat-item/chat-item.component';
import { ChatMessageData } from '../chat-message/chat-message.component';
import { MessagesServiceProxy, GroupWithMessages } from '../../../shared/services/messages.service.proxy';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatSidebarComponent,
    ChatConversationComponent
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



  constructor(
    private authService: AuthService,
    private router: Router,
    private messagesServiceProxy: MessagesServiceProxy,
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
    this.messagesServiceProxy.getUserGroups().subscribe({
      next: (groups: GroupWithMessages[]) => {
        this.chats = groups.map(group => this.mapGroupToChatItem(group));
        this.loading = false;
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
    const lastMessagePreview = group.lastMessage 
      ? this.messagesServiceProxy.getMessagePreview(group.lastMessage)
      : 'No messages yet';
    
    return {
      groupId: group.groupId || '',
      name: group.name || 'Unnamed Group',
      lastMessage: lastMessagePreview,
      lastMessageTime: group.lastMessage?.createdAt || new Date().toISOString(),
      lastMessageType: group.lastMessage?.contentType || 'text',
      unreadCount: group.unreadCount || 0
    };
  }

  onChatSelect(groupId: string): void {
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
    }
  }

  /**
   * Loads messages for a specific group
   */
  private loadGroupMessages(groupId: string): void {
    this.loadingMessages = true;
    this.currentConversation = null;

    // Load group details and messages in parallel
    const groupDetails$ = this.messagesServiceProxy.getGroupDetails(groupId);
    const messages$ = this.messagesServiceProxy.getGroupMessages(groupId);

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
  private mapMessageToChatMessage(message: any): ChatMessageData {
    return {
      messageId: message.messageId || '',
      senderId: message.senderId || '',
      senderName: message.senderName || 'Unknown',
      content: this.messagesServiceProxy.getMessagePreview(message),
      contentType: message.contentType,
      messageContent: message.content,
      createdAt: message.createdAt || new Date().toISOString(),
      isOwn: message.senderId === this.user?.id
    };
  }

  onSendMessage(messageContent: string): void {
    if (!this.currentConversation || !this.user) return;

    // Optimistically add message to UI
    const optimisticMessage: ChatMessageData = {
      messageId: 'temp-' + Date.now().toString(),
      senderId: this.user.id,
      senderName: 'You',
      content: messageContent,
      contentType: 'text',
      createdAt: new Date().toISOString(),
      isOwn: true
    };

    this.currentConversation.messages.push(optimisticMessage);

    // Update last message in chat list
    const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
    if (chat) {
      chat.lastMessage = messageContent;
      chat.lastMessageTime = new Date().toISOString();
      chat.lastMessageType = 'text';
    }

    // Send message via API (when available)
    this.messagesServiceProxy.sendTextMessage(this.currentConversation.groupId, messageContent).subscribe({
      next: (sentMessage) => {
        // Replace optimistic message with real one if API returns it
        if (sentMessage && this.currentConversation) {
          const index = this.currentConversation.messages.findIndex(
            msg => msg.messageId === optimisticMessage.messageId
          );
          if (index !== -1) {
            this.currentConversation.messages[index] = this.mapMessageToChatMessage(sentMessage);
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
}

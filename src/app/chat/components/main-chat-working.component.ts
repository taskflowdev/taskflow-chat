import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatConversationComponent, ConversationData } from '../chat-conversation/chat-conversation.component';
import { ChatItemData } from '../chat-item/chat-item.component';
import { ChatMessageData } from '../chat-message/chat-message.component';
import { SimpleMessageDto, SimpleGroupDto } from '../../../shared/models/simple-chat.models';
import { MessageContentServiceProxy } from '../../../services/message-content.service.proxy';
import { MockDataServiceProxy } from '../../../services/mock-data.service.proxy';

// Mock AuthService for demonstration
interface MockAuthUser {
  id: string;
  userName: string;
  email: string;
  fullName: string;
}

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
  // Mock current user for demonstration
  user: MockAuthUser = {
    id: 'current-user',
    userName: 'demo-user',
    email: 'demo@example.com',
    fullName: 'Demo User'
  };
  
  selectedChatId: string | null = null;
  currentConversation: ConversationData | null = null;
  chats: ChatItemData[] = [];
  loading: boolean = true;
  loadingMessages: boolean = false;

  // Mobile responsiveness state
  isMobileView: boolean = false;
  showSidebar: boolean = true; // On mobile, false when conversation is open

  constructor(
    private router: Router,
    private messageContentService: MessageContentServiceProxy,
    private mockDataService: MockDataServiceProxy,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    // Check if mobile view initially
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      window.addEventListener('resize', () => this.checkMobileView());
    }

    // Load initial mock data
    this.loadUserGroups();
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
   * Loads user groups from mock service to demonstrate functionality
   */
  private loadUserGroups(): void {
    this.loading = true;
    this.mockDataService.getMockUserGroups().subscribe({
      next: (groups) => {
        this.chats = groups.map(group => this.mapGroupToChatItem(group));
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load user groups:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Maps a SimpleGroupDto with lastMessage to ChatItemData format
   */
  private mapGroupToChatItem(group: SimpleGroupDto & { lastMessage?: SimpleMessageDto }): ChatItemData {
    return {
      groupId: group.groupId || '',
      name: group.name || 'Unnamed Group',
      lastMessage: group.lastMessage, // Now SimpleMessageDto
      lastMessageTime: group.lastMessage?.createdAt || new Date().toISOString(),
      unreadCount: 0 // Mock unread count for demonstration
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
   * Loads messages for a specific group using mock data
   */
  private loadGroupMessages(groupId: string): void {
    this.loadingMessages = true;
    this.currentConversation = null;

    // Load group details and messages using mock service
    const groupDetails$ = this.mockDataService.getMockGroupDetails(groupId);

    groupDetails$.subscribe({
      next: (groupDetails: any) => {
        if (groupDetails) {
          this.mockDataService.getMockGroupMessages(groupId).subscribe({
            next: (messages: any) => {
              this.currentConversation = {
                groupId: groupDetails.groupId || '',
                groupName: groupDetails.name || 'Unnamed Group',
                memberCount: groupDetails.memberCount || 0,
                messages: messages.map((msg: any) => this.mapMessageToChatMessage(msg))
              };
              this.loadingMessages = false;
            },
            error: (error: any) => {
              console.error('Failed to load group messages:', error);
              this.loadingMessages = false;
            }
          });
        } else {
          this.loadingMessages = false;
        }
      },
      error: (error: any) => {
        console.error('Failed to load group details:', error);
        this.loadingMessages = false;
      }
    });
  }

  /**
   * Maps a SimpleMessageDto to ChatMessageData format
   */
  private mapMessageToChatMessage(message: SimpleMessageDto): ChatMessageData {
    return {
      messageId: message.messageId || '',
      senderId: message.senderId || '',
      senderName: message.senderName || 'Unknown',
      content: message.content?.text || 'Non-text content', // Keep for backward compatibility
      contentType: message.contentType,
      messageDto: message, // Add full DTO for rich content
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
      createdAt: new Date().toISOString(),
      isOwn: true
    };

    this.currentConversation.messages.push(optimisticMessage);

    // Update last message in chat list using mock service
    const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
    if (chat) {
      // Send message via mock service
      this.mockDataService.sendMockMessage(
        this.currentConversation.groupId, 
        { $type: 'text', text: messageContent },
        'text'
      ).subscribe({
        next: (sentMessage: any) => {
          // Replace optimistic message with real one
          if (sentMessage && this.currentConversation) {
            const index = this.currentConversation.messages.findIndex(
              msg => msg.messageId === optimisticMessage.messageId
            );
            if (index !== -1) {
              this.currentConversation.messages[index] = this.mapMessageToChatMessage(sentMessage);
            }
            // Update chat list
            chat.lastMessage = sentMessage;
            chat.lastMessageTime = new Date().toISOString();
          }
        },
        error: (error: any) => {
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

  /**
   * Demo method to add different types of messages for testing
   */
  onAddSampleMessage(contentType: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll'): void {
    if (!this.currentConversation) return;

    this.mockDataService.addSampleMessage(this.currentConversation.groupId, contentType).subscribe({
      next: (newMessage) => {
        if (this.currentConversation) {
          this.currentConversation.messages.push(this.mapMessageToChatMessage(newMessage));
          
          // Update chat list
          const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
          if (chat) {
            chat.lastMessage = newMessage;
            chat.lastMessageTime = new Date().toISOString();
          }
        }
      },
      error: (error: any) => {
        console.error('Failed to add sample message:', error);
      }
    });
  }
}
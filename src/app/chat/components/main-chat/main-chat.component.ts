import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatConversationComponent, ConversationData } from '../chat-conversation/chat-conversation.component';
import { ChatItemData } from '../chat-item/chat-item.component';
import { ChatMessageData } from '../chat-message/chat-message.component';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatHeaderComponent,
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

  // Mock data for development - will be replaced with real API calls
  chats: ChatItemData[] = [
    {
      groupId: '1',
      name: 'General Discussion',
      lastMessage: 'Hey everyone! How is the project going?',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 3
    },
    {
      groupId: '2',
      name: 'Development Team',
      lastMessage: 'I pushed the latest changes to the repo',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      unreadCount: 1
    },
    {
      groupId: '3',
      name: 'Design Review',
      lastMessage: 'The new mockups look great!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      unreadCount: 0
    },
    {
      groupId: '4',
      name: 'TaskFlow Planning',
      lastMessage: 'Let\'s schedule the next sprint planning',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      unreadCount: 0
    }
  ];

  // Mock conversations data
  conversations: { [key: string]: ConversationData } = {
    '1': {
      groupId: '1',
      groupName: 'General Discussion',
      memberCount: 12,
      messages: [
        {
          messageId: '1',
          senderId: 'other-user-1',
          senderName: 'John Doe',
          content: 'Hey everyone! How is the project going?',
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          isOwn: false
        },
        {
          messageId: '2',
          senderId: this.user?.id || 'current-user',
          senderName: 'You',
          content: 'It\'s going well! Just finished implementing the chat UI.',
          createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
          isOwn: true
        },
        {
          messageId: '3',
          senderId: 'other-user-2',
          senderName: 'Jane Smith',
          content: 'That sounds great! Can\'t wait to see it in action.',
          createdAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
          isOwn: false
        }
      ]
    },
    '2': {
      groupId: '2',
      groupName: 'Development Team',
      memberCount: 5,
      messages: [
        {
          messageId: '4',
          senderId: 'other-user-3',
          senderName: 'Mike Johnson',
          content: 'I pushed the latest changes to the repo',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isOwn: false
        }
      ]
    }
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    
    // Subscribe to user changes only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        if (!user) {
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }

  onChatSelect(groupId: string): void {
    this.selectedChatId = groupId;
    this.currentConversation = this.conversations[groupId] || null;
    
    // Mark chat as read (update unread count)
    const chat = this.chats.find(c => c.groupId === groupId);
    if (chat) {
      chat.unreadCount = 0;
    }
  }

  onSendMessage(messageContent: string): void {
    if (!this.currentConversation || !this.user) return;

    // Create new message
    const newMessage: ChatMessageData = {
      messageId: Date.now().toString(),
      senderId: this.user.id,
      senderName: 'You',
      content: messageContent,
      createdAt: new Date().toISOString(),
      isOwn: true
    };

    // Add to current conversation
    this.currentConversation.messages.push(newMessage);

    // Update last message in chat list
    const chat = this.chats.find(c => c.groupId === this.currentConversation?.groupId);
    if (chat) {
      chat.lastMessage = messageContent;
      chat.lastMessageTime = new Date().toISOString();
    }

    // TODO: Send message via API
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
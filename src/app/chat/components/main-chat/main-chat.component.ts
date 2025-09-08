import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, switchMap, catchError, of } from 'rxjs';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { GroupProxyService, GroupWithLastMessage } from '../../../api/group-proxy.service';
import { MessageProxyService, ConversationData } from '../../../api/message-proxy.service';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatConversationComponent } from '../chat-conversation/chat-conversation.component';
import { ChatItemData } from '../chat-item/chat-item.component';
import { ChatSkeletonComponent } from '../../../shared/components/chat-skeleton/chat-skeleton.component';

@Component({
  selector: 'app-main-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatSidebarComponent,
    ChatConversationComponent,
    ChatSkeletonComponent
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss'
})
export class MainChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  user: AuthUser | null = null;
  selectedChatId: string | null = null;
  currentConversation: ConversationData | null = null;
  
  // Real API data (no more mock data)
  chats: ChatItemData[] = [];
  isLoadingChats = false;
  chatsError: string | null = null;

  constructor(
    private authService: AuthService,
    private groupProxyService: GroupProxyService,
    private messageProxyService: MessageProxyService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.initializeUser();
    this.loadGroups();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser(): void {
    this.user = this.authService.getCurrentUser();

    // Subscribe to user changes only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.user = user;
          if (!user) {
            this.router.navigate(['/auth/login']);
          } else {
            // Set current user ID for message service
            this.messageProxyService.setCurrentUserId(user.id);
          }
        });
    }
  }

  private loadGroups(): void {
    this.isLoadingChats = true;
    this.chatsError = null;

    this.groupProxyService.getGroups()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: string) => {
          this.chatsError = error;
          this.isLoadingChats = false;
          return of([]);
        })
      )
      .subscribe({
        next: (groups: GroupWithLastMessage[]) => {
          this.chats = this.mapGroupsToChats(groups);
          this.isLoadingChats = false;
        },
        error: (error) => {
          this.chatsError = error;
          this.isLoadingChats = false;
        }
      });
  }

  private mapGroupsToChats(groups: GroupWithLastMessage[]): ChatItemData[] {
    return groups.map(group => ({
      groupId: group.groupId || '',
      name: group.name || 'Unnamed Group',
      lastMessage: group.lastMessageContent || 'No messages yet',
      lastMessageTime: group.lastMessageTime || '',
      unreadCount: group.unreadCount || 0
    }));
  }

  onChatSelect(groupId: string): void {
    if (this.selectedChatId === groupId) {
      return; // Already selected
    }

    this.selectedChatId = groupId;
    this.loadConversation(groupId);

    // Mark chat as read (update unread count)
    const chat = this.chats.find(c => c.groupId === groupId);
    if (chat) {
      chat.unreadCount = 0;
    }
  }

  loadConversation(groupId: string): void {
    const selectedGroup = this.chats.find(c => c.groupId === groupId);
    if (!selectedGroup) {
      return;
    }

    this.messageProxyService.loadGroupMessages(
      groupId,
      selectedGroup.name,
      0, // memberCount would need to be fetched from group details
      50
    )
    .pipe(
      takeUntil(this.destroy$),
      catchError((error: string) => {
        console.error('Error loading conversation:', error);
        return of(null);
      })
    )
    .subscribe({
      next: (conversation: ConversationData | null) => {
        this.currentConversation = conversation;
      }
    });
  }

  onSendMessage(messageContent: string): void {
    if (!this.selectedChatId || !this.user || !messageContent.trim()) {
      return;
    }

    this.messageProxyService.sendMessage(this.selectedChatId, messageContent.trim())
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: string) => {
          console.error('Error sending message:', error);
          // Could show a toast notification here
          return of(null);
        })
      )
      .subscribe({
        next: (sentMessage) => {
          if (sentMessage) {
            // Update last message in chat list
            const chat = this.chats.find(c => c.groupId === this.selectedChatId);
            if (chat) {
              chat.lastMessage = messageContent.trim();
              chat.lastMessageTime = new Date().toISOString();
            }
          }
        }
      });
  }

  onRetryLoadChats(): void {
    this.loadGroups();
  }

  get isLoadingConversation(): boolean {
    return this.currentConversation?.loadingState?.isLoading || false;
  }

  get isSendingMessage(): boolean {
    return this.currentConversation?.loadingState?.isSending || false;
  }

  get conversationError(): string | null {
    return this.currentConversation?.loadingState?.error || null;
  }
}

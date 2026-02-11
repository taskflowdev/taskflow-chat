import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, PLATFORM_ID, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatMessageComponent, ChatMessageData, QuotedMessageData } from '../chat-message/chat-message.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { GroupInfoDialogComponent } from '../group-info-dialog/group-info-dialog.component';
import { CommonDropdownComponent, DropdownItem } from '../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonTooltipDirective, TooltipPosition } from '../../../shared/components/common-tooltip';
import { ScrollToBottomButtonComponent } from '../scroll-to-bottom-button';
import { TypingIndicatorComponent } from '../typing-indicator';
import { PresenceAvatarsComponent } from '../presence-avatars';
import { PollComposerComponent, PollData } from '../poll-composer/poll-composer.component';
import { AutoScrollService } from '../../services/auto-scroll.service';
import { TranslatePipe, I18nService } from '../../../core/i18n';
import { TypingIndicatorSettingsService } from '../../../core/services/typing-indicator-settings.service';

export interface SendMessageWithReply {
  content: string;
  replyToMessageId?: string;
}

export interface ConversationData {
  groupId: string;
  groupName: string;
  messages: ChatMessageData[];
  memberCount?: number;
}

@Component({
  selector: 'app-chat-conversation',
  imports: [CommonModule, FormsModule, ChatMessageComponent, SkeletonLoaderComponent, GroupInfoDialogComponent, CommonDropdownComponent, CommonTooltipDirective, ScrollToBottomButtonComponent, TypingIndicatorComponent, PresenceAvatarsComponent, PollComposerComponent, TranslatePipe],
  providers: [AutoScrollService],
  templateUrl: './chat-conversation.component.html',
  styleUrls: ['./chat-conversation.component.scss']
})
export class ChatConversationComponent implements AfterViewChecked, OnInit, OnDestroy {
  @Input() conversation: ConversationData | null = null;
  @Input() currentUserId: string | null = null;
  @Input() loading: boolean = false;
  @Input() showBackButton: boolean = false; // For mobile back navigation
  @Input() typingUsers: string[] = []; // Users currently typing
  @Output() sendMessage = new EventEmitter<SendMessageWithReply>();
  @Output() sendPoll = new EventEmitter<PollData>();
  @Output() backToChats = new EventEmitter<void>(); // Mobile back navigation
  @Output() groupUpdated = new EventEmitter<void>(); // Group info updated
  @Output() groupDeleted = new EventEmitter<string>(); // Group deleted - emits group ID
  @Output() userTyping = new EventEmitter<boolean>(); // User typing indicator

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  newMessage = '';
  replyingToMessage: ChatMessageData | null = null; // Track message being replied to
  showPollComposer = false;
  pollBtnHovered = false;
  private shouldScrollToBottom = false;
  showGroupInfoDialog = false;
  openGroupInfoForDeletion = false; // Flag to indicate deletion flow
  private fragmentSubscription?: Subscription;
  private autoScrollSubscription?: Subscription;
  private typingTimeout?: number; // Typing indicator timeout
  showTypingIndicator = true; // Whether to show typing indicator based on user setting

  // Auto-scroll state
  showScrollButton = false;
  private previousMessageCount = 0;
  private previousConversationId: string | null = null;

  // Export enum for template use
  TooltipPosition = TooltipPosition;

  // Dropdown items - will be updated with translations
  dropdownItems: DropdownItem[] = [];

  // Generate varied message skeleton items
  get messageSkeletonItems(): Array<{ index: number }> {
    const items = [];
    for (let i = 0; i < 1; i++) {
      items.push({ index: i });
    }
    return items;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private autoScrollService: AutoScrollService,
    private cdr: ChangeDetectorRef,
    private i18n: I18nService,
    private typingIndicatorSettingsService: TypingIndicatorSettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.updateTranslations();
  }

  private updateTranslations(): void {
    this.dropdownItems = [
      {
        id: 'group-info',
        label: this.i18n.t('chats.conversation-window.header.more-options.options.group-info.title'),
        icon: 'bi-info-circle',
        shortcutKey: this.i18n.t('chats.conversation-window.header.more-options.options.group-info.shortcut')
      },
      {
        id: '',
        label: '',
        divider: true
      },
      {
        id: 'delete-group',
        label: this.i18n.t('chats.conversation-window.header.more-options.options.group-delete.title'),
        icon: 'bi-trash',
        variant: 'danger',
        isQuick: true
      }
    ];
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fragmentSubscription = this.route.fragment.subscribe(fragment => {
        this.showGroupInfoDialog = fragment === 'group-info';
      });

      // Subscribe to auto-scroll state
      this.autoScrollSubscription = this.autoScrollService.isNearBottom$.subscribe(isNear => {
        this.showScrollButton = !isNear;
        this.cdr.markForCheck();
      });

      // Subscribe to typing indicator setting
      this.typingIndicatorSettingsService.isEnabled$().subscribe(enabled => {
        this.showTypingIndicator = enabled;
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    this.fragmentSubscription?.unsubscribe();
    this.autoScrollSubscription?.unsubscribe();

    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  ngAfterViewChecked(): void {
    // Initialize auto-scroll service when container is available
    if (this.messagesContainer && isPlatformBrowser(this.platformId)) {
      const container = this.messagesContainer.nativeElement;

      // Initialize service on first render
      if (container && !this.autoScrollService['scrollContainer']) {
        this.autoScrollService.initialize(container);
      }

      // Handle conversation changes (new chat opened)
      if (this.conversation && this.conversation.groupId !== this.previousConversationId) {
        this.previousConversationId = this.conversation.groupId;
        this.previousMessageCount = this.conversation.messages?.length || 0;
        // Scroll to bottom when opening a chat
        setTimeout(() => {
          this.autoScrollService.scrollToBottom(false);
        }, 0);
        return;
      }

      // Handle new messages
      if (this.conversation && this.conversation.messages) {
        const currentMessageCount = this.conversation.messages.length;
        if (currentMessageCount > this.previousMessageCount) {
          // New message arrived
          if (this.autoScrollService.shouldAutoScroll()) {
            // Only auto-scroll if user is at bottom
            setTimeout(() => {
              this.autoScrollService.scrollToBottom(true);
            }, 0);
          }
          this.previousMessageCount = currentMessageCount;
        }
      }

      // Handle manual scroll flag
      if (this.shouldScrollToBottom) {
        this.autoScrollService.scrollToBottom(false);
        this.shouldScrollToBottom = false;
      }
    }
  }

  onDropdownItemSelected(itemId: string): void {
    if (itemId === 'group-info') {
      this.openGroupInfoForDeletion = false;
      this.openGroupInfo();
    } else if (itemId === 'delete-group') {
      // Open group info dialog but trigger delete immediately
      this.openGroupInfoForDeletion = true;
      this.openGroupInfo();
    }
  }

  openGroupInfo(): void {
    // Update URL fragment to show dialog
    this.router.navigate([], {
      fragment: 'group-info',
      queryParamsHandling: 'preserve',
      replaceUrl: false
    });
  }

  onGroupInfoClosed(): void {
    // Reset deletion flag
    this.openGroupInfoForDeletion = false;

    // Remove URL fragment when dialog closes
    this.router.navigate([], {
      fragment: undefined,
      queryParamsHandling: 'preserve',
      replaceUrl: false
    });
  }

  onGroupInfoUpdated(): void {
    this.groupUpdated.emit();
  }

  /**
   * Handle group deletion from GroupInfoDialog
   * This is the centralized deletion handler - all delete operations
   * (from dropdown or from dialog button) go through GroupInfoDialog
   */
  onGroupDeleted(groupId: string): void {
    this.groupDeleted.emit(groupId);
  }

  onSendMessage(): void {
    if (this.newMessage.trim() && this.conversation) {
      const messageData: SendMessageWithReply = {
        content: this.newMessage.trim(),
        replyToMessageId: this.replyingToMessage?.messageId
      };
      this.sendMessage.emit(messageData);
      this.newMessage = '';
      this.replyingToMessage = null; // Clear reply state
      this.shouldScrollToBottom = true;
    }
  }

  /**
   * Toggles the poll composer visibility
   */
  togglePollComposer(): void {
    this.showPollComposer = !this.showPollComposer;
  }

  /**
   * Handles poll creation from the poll composer
   */
  onPollCreated(pollData: PollData): void {
    this.sendPoll.emit(pollData);
    this.showPollComposer = false;
    this.shouldScrollToBottom = true;
  }

  /**
   * Handles poll composer cancellation
   */
  onPollComposerCancelled(): void {
    this.showPollComposer = false;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    } else {
      // Send typing indicator
      this.handleTypingIndicator();
    }
  }

  /**
   * Handle typing indicator when user types
   */
  private handleTypingIndicator(): void {
    // Emit typing started
    this.userTyping.emit(true);

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Stop typing after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.userTyping.emit(false);
    }, 500) as any;
  }

  /**
   * Get whether typing indicator should be visible
   * Combines user setting with actual typing state
   */
  get shouldShowTypingIndicator(): boolean {
    return this.showTypingIndicator && this.typingUsers && this.typingUsers.length > 0;
  }

  /**
   * Handle user scroll to detect manual scrolling
   */
  onMessagesScroll(): void {
    this.autoScrollService.onUserScroll();
  }

  /**
   * Handle scroll-to-bottom button click
   */
  onScrollToBottomClick(): void {
    this.autoScrollService.enableAutoScroll();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Groups messages by date for display with date separators
   */
  getGroupedMessages(): Array<{ date: string; dateLabel: string; messages: ChatMessageData[] }> {
    if (!this.conversation?.messages) {
      return [];
    }

    const groups: Map<string, ChatMessageData[]> = new Map();

    this.conversation.messages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toDateString();

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(message);
    });

    // Convert map to array and sort by date ascending (oldest first)
    return Array.from(groups.entries())
      .map(([dateKey, messages]) => {
        const date = new Date(dateKey);
        const sortedMessages = messages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const enrichedMessages = sortedMessages.map((message, index) => {
          const previousMessage = index > 0 ? sortedMessages[index - 1] : undefined;
          const isConsecutive = this.isConsecutiveMessage(message, previousMessage);
          return { ...message, isConsecutive };
        });
        return {
          date: dateKey,
          dateLabel: this.getDateLabel(date),
          messages: enrichedMessages
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Determines if a message is consecutive to the previous message from the same sender
   */
  private isConsecutiveMessage(current: ChatMessageData, previous?: ChatMessageData): boolean {
    if (!previous) {
      return false;
    }

    if (current.isSystemMessage || previous.isSystemMessage) {
      return false;
    }

    if (current.isOwn !== previous.isOwn) {
      return false;
    }

    const currentSenderKey = current.isOwn
      ? 'own'
      : (current.senderId || current.senderName || 'unknown');
    const previousSenderKey = previous.isOwn
      ? 'own'
      : (previous.senderId || previous.senderName || 'unknown');

    return currentSenderKey === previousSenderKey;
  }

  /**
   * Gets a user-friendly date label (Today, Yesterday, or day name)
   */
  private getDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.i18n.t('chats.conversation-window.conversations.message-list.date-separator.today');
    } else if (diffDays === 1) {
      return this.i18n.t('chats.conversation-window.conversations.message-list.date-separator.yesterday');
    } else if (diffDays < 7) {
      // Return day name for last week
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      // Return formatted date for older messages
      return date.toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  trackByMessageId(index: number, message: ChatMessageData): string {
    return message.messageId;
  }

  trackByMessageIndex(index: number, item: { index: number }): number {
    return item.index;
  }

  trackByDate(index: number, group: { date: string; dateLabel: string; messages: ChatMessageData[] }): string {
    return group.date;
  }

  /**
   * Handle back button click for mobile navigation
   */
  onBackClick(): void {
    this.backToChats.emit();
  }

  /**
   * Handle reply to message action
   */
  onReplyToMessage(message: ChatMessageData): void {
    this.replyingToMessage = message;
    // Focus the message input
    setTimeout(() => {
      const textarea = document.querySelector('.message-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  }

  /**
   * Cancel the current reply
   */
  cancelReply(): void {
    this.replyingToMessage = null;
  }

  /**
   * Handle quoted message click - scroll to and highlight the original message
   */
  onQuotedMessageClick(messageId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Find the message element using data attribute
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;

    if (!messageElement) {
      return;
    }

    // Scroll to the message with smooth behavior
    messageElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    // Add highlight class
    messageElement.classList.add('highlighted');

    // Remove highlight class after animation completes
    setTimeout(() => {
      messageElement.classList.remove('highlighted');
    }, 2000);
  }

  /**
   * Get preview text for quoted message in reply preview
   */
  getReplyPreviewText(message: ChatMessageData): string {
    if (message.contentType === 'image') {
      return 'Photo';
    } else if (message.contentType === 'video') {
      return 'Video';
    } else if (message.contentType === 'poll') {
      const maxLength = 50;
      const question = message.content || 'Poll';
      if (question.length > maxLength) {
        return question.substring(0, maxLength) + '...';
      }
      return question;
    } else if (message.contentType === 'file') {
      return 'File';
    }
    // For text, truncate if too long
    const maxLength = 50;
    if (message.content.length > maxLength) {
      return message.content.substring(0, maxLength) + '...';
    }
    return message.content;
  }
}

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatMessageComponent, ChatMessageData } from '../chat-message/chat-message.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { GroupInfoDialogComponent } from '../group-info-dialog/group-info-dialog.component';
import { CommonDropdownComponent, DropdownItem } from '../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonTooltipDirective, TooltipPosition } from '../../../shared/components/common-tooltip';

export interface ConversationData {
  groupId: string;
  groupName: string;
  messages: ChatMessageData[];
  memberCount?: number;
}

@Component({
  selector: 'app-chat-conversation',
  imports: [CommonModule, FormsModule, ChatMessageComponent, SkeletonLoaderComponent, GroupInfoDialogComponent, CommonDropdownComponent, CommonTooltipDirective],
  templateUrl: './chat-conversation.component.html',
  styleUrls: ['./chat-conversation.component.scss']
})
export class ChatConversationComponent implements AfterViewChecked, OnInit, OnDestroy {
  @Input() conversation: ConversationData | null = null;
  @Input() currentUserId: string | null = null;
  @Input() loading: boolean = false;
  @Input() showBackButton: boolean = false; // For mobile back navigation
  @Output() sendMessage = new EventEmitter<string>();
  @Output() backToChats = new EventEmitter<void>(); // Mobile back navigation
  @Output() groupUpdated = new EventEmitter<void>(); // Group info updated
  @Output() groupDeleted = new EventEmitter<string>(); // Group deleted - emits group ID

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  newMessage = '';
  private shouldScrollToBottom = false;
  showGroupInfoDialog = false;
  openGroupInfoForDeletion = false; // Flag to indicate deletion flow
  private fragmentSubscription?: Subscription;

  // Export enum for template use
  TooltipPosition = TooltipPosition;

  // Dropdown items
  dropdownItems: DropdownItem[] = [
    {
      id: 'group-info',
      label: 'Group Info',
      icon: 'bi-info-circle',
      shortcutKey: 'Ctrl + i'
    },
    {
      id: '',
      label: '',
      divider: true
    },
    {
      id: 'delete-group',
      label: 'Delete Group',
      icon: 'bi-trash',
      variant: 'danger',
      isQuick: true
    }
  ];

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fragmentSubscription = this.route.fragment.subscribe(fragment => {
        this.showGroupInfoDialog = fragment === 'group-info';
      });
    }
  }

  ngOnDestroy(): void {
    this.fragmentSubscription?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
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
      this.sendMessage.emit(this.newMessage.trim());
      this.newMessage = '';
      this.shouldScrollToBottom = true;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
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
        return {
          date: dateKey,
          dateLabel: this.getDateLabel(date),
          messages: messages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Return day name for last week
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      // Return formatted date for older messages
      return date.toLocaleDateString([], {
        month: 'short',
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
}

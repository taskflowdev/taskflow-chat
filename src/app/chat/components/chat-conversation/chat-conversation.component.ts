import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent, ChatMessageData } from '../chat-message/chat-message.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { GroupInfoDialogComponent } from '../group-info-dialog/group-info-dialog.component';

export interface ConversationData {
  groupId: string;
  groupName: string;
  messages: ChatMessageData[];
  memberCount?: number;
}

@Component({
  selector: 'app-chat-conversation',
  imports: [CommonModule, FormsModule, ChatMessageComponent, SkeletonLoaderComponent, GroupInfoDialogComponent],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss'
})
export class ChatConversationComponent implements AfterViewChecked {
  @Input() conversation: ConversationData | null = null;
  @Input() currentUserId: string | null = null;
  @Input() loading: boolean = false;
  @Input() showBackButton: boolean = false; // For mobile back navigation
  @Output() sendMessage = new EventEmitter<string>();
  @Output() backToChats = new EventEmitter<void>(); // Mobile back navigation
  @Output() groupUpdated = new EventEmitter<void>(); // Group info updated

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  newMessage = '';
  private shouldScrollToBottom = false;
  showOptionsDropdown = false;
  showGroupInfoDialog = false;

  // Generate varied message skeleton items
  get messageSkeletonItems(): Array<{ index: number }> {
    const items = [];
    for (let i = 0; i < 1; i++) {
      items.push({ index: i });
    }
    return items;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.conversation-actions')) {
      this.showOptionsDropdown = false;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleOptionsDropdown(): void {
    this.showOptionsDropdown = !this.showOptionsDropdown;
  }

  openGroupInfo(): void {
    this.showOptionsDropdown = false;
    this.showGroupInfoDialog = true;
  }

  onGroupInfoClosed(): void {
    this.showGroupInfoDialog = false;
  }

  onGroupInfoUpdated(): void {
    this.groupUpdated.emit();
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

  trackByMessageId(index: number, message: ChatMessageData): string {
    return message.messageId;
  }

  trackByMessageIndex(index: number, item: { index: number }): number {
    return item.index;
  }

  /**
   * Handle back button click for mobile navigation
   */
  onBackClick(): void {
    this.backToChats.emit();
  }
}

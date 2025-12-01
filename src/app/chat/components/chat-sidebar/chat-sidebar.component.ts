import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatItemComponent, ChatItemData } from '../chat-item/chat-item.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CommonTooltipDirective, TooltipPosition } from '../../../shared/components/common-tooltip';
import { TranslatePipe } from '../../../core/i18n';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, ChatItemComponent, SkeletonLoaderComponent, CommonTooltipDirective, TranslatePipe],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss'
})
export class ChatSidebarComponent {
  @Input() chats: ChatItemData[] = [];
  @Input() selectedChatId: string | null = null;
  @Input() loading: boolean = false;
  @Output() chatSelect = new EventEmitter<string>();

  // Export enum for template use
  TooltipPosition = TooltipPosition;

  constructor(private router: Router) {}

  // Generate skeleton items with progressive fade opacity
  get skeletonItems(): Array<{index: number, opacity: number}> {
    const items = [];
    for (let i = 0; i < 12; i++) { // Show 12 skeleton items instead of 5
      const opacity = Math.max(0.2, 1 - (i * 0.08)); // Progressive fade from 1.0 to 0.2
      items.push({ index: i, opacity });
    }
    return items;
  }

  onChatSelect(groupId: string): void {
    this.chatSelect.emit(groupId);
  }

  isActivechat(chatId: string): boolean {
    return this.selectedChatId === chatId;
  }

  trackByGroupId(index: number, chat: ChatItemData): string {
    return chat.groupId;
  }

  trackBySkeletonIndex(index: number, item: {index: number, opacity: number}): number {
    return item.index;
  }

  onCreateGroup(): void {
    // Navigate with fragment to trigger dialog
    this.router.navigate([], { fragment: 'new-group' });
  }

  onSearchGroups(): void {
    // Navigate with fragment to trigger search dialog
    this.router.navigate([], { fragment: 'search-groups' });
  }
}

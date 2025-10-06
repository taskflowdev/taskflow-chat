import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatItemComponent, ChatItemData } from '../chat-item/chat-item.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CommonTooltipDirective, TooltipPosition } from '../../../shared/components/common-tooltip';
import { CommonDropdownComponent, DropdownItem } from '../../../shared/components/common-dropdown/common-dropdown.component';
import { KeyboardShortcutService } from '../../../shared/services/keyboard-shortcut.service';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, ChatItemComponent, SkeletonLoaderComponent, CommonTooltipDirective, CommonDropdownComponent],
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

  // User dropdown state
  showUserDropdown: boolean = false;

  // User dropdown items
  userDropdownItems: DropdownItem[] = [
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: 'bi-keyboard'
    },
    {
      id: 'divider',
      divider: true
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'bi-box-arrow-right'
    }
  ];

  constructor(
    private router: Router,
    private keyboardShortcutService: KeyboardShortcutService
  ) {}
  
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

  /**
   * Handle user dropdown item selection
   */
  onUserDropdownItemSelected(itemId: string): void {
    switch (itemId) {
      case 'keyboard-shortcuts':
        // Trigger keyboard shortcuts dialog
        this.keyboardShortcutService.triggerShortcut('SHOW_SHORTCUTS');
        break;
      case 'logout':
        // Handle logout
        this.router.navigate(['/auth/logout']);
        break;
    }
  }
}

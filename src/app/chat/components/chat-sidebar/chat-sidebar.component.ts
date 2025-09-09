import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatItemComponent, ChatItemData } from '../chat-item/chat-item.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, ChatItemComponent, SkeletonLoaderComponent],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss'
})
export class ChatSidebarComponent {
  @Input() chats: ChatItemData[] = [];
  @Input() selectedChatId: string | null = null;
  @Input() loading: boolean = false;
  @Output() chatSelect = new EventEmitter<string>();
  
  onChatSelect(groupId: string): void {
    this.chatSelect.emit(groupId);
  }
  
  isActivechat(chatId: string): boolean {
    return this.selectedChatId === chatId;
  }

  trackByGroupId(index: number, chat: ChatItemData): string {
    return chat.groupId;
  }
}

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConversationData, EnhancedMessageDto } from '../../../api/message-proxy.service';

@Component({
  selector: 'app-chat-conversation',
  imports: [CommonModule, FormsModule, ChatMessageComponent, LoadingSpinnerComponent],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss'
})
export class ChatConversationComponent implements AfterViewChecked {
  @Input() conversation: ConversationData | null = null;
  @Input() currentUserId: string | null = null;
  @Input() isSending: boolean = false;
  @Output() sendMessage = new EventEmitter<string>();
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  newMessage = '';
  private shouldScrollToBottom = false;

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  onSendMessage(): void {
    if (this.newMessage.trim() && this.conversation && !this.isSending) {
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

  trackByMessageId(index: number, message: EnhancedMessageDto): string {
    return message.messageId || index.toString();
  }
}

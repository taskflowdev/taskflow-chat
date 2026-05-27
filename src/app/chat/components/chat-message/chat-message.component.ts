import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";
import { DateTimeFormatService } from '../../../core/services/datetime-format.service';
import { PollMessageComponent } from '../poll-message/poll-message.component';
import { PollResultsDto, MessageMetadata } from '../../../api/models';
import { MessageReactionComponent } from '../message-reactions/message-reaction.component';
import { ReactionPickerComponent } from '../message-reactions/reaction-picker.component';
import { ReactionService } from '../message-reactions/reaction.service';
import { GroupedReaction, PickerPosition } from '../message-reactions/reaction.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface QuotedMessageData {
  messageId: string;
  senderName?: string;
  content: string;
  contentType?: 'text' | 'image' | 'video' | 'poll' | 'file';
}

export interface ChatMessageData {
  messageId: string;
  senderId?: string;
  senderName?: string;
  content: string;
  contentType?: 'text' | 'image' | 'video' | 'poll' | 'file';
  contentData?: any; // Raw content object for rendering different types
  pollData?: PollResultsDto; // Poll-specific data
  createdAt: string;
  isOwn: boolean;
  isSystemMessage?: boolean; // Flag to identify system messages
  messageType?: string; // Type of system message (e.g., 'groupCreated', 'userJoined')
  isConsecutive?: boolean; // True when this message follows the same sender consecutively
  groupId?: string; // Group ID for poll messages
  currentUserId?: string; // Current user ID for poll voting
  groupMemberCount?: number; // Group member count for poll participation display
  quotedMessage?: QuotedMessageData; // The message being replied to
  metadata?: MessageMetadata; // Message metadata including reactions
}

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule, CommonTooltipDirective, PollMessageComponent, MessageReactionComponent, ReactionPickerComponent],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent implements OnInit, OnDestroy {
  // Picker positioning constants
  private static readonly PICKER_OFFSET_PX = 10;
  private static readonly PICKER_HORIZONTAL_OFFSET_PX = 40;

  @Input() message!: ChatMessageData;
  @Output() replyToMessage = new EventEmitter<ChatMessageData>();
  @Output() quotedMessageClick = new EventEmitter<string>(); // Emits the quoted message ID

  // Reaction state
  showReactionPicker = false;
  pickerPosition: PickerPosition = {};
  private destroy$ = new Subject<void>();

  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    // Initialize reactions from message metadata
    if (this.message.metadata?.reactions && this.message.currentUserId) {
      this.reactionService.initializeReactions(
        this.message.messageId,
        this.message.metadata.reactions,
        this.message.currentUserId
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle reply button click
   */
  onReplyClick(): void {
    this.replyToMessage.emit(this.message);
  }

  /**
   * Handle reaction button click - open picker
   */
  onReactionClick(event: MouseEvent): void {
    event.stopPropagation();
    
    // Calculate picker position based on message position
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Determine if message is in lower half of screen
    const isLowerHalf = rect.top > window.innerHeight / 2;
    
    // For own messages (right-aligned), position picker to the left
    // For other messages (left-aligned), position picker to the right
    if (this.message.isOwn) {
      this.pickerPosition = {
        right: `${window.innerWidth - rect.right + ChatMessageComponent.PICKER_HORIZONTAL_OFFSET_PX}px`,
        ...(isLowerHalf 
          ? { bottom: `${window.innerHeight - rect.top + ChatMessageComponent.PICKER_OFFSET_PX}px` }
          : { top: `${rect.bottom + ChatMessageComponent.PICKER_OFFSET_PX}px` })
      };
    } else {
      this.pickerPosition = {
        left: `${rect.left - ChatMessageComponent.PICKER_HORIZONTAL_OFFSET_PX}px`,
        ...(isLowerHalf 
          ? { bottom: `${window.innerHeight - rect.top + ChatMessageComponent.PICKER_OFFSET_PX}px` }
          : { top: `${rect.bottom + ChatMessageComponent.PICKER_OFFSET_PX}px` })
      };
    }
    
    this.showReactionPicker = true;
  }

  /**
   * Handle emoji selection from picker
   */
  onEmojiSelected(emoji: string): void {
    if (!this.message.currentUserId) {
      console.warn('Cannot add reaction: currentUserId is missing');
      return;
    }

    this.reactionService
      .addReaction(this.message.messageId, emoji, this.message.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Success - optimistic update already handled by service
        },
        error: (error) => {
          console.error('Failed to add reaction:', error);
          // Optimistic update rollback already handled by service
        }
      });
    
    this.closeReactionPicker();
  }

  /**
   * Handle reaction toggle (click on existing reaction)
   */
  onReactionToggled(reaction: GroupedReaction): void {
    if (!this.message.currentUserId) {
      console.warn('Cannot toggle reaction: currentUserId is missing');
      return;
    }

    if (reaction.hasCurrentUser) {
      // Remove reaction
      this.reactionService
        .removeReaction(this.message.messageId, this.message.currentUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Success - optimistic update already handled by service
          },
          error: (error) => {
            console.error('Failed to remove reaction:', error);
            // Optimistic update rollback already handled by service
          }
        });
    } else {
      // Add this reaction
      this.reactionService
        .addReaction(this.message.messageId, reaction.emoji, this.message.currentUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Success - optimistic update already handled by service
          },
          error: (error) => {
            console.error('Failed to add reaction:', error);
            // Optimistic update rollback already handled by service
          }
        });
    }
  }

  /**
   * Close the reaction picker
   */
  closeReactionPicker(): void {
    this.showReactionPicker = false;
  }

  /**
   * Handle quoted message click - scroll to original message
   */
  onQuotedMessageClick(): void {
    if (this.message.quotedMessage && this.isQuotedMessageAvailable(this.message.quotedMessage)) {
      this.quotedMessageClick.emit(this.message.quotedMessage.messageId);
    }
  }

  /**
   * Get the initials from a user's name for avatar display
   */
  getInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getTimeDisplay(timeString: string): string {
    return this.dateTimeFormatService.formatTime(timeString);
  }

  getDateDisplay(timeString: string): string {
    return this.dateTimeFormatService.formatDate(timeString);
  }

  /**
   * Formats duration in seconds to MM:SS format
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Formats file size in bytes to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Formats a given date-time string into a professional tooltip with user's time format
   *
   * @param {string} [timeString] - The ISO 8601 date-time string (e.g., "2025-10-29T14:30:00").
   *                                If no string is provided, returns an empty string.
   *
   * @returns {string} A formatted string for display in a tooltip.
   *                   Example: "Wednesday 29 October 2025 at 6:46 PM" (12h format)
   *                            "Wednesday 29 October 2025 at 18:46" (24h format)
   */
  getDateTimeTooltip(timeString?: string): string {
    if (!timeString) return '';
    return this.dateTimeFormatService.formatDateTimeTooltip(timeString);
  }

  /**
   * Get preview text for quoted message content
   */
  getQuotedContentPreview(quotedMessage: QuotedMessageData): string {
    if (!quotedMessage || !quotedMessage.content) {
      return 'Message not found';
    }

    if (quotedMessage.contentType === 'image') {
      return '📷 Photo';
    } else if (quotedMessage.contentType === 'video') {
      return '🎥 Video';
    } else if (quotedMessage.contentType === 'poll') {
      // Show poll question without emoji (icon is shown in HTML)
      const maxLength = 60;
      const question = quotedMessage.content || 'Poll';
      if (question.length > maxLength) {
        return question.substring(0, maxLength) + '...';
      }
      return question;
    } else if (quotedMessage.contentType === 'file') {
      return '📎 ' + quotedMessage.content;
    }
    // For text, truncate if too long
    const maxLength = 60;
    if (quotedMessage.content.length > maxLength) {
      return quotedMessage.content.substring(0, maxLength) + '...';
    }
    return quotedMessage.content;
  }

  /**
   * Checks if the quoted message is available and valid
   */
  isQuotedMessageAvailable(quotedMessage?: QuotedMessageData): boolean {
    return !!(quotedMessage && quotedMessage.content);
  }
}

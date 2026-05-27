import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupedReaction, MessageReactions } from './reaction.models';
import { ReactionService } from './reaction.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonTooltipDirective } from '../../../shared/components/common-tooltip';

/**
 * Message Reaction Component
 * 
 * Displays reactions on message bubbles in WhatsApp style:
 * - Positioned on bottom-right border of bubble
 * - Groups same emojis with counts
 * - Highlights current user's reactions
 * - Clickable to toggle reactions
 * - Responsive positioning for small bubbles
 */
@Component({
  selector: 'app-message-reaction',
  imports: [CommonModule, CommonTooltipDirective],
  template: `
    <div class="message-reactions" 
         *ngIf="messageReactions && messageReactions.totalCount > 0"
         [class.has-reactions]="messageReactions.totalCount > 0">
      <div class="reaction-item"
           *ngFor="let reaction of messageReactions.reactions; trackBy: trackByEmoji"
           [class.user-reacted]="reaction.hasCurrentUser"
           (click)="onReactionClick(reaction)"
           [appCommonTooltip]="getReactionTooltip(reaction)"
           role="button"
           [attr.aria-label]="getReactionAriaLabel(reaction)"
           tabindex="0"
           (keydown.enter)="onReactionKeydown($event, reaction)"
           (keydown.space)="onReactionKeydown($event, reaction)">
        <span class="emoji">{{ reaction.emoji }}</span>
        <span class="count" *ngIf="reaction.count > 1">{{ reaction.count }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./message-reaction.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageReactionComponent implements OnInit, OnDestroy {
  @Input() messageId!: string;
  @Input() currentUserId!: string;
  @Input() isOwnMessage: boolean = false;
  @Output() reactionToggled = new EventEmitter<GroupedReaction>();

  messageReactions: MessageReactions | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private reactionService: ReactionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.messageId) {
      console.warn('MessageReactionComponent: messageId is required');
      return;
    }

    // Subscribe to reactions for this message
    this.reactionService
      .getReactions(this.messageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reactions => {
        this.messageReactions = reactions;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle reaction click (toggle)
   */
  onReactionClick(reaction: GroupedReaction): void {
    this.reactionToggled.emit(reaction);
  }

  /**
   * Handle reaction keyboard interaction
   */
  onReactionKeydown(event: Event, reaction: GroupedReaction): void {
    // Angular's keydown event binding provides Event type, cast to KeyboardEvent
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.reactionToggled.emit(reaction);
  }

  /**
   * TrackBy function for reactions loop
   */
  trackByEmoji(index: number, reaction: GroupedReaction): string {
    return reaction.emoji;
  }

  /**
   * Get tooltip text for a reaction
   */
  getReactionTooltip(reaction: GroupedReaction): string {
    if (reaction.count === 1) {
      return reaction.hasCurrentUser ? 'You reacted' : '1 person reacted';
    }
    
    if (reaction.hasCurrentUser) {
      const others = reaction.count - 1;
      return others === 1 
        ? `You and 1 other person reacted`
        : `You and ${others} others reacted`;
    }
    
    return `${reaction.count} people reacted`;
  }

  /**
   * Get ARIA label for accessibility
   */
  getReactionAriaLabel(reaction: GroupedReaction): string {
    const tooltip = this.getReactionTooltip(reaction);
    const action = reaction.hasCurrentUser ? 'Remove your reaction' : 'React with this emoji';
    return `${reaction.emoji} ${tooltip}. ${action}`;
  }
}

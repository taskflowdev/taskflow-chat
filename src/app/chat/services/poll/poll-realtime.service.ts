import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ChatRealtimeService, PollVoteUpdateEvent } from '../../../core/realtime/services/chat-realtime.service';
import { PollResultsDto } from '../../../api/models';
import { PollStateService } from './poll-state.service';

/**
 * Enterprise-grade SignalR integration for poll real-time updates
 *
 * @remarks
 * This service:
 * - Listens to PollVoteUpdate events from SignalR
 * - Routes updates to appropriate poll state
 * - Maintains singleton pattern (shares ChatRealtimeService connection)
 * - Provides clean RxJS stream interface
 * - Auto-cleanup on destroy
 *
 * Architecture:
 * - Uses existing SignalR connection (no new connections)
 * - Decoupled from UI components
 * - Coordinates with PollStateService for state updates
 * - Type-safe event handling
 *
 * @example
 * ```typescript
 * // In component
 * this.pollRealtimeService
 *   .pollVoteUpdates$
 *   .pipe(
 *     filter(event => event.messageId === this.messageId),
 *     takeUntil(this.destroy$)
 *   )
 *   .subscribe(event => {
 *     // Handle update
 *   });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PollRealtimeService implements OnDestroy {
  /**
   * Stream of poll vote updates from SignalR
   */
  private readonly pollVoteUpdate$ = new Subject<PollVoteUpdateEvent>();
  
  /**
   * Public read-only observable for poll updates
   */
  readonly pollVoteUpdates$ = this.pollVoteUpdate$.asObservable();
  
  /**
   * Cleanup subject
   */
  private readonly destroy$ = new Subject<void>();
  
  /**
   * Flag to track if event handlers are registered
   */
  private handlersRegistered = false;

  constructor(
    private readonly chatRealtimeService: ChatRealtimeService,
    private readonly pollStateService: PollStateService
  ) {
    this.setupEventHandlers();
  }

  /**
   * Sets up SignalR event handlers for poll updates
   * Only registers once (singleton pattern)
   */
  private setupEventHandlers(): void {
    if (this.handlersRegistered) {
      return;
    }
    
    // Subscribe to poll vote updates from ChatRealtimeService
    this.chatRealtimeService.onPollVoteUpdate
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handlePollVoteUpdate(event);
      });
    
    this.handlersRegistered = true;
    console.log('[PollRealtimeService] Event handlers registered');
  }

  /**
   * Registers the PollVoteUpdate event handler with SignalR
   * This should be called after the connection is established
   */
  registerPollVoteUpdateHandler(): void {
    // Event handler is registered in setupEventHandlers via subscription
    console.log('[PollRealtimeService] Ready to handle poll vote updates');
  }

  /**
   * Handles incoming PollVoteUpdate event from SignalR
   * This method should be called by ChatRealtimeService
   *
   * @param event - The poll vote update event
   */
  handlePollVoteUpdate(event: PollVoteUpdateEvent): void {
    console.log('[PollRealtimeService] Poll vote update received:', event);
    
    // Update state
    this.pollStateService.updateResults(event.messageId, event.pollResults);
    
    // Emit to subscribers
    this.pollVoteUpdate$.next(event);
  }

  /**
   * Invokes SignalR method to get poll results
   * Delegates to ChatRealtimeService
   *
   * @param groupId - The group ID
   * @param messageId - The message ID containing the poll
   * @returns Promise that resolves when the request is sent
   */
  async getPollResults(groupId: string, messageId: string): Promise<void> {
    return this.chatRealtimeService.getPollResults(groupId, messageId);
  }

  /**
   * Invokes SignalR method to vote on poll
   * Delegates to ChatRealtimeService
   *
   * @param groupId - The group ID
   * @param messageId - The message ID containing the poll
   * @param optionIds - Array of option IDs to vote for
   * @returns Promise that resolves when the request is sent
   */
  async votePoll(groupId: string, messageId: string, optionIds: string[]): Promise<void> {
    return this.chatRealtimeService.votePoll(groupId, messageId, optionIds);
  }

  /**
   * Invokes SignalR method to remove vote from poll
   * Delegates to ChatRealtimeService
   *
   * @param groupId - The group ID
   * @param messageId - The message ID containing the poll
   * @returns Promise that resolves when the request is sent
   */
  async removePollVote(groupId: string, messageId: string): Promise<void> {
    return this.chatRealtimeService.removePollVote(groupId, messageId);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollVoteUpdate$.complete();
  }
}

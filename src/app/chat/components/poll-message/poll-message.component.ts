import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter, tap, catchError, of } from 'rxjs';
import { PollResultsDto } from '../../../api/models';
import { PollApiService } from '../../services/poll/poll-api.service';
import { PollStateService, PollState } from '../../services/poll/poll-state.service';
import { PollRealtimeService } from '../../services/poll/poll-realtime.service';
import { PollVoteUpdateEvent } from '../../../core/realtime/services/chat-realtime.service';
import { PollError } from '../../services/poll/poll-error-handler';
import { PollOptionComponent, PollOptionData } from './poll-option/poll-option.component';
import { PollFooterComponent } from './poll-footer/poll-footer.component';

/**
 * Smart container component for poll messages
 *
 * @remarks
 * This is a Smart/Container component:
 * - Manages state and business logic
 * - Coordinates API + SignalR calls
 * - Subscribes to poll state
 * - Passes pure data to dumb child components
 * - OnPush change detection
 * - Optimistic UI with rollback on failure
 *
 * Responsibilities:
 * - Initialize poll state
 * - Handle vote actions
 * - Subscribe to real-time updates
 * - Error handling and display
 * - Coordinate between services
 *
 * Usage:
 * ```html
 * <app-poll-message
 *   [groupId]="groupId"
 *   [messageId]="messageId"
 *   [currentUserId]="currentUserId"
 *   [initialPollData]="pollData">
 * </app-poll-message>
 * ```
 */
@Component({
  selector: 'app-poll-message',
  standalone: true,
  imports: [CommonModule, PollOptionComponent, PollFooterComponent],
  templateUrl: './poll-message.component.html',
  styleUrl: './poll-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollMessageComponent implements OnInit, OnDestroy {
  /**
   * Group ID containing the poll
   */
  @Input() groupId!: string;

  /**
   * Message ID containing the poll
   */
  @Input() messageId!: string;

  /**
   * Current user's ID for vote tracking
   */
  @Input() currentUserId!: string;

  /**
   * Initial poll data (from message)
   */
  @Input() initialPollData?: PollResultsDto;

  /**
   * Poll state from state service
   */
  pollState: PollState = {
    pollResults: null,
    currentUserId: null,
    userVotedOptionIds: [],
    isLoading: false,
    error: null
  };

  /**
   * Cleanup subject
   */
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly pollApiService: PollApiService,
    private readonly pollStateService: PollStateService,
    private readonly pollRealtimeService: PollRealtimeService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Validate inputs
    if (!this.groupId || !this.messageId || !this.currentUserId) {
      console.error('[PollMessageComponent] Missing required inputs:', {
        groupId: this.groupId,
        messageId: this.messageId,
        currentUserId: this.currentUserId
      });
      return;
    }

    // Initialize state if we have initial data
    if (this.initialPollData) {
      this.pollStateService.initialize(
        this.messageId,
        this.currentUserId,
        this.initialPollData
      );
    } else {
      // Load poll data from API
      this.loadPollResults();
    }

    // Subscribe to poll state
    this.pollStateService
      .getState(this.messageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: PollState) => {
        this.pollState = state;
        this.cdr.markForCheck();
      });

    // Subscribe to real-time updates for this poll
    this.pollRealtimeService.pollVoteUpdates$
      .pipe(
        filter((event: PollVoteUpdateEvent) => event.messageId === this.messageId),
        takeUntil(this.destroy$)
      )
      .subscribe((event: PollVoteUpdateEvent) => {
        console.log('[PollMessageComponent] Real-time update received', event);
        // State is already updated by PollRealtimeService
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Note: State is kept in service for potential reuse
    // Could add cleanup logic if needed
  }

  /**
   * Loads poll results from API
   */
  private loadPollResults(): void {
    this.pollStateService.setLoading(this.messageId, true);

    this.pollApiService
      .getPollResults(this.groupId, this.messageId)
      .pipe(
        tap(results => {
          this.pollStateService.initialize(
            this.messageId,
            this.currentUserId,
            results
          );
        }),
        catchError((error: PollError) => {
          this.pollStateService.setError(this.messageId, error.message);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Handles option selection
   *
   * @param optionId - The selected option ID
   */
  onOptionSelected(optionId: string): void {
    const currentVotes = [...this.pollState.userVotedOptionIds];
    let newVotes: string[];

    // Determine new vote state based on poll type
    if (this.pollState.pollResults?.allowMultipleAnswers) {
      // Multiple choice: toggle selection
      if (currentVotes.includes(optionId)) {
        newVotes = currentVotes.filter(id => id !== optionId);
      } else {
        newVotes = [...currentVotes, optionId];
      }
    } else {
      // Single choice: replace selection
      if (currentVotes.includes(optionId)) {
        // Unselect (remove vote)
        newVotes = [];
      } else {
        newVotes = [optionId];
      }
    }

    // Apply optimistic update
    this.pollStateService.optimisticVoteUpdate(this.messageId, newVotes);

    // Call API
    if (newVotes.length === 0) {
      // Remove vote
      this.removeVote(currentVotes);
    } else {
      // Cast vote
      this.castVote(newVotes, currentVotes);
    }
  }

  /**
   * Casts a vote via API
   */
  private castVote(optionIds: string[], previousVotes: string[]): void {
    this.pollApiService
      .vote(this.groupId, this.messageId, optionIds)
      .pipe(
        tap(results => {
          // Update state with API response
          this.pollStateService.updateResults(this.messageId, results);
        }),
        catchError((error: PollError) => {
          // Rollback optimistic update
          this.pollStateService.rollbackVoteUpdate(this.messageId, previousVotes);
          this.pollStateService.setError(this.messageId, error.message);
          
          // Clear error after 5 seconds
          setTimeout(() => {
            this.pollStateService.clearError(this.messageId);
          }, 5000);
          
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Removes vote via API
   */
  private removeVote(previousVotes: string[]): void {
    this.pollApiService
      .removeVote(this.groupId, this.messageId)
      .pipe(
        tap(results => {
          this.pollStateService.updateResults(this.messageId, results);
        }),
        catchError((error: PollError) => {
          // Rollback optimistic update
          this.pollStateService.rollbackVoteUpdate(this.messageId, previousVotes);
          this.pollStateService.setError(this.messageId, error.message);
          
          // Clear error after 5 seconds
          setTimeout(() => {
            this.pollStateService.clearError(this.messageId);
          }, 5000);
          
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Maps poll results to option data for display
   */
  get optionsData(): PollOptionData[] {
    if (!this.pollState.pollResults?.options) {
      return [];
    }

    return this.pollState.pollResults.options.map((option: any) => ({
      id: option.id ?? '',
      text: option.text ?? '',
      votes: option.votes ?? 0,
      percentage: option.percentage ?? 0,
      voters: option.voters ?? []
    }));
  }

  /**
   * Checks if an option is selected by the current user
   */
  isOptionSelected(optionId: string): boolean {
    return this.pollState.userVotedOptionIds.includes(optionId);
  }

  /**
   * TrackBy function for option list performance
   */
  trackByOptionId(index: number, option: PollOptionData): string {
    return option.id;
  }
}

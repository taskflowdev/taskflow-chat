import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PollResultsDto } from '../../../api/models';

/**
 * Poll state with user voting information
 */
export interface PollState {
  pollResults: PollResultsDto | null;
  currentUserId: string | null;
  userVotedOptionIds: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial state for a poll
 */
const INITIAL_STATE: PollState = {
  pollResults: null,
  currentUserId: null,
  userVotedOptionIds: [],
  isLoading: false,
  error: null
};

/**
 * Enterprise-grade RxJS-based state management for polls
 *
 * @remarks
 * This service implements:
 * - Lightweight state pattern with BehaviorSubject
 * - Immutable state updates
 * - Read-only Observable exposure
 * - Per-poll state isolation
 * - Automatic cleanup on destroy
 *
 * Architecture:
 * - Single source of truth for poll state
 * - No direct state mutation from outside
 * - Compatible with OnPush change detection
 * - Supports real-time updates from SignalR
 *
 * Usage:
 * ```typescript
 * // In component
 * this.pollState$ = this.pollStateService.getState(messageId);
 * this.pollStateService.initialize(messageId, currentUserId, pollResults);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PollStateService implements OnDestroy {
  /**
   * Map of messageId to poll state
   * Each poll has its own isolated state
   */
  private readonly stateMap = new Map<string, BehaviorSubject<PollState>>();
  
  /**
   * Cleanup subject
   */
  private readonly destroy$ = new Subject<void>();

  /**
   * Gets or creates a state stream for a specific poll
   *
   * @param messageId - The message ID containing the poll
   * @returns Observable of poll state
   */
  getState(messageId: string): Observable<PollState> {
    return this.getOrCreateStateSubject(messageId).asObservable();
  }

  /**
   * Initializes poll state with initial data
   *
   * @param messageId - The message ID containing the poll
   * @param currentUserId - The current user's ID
   * @param pollResults - Initial poll results
   */
  initialize(messageId: string, currentUserId: string, pollResults: PollResultsDto): void {
    const state = this.getOrCreateStateSubject(messageId);
    const userVotedOptionIds = this.extractUserVotes(currentUserId, pollResults);
    
    state.next({
      pollResults,
      currentUserId,
      userVotedOptionIds,
      isLoading: false,
      error: null
    });
  }

  /**
   * Updates poll results (from API or SignalR)
   *
   * @param messageId - The message ID containing the poll
   * @param pollResults - Updated poll results
   */
  updateResults(messageId: string, pollResults: PollResultsDto): void {
    const state = this.getOrCreateStateSubject(messageId);
    const currentState = state.value;
    
    if (!currentState.currentUserId) {
      console.warn('[PollStateService] Cannot update results without currentUserId');
      return;
    }
    
    const userVotedOptionIds = this.extractUserVotes(currentState.currentUserId, pollResults);
    
    state.next({
      ...currentState,
      pollResults,
      userVotedOptionIds,
      isLoading: false,
      error: null
    });
  }

  /**
   * Sets loading state
   *
   * @param messageId - The message ID containing the poll
   * @param isLoading - Loading state
   */
  setLoading(messageId: string, isLoading: boolean): void {
    const state = this.getOrCreateStateSubject(messageId);
    state.next({
      ...state.value,
      isLoading
    });
  }

  /**
   * Sets error state
   *
   * @param messageId - The message ID containing the poll
   * @param error - Error message
   */
  setError(messageId: string, error: string): void {
    const state = this.getOrCreateStateSubject(messageId);
    state.next({
      ...state.value,
      error,
      isLoading: false
    });
  }

  /**
   * Clears error state
   *
   * @param messageId - The message ID containing the poll
   */
  clearError(messageId: string): void {
    const state = this.getOrCreateStateSubject(messageId);
    state.next({
      ...state.value,
      error: null
    });
  }

  /**
   * Optimistically updates user votes before API confirmation
   * Can be rolled back if API call fails
   *
   * @param messageId - The message ID containing the poll
   * @param optionIds - New option IDs to vote for
   */
  optimisticVoteUpdate(messageId: string, optionIds: string[]): void {
    const state = this.getOrCreateStateSubject(messageId);
    state.next({
      ...state.value,
      userVotedOptionIds: [...optionIds],
      isLoading: true
    });
  }

  /**
   * Rolls back optimistic update on error
   *
   * @param messageId - The message ID containing the poll
   * @param previousOptionIds - Previous option IDs to restore
   */
  rollbackVoteUpdate(messageId: string, previousOptionIds: string[]): void {
    const state = this.getOrCreateStateSubject(messageId);
    state.next({
      ...state.value,
      userVotedOptionIds: [...previousOptionIds],
      isLoading: false
    });
  }

  /**
   * Cleans up state for a specific poll
   *
   * @param messageId - The message ID containing the poll
   */
  cleanup(messageId: string): void {
    const state = this.stateMap.get(messageId);
    if (state) {
      state.complete();
      this.stateMap.delete(messageId);
    }
  }

  /**
   * Cleans up all states
   */
  ngOnDestroy(): void {
    this.stateMap.forEach(state => state.complete());
    this.stateMap.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gets or creates a BehaviorSubject for a poll
   */
  private getOrCreateStateSubject(messageId: string): BehaviorSubject<PollState> {
    let state = this.stateMap.get(messageId);
    if (!state) {
      state = new BehaviorSubject<PollState>(INITIAL_STATE);
      this.stateMap.set(messageId, state);
    }
    return state;
  }

  /**
   * Extracts the option IDs that the current user has voted for
   *
   * @param currentUserId - The current user's ID
   * @param pollResults - The poll results
   * @returns Array of option IDs the user voted for
   */
  private extractUserVotes(currentUserId: string, pollResults: PollResultsDto): string[] {
    if (!pollResults.options) {
      return [];
    }
    
    return pollResults.options
      .filter(option => option.voters?.includes(currentUserId))
      .map(option => option.id ?? '')
      .filter(id => id.length > 0);
  }
}

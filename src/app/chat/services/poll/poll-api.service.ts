import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PollsService } from '../../../api/services';
import { PollResultsDto, VotePollDto } from '../../../api/models';
import { handlePollError } from './poll-error-handler';

/**
 * Enterprise-grade API service for poll operations
 *
 * @remarks
 * This service:
 * - Wraps the generated API service with business logic
 * - Provides strongly-typed methods
 * - Handles errors consistently
 * - Maintains clean separation from UI components
 *
 * Architecture:
 * - Zero business logic (delegated to state service)
 * - Pure HTTP operations only
 * - Observable-based for RxJS composition
 * - Error transformation via centralized handler
 */
@Injectable({
  providedIn: 'root'
})
export class PollApiService {
  constructor(private readonly pollsService: PollsService) { }

  /**
   * Fetches the current poll results
   *
   * @param groupId - The group ID
   * @param messageId - The message ID containing the poll
   * @returns Observable of poll results
   */
  getPollResults(groupId: string, messageId: string): Observable<PollResultsDto> {
    return this.pollsService.apiGroupsGroupIdMessagesMessageIdPollsResultsGet$Json({
      groupId,
      messageId
    }).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No poll data received');
        }
        return response.data;
      }),
      catchError(error => {
        const pollError = handlePollError(error);
        return throwError(() => pollError);
      })
    );
  }

  /**
   * Votes on poll option(s)
   *
   * @param groupId - The group ID
   * @param messageId - The message ID containing the poll
   * @param optionIds - Array of option IDs to vote for
   * @returns Observable of updated poll results
   */
  vote(groupId: string, messageId: string, optionIds: string[]): Observable<PollResultsDto> {
    const dto: VotePollDto = { optionIds };
    
    return this.pollsService.apiGroupsGroupIdMessagesMessageIdPollsVotePost$Json({
      groupId,
      messageId,
      body: dto
    }).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No poll data received after vote');
        }
        return response.data;
      }),
      catchError(error => {
        const pollError = handlePollError(error);
        return throwError(() => pollError);
      })
    );
  }

  /**
   * Removes the user's vote from a poll
   *
   * @param groupId - The group ID
   * @param messageId - The message ID containing the poll
   * @returns Observable of updated poll results
   */
  removeVote(groupId: string, messageId: string): Observable<PollResultsDto> {
    return this.pollsService.apiGroupsGroupIdMessagesMessageIdPollsVoteDelete$Json({
      groupId,
      messageId
    }).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No poll data received after vote removal');
        }
        return response.data;
      }),
      catchError(error => {
        const pollError = handlePollError(error);
        return throwError(() => pollError);
      })
    );
  }
}

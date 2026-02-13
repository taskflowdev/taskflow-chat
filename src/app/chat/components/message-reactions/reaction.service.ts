import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { MessageMetadataService } from '../../../api/services/message-metadata.service';
import { MessageMetadataApiResponse } from '../../../api/models/message-metadata-api-response';
import { GroupedReaction, MessageReactions } from './reaction.models';

/**
 * Service for managing message reactions
 * 
 * Handles:
 * - Adding reactions to messages
 * - Removing reactions from messages
 * - Grouping reactions for display
 * - Optimistic UI updates
 */
@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  // Cache configuration
  private static readonly MAX_CACHE_SIZE = 500; // Maximum number of messages to cache
  
  // Store for optimistic updates
  private reactionsCache = new Map<string, BehaviorSubject<MessageReactions>>();

  constructor(private messageMetadataService: MessageMetadataService) {}

  /**
   * Add a reaction to a message
   * 
   * @param messageId - The message ID
   * @param emoji - The emoji to add
   * @param userId - The current user's ID
   * @returns Observable of the updated metadata
   */
  addReaction(messageId: string, emoji: string, userId: string): Observable<MessageMetadataApiResponse> {
    // Optimistic update
    this.optimisticallyAddReaction(messageId, emoji, userId);

    return this.messageMetadataService
      .apiMessagesMessageIdReactionsEmojiPost$Json({ messageId, emoji })
      .pipe(
        tap(response => {
          // Update cache with server response
          if (response.data?.reactions) {
            this.updateReactionsFromMetadata(messageId, response.data.reactions, userId);
          }
        }),
        catchError(error => {
          // Rollback optimistic update on error
          this.optimisticallyRemoveReaction(messageId, emoji, userId);
          throw error;
        })
      );
  }

  /**
   * Remove a reaction from a message
   * 
   * @param messageId - The message ID
   * @param userId - The current user's ID
   * @returns Observable of the updated metadata
   */
  removeReaction(messageId: string, userId: string): Observable<MessageMetadataApiResponse> {
    // Get current user's emoji for optimistic removal
    const currentReactions = this.reactionsCache.get(messageId)?.value;
    const userEmoji = currentReactions?.reactions.find(r => r.hasCurrentUser)?.emoji;

    if (userEmoji) {
      this.optimisticallyRemoveReaction(messageId, userEmoji, userId);
    }

    return this.messageMetadataService
      .apiMessagesMessageIdReactionsDelete$Json({ messageId })
      .pipe(
        tap(response => {
          // Update cache with server response
          if (response.data?.reactions) {
            this.updateReactionsFromMetadata(messageId, response.data.reactions, userId);
          } else {
            // No reactions left
            this.clearReactions(messageId);
          }
        }),
        catchError(error => {
          // Rollback optimistic update on error
          if (userEmoji) {
            this.optimisticallyAddReaction(messageId, userEmoji, userId);
          }
          throw error;
        })
      );
  }

  /**
   * Get reactions for a message
   * 
   * @param messageId - The message ID
   * @returns Observable of grouped reactions
   */
  getReactions(messageId: string): Observable<MessageReactions> {
    if (!this.reactionsCache.has(messageId)) {
      this.reactionsCache.set(messageId, new BehaviorSubject<MessageReactions>({
        messageId,
        reactions: [],
        totalCount: 0
      }));
    }
    return this.reactionsCache.get(messageId)!.asObservable();
  }

  /**
   * Initialize reactions from message metadata
   * 
   * @param messageId - The message ID
   * @param reactions - Raw reactions object from API (userId -> emoji)
   * @param currentUserId - The current user's ID
   */
  initializeReactions(messageId: string, reactions: { [key: string]: string | null } | undefined, currentUserId: string): void {
    if (!reactions) {
      this.clearReactions(messageId);
      return;
    }

    this.updateReactionsFromMetadata(messageId, reactions, currentUserId);
  }

  /**
   * Group reactions by emoji
   * 
   * @param reactions - Raw reactions object (userId -> emoji)
   * @param currentUserId - The current user's ID
   * @returns Array of grouped reactions
   */
  private groupReactions(reactions: { [key: string]: string | null }, currentUserId: string): GroupedReaction[] {
    const grouped = new Map<string, GroupedReaction>();

    Object.entries(reactions).forEach(([userId, emoji]) => {
      if (!emoji) return;

      if (!grouped.has(emoji)) {
        grouped.set(emoji, {
          emoji,
          count: 0,
          userIds: [],
          hasCurrentUser: false
        });
      }

      const group = grouped.get(emoji)!;
      group.count++;
      group.userIds.push(userId);
      
      if (userId === currentUserId) {
        group.hasCurrentUser = true;
      }
    });

    return Array.from(grouped.values());
  }

  /**
   * Optimistically add a reaction (for immediate UI feedback)
   */
  private optimisticallyAddReaction(messageId: string, emoji: string, userId: string): void {
    const current = this.reactionsCache.get(messageId)?.value || {
      messageId,
      reactions: [],
      totalCount: 0
    };

    const reactions = [...current.reactions];
    const existingIndex = reactions.findIndex(r => r.emoji === emoji);

    if (existingIndex >= 0) {
      // Add to existing emoji group
      reactions[existingIndex] = {
        ...reactions[existingIndex],
        count: reactions[existingIndex].count + 1,
        userIds: [...reactions[existingIndex].userIds, userId],
        hasCurrentUser: true
      };
    } else {
      // Create new emoji group
      reactions.push({
        emoji,
        count: 1,
        userIds: [userId],
        hasCurrentUser: true
      });
    }

    this.updateCache(messageId, {
      messageId,
      reactions,
      totalCount: reactions.reduce((sum, r) => sum + r.count, 0)
    });
  }

  /**
   * Optimistically remove a reaction (for immediate UI feedback)
   */
  private optimisticallyRemoveReaction(messageId: string, emoji: string, userId: string): void {
    const current = this.reactionsCache.get(messageId)?.value;
    if (!current) return;

    const reactions = current.reactions
      .map(r => {
        if (r.emoji === emoji && r.hasCurrentUser) {
          const newUserIds = r.userIds.filter(id => id !== userId);
          if (newUserIds.length === 0) {
            return null; // Remove this reaction group
          }
          return {
            ...r,
            count: r.count - 1,
            userIds: newUserIds,
            hasCurrentUser: false
          };
        }
        return r;
      })
      .filter((r): r is GroupedReaction => r !== null);

    this.updateCache(messageId, {
      messageId,
      reactions,
      totalCount: reactions.reduce((sum, r) => sum + r.count, 0)
    });
  }

  /**
   * Update reactions from server metadata
   */
  private updateReactionsFromMetadata(
    messageId: string, 
    reactions: { [key: string]: string | null }, 
    currentUserId: string
  ): void {
    const grouped = this.groupReactions(reactions, currentUserId);
    this.updateCache(messageId, {
      messageId,
      reactions: grouped,
      totalCount: grouped.reduce((sum, r) => sum + r.count, 0)
    });
  }

  /**
   * Clear all reactions for a message
   */
  private clearReactions(messageId: string): void {
    this.updateCache(messageId, {
      messageId,
      reactions: [],
      totalCount: 0
    });
  }

  /**
   * Update the cache for a message
   * Implements LRU-style cache eviction to prevent memory leaks
   */
  private updateCache(messageId: string, reactions: MessageReactions): void {
    // Check if cache is at max size and this is a new entry
    if (!this.reactionsCache.has(messageId) && 
        this.reactionsCache.size >= ReactionService.MAX_CACHE_SIZE) {
      // Remove oldest entry (first entry in Map)
      const firstKey = this.reactionsCache.keys().next().value;
      if (firstKey) {
        this.reactionsCache.delete(firstKey);
      }
    }

    if (!this.reactionsCache.has(messageId)) {
      this.reactionsCache.set(messageId, new BehaviorSubject(reactions));
    } else {
      this.reactionsCache.get(messageId)!.next(reactions);
    }
  }

  /**
   * Clear cache for a specific message (useful for cleanup)
   */
  clearCache(messageId: string): void {
    this.reactionsCache.delete(messageId);
  }
}

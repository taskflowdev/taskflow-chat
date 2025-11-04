import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MessageDto, GroupDto, PresenceDto } from '../../../api/models';
import { TypingDto } from '../models';

/**
 * Interface for real-time state management
 */
export interface RealtimeState {
  /** Map of groupId to messages array */
  messages: Map<string, MessageDto[]>;
  /** Map of groupId to presence list */
  presence: Map<string, PresenceDto[]>;
  /** Map of groupId to currently typing users */
  typingUsers: Map<string, TypingDto[]>;
  /** Set of joined group IDs for reconnection */
  joinedGroups: Set<string>;
  /** Connection status */
  isConnected: boolean;
  /** Connection error if any */
  connectionError?: string;
}

/**
 * Centralized store for real-time chat state management
 * Provides OnPush change detection compatible observables
 * 
 * @remarks
 * This store follows enterprise-grade state management patterns:
 * - Immutable state updates
 - Single source of truth
 * - Type-safe observable streams
 * - Memory efficient with cleanup methods
 */
@Injectable({
  providedIn: 'root'
})
export class ChatRealtimeStore implements OnDestroy {
  private readonly state$ = new BehaviorSubject<RealtimeState>({
    messages: new Map(),
    presence: new Map(),
    typingUsers: new Map(),
    joinedGroups: new Set(),
    isConnected: false
  });

  /**
   * Observable stream of complete state
   * Use sparingly - prefer specific selectors for performance
   */
  readonly state: Observable<RealtimeState> = this.state$.asObservable();

  /**
   * Get current state snapshot
   */
  get currentState(): RealtimeState {
    return this.state$.value;
  }

  /**
   * Update connection status
   */
  setConnectionStatus(isConnected: boolean, error?: string): void {
    const current = this.currentState;
    this.state$.next({
      ...current,
      isConnected,
      connectionError: error
    });
  }

  /**
   * Add a group to the joined groups set
   * Used for tracking groups to rejoin on reconnection
   */
  addJoinedGroup(groupId: string): void {
    const current = this.currentState;
    const newJoinedGroups = new Set(current.joinedGroups);
    newJoinedGroups.add(groupId);
    
    this.state$.next({
      ...current,
      joinedGroups: newJoinedGroups
    });
  }

  /**
   * Remove a group from the joined groups set
   */
  removeJoinedGroup(groupId: string): void {
    const current = this.currentState;
    const newJoinedGroups = new Set(current.joinedGroups);
    newJoinedGroups.delete(groupId);
    
    this.state$.next({
      ...current,
      joinedGroups: newJoinedGroups
    });
  }

  /**
   * Get list of joined groups for reconnection
   */
  getJoinedGroups(): string[] {
    return Array.from(this.currentState.joinedGroups);
  }

  /**
   * Add a new message to a group's message list
   * Maintains chronological order
   */
  addMessage(groupId: string, message: MessageDto): void {
    const current = this.currentState;
    const newMessages = new Map(current.messages);
    const groupMessages = newMessages.get(groupId) || [];
    
    // Avoid duplicates - check by messageId
    if (!groupMessages.some(m => m.messageId === message.messageId)) {
      newMessages.set(groupId, [...groupMessages, message]);
      
      this.state$.next({
        ...current,
        messages: newMessages
      });
    }
  }

  /**
   * Initialize messages for a group (from REST API history)
   */
  setGroupMessages(groupId: string, messages: MessageDto[]): void {
    const current = this.currentState;
    const newMessages = new Map(current.messages);
    newMessages.set(groupId, [...messages]);
    
    this.state$.next({
      ...current,
      messages: newMessages
    });
  }

  /**
   * Get messages for a specific group
   */
  getGroupMessages(groupId: string): MessageDto[] {
    return this.currentState.messages.get(groupId) || [];
  }

  /**
   * Update presence for a group
   */
  updatePresence(groupId: string, presence: PresenceDto[]): void {
    const current = this.currentState;
    const newPresence = new Map(current.presence);
    newPresence.set(groupId, [...presence]);
    
    this.state$.next({
      ...current,
      presence: newPresence
    });
  }

  /**
   * Get presence for a specific group
   */
  getGroupPresence(groupId: string): PresenceDto[] {
    return this.currentState.presence.get(groupId) || [];
  }

  /**
   * Update typing indicator for a user in a group
   */
  updateTyping(typingInfo: TypingDto): void {
    const current = this.currentState;
    const newTypingUsers = new Map(current.typingUsers);
    const groupTyping = newTypingUsers.get(typingInfo.groupId) || [];
    
    if (typingInfo.isTyping) {
      // Add or update typing user
      const filtered = groupTyping.filter(t => t.userId !== typingInfo.userId);
      newTypingUsers.set(typingInfo.groupId, [...filtered, typingInfo]);
    } else {
      // Remove typing user
      const filtered = groupTyping.filter(t => t.userId !== typingInfo.userId);
      if (filtered.length > 0) {
        newTypingUsers.set(typingInfo.groupId, filtered);
      } else {
        newTypingUsers.delete(typingInfo.groupId);
      }
    }
    
    this.state$.next({
      ...current,
      typingUsers: newTypingUsers
    });
  }

  /**
   * Get typing users for a specific group
   */
  getGroupTypingUsers(groupId: string): TypingDto[] {
    return this.currentState.typingUsers.get(groupId) || [];
  }

  /**
   * Clear all messages for a group
   * Useful when leaving a group or on logout
   */
  clearGroupMessages(groupId: string): void {
    const current = this.currentState;
    const newMessages = new Map(current.messages);
    newMessages.delete(groupId);
    
    this.state$.next({
      ...current,
      messages: newMessages
    });
  }

  /**
   * Clear entire store state
   * Use on logout or app cleanup
   */
  clearAll(): void {
    this.state$.next({
      messages: new Map(),
      presence: new Map(),
      typingUsers: new Map(),
      joinedGroups: new Set(),
      isConnected: false
    });
  }

  /**
   * Clean up resources
   */
  ngOnDestroy(): void {
    this.state$.complete();
  }
}

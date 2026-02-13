/**
 * Reaction Models and Interfaces
 * 
 * Defines the type system for message reactions.
 */

/**
 * Represents a single user's reaction to a message
 */
export interface UserReaction {
  userId: string;
  emoji: string;
  timestamp?: string;
}

/**
 * Represents a grouped reaction with count
 * Used for displaying reactions in the UI
 */
export interface GroupedReaction {
  emoji: string;
  count: number;
  userIds: string[];
  hasCurrentUser: boolean;
}

/**
 * Represents the complete reaction state for a message
 */
export interface MessageReactions {
  messageId: string;
  reactions: GroupedReaction[];
  totalCount: number;
}

/**
 * Emoji data structure for the picker
 */
export interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  shortcodes?: string;
  keywords?: string[];
  emoticons?: string[];
}

/**
 * Emoji event emitted by the picker
 */
export interface EmojiEvent {
  emoji: EmojiData;
}

/**
 * Position configuration for reaction picker
 */
export interface PickerPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

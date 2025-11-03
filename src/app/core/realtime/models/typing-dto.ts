/**
 * DTO for typing indicator information
 * This model is not part of OpenAPI spec as typing indicators are real-time only
 */
export interface TypingDto {
  /**
   * Group ID where typing is occurring
   */
  groupId: string;

  /**
   * User ID who is typing
   */
  userId: string;

  /**
   * User display name
   */
  userName: string;

  /**
   * Whether user is currently typing
   */
  isTyping: boolean;
}

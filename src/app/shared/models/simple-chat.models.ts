/* 
 * Simplified types to work around auto-generated API circular reference issues
 * These types provide the essential functionality needed for the chat components
 * while avoiding the problematic circular references in the auto-generated models
 */

export interface SimpleMessageDto {
  messageId?: string;
  senderId?: string;
  senderName?: string;
  content?: SimpleMessageContent;
  contentType?: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll';
  messageType?: 'userMessage' | 'userJoined' | 'userLeft' | 'groupCreated' | 'groupUpdated' | 'groupDeleted' | 'memberRoleChanged' | 'inviteCodeRegenerated';
  sourceType?: 'user' | 'system';
  createdAt?: string;
  groupId?: string;
}

export interface SimpleMessageContent {
  $type: string;
  text?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  // Poll-specific fields would go here
  question?: string;
  options?: string[];
}

export interface SimpleGroupDto {
  groupId?: string;
  name?: string;
  memberCount?: number;
  createdAt?: string;
  inviteCode?: string;
}

export interface SimpleSendMessageDto {
  content: SimpleMessageContent;
  contentType?: 'text' | 'file' | 'image' | 'audio' | 'video' | 'poll';
  messageType?: 'userMessage' | 'userJoined' | 'userLeft' | 'groupCreated' | 'groupUpdated' | 'groupDeleted' | 'memberRoleChanged' | 'inviteCodeRegenerated';
  metadata?: any;
}

export interface SimpleApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}
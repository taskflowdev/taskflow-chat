/**
 * Chat Services Index
 * 
 * Central export point for all chat-related proxy services.
 * Provides a clean interface for importing chat services throughout the application.
 * Follows MNC coding standards for modular architecture.
 */

export { GroupsServiceProxy } from './groups-service-proxy';
export type { GroupWithMessages } from './groups-service-proxy';

export { MessageDisplayServiceProxy } from './message-display-service-proxy';
export type { MessagePreview } from './message-display-service-proxy';

export { MessageFactoryServiceProxy } from './message-factory-service-proxy';
export type { 
  ExtendedTextContent,
  ExtendedImageContent,
  ExtendedVideoContent,
  ExtendedPollContent,
  ExtendedGeneralFileContent,
  PollOption
} from './message-factory-service-proxy';

// Type guards for content validation
export {
  isTextContent,
  isImageContent,
  isVideoContent,
  isPollContent,
  isGeneralFileContent
} from './message-display-service-proxy';

// Auto-scroll service for WhatsApp-like behavior
export { AutoScrollService } from './auto-scroll.service';
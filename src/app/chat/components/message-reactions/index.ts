/**
 * Message Reactions Module Exports
 * 
 * Public API for the message reactions feature.
 * Import from this file to use reaction components and services.
 */

// Components
export { MessageReactionComponent } from './message-reaction.component';
export { ReactionPickerComponent } from './reaction-picker.component';

// Services
export { ReactionService } from './reaction.service';

// Models & Interfaces
export {
  UserReaction,
  GroupedReaction,
  MessageReactions,
  EmojiData,
  EmojiEvent,
  PickerPosition
} from './reaction.models';

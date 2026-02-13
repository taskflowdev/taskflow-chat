# Message Reactions Feature

## Overview

This directory contains the implementation of WhatsApp-style message reactions for the TaskFlow Chat application. The feature allows users to react to messages with emojis, similar to popular messaging platforms like WhatsApp, Telegram, and Slack.

## Architecture

### Components

#### 1. **MessageReactionComponent**
- **Purpose**: Displays reactions on message bubbles
- **Location**: `message-reaction.component.ts`
- **Features**:
  - WhatsApp-style positioning on bottom-right border of message bubble
  - Groups same emojis with count display
  - Highlights current user's reactions
  - Click to toggle reactions
  - Fully accessible with ARIA labels and keyboard navigation
  - Responsive design for mobile and desktop

#### 2. **ReactionPickerComponent**
- **Purpose**: Emoji picker for selecting reactions
- **Location**: `reaction-picker.component.ts`
- **Features**:
  - Wraps `@ctrl/ngx-emoji-mart` library
  - Dynamic positioning based on message location
  - Theme integration (light/dark mode)
  - Outside click detection
  - ESC key to close
  - Focus trap for accessibility
  - Responsive sizing for different screen sizes

### Services

#### 3. **ReactionService**
- **Purpose**: Manages reaction state and API communication
- **Location**: `reaction.service.ts`
- **Features**:
  - Add/remove reactions via API
  - Optimistic UI updates with rollback on error
  - Reaction grouping and counting
  - In-memory caching for performance
  - Observable-based state management

### Models

#### 4. **Reaction Models**
- **Purpose**: Type definitions for reactions
- **Location**: `reaction.models.ts`
- **Types**:
  - `UserReaction`: Single user's reaction
  - `GroupedReaction`: Aggregated reactions by emoji
  - `MessageReactions`: Complete reaction state for a message
  - `EmojiData`: Emoji picker data structure
  - `EmojiEvent`: Emoji selection event
  - `PickerPosition`: Picker positioning configuration

## Integration

### Chat Message Component

The reactions are integrated into the existing `ChatMessageComponent`:

```typescript
// In chat-message.component.ts
import { MessageReactionComponent } from '../message-reactions/message-reaction.component';
import { ReactionPickerComponent } from '../message-reactions/reaction-picker.component';
import { ReactionService } from '../message-reactions/reaction.service';
```

### HTML Template

```html
<!-- Reaction button beside reply icon -->
<button class="reaction-btn" (click)="onReactionClick($event)">
  <i class="bi bi-emoji-smile"></i>
</button>

<!-- Reactions display on message bubble -->
<app-message-reaction
  [messageId]="message.messageId"
  [currentUserId]="message.currentUserId ?? ''"
  [isOwnMessage]="message.isOwn"
  (reactionToggled)="onReactionToggled($event)">
</app-message-reaction>

<!-- Picker overlay -->
<app-reaction-picker
  *ngIf="showReactionPicker"
  [position]="pickerPosition"
  (emojiSelected)="onEmojiSelected($event)"
  (closed)="closeReactionPicker()">
</app-reaction-picker>
```

## API Integration

The feature integrates with existing API endpoints:

### Add Reaction
```
POST /api/messages/{messageId}/reactions/{emoji}
```

### Remove Reaction
```
DELETE /api/messages/{messageId}/reactions
```

These endpoints are accessed via the auto-generated `MessageMetadataService`.

## Styling

### Design System Integration

The components use TaskFlow's design token system:

- `--taskflow-color-surface-primary`: Reaction container background
- `--taskflow-color-accent`: Highlighted reaction color
- `--taskflow-color-background-hover`: Hover state
- `--taskflow-color-text-secondary`: Count text color
- All responsive breakpoints follow app standards

### SCSS Files

- `message-reaction.component.scss`: Reaction display styling
- `reaction-picker.component.scss`: Emoji picker styling

## Performance

### Optimizations

1. **OnPush Change Detection**: All components use `ChangeDetectionStrategy.OnPush`
2. **TrackBy Functions**: Used in `*ngFor` loops to minimize re-renders
3. **Optimistic Updates**: Immediate UI feedback with API call in background
4. **Lazy Loading**: Emoji picker loads on demand
5. **In-Memory Cache**: Reactions cached per message to reduce API calls

## Accessibility

### WCAG 2.1 Compliance

- ✅ Keyboard navigation (Tab, Enter, Space, ESC)
- ✅ ARIA labels for all interactive elements
- ✅ Focus trap in emoji picker
- ✅ Screen reader support
- ✅ High contrast mode compatible
- ✅ Focus indicators

### Keyboard Shortcuts

- **Tab**: Navigate between reactions
- **Enter/Space**: Toggle reaction
- **ESC**: Close emoji picker
- **Arrow Keys**: Navigate emoji picker (via ngx-emoji-mart)

## Responsive Design

### Breakpoints

- **Desktop (>768px)**: Full-size reactions, 8 emojis per line in picker
- **Tablet (480px-768px)**: Slightly smaller, 7 emojis per line
- **Mobile (<480px)**: Compact reactions, 6 emojis per line, picker slides up from bottom

### Mobile Enhancements

- Touch-optimized tap targets
- Swipe-friendly positioning
- Bottom sheet picker on mobile
- Reduced padding and spacing
- Wrapped reactions for small bubbles

## Testing

### Unit Tests

Each component and service has comprehensive unit tests:

- `reaction.service.spec.ts`: Service logic, API calls, optimistic updates
- `message-reaction.component.spec.ts`: Reaction display, user interactions
- `reaction-picker.component.spec.ts`: Picker behavior, theme integration

### Test Coverage

- ✅ Service initialization and API integration
- ✅ Optimistic updates and rollback
- ✅ Reaction grouping and counting
- ✅ Component lifecycle
- ✅ User interactions (click, keyboard)
- ✅ Tooltip and ARIA label generation
- ✅ Theme switching
- ✅ Responsive behavior

## Future Enhancements

### Planned Features

1. **Reaction Analytics**: Track most used emojis
2. **User List Tooltip**: Show who reacted on hover
3. **Real-time Updates**: WebSocket integration for live reaction updates
4. **Custom Emoji**: Support for custom/workspace emojis
5. **Reaction History**: View reaction timeline
6. **Long Press Menu**: Quick emoji access on mobile
7. **Reaction Categories**: Organize reactions by category

### Extensibility

The architecture is designed to be easily extensible:

- Add new reaction types by extending models
- Customize picker behavior via configuration
- Integrate with analytics services
- Add custom emoji sets
- Implement real-time sync with SignalR

## Dependencies

### External Libraries

- **@ctrl/ngx-emoji-mart** (v9.3.0): Emoji picker component
  - Lightweight and performant
  - Native emoji support
  - Theme integration
  - Well-maintained

### Internal Dependencies

- `MessageMetadataService`: API communication
- `ThemeService`: Theme detection
- `CommonTooltipDirective`: Tooltip functionality

## Configuration

No additional configuration required. The feature works out of the box with:

- Auto-generated API client
- Existing theme system
- Current user context from message data

## Troubleshooting

### Common Issues

**Reactions not appearing?**
- Ensure `message.metadata.reactions` is populated
- Verify `message.currentUserId` is set
- Check browser console for API errors

**Picker not opening?**
- Verify `@ctrl/ngx-emoji-mart` is installed
- Check for JavaScript errors
- Ensure button click handler is working

**Theme not switching?**
- Verify `ThemeService` is working
- Check theme subscription in picker component
- Inspect CSS custom properties

## Contributing

When extending this feature:

1. Follow existing naming conventions
2. Add unit tests for new functionality
3. Update this documentation
4. Ensure WCAG 2.1 compliance
5. Test on mobile and desktop
6. Use TypeScript strict mode
7. Follow Angular style guide

## License

Part of TaskFlow Chat application.

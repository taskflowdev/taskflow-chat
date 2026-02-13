# Message Reactions - Quick Start Guide

## 🚀 Getting Started

The message reactions feature is now fully integrated into TaskFlow Chat. Here's everything you need to know to use and maintain it.

## 📁 Project Structure

```
src/app/chat/components/message-reactions/
├── README.md                          # Full feature documentation
├── index.ts                           # Public API exports
├── reaction.models.ts                 # TypeScript interfaces
├── reaction.service.ts                # Business logic & API
├── reaction.service.spec.ts           # Service tests
├── message-reaction.component.ts      # Display component
├── message-reaction.component.scss    # Display styles
├── message-reaction.component.spec.ts # Display tests
├── reaction-picker.component.ts       # Emoji picker
├── reaction-picker.component.scss     # Picker styles
└── reaction-picker.component.spec.ts  # Picker tests
```

## 🎨 User Experience Flow

```
1. User hovers over message
   ↓
2. Reaction button appears (beside reply button)
   ↓
3. User clicks reaction button
   ↓
4. Emoji picker opens (positioned intelligently)
   ↓
5. User selects emoji
   ↓
6. Reaction appears instantly on message (optimistic update)
   ↓
7. API call completes in background
   ↓
8. If error: reaction is removed automatically
```

## 💻 How to Use (Developer Guide)

### Using in a Component

```typescript
import { MessageReactionComponent, ReactionPickerComponent } from './message-reactions';

@Component({
  imports: [MessageReactionComponent, ReactionPickerComponent]
})
```

### Initializing Reactions

```typescript
// In your message component
ngOnInit() {
  this.reactionService.initializeReactions(
    messageId,
    messageMetadata.reactions, // From API
    currentUserId
  );
}
```

### Adding a Reaction

```typescript
this.reactionService
  .addReaction(messageId, emoji, userId)
  .subscribe({
    next: () => console.log('Reaction added'),
    error: (err) => console.error('Failed:', err)
  });
```

### Removing a Reaction

```typescript
this.reactionService
  .removeReaction(messageId, userId)
  .subscribe({
    next: () => console.log('Reaction removed'),
    error: (err) => console.error('Failed:', err)
  });
```

## 🎯 Key Features

### 1. Optimistic Updates
- Reactions appear instantly
- No waiting for API response
- Automatic rollback on error

### 2. Smart Positioning
- Picker avoids screen edges
- Adjusts for message position
- Works on mobile and desktop

### 3. Theme Integration
- Automatically uses light/dark theme
- Matches app design tokens
- No manual theme handling needed

### 4. Performance
- OnPush change detection
- LRU cache (max 500 messages)
- Minimal re-renders

### 5. Accessibility
- Full keyboard navigation
- Screen reader support
- ARIA labels everywhere
- Focus management

## 🔧 Configuration

No configuration needed! The feature works out of the box with:
- Existing API endpoints
- Current theme system
- User context from messages

## 🐛 Debugging

### Check if reactions are loading:
```typescript
this.reactionService.getReactions(messageId).subscribe(reactions => {
  console.log('Reactions:', reactions);
});
```

### Inspect cache:
```typescript
// In ReactionService
console.log('Cache size:', this.reactionsCache.size);
```

### Check API calls:
Open browser DevTools → Network → Filter by "reactions"

## 📊 Performance Tips

1. **Cache Limits**: Service automatically limits cache to 500 messages
2. **Cleanup**: Call `reactionService.clearCache(messageId)` when messages are removed
3. **Optimizations**: All components use OnPush change detection

## 🔐 Security Notes

- ✅ All inputs are validated
- ✅ API calls are authenticated
- ✅ No XSS vulnerabilities
- ✅ CodeQL verified clean

## 🧪 Testing

### Run Unit Tests
```bash
npm test -- --include='**/message-reactions/**/*.spec.ts'
```

### Test Coverage
- Service: API calls, optimistic updates, caching
- Components: User interactions, accessibility
- Integration: Full reaction flow

## 🎨 Styling

### Customizing Colors
Edit theme tokens in `src/theme/theme.light.json` and `theme.dark.json`:

```json
{
  "accent": "#0969da",           // Highlighted reaction color
  "surfacePrimary": "#ffffff",   // Reaction container background
  "backgroundHover": "#f6f8fa"   // Hover state
}
```

### Customizing Sizes
Edit constants in components:

```typescript
// ReactionPickerComponent
private static readonly MOBILE_BREAKPOINT = 480;
private static readonly TABLET_BREAKPOINT = 768;

// ReactionService
private static readonly MAX_CACHE_SIZE = 500;
```

## 📱 Responsive Behavior

| Screen Size | Emojis/Line | Reaction Size |
|------------|-------------|---------------|
| Desktop (>768px) | 8 | Normal |
| Tablet (480-768px) | 7 | Medium |
| Mobile (<480px) | 6 | Compact |

## 🚨 Common Issues

### Issue: Reactions not appearing
**Solution**: Verify message has `metadata.reactions` and `currentUserId`

### Issue: Picker not opening
**Solution**: Check browser console for errors, verify @ctrl/ngx-emoji-mart is installed

### Issue: Theme not switching
**Solution**: Verify ThemeService is working, check CSS custom properties

### Issue: Memory leak warning
**Solution**: Cache is limited to 500 messages. Check if clearCache() is called properly.

## 🔄 Future Enhancements

Ready to add:
- [ ] Show user list on reaction hover
- [ ] Real-time updates via SignalR
- [ ] Custom emoji support
- [ ] Reaction analytics
- [ ] Long press for quick reactions

## 📚 Additional Resources

- **Full Documentation**: `src/app/chat/components/message-reactions/README.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **API Reference**: See `MessageMetadataService` JSDoc comments
- **Type Definitions**: `reaction.models.ts`

## 💡 Pro Tips

1. **Keyboard Users**: Press Tab to navigate reactions, Enter/Space to toggle
2. **Mobile Users**: Picker slides up from bottom on small screens
3. **Performance**: Cache is automatically managed, no manual cleanup needed
4. **Testing**: Use Chrome DevTools → Application → Local Storage to inspect state
5. **Debugging**: Enable verbose logging in ReactionService for development

## 🎓 Best Practices

1. Always provide `currentUserId` to message components
2. Initialize reactions in `ngOnInit()`, not constructor
3. Use the provided `index.ts` for clean imports
4. Don't modify auto-generated API service code
5. Follow existing patterns when extending

## ✅ Checklist for New Developers

- [ ] Read feature README.md
- [ ] Review reaction.models.ts for types
- [ ] Understand ReactionService architecture
- [ ] Check out existing tests for examples
- [ ] Test on mobile and desktop
- [ ] Verify accessibility with keyboard only
- [ ] Review theme integration

---

## 🎉 You're Ready!

The reactions feature is production-ready and fully documented. For questions or issues, refer to the comprehensive README.md in the reactions folder.

**Happy coding! 🚀**

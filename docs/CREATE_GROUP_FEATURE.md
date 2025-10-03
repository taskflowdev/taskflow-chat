# Create Group Feature

## Overview
This feature allows users to create new chat groups through an intuitive dialog interface that matches the application's login/signup design patterns.

## Components

### CreateGroupDialogComponent
Location: `src/app/chat/components/create-group-dialog/`

A standalone Angular component that provides a modal dialog for creating new groups.

**Features:**
- Reactive form with validation (3-50 characters)
- Matches login/signup styling (dark theme, consistent spacing)
- Blur background effect
- Smooth animations
- Toast notifications for success/error

**Usage:**
The dialog is controlled by the URL fragment `#new-group`. When this fragment is present, the dialog automatically opens.

## URL Fragment Routing

The feature uses URL fragments to manage dialog state:

- **Open dialog**: Navigate to `/chats#new-group`
- **Close dialog**: Fragment is removed from URL
- **Refresh behavior**: Dialog reopens if fragment is present

### Implementation Details

The `MainChatComponent` listens to route fragment changes:

```typescript
this.route.fragment.subscribe(fragment => {
  this.showCreateGroupDialog = fragment === 'new-group';
});
```

## API Integration

The feature integrates with the `GroupsService` API:

```typescript
this.groupsService.apiGroupsPost$Json({
  body: {
    name: groupName,
    isPublic: false
  }
})
```

**Success Flow:**
1. API call succeeds
2. Success toast notification
3. Dialog closes (fragment removed)
4. Page reloads to show new group

**Error Flow:**
1. API call fails
2. Error toast notification with message
3. Dialog remains open
4. User can retry or cancel

## User Interactions

### Opening the Dialog

Users can open the create group dialog in multiple ways:

1. **Sidebar Header Button**: Click the `+` button in the chat sidebar
2. **Empty State Button**: Click "New Group" when no chats exist
3. **Direct URL**: Navigate to `/chats#new-group`

### Form Validation

- **Group Name**: Required, 3-50 characters
- Real-time validation with error messages
- Submit button disabled when form is invalid

### Closing the Dialog

- Click the X button
- Click Cancel button
- Click outside the dialog (on overlay)
- Submit successfully

## Styling

The dialog matches the application's authentication forms:

- **Background**: Black (`#000000`)
- **Borders**: Dark gray (`#444444`)
- **Text**: White with gray subtitles (`#9ca3af`)
- **Primary Button**: White background, black text
- **Secondary Button**: Transparent with border
- **Input Fields**: Black background with gray border
- **Overlay**: Black with 60% opacity + 5px blur

## Responsive Design

The dialog is fully responsive:

- Max width: 450px
- Padding adjusts for mobile (2rem → 1.5rem → 1.25rem)
- Font sizes adjust for smaller screens
- Touch-friendly buttons and inputs

## Future Enhancements

This implementation provides a foundation for future features:

1. **Member Selection**: Add a multi-select component for choosing group members
2. **Group Avatar**: Allow users to upload a group image
3. **Group Description**: Add an optional description field
4. **Privacy Settings**: Toggle between public/private groups
5. **Invite Links**: Generate shareable invite links

## Files Changed

### New Files
- `src/app/chat/components/create-group-dialog/create-group-dialog.component.ts`
- `src/app/chat/components/create-group-dialog/create-group-dialog.component.html`
- `src/app/chat/components/create-group-dialog/create-group-dialog.component.scss`

### Modified Files
- `src/app/chat/components/main-chat/main-chat.component.ts`
- `src/app/chat/components/main-chat/main-chat.component.html`
- `src/app/chat/components/chat-sidebar/chat-sidebar.component.ts`
- `src/app/chat/components/chat-sidebar/chat-sidebar.component.html`

## Testing

To test the feature:

1. **Build**: `npm run build` - Verify no errors
2. **Development**: `npm start` - Start dev server
3. **Navigate**: Go to `/chats` (requires authentication)
4. **Open Dialog**: Click the `+` button or navigate to `/chats#new-group`
5. **Test Validation**: Try submitting with invalid input
6. **Test API**: Submit with valid input (requires backend)
7. **Test URL**: Refresh page with `#new-group` fragment

## Notes

- Component is standalone (no module registration needed)
- Uses Angular reactive forms for validation
- Leverages existing ToastService for notifications
- No new external dependencies added
- Follows application's existing design patterns

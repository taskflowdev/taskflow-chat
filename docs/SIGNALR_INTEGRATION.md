# SignalR Real-Time Chat Integration

This document describes the SignalR real-time chat integration implemented in the taskflow-chat Angular application.

## Overview

The application now uses SignalR for real-time bidirectional communication between clients and the server, replacing the previous polling-based approach for message updates. This provides:

- **Instant message delivery** - Messages appear immediately without polling delays
- **Typing indicators** - See when other users are typing in real-time
- **Presence updates** - Track online/offline status of group members
- **Automatic reconnection** - Graceful recovery from connection failures
- **Optimized bandwidth** - No unnecessary polling requests

## Architecture

### Module Structure

```
src/app/core/realtime/
├── models/
│   ├── typing-dto.ts          # TypingDto interface
│   └── index.ts
├── services/
│   ├── chat-realtime.service.ts     # SignalR connection & hub methods
│   └── index.ts
├── stores/
│   ├── chat-realtime.store.ts       # Centralized state management
│   └── index.ts
└── index.ts
```

### Key Components

#### 1. ChatRealtimeService

Enterprise-grade SignalR service with:

- **Connection Management**
  - Automatic connection on app init
  - JWT token-based authentication
  - Exponential backoff reconnection (2s, 4s, 8s, 16s, 32s, max 60s)
  - Auto-rejoin groups after reconnection

- **Hub Methods**
  - `connect(apiUrl, accessToken)` - Initialize SignalR connection
  - `joinGroup(groupId)` - Join a group for real-time updates
  - `leaveGroup(groupId)` - Leave a group
  - `sendMessage(groupId, message)` - Send message via SignalR
  - `sendTypingIndicator(groupId, isTyping)` - Send typing status
  - `getGroupPresence(groupId)` - Request presence information

- **Event Handlers**
  - `ReceiveMessage` - New user messages
  - `UserTyping` - Typing indicator updates
  - `PresenceUpdate` - User online/offline status
  - Connection lifecycle events (reconnecting, reconnected, closed)

- **REST API Integration**
  - `getMessageHistory()` - Fetch message history with pagination
  - `getGroups()` - Fetch user's group list
  - `getPresenceViaREST()` - Fetch presence info via REST

#### 2. ChatRealtimeStore

Centralized state management for real-time data:

- **State Management**
  - Messages per group (Map<groupId, MessageDto[]>)
  - Presence per group (Map<groupId, PresenceDto[]>)
  - Typing users per group (Map<groupId, TypingDto[]>)
  - Joined groups (Set<groupId>) for reconnection
  - Connection status

- **Immutable Updates**
  - All state updates create new objects
  - Compatible with OnPush change detection
  - Type-safe observable streams

- **Memory Management**
  - Efficient cleanup methods
  - No memory leaks with proper subscription management

#### 3. TypingDto Model

```typescript
export interface TypingDto {
  groupId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}
```

## Integration with Existing Code

### Main Chat Component

**Initialization:**
```typescript
async ngOnInit() {
  // Initialize SignalR connection
  await this.chatRealtimeService.connect(apiUrl, token);
  
  // Subscribe to real-time events
  this.subscribeToRealtimeEvents();
}
```

**Message Handling:**
```typescript
private handleRealtimeMessage(message: MessageDto) {
  // Update chat list with new message
  // Increment unread count if not current chat
  // Append to conversation if currently open
}
```

**Typing Handling:**
```typescript
private handleTypingIndicator(typingInfo: TypingDto) {
  if (typingInfo.isTyping) {
    this.currentTypingUsers.push(typingInfo.userName);
  } else {
    this.currentTypingUsers = this.currentTypingUsers.filter(
      name => name !== typingInfo.userName
    );
  }
}
```

### Chat Conversation Component

**Typing Indicator UI:**
- Animated dots with staggered timing
- Smart text display: "User is typing...", "User1 and User2 are typing...", etc.
- Fade-in animation
- 3-second inactivity timeout

**Message Sending:**
```typescript
async onSendMessage(content: string) {
  // Try SignalR first
  if (this.chatRealtimeService.isConnected) {
    await this.chatRealtimeService.sendMessage(groupId, message);
  } else {
    // Fallback to REST API
    this.sendMessageViaREST(content);
  }
}
```

## Connection Lifecycle

### 1. Connection Establishment

```
User Login
    ↓
Get Auth Token
    ↓
Initialize SignalR Connection
    ↓
Connect to /chathub endpoint
    ↓
Authentication via JWT token
    ↓
Connection Established
```

### 2. Automatic Reconnection

```
Connection Lost
    ↓
Trigger Reconnection (onreconnecting)
    ↓
Wait: 2s → 4s → 8s → 16s → 32s → max 60s
    ↓
Attempt Reconnection
    ↓
Connection Restored (onreconnected)
    ↓
Auto-rejoin all previously joined groups
    ↓
Resume Normal Operation
```

### 3. Group Management

```
User Selects Chat
    ↓
Call joinGroup(groupId)
    ↓
Store groupId for reconnection
    ↓
Receive real-time updates for this group
    ↓
User Leaves Chat
    ↓
Call leaveGroup(groupId)
    ↓
Remove groupId from tracking
    ↓
Stop receiving updates for this group
```

## Error Handling

### Connection Errors
- **Initial Connection Failure**: App continues with REST API only
- **Reconnection Failure**: Exponential backoff retry with max attempts
- **Connection Loss**: Graceful degradation to REST API

### Message Sending Errors
- **SignalR Unavailable**: Automatic fallback to REST API
- **Network Error**: Show error message, remove optimistic update
- **Timeout**: 10-second timeout for optimistic messages

### Typing Indicators
- **Silent Failure**: Typing indicators fail silently if SignalR unavailable
- **No Retry**: Non-critical feature, doesn't block user actions

## Performance Optimizations

### 1. Bandwidth Efficiency
- **Before**: Polling every N seconds for all groups
- **After**: Real-time push only when events occur

### 2. Server Load Reduction
- **Before**: N clients × M groups × polling frequency = high load
- **After**: WebSocket connections with minimal overhead

### 3. User Experience
- **Before**: 1-5 second message delay depending on polling interval
- **After**: Instant message delivery (< 100ms)

### 4. Bundle Size
- Added SignalR library: +73.8 KB (chat module)
- Added typing indicator: +3 KB
- **Total**: +76.8 KB (compressed)

## Backend Requirements

The frontend expects the following SignalR hub methods on the backend:

### Hub Methods (Client → Server)

```csharp
public class ChatHub : Hub
{
    // Join a group to receive updates
    Task JoinGroup(string groupIdOrInviteCode);
    
    // Leave a group
    Task LeaveGroup(string groupId);
    
    // Send a message to a group
    Task SendMessage(string groupId, SendMessageDto message);
    
    // Send typing indicator
    Task SendTypingIndicator(string groupId, bool isTyping);
    
    // Request presence information
    Task GetGroupPresence(string groupId);
}
```

### Hub Events (Server → Client)

```csharp
// Receive a new message
await Clients.Group(groupId).SendAsync("ReceiveMessage", messageDto);

// Receive typing indicator
await Clients.OthersInGroup(groupId).SendAsync("UserTyping", typingDto);

// Receive presence update
await Clients.Group(groupId).SendAsync("PresenceUpdate", presenceList);
```

## Testing

### Unit Tests

Located in:
- `chat-realtime.service.spec.ts`
- `chat-realtime.store.spec.ts`

Run tests:
```bash
npm test -- --include='**/chat-realtime*.spec.ts'
```

### Manual Testing Checklist

- [ ] SignalR connection establishes on login
- [ ] Messages appear instantly in real-time
- [ ] Typing indicators show/hide correctly
- [ ] Connection reconnects after network loss
- [ ] Groups auto-rejoin after reconnection
- [ ] REST API fallback works when SignalR unavailable
- [ ] No console errors in normal operation
- [ ] Optimistic UI updates work correctly
- [ ] Multiple tabs sync properly
- [ ] Typing timeout works (3 seconds)

## Configuration

### API URL Configuration

The SignalR connection uses the API URL from `AppConfigService`:

```typescript
// public/config.json
{
  "apiUrl": "https://api.example.com",
  "encryptionKey": "...",
  "production": true
}
```

SignalR endpoint: `${apiUrl}/chathub`

### JWT Token

The service uses the JWT token from `AuthService.getToken()`:

```typescript
const token = this.authService.getToken();
await this.chatRealtimeService.connect(apiUrl, token);
```

## Troubleshooting

### Connection Issues

**Problem**: SignalR not connecting

**Solutions**:
1. Check API URL configuration
2. Verify JWT token is valid
3. Check CORS settings on backend
4. Verify `/chathub` endpoint exists
5. Check browser console for errors

### Message Not Appearing

**Problem**: Messages sent but not appearing in real-time

**Solutions**:
1. Verify SignalR connection status
2. Check if group was joined via `joinGroup()`
3. Verify backend is broadcasting `ReceiveMessage`
4. Check for JavaScript errors in console

### Typing Indicators Not Working

**Problem**: Typing status not showing

**Solutions**:
1. Check SignalR connection (typing requires active connection)
2. Verify `UserTyping` event is implemented on backend
3. Check if typing timeout is working (3 seconds)
4. Verify userName is being sent correctly

### Reconnection Loop

**Problem**: SignalR keeps reconnecting

**Solutions**:
1. Check authentication token expiration
2. Verify backend hub implementation
3. Check for network issues
4. Review backend logs for errors

## Future Enhancements

Potential improvements for future development:

1. **Presence System**
   - Online/offline indicators
   - Last seen timestamps
   - Active status (typing, recording, etc.)

2. **Read Receipts**
   - Message delivery status
   - Read status tracking
   - Seen by list for groups

3. **File Upload Progress**
   - Real-time upload progress
   - Stream-based file transfer

4. **Voice/Video Calls**
   - WebRTC integration via SignalR
   - Call signaling through hub

5. **Push Notifications**
   - Desktop notifications
   - Browser push API integration

## Related Documentation

- [SignalR Client Library](https://docs.microsoft.com/en-us/aspnet/core/signalr/javascript-client)
- [Angular OnPush Change Detection](https://angular.io/api/core/ChangeDetectionStrategy)
- [RxJS Observables](https://rxjs.dev/guide/observable)

## Support

For issues or questions:
1. Check console logs for errors
2. Verify SignalR connection status
3. Review this documentation
4. Check GitHub issues
5. Contact development team

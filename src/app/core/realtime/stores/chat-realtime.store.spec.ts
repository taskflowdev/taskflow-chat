import { TestBed } from '@angular/core/testing';
import { ChatRealtimeStore, RealtimeState } from './chat-realtime.store';
import { MessageDto, PresenceDto } from '../../../api/models';
import { TypingDto } from '../models';

describe('ChatRealtimeStore', () => {
  let store: ChatRealtimeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatRealtimeStore]
    });
    store = TestBed.inject(ChatRealtimeStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    const state = store.currentState;
    
    expect(state.messages.size).toBe(0);
    expect(state.presence.size).toBe(0);
    expect(state.typingUsers.size).toBe(0);
    expect(state.joinedGroups.size).toBe(0);
    expect(state.isConnected).toBe(false);
  });

  describe('Connection status', () => {
    it('should update connection status', () => {
      store.setConnectionStatus(true);
      
      expect(store.currentState.isConnected).toBe(true);
      expect(store.currentState.connectionError).toBeUndefined();
    });

    it('should update connection status with error', () => {
      store.setConnectionStatus(false, 'Connection failed');
      
      expect(store.currentState.isConnected).toBe(false);
      expect(store.currentState.connectionError).toBe('Connection failed');
    });
  });

  describe('Joined groups management', () => {
    it('should add joined group', () => {
      store.addJoinedGroup('group1');
      
      const joinedGroups = store.getJoinedGroups();
      expect(joinedGroups).toContain('group1');
      expect(joinedGroups.length).toBe(1);
    });

    it('should not add duplicate groups', () => {
      store.addJoinedGroup('group1');
      store.addJoinedGroup('group1');
      
      const joinedGroups = store.getJoinedGroups();
      expect(joinedGroups.length).toBe(1);
    });

    it('should remove joined group', () => {
      store.addJoinedGroup('group1');
      store.addJoinedGroup('group2');
      store.removeJoinedGroup('group1');
      
      const joinedGroups = store.getJoinedGroups();
      expect(joinedGroups).not.toContain('group1');
      expect(joinedGroups).toContain('group2');
    });
  });

  describe('Messages management', () => {
    it('should add message to group', () => {
      const message: MessageDto = {
        messageId: 'msg1',
        groupId: 'group1',
        senderId: 'user1',
        senderName: 'User 1',
        content: { contentType: 'text' },
        contentType: 'text',
        createdAt: new Date().toISOString()
      };

      store.addMessage('group1', message);
      
      const messages = store.getGroupMessages('group1');
      expect(messages.length).toBe(1);
      expect(messages[0]).toEqual(message);
    });

    it('should not add duplicate messages', () => {
      const message: MessageDto = {
        messageId: 'msg1',
        groupId: 'group1',
        senderId: 'user1',
        senderName: 'User 1',
        content: { contentType: 'text' },
        contentType: 'text',
        createdAt: new Date().toISOString()
      };

      store.addMessage('group1', message);
      store.addMessage('group1', message);
      
      const messages = store.getGroupMessages('group1');
      expect(messages.length).toBe(1);
    });

    it('should set group messages', () => {
      const messages: MessageDto[] = [
        {
          messageId: 'msg1',
          groupId: 'group1',
          senderId: 'user1',
          senderName: 'User 1',
          content: { contentType: 'text' },
          contentType: 'text',
          createdAt: new Date().toISOString()
        },
        {
          messageId: 'msg2',
          groupId: 'group1',
          senderId: 'user2',
          senderName: 'User 2',
          content: { contentType: 'text' },
          contentType: 'text',
          createdAt: new Date().toISOString()
        }
      ];

      store.setGroupMessages('group1', messages);
      
      const storedMessages = store.getGroupMessages('group1');
      expect(storedMessages.length).toBe(2);
      expect(storedMessages).toEqual(messages);
    });

    it('should return empty array for group with no messages', () => {
      const messages = store.getGroupMessages('nonexistent');
      expect(messages).toEqual([]);
    });

    it('should clear group messages', () => {
      const message: MessageDto = {
        messageId: 'msg1',
        groupId: 'group1',
        senderId: 'user1',
        senderName: 'User 1',
        content: { contentType: 'text' },
        contentType: 'text',
        createdAt: new Date().toISOString()
      };

      store.addMessage('group1', message);
      store.clearGroupMessages('group1');
      
      const messages = store.getGroupMessages('group1');
      expect(messages.length).toBe(0);
    });
  });

  describe('Presence management', () => {
    it('should update presence for group', () => {
      const presence: PresenceDto[] = [
        {
          userId: 'user1',
          userName: 'User 1',
          isOnline: true,
          connectionCount: 1
        }
      ];

      store.updatePresence('group1', presence);
      
      const storedPresence = store.getGroupPresence('group1');
      expect(storedPresence.length).toBe(1);
      expect(storedPresence[0]).toEqual(presence[0]);
    });

    it('should return empty array for group with no presence', () => {
      const presence = store.getGroupPresence('nonexistent');
      expect(presence).toEqual([]);
    });
  });

  describe('Typing indicators management', () => {
    it('should add typing user', () => {
      const typingInfo: TypingDto = {
        groupId: 'group1',
        userId: 'user1',
        userName: 'User 1',
        isTyping: true
      };

      store.updateTyping(typingInfo);
      
      const typingUsers = store.getGroupTypingUsers('group1');
      expect(typingUsers.length).toBe(1);
      expect(typingUsers[0]).toEqual(typingInfo);
    });

    it('should remove typing user', () => {
      const typingStart: TypingDto = {
        groupId: 'group1',
        userId: 'user1',
        userName: 'User 1',
        isTyping: true
      };

      const typingStop: TypingDto = {
        groupId: 'group1',
        userId: 'user1',
        userName: 'User 1',
        isTyping: false
      };

      store.updateTyping(typingStart);
      store.updateTyping(typingStop);
      
      const typingUsers = store.getGroupTypingUsers('group1');
      expect(typingUsers.length).toBe(0);
    });

    it('should update existing typing user', () => {
      const typingInfo1: TypingDto = {
        groupId: 'group1',
        userId: 'user1',
        userName: 'User 1',
        isTyping: true
      };

      const typingInfo2: TypingDto = {
        groupId: 'group1',
        userId: 'user1',
        userName: 'User One',
        isTyping: true
      };

      store.updateTyping(typingInfo1);
      store.updateTyping(typingInfo2);
      
      const typingUsers = store.getGroupTypingUsers('group1');
      expect(typingUsers.length).toBe(1);
      expect(typingUsers[0].userName).toBe('User One');
    });

    it('should handle multiple typing users', () => {
      const typing1: TypingDto = {
        groupId: 'group1',
        userId: 'user1',
        userName: 'User 1',
        isTyping: true
      };

      const typing2: TypingDto = {
        groupId: 'group1',
        userId: 'user2',
        userName: 'User 2',
        isTyping: true
      };

      store.updateTyping(typing1);
      store.updateTyping(typing2);
      
      const typingUsers = store.getGroupTypingUsers('group1');
      expect(typingUsers.length).toBe(2);
    });

    it('should return empty array for group with no typing users', () => {
      const typingUsers = store.getGroupTypingUsers('nonexistent');
      expect(typingUsers).toEqual([]);
    });
  });

  describe('State immutability', () => {
    it('should create new state objects on updates', () => {
      const initialState = store.currentState;
      
      store.setConnectionStatus(true);
      
      const updatedState = store.currentState;
      expect(updatedState).not.toBe(initialState);
    });

    it('should not mutate maps directly', () => {
      const message: MessageDto = {
        messageId: 'msg1',
        groupId: 'group1',
        senderId: 'user1',
        senderName: 'User 1',
        content: { contentType: 'text' },
        contentType: 'text',
        createdAt: new Date().toISOString()
      };

      const stateBeforeAdd = store.currentState;
      store.addMessage('group1', message);
      const stateAfterAdd = store.currentState;
      
      // Old state should still have empty messages
      expect(stateBeforeAdd.messages.size).toBe(0);
      // New state should have the message
      expect(stateAfterAdd.messages.size).toBe(1);
    });
  });

  describe('Clear operations', () => {
    it('should clear all state', () => {
      // Add some data
      store.setConnectionStatus(true);
      store.addJoinedGroup('group1');
      store.addMessage('group1', {
        messageId: 'msg1',
        groupId: 'group1',
        senderId: 'user1',
        senderName: 'User 1',
        content: { contentType: 'text' },
        contentType: 'text',
        createdAt: new Date().toISOString()
      });

      store.clearAll();
      
      const state = store.currentState;
      expect(state.messages.size).toBe(0);
      expect(state.presence.size).toBe(0);
      expect(state.typingUsers.size).toBe(0);
      expect(state.joinedGroups.size).toBe(0);
      expect(state.isConnected).toBe(false);
    });
  });
});

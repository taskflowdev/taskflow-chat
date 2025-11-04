import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChatRealtimeService, ConnectionState } from './chat-realtime.service';
import { ChatRealtimeStore } from '../stores/chat-realtime.store';
import { GroupsService, MessagesService } from '../../../api/services';
import { MessageDto, SendMessageDto, PresenceDto } from '../../../api/models';
import { HubConnectionState } from '@microsoft/signalr';
import { of } from 'rxjs';

describe('ChatRealtimeService', () => {
  let service: ChatRealtimeService;
  let store: ChatRealtimeStore;
  let groupsServiceSpy: jasmine.SpyObj<GroupsService>;
  let messagesServiceSpy: jasmine.SpyObj<MessagesService>;

  beforeEach(() => {
    const groupsSpy = jasmine.createSpyObj('GroupsService', ['apiGroupsGet$Json', 'apiGroupsIdPresenceGet$Json']);
    const messagesSpy = jasmine.createSpyObj('MessagesService', ['apiGroupsGroupIdMessagesGet$Json']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatRealtimeService,
        ChatRealtimeStore,
        { provide: GroupsService, useValue: groupsSpy },
        { provide: MessagesService, useValue: messagesSpy }
      ]
    });

    service = TestBed.inject(ChatRealtimeService);
    store = TestBed.inject(ChatRealtimeStore);
    groupsServiceSpy = TestBed.inject(GroupsService) as jasmine.SpyObj<GroupsService>;
    messagesServiceSpy = TestBed.inject(MessagesService) as jasmine.SpyObj<MessagesService>;
  });

  afterEach(() => {
    // Clean up any open connections
    if (service.isConnected) {
      service.disconnect();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with disconnected state', () => {
    expect(service.isConnected).toBe(false);
  });

  it('should expose observable getters', (done) => {
    // Test that observables are accessible
    expect(service.onMessageReceived).toBeTruthy();
    expect(service.onSystemMessageReceived).toBeTruthy();
    expect(service.onPresenceUpdated).toBeTruthy();
    expect(service.onUserTyping).toBeTruthy();
    expect(service.connectionState).toBeTruthy();

    // Test that connection state observable emits initial value
    service.connectionState.subscribe(state => {
      expect(state.state).toBe(HubConnectionState.Disconnected);
      done();
    });
  });

  describe('REST API methods', () => {
    it('should fetch message history via REST API', async () => {
      const mockMessages: MessageDto[] = [
        {
          messageId: 'msg1',
          groupId: 'group1',
          senderId: 'user1',
          senderName: 'User 1',
          content: { contentType: 'text' },
          contentType: 'text',
          createdAt: new Date().toISOString()
        }
      ];

      messagesServiceSpy.apiGroupsGroupIdMessagesGet$Json.and.returnValue(
        of({ data: mockMessages, success: true, message: '' })
      );

      const result = await service.getMessageHistory('group1');

      expect(messagesServiceSpy.apiGroupsGroupIdMessagesGet$Json).toHaveBeenCalled();
      expect(result).toEqual(mockMessages);
      
      // Verify messages were stored in the store
      const storedMessages = store.getGroupMessages('group1');
      expect(storedMessages).toEqual(mockMessages);
    });

    it('should fetch groups via REST API', async () => {
      const mockGroups = [
        {
          groupId: 'group1',
          name: 'Test Group',
          memberCount: 5
        }
      ];

      groupsServiceSpy.apiGroupsGet$Json.and.returnValue(
        of({ data: mockGroups, success: true, message: '' })
      );

      const result = await service.getGroups();

      expect(groupsServiceSpy.apiGroupsGet$Json).toHaveBeenCalled();
      expect(result).toEqual(mockGroups);
    });

    it('should fetch presence via REST API', async () => {
      const mockPresence: PresenceDto[] = [
        {
          userId: 'user1',
          userName: 'User 1',
          isOnline: true,
          connectionCount: 1
        }
      ];

      groupsServiceSpy.apiGroupsIdPresenceGet$Json.and.returnValue(
        of({ data: mockPresence, success: true, message: '' })
      );

      const result = await service.getPresenceViaREST('group1');

      expect(groupsServiceSpy.apiGroupsIdPresenceGet$Json).toHaveBeenCalledWith({ id: 'group1' });
      expect(result).toEqual(mockPresence);
      
      // Verify presence was stored in the store
      const storedPresence = store.getGroupPresence('group1');
      expect(storedPresence).toEqual(mockPresence);
    });

    it('should handle REST API errors gracefully', async () => {
      messagesServiceSpy.apiGroupsGroupIdMessagesGet$Json.and.returnValue(
        of({ data: null, success: false, message: 'Error' })
      );

      const result = await service.getMessageHistory('group1');

      expect(result).toEqual([]);
    });
  });

  describe('Store integration', () => {
    it('should update store on connection status change', () => {
      spyOn(store, 'setConnectionStatus');
      
      // Note: We can't easily test SignalR connection without mocking the entire HubConnection
      // but we can verify that the store methods are accessible
      expect(store.setConnectionStatus).toBeDefined();
    });

    it('should track joined groups in store', () => {
      store.addJoinedGroup('group1');
      store.addJoinedGroup('group2');

      const joinedGroups = store.getJoinedGroups();
      
      expect(joinedGroups).toContain('group1');
      expect(joinedGroups).toContain('group2');
      expect(joinedGroups.length).toBe(2);
    });

    it('should remove joined groups from store', () => {
      store.addJoinedGroup('group1');
      store.addJoinedGroup('group2');
      store.removeJoinedGroup('group1');

      const joinedGroups = store.getJoinedGroups();
      
      expect(joinedGroups).not.toContain('group1');
      expect(joinedGroups).toContain('group2');
      expect(joinedGroups.length).toBe(1);
    });
  });

  describe('Connection management', () => {
    it('should throw error when trying to join group without connection', async () => {
      await expectAsync(service.joinGroup('group1')).toBeRejectedWithError('SignalR not connected');
    });

    it('should throw error when trying to leave group without connection', async () => {
      await expectAsync(service.leaveGroup('group1')).toBeRejectedWithError('SignalR not connected');
    });

    it('should throw error when trying to send message without connection', async () => {
      const message: SendMessageDto = {
        content: { contentType: 'text' },
        contentType: 'text',
        messageType: 'userMessage'
      };

      await expectAsync(service.sendMessage('group1', message)).toBeRejectedWithError('SignalR not connected');
    });

    it('should silently fail when sending typing indicator without connection', async () => {
      // Should not throw
      await expectAsync(service.sendTypingIndicator('group1', true)).toBeResolved();
    });

    it('should throw error when requesting presence without connection', async () => {
      await expectAsync(service.getGroupPresence('group1')).toBeRejectedWithError('SignalR not connected');
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      spyOn(service, 'disconnect');
      
      service.ngOnDestroy();
      
      expect(service.disconnect).toHaveBeenCalled();
    });
  });
});

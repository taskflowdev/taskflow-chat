import { TestBed } from '@angular/core/testing';
import { ReactionService } from './reaction.service';
import { MessageMetadataService } from '../../../api/services/message-metadata.service';
import { of, throwError } from 'rxjs';
import { MessageMetadataApiResponse } from '../../../api/models/message-metadata-api-response';

describe('ReactionService', () => {
  let service: ReactionService;
  let messageMetadataService: jasmine.SpyObj<MessageMetadataService>;

  const mockMessageId = 'test-message-id';
  const mockUserId = 'test-user-id';
  const mockEmoji = '👍';

  beforeEach(() => {
    const messageMetadataServiceSpy = jasmine.createSpyObj('MessageMetadataService', [
      'apiMessagesMessageIdReactionsEmojiPost$Json',
      'apiMessagesMessageIdReactionsDelete$Json'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ReactionService,
        { provide: MessageMetadataService, useValue: messageMetadataServiceSpy }
      ]
    });

    service = TestBed.inject(ReactionService);
    messageMetadataService = TestBed.inject(MessageMetadataService) as jasmine.SpyObj<MessageMetadataService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addReaction', () => {
    it('should add a reaction optimistically and call API', (done) => {
      const mockResponse: MessageMetadataApiResponse = {
        data: {
          reactions: {
            [mockUserId]: mockEmoji
          }
        }
      };

      messageMetadataService.apiMessagesMessageIdReactionsEmojiPost$Json.and.returnValue(of(mockResponse));

      service.addReaction(mockMessageId, mockEmoji, mockUserId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(messageMetadataService.apiMessagesMessageIdReactionsEmojiPost$Json).toHaveBeenCalledWith({
            messageId: mockMessageId,
            emoji: mockEmoji
          });
          done();
        }
      });
    });

    it('should rollback optimistic update on error', (done) => {
      messageMetadataService.apiMessagesMessageIdReactionsEmojiPost$Json.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      service.addReaction(mockMessageId, mockEmoji, mockUserId).subscribe({
        error: (error) => {
          expect(error.message).toBe('API Error');
          done();
        }
      });
    });
  });

  describe('removeReaction', () => {
    it('should remove a reaction and call API', (done) => {
      const mockResponse: MessageMetadataApiResponse = {
        data: {
          reactions: {}
        }
      };

      messageMetadataService.apiMessagesMessageIdReactionsDelete$Json.and.returnValue(of(mockResponse));

      service.removeReaction(mockMessageId, mockUserId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(messageMetadataService.apiMessagesMessageIdReactionsDelete$Json).toHaveBeenCalledWith({
            messageId: mockMessageId
          });
          done();
        }
      });
    });
  });

  describe('getReactions', () => {
    it('should return an observable of reactions', (done) => {
      service.getReactions(mockMessageId).subscribe({
        next: (reactions) => {
          expect(reactions).toBeDefined();
          expect(reactions.messageId).toBe(mockMessageId);
          expect(reactions.reactions).toEqual([]);
          expect(reactions.totalCount).toBe(0);
          done();
        }
      });
    });
  });

  describe('initializeReactions', () => {
    it('should initialize reactions from metadata', (done) => {
      const reactions = {
        [mockUserId]: mockEmoji,
        'user2': '❤️'
      };

      service.initializeReactions(mockMessageId, reactions, mockUserId);

      service.getReactions(mockMessageId).subscribe({
        next: (result) => {
          expect(result.reactions.length).toBe(2);
          expect(result.totalCount).toBe(2);
          
          const userReaction = result.reactions.find(r => r.emoji === mockEmoji);
          expect(userReaction).toBeDefined();
          expect(userReaction?.hasCurrentUser).toBe(true);
          expect(userReaction?.count).toBe(1);
          
          done();
        }
      });
    });

    it('should handle undefined reactions', (done) => {
      service.initializeReactions(mockMessageId, undefined, mockUserId);

      service.getReactions(mockMessageId).subscribe({
        next: (result) => {
          expect(result.reactions.length).toBe(0);
          expect(result.totalCount).toBe(0);
          done();
        }
      });
    });
  });

  describe('clearCache', () => {
    it('should clear cache for a message', () => {
      service.initializeReactions(mockMessageId, { [mockUserId]: mockEmoji }, mockUserId);
      service.clearCache(mockMessageId);
      
      // After clearing, getting reactions should return empty state
      service.getReactions(mockMessageId).subscribe({
        next: (result) => {
          expect(result.reactions.length).toBe(0);
        }
      });
    });
  });
});

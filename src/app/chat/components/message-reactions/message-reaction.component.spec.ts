import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageReactionComponent } from './message-reaction.component';
import { ReactionService } from './reaction.service';
import { of } from 'rxjs';
import { MessageReactions } from './reaction.models';
import { ChangeDetectorRef } from '@angular/core';

describe('MessageReactionComponent', () => {
  let component: MessageReactionComponent;
  let fixture: ComponentFixture<MessageReactionComponent>;
  let reactionService: jasmine.SpyObj<ReactionService>;

  const mockMessageId = 'test-message-id';
  const mockUserId = 'test-user-id';

  beforeEach(async () => {
    const reactionServiceSpy = jasmine.createSpyObj('ReactionService', ['getReactions']);

    await TestBed.configureTestingModule({
      imports: [MessageReactionComponent],
      providers: [
        { provide: ReactionService, useValue: reactionServiceSpy }
      ]
    }).compileComponents();

    reactionService = TestBed.inject(ReactionService) as jasmine.SpyObj<ReactionService>;
    fixture = TestBed.createComponent(MessageReactionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to reactions on init', () => {
    const mockReactions: MessageReactions = {
      messageId: mockMessageId,
      reactions: [
        { emoji: '👍', count: 1, userIds: [mockUserId], hasCurrentUser: true }
      ],
      totalCount: 1
    };

    reactionService.getReactions.and.returnValue(of(mockReactions));
    
    component.messageId = mockMessageId;
    component.currentUserId = mockUserId;
    component.ngOnInit();

    expect(reactionService.getReactions).toHaveBeenCalledWith(mockMessageId);
    expect(component.messageReactions).toEqual(mockReactions);
  });

  it('should not subscribe if messageId is missing', () => {
    component.messageId = '';
    component.ngOnInit();
    
    expect(reactionService.getReactions).not.toHaveBeenCalled();
  });

  it('should emit reactionToggled on reaction click', () => {
    spyOn(component.reactionToggled, 'emit');
    
    const mockReaction = {
      emoji: '👍',
      count: 1,
      userIds: [mockUserId],
      hasCurrentUser: true
    };

    component.onReactionClick({}, mockReaction);
    
    expect(component.reactionToggled.emit).toHaveBeenCalledWith(mockReaction);
  });

  it('should track reactions by emoji', () => {
    const reaction = {
      emoji: '👍',
      count: 1,
      userIds: [mockUserId],
      hasCurrentUser: true
    };

    const trackResult = component.trackByEmoji(0, reaction);
    expect(trackResult).toBe('👍');
  });

  it('should generate correct tooltip for single user reaction', () => {
    const reaction = {
      emoji: '👍',
      count: 1,
      userIds: [mockUserId],
      hasCurrentUser: true
    };

    const tooltip = component.getReactionTooltip(reaction);
    expect(tooltip).toBe('You reacted');
  });

  it('should generate correct tooltip for multiple users with current user', () => {
    const reaction = {
      emoji: '👍',
      count: 3,
      userIds: [mockUserId, 'user2', 'user3'],
      hasCurrentUser: true
    };

    const tooltip = component.getReactionTooltip(reaction);
    expect(tooltip).toBe('You and 2 others reacted');
  });

  it('should generate correct tooltip for reactions without current user', () => {
    const reaction = {
      emoji: '👍',
      count: 2,
      userIds: ['user2', 'user3'],
      hasCurrentUser: false
    };

    const tooltip = component.getReactionTooltip(reaction);
    expect(tooltip).toBe('2 people reacted');
  });

  it('should generate correct ARIA label', () => {
    const reaction = {
      emoji: '👍',
      count: 1,
      userIds: [mockUserId],
      hasCurrentUser: true
    };

    const ariaLabel = component.getReactionAriaLabel(reaction);
    expect(ariaLabel).toContain('👍');
    expect(ariaLabel).toContain('You reacted');
    expect(ariaLabel).toContain('Remove your reaction');
  });

  it('should cleanup on destroy', () => {
    const mockReactions: MessageReactions = {
      messageId: mockMessageId,
      reactions: [],
      totalCount: 0
    };

    reactionService.getReactions.and.returnValue(of(mockReactions));
    
    component.messageId = mockMessageId;
    component.currentUserId = mockUserId;
    component.ngOnInit();
    
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});

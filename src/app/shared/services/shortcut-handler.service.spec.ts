import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ShortcutHandlerService } from './shortcut-handler.service';
import {
  ShortcutActionTypes,
  ShortcutContext,
  ShortcutExecutionResult
} from '../models/keyboard-shortcut.model';

describe('ShortcutHandlerService', () => {
  let service: ShortcutHandlerService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        ShortcutHandlerService,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(ShortcutHandlerService);
  });

  afterEach(() => {
    mockRouter.navigate.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Context Management', () => {
    it('should initialize with GLOBAL context', () => {
      expect(service.getContext()).toBe(ShortcutContext.GLOBAL);
    });

    it('should set and get context', () => {
      service.setContext(ShortcutContext.CHAT_VIEW);
      expect(service.getContext()).toBe(ShortcutContext.CHAT_VIEW);
    });

    it('should update context correctly', () => {
      service.setContext(ShortcutContext.MESSAGE_INPUT);
      expect(service.getContext()).toBe(ShortcutContext.MESSAGE_INPUT);

      service.setContext(ShortcutContext.CONVERSATION);
      expect(service.getContext()).toBe(ShortcutContext.CONVERSATION);
    });
  });

  describe('Action Execution', () => {
    it('should execute SHOW_SHORTCUTS action', () => {
      service.executeAction(ShortcutActionTypes.SHOW_SHORTCUTS);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        fragment: 'keyboard-shortcuts',
        queryParamsHandling: 'preserve'
      });
    });

    it('should execute OPEN_SEARCH action', () => {
      service.executeAction(ShortcutActionTypes.OPEN_SEARCH);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        fragment: 'search-groups',
        queryParamsHandling: 'preserve'
      });
    });

    it('should execute CREATE_GROUP action', () => {
      service.executeAction(ShortcutActionTypes.CREATE_GROUP);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        fragment: 'new-group',
        queryParamsHandling: 'preserve'
      });
    });

    it('should execute GROUP_INFO action', () => {
      service.executeAction(ShortcutActionTypes.GROUP_INFO);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        fragment: 'group-info',
        queryParamsHandling: 'preserve'
      });
    });

    it('should execute CLOSE_DIALOG action', () => {
      service.executeAction(ShortcutActionTypes.CLOSE_DIALOG);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        fragment: undefined,
        queryParamsHandling: 'preserve'
      });
    });

    it('should execute BACK_TO_LIST action', () => {
      service.executeAction(ShortcutActionTypes.BACK_TO_LIST);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chats']);
    });
  });

  describe('Observable Streams', () => {
    it('should emit action on actionRequested$ observable', (done) => {
      service.actionRequested$.subscribe(action => {
        expect(action).toBe(ShortcutActionTypes.OPEN_SEARCH);
        done();
      });

      service.executeAction(ShortcutActionTypes.OPEN_SEARCH);
    });

    it('should emit execution result on executionResult$ observable', (done) => {
      service.executionResult$.subscribe((result: ShortcutExecutionResult) => {
        expect(result.action).toBe(ShortcutActionTypes.CREATE_GROUP);
        expect(result.success).toBe(true);
        expect(result.timestamp).toBeDefined();
        done();
      });

      service.executeAction(ShortcutActionTypes.CREATE_GROUP);
    });

    it('should emit multiple actions in sequence', () => {
      const emittedActions: ShortcutActionTypes[] = [];

      service.actionRequested$.subscribe(action => {
        emittedActions.push(action);
      });

      service.executeAction(ShortcutActionTypes.OPEN_SEARCH);
      service.executeAction(ShortcutActionTypes.CREATE_GROUP);
      service.executeAction(ShortcutActionTypes.SHOW_SHORTCUTS);

      expect(emittedActions.length).toBe(3);
      expect(emittedActions).toContain(ShortcutActionTypes.OPEN_SEARCH);
      expect(emittedActions).toContain(ShortcutActionTypes.CREATE_GROUP);
      expect(emittedActions).toContain(ShortcutActionTypes.SHOW_SHORTCUTS);
    });
  });

  describe('Action Handler Classification', () => {
    it('should identify handled actions', () => {
      expect(service.isActionHandled(ShortcutActionTypes.OPEN_SEARCH)).toBe(true);
      expect(service.isActionHandled(ShortcutActionTypes.CREATE_GROUP)).toBe(true);
      expect(service.isActionHandled(ShortcutActionTypes.SHOW_SHORTCUTS)).toBe(true);
      expect(service.isActionHandled(ShortcutActionTypes.CLOSE_DIALOG)).toBe(true);
    });

    it('should identify non-handled actions', () => {
      expect(service.isActionHandled(ShortcutActionTypes.PREV_CHAT)).toBe(false);
      expect(service.isActionHandled(ShortcutActionTypes.NEXT_CHAT)).toBe(false);
      expect(service.isActionHandled(ShortcutActionTypes.NEW_MESSAGE)).toBe(false);
    });

    it('should return correct list of handled actions', () => {
      const handledActions = service.getHandledActions();
      
      expect(handledActions).toContain(ShortcutActionTypes.SHOW_SHORTCUTS);
      expect(handledActions).toContain(ShortcutActionTypes.OPEN_SEARCH);
      expect(handledActions).toContain(ShortcutActionTypes.CREATE_GROUP);
      expect(handledActions).toContain(ShortcutActionTypes.GROUP_INFO);
      expect(handledActions).toContain(ShortcutActionTypes.CLOSE_DIALOG);
      expect(handledActions).toContain(ShortcutActionTypes.BACK_TO_LIST);
    });

    it('should return correct list of component-handled actions', () => {
      const componentActions = service.getComponentHandledActions();
      
      expect(componentActions).toContain(ShortcutActionTypes.PREV_CHAT);
      expect(componentActions).toContain(ShortcutActionTypes.NEXT_CHAT);
      expect(componentActions).toContain(ShortcutActionTypes.NEW_MESSAGE);
      expect(componentActions).toContain(ShortcutActionTypes.SEND_MESSAGE);
    });
  });

  describe('Logging', () => {
    it('should enable/disable logging', () => {
      service.setLoggingEnabled(false);
      // No public API to check if logging is disabled, but we can verify no errors occur
      service.executeAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(mockRouter.navigate).toHaveBeenCalled();

      service.setLoggingEnabled(true);
      service.executeAction(ShortcutActionTypes.CREATE_GROUP);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle router navigation errors gracefully', (done) => {
      mockRouter.navigate.and.throwError('Navigation failed');

      service.executionResult$.subscribe((result: ShortcutExecutionResult) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        done();
      });

      service.executeAction(ShortcutActionTypes.OPEN_SEARCH);
    });

    it('should emit failed execution result on error', (done) => {
      mockRouter.navigate.and.throwError('Test error');

      service.executionResult$.subscribe((result: ShortcutExecutionResult) => {
        if (!result.success) {
          expect(result.action).toBe(ShortcutActionTypes.SHOW_SHORTCUTS);
          expect(result.error).toContain('Test error');
          done();
        }
      });

      service.executeAction(ShortcutActionTypes.SHOW_SHORTCUTS);
    });
  });

  describe('Context-Aware Execution', () => {
    it('should execute action with specific context', () => {
      service.executeAction(ShortcutActionTypes.CREATE_GROUP, ShortcutContext.CHAT_VIEW);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should execute action with default context', () => {
      service.setContext(ShortcutContext.MESSAGE_INPUT);
      service.executeAction(ShortcutActionTypes.OPEN_SEARCH);
      
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should include context in execution result', (done) => {
      const testContext = ShortcutContext.CONVERSATION;

      service.executionResult$.subscribe((result: ShortcutExecutionResult) => {
        expect(result.context).toBe(testContext);
        done();
      });

      service.executeAction(ShortcutActionTypes.GROUP_INFO, testContext);
    });
  });

  describe('Component-Handled Actions', () => {
    it('should emit component-handled actions without router navigation', () => {
      service.executeAction(ShortcutActionTypes.PREV_CHAT);
      
      // Router should not be called for component-handled actions
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should still broadcast component-handled actions', (done) => {
      service.actionRequested$.subscribe(action => {
        expect(action).toBe(ShortcutActionTypes.NEXT_CHAT);
        done();
      });

      service.executeAction(ShortcutActionTypes.NEXT_CHAT);
    });
  });

  describe('Integration', () => {
    it('should handle multiple rapid action executions', () => {
      const actions = [
        ShortcutActionTypes.OPEN_SEARCH,
        ShortcutActionTypes.CLOSE_DIALOG,
        ShortcutActionTypes.CREATE_GROUP,
        ShortcutActionTypes.SHOW_SHORTCUTS
      ];

      actions.forEach(action => service.executeAction(action));

      expect(mockRouter.navigate).toHaveBeenCalledTimes(4);
    });

    it('should maintain context across multiple executions', () => {
      service.setContext(ShortcutContext.CHAT_VIEW);
      
      service.executeAction(ShortcutActionTypes.PREV_CHAT);
      expect(service.getContext()).toBe(ShortcutContext.CHAT_VIEW);
      
      service.executeAction(ShortcutActionTypes.NEXT_CHAT);
      expect(service.getContext()).toBe(ShortcutContext.CHAT_VIEW);
    });
  });
});

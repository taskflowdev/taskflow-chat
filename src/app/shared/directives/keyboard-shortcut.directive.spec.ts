import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, BehaviorSubject } from 'rxjs';
import { KeyboardShortcutDirective } from './keyboard-shortcut.directive';
import { ShortcutHandlerService } from '../services/shortcut-handler.service';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { ShortcutActionTypes, ShortcutContext } from '../models/keyboard-shortcut.model';

/**
 * Test host component for the directive
 */
@Component({
  template: `
    <div appKeyboardShortcut
         [shortcutAction]="action"
         [shortcutContext]="context"
         (shortcutTriggered)="onShortcutTriggered($event)">
    </div>
  `,
  standalone: true,
  imports: [KeyboardShortcutDirective]
})
class TestHostComponent {
  action: ShortcutActionTypes | string = ShortcutActionTypes.OPEN_SEARCH;
  context?: ShortcutContext | string;
  triggeredAction?: ShortcutActionTypes;

  onShortcutTriggered(action: ShortcutActionTypes): void {
    this.triggeredAction = action;
  }
}

describe('KeyboardShortcutDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let actionRequestedSubject: Subject<ShortcutActionTypes>;
  let mockHandlerService: jasmine.SpyObj<ShortcutHandlerService>;
  let mockKeyboardShortcutService: jasmine.SpyObj<KeyboardShortcutService>;

  beforeEach(async () => {
    actionRequestedSubject = new Subject<ShortcutActionTypes>();

    mockHandlerService = jasmine.createSpyObj('ShortcutHandlerService', [], {
      actionRequested$: actionRequestedSubject.asObservable()
    });

    mockKeyboardShortcutService = jasmine.createSpyObj('KeyboardShortcutService', [
      'areShortcutsEnabled',
      'getContext'
    ]);
    mockKeyboardShortcutService.areShortcutsEnabled.and.returnValue(true);
    mockKeyboardShortcutService.getContext.and.returnValue(ShortcutContext.GLOBAL);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, KeyboardShortcutDirective],
      providers: [
        { provide: ShortcutHandlerService, useValue: mockHandlerService },
        { provide: KeyboardShortcutService, useValue: mockKeyboardShortcutService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });

  describe('Shortcut Action Handling', () => {
    it('should emit when matching action is triggered', () => {
      actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);

      expect(component.triggeredAction).toBe(ShortcutActionTypes.OPEN_SEARCH);
    });

    it('should not emit for non-matching action', () => {
      actionRequestedSubject.next(ShortcutActionTypes.CREATE_GROUP);

      expect(component.triggeredAction).toBeUndefined();
    });

    it('should emit for different configured action', () => {
      component.action = ShortcutActionTypes.CREATE_GROUP;
      fixture.detectChanges();

      // Re-create component to apply new input
      fixture.destroy();
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
      component.action = ShortcutActionTypes.CREATE_GROUP;
      fixture.detectChanges();

      actionRequestedSubject.next(ShortcutActionTypes.CREATE_GROUP);

      expect(component.triggeredAction).toBe(ShortcutActionTypes.CREATE_GROUP);
    });
  });

  describe('Global Enable/Disable', () => {
    it('should not emit when shortcuts are globally disabled', () => {
      mockKeyboardShortcutService.areShortcutsEnabled.and.returnValue(false);

      actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);

      expect(component.triggeredAction).toBeUndefined();
    });

    it('should emit when shortcuts are globally enabled', () => {
      mockKeyboardShortcutService.areShortcutsEnabled.and.returnValue(true);

      actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);

      expect(component.triggeredAction).toBe(ShortcutActionTypes.OPEN_SEARCH);
    });
  });

  describe('Context Filtering', () => {
    it('should emit when context matches', () => {
      component.context = ShortcutContext.CHAT_VIEW;
      mockKeyboardShortcutService.getContext.and.returnValue(ShortcutContext.CHAT_VIEW);

      // Re-create to apply context
      fixture.destroy();
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
      component.context = ShortcutContext.CHAT_VIEW;
      fixture.detectChanges();

      actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);

      expect(component.triggeredAction).toBe(ShortcutActionTypes.OPEN_SEARCH);
    });

    it('should not emit when context does not match', () => {
      component.context = ShortcutContext.CHAT_VIEW;
      mockKeyboardShortcutService.getContext.and.returnValue(ShortcutContext.MESSAGE_INPUT);

      // Re-create to apply context
      fixture.destroy();
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
      component.context = ShortcutContext.CHAT_VIEW;
      fixture.detectChanges();

      actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);

      expect(component.triggeredAction).toBeUndefined();
    });

    it('should emit regardless of context when no context specified', () => {
      mockKeyboardShortcutService.getContext.and.returnValue(ShortcutContext.MESSAGE_INPUT);

      actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);

      expect(component.triggeredAction).toBe(ShortcutActionTypes.OPEN_SEARCH);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.destroy();

      // After destroy, emitting should not cause any issues
      expect(() => {
        actionRequestedSubject.next(ShortcutActionTypes.OPEN_SEARCH);
      }).not.toThrow();
    });
  });
});

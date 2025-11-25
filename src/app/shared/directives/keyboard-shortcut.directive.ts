import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ShortcutHandlerService } from '../services/shortcut-handler.service';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { ShortcutActionTypes, ShortcutContext } from '../models/keyboard-shortcut.model';

/**
 * KeyboardShortcutDirective
 * 
 * A clean, injectable directive for registering keyboard shortcuts in components.
 * Automatically handles subscription lifecycle and respects the global enable/disable setting.
 * 
 * Features:
 * - Declarative shortcut registration in templates
 * - Automatic cleanup on component destroy
 * - Respects global keyboard shortcuts enabled/disabled state
 * - Context-aware shortcut handling
 * - Works with OpenAPI-generated clients
 * 
 * @example
 * ```html
 * <!-- Simple usage - listen for a specific action -->
 * <div appKeyboardShortcut
 *      [shortcutAction]="'OPEN_SEARCH'"
 *      (shortcutTriggered)="onOpenSearch()">
 * </div>
 * 
 * <!-- With context -->
 * <div appKeyboardShortcut
 *      [shortcutAction]="'PREV_CHAT'"
 *      [shortcutContext]="'CHAT_VIEW'"
 *      (shortcutTriggered)="onPrevChat()">
 * </div>
 * ```
 */
@Directive({
  selector: '[appKeyboardShortcut]',
  standalone: true
})
export class KeyboardShortcutDirective implements OnInit, OnDestroy {
  /**
   * The shortcut action to listen for
   * Can be a ShortcutActionTypes value or its string representation
   */
  @Input() shortcutAction!: ShortcutActionTypes | string;

  /**
   * Optional context filter - only trigger if the current context matches
   * If not provided, the shortcut will trigger in any context
   */
  @Input() shortcutContext?: ShortcutContext | string;

  /**
   * Event emitted when the shortcut is triggered
   */
  @Output() shortcutTriggered = new EventEmitter<ShortcutActionTypes>();

  private actionSubscription?: Subscription;

  constructor(
    private elementRef: ElementRef,
    private handlerService: ShortcutHandlerService,
    private keyboardShortcutService: KeyboardShortcutService
  ) {}

  ngOnInit(): void {
    if (!this.shortcutAction) {
      console.warn('[KeyboardShortcutDirective] shortcutAction is required');
      return;
    }

    this.actionSubscription = this.handlerService.actionRequested$.pipe(
      filter(action => {
        // Check if shortcuts are globally enabled
        if (!this.keyboardShortcutService.areShortcutsEnabled()) {
          return false;
        }

        // Check if this is the action we're listening for
        if (action !== this.shortcutAction) {
          return false;
        }

        // Check context if specified
        if (this.shortcutContext) {
          const currentContext = this.keyboardShortcutService.getContext();
          return currentContext === this.shortcutContext;
        }

        return true;
      })
    ).subscribe(action => {
      this.shortcutTriggered.emit(action);
    });
  }

  ngOnDestroy(): void {
    this.actionSubscription?.unsubscribe();
  }
}

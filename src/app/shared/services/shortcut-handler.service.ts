import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import {
  ShortcutActionTypes,
  ShortcutContext,
  ShortcutExecutionResult
} from '../models/keyboard-shortcut.model';

/**
 * ShortcutHandlerService
 * 
 * Enterprise-level service for handling and routing keyboard shortcut actions.
 * Acts as a mediator between the keyboard event capture and the feature modules.
 * 
 * Responsibilities:
 * - Route shortcut actions to appropriate handlers
 * - Manage context-aware action execution
 * - Integrate with Angular Router and Dialog system
 * - Provide structured logging for debugging
 * - Support extensibility for new action handlers
 * 
 * Design Pattern: Command Pattern + Mediator Pattern
 * - Each action is treated as a command
 * - The service mediates between event source and action handlers
 * 
 * @example
 * ```typescript
 * // Subscribe to action requests
 * handlerService.actionRequested$.subscribe(action => {
 *   console.log('Action requested:', action);
 * });
 * 
 * // Execute an action
 * handlerService.executeAction(ShortcutActionTypes.OPEN_SEARCH);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ShortcutHandlerService {
  /**
   * Subject for broadcasting action requests to components
   * Components subscribe to this to handle specific actions
   */
  private readonly actionRequestedSubject = new Subject<ShortcutActionTypes>();
  
  /**
   * Observable stream of action requests
   * Components subscribe to this to react to shortcut actions
   */
  public readonly actionRequested$: Observable<ShortcutActionTypes> =
    this.actionRequestedSubject.asObservable();

  /**
   * Subject for execution results (for logging and debugging)
   */
  private readonly executionResultSubject = new Subject<ShortcutExecutionResult>();
  
  /**
   * Observable stream of execution results
   */
  public readonly executionResult$: Observable<ShortcutExecutionResult> =
    this.executionResultSubject.asObservable();

  /**
   * Current context (can be updated by components)
   */
  private currentContext: ShortcutContext = ShortcutContext.GLOBAL;

  /**
   * Flag to enable/disable logging
   */
  private loggingEnabled = true;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Subscribe to execution results for logging
    if (isPlatformBrowser(this.platformId)) {
      this.executionResult$.subscribe(result => {
        if (this.loggingEnabled) {
          this.logExecution(result);
        }
      });
    }
  }

  /**
   * Execute a shortcut action
   * This is the main entry point for action execution
   */
  executeAction(
    action: ShortcutActionTypes,
    context: ShortcutContext = this.currentContext
  ): void {
    const timestamp = new Date();
    
    try {
      // Log action attempt
      this.log(`Executing action: ${action} in context: ${context}`);

      // Route to appropriate handler based on action type
      const handled = this.routeAction(action, context);

      // Broadcast to subscribers
      this.actionRequestedSubject.next(action);

      // Record execution result
      this.executionResultSubject.next({
        action,
        timestamp,
        success: handled,
        context
      });

    } catch (error) {
      // Record failure
      this.executionResultSubject.next({
        action,
        timestamp,
        success: false,
        context,
        error: error instanceof Error ? error.message : String(error)
      });

      this.logError(`Failed to execute action ${action}:`, error);
    }
  }

  /**
   * Route action to appropriate handler
   * Returns true if action was handled, false otherwise
   */
  private routeAction(action: ShortcutActionTypes, context: ShortcutContext): boolean {
    // Handle navigation-related actions directly
    switch (action) {
      case ShortcutActionTypes.SHOW_SHORTCUTS:
        this.handleShowShortcuts();
        return true;

      case ShortcutActionTypes.OPEN_SEARCH:
        this.handleOpenSearch();
        return true;

      case ShortcutActionTypes.CREATE_GROUP:
        this.handleCreateGroup();
        return true;

      case ShortcutActionTypes.GROUP_INFO:
        this.handleGroupInfo();
        return true;

      case ShortcutActionTypes.CLOSE_DIALOG:
        this.handleCloseDialog();
        return true;

      case ShortcutActionTypes.BACK_TO_LIST:
        this.handleBackToList();
        return true;

      // For other actions, let components handle them via observable
      default:
        this.log(`Action ${action} will be handled by subscribing component`);
        return true;
    }
  }

  /**
   * Handle SHOW_SHORTCUTS action
   */
  private handleShowShortcuts(): void {
    this.router.navigate([], {
      fragment: 'keyboard-shortcuts',
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Handle OPEN_SEARCH action
   */
  private handleOpenSearch(): void {
    this.router.navigate([], {
      fragment: 'search-groups',
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Handle CREATE_GROUP action
   */
  private handleCreateGroup(): void {
    this.router.navigate([], {
      fragment: 'new-group',
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Handle GROUP_INFO action
   */
  private handleGroupInfo(): void {
    this.router.navigate([], {
      fragment: 'group-info',
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Handle CLOSE_DIALOG action
   */
  private handleCloseDialog(): void {
    // Clear fragment to close dialogs
    this.router.navigate([], {
      fragment: undefined,
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Handle BACK_TO_LIST action
   */
  private handleBackToList(): void {
    this.router.navigate(['/chats']);
  }

  /**
   * Set current context
   * Components should call this when context changes
   */
  setContext(context: ShortcutContext): void {
    this.log(`Context changed: ${this.currentContext} -> ${context}`);
    this.currentContext = context;
  }

  /**
   * Get current context
   */
  getContext(): ShortcutContext {
    return this.currentContext;
  }

  /**
   * Enable or disable logging
   */
  setLoggingEnabled(enabled: boolean): void {
    this.loggingEnabled = enabled;
  }

  /**
   * Check if an action is handled by this service
   * Used for testing and validation
   */
  isActionHandled(action: ShortcutActionTypes): boolean {
    const handledActions = [
      ShortcutActionTypes.SHOW_SHORTCUTS,
      ShortcutActionTypes.OPEN_SEARCH,
      ShortcutActionTypes.CREATE_GROUP,
      ShortcutActionTypes.GROUP_INFO,
      ShortcutActionTypes.CLOSE_DIALOG,
      ShortcutActionTypes.BACK_TO_LIST
    ];
    return handledActions.includes(action);
  }

  /**
   * Get list of actions handled directly by this service
   */
  getHandledActions(): ShortcutActionTypes[] {
    return [
      ShortcutActionTypes.SHOW_SHORTCUTS,
      ShortcutActionTypes.OPEN_SEARCH,
      ShortcutActionTypes.CREATE_GROUP,
      ShortcutActionTypes.GROUP_INFO,
      ShortcutActionTypes.CLOSE_DIALOG,
      ShortcutActionTypes.BACK_TO_LIST
    ];
  }

  /**
   * Get list of actions that need to be handled by components
   */
  getComponentHandledActions(): ShortcutActionTypes[] {
    return [
      ShortcutActionTypes.PREV_CHAT,
      ShortcutActionTypes.NEXT_CHAT,
      ShortcutActionTypes.NEW_MESSAGE,
      ShortcutActionTypes.SEND_MESSAGE,
      ShortcutActionTypes.SAVE_CHANGES,
      ShortcutActionTypes.FOCUS_SEARCH,
      ShortcutActionTypes.FOCUS_MESSAGE_INPUT
    ];
  }

  /**
   * Log execution result
   */
  private logExecution(result: ShortcutExecutionResult): void {
    if (result.success) {
      this.log(
        `✓ Action executed successfully: ${result.action} at ${result.timestamp.toISOString()}`
      );
    } else {
      this.logError(
        `✗ Action failed: ${result.action} - ${result.error || 'Unknown error'}`
      );
    }
  }

  /**
   * Structured logging helper
   */
  private log(message: string): void {
    if (this.loggingEnabled && isPlatformBrowser(this.platformId)) {
      console.log(`[ShortcutHandler] ${message}`);
    }
  }

  /**
   * Error logging helper
   */
  private logError(message: string, error?: any): void {
    if (this.loggingEnabled && isPlatformBrowser(this.platformId)) {
      console.error(`[ShortcutHandler] ${message}`, error || '');
    }
  }
}

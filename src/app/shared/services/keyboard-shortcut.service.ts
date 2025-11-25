import { Injectable, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { ShortcutRegistryService } from './shortcut-registry.service';
import { ShortcutHandlerService } from './shortcut-handler.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import {
  ShortcutActionTypes,
  ShortcutKeyBinding,
  ShortcutContext,
  doesEventMatchBinding
} from '../models/keyboard-shortcut.model';

/**
 * Legacy interfaces for backward compatibility
 * @deprecated Use models from keyboard-shortcut.model.ts instead
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  category: string;
  action: string;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

/**
 * KeyboardShortcutService (Refactored)
 * 
 * Core service for capturing global keyboard events and emitting standardized actions.
 * This service has been refactored to follow enterprise-level architecture with
 * clear separation of concerns.
 * 
 * Responsibilities (FOCUSED):
 * - Capture global keydown events in browser environment
 * - Match keyboard events to registered shortcuts
 * - Emit shortcut actions via RxJS Subject
 * - Handle input field detection to avoid conflicts
 * - Integrate with ShortcutRegistryService for shortcut lookup
 * - Integrate with ShortcutHandlerService for action execution
 * 
 * What this service DOES NOT do anymore:
 * - Store shortcut metadata (delegated to ShortcutRegistryService)
 * - Handle action routing (delegated to ShortcutHandlerService)
 * - Manage UI display logic
 * 
 * Global Enable/Disable:
 * - Listens to 'enableKeyboardShortcuts' setting from UserSettingsService
 * - When disabled, all shortcuts are completely disabled (no listener fires)
 * - Uses BehaviorSubject for reactive updates (no refresh needed)
 * 
 * @example
 * ```typescript
 * // Subscribe to shortcut events
 * keyboardService.shortcutTriggered$.subscribe(action => {
 *   console.log('Shortcut triggered:', action);
 * });
 * 
 * // Check if shortcuts are enabled
 * keyboardService.shortcutsEnabled$.subscribe(enabled => {
 *   console.log('Shortcuts enabled:', enabled);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService implements OnDestroy {
  /**
   * Subject for broadcasting triggered shortcuts
   * @deprecated Use ShortcutHandlerService.actionRequested$ instead
   */
  private readonly shortcutTriggered = new Subject<string>();
  
  /**
   * Observable stream of triggered shortcuts
   * @deprecated Use ShortcutHandlerService.actionRequested$ instead
   */
  public readonly shortcutTriggered$: Observable<string> = this.shortcutTriggered.asObservable();

  /**
   * BehaviorSubject tracking whether keyboard shortcuts are globally enabled
   * Defaults to true, updated reactively from user settings
   */
  private readonly shortcutsEnabledSubject = new BehaviorSubject<boolean>(true);

  /**
   * Observable stream of the global shortcuts enabled state
   * Components can subscribe to react to setting changes immediately
   */
  public readonly shortcutsEnabled$: Observable<boolean> = this.shortcutsEnabledSubject.asObservable();

  /**
   * Current active context for context-aware shortcuts
   */
  private currentContext: ShortcutContext = ShortcutContext.GLOBAL;

  /**
   * Subscription to user settings for cleanup
   */
  private settingsSubscription?: Subscription;

  /**
   * Settings category and key for keyboard shortcuts setting
   */
  private static readonly SETTINGS_CATEGORY = 'accessibility';
  private static readonly SETTINGS_KEY = 'accessibility.enableKeyboardShortcuts';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private registryService: ShortcutRegistryService,
    private handlerService: ShortcutHandlerService,
    private userSettingsService: UserSettingsService
  ) {
    // Initialize listener only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.initializeGlobalListener();
      this.subscribeToSettings();
    }
  }

  /**
   * Subscribe to user settings to listen for enableKeyboardShortcuts changes
   * Uses distinctUntilChanged to only emit when the value actually changes
   */
  private subscribeToSettings(): void {
    this.settingsSubscription = this.userSettingsService.effectiveSettings$.pipe(
      map(settings => {
        if (!settings?.settings) {
          return true; // Default to enabled if no settings
        }
        const accessibilitySettings = settings.settings[KeyboardShortcutService.SETTINGS_CATEGORY];
        if (!accessibilitySettings) {
          return true; // Default to enabled if category doesn't exist
        }
        // Check both key formats for compatibility (with and without category prefix)
        const enabledWithPrefix = accessibilitySettings[KeyboardShortcutService.SETTINGS_KEY];
        const enabledWithoutPrefix = accessibilitySettings['enableKeyboardShortcuts'];
        const enabled = enabledWithPrefix ?? enabledWithoutPrefix;
        // Default to true if setting is undefined, otherwise use the setting value
        return enabled !== false;
      }),
      distinctUntilChanged()
    ).subscribe(enabled => {
      this.shortcutsEnabledSubject.next(enabled);
    });
  }

  /**
   * Cleanup subscriptions on service destroy
   */
  ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
  }

  /**
   * Initialize global keyboard event listener
   * Only runs in browser environment (not SSR)
   * 
   * This is the core event capture mechanism that listens for all keydown events
   * and routes them through the shortcut system with enterprise-level context matching.
   */
  private initializeGlobalListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // CRITICAL: Check if shortcuts are globally enabled via user settings
      if (!this.shortcutsEnabledSubject.getValue()) {
        // Shortcuts are disabled globally - don't process any shortcuts
        return;
      }

      // CRITICAL: Check if user is authenticated before processing shortcuts
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        // User is not logged in - disable all shortcuts
        return;
      }

      // Special handling for Escape - always allow it to work for closing dialogs
      if (event.key === 'Escape') {
        event.preventDefault();
        this.triggerAction(ShortcutActionTypes.CLOSE_DIALOG);
        return;
      }

      // Don't trigger shortcuts when typing in input fields (except specific cases)
      if (this.isTypingInInput(event)) {
        // Allow Ctrl+K even in input fields for search (enterprise apps like Slack do this)
        if (event.ctrlKey && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.triggerAction(ShortcutActionTypes.OPEN_SEARCH);
          return;
        }
        return;
      }

      // Create binding from event
      const binding = this.createBindingFromEvent(event);
      
      // Find matching shortcut from registry using current context
      const shortcut = this.registryService.findMatchingShortcut(binding, this.currentContext);
      
      // Debug logging (can be enabled/disabled)
      if (shortcut) {
        console.log('[KeyboardShortcut] Match found:', {
          binding,
          context: this.currentContext,
          action: shortcut.action,
          shortcutContext: shortcut.context
        });
        event.preventDefault();
        this.triggerAction(shortcut.action);
      } else {
        // Log when no match found (helps debug context issues)
        console.log('[KeyboardShortcut] No match found:', {
          binding,
          context: this.currentContext,
          key: event.key,
          modifiers: {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey
          }
        });
      }
    });
  }

  /**
   * Check if user is typing in an input field
   * Prevents shortcuts from interfering with normal typing
   */
  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();

    // Allow shortcuts with modifier keys even in input fields
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return false;
    }

    return tagName === 'input' ||
           tagName === 'textarea' ||
           target.isContentEditable;
  }

  /**
   * Create a ShortcutKeyBinding from a keyboard event
   */
  private createBindingFromEvent(event: KeyboardEvent): ShortcutKeyBinding {
    // Normalize the key to lowercase for consistent matching
    let key = event.key;
    
    // For letter keys with modifiers, use lowercase
    if (key.length === 1 && (event.ctrlKey || event.altKey || event.metaKey)) {
      key = key.toLowerCase();
    }
    
    return {
      key: key,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    };
  }

  /**
   * Trigger an action through the handler service
   * This is the integration point between event capture and action execution
   */
  private triggerAction(action: ShortcutActionTypes): void {
    // Emit on legacy observable for backward compatibility
    this.shortcutTriggered.next(action);
    
    // Execute through handler service (new architecture)
    this.handlerService.executeAction(action, this.currentContext);
  }

  /**
   * Set current context for context-aware shortcuts
   * Components should call this when their context changes
   */
  setContext(context: ShortcutContext): void {
    this.currentContext = context;
    this.handlerService.setContext(context);
  }

  /**
   * Get current context
   */
  getContext(): ShortcutContext {
    return this.currentContext;
  }

  /**
   * Check if keyboard shortcuts are globally enabled
   * Returns the current value synchronously
   */
  areShortcutsEnabled(): boolean {
    return this.shortcutsEnabledSubject.getValue();
  }

  /**
   * Get all shortcuts grouped by category
   * @deprecated Use ShortcutRegistryService.getShortcutsGroupedByCategory() instead
   */
  getShortcutsByCategory(): ShortcutCategory[] {
    const grouped = this.registryService.getShortcutsGroupedByCategory();
    const categories: ShortcutCategory[] = [];

    grouped.forEach((shortcuts, categoryName) => {
      categories.push({
        name: categoryName,
        shortcuts: shortcuts.map(s => ({
          key: s.binding.key,
          ctrl: s.binding.ctrl,
          alt: s.binding.alt,
          shift: s.binding.shift,
          description: s.description,
          category: s.category,
          action: s.action
        }))
      });
    });

    return categories;
  }

  /**
   * Get formatted shortcut string for display
   * @deprecated Use ShortcutRegistryService.getShortcutDisplay() instead
   */
  getShortcutDisplay(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');

    // Format key name
    let keyName = shortcut.key;
    if (keyName === ' ') keyName = 'Space';
    if (keyName.startsWith('Arrow')) keyName = keyName.replace('Arrow', '');

    parts.push(keyName);

    return parts.join(' + ');
  }

  /**
   * Manually trigger a shortcut action
   * @deprecated Use ShortcutHandlerService.executeAction() instead
   */
  triggerShortcut(action: string): void {
    if (Object.values(ShortcutActionTypes).includes(action as ShortcutActionTypes)) {
      this.triggerAction(action as ShortcutActionTypes);
    } else {
      // Fallback for legacy string actions
      this.shortcutTriggered.next(action);
    }
  }
}

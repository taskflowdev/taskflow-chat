import { Injectable } from '@angular/core';
import {
  ShortcutMetadata,
  ShortcutActionTypes,
  ShortcutKeyBinding,
  ShortcutCategory,
  ShortcutContext,
  ShortcutConflict,
  areKeyBindingsEqual,
  getKeyBindingDisplay
} from '../models/keyboard-shortcut.model';

/**
 * ShortcutRegistryService
 * 
 * Enterprise-level service for managing keyboard shortcut registry.
 * Maintains a centralized registry of all available shortcuts with their
 * key mappings, descriptions, and metadata.
 * 
 * Responsibilities:
 * - Store and manage shortcut metadata
 * - Provide query methods for shortcuts by action, category, or context
 * - Detect and handle key binding conflicts
 * - Support enabling/disabling shortcuts
 * - Allow future extensibility for user-customizable shortcuts
 * 
 * @example
 * ```typescript
 * // Get shortcut by action
 * const shortcut = registry.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
 * 
 * // Get all shortcuts for a category
 * const navShortcuts = registry.getShortcutsByCategory(ShortcutCategory.NAVIGATION);
 * 
 * // Check for conflicts
 * const conflicts = registry.detectConflicts();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ShortcutRegistryService {
  /**
   * Internal registry of all shortcuts
   * Using Map for O(1) lookup by action
   */
  private readonly registry = new Map<ShortcutActionTypes, ShortcutMetadata>();

  constructor() {
    this.initializeDefaultShortcuts();
  }

  /**
   * Initialize default shortcuts
   * This can be extended or overridden by user preferences in the future
   */
  private initializeDefaultShortcuts(): void {
    const defaultShortcuts: ShortcutMetadata[] = [
      // General shortcuts
      {
        action: ShortcutActionTypes.SHOW_SHORTCUTS,
        binding: { key: '?', shift: true },
        description: 'Show keyboard shortcuts',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.CLOSE_DIALOG,
        binding: { key: 'Escape' },
        description: 'Close dialog/modal',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.DIALOG_OPEN,
        enabled: true,
        priority: 200
      },

      // Navigation shortcuts
      {
        action: ShortcutActionTypes.OPEN_SEARCH,
        binding: { key: 'k', ctrl: true },
        description: 'Search groups',
        category: ShortcutCategory.NAVIGATION,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.CREATE_GROUP,
        binding: { key: 'n', ctrl: true },
        description: 'Create new group',
        category: ShortcutCategory.NAVIGATION,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.GROUP_INFO,
        binding: { key: 'i', ctrl: true },
        description: 'Group info',
        category: ShortcutCategory.NAVIGATION,
        context: ShortcutContext.CHAT_VIEW,
        enabled: true,
        priority: 90
      },
      {
        action: ShortcutActionTypes.FOCUS_SEARCH,
        binding: { key: '/' },
        description: 'Focus search',
        category: ShortcutCategory.NAVIGATION,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 80
      },

      // Chat navigation shortcuts
      {
        action: ShortcutActionTypes.PREV_CHAT,
        binding: { key: 'ArrowUp', alt: true },
        description: 'Previous chat',
        category: ShortcutCategory.CHAT_NAVIGATION,
        context: ShortcutContext.CHAT_VIEW,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.NEXT_CHAT,
        binding: { key: 'ArrowDown', alt: true },
        description: 'Next chat',
        category: ShortcutCategory.CHAT_NAVIGATION,
        context: ShortcutContext.CHAT_VIEW,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.BACK_TO_LIST,
        binding: { key: 'b', ctrl: true },
        description: 'Back to chat list',
        category: ShortcutCategory.CHAT_NAVIGATION,
        context: ShortcutContext.CHAT_VIEW,
        enabled: true,
        priority: 90
      },

      // Message actions
      {
        action: ShortcutActionTypes.NEW_MESSAGE,
        binding: { key: 'm', ctrl: true },
        description: 'New message',
        category: ShortcutCategory.ACTIONS,
        context: ShortcutContext.CHAT_VIEW,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.SEND_MESSAGE,
        binding: { key: 'Enter', ctrl: true },
        description: 'Send message',
        category: ShortcutCategory.ACTIONS,
        context: ShortcutContext.MESSAGE_INPUT,
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.SAVE_CHANGES,
        binding: { key: 's', ctrl: true },
        description: 'Save changes',
        category: ShortcutCategory.ACTIONS,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 100
      }
    ];

    defaultShortcuts.forEach(shortcut => {
      this.registry.set(shortcut.action, shortcut);
    });
  }

  /**
   * Register a new shortcut or update an existing one
   * Useful for adding custom shortcuts or user preferences
   */
  registerShortcut(shortcut: ShortcutMetadata): void {
    this.registry.set(shortcut.action, shortcut);
  }

  /**
   * Unregister a shortcut by action
   */
  unregisterShortcut(action: ShortcutActionTypes): boolean {
    return this.registry.delete(action);
  }

  /**
   * Get a shortcut by its action
   */
  getShortcutByAction(action: ShortcutActionTypes): ShortcutMetadata | undefined {
    return this.registry.get(action);
  }

  /**
   * Get all shortcuts matching a specific key binding
   * Useful for conflict detection
   */
  getShortcutsByBinding(binding: ShortcutKeyBinding): ShortcutMetadata[] {
    return Array.from(this.registry.values()).filter(shortcut =>
      areKeyBindingsEqual(shortcut.binding, binding)
    );
  }

  /**
   * Get all shortcuts for a specific category
   */
  getShortcutsByCategory(category: ShortcutCategory): ShortcutMetadata[] {
    return Array.from(this.registry.values()).filter(
      shortcut => shortcut.category === category
    );
  }

  /**
   * Get all shortcuts for a specific context
   */
  getShortcutsByContext(context: ShortcutContext): ShortcutMetadata[] {
    return Array.from(this.registry.values()).filter(
      shortcut => shortcut.context === context || shortcut.context === ShortcutContext.GLOBAL
    );
  }

  /**
   * Get all enabled shortcuts
   */
  getEnabledShortcuts(): ShortcutMetadata[] {
    return Array.from(this.registry.values()).filter(
      shortcut => shortcut.enabled !== false
    );
  }

  /**
   * Get all shortcuts grouped by category
   * Useful for displaying shortcuts in UI
   */
  getShortcutsGroupedByCategory(): Map<ShortcutCategory, ShortcutMetadata[]> {
    const grouped = new Map<ShortcutCategory, ShortcutMetadata[]>();

    Array.from(this.registry.values()).forEach(shortcut => {
      if (!grouped.has(shortcut.category)) {
        grouped.set(shortcut.category, []);
      }
      grouped.get(shortcut.category)!.push(shortcut);
    });

    return grouped;
  }

  /**
   * Detect conflicts - multiple shortcuts with same key binding
   * Returns array of conflicts with priority resolution suggestions
   */
  detectConflicts(): ShortcutConflict[] {
    const bindingMap = new Map<string, ShortcutMetadata[]>();
    const conflicts: ShortcutConflict[] = [];

    // Group shortcuts by their binding string
    Array.from(this.registry.values()).forEach(shortcut => {
      const bindingKey = this.getBindingKey(shortcut.binding);
      if (!bindingMap.has(bindingKey)) {
        bindingMap.set(bindingKey, []);
      }
      bindingMap.get(bindingKey)!.push(shortcut);
    });

    // Find conflicts (more than one shortcut with same binding)
    bindingMap.forEach((shortcuts, bindingKey) => {
      if (shortcuts.length > 1) {
        // Check if they have different contexts (not a real conflict)
        const contexts = new Set(shortcuts.map(s => s.context));
        if (contexts.size === shortcuts.length) {
          // Different contexts, not a conflict
          return;
        }

        conflicts.push({
          binding: shortcuts[0].binding,
          conflictingShortcuts: shortcuts
        });
      }
    });

    return conflicts;
  }

  /**
   * Find the best matching shortcut for a key binding
   * Considers context and priority for conflict resolution
   */
  findMatchingShortcut(
    binding: ShortcutKeyBinding,
    currentContext: ShortcutContext = ShortcutContext.GLOBAL
  ): ShortcutMetadata | undefined {
    const matchingShortcuts = this.getShortcutsByBinding(binding)
      .filter(shortcut => shortcut.enabled !== false)
      .filter(shortcut =>
        shortcut.context === currentContext ||
        shortcut.context === ShortcutContext.GLOBAL
      );

    if (matchingShortcuts.length === 0) {
      return undefined;
    }

    // Sort by priority (higher priority first)
    matchingShortcuts.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return matchingShortcuts[0];
  }

  /**
   * Enable or disable a shortcut
   */
  setShortcutEnabled(action: ShortcutActionTypes, enabled: boolean): boolean {
    const shortcut = this.registry.get(action);
    if (shortcut) {
      // Update the shortcut with new enabled state
      this.registry.set(action, { ...shortcut, enabled });
      return true;
    }
    return false;
  }

  /**
   * Get formatted display string for a shortcut
   */
  getShortcutDisplay(shortcut: ShortcutMetadata): string {
    return getKeyBindingDisplay(shortcut.binding);
  }

  /**
   * Get all shortcuts as an array
   */
  getAllShortcuts(): ShortcutMetadata[] {
    return Array.from(this.registry.values());
  }

  /**
   * Clear all shortcuts (useful for testing)
   */
  clearAllShortcuts(): void {
    this.registry.clear();
  }

  /**
   * Reset to default shortcuts
   */
  resetToDefaults(): void {
    this.clearAllShortcuts();
    this.initializeDefaultShortcuts();
  }

  /**
   * Get internal binding key for conflict detection
   */
  private getBindingKey(binding: ShortcutKeyBinding): string {
    const parts: string[] = [];
    if (binding.ctrl) parts.push('ctrl');
    if (binding.alt) parts.push('alt');
    if (binding.shift) parts.push('shift');
    if (binding.meta) parts.push('meta');
    parts.push(binding.key.toLowerCase());
    return parts.join('+');
  }
}

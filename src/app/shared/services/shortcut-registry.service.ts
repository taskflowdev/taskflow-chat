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
        binding: { key: '?' },
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
        context: ShortcutContext.CHAT_SELECTED, // Only works when chat is selected
        enabled: true,
        priority: 90
      },
      {
        action: ShortcutActionTypes.FOCUS_SEARCH,
        binding: { key: '/' },
        description: 'Focus search',
        category: ShortcutCategory.NAVIGATION,
        context: ShortcutContext.SEARCH_DIALOG, // Only works in search dialog
        enabled: true,
        priority: 80
      },

      // Chat navigation shortcuts - only active when a chat is selected
      {
        action: ShortcutActionTypes.PREV_CHAT,
        binding: { key: 'ArrowUp', alt: true },
        description: 'Previous chat',
        category: ShortcutCategory.CHAT_NAVIGATION,
        context: ShortcutContext.CHAT_VIEW, // Active in chat view (with or without selected chat)
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.NEXT_CHAT,
        binding: { key: 'ArrowDown', alt: true },
        description: 'Next chat',
        category: ShortcutCategory.CHAT_NAVIGATION,
        context: ShortcutContext.CHAT_VIEW, // Active in chat view (with or without selected chat)
        enabled: true,
        priority: 100
      },
      {
        action: ShortcutActionTypes.BACK_TO_LIST,
        binding: { key: 'b', ctrl: true },
        description: 'Back to chat list',
        category: ShortcutCategory.CHAT_NAVIGATION,
        context: ShortcutContext.CHAT_SELECTED, // Only when chat is selected
        enabled: true,
        priority: 90
      },

      // Message actions
      {
        action: ShortcutActionTypes.NEW_MESSAGE,
        binding: { key: 'm', ctrl: true },
        description: 'New message',
        category: ShortcutCategory.ACTIONS,
        context: ShortcutContext.CHAT_SELECTED, // Only when chat is selected
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
   * Uses areKeyBindingsEqual() for comparison which handles:
   * - Shifted characters (?, !, @, etc.)
   * - Undefined vs false for modifier keys
   * - Case-insensitive key matching
   * 
   * @param binding - The key binding to match
   * @returns Array of shortcuts that match the binding
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
   * Find the best matching shortcut for a key binding and current context
   * 
   * Enterprise-level matching algorithm with context hierarchy support:
   * 1. Checks all enabled shortcuts that match the key binding
   * 2. Filters by compatible contexts (current, inherited, or GLOBAL)
   * 3. Prioritizes exact context match > inherited context > GLOBAL
   * 4. Within same context level, prioritizes higher priority value
   * 
   * Context Hierarchy Examples:
   * - CHAT_SELECTED inherits from CHAT_VIEW (so CHAT_VIEW shortcuts work)
   * - SEARCH_DIALOG inherits from DIALOG_OPEN
   * 
   * @param binding - The key binding to match
   * @param currentContext - The current UI context
   * @returns The best matching shortcut, or undefined if none found
   */
  findMatchingShortcut(
    binding: ShortcutKeyBinding,
    currentContext: ShortcutContext = ShortcutContext.GLOBAL
  ): ShortcutMetadata | undefined {
    // Step 1: Get compatible contexts (includes current + inherited contexts)
    const compatibleContexts = this.getCompatibleContexts(currentContext);
    
    // Step 2: Find all shortcuts matching the key binding
    const matchingShortcuts = this.getShortcutsByBinding(binding)
      .filter(shortcut => shortcut.enabled !== false)
      .filter(shortcut => {
        // A shortcut matches if it's in:
        // - The exact current context
        // - Any inherited/compatible context
        // - GLOBAL context (always available)
        return compatibleContexts.includes(shortcut.context) ||
               shortcut.context === ShortcutContext.GLOBAL;
      });

    if (matchingShortcuts.length === 0) {
      return undefined;
    }

    // Step 3: Sort by context specificity (most specific first), then priority
    matchingShortcuts.sort((a, b) => {
      // Calculate context specificity score (higher = more specific)
      const getContextScore = (shortcut: ShortcutMetadata): number => {
        if (shortcut.context === currentContext) {
          return 1000; // Exact match is highest priority
        }
        if (compatibleContexts.includes(shortcut.context)) {
          // Inherited context - score by position in hierarchy
          const index = compatibleContexts.indexOf(shortcut.context);
          return 500 - (index * 100); // Closer to current context = higher score
        }
        if (shortcut.context === ShortcutContext.GLOBAL) {
          return 0; // Global is lowest specificity
        }
        return -1; // Should never happen due to filter above
      };
      
      const scoreA = getContextScore(a);
      const scoreB = getContextScore(b);
      
      // First, sort by context specificity
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }
      
      // If same context level, sort by priority value
      return (b.priority || 0) - (a.priority || 0);
    });

    // Return the best match (first after sorting)
    return matchingShortcuts[0];
  }

  /**
   * Get compatible contexts for a given context (context hierarchy)
   * 
   * Implements context inheritance pattern similar to CSS specificity.
   * More specific contexts inherit shortcuts from less specific ones.
   * 
   * Context Hierarchy Tree:
   * ```
   * GLOBAL (root - always accessible)
   *   ├── CHAT_VIEW
   *   │     └── CHAT_SELECTED (inherits CHAT_VIEW shortcuts)
   *   ├── DIALOG_OPEN
   *   │     └── SEARCH_DIALOG (inherits DIALOG_OPEN shortcuts)
   *   ├── CONVERSATION
   *   ├── SIDEBAR
   *   └── MESSAGE_INPUT
   * ```
   * 
   * @param context - The current context
   * @returns Array of contexts in order: [current, parent, grandparent, ...]
   * 
   * @example
   * ```typescript
   * getCompatibleContexts(CHAT_SELECTED)
   * // Returns: [CHAT_SELECTED, CHAT_VIEW]
   * 
   * getCompatibleContexts(SEARCH_DIALOG)
   * // Returns: [SEARCH_DIALOG, DIALOG_OPEN]
   * ```
   */
  private getCompatibleContexts(context: ShortcutContext): ShortcutContext[] {
    const contexts: ShortcutContext[] = [context];
    
    // Define context inheritance/hierarchy
    // Each case adds parent contexts in order of inheritance
    switch (context) {
      case ShortcutContext.CHAT_SELECTED:
        // CHAT_SELECTED inherits from CHAT_VIEW
        // This allows chat navigation shortcuts to work whether chat is selected or not
        contexts.push(ShortcutContext.CHAT_VIEW);
        break;
        
      case ShortcutContext.SEARCH_DIALOG:
        // SEARCH_DIALOG inherits from DIALOG_OPEN
        // This allows general dialog shortcuts (like Escape) to work in search
        contexts.push(ShortcutContext.DIALOG_OPEN);
        break;
        
      case ShortcutContext.MESSAGE_INPUT:
        // MESSAGE_INPUT could inherit from CHAT_SELECTED if needed
        // contexts.push(ShortcutContext.CHAT_SELECTED);
        break;
        
      // Add more hierarchies as needed for future contexts
      case ShortcutContext.CONVERSATION:
        // CONVERSATION could inherit from CHAT_VIEW
        // contexts.push(ShortcutContext.CHAT_VIEW);
        break;
        
      // Contexts with no parent just contain themselves
      case ShortcutContext.GLOBAL:
      case ShortcutContext.UNAUTHENTICATED:
      case ShortcutContext.CHAT_VIEW:
      case ShortcutContext.DIALOG_OPEN:
      case ShortcutContext.SIDEBAR:
      default:
        // No additional inheritance
        break;
    }
    
    return contexts;
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

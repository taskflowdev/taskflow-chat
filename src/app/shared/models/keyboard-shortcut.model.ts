/**
 * Centralized keyboard shortcut models and enums
 * Enterprise-level architecture for keyboard shortcut management
 */

/**
 * Enum defining all possible shortcut actions
 * Centralized list makes it easy to add new shortcuts
 */
export enum ShortcutActionTypes {
  // General actions
  SHOW_SHORTCUTS = 'SHOW_SHORTCUTS',
  CLOSE_DIALOG = 'CLOSE_DIALOG',
  
  // Navigation actions
  OPEN_SEARCH = 'OPEN_SEARCH',
  CREATE_GROUP = 'CREATE_GROUP',
  GROUP_INFO = 'GROUP_INFO',
  FOCUS_SEARCH = 'FOCUS_SEARCH',
  BACK_TO_LIST = 'BACK_TO_LIST',
  
  // Chat navigation
  PREV_CHAT = 'PREV_CHAT',
  NEXT_CHAT = 'NEXT_CHAT',
  
  // Message actions
  NEW_MESSAGE = 'NEW_MESSAGE',
  SEND_MESSAGE = 'SEND_MESSAGE',
  SAVE_CHANGES = 'SAVE_CHANGES',
  
  // Future expandable actions
  TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR',
  FOCUS_MESSAGE_INPUT = 'FOCUS_MESSAGE_INPUT',
  EDIT_LAST_MESSAGE = 'EDIT_LAST_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  TOGGLE_NOTIFICATIONS = 'TOGGLE_NOTIFICATIONS',
  OPEN_SETTINGS = 'OPEN_SETTINGS'
}

/**
 * Context enum for context-aware shortcuts
 * Allows shortcuts to be active only in specific UI states
 */
export enum ShortcutContext {
  GLOBAL = 'GLOBAL',                          // Active everywhere (when authenticated)
  UNAUTHENTICATED = 'UNAUTHENTICATED',        // Active when user is not logged in
  CHAT_VIEW = 'CHAT_VIEW',                     // Active only in chat view
  CHAT_SELECTED = 'CHAT_SELECTED',             // Active only when a specific chat is selected
  DIALOG_OPEN = 'DIALOG_OPEN',                 // Active when dialog is open
  SEARCH_DIALOG = 'SEARCH_DIALOG',             // Active specifically in search dialog
  MESSAGE_INPUT = 'MESSAGE_INPUT',             // Active when message input is focused
  SIDEBAR = 'SIDEBAR',                         // Active in sidebar
  CONVERSATION = 'CONVERSATION'                // Active in conversation view
}

/**
 * Category for grouping shortcuts in UI
 */
export enum ShortcutCategory {
  GENERAL = 'General',
  NAVIGATION = 'Navigation',
  CHAT_NAVIGATION = 'Chat Navigation',
  ACTIONS = 'Actions',
  MESSAGING = 'Messaging'
}

/**
 * Interface for key binding configuration
 * Defines the actual key combination for a shortcut
 */
export interface ShortcutKeyBinding {
  /** Primary key (e.g., 'k', 'Enter', 'Escape', 'ArrowUp') */
  readonly key: string;
  
  /** Requires Ctrl key (Command on Mac) */
  readonly ctrl?: boolean;
  
  /** Requires Alt key (Option on Mac) */
  readonly alt?: boolean;
  
  /** Requires Shift key */
  readonly shift?: boolean;
  
  /** Requires Meta key (Windows/Command key) */
  readonly meta?: boolean;
  
  /** Optional: Alternative key binding */
  readonly alternativeKey?: string;
}

/**
 * Interface for shortcut metadata
 * Contains all information about a keyboard shortcut
 */
export interface ShortcutMetadata {
  /** Unique action identifier */
  readonly action: ShortcutActionTypes;
  
  /** Key binding configuration */
  readonly binding: ShortcutKeyBinding;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Category for grouping in UI */
  readonly category: ShortcutCategory;
  
  /** Context where this shortcut is active */
  readonly context: ShortcutContext;
  
  /** Whether this shortcut is enabled (for user preferences) */
  enabled?: boolean;
  
  /** Priority for conflict resolution (higher = higher priority) */
  readonly priority?: number;
}

/**
 * Interface for shortcut execution result
 * Used for logging and debugging
 */
export interface ShortcutExecutionResult {
  readonly action: ShortcutActionTypes;
  readonly timestamp: Date;
  readonly success: boolean;
  readonly context?: ShortcutContext;
  readonly error?: string;
}

/**
 * Interface for shortcut conflict detection
 */
export interface ShortcutConflict {
  readonly binding: ShortcutKeyBinding;
  readonly conflictingShortcuts: ShortcutMetadata[];
}

/**
 * Type guard to check if a string is a valid ShortcutActionTypes
 */
export function isValidShortcutAction(action: string): action is ShortcutActionTypes {
  return Object.values(ShortcutActionTypes).includes(action as ShortcutActionTypes);
}

/**
 * Helper to convert key binding to display string
 */
export function getKeyBindingDisplay(binding: ShortcutKeyBinding): string {
  const parts: string[] = [];
  
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  if (binding.meta) parts.push('Meta');
  
  // Format key name
  let keyName = binding.key;
  if (keyName === ' ') keyName = 'Space';
  if (keyName.startsWith('Arrow')) keyName = keyName.replace('Arrow', '');
  if (keyName === 'Escape') keyName = 'Esc';
  
  parts.push(keyName);
  
  return parts.join(' + ');
}

/**
 * Helper to check if two key bindings are equal
 * Handles special shifted characters (?, !, @, etc.) by ignoring shift flag
 */
export function areKeyBindingsEqual(
  binding1: ShortcutKeyBinding,
  binding2: ShortcutKeyBinding
): boolean {
  // Keys that inherently include shift (US keyboard layout)
  const shiftedChars = ['?', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '~'];
  const isShiftedChar = shiftedChars.includes(binding1.key) || shiftedChars.includes(binding2.key);
  
  // For shifted characters, ignore the shift flag in comparison
  const shiftMatch = isShiftedChar ? true : (!!binding1.shift === !!binding2.shift);
  
  return (
    binding1.key === binding2.key &&
    !!binding1.ctrl === !!binding2.ctrl &&
    !!binding1.alt === !!binding2.alt &&
    shiftMatch &&
    !!binding1.meta === !!binding2.meta
  );
}

/**
 * Helper to check if a keyboard event matches a key binding
 */
export function doesEventMatchBinding(
  event: KeyboardEvent,
  binding: ShortcutKeyBinding
): boolean {
  const keyMatch = binding.key === event.key;
  const ctrlMatch = !!binding.ctrl === event.ctrlKey;
  const altMatch = !!binding.alt === event.altKey;
  const shiftMatch = !!binding.shift === event.shiftKey;
  const metaMatch = !!binding.meta === event.metaKey;
  
  return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
}

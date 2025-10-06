import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  private shortcutTriggered = new Subject<string>();
  public shortcutTriggered$ = this.shortcutTriggered.asObservable();

  private shortcuts: KeyboardShortcut[] = [
    // General
    { key: '?', shift: true, description: 'Show keyboard shortcuts', category: 'General', action: 'SHOW_SHORTCUTS' },
    { key: 'Escape', description: 'Close dialog/modal', category: 'General', action: 'CLOSE_DIALOG' },
    
    // Navigation
    { key: 'k', ctrl: true, description: 'Search groups', category: 'Navigation', action: 'OPEN_SEARCH' },
    { key: 'n', ctrl: true, description: 'Create new group', category: 'Navigation', action: 'CREATE_GROUP' },
    { key: 'i', ctrl: true, description: 'Group info', category: 'Navigation', action: 'GROUP_INFO' },
    { key: '/', description: 'Focus search', category: 'Navigation', action: 'FOCUS_SEARCH' },
    
    // Chat Navigation
    { key: 'ArrowUp', alt: true, description: 'Previous chat', category: 'Chat Navigation', action: 'PREV_CHAT' },
    { key: 'ArrowDown', alt: true, description: 'Next chat', category: 'Chat Navigation', action: 'NEXT_CHAT' },
    { key: 'b', ctrl: true, description: 'Back to chat list', category: 'Chat Navigation', action: 'BACK_TO_LIST' },
    
    // Actions
    { key: 'm', ctrl: true, description: 'New message', category: 'Actions', action: 'NEW_MESSAGE' },
    { key: 'Enter', ctrl: true, description: 'Send message', category: 'Actions', action: 'SEND_MESSAGE' },
    { key: 's', ctrl: true, description: 'Save changes', category: 'Actions', action: 'SAVE_CHANGES' },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize listener only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.initializeGlobalListener();
    }
  }

  /**
   * Initialize global keyboard event listener
   * Only runs in browser environment (not SSR)
   */
  private initializeGlobalListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except specific cases)
      if (this.isTypingInInput(event)) {
        // Allow Ctrl+K even in input fields for search
        if (event.ctrlKey && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.shortcutTriggered.next('OPEN_SEARCH');
          return;
        }
        return;
      }

      const shortcut = this.findMatchingShortcut(event);
      if (shortcut) {
        event.preventDefault();
        this.shortcutTriggered.next(shortcut.action);
      }
    });
  }

  /**
   * Check if user is typing in an input field
   */
  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    
    // Allow shortcuts in certain cases
    if (event.ctrlKey || event.altKey) {
      return false;
    }

    return tagName === 'input' || 
           tagName === 'textarea' || 
           target.isContentEditable;
  }

  /**
   * Find matching shortcut for keyboard event
   */
  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | undefined {
    return this.shortcuts.find(shortcut => {
      const keyMatch = shortcut.key === event.key;
      const ctrlMatch = (shortcut.ctrl === true) ? event.ctrlKey : true;
      const altMatch = (shortcut.alt === true) ? event.altKey : true;
      const shiftMatch = (shortcut.shift === true) ? event.shiftKey : true;

      // Ensure modifier keys are not pressed when not required
      const noExtraCtrl = !shortcut.ctrl ? !event.ctrlKey : true;
      const noExtraAlt = !shortcut.alt ? !event.altKey : true;
      const noExtraShift = !shortcut.shift ? !event.shiftKey : true;

      return keyMatch && ctrlMatch && altMatch && shiftMatch && 
             (shortcut.ctrl || noExtraCtrl) && 
             (shortcut.alt || noExtraAlt) && 
             (shortcut.shift || noExtraShift);
    });
  }

  /**
   * Get all shortcuts grouped by category
   */
  getShortcutsByCategory(): ShortcutCategory[] {
    const categories: { [key: string]: KeyboardShortcut[] } = {};

    this.shortcuts.forEach(shortcut => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    });

    return Object.keys(categories).map(categoryName => ({
      name: categoryName,
      shortcuts: categories[categoryName]
    }));
  }

  /**
   * Get formatted shortcut string for display
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
   */
  triggerShortcut(action: string): void {
    this.shortcutTriggered.next(action);
  }
}

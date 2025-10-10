import { TestBed } from '@angular/core/testing';
import { ShortcutRegistryService } from './shortcut-registry.service';
import {
  ShortcutActionTypes,
  ShortcutCategory,
  ShortcutContext,
  ShortcutKeyBinding
} from '../models/keyboard-shortcut.model';

describe('ShortcutRegistryService', () => {
  let service: ShortcutRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShortcutRegistryService]
    });
    service = TestBed.inject(ShortcutRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Default Shortcuts', () => {
    it('should initialize with default shortcuts', () => {
      const shortcuts = service.getAllShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('should have SHOW_SHORTCUTS shortcut', () => {
      const shortcut = service.getShortcutByAction(ShortcutActionTypes.SHOW_SHORTCUTS);
      expect(shortcut).toBeDefined();
      expect(shortcut?.binding.key).toBe('?');
      // Browser automatically converts Shift+/ to '?' so no shift flag needed
      expect(shortcut?.binding.shift).toBeFalsy();
    });

    it('should have OPEN_SEARCH shortcut', () => {
      const shortcut = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(shortcut).toBeDefined();
      expect(shortcut?.binding.key).toBe('k');
      expect(shortcut?.binding.ctrl).toBe(true);
    });

    it('should have CREATE_GROUP shortcut', () => {
      const shortcut = service.getShortcutByAction(ShortcutActionTypes.CREATE_GROUP);
      expect(shortcut).toBeDefined();
      expect(shortcut?.binding.key).toBe('n');
      expect(shortcut?.binding.ctrl).toBe(true);
    });
  });

  describe('Registry Operations', () => {
    it('should register a new shortcut', () => {
      const newShortcut = {
        action: ShortcutActionTypes.TOGGLE_SIDEBAR,
        binding: { key: 's', ctrl: true, shift: true },
        description: 'Toggle sidebar',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 100
      };

      service.registerShortcut(newShortcut);
      const retrieved = service.getShortcutByAction(ShortcutActionTypes.TOGGLE_SIDEBAR);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.description).toBe('Toggle sidebar');
    });

    it('should update an existing shortcut', () => {
      const original = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(original?.description).toBe('Search groups');

      service.registerShortcut({
        ...original!,
        description: 'Updated description'
      });

      const updated = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(updated?.description).toBe('Updated description');
    });

    it('should unregister a shortcut', () => {
      const result = service.unregisterShortcut(ShortcutActionTypes.SAVE_CHANGES);
      expect(result).toBe(true);

      const retrieved = service.getShortcutByAction(ShortcutActionTypes.SAVE_CHANGES);
      expect(retrieved).toBeUndefined();
    });

    it('should return false when unregistering non-existent shortcut', () => {
      const result = service.unregisterShortcut(ShortcutActionTypes.TOGGLE_SIDEBAR);
      expect(result).toBe(false);
    });
  });

  describe('Query Operations', () => {
    it('should get shortcuts by category', () => {
      const navShortcuts = service.getShortcutsByCategory(ShortcutCategory.NAVIGATION);
      expect(navShortcuts.length).toBeGreaterThan(0);
      expect(navShortcuts.every(s => s.category === ShortcutCategory.NAVIGATION)).toBe(true);
    });

    it('should get shortcuts by context', () => {
      const globalShortcuts = service.getShortcutsByContext(ShortcutContext.GLOBAL);
      expect(globalShortcuts.length).toBeGreaterThan(0);
    });

    it('should get enabled shortcuts only', () => {
      const allShortcuts = service.getAllShortcuts();
      const firstShortcut = allShortcuts[0];
      
      service.setShortcutEnabled(firstShortcut.action, false);
      
      const enabledShortcuts = service.getEnabledShortcuts();
      expect(enabledShortcuts.find(s => s.action === firstShortcut.action)).toBeUndefined();
    });

    it('should group shortcuts by category', () => {
      const grouped = service.getShortcutsGroupedByCategory();
      
      expect(grouped.size).toBeGreaterThan(0);
      expect(grouped.has(ShortcutCategory.GENERAL)).toBe(true);
      expect(grouped.has(ShortcutCategory.NAVIGATION)).toBe(true);
    });

    it('should get shortcuts by key binding', () => {
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const shortcuts = service.getShortcutsByBinding(binding);
      
      expect(shortcuts.length).toBeGreaterThan(0);
      expect(shortcuts[0].action).toBe(ShortcutActionTypes.OPEN_SEARCH);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect no conflicts in default shortcuts', () => {
      const conflicts = service.detectConflicts();
      
      // Default shortcuts should have different contexts or different bindings
      expect(conflicts.length).toBe(0);
    });

    it('should detect conflicts when two shortcuts have same binding and context', () => {
      // Register a conflicting shortcut
      service.registerShortcut({
        action: ShortcutActionTypes.TOGGLE_SIDEBAR,
        binding: { key: 'k', ctrl: true },
        description: 'Conflicting shortcut',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.GLOBAL, // Same context as OPEN_SEARCH
        enabled: true,
        priority: 50
      });

      const conflicts = service.detectConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      
      const conflict = conflicts.find(c => c.binding.key === 'k' && c.binding.ctrl);
      expect(conflict).toBeDefined();
      expect(conflict?.conflictingShortcuts.length).toBeGreaterThanOrEqual(2);
    });

    it('should not detect conflicts for same binding with different contexts', () => {
      // Register a shortcut with same binding but different context
      service.registerShortcut({
        action: ShortcutActionTypes.FOCUS_MESSAGE_INPUT,
        binding: { key: 'k', ctrl: true },
        description: 'Focus input',
        category: ShortcutCategory.MESSAGING,
        context: ShortcutContext.MESSAGE_INPUT, // Different context
        enabled: true,
        priority: 50
      });

      const conflicts = service.detectConflicts();
      
      // Should not detect conflict because contexts are different
      expect(conflicts.length).toBe(0);
    });
  });

  describe('Matching Shortcuts', () => {
    it('should find matching shortcut for a binding', () => {
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const shortcut = service.findMatchingShortcut(binding, ShortcutContext.GLOBAL);
      
      expect(shortcut).toBeDefined();
      expect(shortcut?.action).toBe(ShortcutActionTypes.OPEN_SEARCH);
    });

    it('should prioritize shortcuts with higher priority', () => {
      // Register two shortcuts with same binding and context
      service.registerShortcut({
        action: ShortcutActionTypes.TOGGLE_SIDEBAR,
        binding: { key: 't', ctrl: true },
        description: 'Low priority',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 50
      });

      service.registerShortcut({
        action: ShortcutActionTypes.TOGGLE_NOTIFICATIONS,
        binding: { key: 't', ctrl: true },
        description: 'High priority',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.GLOBAL,
        enabled: true,
        priority: 100
      });

      const binding: ShortcutKeyBinding = { key: 't', ctrl: true };
      const shortcut = service.findMatchingShortcut(binding, ShortcutContext.GLOBAL);
      
      expect(shortcut?.action).toBe(ShortcutActionTypes.TOGGLE_NOTIFICATIONS);
    });

    it('should not match disabled shortcuts', () => {
      service.setShortcutEnabled(ShortcutActionTypes.OPEN_SEARCH, false);
      
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const shortcut = service.findMatchingShortcut(binding, ShortcutContext.GLOBAL);
      
      expect(shortcut).toBeUndefined();
    });

    // ===== Context Hierarchy Tests =====

    it('should find context-specific shortcut over global shortcut', () => {
      const binding: ShortcutKeyBinding = { key: 'ArrowUp', alt: true };
      
      // This shortcut already exists in CHAT_VIEW context from defaults
      const result = service.findMatchingShortcut(binding, ShortcutContext.CHAT_VIEW);
      
      expect(result).toBeDefined();
      expect(result?.action).toBe(ShortcutActionTypes.PREV_CHAT);
      expect(result?.context).toBe(ShortcutContext.CHAT_VIEW);
    });

    it('should inherit shortcuts from parent context (CHAT_SELECTED inherits from CHAT_VIEW)', () => {
      const binding: ShortcutKeyBinding = { key: 'ArrowUp', alt: true };
      
      // PREV_CHAT is registered in CHAT_VIEW context
      // It should also work in CHAT_SELECTED context due to inheritance
      const result = service.findMatchingShortcut(binding, ShortcutContext.CHAT_SELECTED);
      
      expect(result).toBeDefined();
      expect(result?.action).toBe(ShortcutActionTypes.PREV_CHAT);
      expect(result?.context).toBe(ShortcutContext.CHAT_VIEW); // Original context is CHAT_VIEW
    });

    it('should prioritize exact context match over inherited context', () => {
      const binding: ShortcutKeyBinding = { key: 'i', ctrl: true };
      
      // GROUP_INFO is registered in CHAT_SELECTED context
      // Should be found in CHAT_SELECTED but not in CHAT_VIEW
      const resultSelected = service.findMatchingShortcut(binding, ShortcutContext.CHAT_SELECTED);
      const resultView = service.findMatchingShortcut(binding, ShortcutContext.CHAT_VIEW);
      
      expect(resultSelected).toBeDefined();
      expect(resultSelected?.action).toBe(ShortcutActionTypes.GROUP_INFO);
      
      expect(resultView).toBeUndefined(); // Not available in parent context
    });

    it('should find GLOBAL shortcuts in any context', () => {
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      
      // OPEN_SEARCH is registered in GLOBAL context
      // Should work in all contexts
      const contexts = [
        ShortcutContext.GLOBAL,
        ShortcutContext.CHAT_VIEW,
        ShortcutContext.CHAT_SELECTED,
        ShortcutContext.DIALOG_OPEN,
        ShortcutContext.SEARCH_DIALOG
      ];
      
      contexts.forEach(context => {
        const result = service.findMatchingShortcut(binding, context);
        expect(result).toBeDefined();
        expect(result?.action).toBe(ShortcutActionTypes.OPEN_SEARCH);
      });
    });

    it('should inherit from DIALOG_OPEN when in SEARCH_DIALOG context', () => {
      const binding: ShortcutKeyBinding = { key: 'Escape' };
      
      // CLOSE_DIALOG is registered in DIALOG_OPEN context
      // Should also work in SEARCH_DIALOG due to inheritance
      const result = service.findMatchingShortcut(binding, ShortcutContext.SEARCH_DIALOG);
      
      expect(result).toBeDefined();
      expect(result?.action).toBe(ShortcutActionTypes.CLOSE_DIALOG);
      expect(result?.context).toBe(ShortcutContext.DIALOG_OPEN);
    });

    it('should not find context-specific shortcuts in wrong context without inheritance', () => {
      const binding: ShortcutKeyBinding = { key: '/' };
      
      // FOCUS_SEARCH is registered in SEARCH_DIALOG context only
      // Should NOT work in other contexts
      const resultGlobal = service.findMatchingShortcut(binding, ShortcutContext.GLOBAL);
      const resultChatView = service.findMatchingShortcut(binding, ShortcutContext.CHAT_VIEW);
      
      expect(resultGlobal).toBeUndefined();
      expect(resultChatView).toBeUndefined();
      
      // But should work in SEARCH_DIALOG
      const resultSearch = service.findMatchingShortcut(binding, ShortcutContext.SEARCH_DIALOG);
      expect(resultSearch).toBeDefined();
      expect(resultSearch?.action).toBe(ShortcutActionTypes.FOCUS_SEARCH);
    });
  });

  describe('Enable/Disable', () => {
    it('should enable/disable shortcuts', () => {
      const result = service.setShortcutEnabled(ShortcutActionTypes.OPEN_SEARCH, false);
      expect(result).toBe(true);

      const shortcut = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(shortcut?.enabled).toBe(false);

      service.setShortcutEnabled(ShortcutActionTypes.OPEN_SEARCH, true);
      const enabledShortcut = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(enabledShortcut?.enabled).toBe(true);
    });

    it('should return false when setting enabled on non-existent shortcut', () => {
      const result = service.setShortcutEnabled(ShortcutActionTypes.TOGGLE_SIDEBAR, false);
      expect(result).toBe(false);
    });
  });

  describe('Display Functions', () => {
    it('should format shortcut display correctly', () => {
      const shortcut = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      const display = service.getShortcutDisplay(shortcut!);
      
      expect(display).toBe('Ctrl + k');
    });

    it('should format complex shortcuts correctly', () => {
      service.registerShortcut({
        action: ShortcutActionTypes.TOGGLE_SIDEBAR,
        binding: { key: 's', ctrl: true, alt: true, shift: true },
        description: 'Complex shortcut',
        category: ShortcutCategory.GENERAL,
        context: ShortcutContext.GLOBAL,
        enabled: true
      });

      const shortcut = service.getShortcutByAction(ShortcutActionTypes.TOGGLE_SIDEBAR);
      const display = service.getShortcutDisplay(shortcut!);
      
      expect(display).toBe('Ctrl + Alt + Shift + s');
    });
  });

  describe('Reset and Clear', () => {
    it('should clear all shortcuts', () => {
      service.clearAllShortcuts();
      const shortcuts = service.getAllShortcuts();
      
      expect(shortcuts.length).toBe(0);
    });

    it('should reset to defaults', () => {
      service.clearAllShortcuts();
      expect(service.getAllShortcuts().length).toBe(0);
      
      service.resetToDefaults();
      expect(service.getAllShortcuts().length).toBeGreaterThan(0);
      
      const shortcut = service.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);
      expect(shortcut).toBeDefined();
    });
  });
});

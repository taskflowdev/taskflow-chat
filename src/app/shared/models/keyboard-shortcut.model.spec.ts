import {
  ShortcutActionTypes,
  ShortcutKeyBinding,
  isValidShortcutAction,
  getKeyBindingDisplay,
  areKeyBindingsEqual,
  doesEventMatchBinding
} from './keyboard-shortcut.model';

describe('Keyboard Shortcut Models', () => {
  describe('isValidShortcutAction', () => {
    it('should return true for valid action types', () => {
      expect(isValidShortcutAction('OPEN_SEARCH')).toBe(true);
      expect(isValidShortcutAction('CREATE_GROUP')).toBe(true);
      expect(isValidShortcutAction('SHOW_SHORTCUTS')).toBe(true);
    });

    it('should return false for invalid action types', () => {
      expect(isValidShortcutAction('INVALID_ACTION')).toBe(false);
      expect(isValidShortcutAction('')).toBe(false);
      expect(isValidShortcutAction('random_string')).toBe(false);
    });

    it('should work with all enum values', () => {
      Object.values(ShortcutActionTypes).forEach(action => {
        expect(isValidShortcutAction(action)).toBe(true);
      });
    });
  });

  describe('getKeyBindingDisplay', () => {
    it('should format simple key binding', () => {
      const binding: ShortcutKeyBinding = { key: 'k' };
      expect(getKeyBindingDisplay(binding)).toBe('k');
    });

    it('should format Ctrl + key binding', () => {
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      expect(getKeyBindingDisplay(binding)).toBe('Ctrl + k');
    });

    it('should format Alt + key binding', () => {
      const binding: ShortcutKeyBinding = { key: 'n', alt: true };
      expect(getKeyBindingDisplay(binding)).toBe('Alt + n');
    });

    it('should format Shift + key binding', () => {
      const binding: ShortcutKeyBinding = { key: '?', shift: true };
      expect(getKeyBindingDisplay(binding)).toBe('Shift + ?');
    });

    it('should format Meta + key binding', () => {
      const binding: ShortcutKeyBinding = { key: 's', meta: true };
      expect(getKeyBindingDisplay(binding)).toBe('Meta + s');
    });

    it('should format complex multi-modifier binding', () => {
      const binding: ShortcutKeyBinding = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: true
      };
      expect(getKeyBindingDisplay(binding)).toBe('Ctrl + Alt + Shift + s');
    });

    it('should format all modifiers binding', () => {
      const binding: ShortcutKeyBinding = {
        key: 'k',
        ctrl: true,
        alt: true,
        shift: true,
        meta: true
      };
      expect(getKeyBindingDisplay(binding)).toBe('Ctrl + Alt + Shift + Meta + k');
    });

    it('should format arrow keys correctly', () => {
      expect(getKeyBindingDisplay({ key: 'ArrowUp' })).toBe('Up');
      expect(getKeyBindingDisplay({ key: 'ArrowDown' })).toBe('Down');
      expect(getKeyBindingDisplay({ key: 'ArrowLeft' })).toBe('Left');
      expect(getKeyBindingDisplay({ key: 'ArrowRight' })).toBe('Right');
    });

    it('should format Escape key correctly', () => {
      const binding: ShortcutKeyBinding = { key: 'Escape' };
      expect(getKeyBindingDisplay(binding)).toBe('Esc');
    });

    it('should format Space key correctly', () => {
      const binding: ShortcutKeyBinding = { key: ' ' };
      expect(getKeyBindingDisplay(binding)).toBe('Space');
    });
  });

  describe('areKeyBindingsEqual', () => {
    it('should return true for identical simple bindings', () => {
      const binding1: ShortcutKeyBinding = { key: 'k' };
      const binding2: ShortcutKeyBinding = { key: 'k' };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(true);
    });

    it('should return false for different keys', () => {
      const binding1: ShortcutKeyBinding = { key: 'k' };
      const binding2: ShortcutKeyBinding = { key: 'n' };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(false);
    });

    it('should return true for identical complex bindings', () => {
      const binding1: ShortcutKeyBinding = { key: 'k', ctrl: true, alt: true };
      const binding2: ShortcutKeyBinding = { key: 'k', ctrl: true, alt: true };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(true);
    });

    it('should return false for different modifiers', () => {
      const binding1: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const binding2: ShortcutKeyBinding = { key: 'k', alt: true };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(false);
    });

    it('should treat undefined and false as equal for modifiers', () => {
      const binding1: ShortcutKeyBinding = { key: 'k' };
      const binding2: ShortcutKeyBinding = { key: 'k', ctrl: false };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(true);
    });

    it('should return false if one has modifier and other does not', () => {
      const binding1: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const binding2: ShortcutKeyBinding = { key: 'k' };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(false);
    });

    it('should handle all modifiers correctly', () => {
      const binding1: ShortcutKeyBinding = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: true,
        meta: true
      };
      const binding2: ShortcutKeyBinding = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: true,
        meta: true
      };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(true);
    });

    it('should return false if any modifier is different', () => {
      const binding1: ShortcutKeyBinding = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: true,
        meta: true
      };
      const binding2: ShortcutKeyBinding = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: false,
        meta: true
      };
      expect(areKeyBindingsEqual(binding1, binding2)).toBe(false);
    });
  });

  describe('doesEventMatchBinding', () => {
    it('should match simple key event', () => {
      const binding: ShortcutKeyBinding = { key: 'k' };
      const event = new KeyboardEvent('keydown', { key: 'k' });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should match Ctrl + key event', () => {
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should match Alt + key event', () => {
      const binding: ShortcutKeyBinding = { key: 'n', alt: true };
      const event = new KeyboardEvent('keydown', { key: 'n', altKey: true });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should match Shift + key event', () => {
      const binding: ShortcutKeyBinding = { key: '?', shift: true };
      const event = new KeyboardEvent('keydown', { key: '?', shiftKey: true });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should match Meta + key event', () => {
      const binding: ShortcutKeyBinding = { key: 's', meta: true };
      const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should match complex multi-modifier event', () => {
      const binding: ShortcutKeyBinding = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: true
      };
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: true,
        shiftKey: true
      });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should not match if key is different', () => {
      const binding: ShortcutKeyBinding = { key: 'k' };
      const event = new KeyboardEvent('keydown', { key: 'n' });
      expect(doesEventMatchBinding(event, binding)).toBe(false);
    });

    it('should not match if modifiers are different', () => {
      const binding: ShortcutKeyBinding = { key: 'k', ctrl: true };
      const event = new KeyboardEvent('keydown', { key: 'k' });
      expect(doesEventMatchBinding(event, binding)).toBe(false);
    });

    it('should not match if event has extra modifiers', () => {
      const binding: ShortcutKeyBinding = { key: 'k' };
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      expect(doesEventMatchBinding(event, binding)).toBe(false);
    });

    it('should match arrow key events', () => {
      const binding: ShortcutKeyBinding = { key: 'ArrowUp', alt: true };
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should match Escape key event', () => {
      const binding: ShortcutKeyBinding = { key: 'Escape' };
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should handle all modifiers correctly', () => {
      const binding: ShortcutKeyBinding = {
        key: 'k',
        ctrl: true,
        alt: true,
        shift: true,
        meta: true
      };
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        metaKey: true
      });
      expect(doesEventMatchBinding(event, binding)).toBe(true);
    });

    it('should not match if any modifier is missing', () => {
      const binding: ShortcutKeyBinding = {
        key: 'k',
        ctrl: true,
        alt: true
      };
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      });
      expect(doesEventMatchBinding(event, binding)).toBe(false);
    });
  });
});

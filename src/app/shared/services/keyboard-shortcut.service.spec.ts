import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import { ShortcutRegistryService } from './shortcut-registry.service';
import { ShortcutHandlerService } from './shortcut-handler.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { ShortcutActionTypes, ShortcutContext } from '../models/keyboard-shortcut.model';
import { EffectiveSettingsResponse } from '../../api/models/effective-settings-response';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRegistryService: jasmine.SpyObj<ShortcutRegistryService>;
  let mockHandlerService: jasmine.SpyObj<ShortcutHandlerService>;
  let mockUserSettingsService: jasmine.SpyObj<UserSettingsService>;
  let effectiveSettingsSubject: BehaviorSubject<EffectiveSettingsResponse | null>;

  function createSettingsResponse(
    enableKeyboardShortcuts: boolean | undefined
  ): EffectiveSettingsResponse | null {
    if (enableKeyboardShortcuts === undefined) {
      return null;
    }
    return {
      settings: {
        accessibility: {
          'accessibility.enableKeyboardShortcuts': enableKeyboardShortcuts
        }
      }
    };
  }

  function createSettingsResponseWithSimpleKey(
    enableKeyboardShortcuts: boolean | undefined
  ): EffectiveSettingsResponse | null {
    if (enableKeyboardShortcuts === undefined) {
      return null;
    }
    return {
      settings: {
        accessibility: {
          'enableKeyboardShortcuts': enableKeyboardShortcuts
        }
      }
    };
  }

  beforeEach(() => {
    effectiveSettingsSubject = new BehaviorSubject<EffectiveSettingsResponse | null>(null);

    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    mockAuthService.getCurrentUser.and.returnValue({ id: '123', username: 'testuser' } as any);

    mockRegistryService = jasmine.createSpyObj('ShortcutRegistryService', [
      'findMatchingShortcut',
      'getShortcutsGroupedByCategory'
    ]);
    mockRegistryService.findMatchingShortcut.and.returnValue(undefined);
    mockRegistryService.getShortcutsGroupedByCategory.and.returnValue(new Map());

    mockHandlerService = jasmine.createSpyObj('ShortcutHandlerService', [
      'executeAction',
      'setContext'
    ]);

    mockUserSettingsService = jasmine.createSpyObj('UserSettingsService', [], {
      effectiveSettings$: effectiveSettingsSubject.asObservable()
    });

    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ShortcutRegistryService, useValue: mockRegistryService },
        { provide: ShortcutHandlerService, useValue: mockHandlerService },
        { provide: UserSettingsService, useValue: mockUserSettingsService }
      ]
    });

    service = TestBed.inject(KeyboardShortcutService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Shortcuts Enabled State', () => {
    it('should default to shortcuts enabled', () => {
      expect(service.areShortcutsEnabled()).toBe(true);
    });

    it('should expose shortcutsEnabled$ observable', (done) => {
      service.shortcutsEnabled$.subscribe(enabled => {
        expect(enabled).toBe(true);
        done();
      });
    });

    it('should update enabled state when settings change to disabled', fakeAsync(() => {
      let currentState: boolean | undefined;
      service.shortcutsEnabled$.subscribe(enabled => {
        currentState = enabled;
      });

      // Initially enabled
      expect(currentState).toBe(true);

      // Update settings to disable shortcuts
      effectiveSettingsSubject.next(createSettingsResponse(false));
      tick();

      expect(currentState).toBe(false);
      expect(service.areShortcutsEnabled()).toBe(false);
    }));

    it('should update enabled state when settings change to enabled', fakeAsync(() => {
      let currentState: boolean | undefined;
      service.shortcutsEnabled$.subscribe(enabled => {
        currentState = enabled;
      });

      // Disable first
      effectiveSettingsSubject.next(createSettingsResponse(false));
      tick();
      expect(currentState).toBe(false);

      // Re-enable
      effectiveSettingsSubject.next(createSettingsResponse(true));
      tick();
      expect(currentState).toBe(true);
      expect(service.areShortcutsEnabled()).toBe(true);
    }));

    it('should default to enabled when settings are null', fakeAsync(() => {
      let currentState: boolean | undefined;
      service.shortcutsEnabled$.subscribe(enabled => {
        currentState = enabled;
      });

      effectiveSettingsSubject.next(null);
      tick();

      expect(currentState).toBe(true);
    }));

    it('should default to enabled when accessibility category is missing', fakeAsync(() => {
      let currentState: boolean | undefined;
      service.shortcutsEnabled$.subscribe(enabled => {
        currentState = enabled;
      });

      effectiveSettingsSubject.next({
        settings: {
          appearance: { 'appearance.theme': 'dark' }
        }
      });
      tick();

      expect(currentState).toBe(true);
    }));

    it('should default to enabled when setting key is undefined', fakeAsync(() => {
      let currentState: boolean | undefined;
      service.shortcutsEnabled$.subscribe(enabled => {
        currentState = enabled;
      });

      effectiveSettingsSubject.next({
        settings: {
          accessibility: {
            'accessibility.someOtherSetting': true
          }
        }
      });
      tick();

      expect(currentState).toBe(true);
    }));

    it('should work with simple key format (without category prefix)', fakeAsync(() => {
      let currentState: boolean | undefined;
      service.shortcutsEnabled$.subscribe(enabled => {
        currentState = enabled;
      });

      // Use the simple key format
      effectiveSettingsSubject.next(createSettingsResponseWithSimpleKey(false));
      tick();

      expect(currentState).toBe(false);
      expect(service.areShortcutsEnabled()).toBe(false);
    }));
  });

  describe('Context Management', () => {
    it('should initialize with GLOBAL context', () => {
      expect(service.getContext()).toBe(ShortcutContext.GLOBAL);
    });

    it('should set and get context', () => {
      service.setContext(ShortcutContext.CHAT_VIEW);
      expect(service.getContext()).toBe(ShortcutContext.CHAT_VIEW);
    });

    it('should notify handler service when context changes', () => {
      service.setContext(ShortcutContext.MESSAGE_INPUT);
      expect(mockHandlerService.setContext).toHaveBeenCalledWith(ShortcutContext.MESSAGE_INPUT);
    });
  });

  describe('Legacy Interface', () => {
    it('should expose shortcutTriggered$ observable', () => {
      expect(service.shortcutTriggered$).toBeDefined();
    });

    it('should return empty categories when registry returns empty map', () => {
      mockRegistryService.getShortcutsGroupedByCategory.and.returnValue(new Map());
      const categories = service.getShortcutsByCategory();
      expect(categories).toEqual([]);
    });
  });

  describe('Shortcut Display', () => {
    it('should format simple shortcut', () => {
      const shortcut = {
        key: 'k',
        ctrl: true,
        description: 'Test',
        category: 'Test',
        action: 'test'
      };
      expect(service.getShortcutDisplay(shortcut)).toBe('Ctrl + k');
    });

    it('should format complex shortcut', () => {
      const shortcut = {
        key: 's',
        ctrl: true,
        alt: true,
        shift: true,
        description: 'Test',
        category: 'Test',
        action: 'test'
      };
      expect(service.getShortcutDisplay(shortcut)).toBe('Ctrl + Alt + Shift + s');
    });

    it('should format space key', () => {
      const shortcut = {
        key: ' ',
        ctrl: true,
        description: 'Test',
        category: 'Test',
        action: 'test'
      };
      expect(service.getShortcutDisplay(shortcut)).toBe('Ctrl + Space');
    });

    it('should format arrow key', () => {
      const shortcut = {
        key: 'ArrowUp',
        alt: true,
        description: 'Test',
        category: 'Test',
        action: 'test'
      };
      expect(service.getShortcutDisplay(shortcut)).toBe('Alt + Up');
    });
  });
});

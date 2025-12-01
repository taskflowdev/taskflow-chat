import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortcutRegistryService } from '../../../shared/services/shortcut-registry.service';
import { KeyboardShortcutService } from '../../../shared/services/keyboard-shortcut.service';
import { ShortcutMetadata, ShortcutCategory } from '../../../shared/models/keyboard-shortcut.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslatePipe, I18nService } from '../../../core/i18n';

interface CategoryDisplay {
  name: string;
  shortcuts: ShortcutDisplay[];
}

interface ShortcutDisplay {
  description: string;
  keys: string;
}

@Component({
  selector: 'app-keyboard-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './keyboard-shortcuts-dialog.component.html',
  styleUrl: './keyboard-shortcuts-dialog.component.scss'
})
export class KeyboardShortcutsDialogComponent implements OnInit, OnDestroy {
  categories: CategoryDisplay[] = [];
  shortcutsEnabled = true;
  private shortcutsEnabledSubscription?: Subscription;
  private langSubscription?: Subscription;

  constructor(
    private registryService: ShortcutRegistryService,
    private keyboardShortcutService: KeyboardShortcutService,
    private router: Router,
    private i18n: I18nService
  ) { }

  ngOnInit(): void {
    this.loadShortcuts();
    this.subscribeToShortcutsEnabled();
    
    // Subscribe to language changes to update shortcuts
    this.langSubscription = this.i18n.languageChanged$.subscribe(() => {
      this.loadShortcuts();
    });
  }

  ngOnDestroy(): void {
    this.shortcutsEnabledSubscription?.unsubscribe();
    this.langSubscription?.unsubscribe();
  }

  /**
   * Subscribe to shortcuts enabled state
   */
  private subscribeToShortcutsEnabled(): void {
    this.shortcutsEnabledSubscription = this.keyboardShortcutService.shortcutsEnabled$.subscribe(
      enabled => {
        this.shortcutsEnabled = enabled;
      }
    );
  }

  /**
   * Load shortcuts from registry and format for display with translations
   */
  private loadShortcuts(): void {
    // Define translated categories and shortcuts
    this.categories = [
      {
        name: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.general.title'),
        shortcuts: [
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.general.close-dialog.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.general.close-dialog.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.general.show-shortcuts.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.general.show-shortcuts.shortcut')
          }
        ]
      },
      {
        name: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.title'),
        shortcuts: [
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.focus-search.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.focus-search.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.search-groups.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.search-groups.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.create-new-group.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.create-new-group.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.group-info.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.navigation.group-info.shortcut')
          }
        ]
      },
      {
        name: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.title'),
        shortcuts: [
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.previous-chat.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.previous-chat.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.next-chat.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.next-chat.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.back-to-chat-list.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.chat-navigation.back-to-chat-list.shortcut')
          }
        ]
      },
      {
        name: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.title'),
        shortcuts: [
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.new-message.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.new-message.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.send-message.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.send-message.shortcut')
          },
          {
            description: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.save-changes.title'),
            keys: this.i18n.t('dialogs.keyboard-shortcuts.shortcuts.actions.save-changes.shortcut')
          }
        ]
      }
    ];
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.router.navigate([], {
      fragment: undefined,
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Close dialog when clicking on overlay
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.onClose();
    }
  }
}

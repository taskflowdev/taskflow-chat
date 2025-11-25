import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortcutRegistryService } from '../../../shared/services/shortcut-registry.service';
import { KeyboardShortcutService } from '../../../shared/services/keyboard-shortcut.service';
import { ShortcutMetadata, ShortcutCategory } from '../../../shared/models/keyboard-shortcut.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
  imports: [CommonModule],
  templateUrl: './keyboard-shortcuts-dialog.component.html',
  styleUrl: './keyboard-shortcuts-dialog.component.scss'
})
export class KeyboardShortcutsDialogComponent implements OnInit, OnDestroy {
  categories: CategoryDisplay[] = [];
  shortcutsEnabled = true;
  private shortcutsEnabledSubscription?: Subscription;

  constructor(
    private registryService: ShortcutRegistryService,
    private keyboardShortcutService: KeyboardShortcutService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadShortcuts();
    this.subscribeToShortcutsEnabled();
  }

  ngOnDestroy(): void {
    this.shortcutsEnabledSubscription?.unsubscribe();
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
   * Load shortcuts from registry and format for display
   */
  private loadShortcuts(): void {
    const groupedShortcuts = this.registryService.getShortcutsGroupedByCategory();
    
    this.categories = [];
    groupedShortcuts.forEach((shortcuts, categoryName) => {
      const categoryDisplay: CategoryDisplay = {
        name: categoryName,
        shortcuts: shortcuts.map(shortcut => ({
          description: shortcut.description,
          keys: this.registryService.getShortcutDisplay(shortcut)
        }))
      };
      this.categories.push(categoryDisplay);
    });
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

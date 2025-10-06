import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardShortcutService, ShortcutCategory } from '../../../shared/services/keyboard-shortcut.service';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';

@Component({
  selector: 'app-keyboard-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, CommonButtonComponent],
  templateUrl: './keyboard-shortcuts-dialog.component.html',
  styleUrl: './keyboard-shortcuts-dialog.component.scss'
})
export class KeyboardShortcutsDialogComponent implements OnInit {
  @Output() closeDialog = new EventEmitter<void>();

  categories: ShortcutCategory[] = [];

  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  ngOnInit(): void {
    this.categories = this.keyboardShortcutService.getShortcutsByCategory();
  }

  /**
   * Close dialog on ESC key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onClose();
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.closeDialog.emit();
  }

  /**
   * Close dialog when clicking on overlay
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.onClose();
    }
  }

  /**
   * Get formatted shortcut display string
   */
  getShortcutDisplay(shortcut: any): string {
    return this.keyboardShortcutService.getShortcutDisplay(shortcut);
  }
}

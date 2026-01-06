import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingOption } from '../../../../../app/api/models/setting-option';

@Component({
  selector: 'app-select-control',
  imports: [CommonModule, FormsModule],
  templateUrl: './select-control.component.html',
  styleUrls: ['./select-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectControlComponent {
  @Input() value: any;
  @Input() options: SettingOption[] = [];
  @Input() disabled: boolean = false;
  @Input() label?: string;
  @Output() valueChange = new EventEmitter<any>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownMenu') dropdownMenu?: ElementRef<HTMLDivElement>;

  isOpen = false;
  searchTerm = '';
  focusedIndex = -1;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(private cdr: ChangeDetectorRef) { }

  get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? selected.label! : 'Select an option';
  }

  get selectedIcon(): string | null {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected?.icon || null;
  }

  /**
   * Returns filtered options based on search term
   * Searches across label, aliases from meta, and description
   */
  get filteredOptions(): SettingOption[] {
    if (!this.searchTerm.trim()) {
      return this.options;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();

    return this.options.filter(option => {
      // Search in label (unicode-aware, case-insensitive)
      if (option.label?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in meta.aliases if available
      if (option.meta?.['aliases'] && Array.isArray(option.meta['aliases'])) {
        const aliases = option.meta['aliases'] as string[];
        if (aliases.some(alias => alias.toLowerCase().includes(searchLower))) {
          return true;
        }
      }

      // Search in meta.description if available
      if (option.meta?.['description'] && typeof option.meta['description'] === 'string') {
        if (option.meta['description'].toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Check if there are no results for current search
   */
  get hasNoResults(): boolean {
    return this.searchTerm.trim() !== '' && this.filteredOptions.length === 0;
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        // Auto-focus search input when dropdown opens
        setTimeout(() => {
          this.searchInput?.nativeElement.focus();
          this.focusedIndex = this.findSelectedIndex();
          this.cdr.markForCheck();
        }, 100);
      } else {
        this.resetSearch();
      }
    }
  }

  selectOption(option: SettingOption): void {
    if (!this.disabled) {
      this.valueChange.emit(option.value);
      this.isOpen = false;
      this.resetSearch();
    }
  }

  isSelected(option: SettingOption): boolean {
    return option.value === this.value;
  }

  isFocused(index: number): boolean {
    return index === this.focusedIndex;
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.resetSearch();
  }

  /**
   * Reset search term and focused index
   */
  private resetSearch(): void {
    this.searchTerm = '';
    this.focusedIndex = -1;
    this.cdr.markForCheck();
  }

  /**
   * Find the index of currently selected option in filtered list
   */
  private findSelectedIndex(): number {
    return this.filteredOptions.findIndex(opt => opt.value === this.value);
  }

  /**
   * Handle search input changes with debouncing
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce search for performance (300ms)
    this.debounceTimer = setTimeout(() => {
      this.searchTerm = input.value;
      this.focusedIndex = 0; // Reset focus to first result
      this.cdr.markForCheck();
    }, 300);
  }

  /**
   * Clear the search term and reset filters
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.focusedIndex = 0;
    this.cdr.markForCheck();
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      return;
    }

    const filtered = this.filteredOptions;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, filtered.length - 1);
        this.scrollToFocusedOption();
        this.cdr.markForCheck();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.scrollToFocusedOption();
        this.cdr.markForCheck();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < filtered.length) {
          this.selectOption(filtered[this.focusedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;

      case 'Tab':
        // Allow Tab to close and move focus naturally
        if (this.focusedIndex >= 0 && this.focusedIndex < filtered.length) {
          this.selectOption(filtered[this.focusedIndex]);
        } else {
          this.closeDropdown();
        }
        break;
    }
  }

  /**
   * Scroll to the focused option in the dropdown
   */
  private scrollToFocusedOption(): void {
    setTimeout(() => {
      const optionElements = this.dropdownMenu?.nativeElement.querySelectorAll('.dropdown-item');
      if (optionElements && optionElements[this.focusedIndex]) {
        const element = optionElements[this.focusedIndex] as HTMLElement;
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  /**
   * Handle mouse enter on option to sync keyboard focus
   */
  onOptionMouseEnter(index: number): void {
    this.focusedIndex = index;
    this.cdr.markForCheck();
  }

  /**
   * Prevent dropdown from closing when clicking inside
   */
  onDropdownClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Listen for clicks outside to close dropdown
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.custom-dropdown');
    if (!clickedInside && this.isOpen) {
      this.closeDropdown();
    }
  }
}

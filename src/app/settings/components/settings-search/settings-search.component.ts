import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsSearchService, RecentSearchItem } from '../../services/settings-search.service';

/**
 * Search input component for settings
 * Provides keyboard navigation and accessibility
 */
@Component({
  selector: 'app-settings-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-search.component.html',
  styleUrls: ['./settings-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  searchQuery: string = '';
  resultCount: number = 0;
  isSearchActive: boolean = false;
  recentSearches: RecentSearchItem[] = [];
  showRecentSearches: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsSearchService: SettingsSearchService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to search query changes
    this.settingsSearchService.searchQuery$
      .pipe(takeUntil(this.destroy$))
      .subscribe(query => {
        this.searchQuery = query;
        this.cdr.markForCheck();
      });

    // Subscribe to search results to show count
    this.settingsSearchService.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.resultCount = results.length;
        this.cdr.markForCheck();
      });

    // Subscribe to search active state
    this.settingsSearchService.isSearchActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isActive => {
        this.isSearchActive = isActive;
        this.showRecentSearches = !isActive;
        this.cdr.markForCheck();
      });

    // Subscribe to recent searches
    this.settingsSearchService.recentSearches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(searches => {
        this.recentSearches = searches;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle search input change
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.settingsSearchService.setSearchQuery(input.value);
  }

  /**
   * Handle search input focus - show recent searches if no active search
   */
  onSearchFocus(): void {
    if (!this.isSearchActive && this.recentSearches.length > 0) {
      this.showRecentSearches = true;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle search input blur - hide recent searches after a delay
   */
  onSearchBlur(): void {
    // Delay to allow click on recent search items
    setTimeout(() => {
      this.showRecentSearches = false;
      this.cdr.markForCheck();
    }, 200);
  }

  /**
   * Handle Enter key press to save search
   */
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.searchQuery.trim().length > 0) {
      this.settingsSearchService.performSearch(this.searchQuery);
    }
  }

  /**
   * Use a recent search
   */
  useRecentSearch(query: string): void {
    this.settingsSearchService.useRecentSearch(query);
    this.focusInput();
  }

  /**
   * Clear a specific recent search
   */
  clearRecentSearch(event: Event, query: string): void {
    event.stopPropagation();
    this.settingsSearchService.clearRecentSearch(query);
  }

  /**
   * Clear all recent searches
   */
  clearAllRecentSearches(event: Event): void {
    event.stopPropagation();
    this.settingsSearchService.clearAllRecentSearches();
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.settingsSearchService.clearSearch();
    this.focusInput();
  }

  /**
   * Focus the search input
   */
  focusInput(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * Global keyboard shortcut: / to focus search
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Focus search on '/' key (only if not in an input/textarea)
    if (
      event.key === '/' &&
      !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
    ) {
      event.preventDefault();
      this.focusInput();
    }

    // Clear search on Escape
    if (event.key === 'Escape' && this.isSearchActive) {
      event.preventDefault();
      this.clearSearch();
    }
  }
}

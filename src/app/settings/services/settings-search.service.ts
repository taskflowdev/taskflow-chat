import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { UserSettingsService } from '../../core/services/user-settings.service';
import {
  buildSearchIndex,
  searchSettings,
  SettingsSearchIndexItem,
  SettingsSearchResult
} from '../utils/settings-search-index';

/**
 * Service for searching settings
 * Provides debounced search with memoized index
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsSearchService implements OnDestroy {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchIndexSubject = new BehaviorSubject<SettingsSearchIndexItem[]>([]);
  private searchResultsSubject = new BehaviorSubject<SettingsSearchResult[]>([]);
  private destroy$ = new Subject<void>();

  /** Current search query */
  public searchQuery$: Observable<string> = this.searchQuerySubject.asObservable();

  /** Search results (debounced) */
  public searchResults$: Observable<SettingsSearchResult[]> = this.searchResultsSubject.asObservable();

  /** Whether search is active (has query) */
  public isSearchActive$: Observable<boolean> = this.searchQuery$.pipe(
    map(query => query.trim().length > 0)
  );

  /** Search index (memoized) */
  public searchIndex$: Observable<SettingsSearchIndexItem[]> = this.searchIndexSubject.asObservable();

  private lastCatalogJson: string = '';

  constructor(private userSettingsService: UserSettingsService) {
    this.initializeSearchIndex();
    this.initializeSearchListener();
  }

  /**
   * Initialize search index from catalog
   * Rebuilds index only when catalog changes
   */
  private initializeSearchIndex(): void {
    this.userSettingsService.catalog$
      .pipe(takeUntil(this.destroy$))
      .subscribe(catalog => {
        // Check if catalog actually changed (memoization)
        const catalogJson = JSON.stringify(catalog);
        if (catalogJson !== this.lastCatalogJson) {
          this.lastCatalogJson = catalogJson;
          const index = buildSearchIndex(catalog);
          this.searchIndexSubject.next(index);
        }
      });
  }

  /**
   * Initialize debounced search listener
   */
  private initializeSearchListener(): void {
    combineLatest([
      this.searchQuery$.pipe(
        debounceTime(200), // Debounce input
        distinctUntilChanged() // Only search if query changed
      ),
      this.searchIndex$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([query, index]) => {
        const results = searchSettings(query, index, 20);
        this.searchResultsSubject.next(results);
      });
  }

  /**
   * Set search query
   * Triggers debounced search
   */
  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuerySubject.next('');
  }

  /**
   * Get current search query value
   */
  getCurrentQuery(): string {
    return this.searchQuerySubject.value;
  }

  /**
   * Get current search results value
   */
  getCurrentResults(): SettingsSearchResult[] {
    return this.searchResultsSubject.value;
  }

  /**
   * Check if search is currently active
   */
  isSearchActive(): boolean {
    return this.getCurrentQuery().trim().length > 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

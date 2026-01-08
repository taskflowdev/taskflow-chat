import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
 * Interface for recent search item
 */
export interface RecentSearchItem {
  query: string;
  timestamp: number;
}

/**
 * Service for searching settings
 * Provides debounced search with memoized index and recent searches
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsSearchService implements OnDestroy {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchIndexSubject = new BehaviorSubject<SettingsSearchIndexItem[]>([]);
  private searchResultsSubject = new BehaviorSubject<SettingsSearchResult[]>([]);
  private recentSearchesSubject = new BehaviorSubject<RecentSearchItem[]>([]);
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

  /** Recent searches */
  public recentSearches$: Observable<RecentSearchItem[]> = this.recentSearchesSubject.asObservable();

  private lastCatalogJson: string = '';
  private readonly RECENT_SEARCHES_KEY = 'taskflow_settings_recent_searches';
  private readonly MAX_RECENT_SEARCHES = 5;

  constructor(
    private userSettingsService: UserSettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeSearchIndex();
    this.initializeSearchListener();
    this.loadRecentSearches();
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
   * Perform a search and save it to recent searches
   */
  performSearch(query: string): void {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 0) {
      this.saveRecentSearch(trimmedQuery);
      this.setSearchQuery(trimmedQuery);
    }
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

  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (stored) {
        const searches: RecentSearchItem[] = JSON.parse(stored);
        // Sort by timestamp descending
        searches.sort((a, b) => b.timestamp - a.timestamp);
        this.recentSearchesSubject.next(searches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      this.recentSearchesSubject.next([]);
    }
  }

  /**
   * Save a search query to recent searches
   */
  private saveRecentSearch(query: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!query || query.trim().length === 0) return;

    try {
      const trimmedQuery = query.trim();
      let searches = this.recentSearchesSubject.value;

      // Remove existing entry with same query (case-insensitive)
      searches = searches.filter(item => !this.isSameQuery(item.query, trimmedQuery));

      // Add new entry at the beginning
      searches.unshift({
        query: trimmedQuery,
        timestamp: Date.now()
      });

      // Keep only MAX_RECENT_SEARCHES items
      searches = searches.slice(0, this.MAX_RECENT_SEARCHES);

      // Save to localStorage
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(searches));

      // Update subject
      this.recentSearchesSubject.next(searches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  /**
   * Clear a specific recent search
   */
  clearRecentSearch(query: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      let searches = this.recentSearchesSubject.value;
      // Use case-insensitive comparison to match saveRecentSearch behavior
      searches = searches.filter(item => !this.isSameQuery(item.query, query));
      
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(searches));
      this.recentSearchesSubject.next(searches);
    } catch (error) {
      console.error('Error clearing recent search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  clearAllRecentSearches(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(this.RECENT_SEARCHES_KEY);
      this.recentSearchesSubject.next([]);
    } catch (error) {
      console.error('Error clearing all recent searches:', error);
    }
  }

  /**
   * Use a recent search (set it as current query and save it again to update timestamp)
   */
  useRecentSearch(query: string): void {
    this.saveRecentSearch(query);
    this.setSearchQuery(query);
  }

  /**
   * Check if two queries are the same (case-insensitive)
   */
  private isSameQuery(query1: string, query2: string): boolean {
    return query1.toLowerCase() === query2.toLowerCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

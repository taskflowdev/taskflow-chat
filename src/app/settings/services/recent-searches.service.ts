import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SettingsSearchResult } from '../utils/settings-search-index';

/**
 * Interface for storing recent search items in localStorage
 */
export interface RecentSearchItem {
  id: string;
  key: string;
  categoryKey: string;
  label: string;
  labelI18nKey?: string;
  summary?: string;
  summaryI18nKey?: string;
  description?: string;
  descriptionI18nKey?: string;
  categoryIcon?: string;
  categoryIconSelected?: string;
  categoryIconColor?: string;
  categoryLabel: string;
  categoryI18nKey?: string;
  timestamp: number;
}

/**
 * Service for managing recent searches in localStorage
 * Stores up to 7 most recent search result clicks
 */
@Injectable({
  providedIn: 'root'
})
export class RecentSearchesService {
  private readonly STORAGE_KEY = 'taskflow-settings-recent-searches';
  private readonly MAX_RECENT_SEARCHES = 7;

  private recentSearchesSubject = new BehaviorSubject<RecentSearchItem[]>(this.loadFromStorage());

  /** Observable stream of recent searches */
  public recentSearches$: Observable<RecentSearchItem[]> = this.recentSearchesSubject.asObservable();

  /**
   * Add a search result to recent searches
   * De-duplicates by id and keeps only the latest MAX_RECENT_SEARCHES items
   */
  addRecentSearch(result: SettingsSearchResult): void {
    const recentSearches = this.recentSearchesSubject.value;

    // Remove existing entry with same id if it exists
    const filteredSearches = recentSearches.filter(item => item.id !== result.id);

    // Create new recent search item
    const newItem: RecentSearchItem = {
      id: result.id,
      key: result.key,
      categoryKey: result.categoryKey,
      label: result.label,
      labelI18nKey: result.labelI18nKey,
      summary: result.summary,
      summaryI18nKey: result.summaryI18nKey,
      description: result.description,
      descriptionI18nKey: result.descriptionI18nKey,
      categoryIcon: result.categoryIcon,
      categoryIconSelected: result.categoryIconSelected,
      categoryIconColor: result.categoryIconColor,
      categoryLabel: result.categoryLabel,
      categoryI18nKey: result.categoryI18nKey,
      timestamp: Date.now()
    };

    // Add to beginning (most recent first)
    filteredSearches.unshift(newItem);

    // Keep only MAX_RECENT_SEARCHES items
    const trimmedSearches = filteredSearches.slice(0, this.MAX_RECENT_SEARCHES);

    // Update subject and save to localStorage
    this.recentSearchesSubject.next(trimmedSearches);
    this.saveToStorage(trimmedSearches);
  }

  /**
   * Get all recent searches from localStorage
   * Returns empty array if none exist or if parsing fails
   */
  getRecentSearches(): RecentSearchItem[] {
    return this.recentSearchesSubject.value;
  }

  /**
   * Clear all recent searches from localStorage
   */
  clearRecentSearches(): void {
    this.recentSearchesSubject.next([]);
    this.removeFromStorage();
  }

  /**
   * Remove a specific recent search by id
   */
  removeRecentSearch(id: string): void {
    const recentSearches = this.recentSearchesSubject.value;
    const filteredSearches = recentSearches.filter(item => item.id !== id);
    this.recentSearchesSubject.next(filteredSearches);
    this.saveToStorage(filteredSearches);
  }

  /**
   * Load recent searches from localStorage
   */
  private loadFromStorage(): RecentSearchItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load recent searches:', error);
      return [];
    }
  }

  /**
   * Save recent searches to localStorage
   */
  private saveToStorage(searches: RecentSearchItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }

  /**
   * Remove recent searches from localStorage
   */
  private removeFromStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }
}

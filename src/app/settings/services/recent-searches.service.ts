import { Injectable } from '@angular/core';
import { SettingsSearchResult } from '../utils/settings-search-index';

/**
 * Interface for storing recent search items in localStorage
 */
export interface RecentSearchItem {
  id: string;
  key: string;
  categoryKey: string;
  label: string;
  summary?: string;
  description?: string;
  categoryIcon?: string;
  categoryIconSelected?: string;
  categoryIconColor?: string;
  categoryLabel: string;
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

  /**
   * Add a search result to recent searches
   * De-duplicates by id and keeps only the latest MAX_RECENT_SEARCHES items
   */
  addRecentSearch(result: SettingsSearchResult): void {
    const recentSearches = this.getRecentSearches();
    
    // Remove existing entry with same id if it exists
    const filteredSearches = recentSearches.filter(item => item.id !== result.id);
    
    // Create new recent search item
    const newItem: RecentSearchItem = {
      id: result.id,
      key: result.key,
      categoryKey: result.categoryKey,
      label: result.label,
      summary: result.summary,
      description: result.description,
      categoryIcon: result.categoryIcon,
      categoryIconSelected: result.categoryIconSelected,
      categoryIconColor: result.categoryIconColor,
      categoryLabel: result.categoryLabel,
      timestamp: Date.now()
    };
    
    // Add to beginning (most recent first)
    filteredSearches.unshift(newItem);
    
    // Keep only MAX_RECENT_SEARCHES items
    const trimmedSearches = filteredSearches.slice(0, this.MAX_RECENT_SEARCHES);
    
    // Save to localStorage
    this.saveRecentSearches(trimmedSearches);
  }

  /**
   * Get all recent searches from localStorage
   * Returns empty array if none exist or if parsing fails
   */
  getRecentSearches(): RecentSearchItem[] {
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
   * Clear all recent searches from localStorage
   */
  clearRecentSearches(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }

  /**
   * Remove a specific recent search by id
   */
  removeRecentSearch(id: string): void {
    const recentSearches = this.getRecentSearches();
    const filteredSearches = recentSearches.filter(item => item.id !== id);
    this.saveRecentSearches(filteredSearches);
  }

  /**
   * Save recent searches to localStorage
   */
  private saveRecentSearches(searches: RecentSearchItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }
}

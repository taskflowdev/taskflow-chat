import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { GroupsService } from '../../../api/services/groups.service';
import { GroupDto } from '../../../api/models/group-dto';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonInputComponent } from '../../../shared/components/common-form-controls/common-input.component';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

/**
 * Interface for search result item
 */
export interface SearchResultItem {
  groupId: string;
  name: string;
  description?: string;
  memberCount: number;
  visibility: string;
  avatar?: string;
}

/**
 * Interface for recent search item
 */
export interface RecentSearchItem {
  query: string;
  timestamp: number;
}

/**
 * Group Search Dialog Component
 * Enterprise-level search interface with real-time results, recent searches, and localStorage integration
 */
@Component({
  selector: 'app-group-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonButtonComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './group-search-dialog.component.html',
  styleUrl: './group-search-dialog.component.scss'
})
export class GroupSearchDialogComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Output() dialogClosed = new EventEmitter<void>();
  @Output() groupSelected = new EventEmitter<string>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchForm: FormGroup;
  searchResults: SearchResultItem[] = [];
  recentSearches: RecentSearchItem[] = [];
  isSearching: boolean = false;
  hasSearched: boolean = false;
  showNoResults: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private readonly RECENT_SEARCHES_KEY = 'taskflow_recent_searches';
  private readonly MAX_RECENT_SEARCHES = 5;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private groupsService: GroupsService,
    private toastService: ToastService
  ) {
    this.searchForm = this.fb.group({
      searchQuery: ['']
    });
  }

  ngOnInit(): void {
    this.loadRecentSearches();
    this.setupSearchListener();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the view is fully rendered before focusing
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      // Wait for view update to complete, then focus input
      setTimeout(() => this.focusSearchInput(), 0);
    }
  }

  /** 
   * Focus the search input field
   */
  private focusSearchInput(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * Setup real-time search listener with debouncing
   */
  private setupSearchListener(): void {
    // Listen to search input changes
    this.searchSubscription = this.searchForm.get('searchQuery')?.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value changed
        switchMap(query => {
          const trimmedQuery = query?.trim();
          
          if (!trimmedQuery || trimmedQuery.length < 2) {
            this.searchResults = [];
            this.hasSearched = false;
            this.showNoResults = false;
            this.isSearching = false;
            return of(null);
          }

          this.isSearching = true;
          this.hasSearched = true;
          
          // Call search API
          return this.groupsService.apiGroupsSearchGet$Json({
            search: trimmedQuery,
            page: 1,
            pageSize: 20
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.isSearching = false;
          
          if (response && response.success && response.data) {
            // Parse the data array
            const groups = Array.isArray(response.data.groups) ? response.data.groups : [];
            this.searchResults = groups.map((group: any) => this.mapToSearchResult(group));
            this.showNoResults = this.searchResults.length === 0;
          } else {
            this.searchResults = [];
            this.showNoResults = true;
          }
        },
        error: (error) => {
          this.isSearching = false;
          this.searchResults = [];
          this.showNoResults = true;
          console.error('Search error:', error);
          
          const errorMessage = error?.error?.message || 'Failed to search groups. Please try again.';
          this.toastService.showError(errorMessage, 'Search Error');
        }
      });
  }

  /**
   * Map API response to SearchResultItem
   */
  private mapToSearchResult(group: any): SearchResultItem {
    return {
      groupId: group.groupId || '',
      name: group.name || 'Unnamed Group',
      description: group.description || `${group.memberCount || 0} members`,
      memberCount: group.memberCount || 0,
      visibility: group.visibility || 'Private',
      avatar: group.avatar || undefined
    };
  }

  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (stored) {
        this.recentSearches = JSON.parse(stored);
        // Sort by timestamp descending
        this.recentSearches.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      this.recentSearches = [];
    }
  }

  /**
   * Save a search query to recent searches
   */
  private saveRecentSearch(query: string): void {
    if (!query || query.trim().length < 2) return;

    try {
      const trimmedQuery = query.trim();
      
      // Remove existing entry with same query
      this.recentSearches = this.recentSearches.filter(item => item.query !== trimmedQuery);
      
      // Add new entry at the beginning
      this.recentSearches.unshift({
        query: trimmedQuery,
        timestamp: Date.now()
      });
      
      // Keep only MAX_RECENT_SEARCHES items
      this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  /**
   * Click on a recent search item
   */
  onRecentSearchClick(query: string): void {
    this.searchForm.patchValue({ searchQuery: query });
    this.saveRecentSearch(query);
  }

  /**
   * Click on a search result item
   */
  onResultClick(groupId: string): void {
    const searchQuery = this.searchForm.get('searchQuery')?.value;
    if (searchQuery) {
      this.saveRecentSearch(searchQuery);
    }
    
    this.groupSelected.emit(groupId);
    this.closeDialog();
  }

  /**
   * Handle join group action
   */
  onJoinGroup(event: Event, groupId: string): void {
    event.stopPropagation(); // Prevent result click
    
    // TODO: Implement join group functionality
    // For now, just navigate to the group
    const searchQuery = this.searchForm.get('searchQuery')?.value;
    if (searchQuery) {
      this.saveRecentSearch(searchQuery);
    }
    
    this.toastService.showInfo('Join group functionality coming soon!', 'Info');
    this.groupSelected.emit(groupId);
    this.closeDialog();
  }

  /**
   * Get initials from group name for avatar fallback
   */
  getGroupInitials(name: string): string {
    if (!name) return 'GR';
    
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Close the dialog
   */
  closeDialog(): void {
    this.router.navigate([], {
      fragment: undefined,
      queryParamsHandling: 'preserve',
      replaceUrl: false
    });
    this.dialogClosed.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  /**
   * Handle ESC key press
   */
  onEscapePress(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByGroupId(index: number, item: SearchResultItem): string {
    return item.groupId;
  }

  trackByQuery(index: number, item: RecentSearchItem): string {
    return item.query;
  }

  /**
   * Remove a recent search item
   */
  removeRecentSearch(event: Event, query: string): void {
    event.stopPropagation();

    this.recentSearches = this.recentSearches.filter(item => item.query !== query);
    
    // Update localStorage
    try {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      console.error('Error updating recent searches:', error);
    }
  }
}

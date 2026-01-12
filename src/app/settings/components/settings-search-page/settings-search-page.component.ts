import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsSearchComponent } from '../settings-search/settings-search.component';
import { SettingsSearchResultsComponent } from '../settings-search-results/settings-search-results.component';
import { RecentSearchesComponent } from '../recent-searches/recent-searches.component';
import { SettingsSearchService } from '../../services/settings-search.service';
import { RecentSearchesService } from '../../services/recent-searches.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

/**
 * Dedicated search page component for settings
 * Contains search input and results display
 * Shows recent searches when search is inactive
 */
@Component({
  selector: 'app-settings-search-page',
  imports: [
    CommonModule,
    SettingsSearchComponent,
    SettingsSearchResultsComponent,
    RecentSearchesComponent
  ],
  templateUrl: './settings-search-page.component.html',
  styleUrls: ['./settings-search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchPageComponent implements OnInit, OnDestroy {
  isSearchActive$: Observable<boolean>;
  hasRecentSearches$: Observable<boolean>;
  
  private destroy$ = new Subject<void>();

  constructor(
    private settingsSearchService: SettingsSearchService,
    private recentSearchesService: RecentSearchesService
  ) {
    this.isSearchActive$ = this.settingsSearchService.isSearchActive$;
    this.hasRecentSearches$ = this.recentSearchesService.recentSearches$.pipe(
      map(searches => searches.length > 0)
    );
  }

  ngOnInit(): void {
    // Subscribe to recent searches to ensure reactive updates
    this.recentSearchesService.recentSearches$
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

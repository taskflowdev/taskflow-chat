import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsSearchService } from '../../services/settings-search.service';

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
}

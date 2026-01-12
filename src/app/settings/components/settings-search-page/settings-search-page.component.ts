import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsSearchComponent } from '../settings-search/settings-search.component';
import { SettingsSearchResultsComponent } from '../settings-search-results/settings-search-results.component';
import { SettingsSearchService } from '../../services/settings-search.service';
import { Observable } from 'rxjs';

/**
 * Dedicated search page component for settings
 * Contains search input and results display
 */
@Component({
  selector: 'app-settings-search-page',
  imports: [
    CommonModule,
    SettingsSearchComponent,
    SettingsSearchResultsComponent
  ],
  templateUrl: './settings-search-page.component.html',
  styleUrls: ['./settings-search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchPageComponent {
  isSearchActive$: Observable<boolean>;

  constructor(private settingsSearchService: SettingsSearchService) {
    this.isSearchActive$ = this.settingsSearchService.isSearchActive$;
  }
}

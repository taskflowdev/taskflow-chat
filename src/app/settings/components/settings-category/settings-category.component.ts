import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryWithKeys } from '../../../api/models/category-with-keys';
import { CatalogEntryDto } from '../../../api/models/catalog-entry-dto';
import { SettingsRendererComponent } from '../settings-renderer/settings-renderer.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { I18nService } from '../../../core/i18n';

@Component({
  selector: 'app-settings-category',
  imports: [CommonModule, SettingsRendererComponent, SkeletonLoaderComponent],
  templateUrl: './settings-category.component.html',
  styleUrls: ['./settings-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsCategoryComponent implements OnInit {
  category$!: Observable<CategoryWithKeys | undefined>;
  sortedKeys$!: Observable<CatalogEntryDto[]>;
  loading$: Observable<boolean>;
  catalogLoaded$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private userSettingsService: UserSettingsService,
    private cdr: ChangeDetectorRef,
    private i18n: I18nService
  ) {
    this.loading$ = this.userSettingsService.loading$;
    // Check if catalog has been loaded (catalog$ emits non-null value)
    this.catalogLoaded$ = this.userSettingsService.catalog$.pipe(
      map(catalog => catalog !== null && catalog !== undefined)
    );
  }

  ngOnInit(): void {
    const categoryKey$ = this.route.params.pipe(
      map(params => params['categoryKey'])
    );

    this.category$ = combineLatest([
      categoryKey$,
      this.userSettingsService.catalog$
    ]).pipe(
      map(([key, catalog]) => {
        if (!catalog || !catalog.categories) {
          return undefined;
        }
        return catalog.categories.find(c => c.key === key);
      })
    );

    this.sortedKeys$ = this.category$.pipe(
      map(category => {
        if (!category || !category.keys) {
          return [];
        }
        return [...category.keys].sort((a, b) => {
          const orderA = a.ui?.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.ui?.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      })
    );
  }

  /**
   * Get translated category title
   * Uses translation key: settings.{category-key}.title
   */
  getCategoryTitle(category: CategoryWithKeys): string {
    const key = `settings.${category.key}.title`;
    const translated = this.i18n.t(key);
    return translated !== key ? translated : (category.displayName || category.key || '');
  }

  /**
   * Get translated category description
   * Uses translation key: settings.{category-key}.description
   */
  getCategoryDescription(category: CategoryWithKeys): string {
    const key = `settings.${category.key}.description`;
    const translated = this.i18n.t(key);
    return translated !== key ? translated : (category.description || '');
  }
}

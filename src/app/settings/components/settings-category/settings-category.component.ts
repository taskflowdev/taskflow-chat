import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
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
export class SettingsCategoryComponent implements OnInit, OnDestroy {
  category$!: Observable<CategoryWithKeys | undefined>;
  sortedKeys$!: Observable<CatalogEntryDto[]>;
  loading$: Observable<boolean>;
  catalogLoaded$: Observable<boolean>;

  private destroy$ = new Subject<void>();

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

    // Subscribe to language changes to trigger change detection
    // This ensures translated text updates immediately when language changes
    this.i18n.languageChanged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get translated value using i18n key or fallback
   * @param i18nKey Translation key from API
   * @param fallback Fallback value if translation not found
   * @returns Translated string or fallback
   */
  private getTranslatedValue(i18nKey: string | undefined | null, fallback: string): string {
    if (i18nKey) {
      const translated = this.i18n.t(i18nKey);
      // Only use translation if it's different from the key (meaning it was found)
      if (translated !== i18nKey) {
        return translated;
      }
    }
    return fallback;
  }

  /**
   * Get translated category title
   * Uses i18n key from API if available, falls back to displayName
   */
  getCategoryTitle(category: CategoryWithKeys): string {
    const i18nKey = category.i18n?.fields?.['displayName'];
    return this.getTranslatedValue(i18nKey, category.displayName || category.key || '');
  }

  /**
   * Get translated category description
   * Uses i18n key from API if available, falls back to description
   */
  getCategoryDescription(category: CategoryWithKeys): string {
    const i18nKey = category.i18n?.fields?.['description'];
    return this.getTranslatedValue(i18nKey, category.description || '');
  }
}

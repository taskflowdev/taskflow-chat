import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { Observable, Subject } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';
import { CatalogResponse } from '../../../api/models/catalog-response';
import { CategoryWithKeys } from '../../../api/models/category-with-keys';
import { TranslatePipe, I18nService } from '../../../core/i18n';
import { getUserInitials } from '../../../shared/utils/user.utils';

@Component({
  selector: 'app-settings-sidebar',
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './settings-sidebar.component.html',
  styleUrls: ['./settings-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSidebarComponent implements OnInit, OnDestroy {
  catalog$: Observable<CatalogResponse | null>;
  sortedCategories$: Observable<CategoryWithKeys[]>;
  currentRoute$: Observable<string>;
  currentUser$: Observable<AuthUser | null>;

  private destroy$ = new Subject<void>();

  constructor(
    private userSettingsService: UserSettingsService,
    private authService: AuthService,
    private router: Router,
    private i18n: I18nService,
    private cdr: ChangeDetectorRef
  ) {
    this.catalog$ = this.userSettingsService.catalog$;
    this.currentUser$ = this.authService.currentUser$;

    this.sortedCategories$ = this.catalog$.pipe(
      map(catalog => {
        if (!catalog || !catalog.categories) {
          return [];
        }
        return [...catalog.categories].sort((a, b) => {
          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      })
    );

    this.currentRoute$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const urlSegments = this.router.url.split('/');
        return urlSegments[urlSegments.length - 1] || '';
      })
    );
  }

  ngOnInit(): void {
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
   * Open search dialog
   */
  openSearchDialog(): void {
    this.router.navigate([], {
      fragment: 'search-setting',
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Global keyboard shortcut: / to open search
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Open search on '/' key (only if not in an input/textarea)
    if (
      event.key === '/' &&
      !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
    ) {
      event.preventDefault();
      this.openSearchDialog();
    }
  }

  isActive(categoryKey: string | undefined): boolean {
    if (!categoryKey) return false;
    const urlSegments = this.router.url.split('/');
    const currentCategory = urlSegments[urlSegments.length - 1];
    return currentCategory === categoryKey;
  }

  getIconClass(category: CategoryWithKeys, isActive: boolean): string {
    if (isActive && category.iconSelected) {
      return 'bi-' + category.iconSelected;
    }
    return 'bi-' + (category.icon || 'box');
  }

  /**
   * Get user initials for avatar display
   */
  getUserInitials(user: AuthUser): string {
    return getUserInitials(user);
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
   * Get translated category display name
   * Uses i18n key from API if available, falls back to displayName
   */
  getCategoryName(category: CategoryWithKeys): string {
    const i18nKey = category.i18n?.fields?.['displayName'];
    return this.getTranslatedValue(i18nKey, category.displayName || category.key || '');
  }

  /**
   * Get translated beta label for category
   * Uses i18n key from API if available, falls back to "Beta"
   */
  getCategoryBetaLabel(category: CategoryWithKeys): string | null {
    const i18nKey = category.i18n?.fields?.['beta'];
    if (i18nKey) {
      const translated = this.i18n.t(i18nKey);
      if (translated !== i18nKey) {
        return translated;
      }
    }
    return "Beta";
  }
}

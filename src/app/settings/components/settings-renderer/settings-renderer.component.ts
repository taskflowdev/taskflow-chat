import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { CatalogEntryDto } from '../../../api/models/catalog-entry-dto';
import { ToastService } from '../../../shared/services/toast.service';
import { ToggleControlComponent } from '../controls/toggle-control/toggle-control.component';
import { SelectControlComponent } from '../controls/select-control/select-control.component';
import { RadioControlComponent } from '../controls/radio-control/radio-control.component';
import { Subject, takeUntil } from 'rxjs';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";
import { I18nService } from '../../../core/i18n';
import { SettingOption } from '../../../api/models/setting-option';
import { camelToKebab } from '../../../core/utils/settings.utils';

@Component({
  selector: 'app-settings-renderer',
  imports: [CommonModule, ToggleControlComponent, SelectControlComponent, RadioControlComponent, CommonTooltipDirective],
  templateUrl: './settings-renderer.component.html',
  styleUrls: ['./settings-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsRendererComponent implements OnInit, OnDestroy {
  @Input() categoryKey!: string;
  @Input() settingKey!: CatalogEntryDto;

  currentValue: any;
  isSaving: boolean = false;
  isModified: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private userSettingsService: UserSettingsService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private i18n: I18nService
  ) { }

  ngOnInit(): void {
    this.loadCurrentValue();

    // Subscribe to settings changes to update value
    this.userSettingsService.effectiveSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCurrentValue();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentValue(): void {
    this.currentValue = this.userSettingsService.getSettingValue(
      this.categoryKey,
      this.settingKey.key!
    );

    if (this.currentValue === undefined) {
      this.currentValue = this.settingKey.default;
    }

    this.isModified = this.userSettingsService.isModifiedFromDefault(
      this.categoryKey,
      this.settingKey.key!
    );
  }

  onValueChange(newValue: any): void {
    this.currentValue = newValue;
    this.cdr.markForCheck();

    // Silent auto-save - no UI feedback, just save
    this.userSettingsService.updateSetting(this.categoryKey, this.settingKey.key!, newValue);

    // Update modified state
    this.isModified = this.userSettingsService.isModifiedFromDefault(
      this.categoryKey,
      this.settingKey.key!
    );
    this.cdr.markForCheck();
  }

  onResetToDefault(): void {
    this.userSettingsService.resetToDefault(this.categoryKey, this.settingKey.key!);
    this.loadCurrentValue();
    this.cdr.markForCheck();
  }

  get controlType(): string {
    return this.settingKey.type || 'text';
  }

  get hasOptions(): boolean {
    return !!this.settingKey.options && this.settingKey.options.length > 0;
  }

  getIconClass(): string {
    return this.settingKey.icon || 'box';
  }

  /**
   * Get translated setting label
   * Uses translation key: settings.{category-key}.sections.{setting-key}.title
   */
  getSettingLabel(): string {
    // Extract setting name from full key (e.g., 'appearance.theme' -> 'theme')
    const settingName = this.getSettingName();
    const key = `settings.${this.categoryKey}.sections.${settingName}.title`;
    const translated = this.i18n.t(key);
    return translated !== key ? translated : (this.settingKey.label || this.settingKey.key || '');
  }

  /**
   * Get translated setting description
   * Uses translation key: settings.{category-key}.sections.{setting-key}.description
   */
  getSettingDescription(): string {
    const settingName = this.getSettingName();
    const key = `settings.${this.categoryKey}.sections.${settingName}.description`;
    const translated = this.i18n.t(key);
    return translated !== key ? translated : (this.settingKey.description || '');
  }

  /**
   * Get translated options with translated labels
   * Uses translation key: settings.{category-key}.sections.{setting-key}.options.{option-value}
   */
  getTranslatedOptions(): SettingOption[] {
    if (!this.settingKey.options) {
      return [];
    }

    const settingName = this.getSettingName();
    return this.settingKey.options.map(option => {
      const optionKey = this.normalizeOptionKey(option.value);
      const translationKey = `settings.${this.categoryKey}.sections.${settingName}.options.${optionKey}`;
      const translated = this.i18n.t(translationKey);
      
      // If translation found, use it; otherwise fall back to API-provided label
      // This ensures user-facing text comes from i18n or the API, not internal values
      return {
        ...option,
        label: translated !== translationKey ? translated : (option.label || '')
      };
    });
  }

  /**
   * Extract the setting name from the full key and convert to kebab-case for translation lookup
   * The key format is expected to be '{category}.{setting-name}' (e.g., 'appearance.displayDensity')
   * 
   * Converts camelCase to kebab-case using the shared utility: 'displayDensity' -> 'display-density'
   * 
   * @returns The last segment of the key in kebab-case format
   */
  private getSettingName(): string {
    const fullKey = this.settingKey.key || '';
    if (!fullKey) {
      return '';
    }
    const parts = fullKey.split('.');
    const lastSegment = parts.length > 1 ? parts[parts.length - 1] : fullKey;
    
    // Convert camelCase to kebab-case for translation key lookup
    return camelToKebab(lastSegment);
  }

  /**
   * Normalize option value for use as a translation key segment
   * Converts camelCase option values to kebab-case to match translation keys
   * Examples:
   * - 'syncWithSystem' -> 'sync-with-system'
   * - 'autoplay' -> 'autoplay' (already lowercase)
   * - 'sync-with-system' -> 'sync-with-system' (already kebab-case)
   * 
   * @param value The option value to normalize
   * @returns Normalized value safe for use in translation keys
   */
  private normalizeOptionKey(value: string | undefined): string {
    if (!value) {
      return '';
    }
    // Convert to kebab-case if needed using shared utility
    return camelToKebab(value);
  }
}

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
   * Get translated setting label
   * Uses i18n key from API if available, falls back to label
   */
  getSettingLabel(): string {
    const i18nKey = this.settingKey.i18n?.fields?.['label'];
    return this.getTranslatedValue(i18nKey, this.settingKey.label || this.settingKey.key || '');
  }

  /**
   * Get translated setting description
   * Uses i18n key from API if available, falls back to description
   */
  getSettingDescription(): string {
    const i18nKey = this.settingKey.i18n?.fields?.['description'];
    return this.getTranslatedValue(i18nKey, this.settingKey.description || '');
  }

  /**
   * Get translated options with translated labels
   * Uses i18n keys from API if available, falls back to option labels
   */
  getTranslatedOptions(): SettingOption[] {
    if (!this.settingKey.options) {
      return [];
    }

    return this.settingKey.options.map(option => {
      // Skip i18n lookup if option value is null or undefined
      if (option.value == null) {
        return { ...option };
      }

      // Use i18n key from API response if available
      const optionI18n = this.settingKey.i18n?.options?.[option.value];
      const i18nKey = optionI18n?.fields?.['label'];
      const label = this.getTranslatedValue(i18nKey, option.label ?? '');
      
      return {
        ...option,
        label
      };
    });
  }
}

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
    private cdr: ChangeDetectorRef
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
}

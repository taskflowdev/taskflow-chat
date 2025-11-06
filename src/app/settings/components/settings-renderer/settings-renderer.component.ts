import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { CatalogEntryDto } from '../../../api/models/catalog-entry-dto';
import { ToastService } from '../../../shared/services/toast.service';
import { ToggleControlComponent } from '../controls/toggle-control/toggle-control.component';
import { SelectControlComponent } from '../controls/select-control/select-control.component';
import { RadioControlComponent } from '../controls/radio-control/radio-control.component';

@Component({
  selector: 'app-settings-renderer',
  imports: [CommonModule, ToggleControlComponent, SelectControlComponent, RadioControlComponent],
  templateUrl: './settings-renderer.component.html',
  styleUrls: ['./settings-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsRendererComponent implements OnInit {
  @Input() categoryKey!: string;
  @Input() settingKey!: CatalogEntryDto;

  currentValue: any;
  isSaving: boolean = false;
  isModified: boolean = false;

  constructor(
    private userSettingsService: UserSettingsService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCurrentValue();
    
    // Subscribe to settings changes to update value
    this.userSettingsService.effectiveSettings$.subscribe(() => {
      this.loadCurrentValue();
      this.cdr.markForCheck();
    });
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
    this.isSaving = true;
    this.currentValue = newValue;
    this.cdr.markForCheck();

    this.userSettingsService.updateSetting(this.categoryKey, this.settingKey.key!, newValue);

    // Show save notification after a short delay to match debounce
    setTimeout(() => {
      this.isSaving = false;
      this.isModified = this.userSettingsService.isModifiedFromDefault(
        this.categoryKey,
        this.settingKey.key!
      );
      this.toastService.showSuccess('Setting saved', undefined, true, 2000);
      this.cdr.markForCheck();
    }, 400);
  }

  onResetToDefault(): void {
    this.userSettingsService.resetToDefault(this.categoryKey, this.settingKey.key!);
    this.loadCurrentValue();
    this.toastService.showInfo('Reset to default', undefined, true, 2000);
    this.cdr.markForCheck();
  }

  get controlType(): string {
    return this.settingKey.type || 'text';
  }

  get hasOptions(): boolean {
    return !!this.settingKey.options && this.settingKey.options.length > 0;
  }
}

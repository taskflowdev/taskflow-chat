import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../shared/services/theme.service';
import { DynamicThemeDto, DynamicThemeVariantDto } from '../../api/models';
import { ThemePreviewCardComponent } from '../../shared/components/theme/theme-preview-card.component';

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemePreviewCardComponent],
  template: `
    <div class="theme-settings">
      <div class="section-header">
        <h2>Theme</h2>
        <p class="text-muted">Customize your application appearance</p>
      </div>

      <!-- Sync with System Toggle -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">Sync with system</label>
          <p class="setting-description">Automatically switch between light and dark mode based on your system preferences</p>
        </div>
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            [(ngModel)]="syncWithSystem"
            (change)="onSyncWithSystemChange()">
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Light Theme Section -->
      <div class="theme-section" *ngIf="!syncWithSystem || !isDark">
        <h3>Light Theme</h3>
        <div class="theme-grid">
          <app-theme-preview-card
            *ngFor="let theme of lightThemes"
            [theme]="theme"
            [selectedVariantId]="getLightVariantId(theme.id)"
            [isSelected]="isLightThemeSelected(theme.id)"
            (themeApplied)="onThemeApplied($event, false)"
            (variantChanged)="onVariantChanged($event, theme.id!, false)">
          </app-theme-preview-card>
        </div>
      </div>

      <!-- Dark Theme Section -->
      <div class="theme-section" *ngIf="!syncWithSystem || isDark">
        <h3>Dark Theme</h3>
        <div class="theme-grid">
          <app-theme-preview-card
            *ngFor="let theme of darkThemes"
            [theme]="theme"
            [selectedVariantId]="getDarkVariantId(theme.id)"
            [isSelected]="isDarkThemeSelected(theme.id)"
            (themeApplied)="onThemeApplied($event, true)"
            (variantChanged)="onVariantChanged($event, theme.id!, true)">
          </app-theme-preview-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .theme-settings {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--TextColor, #0f172a);
    }

    .section-header .text-muted {
      color: var(--TextMutedColor, #64748b);
      font-size: 0.875rem;
      margin: 0;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: var(--SecondaryBackgroundColor, #f8fafc);
      border-radius: 12px;
    }

    .setting-info {
      flex: 1;
    }

    .setting-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--TextColor, #0f172a);
      display: block;
      margin-bottom: 0.25rem;
    }

    .setting-description {
      font-size: 0.875rem;
      color: var(--TextMutedColor, #64748b);
      margin: 0;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--SecondaryBackgroundColor, #cbd5e1);
      transition: 0.3s;
      border-radius: 28px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: var(--ButtonPrimary, #22c55e);
    }

    input:checked + .toggle-slider:before {
      transform: translateX(22px);
    }

    .theme-section {
      margin-top: 1rem;
    }

    .theme-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--TextColor, #0f172a);
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .theme-grid {
        grid-template-columns: 1fr;
      }

      .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class ThemeSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  lightThemes: DynamicThemeDto[] = [];
  darkThemes: DynamicThemeDto[] = [];
  syncWithSystem: boolean = false;
  isDark: boolean = false;

  selectedLightThemeId: string | null = null;
  selectedLightVariantId: string | null = null;
  selectedDarkThemeId: string | null = null;
  selectedDarkVariantId: string | null = null;

  // Track temporary variant selections before applying
  tempLightVariants: Map<string, string> = new Map();
  tempDarkVariants: Map<string, string> = new Map();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.themeState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Separate themes by type
        this.lightThemes = state.availableThemes.filter(t => 
          t.themeType?.toLowerCase() === 'light'
        );
        this.darkThemes = state.availableThemes.filter(t => 
          t.themeType?.toLowerCase() === 'dark'
        );

        this.syncWithSystem = state.syncWithSystem;
        this.isDark = state.isDark;

        // Set selected themes from user preference
        if (state.userPreference) {
          this.selectedLightThemeId = state.userPreference.lightThemeId || null;
          this.selectedLightVariantId = state.userPreference.lightVariantId || null;
          this.selectedDarkThemeId = state.userPreference.darkThemeId || null;
          this.selectedDarkVariantId = state.userPreference.darkVariantId || null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSyncWithSystemChange(): void {
    this.themeService.setSyncWithSystem(this.syncWithSystem);
  }

  onThemeApplied(event: { themeId: string, variantId: string }, isDark: boolean): void {
    this.themeService.setTheme(event.themeId, event.variantId, isDark);
  }

  onVariantChanged(variant: DynamicThemeVariantDto, themeId: string, isDark: boolean): void {
    // Store temporary variant selection
    if (isDark) {
      this.tempDarkVariants.set(themeId, variant.id || '');
    } else {
      this.tempLightVariants.set(themeId, variant.id || '');
    }
  }

  isLightThemeSelected(themeId: string | undefined): boolean {
    return themeId === this.selectedLightThemeId;
  }

  isDarkThemeSelected(themeId: string | undefined): boolean {
    return themeId === this.selectedDarkThemeId;
  }

  getLightVariantId(themeId: string | undefined): string | null {
    if (!themeId) return null;
    
    // Return temp selection if exists, otherwise return saved selection
    if (this.tempLightVariants.has(themeId)) {
      return this.tempLightVariants.get(themeId) || null;
    }
    
    if (themeId === this.selectedLightThemeId) {
      return this.selectedLightVariantId;
    }
    
    // Return default variant
    const theme = this.lightThemes.find(t => t.id === themeId);
    const defaultVariant = theme?.variants?.find(v => v.isDefault);
    return defaultVariant?.id || theme?.variants?.[0]?.id || null;
  }

  getDarkVariantId(themeId: string | undefined): string | null {
    if (!themeId) return null;
    
    // Return temp selection if exists, otherwise return saved selection
    if (this.tempDarkVariants.has(themeId)) {
      return this.tempDarkVariants.get(themeId) || null;
    }
    
    if (themeId === this.selectedDarkThemeId) {
      return this.selectedDarkVariantId;
    }
    
    // Return default variant
    const theme = this.darkThemes.find(t => t.id === themeId);
    const defaultVariant = theme?.variants?.find(v => v.isDefault);
    return defaultVariant?.id || theme?.variants?.[0]?.id || null;
  }
}

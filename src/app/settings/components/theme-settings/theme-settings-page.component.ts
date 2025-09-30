import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeManagementService } from '../../../shared/services/theme-management.service';
import { ThemeModeSelectorsComponent } from './theme-mode-selector.component';
import { ThemePreviewCardComponent } from './theme-preview-card.component';
import { CircularColorSelectorComponent } from './circular-color-selector.component';
import { 
  ThemeDto, 
  ThemeAccentDto 
} from '../../../api/models';

@Component({
  selector: 'app-theme-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ThemeModeSelectorsComponent,
    ThemePreviewCardComponent,
    CircularColorSelectorComponent
  ],
  templateUrl: './theme-settings-page.component.html',
  styleUrls: ['./theme-settings-page.component.scss']
})
export class ThemeSettingsPageComponent implements OnInit {
  public readonly themeService = inject(ThemeManagementService);
  
  public hoveredVariantId: string | null = null;
  public isLightHovered = false;
  public isDarkHovered = false;

  ngOnInit(): void {
    // Initialize theme service if not already done
    if (!this.themeService.isInitialized()) {
      this.themeService.lazyInitialize().subscribe();
    }
  }

  get lightThemes(): ThemeDto[] {
    return this.themeService.lightThemes();
  }

  get darkThemes(): ThemeDto[] {
    return this.themeService.darkThemes();
  }

  getLightVariants(): Array<{id: string, name: string, primaryColor: string}> {
    return this.lightThemes.reduce((variants: Array<{id: string, name: string, primaryColor: string}>, theme: ThemeDto) => {
      const themeVariants = (theme.accentVariants || []).map((accent: any) => ({
        id: accent.id || '',
        name: accent.name || '',
        primaryColor: accent.primaryAccentColor || '#007bff'
      }));
      return variants.concat(themeVariants);
    }, []);
  }

  getDarkVariants(): Array<{id: string, name: string, primaryColor: string}> {
    return this.darkThemes.reduce((variants: Array<{id: string, name: string, primaryColor: string}>, theme: ThemeDto) => {
      const themeVariants = (theme.accentVariants || []).map((accent: any) => ({
        id: accent.id || '',
        name: accent.name || '',
        primaryColor: accent.primaryAccentColor || '#375a7f'
      }));
      return variants.concat(themeVariants);
    }, []);
  }

  getLightPreviewVariant(): {id: string, name: string, primaryColor: string} | null {
    if (this.hoveredVariantId && this.isLightHovered) {
      const hoveredVariant = this.getLightVariants()
        .find(v => v.id === this.hoveredVariantId);
      if (hoveredVariant) return hoveredVariant;
    }
    
    const selectedId = this.themeService.userThemePreferences()?.lightAccentId;
    const selectedVariant = this.getLightVariants().find(v => v.id === selectedId);
    return selectedVariant || this.getLightVariants()[0] || null;
  }

  getDarkPreviewVariant(): {id: string, name: string, primaryColor: string} | null {
    if (this.hoveredVariantId && this.isDarkHovered) {
      const hoveredVariant = this.getDarkVariants()
        .find(v => v.id === this.hoveredVariantId);
      if (hoveredVariant) return hoveredVariant;
    }
    
    const selectedId = this.themeService.userThemePreferences()?.darkAccentId;
    const selectedVariant = this.getDarkVariants().find(v => v.id === selectedId);
    return selectedVariant || this.getDarkVariants()[0] || null;
  }

  getCurrentMode(): 'light' | 'dark' | 'system' {
    const prefs = this.themeService.userThemePreferences();
    if (prefs?.syncWithSystem) {
      return 'system';
    }
    return this.themeService.currentEffectiveTheme()?.isDarkTheme ? 'dark' : 'light';
  }

  getSyncWithSystem(): boolean {
    return this.themeService.userThemePreferences()?.syncWithSystem || false;
  }

  onThemeModeChange(mode: 'light' | 'dark' | 'system'): void {
    if (mode === 'system') {
      this.themeService.toggleSystemSync(true).subscribe();
    } else {
      // Switch to specific mode and disable system sync
      this.themeService.toggleSystemSync(false).subscribe();
      // The theme will be determined by the current effective theme
    }
  }

  onSystemSyncToggle(enabled: boolean): void {
    this.themeService.toggleSystemSync(enabled).subscribe();
  }

  onLightVariantSelect(variantId: string): void {
    this.themeService.updateAccent('light', variantId).subscribe();
  }

  onDarkVariantSelect(variantId: string): void {
    this.themeService.updateAccent('dark', variantId).subscribe();
  }

  onVariantHover(variant: {id: string, name: string, primaryColor: string} | null, mode: 'light' | 'dark'): void {
    this.hoveredVariantId = variant?.id || null;
    
    if (mode === 'light') {
      this.isLightHovered = !!variant;
      this.isDarkHovered = false;
    } else {
      this.isDarkHovered = !!variant;
      this.isLightHovered = false;
    }
  }

  getSelectedLightAccentId(): string {
    return this.themeService.userThemePreferences()?.lightAccentId || '';
  }

  getSelectedDarkAccentId(): string {
    return this.themeService.userThemePreferences()?.darkAccentId || '';
  }
}
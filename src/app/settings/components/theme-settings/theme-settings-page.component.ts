import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../shared/services/theme.service';
import { ThemeMode, Theme, ThemeVariant } from '../../../shared/models/theme.models';
import { ThemeModeSelectorsComponent } from './theme-mode-selector.component';
import { ThemePreviewCardComponent } from './theme-preview-card.component';
import { CircularColorSelectorComponent } from './circular-color-selector.component';

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
  public readonly themeService = inject(ThemeService);
  public readonly ThemeMode = ThemeMode;
  
  public hoveredVariantId: string | null = null;
  public isLightHovered = false;
  public isDarkHovered = false;

  ngOnInit(): void {
    this.themeService.loadThemes().subscribe();
  }

  get lightThemes(): Theme[] {
    return this.themeService.availableThemes().filter(t => t.mode === 'light');
  }

  get darkThemes(): Theme[] {
    return this.themeService.availableThemes().filter(t => t.mode === 'dark');
  }

  getLightVariants(): ThemeVariant[] {
    return this.lightThemes.reduce((variants: ThemeVariant[], theme: Theme) => {
      return variants.concat(theme.variants);
    }, []);
  }

  getDarkVariants(): ThemeVariant[] {
    return this.darkThemes.reduce((variants: ThemeVariant[], theme: Theme) => {
      return variants.concat(theme.variants);
    }, []);
  }

  getLightPreviewVariant(): ThemeVariant {
    if (this.hoveredVariantId && this.isLightHovered) {
      const hoveredVariant = this.getLightVariants()
        .find(v => v.id === this.hoveredVariantId);
      if (hoveredVariant) return hoveredVariant;
    }
    
    const selectedId = this.themeService.userPreferences().lightThemeVariantId;
    return this.getLightVariants().find(v => v.id === selectedId) || this.getLightVariants()[0];
  }

  getDarkPreviewVariant(): ThemeVariant {
    if (this.hoveredVariantId && this.isDarkHovered) {
      const hoveredVariant = this.getDarkVariants()
        .find(v => v.id === this.hoveredVariantId);
      if (hoveredVariant) return hoveredVariant;
    }
    
    const selectedId = this.themeService.userPreferences().darkThemeVariantId;
    return this.getDarkVariants().find(v => v.id === selectedId) || this.getDarkVariants()[0];
  }

  onThemeModeChange(mode: ThemeMode): void {
    this.themeService.updateThemeMode(mode).subscribe();
  }

  onSystemSyncToggle(enabled: boolean): void {
    this.themeService.toggleSystemSync(enabled).subscribe();
  }

  onLightVariantSelect(variantId: string): void {
    this.themeService.updateThemeVariant('light', variantId).subscribe();
  }

  onDarkVariantSelect(variantId: string): void {
    this.themeService.updateThemeVariant('dark', variantId).subscribe();
  }

  onVariantHover(variant: ThemeVariant | null, mode: 'light' | 'dark'): void {
    this.hoveredVariantId = variant?.id || null;
    
    if (mode === 'light') {
      this.isLightHovered = !!variant;
      this.isDarkHovered = false;
    } else {
      this.isDarkHovered = !!variant;
      this.isLightHovered = false;
    }
  }
}
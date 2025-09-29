import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../shared/services/theme.service';
import { ThemeMode, Theme, ThemeVariant } from '../../../shared/models/theme.models';
import { ThemeModeSelectorsComponent } from './theme-mode-selector.component';
import { ThemePreviewComponent } from './theme-preview.component';

@Component({
  selector: 'app-theme-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ThemeModeSelectorsComponent,
    ThemePreviewComponent
  ],
  templateUrl: './theme-settings-page.component.html',
  styleUrls: ['./theme-settings-page.component.scss']
})
export class ThemeSettingsPageComponent implements OnInit {
  public readonly themeService = inject(ThemeService);
  public readonly ThemeMode = ThemeMode;
  
  public previewTheme: ThemeVariant | null = null;
  public hoveredVariantId: string | null = null;

  ngOnInit(): void {
    this.themeService.loadThemes().subscribe();
  }

  get lightThemes(): Theme[] {
    return this.themeService.availableThemes().filter(t => t.mode === 'light');
  }

  get darkThemes(): Theme[] {
    return this.themeService.availableThemes().filter(t => t.mode === 'dark');
  }

  getActiveThemeVariants(): ThemeVariant[] {
    const effectiveMode = this.themeService.effectiveThemeMode();
    const themes = effectiveMode === ThemeMode.LIGHT ? this.lightThemes : this.darkThemes;
    
    // Flatten all variants from all themes of the current mode
    return themes.reduce((variants: ThemeVariant[], theme: Theme) => {
      return variants.concat(theme.variants);
    }, []);
  }

  getSelectedVariantId(): string {
    const effectiveMode = this.themeService.effectiveThemeMode();
    const prefs = this.themeService.userPreferences();
    
    return effectiveMode === ThemeMode.LIGHT 
      ? prefs.lightThemeVariantId 
      : prefs.darkThemeVariantId;
  }

  onThemeModeChange(mode: ThemeMode): void {
    this.themeService.updateThemeMode(mode).subscribe();
  }

  onSystemSyncToggle(enabled: boolean): void {
    this.themeService.toggleSystemSync(enabled).subscribe();
  }

  onVariantSelect(variantId: string): void {
    const effectiveMode = this.themeService.effectiveThemeMode();
    const mode = effectiveMode === ThemeMode.LIGHT ? 'light' : 'dark';
    this.themeService.updateThemeVariant(mode, variantId).subscribe();
  }

  onVariantHover(variant: ThemeVariant | null): void {
    this.hoveredVariantId = variant?.id || null;
    this.previewTheme = variant;
  }
}
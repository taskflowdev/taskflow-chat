import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../shared/services/theme.service';
import { ThemeMode, Theme } from '../../../shared/models/theme.models';
import { ThemeModeSelectorsComponent } from './theme-mode-selector.component';
import { ThemePanelComponent } from './theme-panel.component';
import { ThemePreviewComponent } from './theme-preview.component';

@Component({
  selector: 'app-theme-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ThemeModeSelectorsComponent,
    ThemePanelComponent,
    ThemePreviewComponent
  ],
  templateUrl: './theme-settings-page.component.html',
  styleUrls: ['./theme-settings-page.component.scss']
})
export class ThemeSettingsPageComponent implements OnInit {
  public readonly themeService = inject(ThemeService);
  public readonly ThemeMode = ThemeMode;

  ngOnInit(): void {
    this.themeService.loadThemes().subscribe();
  }

  get lightThemes(): Theme[] {
    return this.themeService.availableThemes().filter(t => t.mode === 'light');
  }

  get darkThemes(): Theme[] {
    return this.themeService.availableThemes().filter(t => t.mode === 'dark');
  }

  get isLightModeActive(): boolean {
    return this.themeService.effectiveThemeMode() === ThemeMode.LIGHT;
  }

  get isDarkModeActive(): boolean {
    return this.themeService.effectiveThemeMode() === ThemeMode.DARK;
  }

  onThemeModeChange(mode: ThemeMode): void {
    this.themeService.updateThemeMode(mode).subscribe();
  }

  onSystemSyncToggle(enabled: boolean): void {
    this.themeService.toggleSystemSync(enabled).subscribe();
  }

  onThemeVariantChange(mode: 'light' | 'dark', variantId: string): void {
    this.themeService.updateThemeVariant(mode, variantId).subscribe();
  }
}
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Layout Components
import { SettingsLayoutComponent } from './components/settings-layout/settings-layout.component';

// Theme Components
import { ThemeSettingsPageComponent } from './components/theme-settings-page/theme-settings-page.component';
import { ThemeModeSelector } from './components/theme-mode-selector/theme-mode-selector.component';
import { ThemeSelectorGrid } from './components/theme-selector-grid/theme-selector-grid.component';
import { ThemeCardComponent } from './components/theme-card/theme-card.component';
import { ThemePreviewComponent } from './components/theme-preview/theme-preview.component';

// Shared Components
import { LoadingSkeletonComponent } from './components/shared/loading-skeleton/loading-skeleton.component';

// Services
import { ThemeService } from './services/theme.service';

// Routes
import { SettingsRoutingModule } from './settings-routing.module';

@NgModule({
  declarations: [
    // Layout Components
    SettingsLayoutComponent,
    
    // Theme Components
    ThemeSettingsPageComponent,
    ThemeModeSelector,
    ThemeSelectorGrid,
    ThemeCardComponent,
    ThemePreviewComponent,
    
    // Shared Components
    LoadingSkeletonComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule
  ],
  providers: [
    ThemeService
  ]
})
export class SettingsModule { }
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { ThemeDto, UserThemeDto } from '../../../api/models';

@Component({
  selector: 'app-theme-settings-page',
  templateUrl: './theme-settings-page.component.html',
  styleUrls: ['./theme-settings-page.component.scss']
})
export class ThemeSettingsPageComponent implements OnInit, OnDestroy {
  
  lightThemes: ThemeDto[] = [];
  darkThemes: ThemeDto[] = [];
  userPreferences: UserThemeDto | null = null;
  currentThemeMode: ThemeMode | null = null;
  
  isLoading = true;
  error: string | null = null;
  
  private subscriptions = new Subscription();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.loadThemeData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadThemeData(): void {
    // Combine all data streams
    const combined$ = combineLatest([
      this.themeService.getLightThemes(),
      this.themeService.getDarkThemes(),
      this.themeService.userThemePreferences,
      this.themeService.currentThemeMode$
    ]);

    this.subscriptions.add(
      combined$.subscribe({
        next: ([lightThemes, darkThemes, preferences, themeMode]) => {
          this.lightThemes = lightThemes;
          this.darkThemes = darkThemes;
          this.userPreferences = preferences;
          this.currentThemeMode = themeMode;
          this.isLoading = false;
          this.error = null;
        },
        error: (error) => {
          console.error('Error loading theme data:', error);
          this.error = 'Failed to load theme settings. Please try again.';
          this.isLoading = false;
        }
      })
    );
  }

  onSystemSyncToggle(syncWithSystem: boolean): void {
    if (this.isLoading) return;
    
    this.themeService.toggleSystemSync(syncWithSystem).subscribe({
      next: (updatedPreferences) => {
        // The service will automatically update the observables
        console.log('System sync updated successfully');
      },
      error: (error) => {
        console.error('Failed to update system sync:', error);
        this.error = 'Failed to update sync preference. Please try again.';
      }
    });
  }

  onThemeSelection(themeId: string, isLightTheme: boolean): void {
    if (this.isLoading || !this.userPreferences) return;

    const lightThemeId = isLightTheme ? themeId : this.userPreferences.lightThemeId || '';
    const darkThemeId = isLightTheme ? this.userPreferences.darkThemeId || '' : themeId;

    this.themeService.updateThemePreferences(lightThemeId, darkThemeId).subscribe({
      next: (updatedPreferences) => {
        console.log('Theme preferences updated successfully');
      },
      error: (error) => {
        console.error('Failed to update theme preferences:', error);
        this.error = 'Failed to update theme selection. Please try again.';
      }
    });
  }

  isThemeSelected(theme: ThemeDto): boolean {
    if (!this.userPreferences) return false;
    
    if (theme.isDarkTheme) {
      return this.userPreferences.darkThemeId === theme.id;
    } else {
      return this.userPreferences.lightThemeId === theme.id;
    }
  }

  dismissError(): void {
    this.error = null;
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeDto } from '../../../../api/models/theme-dto';
import { UserThemeDto } from '../../../../api/models/user-theme-dto';
import { AuthService } from '../../../../auth/services/auth.service';
import { ThemeModeSelector } from '../theme-mode-selector/theme-mode-selector.component';
import { ThemePanel } from '../theme-panel/theme-panel.component';

/**
 * Main theme settings page container
 * GitHub-style theme preferences interface
 */
@Component({
  selector: 'app-theme-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeModeSelector, ThemePanel],
  template: `
    <div class="theme-settings">
      <div class="settings-header mb-4">
        <h2 class="settings-title">Theme preferences</h2>
        <p class="settings-description text-muted">
          Choose your preferred theme for light and dark modes. Your selection will be applied across the entire application.
        </p>
      </div>

      <div class="theme-content" *ngIf="!isLoading; else loadingTemplate">
        <!-- Theme Mode Selector -->
        <div class="mb-4">
          <app-theme-mode-selector
            [currentPreferences]="userThemePreferences"
            (syncWithSystemChange)="onSyncWithSystemChange($event)">
          </app-theme-mode-selector>
        </div>

        <!-- Theme Panels Container -->
        <div class="theme-panels row g-4">
          <!-- Light Theme Panel -->
          <div class="col-lg-6">
            <app-theme-panel
              themeMode="light"
              [themes]="lightThemes"
              [selectedThemeId]="userThemePreferences?.lightThemeId"
              [isActive]="getActivePanelMode() === 'light'"
              (themeSelect)="onThemeSelect('light', $event)">
            </app-theme-panel>
          </div>

          <!-- Dark Theme Panel -->
          <div class="col-lg-6">
            <app-theme-panel
              themeMode="dark"
              [themes]="darkThemes"
              [selectedThemeId]="userThemePreferences?.darkThemeId"
              [isActive]="getActivePanelMode() === 'dark'"
              (themeSelect)="onThemeSelect('dark', $event)">
            </app-theme-panel>
          </div>
        </div>

        <!-- Current Selection Info -->
        <div class="mt-4 current-selection" *ngIf="currentTheme">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Currently active:</strong> {{ currentTheme.name }}
            <span class="ms-2 badge" 
                  [class.bg-primary]="!currentTheme.isDarkTheme"
                  [class.bg-dark]="currentTheme.isDarkTheme">
              {{ currentTheme.isDarkTheme ? 'Dark' : 'Light' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading Template -->
      <ng-template #loadingTemplate>
        <div class="loading-container d-flex justify-content-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading themes...</span>
          </div>
        </div>
      </ng-template>

      <!-- Error Template -->
      <div class="alert alert-danger" *ngIf="errorMessage">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button class="btn btn-sm btn-outline-danger ms-3" (click)="retry()">
          Retry
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./theme-settings-page.component.scss']
})
export class ThemeSettingsPageComponent implements OnInit, OnDestroy {
  themeForm: FormGroup;
  availableThemes: ThemeDto[] = [];
  userThemePreferences: UserThemeDto | null = null;
  currentTheme: ThemeDto | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private themeService: ThemeService,
    private authService: AuthService
  ) {
    this.themeForm = this.fb.group({
      syncWithSystem: [false]
    });
  }

  ngOnInit(): void {
    this.initializeThemeSettings();
    this.subscribeToThemeChanges();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get lightThemes(): ThemeDto[] {
    return this.availableThemes.filter(theme => !theme.isDarkTheme);
  }

  get darkThemes(): ThemeDto[] {
    return this.availableThemes.filter(theme => theme.isDarkTheme);
  }

  /**
   * Get which panel should be highlighted as active
   */
  getActivePanelMode(): 'light' | 'dark' | null {
    if (!this.currentTheme) return null;
    return this.currentTheme.isDarkTheme ? 'dark' : 'light';
  }

  /**
   * Handle theme selection from panels
   */
  async onThemeSelect(mode: 'light' | 'dark', themeId: string): Promise<void> {
    if (!this.userThemePreferences) return;

    try {
      const lightThemeId = mode === 'light' ? themeId : this.userThemePreferences.lightThemeId || '';
      const darkThemeId = mode === 'dark' ? themeId : this.userThemePreferences.darkThemeId || '';

      await this.themeService.setUserThemePreferences(lightThemeId, darkThemeId);
      this.errorMessage = null;
    } catch (error) {
      this.errorMessage = 'Failed to update theme preferences. Please try again.';
      console.error('Theme update error:', error);
    }
  }

  /**
   * Handle system sync preference change
   */
  async onSyncWithSystemChange(syncWithSystem: boolean): Promise<void> {
    try {
      await this.themeService.updateSystemSync(syncWithSystem);
      this.errorMessage = null;
    } catch (error) {
      this.errorMessage = 'Failed to update sync preference. Please try again.';
      console.error('Sync preference update error:', error);
    }
  }

  /**
   * Retry initialization on error
   */
  async retry(): Promise<void> {
    this.errorMessage = null;
    await this.initializeThemeSettings();
  }

  private async initializeThemeSettings(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      await this.themeService.initialize(currentUser.id);
    } catch (error) {
      this.errorMessage = 'Failed to load theme settings. Please refresh the page.';
      console.error('Theme initialization error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private subscribeToThemeChanges(): void {
    this.subscription.add(
      this.themeService.getThemeContext().subscribe(themeContext => {
        this.availableThemes = themeContext.availableThemes;
        this.userThemePreferences = themeContext.userThemePreferences;
        this.currentTheme = themeContext.currentTheme;
        this.isLoading = themeContext.isLoading;
        
        if (themeContext.error) {
          this.errorMessage = themeContext.error;
        }

        // Update form with current preferences
        if (this.userThemePreferences) {
          this.themeForm.patchValue({
            syncWithSystem: this.userThemePreferences.syncWithSystem || false
          }, { emitEvent: false });
        }
      })
    );
  }
}
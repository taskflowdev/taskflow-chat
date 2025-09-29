import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserThemeDto } from '../../../../api/models/user-theme-dto';

export interface ThemeMode {
  value: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: string;
}

/**
 * Theme mode selector component
 * Allows users to choose light, dark, or system sync
 */
@Component({
  selector: 'app-theme-mode-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="theme-mode-selector">
      <h4 class="selector-title">
        <i class="bi bi-brightness-high-fill me-2"></i>
        Theme mode
      </h4>
      <p class="selector-description text-muted">
        Choose how themes are applied to your interface.
      </p>

      <div class="mode-options">
        <div class="form-check form-check-custom" 
             *ngFor="let mode of themeModes; trackBy: trackByValue">
          <input 
            class="form-check-input" 
            type="radio" 
            [id]="'mode-' + mode.value"
            [value]="mode.value" 
            [formControl]="selectedModeControl"
            (change)="onModeChange(mode.value)">
          <label class="form-check-label" [for]="'mode-' + mode.value">
            <div class="mode-option">
              <div class="mode-header">
                <i class="bi me-2" [ngClass]="mode.icon"></i>
                <strong>{{ mode.label }}</strong>
              </div>
              <div class="mode-description">
                {{ mode.description }}
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- System Info -->
      <div class="system-info mt-3" *ngIf="selectedModeControl.value === 'system'">
        <div class="alert alert-light">
          <i class="bi bi-info-circle me-2"></i>
          <small>
            Your system is currently set to 
            <strong>{{ isSystemDarkMode ? 'dark' : 'light' }}</strong> mode.
            The theme will automatically switch when you change your system preferences.
          </small>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./theme-mode-selector.component.scss']
})
export class ThemeModeSelector {
  @Input() currentPreferences: UserThemeDto | null = null;
  @Output() syncWithSystemChange = new EventEmitter<boolean>();

  selectedModeControl = new FormControl<'light' | 'dark' | 'system'>('light');

  themeModes: ThemeMode[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Always use light theme',
      icon: 'bi-sun-fill'
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Always use dark theme',
      icon: 'bi-moon-fill'
    },
    {
      value: 'system',
      label: 'Sync with system',
      description: 'Automatically switch between light and dark based on your system settings',
      icon: 'bi-circle-half'
    }
  ];

  isSystemDarkMode = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Listen for system theme changes (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      this.isSystemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.isSystemDarkMode = e.matches;
      });
    }
  }

  ngOnInit(): void {
    this.updateSelectedMode();
  }

  ngOnChanges(): void {
    this.updateSelectedMode();
  }

  onModeChange(mode: 'light' | 'dark' | 'system'): void {
    this.selectedModeControl.setValue(mode);
    
    if (mode === 'system') {
      this.syncWithSystemChange.emit(true);
    } else {
      this.syncWithSystemChange.emit(false);
    }
  }

  trackByValue(index: number, mode: ThemeMode): string {
    return mode.value;
  }

  private updateSelectedMode(): void {
    if (!this.currentPreferences) return;

    const mode = this.currentPreferences.syncWithSystem ? 'system' : 'light';
    this.selectedModeControl.setValue(mode, { emitEvent: false });
  }
}
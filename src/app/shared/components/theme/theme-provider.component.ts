import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-theme-provider',
  template: '',
  standalone: true
})
export class ThemeProviderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Load available themes
    this.themeService.loadAvailableThemes().subscribe();

    // Watch for authentication changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          // User logged in, load their theme preference
          this.themeService.loadUserPreference().subscribe();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

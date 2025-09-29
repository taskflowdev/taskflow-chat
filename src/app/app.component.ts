import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { AuthService } from './auth/services/auth.service';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'taskflow-chat';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Initialize themes when user authentication changes
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user?.id) {
          this.themeService.initialize(user.id).catch(error => {
            console.error('Failed to initialize themes:', error);
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

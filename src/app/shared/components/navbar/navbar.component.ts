import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { NavLinksComponent, NavLink } from './components/nav-links/nav-links.component';
import { UserDropdownComponent, DropdownItem } from './components/user-dropdown/user-dropdown.component';
import { I18nService } from '../../../core/i18n';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavLinksComponent,
    UserDropdownComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  private userSubscription: Subscription | null = null;
  private langSubscription: Subscription | null = null;

  @Output() showKeyboardShortcuts = new EventEmitter<void>();

  // Configuration for nav links - will be updated with translations
  navLinks: NavLink[] = [];

  // Configuration for user dropdown - will be updated with translations
  userDropdownItems: DropdownItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private i18n: I18nService
  ) {
    this.updateTranslations();
  }

  private updateTranslations(): void {
    this.navLinks = [
      {
        path: '/chats',
        label: this.i18n.t('navbar.chats'),
        icon: 'bi-chat-quote',
        activeIcon: 'bi-chat-quote-fill',
        title: this.i18n.t('navbar.chats')
      },
      {
        path: '/settings',
        label: this.i18n.t('navbar.settings'),
        icon: 'bi-gear',
        activeIcon: 'bi-gear-fill',
        title: this.i18n.t('navbar.settings')
      }
    ];

    this.userDropdownItems = [
      {
        label: this.i18n.t('navbar.account-manager.item-profile'),
        icon: 'bi-person',
        href: '#'
      },
      {
        label: this.i18n.t('navbar.account-manager.item-keyboard-shortcuts.title'),
        icon: 'bi-keyboard',
        action: 'keyboard-shortcuts',
        shortcutKey: this.i18n.t('navbar.account-manager.item-keyboard-shortcuts.shortcut')
      },
      {
        divider: true,
        label: '',
        icon: ''
      },
      {
        label: this.i18n.t('navbar.account-manager.item-logout'),
        icon: 'bi-box-arrow-right',
        action: 'logout'
      }
    ];
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => this.user = user
    );

    // Subscribe to language changes to update translations
    this.langSubscription = this.i18n.languageChanged$.subscribe(() => {
      this.updateTranslations();
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  /**
   * Handle user dropdown item clicks
   */
  onDropdownItemClick(item: DropdownItem): void {
    switch (item.action) {
      case 'logout':
        this.onLogout();
        break;
      case 'keyboard-shortcuts':
        this.showKeyboardShortcuts.emit();
        break;
      default:
        // Handle other actions as needed
        break;
    }
  }

  /**
   * Handle user logout
   */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }

  /**
   * Check if current route is active (legacy method, kept for compatibility)
   */
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }
}

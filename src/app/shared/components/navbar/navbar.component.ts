import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { NavLinksComponent, NavLink } from './components/nav-links/nav-links.component';
import { UserDropdownComponent, DropdownItem } from './components/user-dropdown/user-dropdown.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavLinksComponent,
    UserDropdownComponent,
    TranslocoModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  private userSubscription: Subscription | null = null;
  private langSubscription: Subscription | null = null;

  @Output() showKeyboardShortcuts = new EventEmitter<void>();

  // Configuration for nav links
  navLinks: NavLink[] = [];

  // Configuration for user dropdown
  userDropdownItems: DropdownItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private translocoService: TranslocoService
  ) { }

  ngOnInit(): void {
    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => this.user = user
    );

    // Initialize nav items with translations
    this.updateNavItems();

    // Subscribe to language changes to update nav items
    this.langSubscription = this.translocoService.langChanges$.subscribe(() => {
      this.updateNavItems();
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
   * Update navigation items with current translations
   */
  private updateNavItems(): void {
    this.navLinks = [
      {
        path: '/chats',
        label: this.translocoService.translate('navbar.chats'),
        icon: 'bi-chat-quote',
        activeIcon: 'bi-chat-quote-fill',
        title: this.translocoService.translate('navbar.chats')
      },
      {
        path: '/settings',
        label: this.translocoService.translate('navbar.settings'),
        icon: 'bi-gear',
        activeIcon: 'bi-gear-fill',
        title: this.translocoService.translate('navbar.settings')
      }
    ];

    this.userDropdownItems = [
      {
        label: this.translocoService.translate('navbar.profile'),
        icon: 'bi-person',
        href: '#'
      },
      {
        label: 'Keyboard Shortcuts',
        icon: 'bi-keyboard',
        action: 'keyboard-shortcuts',
        shortcutKey: 'Shift + ?'
      },
      {
        divider: true,
        label: '',
        icon: ''
      },
      {
        label: this.translocoService.translate('navbar.logout'),
        icon: 'bi-box-arrow-right',
        action: 'logout'
      }
    ];
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
    this.router.navigate(['/auth/login']);
  }

  /**
   * Check if current route is active (legacy method, kept for compatibility)
   */
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }
}

import { Component, Input, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupsService } from '../../../api/services/groups.service';
import { PresenceDto } from '../../../api/models/presence-dto';
import { PresenceDtoIEnumerableApiResponse } from '../../../api/models/presence-dto-i-enumerable-api-response';
import { AuthService } from '../../../auth/services/auth.service';
import { interval, Subscription, Observable, Subject } from 'rxjs';
import { switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-presence-avatars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presence-avatars.component.html',
  styleUrls: ['./presence-avatars.component.scss']
})
export class PresenceAvatarsComponent implements OnInit, OnDestroy {
  @Input() groupId: string | null = null;
  @Input() maxVisible: number = 5; // Maximum number of avatars to show before showing "+N"

  presenceList: PresenceDto[] = [];
  showDropdown = false;
  hoveredUser: PresenceDto | null = null;
  profileCardPosition = { top: 0, left: 0 };

  private presenceSubscription?: Subscription;
  private refreshInterval = 10000; // 10 seconds
  private destroy$ = new Subject<void>();
  private dropdownCloseTimeout: NodeJS.Timeout | null = null;

  private readonly PROFILE_CARD_WIDTH = 280; // Must match CSS .profile-hover-card width

  constructor(
    private groupsService: GroupsService,
    private authService: AuthService,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    if (this.groupId) {
      this.loadPresence();
      this.startPresenceRefresh();
    }
  }

  ngOnDestroy(): void {
    this.presenceSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.showDropdown = false;
      this.hoveredUser = null;
    }
  }

  private loadPresence(): void {
    this.fetchPresence()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.presenceList = response.data || [];
      });
  }

  private startPresenceRefresh(): void {
    this.presenceSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchPresence()),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        this.presenceList = response.data || [];
      });
  }

  private fetchPresence(): Observable<PresenceDtoIEnumerableApiResponse> {
    if (!this.groupId) {
      return of({ data: [] });
    }

    return this.groupsService.apiGroupsIdPresenceGet$Json({ id: this.groupId })
      .pipe(
        catchError(error => {
          console.error('Error loading presence:', error);
          return of({ data: [] });
        })
      );
  }

  /**
   * Get the initials from a user's name
   */
  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Get only online members (explicitly online, not null or false)
   */
  get onlineMembers(): PresenceDto[] {
    return this.presenceList.filter(p => p.isOnline === true);
  }

  /**
   * Get only offline members (explicitly offline, not null)
   */
  get offlineMembers(): PresenceDto[] {
    return this.presenceList.filter(p => p.isOnline === false);
  }

  /**
   * Get all members sorted by online status first
   */
  get allMembers(): PresenceDto[] {
    return [...this.onlineMembers, ...this.offlineMembers];
  }

  /**
   * Get current logged-in user
   */
  get currentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   * Get all members excluding current user
   */
  get filteredAllMembers(): PresenceDto[] {
    const currentUser = this.currentUser;
    if (!currentUser) {
      return this.allMembers;
    }
    return this.allMembers.filter((member: PresenceDto) =>
      member.userId !== currentUser.id && member.userName !== currentUser.userName
    );
  }

  /**
   * Get online members excluding current user
   */
  get filteredOnlineMembers(): PresenceDto[] {
    const currentUser = this.currentUser;
    if (!currentUser) {
      return this.onlineMembers;
    }
    return this.onlineMembers.filter((member: PresenceDto) =>
      member.userId !== currentUser.id && member.userName !== currentUser.userName
    );
  }

  /**
   * Get offline members excluding current user
   */
  get filteredOfflineMembers(): PresenceDto[] {
    const currentUser = this.currentUser;
    if (!currentUser) {
      return this.offlineMembers;
    }
    return this.offlineMembers.filter((member: PresenceDto) =>
      member.userId !== currentUser.id && member.userName !== currentUser.userName
    );
  }

  /**
   * Get total count excluding current user
   */
  get filteredTotalCount(): number {
    return this.filteredAllMembers.length;
  }

  /**
   * Get online count excluding current user
   */
  get filteredOnlineCount(): number {
    return this.filteredOnlineMembers.length;
  }

  /**
   * Get offline count excluding current user
   */
  get filteredOfflineCount(): number {
    return this.filteredOfflineMembers.length;
  }

  /**
   * Get the list of online members to display (limited by maxVisible, excluding current user)
   */
  get visibleMembers(): PresenceDto[] {
    return this.filteredOnlineMembers.slice(0, this.maxVisible);
  }

  /**
   * Get the count of remaining online members not displayed
   */
  get remainingCount(): number {
    return Math.max(0, this.filteredOnlineMembers.length - this.maxVisible);
  }

  /**
   * Get online members count
   */
  get onlineCount(): number {
    return this.onlineMembers.length;
  }

  /**
   * Get offline members count
   */
  get offlineCount(): number {
    return this.offlineMembers.length;
  }

  /**
   * Get total members count
   */
  get totalCount(): number {
    return this.presenceList.length;
  }

  /**
   * Toggle dropdown visibility
   */
  onAvatarStackHover(): void {
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
    this.showDropdown = true;
  }

  onAvatarStackLeave(): void {
    this.dropdownCloseTimeout = setTimeout(() => {
      this.showDropdown = false;
    }, 300);
  }

  onDropdownEnter(): void {
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
  }

  onDropdownLeave(): void {
    this.showDropdown = false;
  }

  /**
   * Show profile card on avatar hover
   */
  onAvatarHover(event: MouseEvent, member: PresenceDto): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Position card to the left of the avatar
    this.profileCardPosition = {
      top: rect.top + window.scrollY,
      left: rect.left - this.PROFILE_CARD_WIDTH - 10 // Card width + spacing
    };

    this.hoveredUser = member;
  }

  onAvatarLeave(): void {
    this.hoveredUser = null;
  }

  /**
   * Get user email from presence data
   */
  getUserEmail(member: PresenceDto): string {
    return member.email || member.userName || 'No email available';
  }

  /**
   * Get user full name or fallback to username
   */
  getUserFullName(member: PresenceDto): string {
    return member.fullName || member.userName || 'Unknown User';
  }

  /**
   * Get formatted last seen text
   */
  getLastSeenText(member: PresenceDto): string {
    if (!member.lastSeen || member.isOnline === true) {
      return '';
    }

    const lastSeenDate = new Date(member.lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) {
      return 'Last seen just now';
    } else if (diffMinutes < 60) {
      return `Last seen ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `Last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return `Last seen on ${lastSeenDate.toLocaleDateString()}`;
    }
  }

  /**
   * Get presence status text (online/offline/hidden)
   */
  getPresenceStatus(member: PresenceDto): string {
    if (member.isOnline === true) {
      return 'Online';
    } else if (member.isOnline === false) {
      return 'Offline';
    }
    // null means user has disabled status sharing
    return 'Status hidden';
  }

  /**
   * Get presence status class for styling
   */
  getPresenceStatusClass(member: PresenceDto): string {
    if (member.isOnline === true) {
      return 'online';
    } else if (member.isOnline === false) {
      return 'offline';
    }
    // null means user has disabled status sharing
    return 'hidden';
  }

  /**
   * Get tooltip text for a member
   */
  getMemberTooltip(member: PresenceDto): string {
    const status = member.isOnline ? 'Online' : 'Offline';
    return `${member.userName} - ${status}`;
  }
}

import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User, Notification } from '../../shared/models/hrms.models';

import { HrDataService } from '../../services/hr-data.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();
  @Input() sidebarCollapsed = false;
  @Input() mobileSidebarOpen = false;

  currentUser: User | null = null;
  searchQuery = '';
  searchExpanded = false;
  showNotifications = false;
  showUserMenu = false;
  private destroy$ = new Subject<void>();

  notifications: Notification[] = [];

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  constructor(
    private auth: AuthService, 
    private router: Router,
    private hr: HrDataService
  ) {}

  ngOnInit(): void {
    this.auth.auth$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(authState => {
      this.currentUser = authState.user;
      if (authState.isAuthenticated) {
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    this.hr.getNotifications().subscribe({
      next: (notifs) => this.notifications = notifs,
      error: () => console.error('Failed to load notifications')
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  toggleSearch(): void {
    this.searchExpanded = !this.searchExpanded;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery = value;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  markAllRead(): void {
    this.hr.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
      }
    });
  }

  navigateTo(link?: string, notifId?: string): void {
    this.showNotifications = false;
    if (notifId) {
      this.hr.markNotificationRead(notifId).subscribe();
    }
    if (link) this.router.navigate([link]);
  }

  get userInitials(): string {
    if (!this.currentUser) return 'U';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`;
  }

  closeDropdowns(): void {
    this.showNotifications = false;
    this.showUserMenu = false;
  }

  get hamburgerIcon(): string {
    if (this.mobileSidebarOpen) return 'close';
    return 'menu';
  }
}


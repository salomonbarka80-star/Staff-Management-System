import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../shared/models/hrms.models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() collapseToggle = new EventEmitter<boolean>();
  @Output() mobileClose = new EventEmitter<void>();

  currentUser: User | null = null;
  activeRoute = '';
  private destroy$ = new Subject<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'dashboard',       route: '/app/dashboard' },
    { label: 'Directory',   icon: 'group',            route: '/app/employees' },
    { label: 'Departments', icon: 'corporate_fare',   route: '/app/departments' },
    { label: 'Recruitment', icon: 'work',             route: '/app/recruitment', badge: 12 },
    { label: 'Attendance',  icon: 'event_available',  route: '/app/attendance' },
    { label: 'Payroll',     icon: 'payments',         route: '/app/payroll' },
    { label: 'Reports',     icon: 'bar_chart',        route: '/app/reports' },
    { label: 'Settings',    icon: 'settings',         route: '/app/settings' },
  ];

  bottomItems: NavItem[] = [
    { label: 'Support', icon: 'contact_support', route: '/app/support' },
  ];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.auth$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(authState => {
      this.currentUser = authState.user;
    });

    this.activeRoute = this.router.url;

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: NavigationEnd) => {
        this.activeRoute = e.urlAfterRedirects;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    if (this.mobileOpen) {
      this.mobileClose.emit();
    }
  }

  logout(): void {
    this.auth.logout();
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapseToggle.emit(this.collapsed);
  }

  get userInitials(): string {
    if (!this.currentUser) return 'U';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }
}


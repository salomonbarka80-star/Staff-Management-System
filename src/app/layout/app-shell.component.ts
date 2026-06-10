import { Component, HostListener, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-shell',
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed" [class.mobile-sidebar-open]="mobileSidebarOpen">
      <div class="sidebar-overlay" *ngIf="mobileSidebarOpen" (click)="closeMobileSidebar()"></div>
      <app-sidebar
        [collapsed]="!mobileSidebarOpen && sidebarCollapsed"
        [mobileOpen]="mobileSidebarOpen"
        (collapseToggle)="onCollapseToggle($event)"
        (mobileClose)="closeMobileSidebar()">
      </app-sidebar>
      <div class="app-main">
        <app-topbar (menuToggle)="toggleSidebar()" [sidebarCollapsed]="sidebarCollapsed" [mobileSidebarOpen]="mobileSidebarOpen"></app-topbar>
        <main class="app-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      min-height: 100vh;
    }
    .app-main {
      flex: 1;
      margin-left: 280px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left 0.25s ease;
      min-width: 0;
    }
    .app-shell.sidebar-collapsed .app-main {
      margin-left: 72px;
    }
    .app-content {
      flex: 1;
      padding: 32px;
      background-color: var(--color-background);
      max-width: 1440px;
      width: 100%;
      box-sizing: border-box;
    }
    .sidebar-overlay {
      display: none;
    }
    @media (max-width: 1024px) {
      .app-main { margin-left: 0 !important; }
      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 99;
        backdrop-filter: blur(2px);
        animation: fadeIn 0.2s ease;
      }
    }
    @media (max-width: 768px) {
      .app-content { padding: 16px; }
    }
  `]
})
export class AppShellComponent {
  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

  onCollapseToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  toggleSidebar(): void {
    if (this.isMobileLayout()) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
      this.toggleBodyScroll();
      return;
    }

    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
    this.toggleBodyScroll();
  }

  private toggleBodyScroll(): void {
    if (this.mobileSidebarOpen) {
      this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
    } else {
      this.renderer.removeStyle(this.document.body, 'overflow');
    }
  }

  private isMobileLayout(): boolean {
    return this.document.defaultView?.innerWidth ? this.document.defaultView.innerWidth <= 1024 : false;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isMobileLayout() && this.mobileSidebarOpen) {
      this.closeMobileSidebar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileSidebarOpen) {
      this.closeMobileSidebar();
    }
  }
}

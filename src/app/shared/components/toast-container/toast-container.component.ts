import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Toast, ToastService } from '../../services/toast.service';

interface ToastItem extends Toast {
  removing?: boolean;
}

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.pipe(takeUntil(this.destroy$)).subscribe((toast) => {
      const item: ToastItem = { ...toast };
      this.toasts.push(item);
      setTimeout(() => {
        const i = this.toasts.indexOf(item);
        if (i > -1) {
          this.toasts[i] = { ...this.toasts[i], removing: true };
          setTimeout(() => {
            const idx = this.toasts.indexOf(item);
            if (idx > -1) this.toasts.splice(idx, 1);
          }, 300);
        }
      }, toast.duration || 3500);
    });
  }

  dismiss(toast: ToastItem): void {
    const i = this.toasts.indexOf(toast);
    if (i > -1) {
      this.toasts[i] = { ...this.toasts[i], removing: true };
      setTimeout(() => {
        const idx = this.toasts.indexOf(toast);
        if (idx > -1) this.toasts.splice(idx, 1);
      }, 300);
    }
  }

  iconFor(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

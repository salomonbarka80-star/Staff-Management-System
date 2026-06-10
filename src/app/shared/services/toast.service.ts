import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = new Subject<Toast>();
  toasts$ = this.toasts.asObservable();

  success(message: string, duration = 3500): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 5000): void {
    this.show('error', message, duration);
  }

  info(message: string, duration = 3500): void {
    this.show('info', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.show('warning', message, duration);
  }

  private show(type: Toast['type'], message: string, duration: number): void {
    this.toasts.next({
      id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      message,
      duration,
    });
  }
}

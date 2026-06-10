import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { ToastService } from '../shared/services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private toast: ToastService, private zone: NgZone) {}

  handleError(error: unknown): void {
    console.error('Unhandled error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

    this.zone.run(() => {
      this.toast.error(message);
    });
  }
}

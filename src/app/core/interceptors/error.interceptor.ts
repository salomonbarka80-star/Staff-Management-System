import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toast: ToastService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'An unexpected error occurred. Please try again.';

        if (error.error instanceof ErrorEvent) {
          message = `Network error: ${error.error.message}`;
        } else {
          switch (error.status) {
            case 0:
              message = 'Unable to connect to the server. Please check your connection.';
              break;
            case 400:
              message = this.extractMessage(error) || 'Invalid request. Please check your input.';
              break;
            case 401:
              message = 'Your session has expired. Please log in again.';
              this.router.navigate(['/auth/login']);
              break;
            case 403:
              message = 'You do not have permission to perform this action.';
              break;
            case 404:
              message = 'The requested resource was not found.';
              break;
            case 409:
              message = this.extractMessage(error) || 'A conflict occurred. The data may have been updated.';
              break;
            case 422:
              message = this.extractMessage(error) || 'Please check your input and try again.';
              break;
            case 429:
              message = 'Too many requests. Please wait a moment and try again.';
              break;
            case 500:
              message = 'Server error. Please try again later.';
              break;
            case 502:
            case 503:
              message = 'Service temporarily unavailable. Please try again later.';
              break;
          }
        }

        this.toast.error(message);
        return throwError(() => error);
      })
    );
  }

  private extractMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string') return error.error;
    if (error.error?.message) return error.error.message;
    if (error.error?.detail) return error.error.detail;
    if (error.error?.error) return error.error.error;
    if (Array.isArray(error.error)) {
      return error.error.map((e: any) => e.message || JSON.stringify(e)).join('; ');
    }
    if (error.error && typeof error.error === 'object') {
      return Object.entries(error.error)
        .map(([field, value]) => {
          const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
          const details = Array.isArray(value) ? value.join(', ') : String(value);
          return `${label}: ${details}`;
        })
        .join('; ');
    }
    return null;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../shared/models/hrms.models';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

const ACCESS_KEY  = 'hrms_access';
const REFRESH_KEY = 'hrms_refresh';
const USER_KEY    = 'hrms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  private state = new BehaviorSubject<AuthState>({
    user:            null,
    accessToken:     null,
    refreshToken:    null,
    isAuthenticated: false,
  });

  auth$ = this.state.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  // ── Getters ──────────────────────────────────────────────────
  get currentUser(): User | null       { return this.state.value.user; }
  get isAuthenticated(): boolean       { return this.state.value.isAuthenticated; }
  get accessToken(): string | null     { return this.state.value.accessToken; }
  get refreshToken(): string | null    { return this.state.value.refreshToken; }

  // ── Login ────────────────────────────────────────────────────
  login(credentials: LoginCredentials): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.api}/auth/token/`, {
        email:    credentials.email,
        password: credentials.password,
      })
      .pipe(
        tap(res => this.saveSession(res, credentials.rememberMe)),
        catchError(err => throwError(() => err))
      );
  }

  // ── Logout ───────────────────────────────────────────────────
  logout(): void {
    const refresh = this.refreshToken;
    if (refresh) {
      // Best-effort blacklist — ignore errors
      this.http
        .post(`${this.api}/auth/logout/`, { refresh })
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  // ── Token Refresh ─────────────────────────────────────────────
  refreshAccessToken(): Observable<string> {
    const refresh = this.refreshToken;
    if (!refresh) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<{ access: string }>(`${this.api}/auth/token/refresh/`, { refresh })
      .pipe(
        tap(res => {
          const newState = { ...this.state.value, accessToken: res.access };
          this.state.next(newState);
          this.persistToken(ACCESS_KEY, res.access);
        }),
        map(res => res.access)
      );
  }

  // ── Current User from API ─────────────────────────────────────
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.api}/auth/me/`).pipe(
      tap(user => {
        this.state.next({ ...this.state.value, user });
        this.persistToken(USER_KEY, JSON.stringify(user));
      })
    );
  }

  // ── Password Reset ──────────────────────────────────────────
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/auth/forgot-password/`, { email }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/auth/reset-password/`, { token, new_password: newPassword }
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/auth/change-password/`,
      { old_password: oldPassword, new_password: newPassword }
    );
  }
  
  register(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}): Observable<TokenResponse> {
  return this.http
    .post<TokenResponse>(`${this.api}/auth/register/`, data)
    .pipe(tap(res => this.saveSession(res)));
}

updateProfile(data: any): Observable<User> {
  const headers: any = {};
  // Don't set Content-Type for FormData - browser sets it automatically with boundary
  if (!(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return this.http.patch<User>(`${this.api}/auth/me/update/`, data, { headers }).pipe(
    tap(user => {
      const updatedUser = { ...this.state.value.user, ...user };
      this.state.next({ ...this.state.value, user: updatedUser as User });
      this.persistToken(USER_KEY, JSON.stringify(updatedUser));
    })
  );
}

  // ── Role-based redirect ───────────────────────────────────────
  
  homeRouteFor(role: string): string {
  return '/app/dashboard';
}

  // ── Session helpers ───────────────────────────────────────────
  private saveSession(res: TokenResponse, remember = false): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(ACCESS_KEY,  res.access);
    storage.setItem(REFRESH_KEY, res.refresh);
    storage.setItem(USER_KEY,    JSON.stringify(res.user));

    this.state.next({
      user:            res.user,
      accessToken:     res.access,
      refreshToken:    res.refresh,
      isAuthenticated: true,
    });
  }

  private clearSession(): void {
    [localStorage, sessionStorage].forEach(s => {
      s.removeItem(ACCESS_KEY);
      s.removeItem(REFRESH_KEY);
      s.removeItem(USER_KEY);
    });
    this.state.next({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  }

  private restoreSession(): void {
    const access  = localStorage.getItem(ACCESS_KEY)  ?? sessionStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
    const userRaw = localStorage.getItem(USER_KEY)    ?? sessionStorage.getItem(USER_KEY);

    if (access && refresh && userRaw) {
      try {
        const user: User = JSON.parse(userRaw);
        this.state.next({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true });
      } catch {
        this.clearSession();
      }
    }
  }

  private persistToken(key: string, value: string): void {
    if (localStorage.getItem(ACCESS_KEY)) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  }
}

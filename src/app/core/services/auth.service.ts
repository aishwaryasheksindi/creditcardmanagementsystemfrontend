import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { AuthenticatedUser } from '../models/authenticated-user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'cardnest_auth_user';
  private readonly baseUrl = environment.apiBaseUrl;

  private currentUserSubject: BehaviorSubject<AuthenticatedUser | null>;
  public currentUser$: Observable<AuthenticatedUser | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthenticatedUser | null {
    return this.currentUserSubject.value;
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          const authUser: AuthenticatedUser = {
            username: response.username,
            roleName: response.roleName || (response as any).role || 'USER',
            token: response.token,
            expiresAt: response.expiresAt
          };
          this.setStoredUser(authUser);
          this.currentUserSubject.next(authUser);
        }
      })
    );
  }

  public logout(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Storage access safety
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public isAuthenticated(): boolean {
    const user = this.currentUserValue;
    if (!user || !user.token) {
      return false;
    }
    if (user.expiresAt) {
      const expirationDate = new Date(user.expiresAt).getTime();
      if (expirationDate <= Date.now()) {
        this.logout();
        return false;
      }
    }
    return true;
  }

  public getToken(): string | null {
    const user = this.currentUserValue;
    return user ? user.token : null;
  }

  public getRoleName(): string | null {
    const user = this.currentUserValue;
    return user ? user.roleName : null;
  }

  public hasRole(role: string): boolean {
    const currentRole = this.getRoleName();
    if (!currentRole) {
      return false;
    }
    return currentRole.toUpperCase() === role.toUpperCase();
  }

  public hasAnyRole(roles?: string[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }
    const currentRole = this.getRoleName();
    if (!currentRole) {
      return false;
    }
    const normalizedCurrent = currentRole.toUpperCase();
    return roles.some((r) => r.toUpperCase() === normalizedCurrent);
  }

  private getStoredUser(): AuthenticatedUser | null {
    try {
      const item = localStorage.getItem(this.storageKey);
      if (!item) {
        return null;
      }
      const user: AuthenticatedUser = JSON.parse(item);
      if (user.expiresAt && new Date(user.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  private setStoredUser(user: AuthenticatedUser): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch {
      // Storage access safety
    }
  }
}

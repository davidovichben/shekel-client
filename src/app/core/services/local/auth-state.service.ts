import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthToken } from '../../entities/auth.entity';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Signal for reactive state
  isUserLoggedIn = signal<boolean>(this.hasToken());

  // Observable for login events
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  loggedIn$: Observable<boolean> = this.loggedInSubject.asObservable();

  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Initialize tokens from localStorage
    this.token = localStorage.getItem(this.TOKEN_KEY);
    this.refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
    this.updateLoginState(true);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem(this.TOKEN_KEY);
  }

  setRefreshToken(refreshToken: string): void {
    this.refreshToken = refreshToken;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getRefreshToken(): string | null {
    return this.refreshToken || localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(authToken: AuthToken): void {
    if (authToken.token) {
      this.setToken(authToken.token);
    }
    if (authToken.refreshToken) {
      this.setRefreshToken(authToken.refreshToken);
    }
  }

  clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.updateLoginState(false);
  }

  hasToken(): boolean {
    return !!(this.token || localStorage.getItem(this.TOKEN_KEY));
  }

  private updateLoginState(isLoggedIn: boolean): void {
    this.isUserLoggedIn.set(isLoggedIn);
    this.loggedInSubject.next(isLoggedIn);
  }

  // Helper method to check login status
  checkLoginStatus(): boolean {
    const loggedIn = this.hasToken();
    this.updateLoginState(loggedIn);
    return loggedIn;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../entities/auth.entity';
import { AuthStateService } from '../local/auth-state.service';
import { UserService } from '../local/user.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService,
    private userService: UserService
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.authStateService.setTokens({
          token: response.access_token,
          refreshToken: response.refresh_token
        });
        this.userService.setUser(response.user);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearLocalAuth();
      }),
      catchError(() => {
        // Clear local auth even if server call fails
        this.clearLocalAuth();
        return of(undefined);
      })
    );
  }

  private clearLocalAuth(): void {
    this.authStateService.clearTokens();
    this.userService.clearUser();
  }

  isLoggedIn(): boolean {
    return this.authStateService.hasToken();
  }
}

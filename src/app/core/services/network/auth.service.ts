import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../entities/auth.entity';
import { AuthStateService } from '../local/auth-state.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        // Store the JWT token
        this.authStateService.setTokens({
          token: response.token,
          refreshToken: response.refreshToken
        });
      })
    );
  }

  logout(): void {
    this.authStateService.clearTokens();
  }

  isLoggedIn(): boolean {
    return this.authStateService.hasToken();
  }
}

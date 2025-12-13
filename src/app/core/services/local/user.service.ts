import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USER_KEY = 'user';

  user = signal<User | null>(this.getStoredUser());

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  getUser(): User | null {
    return this.user();
  }

  clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
    this.user.set(null);
  }
}

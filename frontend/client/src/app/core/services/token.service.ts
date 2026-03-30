// src/app/core/services/token.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// El access token vive SOLO en memoria (nunca en localStorage)
// El refresh token vive en httpOnly cookie — el backend lo maneja

@Injectable({ providedIn: 'root' })
export class TokenService {

  private accessToken: string | null = null;
  private tokenSubject = new BehaviorSubject<string | null>(null);

  token$ = this.tokenSubject.asObservable();

  set(token: string): void {
    this.accessToken = token;
    this.tokenSubject.next(token);
  }

  get(): string | null {
    return this.accessToken;
  }

  clear(): void {
    this.accessToken = null;
    this.tokenSubject.next(null);
  }

  isValid(): boolean {
    if (!this.accessToken) return false;
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getRole(): 'professional' | 'client' | null {
    if (!this.accessToken) return null;
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    if (!this.accessToken) return null;
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
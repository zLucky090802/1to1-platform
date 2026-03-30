// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

export interface CurrentUser {
  id:           string;
  email:        string;
  role:         'professional' | 'client';
  display_name: string;
}

export interface RegisterPayload {
  email:        string;
  password:     string;
  role:         'professional' | 'client';
  display_name: string;
  category?:    string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api:    ApiService,
    private token:  TokenService,
    private router: Router,
  ) {}

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.token.isValid();
  }

  get role(): 'professional' | 'client' | null {
    return this.token.getRole();
  }

  register(payload: RegisterPayload): Observable<any> {
    return this.api.post<any>('/auth/register', payload).pipe(
      tap(res => this.handleAuthResponse(res)),
      catchError(err => throwError(() => err))
    );
  }

  login(payload: LoginPayload): Observable<any> {
    return this.api.post<any>('/auth/login', payload).pipe(
      tap(res => this.handleAuthResponse(res)),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({
      complete: () => this.clearSession(),
      error:    () => this.clearSession(),
    });
  }

  // Llama al backend con la cookie de refresh para obtener nuevo access token
  refreshAccessToken(): Observable<any> {
    return this.api.post<any>('/auth/refresh', {}).pipe(
      tap(res => {
        if (res.accessToken) this.token.set(res.accessToken);
      })
    );
  }

  private handleAuthResponse(res: any): void {
    if (res.accessToken) this.token.set(res.accessToken);
    if (res.user)        this.currentUserSubject.next(res.user);
  }

  private clearSession(): void {
    this.token.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}
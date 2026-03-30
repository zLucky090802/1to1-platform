// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private token:  TokenService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.token.isValid()) return true;
    return this.router.createUrlTree(['/auth/welcome']);
  }
}
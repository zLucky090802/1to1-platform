// src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private token:  TokenService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const required: string[] = route.data['roles'] ?? [];
    const userRole = this.token.getRole();

    if (userRole && required.includes(userRole)) return true;

    // Si está logueado pero con rol incorrecto, manda al dashboard
    if (this.token.isValid()) return this.router.createUrlTree(['/dashboard']);

    return this.router.createUrlTree(['/auth/login']);
  }
}
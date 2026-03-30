// src/app/app.routes.ts
import { Routes }    from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.route').then(m => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.route').then(m => m.dashboardRoutes),
  },
  {
    path: 'workspace',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/workspace/workspace.route').then(m => m.workspaceRoutes),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

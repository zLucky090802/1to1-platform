// src/app/features/workspace/workspace.routes.ts
import { Routes } from '@angular/router';

export const workspaceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/client-workspace.component').then(m => m.ClientWorkspaceComponent),
  },
];

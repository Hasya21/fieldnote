import type { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | Fieldnote',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./core/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Overview | Fieldnote',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'products',
        title: 'Products | Fieldnote',
        loadComponent: () => import('./features/products/products').then((m) => m.Products),
      },
      {
        path: 'products/:id',
        title: 'Product detail | Fieldnote',
        loadComponent: () =>
          import('./features/products/product-detail').then((m) => m.ProductDetail),
      },
      {
        path: 'analytics',
        title: 'Sales explorer | Fieldnote',
        loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
      },
      {
        path: '**',
        title: 'Page not found | Fieldnote',
        loadComponent: () => import('./shared/components/not-found').then((m) => m.NotFound),
      },
    ],
  },
];

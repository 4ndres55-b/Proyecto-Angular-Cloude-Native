import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'menu'
  },
  {
    path: 'menu',
    loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./components/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'menu'
  }
];

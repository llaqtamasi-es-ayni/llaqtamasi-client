import { inject } from '@angular/core';
import { Router, type CanActivateChildFn, type Routes } from '@angular/router';

import { ApiService } from './core/services/api.service';

const requiereSesion: CanActivateChildFn = () =>
  inject(ApiService).tieneSesion() || inject(Router).createUrlTree(['/login']);

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [() => !inject(ApiService).tieneSesion() || inject(Router).createUrlTree(['/tabs/mapa'])],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivateChild: [requiereSesion],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];

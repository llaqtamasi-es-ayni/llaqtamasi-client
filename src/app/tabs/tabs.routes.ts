import type { Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'mapa',
        loadComponent: () => import('../features/mapa/mapa.page').then((m) => m.MapaPage),
      },
      {
        path: 'muro',
        loadComponent: () => import('../features/muro/muro.page').then((m) => m.MuroPage),
      },
      {
        path: 'muro/aviso/:publicacion/:interesado',
        loadComponent: () => import('../features/muro/aviso-muro.page').then(m => m.AvisoMuroPage),
      },
      {
        path: 'reportes',
        loadComponent: () => import('../features/reportes/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'emergencia',
        redirectTo: '/tabs/reportes',
        pathMatch: 'full',
      },
      {
        path: 'perfil',
        loadComponent: () => import('../features/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      { path: '', redirectTo: '/tabs/mapa', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/tabs/mapa', pathMatch: 'full' },
];

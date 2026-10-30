import { Routes } from '@angular/router';
import { InvoicesComponent } from './components/invoices-component/invoices-component';
import { ClothesComponent } from './components/clothes-component/clothes-component';
import { ClientsComponent } from './components/clients/clients-component/clients-component';
import { UsersComponent } from './components/users-component/users-component';
import { LoginComponent } from './components/login-component/login-component';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { HomeComponent } from './components/home-component/home-component';
import { platformAdminGuard } from './guards/platform-admin-guard';
import { centerGuard } from './guards/center-guard';
import { UserService } from './services/user-sevice';
import { inject } from '@angular/core';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => inject(UserService).homePath() },
      { path: 'home', component: HomeComponent, canActivate: [adminGuard] },
      {
        path: 'invoices',
        component: InvoicesComponent,
        canActivate: [centerGuard],
      },
      // loaded on demand, to keep the first download small
      {
        path: 'orders',
        loadComponent: () => import('./components/orders/orders-page').then((m) => m.OrdersPage),
        canActivate: [centerGuard],
      },
      { path: 'clothes', component: ClothesComponent, canActivate: [centerGuard] },
      { path: 'clients', component: ClientsComponent, canActivate: [centerGuard] },
      { path: 'users', component: UsersComponent, canActivate: [adminGuard] },
      // the platform admin's pages
      {
        path: 'pressings',
        loadComponent: () => import('./components/centers/centers-page').then((m) => m.CentersPage),
        canActivate: [platformAdminGuard],
      },
      {
        path: 'delivery',
        loadComponent: () => import('./components/delivery/delivery-page').then((m) => m.DeliveryPage),
        canActivate: [platformAdminGuard],
      },
      { path: 'create-user', redirectTo: 'users' },
    ],
  },
  { path: '**', redirectTo: () => inject(UserService).homePath() },
];

import { Routes } from '@angular/router';
import { InvoicesComponent } from './components/invoices-component/invoices-component';
import { ClothesComponent } from './components/clothes-component/clothes-component';
import { ClientsComponent } from './components/clients/clients-component/clients-component';
import { UsersComponent } from './components/users-component/users-component';
import { LoginComponent } from './components/login-component/login-component';
import { authGuard } from './guards/auth-guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { HomeComponent } from './components/home-component/home-component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: HomeComponent },
      {
        path: 'invoices',
        component: InvoicesComponent,
      },
      { path: 'clothes', component: ClothesComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'create-user', redirectTo: 'users' },
    ],
  },
  { path: '**', redirectTo: '/app/home' },
];

import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthenticationService } from '../../services/authentication-component';
import { UserService } from '../../services/user-sevice';

@Component({
  selector: 'app-navbar',
  imports: [MatIcon, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  readonly userService = inject(UserService);

  readonly isAdmin = this.userService.isAdmin();
  readonly username = this.userService.getUsername();

  readonly links = [
    { path: '/app/home', label: 'Dashboard', icon: 'dashboard' },
    { path: '/app/invoices', label: 'Invoices', icon: 'receipt_long' },
    { path: '/app/clients', label: 'Clients', icon: 'group' },
    { path: '/app/clothes', label: 'Prices', icon: 'checkroom' },
    ...(this.isAdmin ? [{ path: '/app/users', label: 'Users', icon: 'manage_accounts' }] : []),
  ];

  onLogout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }
}

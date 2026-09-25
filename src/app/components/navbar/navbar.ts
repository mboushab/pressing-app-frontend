import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthenticationService } from '../../services/authentication-component';
import { UserService } from '../../services/user-sevice';
import { TranslatePipe } from '../../shared/i18n/i18n.pipes';
import { TranslationKey } from '../../shared/i18n/i18n.service';
import { LangSwitch } from '../../shared/i18n/lang-switch';

@Component({
  selector: 'app-navbar',
  imports: [MatIcon, RouterLink, RouterLinkActive, TranslatePipe, LangSwitch],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  readonly userService = inject(UserService);

  readonly isAdmin = this.userService.isAdmin();
  readonly username = this.userService.getUsername();

  readonly links: { path: string; label: TranslationKey; icon: string }[] = [
    { path: '/app/home', label: 'nav.dashboard', icon: 'dashboard' },
    { path: '/app/invoices', label: 'nav.invoices', icon: 'receipt_long' },
    { path: '/app/clients', label: 'nav.clients', icon: 'group' },
    { path: '/app/clothes', label: 'nav.prices', icon: 'checkroom' },
    ...(this.isAdmin
      ? [{ path: '/app/users', label: 'nav.users' as TranslationKey, icon: 'manage_accounts' }]
      : []),
  ];

  onLogout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }
}

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
  readonly home = this.userService.homePath();

  readonly links: { path: string; label: TranslationKey; icon: string }[] = [
    // pages of the pressing the user belongs to
    ...(this.userService.hasCenter()
      ? [
          ...(this.isAdmin
            ? [{ path: '/app/home', label: 'nav.dashboard' as TranslationKey, icon: 'dashboard' }]
            : []),
          { path: '/app/invoices', label: 'nav.invoices' as TranslationKey, icon: 'receipt_long' },
          { path: '/app/orders', label: 'nav.orders' as TranslationKey, icon: 'smartphone' },
          { path: '/app/clients', label: 'nav.clients' as TranslationKey, icon: 'group' },
          { path: '/app/clothes', label: 'nav.prices' as TranslationKey, icon: 'checkroom' },
          { path: '/app/hours', label: 'nav.hours' as TranslationKey, icon: 'schedule' },
          ...(this.isAdmin
            ? [{ path: '/app/users', label: 'nav.users' as TranslationKey, icon: 'manage_accounts' }]
            : []),
        ]
      : []),
    // pages of the platform admin
    ...(this.userService.isPlatformAdmin()
      ? [
          { path: '/app/pressings', label: 'nav.centers' as TranslationKey, icon: 'store' },
          { path: '/app/delivery', label: 'nav.delivery' as TranslationKey, icon: 'local_shipping' },
        ]
      : []),
  ];

  onLogout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }
}

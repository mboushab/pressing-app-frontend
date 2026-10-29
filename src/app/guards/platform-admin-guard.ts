import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user-sevice';

/** Pages of the platform administrator (delivery set-up). The server checks the role too. */
export const platformAdminGuard: CanActivateFn = () =>
  inject(UserService).isPlatformAdmin() || inject(Router).createUrlTree(['/app/invoices']);

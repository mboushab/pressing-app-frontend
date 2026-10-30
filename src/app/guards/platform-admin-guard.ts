import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user-sevice';

/** Pages of the platform administrator (pressings, delivery set-up). The server checks the role too. */
export const platformAdminGuard: CanActivateFn = () => {
  const users = inject(UserService);
  return users.isPlatformAdmin() || inject(Router).parseUrl(users.homePath());
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user-sevice';

/** Pages of a pressing admin; others go to their own first page. The server checks the role too. */
export const adminGuard: CanActivateFn = () => {
  const users = inject(UserService);
  return users.isAdmin() || inject(Router).parseUrl(users.homePath());
};

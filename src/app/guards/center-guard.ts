import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user-sevice';

/** Pages of a pressing (invoices, clients, prices…): its members only. The server checks it too. */
export const centerGuard: CanActivateFn = () => {
  const users = inject(UserService);
  return users.hasCenter() || inject(Router).parseUrl(users.homePath());
};

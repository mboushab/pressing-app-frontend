import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user-sevice';

/** Admin-only pages; employees are sent to the invoices. The server checks the role too. */
export const adminGuard: CanActivateFn = () =>
  inject(UserService).isAdmin() || inject(Router).createUrlTree(['/app/invoices']);

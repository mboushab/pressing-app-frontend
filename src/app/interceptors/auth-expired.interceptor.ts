import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../token-injection/ap-base-url.token';

export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  const isAbsoluteUrl =
    req.url.startsWith('http://') || req.url.startsWith('https://');

  let requestToSend = req.clone({
    url: isAbsoluteUrl ? req.url : `${baseUrl}${req.url}`,
  });

  if (token) {
    requestToSend = requestToSend.clone({
      setHeaders: {
        Authorization: token,
      },
    });
  }

  return next(requestToSend).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        (err.status === 401 || err.status === 403)
      ) {
        localStorage.removeItem('authToken');
        void router.navigate(['/login']);
      }

      return throwError(() => err);
    }),
  );
};
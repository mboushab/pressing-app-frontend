import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authExpiredInterceptor } from './interceptors/auth-expired.interceptor';
import { API_BASE_URL } from './token-injection/ap-base-url.token';

export const appConfig: ApplicationConfig = {
  providers: [
    {provide: API_BASE_URL, useValue: "http://localhost:3000"},
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authExpiredInterceptor])),
  ],
};

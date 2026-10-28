import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { AuthenticationService } from '../../services/authentication-component';
import { UserService } from '../../services/user-sevice';
import { classNames } from '../../shared/styles/class-names';
import { TranslatePipe } from '../../shared/i18n/i18n.pipes';
import { TranslationKey } from '../../shared/i18n/i18n.service';
import { LangSwitch } from '../../shared/i18n/lang-switch';

@Component({
  selector: 'app-login-component',
  imports: [ReactiveFormsModule, MatIcon, TranslatePipe, LangSwitch],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly classNames = classNames;
  readonly error = signal<TranslationKey | null>(null);
  readonly loading = signal(false);

  readonly userForm = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/app/home']);
    }
  }

  onLogin(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const { username, password } = this.userForm.getRawValue();
    this.error.set(null);
    this.loading.set(true);
    this.authService.login(username, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        localStorage.setItem('authToken', 'Bearer ' + res.token);
        localStorage.setItem('currentUserRole', res.role);
        localStorage.setItem('currentUsername', username);
        this.userService.setCenters(res.centers ?? []);
        // the dashboard is for pressing admins; employees start on the invoices
        void this.router.navigate([this.userService.isAdmin() ? '/app/home' : '/app/invoices']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401
            ? 'login.error.credentials'
            : err.status === 0
              ? 'login.error.server'
              : 'login.error.generic',
        );
      },
    });
  }
}

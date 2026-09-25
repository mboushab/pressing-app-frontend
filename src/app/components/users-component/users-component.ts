import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { UserService, UserSummary } from '../../services/user-sevice';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { Drawer } from '../../shared/drawer/drawer';
import { CreateUserComponent } from '../create-user-component/create-user-component';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService } from '../../shared/i18n/i18n.service';

@Component({
  selector: 'app-users-component',
  imports: [...I18N_PIPES, MatIcon, Drawer, CreateUserComponent],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css',
})
export class UsersComponent {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly classNames = classNames;
  readonly users = signal<UserSummary[]>([]);
  readonly loaded = signal(false);
  readonly showForm = signal(false);
  readonly currentUsername = this.userService.getUsername();

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('users.error.load')),
    });
  }

  onUserCreated(username: string): void {
    this.showForm.set(false);
    this.toast.success(this.i18n.t('toast.user_created', { name: username }));
    this.loadUsers();
  }
}

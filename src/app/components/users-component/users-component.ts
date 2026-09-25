import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { UserService, UserSummary } from '../../services/user-sevice';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { Drawer } from '../../shared/drawer/drawer';
import { CreateUserComponent } from '../create-user-component/create-user-component';

@Component({
  selector: 'app-users-component',
  imports: [DatePipe, MatIcon, Drawer, CreateUserComponent],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css',
})
export class UsersComponent {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

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
      error: () => this.toast.error('Could not load users.'),
    });
  }

  onUserCreated(username: string): void {
    this.showForm.set(false);
    this.toast.success(`User ${username} created.`);
    this.loadUsers();
  }
}

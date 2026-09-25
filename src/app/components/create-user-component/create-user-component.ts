import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user-sevice';
import { classNames } from '../../shared/styles/class-names';

@Component({
  selector: 'app-create-user-component',
  imports: [ReactiveFormsModule],
  templateUrl: './create-user-component.html',
  styleUrl: './create-user-component.css',
})
export class CreateUserComponent {
  private readonly userService = inject(UserService);

  readonly created = output<string>();
  readonly cancelled = output<void>();

  readonly classNames = classNames;
  readonly error = signal('');
  readonly saving = signal(false);

  readonly userForm = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['USER', Validators.required],
  });

  createUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const user = this.userForm.getRawValue();
    this.error.set('');
    this.saving.set(true);
    this.userService.addNewUser(user).subscribe({
      next: () => {
        this.saving.set(false);
        this.userForm.reset();
        this.created.emit(user.username);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(
          err.status === 409
            ? 'This username is already taken.'
            : err.status === 403
              ? 'Only an admin can create users.'
              : 'Could not create the user.',
        );
      },
    });
  }
}

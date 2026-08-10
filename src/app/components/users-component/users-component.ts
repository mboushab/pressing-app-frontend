import { Component } from '@angular/core';
import { User } from '../../types/authenticate';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-sevice';
import { Router } from '@angular/router';
import { classNames } from '../../shared/styles/class-names';

@Component({
  selector: 'app-users-component',
  imports: [CommonModule],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css',
})
export class UsersComponent {
  constructor(
    private userService: UserService,
    private route: Router,
  ) {}

  classNames = classNames;

  addNewUser(): void {
    console.log('Add new user');
    this.route.navigate(['/app/create-user']);
  }
}

import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AuthenticationService } from '../../services/authentication-component';
import { RouterLink, RouterModule } from '@angular/router';
import { UserService } from '../../services/user-sevice';

@Component({
  selector: 'app-navbar',
  imports: [MatIcon, RouterLink, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(
    private authService: AuthenticationService,
    public userService: UserService,
  ) {}

  onLogout(): void {
    this.authService.logout().subscribe(
      () => {
        // Clear the authentication token from local storage
        localStorage.removeItem('authToken');
        // Redirect to the login page after logout
        window.location.href = '/app/login';
      },
      (error) => {
        console.error('Logout error:', error);
        alert('An error occurred during logout. Please try again later.');
      },
    );
  }
}

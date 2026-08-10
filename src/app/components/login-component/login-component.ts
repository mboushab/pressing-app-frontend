import { Component } from '@angular/core';
import { AuthenticationService } from '../../services/authentication-component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  userForm!: FormGroup;

  error: string = '';

  constructor(
    private authService: AuthenticationService,
    private formBuilder: FormBuilder,
    private route: Router,
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.route.navigate(['/app/home']);
    } else {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.userForm.reset();
    this.initializeForm();
  }

  //if already connect go to invoices page
  ngAfterViewInit(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.route.navigate(['/app/invoices']);
    }
  }
  private initializeForm(): void {
    this.userForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onLogin(): void {
    console.log(this.userForm.get('password'));
    this.authService.login(this.userForm.value.username, this.userForm.value.password).subscribe(
      (next) => {
        if (next.success) {
          localStorage.setItem('authToken', 'Bearer ' + next.token);
          localStorage.setItem('currentUserRole', next.role);
          // Redirect to the desired page after successful login
          this.route.navigate(['/app/home']);
        } else {
          this.error = 'Login failed. Please check your credentials.';
        }
      },
      (error) => {
        console.error('Login error:', error);
        this.error = error.message || 'An error occurred during login. Please try again later.';
      },
    );
  }
}

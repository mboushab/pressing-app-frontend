import { Component } from '@angular/core';
import { UserService } from '../../services/user-sevice';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-user-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user-component.html',
  styleUrl: './create-user-component.css',
})
export class CreateUserComponent {
  userForm!: FormGroup;
  error: string = '';

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    // initialize the form with form controls for user creation
    this.userForm = this.formBuilder.group({
      username: ['', Validators.required, Validators.minLength(3)],
      password: ['', Validators.required, Validators.minLength(3)],
      role: [['USER', 'ADMIN'], Validators.required],
    });
  }

  createUser(): void {
    console.log(this.userForm.value);
    this.userService.addNewUser(this.userForm.value).subscribe(
      (next) => {
        if (next.success) {
          alert('User created successfully!');
          this.userForm.reset();
        } else {
          this.error = 'Failed to create user. Please try again.';
        }
      },
      (error) => {
        console.error('Error creating user:', error);
        this.error = 'An error occurred while creating the user. Please try again later.';
      },
    );
  }
}

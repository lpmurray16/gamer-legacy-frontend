import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', [Validators.required]],
    name: ['', [Validators.required]]
  });

  async onSubmit() {
    if (this.form.invalid) return;

    const { email, password, passwordConfirm, name } = this.form.value;

    if (password !== passwordConfirm) {
      this.errorMessage = "Passwords do not match!";
      return;
    }

    try {
      this.errorMessage = '';
      await this.authService.register({
        email,
        password,
        passwordConfirm,
        name
      });
      // The service handles login redirect, but we can double check or show success
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to sign up';
    }
  }
}

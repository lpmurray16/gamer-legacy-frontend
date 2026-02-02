import { Injectable, signal, computed } from '@angular/core';
import PocketBase, { AuthModel } from 'pocketbase';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public pb: PocketBase;

  // Signal to track the current user
  private _currentUser = signal<AuthModel | null>(null);
  public currentUser = this._currentUser.asReadonly();
  public isAuthenticated = computed(() => !!this._currentUser());

  constructor(private router: Router) {
    this.pb = new PocketBase(environment.pocketbaseUrl);

    // Initialize user from local storage if available
    this._currentUser.set(this.pb.authStore.model);

    // Listen to auth state changes
    this.pb.authStore.onChange((token, model) => {
      this._currentUser.set(model);
    });
  }

  async register(data: {
    email: string;
    password: string;
    passwordConfirm: string;
    name?: string;
  }) {
    try {
      const record = await this.pb.collection('users').create(data);
      // Optional: automatically login after registration
      await this.login(data.email, data.password);
      return record;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, pass: string) {
    try {
      const authData = await this.pb.collection('users').authWithPassword(email, pass);
      this.router.navigate(['/home']);
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    this.pb.authStore.clear();
    this.router.navigate(['/sign-in']);
  }
}

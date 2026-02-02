import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SignIn } from './features/auth/sign-in/sign-in';
import { SignUp } from './features/auth/sign-up/sign-up';
import { Home } from './features/home/home';
import { Explore } from './features/explore/explore';
import { TopGames } from './features/top-games/top-games';

const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/sign-in');
};

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'sign-in', component: SignIn },
  { path: 'sign-up', component: SignUp },
  {
    path: 'home',
    component: Home,
    canActivate: [authGuard],
  },
  {
    path: 'explore',
    component: Explore,
    canActivate: [authGuard],
  },
  {
    path: 'top-games',
    component: TopGames,
    canActivate: [authGuard],
  },
];

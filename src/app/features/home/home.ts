import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UserGamesService } from '../../services/user-games';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  userGamesService = inject(UserGamesService);

  ngOnInit() {
    this.userGamesService.loadGames();
  }

  logout() {
    this.authService.logout();
  }

  goToExplore() {
    this.router.navigate(['/explore']);
  }

  goToTopGames() {
    this.router.navigate(['/top-games']);
  }
}

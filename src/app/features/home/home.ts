import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UserGamesService } from '../../services/user-games';
import { FilterOptions } from "../shared/filter-options/filter-options";
import { QuickSearch } from "../shared/quick-search/quick-search";

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FilterOptions, QuickSearch],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  userGamesService = inject(UserGamesService);

  ngOnInit() {
    this.userGamesService.loadGames();
  }

  goToExplore() {
    this.router.navigate(['/explore']);
  }

  goToTopGames() {
    this.router.navigate(['/top-games']);
  }
}

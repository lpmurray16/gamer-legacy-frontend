import { Component, inject, OnInit, signal } from '@angular/core';
import { Game, GameService } from '../../services/game';
import { GameCard } from './game-card/game-card';

type Tab = 'popular' | 'new' | 'classics';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [GameCard],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class Explore implements OnInit {
  private gameService = inject(GameService);

  activeTab = signal<Tab>('popular');
  games = signal<Game[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadGames('popular');
  }

  setTab(tab: Tab) {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.loadGames(tab);
  }

  loadGames(tab: Tab) {
    this.loading.set(true);
    this.error.set(null);
    this.games.set([]);

    let request;
    switch (tab) {
      case 'popular':
        request = this.gameService.getPopularGames();
        break;
      case 'new':
        request = this.gameService.getNewGames();
        break;
      case 'classics':
        request = this.gameService.getClassicGames();
        break;
    }

    request.subscribe({
      next: (response) => {
        this.games.set(response.results);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load games', err);
        this.error.set('Failed to load games. Please try again later.');
        this.loading.set(false);
      },
    });
  }
}

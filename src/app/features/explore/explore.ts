import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Game, GameService } from '../../services/game';
import { GameCard } from './game-card/game-card';
import { UserGamesService, GameStatus } from '../../services/user-games';
import { GameDetailModal } from '../shared/game-detail-modal/game-detail-modal';

type Tab = 'popular' | 'new' | 'classics' | 'search';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [GameCard, GameDetailModal, FormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class Explore implements OnInit {
  private gameService = inject(GameService);
  private userGamesService = inject(UserGamesService);

  activeTab = signal<Tab>('popular');
  searchQuery = signal('');
  games = signal<Game[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  userGameStatusMap = signal<Map<number, GameStatus>>(new Map());
  selectedGameId = signal<number | null>(null);

  ngOnInit() {
    this.loadUserGames();
    this.loadGames('popular');
  }

  openGame(game: Game) {
    this.selectedGameId.set(game.id);
  }

  closeModal() {
    this.selectedGameId.set(null);
  }

  loadUserGames() {
    this.userGamesService.getUserGames().subscribe({
      next: (userGames) => {
        const map = new Map<number, GameStatus>();
        userGames.forEach((g) => {
          map.set(g['game_id'], g['status']);
        });
        this.userGameStatusMap.set(map);
      },
      error: (err) => console.error('Failed to load user games', err),
    });
  }

  setTab(tab: Tab) {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    if (tab !== 'search') {
      this.searchQuery.set('');
      this.loadGames(tab);
    }
  }

  search() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.activeTab.set('search');
    this.loadGames('search');
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
      case 'search':
        request = this.gameService.searchGames(this.searchQuery());
        break;
    }

    if (!request) return;

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

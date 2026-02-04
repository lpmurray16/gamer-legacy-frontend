import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Game, GameService, GameFilters } from '../../services/game';
import { GameCard } from './game-card/game-card';
import { UserGamesService, GameStatus } from '../../services/user-games';
import { GameDetailModal } from '../shared/game-detail-modal/game-detail-modal';
import { ExploreFilters } from './explore-filters/explore-filters';

type Tab = 'popular' | 'new' | 'upcoming' | 'classics' | 'search';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [GameCard, GameDetailModal, FormsModule, ExploreFilters],
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
  currentPage = signal(1);
  hasMore = signal(true);
  currentFilters = signal<GameFilters>({});

  ngOnInit() {
    this.loadUserGames();
    this.loadGames('popular', 1);
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
      this.currentPage.set(1);
      this.hasMore.set(true);
      this.loadGames(tab, 1);
    }
  }

  search() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.activeTab.set('search');
    this.currentPage.set(1);
    this.hasMore.set(true);
    this.loadGames('search', 1);
  }

  onFiltersChanged(filters: GameFilters) {
    this.currentFilters.set(filters);
    this.currentPage.set(1);
    this.hasMore.set(true);
    this.loadGames(this.activeTab(), 1);
  }

  loadMore() {
    if (this.loading() || !this.hasMore()) return;

    const nextPage = this.currentPage() + 1;
    this.currentPage.set(nextPage);
    this.loadGames(this.activeTab(), nextPage);
  }

  loadGames(tab: Tab, page: number) {
    this.loading.set(true);
    this.error.set(null);
    if (page === 1) {
      this.games.set([]);
    }

    const filters = this.currentFilters();

    let request;
    switch (tab) {
      case 'popular':
        request = this.gameService.getPopularGames(page, filters);
        break;
      case 'new':
        request = this.gameService.getNewGames(page, filters);
        break;
      case 'upcoming':
        request = this.gameService.getUpcomingGames(page, filters);
        break;
      case 'classics':
        request = this.gameService.getClassicGames(page, filters);
        break;
      case 'search':
        request = this.gameService.searchGames(this.searchQuery(), page, filters);
        break;
    }

    if (!request) return;

    request.subscribe({
      next: (response) => {
        if (page === 1) {
          this.games.set(response.results);
        } else {
          this.games.update((current) => [...current, ...response.results]);
        }

        this.hasMore.set(!!response.next);
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

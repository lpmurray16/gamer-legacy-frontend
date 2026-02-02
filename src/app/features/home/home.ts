import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UserGamesService } from '../../services/user-games';
import { RecordModel } from 'pocketbase';
import { GameDetailModal } from '../shared/game-detail-modal/game-detail-modal';

@Component({
  selector: 'app-home',
  imports: [GameDetailModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  userGamesService = inject(UserGamesService);

  userGames = signal<RecordModel[]>([]);
  loading = signal(true);
  selectedGameId = signal<number | null>(null);

  playing = computed(() => this.userGames().filter((g) => g['status'] === 'Playing'));
  played = computed(() => this.userGames().filter((g) => g['status'] === 'Played'));
  watching = computed(() => this.userGames().filter((g) => g['status'] === 'Watching'));

  ngOnInit() {
    this.loadUserGames();
  }

  openGame(game: RecordModel) {
    this.selectedGameId.set(game['game_id']);
  }

  closeModal() {
    this.selectedGameId.set(null);
  }

  loadUserGames() {
    this.loading.set(true);
    this.userGamesService.getUserGames().subscribe({
      next: (games) => {
        this.userGames.set(games);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user games', err);
        this.loading.set(false);
      },
    });
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

  async removeGame(gameId: string) {
    if (!confirm('Are you sure you want to remove this mission?')) return;
    try {
      await this.userGamesService.removeGameFromCollection(gameId);
      this.loadUserGames(); // Reload list
    } catch (err) {
      console.error(err);
    }
  }
}

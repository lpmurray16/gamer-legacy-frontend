import { Component, computed, inject, input, signal } from '@angular/core';
import { UserGamesService } from '../../../services/user-games';
import { RecordModel } from 'pocketbase';
import { GameDetailModal } from '../../shared/game-detail-modal/game-detail-modal';
import { ActivatedRoute } from '@angular/router';
import { UpperCasePipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-game-list',
  imports: [GameDetailModal, UpperCasePipe, DatePipe],
  templateUrl: './game-list.html',
  styleUrl: './game-list.css',
})
export class GameList {
  userGamesService = inject(UserGamesService);
  route = inject(ActivatedRoute);

  filter = signal<string>('All');

  games = computed(() => {
    const allGames = this.userGamesService.games();
    const filterVal = this.filter();
    const query = this.userGamesService.searchQuery().toLowerCase();

    let filtered = allGames;

    if (filterVal !== 'All') {
      filtered = filtered.filter((g) => g['status'] === filterVal);
    }

    if (query) {
      filtered = filtered.filter((g) => g['game_name'].toLowerCase().includes(query));
    }

    return filtered;
  });

  selectedGameId = signal<number | null>(null);

  constructor() {
    this.route.data.subscribe((data) => {
      this.filter.set(data['filter'] || 'All');
    });
  }

  openGame(game: RecordModel) {
    this.selectedGameId.set(game['game_id']);
  }

  closeModal() {
    this.selectedGameId.set(null);
  }

  async removeGame(gameId: string) {
    if (!confirm('Are you sure you want to remove this mission?')) return;
    try {
      await this.userGamesService.removeGameFromCollection(gameId);
      this.userGamesService.loadGames();
    } catch (err) {
      console.error(err);
    }
  }
}

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserGamesService } from '../../services/user-games';
import { RecordModel } from 'pocketbase';

interface RankSlot {
  rank: number;
  game: RecordModel | null;
}

@Component({
  selector: 'app-top-games',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-games.html',
  styleUrl: './top-games.css',
})
export class TopGames implements OnInit {
  private userGamesService = inject(UserGamesService);

  userGames = signal<RecordModel[]>([]);
  processing = signal(false);

  slots = computed(() => {
    const games = this.userGames();
    const slots: RankSlot[] = [];

    // Initialize empty slots
    for (let i = 1; i <= 30; i++) {
      slots.push({ rank: i, game: null });
    }

    // Map games to slots
    games.forEach((game) => {
      const rank = game['rank'];
      if (rank && rank >= 1 && rank <= 30) {
        slots[rank - 1].game = game;
      }
    });

    return slots;
  });

  showSelector = signal(false);
  selectedRank = signal<number | null>(null);

  unrankedGames = computed(() => {
    // Filter out games that already have a rank > 0
    return this.userGames().filter((g) => !g['rank'] || g['rank'] === 0);
  });

  ngOnInit() {
    this.loadUserGames();
  }

  loadUserGames() {
    this.userGamesService.getUserGames().subscribe({
      next: (games) => {
        this.userGames.set(games);
      },
      error: (err) => console.error('Failed to load games', err),
    });
  }

  openSelector(rank: number) {
    this.selectedRank.set(rank);
    this.showSelector.set(true);
  }

  closeSelector() {
    this.showSelector.set(false);
    this.selectedRank.set(null);
  }

  async selectGame(game: RecordModel) {
    const rank = this.selectedRank();
    if (!rank || this.processing()) return;

    this.processing.set(true);
    try {
      await this.userGamesService.updateGameRank(game.id, rank);
      this.loadUserGames(); // Reload to refresh state
      this.closeSelector();
    } catch (err) {
      console.error('Failed to rank game', err);
    } finally {
      this.processing.set(false);
    }
  }

  async removeRank(game: RecordModel) {
    if (this.processing()) return;

    this.processing.set(true);
    try {
      await this.userGamesService.updateGameRank(game.id, 0); // Set rank to 0 to unrank
      this.loadUserGames();
    } catch (err) {
      console.error('Failed to remove rank', err);
    } finally {
      this.processing.set(false);
    }
  }
}

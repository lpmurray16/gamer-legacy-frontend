import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserGamesService } from '../../services/user-games';
import { RecordModel } from 'pocketbase';

interface RankSlot {
  rank: number;
  game: RecordModel | null;
}

@Component({
  selector: 'app-shared-top-games',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shared-top-games.html',
  styleUrl: './shared-top-games.css',
})
export class SharedTopGames implements OnInit {
  private route = inject(ActivatedRoute);
  private userGamesService = inject(UserGamesService);

  games = signal<RecordModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  ownerName = signal<string>('Player');

  slots = computed(() => {
    const games = this.games();
    const slots: RankSlot[] = [];

    for (let i = 1; i <= 30; i++) {
      slots.push({ rank: i, game: null });
    }

    games.forEach((game) => {
      const rank = game['rank'];
      if (rank && rank >= 1 && rank <= 30) {
        slots[rank - 1].game = game;
      }
    });

    return slots;
  });

  ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.loadSharedGames(code);
    } else {
      this.error.set('Invalid share code');
      this.loading.set(false);
    }
  }

  async loadSharedGames(code: string) {
    try {
      this.loading.set(true);
      const { user, games } = await this.userGamesService.getGamesByShareCode(code);
      this.ownerName.set(user['name'] || 'Player');
      this.games.set(games);
    } catch (err) {
      console.error(err);
      this.error.set('Failed to load rankings. The code might be invalid.');
    } finally {
      this.loading.set(false);
    }
  }
}

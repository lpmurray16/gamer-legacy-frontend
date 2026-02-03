import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { GameService, GameDetails } from '../../../services/game';
import { UserGamesService, GameStatus } from '../../../services/user-games';

@Component({
  selector: 'app-game-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './game-detail-modal.html',
  styleUrl: './game-detail-modal.css',
})
export class GameDetailModal implements OnChanges {
  @Input({ required: true }) gameId!: number;
  @Output() close = new EventEmitter<void>();

  private gameService = inject(GameService);
  private userGamesService = inject(UserGamesService);

  game = signal<GameDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  userGameStatus = signal<GameStatus | null>(null);

  showingFullDesc: boolean = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameId'] && this.gameId) {
      this.loadGameDetails();
      this.loadUserGameStatus();
    }
  }

  loadGameDetails() {
    this.loading.set(true);
    this.error.set(null);
    this.gameService.getGameDetails(this.gameId).subscribe({
      next: (data: GameDetails) => {
        this.game.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load game details', err);
        this.error.set('Failed to load game data.');
        this.loading.set(false);
      },
    });
  }

  async loadUserGameStatus() {
    const status = await this.userGamesService.getGameStatus(this.gameId);
    this.userGameStatus.set(status);
  }

  async updateStatus(status: GameStatus) {
    const currentGame = this.game();
    if (!currentGame) return;

    try {
      // If clicking the same status, we could toggle it off (remove),
      // but for now let's just allow switching/setting.
      // If we wanted to remove, we'd need the record ID, which we don't have readily here without another query
      // or storing it. Let's stick to upsert (add/update).

      await this.userGamesService.addGameToCollection(currentGame, status);
      this.userGameStatus.set(status);
    } catch (err) {
      console.error('Failed to update game status', err);
      // Optional: show error toast
    }
  }

  onClose() {
    this.close.emit();
  }

  // Prevent clicks inside the modal content from closing the modal (if we click backdrop)
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  getYouTubeUrl(name: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`;
  }
}

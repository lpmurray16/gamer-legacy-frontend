import { Component, Input, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Game } from '../../../services/game';
import { UserGamesService, GameStatus } from '../../../services/user-games';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
})
export class GameCard {
  @Input({ required: true }) game!: Game;
  @Input() userStatus: GameStatus | null = null;

  private userGamesService = inject(UserGamesService);

  isMenuOpen = signal(false);
  isAdding = signal(false);

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.update((v) => !v);
  }

  async addToCollection(status: GameStatus, event: Event) {
    event.stopPropagation();
    this.isAdding.set(true);
    try {
      await this.userGamesService.addGameToCollection(this.game, status);
      this.isMenuOpen.set(false);
      // Update local status to reflect change immediately (optimistic UI)
      this.userStatus = status;
    } catch (err) {
      console.error('Failed to add game', err);
    } finally {
      this.isAdding.set(false);
    }
  }
}

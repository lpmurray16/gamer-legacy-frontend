import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, from } from 'rxjs';
import { RecordModel } from 'pocketbase';
import { Game } from './game';

export type GameStatus = 'Played' | 'Playing' | 'Watching';

export interface UserGame {
  user: string;
  game_id: number;
  game_name: string;
  game_image: string;
  status: GameStatus;
  rank?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserGamesService {
  private authService = inject(AuthService);

  private get pb() {
    return this.authService.pb;
  }

  getUserGames(): Observable<RecordModel[]> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    return from(
      this.pb.collection('user_games').getFullList({
        filter: `user = "${userId}"`,
        sort: '-created',
      }),
    );
  }

  async addGameToCollection(game: Game, status: GameStatus): Promise<RecordModel> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    // Check if game already exists in collection
    const existing = await this.pb.collection('user_games').getList(1, 1, {
      filter: `user = "${userId}" && game_id = ${game.id}`,
    });

    if (existing.totalItems > 0) {
      // Update existing record
      return this.pb.collection('user_games').update(existing.items[0].id, {
        status: status,
      });
    }

    // Create new record
    const data: UserGame = {
      user: userId,
      game_id: game.id,
      game_name: game.name,
      game_image: game.background_image,
      status: status,
    };

    return this.pb.collection('user_games').create(data);
  }

  async removeGameFromCollection(recordId: string): Promise<boolean> {
    return this.pb.collection('user_games').delete(recordId);
  }

  async getGameStatus(gameId: number): Promise<GameStatus | null> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return null;

    try {
      const result = await this.pb.collection('user_games').getList(1, 1, {
        filter: `user = "${userId}" && game_id = ${gameId}`,
      });
      return result.items.length > 0 ? (result.items[0]['status'] as GameStatus) : null;
    } catch (e) {
      console.error('Error fetching game status:', e);
      return null;
    }
  }

  async updateGameRank(recordId: string, rank: number): Promise<RecordModel> {
    return this.pb.collection('user_games').update(recordId, { rank: rank });
  }
}

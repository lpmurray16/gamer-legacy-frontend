import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, from, tap, firstValueFrom } from 'rxjs';
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
  released?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserGamesService {
  private authService = inject(AuthService);

  // State signals
  games = signal<RecordModel[]>([]);
  loading = signal<boolean>(false);
  searchQuery = signal<string>('');
  private _currentSort: string | null = null;

  private get pb() {
    return this.authService.pb;
  }

  loadGames(sort: string = 'game_name') {
    this.loading.set(true);
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.pb
      .collection('user_games')
      .getFullList({
        filter: `user = "${userId}"`,
        sort: sort,
      })
      .then((games) => {
        this.games.set(games);
        this.loading.set(false);
      })
      .catch((err) => {
        if (err.isAbort) return;
        console.error('Failed to load user games', err);
        this.loading.set(false);
      });
  }

  getUserGames(): Observable<RecordModel[]> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    return from(
      this.pb.collection('user_games').getFullList({
        filter: `user = "${userId}"`,
        sort: 'game_name',
      }),
    ).pipe(tap((games) => this.games.set(games)));
  }

  // --- Public Sharing ---

  async generateShareCode(): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('No user');

    // If user already has a code, return it
    if (user['share_code']) return user['share_code'];

    // Generate a random 6-char code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Save to user profile
    // Note: This requires the 'share_code' field to exist in Users collection
    const updatedUser = await this.pb.collection('users').update(user.id, {
      share_code: code,
    });

    // Update local auth store
    this.pb.authStore.save(this.pb.authStore.token, updatedUser);

    return code;
  }

  async getGamesByShareCode(code: string): Promise<{ user: RecordModel; games: RecordModel[] }> {
    // 1. Find user by share_code
    // Note: Assuming 'share_code' is unique
    const user = await this.pb.collection('users').getFirstListItem(`share_code="${code}"`);

    if (!user) throw new Error('User not found');

    // 2. Fetch their games (ranking only)
    const games = await this.pb.collection('user_games').getFullList({
      filter: `user = "${user.id}" && rank > 0`,
      sort: 'rank',
    });

    return { user, games };
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
      released: game.released,
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

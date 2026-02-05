import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { UserGamesService } from './user-games';
import { RecordModel } from 'pocketbase';
import { GameService } from './game';
import { firstValueFrom } from 'rxjs';

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  dismissed: boolean;
  date_sent: string;
  user: string;
  game_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private authService = inject(AuthService);
  private userGamesService = inject(UserGamesService);
  private gameService = inject(GameService);

  notifications = signal<RecordModel[]>([]);

  private get pb() {
    return this.authService.pb;
  }

  async loadNotifications() {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    try {
      const records = await this.pb.collection('user_notifications').getFullList({
        filter: `user = "${userId}" && dismissed = false`,
        sort: '-date_sent',
      });
      this.notifications.set(records);
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  }

  async createNotification(title: string, message: string, gameId?: number) {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    const data = {
      user: userId,
      title,
      message,
      dismissed: false,
      date_sent: new Date().toISOString(),
      game_id: gameId,
    };

    try {
      await this.pb.collection('user_notifications').create(data);
      this.loadNotifications(); // Reload
    } catch (err) {
      console.error('Error creating notification', err);
    }
  }

  async dismissNotification(id: string) {
    try {
      await this.pb.collection('user_notifications').update(id, { dismissed: true });
      this.loadNotifications();
    } catch (err) {
      console.error('Error dismissing notification', err);
    }
  }

  async checkWatchingGames() {
    // Ensure games are loaded. If not, we might need to wait or rely on caller.
    // We'll assume the caller calls loadGames() before this or in parallel.
    // Or we can check the signal.
    const games = this.userGamesService.games();
    // If empty, it might mean they haven't loaded yet OR user has no games.
    // But since this logic runs "When a user logs in and their collection is loaded",
    // we should be fine if we hook it up correctly.

    const watchingGames = games.filter((g) => g['status'] === 'Watching');
    const userId = this.authService.currentUser()?.id;

    if (!userId) return;

    for (const game of watchingGames) {
      let releaseDateStr = game['released'];

      if (!releaseDateStr) {
        // Attempt to fetch from API and update DB
        try {
          const details = await firstValueFrom(this.gameService.getGameDetails(game['game_id']));
          if (details.released) {
            releaseDateStr = details.released;
            // Update user_game record to self-heal data
            await this.pb.collection('user_games').update(game.id, {
              released: new Date(releaseDateStr).toISOString(),
            });
          }
        } catch (e) {
          console.error('Failed to fetch/update release date for game', game['game_name'], e);
        }
      }

      if (!releaseDateStr) continue;

      const releaseDate = new Date(releaseDateStr);
      const today = new Date();

      // Convert both to UTC dates (ignoring time)
      const releaseUTC = Date.UTC(
        releaseDate.getUTCFullYear(),
        releaseDate.getUTCMonth(),
        releaseDate.getUTCDate(),
      );
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

      if (releaseUTC <= todayUTC) {
        // Check if we already notified about this game
        // We filter by game_id to avoid duplicate notifications for the same game release
        try {
          // Note: This relies on 'game_id' field existing in user_notifications
          const existing = await this.pb.collection('user_notifications').getList(1, 1, {
            filter: `user = "${userId}" && game_id = ${game['game_id']}`,
          });

          if (existing.totalItems === 0) {
            await this.createNotification(
              'Game Released!',
              `${game['game_name']} has been released!`,
              game['game_id'],
            );
          }
        } catch (err) {
          console.error('Error checking existing notifications for game ' + game['game_name'], err);
          // Fallback: if game_id column doesn't exist, we might spam.
          // So let's just log and skip creating to be safe, or maybe check title?
          // For now, assuming the user adds the column as per plan.
        }
      }
    }
  }
}

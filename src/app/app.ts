import { Component, signal, OnInit, inject, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { UserGamesService } from './services/user-games';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('gamer-legacy-frontend');
  protected isMenuOpen = signal(false);
  protected isNotificationsOpen = signal(false);
  
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  userGamesService = inject(UserGamesService);

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.notificationService.loadNotifications();
        // Ensure games are loaded so we can check for releases
        if (this.userGamesService.games().length === 0) {
             this.userGamesService.loadGames();
        }
      }
    });

    effect(() => {
      // When games are loaded (or updated), check for watching games
      if (this.userGamesService.games().length > 0) {
        this.notificationService.checkWatchingGames();
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen.update((value) => !value);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  toggleNotifications() {
    this.isNotificationsOpen.update((v) => !v);
  }

  closeNotifications() {
    this.isNotificationsOpen.set(false);
  }

  dismiss(id: string, event: Event) {
    event.stopPropagation();
    this.notificationService.dismissNotification(id);
  }

  ngOnInit() {
    console.log('Environment Production:', environment.production);
  }
  logout() {
    this.authService.logout();
    this.closeMenu();
    this.closeNotifications();
  }
}

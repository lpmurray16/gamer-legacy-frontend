import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UserGamesService } from '../../../services/user-games';

@Component({
  selector: 'app-filter-options',
  imports: [],
  templateUrl: './filter-options.html',
  styleUrl: './filter-options.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterOptions {
  userGamesService = inject(UserGamesService);
  isMenuOpen = signal(false);

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  sortGames(sort: string) {
    this.userGamesService.loadGames(sort);
    this.closeMenu();
  }
}

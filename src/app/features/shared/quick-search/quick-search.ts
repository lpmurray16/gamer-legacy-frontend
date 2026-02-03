import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UserGamesService } from '../../../services/user-games';

@Component({
  selector: 'app-quick-search',
  imports: [],
  templateUrl: './quick-search.html',
  styleUrl: './quick-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickSearch {
  userGamesService = inject(UserGamesService);
  isOpen = signal(false);

  toggleSearch() {
    this.isOpen.update((v) => !v);
    if (!this.isOpen()) {
      this.userGamesService.searchQuery.set('');
    }
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.userGamesService.searchQuery.set(input.value);
  }
}

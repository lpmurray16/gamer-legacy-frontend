import { Component, inject, output, signal, OnInit } from '@angular/core';
import { GameService, Genre, Platform, GameFilters } from '../../../services/game';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-explore-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './explore-filters.html',
  styleUrl: './explore-filters.scss',
})
export class ExploreFilters implements OnInit {
  private gameService = inject(GameService);

  filtersChanged = output<GameFilters>();

  isMenuOpen = signal(false);
  
  genres = signal<Genre[]>([]);
  platforms = signal<Platform[]>([]);

  selectedGenres = signal<number[]>([]);
  selectedPlatforms = signal<number[]>([]);
  selectedOrdering = signal<string>('');

  orderingOptions = [
    { value: '', label: 'Default' },
    { value: '-added', label: 'Popularity' },
    { value: '-released', label: 'Release Date' },
    { value: '-metacritic', label: 'Metacritic' },
    { value: '-rating', label: 'Rating' },
    { value: 'name', label: 'Name' },
  ];

  ngOnInit() {
    this.gameService.getGenres().subscribe(res => {
      this.genres.set(res.results);
    });
    this.gameService.getPlatforms().subscribe(res => {
      // Top platforms usually: PC, PS5, Xbox Series X, Switch, PS4, Xbox One.
      // But let's show top 20 or so.
      this.platforms.set(res.results.slice(0, 20));
    });
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  toggleGenre(id: number) {
    this.selectedGenres.update(current => {
      if (current.includes(id)) {
        return current.filter(g => g !== id);
      } else {
        return [...current, id];
      }
    });
    this.applyFilters();
  }

  togglePlatform(id: number) {
    this.selectedPlatforms.update(current => {
      if (current.includes(id)) {
        return current.filter(p => p !== id);
      } else {
        return [...current, id];
      }
    });
    this.applyFilters();
  }

  setOrdering(value: string) {
    this.selectedOrdering.set(value);
    this.applyFilters();
  }

  applyFilters() {
    this.filtersChanged.emit({
      genres: this.selectedGenres(),
      platforms: this.selectedPlatforms(),
      ordering: this.selectedOrdering() || undefined,
    });
  }
  
  clearFilters() {
    this.selectedGenres.set([]);
    this.selectedPlatforms.set([]);
    this.selectedOrdering.set('');
    this.applyFilters();
  }
}

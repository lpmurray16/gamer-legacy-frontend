import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  rating: number;
  metacritic: number;
  platforms: { platform: { id: number; name: string; slug: string } }[];
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface GameDetails extends Game {
  description_raw: string;
  website: string;
  reddit_url: string;
  genres: { name: string }[];
  publishers: { name: string }[];
  developers: { name: string }[];
  playtime: number;
  achievements_count: number;
  esrb_rating: { name: string };
}

export interface ListResponse<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}

export type GameResponse = ListResponse<Game>;

export interface GameFilters {
  genres?: number[];
  platforms?: number[];
  ordering?: string;
  dates?: string;
  search?: string;
  metacritic?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.rawg.io/api';
  private apiKey = environment.rawgApiKey;

  private getBaseParams(): HttpParams {
    return new HttpParams().set('key', this.apiKey);
  }

  getGenres(): Observable<ListResponse<Genre>> {
    const params = this.getBaseParams();
    return this.http.get<ListResponse<Genre>>(`${this.apiUrl}/genres`, { params });
  }

  getPlatforms(): Observable<ListResponse<Platform>> {
    const params = this.getBaseParams();
    return this.http.get<ListResponse<Platform>>(`${this.apiUrl}/platforms`, { params });
  }

  getGames(filters: GameFilters = {}, page: number = 1): Observable<GameResponse> {
    let params = this.getBaseParams().set('page_size', '12').set('page', page.toString());

    if (filters.genres?.length) {
      params = params.set('genres', filters.genres.join(','));
    }
    if (filters.platforms?.length) {
      params = params.set('platforms', filters.platforms.join(','));
    }
    if (filters.ordering) {
      params = params.set('ordering', filters.ordering);
    }
    if (filters.dates) {
      params = params.set('dates', filters.dates);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.metacritic) {
      params = params.set('metacritic', filters.metacritic);
    }

    return this.http.get<GameResponse>(`${this.apiUrl}/games`, { params });
  }

  getPopularGames(page: number = 1, filters?: GameFilters): Observable<GameResponse> {
    return this.getGames(
      {
        ...filters,
        ordering: filters?.ordering || '-added',
      },
      page,
    );
  }

  getNewGames(page: number = 1, filters?: GameFilters): Observable<GameResponse> {
    const currentDate = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(currentDate.getFullYear() - 1);

    const dateString = `${lastYear.toISOString().split('T')[0]},${currentDate.toISOString().split('T')[0]}`;

    return this.getGames(
      {
        ...filters,
        dates: filters?.dates || dateString,
        ordering: filters?.ordering || '-released',
      },
      page,
    );
  }

  getUpcomingGames(page: number = 1, filters?: GameFilters): Observable<GameResponse> {
    const currentDate = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(currentDate.getFullYear() + 1);

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateString = `${tomorrow.toISOString().split('T')[0]},${nextYear.toISOString().split('T')[0]}`;

    return this.getGames(
      {
        ...filters,
        dates: filters?.dates || dateString,
        ordering: filters?.ordering || '-added',
      },
      page,
    );
  }

  getClassicGames(page: number = 1, filters?: GameFilters): Observable<GameResponse> {
    return this.getGames(
      {
        ...filters,
        dates: filters?.dates || '1980-01-01,2000-12-31',
        ordering: filters?.ordering || '-metacritic',
      },
      page,
    );
  }

  searchGames(query: string, page: number = 1, filters?: GameFilters): Observable<GameResponse> {
    return this.getGames(
      {
        ...filters,
        search: query,
      },
      page,
    );
  }

  getGameDetails(id: number): Observable<GameDetails> {
    const params = this.getBaseParams();
    return this.http.get<GameDetails>(`${this.apiUrl}/games/${id}`, { params });
  }
}

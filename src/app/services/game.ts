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
  platforms: { platform: { name: string } }[];
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

export interface GameResponse {
  count: number;
  next: string;
  previous: string;
  results: Game[];
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.rawg.io/api/games';
  private apiKey = environment.rawgApiKey;

  private getBaseParams(): HttpParams {
    return new HttpParams().set('key', this.apiKey);
  }

  getPopularGames(): Observable<GameResponse> {
    const params = this.getBaseParams()
      .set('ordering', '-added') // Popularity by most added to libraries
      .set('page_size', '12');

    return this.http.get<GameResponse>(this.apiUrl, { params });
  }

  getNewGames(): Observable<GameResponse> {
    const currentDate = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(currentDate.getFullYear() - 1);

    const dateString = `${lastYear.toISOString().split('T')[0]},${currentDate.toISOString().split('T')[0]}`;

    const params = this.getBaseParams()
      .set('dates', dateString)
      .set('ordering', '-released')
      .set('page_size', '12');

    return this.http.get<GameResponse>(this.apiUrl, { params });
  }

  getClassicGames(): Observable<GameResponse> {
    const params = this.getBaseParams()
      .set('dates', '1980-01-01,2000-12-31')
      .set('ordering', '-metacritic') // Highest rated classics
      .set('page_size', '12');

    return this.http.get<GameResponse>(this.apiUrl, { params });
  }

  searchGames(query: string): Observable<GameResponse> {
    const params = this.getBaseParams().set('search', query).set('page_size', '12');

    return this.http.get<GameResponse>(this.apiUrl, { params });
  }

  getGameDetails(id: number): Observable<GameDetails> {
    const params = this.getBaseParams();
    return this.http.get<GameDetails>(`${this.apiUrl}/${id}`, { params });
  }
}
